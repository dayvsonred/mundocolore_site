# Exclusao de pedidos antigos

Este documento explica como usar o script `delete_old_orders.py` para apagar
pedidos antigos e suas referencias nas tabelas DynamoDB da Mundo Colore.

## O que o script remove

Para cada pedido selecionado, o script:

- apaga o pedido da tabela `mundocolore-orders`;
- apaga pagamentos relacionados em `mundocolore-payments`;
- apaga e-mails que contenham referencia ao pedido em `mundocolore-emails`;
- remove as parcelas do pedido em `mundocolore-credit`;
- devolve ao usuario o Credito Colore ainda reservado pelo pedido;
- verifica as demais tabelas com prefixo `mundocolore-` e remove registros que
  contenham referencia ao ID do pedido.

A limpeza real e enviada ao DynamoDB como uma transacao atomica. Se uma das
operacoes falhar, nenhuma das alteracoes da transacao e aplicada.

## Protecoes de seguranca

- O comportamento padrao e somente simular a limpeza.
- A exclusao exige as opcoes `--execute` e `--confirm DELETE-OLD-ORDERS`.
- Antes da exclusao real, o script cria um backup dos registros afetados.
- Registros usados pelo health check nao sao tratados como pedidos.
- A transacao e interrompida se ultrapassar o limite de 100 operacoes do
  DynamoDB. Nesse caso, execute a limpeza em grupos menores.

## Pre-requisitos

Antes de executar, confirme que estao instalados:

- Python 3;
- biblioteca Python `boto3`;
- AWS CLI com o perfil `mundocolore` configurado;
- permissao para consultar e alterar as tabelas DynamoDB.

Para verificar o perfil AWS:

```powershell
aws sts get-caller-identity --profile mundocolore
```

A conta retornada para o ambiente de producao deve ser `261955339827`.

Para verificar o `boto3`:

```powershell
python -c "import boto3; print(boto3.__version__)"
```

## Entrar na pasta do backend

Abra o PowerShell e execute:

```powershell
cd "C:\Users\niore\Documents\projeto mundocolore\mundocolore_site\back"
```

## Consultar a ajuda

```powershell
python delete_old_orders.py --help
```

## Fazer uma simulacao

### Simular todos os pedidos existentes

```powershell
python delete_old_orders.py --all-orders
```

Esse comando mostra:

- os pedidos selecionados;
- as datas, os status e os valores;
- quantos registros relacionados serao removidos de cada tabela;
- quantas parcelas serao removidas;
- como ficara o credito utilizado do usuario.

Nenhum dado e alterado durante a simulacao.

### Simular pedidos anteriores a uma data

A data e interpretada em UTC quando nenhum fuso e informado.

```powershell
python delete_old_orders.py --before 2026-07-20T00:28:00Z
```

Esse modo e recomendado para remover somente os pedidos criados antes da
publicacao da nova estrutura de precos. Pedidos criados exatamente no horario
informado ou depois dele nao serao selecionados.

### Simular um pedido especifico

```powershell
python delete_old_orders.py --order-id 57847247a58d8cea784b119d577f17e9
```

Para selecionar varios pedidos, repita a opcao:

```powershell
python delete_old_orders.py `
  --order-id 57847247a58d8cea784b119d577f17e9 `
  --order-id bb6f38292911cf4c43b54862976202de
```

## Executar a exclusao real

Sempre execute primeiro o mesmo comando sem `--execute` e confira o plano.

### Excluir pedidos anteriores a uma data

```powershell
python delete_old_orders.py `
  --before 2026-07-20T00:28:00Z `
  --execute `
  --confirm DELETE-OLD-ORDERS
```

### Excluir todos os pedidos existentes

Use esta opcao somente quando tiver certeza de que nenhum pedido deve ser
preservado:

```powershell
python delete_old_orders.py `
  --all-orders `
  --execute `
  --confirm DELETE-OLD-ORDERS
```

### Excluir um pedido especifico

```powershell
python delete_old_orders.py `
  --order-id 57847247a58d8cea784b119d577f17e9 `
  --execute `
  --confirm DELETE-OLD-ORDERS
```

## Usar outro perfil ou regiao

O padrao e o perfil `mundocolore` e a regiao `sa-east-1`.

Para informar valores diferentes:

```powershell
python delete_old_orders.py `
  --all-orders `
  --profile mundocolore `
  --region sa-east-1
```

## Backup

Antes de executar uma exclusao real, o script cria automaticamente um arquivo
como:

```text
back/backups/delete_old_orders_20260720T010000Z.json
```

O backup contem:

- os registros que foram apagados;
- a versao anterior dos registros de Credito Colore alterados;
- os valores no formato DynamoDB JSON.

A pasta `back/backups/` esta no `.gitignore` porque pode conter dados de
clientes. Nao publique esses arquivos no GitHub e nao envie o backup para
pessoas sem autorizacao.

## Verificacao depois da exclusao

Execute novamente a mesma selecao sem `--execute`. Exemplo:

```powershell
python delete_old_orders.py --before 2026-07-20T00:28:00Z
```

O resultado esperado e:

```text
Nenhum pedido corresponde aos criterios informados.
```

Tambem e recomendado verificar:

1. A tela administrativa `/minha-conta/lista-pedidos`.
2. A tela `/minha-conta/pedidos-pagamentos`.
3. O credito disponivel dos usuarios que tinham pedidos em Credito Colore.
4. O arquivo de backup criado em `back/backups/`.

## Mensagens de erro comuns

### Confirmacao obrigatoria

```text
Erro: use --confirm DELETE-OLD-ORDERS para executar.
```

Inclua exatamente:

```text
--execute --confirm DELETE-OLD-ORDERS
```

### Pedido nao encontrado

Confira o ID informado e execute uma simulacao com `--all-orders` para listar
os pedidos existentes.

### Limite de 100 operacoes

Selecione menos pedidos usando `--before` ou `--order-id` e execute a limpeza
em grupos menores.

### Perfil AWS nao encontrado

Confira os perfis configurados:

```powershell
aws configure list-profiles
```

Depois informe o perfil correto com `--profile`.

