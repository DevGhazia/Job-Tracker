#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// Curated Direct ATS Boards (Greenhouse, Lever, Ashby)
const TARGET_ATS_COMPANIES = [
  { company: "Razorpay", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/razorpaysoftwareprivatelimited/jobs" },
  { company: "CRED", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/cred/jobs" },
  { company: "Postman", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/postman/jobs" },
  { company: "BrowserStack", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/browserstack/jobs" },
  { company: "Zepto", tier: "startup", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/zepto/jobs" },
  { company: "Hasura", tier: "startup", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/hasura/jobs" },
  { company: "Swiggy", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/swiggy/jobs" },
  { company: "Urban Company", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/urbancompany/jobs" },
  { company: "Supabase", tier: "startup", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/supabase/jobs" },
  { company: "Sentry", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/sentry/jobs" },
  { company: "GitLab", tier: "enterprise", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/gitlab/jobs" },
  { company: "Figma", tier: "enterprise", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/figma/jobs" },
  { company: "Stripe", tier: "enterprise", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/stripe/jobs" },
  { company: "Meesho", tier: "growth", portal: "Lever", url: "https://api.lever.co/v0/postings/meesho?mode=json" },
  { company: "Groww", tier: "growth", portal: "Lever", url: "https://api.lever.co/v0/postings/groww?mode=json" },
  { company: "CleverTap", tier: "growth", portal: "Lever", url: "https://api.lever.co/v0/postings/clevertap?mode=json" },
  { company: "InVideo", tier: "startup", portal: "Lever", url: "https://api.lever.co/v0/postings/invideo?mode=json" },
];

const TARGET_TECH_KEYWORDS = [
  "frontend", "front-end", "front end", "react", "ui engineer", "ui developer",
  "web developer", "javascript developer", "software engineer - frontend",
  "software engineer 1", "software engineer - 1", "software engineer i",
  "sde 1", "sde-1", "sde i", "junior frontend", "junior react",
  "associate software engineer", "associate frontend", "entry level frontend"
];

// STRICT EXCLUSIONS: Seniority, High YOE, AWS/Cloud/DevOps/Solidity/Flutter/Backend
const STRICT_EXCLUSIONS = [
  "senior", "sr.", "sr ", "staff", "principal", "lead", "manager", "director", "architect",
  "sde 2", "sde-2", "sde 3", "sde-3", "sde ii", "sde iii",
  "3+", "4+", "5+", "6+", "7+", "8+", "3-5", "4-6", "5-7", "3 to 5", "4 to 6",
  "aws", "cloud", "devops", "solidity", "blockchain", "smart contract", "web3",
  "flutter", "react native", "react-native", "android", "ios", "mobile developer",
  "backend", "python", "django", "flask", "java ", "spring", "golang", "go developer",
  "kubernetes", "docker", "terraform", "ci/cd", "full stack", "fullstack", "full-stack",
  "stipend"
];

import FirecrawlApp from "@mendable/firecrawl-js";

function getFirecrawlApiKey() {
  if (process.env.FIRECRAWL_API_KEY) return process.env.FIRECRAWL_API_KEY;
  if (process.env.VITE_FIRECRAWL_API_KEY) return process.env.VITE_FIRECRAWL_API_KEY;
  try {
    const envFile = readFileSync(resolve(rootDir, ".env"), "utf-8");
    const m = envFile.match(/FIRECRAWL_API_KEY\s*[:=]\s*([^\r\n]+)/);
    if (m) return m[1].trim();
  } catch {}
  return null;
}

const FIRECRAWL_KEY = getFirecrawlApiKey();
let firecrawlClient = null;
if (FIRECRAWL_KEY) {
  try {
    firecrawlClient = new FirecrawlApp({ apiKey: FIRECRAWL_KEY });
  } catch (e) {
    console.warn("Could not initialize Firecrawl:", e.message);
  }
}

export async function extractDetailsWithFirecrawl(jobUrl) {
  if (!firecrawlClient) return null;
  try {
    const scrape = await firecrawlClient.scrapeUrl(jobUrl, {
      formats: ["extract"],
      extract: {
        schema: {
          type: "object",
          properties: {
            yearsOfExperienceRequired: { type: "number", description: "Required years of experience" },
            isSuitableFor0To2YOE: { type: "boolean", description: "True if role is suitable for 0-2 years experience" },
            requiresAWS: { type: "boolean", description: "True if strictly requires AWS or DevOps" },
            requiresSolidity: { type: "boolean", description: "True if requires Solidity or Blockchain" },
            requiresFlutter: { type: "boolean", description: "True if requires Flutter" },
            requiresBackend: { type: "boolean", description: "True if primarily a backend or fullstack role" }
          },
          required: ["yearsOfExperienceRequired", "isSuitableFor0To2YOE"]
        }
      }
    });
    if (scrape.success && scrape.extract) {
      return scrape.extract;
    }
  } catch (err) {
    // Fallback to direct parsing silently
  }
  return null;
}

export function getDynamicSalary(companyTier, profile) {
  const strategies = profile?.preferences?.salaryStrategy || {};
  switch (companyTier) {
    case "startup":
      return strategies.startup_early_stage || "15 - 18 LPA";
    case "growth":
      return strategies.growth_unicorn || "18 - 22 LPA";
    case "enterprise":
      return strategies.enterprise_faang || "20 - 25 LPA";
    case "remote_us":
      return strategies.remote_international || "$35,000 - $60,000 USD";
    default:
      return "16 - 20 LPA";
  }
}

function extractExperience(text = "") {
  // Reject high experience
  const highExpRegex = /(?:3\+|4\+|5\+|6\+|7\+|8\+|3\s*-\s*5|4\s*-\s*6|5\s*-\s*7|3\s*to\s*5|4\s*to\s*6)\s*(?:years?|yrs?|yoe)/i;
  if (highExpRegex.test(text)) {
    return { valid: false, exp: 3, reason: "Requires > 2 years experience" };
  }

  // Valid 0-2 YOE patterns
  const validExpRegex = /(?:0\s*-\s*1|0\s*-\s*2|1\s*-\s*2|0\s*to\s*2|1\s*to\s*2|1\+|2\+|1\s*years?|2\s*years?|fresher|entry[\s-]level|junior)\s*(?:of)?\s*(?:years?|yrs?|yoe|experience)?/i;
  const match = text.match(validExpRegex);
  if (match) {
    if (match[0].includes("0") || match[0].includes("1") || match[0].includes("fresher") || match[0].includes("junior")) {
      return { valid: true, exp: 1 };
    }
    return { valid: true, exp: 2 };
  }

  return { valid: true, exp: 2 };
}

function isValidTitle(title = "") {
  const t = title.toLowerCase();
  for (const ex of STRICT_EXCLUSIONS) {
    if (t.includes(ex)) return false;
  }
  return TARGET_TECH_KEYWORDS.some(kw => t.includes(kw));
}

// Live LinkedIn Search - Card by card isolation, posted in last 3 days (f_TPR=r259200), deep JD verification
export async function fetchLinkedInJobs() {
  const queries = [
    { q: "frontend developer", loc: "India" },
    { q: "react developer", loc: "India" },
    { q: "ui developer", loc: "India" }
  ];
  const acceptedJobs = [];
  const seenUrls = new Set();

  for (const { q, loc } of queries) {
    try {
      // f_TPR=r259200 ensures posted <= 3 days ago, f_E=1,2 filters for entry/associate level
      const searchUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}&f_TPR=r259200&f_E=1%2C2`;
      const res = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) continue;
      const html = await res.text();
      const rawCards = html.split("<li");

      for (let i = 1; i < rawCards.length; i++) {
        const card = rawCards[i];
        const titleMatch = card.match(/<h3 class="base-search-card__title">([\s\S]*?)<\/h3>/);
        const compMatch = card.match(/<h4 class="base-search-card__subtitle">([\s\S]*?)<\/h4>/);
        const locMatch = card.match(/<span class="job-search-card__location">([\s\S]*?)<\/span>/);
        const linkMatch = card.match(/<a class="base-card__full-link[^"]*" href="([^"]+)"/);
        const logoMatch = card.match(/<img class="artdeco-entity-image[^"]*" [^>]*data-delayed-url="([^"]+)"/);

        if (!titleMatch || !compMatch || !linkMatch) continue;

        const title = titleMatch[1].trim();
        const company = compMatch[1].replace(/<[^>]+>/g, "").trim();
        const location = locMatch ? locMatch[1].trim() : "India";
        const jobUrl = linkMatch[1].split("?")[0];
        const logo = logoMatch ? logoMatch[1].replace(/&amp;/g, "&") : null;

        if (seenUrls.has(jobUrl)) continue;
        if (!isValidTitle(title)) continue;

        // 1. Try Firecrawl AI Schema Extraction for non-LinkedIn portals (Firecrawl restricts linkedin.com on public proxies)
        const firecrawlData = !jobUrl.includes("linkedin.com") ? await extractDetailsWithFirecrawl(jobUrl) : null;
        if (firecrawlData) {
          if (!firecrawlData.isSuitableFor0To2YOE || (firecrawlData.yearsOfExperienceRequired && firecrawlData.yearsOfExperienceRequired > 2)) {
            continue;
          }
          if (firecrawlData.requiresAWS || firecrawlData.requiresSolidity || firecrawlData.requiresFlutter || firecrawlData.requiresBackend) {
            continue;
          }
        }

        // 2. Fetch direct job description for full-text and experience validation
        let jobDesc = "";
        const jobIdMatch = jobUrl.match(/(\d+)(?:[^\d]|$)/);
        if (jobIdMatch) {
          try {
            const detailRes = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobIdMatch[1]}`, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              },
              signal: AbortSignal.timeout(5000)
            });
            if (detailRes.ok) {
              const detailHtml = await detailRes.text();
              const descMatch = detailHtml.match(/<div class="show-more-less-html__markup[^"]*">([\s\S]*?)<\/div>/);
              if (descMatch) {
                jobDesc = descMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
              }
            }
          } catch {
            // Ignore timeout
          }
        }

        const fullText = `${title} ${jobDesc}`.toLowerCase();

        // 3. Check strict exclusions in title and description
        const hasExcluded = STRICT_EXCLUSIONS.some(ex => fullText.includes(ex));
        if (hasExcluded) continue;

        // 4. Check experience requirement
        const expCheck = extractExperience(jobDesc);
        if (!expCheck.valid) continue;

        const assignedExp = (firecrawlData && firecrawlData.yearsOfExperienceRequired) ? Math.min(firecrawlData.yearsOfExperienceRequired, 2) : expCheck.exp;
        const clearoutLogo = await fetchClearoutLogo(company);
        const finalLogo = clearoutLogo || logo || null;

        seenUrls.add(jobUrl);
        acceptedJobs.push({
          company,
          tier: "growth",
          role: title,
          location,
          jobUrl,
          logo: finalLogo,
          experience: assignedExp,
          portalName: "LinkedIn",
          source: "LinkedIn Jobs"
        });
      }
    } catch {
      // Continue next query
    }
  }

  return acceptedJobs;
}

export async function fetchClearoutLogo(companyName) {
  try {
    const res = await fetch(`https://api.clearout.io/public/companies/autocomplete?query=${encodeURIComponent(companyName)}`, {
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.length > 0 && data.data[0].logo_url) {
        return data.data[0].logo_url;
      }
    }
  } catch {}
  return null;
}

export async function fetchGreenhouseJobs(companyObj) {
  try {
    const res = await fetch(companyObj.url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || [];

    const matched = [];
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    const clearoutLogo = await fetchClearoutLogo(companyObj.company);

    for (const j of jobs) {
      if (j.updated_at && new Date(j.updated_at).getTime() < threeDaysAgo) {
        continue; // Discard postings older than 3 days
      }

      if (!isValidTitle(j.title)) continue;
      const fullText = `${j.title} ${j.content || ""}`.toLowerCase();
      if (STRICT_EXCLUSIONS.some(ex => fullText.includes(ex))) continue;

      const expCheck = extractExperience(j.content || "");
      if (!expCheck.valid) continue;

      matched.push({
        company: companyObj.company,
        tier: companyObj.tier,
        role: j.title,
        location: j.location?.name || "India (Remote / Hybrid)",
        jobUrl: j.absolute_url,
        logo: clearoutLogo || null,
        portalName: "Greenhouse",
        experience: expCheck.exp,
        source: "Direct ATS",
      });
    }
    return matched;
  } catch {
    return [];
  }
}

export async function fetchLeverJobs(companyObj) {
  try {
    const res = await fetch(companyObj.url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const jobs = await res.json();
    if (!Array.isArray(jobs)) return [];

    const matched = [];
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    const clearoutLogo = await fetchClearoutLogo(companyObj.company);

    for (const j of jobs) {
      if (j.createdAt && j.createdAt < threeDaysAgo) {
        continue; // Discard postings older than 3 days
      }

      if (!isValidTitle(j.text)) continue;
      const fullText = `${j.text} ${j.descriptionPlain || ""}`.toLowerCase();
      if (STRICT_EXCLUSIONS.some(ex => fullText.includes(ex))) continue;

      const expCheck = extractExperience(j.descriptionPlain || "");
      if (!expCheck.valid) continue;

      matched.push({
        company: companyObj.company,
        tier: companyObj.tier,
        role: j.text,
        location: j.categories?.location || "India (Remote)",
        jobUrl: j.hostedUrl,
        logo: clearoutLogo || null,
        portalName: "Lever",
        experience: expCheck.exp,
        source: "Direct ATS",
      });
    }
    return matched;
  } catch {
    return [];
  }
}

export async function discoverLiveJobs() {
  console.log("🔍 Scanning across LinkedIn and Direct ATS (<= 2 YOE, pure Frontend/React, posted <= 3 days ago)...");
  const allJobs = [];

  // 1. Direct ATS (Greenhouse & Lever)
  for (const company of TARGET_ATS_COMPANIES) {
    let jobs = [];
    if (company.portal === "Greenhouse") {
      jobs = await fetchGreenhouseJobs(company);
    } else if (company.portal === "Lever") {
      jobs = await fetchLeverJobs(company);
    }
    if (jobs.length > 0) {
      console.log(`✅ [ATS] Found ${jobs.length} verified opening(s) at ${company.company}`);
      allJobs.push(...jobs);
    }
  }

  // 2. LinkedIn Live Search
  const linkedInJobs = await fetchLinkedInJobs();
  if (linkedInJobs.length > 0) {
    console.log(`✅ [LinkedIn] Found ${linkedInJobs.length} verified 0-2 YOE Frontend opening(s) (posted <= 3 days ago)`);
    allJobs.push(...linkedInJobs);
  }

  return allJobs;
}

// Generate an authentic AI tailored pitch note
export function generateTailoredPitch(job, profile) {
  const skills = profile?.skills?.core?.slice(0, 4).join(", ") || "React, TypeScript, Redux, Tailwind CSS";
  const salary = getDynamicSalary(job.tier, profile);

  return `Hi ${job.company} Hiring Team!

I'm Vivek, a Frontend Engineer with 2 years of production experience at BYJU'S building high-performance web applications using ${skills}. At BYJU'S, I engineered interactive UI systems with real-time state management and optimized rendering logic for 50+ web apps.

I'm very excited about ${job.company}'s mission and would love to bring my frontend expertise and IIT Roorkee engineering foundation to the ${job.role} team.

Looking forward to connecting!
Portfolio: ${profile?.personal?.portfolio || "https://vivek-kumar.dev"} | LinkedIn: ${profile?.personal?.linkedin}
Target CTC: ${salary} (Immediate joiner, <= 15 days)`;
}
