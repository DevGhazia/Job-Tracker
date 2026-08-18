import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const profile = JSON.parse(readFileSync(resolve(rootDir, "candidate_profile.json"), "utf-8"));

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: "Helvetica Neue", Arial, sans-serif; margin: 35px; color: #1e293b; line-height: 1.4; font-size: 13px; }
    h1 { font-size: 22px; margin: 0 0 4px 0; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
    .header { border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 16px; }
    .contact { font-size: 12px; color: #475569; }
    .contact a { color: #2563eb; text-decoration: none; }
    h2 { font-size: 14px; color: #1e40af; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-top: 14px; margin-bottom: 8px; text-transform: uppercase; }
    .item { margin-bottom: 12px; }
    .item-header { display: flex; justify-content: space-between; font-weight: bold; }
    .company { color: #0f172a; font-size: 13.5px; }
    .date { color: #64748b; font-size: 12px; font-weight: normal; }
    .role { font-style: italic; color: #334155; margin-bottom: 4px; font-size: 13px; }
    ul { margin: 4px 0 0 18px; padding: 0; }
    li { margin-bottom: 3px; }
    .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
    .skill-tag { background: #f1f5f9; padding: 3px 8px; border-radius: 4px; font-size: 12px; border: 1px solid #e2e8f0; font-weight: 500; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${profile.personal.fullName}</h1>
    <div class="contact">
      ${profile.personal.currentLocation} • ${profile.personal.phone} • ${profile.personal.email} • 
      <a href="${profile.personal.linkedin}">LinkedIn</a> • 
      <a href="${profile.personal.portfolio}">Portfolio</a> • 
      <a href="${profile.personal.github}">GitHub</a>
    </div>
  </div>

  <h2>Summary</h2>
  <p>Frontend Engineer with 2 years of production experience at BYJU'S engineering interactive web applications using React, TypeScript, Redux, and modern UI architectures. Bachelor of Engineering graduate from IIT Roorkee.</p>

  <h2>Experience</h2>
  ${profile.experience.map(exp => `
    <div class="item">
      <div class="item-header">
        <span class="company">${exp.company}</span>
        <span class="date">${exp.startDate} - ${exp.endDate} | ${exp.location}</span>
      </div>
      <div class="role">${exp.role}</div>
      <ul>
        ${exp.highlights.map(h => `<li>${h}</li>`).join("")}
      </ul>
    </div>
  `).join("")}

  <h2>Education</h2>
  ${profile.education.map(edu => `
    <div class="item">
      <div class="item-header">
        <span class="company">${edu.institution}</span>
        <span class="date">${edu.startYear} - ${edu.endYear} | ${edu.location}</span>
      </div>
      <div class="role">${edu.degree} in ${edu.field}</div>
    </div>
  `).join("")}

  <h2>Skills</h2>
  <div class="skills-grid">
    ${profile.skills.core.map(s => `<span class="skill-tag">${s}</span>`).join("")}
    ${profile.skills.tools.map(s => `<span class="skill-tag">${s}</span>`).join("")}
  </div>
</body>
</html>
`;

export async function ensureResumePdf() {
  const pdfPath = resolve(rootDir, "resume.pdf");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html);
  await page.pdf({ path: pdfPath, format: "A4", margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" } });
  await browser.close();
  console.log(`✅ resume.pdf generated successfully at: ${pdfPath}`);
  return pdfPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await ensureResumePdf();
}
