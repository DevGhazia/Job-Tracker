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

// TITLE EXCLUSIONS: Seniority, High YOE, purely non-frontend titles
const TITLE_EXCLUSIONS = [
  "senior", "sr.", "sr ", "staff", "principal", "lead", "manager", "director", "architect",
  "sde 2", "sde-2", "sde 3", "sde-3", "sde ii", "sde iii", "team lead", "head of",
  "3+", "4+", "5+", "6+", "7+", "8+", "3-5", "4-6", "5-7", "3 to 5", "4 to 6",
  "backend", "back-end", "back end", "python developer", "java developer", "golang", "go developer",
  "django developer", "flask developer", "spring boot", "solidity", "blockchain", "smart contract", "web3",
  "flutter", "react native", "react-native", "android", "ios", "mobile developer", "mobile engineer",
  "devops", "cloud engineer", "qa engineer", "qa automation", "test engineer", "data engineer", "data scientist", "machine learning",
  "stipend", "unpaid"
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
            isBackendStrictlyMandatory: { type: "boolean", description: "True if backend or DevOps is a strictly required core responsibility, False if only nice-to-have" },
            requiresFlutterOrMobile: { type: "boolean", description: "True if requires Flutter/iOS/Android mobile development" }
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

/**
 * Checks if backend/DevOps is a strict mandatory core requirement.
 * If backend/AWS/Docker is only in "Nice to have" or mentioned in passing, returns false (allowed).
 */
export function isStrictlyBackendOnly(text = "") {
  if (!text) return false;
  const lower = text.toLowerCase();

  // If the job explicitly states looking for a backend/devops developer
  if (/looking for a (?:backend|server-side|devops|mobile)\s+(?:engineer|developer)/i.test(lower)) {
    return true;
  }

  // Split into required vs nice-to-have sections if present
  const niceToHaveIdx = lower.search(/(?:nice to have|good to have|bonus|preferred|optional|plus points|not required|pluses)/i);
  const requiredText = niceToHaveIdx !== -1 ? lower.slice(0, niceToHaveIdx) : lower;

  // Check for mandatory backend requirements in the required section
  const mandatoryBackendRegex = /(?:must have|requirements|mandatory|required qualifications|essential)[\s\S]{0,250}(?:strong|deep|hands-on|proven|extensive)\s+(?:experience with|knowledge of)?\s*(?:backend|python|django|java|spring|golang|solidity|devops|kubernetes)/i;
  if (mandatoryBackendRegex.test(requiredText)) {
    return true;
  }

  return false;
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
  for (const ex of TITLE_EXCLUSIONS) {
    if (t.includes(ex)) return false;
  }
  return TARGET_TECH_KEYWORDS.some(kw => t.includes(kw));
}

export async function verifyLiveJobPage(url, portalName = "") {
  try {
    // 1. Naukri ID Date check
    if (portalName.toLowerCase().includes("naukri") || url.includes("naukri.com")) {
      const idMatch = url.match(/(\d{6,})/);
      if (idMatch) {
        const digits = idMatch[1];
        const dd = parseInt(digits.slice(0, 2), 10);
        const mm = parseInt(digits.slice(2, 4), 10);
        const yy = parseInt(digits.slice(4, 6), 10);
        if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
          const postYear = 2000 + yy;
          const now = new Date();
          const postDate = new Date(postYear, mm - 1, dd);
          const diffDays = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 3 || diffDays < -1) {
            return { valid: false, reason: `Naukri post is ${Math.round(diffDays)} days old` };
          }
        }
      }
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      signal: AbortSignal.timeout(6000),
      redirect: "follow"
    });

    if (!res.ok) {
      if (res.status === 403 || res.status === 429) {
        // Portal bot protection (e.g. Cloudflare on Naukri/Wellfound) -> retain as active
        return { valid: true, note: `Status ${res.status} bot-protection preserved` };
      }
      return { valid: false, reason: `HTTP status ${res.status}` };
    }

    const html = await res.text();
    const lower = html.toLowerCase();

    // Check for closed / expired indications
    const closedIndicators = [
      "no longer accepting applications",
      "job is closed",
      "job has expired",
      "this job is no longer available",
      "position has been filled",
      "this opening has been archived",
      "this job is inactive",
      "application is closed",
      "page not found",
      "404 not found",
      "job not found"
    ];

    for (const ind of closedIndicators) {
      if (lower.includes(ind)) {
        return { valid: false, reason: `Job marked as closed/expired ('${ind}')` };
      }
    }

    // Check for stale date keywords
    const staleDateIndicators = [
      "30+ days ago",
      "30+ d ago",
      "1 month ago",
      "2 months ago",
      "3 months ago",
      "4 months ago",
      "4 weeks ago",
      "3 weeks ago",
      "2 weeks ago",
      "15 days ago",
      "20 days ago"
    ];

    for (const ind of staleDateIndicators) {
      if (lower.includes(ind)) {
        return { valid: false, reason: `Stale post date ('${ind}')` };
      }
    }

    return { valid: true };
  } catch (err) {
    return { valid: true, note: `Network validation bypassed: ${err.message}` };
  }
}

