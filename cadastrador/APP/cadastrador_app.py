from __future__ import annotations

import base64
import json
import mimetypes
import os
import re
import shutil
import sys
import traceback
import unicodedata
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from catalog_image_finder import find_latest_price_json, process_catalog_images
from price_extractor import ExtractionError, count_pdf_pages, process_price_pdf, validate_price_pdf


try:
    from PySide6.QtCore import QObject, QSettings, QThread, Signal, Slot
    from PySide6.QtWidgets import (
        QApplication,
        QComboBox,
        QFormLayout,
        QFrame,
        QGridLayout,
        QGroupBox,
        QHBoxLayout,
        QLabel,
        QLineEdit,
        QListWidget,
        QListWidgetItem,
        QMainWindow,
        QMessageBox,
        QPushButton,
        QSpinBox,
        QStackedWidget,
        QTextEdit,
        QVBoxLayout,
        QWidget,
    )
except ImportError as exc:
    raise SystemExit(
        "PySide6 nao esta instalado. Instale com: python -m pip install -r requirements.txt"
    ) from exc


APP_DIR = Path(__file__).resolve().parent
DATA_DIR = APP_DIR.parent
UP_BABY_DIR = DATA_DIR / "UP_BABY"
UP_BABY_BRAND = "UP-BABY"
API_BASE_URL = os.environ.get(
    "MUNDOCOLORE_API_URL",
    "https://b8i4etrh23.execute-api.sa-east-1.amazonaws.com/prod",
).rstrip("/")
LOGIN_BASIC_AUTH = os.environ.get(
    "MUNDOCOLORE_LOGIN_BASIC_AUTH",
    "Basic QVBJX05BTUVfQUNDRVNTOkFQSV9TRUNSRVRfQUNDRVNT",
)
REQUEST_TIMEOUT_SECONDS = 30


class ApiError(RuntimeError):
    pass


def _request_json(path: str, *, method: str, data: bytes | None = None, headers: dict[str, str] | None = None) -> dict:
    request = Request(
        f"{API_BASE_URL}{path}",
        data=data,
        headers=headers or {},
        method=method,
    )
    try:
        with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            raw_body = response.read().decode("utf-8")
    except HTTPError as exc:
        raw_body = exc.read().decode("utf-8", errors="replace")
        detail = _read_api_error_message(raw_body) or exc.reason
        raise ApiError(f"API retornou {exc.code}: {detail}") from exc
    except URLError as exc:
        raise ApiError(f"Nao foi possivel acessar a API: {exc.reason}") from exc

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise ApiError("A API retornou JSON invalido.") from exc

    if not isinstance(payload, dict):
        raise ApiError("A API retornou um formato inesperado.")
    return payload


def _read_api_error_message(raw_body: str) -> str:
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        return raw_body.strip()
    if isinstance(payload, dict):
        return str(payload.get("message") or payload.get("error") or "").strip()
    return ""


def login_api(username: str, password: str) -> str:
    form_data = urlencode(
        {
            "grant_type": "password",
            "username": username.strip(),
            "password": password,
        }
    ).encode("utf-8")
    payload = _request_json(
        "/login",
        method="POST",
        data=form_data,
        headers={
            "Accept": "application/json",
            "Authorization": LOGIN_BASIC_AUTH,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    token = str(payload.get("token") or payload.get("access_token") or "").strip()
    if not token:
        raise ApiError("O login foi aceito sem retornar token.")
    return token


def fetch_brands_api(token: str) -> list[dict]:
    payload = _request_json(
        "/products/brands",
        method="GET",
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
        },
    )
    brands = payload.get("brands")
    if not isinstance(brands, list):
        raise ApiError("A lista de marcas veio em formato inesperado.")
    return [brand for brand in brands if isinstance(brand, dict)]


def fetch_collections_api(token: str, brand: str = "") -> list[dict]:
    query_values = {"include_pricing_config": "true"}
    if brand:
        query_values["brand"] = brand
    query = urlencode(query_values)
    payload = _request_json(
        f"/products/collections?{query}",
        method="GET",
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
        },
    )
    collections = payload.get("collections")
    if not isinstance(collections, list):
        raise ApiError("A lista de colecoes veio em formato inesperado.")
    return [collection for collection in collections if isinstance(collection, dict)]


def fetch_products_api(
    token: str,
    brand: str,
    year: str,
    collection_slug: str,
) -> list[dict]:
    products: list[dict] = []
    last_key = ""
    seen_keys: set[str] = set()
    while True:
        query_values = {
            "brand": brand,
            "year": year,
            "collection": collection_slug,
            "include_cost": "true",
            "include_inactive": "true",
            "limit": "100",
        }
        if last_key:
            query_values["last_key"] = last_key
        payload = _request_json(
            f"/products?{urlencode(query_values)}",
            method="GET",
            headers={
                "Accept": "application/json",
                "Authorization": f"Bearer {token}",
            },
        )
        page_products = payload.get("products")
        if not isinstance(page_products, list):
            raise ApiError("A lista de produtos veio em formato inesperado.")
        products.extend(product for product in page_products if isinstance(product, dict))

        next_key = str(payload.get("last_evaluated_key") or payload.get("last_key") or "").strip()
        if not next_key or next_key in seen_keys:
            break
        seen_keys.add(next_key)
        last_key = next_key
    return products


def import_products_file_api(
    token: str,
    product_file: Path,
    brand: str,
    year: str,
    collection: str,
    collection_slug: str,
) -> dict:
    payload = {
        "file_name": product_file.name,
        "content_base64": base64.b64encode(product_file.read_bytes()).decode("ascii"),
        "brand": brand,
        "year": year,
        "collection": collection,
        "collection_slug": collection_slug,
    }
    return _request_json(
        "/products/import-file",
        method="POST",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )


def upload_product_image_api(token: str, product_id: str, image_path: Path) -> dict:
    content_type = mimetypes.guess_type(image_path.name)[0] or "application/octet-stream"
    payload = {
        "file_name": image_path.name,
        "content_base64": base64.b64encode(image_path.read_bytes()).decode("ascii"),
        "content_type": content_type,
    }
    return _request_json(
        f"/products/{quote(product_id, safe='')}/images",
        method="POST",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )


class PriceProcessWorker(QObject):
    finished = Signal(object)
    failed = Signal(str)

    def __init__(self, pdf_path: Path, output_dir: Path, collection: str, start_page: int, end_page: int) -> None:
        super().__init__()
        self.pdf_path = pdf_path
        self.output_dir = output_dir
        self.collection = collection
        self.start_page = start_page
        self.end_page = end_page

    @Slot()
    def run(self) -> None:
        try:
            result = process_price_pdf(
                pdf_path=self.pdf_path,
                output_dir=self.output_dir,
                collection_name=self.collection,
                start_page=self.start_page,
                end_page=self.end_page,
            )
            self.finished.emit(result)
        except Exception as exc:
            detail = f"{exc}\n\n{traceback.format_exc()}"
            self.failed.emit(detail)


