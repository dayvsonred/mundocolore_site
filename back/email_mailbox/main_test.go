package main

import (
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

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
