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

  if (!phone || !apikey) return;

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

export async function sendTelegramNotification(message) {
  const botToken = getEnvVar("TELEGRAM_BOT_TOKEN");
  const chatId = getEnvVar("TELEGRAM_CHAT_ID");

  if (!botToken || !chatId) return;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown"
      }),
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      console.log("✈️ Telegram notification sent successfully!");
    } else {
      console.warn("⚠️ Telegram error:", await res.text());
    }
  } catch (err) {
    console.warn("⚠️ Could not send Telegram notification:", err.message);
  }
}

export async function sendDiscordNotification(payload) {
  const webhookUrl = getEnvVar("DISCORD_WEBHOOK_URL");
  if (!webhookUrl) return;

  try {
    let bodyData = {};

    if (typeof payload === "string") {
      bodyData = { content: payload };
    } else if (payload && payload.jobs) {
      const { jobs = [], count = jobs.length } = payload;
      const hasFallbacks = jobs.some(j => j.isFallback);
      const fields = jobs.slice(0, 6).map((j, i) => {
        const fallbackBadge = j.isFallback ? " • 🛡️ *Fast Fallback*" : "";
        return {
          name: `${i + 1}. **${j.company}** — ${j.role}`,
          value: `📍 ${j.location || 'Remote'} • 🌐 ${j.portalName || j.source || 'Direct'}${fallbackBadge} • [Apply Now ↗](${j.jobUrl})`,
          inline: false
        };
      });

      const fallbackNote = hasFallbacks
        ? "\n\n🛡️ *Note: Some listings were preserved via Fast-Card Fallback.*"
        : "";

      bodyData = {
        embeds: [
          {
            title: `🎯 ${count} New Frontend Role(s) Queued`,
            description: `Ready in your [Action Queue](https://thejobtracker.vercel.app/)${fallbackNote}`,
            color: 0x3b82f6,
            fields: fields,
            url: "https://thejobtracker.vercel.app/",
            footer: {
              text: "Job Tracker • Next scan in ~4 hrs"
            },
            timestamp: new Date().toISOString()
          }
        ]
      };
    } else {
      bodyData = payload;
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      console.log("🎮 Discord rich embed notification sent successfully!");
    }
  } catch (err) {
    console.warn("⚠️ Could not send Discord notification:", err.message);
  }
}

export async function sendJobAlert(payload) {
  const textMsg = typeof payload === "string" ? payload : payload.text || "⚡ New jobs queued in Job Tracker!";
  await Promise.allSettled([
    sendWhatsAppNotification(textMsg),
    sendTelegramNotification(textMsg),
    sendDiscordNotification(payload)
  ]);
}
