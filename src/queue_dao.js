'use strict';

const AWS = require("aws-sdk");
const uuidv1 = require('uuid/v1');

AWS.config.update({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_DYNAMODB_ENDPOINT
});

const docClient = new AWS.DynamoDB.DocumentClient();

const validate = (entity) => {
    console.log(entity);
    if (!entity.title) {
        throw new Error(`Queue title is required`);
    }
    if (!entity.number_of_places) {
        throw new Error(`Number of places is required`);
    }
    if (parseInt(entity.number_of_places) > parseInt(process.env.MAX_PLACES)) {
        throw new Error(`Max number of places is ${process.env.MAX_PLACES}`);
    }
    if (!entity.start_at) {
        throw new Error(`Start date is required`);
    }
    if (!Number.isInteger(entity.prestart)) {
        throw new Error(`Prestart is required`);
    }
    if (!entity.url) {
        throw new Error(`Url is required`);
    }
};

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
                    reject(new Error("Unable to add queue " + entity.title + ". Error JSON:" + JSON.stringify(err, null, 2)));
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
                    reject(new Error("Unable to add queue " + entity.title + ". Error JSON:" + JSON.stringify(err, null, 2)));
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
                    reject(new Error("Unable to delete item. Error JSON:" + JSON.stringify(err, null, 2)));
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
                    reject(new Error("Unable to read item. Error JSON:" + JSON.stringify(err, null, 2)));
                } else {
                    resolve(data.Items)
                }
            });
        });
    }
};
