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
