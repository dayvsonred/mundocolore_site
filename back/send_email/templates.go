package main

var templates = map[string]EmailTemplate{
	"notificacao-pedido-em-analize": {
		Subject: "Pedido {{numero_do_pedido}} em análise",
		Body: `Olá {{nome_do_cliente}},

Seu pedido {{numero_do_pedido}} está em análise.

Status atual: {{status_do_pedido}}
Valor do pedido: {{valor_do_pedido}}

Itens comprados:
{{itens_do_pedido}}
{{parcelas_do_pedido}}

Data da atualização: {{data_atual}} às {{hora_atual}}

Assim que a análise for concluída, enviaremos uma nova notificação.

Atenciosamente,
Equipe de Atendimento`,
	},
	"confirmacao-email-usuario": {
		Subject: "Confirme seu e-mail na Mundo Colore Store",
		Body: `Ola {{nome_do_cliente}},

Sua conta na Mundo Colore Store foi criada.

Para confirmar seu e-mail, acesse:
{{link_confirmacao}}

Data do envio: {{data_atual}} as {{hora_atual}}

Atenciosamente,
Equipe Mundo Colore Store`,
	},
	"reset-senha-usuario": {
		Subject: "Reset de senha Mundo Colore Store",
		Body: `Ola {{nome_do_cliente}},

Recebemos uma solicitacao para resetar sua senha.

Para cadastrar uma nova senha, acesse:
{{link_reset}}

Esse link pode ser usado apenas uma vez.

Data do envio: {{data_atual}} as {{hora_atual}}

Atenciosamente,
Equipe Mundo Colore Store`,
	},
	"notificacao-pedido-criado": {
		Subject: "Recebemos seu pedido {{numero_do_pedido}}",
		Body: `Olá {{nome_do_cliente}},

Recebemos seu pedido {{numero_do_pedido}}.

Valor do pedido: {{valor_do_pedido}}
Status atual: {{status_do_pedido}}

Itens comprados:
{{itens_do_pedido}}
{{parcelas_do_pedido}}

Data do pedido: {{data_atual}} às {{hora_atual}}

Enviaremos novas notificações quando o status for atualizado.

Atenciosamente,
Equipe Mundo Colore Store`,
	},
	"notificacao-status-pedido": {
		Subject: "Pedido {{numero_do_pedido}} atualizado para {{status_do_pedido}}",
		Body: `Olá {{nome_do_cliente}},

O status do pedido {{numero_do_pedido}} foi atualizado.

Novo status: {{status_do_pedido}}
Valor do pedido: {{valor_do_pedido}}

Itens comprados:
{{itens_do_pedido}}
{{parcelas_do_pedido}}

Data da atualização: {{data_atual}} às {{hora_atual}}

Atenciosamente,
Equipe Mundo Colore Store`,
	},
	"notificacao-credito-colore-adicionado": {
		Subject: "Credito Mundo Colore Store adicionado",
		Body: `Ola {{nome_do_cliente}},

Foi adicionado credito Mundo Colore Store para sua conta.

Valor adicionado: {{valor_credito}}
Credito disponivel: {{credito_disponivel}}
Data da atualizacao: {{data_atual}} as {{hora_atual}}

Atenciosamente,
Equipe Mundo Colore Store`,
	},
}
