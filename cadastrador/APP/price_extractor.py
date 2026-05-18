from __future__ import annotations

import json
import re
import unicodedata
import uuid
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Iterable


TEXTUAL_SIZE_ORDERS = {
    "RN": ["RN", "P", "M", "G", "GG"],
    "PR": ["PR", "P", "M", "G", "GG"],
    "P": ["P", "M", "G", "GG"],
}
UNICO_LABEL = "\u00daNICO"
SIZE_TOKEN_RE = re.compile(
    r"(?i)\b(?:RN|PR|P|M|G|GG|\d{1,2})\s+a\s+(?:RN|PR|P|M|G|GG|\d{1,2})\b|\b(?:\u00daNICO|UNICO|\ufffdNICO)\b"
)
PRICE_RE = re.compile(r"(?:R\$\s*)?\d{1,4}(?:\.\d{3})*,\d{2}\s*(?:R\$)?")
PRODUCT_ID_RE = re.compile(r"^\s*(\d{4,8})\b")


class ExtractionError(RuntimeError):
    pass


@dataclass(frozen=True)
class ExtractionResult:
    records: list[dict[str, Any]]
    json_path: Path
    excel_path: Path


@dataclass(frozen=True)
class ValidationResult:
    rows: list[dict[str, Any]]
    issues: list[dict[str, Any]]
    json_path: Path
    excel_path: Path


