# Backend - AWS Lambdas (Go)

Este backend consiste em Lambdas AWS escritas em Go, cada uma responsável por um domínio específico do e-commerce Mundo Colore.

## Estrutura

- `addresses/` - Lambda para gerenciamento de endereços
- `dynamoDB/` - Infraestrutura Terraform para tabelas DynamoDB
- `lambdas_gateway_externo/` - API Gateway para expor as Lambdas
- `orders/` - Lambda para gerenciamento de pedidos
- `payments/` - Lambda para processamento de pagamentos
- `products/` - Lambda para catálogo de produtos
- `users/` - Lambda para autenticação e usuários

## Pré-requisitos

- Go 1.21+
- Terraform 1.5+
- AWS CLI configurado
- Conta AWS com Free Tier

## Deploy

### 1. Configurar Credenciais AWS

```powershell
$env:AWS_PROFILE = "mundocolore"
```

### 2. Deploy DynamoDB Tables

```powershell
cd dynamoDB
terraform init
terraform plan
terraform apply
```

### 3. Deploy API Gateway

```powershell
cd lambdas_gateway_externo/infra
terraform init
terraform plan
terraform apply
```

### 4. Deploy Lambdas

Para cada lambda, navegue para a pasta `infra` e execute:

```powershell
cd <lambda>/infra
terraform init
terraform plan
terraform apply
```

**Nota:** Antes do `terraform apply`, compile o código Go:

```bash
cd ..
GOOS=linux GOARCH=amd64 go build -o main main.go
zip lambda.zip main
```

## Endpoints da API

### Users
- `POST /users/register` - Registrar usuário
- `POST /users/login` - Login
- `GET /users/profile` - Perfil do usuário

### Addresses
- `POST /addresses` - Criar endereço
- `GET /addresses` - Listar endereços

### Orders
- `POST /orders` - Criar pedido
- `GET /orders` - Listar pedidos

### Products
- `POST /products` - Criar produto
- `GET /products` - Listar produtos (com filtros e paginação)

### Payments
- `POST /payments` - Criar pagamento

## Free Tier AWS

Este setup foi otimizado para o Free Tier da AWS:
- Lambdas com 128MB RAM
- DynamoDB PAY_PER_REQUEST
- Sem provisioned concurrency

## Próximos Passos

1. Atualizar `apiUrl` no `environment.ts` com o URL do API Gateway
2. Testar os endpoints
3. Implementar validações adicionais
4. Adicionar CORS se necessário



###  Redeploy

```powershell
aws apigateway create-deployment \
  --rest-api-id b8i4etrh23 \
  --stage-name prod \
  --profile mundocolore \
  --region sa-east-1
```