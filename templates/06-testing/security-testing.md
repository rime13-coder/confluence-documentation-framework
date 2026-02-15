# Security Testing (SAST / DAST)

| **Page Title**   | Security Testing (SAST / DAST)             |
|------------------|--------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                               |
| **Status**       | [Draft / In Review / Approved / Deprecated] |
| **Owner**        | [TEAM OR INDIVIDUAL NAME]                  |

---

## 1. Security Testing Approach Overview

Security testing is embedded throughout the software development lifecycle, not treated as a gate at the end. Our approach follows the principle of **defense in depth** — multiple layers of automated scanning catch different categories of vulnerabilities at different stages.

```
Code Commit  -->  SAST + Dependency Scan  -->  Build  -->  Container Scan  -->  Deploy  -->  DAST  -->  Pen Test
   (PR)            (GitHub Actions)          (CI)        (GitHub Actions)     (Staging)    (Staging)   (Scheduled)
```

| Security Layer             | Stage              | Automated | Frequency          |
|----------------------------|--------------------|-----------|---------------------|
| Static Analysis (SAST)     | PR / Build         | Yes       | Every PR            |
| Dependency Scanning        | PR / Build         | Yes       | Every PR + daily    |
| Container Image Scanning   | Post-build         | Yes       | Every image build   |
| Infrastructure Scanning    | PR (IaC changes)   | Yes       | Every IaC PR        |
| Dynamic Analysis (DAST)    | Post-deploy        | Semi      | Weekly + pre-release|
| Penetration Testing        | Staging            | No        | [QUARTERLY/ANNUALLY]|

---

## 2. SAST Configuration

### Tool Selection

