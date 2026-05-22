package products

import (
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "OPTIONS" {
		return successJSONResponse(200, `{}`), nil
	}

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
		if strings.HasSuffix(request.Path, "/products/brands") {
			return HandleCreateBrand(ctx, request)
		}
		if strings.HasSuffix(request.Path, "/products/collections") {
			return HandleCreateCollection(ctx, request)
		}
		if strings.HasSuffix(request.Path, "/products") {
			return HandleCreateProduct(ctx, request)
		}
	case "GET":
		if strings.HasSuffix(request.Path, "/products/brands") {
			return HandleGetBrands(ctx, request)
		}
		if strings.HasSuffix(request.Path, "/products/collections") {
			return HandleGetCollections(ctx, request)
		}
		if strings.HasSuffix(request.Path, "/products") {
			return HandleGetProducts(ctx, request)
		}
		if strings.Contains(request.Path, "/products/") {
			return HandleGetProduct(ctx, request)
		}
	case "PUT", "PATCH":
		if strings.Contains(request.Path, "/products/") {
			return HandleUpdateProduct(ctx, request)
		}
	case "DELETE":
		if strings.Contains(request.Path, "/products/") {
			return HandleDeleteProduct(ctx, request)
		}
	}

	return notFoundResponse(), nil
}
