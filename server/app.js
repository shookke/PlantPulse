const express = require('express');
var morgan = require("morgan");
const cors = require('cors');

// Import Models
require('./models/User');
require('./models/Device');
require('./models/Reading');

// App Init
const app = express();

// Import Routes
const usersRouter = require('./routes/users');
const devicesRouter = require('./routes/devices');
const readingsRouter = require('./routes/readings');
const port = 3001;

// Set up mongoose connection
const mongoose = require('mongoose');
mongoose.set("strictQuery", false);
const db = require('./db');

// API Key
const apiKeys = ['9iKUKv2nD$pxWv%v*f6Jdxt&FgcRuM&up6Z*ZBNS2krxxHKj4UnBi9yVKPPJNCj#qbeYoZHfwct&oCVy&cuCsRZeSQp3BoDiM8qrJ94H$Pe63CLb*xD5s@eK75VX69e#'];

// main().catch((err) => console.log(err));

// async function main() {
  
// }
// Custom CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000', // Replace with your frontend domain
  methods: 'GET,POST', // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
};

app.use(cors(corsOptions));

// Parse JSON requests
app.use(express.json());

// Enable request logging
app.use(morgan("common"));

// Define a route for GET requests to /
// app.use("/api/0.1/", routes);
// app.use('/api/0.1/db_status', dbStatus);
app.use('/api/users', usersRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/readings', readingsRouter);

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});