package addresses

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/golang-jwt/jwt/v5"
)

type Address struct {
	ID           string `json:"id" dynamodbav:"id"`
	UserID       string `json:"user_id" dynamodbav:"user_id"`
	Observation  string `json:"observation" dynamodbav:"observation"`
	Complement   string `json:"complement" dynamodbav:"complement"`
	Number       string `json:"number" dynamodbav:"number"`
	Street       string `json:"street" dynamodbav:"street"`
	Neighborhood string `json:"neighborhood" dynamodbav:"neighborhood"`
	City         string `json:"city" dynamodbav:"city"`
	State        string `json:"state" dynamodbav:"state"`
	Country      string `json:"country" dynamodbav:"country"`
	ZipCode      string `json:"zip_code" dynamodbav:"zip_code"`
	IsDefault    bool   `json:"is_default" dynamodbav:"is_default"`
	CreatedAt    string `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt    string `json:"updated_at" dynamodbav:"updated_at"`
}

type CreateAddressRequest struct {
	Observation  string `json:"observation"`
	Complement   string `json:"complement"`
	Number       string `json:"number"`
	Street       string `json:"street"`
	Neighborhood string `json:"neighborhood"`
	City         string `json:"city"`
	State        string `json:"state"`
	Country      string `json:"country"`
	ZipCode      string `json:"zip_code"`
	IsDefault    bool   `json:"is_default"`
}

type UpdateAddressRequest struct {
	ID           string `json:"id"`
	Observation  string `json:"observation"`
	Complement   string `json:"complement"`
	Number       string `json:"number"`
	Street       string `json:"street"`
	Neighborhood string `json:"neighborhood"`
	City         string `json:"city"`
	State        string `json:"state"`
	Country      string `json:"country"`
	ZipCode      string `json:"zip_code"`
	IsDefault    bool   `json:"is_default"`
}

type DeleteAddressRequest struct {
	ID string `json:"id"`
}

type AddressResponse struct {
	ID           string `json:"id"`
	UserID       string `json:"user_id"`
	Observation  string `json:"observation"`
	Complement   string `json:"complement"`
	Number       string `json:"number"`
	Street       string `json:"street"`
	Neighborhood string `json:"neighborhood"`
	City         string `json:"city"`
	State        string `json:"state"`
	Country      string `json:"country"`
	ZipCode      string `json:"zip_code"`
	IsDefault    bool   `json:"is_default"`
}

type DeleteAddressResponse struct {
	Deleted bool   `json:"deleted"`
	ID      string `json:"id"`
}

var (
	dynamoClient *dynamodb.DynamoDB
	tableName    = "mundocolore-addresses"
	jwtSecret    = []byte("your-secret-key")
)

const (
	lambdaName       = "addresses"
	healthKeyValue   = "health-check-addresses"
	healthTimeLayout = "2006-01-02 15:04:05"
	maxAddresses     = 10
)

func init() {
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("sa-east-1"),
	}))
	dynamoClient = dynamodb.New(sess)
	if value := os.Getenv("TABLE_NAME"); value != "" {
		tableName = value
	}
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		jwtSecret = []byte(secret)
	}
}

func HandleCreateAddress(_ context.Context, request events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	var req CreateAddressRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	if err := validateAddressInput(req.Observation, req.Complement, req.Number, req.Street, req.Neighborhood, req.City, req.State, req.ZipCode); err != nil {
		return badRequestResponse(err.Error()), nil
	}

	addresses, err := getAddressEntities(userID)
	if err != nil {
		return serverErrorResponse(err), nil
	}
	if len(addresses) >= maxAddresses {
		return badRequestResponse("maximum of 10 addresses reached"), nil
	}

	now := time.Now().Format(time.RFC3339)
	isDefault := req.IsDefault
	if len(addresses) == 0 {
		isDefault = true
	}
	if !isDefault && !hasDefaultAddress(addresses) {
		isDefault = true
	}
	if isDefault {
		if err := unsetDefaultAddresses(addresses); err != nil {
			return serverErrorResponse(err), nil
		}
	}

	addr := Address{
		ID:           generateID(),
		UserID:       userID,
		Observation:  strings.TrimSpace(req.Observation),
		Complement:   strings.TrimSpace(req.Complement),
		Number:       strings.TrimSpace(req.Number),
		Street:       strings.TrimSpace(req.Street),
		Neighborhood: strings.TrimSpace(req.Neighborhood),
		City:         strings.TrimSpace(req.City),
		State:        strings.TrimSpace(req.State),
		Country:      "Brasil",
		ZipCode:      normalizeZipCode(req.ZipCode),
		IsDefault:    isDefault,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := saveAddress(addr); err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(toAddressResponse(addr))
	return successJSONResponse(201, string(body)), nil
}

func HandleUpdateAddress(_ context.Context, request events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	var req UpdateAddressRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}
	req.ID = strings.TrimSpace(req.ID)
	if req.ID == "" {
		return badRequestResponse("id is required"), nil
	}

	if err := validateAddressInput(req.Observation, req.Complement, req.Number, req.Street, req.Neighborhood, req.City, req.State, req.ZipCode); err != nil {
		return badRequestResponse(err.Error()), nil
	}

	addresses, err := getAddressEntities(userID)
	if err != nil {
		return serverErrorResponse(err), nil
	}
	if len(addresses) == 0 {
		return notFoundWithMessage("address not found"), nil
	}

	targetIndex := -1
	for i, address := range addresses {
		if address.ID == req.ID {
			targetIndex = i
			break
		}
	}
	if targetIndex == -1 {
		return notFoundWithMessage("address not found"), nil
	}

	current := addresses[targetIndex]
	current.Observation = strings.TrimSpace(req.Observation)
	current.Complement = strings.TrimSpace(req.Complement)
	current.Number = strings.TrimSpace(req.Number)
	current.Street = strings.TrimSpace(req.Street)
	current.Neighborhood = strings.TrimSpace(req.Neighborhood)
	current.City = strings.TrimSpace(req.City)
	current.State = strings.TrimSpace(req.State)
	current.Country = "Brasil"
	current.ZipCode = normalizeZipCode(req.ZipCode)
	current.UpdatedAt = time.Now().Format(time.RFC3339)

	if req.IsDefault {
		if err := unsetDefaultAddresses(addresses); err != nil {
			return serverErrorResponse(err), nil
		}
		current.IsDefault = true
	}

	if !current.IsDefault {
		hasAnotherDefault := false
		for i, address := range addresses {
			if i == targetIndex {
				continue
			}
			if address.IsDefault {
				hasAnotherDefault = true
				break
			}
		}
		if !hasAnotherDefault {
			current.IsDefault = true
		}
	}

	if err := saveAddress(current); err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(toAddressResponse(current))
	return successJSONResponse(200, string(body)), nil
}

func HandleDeleteAddress(_ context.Context, request events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	var req DeleteAddressRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}
	req.ID = strings.TrimSpace(req.ID)
	if req.ID == "" {
		return badRequestResponse("id is required"), nil
	}

	addresses, err := getAddressEntities(userID)
	if err != nil {
		return serverErrorResponse(err), nil
	}
	if len(addresses) == 0 {
		return notFoundWithMessage("address not found"), nil
	}

	targetIndex := -1
	for i, address := range addresses {
		if address.ID == req.ID {
			targetIndex = i
			break
		}
	}
	if targetIndex == -1 {
		return notFoundWithMessage("address not found"), nil
	}

	wasDefault := addresses[targetIndex].IsDefault
	if err := deleteAddressByIDAndUserID(req.ID, userID); err != nil {
		return serverErrorResponse(err), nil
	}

	if wasDefault && len(addresses) > 1 {
		for i, address := range addresses {
			if i == targetIndex {
				continue
			}
			address.IsDefault = true
			address.UpdatedAt = time.Now().Format(time.RFC3339)
			if err := saveAddress(address); err != nil {
				return serverErrorResponse(err), nil
			}
			break
		}
	}

	body, _ := json.Marshal(DeleteAddressResponse{
		Deleted: true,
		ID:      req.ID,
	})
	return successJSONResponse(200, string(body)), nil
}

func HandleGetAddresses(_ context.Context, _ events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	addresses, err := getAddressEntities(userID)
	if err != nil {
		return serverErrorResponse(err), nil
	}

	sort.SliceStable(addresses, func(i, j int) bool {
		if addresses[i].IsDefault == addresses[j].IsDefault {
			return addresses[i].CreatedAt < addresses[j].CreatedAt
		}
		return addresses[i].IsDefault && !addresses[j].IsDefault
	})

	response := make([]AddressResponse, 0, len(addresses))
	for _, address := range addresses {
		response = append(response, toAddressResponse(address))
	}

	body, _ := json.Marshal(response)
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
		"id":           {S: aws.String("health-addresses")},
		"user_id":      {S: aws.String("health-addresses")},
		"observation":  {S: aws.String("Health Address")},
		"complement":   {S: aws.String("health")},
		"number":       {S: aws.String("0")},
		"street":       {S: aws.String("Health Street")},
		"neighborhood": {S: aws.String("Health District")},
		"city":         {S: aws.String("Health City")},
		"state":        {S: aws.String("HC")},
		"country":      {S: aws.String("Brasil")},
		"zip_code":     {S: aws.String("00000-000")},
		"is_default":   {BOOL: aws.Bool(false)},
		"created_at":   {S: aws.String(now.Format(time.RFC3339))},
		"updated_at":   {S: aws.String(now.Format(time.RFC3339))},
		"health_key":   {S: aws.String(healthKeyValue)},
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
	}
	return "", fmt.Errorf("invalid token")
}

func saveAddress(address Address) error {
	item, err := dynamodbattribute.MarshalMap(address)
	if err != nil {
		return err
	}
	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	return err
}

func deleteAddressByIDAndUserID(addressID, userID string) error {
	_, err := dynamoClient.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id":      {S: aws.String(addressID)},
			"user_id": {S: aws.String(userID)},
		},
	})
	return err
}

func getAddressEntities(userID string) ([]Address, error) {
	result, err := dynamoClient.Scan(&dynamodb.ScanInput{
		TableName:        aws.String(tableName),
		FilterExpression: aws.String("user_id = :user_id"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":user_id": {S: aws.String(userID)},
		},
	})
	if err != nil {
		return nil, err
	}

	addresses := make([]Address, 0, len(result.Items))
	for _, item := range result.Items {
		var address Address
		if err := dynamodbattribute.UnmarshalMap(item, &address); err != nil {
			continue
		}
		addresses = append(addresses, address)
	}

	return addresses, nil
}

func unsetDefaultAddresses(addresses []Address) error {
	for _, address := range addresses {
		if !address.IsDefault {
			continue
		}
		address.IsDefault = false
		address.UpdatedAt = time.Now().Format(time.RFC3339)
		if err := saveAddress(address); err != nil {
			return err
		}
	}
	return nil
}

func hasDefaultAddress(addresses []Address) bool {
	for _, address := range addresses {
		if address.IsDefault {
			return true
		}
	}
	return false
}

func toAddressResponse(address Address) AddressResponse {
	return AddressResponse{
		ID:           address.ID,
		UserID:       address.UserID,
		Observation:  address.Observation,
		Complement:   address.Complement,
		Number:       address.Number,
		Street:       address.Street,
		Neighborhood: address.Neighborhood,
		City:         address.City,
		State:        address.State,
		Country:      address.Country,
		ZipCode:      address.ZipCode,
		IsDefault:    address.IsDefault,
	}
}

func validateAddressInput(observation, complement, number, street, neighborhood, city, state, zipCode string) error {
	if strings.TrimSpace(observation) == "" {
		return fmt.Errorf("observation is required")
	}
	if strings.TrimSpace(complement) == "" {
		return fmt.Errorf("complement is required")
	}
	if strings.TrimSpace(number) == "" {
		return fmt.Errorf("number is required")
	}
	if strings.TrimSpace(street) == "" {
		return fmt.Errorf("street is required")
	}
	if strings.TrimSpace(neighborhood) == "" {
		return fmt.Errorf("neighborhood is required")
	}
	if strings.TrimSpace(city) == "" {
		return fmt.Errorf("city is required")
	}
	if strings.TrimSpace(state) == "" {
		return fmt.Errorf("state is required")
	}
	if normalizeZipCode(zipCode) == "" {
		return fmt.Errorf("zip_code is required")
	}
	return nil
}

func normalizeZipCode(value string) string {
	return strings.TrimSpace(value)
}

func generateID() string {
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
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
