# Job Tracker

React + Vite job-application tracker using Firebase Authentication and Firestore.

## MCP endpoint

The deployed Vercel project exposes one authenticated MCP tool at `https://YOUR_DOMAIN/api/mcp`:

`create_application(company, role, location, experience, jobUrl?, status?, date)`

It creates a document at `users/{FIREBASE_MCP_USER_ID}/applications` with the same fields the React app uses. `jobUrl` is optional, and the dashboard makes the role clickable when it is present.

### Vercel environment variables

Add these environment variables in the Vercel project settings before deploying. The `.env.example` file documents their names; do not commit their values.

- `MCP_API_KEY`: a long, random secret shared only with your Claude MCP configuration.
- `FIREBASE_MCP_USER_ID`: your Firebase Authentication UID. The endpoint never accepts a UID from Claude.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: a single-line Firebase service-account JSON object with Firestore access.

Keep all three server-only: do not prefix them with `VITE_`, do not place them in a frontend file, and do not paste them into chat prompts.

Find `FIREBASE_MCP_USER_ID` in Firebase Console → Authentication → Users. Create the service-account key from Firebase Console → Project settings → Service accounts, then add the downloaded JSON as the `FIREBASE_SERVICE_ACCOUNT_JSON` Vercel value. Treat that JSON like a password: it gives the endpoint privileged Firestore access.

### Claude configuration

Configure a remote HTTP MCP server using your deployed URL and bearer token. For Claude Code, for example:

```sh
claude mcp add --transport http job-tracker https://YOUR_DOMAIN/api/mcp \
  --header "Authorization: Bearer YOUR_MCP_API_KEY"
```

Use `create_application` only after an application has been submitted. This integration does not search for jobs, schedule work, or automate a browser.

## Local development

```sh
npm install
npm run dev
```
