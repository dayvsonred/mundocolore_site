package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
)

const (
	mailjetEndpoint           = "https://api.mailjet.com/v3.1/send"
	maxMailjetAttachmentBytes = 10 * 1024 * 1024
	presignedURLLifetime      = 7 * 24 * time.Hour
)

var invalidKeyCharacters = regexp.MustCompile(`[^a-z0-9._+-]+`)

type config struct {
	BucketName       string
	RawPrefix        string
	DomainName       string
	ForwardTo        string
	ForwardFrom      string
	ForwardFromName  string
	MailjetAPIKey    string
	MailjetSecretKey string
}

type sesEvent struct {
	Records []struct {
		SES struct {
			Mail struct {
				Timestamp     string `json:"timestamp"`
				MessageID     string `json:"messageId"`
				Source        string `json:"source"`
				CommonHeaders struct {
					From    []string `json:"from"`
					To      []string `json:"to"`
					Subject string   `json:"subject"`
				} `json:"commonHeaders"`
			} `json:"mail"`
			Receipt struct {
				Recipients []string `json:"recipients"`
			} `json:"receipt"`
		} `json:"ses"`
	} `json:"Records"`
}

type mailjetRequest struct {
	Messages []mailjetMessage `json:"Messages"`
}

type mailjetMessage struct {
	From        mailjetContact      `json:"From"`
	To          []mailjetContact    `json:"To"`
	Subject     string              `json:"Subject"`
	TextPart    string              `json:"TextPart"`
	Attachments []mailjetAttachment `json:"Attachments,omitempty"`
}

type mailjetContact struct {
	Email string `json:"Email"`
	Name  string `json:"Name,omitempty"`
}

type mailjetAttachment struct {
	ContentType   string `json:"ContentType"`
	Filename      string `json:"Filename"`
	Base64Content string `json:"Base64Content"`
}

var (
	appConfig  config
	s3Client   *s3.S3
	httpClient = &http.Client{Timeout: 45 * time.Second}
)

func init() {
	appConfig = loadConfig()
	sess := session.Must(session.NewSession(&aws.Config{Region: aws.String(os.Getenv("AWS_REGION"))}))
	s3Client = s3.New(sess)
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event sesEvent) error {
	if err := validateConfig(); err != nil {
		return err
	}
	if len(event.Records) == 0 {
		return errors.New("SES event has no records")
	}

	for _, record := range event.Records {
		rawMessageID := strings.TrimSpace(record.SES.Mail.MessageID)
		messageID := sanitizeKeySegment(rawMessageID)
		if messageID == "" {
			return errors.New("SES event has no messageId")
		}

		rawEmail, err := getRawEmail(ctx, rawMessageID)
		if err != nil {
			return fmt.Errorf("get raw email %s: %w", messageID, err)
		}

		day := backendDay(record.SES.Mail.Timestamp)
		accounts := recipientAccounts(record.SES.Receipt.Recipients, appConfig.DomainName)
		if len(accounts) == 0 {
			accounts = []string{"desconhecido"}
		}

		savedKeys, err := saveMailboxCopies(ctx, rawEmail, accounts, day, messageID)
		if err != nil {
			return fmt.Errorf("save mailbox copies for %s: %w", messageID, err)
		}

		if err := forwardEmail(ctx, record.SES.Mail.Source, record.SES.Mail.CommonHeaders.Subject, record.SES.Receipt.Recipients, savedKeys, rawMessageID, messageID, rawEmail); err != nil {
			return fmt.Errorf("forward email %s: %w", messageID, err)
		}

		log.Printf("email %s archived for %d account(s) and forwarded", messageID, len(accounts))
	}

	return nil
}

func loadConfig() config {
	return config{
		BucketName:       strings.TrimSpace(os.Getenv("BUCKET_NAME")),
		RawPrefix:        strings.Trim(strings.TrimSpace(os.Getenv("RAW_PREFIX")), "/"),
		DomainName:       strings.ToLower(strings.TrimSpace(os.Getenv("DOMAIN_NAME"))),
		ForwardTo:        strings.ToLower(strings.TrimSpace(os.Getenv("FORWARD_TO"))),
		ForwardFrom:      strings.ToLower(strings.TrimSpace(os.Getenv("FORWARD_FROM"))),
		ForwardFromName:  strings.TrimSpace(os.Getenv("FORWARD_FROM_NAME")),
		MailjetAPIKey:    strings.TrimSpace(os.Getenv("MAILJET_API_KEY")),
		MailjetSecretKey: strings.TrimSpace(os.Getenv("MAILJET_SECRET_KEY")),
	}
}

func validateConfig() error {
	required := map[string]string{
		"BUCKET_NAME":        appConfig.BucketName,
		"RAW_PREFIX":         appConfig.RawPrefix,
		"DOMAIN_NAME":        appConfig.DomainName,
		"FORWARD_TO":         appConfig.ForwardTo,
		"FORWARD_FROM":       appConfig.ForwardFrom,
		"MAILJET_API_KEY":    appConfig.MailjetAPIKey,
		"MAILJET_SECRET_KEY": appConfig.MailjetSecretKey,
	}
	for name, value := range required {
		if value == "" {
			return fmt.Errorf("%s is not configured", name)
		}
	}
	return nil
}

