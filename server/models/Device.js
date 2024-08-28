const mongoose = require('mongoose');

// Define Device model
const deviceSchema = new mongoose.Schema({
  deviceMAC: String,
  plantType: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;