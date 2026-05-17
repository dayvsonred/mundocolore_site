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
	CPF       string `json:"cpf,omitempty" dynamodbav:"cpf"`
	Phone     string `json:"phone,omitempty" dynamodbav:"phone"`
	BirthDate string `json:"birth_date,omitempty" dynamodbav:"birth_date"`
	Gender    string `json:"gender,omitempty" dynamodbav:"gender"`
	Role      bool   `json:"role" dynamodbav:"ROLE"`
	Password  string `json:"-" dynamodbav:"password"`
	CreatedAt string `json:"created_at" dynamodbav:"created_at"`
}

type UserRole struct {
	ID            string `json:"id" dynamodbav:"id"`
	CreatedAt     string `json:"created_at" dynamodbav:"created_at"`
	Active        bool   `json:"active" dynamodbav:"active"`
	DeactivatedAt string `json:"deactivated_at,omitempty" dynamodbav:"deactivated_at,omitempty"`
}

type CreateUserRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	Name      string `json:"name"`
	CPF       string `json:"cpf"`
	Phone     string `json:"phone"`
	BirthDate string `json:"birth_date"`
	Gender    string `json:"gender"`
	Offshoot  string `json:"offshoot"`
	Longitude string `json:"longitude"`
	Latitude  string `json:"latitude"`
}

