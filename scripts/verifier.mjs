import { chromium } from "playwright";

/**
 * Extracts experience requirements from raw text with strict range-aware matching.
 * @param {string} text 
 * @param {string} [jobTitle]
 * @returns {{ minYoe: number, maxYoe: number, raw: string, isSenior: boolean, isSuitable: boolean }}
 */
export function parseExperienceFromText(text = "", jobTitle = "") {
  const clean = text.replace(/\s+/g, " ");

  // Check if the role TITLE itself is senior/staff/lead
  const isSeniorTitle = /\b(senior|sr\.|sr |staff|principal|lead|architect|director|manager|avp|vp)\b/i.test(jobTitle);

  let minYoe = null;
  let maxYoe = null;

  // ─── PHASE 1: Try to find a RANGE pattern first (most specific wins) ───────
  // Handles: "2-5 years", "1 to 3 years", "2 to 5 yrs", "0-2 years of experience"
  const rangePatterns = [
    // "X-Y years/yrs/yoe" — most common form
    /\b([0-9]+)\s*[-–]\s*([0-9]+)\s*(?:years?|yrs?|yoe)\b/i,
    // "X to Y years/yrs/yoe"
    /\b([0-9]+)\s+to\s+([0-9]+)\s*(?:years?|yrs?|yoe)\b/i,
    // "minimum/at least/require X years to Y years" — e.g. "Minimum 2 years to 5 years"
    /(?:minimum|min|at least|require(?:s|d)?)\s+([0-9]+)\s*(?:years?|yrs?|yoe)?\s*(?:-|–|to)\s*([0-9]+)\s*(?:years?|yrs?|yoe)/i,
  ];

  for (const regex of rangePatterns) {
    const match = clean.match(regex);
    if (match) {
      minYoe = parseInt(match[1], 10);
      maxYoe = parseInt(match[2], 10);
      // Sanity check: don't accept reversed or nonsensical ranges
      if (minYoe > maxYoe) [minYoe, maxYoe] = [maxYoe, minYoe];
      break;
    }
  }

  // ─── PHASE 2: If no range found, look for a single-number or X+ pattern ───
  if (minYoe === null) {
    const singlePatterns = [
      // "X+ years" / "X+ yrs" — treat as open-ended minimum
      /\b([0-9]+)\s*\+\s*(?:years?|yrs?|yoe)\b/i,
      // "minimum/at least/require X years"
      /(?:minimum|min\.?|at least|require(?:s|d)?)\s+([0-9]+)\s*(?:years?|yrs?|yoe)\b/i,
      // "X years of experience" with no range
      /\b([0-9]+)\s*(?:years?|yrs?|yoe)\s*of\s*(?:relevant|professional|hands-on|industry|work)?\s*experience/i,
      // "experience: X years"
      /experience\s*:\s*([0-9]+)\s*(?:years?|yrs?|yoe)?/i,
    ];

    for (const regex of singlePatterns) {
      const match = clean.match(regex);
      if (match) {
        minYoe = parseInt(match[1], 10);
        // For "X+" or standalone, set maxYoe conservatively high so strict check catches it
        maxYoe = minYoe >= 2 ? minYoe + 2 : minYoe;
        break;
      }
    }
  }

  // ─── PHASE 3: Fallback to entry-level keywords ────────────────────────────
  if (minYoe === null) {
    if (/\b(fresher|entry[- ]level|fresh graduate|0[- ]1 year|0[- ]2 year|early career|recent graduate)\b/i.test(clean)) {
      minYoe = 0;
      maxYoe = 1;
    }
  }

  // ─── Build display tag ────────────────────────────────────────────────────
  let cleanTag = "0-2 yrs";
  if (minYoe !== null && maxYoe !== null) {
    if (minYoe === maxYoe) {
      cleanTag = `${minYoe} yrs`;
    } else {
      cleanTag = `${minYoe}-${maxYoe} yrs`;
    }
  } else if (minYoe !== null) {
    cleanTag = `${minYoe} yrs`;
  }

  // ─── SUITABILITY DECISION ─────────────────────────────────────────────────
  // Reject only if the role STARTS above the candidate's 2 YOE profile.
  // e.g. minYoe=3 → "3-5 yrs" → reject (candidate can't even meet the minimum)
  // e.g. minYoe=2 → "2-5 yrs" → ALLOW and display "2-5 yrs" on the card
  //      The candidate (2 YOE) is eligible to apply — we just show the real range.
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
 * Extracts salary / CTC range from text
 * @param {string} text 
 * @returns {string|null}
 */
export function extractSalaryFromText(text = "") {
  if (!text) return null;

  // 1. Indian LPA (e.g. ₹12 - ₹18 LPA, 14-20 LPA, ₹15 Lakhs - ₹22 Lakhs)
  const inrLpaMatch = text.match(/(?:₹|INR|Rs\.?)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:-|to)\s*(?:₹|INR|Rs\.?)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:LPA|L|Lakhs?|lac|per annum|PA|P\.A\.)/i) ||
                      text.match(/\b([0-9]+(?:\.[0-9]+)?)\s*(?:-|to)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:LPA|lakhs?|lac)\b/i);
  if (inrLpaMatch) {
    return `₹${inrLpaMatch[1]} - ${inrLpaMatch[2]} LPA`;
  }

  // 2. Full Indian rupee figures (e.g. ₹12,00,000 - ₹18,00,000)
  const inrFullMatch = text.match(/(?:₹|INR|Rs\.?)\s*([0-9]{1,2},[0-9]{2},[0-9]{3})\s*(?:-|to)\s*(?:₹|INR|Rs\.?)?\s*([0-9]{1,2},[0-9]{2},[0-9]{3})/i);
  if (inrFullMatch) {
    return `₹${inrFullMatch[1]} - ₹${inrFullMatch[2]}`;
  }

  // 3. USD / Global figures (e.g. $70,000 - $100,000, $80k - $120k USD)
  const usdMatch = text.match(/(?:\$|USD)\s*([0-9]+(?:,[0-9]+)?(?:\s*k|\s*K)?)\s*(?:-|to)\s*(?:\$|USD)?\s*([0-9]+(?:,[0-9]+)?(?:\s*k|\s*K)?)\s*(?:USD|per year|\/yr|annually)?/i);
  if (usdMatch) {
    return `$${usdMatch[1]} - $${usdMatch[2]} USD`;
  }

  return null;
}

