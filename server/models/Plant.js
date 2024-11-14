const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    plantType: { type: mongoose.Schema.Types.ObjectId, ref: 'PlantType', required: true },
    container: { type: mongoose.Schema.Types.ObjectId, ref: 'Container' },
    area: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
    plantName: { type: String, required: true },
    datePlanted: Date,
    dateHarvested: Date,
    lastFertilization: Date,
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

plantSchema.virtual('latestReading', {
    ref: 'Reading',
    localField: '_id',
    foreignField: 'plant',
    justOne: true, 
    options: { sort: { createdAt: -1 } } 
});


const Plant = mongoose.model('Plant', plantSchema);

module.exports = Plant;