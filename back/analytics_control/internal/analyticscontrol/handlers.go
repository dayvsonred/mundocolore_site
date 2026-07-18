package analyticscontrol

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/golang-jwt/jwt/v5"
)

type AnalyticsEventRequest struct {
	EventType   string                 `json:"event_type"`
	ClientAt    string                 `json:"client_at"`
	IP          string                 `json:"ip"`
	Route       string                 `json:"route"`
	Page        string                 `json:"page"`
	Referrer    string                 `json:"referrer"`
	Device      string                 `json:"device"`
	Language    string                 `json:"language"`
	User        string                 `json:"user"`
	UserID      string                 `json:"user_id"`
	ProductID   string                 `json:"product_id"`
	ProductCode string                 `json:"product_code"`
	ProductName string                 `json:"product_name"`
	Brand       string                 `json:"brand"`
	SearchCode  string                 `json:"search_code"`
	BrandSearch string                 `json:"brand_search"`
	Filters     map[string]interface{} `json:"filters"`
	Metadata    map[string]interface{} `json:"metadata"`
}

type AnalyticsEvent struct {
	ServerDay       string                 `json:"server_day" dynamodbav:"server_day"`
	ServerAtEventID string                 `json:"server_at_event_id" dynamodbav:"server_at_event_id"`
	ID              string                 `json:"id" dynamodbav:"id"`
	EntityType      string                 `json:"entity_type" dynamodbav:"entity_type"`
	EventType       string                 `json:"event_type" dynamodbav:"event_type"`
	ServerAt        string                 `json:"server_at" dynamodbav:"server_at"`
	ServerAtEpoch   int64                  `json:"server_at_epoch" dynamodbav:"server_at_epoch"`
	ServerTimezone  string                 `json:"server_timezone" dynamodbav:"server_timezone"`
	ClientAt        string                 `json:"client_at,omitempty" dynamodbav:"client_at,omitempty"`
	ClientDay       string                 `json:"client_day,omitempty" dynamodbav:"client_day,omitempty"`
	IP              string                 `json:"ip,omitempty" dynamodbav:"ip,omitempty"`
	ClientIP        string                 `json:"client_ip,omitempty" dynamodbav:"client_ip,omitempty"`
	Route           string                 `json:"route" dynamodbav:"route"`
	Page            string                 `json:"page,omitempty" dynamodbav:"page,omitempty"`
	Referrer        string                 `json:"referrer,omitempty" dynamodbav:"referrer,omitempty"`
	Device          string                 `json:"device,omitempty" dynamodbav:"device,omitempty"`
	Language        string                 `json:"language,omitempty" dynamodbav:"language,omitempty"`
	UserAgent       string                 `json:"user_agent,omitempty" dynamodbav:"user_agent,omitempty"`
	User            string                 `json:"user,omitempty" dynamodbav:"user,omitempty"`
	UserID          string                 `json:"user_id,omitempty" dynamodbav:"user_id,omitempty"`
	ProductID       string                 `json:"product_id,omitempty" dynamodbav:"product_id,omitempty"`
	ProductCode     string                 `json:"product_code,omitempty" dynamodbav:"product_code,omitempty"`
	ProductName     string                 `json:"product_name,omitempty" dynamodbav:"product_name,omitempty"`
	Brand           string                 `json:"brand,omitempty" dynamodbav:"brand,omitempty"`
	BrandKey        string                 `json:"brand_key,omitempty" dynamodbav:"brand_key,omitempty"`
	SearchCode      string                 `json:"search_code,omitempty" dynamodbav:"search_code,omitempty"`
	BrandSearch     string                 `json:"brand_search,omitempty" dynamodbav:"brand_search,omitempty"`
	Filters         map[string]interface{} `json:"filters,omitempty" dynamodbav:"filters,omitempty"`
	Metadata        map[string]interface{} `json:"metadata,omitempty" dynamodbav:"metadata,omitempty"`
	DayRoute        string                 `json:"day_route,omitempty" dynamodbav:"day_route,omitempty"`
	DayEventType    string                 `json:"day_event_type,omitempty" dynamodbav:"day_event_type,omitempty"`
	DayProductCode  string                 `json:"day_product_code,omitempty" dynamodbav:"day_product_code,omitempty"`
	DayBrandKey     string                 `json:"day_brand_key,omitempty" dynamodbav:"day_brand_key,omitempty"`
}

type PageAccessSummary struct {
	Route      string `json:"route"`
	Page       string `json:"page"`
	Accesses   int    `json:"accesses"`
	LastAccess string `json:"last_access"`
}

type DailyPageAccessReport struct {
	ServerDay   string              `json:"server_day"`
	TotalAccess int                 `json:"total_access"`
	Pages       []PageAccessSummary `json:"pages"`
}

type UserRole struct {
	Active        bool   `dynamodbav:"active"`
	DeactivatedAt string `dynamodbav:"deactivated_at,omitempty"`
}

var (
	dynamoClient *dynamodb.DynamoDB
	tableName    = "mundocolore-analytics"
	roleTable    = "mundocolore-role"
	jwtSecret    = []byte("your-secret-key")
)

