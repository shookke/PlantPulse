const express = require('express');
const authMiddleware = require('../middlewares/auth');
const jwt = require('jsonwebtoken');
const Device = require('../models/Device');
const Plant = require('../models/Plant');
const PlantType = require('../models/PlantType');
const { cacheData, invalidateCacheByKey } = require('../utils/cacheUtils'); // Import cache helpers

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Create a new device
// POST /api/v1/devices/
// Requires authentication
// body: { "device": {
//           "deviceUUID": "xxx", 
//           "deviceType": "camera || sensor",  
//           "devicePoP": "xxx"
//         },
//         "plant": {
//           "plantType": "PlantTypeId",
//           "container": "ContainerId",
//           "area": "AreaId",
//           "datePlanted": "2019-03-04",
//           "dateHarvested": null,
//           "lastFertilizationDate": null
//          },
//          "connectTo": "DeviceID"
//       }
router.post('/', async (req, res) => {
  try {
    const { device, plant, connectTo, plantTypeId, plantName, plantId } = req.body;
    var token = null;

    // Validate required fields
    if (!device.deviceUUID || (!device.deviceUUID && ((!plant && (!plantTypeId && !plantName)) && !plantId))) {
      return res.status(500).json({ message: 'Missing fields' });
    }

    // Set user reference
    device.user = req.user.id;

    // Create new device
    const newDevice = new Device(device);

    // Handle plant creation
    if (plant) {
      plant.user = req.user.id;
      const newPlant = await Plant.create(plant);
      newDevice.plants.push(newPlant);
    }

    if (plantTypeId) {
      const plantType = await PlantType.findById(plantTypeId);
      const newPlant = await Plant.create({ user: req.user.id, plantType: plantType, plantName: (plantName || plantType.commonName) });
      newDevice.plants.push(newPlant);
    }

    if (plantId) {
      const newPlant = await Plant.findById(plantId);
      newDevice.plants.push(newPlant);
    }

    // If it's a sensor, update the camera device to connect to
    if (device.deviceType === 'sensor' && connectTo) {
      const deviceHub = await Device.findById(connectTo);
      deviceHub.connectedDevices.push(newDevice);
      await deviceHub.save();
      await invalidateCacheByKey(`device:${deviceHub.id}`)
    }

    // Save the new device
    await newDevice.save();

    // Generate Token for camera devices
    if (device.deviceType === 'camera') {
      const expiresIn = '365d';
      token = jwt.sign({ id: req.user.id }, SECRET_KEY,  { expiresIn });
    }
    // Invalidate cache for devices list
    await invalidateCacheByKey(`devices:${req.user.id}`);
   

    res.status(201).json({ token: token, device: newDevice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering device' });
  }
});

// Update device
// PATCH /api/v1/devices/:deviceID
// Requires authentication
// Can only update plant and if sensor the hub it connects to
// Body: { "toAdd": {
//         "newPlant": {
//           "plantType": "PlantTypeId",
//           "plantName": "User input plant name'"
//         },
//         "plants": ["PlantId1", "PlantId2"],
//         "connectTo": "DeviceID
//       },
//       "toRemove": {
//         "plants": ["PlantId1", "PlantId2"],
//         "connectedTo": "DeviceID"
//        }
//     }    
router.patch('/:deviceID', async (req, res) => {
  try {
    const { deviceID } = req.params;
    const { toAdd, toRemove } = req.body;

    // Fetch the device and connected entities
    const device = await Device.findById(deviceID)
      .populate('plants')
      .populate('connectedDevices');

    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }

    const promises = [];

    // Handle additions
    if (toAdd) {
      if (toAdd.newPlant) {
        const newPlant = toAdd.newPlant;
        newPlant.plantType = await PlantType.findById(newPlant.plantType);
        newPlant.user = req.user.id;
        const newPlantPromise = Plant.create(newPlant);
        promises.push(newPlantPromise.then((createdPlant) => {
          device.plants.push(createdPlant);
        }));
      }

      if (toAdd.plants) {
        toAdd.plants.forEach((plant) => {
          if (!device.plants.includes(plant)) {
            device.plants.push(plant);
          }
        });
      }

      if (toAdd.connectTo) {
        const deviceToAdd = Device.findById(toAdd.connectTo);
        promises.push(deviceToAdd.then((foundDevice) => {
          device.connectedDevices.push(foundDevice);
        }));
      }
    }

    // Handle removals
    if (toRemove) {
      if (toRemove.plants) {
        const removePlantPromises = toRemove.plants.map(async (plantID) => {
          device.plants.pull(plantID);
        });
        promises.push(...removePlantPromises);
      }

      if (toRemove.connectedTo) {
        const deviceHub = Device.findById(toRemove.connectedTo);
        promises.push(deviceHub.then((foundHub) => {
          if (foundHub) {
            device.connectedDevices.pull(foundHub._id);
          }
        }));
      }
    }

    // Await all parallel actions
    await Promise.all(promises);

    // Save the updated device
    await device.save();

    // Invalidate cache for this specific device and devices list
    await invalidateCacheByKey(`device:${deviceID}`);
    await invalidateCacheByKey(`devices:${req.user.id}`);

    res.status(200).json(device);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error updating device', error });
  }
});

// Fetch list of devices with Redis caching
router.get('/', async (req, res) => {
  const redisKey = `devices:${req.user.id}`;

  try {
    const devices = await cacheData(redisKey, async () => {
      return Device.find({ user: req.user.id })
      .populate({ 
        path: 'connectedDevices',
        populate: [
          { path:'plants',
            populate: [
              { path:'plantType' },
              { path:'container' },
              { path:'area' }
            ]
           },
        ]
      })
      .populate({ 
        path: 'plants',
        populate: [
          { path:'plantType' },
          { path:'container' },
          { path:'area' }
        ]
      })
      .exec();
    });

    res.json({ devices });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching devices' });
  }
});

// Fetch device by ID with Redis caching
router.get('/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const redisKey = `device:${deviceId}`;

  try {
    const device = await cacheData(redisKey, async () => {
      const foundDevice = await Device.findById(deviceId)
      .populate({ 
        path: 'connectedDevices',
        populate: [
          { path:'plants',
            populate: 'plantType'
           },
        ]
      })
      .populate({ 
        path: 'plants',
        populate: [
          { path:'plantType' },
          { path:'container' },
          { path:'area' }
        ]
      })
      .exec();

      if (!foundDevice) {
        console.error('No Device Found.');
      }
      return foundDevice;
    });

    res.json({ device });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching device' });
  }
});

// Delete device and invalidate cache
router.delete('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Delete the device
    await Device.findByIdAndDelete(deviceId);

    await Device.updateMany(
      { connectedDevices: deviceId },
      { $pull: { connectedDevices: deviceId } }
    );

    // Invalidate cache for this device and the devices list
    await invalidateCacheByKey(`device:${deviceId}`);
    await invalidateCacheByKey(`devices:${req.user.id}`);

    res.status(200).json({ message: 'Device deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting device' });
  }
});

router.post('/status/:deviceUUID', async (req, res) => {
  try {
    const { deviceUUID } = req.params;
    const { batteryLevel } = req.body;
    const redisKey = `devices:${deviceUUID}`;

    const device = await Device.findOne({deviceUUID: deviceUUID});

    // Check if device exists
    if (!device) {
      throw new Error('Device not found');
    }

    // Update device status
    device.batteryLevel = batteryLevel;
    device.save();

    // Invalidate cache for this device and the devices list
    await invalidateCacheByKey(`device:${deviceId}`);
    await invalidateCacheByKey(`devices:${req.user.id}`);

    res.status(200).json({ device });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating device' });
  }
});


module.exports = router;