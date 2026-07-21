package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/mail"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3iface"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/aws/aws-sdk-go/service/sqs/sqsiface"
	"github.com/golang-jwt/jwt/v5"
)

type config struct {
	TableName        string
	MailboxIndex     string
	SentIndex        string
	RoleTableName    string
	BucketName       string
	QueueURL         string
	JWTSecret        []byte
	AllowedMailboxes []string
}

type emailRecord struct {
	ID           string   `json:"id" dynamodbav:"id"`
	Type         string   `json:"type" dynamodbav:"type"`
	Direction    string   `json:"direction" dynamodbav:"direction"`
	Mailbox      string   `json:"mailbox" dynamodbav:"mailbox"`
	ReceivedAt   string   `json:"received_at" dynamodbav:"received_at"`
	ReceivedSort string   `json:"-" dynamodbav:"received_sort"`
	FromEmail    string   `json:"from_email" dynamodbav:"from_email"`
	ToEmail      string   `json:"to_email" dynamodbav:"to_email"`
	Recipients   []string `json:"recipients,omitempty" dynamodbav:"recipients,omitempty"`
	Subject      string   `json:"subject" dynamodbav:"subject"`
	SearchText   string   `json:"-" dynamodbav:"search_text"`
	S3Key        string   `json:"-" dynamodbav:"s3_key"`
	ArchiveKeys  []string `json:"archive_keys,omitempty" dynamodbav:"archive_keys,omitempty"`
	Status       string   `json:"status" dynamodbav:"status"`
	RawSize      int      `json:"raw_size" dynamodbav:"raw_size"`
	ProcessedAt  string   `json:"processed_at,omitempty" dynamodbav:"processed_at,omitempty"`
	Body         string   `json:"-" dynamodbav:"body,omitempty"`
	RenderedBody string   `json:"-" dynamodbav:"rendered_body,omitempty"`
	RenderedSubj string   `json:"-" dynamodbav:"rendered_subject,omitempty"`
	ErrorMessage string   `json:"error_message,omitempty" dynamodbav:"error_message,omitempty"`
}

type listResponse struct {
	Items      []emailRecord `json:"items"`
	NextCursor string        `json:"next_cursor,omitempty"`
}

type emailDetail struct {
	emailRecord
	FromName    string       `json:"from_name,omitempty"`
	BodyText    string       `json:"body_text,omitempty"`
	BodyHTML    string       `json:"body_html,omitempty"`
	Attachments []attachment `json:"attachments,omitempty"`
}

type composeRequest struct {
	FromEmail string `json:"from_email"`
	ToEmail   string `json:"to_email"`
	ToName    string `json:"to_name,omitempty"`
	Subject   string `json:"subject"`
	Body      string `json:"body"`
}

type sendQueuePayload struct {
	ID        string `json:"id"`
	UUID      string `json:"uuid"`
	Type      string `json:"type"`
	FromEmail string `json:"from_email"`
	ToEmail   string `json:"to_email"`
	ToName    string `json:"to_name,omitempty"`
	Subject   string `json:"subject"`
	Body      string `json:"body"`
}

type statusRequest struct {
	Status string `json:"status"`
}

type userRole struct {
	Active        bool   `dynamodbav:"active"`
	DeactivatedAt string `dynamodbav:"deactivated_at,omitempty"`
}

var (
	appConfig    config
	dynamoClient dynamodbiface.DynamoDBAPI
	s3Client     s3iface.S3API
	sqsClient    sqsiface.SQSAPI
)

