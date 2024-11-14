const express = require('express');
const multer = require('multer');
const { nanoid } = require('nanoid');
const authMiddleware = require('../middlewares/auth');
const PlantType = require('../models/PlantType');
const s3 = require('../config/s3Client'); // Import S3 client
const { cacheData, invalidateCacheByKey, invalidateCacheByPattern } = require('../utils/cacheUtils'); // Import cache helpers

// Multer configuration for handling Image upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 4096 * 4096 },  // 4MB file size limit
  fileFilter: (req, file, cb) => {  // Validate file type
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(file.originalname.toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      return cb('Error: File type not supported');
    }
  }
});

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Retrieve list of known plant types with Redis caching
router.get('/', async (req, res) => {
  const page = parseInt(req.query.papge || 1);
  const limit = parseInt(req.query.limit || 20);
  const query = req.query.query || '';
  const redisKey = query 
    ? `plantTypes:search:${query}:page:${page}:limit:${limit}`
    : `plantTypes:page:${page}:limit:${limit}`;

  try {
    // Fetch plant types and cache them
    const data = await cacheData(redisKey, async () => {
      let types;
      if (query) {
        types = await PlantType.find({
          $or: [
            { commonName: { $regex: query, $options: 'i' } },
            { scientificName: { $regex: query, $options: 'i' } },
            { family: { $regex: query, $options: 'i' } }
          ]
        })
          .sort({ commonName: 1 })
          .skip((page - 1) * limit)
          .limit(limit);
      } else {
        types = await PlantType.find()
          .sort({ commonName: 1 })
          .skip((page - 1) * limit)
          .limit(limit);
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

router.patch('/:plantTypeId', async (req, res) => {
  try {
    const id = req.params.plantTypeId;
    const updates = req.body;
    const plantType = await PlantType.findByIdAndUpdate(id, updates, {
      runValidators: true
    });

    if (!plantType) {
      return res.status(404).send({ message: 'PlantType not found.'});
    }

    await invalidateCacheByPattern(`plantTypes:page:*`); // Invalidate all cached pages

    res.status(200).json(plantType);
  } catch (error) {
    return res.status(500).json({ message: 'Error updating plant type'});
  }
})

// Delete PlantType and invalidate cache
router.delete('/:plantTypeId', async (req, res) => {
  try {
    const { plantTypeId } = req.params;

    // Delete the device
    await PlantType.findByIdAndDelete(plantTypeId);

    // Invalidate cache for this PlantType and the devices list
    await invalidateCacheByKey(`plantType:${plantTypeId}`);
    await invalidateCacheByKey(`devices:${req.user.id}`);
    await invalidateCacheByKey(`plant:${req.params.plantId}`);
    await invalidateCacheByKey(`plants:${req.user.id}`);

    res.status(200).json({ message: 'PlantType deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting PlantType' });
  }
});

router.post('/images', upload.single('file'), async (req, res) => {
  const filename = `${nanoid()}.jpg`;
  const plantName = req.body.plantName;
  const s3Key = `${plantName}/${filename}`;

  try {
    // Save image in S3 bucket
    const params = {
      Bucket: 'classifier-training', // Bucket name
      Key: s3Key,    // File path in bucket
      Body: req.file.buffer, // File buffer
      ContentType: req.file.mimetype // File mime type
    };
    
    await s3.putObject(params).promise(); // Upload the file

    res.status(201).send({ message: 'File uploaded successfully', filename });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    res.status(500).send({ message: 'Error uploading file' });
  }
})

module.exports = router;
