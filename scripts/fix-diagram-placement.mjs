/**
 * Fix diagram placement on Confluence pages.
 *
 * The initial upload appended diagrams at the bottom of each page.
 * This script:
 *   1. Replaces inline placeholder info-macros with <ac:image> tags
 *   2. Removes the duplicate "Architecture Diagrams" section at the bottom
 *
 * Usage:
 *   node scripts/fix-diagram-placement.mjs
 *   node scripts/fix-diagram-placement.mjs --dry-run
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, "config.json");

// ── Mapping: placeholder description keywords → diagram filename ─────────
// Each entry maps a keyword found inside a placeholder info-macro to the
// corresponding PNG attachment filename and a display title for the <h2>.
const PLACEHOLDER_MAP = [
  {
    keywords: ["C4 Level 1", "System Context"],
    file: "01-system-context.png",
    title: "System Context Diagram (C4 Level 1)",
  },
  {
    keywords: ["C4 Level 2", "Container Diagram"],
    file: "02-container-diagram.png",
    title: "Container Diagram (C4 Level 2)",
  },
  {
    keywords: ["Component Diagram", "Backend Component", "Express middleware", "API route controllers"],
    file: "03-backend-components.png",
    title: "Backend Component Diagram",
  },
  {
    keywords: ["Authentication Flow", "Login Flow", "Entra ID flow", "OAuth.*PKCE", "login sequence"],
    file: "04-auth-login-sequence.png",
    title: "Entra ID Login Sequence",
  },
  {
    keywords: ["Entity.Relationship", "ER Diagram", "Prisma models", "data model", "22 tables", "database schema"],
    file: "05-entity-relationship.png",
    title: "Entity-Relationship Diagram (22 Models)",
  },
  {
    keywords: ["Data Flow", "data movement", "data at rest.*transit"],
    file: "06-data-flow.png",
    title: "Data Flow Diagram",
  },
  {
    keywords: ["Integration Landscape", "Integration Map", "external system", "integration point"],
    file: "07-integration-landscape.png",
    title: "Integration Landscape",
  },
  {
    keywords: ["Azure Infrastructure", "Resource Diagram", "Azure resource", "infrastructure overview"],
    file: "08-azure-infrastructure.png",
    title: "Azure Infrastructure Resources",
  },
  {
    keywords: ["Network Architecture", "Network Diagram", "VNet", "network topology", "Current.*Target"],
    file: "09-network-architecture.png",
    title: "Network Architecture (Current vs Target)",
  },
  {
    keywords: ["Environment Topology", "Environment Diagram", "Dev.*Staging.*Prod", "environment promotion"],
    file: "10-environment-topology.png",
    title: "Environment Topology",
  },
  {
    keywords: ["CI Pipeline", "CI Workflow", "ci\\.yml", "build pipeline", "continuous integration"],
    file: "11-ci-pipeline.png",
    title: "CI Pipeline Flow",
  },
  {
    keywords: ["CD Pipeline", "CD Workflow", "cd\\.yml", "release pipeline", "deployment pipeline", "continuous delivery", "continuous deployment"],
    file: "12-cd-pipeline.png",
    title: "CD Pipeline Flow",
  },
  {
    keywords: ["Graph API.*[Tt]oken", "Token Refresh", "SharePoint.*token", "token lifecycle"],
    file: "13-graph-api-token-refresh.png",
    title: "Graph API Token Refresh Sequence",
  },
];

// ── Pages to fix ─────────────────────────────────────────────────────────
const TARGET_PAGES = [
  "CMMC Assessor Platform - Architecture Overview (HLD)",
  "CMMC Assessor Platform - Low-Level Design (LLD)",
  "CMMC Assessor Platform - Integration Architecture",
  "CMMC Assessor Platform - Data Architecture",
  "CMMC Assessor Platform - Azure Infrastructure Overview",
  "CMMC Assessor Platform - Networking & Security",
  "CMMC Assessor Platform - Environment Architecture (Dev / Staging / Prod)",
  "CMMC Assessor Platform - Build Pipeline",
  "CMMC Assessor Platform - Release Pipeline",
];

// ── Confluence client ────────────────────────────────────────────────────

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
      console.error(`  ERROR [${response.status}]: ${text.substring(0, 400)}`);
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async findPage(title) {
    const params = new URLSearchParams({
      spaceKey: this.spaceKey,
      title,
      type: "page",
      expand: "version,body.storage",
    });
    const result = await this.request("GET", `content?${params}`);
    if (result && result.results && result.results.length > 0) {
      return result.results[0];
    }
    return null;
  }

  async updatePage(pageId, title, bodyHtml, version) {
    return this.request("PUT", `content/${pageId}`, {
      type: "page",
      title,
      version: { number: version + 1 },
      body: { storage: { value: bodyHtml, representation: "storage" } },
    });
  }
}

// ── Placeholder replacement logic ────────────────────────────────────────

function buildImageMacro(fileName, diagramTitle) {
  return (
    `<ac:image ac:width="900">` +
    `<ri:attachment ri:filename="${fileName}" />` +
    `</ac:image>`
  );
}

function matchDiagram(infoText) {
  const normalized = infoText.replace(/\s+/g, " ");
  for (const entry of PLACEHOLDER_MAP) {
    for (const kw of entry.keywords) {
      const regex = new RegExp(kw, "i");
      if (regex.test(normalized)) {
        return entry;
      }
    }
  }
  return null;
}

function fixPageBody(body) {
  let modified = body;
  let replacements = 0;

  // Strategy: Find consecutive pairs of info macros where the first says
  // "Insert diagram here" and the second describes the diagram content.
  // Replace BOTH with the <ac:image> tag for the matching diagram.

  // Pattern for info macros (handles optional attributes like ac:macro-id)
  const infoMacroRegex =
    /<ac:structured-macro[^>]*ac:name="info"[^>]*>[\s\S]*?<\/ac:structured-macro>/g;

  // Collect all info macros with their positions
  const macros = [];
  let match;
  while ((match = infoMacroRegex.exec(body)) !== null) {
    // Extract the text content from within the macro
    const textContent = match[0]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    macros.push({
      fullMatch: match[0],
      index: match.index,
      length: match[0].length,
      text: textContent,
    });
  }

  // Process macros in reverse order (so replacements don't shift indices)
  // Look for pairs: "Insert diagram here" followed by a description macro
  const processed = new Set();

  for (let i = 0; i < macros.length; i++) {
    if (processed.has(i)) continue;

    const macro = macros[i];
    const isInsertPlaceholder = /insert diagram here/i.test(macro.text);
    const diagram = matchDiagram(macro.text);

    if (isInsertPlaceholder && i + 1 < macros.length) {
      // This is an "Insert diagram here" macro — check next macro for description
      const nextMacro = macros[i + 1];
      const nextDiagram = matchDiagram(nextMacro.text);

      if (nextDiagram) {
        // Replace both macros with the image
        // Find the span from start of first to end of second, including any whitespace between
        const startIdx = macro.index;
        const endIdx = nextMacro.index + nextMacro.length;
        const span = modified.substring(startIdx, endIdx);
        const replacement = buildImageMacro(nextDiagram.file, nextDiagram.title);

        modified = modified.substring(0, startIdx) + replacement + modified.substring(endIdx);
        // Adjust all subsequent macro positions
        const delta = replacement.length - span.length;
        for (let j = i + 2; j < macros.length; j++) {
          macros[j].index += delta;
        }
        processed.add(i);
        processed.add(i + 1);
        replacements++;
        continue;
      }
    }

    if (isInsertPlaceholder && diagram) {
      // Single macro that is both a placeholder and has identifiable content
      const replacement = buildImageMacro(diagram.file, diagram.title);
      modified =
        modified.substring(0, macro.index) +
        replacement +
        modified.substring(macro.index + macro.length);
      const delta = replacement.length - macro.length;
      for (let j = i + 1; j < macros.length; j++) {
        macros[j].index += delta;
      }
      processed.add(i);
      replacements++;
      continue;
    }

    if (!isInsertPlaceholder && diagram) {
      // Description-only macro (no "Insert diagram here" before it, or it was standalone)
      // Check if previous macro was already processed
      if (i > 0 && processed.has(i - 1)) continue;

      // This is a standalone description — check if previous macro was "Insert diagram here"
      if (i > 0 && /insert diagram here/i.test(macros[i - 1].text) && !processed.has(i - 1)) {
        // Replace both
        const prevMacro = macros[i - 1];
        const startIdx = prevMacro.index;
        const endIdx = macro.index + macro.length;
        const span = modified.substring(startIdx, endIdx);
        const replacement = buildImageMacro(diagram.file, diagram.title);

        modified = modified.substring(0, startIdx) + replacement + modified.substring(endIdx);
        const delta = replacement.length - span.length;
        for (let j = i + 1; j < macros.length; j++) {
          macros[j].index += delta;
        }
        processed.add(i - 1);
        processed.add(i);
        replacements++;
        continue;
      }

      // Standalone description macro — replace just this one
      const replacement = buildImageMacro(diagram.file, diagram.title);
      modified =
        modified.substring(0, macro.index) +
        replacement +
        modified.substring(macro.index + macro.length);
      const delta = replacement.length - macro.length;
      for (let j = i + 1; j < macros.length; j++) {
        macros[j].index += delta;
      }
      processed.add(i);
      replacements++;
    }
  }

  // Also handle any standalone "Insert diagram here" macros that weren't paired
  // (where we couldn't identify which diagram they belong to)
  // Leave these alone — they'll remain as-is.

  // Remove the appended "Architecture Diagrams" section at the bottom
  const appendedSectionRegex =
    /\n?<h1>Architecture Diagrams<\/h1>[\s\S]*$/;
  if (appendedSectionRegex.test(modified)) {
    modified = modified.replace(appendedSectionRegex, "");
    console.log(`    Removed appended "Architecture Diagrams" section`);
  }

  return { body: modified, replacements };
}

// ── Config ───────────────────────────────────────────────────────────────

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`Config not found: ${CONFIG_PATH}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log("=".repeat(60));
  console.log("Fix Diagram Placement on Confluence Pages");
  console.log("=".repeat(60));
  console.log(`  Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  const config = loadConfig();
  const client = new ConfluenceClient(
    config.confluence.base_url,
    config.confluence.email,
    config.confluence.api_token,
    config.space.key
  );

  let pagesFixed = 0;
  let totalReplacements = 0;

  for (const pageTitle of TARGET_PAGES) {
    console.log(`\n  Page: "${pageTitle}"`);

    const page = await client.findPage(pageTitle);
    if (!page) {
      console.log(`    NOT FOUND — skipping`);
      continue;
    }

    const pageId = page.id;
    const version = page.version.number;
    const currentBody = page.body?.storage?.value || "";

    console.log(`    Found (id: ${pageId}, v${version}, ${currentBody.length} chars)`);

    const { body: newBody, replacements } = fixPageBody(currentBody);

    if (newBody === currentBody) {
      console.log(`    No placeholders found — skipping`);
      continue;
    }

    console.log(`    Replaced ${replacements} placeholder(s)`);

    if (dryRun) {
      console.log(`    [DRY RUN] Would update page`);
      pagesFixed++;
      totalReplacements += replacements;
      continue;
    }

    const result = await client.updatePage(pageId, pageTitle, newBody, version);
    if (result) {
      console.log(`    ✓ Updated (v${version + 1})`);
      pagesFixed++;
      totalReplacements += replacements;
    } else {
      console.error(`    ✗ Update failed`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Done — ${pagesFixed} pages fixed, ${totalReplacements} placeholders replaced`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
