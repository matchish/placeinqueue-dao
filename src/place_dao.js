'use strict';

const AWS = require("aws-sdk");

AWS.config.update({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_DYNAMODB_ENDPOINT
});

const docClient = new AWS.DynamoDB.DocumentClient();

module.exports = class PlaceDao {

    saveEntity(entity) {

        let now = new Date();
        //TODO magic number
        let expires = new Date(now.getTime() + 24*60*60000);
        entity.expires_at = Math.round(now.getTime() / 1000);
        entity.uid = entity.queue_id + '#' + entity.id;
        if (entity.number_in_queue == undefined || entity.number_in_queue === null) {
            entity.sort = 1;
        } else {
            entity.sort = entity.number_in_queue > 0 ? (1 - 1/entity.number_in_queue) : 0;
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
            if (entity.uid === undefined) {
                entity.uid = entity.queue_id + '#' + entity.id;
            }
            if (entity.expires_at === undefined) {
                let now = new Date();
                //TODO magic number
                let expires = new Date(now.getTime() + 24*60*60000);
                entity.expires_at = expires.toISOString();
                updateExpression.push("#exp_at = :exp_at")
                expressionAttributeValues[":exp_at"] = entity.expires_at;
                expressionAttributeNames["#exp_at"] = "expires_at";
            }
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
                    expressionAttributeValues[":sort"] = entity.number_in_queue > 0 ? (1 - 1/entity.number_in_queue) : 0;
                }
                expressionAttributeNames["#sort"] = "sort";
            } else {
                updateExpression.push("#sort = if_not_exists(#sort, :sort)")
                expressionAttributeValues[":sort"] = 1;
            }
            expressionAttributeNames["#sort"] = "sort";
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
                updateExpression.push("#hb = :hb");
                expressionAttributeValues[":hb"] = entity.heartbeat_at;
                expressionAttributeNames["#hb"] = "heartbeat_at";
            }
            if (entity.screenshot !== undefined) {
                updateExpression.push("#scr = :scr");
                expressionAttributeValues[":scr"] = entity.screenshot;
                expressionAttributeNames["#scr"] = "screenshot";
            }
            if (entity.action !== undefined) {
                updateExpression.push("#act = :act");
                expressionAttributeValues[":act"] = entity.action;
                expressionAttributeNames["#act"] = "action";
            }
            if (entity.id !== undefined) {
                updateExpression.push("#place_id = :place_id");
                expressionAttributeValues[":place_id"] = entity.id;
                expressionAttributeNames["#place_id"] = "id";
            }
            if (entity.queue_id !== undefined) {
                updateExpression.push("#queue_id = :queue_id");
                expressionAttributeValues[":queue_id"] = entity.queue_id;
                expressionAttributeNames["#queue_id"] = "queue_id";
            }
            let params = {
                TableName: "Places",
                Key: {
                    uid: entity.uid
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

    scopeEntitiesByQueue(queue) {
        return {
            TableName: "Places",
            IndexName: "FirstInQueue",
            KeyConditionExpression: "queue_id = :queue_id",
            FilterExpression: " id <= :number_of_places",
            ExpressionAttributeValues: {
                ":queue_id": queue.id,
                ":number_of_places": queue.number_of_places,
            },
            ExpressionAttributeNames: {
                "#u": "url",
                "#sts": "status",
                "#scr": "screenshot",
                "#act": "action",
            },
            ProjectionExpression: "id, queue_id, used, #u, remote_id, number_in_queue, heartbeat_at, sort, #sts, #scr, #act"
        };
    }

    readEntitiesByQueue(queue) {
        return new Promise((resolve, reject) => {
            var params = this.scopeEntitiesByQueue(queue);
            docClient.query(params, function (err, data) {
                if (err) {
                    reject(new Error("Unable to read items. Error JSON:" + JSON.stringify(err, null, 2)));
                } else {
                    resolve(data.Items)
                }
            });
        });
    }

    readEntitiesByQueuePaginated(queue, limit, offset) {
        return new Promise((resolve, reject) => {
            var params = this.scopeEntitiesByQueue(queue);
            params.limit = limit;
            params.ExclusiveStartKey = offset;
            docClient.query(params, function (err, data) {
                if (err) {
                    reject(new Error("Unable to read items. Error JSON:" + JSON.stringify(err, null, 2)));
                } else {
                    resolve({
                        items: data.Items,
                        offset: data.lastEvaluatedKey,
                        total: data.Count
                    })
                }
            });
        });
    }

    readEntity(key) {
        return new Promise((resolve, reject) => {
            let params = {
                TableName: "Places",
                Key: { uid: key.queue_id + '#' + key.id}
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