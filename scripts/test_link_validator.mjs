async function checkJobLive(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(6000),
      redirect: "follow"
    });

    if (!res.ok) {
      return { live: false, reason: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const lower = html.toLowerCase();

    // Check closed patterns
    const closedPatterns = [
      "no longer accepting applications",
      "job is closed",
      "job has expired",
      "this job is no longer available",
      "position has been filled",
      "this opening has been archived",
      "this job is inactive",
      "application is closed",
      "page not found"
    ];

    for (const pat of closedPatterns) {
      if (lower.includes(pat)) {
        return { live: false, reason: `Contains '${pat}'` };
      }
    }

    // Check stale dates
    const stalePatterns = [
      "30+ days ago",
      "30+ d ago",
      "1 month ago",
      "2 months ago",
      "3 months ago",
      "4 weeks ago",
      "3 weeks ago",
      "2 weeks ago",
      "15 days ago",
      "20 days ago"
    ];

    for (const pat of stalePatterns) {
      if (lower.includes(pat)) {
        return { live: false, reason: `Stale date '${pat}'` };
      }
    }

    return { live: true };
  } catch (e) {
    return { live: false, reason: e.message };
  }
}

async function testLinks() {
  const testUrls = [
    "https://www.naukri.com/job-listings-frontend-developer-famepilot-internet-gurugram-0-to-2-years-140220500671",
    "https://www.naukri.com/job-listings-react-js-developer-autuskey-technology-development-pvt-ltd-pune-0-to-2-years-230323501236",
    "https://www.instahyre.com/job-143224-frontend-developer-at-innoventsoft-work-from-home/",
    "https://wellfound.com/jobs/3363278-junior-frontend-developer-react-typescript",
    "https://in.linkedin.com/jobs/view/it-front-end-developer-at-ace-rooms-ltd-4454515068"
  ];

  for (const u of testUrls) {
    console.log(`Checking ${u}...`);
    const r = await checkJobLive(u);
    console.log(` -> Live: ${r.live}`, r.reason ? `(Reason: ${r.reason})` : "");
  }
}

testLinks();
