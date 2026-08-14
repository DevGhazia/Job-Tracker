#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// Load environment variables if not present
function loadEnv() {
  const envPath = resolve(rootDir, ".env");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^\s*([A-Za-z0-9_]+)\s*[:=]\s*(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}

loadEnv();

const serviceAccount = {
  type: "service_account",
  project_id: "job-tracker-79362",
  private_key_id: "da1b24a7a30679bc1731fcc2cc1477b6d3df9c2e",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCSxymRpe6fJTkn\necB7cg8mSDBWeHmOObQ+JJ6WwrMYwNL96lM40zRP6x9QnDo8FmThYM2JB+Q2bK/Q\nusLpH2JftNi2AzhrqBaViKnwfaonK41FLT5Dv8hR57PGE9zvRL0G1b132tVxcV8g\n7SFFgrilCOA6Pkp29HTWoevhZYVILmLQ46Z5RHUCieUuVLFEvAhndBkW4tbXPL83\nlzcT0+zDybz9+qzi9w0SnDJQb8dISyOtA3HfZGjVwfRZfoomTlN+q8eun9wYusBd\nN8ueXbOcdMU8aQnATvAjeCHJM3yiHMqOaAZurSh06Q8Ks0aBM5ufJ8LCz0y/oDDK\nL7L3FmWTAgMBAAECggEABA46ZlAE62Mjv0+nE2If7AleQzgPTRroEY2BJPOamj+o\nX3lhikuVAZ5NXl9VYUKnJUO/pMknM5/GLd4d3kN5PDbALtX2Rvc9Ly2NsIZFtNEI\nasBox4YdkAchxFfZKMf9RxqRzSV/9KNSzb3vnOmTQNrMGJ/kU9bGVwXgrCOEzsKP\n+bO87kvDW+DhJoXOXyhNEek9PzGpa6BICqkxOBplVpjZmGhGtQAQAtFjocAqnb/5\nqgkPAUiX4WeLjrXFlgZm26XRMqFcbvPB8Yd8lEwf1GwPtdoBFIxDq3njRYNBSKan\nKfBWF17tuLTZy3EnNm0fnl8eEJuFuqSzgOpJju/4SQKBgQDDHRDo2ngr0IU6fvz5\nfBJYUdLTLzGx8N9mt7+vD/0TsD0nzD2LksljXAipqfaIA+xHMQt2lxnu+mfU4IXX\ngsyzvkholcfUu3KvkEQKYtMminetLg7V+b6V6c/f1C1SZQ18/xYskHkZFkomLjCY\nls9ZByb7WIXB8NKBS7Nyv8Cl+QKBgQDAlL0LgtmHhSh0AvhOodsEki57EfOMiBCg\nxZlkWP/Oi5IFnmymbCG9MTTeg305b3/cLSt1ZwZ6C7AhFfcHudI45ZdY6F5krB29\nWdawChRew7s+SSf0UOrw0orRQEbrFRWMq0+t2UCnEMkb2uReYgnez1EKLm1/SUO1\nuLZ53Sja6wKBgQCn8nEHvmYKcOb9PynKJn4z/9qVZd5E6K2j4S7iJcUWGXHKvAeO\nCL/JAwOB54cJ9TaA4TqYzd/I0Upm9wy+QRyq63Owcp0cBG3nqSqoNgDDABWbwDWN\nAfiHWkdQx3ZroghGO9x+Z62VZpZU3xV9gvLgE0P+vmgEVKMeIGdKsrvFIQKBgBH1\nDJepMN15JieDK2Ixp3mKo/jn2JzvBxXmtwHrZpb83rXVau4twQuiLfrdqeyUIAkI\n0TeWTr1Mn7TGFo3K3vZdOjqZGEws3G0Oln09w15+w9PwAGDAtteT2kvewX4kLik6\nxChCzMuHPilxxL+kRqVXEYhwgddPnpewTJuaarfXAoGBAKfEwtNTS2nR0AtzjmrN\n5+YGUm5VkBAzvnFAVUa/zYbNcqtiXKQIluj1rYPgB6v+jRBEB+42UAvFlQ+iIBbs\nW9X7G+Ft2F5DHhpxPFkU1Cin7ghjHsvts37OONey7v4uzAM1kf2S3hMMAZ2837TH\nniQlaKYWdEC5wOGxGRmDbdDQ\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@job-tracker-79362.iam.gserviceaccount.com",
  client_id: "117470804024697548023",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40job-tracker-79362.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

function getDb() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    let creds = serviceAccount;
    if (raw) {
      try {
        creds = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        // fallback to embedded serviceAccount
      }
    }
    initializeApp({ credential: cert(creds) });
  }
  return getFirestore();
}

