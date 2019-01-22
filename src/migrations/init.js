var AWS = require("aws-sdk");

AWS.config.update({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_DYNAMODB_ENDPOINT
});

let dynamodb = new AWS.DynamoDB();


(async () => {

    try {
        await new Promise((resolve, reject) => {
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
            dynamodb.createTable(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                    console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
                }
            });
        });
    } catch (e) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(e, null, 2));
    }

    try {
        await new Promise((resolve, reject) => {
            let params = {
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

            dynamodb.createTable(params, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
                    resolve();
                    let params = {
                        TableName: 'Places',
                        TimeToLiveSpecification: {
                            AttributeName: 'expires_at',
                            Enabled: true
                        }
                    };
                }
            });
        });
    } catch (e) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(e, null, 2));
    }

    try {
        await new Promise((resolve, reject) => {

            let params = {
                TableName: 'Places'
            };

            dynamodb.waitFor('tableExists', params, (err, data) => {
                if (err) console.log(err, err.stack);
                else {
                    let params = {
                        TableName: 'Places',
                        TimeToLiveSpecification: {
                            AttributeName: 'expires_at',
                            Enabled: true
                        }
                    };
                    dynamodb.updateTimeToLive(params, function (err, data) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            console.log(data);
                            resolve();
                        }
                    });
                }
            });

        });
    } catch (e) {
        console.log(e, err.stack);
    }
})();
