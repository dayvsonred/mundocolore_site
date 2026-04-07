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
	"github.com/golang-jwt/jwt/v5"
)

type Payment struct {
	ID        string  `json:"id" dynamodbav:"id"`
	OrderID   string  `json:"order_id" dynamodbav:"order_id"`
	UserID    string  `json:"user_id" dynamodbav:"user_id"`
	Amount    float64 `json:"amount" dynamodbav:"amount"`
	Method    string  `json:"method" dynamodbav:"method"`
	Status    string  `json:"status" dynamodbav:"status"`
	CreatedAt string  `json:"created_at" dynamodbav:"created_at"`
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
	dynamoClient *dynamodb.DynamoDB
	tableName    = "mundocolore-payments"
	jwtSecret    = []byte("your-secret-key")
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
		if userID, ok := claims["user_id"].(string); ok {
			return userID, nil
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
	return events.APIGatewayProxyResponse{StatusCode: 401, Body: fmt.Sprintf(`{"error": "%s"}`, message)}
}

func badRequestResponse(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{StatusCode: 400, Body: fmt.Sprintf(`{"error": "%s"}`, message)}
}

func serverErrorResponse(err error) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{StatusCode: 500, Body: fmt.Sprintf(`{"error": "%s"}`, err.Error())}
}

func notFoundResponse() events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{StatusCode: 404, Body: `{"error": "not found"}`}
}

func getAuthorizationHeader(headers map[string]string) string {
	for key, value := range headers {
		if strings.EqualFold(key, "Authorization") {
			return value
		}
	}
	return ""
}
