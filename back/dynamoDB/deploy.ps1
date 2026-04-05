# Script para deploy da infraestrutura DynamoDB
# Mundo Colore - Backend Database

param(
    [string]$Profile = "mundocolore",
    [switch]$Plan,
    [switch]$Apply,
    [switch]$Destroy,
    [switch]$Validate,
    [switch]$Init,
    [switch]$CheckAccount
)

$ErrorActionPreference = "Stop"

# Configurações
$AccountId = "261955339827"
$AccountName = "mundocolore"
$Region = "sa-east-1"

function Write-Step {
    param([string]$Message)
    Write-Host "`n🔧 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

function Test-AwsProfile {
    param([string]$ProfileName)
    
    Write-Step "Testando credenciais do profile '$ProfileName'..."
    try {
        $testCmd = aws sts get-caller-identity --profile $ProfileName --output json 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Profile '$ProfileName' não encontrado ou credenciais inválidas"
            Write-Info "Profiles disponíveis:"
            aws configure list-profiles
            exit 1
        }
        
        $identity = $testCmd | ConvertFrom-Json
        Write-Success "Credenciais testadas com sucesso"
        return $identity
    }
    catch {
        Write-Error "Erro ao testar credenciais: $($_.Exception.Message)"
        exit 1
    }
}

function Test-AwsAccount {
    param([string]$ProfileName)
    
    Write-Step "Verificando conta AWS..."
    $identity = Test-AwsProfile -ProfileName $ProfileName
    
    $currentAccount = $identity.Account
    $currentArn = $identity.Arn
    $currentUserId = $identity.UserId
    
    Write-Info "ARN: $currentArn"
    Write-Info "UserID: $currentUserId"
    
    if ($currentAccount -ne $AccountId) {
        Write-Error "Conta AWS incorreta!"
        Write-Error "Esperado: $AccountId ($AccountName)"
        Write-Error "Atual:    $currentAccount"
        exit 1
    }
    
    Write-Success "Conta AWS validada: $currentAccount ($AccountName)"
    return $identity
}

function Initialize-Terraform {
    Write-Step "Inicializando Terraform..."
    terraform init
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha na inicialização do Terraform"
        exit 1
    }
    Write-Success "Terraform inicializado com sucesso"
}

function Validate-Terraform {
    Write-Step "Validando configuração Terraform..."
    terraform validate
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Configuração Terraform inválida"
        exit 1
    }
    Write-Success "Configuração validada com sucesso"
}

function Plan-Terraform {
    Write-Step "Gerando plano de execução..."
    terraform plan -var-file="terraform.tfvars"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erro ao gerar plano"
        exit 1
    }
    Write-Success "Plano gerado com sucesso"
}

function Apply-Terraform {
    Write-Step "Aplicando infraestrutura..."
    Write-Info "Isso criará todas as tabelas DynamoDB configuradas"
    Write-Info "Pressione Enter para continuar ou Ctrl+C para cancelar..."
    Read-Host
    
    terraform apply -var-file="terraform.tfvars" -auto-approve
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erro ao aplicar infraestrutura"
        exit 1
    }
    Write-Success "Infraestrutura aplicada com sucesso"
}

function Destroy-Terraform {
    Write-Step "Destruindo infraestrutura..."
    Write-Info "AVISO: Isso DELETARÁ todas as tabelas DynamoDB!"
    Write-Info "Isso não pode ser desfeito. Pressione Enter para continuar ou Ctrl+C para cancelar..."
    Read-Host
    
    terraform destroy -var-file="terraform.tfvars" -auto-approve
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erro ao destruir infraestrutura"
        exit 1
    }
    Write-Success "Infraestrutura destruída com sucesso"
}

function Show-AccountInfo {
    param([object]$Identity)
    Write-Host @"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 INFORMAÇÕES DA CONTA AWS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Account ID:  $($Identity.Account)
Account:     $AccountName
Region:      $Region
ARN:         $($Identity.Arn)
UserID:      $($Identity.UserId)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@ -ForegroundColor Green
}

# Limpar credenciais antigas do ambiente
Remove-Item Env:AWS_ACCESS_KEY_ID -ErrorAction SilentlyContinue
Remove-Item Env:AWS_SECRET_ACCESS_KEY -ErrorAction SilentlyContinue
Remove-Item Env:AWS_SESSION_TOKEN -ErrorAction SilentlyContinue

# Configurar ambiente AWS
$env:AWS_PROFILE = $Profile
$env:AWS_REGION = $Region

Write-Host @"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 DEPLOY DYNAMODB - MUNDO COLORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Profile: $Profile
Region:  $Region
AccountID: $AccountId
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@ -ForegroundColor Cyan

# Executar ações
if ($CheckAccount) {
    $identity = Test-AwsAccount -ProfileName $Profile
    Show-AccountInfo -Identity $identity
    exit 0
}

if ($Init) {
    $identity = Test-AwsAccount -ProfileName $Profile
    Show-AccountInfo -Identity $identity
    Initialize-Terraform
    exit 0
}

if ($Validate) {
    $identity = Test-AwsAccount -ProfileName $Profile
    Show-AccountInfo -Identity $identity
    Validate-Terraform
    exit 0
}

if ($Plan) {
    $identity = Test-AwsAccount -ProfileName $Profile
    Show-AccountInfo -Identity $identity
    Initialize-Terraform
    Validate-Terraform
    Plan-Terraform
    exit 0
}

if ($Apply) {
    $identity = Test-AwsAccount -ProfileName $Profile
    Show-AccountInfo -Identity $identity
    Initialize-Terraform
    Validate-Terraform
    Plan-Terraform
    Apply-Terraform
    Write-Step "Outputs da infraestrutura:"
    terraform output
    exit 0
}

if ($Destroy) {
    $identity = Test-AwsAccount -ProfileName $Profile
    Show-AccountInfo -Identity $identity
    Destroy-Terraform
    exit 0
}

# Se nenhuma flag foi passada, mostrar ajuda
Write-Host @"
📖 Script de Deploy - DynamoDB Mundo Colore

Uso: .\deploy.ps1 [-Profile <profile>] [-CheckAccount] [-Init] [-Validate] [-Plan] [-Apply] [-Destroy]

Parâmetros:
  -Profile <profile>  AWS Profile a usar (padrão: mundocolore)
  -CheckAccount       Verificar e exibir informações da conta
  -Init               Inicializar Terraform
  -Validate           Validar configuração
  -Plan               Mostrar plano de mudanças
  -Apply              Aplicar infraestrutura
  -Destroy            Destruir infraestrutura

Exemplos:
  .\deploy.ps1 -CheckAccount
  .\deploy.ps1 -Profile mundocolore -Init
  .\deploy.ps1 -Profile mundocolore -Plan
  .\deploy.ps1 -Profile mundocolore -Apply
  .\deploy.ps1 -Profile mundocolore -Destroy

Profiles disponíveis:
"@ -ForegroundColor White

aws configure list-profiles