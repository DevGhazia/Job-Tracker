# Job Tracker

React + Vite job-application tracker using Firebase Authentication and Firestore, featuring a dedicated **Action Queue** and **Antigravity MCP Server**.

## Antigravity MCP Integration

Job Tracker provides a local Stdio MCP server at `scripts/mcp-server.mjs` with the following tools:

- **`create_application`**: Adds a job application to your tracker.
- **`queue_application`**: Queues a job into your **Action Queue** with direct links and AI-tailored pitch notes.
- **`list_applications`**: Lists tracked jobs, with optional status filtering (`Queued`, `Applied`, `Interviewing`, etc.).
- **`update_application_status`**: Updates the status of any application.
- **`delete_application`**: Deletes an application by ID.
- **`get_application_stats`**: Retrieves statistical summaries.

### Configuration (`~/.gemini/config/mcp_config.json`)

```json
{
  "mcpServers": {
    "job-tracker": {
      "command": "node",
      "args": [
        "c:/Users/vivku/OneDrive/Desktop/Projects/Job-Tracker/scripts/mcp-server.mjs"
      ]
    }
  }
}
```

## Local Development

```sh
npm install
npm run dev
```
