import {
  ACCESS_TOKEN_TTL_SECONDS,
  getAdminFirestore,
  hash,
  oauthError,
  parseRequestBody,
  pkceChallenge,
  randomToken,
  setCorsHeaders,
} from "./_shared.js";

async function issueTokens(clientId) {
  const accessToken = randomToken();
  const refreshToken = randomToken();
  const expiresAt = Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000;

  await getAdminFirestore().collection("mcpOAuthTokens").doc(hash(accessToken)).set({
    clientId,
    expiresAt,
    refreshTokenHash: hash(refreshToken),
  });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
  };
}

export default async function handler(request, response) {
  setCorsHeaders(request, response);

  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const body = parseRequestBody(request);
  const { grant_type: grantType, client_id: clientId } = body;
  if (!clientId) return oauthError(response, "invalid_request", "client_id is required.");

  try {
    const client = await getAdminFirestore().collection("mcpOAuthClients").doc(clientId).get();
    if (!client.exists) return oauthError(response, "invalid_client", "Unknown client.", 401);

    if (grantType === "authorization_code") {
      const { code, redirect_uri: redirectUri, code_verifier: verifier } = body;
      if (!code || !redirectUri || !verifier) return oauthError(response, "invalid_request", "Missing authorization-code fields.");

      const codeReference = getAdminFirestore().collection("mcpOAuthCodes").doc(hash(code));
      const codeSnapshot = await codeReference.get();
      if (!codeSnapshot.exists) {
        return oauthError(response, "invalid_grant", "Authorization code is invalid or already used.");
      }

      const authorization = codeSnapshot.data();
      if (authorization.expiresAt < Date.now()) {
        await codeReference.delete();
        return oauthError(response, "invalid_grant", "Authorization code has expired.");
      }
      if (authorization.clientId !== clientId || authorization.redirectUri !== redirectUri || authorization.codeChallenge !== pkceChallenge(verifier)) {
        return oauthError(response, "invalid_grant", "Authorization-code verification failed.");
      }

      await codeReference.delete();
      return response.status(200).json(await issueTokens(clientId));
    }

    if (grantType === "refresh_token") {
      const refreshToken = body.refresh_token;
      if (!refreshToken) return oauthError(response, "invalid_request", "refresh_token is required.");
      const snapshot = await getAdminFirestore().collection("mcpOAuthTokens").where("refreshTokenHash", "==", hash(refreshToken)).limit(1).get();
      const tokenDocument = snapshot.docs[0];
      if (!tokenDocument || tokenDocument.data().clientId !== clientId) return oauthError(response, "invalid_grant", "Refresh token is invalid.");
      await tokenDocument.ref.delete();
      return response.status(200).json(await issueTokens(clientId));
    }

    return oauthError(response, "unsupported_grant_type", "Supported grants are authorization_code and refresh_token.");
  } catch (err) {
    console.error("Token error:", err);
    return oauthError(response, "server_error", err.message, 500);
  }
}
