# Infra Lambda lb_mundocolore-products

## Rotas

- `POST /products/brands` cria marca e prefixo no bucket.
- `GET /products/brands` lista marcas cadastradas.
- `POST /products/collections` cria colecao e prefixos `marca/ano/colecao/`.
- `GET /products/collections?brand=UP-BABY&year=2026` lista colecoes.
- `POST /products` cadastra um produto individual, sobe imagens em base64 quando enviadas e salva os caminhos no DynamoDB.
- `GET /products` lista produtos com paginacao e filtros `brand`, `year`, `collection`, `type`, `category`, `produto_id`, `limit`, `last_key`.
- `GET /products/{id}` busca um produto especifico.

## Variaveis de Ambiente

```text
TABLE_NAME=mundocolore-products
IMAGE_BUCKET=mundocolorestore-imagems
IMAGE_BASE_URL=https://mundocolorestore-imagems.s3.sa-east-1.amazonaws.com
```

## Build da Lambda

Execute estes comandos no PowerShell para entrar na pasta da lambda, atualizar as dependencias Go, compilar o binario Linux esperado pela AWS Lambda e gerar o arquivo `lambda.zip` usado pelo Terraform em `infra/main.tf`.

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\products"
go mod tidy; $env:GOOS = "linux"; $env:GOARCH = "amd64"; go build -o bootstrap main.go; Compress-Archive -Path bootstrap -DestinationPath lambda.zip -Force
```

O arquivo final deve ficar em:

```text
C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\products\lambda.zip
```

## Deploy

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\products\infra"
$env:AWS_PROFILE="mundocolore"
terraform init
terraform plan
terraform apply
```

## Exemplo de Produto

```json
{
  "brand": "UP-BABY",
  "year": "2026",
  "collection": "inverno-verao-a",
  "produto_id": "46688",
  "descricao": "CONJUNTO INFANTIL",
  "tamanho_original": "4 a 8",
  "tamanhos_array": [4, 5, 6, 7, 8],
  "preco": "114.90",
  "imagem": [
    "A_00e06a69-e8ce-4553-8ea4-6569c31d1a90_46688_4-5-6-7-8_1.jpg"
  ],
  "cores": ["120000"]
}
```

Para upload direto da imagem, envie `image_base64` e `image_file_name`, ou uma lista em `upload_images`.

Quando o produto vier direto do JSON do cadastrador sem `brand`, `year` ou `collection`, envie esses valores na query string:

```text
POST /products?brand=UP-BABY&year=2025&collection=VERAO-A
```
