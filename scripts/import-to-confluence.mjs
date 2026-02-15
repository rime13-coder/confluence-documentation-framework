/**
 * Confluence Documentation Importer (Node.js)
 *
 * Reads markdown templates from the templates/ directory and creates
 * a full page hierarchy in Confluence Cloud via the REST API.
 *
 * Usage:
 *   node scripts/import-to-confluence.mjs
 *
 *   # Dry run (preview without creating pages):
 *   node scripts/import-to-confluence.mjs --dry-run
 *
 *   # Target a specific section only:
 *   node scripts/import-to-confluence.mjs --section 01-project-overview
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Page hierarchy definition ──────────────────────────────────────────────
const PAGE_HIERARCHY = {
  "01-project-overview": {
    title: "01 - Project Overview",
    pages: {
      "project-charter": "Project Charter",
      "stakeholders-raci": "Stakeholders & RACI Matrix",
      "project-glossary": "Project Glossary",
    },
  },
  "02-solution-architecture": {
    title: "02 - Solution Architecture",
    pages: {
      "architecture-overview-hld": "Architecture Overview (HLD)",
      "low-level-design": "Low-Level Design (LLD)",
      "data-architecture": "Data Architecture",
      "integration-architecture": "Integration Architecture",
      "adr-template": "Architecture Decision Records (ADRs)",
    },
  },
  "03-security": {
    title: "03 - Security",
    pages: {
      "threat-model": "Threat Model",
      "security-review-checklist": "Security Review Checklist",
      "data-classification": "Data Classification",
    },
  },
  "04-approval-gates": {
    title: "04 - Approval Gates",
    pages: {
      "gate-1-design-review": "Gate 1 - Design Review",
      "gate-2-architecture-review-board":
        "Gate 2 - Architecture Review Board (ARB)",
      "gate-3-security-review": "Gate 3 - Security Review",
      "gate-4-change-advisory-board":
        "Gate 4 - Change Advisory Board (CAB)",
      "gate-5-go-no-go-checklist": "Gate 5 - Go / No-Go Checklist",
    },
  },
  "05-cicd-pipeline": {
    title: "05 - CI/CD Pipeline",
    pages: {
      "github-actions-overview": "GitHub Actions Overview",
      "build-pipeline": "Build Pipeline",
      "release-pipeline": "Release Pipeline",
      "environment-strategy": "Environment Strategy",
    },
  },
  "06-testing": {
    title: "06 - Testing",
    pages: {
      "test-strategy": "Test Strategy",
      "unit-testing": "Unit Testing",
      "integration-testing": "Integration Testing",
      "performance-testing": "Performance Testing",
      "security-testing": "Security Testing (SAST / DAST)",
      "uat-signoff": "UAT Sign-Off",
    },
  },
  "07-deployment-architecture": {
    title: "07 - Deployment Architecture",
    pages: {
      "azure-infrastructure-overview": "Azure Infrastructure Overview",
      "environment-architecture":
        "Environment Architecture (Dev / Staging / Prod)",
      "infrastructure-as-code": "Infrastructure as Code (IaC)",
      "networking-and-security": "Networking & Security",
      "disaster-recovery": "Disaster Recovery & Business Continuity",
    },
  },
  "08-operations": {
    title: "08 - Operations",
    pages: {
      runbook: "Runbook",
      "monitoring-and-alerting": "Monitoring & Alerting",
      "incident-response-plan": "Incident Response Plan",
      "sla-slo-definitions": "SLA / SLO Definitions",
    },
  },
  "09-release-management": {
    title: "09 - Release Management",
    pages: {
      "release-notes-template": "Release Notes Template",
      "rollback-procedures": "Rollback Procedures",
      "post-deployment-verification": "Post-Deployment Verification",
    },
  },
};

// ── Markdown to Confluence XHTML converter ─────────────────────────────────

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function convertMarkdownToConfluence(md) {
  let html = md;

  // Remove metadata block at top (lines starting with > at the very beginning)
  html = html.replace(/^(>.*\n)+\n*/m, "");

  // Convert fenced code blocks FIRST (before other processing)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const language = lang || "text";
      return (
        `<ac:structured-macro ac:name="code">` +
        `<ac:parameter ac:name="language">${language}</ac:parameter>` +
        `<ac:plain-text-body><![CDATA[${code.trimEnd()}]]></ac:plain-text-body>` +
        `</ac:structured-macro>`
      );
    }
  );

  // Convert HTML comments to info macros
  html = html.replace(
    /<!--\s*([\s\S]*?)\s*-->/g,
    (_, comment) =>
      `<ac:structured-macro ac:name="info">` +
      `<ac:rich-text-body><p>${comment.trim()}</p></ac:rich-text-body>` +
      `</ac:structured-macro>`
  );

  // Convert tables
  html = html.replace(
    /((?:\|.*\|\n)+)/g,
    (tableBlock) => {
      const rows = tableBlock.trim().split("\n").filter((r) => r.trim());
      if (rows.length < 2) return tableBlock;

      // Check if second row is a separator (|---|---|)
      const isSeparator = /^\|[\s\-:]+\|/.test(rows[1]);
      if (!isSeparator) return tableBlock;

      let result = "<table><tbody>";

      // Header row
      const headerCells = rows[0]
        .split("|")
        .filter((c, i, arr) => i > 0 && i < arr.length - 1)
        .map((c) => c.trim());
      result += "<tr>" + headerCells.map((c) => `<th>${processInline(c)}</th>`).join("") + "</tr>";

      // Data rows (skip separator at index 1)
      for (let i = 2; i < rows.length; i++) {
        const cells = rows[i]
          .split("|")
          .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
          .map((c) => c.trim());
        result += "<tr>" + cells.map((c) => `<td>${processInline(c)}</td>`).join("") + "</tr>";
      }

      result += "</tbody></table>\n";
      return result;
    }
  );

  // Process line by line for headers, lists, paragraphs
  const lines = html.split("\n");
  const output = [];
  let inList = false;
  let listType = "";
  let inMacro = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip lines inside code macros
    if (line.includes("<ac:structured-macro")) inMacro = true;
    if (line.includes("</ac:structured-macro>")) {
      inMacro = false;
      output.push(line);
      continue;
    }
    if (inMacro) {
      output.push(line);
      continue;
    }

    // Skip lines that are already HTML (tables, macros)
    if (line.startsWith("<table") || line.startsWith("<tr") || line.startsWith("</table") || line.startsWith("</tbody")) {
      if (inList) {
        output.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
      }
      output.push(line);
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headerMatch) {
      if (inList) {
        output.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
      }
      const level = headerMatch[1].length;
      output.push(`<h${level}>${processInline(headerMatch[2])}</h${level}>`);
      continue;
    }

    // Horizontal rules
    if (/^---+\s*$/.test(line)) {
      if (inList) {
        output.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
      }
      output.push("<hr />");
      continue;
    }

    // Unordered list items
    const ulMatch = line.match(/^(\s*)[-*]\s+(.*)/);
    if (ulMatch) {
      if (!inList || listType !== "ul") {
        if (inList) output.push(listType === "ul" ? "</ul>" : "</ol>");
        output.push("<ul>");
        inList = true;
        listType = "ul";
      }
      output.push(`<li>${processInline(ulMatch[2])}</li>`);
      continue;
    }

    // Ordered list items
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        if (inList) output.push(listType === "ul" ? "</ul>" : "</ol>");
        output.push("<ol>");
        inList = true;
        listType = "ol";
      }
      output.push(`<li>${processInline(olMatch[2])}</li>`);
      continue;
    }

    // Checkbox list items
    const checkMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)/);
    if (checkMatch) {
      if (!inList || listType !== "ul") {
        if (inList) output.push(listType === "ul" ? "</ul>" : "</ol>");
        output.push("<ul>");
        inList = true;
        listType = "ul";
      }
      const checked = checkMatch[1] !== " " ? "✅ " : "⬜ ";
      output.push(`<li>${checked}${processInline(checkMatch[2])}</li>`);
      continue;
    }

    // Empty line — close list if open
    if (line.trim() === "") {
      if (inList) {
        output.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
      }
      continue;
    }

    // Regular paragraph (skip if it looks like table content already processed)
    if (!line.startsWith("<")) {
      if (inList) {
        output.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
      }
      if (line.trim()) {
        output.push(`<p>${processInline(line)}</p>`);
      }
    } else {
      output.push(line);
    }
  }

  if (inList) {
    output.push(listType === "ul" ? "</ul>" : "</ol>");
  }

  return output.join("\n");
}

