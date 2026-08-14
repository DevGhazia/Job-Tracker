import { baseUrl, setCorsHeaders } from "./_shared.js";

export default function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const base = baseUrl(req);

  res.status(200).json({
    resource: `${base}/api/mcp`,

    authorization_servers: [
      base,
    ],

    bearer_methods_supported: ["header"],
  });
}
