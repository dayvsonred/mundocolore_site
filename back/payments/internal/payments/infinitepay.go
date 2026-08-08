package payments

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/sqs"
)

type infinitePayOrder struct {
	ID              string                     `dynamodbav:"id"`
	UserID          string                     `dynamodbav:"user_id"`
	Items           []infinitePayOrderItem     `dynamodbav:"items"`
	ShippingAmount  float64                    `dynamodbav:"shipping_amount"`
	Total           float64                    `dynamodbav:"total"`
	Status          string                     `dynamodbav:"status"`
	CouponCode      string                     `dynamodbav:"coupon_code"`
	Customer        infinitePayCustomer        `dynamodbav:"customer"`
	DeliveryAddress infinitePayDeliveryAddress `dynamodbav:"delivery_address"`
	Payment         infinitePayOrderPayment    `dynamodbav:"payment"`
	StatusHistory   []infinitePayStatusHistory `dynamodbav:"status_history"`
}

type infinitePayOrderItem struct {
	ProductID   string  `dynamodbav:"product_id"`
	ProductCode string  `dynamodbav:"product_code"`
	ProductName string  `dynamodbav:"product_name"`
	Size        string  `dynamodbav:"size"`
	Color       string  `dynamodbav:"color"`
	Quantity    int     `dynamodbav:"quantity"`
	Price       float64 `dynamodbav:"price"`
	UnitPrice   float64 `dynamodbav:"unit_price"`
}

type infinitePayCustomer struct {
	Name  string `dynamodbav:"name"`
	Email string `dynamodbav:"email"`
	Phone string `dynamodbav:"phone"`
}

type infinitePayDeliveryAddress struct {
	ZipCode      string `dynamodbav:"zip_code"`
	Street       string `dynamodbav:"street"`
	Neighborhood string `dynamodbav:"neighborhood"`
	Number       string `dynamodbav:"number"`
	Complement   string `dynamodbav:"complement"`
}

type infinitePayOrderPayment struct {
	Method         string  `json:"method" dynamodbav:"method"`
	Label          string  `json:"label" dynamodbav:"label"`
	Amount         float64 `json:"amount" dynamodbav:"amount"`
	Status         string  `json:"status" dynamodbav:"status"`
	Installments   int     `json:"installments,omitempty" dynamodbav:"installments,omitempty"`
	Provider       string  `json:"provider,omitempty" dynamodbav:"provider,omitempty"`
	OrderNSU       string  `json:"order_nsu,omitempty" dynamodbav:"order_nsu,omitempty"`
	InvoiceSlug    string  `json:"invoice_slug,omitempty" dynamodbav:"invoice_slug,omitempty"`
	TransactionNSU string  `json:"transaction_nsu,omitempty" dynamodbav:"transaction_nsu,omitempty"`
	ReceiptURL     string  `json:"receipt_url,omitempty" dynamodbav:"receipt_url,omitempty"`
	CheckoutURL    string  `json:"checkout_url,omitempty" dynamodbav:"checkout_url,omitempty"`
	PaidAmount     float64 `json:"paid_amount,omitempty" dynamodbav:"paid_amount,omitempty"`
	ActualMethod   string  `json:"actual_method,omitempty" dynamodbav:"actual_method,omitempty"`
}

type infinitePayStatusHistory struct {
	Status    string `json:"status" dynamodbav:"status"`
	ChangedAt string `json:"changed_at" dynamodbav:"changed_at"`
	ChangedBy string `json:"changed_by" dynamodbav:"changed_by"`
}

type createInfinitePayCheckoutRequest struct {
	OrderID string `json:"order_id"`
}

type infinitePayLinkItem struct {
	Quantity    int    `json:"quantity"`
	Price       int64  `json:"price"`
	Description string `json:"description"`
}

type infinitePayLinkCustomer struct {
	Name        string `json:"name"`
	Email       string `json:"email"`
	PhoneNumber string `json:"phone_number,omitempty"`
}

type infinitePayLinkAddress struct {
	CEP          string `json:"cep"`
	Street       string `json:"street"`
	Neighborhood string `json:"neighborhood"`
	Number       string `json:"number"`
	Complement   string `json:"complement,omitempty"`
}