function processInline(text) {
  if (!text) return "";
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  // Inline code
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Strikethrough
  text = text.replace(/~~(.+?)~~/g, "<del>$1</del>");
  return text;
}

// ── Confluence API client ──────────────────────────────────────────────────

class ConfluenceClient {
  constructor(baseUrl, email, apiToken, spaceKey) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiUrl = `${this.baseUrl}/wiki/rest/api`;
    this.spaceKey = spaceKey;
    this.auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
    this.requestDelay = 300; // ms between requests
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async request(method, endpoint, body = null) {
    await this.sleep(this.requestDelay);
    const url = `${this.apiUrl}/${endpoint}`;
    const options = {
      method,
      headers: {
        Authorization: `Basic ${this.auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    const text = await response.text();

    if (!response.ok) {
      console.log(
        `  ERROR [${response.status}]: ${text.substring(0, 300)}`
      );
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async testConnection() {
    const result = await this.request("GET", `space/${this.spaceKey}`);
    if (result) {
      console.log(`  Connected to space: ${result.name || this.spaceKey}`);
      return true;
    }
    console.log(
      "  Failed to connect. Check your base_url, credentials, and space key."
    );
    return false;
  }

  async findPage(title) {
    const params = new URLSearchParams({
      spaceKey: this.spaceKey,
      title,
      type: "page",
      expand: "version",
    });
    const result = await this.request("GET", `content?${params}`);
    if (result && result.results && result.results.length > 0) {
      return result.results[0];
    }
    return null;
  }

  async createPage(title, bodyHtml, parentId = null) {
    const data = {
      type: "page",
      title,
      space: { key: this.spaceKey },
      body: {
        storage: { value: bodyHtml, representation: "storage" },
      },
    };
    if (parentId) data.ancestors = [{ id: parentId }];
    return this.request("POST", "content", data);
  }

  async updatePage(pageId, title, bodyHtml, version) {
    const data = {
      type: "page",
      title,
      version: { number: version + 1 },
      body: {
        storage: { value: bodyHtml, representation: "storage" },
      },
    };
    return this.request("PUT", `content/${pageId}`, data);
  }
}

// ── Config loader ──────────────────────────────────────────────────────────

function loadConfig(configPath) {
  if (!existsSync(configPath)) {
    console.log(`Config file not found: ${configPath}`);
    console.log(
      "Copy scripts/config.json.example to scripts/config.json and fill in your details."
    );
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(configPath, "utf-8"));

  const required = [
    ["confluence.base_url", config.confluence?.base_url],
    ["confluence.email", config.confluence?.email],
    ["confluence.api_token", config.confluence?.api_token],
    ["space.key", config.space?.key],
    ["project.name", config.project?.name],
  ];

  const missing = required
    .filter(([, val]) => !val || String(val).includes("YOUR_"))
    .map(([name]) => name);

  if (missing.length > 0) {
    console.log(
      `Missing or placeholder values in config: ${missing.join(", ")}`
    );
    console.log("Edit scripts/config.json with your actual Confluence details.");
    process.exit(1);
  }

  return config;
}

// ── Main import function ───────────────────────────────────────────────────

async function runImport(configPath, dryRun, sectionFilter) {
  const config = loadConfig(configPath);
  const { confluence } = config;
  const spaceKey = config.space.key;
  const projectName = config.project.name;
  const templatesDir = join(__dirname, "..", "templates");

  if (!existsSync(templatesDir)) {
    console.log(`Templates directory not found: ${templatesDir}`);
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("Confluence Documentation Importer");
  console.log("=".repeat(60));
  console.log(`  Space:   ${spaceKey}`);
  console.log(`  Project: ${projectName}`);
  console.log(`  Mode:    ${dryRun ? "DRY RUN" : "LIVE"}`);
  if (sectionFilter) console.log(`  Filter:  ${sectionFilter}`);
  console.log("=".repeat(60));

  let client;
  if (!dryRun) {
    client = new ConfluenceClient(
      confluence.base_url,
      confluence.email,
      confluence.api_token,
      spaceKey
    );
    console.log("\nTesting connection...");
    if (!(await client.testConnection())) process.exit(1);
  }

  // Step 1: Create or find root page
  const projectTitle = `${projectName} - Documentation`;
  console.log(`\n[ROOT] ${projectTitle}`);

  let rootId = null;
  if (!dryRun) {
    const existing = await client.findPage(projectTitle);
    if (existing) {
      rootId = existing.id;
      console.log(`  Found existing page (id: ${rootId})`);
    } else {
      const rootBody =
        `<h1>Project Documentation</h1>` +
        `<p>Documentation hub for <strong>${projectName}</strong>.</p>` +
        `<p>Navigate to the child pages below for detailed documentation.</p>` +
        `<ac:structured-macro ac:name="children">` +
        `<ac:parameter ac:name="all">true</ac:parameter>` +
        `</ac:structured-macro>`;
      const page = await client.createPage(projectTitle, rootBody);
      if (page) {
        rootId = page.id;
        console.log(`  Created (id: ${rootId})`);
      } else {
        console.log("  FAILED to create root page. Aborting.");
        process.exit(1);
      }
    }
  }

  // Step 2: Create sections and child pages
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const [folderName, section] of Object.entries(PAGE_HIERARCHY)) {
    if (sectionFilter && !folderName.includes(sectionFilter)) continue;

    const sectionTitle = `${projectName} - ${section.title}`;
    console.log(`\n[SECTION] ${sectionTitle}`);

    let sectionId = null;
    if (!dryRun) {
      const existing = await client.findPage(sectionTitle);
      if (existing) {
        sectionId = existing.id;
        console.log(`  Found existing section page (id: ${sectionId})`);
      } else {
        const sectionBody =
          `<h1>${section.title}</h1>` +
          `<ac:structured-macro ac:name="children">` +
          `<ac:parameter ac:name="all">true</ac:parameter>` +
          `</ac:structured-macro>`;
        const page = await client.createPage(
          sectionTitle,
          sectionBody,
          rootId
        );
        if (page) {
          sectionId = page.id;
          console.log(`  Created (id: ${sectionId})`);
          totalCreated++;
        } else {
          console.log("  FAILED to create section. Skipping children.");
          continue;
        }
      }
    }

    // Create child pages
    for (const [fileStem, pageTitle] of Object.entries(section.pages)) {
      const fullTitle = `${projectName} - ${pageTitle}`;
      const mdPath = join(templatesDir, folderName, `${fileStem}.md`);

      if (!existsSync(mdPath)) {
        console.log(
          `  [SKIP] ${pageTitle} (file not found: ${fileStem}.md)`
        );
        totalSkipped++;
        continue;
      }

      const mdContent = readFileSync(mdPath, "utf-8");
      const htmlBody = convertMarkdownToConfluence(mdContent);

      if (dryRun) {
        console.log(
          `  [DRY RUN] ${fullTitle} (${htmlBody.length} chars)`
        );
        totalCreated++;
        continue;
      }

      const existing = await client.findPage(fullTitle);
      if (existing) {
        const pageId = existing.id;
        const version = existing.version.number;
        const result = await client.updatePage(
          pageId,
          fullTitle,
          htmlBody,
          version
        );
        if (result) {
          console.log(`  [UPDATED] ${pageTitle} (v${version + 1})`);
          totalUpdated++;
        } else {
          console.log(`  [FAILED]  ${pageTitle}`);
        }
      } else {
        const page = await client.createPage(
          fullTitle,
          htmlBody,
          sectionId
        );
        if (page) {
          console.log(`  [CREATED] ${pageTitle} (id: ${page.id})`);
          totalCreated++;
        } else {
          console.log(`  [FAILED]  ${pageTitle}`);
        }
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Import Complete");
  console.log("=".repeat(60));
  console.log(`  Created:  ${totalCreated}`);
  console.log(`  Updated:  ${totalUpdated}`);
  console.log(`  Skipped:  ${totalSkipped}`);
  if (!dryRun) {
    console.log(
      `\n  View your space: ${confluence.base_url}/wiki/spaces/${spaceKey}`
    );
  }
  console.log();
}

// ── CLI argument parsing ───────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sectionIdx = args.indexOf("--section");
const sectionFilter = sectionIdx !== -1 ? args[sectionIdx + 1] : null;
const configIdx = args.indexOf("--config");
const configPath =
  configIdx !== -1
    ? args[configIdx + 1]
    : join(__dirname, "config.json");

runImport(configPath, dryRun, sectionFilter);
