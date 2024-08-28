const express = require('express');
const authMiddleware = require('../middlewares/auth');
const Reading = require('../models/Reading');
const Device = require('../models/Device');

const router = express.Router();

router.post('/addReading', authMiddleware, async (req, res) => {
  try {
    // Add a new Reading
    const { deviceId, temperature, humidity, lightLevel, waterLevel } = req.body;
    const device = await Device.findById(deviceId);

    // If device not found, return error
    if (!device) { return res.status(500).json({ message: 'Device not found.' }); }

    // Save reading to database
    const reading = new Reading({ device, temperature, humidity, lightLevel, waterLevel });
    await reading.save();

    // Return new reading as response
    res.status(201).json(reading);
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding reading.' });
  }
});

router.get('/', authMiddleware,async (req, res) => {
  try {
    res.status(500).json({ message: 'Error fetching devices' });
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching devices' });
  }
});

router.get('/:deviceId', authMiddleware, async (req, res) => {
  const { deviceId } = req.params;
  const page = parseInt(req.query.page || 1);
  const limit = parseInt(req.query.limit || 20);
  try {
    // Fetch readings for device
    const device = await Device.findById(deviceId);
    const readingsList = await Reading.find({ device:  device._id })
      .sort({ createdAt: 1 })
      .skip((page -  1) * limit)
      .limit(limit)
      .exec();
    res.json({ device: device, readings: readingsList });
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching readings' });
  }
});

module.exports = router;