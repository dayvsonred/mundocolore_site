package orders

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

type Order struct {
	ID        string      `json:"id" dynamodbav:"id"`
	UserID    string      `json:"user_id" dynamodbav:"user_id"`
	Items     []OrderItem `json:"items" dynamodbav:"items"`
	Total     float64     `json:"total" dynamodbav:"total"`
	Status    string      `json:"status" dynamodbav:"status"`
	CreatedAt string      `json:"created_at" dynamodbav:"created_at"`
}

type OrderItem struct {
	ProductID string  `json:"product_id" dynamodbav:"product_id"`
	Quantity  int     `json:"quantity" dynamodbav:"quantity"`
	Price     float64 `json:"price" dynamodbav:"price"`
}

type CreateOrderRequest struct {
	Items []OrderItem `json:"items"`
	Total float64     `json:"total"`
}

type OrderResponse struct {
	ID        string      `json:"id"`
	UserID    string      `json:"user_id"`
	Items     []OrderItem `json:"items"`
	Total     float64     `json:"total"`
	Status    string      `json:"status"`
	CreatedAt string      `json:"created_at"`
}

var (
	dynamoClient *dynamodb.DynamoDB
	tableName    = "mundocolore-orders"
	jwtSecret    = []byte("your-secret-key")
)

const (
	lambdaName       = "orders"
	healthKeyValue   = "health-check-orders"
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

func HandleCreateOrder(_ context.Context, request events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	var req CreateOrderRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	order, err := createOrder(userID, req)
	if err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(order)
	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Body:       string(body),
	}, nil
}

func HandleGetOrders(_ context.Context, _ events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	orders, err := getOrders(userID)
	if err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(orders)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
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
		"id":         {S: aws.String("health-orders")},
		"user_id":    {S: aws.String("health-orders")},
		"items":      {L: []*dynamodb.AttributeValue{}},
		"total":      {N: aws.String("0")},
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

func createOrder(userID string, req CreateOrderRequest) (OrderResponse, error) {
	order := Order{
		ID:        generateID(),
		UserID:    userID,
		Items:     req.Items,
		Total:     req.Total,
		Status:    "pending",
		CreatedAt: time.Now().Format(time.RFC3339),
	}

	item, err := dynamodbattribute.MarshalMap(order)
	if err != nil {
		return OrderResponse{}, err
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	if err != nil {
		return OrderResponse{}, err
	}

	return OrderResponse{
		ID:        order.ID,
		UserID:    order.UserID,
		Items:     order.Items,
		Total:     order.Total,
		Status:    order.Status,
		CreatedAt: order.CreatedAt,
	}, nil
}

func getOrders(userID string) ([]OrderResponse, error) {
	result, err := dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		KeyConditionExpression: aws.String("user_id = :user_id"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":user_id": {S: aws.String(userID)},
		},
		ScanIndexForward: aws.Bool(false),
	})
	if err != nil {
		return nil, err
	}

	var orders []OrderResponse
	for _, item := range result.Items {
		var order Order
		if err := dynamodbattribute.UnmarshalMap(item, &order); err != nil {
			continue
		}
		orders = append(orders, OrderResponse{
			ID:        order.ID,
			UserID:    order.UserID,
			Items:     order.Items,
			Total:     order.Total,
			Status:    order.Status,
			CreatedAt: order.CreatedAt,
		})
	}
	return orders, nil
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
