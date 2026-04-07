package main

import (
	"lb_mundocolore-addresses/internal/addresses"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(addresses.HandleRequest)
}
