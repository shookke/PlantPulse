const express = require('express');
const mongoose = require('mongoose');
const authMiddleware = require('../middlewares/auth');
const Device = require('../models/Device');
const User = require('../models/User');

const router = express.Router();

router.post('/register-device', authMiddleware,async (req, res) => {
  try {
    // Register new device
    const { deviceMAC, plantType } = req.body;
    if(!deviceMAC || !plantType){ return res.status(500).json({ message:'Missing fields' }); }
    const user = await User.findById(req.user.id);
    const newDevice = new Device({ deviceMAC, plantType, user });
    await newDevice.save();
    res.status(201).json(newDevice);
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering device' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    // Fetch devices of user
    const deviceList = await Device.find({ user: req.user.id }).exec();
    res.json({ devices: deviceList});
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching devices' });
  }
});

router.get('/:deviceId', authMiddleware, async (req, res) => {
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