const { createClient } = require('redis');
require('dotenv').config();

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL
});

// Connect to Redis and handle connection events
(async () => {
  redisClient.on('error', (err) => console.error('Redis Client Error:', err));
  redisClient.on('connect', () => console.log('Connected to Redis'));
  redisClient.on('reconnecting', () => console.log('Reconnecting to Redis'));
  
  await redisClient.connect().catch(console.error);
})();

module.exports = { redisClient };