class PdfProductExtractor:
    def __init__(
        self,
        pdf_path: str | Path,
        collection_name: str,
        start_page: int | None = None,
        end_page: int | None = None,
    ) -> None:
        self.pdf_path = Path(pdf_path)
        self.collection_name = collection_name
        self.start_page = start_page
        self.end_page = end_page

    def extract_pdf(self) -> list[dict[str, Any]]:
        return extract_price_table(
            pdf_path=self.pdf_path,
            start_page=self.start_page,
            end_page=self.end_page,
            table_name_hint=self.collection_name,
        )

    def validate(self, records: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
        parsed_records = records if records is not None else self.extract_pdf()
        return _build_validation_rows(self.pdf_path, parsed_records, self.start_page, self.end_page)

    def export_to_excel(self, records: list[dict[str, Any]], output_dir: str | Path, basename: str) -> ExtractionResult:
        return export_records(records, output_dir, basename)


def count_pdf_pages(pdf_path: str | Path) -> int:
    path = Path(pdf_path)
    try:
        from pypdf import PdfReader

        return len(PdfReader(str(path)).pages)
    except Exception:
        try:
            import pdfplumber

            with pdfplumber.open(str(path)) as pdf:
                return len(pdf.pages)
        except Exception as exc:
            raise ExtractionError(f"Nao foi possivel contar paginas do PDF: {path}") from exc


def normalize_text(value: Any) -> str:
    text = "" if value is None else str(value)
    text = text.replace("\n", " ").replace("\r", " ")
    text = text.replace("\ufffd", "U")
    text = unicodedata.normalize("NFKC", text)
    return re.sub(r"\s+", " ", text).strip()


def normalize_header(value: Any) -> str:
    text = normalize_text(value).upper()
    text = text.replace("DESCRICAO", "DESCRICAO").replace("DESCRI\u00c7\u00c3O", "DESCRICAO")
    text = text.replace(UNICO_LABEL, "UNICO")
    return text


def parse_price(value: Any) -> Decimal | None:
    text = normalize_price_text(value)
    if not text:
        return None
    match = PRICE_RE.search(text)
    if not match:
        return None
    raw = match.group(0).replace("R$", "").strip()
    raw = raw.replace(".", "").replace(",", ".")
    try:
        return Decimal(raw).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return None


def normalize_price_text(value: Any) -> str:
    text = normalize_text(value)
    return re.sub(r"(?<=\d)\s+(?=\d)", "", text)


def parse_size_range(size_text: str) -> tuple[Any, Any, list[Any]]:
    original = normalize_text(size_text).replace("UNICO", UNICO_LABEL)
    upper = normalize_header(original)
    if upper in {"UNICO", "UUNICO"}:
        return UNICO_LABEL, UNICO_LABEL, [UNICO_LABEL]

    parts = re.split(r"\s+a\s+", upper, flags=re.IGNORECASE)
    if len(parts) != 2:
        return original, original, [original]

    start_raw, end_raw = parts[0].strip(), parts[1].strip()
    if start_raw.isdigit() and end_raw.isdigit():
        start, end = int(start_raw), int(end_raw)
        step = 1 if start <= end else -1
        return start, end, list(range(start, end + step, step))

    order = TEXTUAL_SIZE_ORDERS.get(start_raw)
    if order and end_raw in order:
        start_idx = order.index(start_raw)
        end_idx = order.index(end_raw)
        if start_idx <= end_idx:
            return start_raw, end_raw, order[start_idx : end_idx + 1]

    return start_raw, end_raw, [start_raw, end_raw]


def is_size_header(value: Any) -> bool:
    text = normalize_header(value)
    return bool(SIZE_TOKEN_RE.fullmatch(text))


def extract_price_table(
    pdf_path: str | Path,
    start_page: int | None = None,
    end_page: int | None = None,
    table_name_hint: str | None = None,
    use_ocr: bool = True,
) -> list[dict[str, Any]]:
    path = Path(pdf_path)
    if not path.exists():
        raise ExtractionError(f"PDF nao encontrado: {path}")

    records: list[dict[str, Any]] = []
    pdfplumber_error: Exception | None = None

    try:
        import pdfplumber

        with pdfplumber.open(str(path)) as pdf:
            page_slice = _page_indexes(len(pdf.pages), start_page, end_page)
            for page_index in page_slice:
                page = pdf.pages[page_index]
                page_records = _extract_page_with_pdfplumber(page, table_name_hint)
                records.extend(page_records)
    except ImportError as exc:
        pdfplumber_error = exc
    except Exception as exc:
        pdfplumber_error = exc

    if records:
        return _add_record_ids(records)

    text_records = _extract_with_pypdf_text(path, start_page, end_page, table_name_hint)
    if text_records:
        return _add_record_ids(text_records)

    if use_ocr:
        ocr_records = _extract_with_ocr(path, start_page, end_page, table_name_hint)
        if ocr_records:
            return _add_record_ids(ocr_records)

    if pdfplumber_error:
        raise ExtractionError(
            "Nao foi possivel extrair tabelas do PDF. Instale/verifique pdfplumber; "
            "se o PDF for escaneado, instale tambem pytesseract e pdf2image."
        ) from pdfplumber_error

    raise ExtractionError("Nenhum produto com preco foi encontrado no intervalo informado.")


def export_records(
    records: list[dict[str, Any]],
    output_dir: str | Path,
    basename: str,
) -> ExtractionResult:
    if not records:
        raise ExtractionError("Nao ha registros para exportar.")

    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r"[^A-Za-z0-9_-]+", "_", basename).strip("_")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = out_dir / f"{safe_name}_{timestamp}.json"
    excel_path = out_dir / f"{safe_name}_{timestamp}.xlsx"

    json_path.write_text(
        json.dumps(records, ensure_ascii=False, indent=2, default=_json_default),
        encoding="utf-8",
    )
    _write_excel(records, excel_path)

    return ExtractionResult(records=records, json_path=json_path, excel_path=excel_path)


def process_price_pdf(
    pdf_path: str | Path,
    output_dir: str | Path,
    collection_name: str,
    start_page: int | None = None,
    end_page: int | None = None,
) -> ExtractionResult:
    extractor = PdfProductExtractor(pdf_path, collection_name, start_page, end_page)
    records = extractor.extract_pdf()
    return extractor.export_to_excel(records, output_dir, f"{collection_name}_tabela_precos")