func init() {
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("sa-east-1"),
	}))
	dynamoClient = dynamodb.New(sess)
	if value := os.Getenv("TABLE_NAME"); value != "" {
		tableName = value
	}
	if value := os.Getenv("ROLE_TABLE_NAME"); value != "" {
		roleTable = value
	}
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		jwtSecret = []byte(secret)
	}
}

func HandleCreateAnalyticsEvent(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var payload AnalyticsEventRequest
	if err := json.Unmarshal([]byte(request.Body), &payload); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	event := buildAnalyticsEvent(payload, request)
	if event.Route == "" {
		return badRequestResponse("route is required"), nil
	}

	if err := putAnalyticsEvent(event); err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(map[string]interface{}{
		"saved":      true,
		"id":         event.ID,
		"server_day": event.ServerDay,
		"server_at":  event.ServerAt,
	})
	return successJSONResponse(201, string(body)), nil
}

func HandleHealthOnline(_ context.Context, _ events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return successJSONResponse(200, `{"status":"online","lambda":"analytics_control"}`), nil
}

func HandleHealthData(_ context.Context, _ events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	now := serverNow()
	result, err := dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		KeyConditionExpression: aws.String("server_day = :server_day"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":server_day": {S: aws.String(now.Format("2006-01-02"))},
		},
		Select: aws.String("COUNT"),
	})
	if err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(map[string]interface{}{
		"status":       "ok",
		"table":        tableName,
		"server_day":   now.Format("2006-01-02"),
		"events_today": aws.Int64Value(result.Count),
	})
	return successJSONResponse(200, string(body)), nil
}

func HandleDailyPageAccessReport(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if _, ok := authenticatedAdminID(request); !ok {
		return unauthorizedResponse("admin access required"), nil
	}

	day := strings.TrimSpace(request.QueryStringParameters["day"])
	if day == "" {
		day = serverNow().Format("2006-01-02")
	}
	if _, err := time.Parse("2006-01-02", day); err != nil {
		return badRequestResponse("day must be YYYY-MM-DD"), nil
	}

	report, err := getDailyPageAccessReport(day)
	if err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(report)
	return successJSONResponse(200, string(body)), nil
}

func buildAnalyticsEvent(payload AnalyticsEventRequest, request events.APIGatewayProxyRequest) AnalyticsEvent {
	now := serverNow()
	id := generateID()
	eventType := strings.TrimSpace(payload.EventType)
	if eventType == "" {
		eventType = "page_view"
	}

	route := firstNonEmpty(payload.Route, payload.Page)
	productCode := firstNonEmpty(payload.ProductCode, payload.SearchCode, payload.ProductID)
	brandKey := normalizeKey(firstNonEmpty(payload.Brand, payload.BrandSearch))
	serverDay := now.Format("2006-01-02")
	serverAt := now.Format(time.RFC3339Nano)

	event := AnalyticsEvent{
		ServerDay:       serverDay,
		ServerAtEventID: serverAt + "#" + id,
		ID:              id,
		EntityType:      "analytics_event",
		EventType:       truncate(eventType, 80),
		ServerAt:        serverAt,
		ServerAtEpoch:   now.Unix(),
		ServerTimezone:  "America/Sao_Paulo",
		ClientAt:        truncate(payload.ClientAt, 80),
		ClientDay:       clientDay(payload.ClientAt),
		IP:              truncate(firstNonEmpty(sourceIP(request), payload.IP), 80),
		ClientIP:        truncate(payload.IP, 80),
		Route:           truncate(route, 500),
		Page:            truncate(payload.Page, 500),
		Referrer:        truncate(payload.Referrer, 500),
		Device:          truncate(payload.Device, 80),
		Language:        truncate(payload.Language, 40),
		UserAgent:       truncate(headerValue(request.Headers, "User-Agent"), 500),
		User:            truncate(payload.User, 160),
		UserID:          truncate(payload.UserID, 160),
		ProductID:       truncate(payload.ProductID, 160),
		ProductCode:     truncate(payload.ProductCode, 160),
		ProductName:     truncate(payload.ProductName, 300),
		Brand:           truncate(payload.Brand, 160),
		BrandKey:        truncate(brandKey, 160),
		SearchCode:      truncate(payload.SearchCode, 160),
		BrandSearch:     truncate(payload.BrandSearch, 160),
		Filters:         payload.Filters,
		Metadata:        payload.Metadata,
		DayRoute:        serverDay + "#" + truncate(route, 500),
		DayEventType:    serverDay + "#" + truncate(eventType, 80),
	}

	if productCode != "" {
		event.DayProductCode = serverDay + "#" + truncate(productCode, 160)
	}
	if brandKey != "" {
		event.DayBrandKey = serverDay + "#" + truncate(brandKey, 160)
	}

	return event
}

