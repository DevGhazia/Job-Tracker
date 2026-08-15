#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// Curated list of Indian tech unicorns, startups, and remote tech companies
const TARGET_COMPANIES = [
  // Greenhouse boards
  { company: "Razorpay", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/razorpaysoftwareprivatelimited/jobs" },
  { company: "CRED", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/cred/jobs" },
  { company: "Postman", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/postman/jobs" },
  { company: "BrowserStack", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/browserstack/jobs" },
  { company: "Zepto", tier: "startup", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/zepto/jobs" },
  { company: "Hasura", tier: "startup", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/hasura/jobs" },
  { company: "Swiggy", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/swiggy/jobs" },
  { company: "Urban Company", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/urbancompany/jobs" },
  { company: "PhysicsWallah", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/physicswallah/jobs" },
  { company: "Supabase", tier: "startup", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/supabase/jobs" },
  { company: "Sentry", tier: "growth", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/sentry/jobs" },
  { company: "Datadog", tier: "enterprise", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/datadog/jobs" },
  { company: "GitLab", tier: "enterprise", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/gitlab/jobs" },
  { company: "Docker", tier: "enterprise", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/docker/jobs" },
  { company: "Automattic", tier: "enterprise", portal: "Greenhouse", url: "https://boards-api.greenhouse.io/v1/boards/automattic/jobs" },
  
  // Lever boards
  { company: "Meesho", tier: "growth", portal: "Lever", url: "https://api.lever.co/v0/postings/meesho?mode=json" },
  { company: "Groww", tier: "growth", portal: "Lever", url: "https://api.lever.co/v0/postings/groww?mode=json" },
  { company: "CleverTap", tier: "growth", portal: "Lever", url: "https://api.lever.co/v0/postings/clevertap?mode=json" },
  { company: "InVideo", tier: "startup", portal: "Lever", url: "https://api.lever.co/v0/postings/invideo?mode=json" },
  { company: "Vercel", tier: "growth", portal: "Lever", url: "https://api.lever.co/v0/postings/vercel?mode=json" },
  { company: "Netlify", tier: "growth", portal: "Lever", url: "https://api.lever.co/v0/postings/netlify?mode=json" }
];

// Target roles for 0-2 years of experience
const TECH_KEYWORDS = [
  "frontend",
  "front-end",
  "front end",
  "react",
  "ui engineer",
  "ui developer",
  "web developer",
  "software engineer - frontend",
  "software engineer 1",
  "software engineer - 1",
  "software engineer i",
  "sde 1",
  "sde-1",
  "sde i",
  "junior",
  "associate software engineer",
  "associate frontend"
];

// Strict exclusions for Senior / Staff / Lead / Low-paying / Non-engineering roles
const EXCLUDED_KEYWORDS = [
  "senior",
  "sr.",
  "sr ",
  "staff",
  "principal",
  "lead",
  "manager",
  "director",
  "architect",
  "specialist",
  "intermediate",
  "iii",
  "iv",
  "sde 2",
  "sde-2",
  "sde 3",
  "sde-3",
  "sde ii",
  "sde iii",
  "internship",
  "intern ",
  "trainee",
  "stipend",
  "recruiting",
  "recruiter",
  "sales",
  "marketing",
  "talent",
  "operations",
  "human resources",
  "finance",
  "legal",
  "account executive",
  "customer success",
  "business development",
  "backend only",
  "python developer",
  "java developer",
  "golang developer"
];

export function getDynamicSalary(companyTier, profile) {
  const strategies = profile.preferences?.salaryStrategy || {};
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

export async function fetchGreenhouseJobs(companyObj) {
  try {
    const res = await fetch(companyObj.url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || [];

    const matched = [];
    for (const j of jobs) {
      const title = (j.title || "").toLowerCase();
      const location = (j.location?.name || "").toLowerCase();

      // Strict Senior/Staff Exclusion
      const isExcluded = EXCLUDED_KEYWORDS.some((k) => title.includes(k));
      if (isExcluded) continue;

      const isTech = TECH_KEYWORDS.some((k) => title.includes(k));
      const isTargetLocation =
        location.includes("india") ||
        location.includes("bangalore") ||
        location.includes("bengaluru") ||
        location.includes("remote") ||
        location.includes("delhi") ||
        location.includes("gurgaon") ||
        location.includes("noida") ||
        location.includes("hyderabad") ||
        location.includes("pune") ||
        location.includes("mumbai") ||
        location.includes("anywhere") ||
        location === "";

      if (isTech && isTargetLocation) {
        matched.push({
          company: companyObj.company,
          tier: companyObj.tier,
          role: j.title,
          location: j.location?.name || "India (Remote / Hybrid)",
          jobUrl: j.absolute_url,
          portalName: "Greenhouse",
          experience: 2, // Maximum 2 years target
          source: "Direct ATS",
        });
      }
    }
    return matched;
  } catch {
    return [];
  }
}

export async function fetchLeverJobs(companyObj) {
  try {
    const res = await fetch(companyObj.url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const jobs = await res.json();
    if (!Array.isArray(jobs)) return [];

    const matched = [];
    for (const j of jobs) {
      const title = (j.text || "").toLowerCase();
      const location = (j.categories?.location || "").toLowerCase();

      // Strict Senior/Staff Exclusion
      const isExcluded = EXCLUDED_KEYWORDS.some((k) => title.includes(k));
      if (isExcluded) continue;

      const isTech = TECH_KEYWORDS.some((k) => title.includes(k));
      const isTargetLocation =
        location.includes("india") ||
        location.includes("bangalore") ||
        location.includes("bengaluru") ||
        location.includes("remote") ||
        location.includes("delhi") ||
        location.includes("gurgaon") ||
        location.includes("noida") ||
        location.includes("hyderabad") ||
        location.includes("pune") ||
        location.includes("anywhere") ||
        location === "";

      if (isTech && isTargetLocation) {
        matched.push({
          company: companyObj.company,
          tier: companyObj.tier,
          role: j.text,
          location: j.categories?.location || "India",
          jobUrl: j.hostedUrl,
          portalName: "Lever",
          experience: 2,
          source: "Direct ATS",
        });
      }
    }
    return matched;
  } catch {
    return [];
  }
}

export async function fetchJobicyJobs() {
  try {
    const res = await fetch("https://jobicy.com/api/v2/remote-jobs?tag=frontend&count=50", { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || [];

    const matched = [];
    for (const j of jobs) {
      const title = (j.jobTitle || "").toLowerCase();
      const isExcluded = EXCLUDED_KEYWORDS.some((k) => title.includes(k));
      if (isExcluded) continue;

      const isTech = TECH_KEYWORDS.some((k) => title.includes(k));
      if (isTech) {
        matched.push({
          company: j.companyName || "Tech Company",
          tier: "growth",
          role: j.jobTitle,
          location: j.jobGeo || "Remote",
          jobUrl: j.url,
          portalName: "Jobicy",
          experience: 2,
          source: "Job Board",
        });
      }
    }
    return matched;
  } catch {
    return [];
  }
}

export async function discoverLiveJobs() {
  console.log("🔍 Scanning for Junior / SDE-1 / Frontend roles (<= 2 years experience)...");
  const allJobs = [];

  // 1. Direct ATS Greenhouse & Lever
  for (const company of TARGET_COMPANIES) {
    let jobs = [];
    if (company.portal === "Greenhouse") {
      jobs = await fetchGreenhouseJobs(company);
    } else if (company.portal === "Lever") {
      jobs = await fetchLeverJobs(company);
    }
    if (jobs.length > 0) {
      console.log(`✅ Found ${jobs.length} opening(s) at ${company.company}`);
      allJobs.push(...jobs);
    }
  }

  // 2. Curated Global / Remote Job Feeds (Jobicy)
  const jobicyJobs = await fetchJobicyJobs();
  if (jobicyJobs.length > 0) {
    console.log(`✅ Found ${jobicyJobs.length} opening(s) on Jobicy`);
    allJobs.push(...jobicyJobs);
  }

  return allJobs;
}

// Generate an authentic AI tailored pitch note
export function generateTailoredPitch(job, profile) {
  const skills = profile.skills?.core?.slice(0, 4).join(", ") || "React, TypeScript, Redux, Tailwind CSS";
  const salary = getDynamicSalary(job.tier, profile);

  return `Hi ${job.company} Hiring Team!

I'm Vivek, a Frontend Engineer with 2 years of production experience at BYJU'S building high-performance web applications using ${skills}. At BYJU'S, I engineered interactive UI systems with real-time state management and optimized rendering logic for 50+ web apps.

I'm very excited about ${job.company}'s mission and would love to bring my frontend expertise and IIT Roorkee engineering foundation to the ${job.role} team.

Looking forward to connecting!
Portfolio: ${profile.personal?.portfolio || "https://vivek-kumar.dev"} | LinkedIn: ${profile.personal?.linkedin}
Target CTC: ${salary} (Immediate joiner, <= 15 days)`;
}
