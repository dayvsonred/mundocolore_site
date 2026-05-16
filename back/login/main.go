package main

import (
	"lb_mundocolore-login/internal/login"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(login.HandleRequest)
}