type infinitePayLinkRequest struct {
	Handle      string                  `json:"handle"`
	Items       []infinitePayLinkItem   `json:"items"`
	OrderNSU    string                  `json:"order_nsu"`
	RedirectURL string                  `json:"redirect_url"`
	WebhookURL  string                  `json:"webhook_url"`
	Customer    infinitePayLinkCustomer `json:"customer"`
	Address     infinitePayLinkAddress  `json:"address"`
}

type infinitePayLinkResponse struct {
	URL string `json:"url"`
}

type infinitePayConfirmationRequest struct {
	OrderNSU       string `json:"order_nsu"`
	TransactionNSU string `json:"transaction_nsu"`
	Slug           string `json:"slug"`
	ReceiptURL     string `json:"receipt_url"`
}

type infinitePayWebhookRequest struct {
	InvoiceSlug    string                `json:"invoice_slug"`
	Amount         int64                 `json:"amount"`
	PaidAmount     int64                 `json:"paid_amount"`
	Installments   int                   `json:"installments"`
	CaptureMethod  string                `json:"capture_method"`
	TransactionNSU string                `json:"transaction_nsu"`
	OrderNSU       string                `json:"order_nsu"`
	ReceiptURL     string                `json:"receipt_url"`
	Items          []infinitePayLinkItem `json:"items"`
}

type infinitePayCheckRequest struct {
	Handle         string `json:"handle"`
	OrderNSU       string `json:"order_nsu"`
	TransactionNSU string `json:"transaction_nsu"`
	Slug           string `json:"slug"`
}

type infinitePayCheckResponse struct {
	Success       bool   `json:"success"`
	Paid          bool   `json:"paid"`
	Amount        int64  `json:"amount"`
	PaidAmount    int64  `json:"paid_amount"`
	Installments  int    `json:"installments"`
	CaptureMethod string `json:"capture_method"`
}

type infinitePayEmailPayload struct {
	ID      string            `json:"id"`
	UUID    string            `json:"uuid"`
	Type    string            `json:"type"`
	ToEmail string            `json:"to_email"`
	ToName  string            `json:"to_name,omitempty"`
	Data    map[string]string `json:"data"`
}

var infinitePayHTTPClient = &http.Client{Timeout: 8 * time.Second}

func HandleCreateInfinitePayCheckout(ctx context.Context, request events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	var req createInfinitePayCheckoutRequest
	if json.Unmarshal([]byte(request.Body), &req) != nil || strings.TrimSpace(req.OrderID) == "" {
		return jsonResponse(400, map[string]interface{}{"error": "order_id is required"}), nil
	}
	if infinitePayHandle == "" {
		return jsonResponse(503, map[string]interface{}{"error": "InfinitePay is not configured"}), nil
	}

	order, err := findInfinitePayOrder(strings.TrimSpace(req.OrderID))
	if err != nil {
		return jsonResponse(404, map[string]interface{}{"error": err.Error()}), nil
	}
	if order.UserID != userID {
		return jsonResponse(403, map[string]interface{}{"error": "order does not belong to user"}), nil
	}
	if order.Status != "pending_payment" {
		return jsonResponse(400, map[string]interface{}{"error": "order is not awaiting payment"}), nil
	}
	if order.Payment.Method != "pix" && order.Payment.Method != "credit_card" {
		return jsonResponse(400, map[string]interface{}{"error": "order is not payable with InfinitePay"}), nil
	}

	if existing, found, findErr := findReusablePayment(order.ID, userID); findErr == nil && found {
		return jsonResponse(200, checkoutResponse(existing)), nil
	}

	payment, err := createInfinitePayCheckout(ctx, order)
	if err != nil {
		return jsonResponse(502, map[string]interface{}{"error": err.Error()}), nil
	}
	return jsonResponse(201, checkoutResponse(payment)), nil
}

func HandleInfinitePayWebhook(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var webhook infinitePayWebhookRequest
	if json.Unmarshal([]byte(request.Body), &webhook) != nil {
		return infinitePayWebhookResponse(400, false, "Payload invalido"), nil
	}
	if strings.TrimSpace(webhook.OrderNSU) == "" || strings.TrimSpace(webhook.TransactionNSU) == "" || strings.TrimSpace(webhook.InvoiceSlug) == "" {
		return infinitePayWebhookResponse(400, false, "Identificadores obrigatorios ausentes"), nil
	}

	payment, err := confirmInfinitePayPayment(ctx, infinitePayConfirmationRequest{
		OrderNSU:       webhook.OrderNSU,
		TransactionNSU: webhook.TransactionNSU,
		Slug:           webhook.InvoiceSlug,
		ReceiptURL:     webhook.ReceiptURL,
	}, "")
	if err != nil {
		return infinitePayWebhookResponse(400, false, err.Error()), nil
	}
	return infinitePayWebhookResponse(200, true, payment.Status), nil
}