func init() {
	appConfig = loadConfig()
	sess := session.Must(session.NewSession(&aws.Config{Region: aws.String(os.Getenv("AWS_REGION"))}))
	dynamoClient = dynamodb.New(sess)
	s3Client = s3.New(sess)
	sqsClient = sqs.New(sess)
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if request.HTTPMethod == "OPTIONS" {
		return jsonResponse(200, map[string]interface{}{}), nil
	}
	if err := validateConfig(); err != nil {
		return errorResponse(500, err.Error()), nil
	}
	if _, ok := authenticatedAdminID(request); !ok {
		return errorResponse(403, "admin access required"), nil
	}

	path := strings.TrimSuffix(request.Path, "/")
	if request.HTTPMethod == "GET" && strings.HasSuffix(path, "/emails/mailboxes") {
		return jsonResponse(200, map[string]interface{}{"mailboxes": appConfig.AllowedMailboxes}), nil
	}
	if request.HTTPMethod == "POST" && strings.HasSuffix(path, "/emails/send") {
		return handleSend(ctx, request)
	}
	if request.HTTPMethod == "GET" && strings.HasSuffix(path, "/emails/sent") {
		return handleSentList(ctx, request)
	}
	if request.HTTPMethod == "GET" && strings.HasSuffix(path, "/emails") {
		return handleList(ctx, request)
	}
	if request.HTTPMethod == "GET" && strings.Contains(path, "/emails/sent/") {
		return handleGetSent(ctx, sentEmailIDFromPath(path))
	}

	id := emailIDFromPath(path)
	if id == "" {
		return errorResponse(404, "email not found"), nil
	}
	if request.HTTPMethod == "GET" {
		return handleGet(ctx, id)
	}
	if request.HTTPMethod == "PATCH" {
		return handleStatus(ctx, id, request)
	}
	return errorResponse(404, "route not found"), nil
}

func handleList(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	mailbox := strings.ToLower(strings.TrimSpace(request.QueryStringParameters["mailbox"]))
	if !isAllowedMailbox(mailbox) {
		return errorResponse(400, "mailbox is not allowed"), nil
	}
	limit := 30
	if parsed, err := strconv.Atoi(request.QueryStringParameters["limit"]); err == nil && parsed > 0 && parsed <= 100 {
		limit = parsed
	}
	query := strings.ToLower(strings.TrimSpace(request.QueryStringParameters["q"]))
	status := strings.ToLower(strings.TrimSpace(request.QueryStringParameters["status"]))
	if status != "" && status != "read" && status != "unread" {
		return errorResponse(400, "status must be read or unread"), nil
	}
	day := strings.TrimSpace(request.QueryStringParameters["day"])
	dayStart, dayEnd, dayErr := dayBounds(day)
	if dayErr != nil {
		return errorResponse(400, "day must use YYYY-MM-DD format"), nil
	}
	exclusiveStartKey, err := decodeCursor(request.QueryStringParameters["cursor"])
	if err != nil {
		return errorResponse(400, "invalid cursor"), nil
	}

	items := make([]emailRecord, 0, limit+1)
	lastKey := exclusiveStartKey
	reachedLimit := false
	for page := 0; page < 10 && len(items) <= limit; page++ {
		keyCondition := "mailbox = :mailbox"
		attributeValues := map[string]*dynamodb.AttributeValue{
			":mailbox": {S: aws.String(mailbox)},
		}
		if day != "" {
			keyCondition += " AND received_sort BETWEEN :day_start AND :day_end"
			attributeValues[":day_start"] = &dynamodb.AttributeValue{S: aws.String(dayStart)}
			attributeValues[":day_end"] = &dynamodb.AttributeValue{S: aws.String(dayEnd)}
		}
		result, queryErr := dynamoClient.QueryWithContext(ctx, &dynamodb.QueryInput{
			TableName:                 aws.String(appConfig.TableName),
			IndexName:                 aws.String(appConfig.MailboxIndex),
			KeyConditionExpression:    aws.String(keyCondition),
			ExpressionAttributeValues: attributeValues,
			ExclusiveStartKey:         lastKey,
			Limit:                     aws.Int64(int64(limit + 1)),
			ScanIndexForward:          aws.Bool(false),
		})
		if queryErr != nil {
			return errorResponse(500, "could not list emails"), nil
		}

		var pageItems []emailRecord
		if err := dynamodbattribute.UnmarshalListOfMaps(result.Items, &pageItems); err != nil {
			return errorResponse(500, "could not decode emails"), nil
		}
		for _, item := range pageItems {
			matchesStatus := status == "" || item.Status == status
			if matchesStatus && (query == "" || strings.Contains(strings.ToLower(item.SearchText), query)) {
				items = append(items, item)
				if len(items) == limit+1 {
					lastKey = cursorKeyForEmail(items[limit-1])
					reachedLimit = true
					break
				}
			}
		}
		if reachedLimit {
			break
		}
		lastKey = result.LastEvaluatedKey
		if len(lastKey) == 0 {
			break
		}
	}
	if reachedLimit {
		items = items[:limit]
	}

	cursor, err := encodeCursor(lastKey)
	if err != nil {
		return errorResponse(500, "could not create cursor"), nil
	}
	return jsonResponse(200, listResponse{Items: items, NextCursor: cursor}), nil
}

