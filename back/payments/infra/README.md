# Infra Lambda lb_mundocolore-payments

## Build

```bash
cd ..
GOOS=linux GOARCH=amd64 go build -o bootstrap main.go
zip lambda.zip bootstrap
```

## Deploy

```powershell
$env:AWS_PROFILE="mundocolore"
terraform init
terraform plan
terraform apply
```

Depois de criar ou alterar rotas no API Gateway, publique uma nova implantação do stage:

```powershell
$gatewayId = terraform output -raw api_gateway_id
aws apigateway create-deployment --rest-api-id $gatewayId --stage-name prod --region sa-east-1
```

## InfinitePay

Configuracao usada pela integracao:

- Handle: `dayvison-vicente-ds8`
- Redirect URL: `https://mundocolorestore.com/checkout/infinitepay/payment`
- Webhook URL: `https://mundocolorestore.com/webhook/infinitepay`
- API: `https://api.checkout.infinitepay.io`

O redirect e uma rota Angular. O webhook e encaminhado pelo CloudFront para o API Gateway e nao exige JWT; toda confirmacao recebida e validada novamente no endpoint `payment_check` da InfinitePay antes de aprovar o pedido.
