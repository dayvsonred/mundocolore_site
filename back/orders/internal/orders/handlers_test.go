package orders

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/aws/aws-sdk-go/service/sqs/sqsiface"
)

type orderEmailSQSMock struct {
	sqsiface.SQSAPI
	input *sqs.SendMessageInput
}

func (mock *orderEmailSQSMock) SendMessage(input *sqs.SendMessageInput) (*sqs.SendMessageOutput, error) {
	mock.input = input
	return &sqs.SendMessageOutput{}, nil
}

func TestCalculateSpreadPrice(t *testing.T) {
	if got := calculateSpreadPrice(100, 20); got != 120 {
		t.Fatalf("expected 120, got %.2f", got)
	}
}

func TestApplyOrderItemTotalsKeepsThreeFinancialValues(t *testing.T) {
	item := applyOrderItemTotals(OrderItem{
		Quantity:      2,
		CostUnitPrice: 100,
		BaseUnitPrice: 200,
		UnitPrice:     130,
	})
	if item.CostSubtotal != 200 || item.BaseSubtotal != 400 || item.SoldSubtotal != 260 {
		t.Fatalf("unexpected item totals: %#v", item)
	}
	if item.DiscountAmount != 140 || item.GrossProfitAmount != 60 || item.Subtotal != 260 {
		t.Fatalf("unexpected discount or profit: %#v", item)
	}
}

func TestNormalizeCouponCode(t *testing.T) {
	if got := normalizeCouponCode(" marina10 "); got != "MARINA10" {
		t.Fatalf("expected MARINA10, got %s", got)
	}
}

func TestOrderStatusLabelUsesPortuguese(t *testing.T) {
	tests := map[string]string{
		"pending_payment":  "Aguardando pagamento",
		"pending_approval": "Aguardando aprovação",
		"approved":         "Pedido aprovado",
		"packed":           "Pedido embalado",
		"shipped":          "Pedido enviado",
		"delivered":        "Pedido entregue",
		"finished":         "Pedido finalizado",
		"cancelled":        "Pedido cancelado",
	}
	for status, expected := range tests {
		if got := orderStatusLabel(status); got != expected {
			t.Errorf("status %s: got %q, want %q", status, got, expected)
		}
	}
}

func TestFormatOrderItemsUsesSalePrices(t *testing.T) {
	formatted := formatOrderItems([]OrderItem{{
		ProductName: "Vestido Floral", Quantity: 2, UnitPrice: 129.9, SoldSubtotal: 259.8,
		Size: "M", Color: "Azul",
	}})
	for _, expected := range []string{"Vestido Floral", "Quantidade: 2", "Valor unitário: R$ 129,90", "Total: R$ 259,80", "Tamanho: M", "Cor: Azul"} {
		if !strings.Contains(formatted, expected) {
			t.Fatalf("expected %q in formatted items: %s", expected, formatted)
		}
	}
}

func TestBuildInstallmentScheduleUsesOrderDateAndExactTotal(t *testing.T) {
	order := Order{
		ID: "order-1", Total: 100, CreatedAt: "2026-01-31T15:00:00Z", ApprovedAt: "2026-02-02T15:00:00Z",
		Payment: OrderPayment{Installments: 3},
	}
	schedule := buildInstallmentSchedule(order)
	if len(schedule) != 3 {
		t.Fatalf("expected 3 installments, got %d", len(schedule))
	}
	if schedule[0].DueDate != "2026-02-28" || schedule[1].DueDate != "2026-03-31" || schedule[2].DueDate != "2026-04-30" {
		t.Fatalf("unexpected due dates: %#v", schedule)
	}
	if schedule[0].Amount != 33.33 || schedule[1].Amount != 33.33 || schedule[2].Amount != 33.34 {
		t.Fatalf("unexpected installment amounts: %#v", schedule)
	}
	if schedule[0].CreatedAt != "2026-02-02T15:00:00Z" {
		t.Fatalf("expected actual approval time as installment creation time, got %s", schedule[0].CreatedAt)
	}
	if formatted := formatOrderInstallments(order); !strings.Contains(formatted, "vencimento em 28/02/2026") {
		t.Fatalf("expected localized due date in email: %s", formatted)
	}
}

