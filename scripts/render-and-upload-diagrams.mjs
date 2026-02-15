/**
 * Render Mermaid diagrams to PNG and upload to Confluence pages.
 *
 * Usage:
 *   node scripts/render-and-upload-diagrams.mjs                # render + upload all
 *   node scripts/render-and-upload-diagrams.mjs --render-only  # render PNGs only (no upload)
 *   node scripts/render-and-upload-diagrams.mjs --dry-run      # show what would happen
 *   node scripts/render-and-upload-diagrams.mjs --diagram 01   # process single diagram by prefix
 *
 * Prerequisites:
 *   npm install -g @mermaid-js/mermaid-cli   (or use npx)
 *   scripts/config.json must exist with Confluence credentials
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIAGRAMS_DIR = join(ROOT, "diagrams");
const CONFIG_PATH = join(__dirname, "config.json");

// ── Diagram → Confluence page mapping ────────────────────────────────────────
// Keys are .mmd filenames (without extension), values are exact Confluence page titles.
const DIAGRAM_PAGE_MAP = {
  "01-system-context": {
    page: "CMMC Assessor Platform - Architecture Overview (HLD)",
    title: "System Context Diagram (C4 Level 1)",
  },
  "02-container-diagram": {
    page: "CMMC Assessor Platform - Architecture Overview (HLD)",
    title: "Container Diagram (C4 Level 2)",
  },
  "03-backend-components": {
    page: "CMMC Assessor Platform - Low-Level Design (LLD)",
    title: "Backend Component Diagram",
  },
  "04-auth-login-sequence": {
    page: "CMMC Assessor Platform - Integration Architecture",
    title: "Entra ID Login Sequence",
  },
  "05-entity-relationship": {
    page: "CMMC Assessor Platform - Data Architecture",
    title: "Entity-Relationship Diagram (22 Models)",
  },
  "06-data-flow": {
    page: "CMMC Assessor Platform - Data Architecture",
    title: "Data Flow Diagram",
  },
  "07-integration-landscape": {
    page: "CMMC Assessor Platform - Integration Architecture",
    title: "Integration Landscape",
  },
  "08-azure-infrastructure": {
    page: "CMMC Assessor Platform - Azure Infrastructure Overview",
    title: "Azure Infrastructure Resources",
  },
  "09-network-architecture": {
    page: "CMMC Assessor Platform - Networking & Security",
    title: "Network Architecture (Current vs Target)",
  },
  "10-environment-topology": {
    page: "CMMC Assessor Platform - Environment Architecture (Dev / Staging / Prod)",
    title: "Environment Topology",
  },
  "11-ci-pipeline": {
    page: "CMMC Assessor Platform - Build Pipeline",
    title: "CI Pipeline Flow",
  },
  "12-cd-pipeline": {
    page: "CMMC Assessor Platform - Release Pipeline",
    title: "CD Pipeline Flow",
  },
  "13-graph-api-token-refresh": {
    page: "CMMC Assessor Platform - Integration Architecture",
    title: "Graph API Token Refresh Sequence",
  },
};

// ── Confluence API client (attachment-aware) ─────────────────────────────────

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

  async request(method, endpoint, body = null, headers = {}) {
    await this.sleep(this.requestDelay);
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.apiUrl}/${endpoint}`;
    const options = {
      method,
      headers: {
        Authorization: `Basic ${this.auth}`,
        Accept: "application/json",
        ...headers,
      },
    };
    if (body) {
      if (body instanceof FormData) {
        // Let fetch set the content-type with boundary for multipart
        options.body = body;
      } else {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
      }
    }

    const response = await fetch(url, options);
    const text = await response.text();

    if (!response.ok) {
      console.error(`  ERROR [${response.status}]: ${text.substring(0, 300)}`);
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

  async uploadAttachment(pageId, filePath, fileName) {
    // Confluence attachment upload uses multipart/form-data.
    // Node.js 18+ supports native FormData + Blob, but for file uploads
    // we use the raw approach with fetch and custom boundary.
    const fileData = readFileSync(filePath);
    const boundary = `----FormBoundary${Date.now()}`;
    const CRLF = "\r\n";

    const bodyParts = [
      `--${boundary}${CRLF}`,
      `Content-Disposition: form-data; name="file"; filename="${fileName}"${CRLF}`,
      `Content-Type: image/png${CRLF}${CRLF}`,
    ];
    const bodyStart = Buffer.from(bodyParts.join(""));
    const bodyEnd = Buffer.from(`${CRLF}--${boundary}--${CRLF}`);
    const fullBody = Buffer.concat([bodyStart, fileData, bodyEnd]);

    await this.sleep(this.requestDelay);
    const url = `${this.apiUrl}/content/${pageId}/child/attachment`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${this.auth}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "X-Atlassian-Token": "nocheck",
      },
      body: fullBody,
    });

    const text = await response.text();
    if (!response.ok) {
      console.error(`  UPLOAD ERROR [${response.status}]: ${text.substring(0, 300)}`);
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
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

// ── Rendering ────────────────────────────────────────────────────────────────

function renderDiagram(mmdPath, pngPath) {
  const cmd = `npx -y @mermaid-js/mermaid-cli -i "${mmdPath}" -o "${pngPath}" -b white -w 2048 -s 2 -q`;
  console.log(`  Rendering: ${basename(mmdPath)} → ${basename(pngPath)}`);
  try {
    execSync(cmd, { cwd: ROOT, stdio: "pipe", timeout: 60000 });
    return true;
  } catch (err) {
    console.error(`  RENDER FAILED: ${basename(mmdPath)}`);
    console.error(`  ${err.stderr?.toString().substring(0, 500) || err.message}`);
    return false;
  }
}

// ── Embed image macro builder ────────────────────────────────────────────────

function buildImageMacro(fileName, diagramTitle) {
  return (
    `<h2>${diagramTitle}</h2>` +
    `<ac:image ac:width="900">` +
    `<ri:attachment ri:filename="${fileName}" />` +
    `</ac:image>`
  );
}

// ── Config loader ────────────────────────────────────────────────────────────

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    console.error(`Config not found: ${CONFIG_PATH}`);
    console.error("Copy config.json.example to config.json and fill in credentials.");
    process.exit(1);
  }
  const config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  if (
    !config.confluence?.base_url ||
    !config.confluence?.email ||
    !config.confluence?.api_token ||
    !config.space?.key
  ) {
    console.error("Incomplete config.json — need confluence.base_url, email, api_token, space.key");
    process.exit(1);
  }
  return config;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const renderOnly = args.includes("--render-only");
  const diagramFilterIdx = args.indexOf("--diagram");
  const diagramFilter = diagramFilterIdx !== -1 ? args[diagramFilterIdx + 1] : null;

  console.log("=".repeat(60));
  console.log("Mermaid Diagram Renderer & Confluence Uploader");
  console.log("=".repeat(60));
  console.log(`  Mode: ${dryRun ? "DRY RUN" : renderOnly ? "RENDER ONLY" : "RENDER + UPLOAD"}`);
  if (diagramFilter) console.log(`  Filter: ${diagramFilter}`);
  console.log("=".repeat(60));

  // Discover .mmd files
  const mmdFiles = readdirSync(DIAGRAMS_DIR)
    .filter((f) => f.endsWith(".mmd"))
    .filter((f) => !diagramFilter || f.startsWith(diagramFilter))
    .sort();

  if (mmdFiles.length === 0) {
    console.log("No .mmd files found in diagrams/");
    process.exit(1);
  }

  console.log(`\nFound ${mmdFiles.length} diagram(s) to process.\n`);

  // Phase 1: Render all diagrams to PNG
  console.log("── Phase 1: Render ──────────────────────────────────────");
  let rendered = 0;
  let renderFailed = 0;

  for (const mmdFile of mmdFiles) {
    const stem = mmdFile.replace(".mmd", "");
    const mmdPath = join(DIAGRAMS_DIR, mmdFile);
    const pngPath = join(DIAGRAMS_DIR, `${stem}.png`);

    if (dryRun) {
      console.log(`  [DRY RUN] Would render: ${mmdFile} → ${stem}.png`);
      rendered++;
      continue;
    }

    if (renderDiagram(mmdPath, pngPath)) {
      rendered++;
    } else {
      renderFailed++;
    }
  }

  console.log(`\n  Rendered: ${rendered} | Failed: ${renderFailed}\n`);

  if (renderOnly || dryRun) {
    console.log(renderOnly ? "Render-only mode — skipping upload." : "Dry run complete.");
    return;
  }

  if (renderFailed > 0) {
    console.log("Some diagrams failed to render. Fix errors before uploading.");
    process.exit(1);
  }

  // Phase 2: Upload to Confluence
  console.log("── Phase 2: Upload to Confluence ────────────────────────");
  const config = loadConfig();
  const client = new ConfluenceClient(
    config.confluence.base_url,
    config.confluence.email,
    config.confluence.api_token,
    config.space.key
  );

  // Group diagrams by target page to batch updates
  const pageGroups = {};
  for (const mmdFile of mmdFiles) {
    const stem = mmdFile.replace(".mmd", "");
    const mapping = DIAGRAM_PAGE_MAP[stem];
    if (!mapping) {
      console.log(`  [SKIP] ${stem} — no page mapping defined`);
      continue;
    }
    if (!pageGroups[mapping.page]) {
      pageGroups[mapping.page] = [];
    }
    pageGroups[mapping.page].push({ stem, ...mapping });
  }

  let uploaded = 0;
  let uploadFailed = 0;
  let pagesUpdated = 0;

  for (const [pageTitle, diagrams] of Object.entries(pageGroups)) {
    console.log(`\n  Page: "${pageTitle}"`);

    // Find the page
    const page = await client.findPage(pageTitle);
    if (!page) {
      console.error(`    Page NOT FOUND: "${pageTitle}" — skipping ${diagrams.length} diagram(s)`);
      uploadFailed += diagrams.length;
      continue;
    }

    const pageId = page.id;
    const version = page.version.number;
    console.log(`    Found page (id: ${pageId}, v${version})`);

    // Upload each diagram as an attachment
    const imageMacros = [];
    for (const diagram of diagrams) {
      const pngFile = `${diagram.stem}.png`;
      const pngPath = join(DIAGRAMS_DIR, pngFile);

      if (!existsSync(pngPath)) {
        console.error(`    PNG not found: ${pngFile}`);
        uploadFailed++;
        continue;
      }

      console.log(`    Uploading: ${pngFile}`);
      const result = await client.uploadAttachment(pageId, pngPath, pngFile);
      if (result) {
        console.log(`    ✓ Attached: ${pngFile}`);
        uploaded++;
        imageMacros.push(buildImageMacro(pngFile, diagram.title));
      } else {
        console.error(`    ✗ Failed: ${pngFile}`);
        uploadFailed++;
      }
    }

    // Update page body to embed the images
    if (imageMacros.length > 0) {
      const existingBody = page.body?.storage?.value || "";

      // Build the diagram section
      const diagramSection =
        `<h1>Architecture Diagrams</h1>` +
        imageMacros.join("\n");

      // Check if diagrams section already exists and replace, or append
      let newBody;
      const diagramSectionRegex =
        /<h1>Architecture Diagrams<\/h1>[\s\S]*$/;
      if (diagramSectionRegex.test(existingBody)) {
        newBody = existingBody.replace(diagramSectionRegex, diagramSection);
      } else {
        newBody = existingBody + "\n" + diagramSection;
      }

      console.log(`    Updating page body to embed ${imageMacros.length} diagram(s)...`);
      const updateResult = await client.updatePage(pageId, pageTitle, newBody, version);
      if (updateResult) {
        console.log(`    ✓ Page updated (v${version + 1})`);
        pagesUpdated++;
      } else {
        console.error(`    ✗ Page update failed`);
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Upload Complete");
  console.log("=".repeat(60));
  console.log(`  Diagrams rendered:  ${rendered}`);
  console.log(`  Attachments uploaded: ${uploaded}`);
  console.log(`  Upload failures:    ${uploadFailed}`);
  console.log(`  Pages updated:      ${pagesUpdated}`);
  console.log(
    `\n  View space: ${config.confluence.base_url}/wiki/spaces/${config.space.key}`
  );
  console.log();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
