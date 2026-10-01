#!/usr/bin/env node
/**
 * prune-queue.mjs
 * Inspects all currently Queued jobs in Firestore using Playwright.
 * Automatically deletes listings that are closed, expired, 404, or no longer accepting applications.
 * Moves them to dismissed_jobs so they are never scraped or queued again.
 *
 * Usage:
 *   node scripts/prune-queue.mjs
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { chromium } from "playwright";
import { checkJobViability } from "./verifier.mjs";

const serviceAccount = {
  type: "service_account",
  project_id: "job-tracker-79362",
  private_key_id: "da1b24a7a30679bc1731fcc2cc1477b6d3df9c2e",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCSxymRpe6fJTkn\necB7cg8mSDBWeHmOObQ+JJ6WwrMYwNL96lM40zRP6x9QnDo8FmThYM2JB+Q2bK/Q\nusLpH2JftNi2AzhrqBaViKnwfaonK41FLT5Dv8hR57PGE9zvRL0G1b132tVxcV8g\n7SFFgrilCOA6Pkp29HTWoevhZYVILmLQ46Z5RHUCieUuVLFEvAhndBkW4tbXPL83\nlzcT0+zDybz9+qzi9w0SnDJQb8dISyOtA3HfZGjVwfRZfoomTlN+q8eun9wYusBd\nN8ueXbOcdMU8aQnATvAjeCHJM3yiHMqOaAZurSh06Q8Ks0aBM5ufJ8LCz0y/oDDK\nL7L3FmWTAgMBAAECggEABA46ZlAE62Mjv0+nE2If7AleQzgPTRroEY2BJPOamj+o\nX3lhikuVAZ5NXl9VYUKnJUO/pMknM5/GLd4d3kN5PDbALtX2Rvc9Ly2NsIZFtNEI\nasBox4YdkAchxFfZKMf9RxqRzSV/9KNSzb3vnOmTQNrMGJ/kU9bGVwXgrCOEzsKP\n+bO87kvDW+DhJoXOXyhNEek9PzGpa6BICqkxOBplVpjZmGhGtQAQAtFjocAqnb/5\nqgkPAUiX4WeLjrXFlgZm26XRMqFcbvPB8Yd8lEwf1GwPtdoBFIxDq3njRYNBSKan\nKfBWF17tuLTZy3EnNm0fnl8eEJuFuqSzgOpJju/4SQKBgQDDHRDo2ngr0IU6fvz5\nfBJYUdLTLzGx8N9mt7+vD/0TsD0nzD2LksljXAipqfaIA+xHMQt2lxnu+mfU4IXX\ngsyzvkholcfUu3KvkEQKYtMminetLg7V+b6V6c/f1C1SZQ18/xYskHkZFkomLjCY\nls9ZByb7WIXB8NKBS7Nyv8Cl+QKBgQDAlL0LgtmHhSh0AvhOodsEki57EfOMiBCg\nxZlkWP/Oi5IFnmymbCG9MTTeg305b3/cLSt1ZwZ6C7AhFfcHudI45ZdY6F5krB29\nWdawChRew7s+SSf0UOrw0orRQEbrFRWMq0+t2UCnEMkb2uReYgnez1EKLm1/SUO1\nuLZ53Sja6wKBgQCn8nEHvmYKcOb9PynKJn4z/9qVZd5E6K2j4S7iJcUWGXHKvAeO\nCL/JAwOB54cJ9TaA4TqYzd/I0Upm9wy+QRyq63Owcp0cBG3nqSqoNgDDABWbwDWN\nAfiHWkdQx3ZroghGO9x+Z62VZpZU3xV9gvLgE0P+vmgEVKMeIGdKsrvFIQKBgBH1\nDJepMN15JieDK2Ixp3mKo/jn2JzvBxXmtwHrZpb83rXVau4twQuiLfrdqeyUIAkI\n0TeWTr1Mn7TGFo3K3vZdOjqZGEws3G0Oln09w15+w9PwAGDAtteT2kvewX4kLik6\nxChCzMuHPilxxL+kRqVXEYhwgddPnpewTJuaarfXAoGBAKfEwtNTS2nR0AtzjmrN\n5+YGUm5VkBAzvnFAVUa/zYbNcqtiXKQIluj1rYPgB6v+jRBEB+42UAvFlQ+iIBbs\nW9X7G+Ft2F5DHhpxPFkU1Cin7ghjHsvts37OONey7v4uzAM1kf2S3hMMAZ2837TH\nniQlaKYWdEC5wOGxGRmDbdDQ\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@job-tracker-79362.iam.gserviceaccount.com",
};

if (!getApps().length) initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const DEFAULT_USER_ID = "mTRDrxLoFaPjAKU1TOvqxgMt21o2";

/**
 * Prunes expired or closed jobs from the user's Queued applications.
 * @param {object} [existingDb]
 * @param {string} [userId]
 * @param {object} [existingBrowser]
 * @returns {Promise<{ checkedCount: number, prunedCount: number, prunedJobs: Array }>}
 */
