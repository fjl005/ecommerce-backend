const redis = require('redis');
const redisClient = redis.createClient(6379);

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

module.exports = redisClient;