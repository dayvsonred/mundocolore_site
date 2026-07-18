package main

import (
	"lb_mundocolore-analytics_control/internal/analyticscontrol"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(analyticscontrol.HandleRequest)
}
