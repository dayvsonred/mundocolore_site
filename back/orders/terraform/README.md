# Infra Lambda lb_mundocolore-orders

## Build

```bash
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