func HandleConfirmInfinitePayPayment(ctx context.Context, request events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	var req infinitePayConfirmationRequest
	if json.Unmarshal([]byte(request.Body), &req) != nil {
		return jsonResponse(400, map[string]interface{}{"error": "invalid request"}), nil
	}
	payment, err := confirmInfinitePayPayment(ctx, req, userID)
	if err != nil {
		return jsonResponse(400, map[string]interface{}{"error": err.Error()}), nil
	}
	return jsonResponse(200, paymentStatusResponse(payment)), nil
}

func HandleGetInfinitePayStatus(_ context.Context, request events.APIGatewayProxyRequest, userID string) (events.APIGatewayProxyResponse, error) {
	orderNSU := strings.TrimSpace(request.QueryStringParameters["order_nsu"])
	if orderNSU == "" {
		return jsonResponse(400, map[string]interface{}{"error": "order_nsu is required"}), nil
	}
	payment, err := findPaymentByOrderNSU(orderNSU)
	if err != nil {
		return jsonResponse(404, map[string]interface{}{"error": err.Error()}), nil
	}
	if payment.UserID != userID {
		return jsonResponse(403, map[string]interface{}{"error": "payment does not belong to user"}), nil
	}
	return jsonResponse(200, paymentStatusResponse(payment)), nil
}

