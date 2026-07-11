package creditcolore

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/golang-jwt/jwt/v5"
)

type CreditHistory struct {
	Amount      float64 `json:"amount" dynamodbav:"amount"`
	Type        string  `json:"type" dynamodbav:"type"`
	AdminUserID string  `json:"admin_user_id,omitempty" dynamodbav:"admin_user_id,omitempty"`
	CreatedAt   string  `json:"created_at" dynamodbav:"created_at"`
}

type Credit struct {
	UserID      string          `json:"user_id" dynamodbav:"user_id"`
	CreditLimit float64         `json:"credit_limit" dynamodbav:"credit_limit"`
	UsedCredit  float64         `json:"used_credit" dynamodbav:"used_credit"`
	History     []CreditHistory `json:"history,omitempty" dynamodbav:"history,omitempty"`
	CreatedAt   string          `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt   string          `json:"updated_at" dynamodbav:"updated_at"`
}

type CreditResponse struct {
	Credit
	AvailableCredit float64 `json:"available_credit"`
}

type User struct {
	ID        string `json:"id" dynamodbav:"id"`
	Name      string `json:"name" dynamodbav:"name"`
	Email     string `json:"email" dynamodbav:"email"`
	CPF       string `json:"cpf" dynamodbav:"cpf"`
	Phone     string `json:"phone" dynamodbav:"phone"`
	CreatedAt string `json:"created_at" dynamodbav:"created_at"`
}

type UserCredit struct {
	User
	Credit CreditResponse `json:"credit"`
}

type UserRole struct {
	Active        bool   `dynamodbav:"active"`
	DeactivatedAt string `dynamodbav:"deactivated_at,omitempty"`
}

type AddCreditRequest struct {
	Amount float64 `json:"amount"`
}

var (
	dynamoClient *dynamodb.DynamoDB
	tableName    = "mundocolore-credit"
	usersTable   = "mundocolore-users"
	roleTable    = "mundocolore-role"
	jwtSecret    = []byte("your-secret-key")
)

func init() {
	sess := session.Must(session.NewSession(&aws.Config{Region: aws.String("sa-east-1")}))
	dynamoClient = dynamodb.New(sess)
	if value := os.Getenv("TABLE_NAME"); value != "" {
		tableName = value
	}
	if value := os.Getenv("USERS_TABLE_NAME"); value != "" {
		usersTable = value
	}
	if value := os.Getenv("ROLE_TABLE_NAME"); value != "" {
		roleTable = value
	}
	if value := os.Getenv("JWT_SECRET"); value != "" {
		jwtSecret = []byte(value)
	}
}

func HandleGetCredit(_ context.Context, userID string) (events.APIGatewayProxyResponse, error) {
	credit, err := getOrCreateCredit(userID)
	if err != nil {
		return errorResponse(500, err.Error()), nil
	}
	return marshalResponse(200, toCreditResponse(credit)), nil
}

func HandleListUsers(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	items, err := scanAllUsers()
	if err != nil {
		return errorResponse(500, err.Error()), nil
	}
	q := request.QueryStringParameters
	name := strings.ToLower(strings.TrimSpace(q["name"]))
	email := strings.ToLower(strings.TrimSpace(q["email"]))
	cpf := onlyDigits(q["cpf"])
	phone := onlyDigits(q["phone"])
	createdFrom := strings.TrimSpace(q["created_from"])
	createdTo := strings.TrimSpace(q["created_to"])
	users := make([]UserCredit, 0)
	for _, item := range items {
		var user User
		if dynamodbattribute.UnmarshalMap(item, &user) != nil || user.ID == "" {
			continue
		}
		if name != "" && !strings.Contains(strings.ToLower(user.Name), name) {
			continue
		}
		if email != "" && !strings.Contains(strings.ToLower(user.Email), email) {
			continue
		}
		if cpf != "" && !strings.Contains(onlyDigits(user.CPF), cpf) {
			continue
		}
		if phone != "" && !strings.Contains(onlyDigits(user.Phone), phone) {
			continue
		}
		if createdFrom != "" && user.CreatedAt < createdFrom {
			continue
		}
		if createdTo != "" && user.CreatedAt > createdTo+"T23:59:59" {
			continue
		}
		credit, creditErr := getOrCreateCredit(user.ID)
		if creditErr != nil {
			return errorResponse(500, creditErr.Error()), nil
		}
		users = append(users, UserCredit{User: user, Credit: toCreditResponse(credit)})
	}
	return marshalResponse(200, map[string]interface{}{"users": users}), nil
}

func scanAllUsers() ([]map[string]*dynamodb.AttributeValue, error) {
	items := []map[string]*dynamodb.AttributeValue{}
	var startKey map[string]*dynamodb.AttributeValue
	for {
		result, err := dynamoClient.Scan(&dynamodb.ScanInput{TableName: aws.String(usersTable), ExclusiveStartKey: startKey})
		if err != nil {
			return nil, err
		}
		items = append(items, result.Items...)
		if len(result.LastEvaluatedKey) == 0 {
			return items, nil
		}
		startKey = result.LastEvaluatedKey
	}
}

func HandleAddCredit(_ context.Context, request events.APIGatewayProxyRequest, adminUserID string) (events.APIGatewayProxyResponse, error) {
	userID := pathID(request.Path, "/credit-colore/admin/users/")
	if userID == "" {
		return errorResponse(400, "invalid user id"), nil
	}
	var req AddCreditRequest
	if json.Unmarshal([]byte(request.Body), &req) != nil || req.Amount <= 0 {
		return errorResponse(400, "amount must be greater than zero"), nil
	}
	if _, err := getOrCreateCredit(userID); err != nil {
		return errorResponse(500, err.Error()), nil
	}
	now := time.Now().UTC().Format(time.RFC3339)
	historyItem, err := dynamodbattribute.MarshalMap(CreditHistory{
		Amount: roundMoney(req.Amount), Type: "admin_credit_added", AdminUserID: adminUserID, CreatedAt: now,
	})
	if err != nil {
		return errorResponse(500, err.Error()), nil
	}
	_, err = dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName:        aws.String(tableName),
		Key:              map[string]*dynamodb.AttributeValue{"user_id": {S: aws.String(userID)}},
		UpdateExpression: aws.String("SET credit_limit = credit_limit + :amount, updated_at = :updated_at, #history = list_append(if_not_exists(#history, :empty), :entry)"),
		ExpressionAttributeNames: map[string]*string{
			"#history": aws.String("history"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":amount":     {N: aws.String(fmt.Sprintf("%.2f", roundMoney(req.Amount)))},
			":updated_at": {S: aws.String(now)},
			":empty":      {L: []*dynamodb.AttributeValue{}},
			":entry":      {L: []*dynamodb.AttributeValue{{M: historyItem}}},
		},
	})
	if err != nil {
		return errorResponse(500, err.Error()), nil
	}
	credit, err := getOrCreateCredit(userID)
	if err != nil {
		return errorResponse(500, err.Error()), nil
	}
	return marshalResponse(200, toCreditResponse(credit)), nil
}

func getOrCreateCredit(userID string) (Credit, error) {
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName:      aws.String(tableName),
		Key:            map[string]*dynamodb.AttributeValue{"user_id": {S: aws.String(userID)}},
		ConsistentRead: aws.Bool(true),
	})
	if err != nil {
		return Credit{}, err
	}
	if result.Item != nil {
		var credit Credit
		if err := dynamodbattribute.UnmarshalMap(result.Item, &credit); err != nil {
			return Credit{}, err
		}
		return credit, nil
	}
	now := time.Now().UTC().Format(time.RFC3339)
	credit := Credit{UserID: userID, CreditLimit: 0, UsedCredit: 0, CreatedAt: now, UpdatedAt: now}
	item, err := dynamodbattribute.MarshalMap(credit)
	if err != nil {
		return Credit{}, err
	}
	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName:           aws.String(tableName),
		Item:                item,
		ConditionExpression: aws.String("attribute_not_exists(user_id)"),
	})
	if err == nil {
		return credit, nil
	}
	result, getErr := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key:       map[string]*dynamodb.AttributeValue{"user_id": {S: aws.String(userID)}},
	})
	if getErr != nil || result.Item == nil {
		return Credit{}, err
	}
	if unmarshalErr := dynamodbattribute.UnmarshalMap(result.Item, &credit); unmarshalErr != nil {
		return Credit{}, unmarshalErr
	}
	return credit, nil
}

func toCreditResponse(credit Credit) CreditResponse {
	return CreditResponse{Credit: credit, AvailableCredit: roundMoney(credit.CreditLimit - credit.UsedCredit)}
}

func authenticatedUserID(request events.APIGatewayProxyRequest) (string, error) {
	var raw string
	for key, value := range request.Headers {
		if strings.EqualFold(key, "Authorization") {
			raw = strings.TrimSpace(value)
			break
		}
	}
	parts := strings.SplitN(raw, " ", 2)
	if len(parts) == 2 {
		raw = parts[1]
	}
	token, err := jwt.Parse(raw, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("invalid token")
		}
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return "", fmt.Errorf("invalid token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("invalid token")
	}
	userID, _ := claims["user_id"].(string)
	if userID == "" {
		userID, _ = claims["sub"].(string)
	}
	if userID == "" {
		return "", fmt.Errorf("invalid token")
	}
	return userID, nil
}

func isActiveAdmin(userID string) bool {
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(roleTable), Key: map[string]*dynamodb.AttributeValue{"id": {S: aws.String(userID)}},
		ConsistentRead: aws.Bool(true),
	})
	if err != nil || result.Item == nil {
		return false
	}
	var role UserRole
	return dynamodbattribute.UnmarshalMap(result.Item, &role) == nil && role.Active && strings.TrimSpace(role.DeactivatedAt) == ""
}

func pathID(path, marker string) string {
	parts := strings.Split(path, marker)
	if len(parts) < 2 {
		return ""
	}
	return strings.Split(strings.Trim(parts[len(parts)-1], "/"), "/")[0]
}

func onlyDigits(value string) string {
	var result strings.Builder
	for _, char := range value {
		if char >= '0' && char <= '9' {
			result.WriteRune(char)
		}
	}
	return result.String()
}

func roundMoney(value float64) float64 {
	parsed, _ := strconv.ParseFloat(fmt.Sprintf("%.2f", value), 64)
	return parsed
}

func marshalResponse(status int, value interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(value)
	return jsonResponse(status, string(body))
}

func errorResponse(status int, message string) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(map[string]string{"error": message})
	return jsonResponse(status, string(body))
}

func jsonResponse(status int, body string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{StatusCode: status, Body: body, Headers: map[string]string{
		"Content-Type": "application/json", "Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
		"Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
	}}
}
