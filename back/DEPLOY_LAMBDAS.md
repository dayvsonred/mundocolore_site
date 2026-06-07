# Build e deploy das Lambdas Go

Este backend possui sete Lambdas Go publicaveis:

- `addresses`
- `contact`
- `login`
- `orders`
- `payments`
- `products`
- `users`

As pastas `buckets`, `dynamoDB` e `lambdas_gateway_externo` contem outras
infraestruturas e nao fazem parte do build automatico das Lambdas Go.

## Controle de versao

Cada pasta `<lambda>/infra` possui:

- `version_local`: versao do codigo local que deve ser publicada.
- `version_update`: ultima versao publicada com sucesso.

Os arquivos usam o formato `MAJOR.MINOR.PATCH`, por exemplo `1.0.1`.

O deploy automatico somente processa uma Lambda quando `version_local` e
superior a `version_update`. Depois de um `terraform apply` bem-sucedido, o
script copia o valor de `version_local` para `version_update`.

Para publicar uma alteracao, aumente a versao local da Lambda:

```powershell
Set-Content -Path ".\products\infra\version_local" -Value "1.0.1"
```

## Deploy automatico

Pre-requisitos:

- Python 3.10 ou superior.
- Go 1.21 ou superior.
- Terraform instalado e disponivel no `PATH`.
- Perfil AWS `mundocolore` configurado.

O script carrega automaticamente o segredo JWT do arquivo local:

```text
C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\.jwt
```

Esse arquivo deve conter somente o segredo JWT, possui no minimo 32 caracteres
e esta ignorado pelo Git. O script disponibiliza o valor como
`TF_VAR_jwt_secret` para o Terraform de todas as Lambdas.

Na raiz da pasta `back`, confira primeiro quais Lambdas seriam publicadas:

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back"
python .\deploy_lambdas.py --dry-run
```

Para compilar e publicar todas as Lambdas com versao pendente:

```powershell
python .\deploy_lambdas.py
```

Para processar somente uma Lambda:

```powershell
python .\deploy_lambdas.py --lambda products
```

Para usar outro perfil AWS:

```powershell
python .\deploy_lambdas.py --profile outro-perfil
```

Por padrao, o script interrompe no primeiro erro. Para continuar tentando as
outras Lambdas:

```powershell
python .\deploy_lambdas.py --continue-on-error
```

Para cada Lambda pendente, o script executa:

1. `go mod tidy`
2. Build Linux AMD64 com `CGO_ENABLED=0`
3. Geracao do `lambda.zip` contendo o binario `bootstrap`
4. `terraform init -input=false`
5. `terraform plan -input=false -out=.deploy.tfplan`
6. `terraform apply -input=false .deploy.tfplan`
7. Atualizacao de `version_update`

A Lambda `contact` recebe automaticamente as variaveis Terraform definidas no
deploy manual existente:

```text
aws_region=us-east-1
dynamodb_table=core
lambda_zip=../lambda.zip
```

## Build manual

Exemplo para a Lambda `products`:

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\products"
go mod tidy
$env:GOOS = "linux"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"
go build -o bootstrap main.go
Compress-Archive -Path bootstrap -DestinationPath lambda.zip -Force
```

O mesmo fluxo pode ser usado para `addresses`, `contact`, `login`, `orders`,
`payments` e `users`, trocando apenas o nome da pasta.

## Terraform manual

Exemplo para a Lambda `products`:

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\products\infra"
$env:AWS_PROFILE = "mundocolore"
terraform init
terraform plan
terraform apply
```

Deploy manual da Lambda `contact`:

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\contact\infra"
$env:AWS_PROFILE = "mundocolore"
terraform init
terraform plan -var "aws_region=us-east-1" -var "dynamodb_table=core" -var "lambda_zip=../lambda.zip"
terraform apply -var "aws_region=us-east-1" -var "dynamodb_table=core" -var "lambda_zip=../lambda.zip"
```
