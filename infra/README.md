# Infra AWS (Terraform)

Esta estrutura permite publicar o site agora sem dominio e, depois, ativar dominio sem mudar arquitetura.

## Estrategia recomendada
- Fase 1 (agora): `S3 privado + CloudFront` usando URL publica da CloudFront (`*.cloudfront.net`).
- Fase 2 (quando tiver dominio): adicionar `domain_names` + `hosted_zone_id`, e opcionalmente criar registros no Route53.

Assim voce evita retrabalho e mantem o mesmo fluxo de deploy.

## Arquitetura
- `S3` guarda os arquivos estaticos.
- `CloudFront` entrega o site para internet.
- `OAC` (Origin Access Control) restringe leitura do bucket apenas para a CloudFront.
- `ACM` e `Route53` sao opcionais e entram quando houver dominio.

## Requisitos
- Terraform >= 1.5
- AWS CLI configurada (`aws configure`)
- Credenciais AWS com permissao para S3, CloudFront, ACM e Route53 (se usar DNS/certificado)

## 1) Subir infra sem dominio
```powershell
cd infra/terraform
copy terraform.tfvars.example terraform.tfvars
```

Edite `terraform.tfvars` e ajuste pelo menos:
- `bucket_name` (precisa ser unico globalmente no S3)
- mantenha `domain_names = []`

Depois:
```powershell
terraform init
terraform plan
terraform apply
```

Pegue a URL publica:
```powershell
terraform output site_url
```

## 2) Publicar o build do Angular
```powershell
cd site
npm install
npm run build -- --configuration production
aws s3 sync dist/mundocolore/ s3://SEU_BUCKET --delete
```

Invalide cache da CloudFront:
```powershell
cd ..\infra\terraform
$distributionId = terraform output -raw cloudfront_distribution_id
aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*"
```

## 3) Quando o dominio estiver pronto
No `terraform.tfvars`:
- `domain_names = ["seudominio.com", "www.seudominio.com"]`
- `hosted_zone_id = "ZXXXXXXXXXXXXX"`
- `create_route53_records = true`
- se quiser usar cert existente, preencha `acm_certificate_arn`
- se nao tiver cert, deixe `create_acm_certificate = true`

Aplicar:
```powershell
terraform plan
terraform apply
```

## Observacoes
- Sem dominio, o acesso publico e pela URL da CloudFront.
- O bucket nao fica publico na internet.
- Para SPA Angular, ja ha fallback de `403/404` para `/index.html`.
