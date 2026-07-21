package orders

import (
	"encoding/json"
	"strings"
	"testing"
)

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
