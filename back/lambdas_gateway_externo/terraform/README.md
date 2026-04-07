# Infra API Gateway

## Deploy

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\lambdas_gateway_externo\terraform"

$env:AWS_PROFILE="mundocolore"
terraform init
terraform plan
terraform apply
```

## Observacao

Este stack cria apenas o REST API `mundocolore-gateway`.
Crie o stage/deployment (`prod`) somente depois que uma lambda adicionar metodos ao gateway.

