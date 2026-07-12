package orders

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/sqs"
	"github.com/golang-jwt/jwt/v5"
)

type Order struct {
	ID               string                 `json:"id" dynamodbav:"id"`
	UserID           string                 `json:"user_id" dynamodbav:"user_id"`
	Items            []OrderItem            `json:"items" dynamodbav:"items"`
	Subtotal         float64                `json:"subtotal" dynamodbav:"subtotal"`
	ShippingAmount   float64                `json:"shipping_amount" dynamodbav:"shipping_amount"`
	DiscountAmount   float64                `json:"discount_amount" dynamodbav:"discount_amount"`
	CouponCode       string                 `json:"coupon_code,omitempty" dynamodbav:"coupon_code,omitempty"`
	Total            float64                `json:"total" dynamodbav:"total"`
	Currency         string                 `json:"currency" dynamodbav:"currency"`
	Status           string                 `json:"status" dynamodbav:"status"`
	StatusHistory    []OrderStatusHistory   `json:"status_history" dynamodbav:"status_history"`
	ApprovedAt       string                 `json:"approved_at,omitempty" dynamodbav:"approved_at,omitempty"`
	Billing          OrderPerson            `json:"billing" dynamodbav:"billing"`
	Customer         OrderPerson            `json:"customer" dynamodbav:"customer"`
	DeliveryAddress  OrderAddress           `json:"delivery_address" dynamodbav:"delivery_address"`
	Payment          OrderPayment           `json:"payment" dynamodbav:"payment"`
	CheckoutMetadata map[string]interface{} `json:"checkout_metadata,omitempty" dynamodbav:"checkout_metadata,omitempty"`
	PurchaseIP       string                 `json:"purchase_ip" dynamodbav:"purchase_ip"`
	UserAgent        string                 `json:"user_agent" dynamodbav:"user_agent"`
	CreatedAt        string                 `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt        string                 `json:"updated_at" dynamodbav:"updated_at"`
}

type OrderStatusHistory struct {
	Status    string `json:"status" dynamodbav:"status"`
	ChangedAt string `json:"changed_at" dynamodbav:"changed_at"`
	ChangedBy string `json:"changed_by" dynamodbav:"changed_by"`
}

type OrderItem struct {
	ProductID              string                 `json:"product_id" dynamodbav:"product_id"`
	ProductCode            string                 `json:"product_code,omitempty" dynamodbav:"product_code,omitempty"`
	ProductName            string                 `json:"product_name,omitempty" dynamodbav:"product_name,omitempty"`
	ProductImage           string                 `json:"product_image,omitempty" dynamodbav:"product_image,omitempty"`
	Brand                  string                 `json:"brand,omitempty" dynamodbav:"brand,omitempty"`
	Collection             string                 `json:"collection,omitempty" dynamodbav:"collection,omitempty"`
	Category               string                 `json:"category,omitempty" dynamodbav:"category,omitempty"`
	Type                   string                 `json:"type,omitempty" dynamodbav:"type,omitempty"`
	Size                   string                 `json:"size,omitempty" dynamodbav:"size,omitempty"`
	Color                  string                 `json:"color,omitempty" dynamodbav:"color,omitempty"`
	Quantity               int                    `json:"quantity" dynamodbav:"quantity"`
	Price                  float64                `json:"price" dynamodbav:"price"`
	UnitPrice              float64                `json:"unit_price" dynamodbav:"unit_price"`
	BaseUnitPrice          float64                `json:"base_unit_price" dynamodbav:"base_unit_price"`
	CouponReductionPercent float64                `json:"coupon_reduction_percent,omitempty" dynamodbav:"coupon_reduction_percent,omitempty"`
	DiscountAmount         float64                `json:"discount_amount,omitempty" dynamodbav:"discount_amount,omitempty"`
	Subtotal               float64                `json:"subtotal" dynamodbav:"subtotal"`
	ProductSnapshot        map[string]interface{} `json:"product_snapshot,omitempty" dynamodbav:"product_snapshot,omitempty"`
}

type OrderPerson struct {
	ID    string `json:"id,omitempty" dynamodbav:"id,omitempty"`
	Name  string `json:"name" dynamodbav:"name"`
	Email string `json:"email" dynamodbav:"email"`
	CPF   string `json:"cpf,omitempty" dynamodbav:"cpf,omitempty"`
	Phone string `json:"phone,omitempty" dynamodbav:"phone,omitempty"`
}

type OrderAddress struct {
	ID           string `json:"id,omitempty" dynamodbav:"id,omitempty"`
	Observation  string `json:"observation,omitempty" dynamodbav:"observation,omitempty"`
	Complement   string `json:"complement,omitempty" dynamodbav:"complement,omitempty"`
	Number       string `json:"number" dynamodbav:"number"`
	Street       string `json:"street" dynamodbav:"street"`
	Neighborhood string `json:"neighborhood" dynamodbav:"neighborhood"`
	City         string `json:"city" dynamodbav:"city"`
	State        string `json:"state" dynamodbav:"state"`
	Country      string `json:"country" dynamodbav:"country"`
	ZipCode      string `json:"zip_code" dynamodbav:"zip_code"`
	IsDefault    bool   `json:"is_default" dynamodbav:"is_default"`
}

type OrderPayment struct {
	Method       string  `json:"method" dynamodbav:"method"`
	Label        string  `json:"label" dynamodbav:"label"`
	Amount       float64 `json:"amount" dynamodbav:"amount"`
	Status       string  `json:"status" dynamodbav:"status"`
	Installments int     `json:"installments,omitempty" dynamodbav:"installments,omitempty"`
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status"`
}

