const mongoose = require('mongoose');
const User = require('./User');

// Define Device model
const deviceSchema = new mongoose.Schema({
  deviceMAC: String,
  plantType: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;