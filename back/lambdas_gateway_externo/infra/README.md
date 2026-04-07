# Infra API Gateway

## Deploy

```powershell
$env:AWS_PROFILE="mundocolore"
terraform init
terraform plan
terraform apply
```

## Observacao

Este stack cria apenas o REST API `mundocolore-gateway`.
Crie o stage/deployment (`prod`) somente depois que uma lambda adicionar metodos ao gateway.