type CreateOrderRequest struct {
	Items            []OrderItem            `json:"items"`
	Subtotal         float64                `json:"subtotal"`
	ShippingAmount   float64                `json:"shipping_amount"`
	DiscountAmount   float64                `json:"discount_amount"`
	CouponCode       string                 `json:"coupon_code"`
	Total            float64                `json:"total"`
	Currency         string                 `json:"currency"`
	Billing          OrderPerson            `json:"billing"`
	Customer         OrderPerson            `json:"customer"`
	DeliveryAddress  OrderAddress           `json:"delivery_address"`
	Payment          OrderPayment           `json:"payment"`
	CheckoutMetadata map[string]interface{} `json:"checkout_metadata"`
}

type OrderResponse Order

type ProductPricing struct {
	ID            string  `dynamodbav:"id"`
	EntityType    string  `dynamodbav:"entity_type"`
	ProductID     string  `dynamodbav:"product_id"`
	Name          string  `dynamodbav:"name"`
	Price         float64 `dynamodbav:"price"`
	CostPrice     float64 `dynamodbav:"cost_price"`
	SpreadPercent float64 `dynamodbav:"spread_percent"`
	CollectionKey string  `dynamodbav:"collection_key"`
}

type CollectionPricing struct {
	ID                           string             `dynamodbav:"id"`
	EntityType                   string             `dynamodbav:"entity_type"`
	CouponCode                   string             `dynamodbav:"coupon_code"`
	CouponSpreadReductionPercent float64            `dynamodbav:"coupon_spread_reduction_percent"`
	Coupons                      []CollectionCoupon `dynamodbav:"coupons,omitempty"`
	CreditColoreMaxAmount        float64            `dynamodbav:"credit_colore_max_amount"`
}

type Credit struct {
	UserID      string  `dynamodbav:"user_id"`
	CreditLimit float64 `dynamodbav:"credit_limit"`
	UsedCredit  float64 `dynamodbav:"used_credit"`
}

type UserRole struct {
	Active        bool   `dynamodbav:"active"`
	DeactivatedAt string `dynamodbav:"deactivated_at,omitempty"`
}

type CollectionCoupon struct {
	Code                   string  `dynamodbav:"code"`
	SpreadReductionPercent float64 `dynamodbav:"spread_reduction_percent"`
}

type CouponRequest struct {
	CouponCode string      `json:"coupon_code"`
	Items      []OrderItem `json:"items"`
}

type CouponResponse struct {
	CouponCode     string      `json:"coupon_code"`
	Items          []OrderItem `json:"items"`
	Subtotal       float64     `json:"subtotal"`
	DiscountAmount float64     `json:"discount_amount"`
	Total          float64     `json:"total"`
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
	dynamoClient      *dynamodb.DynamoDB
	sqsClient         *sqs.SQS
	tableName         = "mundocolore-orders"
	productsTableName = "mundocolore-products"
	creditTableName   = "mundocolore-credit"
	roleTableName     = "mundocolore-role"
	emailQueueURL     = ""
	jwtSecret         = []byte("your-secret-key")
)

