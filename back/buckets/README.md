# Infra AWS - S3 Buckets

Terraform para criar o bucket de imagens das colecoes.

## Bucket

- Nome: `mundocolorestore-imagems`
- Regiao: `sa-east-1`
- Versionamento: habilitado
- Criptografia: AES256
- CORS: `GET` e `HEAD`
- Leitura publica: habilitada por padrao para o catalogo do site

## Padrao de Pastas

As imagens ficam separadas por marca, ano e colecao:

```text
mundocolorestore-imagems/UP-BABY/2026/inverno-verao-a/A_00e06a69-e8ce-4553-8ea4-6569c31d1a90_46688_4-5-6-7-8_1.jpg
```

As marcas iniciais criadas como prefixos vazios sao:

- `UP-BABY/`
- `3EJA/`
- `QUIMIBY/`
- `PRECOCE/`

A lambda `products` tambem cria os prefixos de marca, ano e colecao quando recebe novas marcas e colecoes.

## Parametros Para a Lambda

Use estes valores no ambiente da lambda `lb_mundocolore-products`:

```text
IMAGE_BUCKET=mundocolorestore-imagems
IMAGE_BASE_URL=https://mundocolorestore-imagems.s3.sa-east-1.amazonaws.com
TABLE_NAME=mundocolore-products
```

O DynamoDB salva `image_bucket`, `image_keys`, `image_url`, `image_urls` e `s3_prefix` em cada produto.

## Como Usar

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\buckets"
$env:AWS_PROFILE = "mundocolore"
terraform init
terraform plan
terraform apply
```

Para travar CORS para dominios especificos, edite `allowed_cors_origins` no `terraform.tfvars`.
