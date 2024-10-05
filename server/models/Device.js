const mongoose = require('mongoose');

// Define Device model
const deviceSchema = new mongoose.Schema({
  deviceType: { type: String, enum: ["camera", "sensor" ]},
  deviceUUID: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  connectedDevices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
  plants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plant'}],
}, { timestamps: true });

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;