#!/usr/bin/env node

const STRICT_EXCLUSIONS = [
  "senior", "sr.", "sr ", "staff", "principal", "lead", "manager", "director", "architect",
  "3+", "4+", "5+", "6+", "7+", "8+", "3-5", "4-6", "5-7", "3 to 5", "4 to 6",
  "aws", "cloud", "devops", "solidity", "blockchain", "smart contract", "web3",
  "flutter", "react native", "react-native", "android", "ios",
  "backend", "django", "flask", "spring boot", "golang", "kubernetes", "docker", "terraform", "full stack", "fullstack"
];

function extractExperience(text = "") {
  // Check for high experience patterns (reject)
  const highExpRegex = /(?:3\+|4\+|5\+|6\+|7\+|8\+|3\s*-\s*5|4\s*-\s*6|5\s*-\s*7|3\s*to\s*5|4\s*to\s*6)\s*(?:years?|yrs?|yoe)/i;
  if (highExpRegex.test(text)) {
    return { valid: false, exp: 3, reason: "Requires > 2 years experience" };
  }

  // Check for valid 0-2 YOE patterns
  const validExpRegex = /(?:0\s*-\s*1|0\s*-\s*2|1\s*-\s*2|0\s*to\s*2|1\s*to\s*2|1\+|2\+|1\s*years?|2\s*years?|fresher|entry[\s-]level|junior)\s*(?:of)?\s*(?:years?|yrs?|yoe|experience)?/i;
  const match = text.match(validExpRegex);
  if (match) {
    if (match[0].includes("0") || match[0].includes("1") || match[0].includes("fresher") || match[0].includes("junior")) {
      return { valid: true, exp: 1 };
    }
    return { valid: true, exp: 2 };
  }

  // Default to 1-2 YOE for junior roles if not explicitly >2
  return { valid: true, exp: 2 };
}

async function testDiscover() {
  const url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=frontend%20developer&location=India&f_TPR=r259200&f_E=1%2C2";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });

  const html = await res.text();
  const rawCards = html.split("<li");
  console.log(`Analyzing ${rawCards.length - 1} LinkedIn postings (posted in last 3 days)...`);

  const accepted = [];

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

    // Quick title filter
    const titleLower = title.toLowerCase();
    if (STRICT_EXCLUSIONS.some(ex => titleLower.includes(ex))) {
      console.log(`❌ Skipped [${company}] "${title}": Title contains excluded keyword`);
      continue;
    }

    // Extract Job ID to fetch job description and verify experience & stack
    const jobIdMatch = jobUrl.match(/(\d+)(?:[^\d]|$)/);
    let jobDesc = "";
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
      } catch (e) {
        // Fallback
      }
    }

    const fullText = `${title} ${jobDesc}`.toLowerCase();

    // Check strict exclusions on full text
    const excludedTerm = STRICT_EXCLUSIONS.find(ex => fullText.includes(ex));
    if (excludedTerm) {
      console.log(`❌ Skipped [${company}] "${title}": Description contains excluded term "${excludedTerm}"`);
      continue;
    }

    // Check experience requirement
    const expCheck = extractExperience(jobDesc);
    if (!expCheck.valid) {
      console.log(`❌ Skipped [${company}] "${title}": ${expCheck.reason}`);
      continue;
    }

    console.log(`✅ MATCHED: [${company}] ${title} | Exp: ${expCheck.exp} yr(s) | Loc: ${location}`);
    console.log(`   Link: ${jobUrl}`);
    console.log(`   Logo: ${logo || "None"}`);

    accepted.push({
      company,
      role: title,
      location,
      jobUrl,
      logo,
      experience: expCheck.exp,
      portalName: "LinkedIn"
    });
  }

  console.log(`\n🎉 Total Verified Matching Jobs: ${accepted.length}`);
}

testDiscover();
