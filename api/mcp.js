import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { baseUrl, getAdminFirestore, hash } from "./oauth/_shared.js";

const STATUSES = ["Applied", "Interviewing", "Accepted", "Rejected", "No-Response"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

async function isAuthorized(request) {
  const accessToken = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!accessToken) return false;

  const token = await getAdminFirestore().collection("mcpOAuthTokens").doc(hash(accessToken)).get();
  return token.exists && token.data().expiresAt > Date.now();
}

function createServer() {
  const server = new McpServer({ name: "job-tracker", version: "1.0.0" });

  server.registerTool(
    "create_application",
    {
      title: "Create job application",
      description:
        "Add a job application to the authenticated owner's Job Tracker after the application has been submitted.",
      inputSchema: {
        company: z.string().trim().min(1).max(200),
        role: z.string().trim().min(1).max(200),
        location: z.string().trim().min(1).max(200),
        experience: z.number().int().min(0).max(80),
        jobUrl: z.url().max(2_000).optional(),
        status: z.enum(STATUSES).default("Applied"),
        date: z.string().regex(DATE_PATTERN, "Use YYYY-MM-DD"),
      },
      annotations: {
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ company, role, location, experience, jobUrl, status, date }) => {
      const userId = process.env.FIREBASE_MCP_USER_ID;
      if (!userId) throw new Error("FIREBASE_MCP_USER_ID is not configured.");

      const application = {
        logo: null,
        company,
        role,
        location,
        experience,
        jobUrl: jobUrl ?? "",
        status,
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

  return server;
}

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.setHeader("Allow", "POST, OPTIONS");
    return response.status(204).end();
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return response.status(405).json({ error: "Method not allowed" });
  }

  if (!(await isAuthorized(request))) {
    const metadataUrl =`${baseUrl(request)}/.well-known/oauth-protected-resource`;
    response.setHeader("WWW-Authenticate", `Bearer resource_metadata="${metadataUrl}"`);
    return response.status(401).json({ error: "Unauthorized" });
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
