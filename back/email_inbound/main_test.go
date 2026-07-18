package main

import (
	"reflect"
	"testing"
)

func TestRecipientAccounts(t *testing.T) {
	got := recipientAccounts([]string{
		"Contato@mundocolorestore.com",
		"vendas@mundocolorestore.com",
		"contato@mundocolorestore.com",
		"ignorar@example.com",
	}, "mundocolorestore.com")
	want := []string{"contato", "vendas"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("recipientAccounts() = %#v, want %#v", got, want)
	}
}

func TestBackendDayUsesSaoPauloDate(t *testing.T) {
	got := backendDay("2026-07-18T01:30:00.000Z")
	if got != "20260717" {
		t.Fatalf("backendDay() = %s, want 20260717", got)
	}
}

func TestSanitizeKeySegment(t *testing.T) {
	got := sanitizeKeySegment(" Pedido / 123 ")
	if got != "pedido-123" {
		t.Fatalf("sanitizeKeySegment() = %s, want pedido-123", got)
	}
}
