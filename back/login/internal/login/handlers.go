package login

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/url"
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

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token       string       `json:"token"`
	AccessToken string       `json:"access_token"`
	TokenType   string       `json:"token_type"`
	ExpiresIn   int          `json:"expires_in"`
	User        UserResponse `json:"user"`
}

type UserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

var (
	dynamoClient       *dynamodb.DynamoDB
	tableName          = "mundocolore-users"
	jwtSecret          = []byte("your-secret-key")
	expectedAuthHeader = "Basic QVBJX05BTUVfQUNDRVNTOkFQSV9TRUNSRVRfQUNDRVNT"
)

const (
	lambdaName       = "login"
	healthKeyValue   = "health-check-login"
	healthTimeLayout = "2006-01-02 15:04:05"
	tokenTTLSeconds  = 86400
)

func init() {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "sa-east-1"
	}
	if value := os.Getenv("TABLE_NAME"); value != "" {
		tableName = value
	}
	if value := os.Getenv("JWT_SECRET"); value != "" {
		jwtSecret = []byte(value)
	}
	if value := os.Getenv("LOGIN_BASIC_AUTH"); value != "" {
		expectedAuthHeader = value
	}

	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String(region),
	}))
	dynamoClient = dynamodb.New(sess)
}

func HandleLogin(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if !isValidLoginAuthorization(request.Headers) {
		return unauthorizedResponse("authorization header invalid"), nil
	}

	email, password, err := parseLoginCredentials(request)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}

	user, err := findUserByEmail(email)
	if err != nil {
		return unauthorizedResponse("user not found"), nil
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return unauthorizedResponse("invalid password"), nil
	}

	token, err := generateJWT(user)
	if err != nil {
		return serverErrorResponse(err), nil
	}

	response := LoginResponse{
		Token:       token,
		AccessToken: token,
		TokenType:   "Bearer",
		ExpiresIn:   tokenTTLSeconds,
		User: UserResponse{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
		},
	}

	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(body),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
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
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
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
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
		}, nil
	}

	item := map[string]*dynamodb.AttributeValue{
		"id":         {S: aws.String("health-login")},
		"email":      {S: aws.String("health-login@mundocolore.local")},
		"name":       {S: aws.String("health login")},
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
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}, nil
}

func isValidLoginAuthorization(headers map[string]string) bool {
	for key, value := range headers {
		if strings.EqualFold(key, "Authorization") {
			return strings.TrimSpace(value) == expectedAuthHeader
		}
	}
	return false
}

func parseLoginCredentials(request events.APIGatewayProxyRequest) (string, string, error) {
	body, err := getDecodedBody(request)
	if err != nil {
		return "", "", fmt.Errorf("invalid body")
	}

	contentType := getHeaderValue(request.Headers, "Content-Type")
	contentType = strings.ToLower(strings.TrimSpace(strings.Split(contentType, ";")[0]))

	if contentType == "application/x-www-form-urlencoded" {
		values, err := url.ParseQuery(body)
		if err != nil {
			return "", "", fmt.Errorf("invalid form body")
		}

		grantType := strings.TrimSpace(values.Get("grant_type"))
		if grantType != "" && grantType != "password" {
			return "", "", fmt.Errorf("grant_type must be password")
		}

		email := strings.TrimSpace(values.Get("username"))
		if email == "" {
			email = strings.TrimSpace(values.Get("email"))
		}
		password := strings.TrimSpace(values.Get("password"))
		if email == "" || password == "" {
			return "", "", fmt.Errorf("username/email and password are required")
		}
		return strings.ToLower(email), password, nil
	}

	var payload LoginRequest
	if err := json.Unmarshal([]byte(body), &payload); err != nil {
		return "", "", fmt.Errorf("invalid request payload")
	}

	email := strings.ToLower(strings.TrimSpace(payload.Email))
	password := strings.TrimSpace(payload.Password)
	if email == "" || password == "" {
		return "", "", fmt.Errorf("email and password are required")
	}

	return email, password, nil
}

func getDecodedBody(request events.APIGatewayProxyRequest) (string, error) {
	if !request.IsBase64Encoded {
		return request.Body, nil
	}

	bytes, err := base64.StdEncoding.DecodeString(request.Body)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func findUserByEmail(email string) (User, error) {
	result, err := dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		IndexName:              aws.String("email-index"),
		KeyConditionExpression: aws.String("email = :email"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":email": {S: aws.String(email)},
		},
		Limit: aws.Int64(1),
	})
	if err == nil && len(result.Items) > 0 {
		var user User
		if unmarshalErr := dynamodbattribute.UnmarshalMap(result.Items[0], &user); unmarshalErr != nil {
			return User{}, unmarshalErr
		}
		return user, nil
	}

	// Fallback for environments where the GSI is not available yet.
	scanResult, scanErr := dynamoClient.Scan(&dynamodb.ScanInput{
		TableName:        aws.String(tableName),
		FilterExpression: aws.String("email = :email"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":email": {S: aws.String(email)},
		},
		Limit: aws.Int64(1),
	})
	if scanErr != nil {
		if err != nil {
			return User{}, err
		}
		return User{}, scanErr
	}
	if len(scanResult.Items) == 0 {
		return User{}, fmt.Errorf("user not found")
	}

	var user User
	if err := dynamodbattribute.UnmarshalMap(scanResult.Items[0], &user); err != nil {
		return User{}, err
	}
	return user, nil
}

func generateJWT(user User) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"sub":     user.ID,
		"email":   user.Email,
		"iat":     now.Unix(),
		"exp":     now.Add(tokenTTLSeconds * time.Second).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func getHeaderValue(headers map[string]string, target string) string {
	for key, value := range headers {
		if strings.EqualFold(key, target) {
			return value
		}
	}
	return ""
}

func unauthorizedResponse(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 401,
		Body:       fmt.Sprintf(`{"error": "%s"}`, message),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
}

func badRequestResponse(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 400,
		Body:       fmt.Sprintf(`{"error": "%s"}`, message),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
}

func serverErrorResponse(err error) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 500,
		Body:       fmt.Sprintf(`{"error": "%s"}`, err.Error()),
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
}

func notFoundResponse() events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 404,
		Body:       `{"error": "not found"}`,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
	}
}
