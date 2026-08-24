import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import FirecrawlApp from "@mendable/firecrawl-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// 1. Initialize Firebase Admin
const searchCode = readFileSync(resolve(rootDir, "scripts/search-and-queue.mjs"), "utf-8");
const matchKey = searchCode.match(/private_key:\s*("[^"]+")/);
const privateKey = matchKey ? JSON.parse(matchKey[1]) : process.env.FIREBASE_PRIVATE_KEY;

const serviceAccount = {
  project_id: "job-tracker-79362",
  client_email: "firebase-adminsdk-fbsvc@job-tracker-79362.iam.gserviceaccount.com",
  private_key: privateKey
};

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();
const DEFAULT_USER_ID = "mTRDrxLoFaPjAKU1TOvqxgMt21o2";

function getDiscordWebhookUrl() {
  if (process.env.DISCORD_WEBHOOK_URL) return process.env.DISCORD_WEBHOOK_URL;
  try {
    const envFile = readFileSync(resolve(rootDir, ".env"), "utf-8");
    const m = envFile.match(/DISCORD_WEBHOOK_URL\s*[:=]\s*([^\r\n]+)/);
    if (m) return m[1].trim();
  } catch {}
  return "https://discord.com/api/webhooks/1539211263282909195/7XIyouaKp8OuiFK_nmiKUotYnVf9EypY420N6wtu1_RlSO8fNQ7wEAdg80ZIrbGfOaQw";
}

const DISCORD_WEBHOOK_URL = getDiscordWebhookUrl();

function getFirecrawlApiKey() {
  if (process.env.FIRECRAWL_API_KEY) return process.env.FIRECRAWL_API_KEY;
  try {
    const envFile = readFileSync(resolve(rootDir, ".env"), "utf-8");
    const m = envFile.match(/FIRECRAWL_API_KEY\s*[:=]\s*([^\r\n]+)/);
    if (m) return m[1].trim();
  } catch {}
  return null;
}

const firecrawlKey = getFirecrawlApiKey();
const firecrawl = firecrawlKey ? new FirecrawlApp({ apiKey: firecrawlKey }) : null;

// 2. DM Message Templates Generator
export function generateTailoredDm(category, personName, companyName, extraContext = "") {
  const firstName = personName ? personName.split(" ")[0].trim() : "there";
  const company = companyName || "your team";

  switch (category) {
    case "hiring_post":
      return `Hi ${firstName}, saw your post looking for a Frontend/React engineer for ${company}.\n\nI’m a Frontend Engineer from IIT Roorkee with 2 YOE at BYJU'S building 50+ interactive web applications for 2M+ learners. I specialize in React, TypeScript, and UI architecture.\n\nPortfolio & Projects: https://vivek-kumar.dev\n\nI’ve attached my resume below. If you're still reviewing candidates, I'd love to chat!`;

    case "recent_funding":
      return `Hi ${firstName}, congratulations on the recent funding round for ${company}!\n\nAs you scale the product and engineering team, I wanted to reach out regarding frontend bandwidth. I’m an IIT Roorkee graduate with 2 YOE at BYJU'S shipping high-traffic web applications, specializing in React and TypeScript.\n\nPortfolio & live work: https://vivek-kumar.dev\n\nI’ve attached my resume for your review. Would love to connect if you have frontend needs!`;

    case "queued_job":
      return `Hi ${firstName}, noticed ${company} is looking for a Frontend Engineer on your team.\n\nI recently applied through the portal, but wanted to reach out directly. I’m an IIT Roorkee engineer with 2 YOE at BYJU'S developing scalable web applications, specializing in React and TypeScript.\n\nPortfolio: https://vivek-kumar.dev\n\nI’ve attached my resume below for quick review. Would appreciate 5 minutes to connect if you're open to reviewing my profile directly.`;

    case "engineering_lead":
    default:
      return `Hi ${firstName}, hope you're having a great week!\n\nI saw the Frontend opening on your team at ${company} and love what you're building. I’m an IIT Roorkee engineer (2 YOE at BYJU'S building interactive web applications, specializing in React & TypeScript).\n\nPortfolio: https://vivek-kumar.dev\n\nI've attached my resume below. Would you be open to giving a quick referral or passing my profile to the hiring team?`;
  }
}

// 3. Multi-tier Logo Resolver
export function resolveCompanyLogoUrl(company = "") {
  if (!company) return null;
  const clean = company
    .replace(/\s*(?:in india|technologies|solutions|inc|pvt|ltd|interactive|software|tech|llc|gmbh).*$/i, "")
    .trim();
  const domain = clean.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
  return `https://unavatar.io/${domain}?fallback=https://logo.clearbit.com/${domain}`;
}

// 4. Decision Maker Lookup (via Firecrawl Search)
export async function lookupDecisionMakers(companyName) {
  if (!companyName || !firecrawl) return [];
  const cleanCompany = companyName
    .replace(/\s*(?:in india|technologies|solutions|inc|pvt|ltd|interactive|software|tech|llc|gmbh).*$/i, "")
    .trim();

  const query = `site:linkedin.com/in "${cleanCompany}" ("CTO" OR "Founder" OR "Co-Founder" OR "Engineering Manager" OR "Head of Engineering" OR "Engineering Lead")`;
  
  try {
    const res = await firecrawl.search(query, { limit: 3 });
    const items = res.web || [];
    const matches = [];

    for (const item of items) {
      if (!item.url || !item.url.includes("linkedin.com/in/")) continue;

      // Extract Name and Title from item.title
      // Format usually: "Name - Title @ Company" or "Name - Title - Company | LinkedIn"
      const cleanTitle = (item.title || "").replace(/\s*\|\s*LinkedIn.*$/i, "").trim();
      const parts = cleanTitle.split(/[-–—@|]/).map(p => p.trim());

      let name = parts[0] || "Hiring Lead";
      let role = parts.slice(1).join(" - ") || "Engineering Leader";

      // Filter out non-person titles
      if (name.toLowerCase().includes("top") || name.toLowerCase().includes("jobs") || name.toLowerCase().includes("profile")) continue;

      // Determine category based on role
      let category = "queued_job";
      const lowerRole = role.toLowerCase();
      if (lowerRole.includes("founder") || lowerRole.includes("ceo") || lowerRole.includes("cto")) {
        category = "queued_job";
      } else if (lowerRole.includes("engineering manager") || lowerRole.includes("lead") || lowerRole.includes("head of")) {
        category = "engineering_lead";
      }

      matches.push({
        name: name,
        title: role,
        company: cleanCompany,
        linkedinUrl: item.url,
        category: category,
        snippet: item.description || `Engineering Leader at ${cleanCompany}`
      });
    }

    return matches;
  } catch (err) {
    console.warn(`Decision maker search warning for ${companyName}:`, err.message);
    return [];
  }
}

// 5. Recent Funding Round Hunter (Inc42 & TechCrunch Feeds)
export async function huntRecentFundingLeads() {
  const fundingLeads = [];
  const feeds = [
    "https://techcrunch.com/category/startups/feed/",
    "https://inc42.com/feed/"
  ];

  for (const feedUrl of feeds) {
    try {
      const res = await fetch(feedUrl, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) continue;
      const xml = await res.text();

      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      for (const item of items.slice(0, 10)) {
        const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || item.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/i);
        const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || item.match(/<description>([\s\S]*?)<\/description>/i);

        const title = titleMatch ? titleMatch[1].trim() : "";
        const link = linkMatch ? linkMatch[1].trim() : "";
        const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "";

        if (/raises|secures|bags|closes|funding|seed|series a|series-a|million/i.test(title)) {
          const compMatch = title.match(/^([A-Za-z0-9\s]+?)\s+(?:raises|secures|bags|closes|gets)/i);
          if (compMatch && compMatch[1].length < 25) {
            const companyName = compMatch[1].trim();
            fundingLeads.push({
              company: companyName,
              sourceSnippet: title,
              sourceUrl: link,
              desc: desc.slice(0, 200)
            });
          }
        }
      }
    } catch {}
  }

  return fundingLeads;
}

