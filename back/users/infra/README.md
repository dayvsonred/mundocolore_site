# Infra Lambda lb_mundocolore-users

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




```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\users"
go mod tidy; $env:GOOS = "linux"; $env:GOARCH = "amd64"; go build -o bootstrap main.go; Compress-Archive -Path bootstrap -DestinationPath lambda.zip -Force
```

## Deploy Terraform (infra)

No diretorio `back/login/infra`:

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\users\infra"
$env:AWS_PROFILE = "mundocolore"
terraform init
terraform plan
terraform apply
```