func createInfinitePayCheckout(ctx context.Context, order infinitePayOrder) (Payment, error) {
	items, err := buildInfinitePayItems(order)
	if err != nil {
		return Payment{}, err
	}
	now := time.Now().UTC().Format(time.RFC3339)
	payment := Payment{
		ID:          generateUUID(),
		OrderID:     order.ID,
		OrderNSU:    generateUUID(),
		UserID:      order.UserID,
		Amount:      order.Total,
		AmountCents: moneyToCents(order.Total),
		Method:      order.Payment.Method,
		Provider:    "infinitepay",
		Status:      "creating_checkout",
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := putPayment(payment); err != nil {
		return Payment{}, err
	}

	payload := infinitePayLinkRequest{
		Handle:      infinitePayHandle,
		Items:       items,
		OrderNSU:    payment.OrderNSU,
		RedirectURL: infinitePayRedirectURL,
		WebhookURL:  infinitePayWebhookURL,
		Customer: infinitePayLinkCustomer{
			Name:        strings.TrimSpace(order.Customer.Name),
			Email:       strings.TrimSpace(order.Customer.Email),
			PhoneNumber: normalizeBrazilPhone(order.Customer.Phone),
		},
		Address: infinitePayLinkAddress{
			CEP:          onlyDigits(order.DeliveryAddress.ZipCode),
			Street:       strings.TrimSpace(order.DeliveryAddress.Street),
			Neighborhood: strings.TrimSpace(order.DeliveryAddress.Neighborhood),
			Number:       strings.TrimSpace(order.DeliveryAddress.Number),
			Complement:   strings.TrimSpace(order.DeliveryAddress.Complement),
		},
	}
	var response infinitePayLinkResponse
	rawResponse, err := postInfinitePayJSON(ctx, "/links", payload, &response)
	if err != nil {
		payment.Status = "checkout_error"
		payment.LastError = err.Error()
		payment.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
		_ = putPayment(payment)
		return Payment{}, err
	}
	if strings.TrimSpace(response.URL) == "" {
		return Payment{}, fmt.Errorf("InfinitePay did not return a checkout URL")
	}

	payment.CheckoutURL = response.URL
	payment.ProviderResponse = rawResponse
	payment.Status = "pending"
	payment.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	if err := putPayment(payment); err != nil {
		return Payment{}, err
	}
	if err := updateOrderPaymentLink(order, payment); err != nil {
		return Payment{}, err
	}
	return payment, nil
}

func confirmInfinitePayPayment(ctx context.Context, req infinitePayConfirmationRequest, userID string) (Payment, error) {
	req.OrderNSU = strings.TrimSpace(req.OrderNSU)
	req.TransactionNSU = strings.TrimSpace(req.TransactionNSU)
	req.Slug = strings.TrimSpace(req.Slug)
	if req.OrderNSU == "" || req.TransactionNSU == "" || req.Slug == "" {
		return Payment{}, fmt.Errorf("order_nsu, transaction_nsu and slug are required")
	}
	payment, err := findPaymentByOrderNSU(req.OrderNSU)
	if err != nil {
		return Payment{}, err
	}
	if userID != "" && payment.UserID != userID {
		return Payment{}, fmt.Errorf("payment does not belong to user")
	}
	if duplicate, duplicateErr := transactionUsedByAnotherPayment(req.TransactionNSU, payment.ID); duplicateErr != nil {
		return Payment{}, duplicateErr
	} else if duplicate {
		return Payment{}, fmt.Errorf("transaction_nsu is already linked to another payment")
	}

	var check infinitePayCheckResponse
	rawResponse, err := postInfinitePayJSON(ctx, "/payment_check", infinitePayCheckRequest{
		Handle:         infinitePayHandle,
		OrderNSU:       req.OrderNSU,
		TransactionNSU: req.TransactionNSU,
		Slug:           req.Slug,
	}, &check)
	if err != nil {
		return Payment{}, err
	}
	if !check.Success || !check.Paid {
		return Payment{}, fmt.Errorf("payment has not been confirmed by InfinitePay")
	}
	actualMethod := strings.ToLower(strings.TrimSpace(check.CaptureMethod))
	if actualMethod != "pix" && actualMethod != "credit_card" {
		return Payment{}, fmt.Errorf("unsupported InfinitePay capture method")
	}
	order, err := findInfinitePayOrder(payment.OrderID)
	if err != nil {
		return Payment{}, err
	}

	now := time.Now().UTC().Format(time.RFC3339)
	payment.InvoiceSlug = req.Slug
	payment.TransactionNSU = req.TransactionNSU
	if receiptURL := strings.TrimSpace(req.ReceiptURL); strings.HasPrefix(receiptURL, "https://") {
		payment.ReceiptURL = receiptURL
	}
	payment.ActualMethod = actualMethod
	payment.Installments = check.Installments
	payment.PaidAmountCents = check.PaidAmount
	payment.ProviderResponse = rawResponse
	payment.UpdatedAt = now
	payment.PaidAt = now
	payment.LastError = ""

	orderStatus := "approved"
	payment.Status = "paid"
	if check.Amount != payment.AmountCents {
		payment.Status = "amount_review"
		orderStatus = "payment_review"
		payment.LastError = "InfinitePay amount differs from order total"
	} else if actualMethod != payment.Method && strings.TrimSpace(order.CouponCode) != "" {
		payment.Status = "method_review"
		orderStatus = "payment_review"
		payment.LastError = "capture method differs from the method used to validate the coupon"
	}
	if err := putPayment(payment); err != nil {
		return Payment{}, err
	}

	if order.Status == orderStatus && order.Payment.TransactionNSU == payment.TransactionNSU {
		return payment, nil
	}
	paymentInfo := order.Payment
	paymentInfo.Provider = "infinitepay"
	paymentInfo.OrderNSU = payment.OrderNSU
	paymentInfo.InvoiceSlug = payment.InvoiceSlug
	paymentInfo.TransactionNSU = payment.TransactionNSU
	paymentInfo.ReceiptURL = payment.ReceiptURL
	paymentInfo.CheckoutURL = payment.CheckoutURL
	paymentInfo.Installments = maxInt(1, payment.Installments)
	paymentInfo.PaidAmount = float64(payment.PaidAmountCents) / 100
	paymentInfo.ActualMethod = payment.ActualMethod
	if orderStatus == "approved" {
		paymentInfo.Method = actualMethod
		if actualMethod == "pix" {
			paymentInfo.Label = "PIX"
		} else {
			paymentInfo.Label = "Cartao de credito"
		}
		paymentInfo.Status = "approved"
	} else {
		paymentInfo.Status = "review"
	}
	if err := updateOrderAfterInfinitePay(order, paymentInfo, orderStatus, now); err != nil {
		return Payment{}, err
	}
	if err := enqueueInfinitePayOrderEmail(order, paymentInfo, orderStatus); err != nil {
		log.Printf("failed to enqueue InfinitePay order email order=%s: %v", order.ID, err)
	}
	return payment, nil
}

func buildInfinitePayItems(order infinitePayOrder) ([]infinitePayLinkItem, error) {
	items := make([]infinitePayLinkItem, 0, len(order.Items)+1)
	var total int64
	for _, item := range order.Items {
		if item.Quantity <= 0 {
			return nil, fmt.Errorf("order contains an invalid quantity")
		}
		unitPrice := item.UnitPrice
		if unitPrice <= 0 {
			unitPrice = item.Price
		}
		priceCents := moneyToCents(unitPrice)
		if priceCents <= 0 {
			return nil, fmt.Errorf("order contains an invalid product price")
		}
		description := firstNonEmptyPayment(item.ProductName, item.ProductCode, item.ProductID)
		if item.Size != "" || item.Color != "" {
			description = fmt.Sprintf("%s - Tam. %s - Cor %s", description, item.Size, item.Color)
		}
		items = append(items, infinitePayLinkItem{Quantity: item.Quantity, Price: priceCents, Description: description})
		total += int64(item.Quantity) * priceCents
	}
	if shipping := moneyToCents(order.ShippingAmount); shipping > 0 {
		items = append(items, infinitePayLinkItem{Quantity: 1, Price: shipping, Description: "Entrega"})
		total += shipping
	}
	expected := moneyToCents(order.Total)
	if total < expected {
		items = append(items, infinitePayLinkItem{Quantity: 1, Price: expected - total, Description: "Ajuste do pedido"})
		total = expected
	}
	if total != expected {
		return nil, fmt.Errorf("order item total does not match order total")
	}
	return items, nil
}

func findInfinitePayOrder(orderID string) (infinitePayOrder, error) {
	var lastKey map[string]*dynamodb.AttributeValue
	for {
		result, err := dynamoClient.Scan(&dynamodb.ScanInput{
			TableName:         aws.String(ordersTableName),
			FilterExpression:  aws.String("id = :id"),
			ExclusiveStartKey: lastKey,
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":id": {S: aws.String(orderID)},
			},
		})
		if err != nil {
			return infinitePayOrder{}, err
		}
		if len(result.Items) > 0 {
			var order infinitePayOrder
			if err := dynamodbattribute.UnmarshalMap(result.Items[0], &order); err != nil {
				return infinitePayOrder{}, err
			}
			return order, nil
		}
		if len(result.LastEvaluatedKey) == 0 {
			break
		}
		lastKey = result.LastEvaluatedKey
	}
	return infinitePayOrder{}, fmt.Errorf("order not found")
}

