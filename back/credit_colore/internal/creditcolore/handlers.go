package creditcolore

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/golang-jwt/jwt/v5"
)

type CreditHistory struct {
	Amount      float64 `json:"amount" dynamodbav:"amount"`
	Type        string  `json:"type" dynamodbav:"type"`
	AdminUserID string  `json:"admin_user_id,omitempty" dynamodbav:"admin_user_id,omitempty"`
	CreatedAt   string  `json:"created_at" dynamodbav:"created_at"`
}

type ColoreCard struct {
	ID          string `json:"id" dynamodbav:"id"`
	Number      string `json:"number" dynamodbav:"number"`
	LastFour    string `json:"last_four" dynamodbav:"last_four"`
	HolderName  string `json:"holder_name" dynamodbav:"holder_name"`
	Brand       string `json:"brand" dynamodbav:"brand"`
	CreatedAt   string `json:"created_at" dynamodbav:"created_at"`
	ExpiryMonth int    `json:"expiry_month" dynamodbav:"expiry_month"`
	ExpiryYear  int    `json:"expiry_year" dynamodbav:"expiry_year"`
}

type CreditInstallment struct {
	ID         string  `json:"id" dynamodbav:"id"`
	OrderID    string  `json:"order_id" dynamodbav:"order_id"`
	Number     int     `json:"number" dynamodbav:"number"`
	Total      int     `json:"total" dynamodbav:"total"`
	Amount     float64 `json:"amount" dynamodbav:"amount"`
	Status     string  `json:"status" dynamodbav:"status"`
	DueDate    string  `json:"due_date" dynamodbav:"due_date"`
	PaidAt     string  `json:"paid_at,omitempty" dynamodbav:"paid_at,omitempty"`
	PaidAmount float64 `json:"paid_amount,omitempty" dynamodbav:"paid_amount,omitempty"`
	CreatedAt  string  `json:"created_at" dynamodbav:"created_at"`
}

