#!/usr/bin/env node
import { discoverLiveJobs, generateTailoredPitch } from "./job-hunter.mjs";
import { sendWhatsAppNotification } from "./notifier.mjs";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

const serviceAccount = {
  type: "service_account",
  project_id: "job-tracker-79362",
  private_key_id: "da1b24a7a30679bc1731fcc2cc1477b6d3df9c2e",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCSxymRpe6fJTkn\necB7cg8mSDBWeHmOObQ+JJ6WwrMYwNL96lM40zRP6x9QnDo8FmThYM2JB+Q2bK/Q\nusLpH2JftNi2AzhrqBaViKnwfaonK41FLT5Dv8hR57PGE9zvRL0G1b132tVxcV8g\n7SFFgrilCOA6Pkp29HTWoevhZYVILmLQ46Z5RHUCieUuVLFEvAhndBkW4tbXPL83\nlzcT0+zDybz9+qzi9w0SnDJQb8dISyOtA3HfZGjVwfRZfoomTlN+q8eun9wYusBd\nN8ueXbOcdMU8aQnATvAjeCHJM3yiHMqOaAZurSh06Q8Ks0aBM5ufJ8LCz0y/oDDK\nL7L3FmWTAgMBAAECggEABA46ZlAE62Mjv0+nE2If7AleQzgPTRroEY2BJPOamj+o\nX3lhikuVAZ5NXl9VYUKnJUO/pMknM5/GLd4d3kN5PDbALtX2Rvc9Ly2NsIZFtNEI\nasBox4YdkAchxFfZKMf9RxqRzSV/9KNSzb3vnOmTQNrMGJ/kU9bGVwXgrCOEzsKP\n+bO87kvDW+DhJoXOXyhNEek9PzGpa6BICqkxOBplVpjZmGhGtQAQAtFjocAqnb/5\nqgkPAUiX4WeLjrXFlgZm26XRMqFcbvPB8Yd8lEwf1GwPtdoBFIxDq3njRYNBSKan\nKfBWF17tuLTZy3EnNm0fnl8eEJuFuqSzgOpJju/4SQKBgQDDHRDo2ngr0IU6fvz5\nfBJYUdLTLzGx8N9mt7+vD/0TsD0nzD2LksljXAipqfaIA+xHMQt2lxnu+mfU4IXX\ngsyzvkholcfUu3KvkEQKYtMminetLg7V+b6V6c/f1C1SZQ18/xYskHkZFkomLjCY\nls9ZByb7WIXB8NKBS7Nyv8Cl+QKBgQDAlL0LgtmHhSh0AvhOodsEki57EfOMiBCg\nxZlkWP/Oi5IFnmymbCG9MTTeg305b3/cLSt1ZwZ6C7AhFfcHudI45ZdY6F5krB29\nWdawChRew7s+SSf0UOrw0orRQEbrFRWMq0+t2UCnEMkb2uReYgnez1EKLm1/SUO1\nuLZ53Sja6wKBgQCn8nEHvmYKcOb9PynKJn4z/9qVZd5E6K2j4S7iJcUWGXHKvAeO\nCL/JAwOB54cJ9TaA4TqYzd/I0Upm9wy+QRyq63Owcp0cBG3nqSqoNgDDABWbwDWN\nAfiHWkdQx3ZroghGO9x+Z62VZpZU3xV9gvLgE0P+vmgEVKMeIGdKsrvFIQKBgBH1\nDJepMN15JieDK2Ixp3mKo/jn2JzvBxXmtwHrZpb83rXVau4twQuiLfrdqeyUIAkI\n0TeWTr1Mn7TGFo3K3vZdOjqZGEws3G0Oln09w15+w9PwAGDAtteT2kvewX4kLik6\nxChCzMuHPilxxL+kRqVXEYhwgddPnpewTJuaarfXAoGBAKfEwtNTS2nR0AtzjmrN\n5+YGUm5VkBAzvnFAVUa/zYbNcqtiXKQIluj1rYPgB6v+jRBEB+42UAvFlQ+iIBbs\nW9X7G+Ft2F5DHhpxPFkU1Cin7ghjHsvts37OONey7v4uzAM1kf2S3hMMAZ2837TH\nniQlaKYWdEC5wOGxGRmDbdDQ\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@job-tracker-79362.iam.gserviceaccount.com",
  client_id: "117470804024697548023",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40job-tracker-79362.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();
const DEFAULT_USER_ID = "mTRDrxLoFaPjAKU1TOvqxgMt21o2";

async function runSearchAndQueue() {
  const profile = JSON.parse(readFileSync(resolve(rootDir, "candidate_profile.json"), "utf-8"));
  const jobs = await discoverLiveJobs();

  if (jobs.length === 0) {
    console.log("No new jobs found matching your criteria.");
    return;
  }

  // Get existing applications and dismissed jobs to avoid duplicates and re-adding dismissed companies
  const existingUrls = new Set();
  const existingSignatures = new Set();

  const appsSnapshot = await db.collection("users").doc(DEFAULT_USER_ID).collection("applications").get();
  appsSnapshot.docs.forEach((d) => {
    const data = d.data();
    if (data.jobUrl) existingUrls.add(data.jobUrl.trim().toLowerCase());
    if (data.company && data.role) {
      const cleanCompany = data.company.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanRole = data.role.toLowerCase().replace(/[^a-z0-9]/g, "");
      existingSignatures.add(`${cleanCompany}::${cleanRole}`);
    }
  });

  const dismissedSnapshot = await db.collection("users").doc(DEFAULT_USER_ID).collection("dismissed_jobs").get();
  dismissedSnapshot.docs.forEach((d) => {
    const data = d.data();
    if (data.jobUrl) existingUrls.add(data.jobUrl.trim().toLowerCase());
    if (data.company && data.role) {
      const cleanCompany = data.company.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanRole = data.role.toLowerCase().replace(/[^a-z0-9]/g, "");
      existingSignatures.add(`${cleanCompany}::${cleanRole}`);
    }
  });

  let queuedCount = 0;
  const newlyQueued = [];
  const today = new Date().toISOString().split("T")[0];

  for (const job of jobs) {
    const cleanCompany = (job.company || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanRole = (job.role || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const signature = `${cleanCompany}::${cleanRole}`;
    const cleanUrl = (job.jobUrl || "").trim().toLowerCase();

    if ((cleanUrl && existingUrls.has(cleanUrl)) || existingSignatures.has(signature)) {
      console.log(`⏩ Skipping already tracked or previously dismissed job: ${job.role} at ${job.company}`);
      continue;
    }

    const tailoredPitch = generateTailoredPitch(job, profile);
    const newApp = {
      logo: job.logo || null,
      company: job.company,
      role: job.role,
      location: job.location,
      experience: job.experience,
      jobUrl: job.jobUrl,
      portalName: job.portalName,
      notes: tailoredPitch,
      status: "Queued",
      date: today,
      didInterview: false
    };

    const doc = await db.collection("users").doc(DEFAULT_USER_ID).collection("applications").add(newApp);
    console.log(`⚡ Queued: ${job.role} at ${job.company} [ID: ${doc.id}]`);
    existingUrls.add(job.jobUrl);
    queuedCount++;
    newlyQueued.push(job);
  }

  console.log(`\n🎉 Successfully queued ${queuedCount} new jobs to your Action Queue!`);

  if (queuedCount > 0) {
    const summary = newlyQueued
      .slice(0, 5)
      .map((j, idx) => `${idx + 1}. *${j.role}* at *${j.company}* (${j.portalName || j.source})`)
      .join("\n");
    const waMsg = `⚡ *Job Tracker Alert!*\n\nFound and queued *${queuedCount}* new verified frontend role(s):\n\n${summary}\n\n👉 Review & Apply: https://thejobtracker.vercel.app/`;
    await sendWhatsAppNotification(waMsg);
  }
}

runSearchAndQueue();