func getRawEmail(ctx context.Context, messageID string) ([]byte, error) {
	key := appConfig.RawPrefix + "/" + messageID
	result, err := s3Client.GetObjectWithContext(ctx, &s3.GetObjectInput{
		Bucket: aws.String(appConfig.BucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}
	defer result.Body.Close()

	return io.ReadAll(result.Body)
}

func saveMailboxCopies(ctx context.Context, rawEmail []byte, accounts []string, day, messageID string) ([]string, error) {
	keys := make([]string, 0, len(accounts)*2)
	for _, account := range accounts {
		account = sanitizeKeySegment(account)
		if account == "" {
			account = "desconhecido"
		}

		accountKeys := []string{
			fmt.Sprintf("%s/%s/%s.eml", account, day, messageID),
			fmt.Sprintf("%s/CAIXA-ENTRDA/%s.eml", account, messageID),
		}
		for _, key := range accountKeys {
			_, err := s3Client.PutObjectWithContext(ctx, &s3.PutObjectInput{
				Bucket:      aws.String(appConfig.BucketName),
				Key:         aws.String(key),
				Body:        bytes.NewReader(rawEmail),
				ContentType: aws.String("message/rfc822"),
				Metadata: map[string]*string{
					"backend-day": aws.String(day),
					"message-id":  aws.String(messageID),
				},
			})
			if err != nil {
				return nil, err
			}
			keys = append(keys, key)
		}
	}
	return keys, nil
}

func forwardEmail(ctx context.Context, source, subject string, recipients, savedKeys []string, rawMessageID, messageID string, rawEmail []byte) error {
	if strings.TrimSpace(subject) == "" {
		subject = "Sem assunto"
	}

	attachmentMessage := "O email original esta anexado no formato .eml."
	attachments := []mailjetAttachment{{
		ContentType:   "message/rfc822",
		Filename:      messageID + ".eml",
		Base64Content: base64.StdEncoding.EncodeToString(rawEmail),
	}}
	if len(rawEmail) > maxMailjetAttachmentBytes {
		downloadURL, err := rawEmailDownloadURL(rawMessageID)
		if err != nil {
			return fmt.Errorf("create temporary S3 download URL: %w", err)
		}
		attachments = nil
		attachmentMessage = fmt.Sprintf("O email ultrapassa o limite de anexo e pode ser baixado por 7 dias em: %s", downloadURL)
	}

	textBody := fmt.Sprintf(
		"Email recebido por Mundo Colore Store.\n\nRemetente original: %s\nDestinatarios originais: %s\nArquivos no S3: %s\n\n%s",
		strings.TrimSpace(source),
		strings.Join(recipients, ", "),
		strings.Join(savedKeys, ", "),
		attachmentMessage,
	)
	payload := mailjetRequest{Messages: []mailjetMessage{{
		From:        mailjetContact{Email: appConfig.ForwardFrom, Name: appConfig.ForwardFromName},
		To:          []mailjetContact{{Email: appConfig.ForwardTo}},
		Subject:     "Encaminhado: " + subject,
		TextPart:    textBody,
		Attachments: attachments,
	}}}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, mailjetEndpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(appConfig.MailjetAPIKey, appConfig.MailjetSecretKey)

	response, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	responseBody, readErr := io.ReadAll(io.LimitReader(response.Body, 8192))
	if readErr != nil {
		return readErr
	}
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("Mailjet returned status %d: %s", response.StatusCode, strings.TrimSpace(string(responseBody)))
	}
	return nil
}

func rawEmailDownloadURL(rawMessageID string) (string, error) {
	request, _ := s3Client.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(appConfig.BucketName),
		Key:    aws.String(appConfig.RawPrefix + "/" + rawMessageID),
	})
	return request.Presign(presignedURLLifetime)
}

func recipientAccounts(recipients []string, domain string) []string {
	domain = strings.ToLower(strings.TrimSpace(domain))
	seen := make(map[string]struct{})
	for _, recipient := range recipients {
		parts := strings.Split(strings.ToLower(strings.TrimSpace(recipient)), "@")
		if len(parts) != 2 || parts[1] != domain {
			continue
		}
		account := sanitizeKeySegment(parts[0])
		if account != "" {
			seen[account] = struct{}{}
		}
	}

	accounts := make([]string, 0, len(seen))
	for account := range seen {
		accounts = append(accounts, account)
	}
	sort.Strings(accounts)
	return accounts
}

func backendDay(timestamp string) string {
	parsed, err := time.Parse(time.RFC3339Nano, strings.TrimSpace(timestamp))
	if err != nil {
		parsed = time.Now().UTC()
	}
	location := time.FixedZone("America/Sao_Paulo", -3*60*60)
	return parsed.In(location).Format("20060102")
}

func sanitizeKeySegment(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = invalidKeyCharacters.ReplaceAllString(value, "-")
	return strings.Trim(value, ".-+")
}
