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
        {"AttributeName": "uid", "KeyType": "HASH"},
    ],
    "AttributeDefinitions": [
        {"AttributeName": "uid", "AttributeType": "S"},
        {"AttributeName": "queue_id", "AttributeType": "S"},
        {"AttributeName": "sort", "AttributeType": "N"},
    ],
    "ProvisionedThroughput": {
        "ReadCapacityUnits": 5,
        "WriteCapacityUnits": 5
    },
    "GlobalSecondaryIndexes": [{
        "IndexName": "FirstInQueue",
        "KeySchema": [
            {
                "AttributeName": "queue_id",
                "KeyType": "HASH"
            },
            {
                "AttributeName": "sort",
                "KeyType": "RANGE"
            }
        ],
        "Projection": {
            "ProjectionType": "ALL"
        },
        "ProvisionedThroughput": {
            "ReadCapacityUnits": 5,
            "WriteCapacityUnits": 5
        },
    }]
}

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});

params = {
    TableName: 'Places',
    TimeToLiveSpecification: {
        AttributeName: 'expires_at',
        Enabled: true
    }
};

dynamodb.updateTimeToLive(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
});
