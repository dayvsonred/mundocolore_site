# Infra AWS (Terraform)

Esta estrutura publica o site com `S3 privado + CloudFront` e permite ativar dominio depois sem mudar arquitetura.

## Requisitos
- Terraform >= 1.5
- AWS CLI configurada
- Credenciais AWS com permissao para S3, CloudFront, ACM e Route53 (se usar DNS)

## Protecao de conta AWS
O provider tem trava de conta:
- `allowed_account_id = "261955339827"`

Antes de rodar Terraform:
```powershell
Remove-Item Env:AWS_ACCESS_KEY_ID,Env:AWS_SECRET_ACCESS_KEY,Env:AWS_SESSION_TOKEN -ErrorAction SilentlyContinue
$env:AWS_PROFILE = "mundocolore"
$account = aws sts get-caller-identity --query Account --output text
if ($account -ne "261955339827") { throw "Conta AWS errada: $account" }
```

## 1) Build do Angular
```powershell
cd site
npm install
npm run build -- --configuration production
```

## 2) Infra + upload automatico para S3
```powershell
cd ..\infra\terraform
copy terraform.tfvars.example terraform.tfvars
```

No `terraform.tfvars`, ajuste:
- `bucket_name`
- `upload_build_files = true`
- `build_output_path` (padrao: `../../site/dist/mundocolore`)

Aplicar:
```powershell
terraform init
terraform plan
terraform apply
```

## 3) Invalidar cache CloudFront
```powershell
$distributionId = terraform output -raw cloudfront_distribution_id
aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*"
```

## 4) Quando tiver dominio
No `terraform.tfvars`:
- `domain_names = ["seudominio.com", "www.seudominio.com"]`
- `hosted_zone_id = "ZXXXXXXXXXXXXX"`
- `create_route53_records = true`

Depois:
```powershell
terraform plan
terraform apply
```



cd infra/terraform
terraform output -raw site_url
# ou
terraform output -raw cloudfront_domain_name