func putAnalyticsEvent(event AnalyticsEvent) error {
	item, err := dynamodbattribute.MarshalMap(event)
	if err != nil {
		return err
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	return err
}

func getDailyPageAccessReport(day string) (DailyPageAccessReport, error) {
	report := DailyPageAccessReport{
		ServerDay: day,
		Pages:     []PageAccessSummary{},
	}
	summaries := map[string]*PageAccessSummary{}

	var lastKey map[string]*dynamodb.AttributeValue
	for {
		result, err := dynamoClient.Query(&dynamodb.QueryInput{
			TableName:              aws.String(tableName),
			IndexName:              aws.String("day-event-type-index"),
			KeyConditionExpression: aws.String("day_event_type = :day_event_type"),
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":day_event_type": {S: aws.String(day + "#page_view")},
			},
			ExclusiveStartKey: lastKey,
		})
		if err != nil {
			return report, err
		}

		for _, item := range result.Items {
			var event AnalyticsEvent
			if err := dynamodbattribute.UnmarshalMap(item, &event); err != nil {
				return report, err
			}

			route := firstNonEmpty(event.Route, event.Page, "(sem rota)")
			summary, exists := summaries[route]
			if !exists {
				summary = &PageAccessSummary{
					Route: route,
					Page:  firstNonEmpty(event.Page, route),
				}
				summaries[route] = summary
			}

			summary.Accesses++
			if event.ServerAt > summary.LastAccess {
				summary.LastAccess = event.ServerAt
			}
			report.TotalAccess++
		}

		if len(result.LastEvaluatedKey) == 0 {
			break
		}
		lastKey = result.LastEvaluatedKey
	}

	for _, summary := range summaries {
		report.Pages = append(report.Pages, *summary)
	}
	sort.Slice(report.Pages, func(i, j int) bool {
		if report.Pages[i].Accesses == report.Pages[j].Accesses {
			return report.Pages[i].Route < report.Pages[j].Route
		}
		return report.Pages[i].Accesses > report.Pages[j].Accesses
	})

	return report, nil
}

func authenticatedAdminID(request events.APIGatewayProxyRequest) (string, bool) {
	tokenString := extractBearerToken(request.Headers)
	if tokenString == "" {
		return "", false
	}

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return "", false
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", false
	}

	userID, _ := claims["user_id"].(string)
	if userID == "" {
		userID, _ = claims["sub"].(string)
	}
	if userID == "" || !isActiveAdmin(userID) {
		return "", false
	}

	return userID, true
}

func isActiveAdmin(userID string) bool {
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(roleTable),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(userID)},
		},
		ConsistentRead: aws.Bool(true),
	})
	if err != nil || result.Item == nil {
		return false
	}

	var role UserRole
	if err := dynamodbattribute.UnmarshalMap(result.Item, &role); err != nil {
		return false
	}

	return role.Active && strings.TrimSpace(role.DeactivatedAt) == ""
}

func serverNow() time.Time {
	location, err := time.LoadLocation("America/Sao_Paulo")
	if err != nil {
		location = time.FixedZone("America/Sao_Paulo", -3*60*60)
	}
	return time.Now().In(location)
}

func clientDay(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		parsed, err = time.Parse(time.RFC3339, value)
		if err != nil {
			return ""
		}
	}
	return parsed.Format("2006-01-02")
}

func sourceIP(request events.APIGatewayProxyRequest) string {
	if request.RequestContext.Identity.SourceIP != "" {
		return request.RequestContext.Identity.SourceIP
	}
	forwardedFor := headerValue(request.Headers, "X-Forwarded-For")
	if forwardedFor == "" {
		return ""
	}
	parts := strings.Split(forwardedFor, ",")
	return strings.TrimSpace(parts[0])
}

func headerValue(headers map[string]string, name string) string {
	for key, value := range headers {
		if strings.EqualFold(key, name) {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func extractBearerToken(headers map[string]string) string {
	value := headerValue(headers, "Authorization")
	if value == "" {
		return ""
	}

	parts := strings.SplitN(value, " ", 2)
	if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
		return strings.TrimSpace(parts[1])
	}

	return value
}

func normalizeKey(value string) string {
	value = strings.TrimSpace(value)
	value = strings.ReplaceAll(value, "_", "-")
	value = strings.Join(strings.Fields(value), "-")
	return strings.ToUpper(value)
}

func truncate(value string, max int) string {
	value = strings.TrimSpace(value)
	if len([]rune(value)) <= max {
		return value
	}
	return string([]rune(value)[:max])
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func generateID() string {
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func successJSONResponse(statusCode int, body string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Body:       body,
		Headers:    defaultHeaders(),
	}
}

func unauthorizedResponse(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 401,
		Body:       fmt.Sprintf(`{"error":"%s"}`, message),
		Headers:    defaultHeaders(),
	}
}

func badRequestResponse(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 400,
		Body:       fmt.Sprintf(`{"error":"%s"}`, message),
		Headers:    defaultHeaders(),
	}
}

func serverErrorResponse(err error) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 500,
		Body:       fmt.Sprintf(`{"error":"%s"}`, err.Error()),
		Headers:    defaultHeaders(),
	}
}

func notFoundResponse() events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 404,
		Body:       `{"error":"not found"}`,
		Headers:    defaultHeaders(),
	}
}

func defaultHeaders() map[string]string {
	return map[string]string{
		"Content-Type":                 "application/json",
		"Access-Control-Allow-Origin":  "*",
		"Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
		"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
	}
}
