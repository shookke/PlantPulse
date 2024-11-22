const express = require('express');
const morgan = require("morgan");
const cors = require('cors');
const Reading = require('./models/Reading');
const Plant = require('./models/Plant');
const Task = require('./models/Task');
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
const tasksRouter = require('./routes/tasks');

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
app.use('/api/v1/tasks', tasksRouter);

// Define the job processor
taskQueue.process(async (job) => {
  try {
    console.log('Processing task with plant ID:', job.data.plant);

    // Find the plant by ID
    const plant = await Plant.findById(job.data.plant)
    .populate('plantType')
    .populate({
      path: 'latestReading'
    })
    .exec();

    if (!plant) {
      console.error('Plant not found for ID:', job.data.plant);
      return;
    }

    // Retrieve plant type and acceptable metric ranges
    const plantType = plant.plantType;

    // Get the current date and 24 hours ago
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago

    // Fetch readings for the last 24 hours
    const readings = await Reading.find({
      plant: plant._id,
      timestamp: { $gte: startDate, $lte: endDate },
    });

    // Calculate averages for temperature, humidity, and lux
    let tempSum = 0,
      tempCount = 0;
    let humiditySum = 0,
      humidityCount = 0;
    let luxSum = 0,
      luxCount = 0;

    readings.forEach((reading) => {
      if (reading.temperature !== undefined) {
        tempSum += reading.temperature;
        tempCount++;
      }
      if (reading.humidity !== undefined) {
        humiditySum += reading.humidity;
        humidityCount++;
      }
      if (reading.lux !== undefined) {
        luxSum += reading.lux;
        luxCount++;
      }
    });

    const avgTemperature = tempCount ? tempSum / tempCount : null;
    const avgHumidity = humidityCount ? humiditySum / humidityCount : null;
    const avgLux = luxCount ? luxSum / luxCount : null;

    // Define the metrics to check and their acceptable ranges
    const metrics = [];

    // Soil Moisture - use current reading
    const soilMoisture = plant.latestReading.soilMoisture;
    if (soilMoisture !== undefined) {
      metrics.push({
        name: 'soilMoisture',
        value: soilMoisture,
        min: plantType.minSoilMoisture,
        max: plantType.maxSoilMoisture,
      });
    }

    // Temperature - use daily average
    if (avgTemperature !== null) {
      metrics.push({
        name: 'temperature',
        value: avgTemperature,
        min: plantType.minTemperature,
        max: plantType.maxTemperature,
      });
    }

    // Humidity - use daily average
    if (avgHumidity !== null) {
      metrics.push({
        name: 'humidity',
        value: avgHumidity,
        min: plantType.minHumidity,
        max: plantType.maxHumidity,
      });
    }

    // Lux - use daily average
    if (avgLux !== null) {
      metrics.push({
        name: 'lux',
        value: avgLux,
        min: plantType.minLux,
        max: plantType.maxLux,
      });
    }

    // uvA, uvB, and uvC - use current readings
    const uvA = plant.latestReading.uvA;
    if (uvA !== undefined) {
      metrics.push({
        name: 'uvA',
        value: uvA,
        max: plantType.uvA,
      });
    }

    const uvB = plant.latestReading.uvB;
    if (uvB !== undefined) {
      metrics.push({
        name: 'uvB',
        value: uvB,
        max: plantType.uvB,
      });
    }

    const uvC = plant.latestReading.uvC;
    if (uvC !== undefined) {
      metrics.push({
        name: 'uvC',
        value: uvC,
        max: plantType.uvC,
      });
    }

    // Iterate through metrics and create Task objects if out of range
    for (const metric of metrics) {
      let outOfRange = false;
      let message = '';

      switch (metric.name) {
        case 'soilMoisture':
          if (metric.value < metric.min) {
            outOfRange = true;
            message = `Your plant ${plant.plantName} needs watering. The soil moisture is ${metric.value}, which is below the minimum of ${metric.min}.`;
          }
          break;

        case 'temperature':
          if (metric.value < metric.min) {
            outOfRange = true;
            message = `The average temperature for your plant ${plant.plantName} is too low (${metric.value}°C). Please keep it at a temperature above ${metric.min}°C.`;
          } else if (metric.value > metric.max) {
            outOfRange = true;
            message = `The average temperature for your plant ${plant.plantName} is too high (${metric.value}°C). Please keep it below ${metric.max}°C.`;
          }
          break;

        case 'humidity':
          if (metric.value < metric.min) {
            outOfRange = true;
            message = `The average humidity for your plant ${plant.plantName} is too low (${metric.value}%). Please increase humidity above ${metric.min}%.`;
          } else if (metric.value > metric.max) {
            outOfRange = true;
            message = `The average humidity for your plant ${plant.plantName} is too high (${metric.value}%). Please decrease humidity below ${metric.max}%.`;
          }
          break;

        case 'lux':
          if (metric.value < metric.min) {
            outOfRange = true;
            message = `Your plant ${plant.plantName} is receiving too little light. The average lux is ${metric.value}, which is below the minimum of ${metric.min}. Please move it to a brighter location.`;
          } else if (metric.value > metric.max) {
            outOfRange = true;
            message = `Your plant ${plant.plantName} is receiving too much light. The average lux is ${metric.value}, which is above the maximum of ${metric.max}. Please provide shade.`;
          }
          break;

        case 'uvA':
          if (metric.value > metric.max) {
            outOfRange = true;
            message = `Your plant ${plant.plantName} is exposed to high UVA levels (${metric.value}). Please consider shading the plant.`;
          }
          break;

        case 'uvB':
          if (metric.value > metric.max) {
            outOfRange = true;
            message = `Your plant ${plant.plantName} is exposed to high UVB levels (${metric.value}). Please consider shading the plant.`;
          }
          break;

        case 'uvC':
          if (metric.value > metric.max) {
            outOfRange = true;
            message = `Your plant ${plant.plantName} is exposed to high UVC levels (${metric.value}). Please consider shading the plant.`;
          }
          break;

        default:
          break;
      }

      if (outOfRange) {
        console.log(`Metric ${metric.name} out of range for plant ${plant.plantName}`);

        // Check if there's an existing pending task for this plant and metric
        const existingTask = await Task.findOne({
          user: plant.user,
          plant: plant._id,
          metric: metric.name,
          status: 'pending',
        });

        if (!existingTask) {
          // Create a new Task for the user
          const newTask = new Task({
            user: plant.user,
            plant: plant._id,
            metric: metric.name,
            message: message,
            status: 'pending',
          });

          await newTask.save();
          console.log('New Task created:', newTask);
        } else {
          console.log(`Task for metric ${metric.name} already exists for plant ${plant.plantName}`);
        }
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