const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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
      name: req.body.name,
    });
  
    // Return new user
    res.status(201).json({Users: newUser});
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

    // Generate a JWT token for the existing user
    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: 'User logged in', token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error logging in user' });
  }
});

router.get('/:userId', async (req, res) => {
  try   {
    // Get user by id
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    // Return user
    res.json({ User: user });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error getting user by id' });
  }
});



module.exports = router;