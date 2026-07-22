package orders

import (
	"context"
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

func TestCouponValidationRouteDoesNotRequireAuthentication(t *testing.T) {
	response, err := HandleRequest(context.Background(), events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Path:       "/orders/coupon",
		Body:       "{",
	})
	if err != nil {
		t.Fatalf("HandleRequest returned an error: %v", err)
	}
	if response.StatusCode != 400 {
		t.Fatalf("expected coupon handler validation status 400, got %d: %s", response.StatusCode, response.Body)
	}
}
