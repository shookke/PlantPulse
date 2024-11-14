const Queue = require('bull');
const Redis = require('ioredis');

function createRedisClient() {
    return new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || null,
      enableReadyCheck: false,  // Disable to avoid the Bull compatibility issue
      maxRetriesPerRequest: null, // Disable to avoid the Bull compatibility issue
    });
  }

// Create a Bull queue
const taskQueue = new Queue('taskQueue', {
    createClient: function (type) {
        switch (type) {
            case 'client':
                return createRedisClient();
            case 'subscriber':
                return createRedisClient();
            case 'bclient':
                return createRedisClient();
            default:
                throw new Error('Unexpected connection type: ' + type);
        }
    },
});

module.exports = taskQueue;