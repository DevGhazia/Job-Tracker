import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const deployedHost = process.env.VERCEL_URL;

if (!deployedHost) {
  console.log("Skipping OAuth metadata generation outside Vercel.");
  process.exit(0);
}

const issuer = `https://${deployedHost}`;
const metadata = {
  issuer,
  authorization_endpoint: `${issuer}/api/oauth/authorize`,
  token_endpoint: `${issuer}/api/oauth/token`,
  registration_endpoint: `${issuer}/api/oauth/register`,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  code_challenge_methods_supported: ["S256"],
  token_endpoint_auth_methods_supported: ["none"],
};

const directory = join("dist", ".well-known");
await mkdir(directory, { recursive: true });
await writeFile(join(directory, "oauth-authorization-server"), JSON.stringify(metadata));
