# front_sorte_angular
Front sorteios Angular.

## Deploy AWS
A infraestrutura Terraform foi movida para:
- `../infra/terraform`

Guia completo:
- `../infra/README.md`

Fluxo resumido:
1. Criar infraestrutura em `../infra/terraform` (S3 + CloudFront).
2. Gerar build Angular (`npm run build -- --configuration production`).
3. Rodar `terraform apply` em `../infra/terraform` para subir build no bucket S3.
4. Invalidar cache da CloudFront.