def validate_price_pdf(
    pdf_path: str | Path,
    output_dir: str | Path,
    collection_name: str,
    start_page: int | None = None,
    end_page: int | None = None,
) -> ValidationResult:
    extractor = PdfProductExtractor(pdf_path, collection_name, start_page, end_page)
    records = extract_price_table(
        pdf_path=extractor.pdf_path,
        start_page=extractor.start_page,
        end_page=extractor.end_page,
        table_name_hint=extractor.collection_name,
        use_ocr=False,
    )
    rows = extractor.validate(records)
    issues = [row for row in rows if row["status"] != "OK"]
    return _export_validation(rows, issues, output_dir, f"{collection_name}_validacao_tabela")


def _page_indexes(total_pages: int, start_page: int | None, end_page: int | None) -> range:
    start = 1 if not start_page or start_page < 1 else start_page
    end = total_pages if not end_page or end_page < 1 else end_page
    start = min(start, total_pages)
    end = min(max(end, start), total_pages)
    return range(start - 1, end)


def _extract_page_with_pdfplumber(page: Any, table_name_hint: str | None) -> list[dict[str, Any]]:
    settings = [
        {},
        {"vertical_strategy": "lines", "horizontal_strategy": "lines"},
        {"vertical_strategy": "text", "horizontal_strategy": "text"},
    ]
    records: list[dict[str, Any]] = []
    for setting in settings:
        try:
            tables = page.extract_tables(table_settings=setting)
        except Exception:
            continue
        for raw_table in tables or []:
            records.extend(_parse_pdf_table(raw_table, table_name_hint))
        if records:
            return records
    return records


def _parse_pdf_table(rows: Iterable[Iterable[Any]], table_name_hint: str | None) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    current_name = table_name_hint or "SEM_NOME"
    header: list[str] | None = None
    product_idx = 0
    description_idx = 1
    size_columns: list[tuple[int, str]] = []

    for raw_row in rows:
        row = [normalize_text(cell) for cell in raw_row]
        non_empty = [cell for cell in row if cell]
        if not non_empty:
            continue

        joined = " ".join(non_empty)
        joined_header = normalize_header(joined)

        if "PRODUTO" not in joined_header and len(non_empty) == 1 and not PRODUCT_ID_RE.match(non_empty[0]):
            current_name = non_empty[0]
            continue

        if "PRODUTO" in joined_header and ("DESCRI" in joined_header or any(is_size_header(cell) for cell in row)):
            header = row
            product_idx = _find_header_index(header, "PRODUTO", default=0)
            description_idx = _find_description_index(header, default=1)
            size_columns = [(idx, cell) for idx, cell in enumerate(header) if is_size_header(cell)]
            if not size_columns:
                size_columns = [(idx + 2, size) for idx, size in enumerate(_sizes_from_text(joined))]
            continue

        product_match = PRODUCT_ID_RE.match(row[product_idx] if product_idx < len(row) else joined)
        if not product_match or not header:
            continue

        produto_id = product_match.group(1)
        descricao = row[description_idx] if description_idx < len(row) else ""
        if not descricao:
            descricao = _description_from_joined_line(joined)

        for col_idx, size_text in size_columns:
            cell = row[col_idx] if col_idx < len(row) else ""
            price = parse_price(cell)
            if price is None:
                continue
            records.append(_make_record(current_name, produto_id, descricao, size_text, price))

    return records


def _extract_with_pypdf_text(
    pdf_path: Path,
    start_page: int | None,
    end_page: int | None,
    table_name_hint: str | None,
) -> list[dict[str, Any]]:
    try:
        from pypdf import PdfReader
    except Exception:
        return []

    try:
        reader = PdfReader(str(pdf_path))
    except Exception:
        return []

    records: list[dict[str, Any]] = []
    current_name = table_name_hint or "SEM_NOME"
    current_sizes: list[str] = []
    for page_index in _page_indexes(len(reader.pages), start_page, end_page):
        text = reader.pages[page_index].extract_text() or ""
        for line in text.splitlines():
            line = normalize_text(line)
            if not line:
                continue
            header = normalize_header(line)
            if "TABELA" in header and "PRODUTO" not in header:
                current_name = line
                continue
            if "PRODUTO" in header and "DESCRI" in header:
                current_sizes = _sizes_from_text(line)
                continue
            match = PRODUCT_ID_RE.match(line)
            if not match or not current_sizes:
                continue
            prices = _extract_prices(line)
            if not prices:
                continue
            descricao = _description_from_joined_line(line)
            for size_text, price in zip(_align_sizes_for_text_fallback(current_sizes, prices), prices):
                records.append(_make_record(current_name, match.group(1), descricao, size_text, price))
    return records


