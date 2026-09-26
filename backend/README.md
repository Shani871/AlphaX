# Live Audio Workspace — Backend & Agent Engine (Member 2)

Next-Gen Audio-First Real-Time Intelligence Backend & Agent Engine for the AURALIVE / AlphaX system.

## ⚙️ Architecture & Responsibilities

- **Audio Gateway**: Real-time bi-directional WebSocket interface on `/ws` handling live audio frames, barge-in interruptions, and session state sync.
- **Context Engine**: Maintains in-memory live conversation state (participants, active language, decisions, tasks, rolling context window) with automatic database session restoration.
- **Action Engine (Tool Calling)**: Declares actionable tool schemas (`createTask`, `updateDeadline`, etc.) and executes actions dispatched by the AI model.
- **Event Processor**: Extracts structured intents and entities from stream events and persists them to SQLite.
- **Database Service**: Lightweight SQLite persistence for sessions, events, and tasks.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

Default port is `4000` (configurable via `PORT` environment variable).

---

## 📡 API Reference

### Health Check
- **`GET /api/v1/status`**
  - Response: `{"status": "OK", "message": "Live Audio Workspace Backend is running"}`

### Session APIs
- **`GET /api/sessions/:id/state`**: Get live context engine summary (participants, languages, tasks, decisions).
- **`GET /api/sessions/:id/tasks`**: Get persisted task records for a session.
- **`GET /api/sessions/:id/events`**: Get persisted event history for a session.

---

## 🎙️ WebSocket Protocol (`/ws`)

### Connection & Session Lifecycle
- Connect to `ws://localhost:4000/ws` (or with `?sessionId=<id>` to restore an existing session).
- **Server Sends**:
  ```json
  {
    "type": "session_started",
    "sessionId": "session-123456789",
    "state": { ... }
  }
  ```

### Real-Time Inbound Events
- **Audio Chunks**: Binary Int16 PCM frames (16kHz).
- **Interruption Signal**:
  ```json
  { "type": "interruption" }
  ```

### Real-Time Outbound Events
- **State Updates**:
  ```json
  { "type": "state_update", "state": { ... } }
  ```
- **Event Notifications**:
  ```json
  { "type": "event_detected", "event": "task_creation", "entities": { ... } }
  ```
