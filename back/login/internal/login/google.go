package login

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"google.golang.org/api/idtoken"
)

const (
	googleSubIndex       = "google-sub-index"
	defaultTermsVersion  = "2026-07-26"
	googleProvider       = "google"
	googleClientIDEnvKey = "GOOGLE_CLIENT_ID"
)

type GoogleLoginRequest struct {
	Credential    string `json:"credential"`
	TermsAccepted bool   `json:"terms_accepted"`
	TermsVersion  string `json:"terms_version"`
}

func HandleGoogleLogin(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req GoogleLoginRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	credential := strings.TrimSpace(req.Credential)
	if credential == "" {
		return badRequestResponse("google credential is required"), nil
	}
	if strings.TrimSpace(googleClientID) == "" {
		return serverMessageResponse("google login is not configured"), nil
	}

	payload, err := idtoken.Validate(ctx, credential, googleClientID)
	if err != nil {
		return unauthorizedResponse("invalid google credential"), nil
	}

	googleSub := strings.TrimSpace(payload.Subject)
	email := strings.ToLower(strings.TrimSpace(claimString(payload.Claims, "email")))
	name := strings.TrimSpace(claimString(payload.Claims, "name"))
	pictureURL := strings.TrimSpace(claimString(payload.Claims, "picture"))
	emailVerified := claimBool(payload.Claims, "email_verified")
	hostedDomain := strings.ToLower(strings.TrimSpace(claimString(payload.Claims, "hd")))

	if googleSub == "" || email == "" {
		return unauthorizedResponse("google account did not provide the required identity"), nil
	}
	if !emailVerified {
		return unauthorizedResponse("google account email is not verified"), nil
	}

	user, err := findUserByGoogleSub(googleSub)
	if err != nil {
		if !isNotFoundError(err) {
			return serverErrorResponse(err), nil
		}

		user, err = findUserByEmail(email)
		switch {
		case err == nil:
			if user.GoogleSub != "" && user.GoogleSub != googleSub {
				return conflictResponse("this email is already linked to another google account"), nil
			}
			if !isGoogleAuthoritative(email, hostedDomain) && strings.TrimSpace(user.Password) != "" {
				return conflictResponse("entre com sua senha e vincule a conta google em minha conta"), nil
			}
			user, err = linkGoogleIdentity(user, googleSub, pictureURL, req)
			if err != nil {
				return serverErrorResponse(err), nil
			}
		case isNotFoundError(err):
			if !req.TermsAccepted {
				return preconditionResponse("aceite os termos da plataforma para criar sua conta com google"), nil
			}
			user, err = createGoogleUser(email, name, googleSub, pictureURL, req)
			if err != nil {
				return serverErrorResponse(err), nil
			}
		default:
			return serverErrorResponse(err), nil
		}
	}

	token, err := generateJWT(user)
	if err != nil {
		return serverErrorResponse(err), nil
	}

	response := newLoginResponse(user, token)
	body, _ := json.Marshal(response)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(body),
		Headers:    defaultHeaders(),
	}, nil
}

