package products

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"mime"
	"net/url"
	"os"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/golang-jwt/jwt/v5"
)

type Brand struct {
	ID         string `json:"id" dynamodbav:"id"`
	EntityType string `json:"entity_type" dynamodbav:"entity_type"`
	Name       string `json:"name" dynamodbav:"name"`
	Brand      string `json:"brand" dynamodbav:"brand"`
	BrandKey   string `json:"brand_key" dynamodbav:"brand_key"`
	S3Prefix   string `json:"s3_prefix" dynamodbav:"s3_prefix"`
	CreatedAt  string `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt  string `json:"updated_at" dynamodbav:"updated_at"`
}

type Collection struct {
	ID                           string             `json:"id" dynamodbav:"id"`
	EntityType                   string             `json:"entity_type" dynamodbav:"entity_type"`
	Name                         string             `json:"name" dynamodbav:"name"`
	Slug                         string             `json:"slug" dynamodbav:"slug"`
	Brand                        string             `json:"brand" dynamodbav:"brand"`
	BrandKey                     string             `json:"brand_key" dynamodbav:"brand_key"`
	Year                         string             `json:"year" dynamodbav:"year"`
	CollectionKey                string             `json:"collection_key" dynamodbav:"collection_key"`
	SpreadDefaultPercent         float64            `json:"spread_default_percent" dynamodbav:"spread_default_percent"`
	CouponCode                   string             `json:"coupon_code,omitempty" dynamodbav:"coupon_code,omitempty"`
	CouponSpreadReductionPercent float64            `json:"coupon_spread_reduction_percent" dynamodbav:"coupon_spread_reduction_percent"`
	Coupons                      []CollectionCoupon `json:"coupons,omitempty" dynamodbav:"coupons,omitempty"`
	CreditColoreMaxAmount        float64            `json:"credit_colore_max_amount" dynamodbav:"credit_colore_max_amount"`
	DisplayStartAt               string             `json:"display_start_at" dynamodbav:"display_start_at"`
	DisplayEndAt                 string             `json:"display_end_at" dynamodbav:"display_end_at"`
	HideFromCatalog              bool               `json:"hidden_from_catalog" dynamodbav:"hidden_from_catalog"`
	S3Prefix                     string             `json:"s3_prefix" dynamodbav:"s3_prefix"`
	CreatedAt                    string             `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt                    string             `json:"updated_at" dynamodbav:"updated_at"`
}

type CollectionCoupon struct {
	Code                   string   `json:"code" dynamodbav:"code"`
	SpreadReductionPercent float64  `json:"spread_reduction_percent" dynamodbav:"spread_reduction_percent"`
	PaymentMethods         []string `json:"payment_methods" dynamodbav:"payment_methods"`
}

