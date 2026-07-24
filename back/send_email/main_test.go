package main

import (
	"context"
	"encoding/json"
	"strings"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/request"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
)

func TestOrderTemplatesRenderItemsStatusAndInstallments(t *testing.T) {
	variables := map[string]string{
		"nome_do_cliente":    "Maria",
		"numero_do_pedido":   "PEDIDO-1",
		"valor_do_pedido":    "R$ 259,80",
		"status_do_pedido":   "Pedido aprovado",
		"itens_do_pedido":    "- 2 x Vestido Floral — R$ 259,80",
		"parcelas_do_pedido": "Parcelas:\n- Parcela 1 de 2: R$ 129,90 — vencimento em 21/08/2026",
		"data_atual":         "21/07/2026",
		"hora_atual":         "12:00",
	}
	for _, templateName := range []string{"notificacao-pedido-em-analize", "notificacao-pedido-criado", "notificacao-status-pedido"} {
		template := templates[templateName]
		subject := renderTemplate(template.Subject, variables)
		body := renderTemplate(template.Body, variables)
		for _, expected := range []string{"Pedido aprovado", "Vestido Floral", "R$ 259,80", "vencimento em 21/08/2026"} {
			if !strings.Contains(subject+body, expected) {
				t.Errorf("template %s does not contain %q: %s\n%s", templateName, expected, subject, body)
			}
		}
		if strings.Contains(subject+body, "{{") {
			t.Errorf("template %s contains an unresolved variable: %s\n%s", templateName, subject, body)
		}
	}
}

type dynamoMock struct {
	dynamodbiface.DynamoDBAPI
	input  *dynamodb.UpdateItemInput
	output *dynamodb.UpdateItemOutput
	err    error
}

func (mock *dynamoMock) UpdateItemWithContext(
	_ aws.Context,
	input *dynamodb.UpdateItemInput,
	_ ...request.Option,
) (*dynamodb.UpdateItemOutput, error) {
	mock.input = input
	return mock.output, mock.err
}

func TestNormalizeNewsletterEmail(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  string
		valid bool
	}{
		{name: "normalizes", input: " Cliente@Example.com ", want: "cliente@example.com", valid: true},
		{name: "rejects missing domain suffix", input: "cliente@example", valid: false},
		{name: "rejects display name", input: "Cliente <cliente@example.com>", valid: false},
		{name: "rejects empty", input: "", valid: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got, err := normalizeNewsletterEmail(test.input)
			if test.valid && err != nil {
				t.Fatalf("expected valid email, got %v", err)
			}
			if !test.valid && err == nil {
				t.Fatal("expected invalid email")
			}
			if got != test.want {
				t.Fatalf("got %q, want %q", got, test.want)
			}
		})
	}
}

func TestNewsletterAPIStoresSubscriber(t *testing.T) {
	previousClient := dynamoClient
	previousConfig := config
	t.Cleanup(func() {
		dynamoClient = previousClient
		config = previousConfig
	})

	mock := &dynamoMock{output: &dynamodb.UpdateItemOutput{}}
	dynamoClient = mock
	config.TableName = "mundocolore-emails"

	event := events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Path:       "/newsletter",
		Body:       `{"email":" Cliente@Example.com "}`,
	}
	raw, err := json.Marshal(event)
	if err != nil {
		t.Fatal(err)
	}

	result, err := handler(context.Background(), raw)
	if err != nil {
		t.Fatalf("handler returned error: %v", err)
	}
	response, ok := result.(events.APIGatewayProxyResponse)
	if !ok {
		t.Fatalf("unexpected response type %T", result)
	}
	if response.StatusCode != 200 {
		t.Fatalf("got status %d, body %s", response.StatusCode, response.Body)
	}
	if mock.input == nil {
		t.Fatal("expected DynamoDB update")
	}
	if got := aws.StringValue(mock.input.Key["id"].S); got != "newsletter#cliente@example.com" {
		t.Fatalf("got id %q", got)
	}
	if got := aws.StringValue(mock.input.ExpressionAttributeValues[":type"].S); got != "newsletter-subscriber" {
		t.Fatalf("got type %q", got)
	}

	var body APIMessage
	if err := json.Unmarshal([]byte(response.Body), &body); err != nil {
		t.Fatal(err)
	}
	if !body.Created || body.Email != "cliente@example.com" {
		t.Fatalf("unexpected body: %+v", body)
	}
}

func TestNewsletterAPIReturnsAlreadyRegistered(t *testing.T) {
	previousClient := dynamoClient
	previousConfig := config
	t.Cleanup(func() {
		dynamoClient = previousClient
		config = previousConfig
	})

	dynamoClient = &dynamoMock{output: &dynamodb.UpdateItemOutput{
		Attributes: map[string]*dynamodb.AttributeValue{"id": {S: aws.String("existing")}},
	}}
	config.TableName = "mundocolore-emails"

	event := events.APIGatewayProxyRequest{HTTPMethod: "POST", Body: `{"email":"cliente@example.com"}`}
	raw, _ := json.Marshal(event)
	result, err := handler(context.Background(), raw)
	if err != nil {
		t.Fatal(err)
	}
	response := result.(events.APIGatewayProxyResponse)

	var body APIMessage
	if err := json.Unmarshal([]byte(response.Body), &body); err != nil {
		t.Fatal(err)
	}
	if body.Created {
		t.Fatal("expected existing subscription")
	}
}
