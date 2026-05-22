# Cadastrador Mundo Colore

Aplicacao local em Python/PySide6 para preparar produtos do site `mundocolorestore.com`.

## Como instalar

No terminal, dentro da pasta `cadastrador`:

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

- Tela simples de login antes da tela inicial.
- Usuario, senha e token ficam salvos localmente pelo `QSettings` para evitar redigitacao.
- Tela inicial com botoes das marcas carregadas de `GET /products/brands`.
- Fluxo inicial implementado para UP-BABY.
- Lista automaticamente as colecoes dentro de `UP_BABY`, ignorando as pastas padrao `1_PRODUTOS_PARA_CADASTRA` e `1_PRODUTOS_ENVIADOS`.
- Lista os PDFs da colecao escolhida.
- Permite escolher qual PDF e a tabela de valores e qual e o catalogo de produtos.
- Mostra a quantidade de paginas de cada PDF.
- Processa a tabela de valores e salva JSON/XLSX em:

```text
UP_BABY\1_PRODUTOS_PARA_CADASTRA
```

## API

Por padrao, o app usa a API publicada em:

```text
https://b8i4etrh23.execute-api.sa-east-1.amazonaws.com/prod
```

Para apontar para outro ambiente antes de abrir o app:

```powershell
$env:MUNDOCOLORE_API_URL = "https://sua-api/prod"
```

O login usa `POST /login` com o header Basic esperado pela lambda e a tela inicial usa o token retornado no header Bearer ao buscar `GET /products/brands`.


```comandos 
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\cadastrador\APP"
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python cadastrador_app.py

```