func findPaymentByOrderNSU(orderNSU string) (Payment, error) {
	var lastKey map[string]*dynamodb.AttributeValue
	for {
		result, err := dynamoClient.Scan(&dynamodb.ScanInput{
			TableName:         aws.String(tableName),
			FilterExpression:  aws.String("order_nsu = :order_nsu"),
			ExclusiveStartKey: lastKey,
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":order_nsu": {S: aws.String(orderNSU)},
			},
		})
		if err != nil {
			return Payment{}, err
		}
		if len(result.Items) > 0 {
			var payment Payment
			if err := dynamodbattribute.UnmarshalMap(result.Items[0], &payment); err != nil {
				return Payment{}, err
			}
			return payment, nil
		}
		if len(result.LastEvaluatedKey) == 0 {
			break
		}
		lastKey = result.LastEvaluatedKey
	}
	return Payment{}, fmt.Errorf("payment not found")
}

func findReusablePayment(orderID, userID string) (Payment, bool, error) {
	var lastKey map[string]*dynamodb.AttributeValue
	for {
		result, err := dynamoClient.Scan(&dynamodb.ScanInput{
			TableName:         aws.String(tableName),
			FilterExpression:  aws.String("order_id = :order_id AND user_id = :user_id AND provider = :provider"),
			ExclusiveStartKey: lastKey,
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":order_id": {S: aws.String(orderID)},
				":user_id":  {S: aws.String(userID)},
				":provider": {S: aws.String("infinitepay")},
			},
		})
		if err != nil {
			return Payment{}, false, err
		}
		for _, item := range result.Items {
			var payment Payment
			if dynamodbattribute.UnmarshalMap(item, &payment) == nil &&
				(payment.Status == "pending" || payment.Status == "creating_checkout" || payment.Status == "paid") &&
				payment.CheckoutURL != "" {
				return payment, true, nil
			}
		}
		if len(result.LastEvaluatedKey) == 0 {
			break
		}
		lastKey = result.LastEvaluatedKey
	}
	return Payment{}, false, nil
}

