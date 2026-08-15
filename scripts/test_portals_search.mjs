import FirecrawlApp from "@mendable/firecrawl-js";

async function testMultiSourceSearch() {
  const app = new FirecrawlApp({ apiKey: "fc-b45480c48b2548219e66ab2f246e13a7" });

  const portals = [
    { name: "Y Combinator", query: "site:workatastartup.com/jobs \"Frontend\" React \"India\" OR \"Remote\"" },
    { name: "Wellfound", query: "site:wellfound.com/jobs \"Frontend Developer\" React \"0-2\" OR \"Junior\"" },
    { name: "Instahyre", query: "site:instahyre.com/job \"Frontend Developer\" React \"0-2 years\"" },
    { name: "Naukri", query: "site:naukri.com/job-listings \"Frontend Developer\" React \"0-2 years\"" }
  ];

  for (const p of portals) {
    console.log(`\n🔎 Testing Firecrawl search for ${p.name}...`);
    try {
      const res = await app.search(p.query, { limit: 3 });
      const items = res?.web || res?.data || [];
      console.log(`Results for ${p.name}:`, items.length);
      items.forEach(item => {
        console.log(` - ${item.title} -> ${item.url}`);
        if (item.description) console.log(`   ${item.description.slice(0, 100)}...`);
      });
    } catch (e) {
      console.error(`Error searching ${p.name}:`, e.message);
    }
  }
}

testMultiSourceSearch();
