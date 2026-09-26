const { contextEngine } = require('../engine/contextEngine');
const { db } = require('../database/db');

/**
 * Event Processor
 * Extracts intents and entities from the AI response and updates the Context Engine.
 */
async function processAiEvent(sessionId, aiResponseData, frontendWs) {
    // aiResponseData is assumed to be a parsed JSON object from Gemini
    
    // 1. Log the transcript for recent context
    if (aiResponseData.transcript) {
        contextEngine.updateState(sessionId, 'transcript_update', { 
            transcript: aiResponseData.transcript 
        });
    }

    // 2. Identify Speaker & Language
    if (aiResponseData.speakerId) {
        contextEngine.updateState(sessionId, 'speaker_detected', { 
            speakerId: aiResponseData.speakerId 
        });
    }
    if (aiResponseData.language) {
        contextEngine.updateState(sessionId, 'language_detected', { 
            language: aiResponseData.language 
        });
    }

    // 3. Extract structured intents/events and persist them
    if (aiResponseData.intent) {
        console.log(`[Event Processor] Intent Detected for ${sessionId}:`, aiResponseData.intent);
        
        // Persist the event to DB
        await db.saveEvent(
            sessionId, 
            aiResponseData.eventType, 
            aiResponseData.intent, 
            aiResponseData.entities, 
            aiResponseData.transcript
        );

        // Map the AI's intent to our internal event types
        if (aiResponseData.intent === 'task_creation') {
            contextEngine.updateState(sessionId, 'task_created', aiResponseData);
            
            // Persist the task to DB if not already executed by actionEngine
            if (aiResponseData.eventType !== 'action_completed' && aiResponseData.entities) {
                const taskDesc = aiResponseData.entities.task || aiResponseData.entities.taskDesc;
                if (taskDesc) {
                    await db.saveTask(
                        sessionId, 
                        taskDesc, 
                        aiResponseData.entities.owner, 
                        aiResponseData.entities.deadline
                    );
                }
            }
        } else if (aiResponseData.intent === 'deadline_update') {
            contextEngine.updateState(sessionId, 'deadline_updated', aiResponseData);
        } else if (aiResponseData.intent === 'decision') {
            contextEngine.updateState(sessionId, 'decision_made', aiResponseData);
        }

        // Broadcast the updated state to the frontend dashboard
        const currentState = contextEngine.getStateSummary(sessionId);
        
        if (frontendWs && frontendWs.readyState === 1) {
            frontendWs.send(JSON.stringify({
                type: 'state_update',
                state: currentState
            }));
            
            // Also send the specific event notification
            frontendWs.send(JSON.stringify({
                type: 'event_detected',
                event: aiResponseData.eventType || aiResponseData.intent,
                entities: aiResponseData.entities
            }));
        }
    }
}

module.exports = { processAiEvent };
