package users

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
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        string `json:"id" dynamodbav:"id"`
	Email     string `json:"email" dynamodbav:"email"`
	Name      string `json:"name,omitempty" dynamodbav:"name"`
	Password  string `json:"-" dynamodbav:"password"`
	CreatedAt string `json:"created_at" dynamodbav:"created_at"`
}

type CreateUserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Token string `json:"token,omitempty"`
}

var (
	dynamoClient *dynamodb.DynamoDB
	tableName    = "mundocolore-users"
	jwtSecret    = []byte("your-secret-key")
)

const (
	lambdaName       = "users"
	healthKeyValue   = "health-check-users"
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

func HandleRegister(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req CreateUserRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	user, err := createUser(req)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}

	body, _ := json.Marshal(user)
	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Body:       string(body),
	}, nil
}

func HandleLogin(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req LoginRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	user, err := loginUser(req)
	if err != nil {
		return unauthorizedResponse(err.Error()), nil
	}

	body, _ := json.Marshal(user)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(body),
	}, nil
}

func HandleProfile(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	token := getAuthorizationHeader(request.Headers)
	if token == "" {
		return unauthorizedResponse("no token"), nil
	}

	token = strings.TrimPrefix(token, "Bearer ")
	userID, err := validateJWT(token)
	if err != nil {
		return unauthorizedResponse("invalid token"), nil
	}

	user, err := getUser(userID)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 404, Body: fmt.Sprintf(`{"error": "%s"}`, err.Error())}, nil
	}

	body, _ := json.Marshal(user)
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
		"id":         {S: aws.String("health-users")},
		"email":      {S: aws.String("health@mundocolore.local")},
		"name":       {S: aws.String("health user")},
		"password":   {S: aws.String("health")},
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

func createUser(req CreateUserRequest) (UserResponse, error) {
	result, err := dynamoClient.Scan(&dynamodb.ScanInput{
		TableName:        aws.String(tableName),
		FilterExpression: aws.String("email = :email"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":email": {S: aws.String(req.Email)},
		},
	})
	if err != nil {
		return UserResponse{}, err
	}
	if len(result.Items) > 0 {
		return UserResponse{}, fmt.Errorf("user already exists")
	}

	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		return UserResponse{}, err
	}

	user := User{
		ID:        generateID(),
		Email:     req.Email,
		Name:      req.Name,
		Password:  hashedPassword,
		CreatedAt: time.Now().Format(time.RFC3339),
	}

	item, err := dynamodbattribute.MarshalMap(user)
	if err != nil {
		return UserResponse{}, err
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	if err != nil {
		return UserResponse{}, err
	}

	token, err := generateJWT(user.ID)
	if err != nil {
		return UserResponse{}, err
	}

	return UserResponse{
		ID:    user.ID,
		Email: user.Email,
		Name:  user.Name,
		Token: token,
	}, nil
}

func loginUser(req LoginRequest) (UserResponse, error) {
	result, err := dynamoClient.Scan(&dynamodb.ScanInput{
		TableName:        aws.String(tableName),
		FilterExpression: aws.String("email = :email"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":email": {S: aws.String(req.Email)},
		},
	})
	if err != nil {
		return UserResponse{}, err
	}
	if len(result.Items) == 0 {
		return UserResponse{}, fmt.Errorf("user not found")
	}

	var user User
	if err := dynamodbattribute.UnmarshalMap(result.Items[0], &user); err != nil {
		return UserResponse{}, err
	}

	if err := checkPassword(user.Password, req.Password); err != nil {
		return UserResponse{}, fmt.Errorf("invalid password")
	}

	token, err := generateJWT(user.ID)
	if err != nil {
		return UserResponse{}, err
	}

	return UserResponse{
		ID:    user.ID,
		Email: user.Email,
		Name:  user.Name,
		Token: token,
	}, nil
}

func getUser(userID string) (UserResponse, error) {
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(userID)},
		},
	})
	if err != nil {
		return UserResponse{}, err
	}
	if result.Item == nil {
		return UserResponse{}, fmt.Errorf("user not found")
	}

	var user User
	if err := dynamodbattribute.UnmarshalMap(result.Item, &user); err != nil {
		return UserResponse{}, err
	}

	return UserResponse{
		ID:    user.ID,
		Email: user.Email,
		Name:  user.Name,
	}, nil
}

func generateJWT(userID string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
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

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func checkPassword(hashed, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(password))
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