type Product struct {
	ID               string   `json:"id" dynamodbav:"id"`
	EntityType       string   `json:"entity_type" dynamodbav:"entity_type"`
	UUID             string   `json:"UUID,omitempty" dynamodbav:"uuid,omitempty"`
	Number           int      `json:"Number,omitempty" dynamodbav:"number,omitempty"`
	ProductID        string   `json:"produto_id" dynamodbav:"product_id"`
	Name             string   `json:"name" dynamodbav:"name"`
	Description      string   `json:"description" dynamodbav:"description"`
	Price            float64  `json:"price" dynamodbav:"price"`
	CostPrice        float64  `json:"cost_price,omitempty" dynamodbav:"cost_price"`
	CostPriceRaw     string   `json:"preco_custo,omitempty" dynamodbav:"cost_price_raw,omitempty"`
	SpreadPercent    float64  `json:"spread_percent,omitempty" dynamodbav:"spread_percent"`
	SpreadIsDefault  bool     `json:"spread_is_default,omitempty" dynamodbav:"spread_is_default"`
	Category         string   `json:"category" dynamodbav:"category"`
	Type             string   `json:"type" dynamodbav:"type"`
	TypeKey          string   `json:"type_key,omitempty" dynamodbav:"type_key,omitempty"`
	Brand            string   `json:"brand" dynamodbav:"brand"`
	BrandKey         string   `json:"brand_key" dynamodbav:"brand_key"`
	Collection       string   `json:"collection" dynamodbav:"collection"`
	CollectionSlug   string   `json:"collection_slug" dynamodbav:"collection_slug"`
	Year             string   `json:"year" dynamodbav:"year"`
	CollectionKey    string   `json:"collection_key" dynamodbav:"collection_key"`
	ReleaseDate      string   `json:"release_date,omitempty" dynamodbav:"release_date,omitempty"`
	FinalizationDate string   `json:"finalization_date,omitempty" dynamodbav:"finalization_date,omitempty"`
	DisplayStartAt   string   `json:"display_start_at,omitempty" dynamodbav:"display_start_at,omitempty"`
	DisplayEndAt     string   `json:"display_end_at,omitempty" dynamodbav:"display_end_at,omitempty"`
	HideFromCatalog  bool     `json:"hidden_from_catalog" dynamodbav:"hidden_from_catalog"`
	Size             []string `json:"size" dynamodbav:"size"`
	AgeGroup         string   `json:"ageGroup,omitempty" dynamodbav:"age_group,omitempty"`
	SizeOriginal     string   `json:"tamanho_original,omitempty" dynamodbav:"size_original,omitempty"`
	SizeStart        int      `json:"tamanho_inicio,omitempty" dynamodbav:"size_start,omitempty"`
	SizeEnd          int      `json:"tamanho_fim,omitempty" dynamodbav:"size_end,omitempty"`
	SizesArray       []int    `json:"tamanhos_array,omitempty" dynamodbav:"sizes_array,omitempty"`
	Colors           []string `json:"cores,omitempty" dynamodbav:"colors,omitempty"`
	Image            string   `json:"image,omitempty" dynamodbav:"image,omitempty"`
	ImageURL         string   `json:"image_url,omitempty" dynamodbav:"image_url,omitempty"`
	Images           []string `json:"images,omitempty" dynamodbav:"images,omitempty"`
	ImageURLs        []string `json:"image_urls,omitempty" dynamodbav:"image_urls,omitempty"`
	ImageBucket      string   `json:"image_bucket,omitempty" dynamodbav:"image_bucket,omitempty"`
	ImageKeys        []string `json:"image_keys,omitempty" dynamodbav:"image_keys,omitempty"`
	S3Prefix         string   `json:"s3_prefix" dynamodbav:"s3_prefix"`
	Stock            int      `json:"stock" dynamodbav:"stock"`
	IsActive         bool     `json:"is_active" dynamodbav:"is_active"`
	IsNew            bool     `json:"isNew" dynamodbav:"is_new"`
	IsPromotion      bool     `json:"isPromotion" dynamodbav:"is_promotion"`
	CreatedAt        string   `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt        string   `json:"updated_at" dynamodbav:"updated_at"`
}

type CreateBrandRequest struct {
	Name  string `json:"name"`
	Brand string `json:"brand"`
}

type CreateCollectionRequest struct {
	Name                         string             `json:"name"`
	Collection                   string             `json:"collection"`
	Slug                         string             `json:"slug"`
	Brand                        string             `json:"brand"`
	Year                         string             `json:"year"`
	SpreadDefaultPercent         *float64           `json:"spread_default_percent"`
	CouponCode                   string             `json:"coupon_code"`
	CouponSpreadReductionPercent *float64           `json:"coupon_spread_reduction_percent"`
	Coupons                      []CollectionCoupon `json:"coupons"`
	CreditColoreMaxAmount        *float64           `json:"credit_colore_max_amount"`
	DisplayStartAt               string             `json:"display_start_at"`
	DisplayEndAt                 string             `json:"display_end_at"`
	ReleaseDate                  string             `json:"release_date"`
	FinalizationDate             string             `json:"finalization_date"`
	HideFromCatalog              bool               `json:"hidden_from_catalog"`
}

type UpdateCollectionRequest struct {
	Name                         *string             `json:"name"`
	SpreadDefaultPercent         *float64            `json:"spread_default_percent"`
	CouponCode                   *string             `json:"coupon_code"`
	CouponSpreadReductionPercent *float64            `json:"coupon_spread_reduction_percent"`
	Coupons                      *[]CollectionCoupon `json:"coupons"`
	CreditColoreMaxAmount        *float64            `json:"credit_colore_max_amount"`
	DisplayStartAt               *string             `json:"display_start_at"`
	DisplayEndAt                 *string             `json:"display_end_at"`
	HideFromCatalog              *bool               `json:"hidden_from_catalog"`
}

type UploadImage struct {
	FileName      string `json:"file_name"`
	ContentBase64 string `json:"content_base64"`
	ContentType   string `json:"content_type"`
}

type CreateProductRequest struct {
	ID               string        `json:"id"`
	UUID             string        `json:"UUID"`
	Number           int           `json:"Number"`
	NomeTabela       string        `json:"nome_tabela"`
	ProductID        string        `json:"produto_id"`
	Name             string        `json:"name"`
	Description      string        `json:"description"`
	Descricao        string        `json:"descricao"`
	Price            interface{}   `json:"price"`
	Preco            interface{}   `json:"preco"`
	CostPrice        interface{}   `json:"cost_price"`
	PrecoCusto       interface{}   `json:"preco_custo"`
	SpreadPercent    *float64      `json:"spread_percent"`
	Category         string        `json:"category"`
	Type             string        `json:"type"`
	Brand            string        `json:"brand"`
	Collection       string        `json:"collection"`
	CollectionSlug   string        `json:"collection_slug"`
	Year             string        `json:"year"`
	ReleaseDate      string        `json:"release_date"`
	FinalizationDate string        `json:"finalization_date"`
	DisplayStartAt   string        `json:"display_start_at"`
	DisplayEndAt     string        `json:"display_end_at"`
	Size             []string      `json:"size"`
	AgeGroup         string        `json:"ageGroup"`
	SizeOriginal     string        `json:"tamanho_original"`
	SizeStart        interface{}   `json:"tamanho_inicio"`
	SizeEnd          interface{}   `json:"tamanho_fim"`
	SizesArray       []interface{} `json:"tamanhos_array"`
	Colors           []string      `json:"cores"`
	Imagem           []string      `json:"imagem"`
	Image            string        `json:"image"`
	ImageURL         string        `json:"image_url"`
	Images           []string      `json:"images"`
	ImageBase64      string        `json:"image_base64"`
	ImageFileName    string        `json:"image_file_name"`
	ImageContentType string        `json:"image_content_type"`
	UploadImages     []UploadImage `json:"upload_images"`
	Stock            int           `json:"stock"`
	IsActive         *bool         `json:"is_active"`
	IsNew            *bool         `json:"isNew"`
	IsNewSnake       *bool         `json:"is_new"`
	IsPromotion      *bool         `json:"isPromotion"`
	IsPromotionSnake *bool         `json:"is_promotion"`
}

type ImportProductsFileRequest struct {
	FileName       string                 `json:"file_name"`
	ContentBase64  string                 `json:"content_base64"`
	FileBase64     string                 `json:"file_base64"`
	Products       []CreateProductRequest `json:"products"`
	Brand          string                 `json:"brand"`
	Collection     string                 `json:"collection"`
	CollectionSlug string                 `json:"collection_slug"`
	Year           string                 `json:"year"`
}

type ImportProductsFileResponse struct {
	FileName      string   `json:"file_name,omitempty"`
	ImportedCount int      `json:"imported_count"`
	ProductIDs    []string `json:"product_ids"`
}

type UploadProductImageRequest struct {
	FileName         string `json:"file_name"`
	ContentBase64    string `json:"content_base64"`
	ContentType      string `json:"content_type"`
	ImageBase64      string `json:"image_base64"`
	ImageFileName    string `json:"image_file_name"`
	ImageContentType string `json:"image_content_type"`
}

type ManageProductImageRequest struct {
	ImageName string `json:"image_name"`
	ImageKey  string `json:"image_key"`
	ImageURL  string `json:"image_url"`
}

type ProductsListResponse struct {
	Products         []Product `json:"products"`
	LastEvaluatedKey string    `json:"last_evaluated_key,omitempty"`
}

type UserRole struct {
	ID            string `dynamodbav:"id"`
	Active        bool   `dynamodbav:"active"`
	DeactivatedAt string `dynamodbav:"deactivated_at,omitempty"`
}

var (
	dynamoClient  *dynamodb.DynamoDB
	s3Client      *s3.S3
	tableName     = "mundocolore-products"
	imageBucket   = "mundocolorestore-imagems"
	imageBaseURL  string
	roleTableName = "mundocolore-role"
	jwtSecret     = []byte("your-secret-key")
)

const (
	lambdaName       = "products"
	healthKeyValue   = "health-check-products"
	healthTimeLayout = "2006-01-02 15:04:05"
	defaultSize      = "UNICO"
	defaultColor     = "9999999"
)

func init() {
	sess := session.Must(session.NewSession(&aws.Config{
		Region: aws.String("sa-east-1"),
	}))
	dynamoClient = dynamodb.New(sess)
	s3Client = s3.New(sess)
	if value := os.Getenv("TABLE_NAME"); value != "" {
		tableName = value
	}
	if value := os.Getenv("IMAGE_BUCKET"); value != "" {
		imageBucket = value
	}
	if value := os.Getenv("IMAGE_BASE_URL"); value != "" {
		imageBaseURL = strings.TrimRight(value, "/")
	}
	if value := os.Getenv("ROLE_TABLE_NAME"); value != "" {
		roleTableName = value
	}
	if value := os.Getenv("JWT_SECRET"); value != "" {
		jwtSecret = []byte(value)
	}
}

func authorizeAdmin(request events.APIGatewayProxyRequest) error {
	tokenString := extractBearerToken(request.Headers)
	if tokenString == "" {
		return fmt.Errorf("admin authorization required")
	}
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return fmt.Errorf("invalid token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return fmt.Errorf("invalid token")
	}
	userID, _ := claims["user_id"].(string)
	if userID == "" {
		userID, _ = claims["sub"].(string)
	}
	if userID == "" || !isActiveAdmin(userID) {
		return fmt.Errorf("admin access required")
	}
	return nil
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
	if err := dynamodbattribute.UnmarshalMap(result.Item, &role); err != nil {
		return false
	}
	return role.Active && strings.TrimSpace(role.DeactivatedAt) == ""
}

func extractBearerToken(headers map[string]string) string {
	for key, value := range headers {
		if !strings.EqualFold(key, "Authorization") {
			continue
		}
		parts := strings.SplitN(strings.TrimSpace(value), " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			return strings.TrimSpace(parts[1])
		}
		return strings.TrimSpace(value)
	}
	return ""
}

func HandleCreateBrand(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req CreateBrandRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	brand, err := createBrand(req)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}

	body, _ := json.Marshal(brand)
	return successJSONResponse(201, string(body)), nil
}

func HandleGetBrands(_ context.Context, _ events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	brands, err := listBrands()
	if err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(map[string]interface{}{"brands": brands})
	return successJSONResponse(200, string(body)), nil
}

func HandleCreateCollection(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req CreateCollectionRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	collection, err := createCollection(req)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}

	body, _ := json.Marshal(collection)
	return successJSONResponse(201, string(body)), nil
}

func HandleGetCollections(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	collections, err := listCollections(request.QueryStringParameters["brand"], request.QueryStringParameters["year"])
	if err != nil {
		return serverErrorResponse(err), nil
	}
	if !strings.EqualFold(request.QueryStringParameters["include_pricing_config"], "true") {
		for index := range collections {
			collections[index].SpreadDefaultPercent = 0
			collections[index].CouponCode = ""
			collections[index].CouponSpreadReductionPercent = 0
			collections[index].Coupons = nil
		}
	}

	body, _ := json.Marshal(map[string]interface{}{"collections": collections})
	return successJSONResponse(200, string(body)), nil
}

func HandleUpdateCollection(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := extractCollectionIDFromPath(request.Path)
	if id == "" {
		return badRequestResponse("invalid collection id"), nil
	}

	var req UpdateCollectionRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	collection, updatedCount, err := updateCollection(id, req)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}

	body, _ := json.Marshal(map[string]interface{}{
		"collection":    collection,
		"updated_count": updatedCount,
	})
	return successJSONResponse(200, string(body)), nil
}

func HandleRecalculateCollectionSpread(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := extractCollectionIDFromRecalculatePath(request.Path)
	if id == "" {
		return badRequestResponse("invalid collection id"), nil
	}

	collection, err := getCollection(id)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}
	updatedCount, err := recalculateCollectionProducts(collection)
	if err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(map[string]interface{}{
		"collection":    collection,
		"updated_count": updatedCount,
	})
	return successJSONResponse(200, string(body)), nil
}

func HandleCreateProduct(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var req CreateProductRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}
	applyProductDefaultsFromQuery(&req, request.QueryStringParameters)

	product, err := createProduct(req)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}

	body, _ := json.Marshal(product)
	return successJSONResponse(201, string(body)), nil
}

func HandleImportProductsFile(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	importRequest, products, err := parseImportProductsFileRequest(request.Body)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}

	importedProducts := make([]Product, 0, len(products))
	importedIDs := make([]string, 0, len(products))
	for index, productRequest := range products {
		applyImportProductDefaults(&productRequest, importRequest)
		applyProductDefaultsFromQuery(&productRequest, request.QueryStringParameters)

		product, err := buildProduct(productRequest)
		if err != nil {
			return badRequestResponse(fmt.Sprintf("product %d (%s): %s", index+1, productRequest.ProductID, err.Error())), nil
		}
		importedProducts = append(importedProducts, product)
		importedIDs = append(importedIDs, product.ID)
	}
	if err := ensureProductBatchS3Prefixes(importedProducts); err != nil {
		return serverErrorResponse(err), nil
	}
	if err := putEntitiesBatch(importedProducts); err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(ImportProductsFileResponse{
		FileName:      importRequest.FileName,
		ImportedCount: len(importedIDs),
		ProductIDs:    importedIDs,
	})
	return successJSONResponse(201, string(body)), nil
}

func HandleUploadProductImage(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := extractProductImageIDFromPath(request.Path)
	if id == "" {
		return badRequestResponse("invalid product id"), nil
	}

	var req UploadProductImageRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}

	contentBase64 := firstNonEmpty(req.ContentBase64, req.ImageBase64)
	if contentBase64 == "" {
		return badRequestResponse("content_base64 is required"), nil
	}

	fileName := firstNonEmpty(req.FileName, req.ImageFileName)
	contentType := firstNonEmpty(req.ContentType, req.ImageContentType)
	product, err := updateProduct(id, CreateProductRequest{
		UploadImages: []UploadImage{{
			FileName:      fileName,
			ContentBase64: contentBase64,
			ContentType:   contentType,
		}},
	})
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}

	body, _ := json.Marshal(product)
	return successJSONResponse(201, string(body)), nil
}

func HandleSetPrimaryProductImage(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := extractProductImageIDFromPath(request.Path)
	if id == "" {
		return badRequestResponse("invalid product id"), nil
	}

	req, err := parseManageProductImageRequest(request)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}
	product, err := getProduct(id)
	if err != nil {
		return notFoundWithMessage(err.Error()), nil
	}
	product, err = setPrimaryProductImage(product, manageProductImageTarget(req))
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}
	if err := putEntity(product); err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(product)
	return successJSONResponse(200, string(body)), nil
}

func HandleDeleteProductImage(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := extractProductImageIDFromPath(request.Path)
	if id == "" {
		return badRequestResponse("invalid product id"), nil
	}

	req, err := parseManageProductImageRequest(request)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}
	product, err := getProduct(id)
	if err != nil {
		return notFoundWithMessage(err.Error()), nil
	}
	product, imageKey, err := removeProductImage(product, manageProductImageTarget(req))
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}
	if err := deleteImage(imageKey); err != nil {
		return serverErrorResponse(err), nil
	}
	if err := putEntity(product); err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(product)
	return successJSONResponse(200, string(body)), nil
}

func HandleGetProduct(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := extractProductIDFromPath(request.Path)
	if id == "" {
		return badRequestResponse("invalid product id"), nil
	}

	product, err := getProduct(id)
	if err != nil {
		return notFoundWithMessage(err.Error()), nil
	}

	body, _ := json.Marshal(sanitizeProductForCustomer(product))
	return successJSONResponse(200, string(body)), nil
}

func HandleUpdateProduct(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := extractProductIDFromPath(request.Path)
	if id == "" {
		return badRequestResponse("invalid product id"), nil
	}

	var req CreateProductRequest
	if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
		return badRequestResponse("invalid request"), nil
	}
	applyProductDefaultsFromQuery(&req, request.QueryStringParameters)

	product, err := updateProduct(id, req)
	if err != nil {
		return badRequestResponse(err.Error()), nil
	}

	body, _ := json.Marshal(product)
	return successJSONResponse(200, string(body)), nil
}

func HandleDeleteProduct(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := extractProductIDFromPath(request.Path)
	if id == "" {
		return badRequestResponse("invalid product id"), nil
	}

	product, err := getProduct(id)
	if err != nil {
		return notFoundWithMessage(err.Error()), nil
	}
	if err := deleteProduct(product.ID); err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(map[string]interface{}{"deleted": true, "id": product.ID})
	return successJSONResponse(200, string(body)), nil
}

func HandleGetProducts(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	limit := parseLimit(request.QueryStringParameters["limit"], 20)
	lastKey := request.QueryStringParameters["last_key"]

	products, err := getProducts(ProductQuery{
		Category:        request.QueryStringParameters["category"],
		Type:            request.QueryStringParameters["type"],
		ProductID:       firstNonEmpty(request.QueryStringParameters["produto_id"], request.QueryStringParameters["product_id"]),
		Brand:           request.QueryStringParameters["brand"],
		Year:            request.QueryStringParameters["year"],
		Collection:      request.QueryStringParameters["collection"],
		IsNew:           parseOptionalBool(request.QueryStringParameters["is_new"]),
		IsPromotion:     parseOptionalBool(request.QueryStringParameters["is_promotion"]),
		IncludeInactive: strings.EqualFold(request.QueryStringParameters["include_inactive"], "true"),
		IncludeCost:     strings.EqualFold(request.QueryStringParameters["include_cost"], "true"),
		CatalogOnly:     strings.EqualFold(request.QueryStringParameters["catalog"], "true"),
		Limit:           limit,
		LastKey:         lastKey,
	})
	if err != nil {
		return serverErrorResponse(err), nil
	}

	body, _ := json.Marshal(products)
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
		"id":          {S: aws.String("health-products")},
		"entity_type": {S: aws.String("health")},
		"name":        {S: aws.String("health-product")},
		"description": {S: aws.String("health record")},
		"price":       {N: aws.String("0")},
		"category":    {S: aws.String("health")},
		"image_url":   {S: aws.String("s3://health.local/image")},
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

	return successJSONResponse(200, string(body)), nil
}

func createBrand(req CreateBrandRequest) (Brand, error) {
	name := firstNonEmpty(req.Brand, req.Name)
	brandKey := normalizeBrand(name)
	if brandKey == "" {
		return Brand{}, fmt.Errorf("brand is required")
	}

	now := time.Now().Format(time.RFC3339)
	brand := Brand{
		ID:         "BRAND#" + brandKey,
		EntityType: "brand",
		Name:       firstNonEmpty(req.Name, brandKey),
		Brand:      brandKey,
		BrandKey:   brandKey,
		S3Prefix:   brandKey + "/",
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	if err := ensureS3Prefix(brand.S3Prefix); err != nil {
		return Brand{}, err
	}

	return brand, putEntity(brand)
}

func createCollection(req CreateCollectionRequest) (Collection, error) {
	brandKey := normalizeBrand(req.Brand)
	if brandKey == "" {
		return Collection{}, fmt.Errorf("brand is required")
	}

	year := strings.TrimSpace(req.Year)
	if year == "" {
		year = strconv.Itoa(time.Now().Year())
	}

	name := firstNonEmpty(req.Collection, req.Name)
	slug := slugify(firstNonEmpty(req.Slug, name))
	if slug == "" {
		return Collection{}, fmt.Errorf("collection is required")
	}

	displayStart := firstNonEmpty(req.DisplayStartAt, req.ReleaseDate)
	displayEnd := firstNonEmpty(req.DisplayEndAt, req.FinalizationDate)
	collectionKey := buildCollectionKey(brandKey, year, slug)
	now := time.Now().Format(time.RFC3339)

	coupons, err := normalizeCollectionCoupons(req.Coupons, req.CouponCode, req.CouponSpreadReductionPercent)
	if err != nil {
		return Collection{}, err
	}
	collection := Collection{
		ID:                           "COLLECTION#" + collectionKey,
		EntityType:                   "collection",
		Name:                         firstNonEmpty(req.Name, req.Collection, slug),
		Slug:                         slug,
		Brand:                        brandKey,
		BrandKey:                     brandKey,
		Year:                         year,
		CollectionKey:                collectionKey,
		SpreadDefaultPercent:         percentageValue(req.SpreadDefaultPercent),
		CouponCode:                   normalizeCouponCode(req.CouponCode),
		CouponSpreadReductionPercent: percentageValue(req.CouponSpreadReductionPercent),
		Coupons:                      coupons,
		CreditColoreMaxAmount:        moneyValue(req.CreditColoreMaxAmount),
		DisplayStartAt:               displayStart,
		DisplayEndAt:                 displayEnd,
		HideFromCatalog:              req.HideFromCatalog,
		S3Prefix:                     buildS3Prefix(brandKey, year, slug),
		CreatedAt:                    now,
		UpdatedAt:                    now,
	}
	if len(coupons) > 0 {
		collection.CouponCode = coupons[0].Code
		collection.CouponSpreadReductionPercent = coupons[0].SpreadReductionPercent
	}

	if err := ensureS3Prefix(brandKey + "/"); err != nil {
		return Collection{}, err
	}
	if err := ensureS3Prefix(path.Join(brandKey, year) + "/"); err != nil {
		return Collection{}, err
	}
	if err := ensureS3Prefix(collection.S3Prefix); err != nil {
		return Collection{}, err
	}

	return collection, putEntity(collection)
}

func getCollection(id string) (Collection, error) {
	if !strings.HasPrefix(id, "COLLECTION#") {
		id = "COLLECTION#" + id
	}
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key:       map[string]*dynamodb.AttributeValue{"id": {S: aws.String(id)}},
	})
	if err != nil {
		return Collection{}, err
	}
	if result.Item == nil {
		return Collection{}, fmt.Errorf("collection not found")
	}
	var collection Collection
	if err := dynamodbattribute.UnmarshalMap(result.Item, &collection); err != nil {
		return Collection{}, err
	}
	if collection.EntityType != "collection" {
		return Collection{}, fmt.Errorf("collection not found")
	}
	return collection, nil
}

func getCollectionByKey(collectionKey string) (Collection, error) {
	return getCollection(collectionKey)
}

func updateCollection(id string, req UpdateCollectionRequest) (Collection, int, error) {
	collection, err := getCollection(id)
	if err != nil {
		return Collection{}, 0, err
	}
	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return Collection{}, 0, fmt.Errorf("collection name is required")
		}
		collection.Name = name
	}
	if req.SpreadDefaultPercent != nil {
		collection.SpreadDefaultPercent = percentageValue(req.SpreadDefaultPercent)
	}
	if req.CouponCode != nil {
		collection.CouponCode = normalizeCouponCode(*req.CouponCode)
	}
	if req.CouponSpreadReductionPercent != nil {
		collection.CouponSpreadReductionPercent = percentageValue(req.CouponSpreadReductionPercent)
	}
	if req.Coupons != nil {
		coupons, err := normalizeCollectionCoupons(*req.Coupons, "", nil)
		if err != nil {
			return Collection{}, 0, err
		}
		collection.Coupons = coupons
		if len(coupons) > 0 {
			collection.CouponCode = coupons[0].Code
			collection.CouponSpreadReductionPercent = coupons[0].SpreadReductionPercent
		} else {
			collection.CouponCode = ""
			collection.CouponSpreadReductionPercent = 0
		}
	}
	if req.CreditColoreMaxAmount != nil {
		collection.CreditColoreMaxAmount = moneyValue(req.CreditColoreMaxAmount)
	}
	if req.DisplayStartAt != nil {
		collection.DisplayStartAt = strings.TrimSpace(*req.DisplayStartAt)
	}
	if req.DisplayEndAt != nil {
		collection.DisplayEndAt = strings.TrimSpace(*req.DisplayEndAt)
	}
	if req.HideFromCatalog != nil {
		collection.HideFromCatalog = *req.HideFromCatalog
	}
	collection.UpdatedAt = time.Now().Format(time.RFC3339)
	if err := putEntity(collection); err != nil {
		return Collection{}, 0, err
	}
	updatedCount, err := recalculateCollectionProducts(collection)
	if err != nil {
		return Collection{}, 0, err
	}
	return collection, updatedCount, nil
}

func recalculateCollectionProducts(collection Collection) (int, error) {
	products, err := getAllProductsByCollectionKey(collection.CollectionKey)
	if err != nil {
		return 0, err
	}
	applyCollectionToProducts(products, collection, time.Now().Format(time.RFC3339))
	if err := putEntitiesBatch(products); err != nil {
		return 0, err
	}
	return len(products), nil
}

func applyCollectionToProducts(products []Product, collection Collection, now string) {
	for index := range products {
		if products[index].CostPrice <= 0 {
			products[index].CostPrice = products[index].Price
			products[index].CostPriceRaw = strconv.FormatFloat(products[index].CostPrice, 'f', 2, 64)
		}
		products[index].Collection = collection.Name
		products[index].SpreadPercent = collection.SpreadDefaultPercent
		products[index].SpreadIsDefault = true
		products[index].Price = calculateSpreadPrice(products[index].CostPrice, collection.SpreadDefaultPercent)
		products[index].ReleaseDate = collection.DisplayStartAt
		products[index].DisplayStartAt = collection.DisplayStartAt
		products[index].FinalizationDate = collection.DisplayEndAt
		products[index].DisplayEndAt = collection.DisplayEndAt
		products[index].HideFromCatalog = collection.HideFromCatalog
		products[index].UpdatedAt = now
	}
}

func getAllProductsByCollectionKey(collectionKey string) ([]Product, error) {
	products := []Product{}
	input := &dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		IndexName:              aws.String("collection-index"),
		KeyConditionExpression: aws.String("collection_key = :collection_key"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":collection_key": {S: aws.String(collectionKey)},
		},
	}
	for {
		result, err := dynamoClient.Query(input)
		if err != nil {
			return nil, err
		}
		for _, item := range result.Items {
			var product Product
			if err := dynamodbattribute.UnmarshalMap(item, &product); err == nil && product.EntityType == "product" {
				products = append(products, product)
			}
		}
		if len(result.LastEvaluatedKey) == 0 {
			break
		}
		input.ExclusiveStartKey = result.LastEvaluatedKey
	}
	return products, nil
}

func createProduct(req CreateProductRequest) (Product, error) {
	product, err := buildProduct(req)
	if err != nil {
		return Product{}, err
	}

	if err := ensureProductS3Prefixes(product); err != nil {
		return Product{}, err
	}

	return product, putEntity(product)
}

func buildProduct(req CreateProductRequest) (Product, error) {
	brandKey := normalizeBrand(firstNonEmpty(req.Brand, req.NomeTabela))
	if brandKey == "" {
		return Product{}, fmt.Errorf("brand is required")
	}

	year := strings.TrimSpace(req.Year)
	if year == "" {
		year = strconv.Itoa(time.Now().Year())
	}

	collectionName := strings.TrimSpace(req.Collection)
	collectionSlug := slugify(firstNonEmpty(req.CollectionSlug, collectionName))
	if collectionSlug == "" {
		return Product{}, fmt.Errorf("collection is required")
	}

	productID := strings.TrimSpace(req.ProductID)
	if productID == "" {
		productID = strings.TrimSpace(req.ID)
	}
	if productID == "" {
		return Product{}, fmt.Errorf("produto_id is required")
	}

	costPrice, costPriceRaw := parsePrice(req.CostPrice)
	if costPriceRaw == "" {
		costPrice, costPriceRaw = parsePrice(req.PrecoCusto)
	}
	if costPriceRaw == "" {
		costPrice, costPriceRaw = parsePrice(req.Price)
	}
	if costPriceRaw == "" {
		costPrice, costPriceRaw = parsePrice(req.Preco)
	}
	if costPrice <= 0 {
		return Product{}, fmt.Errorf("cost price must be greater than zero")
	}
	collectionKey := buildCollectionKey(brandKey, year, collectionSlug)
	collection, err := getCollectionByKey(collectionKey)
	if err != nil {
		return Product{}, err
	}
	spreadPercent := collection.SpreadDefaultPercent
	spreadIsDefault := true
	if req.SpreadPercent != nil {
		spreadPercent = percentageValue(req.SpreadPercent)
		spreadIsDefault = false
	}
	price := calculateSpreadPrice(costPrice, spreadPercent)

	description := firstNonEmpty(req.Description, req.Descricao)
	category := strings.TrimSpace(req.Category)
	productType := firstNonEmpty(req.Type, category)
	if category == "" {
		category = "produto"
	}
	if productType == "" {
		productType = category
	}

	size := req.Size
	if len(size) == 0 && len(req.SizesArray) > 0 {
		size = sizeValuesToStrings(req.SizesArray)
	}
	if len(size) == 0 && strings.TrimSpace(req.SizeOriginal) != "" {
		size = []string{strings.TrimSpace(req.SizeOriginal)}
	}
	if len(size) == 0 {
		size = []string{defaultSize}
	}
	sizeOriginal := strings.TrimSpace(req.SizeOriginal)
	if sizeOriginal == "" && len(size) == 1 && strings.EqualFold(size[0], defaultSize) {
		sizeOriginal = defaultSize
	}
	colors := normalizeProductColors(req.Colors)

	s3Prefix := buildS3Prefix(brandKey, year, collectionSlug)
	imageNames := mergeStrings(req.Imagem, req.Images)
	if req.Image != "" {
		imageNames = appendIfMissing(imageNames, req.Image)
	}
	if req.ImageFileName != "" {
		imageNames = appendIfMissing(imageNames, req.ImageFileName)
	}

	if req.ImageBase64 != "" {
		fileName := firstNonEmpty(
			req.ImageFileName,
			imageFileName(req.UUID, productID, size, sizeOriginal, nextImageSequence(imageNames), req.ImageContentType),
		)
		if err := uploadImage(s3Prefix+fileName, req.ImageBase64, req.ImageContentType); err != nil {
			return Product{}, err
		}
		imageNames = appendIfMissing(imageNames, fileName)
	}

	for _, image := range req.UploadImages {
		fileName := strings.TrimSpace(image.FileName)
		if fileName == "" {
			fileName = imageFileName(
				req.UUID,
				productID,
				size,
				sizeOriginal,
				nextImageSequence(imageNames),
				image.ContentType,
			)
		}
		if image.ContentBase64 != "" {
			if err := uploadImage(s3Prefix+fileName, image.ContentBase64, image.ContentType); err != nil {
				return Product{}, err
			}
		}
		imageNames = appendIfMissing(imageNames, fileName)
	}

	imageURLs := make([]string, 0, len(imageNames))
	imageKeys := make([]string, 0, len(imageNames))
	for _, imageName := range imageNames {
		imageKey := s3Prefix + path.Base(imageName)
		imageKeys = append(imageKeys, imageKey)
		imageURLs = append(imageURLs, imageURL(imageKey))
	}
	if req.ImageURL != "" && len(imageURLs) == 0 {
		imageURLs = append(imageURLs, req.ImageURL)
	}

	id := firstNonEmpty(req.ID, req.UUID)
	if id == "" {
		id = generateID()
	}

	now := time.Now().Format(time.RFC3339)
	product := Product{
		ID:               id,
		EntityType:       "product",
		UUID:             strings.TrimSpace(req.UUID),
		Number:           req.Number,
		ProductID:        productID,
		Name:             firstNonEmpty(req.Name, description, productID),
		Description:      description,
		Price:            price,
		CostPrice:        costPrice,
		CostPriceRaw:     costPriceRaw,
		SpreadPercent:    spreadPercent,
		SpreadIsDefault:  spreadIsDefault,
		Category:         category,
		Type:             productType,
		TypeKey:          normalizeKey(productType),
		Brand:            brandKey,
		BrandKey:         brandKey,
		Collection:       firstNonEmpty(collectionName, collectionSlug),
		CollectionSlug:   collectionSlug,
		Year:             year,
		CollectionKey:    collectionKey,
		ReleaseDate:      req.ReleaseDate,
		FinalizationDate: req.FinalizationDate,
		DisplayStartAt:   req.DisplayStartAt,
		DisplayEndAt:     req.DisplayEndAt,
		HideFromCatalog:  collection.HideFromCatalog,
		Size:             size,
		AgeGroup:         req.AgeGroup,
		SizeOriginal:     sizeOriginal,
		SizeStart:        sizeValueToInt(req.SizeStart),
		SizeEnd:          sizeValueToInt(req.SizeEnd),
		SizesArray:       sizeValuesToInts(req.SizesArray),
		Colors:           colors,
		Image:            firstString(imageURLs),
		ImageURL:         firstString(imageURLs),
		Images:           imageNames,
		ImageURLs:        imageURLs,
		ImageBucket:      imageBucket,
		ImageKeys:        imageKeys,
		S3Prefix:         s3Prefix,
		Stock:            req.Stock,
		IsActive:         true,
		IsNew:            boolValue(req.IsNew, req.IsNewSnake, false),
		IsPromotion:      boolValue(req.IsPromotion, req.IsPromotionSnake, false),
		CreatedAt:        now,
		UpdatedAt:        now,
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}
	if req.IsNew != nil || req.IsNewSnake != nil {
		product.IsNew = boolValue(req.IsNew, req.IsNewSnake, false)
	}
	if req.IsPromotion != nil || req.IsPromotionSnake != nil {
		product.IsPromotion = boolValue(req.IsPromotion, req.IsPromotionSnake, false)
	}

	return product, nil
}

func updateProduct(id string, req CreateProductRequest) (Product, error) {
	product, err := getProduct(id)
	if err != nil {
		return Product{}, err
	}

	if req.UUID != "" {
		product.UUID = strings.TrimSpace(req.UUID)
	}
	if req.Number != 0 {
		product.Number = req.Number
	}
	if req.ProductID != "" {
		product.ProductID = strings.TrimSpace(req.ProductID)
	}
	if req.Name != "" || req.Description != "" || req.Descricao != "" {
		description := firstNonEmpty(req.Description, req.Descricao, req.Name)
		product.Name = firstNonEmpty(req.Name, description, product.Name)
		product.Description = description
	}
	costChanged := req.CostPrice != nil || req.PrecoCusto != nil || req.Price != nil || req.Preco != nil
	if costChanged {
		price, priceRaw := parsePrice(req.CostPrice)
		if priceRaw == "" {
			price, priceRaw = parsePrice(req.PrecoCusto)
		}
		if priceRaw == "" {
			price, priceRaw = parsePrice(req.Price)
		}
		if priceRaw == "" {
			price, priceRaw = parsePrice(req.Preco)
		}
		product.CostPrice = price
		product.CostPriceRaw = priceRaw
	}
	if product.CostPrice <= 0 {
		product.CostPrice = product.Price
		product.CostPriceRaw = strconv.FormatFloat(product.CostPrice, 'f', 2, 64)
	}
	if req.Category != "" {
		product.Category = strings.TrimSpace(req.Category)
	}
	if product.Category == "" {
		product.Category = "produto"
	}
	if req.Type != "" {
		product.Type = strings.TrimSpace(req.Type)
	}
	if product.Type == "" {
		product.Type = product.Category
	}
	product.TypeKey = normalizeKey(product.Type)
	if req.Brand != "" || req.NomeTabela != "" {
		product.BrandKey = normalizeBrand(firstNonEmpty(req.Brand, req.NomeTabela))
		product.Brand = product.BrandKey
	}
	if req.Year != "" {
		product.Year = strings.TrimSpace(req.Year)
	}
	if req.Collection != "" || req.CollectionSlug != "" {
		product.Collection = firstNonEmpty(strings.TrimSpace(req.Collection), product.Collection)
		product.CollectionSlug = slugify(firstNonEmpty(req.CollectionSlug, req.Collection, product.CollectionSlug))
	}
	if product.CollectionSlug == "" {
		product.CollectionSlug = slugify(product.Collection)
	}
	product.CollectionKey = buildCollectionKey(product.BrandKey, product.Year, product.CollectionSlug)
	product.S3Prefix = buildS3Prefix(product.BrandKey, product.Year, product.CollectionSlug)
	if req.SpreadPercent != nil {
		product.SpreadPercent = percentageValue(req.SpreadPercent)
		product.SpreadIsDefault = false
	}
	if collection, err := getCollectionByKey(product.CollectionKey); err == nil {
		product.HideFromCatalog = collection.HideFromCatalog
		if req.SpreadPercent == nil && product.SpreadPercent == 0 {
			product.SpreadPercent = collection.SpreadDefaultPercent
			product.SpreadIsDefault = true
		}
	}
	if costChanged || req.SpreadPercent != nil {
		product.Price = calculateSpreadPrice(product.CostPrice, product.SpreadPercent)
	}

	if req.ReleaseDate != "" {
		product.ReleaseDate = req.ReleaseDate
	}
	if req.FinalizationDate != "" {
		product.FinalizationDate = req.FinalizationDate
	}
	if req.DisplayStartAt != "" {
		product.DisplayStartAt = req.DisplayStartAt
	}
	if req.DisplayEndAt != "" {
		product.DisplayEndAt = req.DisplayEndAt
	}
	if len(req.Size) > 0 {
		product.Size = req.Size
	} else if len(req.SizesArray) > 0 {
		product.Size = sizeValuesToStrings(req.SizesArray)
	}
	if req.SizeOriginal != "" {
		product.SizeOriginal = req.SizeOriginal
		if len(product.Size) == 0 {
			product.Size = []string{strings.TrimSpace(req.SizeOriginal)}
		}
	}
	if sizeStart := sizeValueToInt(req.SizeStart); sizeStart != 0 {
		product.SizeStart = sizeStart
	}
	if sizeEnd := sizeValueToInt(req.SizeEnd); sizeEnd != 0 {
		product.SizeEnd = sizeEnd
	}
	if len(req.SizesArray) > 0 {
		product.SizesArray = sizeValuesToInts(req.SizesArray)
	}
	if len(req.Colors) > 0 {
		product.Colors = normalizeProductColors(req.Colors)
	}
	applyProductOptionDefaults(&product)
	if req.Stock != 0 {
		product.Stock = req.Stock
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}
	if req.IsNew != nil || req.IsNewSnake != nil {
		product.IsNew = boolValue(req.IsNew, req.IsNewSnake, false)
	}
	if req.IsPromotion != nil || req.IsPromotionSnake != nil {
		product.IsPromotion = boolValue(req.IsPromotion, req.IsPromotionSnake, false)
	}

	imageChanged := len(req.Imagem) > 0 || len(req.Images) > 0 || req.Image != "" || req.ImageFileName != "" || req.ImageBase64 != "" || len(req.UploadImages) > 0 || req.ImageURL != ""
	imageNames := product.Images
	if len(req.Imagem) > 0 || len(req.Images) > 0 || req.Image != "" {
		imageNames = mergeStrings(req.Imagem, req.Images)
	}
	if req.Image != "" {
		imageNames = appendIfMissing(imageNames, req.Image)
	}
	if req.ImageFileName != "" {
		imageNames = appendIfMissing(imageNames, req.ImageFileName)
	}
	if req.ImageBase64 != "" {
		fileName := firstNonEmpty(
			req.ImageFileName,
			imageFileName(
				product.UUID,
				product.ProductID,
				product.Size,
				product.SizeOriginal,
				nextImageSequence(imageNames),
				req.ImageContentType,
			),
		)
		if err := uploadImage(product.S3Prefix+fileName, req.ImageBase64, req.ImageContentType); err != nil {
			return Product{}, err
		}
		imageNames = appendIfMissing(imageNames, fileName)
	}
	for _, image := range req.UploadImages {
		fileName := strings.TrimSpace(image.FileName)
		if fileName == "" {
			fileName = imageFileName(
				product.UUID,
				product.ProductID,
				product.Size,
				product.SizeOriginal,
				nextImageSequence(imageNames),
				image.ContentType,
			)
		}
		if image.ContentBase64 != "" {
			if err := uploadImage(product.S3Prefix+fileName, image.ContentBase64, image.ContentType); err != nil {
				return Product{}, err
			}
		}
		imageNames = appendIfMissing(imageNames, fileName)
	}
	if imageChanged {
		product.Images = imageNames
		product.ImageURLs = make([]string, 0, len(imageNames))
		product.ImageKeys = make([]string, 0, len(imageNames))
		for _, imageName := range imageNames {
			imageKey := product.S3Prefix + path.Base(imageName)
			product.ImageKeys = append(product.ImageKeys, imageKey)
			product.ImageURLs = append(product.ImageURLs, imageURL(imageKey))
		}
		if req.ImageURL != "" && len(product.ImageURLs) == 0 {
			product.ImageURLs = append(product.ImageURLs, req.ImageURL)
		}
		product.Image = firstString(product.ImageURLs)
		product.ImageURL = firstString(product.ImageURLs)
	}
	product.ImageBucket = imageBucket
	product.UpdatedAt = time.Now().Format(time.RFC3339)

	if err := ensureS3Prefix(product.BrandKey + "/"); err != nil {
		return Product{}, err
	}
	if err := ensureS3Prefix(path.Join(product.BrandKey, product.Year) + "/"); err != nil {
		return Product{}, err
	}
	if err := ensureS3Prefix(product.S3Prefix); err != nil {
		return Product{}, err
	}

	return product, putEntity(product)
}

func deleteProduct(id string) error {
	_, err := dynamoClient.DeleteItem(&dynamodb.DeleteItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(id)},
		},
	})
	return err
}

func parseManageProductImageRequest(request events.APIGatewayProxyRequest) (ManageProductImageRequest, error) {
	var req ManageProductImageRequest
	if strings.TrimSpace(request.Body) != "" {
		if err := json.Unmarshal([]byte(request.Body), &req); err != nil {
			return ManageProductImageRequest{}, fmt.Errorf("invalid request")
		}
	}
	req.ImageName = firstNonEmpty(req.ImageName, request.QueryStringParameters["image_name"])
	req.ImageKey = firstNonEmpty(req.ImageKey, request.QueryStringParameters["image_key"])
	req.ImageURL = firstNonEmpty(req.ImageURL, request.QueryStringParameters["image_url"])
	if manageProductImageTarget(req) == "" {
		return ManageProductImageRequest{}, fmt.Errorf("image_name is required")
	}
	return req, nil
}

func manageProductImageTarget(req ManageProductImageRequest) string {
	return firstNonEmpty(req.ImageName, req.ImageKey, req.ImageURL)
}

func setPrimaryProductImage(product Product, target string) (Product, error) {
	identifier := productImageIdentifier(target)
	if identifier == "" {
		return Product{}, fmt.Errorf("image_name is required")
	}

	var found bool
	product.Images, found = moveProductImageToFront(product.Images, identifier)
	var moved bool
	product.ImageKeys, moved = moveProductImageToFront(product.ImageKeys, identifier)
	found = found || moved
	product.ImageURLs, moved = moveProductImageToFront(product.ImageURLs, identifier)
	found = found || moved
	if !found && productImageIdentifier(product.Image) != identifier && productImageIdentifier(product.ImageURL) != identifier {
		return Product{}, fmt.Errorf("product image not found")
	}

	refreshProductMainImage(&product)
	product.UpdatedAt = time.Now().Format(time.RFC3339)
	return product, nil
}

func removeProductImage(product Product, target string) (Product, string, error) {
	identifier := productImageIdentifier(target)
	if identifier == "" {
		return Product{}, "", fmt.Errorf("image_name is required")
	}
	if !productContainsImage(product, identifier) {
		return Product{}, "", fmt.Errorf("product image not found")
	}
	if productImageCount(product) <= 1 {
		return Product{}, "", fmt.Errorf("a product must keep at least one image")
	}

	imageKey := matchingProductImageValue(product.ImageKeys, identifier)
	if imageKey == "" {
		imageKey = product.S3Prefix + identifier
	}

	product.Images, _ = removeProductImageValue(product.Images, identifier)
	product.ImageKeys, _ = removeProductImageValue(product.ImageKeys, identifier)
	product.ImageURLs, _ = removeProductImageValue(product.ImageURLs, identifier)
	refreshProductMainImage(&product)
	product.UpdatedAt = time.Now().Format(time.RFC3339)
	return product, imageKey, nil
}

func productImageCount(product Product) int {
	identifiers := map[string]struct{}{}
	for _, value := range mergeStrings(
		product.Images,
		product.ImageKeys,
		product.ImageURLs,
		[]string{product.Image, product.ImageURL},
	) {
		if identifier := productImageIdentifier(value); identifier != "" {
			identifiers[identifier] = struct{}{}
		}
	}
	return len(identifiers)
}

func productContainsImage(product Product, identifier string) bool {
	return matchingProductImageValue(
		mergeStrings(
			product.Images,
			product.ImageKeys,
			product.ImageURLs,
			[]string{product.Image, product.ImageURL},
		),
		identifier,
	) != ""
}

func productImageIdentifier(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	if parsedURL, err := url.Parse(value); err == nil && parsedURL.Path != "" {
		value = parsedURL.Path
	}
	if decodedValue, err := url.PathUnescape(value); err == nil {
		value = decodedValue
	}
	identifier := path.Base(strings.TrimSpace(value))
	if identifier == "." || identifier == "/" {
		return ""
	}
	return identifier
}

func matchingProductImageValue(values []string, identifier string) string {
	for _, value := range values {
		if productImageIdentifier(value) == identifier {
			return value
		}
	}
	return ""
}

func moveProductImageToFront(values []string, identifier string) ([]string, bool) {
	matchIndex := -1
	for index, value := range values {
		if productImageIdentifier(value) == identifier {
			matchIndex = index
			break
		}
	}
	if matchIndex < 0 {
		return values, false
	}
	if matchIndex == 0 {
		return values, true
	}
	reordered := make([]string, 0, len(values))
	reordered = append(reordered, values[matchIndex])
	reordered = append(reordered, values[:matchIndex]...)
	reordered = append(reordered, values[matchIndex+1:]...)
	return reordered, true
}

func removeProductImageValue(values []string, identifier string) ([]string, bool) {
	filtered := make([]string, 0, len(values))
	removed := false
	for _, value := range values {
		if productImageIdentifier(value) == identifier {
			removed = true
			continue
		}
		filtered = append(filtered, value)
	}
	return filtered, removed
}

func refreshProductMainImage(product *Product) {
	if len(product.ImageURLs) == 0 && len(product.ImageKeys) > 0 {
		product.ImageURLs = make([]string, 0, len(product.ImageKeys))
		for _, imageKey := range product.ImageKeys {
			product.ImageURLs = append(product.ImageURLs, imageURL(imageKey))
		}
	}
	product.ImageURL = firstString(product.ImageURLs)
	product.Image = product.ImageURL
	if product.Image == "" {
		product.Image = firstString(product.Images)
	}
}

func applyProductDefaultsFromQuery(req *CreateProductRequest, query map[string]string) {
	if req.Brand == "" {
		req.Brand = query["brand"]
	}
	if req.Year == "" {
		req.Year = query["year"]
	}
	if req.Collection == "" {
		req.Collection = firstNonEmpty(query["collection"], query["colecao"])
	}
	if req.CollectionSlug == "" {
		req.CollectionSlug = query["collection_slug"]
	}
	if req.Category == "" {
		req.Category = query["category"]
	}
	if req.Type == "" {
		req.Type = query["type"]
	}
}

func parseImportProductsFileRequest(body string) (ImportProductsFileRequest, []CreateProductRequest, error) {
	if strings.TrimSpace(body) == "" {
		return ImportProductsFileRequest{}, nil, fmt.Errorf("file body is required")
	}

	if strings.HasPrefix(strings.TrimSpace(body), "[") {
		products, err := decodeProductFileJSON([]byte(body))
		return ImportProductsFileRequest{}, products, err
	}

	var req ImportProductsFileRequest
	if err := json.Unmarshal([]byte(body), &req); err != nil {
		return ImportProductsFileRequest{}, nil, fmt.Errorf("invalid request")
	}
	if len(req.Products) > 0 {
		return req, req.Products, nil
	}

	contentBase64 := firstNonEmpty(req.ContentBase64, req.FileBase64)
	if contentBase64 == "" {
		return ImportProductsFileRequest{}, nil, fmt.Errorf("content_base64 is required")
	}
	decodedBytes, err := decodeBase64Payload(contentBase64)
	if err != nil {
		return ImportProductsFileRequest{}, nil, fmt.Errorf("invalid product file base64")
	}

	products, err := decodeProductFileJSON(decodedBytes)
	if err != nil {
		return ImportProductsFileRequest{}, nil, err
	}
	return req, products, nil
}

func decodeProductFileJSON(data []byte) ([]CreateProductRequest, error) {
	var products []CreateProductRequest
	if err := json.Unmarshal(data, &products); err != nil {
		return nil, fmt.Errorf("product file JSON is invalid: %s", err.Error())
	}
	if len(products) == 0 {
		return nil, fmt.Errorf("product file is empty")
	}
	return products, nil
}

func applyImportProductDefaults(req *CreateProductRequest, defaults ImportProductsFileRequest) {
	if req.Brand == "" {
		req.Brand = defaults.Brand
	}
	if req.Year == "" {
		req.Year = defaults.Year
	}
	if req.Collection == "" {
		req.Collection = defaults.Collection
	}
	if req.CollectionSlug == "" {
		req.CollectionSlug = defaults.CollectionSlug
	}
}

func getProduct(id string) (Product, error) {
	result, err := dynamoClient.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(tableName),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(id)},
		},
	})
	if err != nil {
		return Product{}, err
	}
	if result.Item == nil && !strings.HasPrefix(id, "PRODUCT#") {
		result, err = dynamoClient.GetItem(&dynamodb.GetItemInput{
			TableName: aws.String(tableName),
			Key: map[string]*dynamodb.AttributeValue{
				"id": {S: aws.String("PRODUCT#" + id)},
			},
		})
		if err != nil {
			return Product{}, err
		}
	}
	if result.Item == nil {
		return Product{}, fmt.Errorf("product not found")
	}

	var product Product
	if err := dynamodbattribute.UnmarshalMap(result.Item, &product); err != nil {
		return Product{}, err
	}
	if product.EntityType != "product" {
		return Product{}, fmt.Errorf("product not found")
	}
	if productIsActive(result.Item) {
		product.IsActive = true
	}
	return product, nil
}

type ProductQuery struct {
	Category        string
	Type            string
	ProductID       string
	Brand           string
	Year            string
	Collection      string
	IsNew           *bool
	IsPromotion     *bool
	IncludeInactive bool
	IncludeCost     bool
	CatalogOnly     bool
	Limit           int
	LastKey         string
}

func getProducts(query ProductQuery) (ProductsListResponse, error) {
	input := &dynamodb.QueryInput{
		TableName: aws.String(tableName),
		Limit:     aws.Int64(int64(query.Limit)),
	}

	expressionValues := map[string]*dynamodb.AttributeValue{}
	filterExpressions := []string{"entity_type = :entity_type"}
	expressionValues[":entity_type"] = &dynamodb.AttributeValue{S: aws.String("product")}
	if !query.IncludeInactive {
		filterExpressions = append(filterExpressions, "(attribute_not_exists(is_active) OR is_active = :is_active)")
		expressionValues[":is_active"] = &dynamodb.AttributeValue{BOOL: aws.Bool(true)}
	}
	if query.CatalogOnly {
		filterExpressions = append(filterExpressions, "(attribute_not_exists(hidden_from_catalog) OR hidden_from_catalog = :hidden_from_catalog)")
		expressionValues[":hidden_from_catalog"] = &dynamodb.AttributeValue{BOOL: aws.Bool(false)}
	}

	if query.ProductID != "" {
		input.IndexName = aws.String("product-id-index")
		input.KeyConditionExpression = aws.String("product_id = :product_id")
		expressionValues[":product_id"] = &dynamodb.AttributeValue{S: aws.String(query.ProductID)}
	} else if query.Brand != "" && query.Year != "" && query.Collection != "" {
		input.IndexName = aws.String("collection-index")
		input.KeyConditionExpression = aws.String("collection_key = :collection_key")
		expressionValues[":collection_key"] = &dynamodb.AttributeValue{S: aws.String(buildCollectionKey(normalizeBrand(query.Brand), query.Year, slugify(query.Collection)))}
	} else if query.Type != "" {
		input.IndexName = aws.String("type-index")
		input.KeyConditionExpression = aws.String("type_key = :type_key")
		expressionValues[":type_key"] = &dynamodb.AttributeValue{S: aws.String(normalizeKey(query.Type))}
	} else if query.Brand != "" {
		input.IndexName = aws.String("brand-index")
		input.KeyConditionExpression = aws.String("brand_key = :brand_key")
		expressionValues[":brand_key"] = &dynamodb.AttributeValue{S: aws.String(normalizeBrand(query.Brand))}
	} else if query.Category != "" {
		input.IndexName = aws.String("category-index")
		input.KeyConditionExpression = aws.String("category = :category")
		expressionValues[":category"] = &dynamodb.AttributeValue{S: aws.String(query.Category)}
	} else {
		input.IndexName = aws.String("entity-type-index")
		input.KeyConditionExpression = aws.String("entity_type = :entity_type")
		filterExpressions = []string{}
		if !query.IncludeInactive {
			filterExpressions = append(filterExpressions, "(attribute_not_exists(is_active) OR is_active = :is_active)")
		}
		if query.CatalogOnly {
			filterExpressions = append(filterExpressions, "(attribute_not_exists(hidden_from_catalog) OR hidden_from_catalog = :hidden_from_catalog)")
		}
	}

	if query.Year != "" && !(query.Brand != "" && query.Collection != "") {
		filterExpressions = append(filterExpressions, "#year = :year")
		expressionValues[":year"] = &dynamodb.AttributeValue{S: aws.String(query.Year)}
		input.ExpressionAttributeNames = map[string]*string{"#year": aws.String("year")}
	}
	if query.Collection != "" && !(query.Brand != "" && query.Year != "") {
		filterExpressions = append(filterExpressions, "collection_slug = :collection_slug")
		expressionValues[":collection_slug"] = &dynamodb.AttributeValue{S: aws.String(slugify(query.Collection))}
	}
	if query.IsNew != nil {
		filterExpressions = append(filterExpressions, "is_new = :is_new")
		expressionValues[":is_new"] = &dynamodb.AttributeValue{BOOL: query.IsNew}
	}
	if query.IsPromotion != nil {
		filterExpressions = append(filterExpressions, "is_promotion = :is_promotion")
		expressionValues[":is_promotion"] = &dynamodb.AttributeValue{BOOL: query.IsPromotion}
	}

	if len(filterExpressions) > 0 {
		input.FilterExpression = aws.String(strings.Join(filterExpressions, " AND "))
	}
	input.ExpressionAttributeValues = expressionValues

	if query.LastKey != "" {
		exclusiveStartKey, err := decodeLastEvaluatedKey(query.LastKey)
		if err != nil {
			return ProductsListResponse{}, err
		}
		input.ExclusiveStartKey = exclusiveStartKey
	}

	result, err := dynamoClient.Query(input)
	if err != nil {
		return ProductsListResponse{}, err
	}

	products := []Product{}
	for _, item := range result.Items {
		var product Product
		if err := dynamodbattribute.UnmarshalMap(item, &product); err == nil && product.EntityType == "product" {
			if productIsActive(item) {
				product.IsActive = true
			}
			if !query.IncludeCost {
				product = sanitizeProductForCustomer(product)
			}
			products = append(products, product)
		}
	}

	response := ProductsListResponse{Products: products}
	if len(result.LastEvaluatedKey) > 0 {
		response.LastEvaluatedKey = encodeLastEvaluatedKey(result.LastEvaluatedKey)
	}
	return response, nil
}

func sanitizeProductForCustomer(product Product) Product {
	applyProductOptionDefaults(&product)
	product.CostPrice = 0
	product.CostPriceRaw = ""
	product.SpreadPercent = 0
	product.SpreadIsDefault = false
	return product
}

func productIsActive(item map[string]*dynamodb.AttributeValue) bool {
	value, exists := item["is_active"]
	if !exists || value == nil || value.NULL != nil && *value.NULL {
		return true
	}
	return value.BOOL == nil || *value.BOOL
}

func boolValue(primary *bool, secondary *bool, fallback bool) bool {
	if primary != nil {
		return *primary
	}
	if secondary != nil {
		return *secondary
	}
	return fallback
}

func listBrands() ([]Brand, error) {
	result, err := dynamoClient.Query(&dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		IndexName:              aws.String("entity-type-index"),
		KeyConditionExpression: aws.String("entity_type = :entity_type"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":entity_type": {S: aws.String("brand")},
		},
	})
	if err != nil {
		return nil, err
	}

	brands := []Brand{}
	for _, item := range result.Items {
		var brand Brand
		if err := dynamodbattribute.UnmarshalMap(item, &brand); err == nil {
			brands = append(brands, brand)
		}
	}
	return brands, nil
}

func listCollections(brand string, year string) ([]Collection, error) {
	input := &dynamodb.QueryInput{
		TableName:              aws.String(tableName),
		IndexName:              aws.String("entity-type-index"),
		KeyConditionExpression: aws.String("entity_type = :entity_type"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":entity_type": {S: aws.String("collection")},
		},
	}

	filters := []string{}
	if brand != "" {
		filters = append(filters, "brand_key = :brand_key")
		input.ExpressionAttributeValues[":brand_key"] = &dynamodb.AttributeValue{S: aws.String(normalizeBrand(brand))}
	}
	if year != "" {
		filters = append(filters, "#year = :year")
		input.ExpressionAttributeValues[":year"] = &dynamodb.AttributeValue{S: aws.String(year)}
		input.ExpressionAttributeNames = map[string]*string{"#year": aws.String("year")}
	}
	if len(filters) > 0 {
		input.FilterExpression = aws.String(strings.Join(filters, " AND "))
	}

	result, err := dynamoClient.Query(input)
	if err != nil {
		return nil, err
	}

	collections := []Collection{}
	for _, item := range result.Items {
		var collection Collection
		if err := dynamodbattribute.UnmarshalMap(item, &collection); err == nil {
			collections = append(collections, collection)
		}
	}
	return collections, nil
}

func putEntity(entity interface{}) error {
	item, err := dynamodbattribute.MarshalMap(entity)
	if err != nil {
		return err
	}

	_, err = dynamoClient.PutItem(&dynamodb.PutItemInput{
		TableName: aws.String(tableName),
		Item:      item,
	})
	return err
}

func putEntitiesBatch(products []Product) error {
	for start := 0; start < len(products); start += 25 {
		end := start + 25
		if end > len(products) {
			end = len(products)
		}

		writeRequests := make([]*dynamodb.WriteRequest, 0, end-start)
		for _, product := range products[start:end] {
			item, err := dynamodbattribute.MarshalMap(product)
			if err != nil {
				return err
			}
			writeRequests = append(writeRequests, &dynamodb.WriteRequest{
				PutRequest: &dynamodb.PutRequest{Item: item},
			})
		}

		pending := map[string][]*dynamodb.WriteRequest{tableName: writeRequests}
		for attempt := 0; len(pending[tableName]) > 0 && attempt < 5; attempt++ {
			result, err := dynamoClient.BatchWriteItem(&dynamodb.BatchWriteItemInput{RequestItems: pending})
			if err != nil {
				return err
			}
			pending = result.UnprocessedItems
		}
		if len(pending[tableName]) > 0 {
			return fmt.Errorf("dynamodb left %d product writes unprocessed", len(pending[tableName]))
		}
	}
	return nil
}

func ensureProductS3Prefixes(product Product) error {
	if err := ensureS3Prefix(product.BrandKey + "/"); err != nil {
		return err
	}
	if err := ensureS3Prefix(path.Join(product.BrandKey, product.Year) + "/"); err != nil {
		return err
	}
	return ensureS3Prefix(product.S3Prefix)
}

func ensureProductBatchS3Prefixes(products []Product) error {
	prefixes := map[string]struct{}{}
	for _, product := range products {
		prefixes[product.BrandKey+"/"] = struct{}{}
		prefixes[path.Join(product.BrandKey, product.Year)+"/"] = struct{}{}
		prefixes[product.S3Prefix] = struct{}{}
	}
	for prefix := range prefixes {
		if err := ensureS3Prefix(prefix); err != nil {
			return err
		}
	}
	return nil
}

func ensureS3Prefix(prefix string) error {
	if strings.TrimSpace(prefix) == "" {
		return nil
	}

	_, err := s3Client.PutObject(&s3.PutObjectInput{
		Bucket: aws.String(imageBucket),
		Key:    aws.String(prefix),
		Body:   strings.NewReader(""),
	})
	return err
}

func uploadImage(key string, contentBase64 string, contentType string) error {
	decodedBytes, err := decodeBase64Payload(contentBase64)
	if err != nil {
		return fmt.Errorf("invalid image_base64")
	}

	if contentType == "" {
		contentType = mime.TypeByExtension(path.Ext(key))
	}
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	_, err = s3Client.PutObject(&s3.PutObjectInput{
		Bucket:      aws.String(imageBucket),
		Key:         aws.String(key),
		Body:        bytes.NewReader(decodedBytes),
		ContentType: aws.String(contentType),
	})
	return err
}

func deleteImage(key string) error {
	key = strings.TrimLeft(strings.TrimSpace(key), "/")
	if key == "" {
		return fmt.Errorf("image key is required")
	}
	_, err := s3Client.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(imageBucket),
		Key:    aws.String(key),
	})
	return err
}

func decodeBase64Payload(contentBase64 string) ([]byte, error) {
	data := strings.TrimSpace(contentBase64)
	if comma := strings.Index(data, ","); comma >= 0 {
		data = data[comma+1:]
	}
	return base64.StdEncoding.DecodeString(data)
}

func parsePrice(value interface{}) (float64, string) {
	switch typed := value.(type) {
	case nil:
		return 0, ""
	case string:
		raw := strings.TrimSpace(typed)
		normalized := strings.ReplaceAll(raw, ".", "")
		normalized = strings.ReplaceAll(normalized, ",", ".")
		if strings.Count(raw, ".") == 1 && !strings.Contains(raw, ",") {
			normalized = raw
		}
		price, _ := strconv.ParseFloat(normalized, 64)
		return price, raw
	case float64:
		return typed, strconv.FormatFloat(typed, 'f', -1, 64)
	case int:
		return float64(typed), strconv.Itoa(typed)
	default:
		raw := fmt.Sprintf("%v", value)
		price, _ := strconv.ParseFloat(raw, 64)
		return price, raw
	}
}

func parseLimit(value string, defaultLimit int) int {
	limit := defaultLimit
	if value != "" {
		if parsed, err := strconv.Atoi(value); err == nil && parsed > 0 {
			limit = parsed
		}
	}
	if limit > 100 {
		return 100
	}
	return limit
}

func parseOptionalBool(value string) *bool {
	if strings.TrimSpace(value) == "" {
		return nil
	}

	parsed := strings.EqualFold(value, "true") || value == "1"
	return &parsed
}

func percentageValue(value *float64) float64 {
	if value == nil || *value < 0 {
		return 0
	}
	return roundMoney(*value)
}

func moneyValue(value *float64) float64 {
	if value == nil || *value < 0 {
		return 0
	}
	return roundMoney(*value)
}

func calculateSpreadPrice(costPrice float64, spreadPercent float64) float64 {
	return roundMoney(costPrice * (1 + spreadPercent/100))
}

func roundMoney(value float64) float64 {
	return float64(int(value*100+0.5)) / 100
}

func normalizeCouponCode(value string) string {
	return strings.ToUpper(strings.TrimSpace(value))
}

func normalizeCollectionCoupons(coupons []CollectionCoupon, legacyCode string, legacyReduction *float64) ([]CollectionCoupon, error) {
	if len(coupons) == 0 && strings.TrimSpace(legacyCode) != "" {
		coupons = []CollectionCoupon{{
			Code:                   legacyCode,
			SpreadReductionPercent: percentageValue(legacyReduction),
		}}
	}
	if len(coupons) > 5 {
		return nil, fmt.Errorf("a collection can have at most 5 coupons")
	}

	normalized := make([]CollectionCoupon, 0, len(coupons))
	seen := map[string]struct{}{}
	for _, coupon := range coupons {
		code := normalizeCouponCode(coupon.Code)
		reduction := roundMoney(coupon.SpreadReductionPercent)
		if code == "" && reduction == 0 {
			continue
		}
		if code == "" || reduction <= 0 {
			return nil, fmt.Errorf("coupon code and reduction greater than zero are required")
		}
		if _, exists := seen[code]; exists {
			return nil, fmt.Errorf("coupon code %s is duplicated", code)
		}
		seen[code] = struct{}{}
		normalized = append(normalized, CollectionCoupon{
			Code:                   code,
			SpreadReductionPercent: reduction,
			PaymentMethods:         normalizeCouponPaymentMethods(coupon.PaymentMethods),
		})
	}
	return normalized, nil
}

func normalizeCouponPaymentMethods(values []string) []string {
	allowed := map[string]bool{
		"pix":           true,
		"credit_card":   true,
		"credit_colore": true,
	}
	normalized := make([]string, 0, len(values))
	seen := map[string]bool{}
	for _, value := range values {
		method := strings.ToLower(strings.TrimSpace(value))
		if !allowed[method] || seen[method] {
			continue
		}
		seen[method] = true
		normalized = append(normalized, method)
	}
	return normalized
}

func buildCollectionKey(brand string, year string, collection string) string {
	return normalizeBrand(brand) + "#" + strings.TrimSpace(year) + "#" + slugify(collection)
}

func buildS3Prefix(brand string, year string, collection string) string {
	return path.Join(normalizeBrand(brand), strings.TrimSpace(year), slugify(collection)) + "/"
}

func normalizeBrand(value string) string {
	value = strings.TrimSpace(value)
	value = strings.ReplaceAll(value, "_", "-")
	value = strings.Join(strings.Fields(value), "-")
	return strings.ToUpper(value)
}

func normalizeKey(value string) string {
	return slugify(strings.ToLower(strings.TrimSpace(value)))
}

func slugify(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	replacer := strings.NewReplacer(
		"á", "a", "à", "a", "ã", "a", "â", "a",
		"é", "e", "ê", "e",
		"í", "i",
		"ó", "o", "õ", "o", "ô", "o",
		"ú", "u",
		"ç", "c",
		"_", "-",
	)
	value = replacer.Replace(value)

	var builder strings.Builder
	lastDash := false
	for _, r := range value {
		isAlphaNum := (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9')
		if isAlphaNum {
			builder.WriteRune(r)
			lastDash = false
			continue
		}
		if !lastDash {
			builder.WriteRune('-')
			lastDash = true
		}
	}
	return strings.Trim(builder.String(), "-")
}

func sizeValuesToStrings(values []interface{}) []string {
	result := make([]string, 0, len(values))
	for _, value := range values {
		if text := sizeValueToString(value); text != "" {
			result = append(result, text)
		}
	}
	return result
}

func applyProductOptionDefaults(product *Product) {
	if len(product.Size) == 0 {
		product.Size = []string{defaultSize}
	}
	if strings.TrimSpace(product.SizeOriginal) == "" && len(product.Size) == 1 && strings.EqualFold(product.Size[0], defaultSize) {
		product.SizeOriginal = defaultSize
	}
	product.Colors = normalizeProductColors(product.Colors)
}

func normalizeProductColors(colors []string) []string {
	normalized := make([]string, 0, len(colors))
	seen := map[string]struct{}{}
	for _, color := range colors {
		value := strings.TrimSpace(color)
		if value == "" {
			continue
		}
		key := strings.ToUpper(value)
		if _, exists := seen[key]; exists {
			continue
		}
		seen[key] = struct{}{}
		normalized = append(normalized, value)
	}
	if len(normalized) == 0 {
		return []string{defaultColor}
	}
	return normalized
}

func sizeValuesToInts(values []interface{}) []int {
	result := make([]int, 0, len(values))
	for _, value := range values {
		if parsed := sizeValueToInt(value); parsed != 0 {
			result = append(result, parsed)
		}
	}
	return result
}

func sizeValueToString(value interface{}) string {
	switch typed := value.(type) {
	case nil:
		return ""
	case string:
		return strings.TrimSpace(typed)
	case float64:
		if typed == float64(int(typed)) {
			return strconv.Itoa(int(typed))
		}
		return strconv.FormatFloat(typed, 'f', -1, 64)
	case float32:
		return strconv.FormatFloat(float64(typed), 'f', -1, 32)
	case int:
		return strconv.Itoa(typed)
	case int64:
		return strconv.FormatInt(typed, 10)
	default:
		return strings.TrimSpace(fmt.Sprintf("%v", value))
	}
}

func sizeValueToInt(value interface{}) int {
	switch typed := value.(type) {
	case nil:
		return 0
	case int:
		return typed
	case int64:
		return int(typed)
	case float64:
		return int(typed)
	case float32:
		return int(typed)
	case string:
		parsed, _ := strconv.Atoi(strings.TrimSpace(typed))
		return parsed
	default:
		parsed, _ := strconv.Atoi(sizeValueToString(value))
		return parsed
	}
}

func imageFileName(
	uuid string,
	productID string,
	sizes []string,
	sizeOriginal string,
	index int,
	contentType string,
) string {
	extension := imageExtension(contentType)
	sizeToken := imageNameToken(strings.Join(sizes, "-"))
	if sizeToken == "" {
		sizeToken = imageNameToken(sizeOriginal)
	}
	if sizeToken == "" {
		sizeToken = defaultSize
	}
	sequenceSuffix := ""
	if index > 1 {
		sequenceSuffix = "_" + strconv.Itoa(index)
	}
	return fmt.Sprintf(
		"A_%s_%s_%s%s%s",
		imageNameToken(firstNonEmpty(uuid, generateID())),
		imageNameToken(productID),
		sizeToken,
		sequenceSuffix,
		extension,
	)
}

func imageExtension(contentType string) string {
	normalizedType := strings.ToLower(strings.TrimSpace(strings.Split(contentType, ";")[0]))
	switch normalizedType {
	case "image/jpeg", "image/jpg", "image/pjpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	case "image/gif":
		return ".gif"
	case "image/avif":
		return ".avif"
	}
	if normalizedType != "" {
		if extensions, err := mime.ExtensionsByType(normalizedType); err == nil && len(extensions) > 0 {
			return extensions[0]
		}
	}
	return ".jpg"
}

func imageNameToken(value string) string {
	value = strings.TrimSpace(value)
	var builder strings.Builder
	lastDash := false
	for _, character := range value {
		isAlphaNumeric := (character >= 'a' && character <= 'z') ||
			(character >= 'A' && character <= 'Z') ||
			(character >= '0' && character <= '9')
		if isAlphaNumeric || character == '_' {
			builder.WriteRune(character)
			lastDash = false
			continue
		}
		if !lastDash {
			builder.WriteRune('-')
			lastDash = true
		}
	}
	return strings.Trim(builder.String(), "-_")
}

func nextImageSequence(imageNames []string) int {
	maximum := len(imageNames)
	for _, imageName := range imageNames {
		baseName := path.Base(strings.TrimSpace(imageName))
		stem := strings.TrimSuffix(baseName, path.Ext(baseName))
		lastSeparator := strings.LastIndex(stem, "_")
		if lastSeparator < 0 || lastSeparator == len(stem)-1 {
			continue
		}
		sequence, err := strconv.Atoi(stem[lastSeparator+1:])
		if err == nil && sequence > maximum {
			maximum = sequence
		}
	}
	return maximum + 1
}

func s3URI(key string) string {
	return "s3://" + imageBucket + "/" + key
}

func imageURL(key string) string {
	if imageBaseURL == "" {
		return s3URI(key)
	}
	return imageBaseURL + "/" + key
}

func encodeLastEvaluatedKey(key map[string]*dynamodb.AttributeValue) string {
	values := map[string]string{}
	for name, attribute := range key {
		if attribute.S != nil {
			values[name] = *attribute.S
		}
	}
	bytes, _ := json.Marshal(values)
	return base64.RawURLEncoding.EncodeToString(bytes)
}

func decodeLastEvaluatedKey(value string) (map[string]*dynamodb.AttributeValue, error) {
	decoded, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(value)},
		}, nil
	}

	values := map[string]string{}
	if err := json.Unmarshal(decoded, &values); err != nil {
		return nil, fmt.Errorf("invalid last_key")
	}

	key := map[string]*dynamodb.AttributeValue{}
	for name, stringValue := range values {
		key[name] = &dynamodb.AttributeValue{S: aws.String(stringValue)}
	}
	return key, nil
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func firstString(values []string) string {
	if len(values) == 0 {
		return ""
	}
	return values[0]
}

func mergeStrings(values ...[]string) []string {
	result := []string{}
	for _, group := range values {
		for _, value := range group {
			result = appendIfMissing(result, value)
		}
	}
	return result
}

func appendIfMissing(values []string, value string) []string {
	value = strings.TrimSpace(value)
	if value == "" {
		return values
	}
	for _, existing := range values {
		if existing == value {
			return values
		}
	}
	return append(values, value)
}

func extractProductIDFromPath(pathValue string) string {
	parts := strings.Split(strings.Trim(pathValue, "/"), "/")
	if len(parts) < 2 {
		return ""
	}
	if parts[len(parts)-2] == "products" {
		return parts[len(parts)-1]
	}
	return ""
}

func extractProductImageIDFromPath(pathValue string) string {
	parts := strings.Split(strings.Trim(pathValue, "/"), "/")
	if len(parts) < 3 {
		return ""
	}
	if parts[len(parts)-3] == "products" && parts[len(parts)-1] == "images" {
		return parts[len(parts)-2]
	}
	return ""
}

func extractCollectionIDFromPath(pathValue string) string {
	parts := strings.Split(strings.Trim(pathValue, "/"), "/")
	if len(parts) < 3 || parts[len(parts)-2] != "collections" {
		return ""
	}
	return decodePathSegment(parts[len(parts)-1])
}

func extractCollectionIDFromRecalculatePath(pathValue string) string {
	parts := strings.Split(strings.Trim(pathValue, "/"), "/")
	if len(parts) < 4 || parts[len(parts)-3] != "collections" || parts[len(parts)-1] != "recalculate-spread" {
		return ""
	}
	return decodePathSegment(parts[len(parts)-2])
}

func decodePathSegment(value string) string {
	decoded, err := url.PathUnescape(value)
	if err != nil {
		return ""
	}
	return decoded
}

func generateID() string {
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

func successJSONResponse(statusCode int, body string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Body:       body,
		Headers:    defaultHeaders(),
	}
}

func badRequestResponse(message string) events.APIGatewayProxyResponse {
	return events.APIGatewayProxyResponse{
		StatusCode: statusCodeBadRequest,
		Body:       fmt.Sprintf(`{"error": "%s"}`, message),
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

const statusCodeBadRequest = 400
