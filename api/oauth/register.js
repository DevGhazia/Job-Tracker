import { getAdminFirestore, isSafeRedirectUri, oauthError, randomToken } from "./_shared.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).end();
  }

  const redirectUris = request.body?.redirect_uris;
  if (!Array.isArray(redirectUris) || !redirectUris.length || !redirectUris.every(isSafeRedirectUri)) {
    return oauthError(response, "invalid_client_metadata", "A secure redirect URI is required.");
  }

  const clientId = randomToken();
  const clientName = String(request.body?.client_name || "Claude").slice(0, 200);
  await getAdminFirestore().collection("mcpOAuthClients").doc(clientId).set({
    clientId,
    clientName,
    redirectUris,
    createdAt: new Date().toISOString(),
  });

  return response.status(201).json({
    client_id: clientId,
    client_name: clientName,
    redirect_uris: redirectUris,
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  });
}
