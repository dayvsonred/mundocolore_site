package payments

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

	token := getAuthorizationHeader(request.Headers)
	if token == "" {
		return unauthorizedResponse("no token"), nil
	}

	token = strings.TrimPrefix(token, "Bearer ")
	userID, err := validateJWT(token)
	if err != nil {
		return unauthorizedResponse("invalid token"), nil
	}

	if request.HTTPMethod == "POST" && strings.HasSuffix(request.Path, "/payments") {
		return HandleCreatePayment(ctx, request, userID)
	}

	return notFoundResponse(), nil
}