type Credit struct {
	UserID       string              `json:"user_id" dynamodbav:"user_id"`
	CreditLimit  float64             `json:"credit_limit" dynamodbav:"credit_limit"`
	UsedCredit   float64             `json:"used_credit" dynamodbav:"used_credit"`
	Card         ColoreCard          `json:"card" dynamodbav:"card"`
	Installments []CreditInstallment `json:"installments,omitempty" dynamodbav:"installments,omitempty"`
	History      []CreditHistory     `json:"history,omitempty" dynamodbav:"history,omitempty"`
	CreatedAt    string              `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt    string              `json:"updated_at" dynamodbav:"updated_at"`
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
	Credit  CreditResponse `json:"credit"`
	IsAdmin bool           `json:"is_admin"`
}

type AdminCreditInstallment struct {
	CreditInstallment
	UserID    string `json:"user_id"`
	UserName  string `json:"user_name"`
	UserEmail string `json:"user_email"`
}

type UserRole struct {
	Active        bool   `dynamodbav:"active"`
	DeactivatedAt string `dynamodbav:"deactivated_at,omitempty"`
}

type AddCreditRequest struct {
	Amount float64 `json:"amount"`
}

type PayInstallmentRequest struct {
	PaidAmount float64 `json:"paid_amount"`
	PaidAt     string  `json:"paid_at"`
}

type EmailQueuePayload struct {
	ID      string            `json:"id"`
	UUID    string            `json:"uuid"`
	Type    string            `json:"type"`
	ToEmail string            `json:"to_email"`
	ToName  string            `json:"to_name,omitempty"`
	Data    map[string]string `json:"data"`
}

var (
	dynamoClient  dynamodbiface.DynamoDBAPI
	sqsClient     *sqs.SQS
	tableName     = "mundocolore-credit"
	usersTable    = "mundocolore-users"
	roleTable     = "mundocolore-role"
	emailQueueURL = ""
	jwtSecret     = []byte("your-secret-key")
)

func init() {
	sess := session.Must(session.NewSession(&aws.Config{Region: aws.String("sa-east-1")}))
	dynamoClient = dynamodb.New(sess)
	sqsClient = sqs.New(sess)
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
	if value := os.Getenv("EMAIL_QUEUE_URL"); value != "" {
		emailQueueURL = value
	}
}

func HandleGetCredit(_ context.Context, userID string) (events.APIGatewayProxyResponse, error) {
	credit, err := getOrCreateCredit(userID)
	if err != nil {
		return errorResponse(500, err.Error()), nil
	}
	return marshalResponse(200, toCreditResponse(credit)), nil
}

func getUserByID(userID string) (User, error) {
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(usersTable),
		Key:       map[string]*dynamodb.AttributeValue{"id": {S: aws.String(userID)}},
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

func enqueueCreditAddedEmail(userID string, amount float64, credit Credit) error {
	if strings.TrimSpace(emailQueueURL) == "" {
		return nil
	}
	user, err := getUserByID(userID)
	if err != nil || strings.TrimSpace(user.Email) == "" {
		return err
	}
	emailID := generateID()
	payload := EmailQueuePayload{
		ID:      emailID,
		UUID:    emailID,
		Type:    "notificacao-credito-colore-adicionado",
		ToEmail: user.Email,
		ToName:  user.Name,
		Data: map[string]string{
			"nome_do_cliente":    user.Name,
			"valor_credito":      formatBRL(amount),
			"credito_disponivel": formatBRL(toCreditResponse(credit).AvailableCredit),
		},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	_, err = sqsClient.SendMessage(&sqs.SendMessageInput{
		QueueUrl:    aws.String(emailQueueURL),
		MessageBody: aws.String(string(body)),
	})
	return err
}

func HandleListUsers(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	startKey, err := decodeUsersCursor(request.QueryStringParameters["cursor"])
	if err != nil {
		return errorResponse(400, "invalid cursor"), nil
	}
	result, err := dynamoClient.Scan(&dynamodb.ScanInput{
		TableName:         aws.String(usersTable),
		ExclusiveStartKey: startKey,
		Limit:             aws.Int64(10),
	})
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
	for _, item := range result.Items {
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
		users = append(users, UserCredit{
			User: user, Credit: toCreditResponse(credit), IsAdmin: isActiveAdmin(user.ID),
		})
	}
	nextCursor, err := encodeUsersCursor(result.LastEvaluatedKey)
	if err != nil {
		return errorResponse(500, err.Error()), nil
	}
	return marshalResponse(200, map[string]interface{}{"users": users, "next_cursor": nextCursor}), nil
}

func encodeUsersCursor(key map[string]*dynamodb.AttributeValue) (string, error) {
	if len(key) == 0 {
		return "", nil
	}
	body, err := json.Marshal(key)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(body), nil
}

func decodeUsersCursor(value string) (map[string]*dynamodb.AttributeValue, error) {
	if strings.TrimSpace(value) == "" {
		return nil, nil
	}
	body, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return nil, err
	}
	var key map[string]*dynamodb.AttributeValue
	if err := json.Unmarshal(body, &key); err != nil || len(key) != 1 || key["id"] == nil || key["id"].S == nil || strings.TrimSpace(*key["id"].S) == "" {
		return nil, fmt.Errorf("invalid cursor")
	}
	return key, nil
}

func HandleListInstallments(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	statusFilter := strings.ToLower(strings.TrimSpace(request.QueryStringParameters["status"]))
	userQuery := strings.ToLower(strings.TrimSpace(request.QueryStringParameters["user"]))

	creditItems, err := scanAllCredits()
	if err != nil {
		return errorResponse(500, err.Error()), nil
	}

	installments := make([]AdminCreditInstallment, 0)
	for _, item := range creditItems {
		var credit Credit
		if dynamodbattribute.UnmarshalMap(item, &credit) != nil || credit.UserID == "" {
			continue
		}
		user, _ := getUserByID(credit.UserID)
		searchText := strings.ToLower(credit.UserID + " " + user.Name + " " + user.Email)
		if userQuery != "" && !strings.Contains(searchText, userQuery) {
			continue
		}
		for _, installment := range credit.Installments {
			if statusFilter != "" && statusFilter != "todas" && normalizeInstallmentStatus(installment.Status) != normalizeInstallmentStatus(statusFilter) {
				continue
			}
			installments = append(installments, AdminCreditInstallment{
				CreditInstallment: installment,
				UserID:            credit.UserID,
				UserName:          user.Name,
				UserEmail:         user.Email,
			})
		}
	}
	return marshalResponse(200, map[string]interface{}{"installments": installments}), nil
}

func HandlePayInstallment(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	installmentID := pathID(request.Path, "/credit-colore/admin/installments/")
	if installmentID == "" {
		return errorResponse(400, "invalid installment id"), nil
	}

	var req PayInstallmentRequest
	_ = json.Unmarshal([]byte(request.Body), &req)

	credit, installmentIndex, err := findCreditByInstallmentID(installmentID)
	if err != nil {
		return errorResponse(404, err.Error()), nil
	}
	if installmentIndex < 0 || installmentIndex >= len(credit.Installments) {
		return errorResponse(404, "installment not found"), nil
	}

	installment := credit.Installments[installmentIndex]
	if normalizeInstallmentStatus(installment.Status) == "paga" {
		return marshalResponse(200, toCreditResponse(credit)), nil
	}

	paidAmount := roundMoney(req.PaidAmount)
	if paidAmount <= 0 {
		paidAmount = roundMoney(installment.Amount)
	}
	paidAt := strings.TrimSpace(req.PaidAt)
	if paidAt == "" {
		paidAt = time.Now().UTC().Format(time.RFC3339)
	}

	credit.Installments[installmentIndex].Status = "paga"
	credit.Installments[installmentIndex].PaidAmount = paidAmount
	credit.Installments[installmentIndex].PaidAt = paidAt
	credit.UsedCredit = roundMoney(credit.UsedCredit - paidAmount)
	if credit.UsedCredit < 0 {
		credit.UsedCredit = 0
	}
	credit.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	item, err := dynamodbattribute.MarshalMap(credit)
	if err != nil {
		return errorResponse(500, err.Error()), nil
	}
	if _, err := dynamoClient.PutItem(&dynamodb.PutItemInput{TableName: aws.String(tableName), Item: item}); err != nil {
		return errorResponse(500, err.Error()), nil
	}

	return marshalResponse(200, toCreditResponse(credit)), nil
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

func scanAllCredits() ([]map[string]*dynamodb.AttributeValue, error) {
	items := []map[string]*dynamodb.AttributeValue{}
	var startKey map[string]*dynamodb.AttributeValue
	for {
		result, err := dynamoClient.Scan(&dynamodb.ScanInput{TableName: aws.String(tableName), ExclusiveStartKey: startKey})
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

func findCreditByInstallmentID(installmentID string) (Credit, int, error) {
	items, err := scanAllCredits()
	if err != nil {
		return Credit{}, -1, err
	}
	for _, item := range items {
		var credit Credit
		if dynamodbattribute.UnmarshalMap(item, &credit) != nil {
			continue
		}
		for index, installment := range credit.Installments {
			if installment.ID == installmentID {
				return credit, index, nil
			}
		}
	}
	return Credit{}, -1, fmt.Errorf("installment not found")
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
	if err := enqueueCreditAddedEmail(userID, req.Amount, credit); err != nil {
		log.Printf("failed to enqueue credit email user=%s: %v", userID, err)
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
		return ensureCreditCard(credit)
	}
	now := time.Now().UTC().Format(time.RFC3339)
	credit := Credit{
		UserID:      userID,
		CreditLimit: 0,
		UsedCredit:  0,
		Card:        buildColoreCard(userID, now),
		CreatedAt:   now,
		UpdatedAt:   now,
	}
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
	return ensureCreditCard(credit)
}

func ensureCreditCard(credit Credit) (Credit, error) {
	if strings.TrimSpace(credit.Card.Number) != "" {
		return credit, nil
	}
	now := time.Now().UTC().Format(time.RFC3339)
	credit.Card = buildColoreCard(credit.UserID, now)
	credit.UpdatedAt = now
	cardAV, err := dynamodbattribute.MarshalMap(credit.Card)
	if err != nil {
		return Credit{}, err
	}
	_, err = dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName:        aws.String(tableName),
		Key:              map[string]*dynamodb.AttributeValue{"user_id": {S: aws.String(credit.UserID)}},
		UpdateExpression: aws.String("SET card = :card, updated_at = :updated_at"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":card":       {M: cardAV},
			":updated_at": {S: aws.String(now)},
		},
	})
	return credit, err
}

func buildColoreCard(userID string, createdAt string) ColoreCard {
	number := buildColoreCardNumber(userID)
	now := time.Now().UTC()
	return ColoreCard{
		ID:          "COLORE-CARD-" + userID,
		Number:      number,
		LastFour:    number[len(number)-4:],
		HolderName:  "MUNDO COLORE STORE",
		Brand:       "Colore",
		CreatedAt:   createdAt,
		ExpiryMonth: 12,
		ExpiryYear:  now.Year() + 5,
	}
}

func buildColoreCardNumber(userID string) string {
	sum := sha256.Sum256([]byte(userID))
	var builder strings.Builder
	builder.WriteString("7777")
	for _, value := range sum {
		if builder.Len() >= 16 {
			break
		}
		builder.WriteByte('0' + value%10)
	}
	for builder.Len() < 16 {
		builder.WriteByte('0')
	}
	return builder.String()
}

func toCreditResponse(credit Credit) CreditResponse {
	return CreditResponse{Credit: credit, AvailableCredit: roundMoney(credit.CreditLimit - credit.UsedCredit)}
}

func normalizeInstallmentStatus(status string) string {
	status = strings.ToLower(strings.TrimSpace(status))
	if status == "paga" || status == "paid" {
		return "paga"
	}
	if status == "todas" {
		return "todas"
	}
	return "a_pagar"
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

func formatBRL(value float64) string {
	return fmt.Sprintf("R$ %.2f", roundMoney(value))
}

func generateID() string {
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
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
