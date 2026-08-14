import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { baseUrl, getAdminFirestore, hash, setCorsHeaders } from "./oauth/_shared.js";

const STATUSES = ["Applied", "Interviewing", "Accepted", "Rejected", "No-Response"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

async function isAuthorized(request) {
  const authHeader = request.headers?.authorization;
  if (!authHeader) return false;

  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!accessToken) return false;

  // Direct secret support for Antigravity, IDEs, and CLI tools
  if (process.env.MCP_CONNECT_SECRET && accessToken === process.env.MCP_CONNECT_SECRET) {
    return true;
  }

  // OAuth token verification for Claude.ai
  try {
    const token = await getAdminFirestore().collection("mcpOAuthTokens").doc(hash(accessToken)).get();
    return token.exists && token.data().expiresAt > Date.now();
  } catch (err) {
    console.error("Error verifying access token:", err);
    return false;
  }
}

function createServer() {
  const server = new McpServer({ name: "job-tracker", version: "1.0.0" });
  const userId = process.env.FIREBASE_MCP_USER_ID || "mTRDrxLoFaPjAKU1TOvqxgMt21o2";

  // Tool 1: create_application
  server.registerTool(
    "create_application",
    {
      title: "Create job application",
      description:
        "Add a job application to the authenticated owner's Job Tracker after the application has been submitted.",
      inputSchema: {
        company: z.string().trim().min(1).max(200).describe("Company name"),
        role: z.string().trim().min(1).max(200).describe("Job role / title"),
        location: z.string().trim().min(1).max(200).describe("Location (e.g. Remote, San Francisco, CA)"),
        experience: z.number().int().min(0).max(80).describe("Required experience in years"),
        jobUrl: z.string().url().max(2_000).optional().describe("Job application link"),
        status: z.enum(STATUSES).default("Applied").describe("Application status"),
        date: z.string().regex(DATE_PATTERN, "Use YYYY-MM-DD").describe("Date applied (YYYY-MM-DD)"),
      },
      annotations: {
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ company, role, location, experience, jobUrl, status, date }) => {
      const application = {
        logo: null,
        company,
        role,
        location,
        experience,
        jobUrl: jobUrl ?? "",
        status: status || "Applied",
        date,
        didInterview: status === "Interviewing",
      };

      const document = await getAdminFirestore()
        .collection("users")
        .doc(userId)
        .collection("applications")
        .add(application);

      return {
        content: [
          {
            type: "text",
            text: `Added ${role} at ${company} to Job Tracker (ID: ${document.id}).`,
          },
        ],
      };
    },
  );

  // Tool 2: list_applications
  server.registerTool(
    "list_applications",
    {
      title: "List job applications",
      description: "List recent job applications from the Job Tracker.",
      inputSchema: {
        limit: z.number().int().min(1).max(100).default(20).optional().describe("Max number of applications"),
        status: z.enum(STATUSES).optional().describe("Filter by status"),
      },
    },
    async ({ limit = 20, status }) => {
      let query = getAdminFirestore().collection("users").doc(userId).collection("applications");
      if (status) {
        query = query.where("status", "==", status);
      }
      const snapshot = await query.limit(limit).get();
      const applications = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      if (applications.length === 0) {
        return { content: [{ type: "text", text: "No applications found." }] };
      }

      const summary = applications
        .map(
          (app, idx) =>
            `${idx + 1}. **${app.role}** at **${app.company}** [${app.status}] | ${app.location} | ${app.date}${app.jobUrl ? ` | [Link](${app.jobUrl})` : ""}`
        )
        .join("\n");

      return {
        content: [{ type: "text", text: `Found ${applications.length} applications:\n\n${summary}` }],
      };
    },
  );

  // Tool 3: update_application_status
  server.registerTool(
    "update_application_status",
    {
      title: "Update application status",
      description: "Update the status of a job application by document ID.",
      inputSchema: {
        id: z.string().trim().min(1).describe("Application document ID"),
        status: z.enum(STATUSES).describe("New status"),
      },
    },
    async ({ id, status }) => {
      const ref = getAdminFirestore().collection("users").doc(userId).collection("applications").doc(id);
      const doc = await ref.get();
      if (!doc.exists) {
        return { content: [{ type: "text", text: `Application ID ${id} not found.` }] };
      }
      await ref.update({
        status,
        didInterview: status === "Interviewing" ? true : doc.data().didInterview || false,
      });
      return {
        content: [{ type: "text", text: `Updated "${doc.data().role} at ${doc.data().company}" status to "${status}".` }],
      };
    },
  );

  // Tool 4: get_application_stats
  server.registerTool(
    "get_application_stats",
    {
      title: "Get application statistics",
      description: "Get statistical overview and breakdown of tracked applications.",
      inputSchema: {},
    },
    async () => {
      const snapshot = await getAdminFirestore().collection("users").doc(userId).collection("applications").get();
      const stats = { Total: snapshot.size, Applied: 0, Interviewing: 0, Accepted: 0, Rejected: 0, "No-Response": 0 };
      snapshot.docs.forEach((doc) => {
        const s = doc.data().status;
        if (stats[s] !== undefined) stats[s]++;
      });

      return {
        content: [
          {
            type: "text",
            text: `📊 **Job Tracker Stats:**\n- Total: ${stats.Total}\n- Applied: ${stats.Applied}\n- Interviewing: ${stats.Interviewing}\n- Accepted: ${stats.Accepted}\n- Rejected: ${stats.Rejected}\n- No Response: ${stats["No-Response"]}`,
          },
        ],
      };
    },
  );

  return server;
}

export default async function handler(request, response) {
  setCorsHeaders(request, response);

  if (request.method === "OPTIONS") {
    response.setHeader("Allow", "GET, POST, OPTIONS");
    return response.status(204).end();
  }

  // Check authorization for all request methods
  const authorized = await isAuthorized(request);
  if (!authorized) {
    const metadataUrl = `${baseUrl(request)}/.well-known/oauth-protected-resource`;
    response.setHeader("WWW-Authenticate", `Bearer resource_metadata="${metadataUrl}"`);
    return response.status(401).json({
      error: "Unauthorized",
      error_description: "Valid OAuth Bearer token or secret required.",
    });
  }

  if (request.method !== "POST" && request.method !== "GET") {
    response.setHeader("Allow", "GET, POST, OPTIONS");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    await server.connect(transport);
    await transport.handleRequest(request, response, request.body);
    await server.close();
  } catch (error) {
    console.error("MCP request failed", error);
    if (!response.headersSent) response.status(500).json({ error: "Internal server error" });
  }
}