func handleSentList(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	mailbox := strings.ToLower(strings.TrimSpace(request.QueryStringParameters["mailbox"]))
	if !isAllowedMailbox(mailbox) {
		return errorResponse(400, "mailbox is not allowed"), nil
	}
	limit := 30
	if parsed, err := strconv.Atoi(request.QueryStringParameters["limit"]); err == nil && parsed > 0 && parsed <= 100 {
		limit = parsed
	}
	query := strings.ToLower(strings.TrimSpace(request.QueryStringParameters["q"]))
	day := strings.TrimSpace(request.QueryStringParameters["day"])
	dayStart, dayEnd, dayErr := dayBounds(day)
	if dayErr != nil {
		return errorResponse(400, "day must use YYYY-MM-DD format"), nil
	}
	exclusiveStartKey, err := decodeCursor(request.QueryStringParameters["cursor"])
	if err != nil {
		return errorResponse(400, "invalid cursor"), nil
	}

	items := make([]emailRecord, 0, limit+1)
	lastKey := exclusiveStartKey
	reachedLimit := false
	for page := 0; page < 10 && len(items) <= limit; page++ {
		keyCondition := "#type = :type"
		attributeNames := map[string]*string{"#type": aws.String("type")}
		attributeValues := map[string]*dynamodb.AttributeValue{
			":type": {S: aws.String("email-admin-manual")},
		}
		if day != "" {
			keyCondition += " AND received_at BETWEEN :day_start AND :day_end"
			attributeValues[":day_start"] = &dynamodb.AttributeValue{S: aws.String(dayStart)}
			attributeValues[":day_end"] = &dynamodb.AttributeValue{S: aws.String(dayEnd)}
		}
		result, queryErr := dynamoClient.QueryWithContext(ctx, &dynamodb.QueryInput{
			TableName:                 aws.String(appConfig.TableName),
			IndexName:                 aws.String(appConfig.SentIndex),
			KeyConditionExpression:    aws.String(keyCondition),
			ExpressionAttributeNames:  attributeNames,
			ExpressionAttributeValues: attributeValues,
			ExclusiveStartKey:         lastKey,
			Limit:                     aws.Int64(int64(limit + 1)),
			ScanIndexForward:          aws.Bool(false),
		})
		if queryErr != nil {
			return errorResponse(500, "could not list sent emails"), nil
		}

		var pageItems []emailRecord
		if err := dynamodbattribute.UnmarshalListOfMaps(result.Items, &pageItems); err != nil {
			return errorResponse(500, "could not decode sent emails"), nil
		}
		for _, item := range pageItems {
			normalizeSentRecord(&item)
			if !strings.EqualFold(item.FromEmail, mailbox) {
				continue
			}
			searchText := strings.ToLower(strings.Join([]string{item.FromEmail, item.ToEmail, item.Subject}, " "))
			if query == "" || strings.Contains(searchText, query) {
				items = append(items, item)
				if len(items) == limit+1 {
					lastKey = cursorKeyForSentEmail(items[limit-1])
					reachedLimit = true
					break
				}
			}
		}
		if reachedLimit {
			break
		}
		lastKey = result.LastEvaluatedKey
		if len(lastKey) == 0 {
			break
		}
	}
	if reachedLimit {
		items = items[:limit]
	}

	cursor, err := encodeCursor(lastKey)
	if err != nil {
		return errorResponse(500, "could not create cursor"), nil
	}
	return jsonResponse(200, listResponse{Items: items, NextCursor: cursor}), nil
}

func normalizeSentRecord(record *emailRecord) {
	record.Direction = "outbound"
	record.Mailbox = strings.ToLower(strings.TrimSpace(record.FromEmail))
	if record.Subject == "" {
		record.Subject = record.RenderedSubj
	}
	if record.ReceivedAt == "" {
		record.ReceivedAt = record.ProcessedAt
	}
}

