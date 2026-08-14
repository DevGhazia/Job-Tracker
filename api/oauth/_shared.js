import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
export const AUTH_CODE_TTL_SECONDS = 5 * 60;

export function getAdminFirestore() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not configured.");
    }
    let serviceAccount;
    try {
      serviceAccount = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${e.message}`);
    }
    initializeApp({ credential: cert(serviceAccount) });
  }

  return getFirestore();
}

export function baseUrl(request) {
  const protocol = request?.headers?.["x-forwarded-proto"] || "https";
  const host =
    request?.headers?.["x-forwarded-host"] ||
    request?.headers?.host ||
    (process.env.VERCEL_URL ? process.env.VERCEL_URL : "localhost");
  const cleanHost = host.replace(/^https?:\/\//, "");
  return `${protocol}://${cleanHost}`;
}

export function randomToken() {
  return randomBytes(32).toString("base64url");
}

export function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function pkceChallenge(value) {
  return createHash("sha256").update(value).digest("base64url");
}

export function constantTimeEquals(left, right) {
  if (!left || !right || typeof left !== "string" || typeof right !== "string") return false;
  const bufLeft = Buffer.from(left);
  const bufRight = Buffer.from(right);
  if (bufLeft.length !== bufRight.length) return false;
  return timingSafeEqual(bufLeft, bufRight);
}

export function isSafeRedirectUri(value) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    if (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "[::1]")
    ) {
      return true;
    }
    if (
      url.protocol.endsWith(":") &&
      !["javascript:", "data:", "file:", "vbscript:"].includes(url.protocol.toLowerCase())
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function parseRequestBody(request) {
  if (!request?.body) return {};
  if (typeof request.body === "object") return request.body;
  if (typeof request.body === "string") {
    try {
      return JSON.parse(request.body);
    } catch {
      try {
        const params = new URLSearchParams(request.body);
        const result = {};
        for (const [k, v] of params.entries()) {
          result[k] = v;
        }
        return result;
      } catch {
        return {};
      }
    }
  }
  return {};
}

export function setCorsHeaders(request, response) {
  if (!response?.setHeader) return;
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With");
}

export function oauthError(response, error, description, status = 400) {
  setCorsHeaders(null, response);
  return response.status(status).json({ error, error_description: description });
}
