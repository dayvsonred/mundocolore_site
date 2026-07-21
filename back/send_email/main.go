package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/mail"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
)

const mailjetEndpoint = "https://api.mailjet.com/v3.1/send"

type Config struct {
	MailjetAPIKey     string
	MailjetSecretKey  string
	EmailFrom         string
	EmailFromName     string
	AllowedFromEmails map[string]struct{}
	TableName         string
}

type EmailRequest struct {
	ID        string            `json:"id,omitempty" dynamodbav:"id"`
	UUID      string            `json:"uuid,omitempty" dynamodbav:"uuid,omitempty"`
	Type      string            `json:"type" dynamodbav:"type"`
	ToEmail   string            `json:"to_email" dynamodbav:"to_email"`
	ToName    string            `json:"to_name,omitempty" dynamodbav:"to_name,omitempty"`
	FromEmail string            `json:"from_email,omitempty" dynamodbav:"from_email,omitempty"`
	Subject   string            `json:"subject,omitempty" dynamodbav:"subject,omitempty"`
	Body      string            `json:"body,omitempty" dynamodbav:"body,omitempty"`
	Data      map[string]string `json:"data,omitempty" dynamodbav:"data,omitempty"`
}

type EmailTemplate struct {
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

type TemplateFile struct {
	Templates map[string]EmailTemplate `json:"templates"`
}

type MailjetSendEmailRequest struct {
	Messages []MailjetMessage `json:"Messages"`
}

type MailjetMessage struct {
	From     MailjetContact   `json:"From"`
	To       []MailjetContact `json:"To"`
	Subject  string           `json:"Subject"`
	TextPart string           `json:"TextPart"`
}

type MailjetContact struct {
	Email string `json:"Email"`
	Name  string `json:"Name,omitempty"`
}

type SQSEvent struct {
	Records []struct {
		MessageID string `json:"messageId"`
		Body      string `json:"body"`
	} `json:"Records"`
}

type NewsletterRequest struct {
	Email string `json:"email"`
}

type APIMessage struct {
	Message string `json:"message"`
	Email   string `json:"email,omitempty"`
	Created bool   `json:"created"`
}

type EmailLog struct {
	ID                 string                 `dynamodbav:"id"`
	UUID               string                 `dynamodbav:"uuid,omitempty"`
	Type               string                 `dynamodbav:"type"`
	ToEmail            string                 `dynamodbav:"to_email"`
	ToName             string                 `dynamodbav:"to_name,omitempty"`
	FromEmail          string                 `dynamodbav:"from_email,omitempty"`
	Status             string                 `dynamodbav:"status"`
	ReceivedAt         string                 `dynamodbav:"received_at"`
	ProcessedAt        string                 `dynamodbav:"processed_at,omitempty"`
	RawPayload         map[string]interface{} `dynamodbav:"raw_payload"`
	RenderedSubject    string                 `dynamodbav:"rendered_subject,omitempty"`
	RenderedBody       string                 `dynamodbav:"rendered_body,omitempty"`
	Provider           string                 `dynamodbav:"provider,omitempty"`
	ProviderStatusCode int                    `dynamodbav:"provider_status_code,omitempty"`
	ProviderResponse   string                 `dynamodbav:"provider_response,omitempty"`
	ErrorMessage       string                 `dynamodbav:"error_message,omitempty"`
}

var (
	config       Config
	dynamoClient dynamodbiface.DynamoDBAPI
	httpClient   = &http.Client{Timeout: 15 * time.Second}
)

func init() {
	config = loadConfig()
	sess := session.Must(session.NewSession(&aws.Config{Region: aws.String(os.Getenv("AWS_REGION"))}))
	dynamoClient = dynamodb.New(sess)
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, raw json.RawMessage) (interface{}, error) {
	if len(bytes.TrimSpace(raw)) == 0 {
		return nil, errors.New("empty event")
	}

	var apiEvent events.APIGatewayProxyRequest
	if err := json.Unmarshal(raw, &apiEvent); err == nil && apiEvent.HTTPMethod != "" {
		return handleAPIRequest(ctx, apiEvent), nil
	}

	var event SQSEvent
	if err := json.Unmarshal(raw, &event); err == nil && len(event.Records) > 0 {
		for _, record := range event.Records {
			if err := processRawEmail(ctx, json.RawMessage(record.Body)); err != nil {
				log.Printf("failed to process sqs message %s: %v", record.MessageID, err)
				return nil, err
			}
		}
		return nil, nil
	}

	return nil, processRawEmail(ctx, raw)
}

func handleAPIRequest(ctx context.Context, request events.APIGatewayProxyRequest) events.APIGatewayProxyResponse {
	if request.HTTPMethod == http.MethodOptions {
		return apiResponse(http.StatusNoContent, APIMessage{})
	}
	if request.HTTPMethod != http.MethodPost {
		return apiResponse(http.StatusMethodNotAllowed, APIMessage{Message: "Método não permitido."})
	}

	var payload NewsletterRequest
	if err := json.Unmarshal([]byte(request.Body), &payload); err != nil {
		return apiResponse(http.StatusBadRequest, APIMessage{Message: "Informe um e-mail válido."})
	}

	email, err := normalizeNewsletterEmail(payload.Email)
	if err != nil {
		return apiResponse(http.StatusBadRequest, APIMessage{Message: "Informe um e-mail válido."})
	}

	created, err := saveNewsletterSubscriber(ctx, email)
	if err != nil {
		log.Printf("failed to save newsletter subscriber: %v", err)
		return apiResponse(http.StatusInternalServerError, APIMessage{Message: "Não foi possível concluir o cadastro agora. Tente novamente."})
	}

	message := "Cadastro realizado! Em breve você receberá as novidades da Mundo Colore."
	if !created {
		message = "Este e-mail já está cadastrado para receber nossas novidades."
	}

	return apiResponse(http.StatusOK, APIMessage{Message: message, Email: email, Created: created})
}

func apiResponse(statusCode int, payload APIMessage) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(payload)
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Allow-Methods": "POST,OPTIONS",
			"Access-Control-Allow-Origin":  "*",
			"Content-Type":                 "application/json; charset=utf-8",
		},
		Body: string(body),
	}
}

