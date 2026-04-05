@echo off
REM Script rápido para rodar deploy com profile correto
REM Mundo Colore - Backend Database

setlocal enabledelayedexpansion

set ACCOUNT_ID=261955339827
set PROFILE=mundocolore
set REGION=sa-east-1

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   DynamoDB Deploy - Mundo Colore                           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

if "%1"=="" (
    echo. Uso: deploy.bat [comando]
    echo.
    echo Comandos disponíveis:
    echo   check     - Verificar conta AWS
    echo   init      - Inicializar Terraform
    echo   plan      - Ver plano
    echo   apply     - Aplicar infraestrutura
    echo   destroy   - Destruir infraestrutura
    echo.
    echo Exemplo:
    echo   deploy.bat check
    echo   deploy.bat apply
    echo.
    exit /b 1
)

REM Configurar ambiente
set AWS_PROFILE=%PROFILE%
set AWS_REGION=%REGION%

REM Executar comando
if "%1"=="check" (
    echo Verificando credenciais do profile '%PROFILE%'...
    aws sts get-caller-identity --profile %PROFILE%
    goto :end
)

if "%1"=="init" (
    echo Inicializando Terraform...
    terraform init
    goto :end
)

if "%1"=="plan" (
    echo Gerando plano...
    terraform plan -var-file="terraform.tfvars"
    goto :end
)

if "%1"=="apply" (
    echo.
    echo ⚠️  ATENÇÃO: Isso criará DynamoDB tables na AWS!
    echo Pressione qualquer tecla para continuar ou Ctrl+C para cancelar...
    pause
    terraform apply -var-file="terraform.tfvars" -auto-approve
    goto :end
)

if "%1"=="destroy" (
    echo.
    echo ⚠️  AVISO: Isso DELETARÁ todas as DynamoDB tables!
    echo Pressione qualquer tecla para continuar ou Ctrl+C para cancelar...
    pause
    terraform destroy -var-file="terraform.tfvars" -auto-approve
    goto :end
)

echo Comando desconhecido: %1
exit /b 1

:end
echo.
endlocal