const (
	lambdaName       = "orders"
	healthKeyValue   = "health-check-orders"
	healthTimeLayout = "2006-01-02 15:04:05"
	userCreatedIndex = "user-created-index"
)

func init() {
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("sa-east-1"),
	}))
	dynamoClient = dynamodb.New(sess)
	sqsClient = sqs.New(sess)
	if value := os.Getenv("TABLE_NAME"); value != "" {
		tableName = value
	}
	if value := os.Getenv("PRODUCTS_TABLE_NAME"); value != "" {
		productsTableName = value
	}
	if value := os.Getenv("CREDIT_TABLE_NAME"); value != "" {
		creditTableName = value
	}
	if value := os.Getenv("ROLE_TABLE_NAME"); value != "" {
		roleTableName = value
	}
	if secret := os.Getenv("JWT_SECRET"); secret != "" {
		jwtSecret = []byte(secret)
	}
	if value := os.Getenv("EMAIL_QUEUE_URL"); value != "" {
		emailQueueURL = value
	}
}

func HandleCreateOrder(_ context.Context, request events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	var req CreateOrderRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	order, err := createOrder(userID, req, request)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}

	body, _ := json.Marshal(order)
	return successJSONResponse(201, string(body)), nil
}

func HandleGetOrders(_ context.Context, _ events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	orders, err := getOrders(userID)
	if err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(orders)
	return successJSONResponse(200, string(body)), nil
}

func HandleGetAdminOrders(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	orders, err := getAdminOrders(request.QueryStringParameters)
	if err != nil {
		return serverErrorResponse(err), nil
	}
	body, _ := json.Marshal(map[string]interface{}{"orders": orders})
	return successJSONResponse(200, string(body)), nil
}

func HandleUpdateOrderStatus(_ context.Context, request events.APIGatewayProxyRequest, adminUserID string) (events.APIGatewayProxyResponse, error) {
	orderID := extractOrderIDFromAdminPath(request.Path)
	var req UpdateOrderStatusRequest
	if orderID == "" || json.Unmarshal([]byte(request.Body), &req) != nil {
		return badRequestResponse("invalid request"), nil
	}
	order, err := updateOrderStatus(orderID, req.Status, adminUserID)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}
	body, _ := json.Marshal(order)
	return successJSONResponse(200, string(body)), nil
}

func HandleValidateCoupon(_ context.Context, request events.APIGatewayProxyRequest, _ string) (events.APIGatewayProxyResponse, error) {
	var req CouponRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}
	items, subtotal, discount, err := priceItems(req.Items, req.CouponCode)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}
	body, _ := json.Marshal(CouponResponse{
		CouponCode:     normalizeCouponCode(req.CouponCode),
		Items:          items,
		Subtotal:       subtotal,
		DiscountAmount: discount,
		Total:          roundMoney(subtotal - discount),
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
		"id":              {S: aws.String("health-orders")},
		"user_id":         {S: aws.String("health-orders")},
		"items":           {L: []*dynamodb.AttributeValue{}},
		"subtotal":        {N: aws.String("0")},
		"shipping_amount": {N: aws.String("0")},
		"discount_amount": {N: aws.String("0")},
		"total":           {N: aws.String("0")},
		"currency":        {S: aws.String("BRL")},
		"status":          {S: aws.String("health")},
		"created_at":      {S: aws.String(now.Format(time.RFC3339))},
		"updated_at":      {S: aws.String(now.Format(time.RFC3339))},
		"purchase_ip":     {S: aws.String("health")},
		"user_agent":      {S: aws.String("health")},
		"health_key":      {S: aws.String(healthKeyValue)},
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
		if subject, ok := claims["sub"].(string); ok && subject != "" {
			return subject, nil
		}
	}
	return "", fmt.Errorf("invalid token")
}

