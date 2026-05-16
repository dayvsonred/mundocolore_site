# Infra Lambda lb_mundocolore-orders

## Build

```bash

cd "c:\Users\niore\Documents\projeto sorteio doacao\back_sorte_go\back_sorte_lambdas\contact"
$env:GOOS="linux";$env:GOARCH="amd64";$env:CGO_ENABLED="0";go build -o bootstrap .; Compress-Archive -Path bootstrap -DestinationPath lambda.zip -Force

cd ..
GOOS=linux GOARCH=amd64 go build -o bootstrap main.go
zip lambda.zip bootstrap
```

## Deploy

```powershell
$env:AWS_PROFILE="mundocolore"
terraform init
terraform plan
terraform apply
```
