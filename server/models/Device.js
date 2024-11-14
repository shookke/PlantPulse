const mongoose = require('mongoose');

// Define Device model
const deviceSchema = new mongoose.Schema({
  deviceType: { type: String, enum: ["camera", "sensor" ]},
  deviceUUID: { type: String, unique: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  connectedDevices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
  plants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plant'}],
  batteryLevel: { type: Number, min: 0.0, max: 1.0 }
}, { timestamps: true });

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;