async function inspectNaukri() {
  const url = "https://www.naukri.com/job-listings-frontend-developer-famepilot-internet-gurugram-0-to-2-years-140220500671";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  const html = await res.text();
  console.log("Status:", res.status);
  const match = html.match(/posted[\s\S]{0,100}/i);
  console.log("Posted snippet:", match ? match[0] : "none");
  const dateMatch = html.match(/(\d+\+?\s*(?:days?|months?|years?|weeks?)\s*ago)/i);
  console.log("Date match:", dateMatch ? dateMatch[0] : "none");
  const idMatch = url.match(/(\d{6,})/);
  console.log("ID match:", idMatch ? idMatch[1] : "none");
}
inspectNaukri();
