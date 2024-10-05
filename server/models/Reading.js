const mongoose = require('mongoose');

// Define Reading model
const readingSchema = new mongoose.Schema({
  rgbImage: String,
  ndviImage: String,
  temperature: Number,
  humidity: Number,
  lux: Number,
  uvA: Number,
  uvB: Number,
  uvC: Number,
  waterLevel: Number,
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  plant: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant', required: true }
}, { timestamps: true });

const Reading = mongoose.model('Reading', readingSchema);

module.exports = Reading;