/**
 * ISO 27001 Compliance Documentation — Confluence Importer
 *
 * Reads markdown files from the ISO27001Compliance directory and creates
 * a full page hierarchy in the ISO27001 Confluence space.
 *
 * Usage:
 *   node scripts/import-iso27001-to-confluence.mjs
 *   node scripts/import-iso27001-to-confluence.mjs --dry-run
 *   node scripts/import-iso27001-to-confluence.mjs --section 03-user-stories
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, "config-iso27001.json");

// ── Page hierarchy — maps source files to Confluence sections ────────────

const PAGE_HIERARCHY = {
  "01-project-planning": {
    title: "01 - Project Planning",
    pages: [
      {
        file: "project-plan/MASTER-PROJECT-PLAN.md",
        title: "Master Project Plan",
      },
    ],
  },
  "02-product-requirements": {
    title: "02 - Product Requirements",
    pages: [
      {
        file: "requirements/README.md",
        title: "Requirements Overview",
      },
      {
        file: "requirements/product-definition.md",
        title: "Product Definition",
      },
      {
        file: "requirements/dev-team-handoff.md",
        title: "Developer Team Handoff",
      },
      {
        file: "requirements/epics/epics-overview.md",
        title: "Epics Overview",
      },
      {
        file: "requirements/non-functional/nfr-complete.md",
        title: "Non-Functional Requirements",
      },
      {
        file: "requirements/non-functional/definition-of-done.md",
        title: "Definition of Done",
      },
    ],
  },
  "03-user-stories": {
    title: "03 - User Stories",
    pages: [
      {
        file: "requirements/user-stories/E1.1-platform-foundation.md",
        title: "E1.1 - Platform Foundation",
      },
      {
        file: "requirements/user-stories/E1.2-organization-scope.md",
        title: "E1.2 - Organization & Scope",
      },
      {
        file: "requirements/user-stories/E1.3-risk-management.md",
        title: "E1.3 - Risk Management",
      },
      {
        file: "requirements/user-stories/E1.4-statement-of-applicability.md",
        title: "E1.4 - Statement of Applicability",
      },
      {
        file: "requirements/user-stories/E1.5-document-evidence.md",
        title: "E1.5 - Document & Evidence Management",
      },
      {
        file: "requirements/user-stories/E1.6-compliance-dashboard.md",
        title: "E1.6 - Compliance Dashboard",
      },
    ],
  },
  "04-release-planning": {
    title: "04 - Release Planning",
    pages: [
      {
        file: "requirements/backlog/release1-backlog.md",
        title: "Release 1 Backlog",
      },
      {
        file: "requirements/backlog/release2-roadmap.md",
        title: "Release 2 Roadmap",
      },
    ],
  },
  "05-iso27001-framework": {
    title: "05 - ISO 27001 Framework",
    pages: [
      {
        file: "research-planning/01-business-requirements/business-objectives.md",
        title: "Business Objectives",
      },
      {
        file: "research-planning/02-iso27001-framework/clause-mapping.md",
        title: "Clause Mapping",
      },
      {
        file: "research-planning/02-iso27001-framework/annex-a-controls.md",
        title: "Annex A Controls Reference",
      },
      {
        file: "research-planning/02-iso27001-framework/required-documentation.md",
        title: "Required Documentation",
      },
      {
        file: "research-planning/02-iso27001-framework/compliance-logic.md",
        title: "Compliance Logic",
      },
    ],
  },
  "06-feature-specifications": {
    title: "06 - Feature Specifications",
    pages: [
      {
        file: "research-planning/README.md",
        title: "Research & Planning Overview",
      },
      {
        file: "research-planning/03-feature-specifications/modules-overview.md",
        title: "Modules Overview",
      },
      {
        file: "research-planning/03-feature-specifications/differentiators.md",
        title: "Differentiators",
      },
    ],
  },
  "07-data-model-architecture": {
    title: "07 - Data Model & Architecture",
    pages: [
      {
        file: "research-planning/04-data-model/core-entities.md",
        title: "Core Entities & Data Model",
      },
      {
        file: "research-planning/05-user-journeys/key-workflows.md",
        title: "Key Workflows",
      },
      {
        file: "research-planning/06-architecture/technical-decisions.md",
        title: "Technical Decisions",
      },
    ],
  },
  "08-tech-stack": {
    title: "08 - Tech Stack",
    pages: [
      {
        file: "tech-stack/README.md",
        title: "Tech Stack Overview",
      },
      {
        file: "tech-stack/stack-decisions.md",
        title: "Stack Decisions",
      },
      {
        file: "tech-stack/development-environment.md",
        title: "Development Environment",
      },
    ],
  },
  "09-security-requirements": {
    title: "09 - Security Requirements",
    pages: [
      {
        file: "security-requirements/README.md",
        title: "Security Requirements Overview",
      },
      {
        file: "security-requirements/SECURITY-IMPLEMENTATION-MANDATE.md",
        title: "Security Implementation Mandate",
      },
      {
        file: "security-requirements/01-security-governance/security-governance.md",
        title: "Security Governance",
      },
      {
        file: "security-requirements/02-threat-model/threat-model.md",
        title: "Threat Model",
      },
      {
        file: "security-requirements/03-application-security/application-security.md",
        title: "Application Security",
      },
      {
        file: "security-requirements/04-infrastructure-security/infrastructure-security.md",
        title: "Infrastructure Security",
      },
      {
        file: "security-requirements/05-data-protection/data-protection.md",
        title: "Data Protection",
      },
      {
        file: "security-requirements/06-identity-access/identity-access-management.md",
        title: "Identity & Access Management",
      },
      {
        file: "security-requirements/07-security-operations/security-operations.md",
        title: "Security Operations",
      },
      {
        file: "security-requirements/08-incident-response/incident-response.md",
        title: "Incident Response",
      },
      {
        file: "security-requirements/09-sdlc-security/secure-sdlc.md",
        title: "Secure SDLC",
      },
      {
        file: "security-requirements/10-third-party-security/third-party-security.md",
        title: "Third-Party Security",
      },
      {
        file: "security-requirements/11-compliance-testing/compliance-testing.md",
        title: "Compliance Testing",
      },
      {
        file: "security-requirements/12-security-metrics/security-metrics.md",
        title: "Security Metrics",
      },
    ],
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

      const isSeparator = /^\|[\s\-:]+\|/.test(rows[1]);
      if (!isSeparator) return tableBlock;

      let result = "<table><tbody>";

      const headerCells = rows[0]
        .split("|")
        .filter((c, i, arr) => i > 0 && i < arr.length - 1)
        .map((c) => c.trim());
      result +=
        "<tr>" +
        headerCells.map((c) => `<th>${processInline(c)}</th>`).join("") +
        "</tr>";

      for (let i = 2; i < rows.length; i++) {
        const cells = rows[i]
          .split("|")
          .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
          .map((c) => c.trim());
        result +=
          "<tr>" +
          cells.map((c) => `<td>${processInline(c)}</td>`).join("") +
          "</tr>";
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
    if (
      line.startsWith("<table") ||
      line.startsWith("<tr") ||
      line.startsWith("</table") ||
      line.startsWith("</tbody")
    ) {
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
      output.push(
        `<h${level}>${processInline(headerMatch[2])}</h${level}>`
      );
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

    // Checkbox list items
    const checkMatch = line.match(/^(\s*)[-*]\s+\[([ xX])\]\s+(.*)/);
    if (checkMatch) {
      if (!inList || listType !== "ul") {
        if (inList) output.push(listType === "ul" ? "</ul>" : "</ol>");
        output.push("<ul>");
        inList = true;
        listType = "ul";
      }
      const checked = checkMatch[2] !== " " ? "✅ " : "⬜ ";
      output.push(`<li>${checked}${processInline(checkMatch[3])}</li>`);
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

    // Empty line — close list if open
    if (line.trim() === "") {
      if (inList) {
        output.push(listType === "ul" ? "</ul>" : "</ol>");
        inList = false;
      }
      continue;
    }

    // Regular paragraph
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

// ── Confluence API client ──────────────────────────────────────────────────

class ConfluenceClient {
  constructor(baseUrl, email, apiToken, spaceKey) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiUrl = `${this.baseUrl}/wiki/rest/api`;
    this.spaceKey = spaceKey;
    this.auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
    this.requestDelay = 300;
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
    process.exit(1);
  }

  return config;
}

// ── Main import function ───────────────────────────────────────────────────

async function runImport(dryRun, sectionFilter) {
  const config = loadConfig(CONFIG_PATH);
  const { confluence } = config;
  const spaceKey = config.space.key;
  const projectName = config.project.name;
  const sourceDir = config.source_dir;

  if (!existsSync(sourceDir)) {
    console.log(`Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("ISO 27001 Compliance — Confluence Importer");
  console.log("=".repeat(60));
  console.log(`  Space:   ${spaceKey}`);
  console.log(`  Project: ${projectName}`);
  console.log(`  Source:  ${sourceDir}`);
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
  const rootTitle = `${projectName} - Documentation`;
  console.log(`\n[ROOT] ${rootTitle}`);

  let rootId = null;
  if (!dryRun) {
    const existing = await client.findPage(rootTitle);
    if (existing) {
      rootId = existing.id;
      console.log(`  Found existing page (id: ${rootId})`);
    } else {
      const rootBody =
        `<h1>${projectName} — SecureComply Platform</h1>` +
        `<p>Complete documentation for the ISO 27001:2022 GRC platform — <strong>SecureComply</strong>.</p>` +
        `<p>Navigate to the sections below for project planning, requirements, ISO 27001 framework reference, feature specifications, architecture, and security requirements.</p>` +
        `<ac:structured-macro ac:name="children">` +
        `<ac:parameter ac:name="all">true</ac:parameter>` +
        `</ac:structured-macro>`;
      const page = await client.createPage(rootTitle, rootBody);
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

  for (const [sectionKey, section] of Object.entries(PAGE_HIERARCHY)) {
    if (sectionFilter && !sectionKey.includes(sectionFilter)) continue;

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
          console.log(`  Created section (id: ${sectionId})`);
          totalCreated++;
        } else {
          console.log("  FAILED to create section. Skipping children.");
          continue;
        }
      }
    }

    // Create child pages
    for (const pageEntry of section.pages) {
      const fullTitle = `${projectName} - ${pageEntry.title}`;
      const mdPath = join(sourceDir, pageEntry.file);

      if (!existsSync(mdPath)) {
        console.log(
          `  [SKIP] ${pageEntry.title} (file not found: ${pageEntry.file})`
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
          console.log(`  [UPDATED] ${pageEntry.title} (v${version + 1})`);
          totalUpdated++;
        } else {
          console.log(`  [FAILED]  ${pageEntry.title}`);
        }
      } else {
        const page = await client.createPage(
          fullTitle,
          htmlBody,
          sectionId
        );
        if (page) {
          console.log(`  [CREATED] ${pageEntry.title} (id: ${page.id})`);
          totalCreated++;
        } else {
          console.log(`  [FAILED]  ${pageEntry.title}`);
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

// ── CLI ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const sectionIdx = args.indexOf("--section");
const sectionFilter = sectionIdx !== -1 ? args[sectionIdx + 1] : null;

runImport(dryRun, sectionFilter);
