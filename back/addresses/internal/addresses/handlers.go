package addresses

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

type Address struct {
	ID        string `json:"id" dynamodbav:"id"`
	UserID    string `json:"user_id" dynamodbav:"user_id"`
	Street    string `json:"street" dynamodbav:"street"`
	City      string `json:"city" dynamodbav:"city"`
	State     string `json:"state" dynamodbav:"state"`
	ZipCode   string `json:"zip_code" dynamodbav:"zip_code"`
	Country   string `json:"country" dynamodbav:"country"`
	IsDefault bool   `json:"is_default" dynamodbav:"is_default"`
	CreatedAt string `json:"created_at" dynamodbav:"created_at"`
}

type CreateAddressRequest struct {
	Street    string `json:"street"`
	City      string `json:"city"`
	State     string `json:"state"`
	ZipCode   string `json:"zip_code"`
	Country   string `json:"country"`
	IsDefault bool   `json:"is_default"`
}

type AddressResponse struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	Street    string `json:"street"`
	City      string `json:"city"`
	State     string `json:"state"`
	ZipCode   string `json:"zip_code"`
	Country   string `json:"country"`
	IsDefault bool   `json:"is_default"`
}

var (
	dynamoClient *dynamodb.DynamoDB
	tableName    = "mundocolore-addresses"
	jwtSecret    = []byte("your-secret-key")
)

const (
	lambdaName       = "addresses"
	healthKeyValue   = "health-check-addresses"
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

func HandleCreateAddress(_ context.Context, request events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	var req CreateAddressRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	addr, err := createAddress(userID, req)
	if err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(addr)
	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Body:       string(body),
	}, nil
}

func HandleGetAddresses(_ context.Context, _ events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	addresses, err := getAddresses(userID)
	if err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(addresses)
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
		"id":         {S: aws.String("health-addresses")},
		"user_id":    {S: aws.String("health-addresses")},
		"street":     {S: aws.String("Health Street")},
		"city":       {S: aws.String("Health City")},
		"state":      {S: aws.String("HC")},
		"zip_code":   {S: aws.String("00000-000")},
		"country":    {S: aws.String("BR")},
		"is_default": {BOOL: aws.Bool(false)},
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

func createAddress(userID string, req CreateAddressRequest) (AddressResponse, error) {
	address := Address{
		ID:        generateID(),
		UserID:    userID,
		Street:    req.Street,
		City:      req.City,
		State:     req.State,
		ZipCode:   req.ZipCode,
		Country:   req.Country,
		IsDefault: req.IsDefault,
		CreatedAt: time.Now().Format(time.RFC3339),
	}

	item, err := dynamodbattribute.MarshalMap(address)
	if err != nil {
		return AddressResponse{}, err
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	if err != nil {
		return AddressResponse{}, err
	}

	return AddressResponse{
		ID:        address.ID,
		UserID:    address.UserID,
		Street:    address.Street,
		City:      address.City,
		State:     address.State,
		ZipCode:   address.ZipCode,
		Country:   address.Country,
		IsDefault: address.IsDefault,
	}, nil
}

func getAddresses(userID string) ([]AddressResponse, error) {
	result, err := dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		KeyConditionExpression: aws.String("user_id = :user_id"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":user_id": {S: aws.String(userID)},
		},
	})
	if err != nil {
		return nil, err
	}

	var addresses []AddressResponse
	for _, item := range result.Items {
		var addr Address
		if err := dynamodbattribute.UnmarshalMap(item, &addr); err != nil {
			continue
		}
		addresses = append(addresses, AddressResponse{
			ID:        addr.ID,
			UserID:    addr.UserID,
			Street:    addr.Street,
			City:      addr.City,
			State:     addr.State,
			ZipCode:   addr.ZipCode,
			Country:   addr.Country,
			IsDefault: addr.IsDefault,
		})
	}
	return addresses, nil
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