func TestEnqueueOrderEmailIncludesLocalizedDetails(t *testing.T) {
	previousClient := sqsClient
	previousQueueURL := emailQueueURL
	mock := &orderEmailSQSMock{}
	sqsClient = mock
	emailQueueURL = "https://sqs.example.com/order-emails"
	t.Cleanup(func() {
		sqsClient = previousClient
		emailQueueURL = previousQueueURL
	})

	order := Order{
		ID: "order-1", Total: 259.8, Status: "approved", CreatedAt: "2026-07-21T12:00:00Z",
		Customer: OrderPerson{Name: "Maria", Email: "maria@example.com"},
		Payment:  OrderPayment{Installments: 2},
		Items: []OrderItem{{
			ProductName: "Vestido Floral", Quantity: 2, UnitPrice: 129.9, SoldSubtotal: 259.8,
		}},
	}
	if err := enqueueOrderEmail("notificacao-status-pedido", order); err != nil {
		t.Fatalf("enqueueOrderEmail returned an error: %v", err)
	}
	if mock.input == nil {
		t.Fatal("expected an SQS message")
	}
	var payload EmailQueuePayload
	if err := json.Unmarshal([]byte(aws.StringValue(mock.input.MessageBody)), &payload); err != nil {
		t.Fatalf("could not decode SQS payload: %v", err)
	}
	if payload.Data["status_do_pedido"] != "Pedido aprovado" {
		t.Fatalf("unexpected localized status: %q", payload.Data["status_do_pedido"])
	}
	if !strings.Contains(payload.Data["itens_do_pedido"], "Vestido Floral") || !strings.Contains(payload.Data["itens_do_pedido"], "R$ 129,90") {
		t.Fatalf("missing sale item details: %s", payload.Data["itens_do_pedido"])
	}
	if !strings.Contains(payload.Data["parcelas_do_pedido"], "Parcela 1 de 2") || !strings.Contains(payload.Data["parcelas_do_pedido"], "vencimento em 21/08/2026") {
		t.Fatalf("missing installment details: %s", payload.Data["parcelas_do_pedido"])
	}
}

func TestFindCouponReductionSupportsCouponListAndLegacyCoupon(t *testing.T) {
	collection := CollectionPricing{
		Coupons: []CollectionCoupon{
			{Code: "PRIMEIRO", SpreadReductionPercent: 5},
			{Code: "SEGUNDO", SpreadReductionPercent: 12.5},
		},
		CouponCode:                   "LEGADO",
		CouponSpreadReductionPercent: 8,
	}
	if got := findCouponReduction(collection, " segundo "); got != 12.5 {
		t.Fatalf("expected list coupon reduction 12.5, got %.2f", got)
	}
	if got := findCouponReduction(collection, "legado"); got != 8 {
		t.Fatalf("expected legacy coupon reduction 8, got %.2f", got)
	}
	if got := findCouponReduction(collection, "INVALIDO"); got != 0 {
		t.Fatalf("expected invalid coupon reduction 0, got %.2f", got)
	}
}

func TestOrderMatchesFiltersSupportsUserBrandCollectionAndValue(t *testing.T) {
	order := Order{
		UserID: "user-1", Total: 250, CreatedAt: "2026-06-08T12:00:00Z", Status: "pending_approval", CouponCode: "MARINA70",
		Customer: OrderPerson{Name: "Maria", Email: "maria@example.com"},
		Items:    []OrderItem{{ProductCode: "46801", ProductName: "Pijama", Brand: "Marca A", Collection: "Verao"}},
	}
	if !orderMatchesFilters(order, map[string]string{"user": "maria", "brand": "marca a", "collection": "verao", "coupon": "marina", "has_coupon": "true", "product": "46801", "min_value": "200", "max_value": "300"}) {
		t.Fatal("expected order to match admin filters")
	}
	if orderMatchesFilters(order, map[string]string{"status": "approved"}) {
		t.Fatal("expected status filter not to match")
	}
	if orderMatchesFilters(order, map[string]string{"has_coupon": "false"}) {
		t.Fatal("expected order with coupon not to match has_coupon=false")
	}
}

func TestCustomerOrderResponseDoesNotExposeInternalPricing(t *testing.T) {
	order := Order{
		CostSubtotal:      100,
		SoldSubtotal:      130,
		GrossProfitAmount: 30,
		Items: []OrderItem{{
			CostUnitPrice:           100,
			BaseUnitPrice:           200,
			UnitPrice:               130,
			SpreadPercentAtPurchase: 100,
			CostSubtotal:            100,
			SoldSubtotal:            130,
			GrossProfitAmount:       30,
		}},
	}
	body, err := json.Marshal(OrderResponse(order))
	if err != nil {
		t.Fatalf("marshal customer order: %v", err)
	}
	for _, field := range []string{"cost_unit_price", "cost_subtotal", "spread_percent_at_purchase", "gross_profit_amount"} {
		if strings.Contains(string(body), field) {
			t.Fatalf("customer response must not expose %s: %s", field, body)
		}
	}
}

func TestAdminOrderResponseIncludesFinancialSnapshot(t *testing.T) {
	order := Order{
		CostSubtotal:      100,
		Subtotal:          200,
		SoldSubtotal:      130,
		GrossProfitAmount: 30,
		Items: []OrderItem{{
			CostUnitPrice:           100,
			BaseUnitPrice:           200,
			UnitPrice:               130,
			SpreadPercentAtPurchase: 100,
			CostSubtotal:            100,
			BaseSubtotal:            200,
			SoldSubtotal:            130,
			GrossProfitAmount:       30,
		}},
	}
	body, err := json.Marshal(toAdminOrderResponse(order))
	if err != nil {
		t.Fatalf("marshal admin order: %v", err)
	}
	for _, field := range []string{"cost_unit_price", "cost_subtotal", "spread_percent_at_purchase", "gross_profit_amount", "gross_margin_percent"} {
		if !strings.Contains(string(body), field) {
			t.Fatalf("admin response must include %s: %s", field, body)
		}
	}
	if strings.Count(string(body), `"items"`) != 1 {
		t.Fatalf("admin response must contain a single items field: %s", body)
	}
}
