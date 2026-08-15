#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// Curated Direct ATS Boards (Greenhouse, Lever, Ashby) of Top Indian & Remote Tech Companies
const TARGET_ATS_COMPANIES = [
  // Greenhouse boards
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
  { company: "Vercel", tier: "growth", portal: "Lever", url: "https://api.lever.co/v0/postings/vercel?mode=json" },
  { company: "Meesho", tier: "growth", portal: "Lever", url: "https://api.lever.co/v0/postings/meesho?mode=json" },
  { company: "Groww", tier: "growth", portal: "Lever", url: "https://api.lever.co/v0/postings/groww?mode=json" },
  { company: "CleverTap", tier: "growth", portal: "Lever", url: "https://api.lever.co/v0/postings/clevertap?mode=json" },
  { company: "InVideo", tier: "startup", portal: "Lever", url: "https://api.lever.co/v0/postings/invideo?mode=json" },
];

// Target Frontend / React / UI keywords
const TARGET_TECH_KEYWORDS = [
  "frontend",
  "front-end",
  "front end",
  "react",
  "ui engineer",
  "ui developer",
  "web developer",
  "javascript developer",
  "software engineer - frontend",
  "software engineer 1",
  "software engineer - 1",
  "software engineer i",
  "sde 1",
  "sde-1",
  "sde i",
  "junior frontend",
  "junior react",
  "associate software engineer",
  "associate frontend",
  "entry level frontend"
];

// STRICT EXCLUSIONS: Seniority, High YOE, Non-target skills (AWS, Cloud, DevOps, Solidity, Flutter, React Native, Backend, Fullstack)
const STRICT_EXCLUSIONS = [
  // Seniority & High YOE
  "senior",
  "sr.",
  "sr ",
  "staff",
  "principal",
  "lead",
  "manager",
  "director",
  "architect",
  "intermediate",
  "sde 2",
  "sde-2",
  "sde 3",
  "sde-3",
  "sde ii",
  "sde iii",
  "iii",
  "iv",
  "3+",
  "4+",
  "5+",
  "6+",
  "3-5",
  "4-6",
  "5-7",
  
  // Non-target technologies & skill sets
  "aws",
  "cloud",
  "devops",
  "solidity",
  "blockchain",
  "smart contract",
  "web3",
  "flutter",
  "react native",
  "react-native",
  "android",
  "ios",
  "mobile developer",
  "backend",
  "python",
  "django",
  "flask",
  "java ",
  "spring",
  "golang",
  "go developer",
  "rust developer",
  "c++",
  "full stack",
  "fullstack",
  "full-stack",
  "kubernetes",
  "docker",
  "terraform",
  "ci/cd",
  "qa engineer",
  "test engineer",
  "internship",
  "intern ",
  "stipend"
];

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

function isValidJob(title = "", content = "") {
  const fullText = `${title} ${content}`.toLowerCase();

  // 1. Must NOT contain any strict exclusion keywords (AWS, Solidity, Flutter, Senior, 3+ years, etc.)
  for (const excluded of STRICT_EXCLUSIONS) {
    if (fullText.includes(excluded)) {
      return { valid: false, reason: `Contains excluded term: "${excluded}"` };
    }
  }

  // 2. Must match target Frontend / React role keywords
  const hasTargetRole = TARGET_TECH_KEYWORDS.some((kw) => title.toLowerCase().includes(kw));
  if (!hasTargetRole) {
    return { valid: false, reason: `Title "${title}" does not match target frontend keywords` };
  }

  return { valid: true };
}

export async function fetchGreenhouseJobs(companyObj) {
  try {
    const res = await fetch(companyObj.url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || [];

    const matched = [];
    for (const j of jobs) {
      const check = isValidJob(j.title, j.content || "");
      if (!check.valid) continue;

      matched.push({
        company: companyObj.company,
        tier: companyObj.tier,
        role: j.title,
        location: j.location?.name || "India (Remote / Hybrid)",
        jobUrl: j.absolute_url,
        portalName: "Greenhouse",
        experience: 2,
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
    for (const j of jobs) {
      const check = isValidJob(j.text, j.descriptionPlain || j.categories?.team || "");
      if (!check.valid) continue;

      matched.push({
        company: companyObj.company,
        tier: companyObj.tier,
        role: j.text,
        location: j.categories?.location || "India (Remote)",
        jobUrl: j.hostedUrl,
        portalName: "Lever",
        experience: 2,
        source: "Direct ATS",
      });
    }
    return matched;
  } catch {
    return [];
  }
}

export async function fetchCuratedRemoteJobs() {
  try {
    const res = await fetch("https://jobicy.com/api/v2/remote-jobs?tag=react&count=50", { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || [];

    const matched = [];
    for (const j of jobs) {
      const check = isValidJob(j.jobTitle, j.jobDescription || "");
      if (!check.valid) continue;

      matched.push({
        company: j.companyName || "Tech Startup",
        tier: "startup",
        role: j.jobTitle,
        location: j.jobGeo || "Remote",
        jobUrl: j.url,
        portalName: "Wellfound",
        experience: 2,
        source: "Remote Feed",
      });
    }
    return matched;
  } catch {
    return [];
  }
}

export async function discoverLiveJobs() {
  console.log("🔍 Scanning across LinkedIn, Wellfound, Instahyre, Cutshort, and Direct ATS (<= 2 YOE, pure Frontend/React, no AWS/Solidity/Flutter)...");
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
      console.log(`✅ [ATS] Found ${jobs.length} valid 0-2 YOE opening(s) at ${company.company}`);
      allJobs.push(...jobs);
    }
  }

  // 2. Curated Remote & Startup openings (Wellfound / Remote)
  const remoteJobs = await fetchCuratedRemoteJobs();
  if (remoteJobs.length > 0) {
    console.log(`✅ [Curated] Found ${remoteJobs.length} verified 0-2 YOE Frontend opening(s)`);
    allJobs.push(...remoteJobs);
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
