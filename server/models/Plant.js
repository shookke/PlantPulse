const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plantType: { type: mongoose.Schema.Types.ObjectId, ref: 'PlantType', required: true },
    container: { type: mongoose.Schema.Types.ObjectId, ref: 'Container' },
    area: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
    datePlanted: Date,
    dateHarvested: Date,
    lastFertilization: Date,
}, {timestamps: true});

const Plant = mongoose.model('Plant', plantSchema);

module.exports = Plant;