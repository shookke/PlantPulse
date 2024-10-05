const redisClient = require('../config/redisClient'); // Import Redis client

// Helper function to cache and retrieve data from Redis
async function cacheData(key, fetchFunction, ttl = 3600) {
  const cachedData = await redisClient.get(key);
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  const freshData = await fetchFunction();
  await redisClient.setEx(key, ttl, JSON.stringify(freshData));
  return freshData;
}

// Helper function to invalidate cache
// Function to invalidate a specific key
async function invalidateCacheByKey(key) {
  if (!key || typeof key !== 'string') {
      throw new Error('Invalid cache key provided');
  }
  
  try {
      await redisClient.del(key);
      console.log(`Cache invalidated for key: ${key}`);
  } catch (error) {
      console.error(`Error invalidating cache for key: ${key}`, error);
  }
}

// Function to invalidate all cache keys matching a pattern
async function invalidateCacheByPattern(pattern) {
    if (!pattern || typeof pattern !== 'string') {
        throw new Error('Invalid cache pattern provided');
    }

    console.log(`Invalidating cache for pattern: ${pattern}`);

    const scanAsync = async (cursor, pattern) => {
        let result = [];
        let scanResult;

        cursor = cursor || '0';  // Start the scan with cursor '0'

        do {
            try {
                // Scan for matching keys
                scanResult = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
                //console.log(`Raw scan result: ${JSON.stringify(scanResult, null, 2)}`);  // Log the scan result
            } catch (err) {
                console.error('Error scanning keys:', err);
                throw err;
            }

            // Handle scanResult as an object with `cursor` and `keys` properties
            if (!scanResult || typeof scanResult !== 'object' || !('cursor' in scanResult && 'keys' in scanResult)) {
                //console.error('Unexpected scan result format:', scanResult);
                throw new Error(`Unexpected scan result format: ${JSON.stringify(scanResult)}`);
            }

            cursor = scanResult.cursor.toString();  // Ensure cursor is a string for next scan
            result = result.concat(scanResult.keys);  // Add the found keys to the result array

            //console.log(`Next cursor: ${cursor}, keys found: ${result.length}`);
        } while (cursor !== '0');  // Continue until cursor is '0'

        return result;
    };

    try {
        const keys = await scanAsync('0', pattern);

        if (keys.length > 0) {
            const multi = redisClient.multi();  // Use multi() for batch operations
            keys.forEach((key) => {
                multi.del(key);  // Queue deletion for each key
            });
            await multi.exec();  // Execute all commands in the queue
            console.log(`Cache invalidated for pattern: ${pattern}`);
        } else {
            console.log(`No cache keys found for pattern: ${pattern}`);
        }
    } catch (error) {
        console.error('Error invalidating cache by pattern:', error);
    }
}

module.exports = {
  cacheData,
  invalidateCacheByKey,
  invalidateCacheByPattern,
};