class PriceValidationWorker(QObject):
    finished = Signal(object)
    failed = Signal(str)

    def __init__(self, pdf_path: Path, output_dir: Path, collection: str, start_page: int, end_page: int) -> None:
        super().__init__()
        self.pdf_path = pdf_path
        self.output_dir = output_dir
        self.collection = collection
        self.start_page = start_page
        self.end_page = end_page

    @Slot()
    def run(self) -> None:
        try:
            result = validate_price_pdf(
                pdf_path=self.pdf_path,
                output_dir=self.output_dir,
                collection_name=self.collection,
                start_page=self.start_page,
                end_page=self.end_page,
            )
            self.finished.emit(result)
        except Exception as exc:
            detail = f"{exc}\n\n{traceback.format_exc()}"
            self.failed.emit(detail)


class CatalogImageWorker(QObject):
    finished = Signal(object)
    failed = Signal(str)

    def __init__(
        self,
        catalog_pdf_path: Path,
        price_json_path: Path,
        output_dir: Path,
        colors_dir: Path,
        collection: str,
        start_page: int,
        end_page: int,
    ) -> None:
        super().__init__()
        self.catalog_pdf_path = catalog_pdf_path
        self.price_json_path = price_json_path
        self.output_dir = output_dir
        self.colors_dir = colors_dir
        self.collection = collection
        self.start_page = start_page
        self.end_page = end_page

    @Slot()
    def run(self) -> None:
        try:
            result = process_catalog_images(
                catalog_pdf_path=self.catalog_pdf_path,
                price_json_path=self.price_json_path,
                output_dir=self.output_dir,
                colors_dir=self.colors_dir,
                collection_name=self.collection,
                start_page=self.start_page,
                end_page=self.end_page,
            )
            self.finished.emit(result)
        except Exception as exc:
            detail = f"{exc}\n\n{traceback.format_exc()}"
            self.failed.emit(detail)


