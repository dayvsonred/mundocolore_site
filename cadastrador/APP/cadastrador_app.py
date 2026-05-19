from __future__ import annotations

import sys
import traceback
from pathlib import Path

from catalog_image_finder import find_latest_price_json, process_catalog_images
from price_extractor import ExtractionError, count_pdf_pages, process_price_pdf, validate_price_pdf


try:
    from PySide6.QtCore import QObject, QThread, Signal, Slot
    from PySide6.QtWidgets import (
        QApplication,
        QComboBox,
        QFormLayout,
        QFrame,
        QGridLayout,
        QGroupBox,
        QHBoxLayout,
        QLabel,
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
UP_BABY_PENDING_DIR = UP_BABY_DIR / "1_PRODUTOS_PARA_CADASTRA"
UP_BABY_SENT_DIR = UP_BABY_DIR / "1_PRODUTOS_ENVIADOS"
UP_BABY_COLORS_DIR = UP_BABY_DIR / "CORES"
SYSTEM_FOLDERS = {"1_PRODUTOS_PARA_CADASTRA", "1_PRODUTOS_ENVIADOS", "CORES"}
BRANDS = ["UP-BABY", "3EJA", "QUIMIBY", "PRECOCE"]


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
        self.resize(1080, 720)
        self.thread: QThread | None = None
        self.worker: QObject | None = None

        self.stack = QStackedWidget()
        self.setCentralWidget(self.stack)

        self.home_page = self._build_home_page()
        self.up_baby_page = self._build_up_baby_page()
        self.stack.addWidget(self.home_page)
        self.stack.addWidget(self.up_baby_page)

        self._ensure_default_dirs()
        self.refresh_collections()

    def _build_home_page(self) -> QWidget:
        page = QWidget()
        layout = QVBoxLayout(page)
        layout.setContentsMargins(32, 32, 32, 32)
        title = QLabel("Cadastrador de Produtos")
        title.setObjectName("Title")
        subtitle = QLabel("Selecione a marca para preparar os produtos.")
        subtitle.setObjectName("Subtitle")
        layout.addWidget(title)
        layout.addWidget(subtitle)

        grid = QGridLayout()
        grid.setSpacing(16)
        for idx, brand in enumerate(BRANDS):
            button = QPushButton(brand)
            button.setMinimumHeight(88)
            button.setObjectName("BrandButton")
            if brand == "UP-BABY":
                button.clicked.connect(lambda _checked=False: self.stack.setCurrentWidget(self.up_baby_page))
            else:
                button.clicked.connect(lambda _checked=False, name=brand: self._show_pending_brand(name))
            grid.addWidget(button, idx // 2, idx % 2)
        layout.addLayout(grid)
        layout.addStretch(1)
        return page

    def _build_up_baby_page(self) -> QWidget:
        page = QWidget()
        root = QVBoxLayout(page)
        root.setContentsMargins(24, 24, 24, 24)

        top = QHBoxLayout()
        back = QPushButton("Voltar")
        back.clicked.connect(lambda: self.stack.setCurrentWidget(self.home_page))
        title = QLabel("UP-BABY")
        title.setObjectName("Title")
        top.addWidget(back)
        top.addWidget(title)
        top.addStretch(1)
        root.addLayout(top)

        content = QHBoxLayout()
        content.setSpacing(18)
        root.addLayout(content, 1)

        collections_box = QGroupBox("Colecoes")
        collections_layout = QVBoxLayout(collections_box)
        self.collections_list = QListWidget()
        self.collections_list.currentItemChanged.connect(self._collection_changed)
        refresh_btn = QPushButton("Atualizar lista")
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

        form.addRow("Tabela de valores", self.price_pdf_combo)
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
        self.process_price_btn = QPushButton("Processar tabela de valores")
        self.process_price_btn.clicked.connect(self.process_price_table)
        self.validate_price_btn = QPushButton("Validar tabela de valores")
        self.validate_price_btn.clicked.connect(self.validate_price_table)
        self.catalog_btn = QPushButton("Buscar imagen")
        self.catalog_btn.clicked.connect(self.search_catalog_images)
        self.site_btn = QPushButton("Cadastrar no site")
        self.site_btn.clicked.connect(self._site_not_implemented)
        actions.addWidget(self.process_price_btn)
        actions.addWidget(self.validate_price_btn)
        actions.addWidget(self.catalog_btn)
        actions.addWidget(self.site_btn)
        right.addLayout(actions)

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
        UP_BABY_PENDING_DIR.mkdir(parents=True, exist_ok=True)
        UP_BABY_SENT_DIR.mkdir(parents=True, exist_ok=True)
        UP_BABY_COLORS_DIR.mkdir(parents=True, exist_ok=True)

    def refresh_collections(self) -> None:
        self.collections_list.clear()
        if not UP_BABY_DIR.exists():
            self._log(f"Pasta nao encontrada: {UP_BABY_DIR}")
            return
        collections = [
            path.name
            for path in UP_BABY_DIR.iterdir()
            if path.is_dir() and path.name not in SYSTEM_FOLDERS
        ]
        for name in sorted(collections):
            self.collections_list.addItem(QListWidgetItem(name))
        if self.collections_list.count():
            self.collections_list.setCurrentRow(0)

    def _collection_changed(self, current: QListWidgetItem | None, _previous: QListWidgetItem | None) -> None:
        self.price_pdf_combo.clear()
        self.catalog_pdf_combo.clear()
        self.pdfs_list.clear()
        if not current:
            return
        collection_dir = UP_BABY_DIR / current.text()
        pdfs = sorted(collection_dir.glob("*.pdf"))
        for pdf in pdfs:
            self.pdfs_list.addItem(pdf.name)
            self.price_pdf_combo.addItem(pdf.name, pdf)
            self.catalog_pdf_combo.addItem(pdf.name, pdf)

        self._select_default_pdfs()
        self._refresh_page_counts()
        self._log(f"Colecao selecionada: {current.text()} ({len(pdfs)} PDF(s)).")

    def _select_default_pdfs(self) -> None:
        for idx in range(self.price_pdf_combo.count()):
            name = self.price_pdf_combo.itemText(idx).lower()
            if "tabela" in name or "preco" in name or "preço" in name:
                self.price_pdf_combo.setCurrentIndex(idx)
                break
        for idx in range(self.catalog_pdf_combo.count()):
            name = self.catalog_pdf_combo.itemText(idx).lower()
            if "catalogo" in name or "catálogo" in name or "up baby" in name:
                self.catalog_pdf_combo.setCurrentIndex(idx)
                break

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

        self._set_price_buttons_enabled(False)
        self._log(f"Processando tabela: {Path(pdf_path).name}, paginas {start_page}-{end_page}.")

        self.thread = QThread()
        self.worker = PriceProcessWorker(
            pdf_path=Path(pdf_path),
            output_dir=UP_BABY_PENDING_DIR,
            collection=current.text(),
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

        self._set_price_buttons_enabled(False)
        self._log(f"Validando tabela: {Path(pdf_path).name}, paginas {start_page}-{end_page}.")

        self.thread = QThread()
        self.worker = PriceValidationWorker(
            pdf_path=Path(pdf_path),
            output_dir=UP_BABY_PENDING_DIR,
            collection=current.text(),
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
        if not current or not catalog_pdf_path:
            QMessageBox.warning(self, "Dados incompletos", "Selecione a colecao e o PDF do catalogo de produtos.")
            return

        start_page = self.catalog_start.value()
        end_page = self.catalog_end.value()
        if end_page < start_page:
            QMessageBox.warning(self, "Paginas invalidas", "A pagina final do catalogo deve ser maior ou igual a inicial.")
            return

        price_json_path = find_latest_price_json(UP_BABY_PENDING_DIR, current.text())
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
            output_dir=UP_BABY_PENDING_DIR,
            colors_dir=UP_BABY_COLORS_DIR,
            collection=current.text(),
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
        self._log(f"Produtos no JSON: {result.products_count}")
        self._log(f"Imagens salvas: {result.images_count}")
        self._log(f"Produtos sem imagem: {result.products_without_images}")
        self._log(f"Cores encontradas no catalogo: {result.colors_found_count}")
        self._log(f"Cores novas cadastradas: {result.new_colors_count}")
        self._log(f"Pasta de imagens: {result.image_dir}")
        self._log(f"JSON com imagens: {result.output_json_path}")
        self._log(f"JSON de cores: {result.colors_json_path}")
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

    def _site_not_implemented(self) -> None:
        QMessageBox.information(
            self,
            "Cadastro no site",
            "Este botao fica reservado para a proxima etapa: envio dos produtos para o site.",
        )

    def _show_pending_brand(self, brand: str) -> None:
        QMessageBox.information(self, brand, f"O fluxo da marca {brand} ainda nao foi implementado.")

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