def _extract_with_ocr(
    pdf_path: Path,
    start_page: int | None,
    end_page: int | None,
    table_name_hint: str | None,
) -> list[dict[str, Any]]:
    try:
        import pytesseract
        from pdf2image import convert_from_path
    except Exception:
        return []

    try:
        page_count = count_pdf_pages(pdf_path)
        first_page = 1 if not start_page else start_page
        last_page = page_count if not end_page else end_page
        images = convert_from_path(str(pdf_path), first_page=first_page, last_page=last_page, dpi=250)
    except Exception:
        return []

    records: list[dict[str, Any]] = []
    current_name = table_name_hint or "SEM_NOME"
    current_sizes: list[str] = []
    for image in images:
        text = pytesseract.image_to_string(image, lang="por")
        for line in text.splitlines():
            line = normalize_text(line)
            header = normalize_header(line)
            if "TABELA" in header and "PRODUTO" not in header:
                current_name = line
            elif "PRODUTO" in header and "DESCRI" in header:
                current_sizes = _sizes_from_text(line)
            elif PRODUCT_ID_RE.match(line) and current_sizes:
                prices = _extract_prices(line)
                descricao = _description_from_joined_line(line)
                for size_text, price in zip(_align_sizes_for_text_fallback(current_sizes, prices), prices):
                    records.append(_make_record(current_name, PRODUCT_ID_RE.match(line).group(1), descricao, size_text, price))
    return records


def _make_record(
    nome_tabela: str,
    produto_id: str,
    descricao: str,
    tamanho_original: str,
    preco: Decimal,
) -> dict[str, Any]:
    inicio, fim, tamanhos = parse_size_range(tamanho_original)
    return {
        "nome_tabela": normalize_text(nome_tabela) or "SEM_NOME",
        "produto_id": str(produto_id),
        "descricao": normalize_text(descricao),
        "tamanho_original": normalize_text(tamanho_original).replace("UNICO", UNICO_LABEL),
        "tamanho_inicio": inicio,
        "tamanho_fim": fim,
        "tamanhos_array": tamanhos,
        "preco": preco,
    }