func findUserByGoogleSub(googleSub string) (User, error) {
	result, err := dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		IndexName:              aws.String(googleSubIndex),
		KeyConditionExpression: aws.String("google_sub = :google_sub"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":google_sub": {S: aws.String(googleSub)},
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

	// Mantem o endpoint funcional durante a primeira implantacao, antes do GSI
	// terminar de ficar ACTIVE.
	scanResult, scanErr := dynamoClient.Scan(&dynamodb.ScanInput{
		TableName:        aws.String(tableName),
		FilterExpression: aws.String("google_sub = :google_sub"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":google_sub": {S: aws.String(googleSub)},
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

func createGoogleUser(email, name, googleSub, pictureURL string, req GoogleLoginRequest) (User, error) {
	now := time.Now().UTC()
	termsVersion := strings.TrimSpace(req.TermsVersion)
	if termsVersion == "" {
		termsVersion = defaultTermsVersion
	}
	if name == "" {
		name = strings.Split(email, "@")[0]
	}

	user := User{
		ID:               generateUserID(),
		Email:            email,
		Name:             name,
		CreatedAt:        now.Format(time.RFC3339),
		EmailConfirmed:   true,
		EmailConfirmedAt: now.Format(time.RFC3339),
		GoogleSub:        googleSub,
		AuthProvider:     googleProvider,
		PictureURL:       pictureURL,
		TermsAcceptedAt:  now.Format(time.RFC3339),
		TermsVersion:     termsVersion,
	}

	item, err := dynamodbattribute.MarshalMap(user)
	if err != nil {
		return User{}, err
	}
	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName:           aws.String(tableName),
		Item:                item,
		ConditionExpression: aws.String("attribute_not_exists(id)"),
	})
	if err != nil {
		return User{}, err
	}
	return user, nil
}

func linkGoogleIdentity(user User, googleSub, pictureURL string, req GoogleLoginRequest) (User, error) {
	now := time.Now().UTC().Format(time.RFC3339)
	termsVersion := strings.TrimSpace(req.TermsVersion)
	if termsVersion == "" {
		termsVersion = defaultTermsVersion
	}

	updateExpression := "SET google_sub = :google_sub, picture_url = :picture_url"
	values := map[string]*dynamodb.AttributeValue{
		":google_sub":  {S: aws.String(googleSub)},
		":picture_url": {S: aws.String(pictureURL)},
	}
	if strings.TrimSpace(user.AuthProvider) == "" {
		updateExpression += ", auth_provider = :auth_provider"
		values[":auth_provider"] = &dynamodb.AttributeValue{S: aws.String("password")}
	}
	if req.TermsAccepted && strings.TrimSpace(user.TermsAcceptedAt) == "" {
		updateExpression += ", terms_accepted_at = :terms_accepted_at, terms_version = :terms_version"
		values[":terms_accepted_at"] = &dynamodb.AttributeValue{S: aws.String(now)}
		values[":terms_version"] = &dynamodb.AttributeValue{S: aws.String(termsVersion)}
	}

	result, err := dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(user.ID)},
		},
		UpdateExpression:          aws.String(updateExpression),
		ExpressionAttributeValues: values,
		ReturnValues:              aws.String(dynamodb.ReturnValueAllNew),
	})
	if err != nil {
		return User{}, err
	}
	if err := dynamodbattribute.UnmarshalMap(result.Attributes, &user); err != nil {
		return User{}, err
	}
	return user, nil
}

func isGoogleAuthoritative(email, hostedDomain string) bool {
	return strings.HasSuffix(strings.ToLower(email), "@gmail.com") || strings.TrimSpace(hostedDomain) != ""
}

func claimString(claims map[string]interface{}, key string) string {
	value, ok := claims[key]
	if !ok {
		return ""
	}
	text, _ := value.(string)
	return text
}

func claimBool(claims map[string]interface{}, key string) bool {
	value, ok := claims[key]
	if !ok {
		return false
	}
	flag, ok := value.(bool)
	return ok && flag
}

func isNotFoundError(err error) bool {
	return err != nil && strings.Contains(strings.ToLower(err.Error()), "not found")
}

func generateUserID() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(bytes)
}

func conflictResponse(message string) events.APIGatewayProxyResponse {
	return messageResponse(409, message)
}

func preconditionResponse(message string) events.APIGatewayProxyResponse {
	return messageResponse(428, message)
}

func serverMessageResponse(message string) events.APIGatewayProxyResponse {
	return messageResponse(500, message)
}

func messageResponse(status int, message string) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(map[string]string{"error": message})
	return events.APIGatewayProxyResponse{
		StatusCode: status,
		Body:       string(body),
		Headers:    defaultHeaders(),
	}
}
