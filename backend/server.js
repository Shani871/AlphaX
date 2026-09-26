const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const { setupWebSocket } = require('./gateway/audioGateway');

const apiRoutes = require('./api/routes');

const PORT = process.env.PORT || 4000;

// Basic health check route matching screenshot
app.get('/api/v1/status', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Live Audio Workspace Backend is running' });
});

// API Routes for retrieving database state
app.use('/api', apiRoutes);

// Setup WebSocket Server for audio gateway
setupWebSocket(server);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================================================`);
    console.log(`🎙️  NEXT-GEN AUDIO-FIRST INTELLIGENCE LAYER`);
    console.log(`⚙️  Member 2 - Backend & Agent Engine`);
    console.log(`========================================================================`);
    console.log(`[Database] SQLite initialized at: ./data/audio_agent.sqlite`);
    console.log(`[WS Gateway] WebSocket server initialized on /ws`);
    console.log(`[Backend] HTTP Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Gateway] WebSocket Gateway active on ws://0.0.0.0:${PORT}/ws`);
    console.log(`[Health] Status endpoint: http://0.0.0.0:${PORT}/api/v1/status`);
    console.log(`========================================================================`);
});
