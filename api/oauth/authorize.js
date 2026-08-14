import {
  AUTH_CODE_TTL_SECONDS,
  baseUrl,
  constantTimeEquals,
  getAdminFirestore,
  hash,
  isSafeRedirectUri,
  parseRequestBody,
  randomToken,
  setCorsHeaders,
} from "./_shared.js";

function page({ error, request }) {
  const action = `${baseUrl(request)}/api/oauth/authorize`;
  const query = request.query || {};
  const fields = ["client_id", "redirect_uri", "response_type", "state", "code_challenge", "code_challenge_method", "resource", "scope"]
    .map((name) => `<input type="hidden" name="${name}" value="${escapeHtml(query[name])}">`)
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect Job Tracker</title><style>body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f5f7fa;margin:0;display:grid;min-height:100vh;place-items:center}.card{background:#fff;padding:2rem;border-radius:12px;max-width:420px;width:90%;box-shadow:0 8px 24px rgba(0,0,0,0.12)}h1{font-size:1.5rem;margin-top:0;color:#1e293b}p{color:#64748b;font-size:0.95rem;line-height:1.5}label{font-weight:600;font-size:0.875rem;color:#334155;display:block;margin-top:1rem}input,button{box-sizing:border-box;width:100%;padding:.75rem;margin-top:.5rem;border-radius:6px;font-size:1rem}input{border:1px solid #cbd5e1}input:focus{outline:2px solid #2563eb;border-color:transparent}button{background:#243b63;color:#fff;border:0;font-weight:600;cursor:pointer;margin-top:1.25rem}button:hover{background:#1a2b49}.error{color:#dc2626;background:#fee2e2;padding:.75rem;border-radius:6px;margin-top:1rem;font-size:.875rem}</style></head><body><main class="card"><h1>Connect Job Tracker</h1><p>Approve Claude to add applications to your personal Job Tracker.</p><form method="post" action="${action}">${fields}<label for="secret">Connection secret</label><input id="secret" name="secret" type="password" placeholder="Enter MCP_CONNECT_SECRET" autocomplete="current-password" required autofocus><button type="submit">Approve connection</button>${error ? `<div class="error">${error}</div>` : ""}</form></main></body></html>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function validateRequest(query) {
  const { client_id: clientId, redirect_uri: redirectUri, response_type: responseType, code_challenge: challenge, code_challenge_method: method } = query;
  if (responseType !== "code" || !clientId || !redirectUri || !challenge || method !== "S256") return "Invalid OAuth authorization request parameters.";
  if (!isSafeRedirectUri(redirectUri)) return "Invalid redirect URI.";
  try {
    const client = await getAdminFirestore().collection("mcpOAuthClients").doc(clientId).get();
    if (!client.exists || !client.data().redirectUris.includes(redirectUri)) return "Unknown client or redirect URI.";
  } catch (err) {
    console.error("Error fetching client during authorization:", err);
    return `Authorization server error: ${err.message}`;
  }
  return null;
}

export default async function handler(request, response) {
  setCorsHeaders(request, response);

  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

  if (request.method === "GET") {
    const query = request.query || {};
    const error = await validateRequest(query);
    return response.status(error ? 400 : 200).send(page({ error, request }));
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST, OPTIONS");
    return response.status(405).end();
  }

  const body = parseRequestBody(request);
  const query = { ...(request.query || {}), ...body };
  request.query = query;

  const error = await validateRequest(query);
  if (error) return response.status(400).send(page({ error, request }));

  if (!constantTimeEquals(body.secret, process.env.MCP_CONNECT_SECRET)) {
    return response.status(401).send(page({ error: "Incorrect connection secret.", request }));
  }

  const code = randomToken();
  try {
    await getAdminFirestore().collection("mcpOAuthCodes").doc(hash(code)).set({
      clientId: query.client_id,
      redirectUri: query.redirect_uri,
      codeChallenge: query.code_challenge,
      resource: query.resource || "",
      expiresAt: Date.now() + AUTH_CODE_TTL_SECONDS * 1000,
    });
  } catch (err) {
    console.error("Error saving auth code:", err);
    return response.status(500).send(page({ error: `Internal error: ${err.message}`, request }));
  }

  const redirect = new URL(query.redirect_uri);
  redirect.searchParams.set("code", code);
  if (query.state) redirect.searchParams.set("state", query.state);
  return response.redirect(302, redirect.toString());
}
