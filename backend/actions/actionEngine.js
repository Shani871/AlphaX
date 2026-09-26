const { db } = require('../database/db');
const { contextEngine } = require('../engine/contextEngine');

/**
 * Action Engine (Tool Calling)
 * Exposes functions that the Gemini AI can call to interact with the real world.
 */
class ActionEngine {
    constructor() {
        // Defines the tools/functions that will be sent to the Gemini Live API
        this.aiTools = [
            {
                name: "createTask",
                description: "Create a new task and assign it to an owner.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        taskDesc: { type: "STRING", description: "Description of the task" },
                        owner: { type: "STRING", description: "Name of the person responsible" },
                        deadline: { type: "STRING", description: "When the task is due (optional)" }
                    },
                    required: ["taskDesc", "owner"]
                }
            },
            {
                name: "updateDeadline",
                description: "Update the deadline for a specific task.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        taskId: { type: "STRING", description: "The ID of the task to update" },
                        newDeadline: { type: "STRING", description: "The new deadline date/time" }
                    },
                    required: ["taskId", "newDeadline"]
                }
            }
        ];
    }

    // Returns the tool schemas to register with Gemini
    getTools() {
        return this.aiTools;
    }

    // Executes the function when Gemini decides to call a tool
    async executeToolCall(sessionId, toolName, parameters) {
        console.log(`[Action Engine] AI called tool: ${toolName} with params:`, parameters);
        
        try {
            let result;
            if (toolName === 'createTask') {
                // 1. Execute DB Action
                const task = await db.saveTask(
                    sessionId, 
                    parameters.taskDesc, 
                    parameters.owner, 
                    parameters.deadline
                );
                
                // 2. Update Live Context
                contextEngine.updateState(sessionId, 'task_created', { 
                    entities: { task: task.task, owner: task.owner, deadline: task.deadline } 
                });

                result = { status: "success", taskId: task.id, message: `Task created for ${task.owner}` };

            } else if (toolName === 'updateDeadline') {
                // Example mock logic for updateDeadline
                result = { status: "success", message: `Deadline updated to ${parameters.newDeadline}` };
            } else {
                throw new Error(`Unknown tool: ${toolName}`);
            }

            // Return the result back to Gemini so it can speak the confirmation
            return result;

        } catch (error) {
            console.error(`[Action Engine] Tool execution failed:`, error.message);
            return { status: "error", message: error.message };
        }
    }
}

const actionEngine = new ActionEngine();
module.exports = { actionEngine };
