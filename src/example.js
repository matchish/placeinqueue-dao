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
        // console.log(queue);
        // let queues = await queueDao.readEntities();
        // console.log(queues);
        queue.number_of_places = 5;
        await queueDao.updateEntity(queue);
        // queues = await queueDao.readEntities();
        // console.log(queues);
        console.log('put places');
        await placeDao.saveEntity({
            queue_id: queue.id,
            id: 1,
            number_in_queue: 3
        });
        await placeDao.saveEntity({
            queue_id: queue.id,
            id: 2,
            number_in_queue: 3
        });
        await placeDao.saveEntity({
            queue_id: queue.id,
            id: 3,
            number_in_queue: -1
        });
        console.log('read places');
        let places = await placeDao.readEntitiesByQueue(queue);
        console.log(places);
        console.log('update place');
        await placeDao.updateEntity({
            queue_id: queue.id,
            id: 3,
            used: false,
            remote_id: "lorem",
            url: "google",
            number_in_queue: 2,
            proxy: {},
            cookies: [{}],
            useragent: "Chrome",
            heartbeat_at: new Date().toISOString()
        });
        console.log('read places');
        places = await placeDao.readEntitiesByQueue(queue);
        console.log(places);
        console.log('place', await  placeDao.readEntity({
            id: 3,
            queue_id: queue.id
        }));
        await queueDao.deleteEntity(queue.id);
        queues = await queueDao.readEntities();
        console.log(queues);
        places = await placeDao.readEntitiesByQueue(queue);
        console.log(places);
    } catch (e) {
        console.log(e)
    }
})();