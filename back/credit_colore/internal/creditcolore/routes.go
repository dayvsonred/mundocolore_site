package creditcolore

import (
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleRequest(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "OPTIONS" {
		return jsonResponse(200, `{}`), nil
	}
	if request.HTTPMethod == "GET" && strings.HasSuffix(request.Path, "/health/online") {
		return jsonResponse(200, `{"lambda":"credit_colore","status":"online"}`), nil
	}

	userID, err := authenticatedUserID(request)
	if err != nil {
		return errorResponse(401, err.Error()), nil
	}

	if strings.Contains(request.Path, "/credit-colore/admin/") {
		if !isActiveAdmin(userID) {
			return errorResponse(403, "admin access required"), nil
		}
		switch request.HTTPMethod {
		case "GET":
			if strings.HasSuffix(request.Path, "/credit-colore/admin/users") {
				return HandleListUsers(ctx, request)
			}
		case "PATCH", "PUT":
			if strings.Contains(request.Path, "/credit-colore/admin/users/") {
				return HandleAddCredit(ctx, request, userID)
			}
		}
	}

	if request.HTTPMethod == "GET" && strings.HasSuffix(request.Path, "/credit-colore") {
		return HandleGetCredit(ctx, userID)
	}
	return errorResponse(404, "not found"), nil
}
