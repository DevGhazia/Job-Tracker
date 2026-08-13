import { baseUrl } from "./_shared.js";

export default function handler(req, res) {
  res.status(200).json({
    resource: "https://thejobtracker.vercel.app/api/mcp",

    authorization_servers: [
      "https://thejobtracker.vercel.app",
    ],

    bearer_methods_supported: ["header"],
  });
}
