#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

function getEnvVar(key) {
  if (process.env[key]) return process.env[key];
  try {
    const envFile = readFileSync(resolve(rootDir, ".env"), "utf-8");
    const m = envFile.match(new RegExp(`${key}\\s*[:=]\\s*([^\\r\\n]+)`));
    if (m) return m[1].trim();
  } catch {}
  return null;
}

export async function sendWhatsAppNotification(message) {
  const phone = getEnvVar("WHATSAPP_PHONE");
  const apikey = getEnvVar("WHATSAPP_APIKEY");

  if (!phone || !apikey) {
    console.log("ℹ️ WhatsApp notification skipped (WHATSAPP_PHONE or WHATSAPP_APIKEY not set in .env)");
    return;
  }

  try {
    const encodedText = encodeURIComponent(message);
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedText}&apikey=${apikey}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      console.log("📲 WhatsApp notification ping sent successfully!");
    } else {
      const errorText = await res.text();
      console.warn("⚠️ CallMeBot response:", errorText);
    }
  } catch (err) {
    console.warn("⚠️ Could not send WhatsApp notification:", err.message);
  }
}