// Live LinkedIn Search - Card by card isolation, posted in last 3 days (f_TPR=r259200), deep JD verification with fast fallback
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

        // 1. Fetch direct job description for full-text, recency and closed validation
        let jobDesc = "";
        let isClosed = false;
        let postedTimeAgo = "";
        let isFallback = false;

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
              const timeMatch = detailHtml.match(/class="posted-time-ago__text[^"]*">([\s\S]*?)<\/span>/i);
              if (timeMatch) {
                postedTimeAgo = timeMatch[1].trim().toLowerCase();
              }
              if (detailHtml.includes("no longer accepting applications") || detailHtml.includes("closed-job") || detailHtml.includes("is closed")) {
                isClosed = true;
              }
            } else {
              // Rate limited or anti-bot on cloud runner -> activate Fast Fallback
              isFallback = true;
            }
          } catch {
            isFallback = true;
          }
        } else {
          isFallback = true;
        }

        if (isClosed) {
          console.log(`⏩ Skipping closed LinkedIn job: ${title} at ${company}`);
          continue;
        }

        // Strict recency check: skip if older than 3 days
        if (postedTimeAgo) {
          const staleCheck = ["week", "month", "year", "4 day", "5 day", "6 day", "7 day", "8 day", "9 day", "10 day", "11 day", "12 day", "13 day", "14 day", "15 day", "20 day", "30 day"];
          if (staleCheck.some(s => postedTimeAgo.includes(s))) {
            console.log(`⏩ Skipping outdated LinkedIn job (${postedTimeAgo}): ${title} at ${company}`);
            continue;
          }
        }

        // Check if backend is strictly mandatory in the description
        if (jobDesc && isStrictlyBackendOnly(jobDesc)) {
          console.log(`⏩ Skipping backend-mandatory role: ${title} at ${company}`);
          continue;
        }

        let assignedExp = 1;
        if (jobDesc) {
          const expCheck = extractExperience(jobDesc);
          if (!expCheck.valid) {
            console.log(`⏩ Skipping high experience role: ${title} at ${company}`);
            continue;
          }
          assignedExp = expCheck.exp;
        }

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
          source: isFallback ? "LinkedIn Jobs (Fast Fallback)" : "LinkedIn Jobs",
          isFallback
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
      if (isStrictlyBackendOnly(j.content || "")) continue;

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
      if (isStrictlyBackendOnly(j.descriptionPlain || "")) continue;

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