type UpdateProfileRequest struct {
	Name      string `json:"name"`
	CPF       string `json:"cpf"`
	Phone     string `json:"phone"`
	BirthDate string `json:"birth_date"`
	Gender    string `json:"gender"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UserResponse struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	CPF       string `json:"cpf,omitempty"`
	Phone     string `json:"phone,omitempty"`
	BirthDate string `json:"birth_date,omitempty"`
	Gender    string `json:"gender,omitempty"`
	Role      bool   `json:"role"`
	IsAdmin   bool   `json:"is_admin"`
	Token     string `json:"token,omitempty"`
}

var (
	dynamoClient  *dynamodb.DynamoDB
	tableName     = "mundocolore-users"
	roleTableName = "mundocolore-role"
	jwtSecret     = []byte("your-secret-key")
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
	if value := os.Getenv("TABLE_NAME"); value != "" {
		tableName = value
	}
	if value := os.Getenv("ROLE_TABLE_NAME"); value != "" {
		roleTableName = value
	}
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
	return successJSONResponse(201, string(body)), nil
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
	return successJSONResponse(200, string(body)), nil
}

func HandleProfile(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	token := extractBearerToken(request.Headers)
	if token == "" {
		return unauthorizedResponse("no token"), nil
	}

	userID, err := validateJWT(token)
	if err != nil {
		return unauthorizedResponse("invalid token"), nil
	}

	user, err := getUser(userID)
	if err != nil {
		return notFoundWithMessage(err.Error()), nil
	}

	body, _ := json.Marshal(user)
	return successJSONResponse(200, string(body)), nil
}

func HandleUpdateProfile(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	token := extractBearerToken(request.Headers)
	if token == "" {
		return unauthorizedResponse("no token"), nil
	}

	userID, err := validateJWT(token)
	if err != nil {
		return unauthorizedResponse("invalid token"), nil
	}

	var req UpdateProfileRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	if req.BirthDate != "" {
		if _, err := time.Parse("2006-01-02", req.BirthDate); err != nil {
			return badRequestResponse("birth_date must be in YYYY-MM-DD format"), nil
		}
	}

	user, err := updateUserProfile(userID, req)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}

	body, _ := json.Marshal(user)
	return successJSONResponse(200, string(body)), nil
}

func HandleGetUserByID(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	userID := extractUserIDFromShowPath(request.Path)
	if userID == "" {
		return badRequestResponse("invalid user id"), nil
	}

	user, err := getUser(userID)
	if err != nil {
		return notFoundWithMessage(err.Error()), nil
	}

	body, _ := json.Marshal(user)
	return successJSONResponse(200, string(body)), nil
}

func HandleAdminCheck(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	token := extractBearerToken(request.Headers)
	if token == "" {
		return unauthorizedResponse("no token"), nil
	}

	userID, err := validateJWT(token)
	if err != nil {
		return unauthorizedResponse("invalid token"), nil
	}

	user, err := getUserEntity(userID)
	if err != nil {
		return unauthorizedResponse(err.Error()), nil
	}

	if !isUserAdmin(user) {
		return forbiddenResponse("admin access required"), nil
	}

	body, _ := json.Marshal(map[string]interface{}{
		"id":       user.ID,
		"is_admin": true,
	})
	return successJSONResponse(200, string(body)), nil
}

func HandleHealthOnline(_ context.Context, _ events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	body, _ := json.Marshal(map[string]interface{}{
		"lambda":    lambdaName,
		"status":    "online",
		"timestamp": time.Now().Format(healthTimeLayout),
	})

	return successJSONResponse(200, string(body)), nil
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

		return successJSONResponse(200, string(body)), nil
	}

	item := map[string]*dynamodb.AttributeValue{
		"id":         {S: aws.String("health-users")},
		"email":      {S: aws.String("health@mundocolore.local")},
		"name":       {S: aws.String("health user")},
		"password":   {S: aws.String("health")},
		"ROLE":       {BOOL: aws.Bool(false)},
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

	return successJSONResponse(200, string(body)), nil
}

func createUser(req CreateUserRequest) (UserResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	password := strings.TrimSpace(req.Password)
	name := strings.TrimSpace(req.Name)

	if email == "" {
		return UserResponse{}, fmt.Errorf("email is required")
	}
	if password == "" {
		return UserResponse{}, fmt.Errorf("password is required")
	}
	if name == "" {
		return UserResponse{}, fmt.Errorf("name is required")
	}

	result, err := dynamoClient.Scan(&dynamodb.ScanInput{
		TableName:        aws.String(tableName),
		FilterExpression: aws.String("email = :email"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":email": {S: aws.String(email)},
		},
	})
	if err != nil {
		return UserResponse{}, err
	}
	if len(result.Items) > 0 {
		return UserResponse{}, fmt.Errorf("user already exists")
	}

	hashedPassword, err := hashPassword(password)
	if err != nil {
		return UserResponse{}, err
	}

	user := User{
		ID:        generateID(),
		Email:     email,
		Name:      name,
		CPF:       onlyDigits(req.CPF),
		Phone:     strings.TrimSpace(req.Phone),
		BirthDate: strings.TrimSpace(req.BirthDate),
		Gender:    strings.TrimSpace(req.Gender),
		Role:      false,
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

	return toUserResponse(user, token), nil
}

func loginUser(req LoginRequest) (UserResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	password := strings.TrimSpace(req.Password)
	if email == "" || password == "" {
		return UserResponse{}, fmt.Errorf("email and password are required")
	}

	result, err := dynamoClient.Scan(&dynamodb.ScanInput{
		TableName:        aws.String(tableName),
		FilterExpression: aws.String("email = :email"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":email": {S: aws.String(email)},
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

	if err := checkPassword(user.Password, password); err != nil {
		return UserResponse{}, fmt.Errorf("invalid password")
	}

	token, err := generateJWT(user.ID)
	if err != nil {
		return UserResponse{}, err
	}

	return toUserResponse(user, token), nil
}

func getUser(userID string) (UserResponse, error) {
	user, err := getUserEntity(userID)
	if err != nil {
		return UserResponse{}, err
	}
	return toUserResponse(user, ""), nil
}

func getUserEntity(userID string) (User, error) {
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(userID)},
		},
	})
	if err != nil {
		return User{}, err
	}
	if result.Item == nil {
		return User{}, fmt.Errorf("user not found")
	}

	var user User
	if err := dynamodbattribute.UnmarshalMap(result.Item, &user); err != nil {
		return User{}, err
	}
	return user, nil
}

func updateUserProfile(userID string, req UpdateProfileRequest) (UserResponse, error) {
	user, err := getUserEntity(userID)
	if err != nil {
		return UserResponse{}, err
	}

	if name := strings.TrimSpace(req.Name); name != "" {
		user.Name = name
	}
	if cpf := onlyDigits(req.CPF); cpf != "" {
		user.CPF = cpf
	}
	if phone := strings.TrimSpace(req.Phone); phone != "" {
		user.Phone = phone
	}
	if req.BirthDate != "" {
		user.BirthDate = strings.TrimSpace(req.BirthDate)
	}
	if req.Gender != "" {
		user.Gender = strings.TrimSpace(req.Gender)
	}

	item, err := dynamodbattribute.MarshalMap(user)
	if err != nil {
		return UserResponse{}, err
	}

	if _, err := dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	}); err != nil {
		return UserResponse{}, err
	}

	return toUserResponse(user, ""), nil
}

func isUserAdmin(user User) bool {
	if !user.Role {
		return false
	}

	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(roleTableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(user.ID)},
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

func toUserResponse(user User, token string) UserResponse {
	isAdmin := isUserAdmin(user)
	return UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Name:      user.Name,
		CPF:       user.CPF,
		Phone:     user.Phone,
		BirthDate: user.BirthDate,
		Gender:    user.Gender,
		Role:      user.Role,
		IsAdmin:   isAdmin,
		Token:     token,
	}
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
		if userID, ok := claims["user_id"].(string); ok && userID != "" {
			return userID, nil
		}
		if subject, ok := claims["sub"].(string); ok && subject != "" {
			return subject, nil
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
		Body:       fmt.Sprintf(`{"error": "%s"}`, message),
		Headers:    defaultHeaders(),
	}
}

func badRequestResponse(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 400,
		Body:       fmt.Sprintf(`{"error": "%s"}`, message),
		Headers:    defaultHeaders(),
	}
}

func serverErrorResponse(err error) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 500,
		Body:       fmt.Sprintf(`{"error": "%s"}`, err.Error()),
		Headers:    defaultHeaders(),
	}
}

func forbiddenResponse(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 403,
		Body:       fmt.Sprintf(`{"error": "%s"}`, message),
		Headers:    defaultHeaders(),
	}
}

func notFoundResponse() events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 404,
		Body:       `{"error": "not found"}`,
		Headers:    defaultHeaders(),
	}
}

func notFoundWithMessage(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: 404,
		Body:       fmt.Sprintf(`{"error": "%s"}`, message),
		Headers:    defaultHeaders(),
	}
}

func defaultHeaders() map[string]string {
	return map[string]string{
		"Content-Type":                 "application/json",
		"Access-Control-Allow-Origin":  "*",
		"Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
		"Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
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

func extractBearerToken(headers map[string]string) string {
	value := strings.TrimSpace(getAuthorizationHeader(headers))
	if value == "" {
		return ""
	}

	parts := strings.SplitN(value, " ", 2)
	if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
		return strings.TrimSpace(parts[1])
	}

	return value
}

func extractUserIDFromShowPath(path string) string {
	parts := strings.Split(path, "/users/show/")
	if len(parts) < 2 {
		return ""
	}

	userID := strings.TrimSpace(parts[len(parts)-1])
	userID = strings.TrimPrefix(userID, "/")
	if userID == "" {
		return ""
	}

	return strings.Split(userID, "/")[0]
}

func onlyDigits(value string) string {
	if value == "" {
		return ""
	}

	var builder strings.Builder
	builder.Grow(len(value))
	for _, r := range value {
		if r >= '0' && r <= '9' {
			builder.WriteRune(r)
		}
	}
	return builder.String()
}