func normalizeNewsletterEmail(value string) (string, error) {
	normalized := strings.ToLower(strings.TrimSpace(value))
	if normalized == "" || len(normalized) > 254 || strings.ContainsAny(normalized, "\r\n\t ") {
		return "", errors.New("invalid email")
	}
	address, err := mail.ParseAddress(normalized)
	if err != nil || strings.ToLower(address.Address) != normalized {
		return "", errors.New("invalid email")
	}
	parts := strings.Split(normalized, "@")
	if len(parts) != 2 || parts[0] == "" || !strings.Contains(parts[1], ".") {
		return "", errors.New("invalid email")
	}
	return normalized, nil
}

func saveNewsletterSubscriber(ctx context.Context, email string) (bool, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	id := "newsletter#" + email
	result, err := dynamoClient.UpdateItemWithContext(ctx, &dynamodb.UpdateItemInput{
		TableName: aws.String(config.TableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(id)},
		},
		UpdateExpression: aws.String("SET #type = :type, to_email = :email, #status = :status, #source = :source, received_at = if_not_exists(received_at, :now), subscribed_at = if_not_exists(subscribed_at, :now), updated_at = :now, consent_version = :consent ADD subscription_count :one"),
		ExpressionAttributeNames: map[string]*string{
			"#source": aws.String("source"),
			"#status": aws.String("status"),
			"#type":   aws.String("type"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":consent": {S: aws.String("newsletter-v1")},
			":email":   {S: aws.String(email)},
			":now":     {S: aws.String(now)},
			":one":     {N: aws.String("1")},
			":source":  {S: aws.String("home-newsletter")},
			":status":  {S: aws.String("active")},
			":type":    {S: aws.String("newsletter-subscriber")},
		},
		ReturnValues: aws.String(dynamodb.ReturnValueAllOld),
	})
	if err != nil {
		return false, err
	}
	return len(result.Attributes) == 0, nil
}