export function extractCompanyAndRole(title, url, portalName = "") {
  let role = title;
  let company = "";

  // 1. Try URL parsing for standard ATS platforms (e.g. boards.greenhouse.io/<company>/jobs)
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.toLowerCase();
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

    if (host.includes("greenhouse.io") || host.includes("lever.co") || host.includes("ashbyhq.com") || host.includes("workable.com") || host.includes("smartrecruiters.com")) {
      if (pathParts.length > 0 && pathParts[0] !== "jobs" && pathParts[0] !== "job") {
        company = pathParts[0].replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      } else if (pathParts.length > 1) {
        company = pathParts[1].replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      }
    }
  } catch {}

  // 2. Parse title patterns like "Role at Company", "Role - Company", "Role | Company"
  if (title.includes(" at ")) {
    const parts = title.split(" at ");
    role = parts[0].trim();
    if (!company) company = parts[1].split(/[(\[\-|]/)[0].trim();
  } else if (title.includes(" - ")) {
    const parts = title.split(" - ");
    role = parts[0].trim();
    if (!company) company = parts[1].split(/[(\[\-|]/)[0].trim();
  } else if (title.includes(" | ")) {
    const parts = title.split(" | ");
    role = parts[0].trim();
    if (!company) company = parts[1].split(/[(\[\-|]/)[0].trim();
  }

  // Clean trailing board labels from role
  role = role.replace(/\s*[-|]\s*(?:Greenhouse|Lever|Ashby|Workable|SmartRecruiters|Naukri|Wellfound|Instahyre).*$/i, "").trim();
  if (!company) company = portalName.replace(/\s*(?:Direct|Jobs)/i, "") || "Tech Company";

  return { company, role };
}

export async function fetchMultiPortalJobs() {
  if (!firecrawlClient) return [];
  // Universal multi-company search across all major ATS platforms and job boards
  const portalSearches = [
    { portalName: "Greenhouse Direct", query: "site:boards.greenhouse.io (\"Frontend Developer\" OR \"React Developer\" OR \"UI Engineer\" OR \"Software Engineer Frontend\") (\"India\" OR \"Remote\")" },
    { portalName: "Lever Direct", query: "site:jobs.lever.co (\"Frontend Developer\" OR \"React Developer\" OR \"UI Engineer\") (\"India\" OR \"Remote\")" },
    { portalName: "Ashby Direct", query: "site:jobs.ashbyhq.com (\"Frontend Developer\" OR \"React Developer\" OR \"UI Engineer\") (\"India\" OR \"Remote\")" },
    { portalName: "Workable Direct", query: "site:apply.workable.com (\"Frontend Developer\" OR \"React Developer\") (\"India\" OR \"Remote\")" },
    { portalName: "SmartRecruiters Direct", query: "site:jobs.smartrecruiters.com (\"Frontend Developer\" OR \"React Developer\") (\"India\" OR \"Remote\")" },
    { portalName: "Y Combinator", query: "site:workatastartup.com/jobs (\"Frontend\" OR \"React\")" },
    { portalName: "Wellfound", query: "site:wellfound.com/jobs (\"Frontend Developer\" OR \"React Developer\")" },
    { portalName: "Instahyre", query: "site:instahyre.com/job (\"Frontend Developer\" OR \"React Developer\")" },
    { portalName: "Cutshort", query: "site:cutshort.io/job (\"Frontend Developer\" OR \"React Developer\")" },
    { portalName: "Naukri", query: "site:naukri.com/job-listings (\"Frontend Developer\" OR \"React Developer\")" }
  ];

  const results = [];
  const seen = new Set();

  for (const { portalName, query } of portalSearches) {
    try {
      const res = await firecrawlClient.search(query, { limit: 6 });
      const items = res?.web || res?.data || [];

      for (const item of items) {
        const rawTitle = item.title || "";
        const url = (item.url || "").split("?")[0];
        const desc = item.description || "";

        if (!url || seen.has(url)) continue;

        const { company, role } = extractCompanyAndRole(rawTitle, url, portalName);

        if (!isValidTitle(role)) continue;
        if (isStrictlyBackendOnly(desc)) continue;

        const expCheck = extractExperience(desc);
        if (!expCheck.valid) continue;

        // Live Page Verification
        const liveCheck = await verifyLiveJobPage(url, portalName);
        if (!liveCheck.valid) {
          console.log(`⏩ Skipping dead/outdated job (${liveCheck.reason}): ${role} at ${company}`);
          continue;
        }

        const clearoutLogo = await fetchClearoutLogo(company);

        seen.add(url);
        results.push({
          company,
          tier: portalName.includes("Y Combinator") || portalName.includes("Wellfound") ? "startup" : "growth",
          role,
          location: "India / Remote",
          jobUrl: url,
          logo: clearoutLogo || null,
          experience: expCheck.exp,
          portalName,
          source: `${portalName} Jobs`
        });
      }
    } catch {
      // Continue next portal search
    }
  }

  return results;
}

export async function discoverLiveJobs() {
  console.log("🔍 Scanning across ALL companies on LinkedIn, Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Y Combinator, Wellfound, Instahyre, Cutshort & Naukri (<= 2 YOE, pure Frontend/React, posted <= 3 days ago)...");
  const allJobs = [];

  // 1. Direct Curated ATS API endpoints (Fast Seed)
  for (const company of TARGET_ATS_COMPANIES) {
    let jobs = [];
    if (company.portal === "Greenhouse") {
      jobs = await fetchGreenhouseJobs(company);
    } else if (company.portal === "Lever") {
      jobs = await fetchLeverJobs(company);
    }
    if (jobs.length > 0) {
      console.log(`✅ [Curated ATS] Found ${jobs.length} verified opening(s) at ${company.company}`);
      allJobs.push(...jobs);
    }
  }

  // 2. LinkedIn Live Search (Any company)
  const linkedInJobs = await fetchLinkedInJobs();
  if (linkedInJobs.length > 0) {
    console.log(`✅ [LinkedIn] Found ${linkedInJobs.length} verified 0-2 YOE Frontend opening(s) across companies`);
    allJobs.push(...linkedInJobs);
  }

  // 3. Universal Multi-Portal & ATS Discovery (Any company across Greenhouse, Lever, Ashby, Workable, YC, Wellfound, Instahyre, Cutshort, Naukri)
  const portalJobs = await fetchMultiPortalJobs();
  if (portalJobs.length > 0) {
    console.log(`✅ [Universal Discovery] Found ${portalJobs.length} verified opening(s) across all platforms & companies`);
    allJobs.push(...portalJobs);
  }

  return allJobs;
}

// Generate an authentic AI tailored pitch note
export function generateTailoredPitch(job, profile) {
  const skills = profile?.skills?.core?.slice(0, 4).join(", ") || "React, TypeScript, Tailwind CSS";
  const salary = getDynamicSalary(job.tier, profile);

  return `Hi ${job.company} Team,

I'm Vivek (IIT Roorkee, 2 YOE at BYJU'S), specializing in ${skills} & high-performance UI systems. Excited about your work and would love to contribute to the ${job.role} role.

Portfolio: ${profile?.personal?.portfolio || "https://vivek-kumar.dev"} | LinkedIn: ${profile?.personal?.linkedin}
Notice: Immediate (<= 15d) | Target CTC: ${salary}`;
}
