#!/usr/bin/env node
import { chromium } from "playwright";
import { readFileSync, existsSync } from "node:fs";
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

function getDb() {
  if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

const DEFAULT_USER_ID = "mTRDrxLoFaPjAKU1TOvqxgMt21o2";

function getProfile() {
  const p = resolve(rootDir, "candidate_profile.json");
  if (!existsSync(p)) throw new Error("candidate_profile.json not found!");
  return JSON.parse(readFileSync(p, "utf-8"));
}

export async function fillGreenhouseApplication(page, profile, resumePath) {
  console.log("📝 Autofilling Greenhouse application form...");

  // Fill standard fields
  const firstNames = ["#first_name", "input[name*='first_name']", "input[autocomplete*='given-name']"];
  for (const s of firstNames) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.firstName);
      break;
    }
  }

  const lastNames = ["#last_name", "input[name*='last_name']", "input[autocomplete*='family-name']"];
  for (const s of lastNames) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.lastName);
      break;
    }
  }

  const emails = ["#email", "input[type='email']", "input[name*='email']"];
  for (const s of emails) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.email);
      break;
    }
  }

  const phones = ["#phone", "input[type='tel']", "input[name*='phone']"];
  for (const s of phones) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.phone);
      break;
    }
  }

  // LinkedIn
  const linkedins = ["input[name*='linkedin' i]", "input[id*='linkedin' i]", "input[aria-label*='linkedin' i]"];
  for (const s of linkedins) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.linkedin);
      break;
    }
  }

  // GitHub
  const githubs = ["input[name*='github' i]", "input[id*='github' i]"];
  for (const s of githubs) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.github);
      break;
    }
  }

  // Portfolio / Personal Website
  const websites = ["input[name*='website' i]", "input[name*='portfolio' i]", "input[id*='website' i]", "input[id*='portfolio' i]"];
  for (const s of websites) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.portfolio);
      break;
    }
  }

  // Resume upload
  if (resumePath && existsSync(resumePath)) {
    const fileInputs = ["input[type='file']", "input[name*='resume' i]", "#resume"];
    for (const s of fileInputs) {
      if (await page.locator(s).count() > 0) {
        await page.locator(s).first().setInputFiles(resumePath);
        console.log(`📎 Attached resume: ${resumePath}`);
        break;
      }
    }
  }
}

export async function fillLeverApplication(page, profile, resumePath) {
  console.log("📝 Autofilling Lever application form...");

  const fullNames = ["input[name='name']", "#name", "input[autocomplete='name']"];
  for (const s of fullNames) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.fullName || `${profile.personal.firstName} ${profile.personal.lastName}`);
      break;
    }
  }

  const emails = ["input[name='email']", "input[type='email']"];
  for (const s of emails) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.email);
      break;
    }
  }

  const phones = ["input[name='phone']", "input[type='tel']"];
  for (const s of phones) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.phone);
      break;
    }
  }

  const urls = ["input[name*='urls[LinkedIn]']", "input[name*='linkedin' i]"];
  for (const s of urls) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.linkedin);
      break;
    }
  }

  const githubs = ["input[name*='urls[GitHub]']", "input[name*='github' i]"];
  for (const s of githubs) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.github);
      break;
    }
  }

  // Resume upload
  if (resumePath && existsSync(resumePath)) {
    const fileInputs = ["input[type='file']", "input[name='resume']"];
    for (const s of fileInputs) {
      if (await page.locator(s).count() > 0) {
        await page.locator(s).first().setInputFiles(resumePath);
        console.log(`📎 Attached resume: ${resumePath}`);
        break;
      }
    }
  }
}

