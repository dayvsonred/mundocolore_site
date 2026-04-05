# 🔐 Guia de Autenticação AWS - Script Deploy

## Configuração das Credenciais

Seu arquivo `~/.aws/credentials` tem duas contas configuradas:

```ini
[default]
aws_access_key_id = AKIA2S2Y4H66K7LLWD44
aws_secret_access_key = XXXXXXXXXXXXXXXXXXXXXX

[mundocolore]
aws_access_key_id = AKIATZ7OBIYZXL6PFWYH
aws_secret_access_key = XXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Como Rodar o Script

### ✅ Opção 1: Usar o Profile `mundocolore` (Recomendado)

```powershell
cd back/dynamoDB

# Ver informações da conta antes de executar
.\deploy.ps1 -Profile mundocolore -CheckAccount

# Inicializar Terraform
.\deploy.ps1 -Profile mundocolore -Init

# Ver plano de mudanças
.\deploy.ps1 -Profile mundocolore -Plan

# Aplicar infraestrutura
.\deploy.ps1 -Profile mundocolore -Apply
```

### ✅ Opção 2: Profile Padrão (Já Configurado)

Como o script já tem o profile padrão como `mundocolore`, você pode rodar sem especificar:

```powershell
cd back/dynamoDB

# Ver informações da conta
.\deploy.ps1 -CheckAccount

# Inicializar
.\deploy.ps1 -Init

# Planejar
.\deploy.ps1 -Plan

# Aplicar
.\deploy.ps1 -Apply
```

## 📋 Comandos Úteis

### Verificar qual conta está sendo usada
```powershell
.\deploy.ps1 -CheckAccount
```

**Saída esperada:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 INFORMAÇÕES DA CONTA AWS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Account ID:  261955339827
Account:     mundocolore
Region:      sa-east-1
ARN:         arn:aws:iam::261955339827:user/seu-usuario
UserID:      AIDATZ7OBIYZXL6PFWYH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Validar configuração
```powershell
.\deploy.ps1 -Validate
```

### Ver plano sem aplicar
```powershell
.\deploy.ps1 -Plan
```

### Aplicar mudanças
```powershell
.\deploy.ps1 -Apply
```

### Destruir infraestrutura
```powershell
.\deploy.ps1 -Destroy
```

## 🔄 Fluxo Completo Recomendado

```powershell
# 1. Navegar para a pasta
cd back/dynamoDB

# 2. Verificar conta
.\deploy.ps1 -CheckAccount
# ✅ Verifica se está na conta 261955339827

# 3. Inicializar (primeira vez)
.\deploy.ps1 -Init

# 4. Validar configuração
.\deploy.ps1 -Validate

# 5. Ver o que será criado
.\deploy.ps1 -Plan

# 6. Aplicar
.\deploy.ps1 -Apply
# Pressione Enter quando e pedir confirmação
```

## 🆘 Troubleshooting

### Erro: "Profile 'mundocolore' não encontrado"

```powershell
# Ver profiles disponíveis
aws configure list-profiles

# Verificar credenciais
aws sts get-caller-identity --profile mundocolore
```

### Erro: "Conta AWS incorreta"

```
❌ Conta AWS incorreta!
Esperado: 261955339827 (mundocolore)
Atual:    123456789012
```

**Solução:** Verificar qual credencial está no profile:

```powershell
# Testar cada profile
aws sts get-caller-identity --profile default
aws sts get-caller-identity --profile mundocolore

# Use o profile correto
.\deploy.ps1 -Profile mundocolore -CheckAccount
```

### Erro: "Credenciais inválidas"

```powershell
# Refreshar credenciais
Remove-Item ~/.aws/credentials -Force
aws configure --profile mundocolore

# Ou usar AWS SSO
aws sso login --profile mundocolore
```

### Erro: "Region não configurada"

O script define automaticamente `sa-east-1`. Se precisar mudar:

```powershell
# Edite o arquivo deploy.ps1 e altere:
$Region = "us-east-1"  # ou outra região
```

## 📝 Arquivo de Configuração

O arquivo `~/.aws/credentials` tem este formato (Linux/Mac/WSL):

```bash
~/.aws/credentials
```

No Windows, fica em:

```
C:\Users\<seu-usuario>\.aws\credentials
```

## 🔒 Security Best Practices

1. ✅ **Nunca commitar `terraform.tfstate`** - Já está em `.gitignore`
2. ✅ **Nunca commitar `terraform.tfvars` com dados reais**
3. ✅ **Usar AWS Profiles** (não variáveis de ambiente)
4. ✅ **Usar MFA** quando possível
5. ✅ **Validar conta antes de aplicar** com `-CheckAccount`

## 📊 Estrutura de Conta

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