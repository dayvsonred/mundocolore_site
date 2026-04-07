# Infra Lambda lb_mundocolore-addresses

## Build

```bash
cd ..
GOOS=linux GOARCH=amd64 go build -o bootstrap main.go
zip lambda.zip bootstrap
```
```bash
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\addresses"
$env:GOOS="linux"; $env:GOARCH="amd64"; $env:CGO_ENABLED="0"; go build -o bootstrap main.go; Compress-Archive -Path .\bootstrap -DestinationPath .\lambda.zip -Force
```

```bash
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\addresses"

$env:GOOS="linux"; $env:GOARCH="amd64"; $env:CGO_ENABLED="0"; go build -o bootstrap main.go; Compress-Archive -Path .\bootstrap -DestinationPath .\lambda.zip -Force

cd .\terraform
$env:AWS_PROFILE="mundocolore"
terraform init
terraform plan
terraform apply
```


## Deploy

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\addresses\terraform"
$env:AWS_PROFILE="mundocolore"
terraform init
terraform plan
terraform apply
```