func createOrder(userID string, req CreateOrderRequest, request events.APIGatewayProxyRequest) (OrderResponse, error) {
	if len(req.Items) == 0 {
		return OrderResponse{}, fmt.Errorf("items are required")
	}

	items, subtotal, discountAmount, err := priceItems(req.Items, req.CouponCode)
	if err != nil {
		return OrderResponse{}, err
	}

	if err := validateDeliveryAddress(req.DeliveryAddress); err != nil {
		return OrderResponse{}, err
	}
	if strings.TrimSpace(req.Payment.Method) == "" {
		return OrderResponse{}, fmt.Errorf("payment method is required")
	}

	shippingAmount := roundMoney(req.ShippingAmount)
	total := roundMoney(subtotal + shippingAmount - discountAmount)
	if req.Total > 0 && roundMoney(req.Total) != total {
		return OrderResponse{}, fmt.Errorf("order total does not match items")
	}
	if total <= 0 {
		return OrderResponse{}, fmt.Errorf("total must be greater than zero")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	currency := strings.TrimSpace(req.Currency)
	if currency == "" {
		currency = "BRL"
	}

	customer := sanitizePerson(req.Customer)
	if customer.ID == "" {
		customer.ID = userID
	}
	billing := sanitizePerson(req.Billing)
	if billing.ID == "" {
		billing.ID = customer.ID
	}
	if billing.Name == "" {
		billing.Name = customer.Name
	}
	if billing.Email == "" {
		billing.Email = customer.Email
	}

	payment := req.Payment
	payment.Label = strings.TrimSpace(payment.Label)
	payment.Method = strings.TrimSpace(payment.Method)
	payment.Amount = total
	if strings.TrimSpace(payment.Status) == "" {
		payment.Status = "pending"
	}
	status := "pending_payment"
	if payment.Method == "credit_colore" {
		if payment.Installments < 1 || payment.Installments > 5 {
			return OrderResponse{}, fmt.Errorf("credit colore installments must be between 1 and 5")
		}
		if err := validateCreditColoreCollections(items, total); err != nil {
			return OrderResponse{}, err
		}
		if err := reserveCredit(userID, total); err != nil {
			return OrderResponse{}, err
		}
		status = "pending_approval"
		payment.Status = "pending_approval"
	}

	order := Order{
		ID:               generateID(),
		UserID:           userID,
		Items:            items,
		Subtotal:         subtotal,
		ShippingAmount:   shippingAmount,
		DiscountAmount:   discountAmount,
		CouponCode:       normalizeCouponCode(req.CouponCode),
		Total:            total,
		Currency:         currency,
		Status:           status,
		StatusHistory:    []OrderStatusHistory{{Status: status, ChangedAt: now, ChangedBy: userID}},
		Billing:          billing,
		Customer:         customer,
		DeliveryAddress:  sanitizeAddress(req.DeliveryAddress),
		Payment:          payment,
		CheckoutMetadata: req.CheckoutMetadata,
		PurchaseIP:       sourceIP(request),
		UserAgent:        userAgent(request),
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	item, err := dynamodbattribute.MarshalMap(order)
	if err != nil {
		if payment.Method == "credit_colore" {
			_ = releaseCredit(userID, total)
		}
		return OrderResponse{}, err
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	if err != nil {
		return OrderResponse{}, err
	}
	if err := enqueueOrderEmail("notificacao-pedido-criado", order); err != nil {
		log.Printf("failed to enqueue order created email order=%s: %v", order.ID, err)
	}

	return OrderResponse(order), nil
}

func validateCreditColoreCollections(items []OrderItem, total float64) error {
	seen := map[string]struct{}{}
	for _, item := range items {
		product, err := getProductPricing(item.ProductID)
		if err != nil {
			return err
		}
		if _, exists := seen[product.CollectionKey]; exists {
			continue
		}
		seen[product.CollectionKey] = struct{}{}
		collection, err := getCollectionPricing(product.CollectionKey)
		if err != nil {
			return err
		}
		if collection.CreditColoreMaxAmount <= 0 {
			return fmt.Errorf("credit colore is not available for collection %s", product.CollectionKey)
		}
		if total > collection.CreditColoreMaxAmount {
			return fmt.Errorf("order exceeds credit colore limit for collection %s", product.CollectionKey)
		}
	}
	return nil
}

func reserveCredit(userID string, amount float64) error {
	credit, err := getCredit(userID)
	if err != nil {
		return err
	}
	newUsed := roundMoney(credit.UsedCredit + amount)
	if newUsed > credit.CreditLimit {
		return fmt.Errorf("insufficient credit colore balance")
	}
	_, err = dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName:           aws.String(creditTableName),
		Key:                 map[string]*dynamodb.AttributeValue{"user_id": {S: aws.String(userID)}},
		UpdateExpression:    aws.String("SET used_credit = :new_used, updated_at = :updated_at"),
		ConditionExpression: aws.String("used_credit = :old_used AND credit_limit >= :new_used"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":old_used":   {N: aws.String(fmt.Sprintf("%.2f", credit.UsedCredit))},
			":new_used":   {N: aws.String(fmt.Sprintf("%.2f", newUsed))},
			":updated_at": {S: aws.String(time.Now().UTC().Format(time.RFC3339))},
		},
	})
	if err != nil {
		return fmt.Errorf("credit colore balance changed or is insufficient")
	}
	return nil
}

func releaseCredit(userID string, amount float64) error {
	_, err := dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName:           aws.String(creditTableName),
		Key:                 map[string]*dynamodb.AttributeValue{"user_id": {S: aws.String(userID)}},
		UpdateExpression:    aws.String("SET used_credit = used_credit - :amount, updated_at = :updated_at"),
		ConditionExpression: aws.String("used_credit >= :amount"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":amount":     {N: aws.String(fmt.Sprintf("%.2f", roundMoney(amount)))},
			":updated_at": {S: aws.String(time.Now().UTC().Format(time.RFC3339))},
		},
	})
	return err
}

