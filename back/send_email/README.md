# lb_mundocolore-send-email

Lambda Go para envio assincrono de e-mails pela Mailjet. Ela recebe JSON direto ou mensagens SQS, salva o payload recebido em `mundocolore-emails`, renderiza o template pelo campo `type`, envia pela Mailjet e atualiza o mesmo item no DynamoDB com assunto, corpo e resposta do provider.

## Tipos de e-mail

- `confirmacao-email-usuario`: boas-vindas e confirmacao de e-mail do usuario.
- `notificacao-pedido-criado`: pedido criado no checkout.
- `notificacao-pedido-em-analize`: pedido em analise.
- `notificacao-status-pedido`: atualizacao de status do pedido.
- `notificacao-credito-colore-adicionado`: credito Mundo Colore Store adicionado.
- `email-admin-manual`: mensagem livre validada pela API administrativa
  `email_mailbox` e publicada na mesma fila SQS.

Os templates ficam em `templates.go` para facilitar edicao e inclusao de novos modelos.

## Newsletter

O endpoint publico `POST /newsletter` recebe:

```json
{
  "email": "cliente@email.com"
}
```

O cadastro e idempotente: o identificador `newsletter#<email-normalizado>` impede duplicatas.
Os assinantes ficam na mesma tabela `mundocolore-emails` com `type=newsletter-subscriber`,
`status=active`, `to_email`, `subscribed_at` e os dados de consentimento.

- Para listar assinantes por data, consulte `type-received-index` com
  `type = newsletter-subscriber`.
- Para localizar um e-mail especifico, consulte `to-email-received-index` usando o e-mail
  em letras minusculas.

## Evento JSON

```json
{
  "id": "6c7a3ef6d9954f96a1be0a8cd4876cbb",
  "uuid": "6c7a3ef6d9954f96a1be0a8cd4876cbb",
  "type": "notificacao-pedido-em-analize",
  "to_email": "cliente@email.com",
  "to_name": "Maria Silva",
  "data": {
    "nome_do_cliente": "Maria Silva",
    "numero_do_pedido": "12345",
    "valor_do_pedido": "R$ 99,90"
  }
}
```

## Variaveis de ambiente

```powershell
$env:MAILJET_API_KEY="sua-api-key-mailjet"
$env:MAILJET_SECRET_KEY="sua-secret-key-mailjet"
$env:EMAIL_FROM="contato@mundocolorestore.com"
$env:EMAIL_FROM_NAME="Mundo Colore Store"
$env:TABLE_NAME="mundocolore-emails"
```

Para deploy via `back/deploy_lambdas.py`, crie `back/.mailjet_api_key` com o JSON:

```json
{
  "api_key": "XXXXXXXXXXX",
  "secret_key": "XXXXXXXXXXXXX"
}
```

Esse arquivo e ignorado pelo Git.

## Build local no Windows PowerShell

```powershell
$env:GOOS="linux"; $env:GOARCH="amd64"; $env:CGO_ENABLED="0"; go build -o bootstrap .; Compress-Archive -Path bootstrap -DestinationPath lambda.zip -Force
```

## Deploy

1. Crie/atualize a tabela DynamoDB em `back/dynamoDB`.
2. Crie `back/.mailjet_api_key`.
3. Ajuste `version_local` para uma versao maior que `version_update`.
4. Execute:

```powershell
python back/deploy_lambdas.py --lambda send_email
```

Como o endpoint da newsletter cria uma nova rota no API Gateway, publique uma nova
implantacao do stage `prod` depois do primeiro deploy desta versao:

```powershell
aws apigateway create-deployment --rest-api-id b8i4etrh23 --stage-name prod --profile mundocolore --region sa-east-1
```
