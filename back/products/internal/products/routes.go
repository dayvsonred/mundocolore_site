package products

import (
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "GET" {
		if strings.HasSuffix(request.Path, "/health/online") {
			return HandleHealthOnline(ctx, request)
		}
		if strings.HasSuffix(request.Path, "/health/data") {
			return HandleHealthData(ctx, request)
		}
	}

	switch request.HTTPMethod {
	case "POST":
		if strings.HasSuffix(request.Path, "/products") {
			return HandleCreateProduct(ctx, request)
		}
	case "GET":
		if strings.HasSuffix(request.Path, "/products") {
			return HandleGetProducts(ctx, request)
		}
	}

	return notFoundResponse(), nil
}
