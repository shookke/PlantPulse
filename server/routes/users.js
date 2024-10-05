const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middlewares/auth');
const User = require('../models/User');
const { cacheData, invalidateCacheByKey } = require('../utils/cacheUtils'); // Import cache utilities

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

// Register a new user
router.post('/', async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) return res.status(409).json({ message: 'User already exists!' });

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    // Register new user
    const newUser = await User.create({
      email: req.body.email,
      password: hashedPassword,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
    });

    // Remove password from newUser for response
    newUser.password = undefined;

    // Return new user
    res.status(201).json({ user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login a user and cache the user's data
router.post('/login', async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Compare password with hashed one from the database
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    // Remove password from the user object before sending it back to the client
    user.password = undefined;

    // Generate a JWT token for the existing user
    const expiresIn = req.body.stayLoggedIn ? '365d' : '1h';
    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn });

    // Cache the user data (optional)
    await cacheData(`user:${user._id}`, () => Promise.resolve(user));

    res.status(200).json({ message: 'User logged in', token, expiresIn, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in user' });
  }
});

// Get user by id with Redis caching
router.get('/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  const redisKey = `user:${userId}`;

  try {
    // Fetch user data with cache
    const user = await cacheData(redisKey, async () => {
      const userFromDb = await User.findById(new mongoose.mongo.ObjectId(userId));
      if (!userFromDb) throw new Error('User not found');
      userFromDb.password = undefined; // Remove password before caching
      return userFromDb;
    });

    res.json({ User: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error getting user by id' });
  }
});

// Renew token and refresh cache
router.post('/renewToken', authMiddleware, async (req, res) => {
  const { user } = req; // Retrieved from authMiddleware

  try {
    // Get user from the database
    const dbUser = await User.findById(new mongoose.mongo.ObjectId(user.id));
    if (!dbUser) return res.status(403).json({ message: 'Invalid credentials' });

    const expiresIn = req.body.stayLoggedIn ? '365d' : '1h';
    // Generate a JWT token for the existing user
    const token = jwt.sign({ id: dbUser._id }, SECRET_KEY, { expiresIn });

    // Refresh Redis cache for the user
    dbUser.password = undefined; // Remove password before caching
    await cacheData(`user:${dbUser._id}`, () => Promise.resolve(dbUser));

    res.status(201).json({ message: 'Token refreshed', token, expiresIn });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error renewing token' });
  }
});

module.exports = router;