func dayBounds(value string) (string, string, error) {
	if value == "" {
		return "", "", nil
	}
	location := time.FixedZone("America/Sao_Paulo", -3*60*60)
	parsed, err := time.ParseInLocation("2006-01-02", value, location)
	if err != nil || parsed.Format("2006-01-02") != value {
		return "", "", errors.New("invalid day")
	}
	return parsed.UTC().Format(time.RFC3339), parsed.AddDate(0, 0, 1).UTC().Format(time.RFC3339), nil
}

func cursorKeyForEmail(item emailRecord) map[string]*dynamodb.AttributeValue {
	return map[string]*dynamodb.AttributeValue{
		"id":            {S: aws.String(item.ID)},
		"mailbox":       {S: aws.String(item.Mailbox)},
		"received_sort": {S: aws.String(item.ReceivedSort)},
	}
}

func cursorKeyForSentEmail(item emailRecord) map[string]*dynamodb.AttributeValue {
	return map[string]*dynamodb.AttributeValue{
		"id":          {S: aws.String(item.ID)},
		"type":        {S: aws.String(item.Type)},
		"received_at": {S: aws.String(item.ReceivedAt)},
	}
}

func handleGet(ctx context.Context, id string) (events.APIGatewayProxyResponse, error) {
	record, err := getInboundEmailRecord(ctx, id)
	if err != nil {
		if errors.Is(err, errNotFound) {
			return errorResponse(404, "email not found"), nil
		}
		return errorResponse(500, "could not load email"), nil
	}
	if !isAllowedMailbox(record.Mailbox) {
		return errorResponse(403, "mailbox is not allowed"), nil
	}

	object, err := s3Client.GetObjectWithContext(ctx, &s3.GetObjectInput{
		Bucket: aws.String(appConfig.BucketName),
		Key:    aws.String(record.S3Key),
	})
	if err != nil {
		return errorResponse(500, "could not load email content"), nil
	}
	defer object.Body.Close()
	raw, err := io.ReadAll(object.Body)
	if err != nil {
		return errorResponse(500, "could not read email content"), nil
	}
	parsed, err := parseRawEmail(raw)
	if err != nil {
		return errorResponse(500, "could not parse email content"), nil
	}

	if record.Status != "read" {
		if err := updateStatus(ctx, id, "read"); err != nil {
			return errorResponse(500, "could not mark email as read"), nil
		}
	}
	record.Status = "read"
	detail := emailDetail{
		emailRecord: record,
		FromName:    parsed.FromName,
		BodyText:    parsed.BodyText,
		BodyHTML:    parsed.BodyHTML,
		Attachments: parsed.Attachments,
	}
	return jsonResponse(200, detail), nil
}

func handleGetSent(ctx context.Context, id string) (events.APIGatewayProxyResponse, error) {
	if id == "" {
		return errorResponse(404, "email not found"), nil
	}
	record, err := getEmailRecord(ctx, id)
	if err != nil {
		if errors.Is(err, errNotFound) {
			return errorResponse(404, "email not found"), nil
		}
		return errorResponse(500, "could not load sent email"), nil
	}
	normalizeSentRecord(&record)
	if record.Type != "email-admin-manual" || !isAllowedMailbox(record.FromEmail) {
		return errorResponse(404, "email not found"), nil
	}
	body := record.RenderedBody
	if body == "" {
		body = record.Body
	}
	detail := emailDetail{emailRecord: record, BodyText: body}
	return jsonResponse(200, detail), nil
}

func handleStatus(ctx context.Context, id string, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var payload statusRequest
	if err := json.Unmarshal([]byte(request.Body), &payload); err != nil {
		return errorResponse(400, "invalid json"), nil
	}
	payload.Status = strings.ToLower(strings.TrimSpace(payload.Status))
	if payload.Status != "read" && payload.Status != "unread" {
		return errorResponse(400, "status must be read or unread"), nil
	}
	record, err := getInboundEmailRecord(ctx, id)
	if err != nil || !isAllowedMailbox(record.Mailbox) {
		return errorResponse(404, "email not found"), nil
	}
	if err := updateStatus(ctx, id, payload.Status); err != nil {
		return errorResponse(500, "could not update email"), nil
	}
	return jsonResponse(200, map[string]string{"id": id, "status": payload.Status}), nil
}

