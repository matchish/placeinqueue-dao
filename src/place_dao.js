'use strict';

const AWS = require("aws-sdk");

AWS.config.update({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_DYNAMODB_ENDPOINT
});

const docClient = new AWS.DynamoDB.DocumentClient();

module.exports = class PlaceDao {

    saveEntity(entity) {
        if (entity.number_in_queue == undefined || entity.number_in_queue === null) {
            entity.sort = 1;
        } else {
            entity.sort = entity.number_in_queue > 0 ? 1/entity.number_in_queue : 0;
        }
        return new Promise((resolve, reject) => {
            let params = {
                TableName: "Places",
                Item: entity
            };
            docClient.put(params, async function (err, data) {
                if (err) {
                    reject(new Error("Unable to add place for queue" + entity.queue_id + ". Error JSON:" + JSON.stringify(err, null, 2)));
                } else {
                    resolve(entity);
                }
            });
        });
    }

    updateEntity(entity) {
        return new Promise((resolve, reject) => {
            let updateExpression = [];
            let expressionAttributeValues = {};
            let expressionAttributeNames = {};
            if (entity.used !== undefined) {
                updateExpression.push("#used = :used")
                expressionAttributeValues[":used"] = entity.used;
                expressionAttributeNames["#used"] = "used";
            }
            if (entity.number_in_queue !== undefined) {
                updateExpression.push("#nmbr = :nmbr")
                expressionAttributeValues[":nmbr"] = entity.number_in_queue;
                expressionAttributeNames["#nmbr"] = "number_in_queue";
                updateExpression.push("#sort = :sort")
                if (entity.number_in_queue === null) {
                    expressionAttributeValues[":sort"] = 1
                } else {
                    expressionAttributeValues[":sort"] = entity.number_in_queue > 0 ? 1/entity.number_in_queue : 0;
                }
                expressionAttributeNames["#sort"] = "sort";
            } else {
                updateExpression.push("#sort = attribute_not_exists(#sort, :sort")
                expressionAttributeValues[":sort"] = 1;
            }
            if (entity.remote_id !== undefined) {
                updateExpression.push("#rid = :rid")
                expressionAttributeValues[":rid"] = entity.remote_id;
                expressionAttributeNames["#rid"] = "remote_id";
            }
            if (entity.url !== undefined) {
                updateExpression.push("#u = :u")
                expressionAttributeValues[":u"] = entity.url;
                expressionAttributeNames["#u"] = "url";
            }
            if (entity.proxy !== undefined) {
                updateExpression.push("#proxy = :proxy")
                expressionAttributeValues[":proxy"] = entity.proxy;
                expressionAttributeNames["#proxy"] = "proxy";
            }
            if (entity.useragent !== undefined) {
                updateExpression.push("#ua = :ua")
                expressionAttributeValues[":ua"] = entity.useragent;
                expressionAttributeNames["#ua"] = "useragent";
            }
            if (entity.cookies !== undefined) {
                updateExpression.push("#c = :c")
                expressionAttributeValues[":c"] = entity.cookies;
                expressionAttributeNames["#c"] = "cookies";
            }
            if (entity.heartbeat_at !== undefined) {
                updateExpression.push("#hb = :hb")
                expressionAttributeValues[":hb"] = entity.heartbeat_at;
                expressionAttributeNames["#hb"] = "heartbeat_at";
            }
            let params = {
                TableName: "Places",
                Key: {
                    queue_id: entity.queue_id,
                    id: entity.id
                },
                UpdateExpression: "set " + updateExpression.join(", "),
                ExpressionAttributeValues: expressionAttributeValues,
                ExpressionAttributeNames: expressionAttributeNames,
            };
            docClient.update(params, async function (err, data) {
                if (err) {
                    reject(new Error("Unable to update place for queue" + entity.queue_id + ". Error JSON:" + JSON.stringify(err, null, 2)));
                } else {
                    resolve(entity);
                }
            });
        });
    }

    readEntitiesByQueue(queue) {
        return new Promise((resolve, reject) => {
            var params = {
                TableName: "Places",
                IndexName: "FirstInQueue",
                KeyConditionExpression: "queue_id = :queue_id",
                FilterExpression: " id <= :number_of_places",
                ExpressionAttributeValues: {
                    ":queue_id": queue.id,
                    ":number_of_places": queue.number_of_places,
                },
                ProjectionExpression: "id, queue_id, used, place_url, remote_id, number_in_queue, heartbeat_at"
            };
            docClient.query(params, function (err, data) {
                if (err) {
                    reject(new Error("Unable to read items. Error JSON:" + JSON.stringify(err, null, 2)));
                } else {
                    resolve(data.Items)
                }
            });
        });
    }

    readEntity(id) {
        return new Promise((resolve, reject) => {
            let params = {
                TableName: "Places",
                Key: id
            };

            docClient.get(params, function (err, data) {
                if (err) {
                    reject(new Error("Unable to read item. Error JSON:" + JSON.stringify(err, null, 2)));
                } else {
                    resolve(data.Item);
                }
            });
        });
    }
};