func transactionUsedByAnotherPayment(transactionNSU, paymentID string) (bool, error) {
	var lastKey map[string]*dynamodb.AttributeValue
	for {
		result, err := dynamoClient.Scan(&dynamodb.ScanInput{
			TableName:         aws.String(tableName),
			FilterExpression:  aws.String("transaction_nsu = :transaction_nsu"),
			ExclusiveStartKey: lastKey,
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":transaction_nsu": {S: aws.String(transactionNSU)},
			},
		})
		if err != nil {
			return false, err
		}
		for _, item := range result.Items {
			var payment Payment
			if dynamodbattribute.UnmarshalMap(item, &payment) == nil && payment.ID != paymentID {
				return true, nil
			}
		}
		if len(result.LastEvaluatedKey) == 0 {
			break
		}
		lastKey = result.LastEvaluatedKey
	}
	return false, nil
}

func putPayment(payment Payment) error {
	item, err := dynamodbattribute.MarshalMap(payment)
	if err != nil {
		return err
	}
	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	return err
}

func updateOrderPaymentLink(order infinitePayOrder, payment Payment) error {
	paymentInfo := order.Payment
	paymentInfo.Provider = "infinitepay"
	paymentInfo.OrderNSU = payment.OrderNSU
	paymentInfo.CheckoutURL = payment.CheckoutURL
	paymentInfo.Status = "pending"
	paymentValue, err := dynamodbattribute.Marshal(paymentInfo)
	if err != nil {
		return err
	}
	_, err = dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(ordersTableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id":      {S: aws.String(order.ID)},
			"user_id": {S: aws.String(order.UserID)},
		},
		UpdateExpression: aws.String("SET payment = :payment, updated_at = :updated_at"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":payment":    paymentValue,
			":updated_at": {S: aws.String(time.Now().UTC().Format(time.RFC3339))},
		},
	})
	return err
}

func updateOrderAfterInfinitePay(order infinitePayOrder, payment infinitePayOrderPayment, status, now string) error {
	history := append(order.StatusHistory, infinitePayStatusHistory{
		Status: status, ChangedAt: now, ChangedBy: "infinitepay:payment_check",
	})
	paymentValue, err := dynamodbattribute.Marshal(payment)
	if err != nil {
		return err
	}
	historyValue, err := dynamodbattribute.Marshal(history)
	if err != nil {
		return err
	}
	values := map[string]*dynamodb.AttributeValue{
		":status":     {S: aws.String(status)},
		":payment":    paymentValue,
		":history":    historyValue,
		":updated_at": {S: aws.String(now)},
	}
	expression := "SET #status = :status, payment = :payment, status_history = :history, updated_at = :updated_at"
	if status == "approved" {
		expression += ", approved_at = :approved_at"
		values[":approved_at"] = &dynamodb.AttributeValue{S: aws.String(now)}
	}
	_, err = dynamoClient.UpdateItem(&dynamodb.UpdateItemInput{
		TableName: aws.String(ordersTableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id":      {S: aws.String(order.ID)},
			"user_id": {S: aws.String(order.UserID)},
		},
		UpdateExpression: aws.String(expression),
		ExpressionAttributeNames: map[string]*string{
			"#status": aws.String("status"),
		},
		ExpressionAttributeValues: values,
	})
	return err
}

func postInfinitePayJSON(ctx context.Context, path string, payload interface{}, target interface{}) (string, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, infinitePayAPIURL+path, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	response, err := infinitePayHTTPClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("InfinitePay request failed: %w", err)
	}
	defer response.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(response.Body, 1024*1024))
	if err != nil {
		return "", err
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return string(raw), fmt.Errorf("InfinitePay returned status %d", response.StatusCode)
	}
	if err := json.Unmarshal(raw, target); err != nil {
		return string(raw), fmt.Errorf("invalid InfinitePay response: %w", err)
	}
	return string(raw), nil
}

