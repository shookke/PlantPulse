const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middlewares/auth');
const User = require('../models/User');

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

router.post('/register', async (req, res) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser!== null) return res.status(409).json({ message: 'User already exists!' });
    
    // Hash password
    const saltRounds =  10;
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
    res.status(201).json({user: newUser});
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

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
    var expiresIn;
    if (req.body.stayLoggedIn === true) { expiresIn = '365d'; } else { expiresIn = '1h'; };
    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn, });
    res.status(200).json({ message: 'User logged in', token, expiresIn: expiresIn, user });
  } 
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in user' });
  }
});

router.get('/:userId', authMiddleware, async (req, res) => {
  try   {
    // Get user by id
    const user = await User.findById(new mongoose.mongo.ObjectId(req.params.userId));
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Remove password from the user object before sending it back to the client
    user.password = undefined;
    
    // Return user
    res.json({ User: user });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error getting user by id' });
  }
});

router.post('/renewToken', authMiddleware, async (req, res) => {
  let user = await User.findById(new mongoose.mongo.ObjectId(req.user.id));
  if (user) {
    var expiresIn;
    if (req.body.stayLoggedIn === true) { expiresIn  = '365d'; } else { expiresIn   = '1h'; };
    // Generate a JWT token for the existing user
    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn });
    res.status(201).json({ message: 'Token refreshed', token, expiresIn });
  } 
  else {
    return res.status(403).json({ message: 'Invalid credentials' });
  }
});



module.exports = router;