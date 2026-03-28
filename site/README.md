# front_sorte_angular
Front sorteios Angular.

## Terraform (DNS + CloudFront + S3)

### Requisitos
- Terraform instalado
- Credenciais AWS configuradas (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`)

### Valores padrao
Ja estao definidos no Terraform:
- `bucket_name = "thepuregracev1"`
- `hosted_zone_id = "Z05352952IWQJNXHJAN9G"`
- `domain_name = "thepuregrace.com"`
- `www_domain_name = "www.thepuregrace.com"`

### Executar
```powershell
cd infra/terraform
terraform init
terraform plan
terraform apply
```

### Importar bucket ja existente (se necessario)
Se o bucket `thepuregracev1` ja existe e foi criado fora do Terraform, faca o import:
```powershell
cd infra/terraform
terraform import aws_s3_bucket.site thepuregracev1
```

### Preciso limpar o bucket antes do import?
Nao. O `terraform import` apenas liga o recurso existente ao estado.
Limpar o bucket so e necessario se voce quiser remover o conteudo antigo.

Para limpar (opcional, cuidado!):
```powershell
aws s3 rm s3://thepuregracev1 --recursive
```

### Fluxo de atualizacao do site

#### 1) Infra (uma vez)
```powershell
cd C:\Users\niore\Documents\projeto sorteio doacao\front_sorte_angular\infra\terraform
terraform init
terraform plan
terraform apply
```

Se o bucket ja estiver no state, nao faca import. Para conferir:
```powershell
terraform state list
```

Somente se o recurso nao estiver no state:
```powershell
terraform import aws_s3_bucket.site thepuregracev1
```

#### 2) Subir atualizacoes do site (sempre que mudar o front)
```powershell
cd "C:\Users\niore\Documents\projeto sorteio doacao\front_sorte_angular"
npm install
ng build --configuration production
aws s3 sync dist\thepuregrace\ s3://thepuregracev1 --delete
```

#### 3) Limpar cache do CloudFront (recomendado apos deploy)
```powershell
cd C:\Users\niore\Documents\projeto sorteio doacao\front_sorte_angular\infra\terraform
terraform output cloudfront_distribution_id
```

Pegue o ID que sair e rode:
```powershell
aws cloudfront create-invalidation --distribution-id SEU_ID --paths "/*"
```