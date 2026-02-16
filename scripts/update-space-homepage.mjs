/**
 * Update the Confluence space homepage with a project dashboard.
 *
 * Usage:
 *   node scripts/update-space-homepage.mjs
 *   node scripts/update-space-homepage.mjs --dry-run
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIAGRAMS_DIR = join(ROOT, "diagrams");
const CONFIG_PATH = join(__dirname, "config.json");

// ── Dashboard chart attachments ──────────────────────────────────────────
const DASHBOARD_CHARTS = [
  "dashboard-security-findings.png",
  "dashboard-security-domains.png",
  "dashboard-remediation-timeline.png",
  "dashboard-feature-status.png",
  "dashboard-infra-status.png",
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

  return `
<ac:structured-macro ac:name="panel" ac:schema-version="1">
<ac:parameter ac:name="bgColor">#1a365d</ac:parameter>
<ac:rich-text-body>
<p style="text-align: center; color: white;"><strong style="font-size: 24px; color: white;">CMMC Assessor Platform — Project Dashboard</strong></p>
<p style="text-align: center; color: #cbd5e1;">Multi-tenant SaaS CMMC Level 2 Compliance Assessment Platform | Last updated: ${today}</p>
</ac:rich-text-body>
</ac:structured-macro>

<table>
<tbody>
<tr>
<th style="background-color: #f1f5f9; text-align: center; width: 25%;">Project Phase</th>
<th style="background-color: #f1f5f9; text-align: center; width: 25%;">Overall Status</th>
<th style="background-color: #f1f5f9; text-align: center; width: 25%;">Security Posture</th>
<th style="background-color: #f1f5f9; text-align: center; width: 25%;">Next Milestone</th>
</tr>
<tr>
<td style="text-align: center;"><strong>Production (prod-v2)</strong><br/>Security Hardened</td>
<td style="text-align: center;">
<ac:structured-macro ac:name="status">
<ac:parameter ac:name="title">COMPLETE</ac:parameter>
<ac:parameter ac:name="colour">Green</ac:parameter>
</ac:structured-macro>
<br/>All remediation complete</td>
<td style="text-align: center;">
<ac:structured-macro ac:name="status">
<ac:parameter ac:name="title">47/47 RESOLVED</ac:parameter>
<ac:parameter ac:name="colour">Green</ac:parameter>
</ac:structured-macro>
<br/>Overall risk: LOW</td>
<td style="text-align: center;"><strong>Next: Gate 4 CAB</strong><br/>2026-02-17<br/><em>Production Go-Live</em></td>
</tr>
</tbody>
</table>

<hr />

<h2>Feature Implementation Progress</h2>

<ac:image ac:width="800">
<ri:attachment ri:filename="dashboard-feature-status.png" />
</ac:image>

<table>
<tbody>
<tr>
<th style="background-color: #f1f5f9;">Feature</th>
<th style="background-color: #f1f5f9;">Status</th>
<th style="background-color: #f1f5f9;">Progress</th>
<th style="background-color: #f1f5f9;">Notes</th>
</tr>
<tr>
<td><strong>Authentication (Entra ID SSO)</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DONE</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>90%</td>
<td>OAuth 2.0/OIDC + PKCE, admin consent, HttpOnly cookie auth, refresh token rotation. All auth findings resolved</td>
</tr>
<tr>
<td><strong>Assessment Workflows</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DONE</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>85%</td>
<td>CRUD, objective responses, control scoring. 110 practices, 255 objectives</td>
</tr>
<tr>
<td><strong>CMMC Controls Library</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DONE</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>85%</td>
<td>Full NIST SP 800-171 Rev 2 control library with families and weights</td>
</tr>
<tr>
<td><strong>SPRS Scoring Engine</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DONE</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>80%</td>
<td>Automated -203 to 110 scoring with Recharts dashboards</td>
</tr>
<tr>
<td><strong>POA&amp;M Management</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">IN PROGRESS</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>75%</td>
<td>Items, milestones, evidence. Pending: milestone tracking enhancements</td>
</tr>
<tr>
<td><strong>Policy Management</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">IN PROGRESS</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>70%</td>
<td>CRUD, versioning, acknowledgments. Pending: policy workflow automation</td>
</tr>
<tr>
<td><strong>Evidence Management (Graph API)</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">IN PROGRESS</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>65%</td>
<td>SharePoint upload/download/preview via Graph API. Pending: resumable uploads &gt;4MB</td>
</tr>
<tr>
<td><strong>SSP Document Generation</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">IN PROGRESS</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>60%</td>
<td>DOCX generation via docx 9.5. Pending: full SSP template coverage</td>
</tr>
<tr>
<td><strong>Audit Logging</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DONE</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>90%</td>
<td>Immutable append-only AuditLog for all entity mutations</td>
</tr>
<tr>
<td><strong>Team Management</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DONE</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>80%</td>
<td>5-role RBAC (OWNER, ADMIN, ASSESSOR, MEMBER, VIEWER), invitations</td>
</tr>
<tr>
<td><strong>Data Exports</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">IN PROGRESS</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>55%</td>
<td>Excel/PDF/DOCX export. Pending: bulk export, PDF styling</td>
</tr>
</tbody>
</table>

<hr />

<h2>Security Posture</h2>

<table>
<tbody>
<tr>
<td style="vertical-align: top; width: 50%;">
<ac:image ac:width="450">
<ri:attachment ri:filename="dashboard-security-findings.png" />
</ac:image>
</td>
<td style="vertical-align: top; width: 50%;">
<ac:image ac:width="450">
<ri:attachment ri:filename="dashboard-security-domains.png" />
</ac:image>
</td>
</tr>
</tbody>
</table>

<ac:structured-macro ac:name="tip">
<ac:rich-text-body>
<p><strong>ALL 47 Security Findings RESOLVED</strong> (completed 2026-02-15)</p>
<p>The application was migrated to a hardened production environment (prod-v2) in subscription <code>sub-is-secops-prod</code> with:</p>
<ul>
<li>VNet isolation with private endpoints for PostgreSQL, Key Vault, and ACR</li>
<li>App Gateway WAF v2 (OWASP CRS 3.2, Prevention mode) at cmmc.intellisecops.com</li>
<li>Key Vault secret references via managed identity (no plain-text secrets)</li>
<li>HttpOnly cookie auth with 15-min JWT + refresh token rotation</li>
<li>Structured logging (pino), Dependabot, enforced npm audit</li>
</ul>
<p>Overall Risk Rating: <strong>LOW</strong> (reduced from HIGH)</p>
</ac:rich-text-body>
</ac:structured-macro>

<h3>Remediation Timeline</h3>

<ac:image ac:width="900">
<ri:attachment ri:filename="dashboard-remediation-timeline.png" />
</ac:image>

<table>
<tbody>
<tr>
<th style="background-color: #fef2f2;">Phase</th>
<th style="background-color: #fef2f2;">Severity</th>
<th style="background-color: #fef2f2;">Items</th>
<th style="background-color: #fef2f2;">Deadline</th>
<th style="background-color: #fef2f2;">Status</th>
</tr>
<tr>
<td><strong>Phase 1</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">CRITICAL</ac:parameter><ac:parameter ac:name="colour">Red</ac:parameter></ac:structured-macro></td>
<td>4 findings (F-01, F-02, F-03, F-04)</td>
<td>2026-02-13</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">RESOLVED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
</tr>
<tr>
<td><strong>Phase 2</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">HIGH</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>10 findings (F-05 through F-14)</td>
<td>2026-02-25</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">RESOLVED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
</tr>
<tr>
<td><strong>Phase 3</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">MEDIUM</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>22 findings (F-15 through F-36)</td>
<td>2026-05-11</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">RESOLVED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
</tr>
<tr>
<td><strong>Phase 4</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">LOW</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>11 findings (F-37 through F-47)</td>
<td>2026-08-11</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">RESOLVED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
</tr>
</tbody>
</table>

<hr />

<h2>Infrastructure &amp; Environment</h2>

<table>
<tbody>
<tr>
<td style="vertical-align: top; width: 40%;">
<ac:image ac:width="400">
<ri:attachment ri:filename="dashboard-infra-status.png" />
</ac:image>
</td>
<td style="vertical-align: top; width: 60%;">

<table>
<tbody>
<tr>
<th style="background-color: #f1f5f9;">Azure Resource</th>
<th style="background-color: #f1f5f9;">Service</th>
<th style="background-color: #f1f5f9;">SKU</th>
<th style="background-color: #f1f5f9;">Status</th>
</tr>
<tr><td>cmmc-api</td><td>Container App</td><td>0.5 CPU / 1Gi</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DEPLOYED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td></tr>
<tr><td>cmmc-web</td><td>Container App</td><td>0.25 CPU / 0.5Gi</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DEPLOYED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td></tr>
<tr><td>psql-cmmc-assessor-prod</td><td>PostgreSQL Flex</td><td>B1ms (1 vCore)</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DEPLOYED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td></tr>
<tr><td>stcmmcassessorprod</td><td>Blob Storage</td><td>Standard_LRS</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DEPLOYED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td></tr>
<tr><td>kv-cmmc-assessor-prod</td><td>Key Vault</td><td>Standard</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DEPLOYED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td></tr>
<tr><td>acrcmmcassessorprod</td><td>Container Registry</td><td>Basic</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DEPLOYED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td></tr>
<tr><td>VNet + Private Endpoints</td><td>Networking</td><td>prod-v2</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DEPLOYED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td></tr>
<tr><td>App Gateway WAF v2</td><td>Security</td><td>appgw-ams</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">DEPLOYED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td></tr>
<tr><td>Staging Environment</td><td>Container Apps</td><td>—</td><td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">PLANNED</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td></tr>
</tbody>
</table>

</td>
</tr>
</tbody>
</table>

<table>
<tbody>
<tr>
<th style="background-color: #f1f5f9; width: 25%;">Environment</th>
<th style="background-color: #f1f5f9; width: 25%;">Status</th>
<th style="background-color: #f1f5f9; width: 25%;">Region</th>
<th style="background-color: #f1f5f9; width: 25%;">Cost</th>
</tr>
<tr>
<td><strong>Development</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">LOCAL ONLY</ac:parameter><ac:parameter ac:name="colour">Blue</ac:parameter></ac:structured-macro></td>
<td>Developer Machine (Docker Compose)</td>
<td>$0</td>
</tr>
<tr>
<td><strong>Staging</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">NOT IMPLEMENTED</ac:parameter><ac:parameter ac:name="colour">Grey</ac:parameter></ac:structured-macro></td>
<td>—</td>
<td>—</td>
</tr>
<tr>
<td><strong>Production</strong></td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">LIVE</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>Canada Central</td>
<td>~$35-70 CAD/mo</td>
</tr>
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
<th style="background-color: #f1f5f9;">Blockers</th>
</tr>
<tr>
<td><strong>Gate 1</strong></td>
<td>Design Review</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">PASSED</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro></td>
<td>None — completed 2026-01-06</td>
</tr>
<tr>
<td><strong>Gate 2</strong></td>
<td>Architecture Review Board (ARB)</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">PENDING</ac:parameter><ac:parameter ac:name="colour">Yellow</ac:parameter></ac:structured-macro></td>
<td>ADR approvals unsigned (ADR-001, 002, 003)</td>
</tr>
<tr>
<td><strong>Gate 3</strong></td>
<td>Security Review</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">BLOCKED</ac:parameter><ac:parameter ac:name="colour">Red</ac:parameter></ac:structured-macro></td>
<td>4 Critical resolved; 10 High in progress (Phase 2); conditional FAIL pending Phase 2</td>
</tr>
<tr>
<td><strong>Gate 4</strong></td>
<td>Change Advisory Board (CAB)</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">NOT STARTED</ac:parameter><ac:parameter ac:name="colour">Grey</ac:parameter></ac:structured-macro></td>
<td>Requires Gate 3 resolution</td>
</tr>
<tr>
<td><strong>Gate 5</strong></td>
<td>Go / No-Go</td>
<td><ac:structured-macro ac:name="status"><ac:parameter ac:name="title">NOT STARTED</ac:parameter><ac:parameter ac:name="colour">Grey</ac:parameter></ac:structured-macro></td>
<td>Requires Gates 2-4</td>
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
<tr><td><strong>Frontend</strong></td><td>React + TypeScript + Vite + Tailwind CSS</td><td>18.3 / 5.6 / 5.4 / 3.4</td></tr>
<tr><td><strong>State Management</strong></td><td>TanStack React Query</td><td>5.59</td></tr>
<tr><td><strong>Backend</strong></td><td>Node.js + Express + TypeScript</td><td>20 / 4.21 / 5.6</td></tr>
<tr><td><strong>ORM</strong></td><td>Prisma</td><td>5.22</td></tr>
<tr><td><strong>Auth</strong></td><td>Microsoft Entra ID (MSAL)</td><td>2.15</td></tr>
<tr><td><strong>Database</strong></td><td>PostgreSQL (Azure Flexible Server)</td><td>17</td></tr>
<tr><td><strong>Compute</strong></td><td>Azure Container Apps (Consumption)</td><td>—</td></tr>
<tr><td><strong>IaC</strong></td><td>Bicep</td><td>Latest</td></tr>
<tr><td><strong>CI/CD</strong></td><td>GitHub Actions (OIDC to Azure)</td><td>—</td></tr>
</tbody>
</table>

<hr />

<h2>Quick Links</h2>

<table>
<tbody>
<tr>
<td style="text-align: center; width: 33%;"><strong>Architecture</strong><br/>
<ac:link><ri:page ri:content-title="CMMC Assessor Platform - Architecture Overview (HLD)" /><ac:plain-text-link-body><![CDATA[HLD]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="CMMC Assessor Platform - Low-Level Design (LLD)" /><ac:plain-text-link-body><![CDATA[LLD]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="CMMC Assessor Platform - Data Architecture" /><ac:plain-text-link-body><![CDATA[Data]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="CMMC Assessor Platform - Integration Architecture" /><ac:plain-text-link-body><![CDATA[Integration]]></ac:plain-text-link-body></ac:link>
</td>
<td style="text-align: center; width: 33%;"><strong>Security</strong><br/>
<ac:link><ri:page ri:content-title="CMMC Assessor Platform - Threat Model" /><ac:plain-text-link-body><![CDATA[Threat Model]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="CMMC Assessor Platform - Security Review Checklist" /><ac:plain-text-link-body><![CDATA[Security Review]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="CMMC Assessor Platform - Data Classification" /><ac:plain-text-link-body><![CDATA[Data Classification]]></ac:plain-text-link-body></ac:link>
</td>
<td style="text-align: center; width: 33%;"><strong>Operations</strong><br/>
<ac:link><ri:page ri:content-title="CMMC Assessor Platform - Azure Infrastructure Overview" /><ac:plain-text-link-body><![CDATA[Infrastructure]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="CMMC Assessor Platform - Build Pipeline" /><ac:plain-text-link-body><![CDATA[CI Pipeline]]></ac:plain-text-link-body></ac:link> |
<ac:link><ri:page ri:content-title="CMMC Assessor Platform - Release Pipeline" /><ac:plain-text-link-body><![CDATA[CD Pipeline]]></ac:plain-text-link-body></ac:link>
</td>
</tr>
</tbody>
</table>
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
  console.log("Update Space Homepage — Project Dashboard");
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