/**
 * Extracts direct ATS application link (Greenhouse, Lever, Ashby, Workday, etc.)
 * @param {string} html 
 * @param {string} [currentUrl]
 * @returns {string|null}
 */
export function extractDirectApplyUrl(html = "", currentUrl = "") {
  if (!html) return null;
  const atsRegex = /href=["'](https?:\/\/(?:[a-zA-Z0-9-]+\.)*(?:greenhouse\.io|lever\.co|ashbyhq\.com|myworkdayjobs\.com|smartrecruiters\.com|jobvite\.com|bamboohr\.com|rippling\.com)[^"']*)["']/i;
  const match = html.match(atsRegex);
  if (match) {
    const url = match[1].replace(/&amp;/g, "&");
    if (url !== currentUrl) return url;
  }
  return null;
}



/**
 * Detects whether a job URL / page supports auto-apply.
 * Returns one of four modes:
 *   "open_form"  → Greenhouse/Lever/Ashby public form, no login → show Auto Apply button
 *   "linkedin"   → LinkedIn posting → show "Open on LinkedIn ↗" only (ban risk)
 *   "login_wall" → Requires account (Naukri, Workday, Indeed) → show "Apply ↗" only
 *   "unknown"    → Can't determine → show "Apply ↗" only
 *
 * @param {string} jobUrl
 * @param {string} [finalUrl]  - URL after any redirects (Playwright page.url())
 * @param {string} [html]      - Full page HTML
 * @param {string} [bodyText]  - Visible body text
 * @returns {{ mode: string, platform: string, applyUrl: string | null }}
 */
