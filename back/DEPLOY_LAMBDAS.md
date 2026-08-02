# Deploy integrado: DynamoDB, Lambdas Go e frontend

O script `deploy_lambdas.py` executa os componentes pendentes nesta ordem:

1. Terraform do DynamoDB.
2. Build e Terraform das Lambdas Go.
3. `npm ci` e build Angular de producao.
4. Terraform PRD do site, com upload para S3.
5. Invalidacao do cache CloudFront.

Cada componente somente e publicado quando `version_local` e superior a
`version_update`. O arquivo `version_update` so e alterado depois que todas as
etapas daquele componente terminam com sucesso.

Este backend possui Lambdas Go publicaveis descobertas automaticamente pelo script, incluindo:

- `addresses`
- `contact`
- `login`
- `orders`
- `payments`
- `products`
- `users`
- `email_inbound`
- `email_mailbox`
- `send_email`

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

O DynamoDB usa:

```text
back/dynamoDB/version_local
back/dynamoDB/version_update
```

O frontend usa:

```text
site/version_local
site/version_update
```

Para publicar uma alteracao, aumente a versao local da Lambda:

```powershell
Set-Content -Path ".\products\infra\version_local" -Value "1.0.1"
```

## Deploy automatico

Pre-requisitos:

- Python 3.10 ou superior.
- Go 1.21 ou superior.
- Node.js e npm.
- Terraform instalado e disponivel no `PATH`.
- AWS CLI instalado e disponivel no `PATH`.
- Perfil AWS `mundocolore` configurado.

O script carrega automaticamente o segredo JWT do arquivo local:

```text
C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\.jwt
```

Esse arquivo deve conter somente o segredo JWT, possui no minimo 32 caracteres
e esta ignorado pelo Git. O script disponibiliza o valor como
`TF_VAR_jwt_secret` para o Terraform de todas as Lambdas.

Para a Lambda `login`, o script carrega automaticamente `web.client_id` de:

```text
C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\.google_key
```

O arquivo deve ser o JSON de credenciais de um cliente OAuth do tipo Web e
tambem esta ignorado pelo Git. Apenas o `client_id` e repassado ao Terraform
como `TF_VAR_google_client_id`; o `client_secret` nao e enviado para a Lambda.

As Lambdas `send_email` e `email_inbound` compartilham as credenciais Mailjet
do arquivo local:

```text
C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\.mailjet_api_key
```

O arquivo deve conter `api_key` e `secret_key` em JSON, e tambem esta ignorado
pelo Git. A Lambda `email_mailbox` nao recebe essas credenciais: ela publica a
mensagem na SQS, e somente `send_email` realiza o envio pelo Mailjet.

Na raiz da pasta `back`, confira primeiro todos os componentes que seriam
publicados:

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back"
python .\deploy_lambdas.py --dry-run
```

Para publicar DynamoDB, Lambdas e frontend com versao pendente:

```powershell
python .\deploy_lambdas.py
```

Para limitar quais Lambdas entram na etapa de Lambdas:

```powershell
python .\deploy_lambdas.py --lambda products
```

Mesmo usando `--lambda`, DynamoDB e frontend continuam sendo avaliados por
suas proprias versoes. Isso preserva a ordem global do deploy.

Para usar outro perfil AWS:

```powershell
python .\deploy_lambdas.py --profile outro-perfil
```

Por padrao, o script interrompe no primeiro erro. Para continuar tentando as
outras Lambdas:

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\"
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

Para o DynamoDB pendente, o script executa `terraform init`, `plan` e `apply`
em `back/dynamoDB`, antes das Lambdas.

Para o frontend pendente, o script executa por ultimo:

1. `npm ci`
2. `npm run build -- --configuration production`
3. `terraform init`, `plan` e `apply` em `infra/terraform`
4. Invalidacao `/*` da distribuicao CloudFront
5. Atualizacao de `site/version_update`

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
