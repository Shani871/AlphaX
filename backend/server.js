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

// Root landing page
app.get('/', (req, res) => {
    if (req.accepts('html')) {
        res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AURALIVE Backend & Agent Engine</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
    .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 2.5rem; max-width: 520px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); text-align: center; }
    h1 { color: #38bdf8; font-size: 1.6rem; margin-top: 0.5rem; }
    p { color: #94a3b8; line-height: 1.6; font-size: 0.95rem; }
    .badge { display: inline-block; background: #059669; color: #fff; padding: 0.35rem 0.85rem; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; }
    .endpoints { text-align: left; background: #0a0e17; border: 1px solid #1e293b; border-radius: 10px; padding: 1rem; margin-top: 1.5rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85rem; }
    .endpoints div { margin: 0.5rem 0; color: #cbd5e1; }
    .endpoints a { color: #38bdf8; text-decoration: none; }
    .endpoints a:hover { text-decoration: underline; }
    .endpoints code { background: #1e293b; padding: 2px 6px; border-radius: 4px; color: #f1f5f9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">● Online & Operational</div>
    <h1>🎙️ AURALIVE Backend & Agent</h1>
    <p>Real-time Audio-First Intelligence Layer & WebSocket Gateway.</p>
    <div class="endpoints">
      <div><strong>Health:</strong> <a href="/api/v1/status">/api/v1/status</a></div>
      <div><strong>WebSocket Gateway:</strong> <code>/ws</code></div>
      <div><strong>Sessions API:</strong> <code>/api/sessions/:id/state</code></div>
    </div>
  </div>
</body>
</html>`);
    } else {
        res.status(200).json({
            status: 'OK',
            name: 'AURALIVE Backend & Agent Engine',
            version: '1.0.0',
            endpoints: {
                health: '/api/v1/status',
                websocket: '/ws',
                sessions: '/api/sessions/:id/state'
            }
        });
    }
});

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
