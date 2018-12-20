const QueueDao = require('./queue_dao')
const queueDao = new QueueDao();

const PlaceDao = require('./place_dao')
const placeDao = new PlaceDao();

(async () => {
    try {
        let queue = await queueDao.saveEntity({
            title: "Rugby",
            queue_url: "test",
            start_at: new Date().toISOString(),
            prestart: 5,
            number_of_places: 3
        });
        console.log(queue);
        let queues = await queueDao.readEntities();
        console.log(queues);
        queue.number_of_places = 5;
        await queueDao.updateEntity(queue);
        queues = await queueDao.readEntities();
        console.log(queues);
        await placeDao.saveEntity({
            queue_id: queue.id,
            id: 1
        });
        await placeDao.saveEntity({
            queue_id: queue.id,
            id: 2
        });
        await placeDao.saveEntity({
            queue_id: queue.id,
            id: 3
        });
        let places = await placeDao.readEntitiesByQueueId(queue.id);
        console.log(places);
        await queueDao.deleteEntity(queue.id);
        queues = await queueDao.readEntities();
        console.log(queues);
        places = await placeDao.readEntitiesByQueueId(queue.id);
        console.log(places);
    } catch (e) {
        console.log(e)
    }
})();