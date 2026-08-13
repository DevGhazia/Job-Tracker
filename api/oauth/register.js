import {
  getAdminFirestore,
  isSafeRedirectUri,
  oauthError,
  randomToken,
} from "./_shared.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).end();
  }

  const body = request.body || {};
  const redirectUris = body.redirect_uris;

  if (
    !Array.isArray(redirectUris) ||
    redirectUris.length === 0 ||
    !redirectUris.every(isSafeRedirectUri)
  ) {
    return oauthError(
      response,
      "invalid_client_metadata",
      "A secure redirect URI is required."
    );
  }

  const clientId = randomToken();

  await getAdminFirestore()
    .collection("mcpOAuthClients")
    .doc(clientId)
    .set({
      clientId,
      clientName: String(body.client_name || "Claude").slice(0, 200),
      redirectUris,
      applicationType: body.application_type || "web",
      grantTypes: Array.isArray(body.grant_types)
        ? body.grant_types
        : ["authorization_code", "refresh_token"],
      responseTypes: Array.isArray(body.response_types)
        ? body.response_types
        : ["code"],
      tokenEndpointAuthMethod:
        body.token_endpoint_auth_method || "none",
      scope: body.scope || "",
      clientUri: body.client_uri || null,
      createdAt: new Date().toISOString(),
    });

  return response.status(201).json({
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    redirect_uris: redirectUris,
    client_name: body.client_name || "Claude",
    application_type: body.application_type || "web",
    grant_types: Array.isArray(body.grant_types)
      ? body.grant_types
      : ["authorization_code", "refresh_token"],
    response_types: Array.isArray(body.response_types)
      ? body.response_types
      : ["code"],
    token_endpoint_auth_method:
      body.token_endpoint_auth_method || "none",
  });
}
