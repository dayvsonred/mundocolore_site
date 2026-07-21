# lb_mundocolore-email-mailbox

API administrativa da caixa de e-mails da Mundo Colore Store.

## Rotas

- `GET /emails/mailboxes`: lista caixas permitidas.
- `GET /emails?mailbox=...&status=unread|read&day=AAAA-MM-DD&q=...&cursor=...`: lista e
  pesquisa recebidos por pasta, com paginacao por cursor.
- `GET /emails/sent?mailbox=...&day=AAAA-MM-DD&q=...&cursor=...`: lista enviados
  com paginacao por cursor.
- `GET /emails/sent/{id}`: exibe o conteudo e o estado de processamento de um envio.
- `GET /emails/{id}`: le o `.eml` privado no S3 e marca como lido.
- `PATCH /emails/{id}`: altera o status para `read` ou `unread`.
- `POST /emails/send`: valida a composicao e publica na fila `mundocolore-send-email`.

Todas as rotas, exceto `OPTIONS`, exigem JWT de um usuario ativo na tabela
`mundocolore-role`.

O conteudo completo continua no S3. A tabela `mundocolore-emails` armazena
somente os metadados e a chave do objeto.

## Ordem de publicacao

1. Aplicar `back/dynamoDB` para criar o indice `mailbox-received-index`.
2. Publicar `send_email`, `email_inbound` e `email_mailbox` com
   `back/deploy_lambdas.py`.
3. Criar uma nova implantacao do stage `prod` do API Gateway depois que as
   rotas `/emails` forem criadas.
