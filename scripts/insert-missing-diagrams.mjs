/**
 * Insert missing diagrams into Confluence pages.
 *
 * For each target page, checks which diagram PNGs are already embedded
 * and inserts any missing ones after the first <h1> tag.
 *
 * Usage:
 *   node scripts/insert-missing-diagrams.mjs
 *   node scripts/insert-missing-diagrams.mjs --dry-run
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, "config.json");

// ── Which diagrams belong on which page ──────────────────────────────────
const PAGE_DIAGRAMS = {
  "CMMC Assessor Platform - Architecture Overview (HLD)": [
    { file: "01-system-context.png", title: "System Context Diagram (C4 Level 1)" },
    { file: "02-container-diagram.png", title: "Container Diagram (C4 Level 2)" },
  ],
  "CMMC Assessor Platform - Low-Level Design (LLD)": [
    { file: "03-backend-components.png", title: "Backend Component Diagram" },
  ],
  "CMMC Assessor Platform - Integration Architecture": [
    { file: "04-auth-login-sequence.png", title: "Entra ID Login Sequence" },
    { file: "07-integration-landscape.png", title: "Integration Landscape" },
    { file: "13-graph-api-token-refresh.png", title: "Graph API Token Refresh Sequence" },
  ],
  "CMMC Assessor Platform - Data Architecture": [
    { file: "05-entity-relationship.png", title: "Entity-Relationship Diagram (22 Models)" },
    { file: "06-data-flow.png", title: "Data Flow Diagram" },
  ],
  "CMMC Assessor Platform - Azure Infrastructure Overview": [
    { file: "08-azure-infrastructure.png", title: "Azure Infrastructure Resources" },
  ],
  "CMMC Assessor Platform - Networking & Security": [
    { file: "09-network-architecture.png", title: "Network Architecture (Current vs Target)" },
  ],
  "CMMC Assessor Platform - Environment Architecture (Dev / Staging / Prod)": [
    { file: "10-environment-topology.png", title: "Environment Topology" },
  ],
  "CMMC Assessor Platform - Build Pipeline": [
    { file: "11-ci-pipeline.png", title: "CI Pipeline Flow" },
  ],
  "CMMC Assessor Platform - Release Pipeline": [
    { file: "12-cd-pipeline.png", title: "CD Pipeline Flow" },
  ],
};

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
    if (result?.results?.length > 0) return result.results[0];
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

// ── Helpers ──────────────────────────────────────────────────────────────

function buildImageBlock(diagrams) {
  return diagrams
    .map(
      (d) =>
        `<h2>${d.title}</h2>` +
        `<ac:image ac:width="900">` +
        `<ri:attachment ri:filename="${d.file}" />` +
        `</ac:image>`
    )
    .join("\n");
}

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
  console.log("Insert Missing Diagrams into Confluence Pages");
  console.log("=".repeat(60));
  console.log(`  Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  const config = loadConfig();
  const client = new ConfluenceClient(
    config.confluence.base_url,
    config.confluence.email,
    config.confluence.api_token,
    config.space.key
  );

  let pagesUpdated = 0;
  let diagramsInserted = 0;

  for (const [pageTitle, diagrams] of Object.entries(PAGE_DIAGRAMS)) {
    console.log(`\n  Page: "${pageTitle}"`);

    const page = await client.findPage(pageTitle);
    if (!page) {
      console.log(`    NOT FOUND — skipping`);
      continue;
    }

    const pageId = page.id;
    const version = page.version.number;
    const body = page.body?.storage?.value || "";

    // Check which diagrams are already embedded
    const missing = diagrams.filter(
      (d) => !body.includes(`ri:filename="${d.file}"`)
    );

    if (missing.length === 0) {
      console.log(`    All ${diagrams.length} diagram(s) already present — skipping`);
      continue;
    }

    console.log(
      `    Missing ${missing.length}/${diagrams.length}: ${missing.map((d) => d.file).join(", ")}`
    );

    // Insert after the first </h1> tag
    const imageHtml = buildImageBlock(missing);
    let newBody;

    const h1CloseIdx = body.indexOf("</h1>");
    if (h1CloseIdx !== -1) {
      const insertAt = h1CloseIdx + "</h1>".length;
      newBody =
        body.substring(0, insertAt) +
        "\n" +
        imageHtml +
        "\n" +
        body.substring(insertAt);
    } else {
      // No <h1> found — prepend at the top
      newBody = imageHtml + "\n" + body;
    }

    if (dryRun) {
      console.log(`    [DRY RUN] Would insert ${missing.length} diagram(s)`);
      pagesUpdated++;
      diagramsInserted += missing.length;
      continue;
    }

    const result = await client.updatePage(pageId, pageTitle, newBody, version);
    if (result) {
      console.log(`    ✓ Updated (v${version + 1}) — inserted ${missing.length} diagram(s)`);
      pagesUpdated++;
      diagramsInserted += missing.length;
    } else {
      console.error(`    ✗ Update failed`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Done — ${pagesUpdated} pages updated, ${diagramsInserted} diagrams inserted`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
