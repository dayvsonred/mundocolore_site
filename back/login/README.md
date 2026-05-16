# Lambda Login (`lb_mundocolore-login`)

Este diretorio contem a lambda de login e a infra Terraform.

## Build da lambda

No diretorio `back/login`:

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\login"
go mod tidy; $env:GOOS = "linux"; $env:GOARCH = "amd64"; go build -o bootstrap main.go; Compress-Archive -Path bootstrap -DestinationPath lambda.zip -Force
```

## Deploy Terraform (infra)

No diretorio `back/login/infra`:

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\login\infra"
$env:AWS_PROFILE = "mundocolore"
terraform init
terraform plan
terraform apply
```

## Deploy Terraform (terraform)

No diretorio `back/login/terraform` (espelho de `infra`):

```powershell
$env:AWS_PROFILE = "mundocolore"
terraform init
terraform plan
terraform apply
```

## Redeploy API Gateway

Depois do apply, publicar o stage:

```powershell
aws apigateway create-deployment   --rest-api-id b8i4etrh23   --stage-name prod   --profile mundocolore --region sa-east-1
```

## Exemplo de chamada das rotas health

Base:

```text
https://b8i4etrh23.execute-api.sa-east-1.amazonaws.com/prod
```

PowerShell:

```powershell
$base = "https://b8i4etrh23.execute-api.sa-east-1.amazonaws.com/prod"
Invoke-RestMethod "$base/login/health/online" -Method GET
Invoke-RestMethod "$base/login/health/data" -Method GET
```

cURL:

```bash
curl -X GET "https://b8i4etrh23.execute-api.sa-east-1.amazonaws.com/prod/login/health/online"
curl -X GET "https://b8i4etrh23.execute-api.sa-east-1.amazonaws.com/prod/login/health/data"
```


api_gateway_id = "b8i4etrh23"
lambda_arn = "arn:aws:lambda:sa-east-1:261955339827:function:lb_mundocolore-login"