def _add_record_ids(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    numbered_records = []
    for number, record in enumerate(records, start=1):
        record_with_ids = {"Number": number, "UUID": str(uuid.uuid4())}
        record_with_ids.update(record)
        numbered_records.append(record_with_ids)
    return numbered_records


def _find_header_index(header: list[str], label: str, default: int) -> int:
    for idx, cell in enumerate(header):
        if label in normalize_header(cell):
            return idx
    return default


def _find_description_index(header: list[str], default: int) -> int:
    for idx, cell in enumerate(header):
        if "DESCRI" in normalize_header(cell):
            return idx
    return default


def _sizes_from_text(text: str) -> list[str]:
    return [normalize_text(match.group(0)).replace("UNICO", UNICO_LABEL) for match in SIZE_TOKEN_RE.finditer(text)]


def _description_from_joined_line(line: str) -> str:
    text = PRODUCT_ID_RE.sub("", line, count=1).strip()
    first_price = PRICE_RE.search(normalize_price_text(text))
    if first_price:
        text = text[: first_price.start()].strip()
    return text


def _align_sizes_for_text_fallback(sizes: list[str], prices: list[Decimal]) -> list[str]:
    if len(prices) >= len(sizes):
        return sizes
    return sizes[-len(prices) :]


def _extract_prices(value: Any) -> list[Decimal]:
    text = normalize_price_text(value)
    prices = [parse_price(item.group(0)) for item in PRICE_RE.finditer(text)]
    return [price for price in prices if price is not None]


def _build_validation_rows(
    pdf_path: Path,
    records: list[dict[str, Any]],
    start_page: int | None,
    end_page: int | None,
) -> list[dict[str, Any]]:
    raw_rows = _raw_product_rows_from_pdf(pdf_path, start_page, end_page)
    records_by_product: dict[str, list[dict[str, Any]]] = {}
    for record in records:
        records_by_product.setdefault(str(record["produto_id"]), []).append(record)

    validation_rows: list[dict[str, Any]] = []
    seen_products: set[str] = set()
    for raw in raw_rows:
        produto_id = raw["produto_id"]
        seen_products.add(produto_id)
        extracted = records_by_product.get(produto_id, [])
        extracted_prices = [_coerce_decimal(item["preco"]) for item in extracted]
        pdf_prices = raw["precos_pdf"]
        status = "OK"
        messages: list[str] = []

        if not extracted:
            status = "ERRO"
            messages.append("Produto encontrado no PDF, mas nao foi exportado.")
        if _price_signature(pdf_prices) != _price_signature(extracted_prices):
            status = "ERRO"
            messages.append("Precos exportados diferem dos precos brutos encontrados na linha do PDF.")
        if raw["qtd_precos_pdf"] < raw["qtd_tamanhos_cabecalho"]:
            if status == "OK":
                status = "REVISAR"
            messages.append(
                "A linha tem menos precos que colunas de tamanho; confira se cada preco ficou no tamanho correto."
            )

        validation_rows.append(
            {
                "status": status,
                "pagina": raw["pagina"],
                "produto_id": produto_id,
                "descricao_pdf": raw["descricao_pdf"],
                "tamanhos_cabecalho": " | ".join(raw["tamanhos_cabecalho"]),
                "precos_pdf": " | ".join(_format_price(price) for price in pdf_prices),
                "tamanhos_extraidos": " | ".join(str(item["tamanho_original"]) for item in extracted),
                "precos_extraidos": " | ".join(_format_price(item["preco"]) for item in extracted),
                "observacao": " ".join(messages),
                "linha_pdf": raw["linha_pdf"],
            }
        )

    for produto_id, extracted in records_by_product.items():
        if produto_id in seen_products:
            continue
        validation_rows.append(
            {
                "status": "ERRO",
                "pagina": "",
                "produto_id": produto_id,
                "descricao_pdf": "",
                "tamanhos_cabecalho": "",
                "precos_pdf": "",
                "tamanhos_extraidos": " | ".join(str(item["tamanho_original"]) for item in extracted),
                "precos_extraidos": " | ".join(_format_price(item["preco"]) for item in extracted),
                "observacao": "Produto exportado, mas a linha bruta correspondente nao foi localizada no PDF.",
                "linha_pdf": "",
            }
        )

    return validation_rows


def _raw_product_rows_from_pdf(
    pdf_path: Path,
    start_page: int | None,
    end_page: int | None,
) -> list[dict[str, Any]]:
    try:
        from pypdf import PdfReader
    except Exception as exc:
        raise ExtractionError("Instale pypdf para gerar a validacao da tabela.") from exc

    reader = PdfReader(str(pdf_path))
    raw_rows: list[dict[str, Any]] = []
    current_sizes: list[str] = []
    for page_index in _page_indexes(len(reader.pages), start_page, end_page):
        text = reader.pages[page_index].extract_text() or ""
        for line in text.splitlines():
            line = normalize_text(line)
            header = normalize_header(line)
            if "PRODUTO" in header and "DESCRI" in header:
                current_sizes = _sizes_from_text(line)
                continue

            product_match = PRODUCT_ID_RE.match(line)
            if not product_match:
                continue
            pdf_prices = _extract_prices(line)
            if not pdf_prices:
                continue
            raw_rows.append(
                {
                    "pagina": page_index + 1,
                    "produto_id": product_match.group(1),
                    "descricao_pdf": _description_from_joined_line(line),
                    "tamanhos_cabecalho": current_sizes,
                    "qtd_tamanhos_cabecalho": len(current_sizes),
                    "precos_pdf": pdf_prices,
                    "qtd_precos_pdf": len(pdf_prices),
                    "linha_pdf": line,
                }
            )
    return raw_rows


def _export_validation(
    rows: list[dict[str, Any]],
    issues: list[dict[str, Any]],
    output_dir: str | Path,
    basename: str,
) -> ValidationResult:
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r"[^A-Za-z0-9_-]+", "_", basename).strip("_")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = out_dir / f"{safe_name}_{timestamp}.json"
    excel_path = out_dir / f"{safe_name}_{timestamp}.xlsx"

    payload = {"resumo": {"linhas": len(rows), "alertas": len(issues)}, "linhas": rows}
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2, default=_json_default), encoding="utf-8")
    _write_validation_excel(rows, issues, excel_path)
    return ValidationResult(rows=rows, issues=issues, json_path=json_path, excel_path=excel_path)


