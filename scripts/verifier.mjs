import { chromium } from "playwright";

/**
 * Extracts experience requirements from raw text
 * @param {string} text 
 * @param {string} [jobTitle]
 * @returns {{ minYoe: number, maxYoe: number, raw: string, isSenior: boolean, isSuitable: boolean }}
 */
export function parseExperienceFromText(text = "", jobTitle = "") {
  const clean = text.replace(/\s+/g, " ");

  // Check if the role TITLE itself is senior/staff/lead
  const isSeniorTitle = /\b(senior|sr\.|staff|principal|lead|architect|director|manager)\b/i.test(jobTitle);

  // Match patterns like: "2-4 years", "1 to 3 yrs", "3+ years of experience", "minimum 2 years", "0-2 YOE", "2+ years"
  const patterns = [
    /(?:require(?:s|d)?|minimum|at least|with|have)\s*([0-9]+)\s*(?:-|to|\+)?\s*([0-9]*)\s*(?:years?|yrs?|yoe)\s*(?:of)?\s*(?:relevant|hands-on|industry|software|frontend|work)?\s*experience/i,
    /experience\s*:\s*([0-9]+)\s*(?:-|to|\+)?\s*([0-9]*)\s*(?:years?|yrs?|yoe)?/i,
    /([0-9]+)\s*(?:-|to)\s*([0-9]+)\s*(?:years?|yrs?|yoe)\s*(?:of)?\s*(?:experience)?/i,
    /([0-9]+)\s*\+\s*(?:years?|yrs?|yoe)\s*(?:of)?\s*(?:experience)?/i
  ];

  let minYoe = null;
  let maxYoe = null;
  let rawMatch = "";

  for (const regex of patterns) {
    const match = clean.match(regex);
    if (match) {
      rawMatch = match[0].trim();
      minYoe = parseInt(match[1], 10);
      maxYoe = match[2] ? parseInt(match[2], 10) : minYoe;
      break;
    }
  }

  // If no explicit number was found, check for fresher / entry level keywords
  if (minYoe === null) {
    if (/\b(fresher|entry level|graduate|intern|0-1 year|0-2 year|early career)\b/i.test(clean)) {
      minYoe = 0;
      maxYoe = 2;
      rawMatch = "0-2 YOE (Entry Level)";
    }
  }

  let cleanTag = "0-2 yrs";
  if (minYoe !== null) {
    if (minYoe === maxYoe || !maxYoe) {
      cleanTag = `${minYoe} yrs`;
    } else {
      cleanTag = `${minYoe}-${maxYoe} yrs`;
    }
  }

  // Strict suitability check: Candidate has 2 YOE from IIT Roorkee.
  // Suitable if:
  // 1. Min YOE is <= 2 (e.g. 0-2, 1-3, 2-4, 1-2, 2 yrs)
  // 2. Job title is not Senior/Lead/Staff
  // Unsuitable if:
  // 1. Min YOE >= 3 (e.g. 3-5, 3+, 4+, 5+, 6+)
  // 2. Senior job title
  const isSenior = isSeniorTitle || (minYoe !== null && minYoe >= 3);
  const isSuitable = !isSenior && (minYoe === null || minYoe <= 2);

  return {
    minYoe: minYoe !== null ? minYoe : 1,
    maxYoe: maxYoe !== null ? maxYoe : 2,
    raw: cleanTag,
    isSenior,
    isSuitable
  };
}

/**
 * Checks live page body text, HTML, and URL for posting recency.
 * Strictly enforces <= 1 day old (today or yesterday).
 * @param {string} bodyText 
 * @param {string} html 
 * @param {string} url 
 * @returns {{ isFresh: boolean, reason?: string }}
 */
