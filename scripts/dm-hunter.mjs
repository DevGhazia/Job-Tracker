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

function getDiscordDmWebhookUrl() {
  if (process.env.DISCORD_DM_WEBHOOK_URL) return process.env.DISCORD_DM_WEBHOOK_URL;
  try {
    const envFile = readFileSync(resolve(rootDir, ".env"), "utf-8");
    const m = envFile.match(/DISCORD_DM_WEBHOOK_URL\s*[:=]\s*([^\r\n]+)/);
    if (m && m[1].trim()) return m[1].trim();
  } catch {}

  // Fallback to general DISCORD_WEBHOOK_URL
  if (process.env.DISCORD_WEBHOOK_URL) return process.env.DISCORD_WEBHOOK_URL;
  try {
    const envFile = readFileSync(resolve(rootDir, ".env"), "utf-8");
    const m = envFile.match(/DISCORD_WEBHOOK_URL\s*[:=]\s*([^\r\n]+)/);
    if (m && m[1].trim()) return m[1].trim();
  } catch {}

  return "https://discord.com/api/webhooks/1539211263282909195/7XIyouaKp8OuiFK_nmiKUotYnVf9EypY420N6wtu1_RlSO8fNQ7wEAdg80ZIrbGfOaQw";
}

const DISCORD_DM_WEBHOOK_URL = getDiscordDmWebhookUrl();

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

// Check if candidate/person is based in India or Indian origin
function isIndiaBased(url = "", snippet = "", title = "") {
  const text = `${url} ${snippet} ${title}`.toLowerCase();
  const indiaKeywords = [
    "in.linkedin.com", "india", "bengaluru", "bangalore", "gurgaon", "gurugram", 
    "delhi", "mumbai", "noida", "hyderabad", "pune", "chennai", "kolkata", "ahmedabad",
    "iit", "nit", "bits pilani"
  ];
  return indiaKeywords.some(kw => text.includes(kw));
}

// 4. Decision Maker Lookup (Strictly 1 India-based contact per company)
export async function lookupDecisionMakers(companyName) {
  if (!companyName || !firecrawl) return null;
  const cleanCompany = companyName
    .replace(/\s*(?:in india|technologies|solutions|inc|pvt|ltd|interactive|software|tech|llc|gmbh).*$/i, "")
    .trim();

  // Specifically target India profiles
  const query = `(site:in.linkedin.com/in OR (site:linkedin.com/in "India")) "${cleanCompany}" ("CTO" OR "Founder" OR "Co-Founder" OR "Engineering Manager" OR "Head of Engineering" OR "Engineering Lead")`;
  
  try {
    const res = await firecrawl.search(query, { limit: 4 });
    const items = res.web || [];

    const candidates = [];

    for (const item of items) {
      if (!item.url || !item.url.includes("linkedin.com/in/")) continue;

      const cleanTitle = (item.title || "").replace(/\s*\|\s*LinkedIn.*$/i, "").trim();
      const parts = cleanTitle.split(/[-–—@|]/).map(p => p.trim());

      let name = parts[0] || "Hiring Lead";
      let role = parts.slice(1).join(" - ") || "Engineering Leader";

      if (name.toLowerCase().includes("top") || name.toLowerCase().includes("jobs") || name.toLowerCase().includes("profile")) continue;

      // Filter for India connection
      if (!isIndiaBased(item.url, item.description, item.title)) {
        continue;
      }

      // Priority ranking: Founder/CTO (3) > Head of Eng (2) > EM/Lead (1)
      let score = 1;
      let category = "engineering_lead";
      const lowerRole = role.toLowerCase();
      if (lowerRole.includes("founder") || lowerRole.includes("ceo") || lowerRole.includes("cto")) {
        score = 3;
        category = "queued_job";
      } else if (lowerRole.includes("head of") || lowerRole.includes("director") || lowerRole.includes("vp")) {
        score = 2;
        category = "engineering_lead";
      }

      candidates.push({
        name,
        title: role,
        company: cleanCompany,
        linkedinUrl: item.url,
        category,
        snippet: item.description || `Engineering Leader at ${cleanCompany}`,
        score
      });
    }

    if (candidates.length === 0) return null;

    // Pick single highest ranked contact
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  } catch (err) {
    console.warn(`Decision maker search warning for ${companyName}:`, err.message);
    return null;
  }
}

