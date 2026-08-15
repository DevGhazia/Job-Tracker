#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
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

const TECH_KEYWORDS = [
  "frontend",
  "front-end",
  "front end",
  "react",
  "ui engineer",
  "ui developer",
  "web developer",
  "software engineer - frontend",
  "sde-1 frontend",
  "sde-2 frontend"
];

const EXCLUDED_KEYWORDS = [
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
  if (companyTier === "startup") return strategies.startup || "15 - 18 LPA";
  if (companyTier === "growth") return strategies.growthTech || "18 - 22 LPA";
  if (companyTier === "enterprise") return strategies.enterpriseTech || "20 - 25 LPA";
  return strategies.default || "15 - 25 LPA";
}

export async function fetchGreenhouseJobs(companyObj) {
  try {
    const res = await fetch(companyObj.url);
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs || [];

    const matched = [];
    for (const j of jobs) {
      const title = j.title.toLowerCase();
      const location = (j.location?.name || "").toLowerCase();

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
          experience: title.includes("senior") || title.includes("lead") ? 4 : (title.includes("2") || title.includes("ii") ? 2 : 1),
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
    const res = await fetch(companyObj.url);
    if (!res.ok) return [];
    const jobs = await res.json();
    if (!Array.isArray(jobs)) return [];

    const matched = [];
    for (const j of jobs) {
      const title = (j.text || "").toLowerCase();
      const location = (j.categories?.location || "").toLowerCase();

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
          experience: title.includes("senior") || title.includes("lead") ? 4 : 2,
          source: "Direct ATS",
        });
      }
    }
    return matched;
  } catch {
    return [];
  }
}

export async function discoverLiveJobs() {
  console.log("🔍 Scanning top Indian tech & Remote ATS job boards for Frontend / React / UI Engineer roles...");
  const allJobs = [];

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

  return allJobs;
}

// Generate an authentic AI tailored pitch note
export function generateTailoredPitch(job, profile) {
  const skills = profile.skills?.core?.slice(0, 4).join(", ") || "React, TypeScript, Redux, Tailwind CSS";
  const salary = getDynamicSalary(job.tier, profile);

  return `Hi ${job.company} Hiring Team!

I'm Vivek, a Frontend Engineer with 2+ years of production experience building high-performance web applications using ${skills}. At BYJU'S, I engineered interactive UI systems with real-time state management and optimized rendering logic for 50+ web apps. Recently, I've been building scalable e-commerce and AI-powered conversational web interfaces.

I'm very excited about ${job.company}'s mission and would love to bring my frontend expertise and IIT Roorkee engineering foundation to the ${job.role} team.

Looking forward to connecting!
Portfolio: ${profile.personal?.portfolio || "https://vivek-kumar.dev"} | LinkedIn: ${profile.personal?.linkedin}
Target CTC: ${salary} (Immediate joiner, <= 15 days)`;
}

// CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const profile = JSON.parse(readFileSync(resolve(rootDir, "candidate_profile.json"), "utf-8"));
  const jobs = await discoverLiveJobs();
  console.log(`\n🎯 Total Target Roles Discovered: ${jobs.length}\n`);
  
  jobs.slice(0, 10).forEach((j, i) => {
    console.log(`${i + 1}. [${j.company}] ${j.role} (${j.tier || "tech"})`);
    console.log(`   📍 ${j.location} | Portal: ${j.portalName}`);
    console.log(`   🔗 ${j.jobUrl}\n`);
  });
}
