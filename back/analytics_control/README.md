# analytics_control

Lambda responsavel por registrar acessos e interacoes do site no DynamoDB `mundocolore-analytics`.

## Endpoint

- `POST /analytics_control` registra um evento.
- `GET /analytics_control/health/online` valida se a Lambda esta online.
- `GET /analytics_control/health/data` consulta a tabela e retorna a contagem do dia atual do backend.

## Organizacao dos dados

A tabela usa `server_day` como chave de particao e `server_at_event_id` como chave de ordenacao. A data oficial do relatorio e gerada no backend com o fuso `America/Sao_Paulo`, separada da data enviada pelo navegador em `client_at`.

Indices criados em `back/dynamoDB`:

- `day-route-index`: buscar acessos de uma rota em um dia.
- `day-event-type-index`: separar `page_view`, `product_view`, `filter`, `product_code_search` e `brand_search`.
- `day-product-code-index`: buscar pesquisas ou acessos ligados a um codigo de produto em um dia.
- `day-brand-index`: buscar marcas pesquisadas/acessadas em um dia.