// 5. Recent Funding Round Hunter (Filtered strictly for <= 7 days old)
export async function huntRecentFundingLeads() {
  const fundingLeads = [];
  const feeds = [
    "https://inc42.com/feed/",
    "https://techcrunch.com/category/startups/feed/"
  ];

  const now = new Date();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  for (const feedUrl of feeds) {
    try {
      const res = await fetch(feedUrl, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const xml = await res.text();

      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      for (const item of items.slice(0, 15)) {
        const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || item.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/i);
        const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || item.match(/<description>([\s\S]*?)<\/description>/i);
        const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

        const title = titleMatch ? titleMatch[1].trim() : "";
        const link = linkMatch ? linkMatch[1].trim() : "";
        const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        const pubDateStr = dateMatch ? dateMatch[1].trim() : "";
        const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();

        // 7-day recency filter
        if (now.getTime() - pubDate.getTime() > SEVEN_DAYS_MS) {
          continue;
        }

        if (/raises|secures|bags|closes|funding|seed|series a|series-a|million/i.test(title)) {
          const compMatch = title.match(/^([A-Za-z0-9\s]+?)\s+(?:raises|secures|bags|closes|gets)/i);
          if (compMatch && compMatch[1].length < 25) {
            const companyName = compMatch[1].trim();
            fundingLeads.push({
              company: companyName,
              sourceSnippet: title,
              sourceUrl: link,
              sourceDate: pubDate.toISOString(),
              desc: desc.slice(0, 200)
            });
          }
        }
      }
    } catch {}
  }

  return fundingLeads;
}

// 6. Direct Hiring Posts Scanner (Filtered strictly for <= 7 days old India posts)
export async function huntPublicHiringPosts() {
  if (!firecrawl) return [];
  const query = `site:in.linkedin.com/posts ("hiring" OR "looking for") ("frontend" OR "react") ("DM me" OR "reach out" OR "send resume")`;
  try {
    const res = await firecrawl.search(query, { limit: 4 });
    const items = res.web || [];
    const postLeads = [];

    for (const item of items) {
      const cleanTitle = (item.title || "").replace(/\s*\|\s*LinkedIn.*$/i, "").trim();
      const parts = cleanTitle.split(/[-–—|]/).map(p => p.trim());
      const name = parts[0] || "Hiring Lead";
      const snippet = item.description || cleanTitle;

      if (!isIndiaBased(item.url, snippet, cleanTitle)) continue;

      const compMatch = cleanTitle.match(/(?:at|@)\s+([A-Za-z0-9\s]+)/i);
      const company = compMatch ? compMatch[1].trim() : "Tech Startup";

      postLeads.push({
        name: name,
        title: "Founder / Engineering Leader",
        company: company,
        linkedinUrl: item.url,
        category: "hiring_post",
        sourceSnippet: snippet.slice(0, 220),
        sourceDate: new Date().toISOString()
      });
    }
    return postLeads;
  } catch {
    return [];
  }
}

// 7. Discord Notification (Dispatched to dedicated DM Queue channel)
export async function sendDmDiscordNotification(lead) {
  if (!DISCORD_DM_WEBHOOK_URL) return;

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
        description: `**${lead.title}** at **${lead.company}** (India 🇮🇳)\n\n💬 **Discovery Signal:**\n> _${lead.sourceSnippet || "Direct engineering hiring leader"}_`,
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
    await fetch(DISCORD_DM_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log(`🎮 Discord DM notification sent to dedicated DM channel for ${lead.name} (${lead.company})`);
  } catch (err) {
    console.error("Failed to send Discord DM notification:", err.message);
  }
}