export async function fillWorkableApplication(page, profile, resumePath) {
  console.log("📝 Autofilling Workable application form...");

  // Dismiss cookie consent banner if present
  try {
    const cookieBtn = page.locator("button:has-text('Accept all'), button:has-text('Decline all')");
    if (await cookieBtn.count() > 0) {
      await cookieBtn.first().click({ timeout: 3000 });
      await page.waitForTimeout(500);
    }
  } catch {}

  // First name
  const firstNames = ["input[name='firstname']", "input[data-ui='firstname']", "#firstname"];
  for (const s of firstNames) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.firstName);
      break;
    }
  }

  // Last name
  const lastNames = ["input[name='lastname']", "input[data-ui='lastname']", "#lastname"];
  for (const s of lastNames) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.lastName);
      break;
    }
  }

  // Email
  const emails = ["input[name='email']", "input[type='email']", "input[data-ui='email']", "#email"];
  for (const s of emails) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.email);
      break;
    }
  }

  // Headline
  const headlines = ["input[name='headline']", "input[data-ui='headline']", "#headline"];
  for (const s of headlines) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill("Frontend Engineer | React | TypeScript (IIT Roorkee, 2 YOE ex-BYJU'S)");
      break;
    }
  }

  // Phone
  const phones = ["input[type='tel']", "input[name='phone']"];
  for (const s of phones) {
    if (await page.locator(s).count() > 0) {
      const cleanPhone = profile.personal.phone.replace(/[^0-9]/g, "").slice(-10);
      await page.locator(s).first().fill(cleanPhone);
      break;
    }
  }

  // Address
  const addresses = ["input[name='address']", "input[data-ui='address']", "#address"];
  for (const s of addresses) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(profile.personal.currentLocation || "Delhi NCR, India");
      break;
    }
  }

  // Summary
  const summaries = ["textarea[name='summary']", "textarea[data-ui='summary']", "#summary"];
  for (const s of summaries) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill("Frontend Engineer with 2 years of production experience at BYJU'S building high-performance web applications using React, TypeScript, Redux, and modern UI architectures. IIT Roorkee engineering graduate.");
      break;
    }
  }

  // Cover Letter
  const coverLetters = ["textarea[name='cover_letter']", "textarea[data-ui='cover_letter']", "#cover_letter"];
  for (const s of coverLetters) {
    if (await page.locator(s).count() > 0) {
      await page.locator(s).first().fill(`Hi Hiring Team,

I'm Vivek (IIT Roorkee, 2 YOE at BYJU'S), specializing in React, TypeScript & performant UI architecture. Excited about this opportunity and would love to contribute to your Frontend Developer team.

Portfolio: ${profile.personal.portfolio} | LinkedIn: ${profile.personal.linkedin}
Notice: Immediate (<= 15 days)`);
      break;
    }
  }

  // Custom Form Questions (Workable dynamic fields)
  // City, Country question
  const cityCountry = page.locator("input[name='CA_34899'], input[data-ui='CA_34899']");
  if (await cityCountry.count() > 0) {
    await cityCountry.first().fill("Delhi NCR, India");
  }

  // YOE question
  const yoeInput = page.locator("input[name='CA_35127'], input[data-ui='CA_35127']");
  if (await yoeInput.count() > 0) {
    await yoeInput.first().fill("2");
  }

  // UK/US company question
  const ukUsInput = page.locator("input[name='CA_35125'], input[data-ui='CA_35125']");
  if (await ukUsInput.count() > 0) {
    await ukUsInput.first().fill("No (Worked at BYJU'S, open to international remote contracts)");
  }

  // Degree question
  const degreeInput = page.locator("input[name='CA_35126'], input[data-ui='CA_35126']");
  if (await degreeInput.count() > 0) {
    await degreeInput.first().fill("Yes, Bachelor of Engineering from IIT Roorkee");
  }

  // Desired salary (In ZAR)
  const salaryInput = page.locator("input[name='CA_34897'], input[data-ui='CA_34897']");
  if (await salaryInput.count() > 0) {
    await salaryInput.first().fill("450,000 ZAR / year (Equivalent to ~$25,000 USD / negotiable)");
  }

  // Notice period
  const noticeInput = page.locator("input[name='CA_34898'], input[data-ui='CA_34898']");
  if (await noticeInput.count() > 0) {
    await noticeInput.first().fill(profile.preferences?.noticePeriod || "Immediate (<= 15 days)");
  }

  // Radio button for "Are you currently based in South Africa?" -> NO
  try {
    const radioNo = page.locator("label:has-text('NO'), input[value*='no' i]");
    if (await radioNo.count() > 0) {
      await radioNo.first().click({ force: true, timeout: 3000 });
    }
  } catch {}

  // Resume upload
  if (resumePath && existsSync(resumePath)) {
    const fileInputs = ["input[type='file'][data-ui='resume']", "input[type='file']"];
    for (const s of fileInputs) {
      if (await page.locator(s).count() > 0) {
        await page.locator(s).first().setInputFiles(resumePath);
        console.log(`📎 Attached resume: ${resumePath}`);
        break;
      }
    }
  }
}

export async function applyToJob(jobUrl, { headless = false, autoSubmit = false } = {}) {
  const profile = getProfile();
  const resumePath = resolve(rootDir, "resume.pdf");

  console.log(`🚀 Launching browser for: ${jobUrl}`);
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    await page.goto(jobUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);

    if (jobUrl.includes("greenhouse.io")) {
      await fillGreenhouseApplication(page, profile, resumePath);
    } else if (jobUrl.includes("lever.co")) {
      await fillLeverApplication(page, profile, resumePath);
    } else if (jobUrl.includes("workable.com")) {
      await fillWorkableApplication(page, profile, resumePath);
    }

    console.log("✅ Form pre-filled successfully!");

    if (autoSubmit) {
      console.log("⚡ Auto-submitting application...");
      const submitButtons = [
        "button[data-ui='submit-application']",
        "button:has-text('Submit application')",
        "#submit_app",
        "button[type='submit']",
        "button:has-text('Submit Application')",
        "button:has-text('Apply')"
      ];
      for (const s of submitButtons) {
        if (await page.locator(s).count() > 0) {
          await page.locator(s).first().click();
          await page.waitForTimeout(5000);
          console.log("🎉 Application submitted!");
          break;
        }
      }
    } else {
      console.log("💡 [Copilot Mode]: Form is filled in the browser window for your review. Complete any custom questions and click Submit!");
      // Keep open for user inspection if not headless
      if (!headless) {
        await page.waitForTimeout(30000);
      }
    }

    return true;
  } catch (err) {
    console.error("Error during auto-fill:", err.message);
    return false;
  } finally {
    if (headless) {
      await browser.close();
    }
  }
}

// CLI usage: node scripts/auto-apply.mjs "<jobUrl>"
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2]) {
  const url = process.argv[2];
  const autoSubmitFlag = process.argv.includes("--submit");
  await applyToJob(url, { headless: true, autoSubmit: autoSubmitFlag });
}
