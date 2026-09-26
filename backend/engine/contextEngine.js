/**
 * Context Engine
 * Maintains the real-time state of the conversation in memory.
 */

const { db } = require('../database/db');

class ContextEngine {
    constructor() {
        // In-memory store for active sessions
        this.sessions = new Map();
    }

    // Initialize a new session state
    createSession(sessionId) {
        const initialState = {
            sessionId,
            participants: new Set(),
            languages: new Set(),
            currentTopic: null,
            decisions: [],
            tasks: [],
            deadlines: [],
            recentContext: [] // Rolling window of recent transcript
        };
        this.sessions.set(sessionId, initialState);
        console.log(`[Context Engine] Session ${sessionId} initialized.`);
        return initialState;
    }

    // Restore session from Database if the server restarted or client disconnected
    async restoreSession(sessionId) {
        // If it's already in active memory, no need to restore from DB
        if (this.sessions.has(sessionId)) {
            console.log(`[Context Engine] Session ${sessionId} is already active in memory.`);
            return true;
        }

        console.log(`[Context Engine] Attempting to restore session ${sessionId} from Database...`);
        try {
            // Fetch historical data
            const tasks = await db.getTasksBySession(sessionId);
            const events = await db.getEventsBySession(sessionId);
            
            // If there's no history, we can't restore it
            if (tasks.length === 0 && events.length === 0) {
                return false;
            }

            // Rebuild state
            const restoredState = this.createSession(sessionId);
            
            // Repopulate tasks
            restoredState.tasks = tasks.map(t => ({ task: t.task, owner: t.owner }));
            
            // Repopulate participants and languages from events
            events.forEach(e => {
                if (e.eventType === 'speaker_detected' && e.entities?.speakerId) {
                    restoredState.participants.add(e.entities.speakerId);
                }
                if (e.eventType === 'language_detected' && e.entities?.language) {
                    restoredState.languages.add(e.entities.language);
                }
                if (e.eventType === 'decision_made' && e.entities?.decision) {
                    restoredState.decisions.push(e.entities.decision);
                }
                if (e.transcript) {
                    restoredState.recentContext.push(e.transcript);
                }
            });

            // Trim context window
            if (restoredState.recentContext.length > 10) {
                restoredState.recentContext = restoredState.recentContext.slice(-10);
            }

            console.log(`[Context Engine] Successfully restored session ${sessionId} from DB.`);
            return true;
        } catch (error) {
            console.error(`[Context Engine] Failed to restore session:`, error.message);
            return false;
        }
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    // Update the state based on detected events
    updateState(sessionId, eventType, data) {
        const state = this.sessions.get(sessionId);
        if (!state) {
            console.error(`[Context Engine] Session ${sessionId} not found!`);
            return null;
        }

        switch (eventType) {
            case 'speaker_detected':
                state.participants.add(data.speakerId);
                break;
            case 'language_detected':
                state.languages.add(data.language);
                break;
            case 'task_created':
                state.tasks.push({
                    task: data.entities?.task || data.entities?.taskDesc,
                    owner: data.entities?.owner
                });
                break;
            case 'deadline_updated':
                state.deadlines.push({
                    task: data.entities.task,
                    date: data.entities.deadline
                });
                break;
            case 'decision_made':
                state.decisions.push(data.entities.decision);
                break;
            case 'transcript_update':
                // Keep the last 10 messages for context
                state.recentContext.push(data.transcript);
                if (state.recentContext.length > 10) {
                    state.recentContext.shift();
                }
                break;
            default:
                console.log(`[Context Engine] Unknown event type: ${eventType}`);
        }

        // Return updated state
        return this.getStateSummary(sessionId);
    }

    // Get a clean JSON representation of the current state
    getStateSummary(sessionId) {
        const state = this.sessions.get(sessionId);
        if (!state) return null;

        return {
            sessionId: state.sessionId,
            participants: Array.from(state.participants),
            languages: Array.from(state.languages),
            currentTopic: state.currentTopic,
            decisions: state.decisions,
            tasks: state.tasks,
            deadlines: state.deadlines
        };
    }

    endSession(sessionId) {
        this.sessions.delete(sessionId);
        console.log(`[Context Engine] Session ${sessionId} ended.`);
    }
}

// Export as a singleton
const contextEngine = new ContextEngine();
module.exports = { contextEngine };