export function detectAutoApplyEligibility(jobUrl = "", finalUrl = "", html = "", bodyText = "") {
  const url = (finalUrl || jobUrl).toLowerCase();
  const htmlLower = (html || "").toLowerCase();

  // 1. LinkedIn → never auto-apply (bot ban risk)
  if (url.includes("linkedin.com")) {
    return { mode: "linkedin", platform: "LinkedIn", applyUrl: jobUrl };
  }

  // 2. Open-form ATS platforms (no login needed for external applicants)
  if (url.includes("boards.greenhouse.io") || url.includes("job-boards.greenhouse.io") || url.includes("greenhouse.io/jobs/")) {
    return { mode: "open_form", platform: "Greenhouse", applyUrl: finalUrl || jobUrl };
  }
  if (url.includes("jobs.lever.co") || url.includes("lever.co/")) {
    return { mode: "open_form", platform: "Lever", applyUrl: finalUrl || jobUrl };
  }
  if (url.includes("jobs.ashbyhq.com") || url.includes("ashbyhq.com/")) {
    return { mode: "open_form", platform: "Ashby", applyUrl: finalUrl || jobUrl };
  }

  // 3. Known login-required portals
  const loginWalls = [
    ["naukri.com", "Naukri"],
    ["myworkdayjobs.com", "Workday"],
    ["indeed.com", "Indeed"],
    ["wellfound.com", "Wellfound"],
    ["angellist.com", "AngelList"],
    ["instahyre.com", "Instahyre"],
    ["cutshort.io", "Cutshort"],
    ["hirist.tech", "Hirist"],
    ["foundit.in", "Foundit"],
    ["internshala.com", "Internshala"],
  ];
  for (const [pattern, name] of loginWalls) {
    if (url.includes(pattern)) {
      return { mode: "login_wall", platform: name, applyUrl: jobUrl };
    }
  }

  // 4. DOM-based login wall detection
  const hasPasswordField = htmlLower.includes('type="password"') || htmlLower.includes("type='password'");
  const hasLoginCta = /\b(sign in to apply|log in to apply|create an account to apply|login required|please sign in|apply with linkedin)\b/i.test(bodyText);
  if (hasPasswordField || hasLoginCta) {
    return { mode: "login_wall", platform: "Unknown (Login Required)", applyUrl: jobUrl };
  }

  // 5. DOM-based open form detection
  const hasOpenForm = (
    htmlLower.includes('name="first_name"') ||
    htmlLower.includes('name="last_name"') ||
    htmlLower.includes('name="email"') ||
    htmlLower.includes('placeholder="first name"') ||
    htmlLower.includes('placeholder="email"') ||
    /submit application|submit your application/i.test(bodyText)
  ) && !hasPasswordField;

  if (hasOpenForm) {
    return { mode: "open_form", platform: "External ATS", applyUrl: finalUrl || jobUrl };
  }

  // 6. Default fallback
  return { mode: "unknown", platform: "Unknown", applyUrl: jobUrl };
}

const CORE_FRONTEND_SKILLS = [
  { name: "React.js", regex: /\b(?:react(?:\.js)?|reactjs)\b/i },
  { name: "TypeScript", regex: /\b(?:typescript|ts)\b/i },
  { name: "JavaScript (ES6+)", regex: /\b(?:javascript|js|es6|es2015|ecmascript)\b/i },
  { name: "HTML5 & CSS3", regex: /\b(?:html5?|css3?|html\/css|scss|sass)\b/i },
  { name: "Next.js", regex: /\b(?:next(?:\.js)?|nextjs|ssr|server-side rendering)\b/i },
  { name: "Redux / Zustand", regex: /\b(?:redux|zustand|mobx|recoil|context api|state management)\b/i },
  { name: "Tailwind CSS", regex: /\b(?:tailwind(?:\s*css)?|styled-components|emotion|css modules|chakra ui|shadcn|material ui|mui)\b/i },
  { name: "REST APIs", regex: /\b(?:rest|restful|rest apis?|api integration|http|fetch|axios)\b/i },
  { name: "Git & GitHub", regex: /\b(?:git|github|gitlab|bitbucket|version control)\b/i },
  { name: "Responsive UI", regex: /\b(?:responsive(?:\s*design|\s*ui|\s*web)?|cross-browser|mobile-first)\b/i }
];

const BONUS_FRONTEND_SKILLS = [
  { name: "GraphQL", regex: /\b(?:graphql|apollo client|relay)\b/i },
  { name: "Jest / RTL", regex: /\b(?:jest|react testing library|rtl|unit test(?:ing|s)?|vitest)\b/i },
  { name: "Cypress / E2E", regex: /\b(?:cypress|playwright|e2e testing|end-to-end)\b/i },
  { name: "Vite / Webpack", regex: /\b(?:vite|webpack|rollup|esbuild|turbopack|bundler)\b/i },
  { name: "Docker / CI-CD", regex: /\b(?:docker|ci\/cd|github actions|jenkins|kubernetes)\b/i },
  { name: "Node.js / Express", regex: /\b(?:node(?:\.js)?|nodejs|express(?:\.js)?|nest(?:\.js)?)\b/i },
  { name: "Micro-frontends", regex: /\b(?:micro-frontends?|microfrontends?|module federation)\b/i },
  { name: "WebSockets", regex: /\b(?:websockets?|socket\.io|real-time|sse)\b/i },
  { name: "Figma / Design Systems", regex: /\b(?:figma|storybook|design systems?|adobe xd)\b/i },
  { name: "Performance Optimization", regex: /\b(?:web vitals|core web vitals|lighthouse|performance optimization|lazy loading|code splitting)\b/i }
];

