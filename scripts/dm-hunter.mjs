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

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

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

  return null;
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

// Exact LinkedIn Snowflake Post Timestamp Decoder
export function getLinkedinPostTimestamp(url = "") {
  const m = url.match(/activity-([0-9]{18,20})/);
  if (!m) return null;
  try {
    const id = BigInt(m[1]);
    const timestampMs = Number(id >> 22n);
    const date = new Date(timestampMs);
    if (isNaN(date.getTime()) || date.getFullYear() < 2020) return null;
    return date;
  } catch {
    return null;
  }
}

// 2. Tailored DM Generator for Startups, Hiring Posts & HR/Recruiters
export function generateTailoredDm(category, personName, companyName, extraContext = "") {
  const firstName = personName ? personName.split(" ")[0].trim() : "there";
  const company = companyName || "your team";

  switch (category) {
    case "hr_lead":
      return `Hi ${firstName}, saw your post regarding frontend engineering hiring at ${company}!\n\nI’m an IIT Roorkee graduate with 2 YOE at BYJU'S building 50+ interactive web applications for 2M+ learners, specializing in React, TypeScript, and high-performance UI architecture.\n\nPortfolio & Projects: https://vivek-kumar.dev\n\nI've attached my resume below for your review. Would love the opportunity to be considered for current or upcoming frontend roles!`;

    case "recent_funding":
      return `Hi ${firstName}, congratulations on the recent funding round for ${company}!\n\nAs you scale the product and engineering team, I wanted to reach out regarding frontend bandwidth. I’m an IIT Roorkee graduate with 2 YOE at BYJU'S shipping high-traffic web applications, specializing in React and TypeScript.\n\nPortfolio & live work: https://vivek-kumar.dev\n\nI’ve attached my resume for your review. Would love to connect if you have frontend needs!`;

    case "hiring_post":
    default:
      return `Hi ${firstName}, saw your post looking for a Frontend/React engineer for ${company}.\n\nI’m a Frontend Engineer from IIT Roorkee with 2 YOE at BYJU'S building 50+ interactive web applications for 2M+ learners. I specialize in React, TypeScript, and UI architecture.\n\nPortfolio & Projects: https://vivek-kumar.dev\n\nI’ve attached my resume below. If you're still reviewing candidates, I'd love to chat!`;
  }
}

// Multi-tier Logo Resolver
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

// 3. Lookup Founder, CTO, or HR Lead for a Startup
export async function lookupStartupLeader(companyName) {
  if (!companyName || !firecrawl) return null;
  const cleanCompany = companyName
    .replace(/\s*(?:in india|technologies|solutions|inc|pvt|ltd|interactive|software|tech|llc|gmbh).*$/i, "")
    .trim();

  // Specifically target India Founder, Co-Founder, CTO, or Talent/HR Lead
  const query = `(site:in.linkedin.com/in OR (site:linkedin.com/in "India")) "${cleanCompany}" ("Founder" OR "Co-Founder" OR "CTO" OR "HR" OR "Head of Talent" OR "Recruiter")`;
  
  try {
    const res = await firecrawl.search(query, { limit: 4 });
    const items = res.web || [];

    const candidates = [];

    for (const item of items) {
      if (!item.url || !item.url.includes("linkedin.com/in/")) continue;

      const cleanTitle = (item.title || "").replace(/\s*\|\s*LinkedIn.*$/i, "").trim();
      const parts = cleanTitle.split(/[-–—@|]/).map(p => p.trim());

      let name = parts[0] || "Hiring Lead";
      let role = parts.slice(1).join(" - ") || "Startup Leader";

      if (name.toLowerCase().includes("top") || name.toLowerCase().includes("jobs") || name.toLowerCase().includes("profile")) continue;

      // Filter for India connection
      if (!isIndiaBased(item.url, item.description, item.title)) {
        continue;
      }

      let score = 1;
      let category = "recent_funding";
      const lowerRole = role.toLowerCase();
      if (lowerRole.includes("founder") || lowerRole.includes("ceo") || lowerRole.includes("cto")) {
        score = 3;
        category = "recent_funding";
      } else if (lowerRole.includes("hr") || lowerRole.includes("talent") || lowerRole.includes("recruiter") || lowerRole.includes("people")) {
        score = 2;
        category = "hr_lead";
      }

      candidates.push({
        name,
        title: role,
        company: cleanCompany,
        linkedinUrl: item.url,
        category,
        snippet: item.description || `Hiring Leader at ${cleanCompany}`,
        score
      });
    }

    if (candidates.length === 0) return null;

    // Pick highest ranked contact
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  } catch (err) {
    console.warn(`Startup lead lookup warning for ${companyName}:`, err.message);
    return null;
  }
}