| Aspect                     | Configuration                                               |
|----------------------------|-------------------------------------------------------------|
| **Primary SAST tool**      | [CodeQL / SonarQube / SonarCloud / Snyk Code]               |
| **Secondary SAST tool**    | [TOOL-NAME, if applicable, or "N/A"]                        |
| **Languages supported**    | [LIST: e.g., C#, JavaScript/TypeScript, Python, Go]         |
| **Custom rules/rulesets**  | [DEFAULT / CUSTOM: specify custom rule location]             |
| **Severity threshold**     | Fail build on: [Critical + High / Critical only]            |

### GitHub Actions Integration

```yaml
# Example: CodeQL SAST scan in GitHub Actions
- name: Initialize CodeQL
  uses: github/codeql-action/init@v3
  with:
    languages: '[LANGUAGE]'
    queries: security-and-quality   # or 'security-extended' for broader coverage

- name: Autobuild
  uses: github/codeql-action/autobuild@v3

- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v3
  with:
    category: '/language:[LANGUAGE]'
```

### SonarQube/SonarCloud Integration (Alternative)

```yaml
- name: SonarCloud Scan
  uses: SonarSource/sonarcloud-github-action@v3
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  with:
    args: >
      -Dsonar.organization=[ORG]
      -Dsonar.projectKey=[PROJECT-KEY]
      -Dsonar.sources=src/
      -Dsonar.tests=tests/
      -Dsonar.qualitygate.wait=true
```

### SAST Rules Configuration

| Rule Category              | Enabled | Severity Override | Notes                          |
|----------------------------|---------|-------------------|--------------------------------|
| SQL Injection              | Yes     | Critical          |                                |
| Cross-Site Scripting (XSS) | Yes     | Critical          |                                |
| Insecure Deserialization   | Yes     | High              |                                |
| Hardcoded Credentials      | Yes     | Critical          | Also covered by secret scanning|
| Path Traversal             | Yes     | High              |                                |
| Weak Cryptography          | Yes     | High              |                                |
| [ADD MORE AS NEEDED]       |         |                   |                                |

### False Positive Management

- False positives are suppressed using inline annotations (`// codeql[suppression-reason]` or `@SuppressWarnings`) with mandatory justification.
- All suppressions are reviewed during code review.
- Suppression inventory is audited [FREQUENCY: e.g., quarterly].

---

## 3. DAST Configuration

| Aspect                     | Configuration                                               |
|----------------------------|-------------------------------------------------------------|
| **DAST tool**              | [OWASP ZAP / Burp Suite Enterprise / Azure DAST]           |
| **Target environment**     | Staging ([STAGING-URL])                                     |
| **Scan type**              | Full active scan (authenticated)                            |
| **Authentication method**  | [API token / OAuth2 / session-based login script]           |
| **Scan schedule**          | [WEEKLY: e.g., every Sunday 02:00 UTC] + before each Production release |
| **Excluded paths**         | [LIST: e.g., `/health`, `/metrics`, third-party widget endpoints] |

### GitHub Actions DAST Integration

```yaml
# Example: OWASP ZAP scan in GitHub Actions
- name: OWASP ZAP Full Scan
  uses: zaproxy/action-full-scan@v0.10.0
  with:
    target: '${{ vars.STAGING_URL }}'
    rules_file_name: 'zap-rules.tsv'
    cmd_options: '-a -j'
    allow_issue_writing: true
    artifact_name: 'zap-report'

- name: Upload ZAP Report
  uses: actions/upload-artifact@v4
  with:
    name: dast-report
    path: report_html.html
    retention-days: [RETENTION-DAYS]
```

### DAST Scan Scope

| Area                       | Included | Scan Depth | Notes                          |
|----------------------------|----------|------------|--------------------------------|
| API endpoints              | Yes      | Full       | All documented endpoints       |
| Web UI (if applicable)     | Yes      | Full       | Authenticated user flows       |
| Admin interfaces           | Yes      | Full       | Higher privilege testing       |
| WebSocket endpoints        | [YES/NO] | [DEPTH]    |                                |
| Third-party integrations   | No       | N/A        | Out of scope                   |

---

## 4. Dependency Scanning

| Tool                       | Scope                    | Integration                        | Schedule               |
|----------------------------|--------------------------|------------------------------------|------------------------|
| **Dependabot**             | GitHub-native dependency updates | Automatic PRs for outdated/vulnerable packages | Daily checks   |
| **Snyk**                   | Deep dependency analysis | GitHub Actions + Snyk Dashboard    | Every PR + weekly full scan |
| **npm audit**              | Node.js dependencies     | GitHub Actions (`npm audit --audit-level=high`) | Every PR      |
| **dotnet list package --vulnerable** | .NET NuGet packages | GitHub Actions              | Every PR               |
| **pip-audit**              | Python dependencies      | GitHub Actions                     | Every PR               |

### Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "[ECOSYSTEM: e.g., nuget, npm, pip]"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 10
    reviewers:
      - "[TEAM-OR-USER]"
    labels:
      - "dependencies"
      - "security"
    allow:
      - dependency-type: "all"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

### Dependency Vulnerability Policy

| Severity     | Action Required                         | SLA                |
|--------------|-----------------------------------------|--------------------|
| **Critical** | Patch immediately; emergency release    | [HOURS] hours      |
| **High**     | Patch in current sprint                 | [DAYS] business days|
| **Medium**   | Patch in next sprint                    | [DAYS] business days|
| **Low**      | Track in backlog; patch when convenient | Best effort        |

---

## 5. Container Image Scanning

| Aspect                     | Configuration                                               |
|----------------------------|-------------------------------------------------------------|
| **Scanner**                | [Trivy / Microsoft Defender for Containers / Snyk Container]|
| **Scan trigger**           | After every Docker image build in CI                        |
| **Registry**               | Azure Container Registry: `[ACR-NAME].azurecr.io`          |
| **Base image policy**      | Only approved base images from [APPROVED-REGISTRY]          |
| **Severity threshold**     | Block push on [Critical / Critical + High] findings        |

### GitHub Actions Container Scan

```yaml
- name: Scan container image with Trivy
  uses: aquasecurity/trivy-action@0.28.0
  with:
    image-ref: '${{ env.ACR_NAME }}.azurecr.io/${{ env.IMAGE_NAME }}:${{ github.sha }}'
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'    # Fail the build if vulnerabilities found

- name: Upload Trivy scan results to GitHub Security
  uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: 'trivy-results.sarif'
```

### Approved Base Images

| Base Image                                    | Use Case                    | Review Cadence      |
|-----------------------------------------------|-----------------------------|---------------------|
| `mcr.microsoft.com/dotnet/aspnet:[VERSION]`   | .NET application hosting    | Monthly             |
| `node:[VERSION]-alpine`                        | Node.js application hosting | Monthly             |
| `python:[VERSION]-slim`                        | Python application hosting  | Monthly             |
| [ADD MORE AS NEEDED]                           |                             |                     |

---

## 6. Infrastructure Scanning (IaC)

| Aspect                     | Configuration                                               |
|----------------------------|-------------------------------------------------------------|
| **IaC tool**               | [Terraform / Bicep / ARM Templates]                         |
| **Scanner**                | [Checkov / tfsec / Terrascan / Microsoft PSRule]            |
| **Scan trigger**           | Every PR that modifies IaC files                            |
| **Severity threshold**     | Fail PR check on High + Critical findings                   |

### GitHub Actions IaC Scan

```yaml
- name: Run Checkov IaC scan
  uses: bridgecrewio/checkov-action@v12
  with:
    directory: infrastructure/
    framework: [terraform / bicep / arm]
    output_format: sarif
    output_file_path: checkov-results.sarif
    soft_fail: false    # Fail on findings

- name: Upload Checkov results
  uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: checkov-results.sarif
```

### Key IaC Security Rules

| Rule                                    | Severity | Description                                          |
|-----------------------------------------|----------|------------------------------------------------------|
| Encryption at rest enabled              | High     | All storage and databases must use encryption        |
| HTTPS-only endpoints                    | High     | No HTTP-only App Service or Function endpoints       |
| Network security groups configured      | High     | No open inbound rules (0.0.0.0/0)                   |
| Managed identity over service principal | Medium   | Prefer managed identity for Azure resource access    |
| Diagnostic logging enabled              | Medium   | All resources must have diagnostics configured       |
| [ADD MORE AS NEEDED]                    |          |                                                      |

---

## 7. Findings Triage Process

### Triage Workflow

1. **Detection:** Automated scan finds a vulnerability and creates a finding (GitHub Security alert, Snyk issue, or SARIF upload).
2. **Notification:** Security champion and code owner are notified via [GitHub notification / Slack / Teams].
3. **Triage:** Security champion reviews the finding within [SLA-HOURS] hours and classifies it:
   - **True Positive** — assign to developer for fix; set fix target date per severity SLA.
   - **False Positive** — suppress with documented justification.
   - **Accepted Risk** — document risk acceptance with business justification and expiry date.
4. **Fix:** Developer implements fix and includes a regression test.
5. **Verification:** Re-scan confirms the finding is resolved.
6. **Closure:** Finding is marked as resolved in the tracking system.

### Triage Responsibility

| Scanner Output               | Triage Owner                  | Fix Owner                     |
|------------------------------|-------------------------------|-------------------------------|
| SAST findings                | Security champion             | Code author / feature team    |
| DAST findings                | Security champion             | Feature team                  |
| Dependency vulnerabilities   | Security champion             | Code author / DevOps          |
| Container image CVEs         | Security champion + DevOps    | DevOps / platform team        |
| IaC findings                 | Security champion + DevOps    | DevOps / platform team        |

### Fix SLAs by Severity

| Severity     | Fix Target         | Escalation After       |
|--------------|--------------------|-----------------------|
| **Critical** | [HOURS] hours      | [HOURS] hours          |
| **High**     | [DAYS] business days| [DAYS] business days  |
| **Medium**   | [DAYS] business days| [DAYS] business days  |
| **Low**      | Next sprint        | End of quarter         |

---

## 8. Vulnerability Tracking

> Maintain this table for active vulnerabilities. Archive resolved items periodically.

| ID                 | Tool           | Severity  | Description                              | Component          | Status               | Assigned To    | Found Date  | Fix Target Date |
|--------------------|----------------|-----------|------------------------------------------|--------------------|----------------------|----------------|-------------|-----------------|
| [VULN-001]         | [TOOL]         | [SEV]     | [DESCRIPTION]                            | [COMPONENT]        | [Open/In Progress/Resolved/Accepted Risk] | [NAME] | [DATE] | [DATE]     |
| [VULN-002]         | [TOOL]         | [SEV]     | [DESCRIPTION]                            | [COMPONENT]        | [STATUS]             | [NAME]         | [DATE]      | [DATE]          |
| [VULN-003]         | [TOOL]         | [SEV]     | [DESCRIPTION]                            | [COMPONENT]        | [STATUS]             | [NAME]         | [DATE]      | [DATE]          |
| [ADD MORE AS NEEDED]|               |           |                                          |                    |                      |                |             |                 |

### Vulnerability Metrics (Dashboard)

| Metric                              | Current Value | Target          | Trend                     |
|-------------------------------------|---------------|-----------------|---------------------------|
| Open Critical vulnerabilities       | [NUMBER]      | 0               | [IMPROVING/STABLE/DEGRADING] |
| Open High vulnerabilities           | [NUMBER]      | < [NUMBER]      | [TREND]                   |
| Mean time to remediate (Critical)   | [DAYS] days   | < [DAYS] days   | [TREND]                   |
| Mean time to remediate (High)       | [DAYS] days   | < [DAYS] days   | [TREND]                   |
| Dependency vulnerabilities (total)  | [NUMBER]      | < [NUMBER]      | [TREND]                   |
| False positive rate                 | [NUMBER]%     | < [NUMBER]%     | [TREND]                   |

---

## 9. Penetration Testing

| Aspect                     | Configuration                                               |
|----------------------------|-------------------------------------------------------------|
| **Provider**               | [INTERNAL TEAM / THIRD-PARTY VENDOR NAME]                   |
| **Scope**                  | [FULL APPLICATION / SPECIFIC MODULES: list them]            |
| **Target environment**     | Staging ([STAGING-URL])                                     |
| **Schedule**               | [QUARTERLY / SEMI-ANNUALLY / ANNUALLY]                      |
| **Methodology**            | [OWASP Testing Guide / PTES / custom]                       |
| **Last pen test date**     | [YYYY-MM-DD]                                                |
| **Next scheduled**         | [YYYY-MM-DD]                                                |
| **Report location**        | [LINK TO SECURE DOCUMENT STORE]                             |

### Penetration Test History

| Date         | Provider         | Scope                  | Critical Findings | High Findings | Status               |
|--------------|------------------|------------------------|--------------------|--------------|-----------------------|
| [YYYY-MM-DD] | [PROVIDER]       | [SCOPE]                | [NUMBER]           | [NUMBER]     | [All Remediated / In Progress] |
| [YYYY-MM-DD] | [PROVIDER]       | [SCOPE]                | [NUMBER]           | [NUMBER]     | [STATUS]              |

---

## 10. Bug Bounty Program

| Aspect                     | Configuration                                               |
|----------------------------|-------------------------------------------------------------|
| **Program status**         | [Active / Planned / Not Applicable]                         |
| **Platform**               | [HackerOne / Bugcrowd / Internal program]                   |
| **Scope**                  | [IN-SCOPE DOMAINS AND APPLICATIONS]                         |
| **Reward range**           | $[MIN] - $[MAX] depending on severity                       |
| **Program URL**            | [PROGRAM-URL]                                                |
| **Triage SLA**             | [HOURS] hours for initial response                          |
| **Contact**                | [SECURITY-TEAM-EMAIL]                                       |

> If no bug bounty program exists, note "Not Applicable" and consider whether one should be established.

---

## 11. Appendix

### Security Testing Contacts

| Role                        | Name              | Contact               |
|-----------------------------|-------------------|-----------------------|
| Security Champion           | [NAME]            | [EMAIL/HANDLE]        |
| AppSec Lead                 | [NAME]            | [EMAIL/HANDLE]        |
| Penetration Testing Contact | [NAME]            | [EMAIL/HANDLE]        |
| Incident Response Contact   | [NAME]            | [EMAIL/HANDLE]        |

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Build Pipeline](../05-cicd-pipeline/build-pipeline.md)
- [GitHub Actions Overview](../05-cicd-pipeline/github-actions-overview.md)
