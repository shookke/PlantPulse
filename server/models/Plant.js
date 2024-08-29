const mongoose = require('mongoose');

const plantSchema = new Schema({
    plantType: PlantType,
    userId: String,
    container: Container,
    location: Location,
    datePlanted: Date,
    dateHarvested: Date,
    lastFertisationDate: Date,
}, {timestamps: true});

module.exports = mongoose.model('Plant', plantSchema);