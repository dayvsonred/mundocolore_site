package main

import (
	"lb_mundocolore-products/internal/products"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(products.HandleRequest)
}