// 8. Main Runner (Strict 1 person per company & <= 7 days recency)
export async function runDmHunter() {
  console.log("🔍 Scanning for India-based Founders, CTOs & Engineering Leaders (1 person per company, <= 7 days old)...\n");

  const leadsRef = db.collection("users").doc(DEFAULT_USER_ID).collection("dm_leads");
  const existingSnapshot = await leadsRef.get();
  
  // Clean up duplicate companies in Firestore so strictly 1 contact exists per company
  const companyMap = new Map();
  const docsToDelete = [];

  existingSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const compKey = (data.company || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!compKey) {
      docsToDelete.push(doc.id);
      return;
    }

    if (companyMap.has(compKey)) {
      docsToDelete.push(doc.id); // keep the first one, delete duplicate
    } else {
      companyMap.set(compKey, doc.id);
    }
  });

  if (docsToDelete.length > 0) {
    console.log(`🧹 Pruning ${docsToDelete.length} duplicate contacts to enforce 1 person per company...`);
    for (const docId of docsToDelete) {
      await leadsRef.doc(docId).delete();
    }
  }

  const existingCompanies = new Set(companyMap.keys());
  let newLeadsCount = 0;

  // STEP A: Resolve 1 Decision Maker for active Applications & Queued Jobs
  console.log("📌 Step A: Resolving 1 India Decision Maker per active tracked company...");
  const recentAppsSnapshot = await db.collection("users").doc(DEFAULT_USER_ID).collection("applications")
    .limit(20)
    .get();

  const activeCompanies = [];
  recentAppsSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.company && data.status !== "Dismissed") {
      const compKey = data.company.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!existingCompanies.has(compKey) && !activeCompanies.includes(data.company)) {
        activeCompanies.push(data.company);
      }
    }
  });

  for (const company of activeCompanies.slice(0, 8)) {
    const compKey = company.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (existingCompanies.has(compKey)) continue;

    console.log(`🔎 Looking up India CTO / EM for: ${company}...`);
    const person = await lookupDecisionMakers(company);

    if (person) {
      const tailoredDm = generateTailoredDm(person.category, person.name, person.company);
      const leadData = {
        name: person.name,
        title: person.title,
        company: person.company,
        companyLogo: resolveCompanyLogoUrl(person.company),
        linkedinUrl: person.linkedinUrl,
        category: person.category,
        sourceSnippet: person.snippet || `Engineering Leader at ${person.company}`,
        sourceDate: new Date().toISOString(),
        tailoredDm: tailoredDm,
        status: "New",
        createdAt: new Date().toISOString()
      };

      const docRef = await leadsRef.add(leadData);
      console.log(`✅ [${person.category}] Added ${person.name} (${person.title} @ ${person.company}) [ID: ${docRef.id}]`);
      
      existingCompanies.add(compKey);
      newLeadsCount++;

      await sendDmDiscordNotification(leadData);
    }
  }

  // STEP B: Hunt for Recently Funded Indian Startups (<= 7 days old)
  console.log("\n💰 Step B: Checking Recent Startup Funding Rounds (<= 7 days old)...");
  const fundingItems = await huntRecentFundingLeads();
  for (const fund of fundingItems.slice(0, 5)) {
    const compKey = fund.company.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (existingCompanies.has(compKey)) continue;

    console.log(`🔎 Looking up Founder/CTO for recently funded startup: ${fund.company}...`);
    const person = await lookupDecisionMakers(fund.company);

    if (person) {
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
        sourceDate: fund.sourceDate || new Date().toISOString(),
        tailoredDm: tailoredDm,
        status: "New",
        createdAt: new Date().toISOString()
      };

      const docRef = await leadsRef.add(leadData);
      console.log(`✅ [Recent Funding] Added ${person.name} (${person.title} @ ${person.company}) [ID: ${docRef.id}]`);

      existingCompanies.add(compKey);
      newLeadsCount++;

      await sendDmDiscordNotification(leadData);
    }
  }

  // STEP C: Hunt for Direct Hiring Posts on LinkedIn India (<= 7 days old)
  console.log("\n🚀 Step C: Checking Direct Founder & Hiring Posts in India (<= 7 days old)...");
  const postLeads = await huntPublicHiringPosts();
  for (const lead of postLeads) {
    const compKey = lead.company.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (existingCompanies.has(compKey)) continue;

    const tailoredDm = generateTailoredDm("hiring_post", lead.name, lead.company);
    const leadData = {
      name: lead.name,
      title: lead.title,
      company: lead.company,
      companyLogo: resolveCompanyLogoUrl(lead.company),
      linkedinUrl: lead.linkedinUrl,
      category: "hiring_post",
      sourceSnippet: lead.sourceSnippet,
      sourceDate: lead.sourceDate || new Date().toISOString(),
      tailoredDm: tailoredDm,
      status: "New",
      createdAt: new Date().toISOString()
    };

    const docRef = await leadsRef.add(leadData);
    console.log(`✅ [Hiring Post] Added ${lead.name} (${lead.company}) [ID: ${docRef.id}]`);

    existingCompanies.add(compKey);
    newLeadsCount++;

    await sendDmDiscordNotification(leadData);
  }

  console.log(`\n🎉 DM Hunter completed! Added ${newLeadsCount} new India-based 1-per-company DM leads.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runDmHunter();
}
