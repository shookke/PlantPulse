const express = require('express');
const authMiddleware = require('../middlewares/auth');
const { cacheData, getCacheData, invalidateCacheByPattern, invalidateCacheByKey } = require('../utils/cacheUtils'); // Import cache helpers
const Task = require('../models/Task');

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id })
        .populate(
            { path:'plant',
              populate: [
                { path:'plantType' },
                { path:'container' },
                { path:'area' }
              ]
             });

        if(!tasks) {
            res.status(500).json({ message: 'No Tasks found for this user'});
        }

        res.status(200).json({ todos: tasks });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error occured retrieving tasks.\n Error: ${error}` });
    }
});

// Endpoint to complete a task specified by task id
router.post('/:taskId', async (req, res) => {
    try {
        const task = req.params.taskId;

        const result = await Task.findById(task);

        if (!result) {
            res.status(500).json({ message: 'No task found.' });
        }

        result.status = 'completed';

        result.save();

        res.status(200).json( result );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Error occured completing task.\n Error: ${error}` });
    }
})

module.exports = router;