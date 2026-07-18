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
		if strings.Contains(request.Path, "/users/show/") {
			return HandleGetUserByID(ctx, request)
		}
		if strings.HasSuffix(request.Path, "/admin/check") {
			return HandleAdminCheck(ctx, request)
		}
		if strings.HasSuffix(request.Path, "/confirmEmail") {
			return HandleConfirmEmail(ctx, request)
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

	if request.HTTPMethod == "PUT" && strings.HasSuffix(request.Path, "/profile") {
		return HandleUpdateProfile(ctx, request)
	}

	if request.HTTPMethod == "POST" && strings.HasSuffix(request.Path, "/resend-email-confirmation") {
		return HandleResendEmailConfirmation(ctx, request)
	}

	if request.HTTPMethod == "POST" && strings.HasSuffix(request.Path, "/passwordChange") {
		return HandleChangePassword(ctx, request)
	}

	if request.HTTPMethod == "POST" && strings.HasSuffix(request.Path, "/passwordRecover") {
		return HandlePasswordRecover(ctx, request)
	}

	if request.HTTPMethod == "POST" && strings.HasSuffix(request.Path, "/passwordConfirmToken") {
		return HandlePasswordConfirmToken(ctx, request)
	}

	if request.HTTPMethod == "POST" && strings.HasSuffix(request.Path, "/admin/password-reset") {
		return HandleAdminPasswordReset(ctx, request)
	}

	return notFoundResponse(), nil
}
