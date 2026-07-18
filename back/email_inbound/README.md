# Recebimento de emails Mundo Colore

Este modulo configura o Amazon SES para receber qualquer endereco de
`@mundocolorestore.com`, arquivar o email original no S3 e encaminhar uma copia
para `marinaluciara1986@gmail.com` pelo Mailjet.

Para cada destinatario, a Lambda grava o mesmo arquivo `.eml` em dois prefixos:

```text
box-email-mundocolorestore-v1/contato/20260717/<message-id>.eml
box-email-mundocolorestore-v1/contato/CAIXA-ENTRDA/<message-id>.eml
```

O SES tambem mantem a copia tecnica original em `ses-raw/<message-id>`.

Mensagens de ate 10 MB sao encaminhadas com o arquivo `.eml` anexado. Para
mensagens maiores, o encaminhamento inclui um link privado do S3 valido por sete
dias, evitando o limite de 15 MB de anexos da API do Mailjet.

O encaminhamento usa `contato@mundocolorestore.com`, remetente ativo e
verificado na conta Mailjet.

## Publicacao

As credenciais sao lidas de `back/email_inbound/.mailjet_api_key` pelo script de
deploy e nao sao salvas no Terraform:

```powershell
python back/deploy_lambdas.py --lambda email_inbound
```

O deploy cria o bucket privado, a Lambda, a identidade do dominio no SES, o MX
no Route53, a regra de recebimento e ativa o novo rule set. Como somente um rule
set do SES pode estar ativo por regiao, um rule set ativo anterior seria
substituido; a verificacao atual da conta nao encontrou nenhum.
