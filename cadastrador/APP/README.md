# Cadastrador Mundo Colore

Aplicacao local em Python/PySide6 para preparar produtos do site `mundocolorestore.com`.

## Como instalar

No terminal, dentro da pasta `cadastrador\APP`:

cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\cadastrador\APP"

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
- Cria uma pasta local usando `brand_key`, busca as colecoes cadastradas em `GET /products/collections`, cria uma pasta para cada colecao e exibe seu conteudo.
- Ao abrir uma colecao vazia, informa o local em que devem ser adicionados o PDF da tabela de valores e o PDF do catalogo de produtos com as imagens.
- A pasta historica `UP_BABY` continua sendo usada pela marca `UP-BABY`; as demais usam o `brand_key` sem acentos.
- Lista os PDFs da colecao escolhida.
- Permite escolher qual PDF e a tabela de valores e qual e o catalogo de produtos.
- Mostra a quantidade de paginas de cada PDF.
- Processa e valida a tabela de valores e salva JSON/XLSX na pasta de trabalho da marca.
- Valida a tabela de valores e gera relatorio JSON/XLSX com uma aba `revisar` para conferir divergencias ou linhas ambiguas.
- Busca imagens no PDF do catalogo usando o JSON de tabela mais recente da colecao.
- Salva imagens em `..\{MARCA}\1_PRODUTOS_PARA_CADASTRA\IMAGEMS`.
- Gera um novo JSON com os atributos `imagem` e `cores`.
- Consulta e exibe os produtos ja cadastrados no backend para a marca e colecao selecionadas.
- Mostra os defaults atuais da colecao retornados pelo backend, incluindo spread e credito Colore.
- Envia o JSON final pela rota `POST /products/import-file` com `brand`, `year`, `collection` e `collection_slug` da API.
- Le o JSON enviado, envia as imagens uma a uma por `POST /products/{id}/images` e move os arquivos aceitos para a pasta de enviados da marca.
- Mantem historico e cadastro local de cores separados por marca.

```text
..\{MARCA}\1_PRODUTOS_PARA_CADASTRA
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
