export default function handler(req, res) {
  res.status(200).json({
    issuer: "https://thejobtracker.vercel.app",

    authorization_endpoint:
      "https://thejobtracker.vercel.app/api/oauth/authorize",

    token_endpoint:
      "https://thejobtracker.vercel.app/api/oauth/token",

    registration_endpoint:
      "https://thejobtracker.vercel.app/api/oauth/register",

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