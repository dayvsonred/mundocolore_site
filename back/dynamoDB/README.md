# Infra AWS - DynamoDB (Terraform)

Esta estrutura cria as tabelas DynamoDB necessárias para o backend do e-commerce Mundo Colore.

## Tabelas Criadas

### 👤 Users (`mundocolore-users`)
- **Chave primária:** `id` (String)
- **GSI:** `email-index` (por email)
- **Uso:** Armazenamento de dados dos usuários

### 📦 Products (`mundocolore-products`)
- **Chave primária:** `id` (String)
- **GSI:** `category-index` (por categoria)
- **Uso:** Catálogo de produtos

### 🛒 Orders (`mundocolore-orders`)
- **Chave primária:** `id` (String) + `user_id` (String)
- **GSI:** `user-created-index` (por usuário e data de criação)
- **Uso:** Pedidos dos usuários

### 📍 Addresses (`mundocolore-addresses`)
- **Chave primária:** `id` (String) + `user_id` (String)
- **Uso:** Endereços de entrega e cobrança

### 💳 Payments (`mundocolore-payments`)
- **Chave primária:** `id` (String) + `order_id` (String)
- **Uso:** Dados de pagamento dos pedidos

## Requisitos
- Terraform >= 1.5
- AWS CLI configurada
- Credenciais AWS com permissões para DynamoDB e IAM

## Proteção de Conta AWS

O provider tem trava de conta:
- `allowed_account_id = "261955339827"`
- `aws_region = "sa-east-1"`

## Como Usar

### 1️⃣ Configurar Credenciais

```powershell
# Definir o profile AWS a usar
$env:AWS_PROFILE = "mundocolore"
```

### 2️⃣ Inicializar Terraform

```powershell
terraform init
```

### 3️⃣ Ver Plano de Mudanças

```powershell
terraform plan
```

### 4️⃣ Aplicar Infraestrutura

```powershell
terraform apply
```

### 5️⃣ Ver Outputs

```powershell
terraform output
```

### 6️⃣ Destruir Infraestrutura (se necessário)

```powershell
terraform destroy
```

## Configurações

### Billing Mode
- Todas as tabelas usam `PAY_PER_REQUEST` (sob demanda)
- Custo baseado no uso real

### Recursos incluídos
- ✅ Point-in-time recovery (backup automático)
- ✅ Server-side encryption (criptografia em repouso)
- ✅ Streams habilitados (NEW_AND_OLD_IMAGES)
- ✅ IAM Policy para acesso às tabelas
- ✅ IAM Role para aplicações

## Próximos Passos

Após criar as tabelas, você pode:
1. Configurar aplicações Lambda para processar streams
2. Criar APIs Gateway para acesso
3. Implementar backup adicional
4. Configurar CloudWatch alarms para monitoramento

## Estrutura de Conta

```
AWS Account: 261955339827 (mundocolore)
│
├── Region: sa-east-1 (São Paulo)
│
├── DynamoDB Tables:
│   ├── mundocolore-users
│   ├── mundocolore-products
│   ├── mundocolore-orders
│   ├── mundocolore-addresses
│   └── mundocolore-payments
│
└── IAM:
    ├── Policy: mundocolore-dynamodb-access-dev
    └── Role: mundocolore-dynamodb-role-dev
```