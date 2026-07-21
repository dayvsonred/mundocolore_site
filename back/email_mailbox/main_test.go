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
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
)

type dynamoQueryMock struct {
	dynamodbiface.DynamoDBAPI
	output *dynamodb.QueryOutput
	err    error
}

func (mock *dynamoQueryMock) QueryWithContext(
	_ aws.Context,
	_ *dynamodb.QueryInput,
	_ ...request.Option,
) (*dynamodb.QueryOutput, error) {
	return mock.output, mock.err
}

func TestParseRawEmailMultipart(t *testing.T) {
	raw := strings.Join([]string{
		"From: =?UTF-8?Q?Jo=C3=A3o?= <joao@example.com>",
		"To: contato@mundocolorestore.com",
		"Subject: Teste",
		"MIME-Version: 1.0",
		"Content-Type: multipart/alternative; boundary=test-boundary",
		"",
		"--test-boundary",
		"Content-Type: text/plain; charset=utf-8",
		"",
		"Mensagem de teste",
		"--test-boundary--",
	}, "\r\n")

	parsed, err := parseRawEmail([]byte(raw))
	if err != nil {
		t.Fatal(err)
	}
	if parsed.FromName != "João" || !strings.Contains(parsed.BodyText, "Mensagem de teste") {
		t.Fatalf("unexpected parsed email: %#v", parsed)
	}
}

func TestCursorRoundTrip(t *testing.T) {
	want := map[string]*dynamodb.AttributeValue{
		"id": {S: aws.String("inbound:contato:abc")},
	}
	encoded, err := encodeCursor(want)
	if err != nil {
		t.Fatal(err)
	}
	got, err := decodeCursor(encoded)
	if err != nil {
		t.Fatal(err)
	}
	if aws.StringValue(got["id"].S) != "inbound:contato:abc" {
		t.Fatalf("unexpected cursor: %#v", got)
	}
}

func TestDayBoundsUsesSaoPauloDay(t *testing.T) {
	start, end, err := dayBounds("2026-07-19")
	if err != nil {
		t.Fatal(err)
	}
	if start != "2026-07-19T03:00:00Z" || end != "2026-07-20T03:00:00Z" {
		t.Fatalf("unexpected bounds: %s - %s", start, end)
	}
	for _, value := range []string{"19/07/2026", "2026-02-30", ""} {
		_, _, err := dayBounds(value)
		if value == "" {
			if err != nil {
				t.Fatalf("empty day should be allowed: %v", err)
			}
			continue
		}
		if err == nil {
			t.Fatalf("expected invalid day: %q", value)
		}
	}
}

func TestEmailIDFromPath(t *testing.T) {
	got := emailIDFromPath("/prod/emails/inbound%3Acontato%3Aabc")
	if got != "inbound:contato:abc" {
		t.Fatalf("emailIDFromPath() = %q", got)
	}
}

func TestSentEmailIDFromPath(t *testing.T) {
	got := sentEmailIDFromPath("/prod/emails/sent/abc%3A123")
	if got != "abc:123" {
		t.Fatalf("sentEmailIDFromPath() = %q", got)
	}
}

func TestHandleSentListPaginatesAndNormalizesHistoricalRecords(t *testing.T) {
	previousClient := dynamoClient
	previousConfig := appConfig
	t.Cleanup(func() {
		dynamoClient = previousClient
		appConfig = previousConfig
	})

	records := []emailRecord{
		{ID: "1", Type: "email-admin-manual", FromEmail: "contato@mundocolorestore.com", ToEmail: "one@example.com", ReceivedAt: "2026-07-20T13:00:00Z", RenderedSubj: "Primeiro", Status: "sent"},
		{ID: "2", Type: "email-admin-manual", FromEmail: "contato@mundocolorestore.com", ToEmail: "two@example.com", ReceivedAt: "2026-07-20T12:00:00Z", RenderedSubj: "Segundo", Status: "sent"},
		{ID: "3", Type: "email-admin-manual", FromEmail: "contato@mundocolorestore.com", ToEmail: "three@example.com", ReceivedAt: "2026-07-20T11:00:00Z", RenderedSubj: "Terceiro", Status: "sent"},
	}
	items := make([]map[string]*dynamodb.AttributeValue, 0, len(records))
	for _, record := range records {
		item, err := dynamodbattribute.MarshalMap(record)
		if err != nil {
			t.Fatal(err)
		}
		items = append(items, item)
	}
	dynamoClient = &dynamoQueryMock{output: &dynamodb.QueryOutput{Items: items}}
	appConfig.TableName = "mundocolore-emails"
	appConfig.SentIndex = "type-received-index"
	appConfig.AllowedMailboxes = []string{"contato@mundocolorestore.com"}

	response, err := handleSentList(context.Background(), events.APIGatewayProxyRequest{
		QueryStringParameters: map[string]string{
			"mailbox": "contato@mundocolorestore.com",
			"limit":   "2",
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	if response.StatusCode != 200 {
		t.Fatalf("status %d: %s", response.StatusCode, response.Body)
	}
	var body listResponse
	if err := json.Unmarshal([]byte(response.Body), &body); err != nil {
		t.Fatal(err)
	}
	if len(body.Items) != 2 || body.NextCursor == "" {
		t.Fatalf("unexpected pagination: %#v", body)
	}
	if body.Items[0].Subject != "Primeiro" || body.Items[0].Direction != "outbound" {
		t.Fatalf("historical record was not normalized: %#v", body.Items[0])
	}
}

func TestHandleListSeparatesReadFolder(t *testing.T) {
	previousClient := dynamoClient
	previousConfig := appConfig
	t.Cleanup(func() {
		dynamoClient = previousClient
		appConfig = previousConfig
	})

	records := []emailRecord{
		{ID: "unread", Mailbox: "contato@mundocolorestore.com", ReceivedSort: "2026-07-20T13:00:00Z#unread", Status: "unread"},
		{ID: "read", Mailbox: "contato@mundocolorestore.com", ReceivedSort: "2026-07-20T12:00:00Z#read", Status: "read"},
	}
	items := make([]map[string]*dynamodb.AttributeValue, 0, len(records))
	for _, record := range records {
		item, err := dynamodbattribute.MarshalMap(record)
		if err != nil {
			t.Fatal(err)
		}
		items = append(items, item)
	}
	dynamoClient = &dynamoQueryMock{output: &dynamodb.QueryOutput{Items: items}}
	appConfig.TableName = "mundocolore-emails"
	appConfig.MailboxIndex = "mailbox-received-index"
	appConfig.AllowedMailboxes = []string{"contato@mundocolorestore.com"}

	response, err := handleList(context.Background(), events.APIGatewayProxyRequest{
		QueryStringParameters: map[string]string{
			"mailbox": "contato@mundocolorestore.com",
			"status":  "read",
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	var body listResponse
	if err := json.Unmarshal([]byte(response.Body), &body); err != nil {
		t.Fatal(err)
	}
	if len(body.Items) != 1 || body.Items[0].ID != "read" {
		t.Fatalf("read folder contains unexpected items: %#v", body.Items)
	}
}
