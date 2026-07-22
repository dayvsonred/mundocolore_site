package creditcolore

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbiface"
)

type listUsersDynamoMock struct {
	dynamodbiface.DynamoDBAPI
	scanInput *dynamodb.ScanInput
}

func (mock *listUsersDynamoMock) Scan(input *dynamodb.ScanInput) (*dynamodb.ScanOutput, error) {
	mock.scanInput = input
	items := make([]map[string]*dynamodb.AttributeValue, 0, 10)
	for index := 1; index <= 10; index++ {
		item, err := dynamodbattribute.MarshalMap(User{
			ID: fmt.Sprintf("user-%02d", index), Name: fmt.Sprintf("Usuario %02d", index),
			Email: fmt.Sprintf("user%02d@example.com", index), CreatedAt: "2026-07-21T12:00:00Z",
		})
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return &dynamodb.ScanOutput{
		Items: items,
		LastEvaluatedKey: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String("user-10")},
		},
	}, nil
}

func (mock *listUsersDynamoMock) GetItem(input *dynamodb.GetItemInput) (*dynamodb.GetItemOutput, error) {
	if aws.StringValue(input.TableName) == roleTable {
		userID := aws.StringValue(input.Key["id"].S)
		if userID != "user-01" {
			return &dynamodb.GetItemOutput{}, nil
		}
		item, err := dynamodbattribute.MarshalMap(UserRole{Active: true})
		return &dynamodb.GetItemOutput{Item: item}, err
	}

	userID := aws.StringValue(input.Key["user_id"].S)
	item, err := dynamodbattribute.MarshalMap(Credit{
		UserID: userID, Card: ColoreCard{Number: "7777000000000000"},
	})
	return &dynamodb.GetItemOutput{Item: item}, err
}

func TestHandleListUsersLimitsPageAndMarksAdmins(t *testing.T) {
	previousClient := dynamoClient
	mock := &listUsersDynamoMock{}
	dynamoClient = mock
	t.Cleanup(func() { dynamoClient = previousClient })

	response, err := HandleListUsers(nil, events.APIGatewayProxyRequest{})
	if err != nil {
		t.Fatalf("HandleListUsers returned an error: %v", err)
	}
	if response.StatusCode != 200 {
		t.Fatalf("expected status 200, got %d: %s", response.StatusCode, response.Body)
	}
	if mock.scanInput == nil || aws.Int64Value(mock.scanInput.Limit) != 10 {
		t.Fatalf("expected DynamoDB scan limit 10, got %#v", mock.scanInput)
	}

	var body struct {
		Users      []UserCredit `json:"users"`
		NextCursor string       `json:"next_cursor"`
	}
	if err := json.Unmarshal([]byte(response.Body), &body); err != nil {
		t.Fatalf("could not decode response: %v", err)
	}
	if len(body.Users) != 10 {
		t.Fatalf("expected 10 users, got %d", len(body.Users))
	}
	if !body.Users[0].IsAdmin {
		t.Fatal("expected user-01 to be identified as an administrator")
	}
	if body.Users[1].IsAdmin {
		t.Fatal("expected user-02 not to be identified as an administrator")
	}
	key, err := decodeUsersCursor(body.NextCursor)
	if err != nil || aws.StringValue(key["id"].S) != "user-10" {
		t.Fatalf("unexpected next cursor: %q (%v)", body.NextCursor, err)
	}
}

func TestHandleListUsersRejectsInvalidCursor(t *testing.T) {
	response, err := HandleListUsers(nil, events.APIGatewayProxyRequest{
		QueryStringParameters: map[string]string{"cursor": "invalid cursor"},
	})
	if err != nil {
		t.Fatalf("HandleListUsers returned an error: %v", err)
	}
	if response.StatusCode != 400 {
		t.Fatalf("expected status 400, got %d", response.StatusCode)
	}
}