func processRawEmail(ctx context.Context, raw json.RawMessage) error {
	req, err := parseEmailRequest(raw)
	if err != nil {
		return err
	}

	rawPayload := map[string]interface{}{}
	_ = json.Unmarshal(raw, &rawPayload)

	if err := saveReceivedPayload(req, rawPayload); err != nil {
		return err
	}

	var subject, body string
	if req.Type == "email-admin-manual" {
		subject = req.Subject
		body = req.Body
	} else {
		template, ok := templates[req.Type]
		if !ok {
			_ = saveFailedEmail(req, fmt.Sprintf("template not found: %s", req.Type))
			return fmt.Errorf("template not found: %s", req.Type)
		}

		variables := buildVariables(req)
		subject = renderTemplate(template.Subject, variables)
		body = renderTemplate(template.Body, variables)
	}

	statusCode, responseBody, err := sendEmailMailjet(ctx, req, subject, body)
	if err != nil {
		_ = saveFailedEmail(req, err.Error())
		return err
	}

	return saveSentEmail(req, subject, body, statusCode, responseBody)
}

func parseEmailRequest(raw json.RawMessage) (EmailRequest, error) {
	var req EmailRequest
	if err := json.Unmarshal(raw, &req); err != nil {
		return EmailRequest{}, fmt.Errorf("invalid json: %w", err)
	}

	req.ID = strings.TrimSpace(req.ID)
	req.UUID = strings.TrimSpace(req.UUID)
	req.Type = strings.TrimSpace(req.Type)
	req.ToEmail = strings.ToLower(strings.TrimSpace(req.ToEmail))
	req.ToName = strings.TrimSpace(req.ToName)
	req.FromEmail = strings.ToLower(strings.TrimSpace(req.FromEmail))
	req.Subject = strings.TrimSpace(req.Subject)
	req.Body = strings.TrimSpace(req.Body)

	if req.ID == "" {
		req.ID = req.UUID
	}
	if req.UUID == "" {
		req.UUID = req.ID
	}
	if req.ID == "" {
		return EmailRequest{}, errors.New("id or uuid is required")
	}
	if req.Type == "" {
		return EmailRequest{}, errors.New("type is required")
	}
	if req.ToEmail == "" {
		return EmailRequest{}, errors.New("to_email is required")
	}
	if config.MailjetAPIKey == "" {
		return EmailRequest{}, errors.New("MAILJET_API_KEY is not configured")
	}
	if config.MailjetSecretKey == "" {
		return EmailRequest{}, errors.New("MAILJET_SECRET_KEY is not configured")
	}
	if config.EmailFrom == "" {
		return EmailRequest{}, errors.New("EMAIL_FROM is not configured")
	}
	if req.FromEmail == "" {
		req.FromEmail = strings.ToLower(config.EmailFrom)
	}
	if _, allowed := config.AllowedFromEmails[req.FromEmail]; !allowed {
		return EmailRequest{}, errors.New("from_email is not allowed")
	}
	if req.Type == "email-admin-manual" {
		if req.Subject == "" {
			return EmailRequest{}, errors.New("subject is required")
		}
		if req.Body == "" {
			return EmailRequest{}, errors.New("body is required")
		}
	}
	if req.Data == nil {
		req.Data = map[string]string{}
	}

	return req, nil
}

func renderTemplate(template string, variables map[string]string) string {
	rendered := template
	for key, value := range variables {
		rendered = strings.ReplaceAll(rendered, "{{"+key+"}}", value)
	}
	return rendered
}

func buildVariables(req EmailRequest) map[string]string {
	location := time.FixedZone("America/Sao_Paulo", -3*60*60)
	now := time.Now().In(location)
	variables := map[string]string{
		"data_atual": now.Format("02/01/2006"),
		"hora_atual": now.Format("15:04"),
	}
	for key, value := range req.Data {
		variables[key] = value
	}
	return variables
}

