/**
 * Update the M365 Assessor Confluence space homepage with a project dashboard.
 *
 * Usage:
 *   node scripts/update-m365-homepage.mjs
 *   node scripts/update-m365-homepage.mjs --dry-run
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIAGRAMS_DIR = join(ROOT, "diagrams");
const CONFIG_PATH = join(__dirname, "config-m365.json");

// ── Dashboard chart attachments ──────────────────────────────────────────
const DASHBOARD_CHARTS = [
  "m365-dashboard-module-status.png",
  "m365-dashboard-findings-severity.png",
  "m365-dashboard-domain-coverage.png",
  "m365-dashboard-dev-timeline.png",
  "m365-dashboard-module-readiness.png",
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

  async getSpaceHomepage() {
    const result = await this.request(
      "GET",
      `space/${this.spaceKey}?expand=homepage.version`
    );
    if (result?.homepage) return result.homepage;
    return null;
  }

  async uploadAttachment(pageId, filePath, fileName) {
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
    return this.request("PUT", `content/${pageId}`, {
      type: "page",
      title,
      version: { number: version + 1 },
      body: { storage: { value: bodyHtml, representation: "storage" } },
    });
  }
}

// ── Dashboard HTML ───────────────────────────────────────────────────────

function buildDashboardHtml() {
  const today = new Date().toISOString().split("T")[0];
  const P = "M365 Security Assessment Automation";

  return `
<ac:structured-macro ac:name="panel" ac:schema-version="1">
<ac:parameter ac:name="bgColor">#1a365d</ac:parameter>
<ac:rich-text-body>
<p style="text-align: center; color: white;"><strong style="font-size: 24px; color: white;">M365 Security Assessment Automation — Project Dashboard</strong></p>
<p style="text-align: center; color: #cbd5e1;">Automated M365 Tenant Security Assessment Tool for DIB Clients | Last updated: ${today}</p>
</ac:rich-text-body>
</ac:structured-macro>

<table>
<tbody>
<tr>
<th style="background-color: #f1f5f9; text-align: center; width: 25%;">Project Phase</th>
<th style="background-color: #f1f5f9; text-align: center; width: 25%;">Overall Status</th>
<th style="background-color: #f1f5f9; text-align: center; width: 25%;">Assessment Coverage</th>
<th style="background-color: #f1f5f9; text-align: center; width: 25%;">Next Milestone</th>
</tr>
<tr>
<td style="text-align: center;"><strong>Phase 4</strong><br/>Definition Expansion</td>
<td style="text-align: center;">
<ac:structured-macro ac:name="status">
<ac:parameter ac:name="title">ON TRACK</ac:parameter>
<ac:parameter ac:name="colour">Green</ac:parameter>
</ac:structured-macro>
<br/>Phases 1-3 complete; Phase 4 in progress</td>
<td style="text-align: center;">
<ac:structured-macro ac:name="status">
<ac:parameter ac:name="title">87 ACTIVE CHECKS</ac:parameter>
<ac:parameter ac:name="colour">Green</ac:parameter>
</ac:structured-macro>
<br/>4 of 8 modules fully automated</td>
<td style="text-align: center;"><strong>Phase 4 Completion</strong><br/>2026-06-30<br/><em>Automate remaining 4 modules</em></td>
</tr>
</tbody>
</table>

<hr />

<h2>Module Implementation Progress</h2>

<ac:image ac:width="800">
<ri:attachment ri:filename="m365-dashboard-module-status.png" />
</ac:image>

<table>
<tbody>
<tr>
<th style="background-color: #f1f5f9;">Module</th>
<th style="background-color: #f1f5f9;">Domain</th>
<th style="background-color: #f1f5f9;">Checks</th>
<th style="background-color: #f1f5f9;">Status</th>
<th style="background-color: #f1f5f9;">Phase</th>
<th style="background-color: #f1f5f9;">Notes</th>
</tr>
<tr>
<td><strong>EntraID</strong></td>
<td>Identity &amp; Access Management</td>
<td>39</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">AUTOMATED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>Phase 1</td>
<td>MFA, Conditional Access, PIM, Break Glass, Guest Access, Auth Methods</td>
</tr>
<tr>
<td><strong>DeviceManagement</strong></td>
<td>Device Security</td>
<td>18</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">AUTOMATED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>Phase 2</td>
<td>Intune compliance, security baselines, Defender status, driver updates</td>
</tr>
<tr>
<td><strong>EmailProtection</strong></td>
<td>Mail Protection</td>
<td>13</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">AUTOMATED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>Phase 3</td>
<td>SPF, DKIM, DMARC, anti-spam, anti-phishing, Safe Links/Attachments</td>
</tr>
<tr>
<td><strong>TeamsSharePoint</strong></td>
<td>Collaboration Security</td>
<td>17</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">AUTOMATED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>Phase 3</td>
<td>Meeting/messaging policies, external access, app permissions, sharing</td>
</tr>
<tr>
<td><strong>ApplicationProtection</strong></td>
<td>Application Security</td>
<td>7</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DEFINITION ONLY</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>Phase 4</td>
<td>App governance, OAuth app reviews — automation pending</td>
</tr>
<tr>
<td><strong>DataProtection</strong></td>
<td>Data Loss Prevention</td>
<td>—</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DEFINITION ONLY</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>Phase 4</td>
<td>DLP policies, sensitivity labels — automation pending</td>
</tr>
<tr>
<td><strong>VulnerabilityManagement</strong></td>
<td>Vulnerability &amp; Threat</td>
<td>—</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DEFINITION ONLY</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>Phase 4</td>
<td>Sentinel alerts, vulnerability scanning — automation pending</td>
</tr>
<tr>
<td><strong>FinSecOps</strong></td>
<td>Financial Security Ops</td>
<td>—</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DEFINITION ONLY</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>Phase 4</td>
<td>License management, cost governance — automation pending</td>
</tr>
</tbody>
</table>

<hr />

<h2>Assessment Coverage</h2>

<table>
<tbody>
<tr>
<td style="vertical-align: top; width: 50%;">
<ac:image ac:width="450">
<ri:attachment ri:filename="m365-dashboard-findings-severity.png" />
</ac:image>
</td>
<td style="vertical-align: top; width: 50%;">
<ac:image ac:width="450">
<ri:attachment ri:filename="m365-dashboard-domain-coverage.png" />
</ac:image>
</td>
</tr>
</tbody>
</table>

<ac:structured-macro ac:name="info">
<ac:rich-text-body>
<p><strong>87 Active Automated Checks</strong> across 4 domains evaluate M365 tenant configurations against security best practices. Each check produces a standardized finding with severity rating, detailed description, remediation recommendation, and CSV evidence export for audit traceability.</p>
</ac:rich-text-body>
</ac:structured-macro>

<table>
<tbody>
<tr>
<th style="background-color: #f1f5f9;">Finding ID Prefix</th>
<th style="background-color: #f1f5f9;">Domain</th>
<th style="background-color: #f1f5f9;">Subcategories</th>
<th style="background-color: #f1f5f9;">Active Checks</th>
</tr>
<tr>
<td><code>IAM-AUTH-*</code>, <code>IAM-PIM-*</code>, <code>IAM-AC-*</code>, <code>IAM-EIM-*</code>, <code>IAM-DAS-*</code></td>
<td>Identity &amp; Access Management</td>
<td>Authentication, PIM, Access Control, External Identity, Default Auth Settings</td>
<td>39</td>
</tr>
<tr>
<td><code>DM-DS-*</code>, <code>DM-ICD-*</code>, <code>DM-NP-*</code>, <code>DM-EDR-*</code></td>
<td>Device Management</td>
<td>Device Security, Inventory, Network Protection, EDR</td>
<td>18</td>
</tr>
<tr>
<td><code>ASM-MP-*</code></td>
<td>Email Protection</td>
<td>SPF, DKIM, DMARC, Anti-Spam, Anti-Phishing, Safe Links, Safe Attachments</td>
<td>13</td>
</tr>
<tr>
<td><code>ASM-TSP-*</code></td>
<td>Teams &amp; SharePoint</td>
<td>Meeting Policies, Messaging, External Access, App Permissions, Sharing</td>
<td>17</td>
</tr>
</tbody>
</table>

<hr />

<h2>Development Timeline</h2>

<ac:image ac:width="900">
<ri:attachment ri:filename="m365-dashboard-dev-timeline.png" />
</ac:image>

<table>
<tbody>
<tr>
<th style="background-color: #f1f5f9;">Phase</th>
<th style="background-color: #f1f5f9;">Scope</th>
<th style="background-color: #f1f5f9;">Checks Added</th>
<th style="background-color: #f1f5f9;">Timeline</th>
<th style="background-color: #f1f5f9;">Status</th>
</tr>
<tr>
<td><strong>Phase 1</strong></td>
<td>Core Engine + EntraID Module</td>
<td>39</td>
<td>Jan 2025 – Jun 2025</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">COMPLETE</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
</tr>
<tr>
<td><strong>Phase 2</strong></td>
<td>DeviceManagement + Graph Beta APIs</td>
<td>18</td>
<td>Jul 2025 – Sep 2025</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">COMPLETE</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
</tr>
<tr>
<td><strong>Phase 3</strong></td>
<td>EmailProtection + TeamsSharePoint</td>
<td>30</td>
<td>Oct 2025 – Jan 2026</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">COMPLETE</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
</tr>
<tr>
<td><strong>Phase 4</strong></td>
<td>AppProtection, DataProtection, VulnMgmt, FinSecOps</td>
<td>TBD</td>
<td>Jan 2026 – Jun 2026</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">IN PROGRESS</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
</tr>
</tbody>
</table>

<hr />

<h2>Module Readiness &amp; Testing</h2>

<table>
<tbody>
<tr>
<td style="vertical-align: top; width: 40%;">
<ac:image ac:width="400">
<ri:attachment ri:filename="m365-dashboard-module-readiness.png" />
</ac:image>
</td>
<td style="vertical-align: top; width: 60%;">

<table>
<tbody>
<tr>
<th style="background-color: #f1f5f9;">Component</th>
<th style="background-color: #f1f5f9;">Test Coverage</th>
<th style="background-color: #f1f5f9;">Status</th>
</tr>
<tr><td>ControlsDB (SQLite CRUD)</td><td>34 Pester tests</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">PASSING</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td></tr>
<tr><td>EmailProtection Checks</td><td>37 Pester tests</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">PASSING</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td></tr>
<tr><td>TeamsSharePoint Checks</td><td>Test file present</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">IN PROGRESS</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td></tr>
<tr><td>ApplicationProtection</td><td>Test file present</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">STUB</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td></tr>
<tr><td>DataProtection</td><td>Test file present</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">STUB</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td></tr>
<tr><td>VulnerabilityManagement</td><td>Test file present</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">STUB</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td></tr>
<tr><td>FinSecOps</td><td>Test file present</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">STUB</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td></tr>
</tbody>
</table>

</td>
</tr>
</tbody>
</table>

<hr />

<h2>Technology Stack</h2>

<table>
<tbody>
<tr>
<th style="background-color: #f1f5f9;">Layer</th>
<th style="background-color: #f1f5f9;">Technology</th>
<th style="background-color: #f1f5f9;">Version</th>
</tr>
<tr><td><strong>Runtime</strong></td><td>PowerShell (Windows)</td><td>5.1+ / 7.x</td></tr>
<tr><td><strong>Cloud APIs</strong></td><td>Microsoft Graph API</td><td>v1.0 + beta</td></tr>
<tr><td><strong>Graph SDK</strong></td><td>Microsoft.Graph PowerShell</td><td>2.0+</td></tr>
<tr><td><strong>Exchange</strong></td><td>ExchangeOnlineManagement</td><td>Latest (cert auth)</td></tr>
<tr><td><strong>Teams</strong></td><td>MicrosoftTeams PowerShell</td><td>Latest</td></tr>
<tr><td><strong>Database</strong></td><td>SQLite via PSSQLite</td><td>Local encrypted</td></tr>
<tr><td><strong>Dashboard</strong></td><td>Pode Web Framework</td><td>2.12.1</td></tr>
<tr><td><strong>Reports (DOCX)</strong></td><td>PSWriteWord (Xceed DocX)</td><td>1.1.14</td></tr>
<tr><td><strong>Reports (Excel)</strong></td><td>ImportExcel</td><td>Latest</td></tr>
<tr><td><strong>Reports (PDF)</strong></td><td>Microsoft Edge Headless</td><td>--print-to-pdf</td></tr>
<tr><td><strong>Testing</strong></td><td>Pester</td><td>3.4.0</td></tr>
<tr><td><strong>Credentials</strong></td><td>Windows DPAPI</td><td>User+Machine bound</td></tr>
</tbody>
</table>

<hr />

<h2>Approval Gates</h2>

<table>
<tbody>
<tr>
<th style="background-color: #f1f5f9;">Gate</th>
<th style="background-color: #f1f5f9;">Name</th>
<th style="background-color: #f1f5f9;">Status</th>
<th style="background-color: #f1f5f9;">Notes</th>
</tr>
<tr>
<td><strong>Gate 1</strong></td>
<td>Design Review</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">PASSED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>Phases 1-3 complete; Phase 4 in review</td>
</tr>
<tr>
<td><strong>Gate 2</strong></td>
<td>Architecture Review Board (ARB)</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">PASSED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>Modular architecture approved; ADRs 001-004 signed</td>
</tr>
<tr>
<td><strong>Gate 3</strong></td>
<td>Security Review</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">IN PROGRESS</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>DPAPI credential review; API permission audit in progress</td>
</tr>
<tr>
<td><strong>Gate 4</strong></td>
<td>Change Advisory Board (CAB)</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">PENDING</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>v1.0.0 release approval pending Gate 3</td>
</tr>
<tr>
<td><strong>Gate 5</strong></td>
<td>Go / No-Go</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">NOT STARTED</ac:parameter><ac:parameter ac:name="colour">Grey</ac:parameter></ac:structured-macro></td>
<td>Requires Gates 3-4</td>
</tr>
</tbody>
</table>

<hr />

<h2>Quick Links</h2>

<table>
<tbody>
<tr>
<td style="text-align: center; width: 33%;"><strong>Architecture</strong><br/>
<ac:link><ri:page ri:content-title="${P} - Architecture Overview (HLD)" /><ac:plain-text-link-body><![CDATA[HLD]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="${P} - Low-Level Design (LLD)" /><ac:plain-text-link-body><![CDATA[LLD]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="${P} - Data Architecture" /><ac:plain-text-link-body><![CDATA[Data]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="${P} - Integration Architecture" /><ac:plain-text-link-body><![CDATA[Integration]]></ac:plain-text-link-body></ac:link>
</td>
<td style="text-align: center; width: 33%;"><strong>Security</strong><br/>
<ac:link><ri:page ri:content-title="${P} - Threat Model" /><ac:plain-text-link-body><![CDATA[Threat Model]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="${P} - Security Review Checklist" /><ac:plain-text-link-body><![CDATA[Security Review]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="${P} - Data Classification" /><ac:plain-text-link-body><![CDATA[Data Classification]]></ac:plain-text-link-body></ac:link>
</td>
<td style="text-align: center; width: 33%;"><strong>Operations</strong><br/>
<ac:link><ri:page ri:content-title="${P} - Runbook" /><ac:plain-text-link-body><![CDATA[Runbook]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="${P} - Monitoring &amp; Alerting" /><ac:plain-text-link-body><![CDATA[Monitoring]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="${P} - Incident Response Plan" /><ac:plain-text-link-body><![CDATA[Incident Response]]></ac:plain-text-link-body></ac:link>
</td>
</tr>
</tbody>
</table>

<ac:structured-macro ac:name="children">
<ac:parameter ac:name="all">true</ac:parameter>
</ac:structured-macro>
`.trim();
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
  console.log("Update M365 Space Homepage — Project Dashboard");
  console.log("=".repeat(60));
  console.log(`  Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  const config = loadConfig();
  const client = new ConfluenceClient(
    config.confluence.base_url,
    config.confluence.email,
    config.confluence.api_token,
    config.space.key
  );

  // Get homepage
  console.log("  Finding space homepage...");
  const homepage = await client.getSpaceHomepage();
  if (!homepage) {
    console.error("  Could not find space homepage");
    process.exit(1);
  }

  const pageId = homepage.id;
  const version = homepage.version.number;
  const title = homepage.title;
  console.log(`  Homepage: "${title}" (id: ${pageId}, v${version})\n`);

  // Upload chart attachments
  console.log("  Uploading dashboard charts...");
  for (const chart of DASHBOARD_CHARTS) {
    const chartPath = join(DIAGRAMS_DIR, chart);
    if (!existsSync(chartPath)) {
      console.error(`    PNG not found: ${chart}`);
      continue;
    }
    if (dryRun) {
      console.log(`    [DRY RUN] Would upload: ${chart}`);
      continue;
    }
    const result = await client.uploadAttachment(pageId, chartPath, chart);
    if (result) {
      console.log(`    Attached: ${chart}`);
    } else {
      console.error(`    Failed: ${chart}`);
    }
  }

  // Update page body
  const dashboardHtml = buildDashboardHtml();
  console.log(`\n  Updating homepage with dashboard (${dashboardHtml.length} chars)...`);

  if (dryRun) {
    console.log("  [DRY RUN] Would update homepage");
    return;
  }

  const result = await client.updatePage(pageId, title, dashboardHtml, version);
  if (result) {
    console.log(`  Homepage updated (v${version + 1})`);
  } else {
    console.error("  Homepage update FAILED");
  }

  console.log(`\n  View: ${config.confluence.base_url}/wiki/spaces/${config.space.key}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
