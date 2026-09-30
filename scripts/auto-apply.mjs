#!/usr/bin/env node
/**
 * auto-apply.mjs
 * Playwright-powered form filler for open ATS pages (Greenhouse, Lever, Ashby).
 * Only runs on jobs where autoApplyMode === "open_form".
 *
 * Usage:
 *   node scripts/auto-apply.mjs --url <atsFormUrl> [--company "Swiggy"] [--role "Frontend Engineer"] [--submit] [--dry-run]
 *
 * Flags:
 *   --submit    Actually clicks the submit button (default: fill only, you review first)
 *   --dry-run   Opens browser but fills nothing — just shows the form
 */

import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

const profile = JSON.parse(readFileSync(resolve(rootDir, "candidate_profile.json"), "utf-8"));

const args = process.argv.slice(2);
const urlArg = args[args.indexOf("--url") + 1] || null;
const companyArg = args[args.indexOf("--company") + 1] || "the company";
const roleArg = args[args.indexOf("--role") + 1] || "Frontend Engineer";
const shouldSubmit = args.includes("--submit");
const dryRun = args.includes("--dry-run");

if (!urlArg) {
  console.error("❌ Usage: node scripts/auto-apply.mjs --url <ats-form-url> [--company X] [--role Y] [--submit] [--dry-run]");
  process.exit(1);
}

// ─── Resume PDF path ───────────────────────────────────────────────────────
const RESUME_PATHS = [
  resolve(rootDir, "resume.pdf"),
  resolve(rootDir, "assets", "resume.pdf"),
  resolve(rootDir, "Vivek_Kumar_Resume.pdf"),
];
const resumePath = RESUME_PATHS.find((p) => existsSync(p)) || null;

// ─── Candidate field values ────────────────────────────────────────────────
const F = {
  firstName:  profile.personal.firstName,
  lastName:   profile.personal.lastName,
  fullName:   profile.personal.fullName,
  email:      profile.personal.email,
  phone:      profile.personal.phone,
  linkedin:   profile.personal.linkedin,
  github:     profile.personal.github,
  portfolio:  profile.personal.portfolio,
  location:   profile.personal.currentLocation,
};

function makePitch(company, role) {
  const skills = (profile.skills.core || []).slice(0, 4).join(", ");
  return `Hi ${company} Team,

I'm ${F.fullName} (IIT Roorkee, ${profile.preferences.yearsOfExperience} YOE), specializing in ${skills} and high-performance UI systems.

I'm excited about the ${role} opportunity and believe my background in production-grade React at BYJU'S (2M+ learners, 99.8% uptime) is a strong match.

Portfolio: ${F.portfolio}
LinkedIn:  ${F.linkedin}
Notice:    ${profile.preferences.noticePeriod}

${F.fullName}`;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
async function tryFill(page, selectors, value) {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 400 })) {
        await el.fill(String(value));
        console.log(`  ✅ ${sel.slice(0, 55).padEnd(55)} ← "${String(value).slice(0, 40)}"`);
        return true;
      }
    } catch {}
  }
  return false;
}

// ─── Platform strategies ───────────────────────────────────────────────────
async function fillGreenhouse(page, pitch) {
  await tryFill(page, ['input[name="job_application[first_name]"]', '#first_name', 'input[placeholder*="First" i]'], F.firstName);
  await tryFill(page, ['input[name="job_application[last_name]"]', '#last_name', 'input[placeholder*="Last" i]'], F.lastName);
  await tryFill(page, ['input[name="job_application[email]"]', '#email', 'input[type="email"]'], F.email);
  await tryFill(page, ['input[name="job_application[phone]"]', '#phone', 'input[type="tel"]'], F.phone);
  await tryFill(page, ['input[name="job_application[location]"]', '#location'], F.location);
  await tryFill(page, ['input[placeholder*="LinkedIn" i]', 'input[name*="linkedin" i]'], F.linkedin);
  await tryFill(page, ['input[placeholder*="Portfolio" i]', 'input[placeholder*="Website" i]', 'input[name*="portfolio" i]'], F.portfolio);
  await tryFill(page, ['textarea[name*="cover" i]', 'textarea[placeholder*="cover" i]', '#cover_letter'], pitch);
}

async function fillLever(page, pitch) {
  await tryFill(page, ['input[name="name"]', 'input[placeholder*="full name" i]'], F.fullName);
  await tryFill(page, ['input[name="email"]', 'input[type="email"]'], F.email);
  await tryFill(page, ['input[name="phone"]', 'input[type="tel"]'], F.phone);
  await tryFill(page, ['input[name="urls[LinkedIn]"]', 'input[placeholder*="LinkedIn" i]'], F.linkedin);
  await tryFill(page, ['input[name="urls[Portfolio]"]', 'input[placeholder*="Portfolio" i]', 'input[name="urls[Other]"]'], F.portfolio);
  await tryFill(page, ['textarea[name="comments"]', 'textarea[placeholder*="cover" i]', 'textarea[placeholder*="additional" i]'], pitch);
}

