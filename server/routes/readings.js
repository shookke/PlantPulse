const express = require('express');
const Reading = require('../models/Reading');
const Device = require('../models/Device');

const router = express.Router();

router.post('/addReading', async (req, res) => {
  try {
    // Add a new Reading
    const { deviceId, temperature, humidity, lightLevel } = req.body;
    const device = await Device.findById(deviceId);
    const reading = new Reading({ device, temperature, humidity, lightLevel });
    await reading.save();
    res.status(201).json(reading);
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding reading.' });
  }
});

router.get('/', async (req, res) => {
  try {
    res.status(500).json({ message: 'Error fetching devices' });
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching devices' });
  }
});

router.get('/:deviceId', async (req, res) => {
  try {
    // Fetch readings for device
    const { deviceId } = req.params.deviceId;
    const readingsList = await Reading.find({ deviceId: deviceId });
    res.json({ readings: readingsList });
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching readings' });
  }
});

module.exports = router;