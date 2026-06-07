package products

import (
	"encoding/base64"
	"fmt"
	"testing"
)

func TestParseImportProductsFileRequestAcceptsTextSizes(t *testing.T) {
	productFile := `[
		{
			"UUID": "text-size-product",
			"produto_id": "46594",
			"tamanho_original": "P a G",
			"tamanho_inicio": "P",
			"tamanho_fim": "G",
			"tamanhos_array": ["P", "M", "G"]
		}
	]`
	body := fmt.Sprintf(
		`{"file_name":"2025-VERAO-A_produtos_com_imagens.json","content_base64":"%s","brand":"UP-BABY","year":"2025","collection":"VERAO-A"}`,
		base64.StdEncoding.EncodeToString([]byte(productFile)),
	)

	_, products, err := parseImportProductsFileRequest(body)
	if err != nil {
		t.Fatalf("parse import file: %v", err)
	}
	if len(products) != 1 {
		t.Fatalf("expected 1 product, got %d", len(products))
	}

	sizes := sizeValuesToStrings(products[0].SizesArray)
	if got := fmt.Sprint(sizes); got != "[P M G]" {
		t.Fatalf("expected text sizes, got %s", got)
	}
	if sizeValueToInt(products[0].SizeStart) != 0 || sizeValueToInt(products[0].SizeEnd) != 0 {
		t.Fatalf("text size boundaries should not be stored as numeric boundaries")
	}
}

func TestCalculateSpreadPrice(t *testing.T) {
	if got := calculateSpreadPrice(100, 30); got != 130 {
		t.Fatalf("expected 130, got %.2f", got)
	}
	if got := calculateSpreadPrice(99.99, 10); got != 109.99 {
		t.Fatalf("expected rounded 109.99, got %.2f", got)
	}
}

func TestSanitizeProductForCustomerHidesCostAndSpread(t *testing.T) {
	product := sanitizeProductForCustomer(Product{
		Price:           130,
		CostPrice:       100,
		CostPriceRaw:    "100.00",
		SpreadPercent:   30,
		SpreadIsDefault: true,
	})
	if product.Price != 130 {
		t.Fatalf("selling price should remain visible")
	}
	if product.CostPrice != 0 || product.CostPriceRaw != "" || product.SpreadPercent != 0 {
		t.Fatalf("cost and spread should be hidden from customer response")
	}
}

func TestApplyCollectionToProductsUpdatesAssociatedFields(t *testing.T) {
	products := []Product{{
		Collection:       "Old name",
		Price:            100,
		CostPrice:        80,
		SpreadPercent:    10,
		ReleaseDate:      "2025-01-01",
		FinalizationDate: "2025-02-01",
	}}
	collection := Collection{
		Name:                 "New name",
		SpreadDefaultPercent: 25,
		DisplayStartAt:       "2026-03-01",
		DisplayEndAt:         "2026-04-01",
	}

	applyCollectionToProducts(products, collection, "2026-06-07T12:00:00Z")

	product := products[0]
	if product.Collection != collection.Name {
		t.Fatalf("expected collection name %q, got %q", collection.Name, product.Collection)
	}
	if product.Price != 100 || product.SpreadPercent != 25 || !product.SpreadIsDefault {
		t.Fatalf("expected price and default spread to be recalculated, got price %.2f and spread %.2f", product.Price, product.SpreadPercent)
	}
	if product.ReleaseDate != collection.DisplayStartAt || product.DisplayStartAt != collection.DisplayStartAt {
		t.Fatalf("expected collection start date to be applied to product")
	}
	if product.FinalizationDate != collection.DisplayEndAt || product.DisplayEndAt != collection.DisplayEndAt {
		t.Fatalf("expected collection end date to be applied to product")
	}
}
