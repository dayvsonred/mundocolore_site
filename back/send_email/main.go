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
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

const mailjetEndpoint = "https://api.mailjet.com/v3.1/send"

type Config struct {
	MailjetAPIKey    string
	MailjetSecretKey string
	EmailFrom        string
	EmailFromName    string
	TableName        string
}

type EmailRequest struct {
	ID      string            `json:"id,omitempty" dynamodbav:"id"`
	UUID    string            `json:"uuid,omitempty" dynamodbav:"uuid,omitempty"`
	Type    string            `json:"type" dynamodbav:"type"`
	ToEmail string            `json:"to_email" dynamodbav:"to_email"`
	ToName  string            `json:"to_name,omitempty" dynamodbav:"to_name,omitempty"`
	Data    map[string]string `json:"data,omitempty" dynamodbav:"data,omitempty"`
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

type EmailLog struct {
	ID                 string                 `dynamodbav:"id"`
	UUID               string                 `dynamodbav:"uuid,omitempty"`
	Type               string                 `dynamodbav:"type"`
	ToEmail            string                 `dynamodbav:"to_email"`
	ToName             string                 `dynamodbav:"to_name,omitempty"`
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
	dynamoClient *dynamodb.DynamoDB
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

func handler(ctx context.Context, raw json.RawMessage) error {
	if len(bytes.TrimSpace(raw)) == 0 {
		return errors.New("empty event")
	}

	var event SQSEvent
	if err := json.Unmarshal(raw, &event); err == nil && len(event.Records) > 0 {
		for _, record := range event.Records {
			if err := processRawEmail(ctx, json.RawMessage(record.Body)); err != nil {
				log.Printf("failed to process sqs message %s: %v", record.MessageID, err)
				return err
			}
		}
		return nil
	}

	return processRawEmail(ctx, raw)
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

	template, ok := templates[req.Type]
	if !ok {
		_ = saveFailedEmail(req, fmt.Sprintf("template not found: %s", req.Type))
		return fmt.Errorf("template not found: %s", req.Type)
	}

	variables := buildVariables(req)
	subject := renderTemplate(template.Subject, variables)
	body := renderTemplate(template.Body, variables)

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
				From:     MailjetContact{Email: config.EmailFrom, Name: config.EmailFromName},
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
		MailjetAPIKey:    strings.TrimSpace(os.Getenv("MAILJET_API_KEY")),
		MailjetSecretKey: strings.TrimSpace(os.Getenv("MAILJET_SECRET_KEY")),
		EmailFrom:        strings.TrimSpace(os.Getenv("EMAIL_FROM")),
		EmailFromName:    strings.TrimSpace(os.Getenv("EMAIL_FROM_NAME")),
		TableName:        envOrDefault("TABLE_NAME", "mundocolore-emails"),
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

func generateID() string {
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
