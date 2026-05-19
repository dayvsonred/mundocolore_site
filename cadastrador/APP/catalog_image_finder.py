from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any


PRODUCT_ID_RE = re.compile(r"^\d{4,8}$")
COLOR_CODE_RE = re.compile(r"^[A-Z]{0,4}[A-Z0-9]{6,12}$")


class CatalogImageError(RuntimeError):
    pass


@dataclass(frozen=True)
class CatalogImageResult:
    input_json_path: Path
    output_json_path: Path
    colors_json_path: Path
    image_dir: Path
    products_count: int
    images_count: int
    products_without_images: int
    colors_found_count: int
    new_colors_count: int


def find_latest_price_json(output_dir: str | Path, collection_name: str) -> Path | None:
    files = sorted(
        Path(output_dir).glob(f"{collection_name}_tabela_precos_*.json"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    return files[0] if files else None


def process_catalog_images(
    catalog_pdf_path: str | Path,
    price_json_path: str | Path,
    output_dir: str | Path,
    colors_dir: str | Path,
    collection_name: str,
    start_page: int | None = None,
    end_page: int | None = None,
) -> CatalogImageResult:
    catalog_path = Path(catalog_pdf_path)
    price_path = Path(price_json_path)
    out_dir = Path(output_dir)
    image_dir = out_dir / "IMAGEMS"
    color_dir = Path(colors_dir)

    if not catalog_path.exists():
        raise CatalogImageError(f"PDF do catalogo nao encontrado: {catalog_path}")
    if not price_path.exists():
        raise CatalogImageError(f"JSON da tabela de valores nao encontrado: {price_path}")

    products = _read_json_list(price_path)
    if not products:
        raise CatalogImageError("O JSON da tabela de valores esta vazio.")

    out_dir.mkdir(parents=True, exist_ok=True)
    image_dir.mkdir(parents=True, exist_ok=True)
    color_dir.mkdir(parents=True, exist_ok=True)

    finder = CatalogProductImageFinder(catalog_path, start_page=start_page, end_page=end_page)
    matches_by_product, found_color_codes = finder.scan({str(item["produto_id"]) for item in products})

    colors_json_path, new_colors_count = update_color_registry(
        colors_dir=color_dir,
        color_codes=found_color_codes,
        catalog_pdf_name=catalog_path.name,
        collection_name=collection_name,
    )

    enriched_products: list[dict[str, Any]] = []
    images_count = 0
    products_without_images = 0

    for product in products:
        enriched = dict(product)
        product_id = str(enriched.get("produto_id", ""))
        matches = matches_by_product.get(product_id, [])
        image_names: list[str] = []
        color_codes: list[str] = []

        for index, match in enumerate(matches, start=1):
            filename = _build_image_filename(enriched, index if len(matches) > 1 else None)
            finder.save_match_image(match, image_dir / filename)
            image_names.append(filename)
            images_count += 1
            color_codes.extend(match["cores"])

        if not image_names:
            products_without_images += 1

        enriched["imagem"] = image_names
        enriched["cores"] = sorted(set(color_codes))
        enriched_products.append(enriched)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_collection = re.sub(r"[^A-Za-z0-9_-]+", "_", collection_name).strip("_")
    output_json_path = out_dir / f"{safe_collection}_produtos_com_imagens_{timestamp}.json"
    output_json_path.write_text(
        json.dumps(enriched_products, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return CatalogImageResult(
        input_json_path=price_path,
        output_json_path=output_json_path,
        colors_json_path=colors_json_path,
        image_dir=image_dir,
        products_count=len(enriched_products),
        images_count=images_count,
        products_without_images=products_without_images,
        colors_found_count=len(found_color_codes),
        new_colors_count=new_colors_count,
    )


class CatalogProductImageFinder:
    def __init__(self, pdf_path: str | Path, start_page: int | None = None, end_page: int | None = None) -> None:
        self.pdf_path = Path(pdf_path)
        self.start_page = start_page
        self.end_page = end_page
        self._image_cache: dict[tuple[int, tuple[int, int, int, int]], Any] = {}

    def scan(self, product_ids: set[str]) -> tuple[dict[str, list[dict[str, Any]]], set[str]]:
        import pdfplumber

        matches_by_product: dict[str, list[dict[str, Any]]] = {product_id: [] for product_id in product_ids}
        found_colors: set[str] = set()

        with pdfplumber.open(str(self.pdf_path)) as pdf:
            for page_index in _page_indexes(len(pdf.pages), self.start_page, self.end_page):
                page = pdf.pages[page_index]
                words = page.extract_words() or []
                product_words = [word for word in words if _word_product_id(word) in product_ids]
                if not product_words:
                    continue

                all_page_colors = _extract_color_codes(words)
                found_colors.update(all_page_colors)
                if _looks_like_index_page(page, words):
                    continue

                for word in product_words:
                    product_id = _word_product_id(word)
                    image_box = _find_best_image_box(page, word)
                    if image_box is None:
                        continue
                    colors = _extract_nearby_colors(words, word, image_box)
                    matches_by_product.setdefault(product_id, []).append(
                        {
                            "pagina": page_index + 1,
                            "bbox": image_box,
                            "cores": colors,
                        }
                    )

        matches_by_product = {
            product_id: _dedupe_matches(matches)
            for product_id, matches in matches_by_product.items()
            if matches
        }
        return matches_by_product, found_colors

    def save_match_image(self, match: dict[str, Any], output_path: str | Path) -> None:
        import pdfplumber

        output = Path(output_path)
        output.parent.mkdir(parents=True, exist_ok=True)
        page_number = int(match["pagina"])
        bbox = tuple(match["bbox"])
        cache_key = (page_number, tuple(round(value) for value in bbox))

        image = self._image_cache.get(cache_key)
        if image is None:
            with pdfplumber.open(str(self.pdf_path)) as pdf:
                page = pdf.pages[page_number - 1]
                crop = page.crop(_clamp_bbox(bbox, page.width, page.height))
                image = crop.to_image(resolution=150).original.convert("RGB")
                self._image_cache[cache_key] = image

        image.save(output, format="JPEG", quality=92)


def update_color_registry(
    colors_dir: str | Path,
    color_codes: set[str],
    catalog_pdf_name: str,
    collection_name: str,
) -> tuple[Path, int]:
    color_dir = Path(colors_dir)
    color_dir.mkdir(parents=True, exist_ok=True)
    registry_path = color_dir / "cores_catalogo.json"
    existing_codes = _load_existing_color_codes(color_dir)
    new_codes = sorted(code for code in color_codes if code not in existing_codes)
    all_codes = sorted(existing_codes | color_codes)

    payload = {
        "updated_at": datetime.now().isoformat(timespec="seconds"),
        "collection": collection_name,
        "last_catalog_pdf": catalog_pdf_name,
        "total": len(all_codes),
        "cores": [{"codigo": code} for code in all_codes],
    }
    registry_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return registry_path, len(new_codes)


def _read_json_list(path: Path) -> list[dict[str, Any]]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise CatalogImageError("O JSON da tabela de valores deve ser uma lista de objetos.")
    return [item for item in data if isinstance(item, dict)]


def _page_indexes(total_pages: int, start_page: int | None, end_page: int | None) -> range:
    start = 1 if not start_page or start_page < 1 else start_page
    end = total_pages if not end_page or end_page < 1 else end_page
    start = min(start, total_pages)
    end = min(max(end, start), total_pages)
    return range(start - 1, end)


def _word_product_id(word: dict[str, Any]) -> str:
    text = str(word.get("text", ""))
    digits = re.sub(r"\D", "", text)
    return digits if PRODUCT_ID_RE.fullmatch(digits) else ""


def _extract_color_codes(words: list[dict[str, Any]]) -> set[str]:
    return {code for word in words for code in _color_codes_from_text(str(word.get("text", "")))}


def _color_codes_from_text(text: str) -> set[str]:
    codes: set[str] = set()
    for raw in re.split(r"[^A-Za-z0-9]+", text.upper()):
        if not raw or len(raw) < 6:
            continue
        if raw.isdigit() and len(raw) < 6:
            continue
        if not any(char.isdigit() for char in raw):
            continue
        if PRODUCT_ID_RE.fullmatch(raw) and len(raw) <= 5:
            continue
        if COLOR_CODE_RE.fullmatch(raw):
            codes.add(raw)
    return codes


def _looks_like_index_page(page: Any, words: list[dict[str, Any]]) -> bool:
    product_like_words = [word for word in words if _word_product_id(word)]
    if len(product_like_words) < 10:
        return False
    small_ids = [word for word in product_like_words if float(word.get("height", 0)) <= 7.5]
    full_page_images = [
        image
        for image in page.images
        if image.get("width", 0) > page.width * 0.75 and image.get("height", 0) > page.height * 0.75
    ]
    return bool(full_page_images and len(small_ids) >= 8)


def _find_best_image_box(page: Any, product_word: dict[str, Any]) -> tuple[float, float, float, float] | None:
    product_center_x = (float(product_word["x0"]) + float(product_word["x1"])) / 2
    product_top = float(product_word["top"])
    candidates: list[tuple[float, dict[str, Any]]] = []

    for image in page.images:
        x0, x1 = float(image["x0"]), float(image["x1"])
        top, bottom = float(image["top"]), float(image["bottom"])
        image_center_x = (x0 + x1) / 2
        horizontal_distance = 0 if x0 <= product_center_x <= x1 else abs(product_center_x - image_center_x)
        vertical_penalty = max(0, bottom - product_top)
        if top > product_top:
            continue
        if horizontal_distance > max(120, (x1 - x0) * 0.75):
            continue
        score = horizontal_distance + vertical_penalty * 5 + abs(product_top - bottom) * 0.1
        candidates.append((score, image))

    if candidates:
        image = sorted(candidates, key=lambda item: item[0])[0][1]
        return _expand_bbox((image["x0"], image["top"], image["x1"], image["bottom"]), page.width, page.height, padding=4)

    return _fallback_product_box(page, product_word)


def _fallback_product_box(page: Any, product_word: dict[str, Any]) -> tuple[float, float, float, float] | None:
    center_x = (float(product_word["x0"]) + float(product_word["x1"])) / 2
    product_top = float(product_word["top"])
    column_width = page.width / 4 if page.width > page.height else page.width / 2
    x0 = max(0, center_x - column_width / 2)
    x1 = min(page.width, center_x + column_width / 2)
    y0 = 0
    y1 = max(0, product_top - 8)
    if y1 - y0 < 80 or x1 - x0 < 80:
        return None
    return _clamp_bbox((x0, y0, x1, y1), page.width, page.height)


def _extract_nearby_colors(
    words: list[dict[str, Any]],
    product_word: dict[str, Any],
    image_box: tuple[float, float, float, float],
) -> list[str]:
    product_top = float(product_word["top"])
    x0, _top, x1, _bottom = image_box
    region_x0 = max(0, x0 - 35)
    region_x1 = x1 + 35
    region_top = max(0, product_top - 35)
    region_bottom = product_top + 115

    codes: set[str] = set()
    for word in words:
        wx0, wx1 = float(word["x0"]), float(word["x1"])
        wtop, wbottom = float(word["top"]), float(word["bottom"])
        if wx1 < region_x0 or wx0 > region_x1 or wbottom < region_top or wtop > region_bottom:
            continue
        codes.update(_color_codes_from_text(str(word.get("text", ""))))
    return sorted(codes)


def _dedupe_matches(matches: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[tuple[int, tuple[int, int, int, int]]] = set()
    deduped: list[dict[str, Any]] = []
    for match in matches:
        key = (int(match["pagina"]), tuple(round(value) for value in match["bbox"]))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(match)
    return deduped


def _expand_bbox(
    bbox: tuple[float, float, float, float],
    page_width: float,
    page_height: float,
    padding: float,
) -> tuple[float, float, float, float]:
    x0, top, x1, bottom = bbox
    return _clamp_bbox((x0 - padding, top - padding, x1 + padding, bottom + padding), page_width, page_height)


def _clamp_bbox(
    bbox: tuple[float, float, float, float],
    page_width: float,
    page_height: float,
) -> tuple[float, float, float, float]:
    x0, top, x1, bottom = bbox
    return (
        max(0, min(float(x0), page_width - 1)),
        max(0, min(float(top), page_height - 1)),
        max(1, min(float(x1), page_width)),
        max(1, min(float(bottom), page_height)),
    )


def _build_image_filename(product: dict[str, Any], image_index: int | None) -> str:
    product_uuid = str(product.get("UUID", "")).strip() or "sem_uuid"
    product_id = str(product.get("produto_id", "")).strip() or "sem_produto"
    sizes = product.get("tamanhos_array") or [product.get("tamanho_original", "sem_tamanho")]
    sizes_text = "-".join(str(size) for size in sizes)
    safe_sizes = re.sub(r"[^A-Za-z0-9_-]+", "-", sizes_text).strip("-") or "sem_tamanho"
    suffix = f"_{image_index}" if image_index is not None else ""
    return f"A_{product_uuid}_{product_id}_{safe_sizes}{suffix}.jpg"


def _load_existing_color_codes(colors_dir: Path) -> set[str]:
    codes: set[str] = set()
    for json_path in colors_dir.glob("*.json"):
        try:
            data = json.loads(json_path.read_text(encoding="utf-8"))
        except Exception:
            continue
        codes.update(_colors_from_json_data(data))
    return codes


def _colors_from_json_data(data: Any) -> set[str]:
    codes: set[str] = set()
    if isinstance(data, dict):
        for key, value in data.items():
            if key.lower() in {"codigo", "code", "cor"} and isinstance(value, str):
                codes.update(_color_codes_from_text(value))
            else:
                codes.update(_colors_from_json_data(value))
    elif isinstance(data, list):
        for item in data:
            codes.update(_colors_from_json_data(item))
    elif isinstance(data, str):
        codes.update(_color_codes_from_text(data))
    return codes
