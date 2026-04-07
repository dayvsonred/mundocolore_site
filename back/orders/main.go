package main

import (
	"lb_mundocolore-orders/internal/orders"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(orders.HandleRequest)
}
