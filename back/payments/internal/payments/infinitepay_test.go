package payments

import (
	"context"
	"encoding/json"
	"strings"
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

func TestBuildInfinitePayItemsUsesCentsAndShipping(t *testing.T) {
	items, err := buildInfinitePayItems(infinitePayOrder{
		Items: []infinitePayOrderItem{
			{ProductName: "Produto de Exemplo", Quantity: 1, UnitPrice: 10},
			{ProductName: "Camisa", Quantity: 2, UnitPrice: 50},
		},
		ShippingAmount: 15.90,
		Total:          125.90,
	})
	if err != nil {
		t.Fatalf("buildInfinitePayItems returned an error: %v", err)
	}
	if len(items) != 3 {
		t.Fatalf("expected two products and shipping, got %#v", items)
	}
	if items[0].Price != 1000 || items[1].Price != 5000 || items[2].Price != 1590 {
		t.Fatalf("expected prices in cents, got %#v", items)
	}
}

func TestBuildInfinitePayItemsRejectsDivergentTotal(t *testing.T) {
	_, err := buildInfinitePayItems(infinitePayOrder{
		Items: []infinitePayOrderItem{
			{ProductName: "Produto", Quantity: 1, UnitPrice: 50},
		},
		Total: 40,
	})
	if err == nil || !strings.Contains(err.Error(), "does not match") {
		t.Fatalf("expected divergent total error, got %v", err)
	}
}

func TestNormalizeBrazilPhone(t *testing.T) {
	if got := normalizeBrazilPhone("(31) 98540-4444"); got != "+5531985404444" {
		t.Fatalf("unexpected normalized phone: %s", got)
	}
	if got := normalizeBrazilPhone("+55 31 98540-4444"); got != "+5531985404444" {
		t.Fatalf("country code must not be duplicated: %s", got)
	}
}

func TestGenerateUUIDUsesStandardShape(t *testing.T) {
	value := generateUUID()
	if len(value) != 36 || value[8] != '-' || value[13] != '-' || value[18] != '-' || value[23] != '-' {
		t.Fatalf("unexpected UUID shape: %s", value)
	}
}

func TestInfinitePayWebhookRejectsMissingIdentifiers(t *testing.T) {
	response, err := HandleInfinitePayWebhook(context.Background(), events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Path:       "/webhook/infinitepay",
		Body:       `{"order_nsu":"pedido-sem-transacao"}`,
	})
	if err != nil {
		t.Fatalf("unexpected handler error: %v", err)
	}
	if response.StatusCode != 400 {
		t.Fatalf("expected status 400, got %d: %s", response.StatusCode, response.Body)
	}
	var body map[string]interface{}
	if json.Unmarshal([]byte(response.Body), &body) != nil || body["success"] != false {
		t.Fatalf("unexpected webhook response: %s", response.Body)
	}
}
