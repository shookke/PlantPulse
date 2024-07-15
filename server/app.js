const express = require('express');
const app = express();
const port = 3000;
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(`mongodb://mongo:27017/`, { useNewUrlParser: true, useUnifiedTopology: true });

// Define a route for GET requests to /
app.get('/', (req, res) => {
    // Find all documents in the collection
    mongoose.connection.collection('mycollection').find({}).then((docs) => {
        res.send(docs);
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});