/**
 * Extracts bullet points from a specific section text
 * @param {string} sectionText 
 * @param {number} [maxCount=4]
 * @returns {string[]}
 */
function parseBulletPoints(sectionText = "", maxCount = 4) {
  if (!sectionText) return [];
  const lines = sectionText.split(/\r?\n|•|\*|–|—|\u2022|\u25E6|\u2023|\u25AA|\u25AB/);
  const bullets = [];

  for (let line of lines) {
    line = line.replace(/<[^>]+>/g, " ").replace(/^\s*(?:[•*\-–—]|\d+[\.)])\s*/, "").replace(/\s+/g, " ").trim();
    if (line.length >= 15 && line.length <= 150) {
      // Exclude generic header strings
      if (!/^(?:requirements|qualifications|what you will do|responsibilities|benefits|about us|skills|about the role):?$/i.test(line)) {
        bullets.push(line);
        if (bullets.length >= maxCount) break;
      }
    }
  }

  return bullets;
}

/**
 * Structured job requirement extractor from raw body text and HTML.
 * Produces mandatory requirements, nice-to-have, salary, bullets, and direct ATS apply URLs.
 * 
 * @param {string} bodyText 
 * @param {string} [html]
 * @param {string} [jobUrl]
 * @param {string} [jobTitle]
 * @returns {{
 *   mandatoryRequirements: string[],
 *   niceToHave: string[],
 *   mandatoryBullets: string[],
 *   niceToHaveBullets: string[],
 *   salary: string | null,
 *   directApplyUrl: string | null,
 *   overview: string
 * }}
 */
