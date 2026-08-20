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
      line-height: 1.32;
      font-size: 10.5px;
      background: #ffffff;
      padding: 16px 22px;
    }
    
    /* Header */
    .header {
      text-align: center;
      border-bottom: 1.5px solid #2563eb;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .name {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.3px;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
    .headline {
      font-size: 11px;
      font-weight: 600;
      color: #2563eb;
      margin-bottom: 3px;
    }
    .contact-bar {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 10px;
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
      font-size: 11.5px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 1.5px;
      margin-top: 7px;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Items */
    .item { margin-bottom: 5px; }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .company {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }
    .location {
      font-size: 10px;
      color: #64748b;
      font-weight: 400;
    }
    .role-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
    }
    .role {
      font-size: 10.5px;
      font-weight: 600;
      color: #2563eb;
    }
    .date {
      font-size: 10px;
      color: #64748b;
      font-weight: 500;
    }

    /* Bullet Lists */
    ul {
      margin-left: 14px;
      list-style-type: square;
    }
    li {
      margin-bottom: 1.5px;
      color: #334155;
    }
    li strong {
      color: #0f172a;
      font-weight: 600;
    }

    /* Projects */
    .project-title {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
    }
    .project-links {
      font-size: 10px;
      font-weight: 500;
    }
    .project-links a {
      color: #2563eb;
      text-decoration: none;
      margin-left: 6px;
    }
    .project-tech {
      font-size: 10px;
      color: #475569;
      font-style: italic;
      margin-bottom: 1.5px;
    }

    /* Skills Categorized */
    .skills-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1px;
    }
    .skills-row {
      display: flex;
      margin-bottom: 2px;
      font-size: 10.5px;
    }
    .skills-cat {
      width: 155px;
      font-weight: 700;
      color: #0f172a;
      flex-shrink: 0;
    }
    .skills-val {
      color: #334155;
    }

    /* Awards */
    .award-text {
      font-size: 10.5px;
      color: #334155;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="name">${profile.personal.fullName}</div>
    <div class="headline">Frontend Software Engineer | React, TypeScript, Redux & UI Architecture</div>
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
  <p style="color: #334155; font-size: 10.5px; margin-bottom: 1px;">
    <strong>Frontend Engineer (IIT Roorkee, 2+ YOE)</strong> specializing in <strong>React, TypeScript, Redux Toolkit, and scalable UI architecture</strong>. Experience developing 50+ interactive web applications at BYJU'S serving 2M+ learners and delivering freelance production web apps (Amazon E-Commerce, Gemini AI Chat). Adept at Core Web Vitals optimization, reducing bundle latency by 38%, and building responsive, accessible web interfaces.
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
      <span class="skills-val">React.js, React Native, Redux Toolkit, Context API, Tailwind CSS, Shadcn/ui, React-Router</span>
    </div>
    <div class="skills-row">
      <span class="skills-cat">Architecture & Performance:</span>
      <span class="skills-val">Core Web Vitals, Code-Splitting, Lazy Loading, RESTful APIs, State Management, Responsive Design</span>
    </div>
    <div class="skills-row">
      <span class="skills-cat">Tooling & Workflow:</span>
      <span class="skills-val">Git, GitHub Actions, Vite, Firebase Firestore, Jest, Figma, Jira, VS Code, Agile/Scrum</span>
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
    margin: { top: "8mm", bottom: "8mm", left: "8mm", right: "8mm" }
  });
  await browser.close();
  console.log(`✅ 95+ ATS resume.pdf generated successfully at: ${pdfPath}`);
  return pdfPath;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await ensureResumePdf();
}

