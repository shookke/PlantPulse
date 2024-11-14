const { nanoid } = require('nanoid');
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const authMiddleware = require('../middlewares/auth');
const Reading = require('../models/Reading');
const Plant = require('../models/Plant');
const Device = require('../models/Device');
const s3 = require('../config/s3Client');
const taskQueue = require('../config/taskQueue');
const { cacheData, invalidateCacheByPattern, invalidateCacheByKey } = require('../utils/cacheUtils'); // Import cache helpers

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
      const plant = await Plant.findById(plantId)
      .populate('plantType')
      .exec();

      if (!plant) throw new Error('Plant not found');

      const readingsList = await Reading.find({ plant: plant._id })
        .sort({ createdAt: -1 })
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
    
    // Get associated device record
    const device = await Device.findOne({ deviceUUID: reading.deviceUUID });
    
    if(device) {
      // Add object refrences
      reading.device = device._id;
      if(device.plants.length == 0) {
        return res.status(500).json({ message: "No plant associated with this device."});
      }
      reading.plant = device.plants[0];
    }
    
    // Create the new reading
    const newReading = await Reading(reading);
    newReading.save();
    console.log(newReading);
    
    // Invalidate Redis cache for this plant
    const plantId = reading.plant;
    if (plantId) {
      await invalidateCacheByPattern(`plant:${plantId}:readings:page:*`);
      await invalidateCacheByKey(`plants:${req.user.id}`);
    } else {
      console.error('Invalid plantId for cache invalidation');
    }
    // Return response to client
    res.status(201).json(newReading);

    // Add reading to be processed to the task queue
    await taskQueue.add({ newReading });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding reading.' });
  }
});

// Upload a photo for processing, with Redis caching for prediction results
router.post('/upload', upload.single('file'), async (req, res) => {
  // Check if file exists with buffer
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: 'No file uploaded or file buffer is missing'});
  }

  try {
    // Generate unique filename and use for cache key
    const filename = nanoid() + '.jpg';
    const redisKey = `plant:predictions:${filename}`;
    
    // Save image in MinIO via S3 API
    const params = {
      Bucket: 'plants', // Bucket name
      Key: filename,    // File name
      Body: req.file.buffer, // File buffer
      ContentType: req.file.mimetype // File mime type
    };

    await s3.putObject(params).promise(); // Upload the file
    
    // Check if prediction results are cached
    const prediction = await cacheData(redisKey, async () => {
      // Send the image filename to the machine learning service for prediction
      const response = await axios.post('http://machine_learning:5000/plant/predict', 
      { filename: filename }, 
      { headers: { 'Content-Type': 'application/json' } });

      return response.data;
    });
    
    console.log(prediction);
    res.status(200).json({ prediction: prediction.prediction, filename: filename });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading file or processing prediction.' });
  }
});

module.exports = router;