const mongoose = require('mongoose');

const containerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: String,
    description: String,
    width: Number,
    height: Number,
    length:Number,
    radius: Number,
    volume: Number,
});

const Container = mongoose.model('Container', containerSchema)

module.exports = Container;