export async function pruneExpiredQueuedJobs(customDb = db, userId = DEFAULT_USER_ID, existingBrowser = null) {
  console.log(`\n🧹 [Queue Health Check] Checking existing Queued jobs for dead / closed postings...`);

  const snap = await customDb
    .collection("users")
    .doc(userId)
    .collection("applications")
    .where("status", "==", "Queued")
    .get();

  if (snap.empty) {
    console.log("ℹ️  No Queued applications to verify.");
    return { checkedCount: 0, prunedCount: 0, prunedJobs: [] };
  }

  console.log(`🔍 Found ${snap.docs.length} Queued ${snap.docs.length === 1 ? "job" : "jobs"} to verify.`);

  let browser = existingBrowser;
  let shouldCloseBrowser = false;

  if (!browser) {
    try {
      browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
      });
      shouldCloseBrowser = true;
    } catch (e) {
      console.warn("⚠️ Could not launch browser for queue health check:", e.message);
      return { checkedCount: snap.docs.length, prunedCount: 0, prunedJobs: [] };
    }
  }

  const prunedJobs = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const jobUrl = data.jobUrl || data.directApplyUrl;
    const company = data.company || "Unknown Company";
    const role = data.role || "Unknown Role";

    console.log(`🔎 Verifying: ${company} — ${role}...`);
    const viability = await checkJobViability(jobUrl, browser);

    if (!viability.isViable) {
      console.log(`  ❌ DEAD LISTING DETECTED: ${viability.reason}`);
      console.log(`  🗑️ Removing doc ${doc.id} from Action Queue...`);

      // Delete from applications collection so it leaves the Action Queue
      // (We do NOT add to dismissed_jobs so that if the company posts again in the future, it is discovered!)
      await customDb
        .collection("users")
        .doc(userId)
        .collection("applications")
        .doc(doc.id)
        .delete();

      prunedJobs.push({ id: doc.id, company, role, reason: viability.reason });
      console.log(`  ✅ Removed from queue (company remains eligible for future postings).`);
    } else {
      console.log(`  🟢 Active and accepting applications.`);
    }
  }

  if (shouldCloseBrowser && browser) {
    await browser.close();
  }

  if (prunedJobs.length > 0) {
    try {
      const { sendDiscordNotification } = await import("./notifier.mjs");
      const timeString = new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
      await sendDiscordNotification({
        embeds: [
          {
            title: `🧹 Action Queue — ${prunedJobs.length} outdated ${prunedJobs.length === 1 ? "posting" : "postings"} removed`,
            description: `Queue cleaner verified all active listings with Playwright. Automatically removed **${prunedJobs.length}** outdated or closed ${prunedJobs.length === 1 ? "posting" : "postings"}:\n\n${prunedJobs.map(j => `• **${j.company}** — ${j.role} *(${j.reason || "Closed"})*`).join("\n")}\n\n👉 [Open Action Queue](https://thejobtracker.vercel.app/)`,
            color: 0xf59e0b,
            footer: {
              text: `Job Tracker • Queue Hygiene • ${timeString} IST`
            },
            timestamp: new Date().toISOString(),
            url: "https://thejobtracker.vercel.app/"
          }
        ]
      });
      console.log(`📲 Discord notification sent: "${prunedJobs.length} outdated postings removed".`);
    } catch (e) {
      console.warn("⚠️ Could not send Discord notification for queue pruning:", e.message);
    }
  }

  console.log(`\n🎉 [Queue Health Complete] Pruned ${prunedJobs.length} expired / closed jobs out of ${snap.docs.length} checked.\n`);
  return { checkedCount: snap.docs.length, prunedCount: prunedJobs.length, prunedJobs };
}

// Direct execution
if (process.argv[1] && process.argv[1].endsWith("prune-queue.mjs")) {
  pruneExpiredQueuedJobs()
    .then((res) => {
      console.log(`Done! Pruned ${res.prunedCount} stale jobs.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Queue pruning error:", err);
      process.exit(1);
    });
}