func enqueueInfinitePayOrderEmail(order infinitePayOrder, payment infinitePayOrderPayment, status string) error {
	if paymentSQSClient == nil || emailQueueURL == "" || strings.TrimSpace(order.Customer.Email) == "" {
		return nil
	}
	statusLabel := "Pedido aprovado"
	if status == "payment_review" {
		statusLabel = "Pagamento em analise"
	}
	lines := make([]string, 0, len(order.Items))
	for _, item := range order.Items {
		unitPrice := item.UnitPrice
		if unitPrice <= 0 {
			unitPrice = item.Price
		}
		lines = append(lines, fmt.Sprintf("- %d x %s - %s", item.Quantity, firstNonEmptyPayment(item.ProductName, item.ProductCode), formatBRLPayment(unitPrice*float64(item.Quantity))))
	}
	emailID := generateUUID()
	payload := infinitePayEmailPayload{
		ID:      emailID,
		UUID:    emailID,
		Type:    "notificacao-status-pedido",
		ToEmail: order.Customer.Email,
		ToName:  order.Customer.Name,
		Data: map[string]string{
			"nome_do_cliente":    order.Customer.Name,
			"numero_do_pedido":   order.ID,
			"valor_do_pedido":    formatBRLPayment(order.Total),
			"status_do_pedido":   statusLabel,
			"itens_do_pedido":    strings.Join(lines, "\n"),
			"parcelas_do_pedido": formatInfinitePayInstallments(payment),
		},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	_, err = paymentSQSClient.SendMessage(&sqs.SendMessageInput{
		QueueUrl:    aws.String(emailQueueURL),
		MessageBody: aws.String(string(body)),
	})
	return err
}

func checkoutResponse(payment Payment) map[string]interface{} {
	return map[string]interface{}{
		"payment_id":   payment.ID,
		"order_id":     payment.OrderID,
		"order_nsu":    payment.OrderNSU,
		"checkout_url": payment.CheckoutURL,
		"status":       payment.Status,
	}
}

func paymentStatusResponse(payment Payment) map[string]interface{} {
	return map[string]interface{}{
		"payment_id":      payment.ID,
		"order_id":        payment.OrderID,
		"order_nsu":       payment.OrderNSU,
		"status":          payment.Status,
		"method":          payment.Method,
		"actual_method":   payment.ActualMethod,
		"installments":    payment.Installments,
		"receipt_url":     payment.ReceiptURL,
		"transaction_nsu": payment.TransactionNSU,
		"last_error":      payment.LastError,
	}
}

func infinitePayWebhookResponse(status int, success bool, message string) events.APIGatewayProxyResponse {
	var value interface{} = message
	if success {
		value = nil
	}
	return jsonResponse(status, map[string]interface{}{"success": success, "message": value})
}

func jsonResponse(status int, payload interface{}) events.APIGatewayProxyResponse {
	body, _ := json.Marshal(payload)
	return events.APIGatewayProxyResponse{
		StatusCode: status,
		Headers:    responseHeaders(),
		Body:       string(body),
	}
}

func moneyToCents(value float64) int64 {
	return int64(math.Round(value * 100))
}

func formatBRLPayment(value float64) string {
	formatted := fmt.Sprintf("%.2f", math.Round(value*100)/100)
	parts := strings.SplitN(formatted, ".", 2)
	integer := parts[0]
	for index := len(integer) - 3; index > 0; index -= 3 {
		integer = integer[:index] + "." + integer[index:]
	}
	return "R$ " + integer + "," + parts[1]
}

func formatInfinitePayInstallments(payment infinitePayOrderPayment) string {
	if payment.Installments <= 1 {
		return ""
	}
	return fmt.Sprintf("%dx de aproximadamente %s", payment.Installments, formatBRLPayment(payment.Amount/float64(payment.Installments)))
}

func normalizeBrazilPhone(value string) string {
	digits := onlyDigits(value)
	if digits == "" {
		return ""
	}
	if !strings.HasPrefix(digits, "55") {
		digits = "55" + digits
	}
	return "+" + digits
}

func onlyDigits(value string) string {
	var builder strings.Builder
	for _, char := range value {
		if char >= '0' && char <= '9' {
			builder.WriteRune(char)
		}
	}
	return builder.String()
}

func generateUUID() string {
	value := make([]byte, 16)
	_, _ = rand.Read(value)
	value[6] = (value[6] & 0x0f) | 0x40
	value[8] = (value[8] & 0x3f) | 0x80
	encoded := hex.EncodeToString(value)
	return fmt.Sprintf("%s-%s-%s-%s-%s", encoded[0:8], encoded[8:12], encoded[12:16], encoded[16:20], encoded[20:32])
}

func firstNonEmptyPayment(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return "Produto"
}

func maxInt(left, right int) int {
	if left > right {
		return left
	}
	return right
}
