async function inspectLinkedInDates() {
  const jobIds = ["4454515068", "4454031760", "4453914136"];
  for (const id of jobIds) {
    try {
      const res = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      const html = await res.text();
      const timeMatch = html.match(/class="posted-time-ago__text[^"]*">([\s\S]*?)<\/span>/i);
      const isClosed = html.includes("closed") || html.includes("no longer accepting applications") || html.includes("closed-job");
      console.log(`Job ${id}:`);
      console.log(`  Time text: "${timeMatch ? timeMatch[1].trim() : 'NOT FOUND'}"`);
      console.log(`  Is closed flag: ${isClosed}`);
    } catch (e) {
      console.error(`Error for ${id}:`, e.message);
    }
  }
}
inspectLinkedInDates();
