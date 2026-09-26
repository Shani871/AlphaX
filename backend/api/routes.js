const express = require('express');
const { db } = require('../database/db');
const { contextEngine } = require('../engine/contextEngine');

const router = express.Router();

// Get the live context state for a session
router.get('/sessions/:id/state', (req, res) => {
    const sessionId = req.params.id;
    const state = contextEngine.getStateSummary(sessionId);
    
    if (!state) {
        return res.status(404).json({ error: 'Session not found or not active.' });
    }
    
    res.json(state);
});

// Get all persisted tasks for a session
router.get('/sessions/:id/tasks', async (req, res) => {
    const sessionId = req.params.id;
    try {
        const tasks = await db.getTasksBySession(sessionId);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Get all persisted events for a session
router.get('/sessions/:id/events', async (req, res) => {
    const sessionId = req.params.id;
    try {
        const events = await db.getEventsBySession(sessionId);
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

module.exports = router;
