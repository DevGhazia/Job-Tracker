import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const deployedHost = process.env.VERCEL_URL;

if (!deployedHost) {
  console.log("Skipping static OAuth metadata generation outside Vercel.");
  process.exit(0);
}

const issuer = `https://${deployedHost}`;
const authMetadata = {
  issuer,
  authorization_endpoint: `${issuer}/api/oauth/authorize`,
  token_endpoint: `${issuer}/api/oauth/token`,
  registration_endpoint: `${issuer}/api/oauth/register`,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  code_challenge_methods_supported: ["S256"],
  token_endpoint_auth_methods_supported: ["none"],
  client_id_metadata_document_supported: false,
};

const resourceMetadata = {
  resource: `${issuer}/api/mcp`,
  authorization_servers: [issuer],
  bearer_methods_supported: ["header"],
};

const directory = join("dist", ".well-known");
await mkdir(directory, { recursive: true });
await writeFile(join(directory, "oauth-authorization-server"), JSON.stringify(authMetadata));
await writeFile(join(directory, "oauth-protected-resource"), JSON.stringify(resourceMetadata));