def _write_validation_excel(rows: list[dict[str, Any]], issues: list[dict[str, Any]], excel_path: Path) -> None:
    try:
        import pandas as pd

        with pd.ExcelWriter(excel_path, engine="xlsxwriter") as writer:
            pd.DataFrame(rows).to_excel(writer, sheet_name="validacao_completa", index=False)
            pd.DataFrame(issues).to_excel(writer, sheet_name="revisar", index=False)
        return
    except Exception:
        pass

    import xlsxwriter

    workbook = xlsxwriter.Workbook(str(excel_path))
    _write_xlsx_sheet(workbook, "validacao_completa", rows)
    _write_xlsx_sheet(workbook, "revisar", issues)
    workbook.close()


def _write_xlsx_sheet(workbook: Any, sheet_name: str, rows: list[dict[str, Any]]) -> None:
    worksheet = workbook.add_worksheet(sheet_name)
    if not rows:
        worksheet.write(0, 0, "sem_registros")
        return
    headers = list(rows[0].keys())
    for col, header in enumerate(headers):
        worksheet.write(0, col, header)
    for row_idx, row in enumerate(rows, start=1):
        for col_idx, header in enumerate(headers):
            worksheet.write(row_idx, col_idx, row.get(header, ""))


def _price_signature(prices: list[Decimal]) -> list[str]:
    return sorted(_format_price(price) for price in prices)


def _format_price(price: Any) -> str:
    decimal_price = _coerce_decimal(price)
    return f"{decimal_price:.2f}"


def _coerce_decimal(value: Any) -> Decimal:
    if isinstance(value, Decimal):
        return value.quantize(Decimal("0.01"))
    return Decimal(str(value)).quantize(Decimal("0.01"))


def _json_default(value: Any) -> str:
    if isinstance(value, Decimal):
        return _format_price(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def _write_excel(records: list[dict[str, Any]], excel_path: Path) -> None:
    try:
        import pandas as pd

        rows = []
        for record in records:
            row = dict(record)
            row["tamanhos_array"] = json.dumps(row["tamanhos_array"], ensure_ascii=False)
            row["preco"] = _format_price(row["preco"])
            rows.append(row)
        with pd.ExcelWriter(excel_path, engine="xlsxwriter") as writer:
            pd.DataFrame(rows).to_excel(writer, sheet_name="produtos", index=False)
        return
    except Exception:
        pass

    try:
        import xlsxwriter

        workbook = xlsxwriter.Workbook(str(excel_path))
        worksheet = workbook.add_worksheet("produtos")
        headers = list(records[0].keys())
        for col, header in enumerate(headers):
            worksheet.write(0, col, header)
        for row_idx, record in enumerate(records, start=1):
            for col_idx, header in enumerate(headers):
                value = record[header]
                if isinstance(value, list):
                    value = json.dumps(value, ensure_ascii=False)
                elif isinstance(value, Decimal):
                    value = _format_price(value)
                worksheet.write(row_idx, col_idx, value)
        workbook.close()
    except Exception as exc:
        raise ExtractionError(f"JSON salvo, mas falhou ao gerar Excel: {excel_path}") from exc
