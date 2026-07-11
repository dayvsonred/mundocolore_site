package main

import (
	"lb_mundocolore-credit-colore/internal/creditcolore"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(creditcolore.HandleRequest)
}
