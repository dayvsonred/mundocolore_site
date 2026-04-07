package main

import (
	"lb_mundocolore-users/internal/users"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(users.HandleRequest)
}
