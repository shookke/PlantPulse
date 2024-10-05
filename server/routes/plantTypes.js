const express = require('express');
const authMiddleware = require('../middlewares/auth');
const PlantType = require('../models/PlantType');
const { cacheData, invalidateCacheByPattern } = require('../utils/cacheUtils'); // Import cache helpers

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Retrieve list of known plant types with Redis caching
router.get('/', async (req, res) => {
  const page = parseInt(req.query.p || 1);
  const query = req.query.q || '';
  const redisKey = query 
    ? `plantTypes:search:${query}:page:${page}`
    : `plantTypes:page:${page}`;

  try {
    // Fetch plant types and cache them
    const data = await cacheData(redisKey, async () => {
      let types;
      if (query) {
        types = await PlantType.find({
          $text: { $search: query }
        })
          .sort({ name: 1 })
          .skip((page - 1) * 50)
          .limit(50);
      } else {
        types = await PlantType.find()
          .sort({ name: 1 })
          .skip((page - 1) * 50)
          .limit(50);
      }

      if (types.length === 0) {
        throw new Error('No results found');
      }
      return types;
    });

    return res.status(200).json({ types: data });
  } catch (error) {
    if (error.message === 'No results found') {
      return res.status(404).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: 'Error fetching plant types' });
  }
});

// Retrieve plant type details by ID using Mongoose and Redis caching
router.get('/:plantTypeId', async (req, res) => {
  const plantTypeId = req.params.plantTypeId;
  const redisKey = `plantType:${plantTypeId}`;

  try {
    // Fetch plant type data with caching
    const plantTypeData = await cacheData(redisKey, async () => {
      const plantType = await PlantType.findById(plantTypeId);
      if (!plantType) throw new Error('Plant type not found');
      return plantType;
    });

    return res.status(200).json(plantTypeData);
  } catch (error) {
    if (error.message === 'Plant type not found') {
      return res.status(404).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: 'Error fetching plant type data' });
  }
});

// Create a new plant type and invalidate the cache
router.post('/', async (req, res) => {
  try {
    const plantType = req.body.plantType;
    const newPlantType = await PlantType.create(plantType);

    if (!newPlantType) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    // Save the new plant type and invalidate the cache for plant types
    await newPlantType.save();
    await invalidateCacheByPattern(`plantTypes:page:*`); // Invalidate all cached pages

    return res.status(201).json(newPlantType);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error creating plant type' });
  }
});

module.exports = router;
