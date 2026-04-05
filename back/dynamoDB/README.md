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

## Proteção de conta AWS
O provider tem trava de conta:
- `allowed_account_id = "261955339827"`

Antes de rodar Terraform:
```powershell
Remove-Item Env:AWS_ACCESS_KEY_ID,Env:AWS_SECRET_ACCESS_KEY,Env:AWS_SESSION_TOKEN -ErrorAction SilentlyContinue
$env:AWS_PROFILE = "mundocolore"
$account = aws sts get-caller-identity --query Account --output text
if ($account -ne "261955339827") { throw "Conta AWS errada: $account" }
```

## Como usar

### 🔐 Passo 0: Configurar Credenciais AWS

Você tem múltiplos profiles configurados e precisa usar o `mundocolore`:

#### Opção A: Setup Interativo (Recomendado)

```powershell
cd back\dynamoDB

# Executar setup interativo
.\setup-credentials.ps1
```

O script irá:
1. Listar todos os profiles disponíveis
2. Deixar você escolher o profile
3. Validar as credenciais
4. Verificar se está na conta correta `261955339827`

#### Opção B: Manual

```powershell
# Configurar o profile
$env:AWS_PROFILE = "mundocolore"
$env:AWS_REGION = "sa-east-1"

# Verificar se está funcionando
aws sts get-caller-identity
```

### Opção 1: Script Automático (Recomendado)

```powershell
cd back\dynamoDB

# Verificar conta antes de executar
.\deploy.ps1 -CheckAccount

# Inicializar
.\deploy.ps1 -Init

# Ver plano de mudanças
.\deploy.ps1 -Plan

# Aplicar infraestrutura
.\deploy.ps1 -Apply
```

### Opção 2: Comandos Terraform Diretos

#### 1) Preparar variáveis
```powershell
copy terraform.tfvars.example terraform.tfvars
```

#### 2) Inicializar Terraform
```powershell
terraform init
```

#### 3) Verificar plano
```powershell
terraform plan
```

#### 4) Aplicar infraestrutura
```powershell
terraform apply
```

#### 5) Verificar outputs
```powershell
terraform output
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

### Custos estimados
- **PAY_PER_REQUEST:** ~$0.50 por GB de dados armazenados + custos de leitura/escrita
- **Streams:** Custos adicionais se utilizados
- **Backup:** Custos por GB armazenado

## Próximos passos

Após criar as tabelas, você pode:
1. Configurar aplicações Lambda para processar streams
2. Criar APIs Gateway para acesso
3. Implementar backup automatizado adicional
4. Configurar CloudWatch alarms para monitoramento

## Limpeza

Para remover todos os recursos:
```powershell
terraform destroy
```

Ou usando o script:
```powershell
.\deploy.ps1 -Destroy
```