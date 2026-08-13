import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
export const AUTH_CODE_TTL_SECONDS = 5 * 60;

export function getAdminFirestore() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    initializeApp({ credential: cert(serviceAccount) });
  }

  return getFirestore();
}

export function baseUrl(request) {
  const protocol = request.headers["x-forwarded-proto"] || "https";
  const host = request.headers["x-forwarded-host"] || request.headers.host;
  return `${protocol}://${host}`;
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
  if (!left || !right || left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

export function isSafeRedirectUri(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function oauthError(response, error, description, status = 400) {
  return response.status(status).json({ error, error_description: description });
}
