const mongoose = require('mongoose');

// Define Reading model
const readingSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  lightLevel: Number,
  device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' }
});

const Reading = mongoose.model('Reading', readingSchema);

module.exports = Reading;