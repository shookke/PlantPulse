const express = require('express');
const morgan = require("morgan");
const cors = require('cors');
const redisClient = require('./config/redisClient');
const taskQueue = require('./config/taskQueue');

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
const plantsRouter = require('./routes/plants');
const plantTypesRouter = require('./routes/plantTypes');
const port = 3001;

// Set up mongoose connection
const mongoose = require('mongoose');
mongoose.set("strictQuery", false);
const db = require('./db');

// API Key
const apiKeys = ['9iKUKv2nD$pxWv%v*f6Jdxt&FgcRuM&up6Z*ZBNS2krxxHKj4UnBi9yVKPPJNCj#qbeYoZHfwct&oCVy&cuCsRZeSQp3BoDiM8qrJ94H$Pe63CLb*xD5s@eK75VX69e#'];

// Custom CORS configuration
const corsOptions = {
  origin: 'http://localhost:3000', // Replace with your frontend domain
  methods: 'GET,POST', // Specify allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
};

// Cors setup
app.use(cors(corsOptions));

// Parse JSON requests
app.use(express.json());

// Enable request logging
app.use(morgan("common"));

// Define a route for GET requests to /
// app.use("/api/0.1/", routes);
// app.use('/api/0.1/db_status', dbStatus);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/devices', devicesRouter);
app.use('/api/v1/readings', readingsRouter);
app.use('/api/v1/plants', plantsRouter);
app.use('/api/v1/plantTypes', plantTypesRouter);

// Define the job processor
taskQueue.process(async (job) => {
  try {
    console.log('Processing task with plant ID:', job.data.plant);

    // Find the plant by ID
    const plant = await Plant.findOne({ plantId: job.data.plant }).populate('plantType');
    if (!plant) {
      console.error('Plant not found for ID:', job.data.plant);
      return;
    }

    // Retrieve plant type and acceptable metric ranges
    const plantType = plant.plantType;

    // Define the metrics to check and their acceptable ranges
    const metrics = [
      { name: 'temperature', value: plant.readings.temperature, min: plantType.minTemperature, max: plantType.maxTemperature },
      { name: 'humidity', value: plant.readings.humidity, min: plantType.minHumidity, max: plantType.maxHumidity },
      { name: 'soilMoisture', value: plant.readings.soilMoisture, min: plantType.minSoilMoisture, max: plantType.maxSoilMoisture },
    ];

    // Iterate through metrics and create Task objects if out of range
    for (const metric of metrics) {
      if (metric.value < metric.min || metric.value > metric.max) {
        console.log(`Metric ${metric.name} out of range for plant ${plant.plantId}`);
        
        // Create a new Task for the user
        const newTask = new Task({
          userId: plant.userId, // Assuming the Plant model contains a reference to the user
          plantId: plant.plantId,
          metric: metric.name,
          message: `The ${metric.name} value (${metric.value}) is out of the acceptable range (${metric.min} - ${metric.max}) for plant ${plant.plantId}.`,
        });
        
        await newTask.save();
        console.log('New Task created:', newTask);
      }
    }

    console.log('Background task completed');
  } catch (err) {
    console.error('Error processing task:', err);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

// Graceful shutdown for Redis client
process.on('SIGINT', () => {
  redisClient.quit(() => {
    console.log('Redis client disconnected on app termination');
    process.exit(0);
  });
});