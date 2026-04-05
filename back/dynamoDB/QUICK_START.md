# 🚀 QUICK START - Deploy DynamoDB

## Seu Setup

Você tem 2 profiles AWS configurados:
- `[default]` - outra conta
- `[mundocolore]` - conta correta ✅

## 3 Formas de Executar

### 1️⃣ FORMA MAIS FÁCIL (Recomendado)

```powershell
cd back\dynamoDB
.\setup-credentials.ps1
```

Vai:
1. ✅ Listar seus profiles
2. ✅ Você escolher o `mundocolore`
3. ✅ Validar credenciais automaticamente
4. ✅ Te instruir nos próximos passos

---

### 2️⃣ FORMA SCRIPT

```powershell
cd back\dynamoDB

# Verificar conta
.\deploy.ps1 -CheckAccount

# Aplicar tudo
.\deploy.ps1 -Apply
```

---

### 3️⃣ FORMA BATCH (CMD)

```batch
cd back\dynamoDB

REM Verificar
deploy.bat check

REM Aplicar
deploy.bat apply
```

---

## ✅ O Que Você Vai Criar

```
Tabelas DynamoDB:
├── mundocolore-users        (usuários)
├── mundocolore-products     (produtos)
├── mundocolore-orders       (pedidos)
├── mundocolore-addresses    (endereços)
└── mundocolore-payments     (pagamentos)

IAM:
├── Policy: mundocolore-dynamodb-access-dev
└── Role:  mundocolore-dynamodb-role-dev
```

---

## 📁 Arquivos de Suporte

| Arquivo | Descrição |
|---------|-----------|
| `setup-credentials.ps1` | ✅ Setup interativo (use primeiro) |
| `deploy.ps1` | Script PowerShell completo |
| `deploy.bat` | Script Batch simples |
| `AUTENTICACAO.md` | Documentação de credenciais |
| `README.md` | Documentação técnica |
| `*.tf` | Configuração Terraform |

---

## 🔒 Validações Automáticas

O script sempre verifica:

```
✅ Profile AWS existe?
✅ Credenciais são válidas?
✅ Estou na conta 261955339827?
✅ Terraform está ok?
✅ Variáveis estão corretas?
```

---

## 🆘 Algo Deu Errado?

1. Rode `setup-credentials.ps1` novamente
2. Leia `AUTENTICACAO.md` para resolver
3. Teste manualmente:

```powershell
aws sts get-caller-identity --profile mundocolore
```

---

## 📝 Resumo Visual

```
VOCÊ                          AWS
  │                            │
  ├─ setup-credentials.ps1 ←──→ Valida Profile
  │  (escolhe mundocolore)      │
  │                            ✅ Verifica Conta
  ├─ deploy.ps1 ←──────────→ Terraform
  │  (aplica)                  │
  │                           ✅ Cria DynamoDB
  │                           ✅ Cria IAM
  │
  └─ terraform output
     (vê resultado)
```