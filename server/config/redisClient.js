// redisClient.js
const redis = require('redis');

// Initialize Redis client
const redisClient = redis.createClient({
    url: process.env.REDIS_URL, // Use environment variables to manage configuration
});

// Handle connection events
redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

// Connect to Redis and handle errors
redisClient.connect().catch((error) => {
  console.error('Redis connection error:', error);
});

module.exports = redisClient;
