package payments

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/golang-jwt/jwt/v5"
)

type Payment struct {
	ID               string  `json:"id" dynamodbav:"id"`
	OrderID          string  `json:"order_id" dynamodbav:"order_id"`
	OrderNSU         string  `json:"order_nsu,omitempty" dynamodbav:"order_nsu,omitempty"`
	UserID           string  `json:"user_id" dynamodbav:"user_id"`
	Amount           float64 `json:"amount" dynamodbav:"amount"`
	AmountCents      int64   `json:"amount_cents,omitempty" dynamodbav:"amount_cents,omitempty"`
	PaidAmountCents  int64   `json:"paid_amount_cents,omitempty" dynamodbav:"paid_amount_cents,omitempty"`
	Method           string  `json:"method" dynamodbav:"method"`
	ActualMethod     string  `json:"actual_method,omitempty" dynamodbav:"actual_method,omitempty"`
	Provider         string  `json:"provider,omitempty" dynamodbav:"provider,omitempty"`
	Status           string  `json:"status" dynamodbav:"status"`
	CheckoutURL      string  `json:"checkout_url,omitempty" dynamodbav:"checkout_url,omitempty"`
	InvoiceSlug      string  `json:"invoice_slug,omitempty" dynamodbav:"invoice_slug,omitempty"`
	TransactionNSU   string  `json:"transaction_nsu,omitempty" dynamodbav:"transaction_nsu,omitempty"`
	ReceiptURL       string  `json:"receipt_url,omitempty" dynamodbav:"receipt_url,omitempty"`
	Installments     int     `json:"installments,omitempty" dynamodbav:"installments,omitempty"`
	ProviderResponse string  `json:"-" dynamodbav:"provider_response,omitempty"`
	LastError        string  `json:"last_error,omitempty" dynamodbav:"last_error,omitempty"`
	CreatedAt        string  `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt        string  `json:"updated_at,omitempty" dynamodbav:"updated_at,omitempty"`
	PaidAt           string  `json:"paid_at,omitempty" dynamodbav:"paid_at,omitempty"`
}

type CreatePaymentRequest struct {
	OrderID string  `json:"order_id"`
	Amount  float64 `json:"amount"`
	Method  string  `json:"method"`
}

type PaymentResponse struct {
	ID      string  `json:"id"`
	OrderID string  `json:"order_id"`
	UserID  string  `json:"user_id"`
	Amount  float64 `json:"amount"`
	Method  string  `json:"method"`
	Status  string  `json:"status"`
}

var (
	dynamoClient           *dynamodb.DynamoDB
	tableName              = "mundocolore-payments"
	ordersTableName        = "mundocolore-orders"
	infinitePayHandle      = ""
	infinitePayAPIURL      = "https://api.checkout.infinitepay.io"
	infinitePayRedirectURL = "https://mundocolorestore.com/checkout/infinitepay/payment"
	infinitePayWebhookURL  = "https://mundocolorestore.com/webhook/infinitepay"
	emailQueueURL          = ""
	paymentSQSClient       *sqs.SQS
	jwtSecret              = []byte("your-secret-key")
)

const (
	lambdaName       = "payments"
	healthKeyValue   = "health-check-payments"
	healthTimeLayout = "2006-01-02 15:04:05"
)

func init() {
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("sa-east-1"),
	}))
	dynamoClient = dynamodb.New(sess)
	paymentSQSClient = sqs.New(sess)
	if value := strings.TrimSpace(os.Getenv("TABLE_NAME")); value != "" {
		tableName = value
	}
	if value := strings.TrimSpace(os.Getenv("ORDERS_TABLE_NAME")); value != "" {
		ordersTableName = value
	}
	infinitePayHandle = strings.TrimSpace(os.Getenv("INFINITEPAY_HANDLE"))
	if value := strings.TrimRight(strings.TrimSpace(os.Getenv("INFINITEPAY_API_URL")), "/"); value != "" {
		infinitePayAPIURL = value
	}
	if value := strings.TrimSpace(os.Getenv("INFINITEPAY_REDIRECT_URL")); value != "" {
		infinitePayRedirectURL = value
	}
	if value := strings.TrimSpace(os.Getenv("INFINITEPAY_WEBHOOK_URL")); value != "" {
		infinitePayWebhookURL = value
	}
	emailQueueURL = strings.TrimSpace(os.Getenv("EMAIL_QUEUE_URL"))
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		jwtSecret = []byte(secret)
	}
}

func HandleCreatePayment(_ context.Context, request events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	var req CreatePaymentRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	payment, err := createPayment(userID, req)
	if err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(payment)
	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Headers:    responseHeaders(),
		Body:       string(body),
	}, nil
}

func HandleHealthOnline(_ context.Context, _ events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	body, _ := json.Marshal(map[string]interface{}{
		"lambda":    lambdaName,
		"status":    "online",
		"timestamp": time.Now().Format(healthTimeLayout),
	})

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers:    responseHeaders(),
		Body:       string(body),
	}, nil
}

func HandleHealthData(_ context.Context, _ events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	now := time.Now()
	timestamp := now.Format(healthTimeLayout)

	result, err := dynamoClient.Scan(&dynamodb.ScanInput{
		TableName:        aws.String(tableName),
		FilterExpression: aws.String("health_key = :health_key"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":health_key": {S: aws.String(healthKeyValue)},
		},
		Limit: aws.Int64(1),
	})
	if err != nil {
		return serverErrorResponse(err), nil
	}

	if len(result.Items) > 0 {
		foundData := map[string]interface{}{}
		if err := dynamodbattribute.UnmarshalMap(result.Items[0], &foundData); err != nil {
			return serverErrorResponse(err), nil
		}

		body, _ := json.Marshal(map[string]interface{}{
			"lambda":    lambdaName,
			"timestamp": timestamp,
			"found":     true,
			"data":      foundData,
		})

		return events.APIGatewayProxyResponse{
			StatusCode: 200,
			Headers:    responseHeaders(),
			Body:       string(body),
		}, nil
	}

	item := map[string]*dynamodb.AttributeValue{
		"id":         {S: aws.String("health-payments")},
		"order_id":   {S: aws.String("health-order")},
		"user_id":    {S: aws.String("health-payments")},
		"amount":     {N: aws.String("0")},
		"method":     {S: aws.String("health")},
		"status":     {S: aws.String("health")},
		"created_at": {S: aws.String(now.Format(time.RFC3339))},
		"health_key": {S: aws.String(healthKeyValue)},
	}

	if _, err := dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	}); err != nil {
		return serverErrorResponse(err), nil
	}

	createdData := map[string]interface{}{}
	if err := dynamodbattribute.UnmarshalMap(item, &createdData); err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(map[string]interface{}{
		"lambda":    lambdaName,
		"timestamp": timestamp,
		"found":     false,
		"inserted":  true,
		"data":      createdData,
	})

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers:    responseHeaders(),
		Body:       string(body),
	}, nil
}

func validateJWT(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtSecret, nil
	})
	if err != nil {
		return "", err
	}
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		if userID, ok := claims["user_id"].(string); ok && userID != "" {
			return userID, nil
		}
		if subject, ok := claims["sub"].(string); ok && subject != "" {
			return subject, nil
		}
	}
	return "", fmt.Errorf("invalid token")
}

func createPayment(userID string, req CreatePaymentRequest) (PaymentResponse, error) {
	payment := Payment{
		ID:        generateID(),
		OrderID:   req.OrderID,
		UserID:    userID,
		Amount:    req.Amount,
		Method:    req.Method,
		Status:    "pending",
		CreatedAt: time.Now().Format(time.RFC3339),
	}

	item, err := dynamodbattribute.MarshalMap(payment)
	if err != nil {
		return PaymentResponse{}, err
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	if err != nil {
		return PaymentResponse{}, err
	}

	return PaymentResponse{
		ID:      payment.ID,
		OrderID: payment.OrderID,
		UserID:  payment.UserID,
		Amount:  payment.Amount,
		Method:  payment.Method,
		Status:  payment.Status,
	}, nil
}

func generateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func unauthorizedResponse(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{StatusCode: 401, Headers: responseHeaders(), Body: fmt.Sprintf(`{"error": "%s"}`, message)}
}

func badRequestResponse(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{StatusCode: 400, Headers: responseHeaders(), Body: fmt.Sprintf(`{"error": "%s"}`, message)}
}

func serverErrorResponse(err error) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{StatusCode: 500, Headers: responseHeaders(), Body: fmt.Sprintf(`{"error": "%s"}`, err.Error())}
}

func notFoundResponse() events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{StatusCode: 404, Headers: responseHeaders(), Body: `{"error": "not found"}`}
}

func responseHeaders() map[string]string {
	return map[string]string{
		"Content-Type":                 "application/json",
		"Access-Control-Allow-Origin":  "https://mundocolorestore.com",
		"Access-Control-Allow-Headers": "Authorization,Content-Type",
		"Access-Control-Allow-Methods": "GET,POST,OPTIONS",
	}
}

func getAuthorizationHeader(headers map[string]string) string {
	for key, value := range headers {
		if strings.EqualFold(key, "Authorization") {
			return value
		}
	}
	return ""
}
