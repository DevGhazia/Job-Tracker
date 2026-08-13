import {
  AUTH_CODE_TTL_SECONDS,
  baseUrl,
  constantTimeEquals,
  getAdminFirestore,
  hash,
  isSafeRedirectUri,
  randomToken,
} from "./_shared.js";

function page({ error, request }) {
  const action = `${baseUrl(request)}/api/oauth/authorize`;
  const fields = ["client_id", "redirect_uri", "response_type", "state", "code_challenge", "code_challenge_method", "resource", "scope"]
    .map((name) => `<input type="hidden" name="${name}" value="${escapeHtml(request.query[name])}">`)
    .join("");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect Job Tracker</title><style>body{font-family:system-ui,sans-serif;background:#f5f7fa;margin:0;display:grid;min-height:100vh;place-items:center}.card{background:#fff;padding:2rem;border-radius:12px;max-width:420px;box-shadow:0 8px 24px #0002}input,button{box-sizing:border-box;width:100%;padding:.75rem;margin-top:.75rem}button{background:#243b63;color:#fff;border:0;border-radius:6px;font-weight:700}.error{color:#a11;margin-top:.75rem}</style></head><body><main class="card"><h1>Connect Job Tracker</h1><p>Approve Claude to add applications to your personal Job Tracker.</p><form method="post" action="${action}">${fields}<label for="secret">Connection secret</label><input id="secret" name="secret" type="password" autocomplete="current-password" required autofocus><button type="submit">Approve connection</button>${error ? `<p class="error">${error}</p>` : ""}</form></main></body></html>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function validateRequest(request) {
  const { client_id: clientId, redirect_uri: redirectUri, response_type: responseType, code_challenge: challenge, code_challenge_method: method } = request.query;
  if (responseType !== "code" || !clientId || !redirectUri || !challenge || method !== "S256") return "Invalid OAuth authorization request.";
  if (!isSafeRedirectUri(redirectUri)) return "Invalid redirect URI.";
  const client = await getAdminFirestore().collection("mcpOAuthClients").doc(clientId).get();
  if (!client.exists || !client.data().redirectUris.includes(redirectUri)) return "Unknown client or redirect URI.";
  return null;
}

export default async function handler(request, response) {
  if (request.method === "GET") {
    const error = await validateRequest(request);
    return response.status(error ? 400 : 200).send(page({ error, request }));
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return response.status(405).end();
  }

  const query = { ...request.body };
  request.query = query;
  const error = await validateRequest(request);
  if (error) return response.status(400).send(page({ error, request }));
  if (!constantTimeEquals(request.body.secret, process.env.MCP_CONNECT_SECRET)) {
    return response.status(401).send(page({ error: "Incorrect connection secret.", request }));
  }

  const code = randomToken();
  await getAdminFirestore().collection("mcpOAuthCodes").doc(hash(code)).set({
    clientId: query.client_id,
    redirectUri: query.redirect_uri,
    codeChallenge: query.code_challenge,
    resource: query.resource || "",
    expiresAt: Date.now() + AUTH_CODE_TTL_SECONDS * 1000,
  });

  const redirect = new URL(query.redirect_uri);
  redirect.searchParams.set("code", code);
  if (query.state) redirect.searchParams.set("state", query.state);
  return response.redirect(302, redirect.toString());
}
