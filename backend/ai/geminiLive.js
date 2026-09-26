const { processAiEvent } = require('../events/eventProcessor');
const { actionEngine } = require('../actions/actionEngine');

/**
 * Mock connection to Gemini 3.8 Live API
 * In a real implementation, this would use the official Google Gen AI SDK
 * or a raw WebSocket connection to the Gemini streaming endpoint.
 */
function connectToGeminiLive(sessionId, frontendWs) {
    console.log(`[${sessionId}] Connected to Gemini Live API`);

    // 1. Tell Gemini what tools it has available
    const availableTools = actionEngine.getTools();
    // console.log(`[Gemini API] Registered tools:`, availableTools.map(t => t.name));

    // Simulate sending events back to the frontend
    const simulateAIResponse = (text, eventType, intent, entities = {}) => {
        
        const aiResponseData = {
            transcript: text,
            speakerId: 'AI',
            language: 'English',
            eventType,
            intent,
            entities
        };

        // Process through Context Engine
        processAiEvent(sessionId, aiResponseData, frontendWs);

        // Send the raw response back to the UI
        if (frontendWs.readyState === 1) { // WebSocket.OPEN
            frontendWs.send(JSON.stringify({
                type: 'ai_response',
                text,
                event: eventType,
                intent,
                speaker: 'AI'
            }));
        }
    };

    // Simulating Gemini deciding to call a tool after 10 seconds
    const simulationTimer = setTimeout(async () => {
        console.log(`\n--- [SIMULATION] AI decides to take action ---`);
        
        // 1. Gemini requests a tool call
        const toolRequest = {
            name: "createTask",
            parameters: { taskDesc: "Deploy to Production", owner: "Member 4", deadline: "Friday" }
        };

        // 2. We execute the tool on our backend
        const result = await actionEngine.executeToolCall(sessionId, toolRequest.name, toolRequest.parameters);
        
        // 3. We "return" the result to Gemini, and Gemini generates a natural speech response
        if (result.status === "success") {
            simulateAIResponse(
                `Done. I've created the "${toolRequest.parameters.taskDesc}" task for ${toolRequest.parameters.owner} with a deadline of ${toolRequest.parameters.deadline}.`, 
                "action_completed", 
                "task_creation", 
                toolRequest.parameters
            );
        }
        
    }, 10000);

    return {
        sendAudio: (audioBuffer) => {
            // console.log(`[${sessionId}] Sending audio chunk to Gemini (${audioBuffer.length} bytes)`);
            
            // Simulating API network error randomly (1% chance for hackathon resilience demo)
            if (Math.random() < 0.01 && frontendWs.readyState === 1) {
                console.log(`[${sessionId}] Simulating Gemini API Error!`);
                frontendWs.send(JSON.stringify({
                    type: 'api_error',
                    message: 'Gemini API connection lost. Attempting to restore...',
                    fallback: true
                }));
            }
        },
        
        interrupt: () => {
            console.log(`[${sessionId}] Sent interrupt signal to Gemini Live API`);
            // Tell Gemini to stop generating speech
        },

        emitError: (errorMessage) => {
            if (frontendWs.readyState === 1) {
                frontendWs.send(JSON.stringify({
                    type: 'api_error',
                    message: errorMessage
                }));
            }
        },

        close: () => {
            console.log(`[${sessionId}] Closed Gemini Live API connection`);
            clearTimeout(simulationTimer);
        }
    };
}

module.exports = { connectToGeminiLive };
