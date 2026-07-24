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
- Fluxo completo de processamento disponivel para todas as marcas retornadas pela API.
- Cria a pasta local usando `brand_key`, busca as colecoes cadastradas no sistema, cria uma pasta para cada colecao e exibe seu conteudo.
- Ao abrir uma colecao vazia, informa o local em que devem ser adicionados o PDF da tabela de valores e o PDF do catalogo de produtos com as imagens.
- A pasta historica `UP_BABY` continua sendo usada pela marca `UP-BABY`; as demais usam o `brand_key` sem acentos.
- Lista os PDFs da colecao escolhida.
- Permite escolher qual PDF e a tabela de valores e qual e o catalogo de produtos.
- Mostra a quantidade de paginas de cada PDF.
- Processa e valida a tabela de valores e gera o JSON final com imagens e cores.
- Consulta e exibe os produtos ja cadastrados no backend para a marca e colecao selecionadas.
- Mostra os defaults atuais da colecao retornados pelo backend.
- Envia o JSON por `POST /products/import-file` com a marca, ano, nome e slug da colecao retornados pela API.
- Envia imagens por `POST /products/{id}/images` e mantem arquivos de cadastro, enviados, historico e cores separados por marca.

```text
{MARCA}\1_PRODUTOS_PARA_CADASTRA
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

O login usa `POST /login` com o header Basic esperado pela lambda. O token retornado e enviado no header Bearer ao buscar marcas, colecoes com configuracao de precos, produtos com dados administrativos e ao enviar dados ou imagens para a lambda `products`. Tokens expirados retornam o aplicativo para a tela de login.


```comandos 
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\cadastrador\APP"
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python cadastrador_app.py

```
