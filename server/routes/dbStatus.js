const express = require('express');
const router = express.Router();

// Set up mongoose connection
const mongoose = require('mongoose');
mongoose.set("strictQuery", false);
const mongoDB = "mongodb://mongo:27017/plantpulse";

async function main() {
    // Connect to MongoDB
    await mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
}

router.get('/', (req, res) => {
    res.json({ dbState: mongoose.STATES[mongoose.connection.readyState] });
});

module.exports = router;