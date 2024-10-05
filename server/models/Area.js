const mongoose = require('mongoose');

const areaSchema = new mongoose.Schema({
    user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, unique: true, required: true },
    areaType: { type: String, enum : ['indoor', 'outdoor'], required: true },
    icon: String,
    description: String,
});

const Area = mongoose.model('Area', areaSchema);

Area.init();

module.exports = Area;