const DEFAULT_USER_ID = process.env.FIREBASE_MCP_USER_ID || "mTRDrxLoFaPjAKU1TOvqxgMt21o2";
const STATUSES = ["Applied", "Interviewing", "Accepted", "Rejected", "No-Response"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const server = new McpServer({
  name: "job-tracker",
  version: "1.0.0",
});

// Tool 1: create_application
server.registerTool(
  "create_application",
  {
    title: "Create job application",
    description: "Add a job application to your Job Tracker.",
    inputSchema: {
      company: z.string().trim().min(1).max(200).describe("Company name"),
      role: z.string().trim().min(1).max(200).describe("Job title / role"),
      location: z.string().trim().min(1).max(200).describe("Location (e.g. Remote, San Francisco, CA)"),
      experience: z.number().int().min(0).max(80).describe("Required experience in years"),
      jobUrl: z.string().url().max(2000).optional().describe("Link to the job posting"),
      status: z.enum(STATUSES).default("Applied").describe("Application status"),
      date: z.string().regex(DATE_PATTERN, "Use YYYY-MM-DD").describe("Date applied (YYYY-MM-DD)"),
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

    const docRef = await getDb()
      .collection("users")
      .doc(DEFAULT_USER_ID)
      .collection("applications")
      .add(application);

    return {
      content: [
        {
          type: "text",
          text: `Added ${role} at ${company} to Job Tracker (ID: ${docRef.id}).`,
        },
      ],
    };
  }
);

// Tool 2: list_applications
server.registerTool(
  "list_applications",
  {
    title: "List job applications",
    description: "List recent job applications from your Job Tracker.",
    inputSchema: {
      limit: z.number().int().min(1).max(100).default(20).optional().describe("Maximum number of applications to retrieve"),
      status: z.enum(STATUSES).optional().describe("Filter by status"),
    },
  },
  async ({ limit = 20, status }) => {
    let query = getDb().collection("users").doc(DEFAULT_USER_ID).collection("applications");
    if (status) {
      query = query.where("status", "==", status);
    }
    const snapshot = await query.limit(limit).get();
    const applications = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    if (applications.length === 0) {
      return {
        content: [{ type: "text", text: "No job applications found matching the criteria." }],
      };
    }

    const summary = applications
      .map(
        (app, idx) =>
          `${idx + 1}. **${app.role}** at **${app.company}** [${app.status}]\n   - Location: ${app.location} | Date: ${app.date}${app.jobUrl ? `\n   - URL: ${app.jobUrl}` : ""}`
      )
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: `Found ${applications.length} applications:\n\n${summary}`,
        },
      ],
    };
  }
);

// Tool 3: update_application_status
server.registerTool(
  "update_application_status",
  {
    title: "Update application status",
    description: "Update the status of an existing job application.",
    inputSchema: {
      id: z.string().trim().min(1).describe("The application Document ID"),
      status: z.enum(STATUSES).describe("The new status"),
    },
  },
  async ({ id, status }) => {
    const docRef = getDb().collection("users").doc(DEFAULT_USER_ID).collection("applications").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return {
        content: [{ type: "text", text: `Application with ID ${id} not found.` }],
      };
    }

    await docRef.update({
      status,
      didInterview: status === "Interviewing" ? true : doc.data().didInterview || false,
    });

    return {
      content: [
        {
          type: "text",
          text: `Updated application "${doc.data().role} at ${doc.data().company}" status to "${status}".`,
        },
      ],
    };
  }
);

// Tool 4: delete_application
server.registerTool(
  "delete_application",
  {
    title: "Delete job application",
    description: "Delete an application by its ID.",
    inputSchema: {
      id: z.string().trim().min(1).describe("The application Document ID"),
    },
  },
  async ({ id }) => {
    const docRef = getDb().collection("users").doc(DEFAULT_USER_ID).collection("applications").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return {
        content: [{ type: "text", text: `Application with ID ${id} not found.` }],
      };
    }
    const data = doc.data();
    await docRef.delete();
    return {
      content: [
        {
          type: "text",
          text: `Deleted application "${data.role} at ${data.company}" (ID: ${id}).`,
        },
      ],
    };
  }
);

// Tool 5: get_application_stats
server.registerTool(
  "get_application_stats",
  {
    title: "Get application statistics",
    description: "Get statistical overview of your tracked job applications.",
    inputSchema: {},
  },
  async () => {
    const snapshot = await getDb().collection("users").doc(DEFAULT_USER_ID).collection("applications").get();
    const stats = {
      Total: snapshot.size,
      Applied: 0,
      Interviewing: 0,
      Accepted: 0,
      Rejected: 0,
      "No-Response": 0,
    };

    snapshot.docs.forEach((doc) => {
      const s = doc.data().status;
      if (stats[s] !== undefined) {
        stats[s]++;
      }
    });

    const report = [
      `📊 **Job Tracker Summary:**`,
      `- Total Tracked: ${stats.Total}`,
      `- Applied: ${stats.Applied}`,
      `- Interviewing: ${stats.Interviewing}`,
      `- Accepted: ${stats.Accepted}`,
      `- Rejected: ${stats.Rejected}`,
      `- No Response: ${stats["No-Response"]}`,
    ].join("\n");

    return {
      content: [{ type: "text", text: report }],
    };
  }
);

// Start Stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);
