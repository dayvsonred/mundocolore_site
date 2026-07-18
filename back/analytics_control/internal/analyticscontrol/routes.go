package analyticscontrol

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
		if strings.HasSuffix(request.Path, "/reports/pages") {
			return HandleDailyPageAccessReport(ctx, request)
		}
		if strings.HasSuffix(request.Path, "/health/online") {
			return HandleHealthOnline(ctx, request)
		}
		if strings.HasSuffix(request.Path, "/health/data") {
			return HandleHealthData(ctx, request)
		}
	}

	if request.HTTPMethod == "POST" && strings.Contains(request.Path, "/analytics_control") {
		return HandleCreateAnalyticsEvent(ctx, request)
	}

	return notFoundResponse(), nil
}