func getCredit(userID string) (Credit, error) {
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName:      aws.String(creditTableName),
		Key:            map[string]*dynamodb.AttributeValue{"user_id": {S: aws.String(userID)}},
		ConsistentRead: aws.Bool(true),
	})
	if err != nil {
		return Credit{}, err
	}
	if result.Item == nil {
		return Credit{}, fmt.Errorf("insufficient credit colore balance")
	}
	var credit Credit
	if err := dynamodbattribute.UnmarshalMap(result.Item, &credit); err != nil {
		return Credit{}, err
	}
	return credit, nil
}

func getAdminOrders(filters map[string]string) ([]OrderResponse, error) {
	items, err := scanAll(tableName)
	if err != nil {
		return nil, err
	}
	orders := make([]OrderResponse, 0, len(items))
	for _, item := range items {
		var order Order
		if dynamodbattribute.UnmarshalMap(item, &order) != nil || order.ID == "" || order.Status == "health" {
			continue
		}
		if !orderMatchesFilters(order, filters) {
			continue
		}
		orders = append(orders, OrderResponse(order))
	}
	sortOrders(orders, filters["sort"])
	return orders, nil
}

func orderMatchesFilters(order Order, filters map[string]string) bool {
	contains := func(value, query string) bool {
		return query == "" || strings.Contains(strings.ToLower(value), strings.ToLower(query))
	}
	if !contains(order.UserID+" "+order.Customer.Name+" "+order.Customer.Email+" "+order.Customer.CPF, filters["user"]) {
		return false
	}
	if filters["status"] != "" && order.Status != filters["status"] {
		return false
	}
	if filters["created_from"] != "" && order.CreatedAt < filters["created_from"] {
		return false
	}
	if filters["created_to"] != "" && order.CreatedAt > filters["created_to"]+"T23:59:59" {
		return false
	}
	if filters["min_value"] != "" {
		if value, _ := strconv.ParseFloat(filters["min_value"], 64); order.Total < value {
			return false
		}
	}
	if filters["max_value"] != "" {
		if value, _ := strconv.ParseFloat(filters["max_value"], 64); value > 0 && order.Total > value {
			return false
		}
	}
	for _, item := range order.Items {
		if contains(item.Brand, filters["brand"]) && contains(item.Collection, filters["collection"]) {
			return true
		}
	}
	return filters["brand"] == "" && filters["collection"] == ""
}

func sortOrders(orders []OrderResponse, sortValue string) {
	sort.Slice(orders, func(i, j int) bool {
		switch sortValue {
		case "value_asc":
			return orders[i].Total < orders[j].Total
		case "value_desc":
			return orders[i].Total > orders[j].Total
		case "date_asc":
			return orders[i].CreatedAt < orders[j].CreatedAt
		default:
			return orders[i].CreatedAt > orders[j].CreatedAt
		}
	})
}

