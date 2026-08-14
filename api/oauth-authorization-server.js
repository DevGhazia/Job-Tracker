import { baseUrl, setCorsHeaders } from "./oauth/_shared.js";

export default function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const base = baseUrl(req);

  res.status(200).json({
    issuer: base,

    authorization_endpoint: `${base}/api/oauth/authorize`,

    token_endpoint: `${base}/api/oauth/token`,

    registration_endpoint: `${base}/api/oauth/register`,

    response_types_supported: ["code"],

    grant_types_supported: [
      "authorization_code",
      "refresh_token",
    ],

    token_endpoint_auth_methods_supported: ["none"],

    code_challenge_methods_supported: ["S256"],
    
    client_id_metadata_document_supported: false,
  });
}