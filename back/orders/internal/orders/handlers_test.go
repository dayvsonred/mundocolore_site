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
