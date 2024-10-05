const express = require('express');
const authMiddleware = require('../middlewares/auth');
const User = require('../models/User');
const Device = require('../models/Device');
const Reading = require('../models/Reading');
const Plant = require('../models/Plant');
const Area = require('../models/Area');
const Container = require('../models/Container');
const { cacheData, invalidateCacheByKey } = require('../utils/cacheUtils'); // Import cache helpers

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

//////////////////////////////////////////////////////
// Plant Areas
//////////////////////////////////////////////////////

// Create a new plant area
// POST /api/v1/plants/areas
// Required Authentication
// @body: {
//     name: String,
//     areaType: String (indoor/outdoor),
//     icon: String,
//     description: String
// }
router.post('/areas', async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { name, areaType, icon, description } = req.body;

        const newArea = await Area.create({
            user,
            name,
            areaType,
            icon,
            description
        });

        // Invalidate cache for areas
        await invalidateCacheByKey(`areas:${req.user.id}`);

        newArea.user = undefined;
        return res.status(201).json(newArea);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error creating new Area.", error });
    }
});

// Retrieve all areas for the authenticated user
// GET /api/v1/plants/areas
// Required Authentication 
// return: {
//     areas: [area]
// }
router.get('/areas', async (req, res) => {
    const redisKey = `areas:${req.user.id}`;

    try {
        const areas = await cacheData(redisKey, async () => {
            return Area.find({ user: req.user.id });
        });

        res.status(200).json({ areas });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error retrieving areas." });
    }
});

// Add a plant to an area
// POST /api/v1/plants/areas/:areaId
// Required Authentication
// @body: {
//     plantId: String,
// }
router.post('/areas/:areaId', async (req, res) => {
    try {
        const area = await Area.findById(req.params.areaId);
        if (!area) {
            return res.status(500).json({ message: 'No area found.' });
        }

        const plant = await Plant.findById(req.body.plantId);
        if (!plant) {
            return res.status(500).json({ message: 'No plant found.' });
        }

        plant.area = area;
        await plant.save();

        // Invalidate cache for the area and associated plants
        await invalidateCacheByKey(`plants:${req.user.id}`);

        return res.status(200).json(area);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error adding plant to area.' });
    }
});

// Retrieve area and associated plants
// GET /api/v1/plants/areas/:areaId
// Required Authentication
// @params: { areaId }
// returns: { [Area] }
router.get('/areas/:areaId', async (req, res) => {
    const redisKey = `area:${req.params.areaId}`;

    try {
        const area = await cacheData(redisKey, async () => {
            return Area.findById(req.params.areaId).populate('plants');
        });

        if (!area) {
            return res.status(500).json({ message: 'Area not found.' });
        }

        return res.status(200).json(area);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error retrieving area.' });
    }
});

// Delete an area and disassociate plants from area
// DELETE /api/v1/plants/areas/:areaId
// Required Authentication
// @params: { areaId }
router.delete('/areas/:areaId', async (req, res) => {
    try {
        const areaId = req.params.areaId;

        // Fetch all plants associated with this area before deletion
        const affectedPlants = await Plant.find({ area: areaId });

        // Delete the area
        await Area.findByIdAndDelete(areaId);

        // Disassociate the area from all associated plants
        await Plant.updateMany({ area: areaId }, { $unset: { area: '' } });

        // Invalidate cache for each affected plant
        const invalidatePlantCaches = affectedPlants.map(async (plant) => {
            await invalidateCacheByKey(`plant:${plant._id}`);
        });

        // Wait for all caches to be invalidated
        await Promise.all(invalidatePlantCaches);

        // Invalidate cache for the user's plant list
        await invalidateCacheByKey(`plants:${req.user.id}`);

        // Invalidate cache for the user's area list
        await invalidateCacheByKey(`areas:${req.user.id}`);

        return res.status(200).json({ message: 'Area deleted and disassociated from plants successfully.' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error deleting area.' });
    }
});

//////////////////////////////////////////////////////
// Containers Routes
//////////////////////////////////////////////////////

// Retrieve list of standard plant pots and containers
// GET /api/v1/plants/containers
// Required Authentication
router.get('/containers', async (req, res) => {
    const redisKey = `containers`;

    try {
        const containers = await cacheData(redisKey, async () => {
            return Container.find();
        });

        return res.status(200).json(containers);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error retrieving containers.' });
    }
});

// Create new plant container
router.post('/containers', async (req, res) => {
    try {
        const container = req.body.container;
        const newContainer = new Container(container);
        await newContainer.save();

        // Invalidate cache for containers
        await invalidateCacheByKey('containers');

        return res.status(201).json(newContainer);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error creating container.' });
    }
});

//////////////////////////////////////////////////////
// Plants routes
//////////////////////////////////////////////////////

// Retrieve all user's plants
// GET /api/v1/plants
// Required Authentication
router.get('/', async (req, res) => {
    const redisKey = `plants:${req.user.id}`;

    try {
        const plants = await cacheData(redisKey, async () => {
            return Plant.find({ user: req.user.id })
                .populate('plantType')
                .populate('container')
                .populate('area');
        });

        return res.status(200).json({ plants });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error });
    }
});

// Retrieve a plant by ID
// GET /api/v1/plants/:plantId
// Required Authentication
router.get('/:plantId', async (req, res) => {
    const redisKey = `plant:${req.params.plantId}`;

    try {
        const plantData = await cacheData(redisKey, async () => {
            const plant = await Plant.findById(req.params.plantId);
            if (!plant) throw new Error('Plant not found');

            const devices = await Device.find({ plant: req.params.plantId });
            const readings = await Reading.find({ plant: req.params.plantId });

            return { plant, devices, readings };
        });

        return res.status(200).json(plantData);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error retrieving plant.' });
    }
});

// Create a new plant
// POST /api/v1/plants
// Required Authentication
// @body: { 
//     plantName, 
//     plantType, 
//     container, 
//     area 
// }
router.post('/', async (req, res) => {
    try {
        const { plant, plantType, container, area, datePlanted } = req.body;

        const plantData = plant || { plantType, container, area, datePlanted };
        if (!plant && !plantType) {
            return res.status(400).json({ message: 'Missing required plant data.' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        plantData.user = user;
        const newPlant = await Plant.create(plantData);
        newPlant.user = undefined;

        // Invalidate cache for plants
        await invalidateCacheByKey(`plants:${req.user.id}`);

        return res.status(201).json({ newPlant });
    } catch (error) {
        console.error('Error creating new plant:', error);
        return res.status(500).json({ message: 'Error creating new plant.', error });
    }
});

// Remove a plant
// DELETE /api/v1/plants/:plantId
// Requited Authentication
router.delete('/:plantId', async (req, res) => {
    try {
        await Plant.findByIdAndDelete(req.params.plantId);

        // Invalidate cache for this plant and the user's plants list
        await invalidateCacheByKey(`plant:${req.params.plantId}`);
        await invalidateCacheByKey(`plants:${req.user.id}`);

        return res.status(204).json();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error removing plant.' });
    }
});

module.exports = router;