// 6. Direct Hiring Posts Scanner (LinkedIn / X public posts)
export async function huntPublicHiringPosts() {
  if (!firecrawl) return [];
  const query = `site:linkedin.com/posts ("hiring" OR "looking for") ("frontend" OR "react") ("DM me" OR "reach out" OR "send resume")`;
  try {
    const res = await firecrawl.search(query, { limit: 4 });
    const items = res.web || [];
    const postLeads = [];

    for (const item of items) {
      const cleanTitle = (item.title || "").replace(/\s*\|\s*LinkedIn.*$/i, "").trim();
      const parts = cleanTitle.split(/[-–—|]/).map(p => p.trim());
      const name = parts[0] || "Hiring Lead";
      const snippet = item.description || cleanTitle;

      // Extract possible company
      const compMatch = cleanTitle.match(/(?:at|@)\s+([A-Za-z0-9\s]+)/i);
      const company = compMatch ? compMatch[1].trim() : "Tech Startup";

      postLeads.push({
        name: name,
        title: "Founder / Engineering Leader",
        company: company,
        linkedinUrl: item.url,
        category: "hiring_post",
        sourceSnippet: snippet.slice(0, 220)
      });
    }
    return postLeads;
  } catch {
    return [];
  }
}

// 7. Discord Notification
export async function sendDmDiscordNotification(lead) {
  if (!DISCORD_WEBHOOK_URL) return;

  const categoryLabels = {
    hiring_post: "🟣 🚀 Founder Hiring Post",
    recent_funding: "🟢 💰 Recent Funding Round",
    queued_job: "🔵 📌 Queued Job Decision Maker",
    engineering_lead: "🟠 ⚡ Frontend Lead / EM"
  };

  const categoryColors = {
    hiring_post: 0x9333ea,
    recent_funding: 0x10b981,
    queued_job: 0x2563eb,
    engineering_lead: 0xf59e0b
  };

  const payload = {
    embeds: [
      {
        title: `🎯 High-Signal DM Lead: ${lead.name}`,
        description: `**${lead.title}** at **${lead.company}**\n\n💬 **Discovery Signal:**\n> _${lead.sourceSnippet || "Direct engineering hiring leader"}_`,
        color: categoryColors[lead.category] || 0x2563eb,
        fields: [
          {
            name: "🏷️ Source Category",
            value: categoryLabels[lead.category] || "Queued Job Contact",
            inline: true
          },
          {
            name: "📍 Links",
            value: `[LinkedIn Profile ↗](${lead.linkedinUrl})\n[Open DM Dashboard ↗](https://thejobtracker.vercel.app/)`,
            inline: true
          },
          {
            name: "📝 Pre-Drafted DM (Ready to Send)",
            value: "```\n" + lead.tailoredDm.slice(0, 300) + "...\n```",
            inline: false
          }
        ],
        footer: {
          text: `Job Tracker DM Queue • ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })} IST`
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log(`🎮 Discord DM notification sent for ${lead.name} (${lead.company})`);
  } catch (err) {
    console.error("Failed to send Discord DM notification:", err.message);
  }
}

// 8. Main Runner
export async function runDmHunter() {
  console.log("🔍 Scanning for Founders, CTOs & Engineering Leaders for your DM Queue...\n");

  const existingSnapshot = await db.collection("users").doc(DEFAULT_USER_ID).collection("dm_leads").get();
  const existingUrls = new Set();
  const existingKeys = new Set();

  existingSnapshot.docs.forEach(doc => {
    const d = doc.data();
    if (d.linkedinUrl) existingUrls.add(d.linkedinUrl.toLowerCase().trim());
    if (d.company && d.name) existingKeys.add(`${d.company.toLowerCase()}::${d.name.toLowerCase()}`);
  });

  let newLeadsCount = 0;

  // STEP A: Resolve Decision Makers for active Applications & Queued Jobs
  console.log("📌 Step A: Resolving Decision Makers for active Applications & Queued Jobs...");
  const recentAppsSnapshot = await db.collection("users").doc(DEFAULT_USER_ID).collection("applications")
    .limit(15)
    .get();

  const activeCompanies = [];
  recentAppsSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.company && !activeCompanies.includes(data.company) && data.status !== "Dismissed") {
      activeCompanies.push(data.company);
    }
  });

  for (const company of activeCompanies.slice(0, 8)) {
    console.log(`🔎 Looking up CTO / Engineering Leads for: ${company}...`);
    const people = await lookupDecisionMakers(company);

    for (const person of people) {
      const key = `${person.company.toLowerCase()}::${person.name.toLowerCase()}`;
      if (existingUrls.has(person.linkedinUrl.toLowerCase().trim()) || existingKeys.has(key)) {
        continue;
      }

      const tailoredDm = generateTailoredDm(person.category, person.name, person.company);
      const leadData = {
        name: person.name,
        title: person.title,
        company: person.company,
        companyLogo: resolveCompanyLogoUrl(person.company),
        linkedinUrl: person.linkedinUrl,
        category: person.category,
        sourceSnippet: person.snippet || `Engineering Leader at ${person.company}`,
        tailoredDm: tailoredDm,
        status: "New",
        createdAt: new Date().toISOString()
      };

      const docRef = await db.collection("users").doc(DEFAULT_USER_ID).collection("dm_leads").add(leadData);
      console.log(`✅ [${person.category}] Added ${person.name} (${person.title} @ ${person.company}) [ID: ${docRef.id}]`);
      
      existingUrls.add(person.linkedinUrl.toLowerCase().trim());
      existingKeys.add(key);
      newLeadsCount++;

      await sendDmDiscordNotification(leadData);
    }
  }

  // STEP B: Hunt for Recently Funded Startups
  console.log("\n💰 Step B: Checking Recent Startup Funding Rounds...");
  const fundingItems = await huntRecentFundingLeads();
  for (const fund of fundingItems.slice(0, 3)) {
    console.log(`🔎 Looking up Founders/CTO for recently funded startup: ${fund.company}...`);
    const people = await lookupDecisionMakers(fund.company);

    for (const person of people) {
      const key = `${person.company.toLowerCase()}::${person.name.toLowerCase()}`;
      if (existingUrls.has(person.linkedinUrl.toLowerCase().trim()) || existingKeys.has(key)) {
        continue;
      }

      const tailoredDm = generateTailoredDm("recent_funding", person.name, person.company);
      const leadData = {
        name: person.name,
        title: person.title,
        company: person.company,
        companyLogo: resolveCompanyLogoUrl(person.company),
        linkedinUrl: person.linkedinUrl,
        category: "recent_funding",
        sourceSnippet: fund.sourceSnippet,
        sourceUrl: fund.sourceUrl,
        tailoredDm: tailoredDm,
        status: "New",
        createdAt: new Date().toISOString()
      };

      const docRef = await db.collection("users").doc(DEFAULT_USER_ID).collection("dm_leads").add(leadData);
      console.log(`✅ [Recent Funding] Added ${person.name} (${person.title} @ ${person.company}) [ID: ${docRef.id}]`);

      existingUrls.add(person.linkedinUrl.toLowerCase().trim());
      existingKeys.add(key);
      newLeadsCount++;

      await sendDmDiscordNotification(leadData);
    }
  }

  // STEP C: Hunt for Direct Hiring Posts on LinkedIn
  console.log("\n🚀 Step C: Checking Direct Founder & Recruiter Hiring Posts...");
  const postLeads = await huntPublicHiringPosts();
  for (const lead of postLeads) {
    const key = `${lead.company.toLowerCase()}::${lead.name.toLowerCase()}`;
    if (existingUrls.has(lead.linkedinUrl.toLowerCase().trim()) || existingKeys.has(key)) {
      continue;
    }

    const tailoredDm = generateTailoredDm("hiring_post", lead.name, lead.company);
    const leadData = {
      name: lead.name,
      title: lead.title,
      company: lead.company,
      companyLogo: resolveCompanyLogoUrl(lead.company),
      linkedinUrl: lead.linkedinUrl,
      category: "hiring_post",
      sourceSnippet: lead.sourceSnippet,
      tailoredDm: tailoredDm,
      status: "New",
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection("users").doc(DEFAULT_USER_ID).collection("dm_leads").add(leadData);
    console.log(`✅ [Hiring Post] Added ${lead.name} (${lead.company}) [ID: ${docRef.id}]`);

    existingUrls.add(lead.linkedinUrl.toLowerCase().trim());
    existingKeys.add(key);
    newLeadsCount++;

    await sendDmDiscordNotification(leadData);
  }

  console.log(`\n🎉 DM Hunter completed! Successfully added ${newLeadsCount} new high-conviction DM leads.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runDmHunter();
}