class MainWindow(QMainWindow):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("Cadastrador Mundo Colore")
        self.resize(1180, 860)
        self.settings = QSettings("Mundo Colore", "Cadastrador")
        self.token = self._read_setting("auth/token")
        self.thread: QThread | None = None
        self.worker: QObject | None = None
        self.brands: list[dict] = []
        self.collections_by_brand: dict[str, list[dict]] = {}
        self.active_brand: dict | None = None
        self.active_brand_label = ""
        self.active_brand_key = ""
        self.active_brand_dir: Path | None = None
        self.active_pending_dir: Path | None = None
        self.active_sent_dir: Path | None = None
        self.active_history_dir: Path | None = None
        self.active_pending_images_dir: Path | None = None
        self.active_sent_images_dir: Path | None = None
        self.active_colors_dir: Path | None = None
        self.active_collection: dict | None = None
        self.collection_contexts: dict[str, dict] = {}
        self.suppress_empty_collection_message = False

        self.stack = QStackedWidget()
        self.setCentralWidget(self.stack)

        self.login_page = self._build_login_page()
        self.home_page = self._build_home_page()
        self.brand_page = self._build_brand_page()
        self.stack.addWidget(self.login_page)
        self.stack.addWidget(self.home_page)
        self.stack.addWidget(self.brand_page)

        self._load_saved_credentials()
        self._ensure_default_dirs()
        self.refresh_collections()
        self._restore_session()

    def _build_login_page(self) -> QWidget:
        page = QWidget()
        outer = QVBoxLayout(page)
        outer.setContentsMargins(32, 32, 32, 32)
        outer.addStretch(1)

        form_box = QGroupBox("Login")
        form_box.setMaximumWidth(420)
        form = QFormLayout(form_box)

        title = QLabel("Cadastrador de Produtos")
        title.setObjectName("Title")
        self.username_input = QLineEdit()
        self.username_input.setPlaceholderText("usuario@email.com")
        self.password_input = QLineEdit()
        self.password_input.setEchoMode(QLineEdit.Password)
        self.password_input.returnPressed.connect(self.login)
        self.login_status = QLabel("Entre para carregar as marcas cadastradas.")
        self.login_status.setWordWrap(True)
        self.login_status.setObjectName("Status")
        self.login_btn = QPushButton("Entrar")
        self.login_btn.clicked.connect(self.login)

        form.addRow(title)
        form.addRow("Usuario", self.username_input)
        form.addRow("Senha", self.password_input)
        form.addRow(self.login_status)
        form.addRow(self.login_btn)

        center = QHBoxLayout()
        center.addStretch(1)
        center.addWidget(form_box)
        center.addStretch(1)
        outer.addLayout(center)
        outer.addStretch(1)
        return page

    def _build_home_page(self) -> QWidget:
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(32, 32, 32, 32)
        top = QHBoxLayout()
        title = QLabel("Cadastrador de Produtos")
        title.setObjectName("Title")
        refresh_btn = QPushButton("Atualizar marcas")
        refresh_btn.clicked.connect(self.refresh_brands)
        change_login_btn = QPushButton("Trocar login")
        change_login_btn.clicked.connect(self._show_login)
        top.addWidget(title)
        top.addStretch(1)
        top.addWidget(refresh_btn)
        top.addWidget(change_login_btn)
        subtitle = QLabel("Selecione a marca para preparar os produtos.")
        subtitle.setObjectName("Subtitle")
        self.brands_status = QLabel("")
        self.brands_status.setWordWrap(True)
        self.brands_status.setObjectName("Status")
        layout.addLayout(top)
        layout.addWidget(subtitle)
        layout.addWidget(self.brands_status)

        self.brands_grid = QGridLayout()
        self.brands_grid.setSpacing(16)
        layout.addLayout(self.brands_grid)
        layout.addStretch(1)
        return page

    def _build_brand_page(self) -> QWidget:
        page = QWidget()
        root = QVBoxLayout(page)
        root.setContentsMargins(24, 24, 24, 24)

        top = QHBoxLayout()
        back = QPushButton("Voltar")
        back.clicked.connect(lambda: self.stack.setCurrentWidget(self.home_page))
        self.brand_page_title = QLabel("")
        self.brand_page_title.setObjectName("Title")
        top.addWidget(back)
        top.addWidget(self.brand_page_title)
        top.addStretch(1)
        root.addLayout(top)

        content = QHBoxLayout()
        content.setSpacing(18)
        root.addLayout(content, 1)

        collections_box = QGroupBox("Colecoes")
        collections_layout = QVBoxLayout(collections_box)
        self.collections_list = QListWidget()
        self.collections_list.currentItemChanged.connect(self._collection_changed)
        refresh_btn = QPushButton("Atualizar colecoes da API")
        refresh_btn.clicked.connect(self.refresh_collections)
        collections_layout.addWidget(self.collections_list, 1)
        collections_layout.addWidget(refresh_btn)
        content.addWidget(collections_box, 1)

        right = QVBoxLayout()
        content.addLayout(right, 2)

        files_box = QGroupBox("Arquivos da colecao")
        files_layout = QVBoxLayout(files_box)
        self.pdfs_list = QListWidget()
        files_layout.addWidget(self.pdfs_list)
        right.addWidget(files_box, 1)

        self.collection_api_info_label = QLabel("")
        self.collection_api_info_label.setWordWrap(True)
        self.collection_api_info_label.setObjectName("Status")
        right.addWidget(self.collection_api_info_label)

        form_box = QGroupBox("PDFs e paginas")
        form = QFormLayout(form_box)
        self.price_pdf_combo = QComboBox()
        self.catalog_pdf_combo = QComboBox()
        self.price_pages_label = QLabel("-")
        self.catalog_pages_label = QLabel("-")
        self.price_start = self._page_spinbox()
        self.price_end = self._page_spinbox()
        self.catalog_start = self._page_spinbox()
        self.catalog_end = self._page_spinbox()

        self.price_pdf_combo.currentIndexChanged.connect(self._refresh_page_counts)
        self.catalog_pdf_combo.currentIndexChanged.connect(self._refresh_page_counts)

        form.addRow("Tabela de precos de custo", self.price_pdf_combo)
        form.addRow("Paginas da tabela", self.price_pages_label)
        form.addRow("Pagina inicial tabela", self.price_start)
        form.addRow("Pagina final tabela", self.price_end)
        self._add_separator(form)
        form.addRow("Catalogo de produtos", self.catalog_pdf_combo)
        form.addRow("Paginas do catalogo", self.catalog_pages_label)
        form.addRow("Pagina inicial catalogo", self.catalog_start)
        form.addRow("Pagina final catalogo", self.catalog_end)
        right.addWidget(form_box)

        actions = QHBoxLayout()
        self.process_price_btn = QPushButton("Processar precos de custo")
        self.process_price_btn.clicked.connect(self.process_price_table)
        self.validate_price_btn = QPushButton("Validar precos de custo")
        self.validate_price_btn.clicked.connect(self.validate_price_table)
        self.catalog_btn = QPushButton("Buscar imagen")
        self.catalog_btn.clicked.connect(self.search_catalog_images)
        actions.addWidget(self.process_price_btn)
        actions.addWidget(self.validate_price_btn)
        actions.addWidget(self.catalog_btn)
        right.addLayout(actions)

        site_box = QGroupBox("Cadastro no site")
        site_layout = QVBoxLayout(site_box)
        self.pending_products_file_label = QLabel("")
        self.pending_products_file_label.setWordWrap(True)
        self.sent_products_file_label = QLabel("")
        self.sent_products_file_label.setWordWrap(True)
        site_actions = QHBoxLayout()
        refresh_upload_files_btn = QPushButton("Verificar arquivos")
        refresh_upload_files_btn.clicked.connect(self._refresh_upload_files)
        self.upload_products_btn = QPushButton("Enviar dados dos produtos")
        self.upload_products_btn.clicked.connect(self.send_product_file)
        self.upload_images_btn = QPushButton("Enviar imagens")
        self.upload_images_btn.clicked.connect(self.send_product_images)
        site_actions.addWidget(refresh_upload_files_btn)
        site_actions.addWidget(self.upload_products_btn)
        site_actions.addWidget(self.upload_images_btn)
        site_layout.addWidget(self.pending_products_file_label)
        site_layout.addWidget(self.sent_products_file_label)
        site_layout.addLayout(site_actions)
        right.addWidget(site_box)

        products_box = QGroupBox("Produtos cadastrados no site")
        products_layout = QVBoxLayout(products_box)
        products_top = QHBoxLayout()
        self.site_products_status = QLabel("Selecione uma colecao.")
        self.site_products_status.setWordWrap(True)
        refresh_products_btn = QPushButton("Atualizar produtos")
        refresh_products_btn.clicked.connect(self.refresh_site_products)
        products_top.addWidget(self.site_products_status, 1)
        products_top.addWidget(refresh_products_btn)
        self.site_products_list = QListWidget()
        products_layout.addLayout(products_top)
        products_layout.addWidget(self.site_products_list)
        right.addWidget(products_box, 1)

        log_box = QGroupBox("Resultado")
        log_layout = QVBoxLayout(log_box)
        self.log = QTextEdit()
        self.log.setReadOnly(True)
        log_layout.addWidget(self.log)
        right.addWidget(log_box, 1)

        return page

    def _page_spinbox(self) -> QSpinBox:
        spin = QSpinBox()
        spin.setRange(1, 9999)
        spin.setValue(1)
        return spin

    def _add_separator(self, form: QFormLayout) -> None:
        line = QFrame()
        line.setFrameShape(QFrame.HLine)
        line.setFrameShadow(QFrame.Sunken)
        form.addRow(line)

    def _ensure_default_dirs(self) -> None:
        self._ensure_brand_workspace(UP_BABY_DIR)

    def _read_setting(self, key: str) -> str:
        value = self.settings.value(key, "")
        return "" if value is None else str(value)

    def _load_saved_credentials(self) -> None:
        self.username_input.setText(self._read_setting("auth/username"))
        self.password_input.setText(self._read_setting("auth/password"))

    def _restore_session(self) -> None:
        if self.token:
            self.stack.setCurrentWidget(self.home_page)
            self.refresh_brands()
            return

        username = self.username_input.text().strip()
        password = self.password_input.text()
        if username and password:
            self._authenticate(username, password, quiet=True)
            return

        self.stack.setCurrentWidget(self.login_page)

    def login(self) -> None:
        self._authenticate(self.username_input.text().strip(), self.password_input.text())

    def _authenticate(self, username: str, password: str, *, quiet: bool = False) -> None:
        if not username or not password:
            self.stack.setCurrentWidget(self.login_page)
            self.login_status.setText("Informe usuario e senha.")
            if not quiet:
                QMessageBox.warning(self, "Login", "Informe usuario e senha.")
            return

        self.login_btn.setEnabled(False)
        self.login_status.setText("Validando login...")
        QApplication.processEvents()
        try:
            self.token = login_api(username, password)
        except ApiError as exc:
            self.token = ""
            self.settings.remove("auth/token")
            self.stack.setCurrentWidget(self.login_page)
            self.login_status.setText(str(exc))
            if not quiet:
                QMessageBox.warning(self, "Login", str(exc))
            return
        finally:
            self.login_btn.setEnabled(True)

        self.settings.setValue("auth/username", username)
        self.settings.setValue("auth/password", password)
        self.settings.setValue("auth/token", self.token)
        self.stack.setCurrentWidget(self.home_page)
        self.refresh_brands()

    def refresh_brands(self) -> None:
        if not self.token:
            self._show_login()
            return

        self.brands_status.setText("Carregando marcas e colecoes do sistema...")
        QApplication.processEvents()
        try:
            brands = fetch_brands_api(self.token)
            collections = fetch_collections_api(self.token)
        except ApiError as exc:
            self.brands = []
            self.collections_by_brand.clear()
            self._set_brand_buttons([])
            if self._handle_expired_session(exc):
                return
            self.brands_status.setText(f"Nao foi possivel carregar marcas e colecoes: {exc}")
            QMessageBox.warning(self, "Marcas e colecoes", str(exc))
            return

        self.brands = brands
        self.collections_by_brand = {}
        for brand in brands:
            self.collections_by_brand[self._normalized_brand_key(self._brand_key(brand))] = []
        for collection in collections:
            collection_brand = str(collection.get("brand_key") or collection.get("brand") or "").strip()
            key = self._normalized_brand_key(collection_brand)
            self.collections_by_brand.setdefault(key, []).append(collection)

        try:
            created_brands, created_collections = self._sync_all_brand_workspaces()
        except OSError as exc:
            self.brands_status.setText(f"Marcas carregadas, mas falhou ao criar as pastas: {exc}")
            QMessageBox.warning(self, "Pastas locais", str(exc))
            return

        self._set_brand_buttons(brands)
        if brands:
            self.brands_status.setText(
                f"{len(brands)} marca(s) e {len(collections)} colecao(oes) carregadas da API. "
                f"{created_brands} pasta(s) de marca e {created_collections} pasta(s) de colecao criadas."
            )
        else:
            self.brands_status.setText("Nenhuma marca cadastrada foi retornada pelo sistema.")

    def _set_brand_buttons(self, brands: list[dict]) -> None:
        while self.brands_grid.count():
            item = self.brands_grid.takeAt(0)
            widget = item.widget()
            if widget:
                widget.deleteLater()

        brand_buttons: list[tuple[str, dict]] = []
        seen_keys: set[str] = set()
        for brand in brands:
            label = self._brand_label(brand)
            key = self._normalized_brand_key(self._brand_key(brand))
            if not label or not key or key in seen_keys:
                continue
            seen_keys.add(key)
            brand_buttons.append((label, dict(brand)))

        for idx, (label, brand) in enumerate(brand_buttons):
            button = QPushButton(label)
            button.setMinimumHeight(88)
            button.setObjectName("BrandButton")
            button.clicked.connect(
                lambda _checked=False, brand_data=brand: self._open_brand_page(brand_data)
            )
            self.brands_grid.addWidget(button, idx // 2, idx % 2)

    def _brand_label(self, brand: dict) -> str:
        return str(brand.get("name") or brand.get("brand") or brand.get("brand_key") or "").strip()

    def _brand_key(self, brand: dict) -> str:
        return str(
            brand.get("slug")
            or brand.get("brand_key")
            or brand.get("brand")
            or brand.get("name")
            or ""
        ).strip()

    def _brand_directory_name(self, brand_key: str) -> str:
        ascii_key = (
            unicodedata.normalize("NFKD", brand_key)
            .encode("ascii", "ignore")
            .decode("ascii")
        )
        return re.sub(r"[^A-Za-z0-9_-]+", "-", ascii_key).strip("-_").upper()

    def _collection_directory_name(self, collection: dict) -> str:
        year = self._brand_directory_name(str(collection.get("year") or "").strip())
        collection_slug = str(
            collection.get("slug")
            or collection.get("collection")
            or collection.get("name")
            or ""
        ).strip()
        safe_slug = self._brand_directory_name(collection_slug)
        if not safe_slug:
            return ""
        if year and safe_slug != year and not safe_slug.startswith(f"{year}-"):
            return f"{year}-{safe_slug}"
        return safe_slug

    def _collection_label(self, collection: dict) -> str:
        name = str(
            collection.get("name")
            or collection.get("collection")
            or collection.get("slug")
            or ""
        ).strip()
        year = str(collection.get("year") or "").strip()
        if year and name and not name.upper().startswith(year.upper()):
            return f"{year} - {name}"
        return name or year or "Colecao sem nome"

    def _is_up_baby_brand(self, brand: str) -> bool:
        normalized = brand.upper().replace("_", "-").replace(" ", "-")
        return normalized == UP_BABY_BRAND

    def _normalized_brand_key(self, brand: str) -> str:
        return self._brand_directory_name(brand).replace("_", "-")

    def _brand_directory(self, brand_key: str) -> Path:
        if self._is_up_baby_brand(brand_key):
            return UP_BABY_DIR
        return DATA_DIR / self._brand_directory_name(brand_key)

    def _collection_directory(self, brand_dir: Path, collection: dict) -> Path:
        return brand_dir / self._collection_directory_name(collection)

    def _ensure_brand_workspace(self, brand_dir: Path) -> bool:
        brand_created = not brand_dir.is_dir()
        pending_dir = brand_dir / "1_PRODUTOS_PARA_CADASTRA"
        sent_dir = brand_dir / "1_PRODUTOS_ENVIADOS"
        history_dir = brand_dir / "1_PRODUTOS_HISTORICO"
        colors_dir = brand_dir / "CORES"
        for directory in (
            brand_dir,
            pending_dir,
            sent_dir,
            history_dir,
            colors_dir,
            pending_dir / "IMAGEMS",
            sent_dir / "IMAGEMS",
        ):
            directory.mkdir(parents=True, exist_ok=True)
        return brand_created

    def _sync_all_brand_workspaces(self) -> tuple[int, int]:
        created_brands = 0
        created_collections = 0
        for brand in self.brands:
            brand_key = self._brand_key(brand)
            if not brand_key:
                continue
            brand_dir = self._brand_directory(brand_key)
            if self._ensure_brand_workspace(brand_dir):
                created_brands += 1
            for collection in self.collections_by_brand.get(self._normalized_brand_key(brand_key), []):
                directory_name = self._collection_directory_name(collection)
                if not directory_name:
                    continue
                collection_dir = brand_dir / directory_name
                if not collection_dir.is_dir():
                    created_collections += 1
                collection_dir.mkdir(parents=True, exist_ok=True)
        return created_brands, created_collections

    def _activate_brand(self, brand: dict) -> None:
        self.active_brand = dict(brand)
        self.active_brand_label = self._brand_label(brand)
        self.active_brand_key = self._brand_key(brand)
        self.active_brand_dir = self._brand_directory(self.active_brand_key)
        self._ensure_brand_workspace(self.active_brand_dir)
        self.active_pending_dir = self.active_brand_dir / "1_PRODUTOS_PARA_CADASTRA"
        self.active_sent_dir = self.active_brand_dir / "1_PRODUTOS_ENVIADOS"
        self.active_history_dir = self.active_brand_dir / "1_PRODUTOS_HISTORICO"
        self.active_colors_dir = self.active_brand_dir / "CORES"
        self.active_pending_images_dir = self.active_pending_dir / "IMAGEMS"
        self.active_sent_images_dir = self.active_sent_dir / "IMAGEMS"

    def _open_brand_page(self, brand: dict) -> None:
        self._activate_brand(brand)
        self.brand_page_title.setText(self.active_brand_label)
        self.stack.setCurrentWidget(self.brand_page)
        collections = self.collections_by_brand.get(self._normalized_brand_key(self.active_brand_key), [])
        self.suppress_empty_collection_message = True
        try:
            self._populate_active_collections(collections)
        finally:
            self.suppress_empty_collection_message = False
        self._show_brand_workspace_message(collections)
        self._show_active_empty_collection_message()

    def _show_login(self) -> None:
        self.token = ""
        self.settings.remove("auth/token")
        self.login_status.setText("Entre para carregar as marcas cadastradas.")
        self.stack.setCurrentWidget(self.login_page)
        self.username_input.setFocus()

    def _handle_expired_session(self, exc: Exception) -> bool:
        if "401" not in str(exc) and "invalid token" not in str(exc).lower():
            return False
        self.token = ""
        self.settings.remove("auth/token")
        self.login_status.setText("A sessao expirou. Clique em Entrar para renovar o acesso.")
        self.stack.setCurrentWidget(self.login_page)
        self.username_input.setFocus()
        return True

    def _refresh_upload_files(self) -> None:
        if not self.active_pending_dir or not self.active_sent_dir:
            return
        prefix = self._active_collection_prefix()
        pending_file = self._latest_products_file(self.active_pending_dir, prefix)
        sent_file = self._latest_products_file(self.active_sent_dir, prefix)
        if pending_file:
            self.pending_products_file_label.setText(f"Arquivo pronto para enviar dados: {pending_file.name}")
        else:
            self.pending_products_file_label.setText("Arquivo pronto para enviar dados: nenhum JSON com imagens encontrado.")
        if sent_file:
            self.sent_products_file_label.setText(f"Arquivo para envio de imagens: {sent_file.name}")
        else:
            self.sent_products_file_label.setText("Arquivo para envio de imagens: envie primeiro os dados dos produtos.")

    def send_product_file(self) -> None:
        if not self.token:
            self._show_login()
            return

        context = self._active_collection_context()
        if not context or not self.active_pending_dir or not self.active_sent_dir:
            QMessageBox.warning(self, "Colecao", "Selecione uma colecao cadastrada na API.")
            return

        product_file = self._latest_products_file(self.active_pending_dir, context["directory_name"])
        if not product_file:
            QMessageBox.warning(
                self,
                "Arquivo de produtos",
                "Nenhum JSON com dados e imagens foi encontrado na pasta de produtos para cadastrar.",
            )
            self._refresh_upload_files()
            return

        collection_data = context["data"]
        year = str(collection_data.get("year") or "").strip()
        collection = str(collection_data.get("name") or collection_data.get("slug") or "").strip()
        collection_slug = str(collection_data.get("slug") or collection).strip()

        self._set_upload_buttons_enabled(False)
        self._log(f"Enviando dados dos produtos: {product_file.name}.")
        QApplication.processEvents()
        try:
            response = import_products_file_api(
                self.token,
                product_file,
                self.active_brand_key,
                year,
                collection,
                collection_slug,
            )
            sent_file = self._move_file_to_dir(product_file, self.active_sent_dir)
        except (ApiError, OSError) as exc:
            self._log(f"Falha ao enviar dados dos produtos: {exc}")
            if isinstance(exc, ApiError) and self._handle_expired_session(exc):
                return
            QMessageBox.critical(self, "Envio de produtos", str(exc))
            return
        finally:
            self._set_upload_buttons_enabled(True)

        imported_count = int(response.get("imported_count") or 0)
        self._log(f"Produtos enviados: {imported_count}.")
        self._log(f"Arquivo movido para enviados: {sent_file}")
        self._refresh_upload_files()
        self.refresh_site_products()
        QMessageBox.information(self, "Envio de produtos", f"{imported_count} produto(s) enviado(s).")

    def send_product_images(self) -> None:
        if not self.token:
            self._show_login()
            return

        context = self._active_collection_context()
        if (
            not context
            or not self.active_sent_dir
            or not self.active_pending_images_dir
            or not self.active_sent_images_dir
        ):
            QMessageBox.warning(self, "Colecao", "Selecione uma colecao cadastrada na API.")
            return

        product_file = self._latest_products_file(self.active_sent_dir, context["directory_name"])
        if not product_file:
            QMessageBox.warning(
                self,
                "Arquivo enviado",
                "Envie os dados dos produtos antes de enviar as imagens.",
            )
            self._refresh_upload_files()
            return

        try:
            products = self._read_product_file(product_file)
        except (OSError, json.JSONDecodeError, ValueError) as exc:
            QMessageBox.critical(self, "Arquivo enviado", f"Nao foi possivel ler {product_file.name}: {exc}")
            return

        sent_count = 0
        skipped_count = 0
        failed_count = 0
        self._set_upload_buttons_enabled(False)
        self._log(f"Enviando imagens listadas em: {product_file.name}.")
        try:
            for product in products:
                product_id = str(product.get("UUID") or product.get("id") or "").strip()
                image_names = product.get("imagem") or product.get("images") or []
                if isinstance(image_names, str):
                    image_names = [image_names]
                if not product_id or not isinstance(image_names, list):
                    failed_count += len(image_names) if isinstance(image_names, list) else 1
                    continue

                for image_name in image_names:
                    file_name = Path(str(image_name)).name
                    source_image = self.active_pending_images_dir / file_name
                    sent_image = self.active_sent_images_dir / file_name
                    if sent_image.exists():
                        skipped_count += 1
                        continue
                    if not source_image.exists():
                        failed_count += 1
                        self._log(f"Imagem nao encontrada para {product_id}: {source_image}")
                        continue

                    QApplication.processEvents()
                    try:
                        upload_product_image_api(self.token, product_id, source_image)
                        moved_image = self._move_file_to_dir(source_image, self.active_sent_images_dir)
                    except (ApiError, OSError) as exc:
                        failed_count += 1
                        self._log(f"Falha ao enviar {source_image.name} do produto {product_id}: {exc}")
                        if isinstance(exc, ApiError) and self._handle_expired_session(exc):
                            return
                        continue

                    sent_count += 1
                    self._log(f"Imagem enviada e movida: {moved_image.name}")
        finally:
            self._set_upload_buttons_enabled(True)

        self._refresh_upload_files()
        self.refresh_site_products()
        summary = f"{sent_count} imagem(ns) enviada(s), {skipped_count} ja enviada(s), {failed_count} com falha."
        if failed_count:
            QMessageBox.warning(self, "Envio de imagens", summary)
        else:
            QMessageBox.information(self, "Envio de imagens", summary)

    def _latest_products_file(self, directory: Path, collection_prefix: str = "") -> Path | None:
        pattern = (
            f"{collection_prefix}_produtos_com_imagens_*.json"
            if collection_prefix
            else "*_produtos_com_imagens_*.json"
        )
        files = sorted(
            directory.glob(pattern),
            key=lambda path: path.stat().st_mtime,
            reverse=True,
        )
        return files[0] if files else None

    def _read_product_file(self, product_file: Path) -> list[dict]:
        payload = json.loads(product_file.read_text(encoding="utf-8"))
        if not isinstance(payload, list):
            raise ValueError("o JSON deve conter uma lista de produtos")
        return [product for product in payload if isinstance(product, dict)]

    def _archive_pending_root_files(self, keep_file: Path) -> int:
        if not self.active_pending_dir or not self.active_history_dir:
            return 0
        collection_prefix = self._active_collection_prefix()
        archived_count = 0
        for file_path in self.active_pending_dir.iterdir():
            if not file_path.is_file() or file_path == keep_file:
                continue
            if collection_prefix and not file_path.name.startswith(collection_prefix):
                continue
            self._move_file_to_dir(file_path, self.active_history_dir)
            archived_count += 1
        return archived_count

    def _move_file_to_dir(self, source: Path, destination_dir: Path) -> Path:
        destination_dir.mkdir(parents=True, exist_ok=True)
        destination = destination_dir / source.name
        sequence = 1
        while destination.exists():
            destination = destination_dir / f"{source.stem}_{sequence}{source.suffix}"
            sequence += 1
        return Path(shutil.move(str(source), str(destination)))

    def refresh_collections(self) -> None:
        if not self.token:
            self._show_login()
            return
        if not self.active_brand_key:
            return
        try:
            collections = fetch_collections_api(self.token, self.active_brand_key)
        except ApiError as exc:
            if self._handle_expired_session(exc):
                return
            QMessageBox.warning(self, "Colecoes", str(exc))
            return
        self.collections_by_brand[self._normalized_brand_key(self.active_brand_key)] = collections
        if self.active_brand_dir:
            for collection in collections:
                self._collection_directory(self.active_brand_dir, collection).mkdir(parents=True, exist_ok=True)
        self.suppress_empty_collection_message = True
        try:
            self._populate_active_collections(collections)
        finally:
            self.suppress_empty_collection_message = False
        self._show_brand_workspace_message(collections, "Colecoes atualizadas pela API.")
        self._show_active_empty_collection_message()

    def _populate_active_collections(self, collections: list[dict]) -> None:
        previous_slug = ""
        previous_context = self._active_collection_context()
        if previous_context:
            previous_slug = str(previous_context["data"].get("slug") or "")

        self.collection_contexts.clear()
        self.collections_list.clear()
        self.active_collection = None
        self.price_pdf_combo.clear()
        self.catalog_pdf_combo.clear()
        self.pdfs_list.clear()
        self.site_products_list.clear()
        if not self.active_brand_dir:
            return

        selected_row = 0
        for collection in sorted(
            collections,
            key=lambda item: (
                str(item.get("year") or ""),
                str(item.get("name") or item.get("slug") or "").lower(),
            ),
        ):
            directory_name = self._collection_directory_name(collection)
            if not directory_name:
                continue
            collection_dir = self.active_brand_dir / directory_name
            collection_dir.mkdir(parents=True, exist_ok=True)

            label = self._collection_label(collection)
            original_label = label
            sequence = 2
            while label in self.collection_contexts:
                label = f"{original_label} ({sequence})"
                sequence += 1
            self.collection_contexts[label] = {
                "data": dict(collection),
                "path": collection_dir,
                "directory_name": directory_name,
            }
            self.collections_list.addItem(QListWidgetItem(label))
            if previous_slug and str(collection.get("slug") or "") == previous_slug:
                selected_row = self.collections_list.count() - 1

        if self.collections_list.count():
            self.collections_list.setCurrentRow(selected_row)
        else:
            self.collection_api_info_label.setText("Nenhuma colecao cadastrada na API para esta marca.")
            self.site_products_status.setText("Nenhuma colecao selecionada.")
            self._refresh_upload_files()

    def _active_collection_context(self) -> dict | None:
        current = self.collections_list.currentItem()
        if not current:
            return None
        return self.collection_contexts.get(current.text())

    def _active_collection_prefix(self) -> str:
        context = self._active_collection_context()
        return str(context.get("directory_name") or "") if context else ""

    def _collection_changed(self, current: QListWidgetItem | None, _previous: QListWidgetItem | None) -> None:
        self.price_pdf_combo.clear()
        self.catalog_pdf_combo.clear()
        self.pdfs_list.clear()
        self.site_products_list.clear()
        if not current:
            self.active_collection = None
            self.collection_api_info_label.setText("")
            self.site_products_status.setText("Selecione uma colecao.")
            return

        context = self.collection_contexts.get(current.text())
        if not context:
            return
        self.active_collection = context["data"]
        collection_dir = context["path"]
        entries = sorted(collection_dir.iterdir(), key=lambda path: (not path.is_dir(), path.name.lower()))
        pdfs = [path for path in entries if path.is_file() and path.suffix.lower() == ".pdf"]
        for entry in entries:
            suffix = " [pasta]" if entry.is_dir() else ""
            self.pdfs_list.addItem(f"{entry.name}{suffix}")
        for pdf in pdfs:
            self.price_pdf_combo.addItem(pdf.name, pdf)
            self.catalog_pdf_combo.addItem(pdf.name, pdf)

        collection = context["data"]
        spread = collection.get("spread_default_percent")
        credit = collection.get("credit_colore_max_amount")
        display_start = str(collection.get("display_start_at") or "-")
        display_end = str(collection.get("display_end_at") or "-")
        coupons = collection.get("coupons") or []
        coupon_labels = [
            f"{coupon.get('code')} (-{coupon.get('spread_reduction_percent')}%)"
            for coupon in coupons
            if isinstance(coupon, dict) and coupon.get("code")
        ]
        if not coupon_labels and collection.get("coupon_code"):
            coupon_labels.append(
                f"{collection.get('coupon_code')} "
                f"(-{collection.get('coupon_spread_reduction_percent') or 0}%)"
            )
        coupon_summary = ", ".join(coupon_labels) if coupon_labels else "nenhum"
        self.collection_api_info_label.setText(
            "Dados atuais da API - "
            f"slug: {collection.get('slug') or '-'} | ano: {collection.get('year') or '-'} | "
            f"spread padrao: {spread if spread is not None else '-'}% | "
            f"credito Colore maximo: {credit if credit is not None else '-'} | "
            f"cupons: {coupon_summary} | exibicao: {display_start} ate {display_end}\n"
            f"Pasta local: {collection_dir}"
        )
        self._select_default_pdfs()
        self._refresh_page_counts()
        self._refresh_upload_files()
        self.refresh_site_products()
        self._log(f"Colecao selecionada: {current.text()} ({len(pdfs)} PDF(s)).")
        if not entries and not self.suppress_empty_collection_message:
            self._show_active_empty_collection_message()

    def _select_default_pdfs(self) -> None:
        price_index = -1
        for idx in range(self.price_pdf_combo.count()):
            name = self.price_pdf_combo.itemText(idx).lower()
            if "tabela" in name or "preco" in name or "preço" in name:
                price_index = idx
                self.price_pdf_combo.setCurrentIndex(idx)
                break

        catalog_index = -1
        for idx in range(self.catalog_pdf_combo.count()):
            name = self.catalog_pdf_combo.itemText(idx).lower()
            if "catalogo" in name or "catálogo" in name:
                catalog_index = idx
                self.catalog_pdf_combo.setCurrentIndex(idx)
                break
        if catalog_index < 0 and self.catalog_pdf_combo.count() > 1:
            for idx in range(self.catalog_pdf_combo.count()):
                if idx != price_index:
                    self.catalog_pdf_combo.setCurrentIndex(idx)
                    break

    def refresh_site_products(self) -> None:
        context = self._active_collection_context()
        if not context or not self.token:
            self.site_products_list.clear()
            self.site_products_status.setText("Selecione uma colecao.")
            return

        collection = context["data"]
        year = str(collection.get("year") or "").strip()
        slug = str(collection.get("slug") or collection.get("name") or "").strip()
        self.site_products_status.setText("Carregando produtos da API...")
        QApplication.processEvents()
        try:
            products = fetch_products_api(self.token, self.active_brand_key, year, slug)
        except ApiError as exc:
            self.site_products_list.clear()
            if self._handle_expired_session(exc):
                return
            self.site_products_status.setText(f"Nao foi possivel carregar os produtos: {exc}")
            return

        self.site_products_list.clear()
        for product in sorted(
            products,
            key=lambda item: str(item.get("produto_id") or item.get("id") or ""),
        ):
            product_id = str(product.get("produto_id") or product.get("id") or "-")
            description = str(product.get("description") or product.get("name") or "Sem descricao")
            cost = float(product.get("cost_price") or 0)
            final_price = float(product.get("price") or 0)
            active = "ativo" if product.get("is_active", True) else "inativo"
            self.site_products_list.addItem(
                f"{product_id} | {description} | custo: R$ {cost:.2f} | "
                f"venda: R$ {final_price:.2f} | {active}"
            )
        self.site_products_status.setText(
            f"{len(products)} produto(s) retornado(s) pelo backend para esta marca e colecao."
        )

    def _show_brand_workspace_message(self, collections: list[dict], heading: str = "") -> None:
        if not self.active_brand_dir:
            return
        if not heading:
            heading = "Pastas da marca e das colecoes sincronizadas com sucesso."
        lines = []
        for collection in collections:
            collection_dir = self._collection_directory(self.active_brand_dir, collection)
            lines.append(f"- {self._collection_label(collection)}: {collection_dir}")
        collection_summary = "\n".join(lines) if lines else "- nenhuma colecao cadastrada na API"
        QMessageBox.information(
            self,
            self.active_brand_label,
            (
                f"{heading}\n\nPasta da marca:\n{self.active_brand_dir}\n\n"
                f"Pastas das colecoes cadastradas no site:\n{collection_summary}\n\n"
                "Em cada pasta de colecao, adicione:\n"
                "- o PDF da tabela de valores;\n"
                "- o PDF do catalogo de produtos com as imagens.\n\n"
                "Marcas, colecoes, configuracoes de preco e produtos sao consultados no backend."
            ),
        )

    def _show_active_empty_collection_message(self) -> None:
        context = self._active_collection_context()
        if not context:
            return
        collection_dir = context["path"]
        if any(collection_dir.iterdir()):
            return
        QMessageBox.information(
            self,
            "Colecao vazia",
            (
                "Esta colecao esta vazia. Adicione nesta pasta o PDF da tabela de valores "
                f"e o PDF do catalogo de produtos com as imagens:\n{collection_dir}"
            ),
        )

    def _refresh_page_counts(self) -> None:
        self._set_page_info(self.price_pdf_combo, self.price_pages_label, self.price_start, self.price_end)
        self._set_page_info(self.catalog_pdf_combo, self.catalog_pages_label, self.catalog_start, self.catalog_end)

    def _set_page_info(self, combo: QComboBox, label: QLabel, start: QSpinBox, end: QSpinBox) -> None:
        pdf_path = combo.currentData()
        if not pdf_path:
            label.setText("-")
            return
        try:
            pages = count_pdf_pages(pdf_path)
            label.setText(f"{pages} pagina(s)")
            start.setMaximum(max(1, pages))
            end.setMaximum(max(1, pages))
            if end.value() == 1 or end.value() > pages:
                end.setValue(pages)
        except Exception as exc:
            label.setText(f"Erro ao contar paginas: {exc}")

    def process_price_table(self) -> None:
        selection = self._get_price_selection()
        if not selection:
            return
        current, pdf_path, start_page, end_page = selection
        context = self._active_collection_context()
        if not context or not self.active_pending_dir:
            return

        self._set_price_buttons_enabled(False)
        self._log(f"Processando tabela: {Path(pdf_path).name}, paginas {start_page}-{end_page}.")

        self.thread = QThread()
        self.worker = PriceProcessWorker(
            pdf_path=Path(pdf_path),
            output_dir=self.active_pending_dir,
            collection=context["directory_name"],
            start_page=start_page,
            end_page=end_page,
        )
        self.worker.moveToThread(self.thread)
        self.thread.started.connect(self.worker.run)
        self.worker.finished.connect(self._price_process_finished)
        self.worker.failed.connect(self._price_process_failed)
        self.worker.finished.connect(self.thread.quit)
        self.worker.failed.connect(self.thread.quit)
        self.thread.finished.connect(self.worker.deleteLater)
        self.thread.finished.connect(self.thread.deleteLater)
        self.thread.finished.connect(self._thread_finished)
        self.thread.start()

    def validate_price_table(self) -> None:
        selection = self._get_price_selection()
        if not selection:
            return
        current, pdf_path, start_page, end_page = selection
        context = self._active_collection_context()
        if not context or not self.active_pending_dir:
            return

        self._set_price_buttons_enabled(False)
        self._log(f"Validando tabela: {Path(pdf_path).name}, paginas {start_page}-{end_page}.")

        self.thread = QThread()
        self.worker = PriceValidationWorker(
            pdf_path=Path(pdf_path),
            output_dir=self.active_pending_dir,
            collection=context["directory_name"],
            start_page=start_page,
            end_page=end_page,
        )
        self.worker.moveToThread(self.thread)
        self.thread.started.connect(self.worker.run)
        self.worker.finished.connect(self._price_validation_finished)
        self.worker.failed.connect(self._price_validation_failed)
        self.worker.finished.connect(self.thread.quit)
        self.worker.failed.connect(self.thread.quit)
        self.thread.finished.connect(self.worker.deleteLater)
        self.thread.finished.connect(self.thread.deleteLater)
        self.thread.finished.connect(self._thread_finished)
        self.thread.start()

    def search_catalog_images(self) -> None:
        current = self.collections_list.currentItem()
        catalog_pdf_path = self.catalog_pdf_combo.currentData()
        context = self._active_collection_context()
        if (
            not current
            or not context
            or not catalog_pdf_path
            or not self.active_pending_dir
            or not self.active_colors_dir
        ):
            QMessageBox.warning(self, "Dados incompletos", "Selecione a colecao e o PDF do catalogo de produtos.")
            return

        start_page = self.catalog_start.value()
        end_page = self.catalog_end.value()
        if end_page < start_page:
            QMessageBox.warning(self, "Paginas invalidas", "A pagina final do catalogo deve ser maior ou igual a inicial.")
            return

        price_json_path = find_latest_price_json(self.active_pending_dir, context["directory_name"])
        if not price_json_path:
            QMessageBox.warning(
                self,
                "Tabela de valores obrigatoria",
                "Antes de buscar imagens, gere o JSON usando o botao 'Processar tabela de valores'.",
            )
            return

        self._set_price_buttons_enabled(False)
        self._log(f"Buscando imagens no catalogo: {Path(catalog_pdf_path).name}, paginas {start_page}-{end_page}.")
        self._log(f"JSON de tabela usado: {price_json_path}")

        self.thread = QThread()
        self.worker = CatalogImageWorker(
            catalog_pdf_path=Path(catalog_pdf_path),
            price_json_path=price_json_path,
            output_dir=self.active_pending_dir,
            colors_dir=self.active_colors_dir,
            collection=context["directory_name"],
            start_page=start_page,
            end_page=end_page,
        )
        self.worker.moveToThread(self.thread)
        self.thread.started.connect(self.worker.run)
        self.worker.finished.connect(self._catalog_image_finished)
        self.worker.failed.connect(self._catalog_image_failed)
        self.worker.finished.connect(self.thread.quit)
        self.worker.failed.connect(self.thread.quit)
        self.thread.finished.connect(self.worker.deleteLater)
        self.thread.finished.connect(self.thread.deleteLater)
        self.thread.finished.connect(self._thread_finished)
        self.thread.start()

    def _get_price_selection(self) -> tuple[QListWidgetItem, Path, int, int] | None:
        current = self.collections_list.currentItem()
        pdf_path = self.price_pdf_combo.currentData()
        if not current or not pdf_path:
            QMessageBox.warning(self, "Dados incompletos", "Selecione a colecao e o PDF da tabela de valores.")
            return None
        start_page = self.price_start.value()
        end_page = self.price_end.value()
        if end_page < start_page:
            QMessageBox.warning(self, "Paginas invalidas", "A pagina final da tabela deve ser maior ou igual a inicial.")
            return None
        return current, Path(pdf_path), start_page, end_page

    @Slot(object)
    def _price_process_finished(self, result: object) -> None:
        self._log(f"Produtos extraidos: {len(result.records)}")
        self._log(f"JSON salvo em: {result.json_path}")
        self._log(f"Excel salvo em: {result.excel_path}")
        self._log("Use 'Validar tabela de valores' para gerar a planilha de conferencia.")
        QMessageBox.information(self, "Processamento concluido", f"{len(result.records)} registros extraidos.")

    @Slot(str)
    def _price_process_failed(self, detail: str) -> None:
        self._log("Falha no processamento.")
        self._log(detail)
        QMessageBox.critical(self, "Erro ao processar", detail.splitlines()[0] if detail else "Erro desconhecido.")

    @Slot(object)
    def _price_validation_finished(self, result: object) -> None:
        ok_count = len(result.rows) - len(result.issues)
        self._log(f"Linhas conferidas: {len(result.rows)}")
        self._log(f"Linhas OK: {ok_count}")
        self._log(f"Linhas para revisar: {len(result.issues)}")
        self._log(f"Relatorio JSON: {result.json_path}")
        self._log(f"Relatorio Excel: {result.excel_path}")

        if result.issues:
            QMessageBox.warning(
                self,
                "Validacao concluida",
                f"{len(result.issues)} linha(s) precisam de revisao. Abra a aba 'revisar' no Excel gerado.",
            )
        else:
            QMessageBox.information(self, "Validacao concluida", "Nenhuma divergencia encontrada.")

    @Slot(str)
    def _price_validation_failed(self, detail: str) -> None:
        self._log("Falha na validacao.")
        self._log(detail)
        QMessageBox.critical(self, "Erro ao validar", detail.splitlines()[0] if detail else "Erro desconhecido.")

    @Slot(object)
    def _catalog_image_finished(self, result: object) -> None:
        try:
            archived_count = self._archive_pending_root_files(result.output_json_path)
        except OSError as exc:
            archived_count = 0
            self._log(f"Nao foi possivel mover arquivos antigos para historico: {exc}")

        self._log(f"Produtos no JSON: {result.products_count}")
        self._log(f"Imagens salvas: {result.images_count}")
        self._log(f"Produtos sem imagem: {result.products_without_images}")
        self._log(f"Cores encontradas no catalogo: {result.colors_found_count}")
        self._log(f"Cores novas cadastradas: {result.new_colors_count}")
        self._log(f"Pasta de imagens: {result.image_dir}")
        self._log(f"JSON com imagens: {result.output_json_path}")
        self._log(f"Arquivos antigos movidos para historico: {archived_count}")
        self._log(f"JSON de cores: {result.colors_json_path}")
        self._refresh_upload_files()
        QMessageBox.information(
            self,
            "Busca concluida",
            f"{result.images_count} imagem(ns) salva(s). {result.products_without_images} produto(s) ficaram sem imagem.",
        )

    @Slot(str)
    def _catalog_image_failed(self, detail: str) -> None:
        self._log("Falha ao buscar imagens.")
        self._log(detail)
        QMessageBox.critical(self, "Erro ao buscar imagens", detail.splitlines()[0] if detail else "Erro desconhecido.")

    def _thread_finished(self) -> None:
        self._set_price_buttons_enabled(True)
        self.thread = None
        self.worker = None

    def _set_price_buttons_enabled(self, enabled: bool) -> None:
        self.process_price_btn.setEnabled(enabled)
        self.validate_price_btn.setEnabled(enabled)
        self.catalog_btn.setEnabled(enabled)
        self.collections_list.setEnabled(enabled)

    def _set_upload_buttons_enabled(self, enabled: bool) -> None:
        self.upload_products_btn.setEnabled(enabled)
        self.upload_images_btn.setEnabled(enabled)

    def _log(self, message: str) -> None:
        self.log.append(message)


def main() -> int:
    app = QApplication(sys.argv)
    app.setStyleSheet(
        """
        QWidget { font-size: 14px; }
        QLabel#Title { font-size: 26px; font-weight: 700; }
        QLabel#Subtitle { color: #555; margin-bottom: 14px; }
        QPushButton { min-height: 34px; padding: 6px 12px; }
        QPushButton#BrandButton { font-size: 22px; font-weight: 700; }
        QGroupBox { font-weight: 700; margin-top: 12px; }
        QGroupBox::title { subcontrol-origin: margin; left: 8px; padding: 0 4px; }
        QTextEdit { font-family: Consolas, monospace; }
        """
    )
    window = MainWindow()
    window.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
