var AWS = require("aws-sdk");

AWS.config.update({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_DYNAMODB_ENDPOINT
});

var dynamodb = new AWS.DynamoDB();

let params = {
    "TableName": "Queues",
    "KeySchema": [
        {"AttributeName": "id", "KeyType": "HASH"},
    ],
    "AttributeDefinitions": [
        {"AttributeName": "id", "AttributeType": "S"},
    ],
    "ProvisionedThroughput": {
        "ReadCapacityUnits": 5,
        "WriteCapacityUnits": 5
    }
}

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

params = {
    "TableName": "Places",
    "KeySchema": [
        {"AttributeName": "queue_id", "KeyType": "HASH"},
        {"AttributeName": "id", "KeyType": "RANGE"},
    ],
    "AttributeDefinitions": [
        {"AttributeName": "id", "AttributeType": "N"},
        {"AttributeName": "queue_id", "AttributeType": "S"},
    ],
    "ProvisionedThroughput": {
        "ReadCapacityUnits": 5,
        "WriteCapacityUnits": 5
    }
}

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});
