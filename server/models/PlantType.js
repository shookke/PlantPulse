const mongoose = require('mongoose');

const PlantTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    family: String,
    description: String ,
    attributes: { 
        watering: String,
        lighting: String,
        uvIndex: Number,
        temperature: Number,
        humidity: Number,
        soilMoisture: Number,
    },
});

const PlantType = mongoose.model('PlantType', PlantTypeSchema);
