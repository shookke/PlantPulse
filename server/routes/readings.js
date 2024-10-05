const { nanoid } = require('nanoid');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const authMiddleware = require('../middlewares/auth');
const Reading = require('../models/Reading');
const Plant = require('../models/Plant');
const s3 = require('../config/s3Client'); // Import S3 client
const { cacheData, invalidateCacheByPattern } = require('../utils/cacheUtils'); // Import cache helpers

const router = express.Router();

router.use(authMiddleware);

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

// Retrieve a user's plant readings by plant ID, with Redis caching
router.get('/:plantId', async (req, res) => {
  const { plantId } = req.params;
  const page = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 20);
  const redisKey = `plant:${plantId}:readings:page:${page}`;

  try {
    // Fetch plant readings and cache them
    const data = await cacheData(redisKey, async () => {
      const plant = await Plant.findById(plantId);
      if (!plant) throw new Error('Plant not found');

      const readingsList = await Reading.find({ plant: plant._id })
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();
      return { plant, readings: readingsList };
    });

    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching readings' });
  }
});

// Create a new reading and invalidate Redis cache after a new entry
router.post('/', async (req, res) => {
  try {
    const reading = req.body.reading;
    const newReading = await Reading.create(reading);

    // Invalidate Redis cache for this plant
    const plantId = reading.plant;
    if (plantId) {
      await invalidateCacheByPattern(`plant:${plantId}:readings:page:*`);
    } else {
      console.error('Invalid plantId for cache invalidation');
    }

    res.status(201).json(newReading);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding reading.' });
  }
});

// Upload a photo for processing, with Redis caching for prediction results
router.post('/upload', upload.single('file'), async (req, res) => {
  const hash = crypto.createHash('md5').update(req.file.buffer).digest('hex');
  const filename = nanoid() + '.jpg';
  const redisKey = `plant:predictions:${hash}`;

  try {
    // Save image in MinIO via S3 API
    const params = {
      Bucket: 'plants', // Bucket name
      Key: filename,    // File name
      Body: req.file.buffer, // File buffer
      ContentType: req.file.mimetype // File mime type
    };

    await s3.putObject(params).promise(); // Upload the file

    // Check if prediction results are cached
    const predictions = await cacheData(redisKey, async () => {
      // Send the image filename to the machine learning service for prediction
      const response = await axios.post('http://machine_learning:5000/plant/predict', 
      { filename: filename }, 
      { headers: { 'Content-Type': 'application/json' } });

      return response.data;
    });

    res.json(predictions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading file or processing prediction.' });
  }
});

module.exports = router;