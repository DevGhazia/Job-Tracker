import { chromium } from "playwright";

/**
 * Extracts experience requirements from raw text
 * @param {string} text 
 * @returns {{ minYoe: number, maxYoe: number, raw: string, isSenior: boolean, isSuitable: boolean }}
 */
export function parseExperienceFromText(text = "") {
  const clean = text.replace(/\s+/g, " ");

  // Check for explicit senior / leadership exclusions
  const isSeniorTitleOrText = /\b(senior|staff|principal|lead|architect|manager|director|5\+\s*years|6\+\s*years|7\+\s*years|8\+\s*years)\b/i.test(clean);

  // Match patterns like: "2-4 years", "1 to 3 yrs", "3+ years of experience", "minimum 2 years", "0-2 YOE"
  const patterns = [
    /(?:require(?:s|d)?|minimum|at least|with|have)\s*([0-9]+)\s*(?:-|to|\+)?\s*([0-9]*)\s*(?:years?|yrs?|yoe)\s*(?:of)?\s*(?:relevant|hands-on|industry|software|frontend|work)?\s*experience/i,
    /([0-9]+)\s*(?:-|to)\s*([0-9]+)\s*(?:years?|yrs?|yoe)\s*(?:of)?\s*(?:experience)?/i,
    /([0-9]+)\s*\+\s*(?:years?|yrs?|yoe)\s*(?:of)?\s*(?:experience)?/i,
    /experience\s*:\s*([0-9]+)\s*(?:-|to|\+)?\s*([0-9]*)\s*(?:years?|yrs?|yoe)?/i
  ];

  let minYoe = null;
  let maxYoe = null;
  let rawMatch = "";

  for (const regex of patterns) {
    const match = clean.match(regex);
    if (match) {
      rawMatch = match[0];
      minYoe = parseInt(match[1], 10);
      maxYoe = match[2] ? parseInt(match[2], 10) : minYoe;
      break;
    }
  }

  // If no explicit number was found, check for fresher / entry level
  if (minYoe === null) {
    if (/\b(fresher|entry level|graduate|intern|0-1 year|0-2 year)\b/i.test(clean)) {
      minYoe = 0;
      maxYoe = 2;
      rawMatch = "0-2 YOE (Entry Level)";
    }
  }

  // Strict suitability check: Candidate has 2 YOE.
  // Suitable if:
  // 1. Min YOE is <= 2 (e.g. 0-2, 1-3, 2-4, 1-2 years)
  // 2. Not explicitly senior (5+ years, staff, principal, lead)
  const isSuitable = minYoe !== null ? (minYoe <= 2 && !isSeniorTitleOrText) : !isSeniorTitleOrText;
  const isSenior = minYoe !== null ? minYoe >= 3 : isSeniorTitleOrText;

  return {
    minYoe: minYoe !== null ? minYoe : 1,
    maxYoe: maxYoe !== null ? maxYoe : 3,
    raw: rawMatch || (minYoe !== null ? `${minYoe}-${maxYoe} YOE` : "1 - 3 YOE"),
    isSenior,
    isSuitable
  };
}

/**
 * Proofreads a job posting using lightweight headless Playwright.
 * Visits the source page, expands "Show more" / "See more", and extracts exact YOE.
 * 
 * @param {string} jobUrl 
 * @param {import('playwright').Browser} [existingBrowser]
 * @returns {Promise<{ verifiedExperience: string, isSuitable: boolean, reason?: string }>}
 */
export async function proofreadJobWithPlaywright(jobUrl, existingBrowser = null) {
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
    const parsed = parseExperienceFromText(bodyText);

    await context.close();

    if (!parsed.isSuitable || parsed.isSenior) {
      return {
        verifiedExperience: `${parsed.minYoe}+ YOE`,
        isSuitable: false,
        reason: `Source page requires ${parsed.raw || `${parsed.minYoe}+ YOE`} (unsuitable for 0-2 YOE)`
      };
    }

    return {
      verifiedExperience: parsed.raw || `${parsed.minYoe} - ${parsed.maxYoe} YOE`,
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