func updateOrderStatus(orderID, status, adminUserID string) (OrderResponse, error) {
	allowed := map[string]bool{
		"approved": true, "packed": true, "shipped": true, "delivered": true, "finished": true, "cancelled": true,
	}
	status = strings.ToLower(strings.TrimSpace(status))
	if !allowed[status] {
		return OrderResponse{}, fmt.Errorf("invalid order status")
	}
	order, err := findOrderByID(orderID)
	if err != nil {
		return OrderResponse{}, err
	}
	if order.Status == "cancelled" && status != "cancelled" {
		return OrderResponse{}, fmt.Errorf("cancelled order cannot change status")
	}
	if status == "cancelled" && order.Status != "cancelled" && order.Payment.Method == "credit_colore" {
		if err := releaseCredit(order.UserID, order.Total); err != nil {
			return OrderResponse{}, err
		}
	}
	now := time.Now().UTC().Format(time.RFC3339)
	order.Status = status
	order.UpdatedAt = now
	order.StatusHistory = append(order.StatusHistory, OrderStatusHistory{Status: status, ChangedAt: now, ChangedBy: adminUserID})
	if status == "approved" {
		order.ApprovedAt = now
		order.Payment.Status = "approved"
	} else if status == "cancelled" {
		order.Payment.Status = "cancelled"
	}
	item, err := dynamodbattribute.MarshalMap(order)
	if err != nil {
		return OrderResponse{}, err
	}
	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{TableName: aws.String(tableName), Item: item})
	if err != nil && status == "cancelled" && order.Payment.Method == "credit_colore" {
		_ = reserveCredit(order.UserID, order.Total)
	}
	if err == nil {
		emailType := "notificacao-status-pedido"
		if status == "pending_approval" {
			emailType = "notificacao-pedido-em-analize"
		}
		if enqueueErr := enqueueOrderEmail(emailType, order); enqueueErr != nil {
			log.Printf("failed to enqueue order status email order=%s: %v", order.ID, enqueueErr)
		}
	}
	return OrderResponse(order), err
}

func findOrderByID(orderID string) (Order, error) {
	var startKey map[string]*dynamodb.AttributeValue
	for {
		result, err := dynamoClient.Scan(&dynamodb.ScanInput{
			TableName:                 aws.String(tableName),
			FilterExpression:          aws.String("id = :id"),
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{":id": {S: aws.String(orderID)}},
			ExclusiveStartKey:         startKey,
		})
		if err != nil {
			return Order{}, err
		}
		if len(result.Items) > 0 {
			var order Order
			err = dynamodbattribute.UnmarshalMap(result.Items[0], &order)
			return order, err
		}
		if len(result.LastEvaluatedKey) == 0 {
			return Order{}, fmt.Errorf("order not found")
		}
		startKey = result.LastEvaluatedKey
	}
}

func scanAll(table string) ([]map[string]*dynamodb.AttributeValue, error) {
	items := []map[string]*dynamodb.AttributeValue{}
	var startKey map[string]*dynamodb.AttributeValue
	for {
		result, err := dynamoClient.Scan(&dynamodb.ScanInput{TableName: aws.String(table), ExclusiveStartKey: startKey})
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

func isActiveAdmin(userID string) bool {
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName:      aws.String(roleTableName),
		Key:            map[string]*dynamodb.AttributeValue{"id": {S: aws.String(userID)}},
		ConsistentRead: aws.Bool(true),
	})
	if err != nil || result.Item == nil {
		return false
	}
	var role UserRole
	return dynamodbattribute.UnmarshalMap(result.Item, &role) == nil && role.Active && strings.TrimSpace(role.DeactivatedAt) == ""
}

func extractOrderIDFromAdminPath(path string) string {
	parts := strings.Split(path, "/orders/admin/")
	if len(parts) < 2 {
		return ""
	}
	return strings.Split(strings.Trim(parts[len(parts)-1], "/"), "/")[0]
}

func getOrders(userID string) ([]OrderResponse, error) {
	result, err := dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		IndexName:              aws.String(userCreatedIndex),
		KeyConditionExpression: aws.String("user_id = :user_id"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":user_id": {S: aws.String(userID)},
		},
		ScanIndexForward: aws.Bool(false),
	})
	if err != nil {
		return nil, err
	}

	orders := make([]OrderResponse, 0, len(result.Items))
	for _, item := range result.Items {
		var order Order
		if err := dynamodbattribute.UnmarshalMap(item, &order); err != nil {
			continue
		}
		orders = append(orders, OrderResponse(order))
	}
	return orders, nil
}

