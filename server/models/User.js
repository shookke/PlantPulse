const mongoose = require('mongoose');

// Define User model
const userSchema = new mongoose.Schema({
  firstname: String,
  lastname: String,
  email: {
    type: String,
    unique: true,
    required: [true, 'Email is required'],
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: String,
  enabled: Boolean,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;