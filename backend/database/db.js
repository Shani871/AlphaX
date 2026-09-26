const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * SQLite Database Service
 */
class DatabaseService {
    constructor() {
        const dbPath = path.join(__dirname, '../data/audio_agent.sqlite');
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('[Database] Error opening SQLite database:', err.message);
            }
        });
        this.init();
    }

    init() {
        this.db.serialize(() => {
            this.db.run(`CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            this.db.run(`CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                sessionId TEXT,
                eventType TEXT,
                intent TEXT,
                entities TEXT,
                transcript TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            this.db.run(`CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                sessionId TEXT,
                task TEXT,
                owner TEXT,
                deadline TEXT,
                status TEXT DEFAULT 'pending',
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
        });
    }

    async saveSession(sessionId, initialData = {}) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO sessions (id) VALUES (?)', [sessionId], function(err) {
                if (err) reject(err);
                else {
                    resolve({ id: sessionId });
                }
            });
        });
    }

    async saveEvent(sessionId, eventType, intent, entities, transcript) {
        return new Promise((resolve, reject) => {
            const id = `evt-${Date.now()}`;
            const entitiesStr = JSON.stringify(entities);
            this.db.run(
                'INSERT INTO events (id, sessionId, eventType, intent, entities, transcript) VALUES (?, ?, ?, ?, ?, ?)',
                [id, sessionId, eventType, intent, entitiesStr, transcript],
                function(err) {
                    if (err) reject(err);
                    else {
                        resolve({ id, sessionId, eventType, intent, entities, transcript });
                    }
                }
            );
        });
    }

    async saveTask(sessionId, taskDesc, owner, deadline = null) {
        return new Promise((resolve, reject) => {
            const id = `task-${Date.now()}`;
            this.db.run(
                'INSERT INTO tasks (id, sessionId, task, owner, deadline) VALUES (?, ?, ?, ?, ?)',
                [id, sessionId, taskDesc, owner, deadline],
                function(err) {
                    if (err) reject(err);
                    else {
                        resolve({ id, sessionId, task: taskDesc, owner, deadline, status: 'pending' });
                    }
                }
            );
        });
    }

    async getTasksBySession(sessionId) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM tasks WHERE sessionId = ?', [sessionId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async getEventsBySession(sessionId) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM events WHERE sessionId = ?', [sessionId], (err, rows) => {
                if (err) reject(err);
                else {
                    // Parse entities back to JSON
                    resolve(rows.map(row => ({
                        ...row,
                        entities: row.entities ? JSON.parse(row.entities) : {}
                    })));
                }
            });
        });
    }
}

const db = new DatabaseService();
module.exports = { db };