func priceItems(items []OrderItem, couponCode string) ([]OrderItem, float64, float64, error) {
	normalized := make([]OrderItem, 0, len(items))
	subtotal := 0.0
	discountAmount := 0.0
	couponCode = normalizeCouponCode(couponCode)
	couponApplied := false

	for _, item := range items {
		item.ProductID = strings.TrimSpace(item.ProductID)
		if item.ProductID == "" {
			return nil, 0, 0, fmt.Errorf("product_id is required")
		}
		if item.Quantity <= 0 {
			return nil, 0, 0, fmt.Errorf("quantity must be greater than zero")
		}
		product, err := getProductPricing(item.ProductID)
		if err != nil {
			return nil, 0, 0, err
		}
		if product.Price <= 0 {
			return nil, 0, 0, fmt.Errorf("product price must be greater than zero")
		}

		item.BaseUnitPrice = roundMoney(product.Price)
		item.Price = item.BaseUnitPrice
		item.UnitPrice = item.Price
		if couponCode != "" {
			collection, err := getCollectionPricing(product.CollectionKey)
			if err != nil {
				return nil, 0, 0, err
			}
			couponReductionPercent := findCouponReduction(collection, couponCode)
			if couponReductionPercent > 0 {
				reducedSpread := product.SpreadPercent - couponReductionPercent
				if reducedSpread < 0 {
					reducedSpread = 0
				}
				costPrice := product.CostPrice
				if costPrice <= 0 {
					costPrice = product.Price / (1 + product.SpreadPercent/100)
				}
				item.UnitPrice = calculateSpreadPrice(costPrice, reducedSpread)
				item.Price = item.UnitPrice
				item.CouponReductionPercent = couponReductionPercent
				couponApplied = true
			}
		}
		item.Subtotal = roundMoney(item.UnitPrice * float64(item.Quantity))
		item.DiscountAmount = roundMoney((item.BaseUnitPrice - item.UnitPrice) * float64(item.Quantity))
		subtotal += roundMoney(item.BaseUnitPrice * float64(item.Quantity))
		discountAmount += item.DiscountAmount
		normalized = append(normalized, sanitizeItem(item))
	}

	if couponCode != "" && !couponApplied {
		return nil, 0, 0, fmt.Errorf("coupon is invalid for these products")
	}
	return normalized, roundMoney(subtotal), roundMoney(discountAmount), nil
}

func getProductPricing(id string) (ProductPricing, error) {
	product, found, err := getPricingEntity(productsTableName, id, ProductPricing{})
	if err != nil {
		return ProductPricing{}, err
	}
	if !found && !strings.HasPrefix(id, "PRODUCT#") {
		product, found, err = getPricingEntity(productsTableName, "PRODUCT#"+id, ProductPricing{})
	}
	if err != nil {
		return ProductPricing{}, err
	}
	if !found || product.EntityType != "product" {
		return ProductPricing{}, fmt.Errorf("product not found")
	}
	return product, nil
}

func getCollectionPricing(collectionKey string) (CollectionPricing, error) {
	collection, found, err := getPricingEntity(productsTableName, "COLLECTION#"+collectionKey, CollectionPricing{})
	if err != nil {
		return CollectionPricing{}, err
	}
	if !found || collection.EntityType != "collection" {
		return CollectionPricing{}, fmt.Errorf("collection not found")
	}
	return collection, nil
}

func getPricingEntity[T any](table string, id string, empty T) (T, bool, error) {
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(table),
		Key:       map[string]*dynamodb.AttributeValue{"id": {S: aws.String(id)}},
	})
	if err != nil {
		return empty, false, err
	}
	if result.Item == nil {
		return empty, false, nil
	}
	if err := dynamodbattribute.UnmarshalMap(result.Item, &empty); err != nil {
		return empty, false, err
	}
	return empty, true, nil
}

func sanitizeItem(item OrderItem) OrderItem {
	item.ProductCode = strings.TrimSpace(item.ProductCode)
	item.ProductName = strings.TrimSpace(item.ProductName)
	item.ProductImage = strings.TrimSpace(item.ProductImage)
	item.Brand = strings.TrimSpace(item.Brand)
	item.Collection = strings.TrimSpace(item.Collection)
	item.Category = strings.TrimSpace(item.Category)
	item.Type = strings.TrimSpace(item.Type)
	item.Size = strings.TrimSpace(item.Size)
	item.Color = strings.TrimSpace(item.Color)
	return item
}

