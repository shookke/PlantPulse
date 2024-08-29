const mongoose = require('mongoose');

const ContainerSchema = new Schema({
    name: { type: String, required: true },
    description:{ type:String},
    width: Number,
    height: Number,
    length:Number,
    radius: Number,
    volume: Number,
});

module.exports = mongoose.model('Container', ContainerSchema);