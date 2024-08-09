const express = require('express');
const Device = require('../models/Device');
const User = require('../models/User');

const router = express.Router();

router.post('/register-device', async (req, res) => {
  try {
    // Register new device
    const { userId, deviceMAC, plantType } = req.body;
    const user = await User.findById(userId);
    const newDevice = new Device({ deviceMAC, plantType, user });
    await newDevice.save();
    res.status(201).json(newDevice);
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering device' });
  }
});

router.get('/', async (req, res) => {
  try {
    // Fetch devices
    const deviceList = await Device.find({ user: req.body.userId }).exec();
    res.json({ devices: deviceList});
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching devices' });
  }
});

router.get('/:deviceId', async (req, res) => {
  try {
    // Fetch readings for device
    const { deviceId } = req.params;
    const device = await Device.findById(deviceId);
    res.json({ device });
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching readings' });
  }
});

module.exports = router;