func sanitizePerson(person OrderPerson) OrderPerson {
	return OrderPerson{
		ID:    strings.TrimSpace(person.ID),
		Name:  strings.TrimSpace(person.Name),
		Email: strings.TrimSpace(person.Email),
		CPF:   onlyDigits(person.CPF),
		Phone: strings.TrimSpace(person.Phone),
	}
}

func sanitizeAddress(address OrderAddress) OrderAddress {
	address.ID = strings.TrimSpace(address.ID)
	address.Observation = strings.TrimSpace(address.Observation)
	address.Complement = strings.TrimSpace(address.Complement)
	address.Number = strings.TrimSpace(address.Number)
	address.Street = strings.TrimSpace(address.Street)
	address.Neighborhood = strings.TrimSpace(address.Neighborhood)
	address.City = strings.TrimSpace(address.City)
	address.State = strings.TrimSpace(address.State)
	address.Country = strings.TrimSpace(address.Country)
	address.ZipCode = strings.TrimSpace(address.ZipCode)
	if address.Country == "" {
		address.Country = "Brasil"
	}
	return address
}

func validateDeliveryAddress(address OrderAddress) error {
	address = sanitizeAddress(address)
	if address.Street == "" {
		return fmt.Errorf("delivery address street is required")
	}
	if address.Number == "" {
		return fmt.Errorf("delivery address number is required")
	}
	if address.Neighborhood == "" {
		return fmt.Errorf("delivery address neighborhood is required")
	}
	if address.City == "" {
		return fmt.Errorf("delivery address city is required")
	}
	if address.State == "" {
		return fmt.Errorf("delivery address state is required")
	}
	if address.ZipCode == "" {
		return fmt.Errorf("delivery address zip_code is required")
	}
	return nil
}

func sourceIP(request events.APIGatewayProxyRequest) string {
	if ip := strings.TrimSpace(request.RequestContext.Identity.SourceIP); ip != "" {
		return ip
	}
	for key, value := range request.Headers {
		if strings.EqualFold(key, "X-Forwarded-For") {
			parts := strings.Split(value, ",")
			return strings.TrimSpace(parts[0])
		}
	}
	return ""
}

func userAgent(request events.APIGatewayProxyRequest) string {
	if agent := strings.TrimSpace(request.RequestContext.Identity.UserAgent); agent != "" {
		return agent
	}
	for key, value := range request.Headers {
		if strings.EqualFold(key, "User-Agent") {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func onlyDigits(value string) string {
	var builder strings.Builder
	for _, r := range value {
		if r >= '0' && r <= '9' {
			builder.WriteRune(r)
		}
	}
	return builder.String()
}

func roundMoney(value float64) float64 {
	return float64(int(value*100+0.5)) / 100
}

func calculateSpreadPrice(costPrice float64, spreadPercent float64) float64 {
	return roundMoney(costPrice * (1 + spreadPercent/100))
}

func normalizeCouponCode(value string) string {
	return strings.ToUpper(strings.TrimSpace(value))
}

func enqueueOrderEmail(emailType string, order Order) error {
	if strings.TrimSpace(emailQueueURL) == "" || strings.TrimSpace(order.Customer.Email) == "" {
		return nil
	}

	emailID := generateID()
	payload := EmailQueuePayload{
		ID:      emailID,
		UUID:    emailID,
		Type:    emailType,
		ToEmail: order.Customer.Email,
		ToName:  order.Customer.Name,
		Data: map[string]string{
			"nome_do_cliente":  order.Customer.Name,
			"numero_do_pedido": order.ID,
			"valor_do_pedido":  formatBRL(order.Total),
			"status_do_pedido": order.Status,
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

func formatBRL(value float64) string {
	return fmt.Sprintf("R$ %.2f", roundMoney(value))
}

func findCouponReduction(collection CollectionPricing, couponCode string) float64 {
	couponCode = normalizeCouponCode(couponCode)
	for _, coupon := range collection.Coupons {
		if normalizeCouponCode(coupon.Code) == couponCode && coupon.SpreadReductionPercent > 0 {
			return coupon.SpreadReductionPercent
		}
	}
	if normalizeCouponCode(collection.CouponCode) == couponCode && collection.CouponSpreadReductionPercent > 0 {
		return collection.CouponSpreadReductionPercent
	}
	return 0
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

func defaultHeaders() map[string]string {
	return map[string]string{
		"Content-Type":                 "application/json",
		"Access-Control-Allow-Origin":  "*",
		"Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token",
		"Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
	}
}
