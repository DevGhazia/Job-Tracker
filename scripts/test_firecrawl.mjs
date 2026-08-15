import FirecrawlApp from "@mendable/firecrawl-js";

async function testFirecrawl() {
  const app = new FirecrawlApp({ apiKey: "fc-b45480c48b2548219e66ab2f246e13a7" });
  console.log("Testing Firecrawl scrape...");
  try {
    const res = await app.scrapeUrl("https://in.linkedin.com/jobs/view/frontend-developer-at-techsolace-4453914136", {
      formats: ["extract"],
      extract: {
        schema: {
          type: "object",
          properties: {
            jobTitle: { type: "string" },
            company: { type: "string" },
            yearsOfExperienceRequired: { type: "number" },
            isSuitableFor0To2YOE: { type: "boolean" },
            technologies: { type: "array", items: { type: "string" } }
          },
          required: ["jobTitle", "yearsOfExperienceRequired", "isSuitableFor0To2YOE"]
        }
      }
    });

    console.log("Firecrawl success:", res.success);
    console.log("Extracted Data:", JSON.stringify(res.extract, null, 2));
  } catch (e) {
    console.error("Firecrawl error:", e.message);
  }
}

testFirecrawl();
