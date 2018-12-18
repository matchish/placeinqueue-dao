'use strict';

const AWS = require("aws-sdk");
const uuidv1 = require('uuid/v1');

AWS.config.update({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_DYNAMODB_ENDPOINT
});

const docClient = new AWS.DynamoDB.DocumentClient();
const dynamodb = new AWS.DynamoDB();

const validate = (entity) => {
    if (parseInt(entity.places) > parseInt(process.env.MAX_PLACES)) {
        throw new Error(`Max number of places is ${process.env.MAX_PLACES}`);
    }
};

function putPlaces(id, number_of_places) {
    return new Promise(async (resolve, reject) => {
        try {
            await new Promise((resolve, reject) => {
                let params = {
                    "TableName": "Places_" + id,
                };
                dynamodb.deleteTable(params, function (err, data) {
                    if (err) {
                        if (err.code === "ResourceNotFoundException") {
                            resolve()
                        } else {
                            reject(`Unable to delete table ${"Places_" + id}. Error JSON:` + JSON.stringify(err, null, 2));
                        }
                    } else {
                        resolve();
                    }
                });

            });
            await new Promise((resolve, reject) => {
                let params = {
                    "TableName": "Places_" + id,
                    "KeySchema": [
                        {"AttributeName": "id", "KeyType": "HASH"},
                    ],
                    "AttributeDefinitions": [
                        {"AttributeName": "id", "AttributeType": "N"},
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 5,
                        "WriteCapacityUnits": 5
                    }
                }

                dynamodb.createTable(params, async function (err, data) {
                    if (err) {
                        reject(`Unable to create table ${"Places_" + id}. Error JSON:` + JSON.stringify(err, null, 2));
                    } else {
                        resolve(data)
                    }
                });
            });
            await Promise.all(Array.from({length: number_of_places}, (x, i) => {
                    let params = {
                        TableName: "Places_" + id,
                        Item: {
                            used: 0,
                            queue_id: id,
                            id: i
                        }
                    };
                    return new Promise((resolve, reject) => {
                        docClient.put(params, function (err, data) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(data);
                            }
                        })
                    });
                }
            ));
            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = class QueueDao {
    saveEntity(entity) {
        entity.id = uuidv1();
        validate(entity);
        return new Promise((resolve, reject) => {
            let params = {
                TableName: "Queues",
                Item: entity
            };
            docClient.put(params, async function (err, data) {
                if (err) {
                    reject("Unable to add queue " + entity.title + ". Error JSON:" + JSON.stringify(err, null, 2));
                } else {
                    resolve(entity);
                }
            });
        });
    }

    updateEntity(entity) {
        validate(entity);
        return new Promise((resolve, reject) => {
            let params = {
                TableName: "Queues",
                Item: entity
            };
            docClient.put(params, async function (err, data) {
                if (err) {
                    reject("Unable to add queue " + entity.title + ". Error JSON:" + JSON.stringify(err, null, 2));
                } else {
                    resolve();
                }
            });
        });
    }

    deleteEntity(id) {
        return new Promise((resolve, reject) => {
            let params = {
                TableName: "Queues",
                Key: {
                    "id": id,
                }
            };
            docClient.delete(params, function (err, data) {
                if (err) {
                    reject("Unable to delete item. Error JSON:" + JSON.stringify(err, null, 2));
                } else {
                    resolve();
                }
            });
        });

    }

    readEntities() {
        var params = {
            TableName: 'Queues'
        };
        return new Promise((resolve, reject) => {
            var params = {
                TableName: "Queues",
            };
            docClient.scan(params, function (err, data) {
                if (err) {
                    reject("Unable to read item. Error JSON:" + JSON.stringify(err, null, 2));
                } else {
                    resolve(data.Items)
                }
            });
        });
    }
};