func handleSend(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var payload composeRequest
	if err := json.Unmarshal([]byte(request.Body), &payload); err != nil {
		return errorResponse(400, "invalid json"), nil
	}
	payload.FromEmail = strings.ToLower(strings.TrimSpace(payload.FromEmail))
	payload.ToEmail = strings.ToLower(strings.TrimSpace(payload.ToEmail))
	payload.ToName = strings.TrimSpace(payload.ToName)
	payload.Subject = strings.TrimSpace(payload.Subject)
	payload.Body = strings.TrimSpace(payload.Body)
	if !isAllowedMailbox(payload.FromEmail) {
		return errorResponse(400, "from_email is not allowed"), nil
	}
	if address, err := mail.ParseAddress(payload.ToEmail); err != nil || !strings.EqualFold(address.Address, payload.ToEmail) {
		return errorResponse(400, "to_email is invalid"), nil
	}
	if payload.Subject == "" || len([]rune(payload.Subject)) > 300 {
		return errorResponse(400, "subject is required and must have at most 300 characters"), nil
	}
	if payload.Body == "" || len([]byte(payload.Body)) > 100000 {
		return errorResponse(400, "body is required and must have at most 100000 bytes"), nil
	}

	id := generateID()
	queuePayload := sendQueuePayload{
		ID: id, UUID: id, Type: "email-admin-manual", FromEmail: payload.FromEmail,
		ToEmail: payload.ToEmail, ToName: payload.ToName, Subject: payload.Subject, Body: payload.Body,
	}
	body, _ := json.Marshal(queuePayload)
	if _, err := sqsClient.SendMessageWithContext(ctx, &sqs.SendMessageInput{
		QueueUrl:    aws.String(appConfig.QueueURL),
		MessageBody: aws.String(string(body)),
	}); err != nil {
		return errorResponse(500, "could not queue email"), nil
	}
	return jsonResponse(202, map[string]string{"id": id, "status": "queued"}), nil
}

var errNotFound = errors.New("not found")

func getEmailRecord(ctx context.Context, id string) (emailRecord, error) {
	result, err := dynamoClient.GetItemWithContext(ctx, &dynamodb.GetItemInput{
		TableName:      aws.String(appConfig.TableName),
		Key:            map[string]*dynamodb.AttributeValue{"id": {S: aws.String(id)}},
		ConsistentRead: aws.Bool(true),
	})
	if err != nil {
		return emailRecord{}, err
	}
	if len(result.Item) == 0 {
		return emailRecord{}, errNotFound
	}
	var record emailRecord
	if err := dynamodbattribute.UnmarshalMap(result.Item, &record); err != nil {
		return emailRecord{}, err
	}
	return record, nil
}

func getInboundEmailRecord(ctx context.Context, id string) (emailRecord, error) {
	record, err := getEmailRecord(ctx, id)
	if err != nil {
		return emailRecord{}, err
	}
	if record.Direction != "inbound" {
		return emailRecord{}, errNotFound
	}
	return record, nil
}

func updateStatus(ctx context.Context, id, status string) error {
	_, err := dynamoClient.UpdateItemWithContext(ctx, &dynamodb.UpdateItemInput{
		TableName:                 aws.String(appConfig.TableName),
		Key:                       map[string]*dynamodb.AttributeValue{"id": {S: aws.String(id)}},
		UpdateExpression:          aws.String("SET #status = :status"),
		ExpressionAttributeNames:  map[string]*string{"#status": aws.String("status")},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{":status": {S: aws.String(status)}},
	})
	return err
}

func authenticatedAdminID(request events.APIGatewayProxyRequest) (string, bool) {
	raw := extractBearerToken(request.Headers)
	if raw == "" {
		return "", false
	}
	token, err := jwt.Parse(raw, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return appConfig.JWTSecret, nil
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
		TableName:      aws.String(appConfig.RoleTableName),
		Key:            map[string]*dynamodb.AttributeValue{"id": {S: aws.String(userID)}},
		ConsistentRead: aws.Bool(true),
	})
	if err != nil || len(result.Item) == 0 {
		return false
	}
	var role userRole
	return dynamodbattribute.UnmarshalMap(result.Item, &role) == nil && role.Active && strings.TrimSpace(role.DeactivatedAt) == ""
}

