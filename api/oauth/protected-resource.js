import { baseUrl } from "./_shared.js";

export default function handler(request, response) {
  const origin = baseUrl(request);
  return response.status(200).json({
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    bearer_methods_supported: ["header"],
  });
}
