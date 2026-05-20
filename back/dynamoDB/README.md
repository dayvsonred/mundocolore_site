# Infra AWS - DynamoDB (Terraform)

Esta estrutura cria as tabelas DynamoDB necessarias para o backend do e-commerce Mundo Colore.

## Tabelas Criadas

### Users (`mundocolore-users`)

- Chave primaria: `id` (String)
- GSI: `email-index`
- Uso: dados dos usuarios

### Products (`mundocolore-products`)

- Chave primaria: `id` (String)
- Uso: catalogo de produtos, marcas e colecoes em uma unica tabela.
- Tipos de registro pelo atributo `entity_type`: `brand`, `collection`, `product`.

GSIs usados pela lambda `products`:

- `category-index`: consulta produtos por `category`.
- `entity-type-index`: lista marcas, colecoes ou produtos por `entity_type`.
- `brand-index`: consulta produtos por `brand_key`.
- `collection-index`: consulta produtos por `collection_key`, com ordenacao/paginacao por `product_id`.
- `type-index`: consulta produtos por `type_key`.
- `product-id-index`: consulta variacoes pelo `produto_id` vindo do cadastrador.

Atributos principais dos produtos:

- `brand_key`: marca normalizada, exemplo `UP-BABY`.
- `year`: ano da colecao, exemplo `2026`.
- `collection_key`: chave composta `UP-BABY#2026#inverno-verao-a`.
- `collection_slug`: slug da colecao, exemplo `inverno-verao-a`.
- `image_bucket`: bucket da imagem, exemplo `mundocolorestore-imagems`.
- `image_keys`: caminhos dos objetos no S3.
- `image_url` e `image_urls`: URLs usadas pelo site.
- `s3_prefix`: pasta da colecao no bucket.

Padrao de imagem:

```text
mundocolorestore-imagems/UP-BABY/2026/inverno-verao-a/A_00e06a69-e8ce-4553-8ea4-6569c31d1a90_46688_4-5-6-7-8_1.jpg
```

### Orders (`mundocolore-orders`)

- Chave primaria: `id` (String) + `user_id` (String)
- GSI: `user-created-index`
- Uso: pedidos dos usuarios

### Addresses (`mundocolore-addresses`)

- Chave primaria: `id` (String) + `user_id` (String)
- Uso: enderecos de entrega e cobranca

### Payments (`mundocolore-payments`)

- Chave primaria: `id` (String) + `order_id` (String)
- Uso: dados de pagamento dos pedidos

### Role (`mundocolore-role`)

- Chave primaria: `id` (String), usando o mesmo ID do usuario.
- Atributos: `created_at`, `active`, `deactivated_at`.
- Uso: validacao server-side de administradores.
- Seeds: `user-ficticio-admin-001` e `user-ficticio-admin-002`.

## Requisitos

- Terraform >= 1.5
- AWS CLI configurada
- Credenciais AWS com permissoes para DynamoDB e IAM

## Protecao de Conta AWS

O provider tem trava de conta:

- `allowed_account_id = "261955339827"`
- `aws_region = "sa-east-1"`

## Como Usar

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back\dynamoDB"
$env:AWS_PROFILE = "mundocolore"
terraform init
terraform plan
terraform apply
terraform output
```

## Configuracoes

- Billing mode: `PAY_PER_REQUEST`
- Point-in-time recovery habilitado
- Criptografia server-side habilitada
- Streams habilitados com `NEW_AND_OLD_IMAGES`
- IAM policy para acesso as tabelas