// 4. Hunt Recent Startup Funding (Strictly <= 3 days old)
export async function huntRecentFundingLeads() {
  const fundingLeads = [];
  const feeds = [
    "https://inc42.com/feed/",
    "https://techcrunch.com/category/startups/feed/"
  ];

  const now = new Date();

  for (const feedUrl of feeds) {
    try {
      const res = await fetch(feedUrl, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;
      const xml = await res.text();

      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
      for (const item of items.slice(0, 20)) {
        const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) || item.match(/<title>([\s\S]*?)<\/title>/i);
        const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/i);
        const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || item.match(/<description>([\s\S]*?)<\/description>/i);
        const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

        const title = titleMatch ? titleMatch[1].trim() : "";
        const link = linkMatch ? linkMatch[1].trim() : "";
        const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        const pubDateStr = dateMatch ? dateMatch[1].trim() : "";
        const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();

        // Strict 3-day recency filter
        if (now.getTime() - pubDate.getTime() > THREE_DAYS_MS) {
          continue;
        }

        if (/raises|secures|bags|closes|funding|seed|series a|series-a|million|cr/i.test(title)) {
          const compMatch = title.match(/^([A-Za-z0-9\s]+?)\s+(?:raises|secures|bags|closes|gets)/i);
          if (compMatch && compMatch[1].length < 30) {
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

// 5. Hunt Direct Founder & HR Hiring Posts on LinkedIn India (Strictly <= 3 days old)
export async function huntPublicHiringPosts() {
  if (!firecrawl) return [];
  const now = new Date();

  const queries = [
    `site:in.linkedin.com/posts ("hiring" OR "looking for") ("frontend" OR "react") ("1d" OR "2d" OR "3d" OR "hours ago" OR "yesterday") ("DM me" OR "email" OR "send resume")`,
    `site:in.linkedin.com/posts ("we are hiring" OR "I am hiring") ("frontend" OR "react developer") ("founder" OR "HR" OR "recruiter") ("1d" OR "2d" OR "3d" OR "hours ago")`
  ];
  
  const postLeads = [];

  for (const query of queries) {
    try {
      const res = await firecrawl.search(query, { limit: 6 });
      const items = res.web || [];

      for (const item of items) {
        if (!item.url || !item.url.includes("linkedin.com/posts/")) continue;

        // 1. Verify exact post creation timestamp via LinkedIn Snowflake ID
        const postTimestamp = getLinkedinPostTimestamp(item.url);
        if (!postTimestamp) continue;

        const ageMs = now.getTime() - postTimestamp.getTime();
        // Discard if older than 3 days or in future
        if (ageMs > THREE_DAYS_MS || ageMs < 0) {
          continue;
        }

        const cleanTitle = (item.title || "").replace(/\s*\|\s*LinkedIn.*$/i, "").trim();
        const parts = cleanTitle.split(/[-–—|]/).map(p => p.trim());
        const name = parts[0] || "Hiring Lead";
        const snippet = item.description || cleanTitle;

        // Discard closed/complete hiring posts
        if (/hiring is (complete|closed|over)|position (is )?filled|no longer accepting|sorry we can't reach/i.test(snippet)) {
          continue;
        }

        if (!isIndiaBased(item.url, snippet, cleanTitle)) continue;

        const compMatch = cleanTitle.match(/(?:at|@)\s+([A-Za-z0-9\s]+)/i);
        const company = compMatch ? compMatch[1].trim() : "Tech Startup";

        // Determine if HR or Founder
        const lowerSnippet = snippet.toLowerCase();
        let category = "hiring_post";
        let title = "Founder / Hiring Manager";

        if (lowerSnippet.includes("hr") || lowerSnippet.includes("talent") || lowerSnippet.includes("recruiter") || lowerSnippet.includes("people team")) {
          category = "hr_lead";
          title = "HR / Technical Recruiter";
        } else if (lowerSnippet.includes("founder") || lowerSnippet.includes("co-founder") || lowerSnippet.includes("cto")) {
          title = "Founder / Co-Founder";
        }

        postLeads.push({
          name: name,
          title: title,
          company: company,
          linkedinUrl: item.url,
          category: category,
          sourceSnippet: snippet.slice(0, 220),
          sourceUrl: item.url,
          sourceDate: postTimestamp.toISOString()
        });
      }
    } catch {}
  }

  return postLeads;
}

// 6. Discord Notification
export async function sendDmDiscordNotification(lead) {
  if (!DISCORD_DM_WEBHOOK_URL) return;

  const categoryLabels = {
    hiring_post: "🟣 🚀 Founder Hiring Post (< 3d old)",
    recent_funding: "🟢 💰 Startup Funding Round (< 3d old)",
    hr_lead: "👥 📢 HR / Recruiter Post (< 3d old)",
    engineering_lead: "🟠 ⚡ Tech Lead"
  };

  const categoryColors = {
    hiring_post: 0x9333ea,
    recent_funding: 0x10b981,
    hr_lead: 0x3b82f6,
    engineering_lead: 0xf59e0b
  };

  const payload = {
    embeds: [
      {
        title: `🎯 High-Signal Outreach Lead: ${lead.name}`,
        description: `**${lead.title}** at **${lead.company}** (India 🇮🇳)\n\n💬 **Discovery Signal:**\n> _${lead.sourceSnippet || "Direct hiring post or startup funding"}_`,
        color: categoryColors[lead.category] || 0x10b981,
        fields: [
          {
            name: "🏷️ Category",
            value: categoryLabels[lead.category] || "Startup Hiring",
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

// 7. Main Runner (Strictly Small Startups & Posts <= 3 Days Old)
export async function runDmHunter() {
  console.log("🔍 Scanning for Funded Startups, Founder Hiring Posts & HR Contacts in India (strictly <= 3 days old)...\n");

  const leadsRef = db.collection("users").doc(DEFAULT_USER_ID).collection("dm_leads");
  const existingSnapshot = await leadsRef.get();
  
  const now = new Date();
  const companyMap = new Map();
  const docsToDelete = [];

  existingSnapshot.docs.forEach(doc => {
    const data = doc.data();
    
    // 1. Remove obsolete queued_job category
    if (data.category === "queued_job") {
      docsToDelete.push(doc.id);
      return;
    }

    // 2. Remove leads whose sourceDate is older than 3 days or missing
    if (data.sourceDate) {
      const srcDate = new Date(data.sourceDate);
      if (!isNaN(srcDate.getTime()) && (now.getTime() - srcDate.getTime() > THREE_DAYS_MS)) {
        docsToDelete.push(doc.id);
        return;
      }
    } else if (data.createdAt) {
      const createDate = new Date(data.createdAt);
      if (!isNaN(createDate.getTime()) && (now.getTime() - createDate.getTime() > THREE_DAYS_MS)) {
        docsToDelete.push(doc.id);
        return;
      }
    }

    // 3. Remove known closed/old posts
    if (data.name === "Shrey Batra" || (data.sourceSnippet && /hiring is (complete|closed)/i.test(data.sourceSnippet))) {
      docsToDelete.push(doc.id);
      return;
    }

    const compKey = (data.company || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!compKey) {
      docsToDelete.push(doc.id);
      return;
    }

    if (companyMap.has(compKey)) {
      docsToDelete.push(doc.id); // keep only 1 per company
    } else {
      companyMap.set(compKey, doc.id);
    }
  });

  if (docsToDelete.length > 0) {
    console.log(`🧹 Pruning ${docsToDelete.length} obsolete, >3 days old, or closed leads...`);
    for (const docId of docsToDelete) {
      await leadsRef.doc(docId).delete();
    }
  }

  const existingCompanies = new Set(companyMap.keys());
  let newLeadsCount = 0;

  // STEP 1: Hunt for Recently Funded Indian Startups (strictly <= 3 days old)
  console.log("💰 Step 1: Checking Recent Startup Funding Rounds in India (<= 3 days old)...");
  const fundingItems = await huntRecentFundingLeads();
  for (const fund of fundingItems.slice(0, 6)) {
    const compKey = fund.company.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (existingCompanies.has(compKey)) continue;

    console.log(`🔎 Looking up Founder/CTO/HR for recently funded startup: ${fund.company}...`);
    const person = await lookupStartupLeader(fund.company);

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
      console.log(`✅ [Startup Funding] Added ${person.name} (${person.title} @ ${person.company}) [ID: ${docRef.id}]`);

      existingCompanies.add(compKey);
      newLeadsCount++;

      await sendDmDiscordNotification(leadData);
    }
  }

  // STEP 2: Hunt for Direct Founder & HR Hiring Posts on LinkedIn India (strictly <= 3 days old)
  console.log("\n🚀 Step 2: Checking Direct Founder & HR Hiring Posts in India (<= 3 days old)...");
  const postLeads = await huntPublicHiringPosts();
  for (const lead of postLeads) {
    const compKey = lead.company.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (existingCompanies.has(compKey)) continue;

    const tailoredDm = generateTailoredDm(lead.category, lead.name, lead.company);
    const leadData = {
      name: lead.name,
      title: lead.title,
      company: lead.company,
      companyLogo: resolveCompanyLogoUrl(lead.company),
      linkedinUrl: lead.linkedinUrl,
      category: lead.category,
      sourceSnippet: lead.sourceSnippet,
      sourceUrl: lead.sourceUrl || lead.linkedinUrl,
      sourceDate: lead.sourceDate || new Date().toISOString(),
      tailoredDm: tailoredDm,
      status: "New",
      createdAt: new Date().toISOString()
    };

    const docRef = await leadsRef.add(leadData);
    console.log(`✅ [${lead.category}] Added ${lead.name} (${lead.title} @ ${lead.company}) [ID: ${docRef.id}]`);

    existingCompanies.add(compKey);
    newLeadsCount++;

    await sendDmDiscordNotification(leadData);
  }

  console.log(`\n🎉 DM Hunter completed! Added ${newLeadsCount} new startup & hiring leads (strictly <= 3 days old).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runDmHunter();
}
