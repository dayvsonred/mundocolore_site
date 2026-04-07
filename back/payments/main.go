package main

import (
	"lb_mundocolore-payments/internal/payments"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(payments.HandleRequest)
}
