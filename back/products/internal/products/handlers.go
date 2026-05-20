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
	ID             string `json:"id" dynamodbav:"id"`
	EntityType     string `json:"entity_type" dynamodbav:"entity_type"`
	Name           string `json:"name" dynamodbav:"name"`
	Slug           string `json:"slug" dynamodbav:"slug"`
	Brand          string `json:"brand" dynamodbav:"brand"`
	BrandKey       string `json:"brand_key" dynamodbav:"brand_key"`
	Year           string `json:"year" dynamodbav:"year"`
	CollectionKey  string `json:"collection_key" dynamodbav:"collection_key"`
	DisplayStartAt string `json:"display_start_at" dynamodbav:"display_start_at"`
	DisplayEndAt   string `json:"display_end_at" dynamodbav:"display_end_at"`
	S3Prefix       string `json:"s3_prefix" dynamodbav:"s3_prefix"`
	CreatedAt      string `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt      string `json:"updated_at" dynamodbav:"updated_at"`
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
	PriceRaw         string   `json:"preco,omitempty" dynamodbav:"price_raw,omitempty"`
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
	CreatedAt        string   `json:"created_at" dynamodbav:"created_at"`
	UpdatedAt        string   `json:"updated_at" dynamodbav:"updated_at"`
}

type CreateBrandRequest struct {
	Name  string `json:"name"`
	Brand string `json:"brand"`
}

type CreateCollectionRequest struct {
	Name             string `json:"name"`
	Collection       string `json:"collection"`
	Slug             string `json:"slug"`
	Brand            string `json:"brand"`
	Year             string `json:"year"`
	DisplayStartAt   string `json:"display_start_at"`
	DisplayEndAt     string `json:"display_end_at"`
	ReleaseDate      string `json:"release_date"`
	FinalizationDate string `json:"finalization_date"`
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
	SizeStart        int           `json:"tamanho_inicio"`
	SizeEnd          int           `json:"tamanho_fim"`
	SizesArray       []int         `json:"tamanhos_array"`
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
}

type ProductsListResponse struct {
	Products         []Product `json:"products"`
	LastEvaluatedKey string    `json:"last_evaluated_key,omitempty"`
}

var (
	dynamoClient *dynamodb.DynamoDB
	s3Client     *s3.S3
	tableName    = "mundocolore-products"
	imageBucket  = "mundocolorestore-imagems"
	imageBaseURL string
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

	body, _ := json.Marshal(map[string]interface{}{"collections": collections})
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

func HandleGetProduct(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := extractProductIDFromPath(request.Path)
	if id == "" {
		return badRequestResponse("invalid product id"), nil
	}

	product, err := getProduct(id)
	if err != nil {
		return notFoundWithMessage(err.Error()), nil
	}

	body, _ := json.Marshal(product)
	return successJSONResponse(200, string(body)), nil
}

func HandleGetProducts(_ context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	limit := parseLimit(request.QueryStringParameters["limit"], 20)
	lastKey := request.QueryStringParameters["last_key"]

	products, err := getProducts(ProductQuery{
		Category:   request.QueryStringParameters["category"],
		Type:       request.QueryStringParameters["type"],
		ProductID:  firstNonEmpty(request.QueryStringParameters["produto_id"], request.QueryStringParameters["product_id"]),
		Brand:      request.QueryStringParameters["brand"],
		Year:       request.QueryStringParameters["year"],
		Collection: request.QueryStringParameters["collection"],
		Limit:      limit,
		LastKey:    lastKey,
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

	collection := Collection{
		ID:             "COLLECTION#" + collectionKey,
		EntityType:     "collection",
		Name:           firstNonEmpty(req.Name, req.Collection, slug),
		Slug:           slug,
		Brand:          brandKey,
		BrandKey:       brandKey,
		Year:           year,
		CollectionKey:  collectionKey,
		DisplayStartAt: displayStart,
		DisplayEndAt:   displayEnd,
		S3Prefix:       buildS3Prefix(brandKey, year, slug),
		CreatedAt:      now,
		UpdatedAt:      now,
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

func createProduct(req CreateProductRequest) (Product, error) {
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

	price, priceRaw := parsePrice(req.Price)
	if priceRaw == "" {
		price, priceRaw = parsePrice(req.Preco)
	}

	description := firstNonEmpty(req.Description, req.Descricao)
	category := strings.TrimSpace(req.Category)
	productType := firstNonEmpty(req.Type, category)
	if category == "" {
		category = productType
	}

	size := req.Size
	if len(size) == 0 && len(req.SizesArray) > 0 {
		size = sizesToStrings(req.SizesArray)
	}
	if len(size) == 0 && strings.TrimSpace(req.SizeOriginal) != "" {
		size = []string{strings.TrimSpace(req.SizeOriginal)}
	}

	s3Prefix := buildS3Prefix(brandKey, year, collectionSlug)
	imageNames := mergeStrings(req.Imagem, req.Images)
	if req.Image != "" {
		imageNames = appendIfMissing(imageNames, req.Image)
	}
	if req.ImageFileName != "" {
		imageNames = appendIfMissing(imageNames, req.ImageFileName)
	}

	if req.ImageBase64 != "" {
		fileName := firstNonEmpty(req.ImageFileName, imageFileName(req.UUID, productID, len(imageNames)+1, req.ImageContentType))
		if err := uploadImage(s3Prefix+fileName, req.ImageBase64, req.ImageContentType); err != nil {
			return Product{}, err
		}
		imageNames = appendIfMissing(imageNames, fileName)
	}

	for _, image := range req.UploadImages {
		fileName := strings.TrimSpace(image.FileName)
		if fileName == "" {
			fileName = imageFileName(req.UUID, productID, len(imageNames)+1, image.ContentType)
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
		PriceRaw:         priceRaw,
		Category:         category,
		Type:             productType,
		TypeKey:          normalizeKey(productType),
		Brand:            brandKey,
		BrandKey:         brandKey,
		Collection:       firstNonEmpty(collectionName, collectionSlug),
		CollectionSlug:   collectionSlug,
		Year:             year,
		CollectionKey:    buildCollectionKey(brandKey, year, collectionSlug),
		ReleaseDate:      req.ReleaseDate,
		FinalizationDate: req.FinalizationDate,
		DisplayStartAt:   req.DisplayStartAt,
		DisplayEndAt:     req.DisplayEndAt,
		Size:             size,
		AgeGroup:         req.AgeGroup,
		SizeOriginal:     req.SizeOriginal,
		SizeStart:        req.SizeStart,
		SizeEnd:          req.SizeEnd,
		SizesArray:       req.SizesArray,
		Colors:           req.Colors,
		Image:            firstString(imageURLs),
		ImageURL:         firstString(imageURLs),
		Images:           imageNames,
		ImageURLs:        imageURLs,
		ImageBucket:      imageBucket,
		ImageKeys:        imageKeys,
		S3Prefix:         s3Prefix,
		Stock:            req.Stock,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	if err := ensureS3Prefix(brandKey + "/"); err != nil {
		return Product{}, err
	}
	if err := ensureS3Prefix(path.Join(brandKey, year) + "/"); err != nil {
		return Product{}, err
	}
	if err := ensureS3Prefix(s3Prefix); err != nil {
		return Product{}, err
	}

	return product, putEntity(product)
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
	return product, nil
}

type ProductQuery struct {
	Category   string
	Type       string
	ProductID  string
	Brand      string
	Year       string
	Collection string
	Limit      int
	LastKey    string
}

func getProducts(query ProductQuery) (ProductsListResponse, error) {
	input := &dynamodb.QueryInput{
		TableName: aws.String(tableName),
		Limit:     aws.Int64(int64(query.Limit)),
	}

	expressionValues := map[string]*dynamodb.AttributeValue{}
	filterExpressions := []string{"entity_type = :entity_type"}
	expressionValues[":entity_type"] = &dynamodb.AttributeValue{S: aws.String("product")}

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
		filterExpressions = nil
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
			products = append(products, product)
		}
	}

	response := ProductsListResponse{Products: products}
	if len(result.LastEvaluatedKey) > 0 {
		response.LastEvaluatedKey = encodeLastEvaluatedKey(result.LastEvaluatedKey)
	}
	return response, nil
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
	data := strings.TrimSpace(contentBase64)
	if comma := strings.Index(data, ","); comma >= 0 {
		data = data[comma+1:]
	}

	decodedBytes, err := base64.StdEncoding.DecodeString(data)
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

func sizesToStrings(values []int) []string {
	result := make([]string, 0, len(values))
	for _, value := range values {
		result = append(result, strconv.Itoa(value))
	}
	return result
}

func imageFileName(uuid string, productID string, index int, contentType string) string {
	extension := ".jpg"
	if contentType != "" {
		if extensions, err := mime.ExtensionsByType(contentType); err == nil && len(extensions) > 0 {
			extension = extensions[0]
		}
	}
	return fmt.Sprintf("A_%s_%s_%d%s", firstNonEmpty(uuid, generateID()), productID, index, extension)
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
