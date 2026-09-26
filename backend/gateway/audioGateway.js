const WebSocket = require('ws');
const url = require('url');
const { connectToGeminiLive } = require('../ai/geminiLive');
const { contextEngine } = require('../engine/contextEngine');

function setupWebSocket(server) {
    const wss = new WebSocket.Server({ server, path: '/ws' });

    wss.on('connection', async (ws, req) => {
        // Parse the URL to check if the frontend is trying to reconnect an old session
        const reqUrl = new URL(req.url, 'http://localhost');
        let sessionId = reqUrl.searchParams.get('sessionId');
        let isReconnection = false;

        if (sessionId) {
            console.log(`[Gateway] Reconnection attempt for session: ${sessionId}`);
            // Attempt to restore session
            const restored = await contextEngine.restoreSession(sessionId);
            if (restored) {
                isReconnection = true;
            } else {
                console.log(`[Gateway] Session ${sessionId} not found in DB. Creating new session.`);
                sessionId = `session-${Date.now()}`;
                contextEngine.createSession(sessionId);
            }
        } else {
            console.log('New WebSocket connection established from frontend');
            sessionId = `session-${Date.now()}`;
            contextEngine.createSession(sessionId);
        }

        ws.send(JSON.stringify({ 
            type: isReconnection ? 'session_restored' : 'session_started', 
            sessionId,
            state: contextEngine.getStateSummary(sessionId) // Send them the state immediately so the UI can redraw
        }));

        // Connect this session to the AI backend
        const aiConnection = connectToGeminiLive(sessionId, ws);

        ws.on('message', (message) => {
            // Check if the message is binary (audio data)
            if (Buffer.isBuffer(message) || message instanceof ArrayBuffer) {
                // Pipe audio directly to AI
                aiConnection.sendAudio(message);
                return;
            }

            try {
                const data = JSON.parse(message);
                
                if (data.type === 'interruption') {
                    console.log(`[${sessionId}] Interruption detected! Dropping AI audio.`);
                    aiConnection.interrupt();
                } else {
                    console.log(`[${sessionId}] Received event:`, data.type);
                }
            } catch (err) {
                console.error(`Error parsing message from ${sessionId}:`, err.message);
            }
        });

        ws.on('close', () => {
            console.log(`WebSocket connection closed for session: ${sessionId}`);
            aiConnection.close();
            contextEngine.endSession(sessionId);
        });
    });

    return wss;
}

module.exports = { setupWebSocket };
