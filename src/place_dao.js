'use strict';

const AWS = require("aws-sdk");
const uuidv1 = require('uuid/v1');

AWS.config.update({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_DYNAMODB_ENDPOINT
});

const docClient = new AWS.DynamoDB.DocumentClient();
const dynamodb = new AWS.DynamoDB();

const moment = require('moment')

module.exports = class PlaceDao {

    saveEntity(entity) {
        return new Promise((resolve, reject) => {
            let params = {
                TableName: "Places",
                Item: entity
            };
            docClient.put(params, async function (err, data) {
                if (err) {
                    reject("Unable to add place for queue" + entity.queue_id + ". Error JSON:" + JSON.stringify(err, null, 2));
                } else {
                    resolve(entity);
                }
            });
        });
    }

    updateEntity(entity) {
        return new Promise((resolve, reject) => {
            let params = {
                TableName: "Places",
                Item: entity
            };
            docClient.update(params, async function (err, data) {
                if (err) {
                    reject("Unable to add place for queue" + entity.queue_id + ". Error JSON:" + JSON.stringify(err, null, 2));
                } else {
                    resolve(entity);
                }
            });
        });
    }

    readEntitiesByQueueId(id) {
        return new Promise((resolve, reject) => {
            var params = {
                TableName: "Places",
                KeyConditionExpression: "queue_id = :queue_id and id < :number_of_places",
                ExpressionAttributeValues: {
                    ":queue_id": id,
                    ":number_of_places": 2
                },
                ProjectionExpression: "id, queue_id, used, place_url, remote_id, proxy, useragent, number_in_queue, heartbeat_at"
            };
            docClient.query(params, function (err, data) {
                if (err) {
                    reject("Unable to read item. Error JSON:" + JSON.stringify(err, null, 2));
                } else {
                    resolve(data.Items)
                }
            });
        });
    }

};