func extractBearerToken(headers map[string]string) string {
	for key, value := range headers {
		if strings.EqualFold(key, "Authorization") {
			parts := strings.SplitN(strings.TrimSpace(value), " ", 2)
			if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
				return strings.TrimSpace(parts[1])
			}
		}
	}
	return ""
}

func emailIDFromPath(path string) string {
	position := strings.LastIndex(path, "/emails/")
	if position < 0 {
		return ""
	}
	value := path[position+len("/emails/"):]
	if value == "" || strings.Contains(value, "/") {
		return ""
	}
	decoded, err := url.PathUnescape(value)
	if err != nil {
		return ""
	}
	return decoded
}

func sentEmailIDFromPath(path string) string {
	position := strings.LastIndex(path, "/emails/sent/")
	if position < 0 {
		return ""
	}
	value := path[position+len("/emails/sent/"):]
	if value == "" || strings.Contains(value, "/") {
		return ""
	}
	decoded, err := url.PathUnescape(value)
	if err != nil {
		return ""
	}
	return decoded
}

func encodeCursor(key map[string]*dynamodb.AttributeValue) (string, error) {
	if len(key) == 0 {
		return "", nil
	}
	body, err := json.Marshal(key)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(body), nil
}

func decodeCursor(value string) (map[string]*dynamodb.AttributeValue, error) {
	if strings.TrimSpace(value) == "" {
		return nil, nil
	}
	body, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return nil, err
	}
	var key map[string]*dynamodb.AttributeValue
	if err := json.Unmarshal(body, &key); err != nil {
		return nil, err
	}
	return key, nil
}

func generateID() string {
	value := make([]byte, 16)
	_, _ = rand.Read(value)
	return hex.EncodeToString(value)
}

func isAllowedMailbox(value string) bool {
	value = strings.ToLower(strings.TrimSpace(value))
	for _, mailbox := range appConfig.AllowedMailboxes {
		if value == mailbox {
			return true
		}
	}
	return false
}

func loadConfig() config {
	mailboxes := make([]string, 0)
	seen := make(map[string]struct{})
	for _, mailbox := range strings.Split(os.Getenv("ALLOWED_MAILBOXES"), ",") {
		mailbox = strings.ToLower(strings.TrimSpace(mailbox))
		if mailbox != "" {
			if _, exists := seen[mailbox]; !exists {
				mailboxes = append(mailboxes, mailbox)
				seen[mailbox] = struct{}{}
			}
		}
	}
	return config{
		TableName:        envOrDefault("TABLE_NAME", "mundocolore-emails"),
		MailboxIndex:     envOrDefault("MAILBOX_INDEX", "mailbox-received-index"),
		SentIndex:        envOrDefault("SENT_INDEX", "type-received-index"),
		RoleTableName:    envOrDefault("ROLE_TABLE_NAME", "mundocolore-role"),
		BucketName:       strings.TrimSpace(os.Getenv("BUCKET_NAME")),
		QueueURL:         strings.TrimSpace(os.Getenv("EMAIL_QUEUE_URL")),
		JWTSecret:        []byte(strings.TrimSpace(os.Getenv("JWT_SECRET"))),
		AllowedMailboxes: mailboxes,
	}
}

func validateConfig() error {
	if appConfig.BucketName == "" || appConfig.QueueURL == "" || len(appConfig.JWTSecret) < 32 || len(appConfig.AllowedMailboxes) == 0 {
		return errors.New("email mailbox is not configured")
	}
	return nil
}

func envOrDefault(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func jsonResponse(status int, payload interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(payload)
	return events.APIGatewayProxyResponse{StatusCode: status, Headers: corsHeaders(), Body: string(body)}
}

func errorResponse(status int, message string) events.APIGatewayProxyResponse {
	return jsonResponse(status, map[string]string{"error": message})
}

func corsHeaders() map[string]string {
	return map[string]string{
		"Access-Control-Allow-Origin":  "*",
		"Access-Control-Allow-Headers": "Authorization,Content-Type",
		"Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
		"Content-Type":                 "application/json",
	}
}
