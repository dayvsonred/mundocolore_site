package users

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

	if request.HTTPMethod == "POST" && strings.HasSuffix(request.Path, "/register") {
		return HandleRegister(ctx, request)
	}

	if request.HTTPMethod == "POST" && strings.HasSuffix(request.Path, "/login") {
		return HandleLogin(ctx, request)
	}

	if request.HTTPMethod == "GET" && strings.HasSuffix(request.Path, "/profile") {
		return HandleProfile(ctx, request)
	}

	return notFoundResponse(), nil
}
