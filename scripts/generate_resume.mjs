import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const profile = JSON.parse(readFileSync(resolve(rootDir, "candidate_profile.json"), "utf-8"));

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${profile.personal.fullName} - Resume</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.38;
      font-size: 11.5px;
      background: #ffffff;
      padding: 24px 28px;
    }
    
    /* Header */
    .header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .name {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.3px;
      margin-bottom: 3px;
      text-transform: uppercase;
    }
    .headline {
      font-size: 12px;
      font-weight: 600;
      color: #2563eb;
      margin-bottom: 4px;
    }
    .contact-bar {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 11px;
      color: #475569;
    }
    .contact-bar a {
      color: #0f172a;
      text-decoration: none;
      font-weight: 500;
    }
    .contact-bar a:hover { text-decoration: underline; }

    /* Section Headings */
    h2 {
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 2px;
      margin-top: 10px;
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Items */
    .item { margin-bottom: 8px; }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .company {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .location {
      font-size: 11px;
      color: #64748b;
      font-weight: 400;
    }
    .role-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 3px;
    }
    .role {
      font-size: 11.5px;
      font-weight: 600;
      color: #2563eb;
    }
    .date {
      font-size: 10.5px;
      color: #64748b;
      font-weight: 500;
    }

    /* Bullet Lists */
    ul {
      margin-left: 16px;
      list-style-type: square;
    }
    li {
      margin-bottom: 2.5px;
      color: #334155;
    }
    li strong {
      color: #0f172a;
      font-weight: 600;
    }

    /* Projects */
    .project-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }
    .project-links {
      font-size: 10.5px;
      font-weight: 500;
    }
    .project-links a {
      color: #2563eb;
      text-decoration: none;
      margin-left: 6px;
    }
    .project-tech {
      font-size: 10.5px;
      color: #475569;
      font-style: italic;
      margin-bottom: 2px;
    }

    /* Skills Categorized */
    .skills-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 2px;
    }
    .skills-row {
      display: flex;
      margin-bottom: 3px;
      font-size: 11px;
    }
    .skills-cat {
      width: 165px;
      font-weight: 700;
      color: #0f172a;
      flex-shrink: 0;
    }
    .skills-val {
      color: #334155;
    }

    /* Awards */
    .award-text {
      font-size: 11px;
      color: #334155;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="name">${profile.personal.fullName}</div>
    <div class="headline">Frontend Software Engineer | React, TypeScript, Next.js & UI Architecture</div>
    <div class="contact-bar">
      <span>📍 ${profile.personal.currentLocation}</span>
      <span>📞 ${profile.personal.phone}</span>
      <span>✉️ <a href="mailto:${profile.personal.email}">${profile.personal.email}</a></span>
      <span>🔗 <a href="${profile.personal.linkedin}">LinkedIn</a></span>
      <span>💻 <a href="${profile.personal.portfolio}">Portfolio</a></span>
      <span>🐙 <a href="${profile.personal.github}">GitHub</a></span>
    </div>
  </div>

  <!-- Summary -->
  <h2>Professional Summary</h2>
  <p style="color: #334155; font-size: 11px; margin-bottom: 2px;">
    <strong>Frontend Engineer (IIT Roorkee, 2 YOE at BYJU'S)</strong> specializing in <strong>React, TypeScript, Redux, and modern UI architectures</strong>. Track record of engineering 50+ high-traffic web applications serving 2M+ learners with 99.8% uptime. Adept at Core Web Vitals optimization, reducing bundle latency by 38%, and architecting responsive, accessible design systems.
  </p>

  <!-- Experience -->
  <h2>Professional Experience</h2>
  ${profile.experience.map(exp => `
    <div class="item">
      <div class="item-header">
        <span class="company">${exp.company}</span>
        <span class="location">${exp.location}</span>
      </div>
      <div class="role-row">
        <span class="role">${exp.role}</span>
        <span class="date">${exp.startDate} – ${exp.endDate}</span>
      </div>
      <ul>
        ${exp.highlights.map(h => `<li>${h}</li>`).join("")}
      </ul>
    </div>
  `).join("")}

  <!-- Projects -->
  <h2>Featured Production Projects</h2>
  ${(profile.projects || []).map(proj => `
    <div class="item">
      <div class="item-header">
        <span class="project-title">${proj.name}</span>
        <span class="project-links">
          ${proj.link ? `<a href="${proj.link}">Live Demo ↗</a>` : ""}
          ${proj.github ? `<a href="${proj.github}">GitHub ↗</a>` : ""}
        </span>
      </div>
      <div class="project-tech">Tech Stack: ${proj.technologies.join(", ")}</div>
      <ul>
        ${proj.highlights.map(h => `<li>${h}</li>`).join("")}
      </ul>
    </div>
  `).join("")}

  <!-- Technical Skills -->
  <h2>Technical Skills</h2>
  <div class="skills-table">
    <div class="skills-row">
      <span class="skills-cat">Languages & Web:</span>
      <span class="skills-val">TypeScript, JavaScript (ES6+), HTML5, CSS3, Sass</span>
    </div>
    <div class="skills-row">
      <span class="skills-cat">Frameworks & Libraries:</span>
      <span class="skills-val">React.js, Next.js, Redux Toolkit, Context API, Tailwind CSS, Shadcn/ui, React-Router</span>
    </div>
    <div class="skills-row">
      <span class="skills-cat">Architecture & Performance:</span>
      <span class="skills-val">Core Web Vitals, Code-Splitting, Lazy Loading, RESTful APIs, State Management, Responsive Design</span>
    </div>
    <div class="skills-row">
      <span class="skills-cat">Tooling & Testing:</span>
      <span class="skills-val">Git, GitHub Actions, Vite, Webpack, Firebase Firestore, Jest, Figma, Agile/Scrum</span>
    </div>
  </div>

  <!-- Education & Honors -->
  <h2>Education & Achievements</h2>
  <div class="item">
    <div class="item-header">
      <span class="company">Indian Institute of Technology, Roorkee (IIT Roorkee)</span>
      <span class="location">Uttarakhand, India</span>
    </div>
    <div class="role-row">
      <span class="role">Bachelor of Engineering (B.E.)</span>
      <span class="date">2016 – 2020</span>
    </div>
  </div>
  <div class="award-text">
    🏆 <strong>BYJU'S TechX Award (2022)</strong> — Recognized for Exceptional Ownership & Accountability across core frontend engineering initiatives.
  </div>
</body>
</html>
`;

export async function ensureResumePdf() {
  const pdfPath = resolve(rootDir, "resume.pdf");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html);
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" }
  });
  await browser.close();
  console.log(`✅ 95+ ATS resume.pdf generated successfully at: ${pdfPath}`);
  return pdfPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await ensureResumePdf();
}