export function extractJobRequirements(bodyText = "", html = "", jobUrl = "", jobTitle = "") {
  const cleanText = bodyText.replace(/\r/g, "\n");
  const salary = extractSalaryFromText(cleanText);
  const directApplyUrl = extractDirectApplyUrl(html, jobUrl);

  // 1. Isolate Requirements Section & Nice-To-Have Section
  const reqSectionMatch = cleanText.match(/(?:mandatory requirements|requirements|what you(?:'ll| will)? need|qualifications|basic qualifications|minimum qualifications|skills required|what we are looking for|key requirements|technical skills|must have|who you are)[\s:]*([\s\S]*?)(?=(?:preferred qualifications|good to have|nice to have|bonus points|plus points|what we offer|benefits|perks|responsibilities|what you will do|about us|about the company|$))/i);
  const reqSectionText = reqSectionMatch ? reqSectionMatch[1] : cleanText;

  const niceSectionMatch = cleanText.match(/(?:preferred qualifications|good to have|nice to have|bonus points|plus points|good-to-have|desirable|additional skills|bonus skills|what is a plus|it's a plus)[\s:]*([\s\S]*?)(?=(?:what we offer|benefits|perks|responsibilities|what you will do|about us|about the company|compensation|salary|$))/i);
  const niceSectionText = niceSectionMatch ? niceSectionMatch[1] : "";

  // 2. Extract Bullet Points
  const mandatoryBullets = parseBulletPoints(reqSectionText, 4);
  const niceToHaveBullets = parseBulletPoints(niceSectionText, 3);

  // 3. Extract Core & Bonus Tech Tags
  const mandatorySet = new Set();
  const niceSet = new Set();

  // Core frontend skills matching
  for (const item of CORE_FRONTEND_SKILLS) {
    if (item.regex.test(cleanText)) {
      mandatorySet.add(item.name);
    }
  }

  // Bonus frontend skills matching
  for (const item of BONUS_FRONTEND_SKILLS) {
    if (niceSectionText && item.regex.test(niceSectionText)) {
      niceSet.add(item.name);
    } else if (item.regex.test(cleanText)) {
      niceSet.add(item.name);
    }
  }

  // Fallback defaults if few skills were explicitly detected
  if (mandatorySet.size === 0) {
    mandatorySet.add("React.js");
    mandatorySet.add("JavaScript (ES6+)");
    mandatorySet.add("HTML5 & CSS3");
    mandatorySet.add("REST APIs");
  }
  if (niceSet.size === 0) {
    niceSet.add("Next.js");
    niceSet.add("TypeScript");
    niceSet.add("Tailwind CSS");
  }

  // Generate a clean 1-2 sentence overview snippet if possible
  let overview = "";
  const roleSectionMatch = cleanText.match(/(?:about the role|job description|role summary|position overview|the opportunity)[\s:]*([\s\S]{30,250}?)(?=\n\n|requirements|responsibilities|qualifications|$)/i);
  if (roleSectionMatch) {
    overview = roleSectionMatch[1].replace(/\s+/g, " ").trim();
  }

  return {
    mandatoryRequirements: Array.from(mandatorySet),
    niceToHave: Array.from(niceSet),
    mandatoryBullets,
    niceToHaveBullets,
    salary,
    directApplyUrl,
    overview
  };
}

/**
 * Proofreads a job posting using lightweight headless Playwright.
 * Visits the source page, expands "Show more" / "See more", and extracts exact YOE, recency, 
 * mandatory skills, bonus requirements, salary, and direct ATS apply URLs.
 * 
 * @param {string} jobUrl 
 * @param {string} [jobTitle]
 * @param {import('playwright').Browser} [existingBrowser]
 * @returns {Promise<{
 *   verifiedExperience: string,
 *   isSuitable: boolean,
 *   reason?: string,
 *   mandatoryRequirements: string[],
 *   niceToHave: string[],
 *   mandatoryBullets: string[],
 *   niceToHaveBullets: string[],
 *   salary: string | null,
 *   directApplyUrl: string | null,
 *   overview: string
 * }>}
 */
export async function proofreadJobWithPlaywright(jobUrl, jobTitle = "", existingBrowser = null) {
  if (!jobUrl || typeof jobUrl !== "string" || !jobUrl.startsWith("http")) {
    const fallbackReqs = extractJobRequirements("", "", jobUrl, jobTitle);
    return {
      verifiedExperience: "0 - 2 YOE",
      isSuitable: true,
      ...fallbackReqs
    };
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
    const finalUrl = page.url(); // capture URL after any redirects

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

    // Detect auto-apply eligibility while we still have the page data
    const autoApply = detectAutoApplyEligibility(jobUrl, finalUrl, html, bodyText);

    await context.close();

    // 1. Freshness & Active Status Check (Must be <= 1 day old)
    const freshness = parseDateFreshnessFromPage(bodyText, html, jobUrl);
    if (!freshness.isFresh) {
      return {
        verifiedExperience: "0 - 2 YOE",
        isSuitable: false,
        reason: freshness.reason,
        mandatoryRequirements: [],
        niceToHave: [],
        mandatoryBullets: [],
        niceToHaveBullets: [],
        salary: null,
        directApplyUrl: null,
        overview: ""
      };
    }

    // 2. Experience Requirements Check (Must be 0-2 YOE)
    const parsed = parseExperienceFromText(bodyText, jobTitle);

    if (!parsed.isSuitable) {
      return {
        verifiedExperience: `${parsed.minYoe}+ YOE`,
        isSuitable: false,
        reason: `Source page requires ${parsed.raw} (exceeds 0-2 YOE profile)`,
        mandatoryRequirements: [],
        niceToHave: [],
        mandatoryBullets: [],
        niceToHaveBullets: [],
        salary: null,
        directApplyUrl: null,
        overview: ""
      };
    }

    // 3. Extract Structured Requirements, Nice-to-Have, Salary & ATS URLs
    const reqs = extractJobRequirements(bodyText, html, jobUrl, jobTitle);

    return {
      verifiedExperience: parsed.raw,
      isSuitable: true,
      mandatoryRequirements: reqs.mandatoryRequirements,
      niceToHave: reqs.niceToHave,
      mandatoryBullets: reqs.mandatoryBullets,
      niceToHaveBullets: reqs.niceToHaveBullets,
      salary: reqs.salary,
      directApplyUrl: reqs.directApplyUrl,
      overview: reqs.overview,
      autoApplyMode: autoApply.mode,       // "open_form" | "linkedin" | "login_wall" | "unknown"
      autoApplyPlatform: autoApply.platform,
      autoApplyUrl: autoApply.applyUrl
    };
  } catch (err) {
    console.warn(`⚠️ [Playwright Proofreader Warning] Could not inspect ${jobUrl}:`, err.message);
    const fallbackReqs = extractJobRequirements("", "", jobUrl, jobTitle);
    return {
      verifiedExperience: "0 - 2 YOE",
      isSuitable: true,
      ...fallbackReqs
    };
  } finally {
    if (shouldClose && browser) {
      await browser.close();
    }
  }
}
