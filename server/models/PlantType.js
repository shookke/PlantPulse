const mongoose = require('mongoose');

const plantTypeSchema = new mongoose.Schema({
    image: String,
    commonName: {type: String, required: true},
    scientificName: {type: String, required: true},
    family: {type: String, required: true},
    description: {type: String, required: true},
    watering: {type: String},
    lighting: {type: String},
    minLight: {type: Number},
    maxLight: {type: Number},
    uvA: {type: Number},
    uvB: {type: Number},
    uvC: {type: Number},
    minTemperature: {type: Number},
    maxTemperature: {type: Number},
    minHumidity: {type: Number},
    maxHumidity: {type: Number},
    minSoilMoisture: {type: Number},
    maxSoilMoisture: {type: Number}
}, {timestamps: true});

plantTypeSchema.index({
    commonName: 'text',
    scientificName: 'text',
    family: 'text',
});

const PlantType = mongoose.model('PlantType', plantTypeSchema);

module.exports = PlantType;