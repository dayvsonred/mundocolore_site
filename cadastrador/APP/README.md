# Cadastrador Mundo Colore

Aplicacao local em Python/PySide6 para preparar produtos do site `mundocolorestore.com`.

## Como instalar

No terminal, dentro da pasta `cadastrador\APP`:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
```

Para OCR de PDFs escaneados, tambem e necessario instalar:

- Tesseract OCR no Windows
- Poppler para o `pdf2image`

## Como abrir

```powershell
.\.venv\Scripts\python cadastrador_app.py
```

## Fluxo implementado

- Tela inicial com botoes das marcas: UP-BABY, 3EJA, QUIMIBY e PRECOCE.
- Fluxo inicial implementado para UP-BABY.
- Lista automaticamente as colecoes dentro de `..\UP_BABY`, ignorando as pastas padrao `1_PRODUTOS_PARA_CADASTRA` e `1_PRODUTOS_ENVIADOS`.
- Lista os PDFs da colecao escolhida.
- Permite escolher qual PDF e a tabela de valores e qual e o catalogo de produtos.
- Mostra a quantidade de paginas de cada PDF.
- Processa a tabela de valores e salva JSON/XLSX em:
- Valida a tabela de valores e gera relatorio JSON/XLSX com uma aba `revisar` para conferir divergencias ou linhas ambiguas.

```text
..\UP_BABY\1_PRODUTOS_PARA_CADASTRA
```