func sendEmailMailjet(ctx context.Context, req EmailRequest, subject string, body string) (int, string, error) {
	payload := MailjetSendEmailRequest{
		Messages: []MailjetMessage{
			{
				From:     MailjetContact{Email: req.FromEmail, Name: config.EmailFromName},
				To:       []MailjetContact{{Email: req.ToEmail, Name: req.ToName}},
				Subject:  subject,
				TextPart: body,
			},
		},
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return 0, "", err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, mailjetEndpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return 0, "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.SetBasicAuth(config.MailjetAPIKey, config.MailjetSecretKey)

	resp, err := httpClient.Do(httpReq)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	respText := string(respBody)
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return resp.StatusCode, respText, fmt.Errorf("mailjet returned status %d: %s", resp.StatusCode, respText)
	}

	log.Printf("email sent type=%s to=%s status=%d", req.Type, req.ToEmail, resp.StatusCode)
	return resp.StatusCode, respText, nil
}

func loadConfig() Config {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		_ = os.Setenv("AWS_REGION", "sa-east-1")
	}
	return Config{
		MailjetAPIKey:     strings.TrimSpace(os.Getenv("MAILJET_API_KEY")),
		MailjetSecretKey:  strings.TrimSpace(os.Getenv("MAILJET_SECRET_KEY")),
		EmailFrom:         strings.TrimSpace(os.Getenv("EMAIL_FROM")),
		EmailFromName:     strings.TrimSpace(os.Getenv("EMAIL_FROM_NAME")),
		AllowedFromEmails: parseAllowedEmails(os.Getenv("ALLOWED_FROM_EMAILS"), os.Getenv("EMAIL_FROM")),
		TableName:         envOrDefault("TABLE_NAME", "mundocolore-emails"),
	}
}

func saveReceivedPayload(req EmailRequest, raw map[string]interface{}) error {
	now := time.Now().UTC().Format(time.RFC3339)
	item := EmailLog{
		ID:         req.ID,
		UUID:       req.UUID,
		Type:       req.Type,
		ToEmail:    req.ToEmail,
		ToName:     req.ToName,
		FromEmail:  req.FromEmail,
		Status:     "received",
		ReceivedAt: now,
		RawPayload: raw,
	}
	av, err := dynamodbattribute.MarshalMap(item)
	if err != nil {
		return err
	}
	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(config.TableName),
		Item:      av,
	})
	return err
}

func saveSentEmail(req EmailRequest, subject, body string, statusCode int, providerResponse string) error {
	_, err := dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName:        aws.String(config.TableName),
		Key:              map[string]*dynamodb.AttributeValue{"id": {S: aws.String(req.ID)}},
		UpdateExpression: aws.String("SET #status = :status, processed_at = :processed_at, rendered_subject = :subject, rendered_body = :body, provider = :provider, provider_status_code = :code, provider_response = :response"),
		ExpressionAttributeNames: map[string]*string{
			"#status": aws.String("status"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":status":       {S: aws.String("sent")},
			":processed_at": {S: aws.String(time.Now().UTC().Format(time.RFC3339))},
			":subject":      {S: aws.String(subject)},
			":body":         {S: aws.String(body)},
			":provider":     {S: aws.String("mailjet")},
			":code":         {N: aws.String(fmt.Sprintf("%d", statusCode))},
			":response":     {S: aws.String(providerResponse)},
		},
	})
	return err
}

func saveFailedEmail(req EmailRequest, message string) error {
	_, err := dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName:        aws.String(config.TableName),
		Key:              map[string]*dynamodb.AttributeValue{"id": {S: aws.String(req.ID)}},
		UpdateExpression: aws.String("SET #status = :status, processed_at = :processed_at, error_message = :error_message"),
		ExpressionAttributeNames: map[string]*string{
			"#status": aws.String("status"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":status":        {S: aws.String("failed")},
			":processed_at":  {S: aws.String(time.Now().UTC().Format(time.RFC3339))},
			":error_message": {S: aws.String(message)},
		},
	})
	return err
}

func envOrDefault(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func parseAllowedEmails(value, fallback string) map[string]struct{} {
	allowed := make(map[string]struct{})
	for _, candidate := range strings.Split(value, ",") {
		candidate = strings.ToLower(strings.TrimSpace(candidate))
		if candidate != "" {
			allowed[candidate] = struct{}{}
		}
	}
	fallback = strings.ToLower(strings.TrimSpace(fallback))
	if fallback != "" {
		allowed[fallback] = struct{}{}
	}
	return allowed
}

func generateID() string {
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
