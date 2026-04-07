package products

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
)

type Product struct {
	ID          string  `json:"id" dynamodbav:"id"`
	Name        string  `json:"name" dynamodbav:"name"`
	Description string  `json:"description" dynamodbav:"description"`
	Price       float64 `json:"price" dynamodbav:"price"`
	Category    string  `json:"category" dynamodbav:"category"`
	ImageURL    string  `json:"image_url" dynamodbav:"image_url"`
	Stock       int     `json:"stock" dynamodbav:"stock"`
	CreatedAt   string  `json:"created_at" dynamodbav:"created_at"`
}

type CreateProductRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Category    string  `json:"category"`
	ImageURL    string  `json:"image_url"`
	Stock       int     `json:"stock"`
}

type ProductResponse struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Category    string  `json:"category"`
	ImageURL    string  `json:"image_url"`
	Stock       int     `json:"stock"`
}

type ProductsListResponse struct {
	Products         []ProductResponse `json:"products"`
	LastEvaluatedKey string            `json:"last_evaluated_key,omitempty"`
}

var (
	dynamoClient *dynamodb.DynamoDB
	tableName    = "mundocolore-products"
)

const (
	lambdaName       = "products"
	healthKeyValue   = "health-check-products"
	healthTimeLayout = "2006-01-02 15:04:05"
)

func init() {
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("sa-east-1"),
	}))
	dynamoClient = dynamodb.New(sess)
}

func HandleCreateProduct(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req CreateProductRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	product, err := createProduct(req)
	if err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(product)
	return events.APIGatewayProxyResponse{
		StatusCode: 201,
		Body:       string(body),
	}, nil
}

func HandleGetProducts(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	category := request.QueryStringParameters["category"]
	limitStr := request.QueryStringParameters["limit"]
	limit := 10
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}
	lastKey := request.QueryStringParameters["last_key"]

	products, err := getProducts(category, limit, lastKey)
	if err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(products)
	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Body:       string(body),
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
		}, nil
	}

	item := map[string]*dynamodb.AttributeValue{
		"id":          {S: aws.String("health-products")},
		"name":        {S: aws.String("health-product")},
		"description": {S: aws.String("health record")},
		"price":       {N: aws.String("0")},
		"category":    {S: aws.String("health")},
		"image_url":   {S: aws.String("https://health.local/image")},
		"stock":       {N: aws.String("0")},
		"created_at":  {S: aws.String(now.Format(time.RFC3339))},
		"health_key":  {S: aws.String(healthKeyValue)},
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
	}, nil
}

func createProduct(req CreateProductRequest) (ProductResponse, error) {
	product := Product{
		ID:          generateID(),
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Category:    req.Category,
		ImageURL:    req.ImageURL,
		Stock:       req.Stock,
		CreatedAt:   time.Now().Format(time.RFC3339),
	}

	item, err := dynamodbattribute.MarshalMap(product)
	if err != nil {
		return ProductResponse{}, err
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	if err != nil {
		return ProductResponse{}, err
	}

	return ProductResponse{
		ID:          product.ID,
		Name:        product.Name,
		Description: product.Description,
		Price:       product.Price,
		Category:    product.Category,
		ImageURL:    product.ImageURL,
		Stock:       product.Stock,
	}, nil
}

func getProducts(category string, limit int, lastKey string) (ProductsListResponse, error) {
	input := &dynamodb.ScanInput{
		TableName: aws.String(tableName),
		Limit:     aws.Int64(int64(limit)),
	}

	if category != "" {
		input.FilterExpression = aws.String("category = :category")
		input.ExpressionAttributeValues = map[string]*dynamodb.AttributeValue{
			":category": {S: aws.String(category)},
		}
	}

	if lastKey != "" {
		input.ExclusiveStartKey = map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(lastKey)},
		}
	}

	result, err := dynamoClient.Scan(input)
	if err != nil {
		return ProductsListResponse{}, err
	}

	var products []ProductResponse
	for _, item := range result.Items {
		var prod Product
		if err := dynamodbattribute.UnmarshalMap(item, &prod); err != nil {
			continue
		}
		products = append(products, ProductResponse{
			ID:          prod.ID,
			Name:        prod.Name,
			Description: prod.Description,
			Price:       prod.Price,
			Category:    prod.Category,
			ImageURL:    prod.ImageURL,
			Stock:       prod.Stock,
		})
	}

	response := ProductsListResponse{Products: products}
	if result.LastEvaluatedKey != nil {
		if id, ok := result.LastEvaluatedKey["id"]; ok {
			response.LastEvaluatedKey = *id.S
		}
	}
	return response, nil
}

func generateID() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func badRequestResponse(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{StatusCode: 400, Body: fmt.Sprintf(`{"error": "%s"}`, message)}
}

func serverErrorResponse(err error) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{StatusCode: 500, Body: fmt.Sprintf(`{"error": "%s"}`, err.Error())}
}

func notFoundResponse() events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{StatusCode: 404, Body: `{"error": "not found"}`}
}
