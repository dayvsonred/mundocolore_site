package orders

import "testing"

func TestCalculateSpreadPrice(t *testing.T) {
	if got := calculateSpreadPrice(100, 20); got != 120 {
		t.Fatalf("expected 120, got %.2f", got)
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