export function parseDateFreshnessFromPage(bodyText = "", html = "", url = "") {
  const combined = (bodyText + " " + html).toLowerCase();

  // 1. Naukri URL date check (ddmmyy prefix in URL)
  if (url.includes("naukri.com")) {
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
        if (diffDays > 1.5 || diffDays < -1) {
          return { isFresh: false, reason: `Naukri post date is ${Math.round(diffDays)} days old` };
        }
      }
    }
  }

  // 2. Closed / expired indicators
  const closedIndicators = [
    "no longer accepting applications",
    "job is closed",
    "job has expired",
    "this job is no longer available",
    "position has been filled",
    "this opening has been archived",
    "this job is inactive",
    "application is closed"
  ];
  for (const ind of closedIndicators) {
    if (combined.includes(ind)) {
      return { isFresh: false, reason: `Job is closed or expired ('${ind}')` };
    }
  }

  // 3. Stale relative date keywords (>= 2 days old)
  const staleRelativePatterns = [
    /\bposted\s*:\s*(?:[2-9]|\d{2,})\s*days?\s*ago\b/i,
    /\bposted\s+(?:[2-9]|\d{2,})\s*days?\s*ago\b/i,
    /\bposted\s*:\s*\d+\s*(?:weeks?|months?|years?)\s*ago\b/i,
    /\bposted\s+\d+\s*(?:weeks?|months?|years?)\s*ago\b/i,
    /\b(?:[2-9]|\d{2,})\s*days?\s*ago\b/i,
    /\b\d+\s*(?:weeks?|months?|years?)\s*ago\b/i,
    /\b(?:30\+|15|20)\s*days?\s*ago\b/i
  ];

  for (const pattern of staleRelativePatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      return { isFresh: false, reason: `Stale posting date: "${match[0]}"` };
    }
  }

  return { isFresh: true };
}

/**
 * Proofreads a job posting using lightweight headless Playwright.
 * Visits the source page, expands "Show more" / "See more", and extracts exact YOE and recency.
 * 
 * @param {string} jobUrl 
 * @param {string} [jobTitle]
 * @param {import('playwright').Browser} [existingBrowser]
 * @returns {Promise<{ verifiedExperience: string, isSuitable: boolean, reason?: string }>}
 */
export async function proofreadJobWithPlaywright(jobUrl, jobTitle = "", existingBrowser = null) {
  if (!jobUrl || typeof jobUrl !== "string" || !jobUrl.startsWith("http")) {
    return { verifiedExperience: "0 - 2 YOE", isSuitable: true };
  }

  let browser = existingBrowser;
  let shouldClose = false;

  try {
    if (!browser) {
      browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
      });
      shouldClose = true;
    }

    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    // Block heavy assets (images, fonts, stylesheets, media) to load in < 1 second!
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (["image", "media", "font", "stylesheet"].includes(type)) {
        return route.abort();
      }
      return route.continue();
    });

    console.log(`🔎 [Playwright Proofreader] Inspecting: ${jobUrl}`);
    await page.goto(jobUrl, { waitUntil: "domcontentloaded", timeout: 9000 });

    // Click "Show more" / "See more" if present (LinkedIn, Greenhouse, Ashby, Lever)
    const showMoreSelectors = [
      ".show-more-less-html__button",
      "button:has-text('Show more')",
      "button:has-text('See more')",
      "button:has-text('Read more')",
      "[aria-label='Show more']"
    ];

    for (const selector of showMoreSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 500 })) {
          await btn.click({ timeout: 500 });
          break;
        }
      } catch {}
    }

    // Extract text from the main job description container or body
    const bodyText = await page.innerText("body");
    const html = await page.content();

    await context.close();

    // 1. Freshness & Active Status Check (Must be <= 1 day old)
    const freshness = parseDateFreshnessFromPage(bodyText, html, jobUrl);
    if (!freshness.isFresh) {
      return {
        verifiedExperience: "0 - 2 YOE",
        isSuitable: false,
        reason: freshness.reason
      };
    }

    // 2. Experience Requirements Check (Must be 0-2 YOE)
    const parsed = parseExperienceFromText(bodyText, jobTitle);

    if (!parsed.isSuitable) {
      return {
        verifiedExperience: `${parsed.minYoe}+ YOE`,
        isSuitable: false,
        reason: `Source page requires ${parsed.raw} (exceeds 0-2 YOE profile)`
      };
    }

    return {
      verifiedExperience: parsed.raw,
      isSuitable: true
    };
  } catch (err) {
    console.warn(`⚠️ [Playwright Proofreader Warning] Could not inspect ${jobUrl}:`, err.message);
    // If blocked or timed out, allow fallback
    return { verifiedExperience: "0 - 2 YOE", isSuitable: true };
  } finally {
    if (shouldClose && browser) {
      await browser.close();
    }
  }
}
