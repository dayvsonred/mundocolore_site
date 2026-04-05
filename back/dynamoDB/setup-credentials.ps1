# Script interativo para setup das credenciais AWS
# Mundo Colore - Backend Database

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

Write-Host @"
╔════════════════════════════════════════════════════════════╗
║   🚀 SETUP CREDENCIAIS AWS - MUNDO COLORE DynamoDB        ║
╚════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Limpar credenciais antigas
Write-Step "Limpando credenciais de ambiente..."
Remove-Item Env:AWS_ACCESS_KEY_ID -ErrorAction SilentlyContinue
Remove-Item Env:AWS_SECRET_ACCESS_KEY -ErrorAction SilentlyContinue
Remove-Item Env:AWS_SESSION_TOKEN -ErrorAction SilentlyContinue
Write-Success "Credenciais de ambiente limpas"

# Listar profiles disponíveis
Write-Step "Profiles AWS disponíveis:"
try {
    $profiles = aws configure list-profiles
    if ($profiles.Count -eq 0) {
        Write-Error "Nenhum profile configurado!"
        Write-Info "Execute: aws configure --profile mundocolore"
        exit 1
    }
    
    $i = 1
    $profiles | ForEach-Object {
        Write-Host "$i. $_"
        $i++
    }
}
catch {
    Write-Error "Erro ao listar profiles: $($_.Exception.Message)"
    exit 1
}

# Selecionar profile
Write-Host ""
$profileInput = Read-Host "Selecione o profile (padrão: mundocolore)"
$selectedProfile = if ([string]::IsNullOrWhiteSpace($profileInput)) { "mundocolore" } else { $profileInput }

# Testar credenciais
Write-Step "Testando credenciais do profile '$selectedProfile'..."
try {
    $identity = aws sts get-caller-identity --profile $selectedProfile --output json 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Profile '$selectedProfile' inválido"
        exit 1
    }
    
    $identityObj = $identity | ConvertFrom-Json
    $currentAccount = $identityObj.Account
    
    Write-Success "Credenciais testadas com sucesso"
    Write-Host @"
📋 Informações da Conta:
   Account ID: $currentAccount
   ARN:        $($identityObj.Arn)
   UserID:     $($identityObj.UserId)
"@ -ForegroundColor Green
    
}
catch {
    Write-Error "Erro ao testar credenciais: $($_.Exception.Message)"
    exit 1
}

# Validar conta
Write-Step "Validando conta AWS..."
if ($currentAccount -ne $AccountId) {
    Write-Error "Conta AWS incorreta!"
    Write-Error "Esperado: $AccountId ($AccountName)"
    Write-Error "Atual:    $currentAccount"
    Write-Info "Configure a conta correta:"
    Write-Info "  aws configure --profile $selectedProfile"
    exit 1
}

Write-Success "Conta validada: $currentAccount ($AccountName)"

# Configurar ambiente
$env:AWS_PROFILE = $selectedProfile
$env:AWS_REGION = $Region

Write-Step "Salvando configuração..."
Write-Host @"
📝 Configuração:
   Profile: $selectedProfile
   Region:  $Region
   Account: $currentAccount
"@ -ForegroundColor Green

# Criar arquivo de configuração do terminal
$profileScript = @"
# AWS Mundo Colore DynamoDB
`$env:AWS_PROFILE = '$selectedProfile'
`$env:AWS_REGION = '$Region'
"@

Write-Success "Setup concluído com sucesso!"

Write-Host @"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Próximos Passos:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Verificar o plano:
    .\deploy.ps1 -Plan

2️⃣  Aplicar a infraestrutura:
    .\deploy.ps1 -Apply

3️⃣  Ver tabelas criadas:
    terraform output

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para usar em outro terminal, configure:
    `$env:AWS_PROFILE = '$selectedProfile'
    `$env:AWS_REGION = '$Region'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@ -ForegroundColor Cyan