async function fillAshby(page, pitch) {
  await tryFill(page, ['input[name="name.firstName"]', 'input[placeholder*="First" i]'], F.firstName);
  await tryFill(page, ['input[name="name.lastName"]', 'input[placeholder*="Last" i]'], F.lastName);
  await tryFill(page, ['input[name="email"]', 'input[type="email"]'], F.email);
  await tryFill(page, ['input[name="phone"]', 'input[type="tel"]'], F.phone);
  await tryFill(page, ['input[name="linkedIn"]', 'input[placeholder*="LinkedIn" i]'], F.linkedin);
  await tryFill(page, ['input[name="website"]', 'input[placeholder*="Website" i]', 'input[placeholder*="Portfolio" i]'], F.portfolio);
  await tryFill(page, ['textarea[name="coverLetter"]', 'textarea[placeholder*="cover" i]'], pitch);
}

async function fillGeneric(page, pitch) {
  await tryFill(page, ['input[name*="first_name" i]', 'input[id*="first_name" i]', 'input[placeholder*="First Name" i]'], F.firstName);
  await tryFill(page, ['input[name*="last_name" i]', 'input[id*="last_name" i]', 'input[placeholder*="Last Name" i]'], F.lastName);
  await tryFill(page, ['input[name*="full_name" i]', 'input[placeholder*="Full Name" i]'], F.fullName);
  await tryFill(page, ['input[type="email"]', 'input[name*="email" i]'], F.email);
  await tryFill(page, ['input[type="tel"]', 'input[name*="phone" i]'], F.phone);
  await tryFill(page, ['input[name*="linkedin" i]', 'input[placeholder*="LinkedIn" i]'], F.linkedin);
  await tryFill(page, ['input[name*="portfolio" i]', 'input[name*="website" i]', 'input[placeholder*="Portfolio" i]'], F.portfolio);
  await tryFill(page, ['textarea[name*="cover" i]', 'textarea[placeholder*="cover" i]', 'textarea[name*="message" i]'], pitch);
}

const STRATEGIES = { greenhouse: fillGreenhouse, lever: fillLever, ashby: fillAshby };

function detectPlatform(url = "") {
  if (url.includes("greenhouse.io")) return "greenhouse";
  if (url.includes("lever.co"))      return "lever";
  if (url.includes("ashbyhq.com"))   return "ashby";
  return "generic";
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function run() {
  const platform = detectPlatform(urlArg);
  const pitch    = makePitch(companyArg, roleArg);

  console.log(`\n🤖 [Auto Apply]`);
  console.log(`   URL      : ${urlArg}`);
  console.log(`   Company  : ${companyArg}`);
  console.log(`   Role     : ${roleArg}`);
  console.log(`   Platform : ${platform}`);
  console.log(`   Mode     : ${dryRun ? "DRY RUN" : shouldSubmit ? "FILL + SUBMIT" : "FILL ONLY (review before submit)"}`);
  console.log(`   Resume   : ${resumePath || "⚠️  Not found (place resume.pdf in project root)"}\n`);

  const browser = await chromium.launch({
    headless: false, // Visible so user can see fills and intervene
    slowMo: 100,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 900 }
  });

  const page = await context.newPage();

  try {
    await page.goto(urlArg, { waitUntil: "domcontentloaded", timeout: 15000 });
    console.log(`✅ Loaded: ${page.url()}\n`);

    if (dryRun) {
      console.log("ℹ️  Dry run — browser will close in 8 seconds.");
      await page.waitForTimeout(8000);
      await browser.close();
      return;
    }

    // Fill the form
    const filler = STRATEGIES[platform] || fillGeneric;
    console.log("📝 Filling form fields...");
    await filler(page, pitch);

    // Upload resume
    if (resumePath) {
      const fileSelectors = [
        'input[type="file"][name*="resume" i]',
        'input[type="file"][name*="cv" i]',
        'input[type="file"][accept*="pdf" i]',
        'input[type="file"]',
      ];
      for (const sel of fileSelectors) {
        try {
          const inp = page.locator(sel).first();
          // File inputs are often hidden — use force
          await inp.setInputFiles(resumePath, { timeout: 1000 });
          console.log(`  📎 Resume uploaded: ${resumePath}`);
          break;
        } catch {}
      }
    } else {
      console.log("  ⚠️  resume.pdf not found in project root — skipping upload");
    }

    console.log("\n✅ Form filled! Review in browser.");

    if (shouldSubmit) {
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Submit Application")',
        'button:has-text("Submit")',
        'button:has-text("Apply Now")',
        'button:has-text("Apply")',
        'button:has-text("Send Application")',
      ];
      let submitted = false;
      for (const sel of submitSelectors) {
        try {
          const btn = page.locator(sel).first();
          if (await btn.isVisible({ timeout: 600 })) {
            await btn.click();
            console.log(`🚀 Submitted! (${sel})`);
            submitted = true;
            await page.waitForTimeout(4000);
            break;
          }
        } catch {}
      }
      if (!submitted) {
        console.warn("⚠️  Submit button not found — form filled but NOT submitted. Click manually.");
        await page.waitForTimeout(30000);
      }
      await browser.close();
    } else {
      // Fill-only: keep open for 60s so user can review and submit manually
      console.log("ℹ️  Browser stays open for 60s. Review, then submit manually OR re-run with --submit.\n");
      await page.waitForTimeout(60000);
      await browser.close();
    }
  } catch (err) {
    console.error(`\n❌ Auto-apply error: ${err.message}`);
    await browser.close();
    process.exit(1);
  }
}

run();
