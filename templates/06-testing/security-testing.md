# Security Testing (SAST / DAST)

| **Page Title**   | Security Testing (SAST / DAST)             |
|------------------|--------------------------------------------|
| **Last Updated** | 2026-02-14                                 |
| **Status**       | In Review                                  |
| **Owner**        | IntelliSecOps Security Team                |

---

## 1. Security Testing Approach Overview

Security testing is embedded throughout the software development lifecycle, not treated as a gate at the end. Our approach follows the principle of **defense in depth** -- multiple layers of automated scanning catch different categories of vulnerabilities at different stages.

```
Code Commit  -->  SAST + Dependency Scan  -->  Build  -->  Deploy  -->  DAST (planned)  -->  Pen Test (planned)
   (PR)            (GitHub Actions CI)        (CI)        (Prod)       (Staging)            (Scheduled)
```

| Security Layer             | Stage              | Automated | Frequency          | Current State        |
|----------------------------|--------------------|-----------|---------------------|----------------------|
| Static Analysis (SAST)     | PR / Build         | Yes       | Every PR            | **Implemented**      |
| Dependency Scanning        | PR / Build         | Yes       | Every PR            | **Implemented**      |
| Container Image Scanning   | Post-build         | No        | Not configured      | **Not implemented**  |
| Infrastructure Scanning    | PR (IaC changes)   | No        | Not configured      | **Not implemented**  |
| Dynamic Analysis (DAST)    | Post-deploy        | No        | Not configured      | **Not implemented**  |
| Penetration Testing        | Staging            | No        | Not scheduled       | **Not implemented**  |

### Security Review Summary

A security review was conducted on **2026-02-11** and identified **47 findings** across the application. These findings are being tracked and remediated.

---

## 2. SAST Configuration

### Tool Selection

| Aspect                     | Configuration                                               |
|----------------------------|-------------------------------------------------------------|
| **Primary SAST tool**      | CodeQL (GitHub native)                                      |
| **Secondary SAST tool**    | N/A                                                         |
| **Languages supported**    | JavaScript, TypeScript (configured as `javascript-typescript`) |
| **Custom rules/rulesets**  | Default CodeQL security queries                             |
| **Severity threshold**     | Findings reported in GitHub Security tab; does not block build currently |

### GitHub Actions Integration

The `security-scan` job runs as one of 4 parallel jobs in the CI workflow (`ci.yml`):

```yaml
security-scan:
  name: Security Scan (CodeQL)
  runs-on: ubuntu-latest
  permissions:
    security-events: write
  steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Initialize CodeQL
      uses: github/codeql-action/init@v3
      with:
        languages: javascript-typescript

    - name: Autobuild
      uses: github/codeql-action/autobuild@v3

    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v3
```

### SAST Rules Coverage

| Rule Category              | Covered by CodeQL | Severity | Notes                          |
|----------------------------|-------------------|----------|--------------------------------|
| SQL Injection              | Yes               | Critical | Prisma ORM provides parameterized queries by default |
| Cross-Site Scripting (XSS) | Yes               | Critical | React escapes by default; CodeQL catches unsafe patterns |
| Insecure Deserialization   | Yes               | High     |                                |
| Hardcoded Credentials      | Yes               | Critical | Also covered by GitHub secret scanning |
| Path Traversal             | Yes               | High     |                                |
| Weak Cryptography          | Yes               | High     |                                |
| Prototype Pollution        | Yes               | High     | Relevant for Node.js/Express   |
| Server-Side Request Forgery| Yes               | High     |                                |

### False Positive Management

- False positives are suppressed using CodeQL inline annotations with mandatory justification.
- All suppressions must be reviewed during code review.
- Suppression inventory will be audited quarterly.

---

## 3. DAST Configuration

### Current State

DAST scanning is **not yet implemented**. No dynamic application security testing has been configured.

### Planned Configuration

| Aspect                     | Configuration                                               |
|----------------------------|-------------------------------------------------------------|
| **DAST tool**              | OWASP ZAP (planned)                                        |
| **Target environment**     | Staging (once provisioned): `staging.cmmc.intellisecops.com` |
| **Scan type**              | Full active scan (authenticated)                            |
| **Authentication method**  | API token / Entra ID test account (planned)                 |
| **Scan schedule**          | Weekly + before each Production release (planned)           |
| **Excluded paths**         | `/health`, `/metrics` (planned)                             |

### Planned GitHub Actions DAST Integration

```yaml
# Planned: OWASP ZAP scan in GitHub Actions
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
    retention-days: 30
```

### Planned DAST Scan Scope

| Area                       | Included | Scan Depth | Notes                          |
|----------------------------|----------|------------|--------------------------------|
| API endpoints (`/api/*`)   | Yes      | Full       | All documented endpoints       |
| Frontend web UI            | Yes      | Full       | Authenticated user flows       |
| Admin interfaces           | Yes      | Full       | Higher privilege testing       |
| Third-party integrations   | No       | N/A        | Out of scope (Entra ID)        |

---

## 4. Dependency Scanning

### Current Implementation

| Tool                       | Scope                    | Integration                        | Schedule               | Status          |
|----------------------------|--------------------------|------------------------------------|------------------------|-----------------|
| **npm audit**              | Node.js dependencies (backend + frontend) | GitHub Actions CI (`npm audit --audit-level=high`) | Every PR | **Implemented** |
| **GitHub Dependabot**      | Automated dependency PRs | Native GitHub integration (if configured) | Daily checks    | **Planned**     |
| **Snyk**                   | Deep dependency analysis | GitHub Actions + Snyk Dashboard    | Every PR (planned)     | **Not implemented** |

### Current CI Integration

The `dependency-audit` job runs as one of 4 parallel jobs in the CI workflow:

```yaml
dependency-audit:
  name: Dependency Audit
  runs-on: ubuntu-latest
  steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Audit backend dependencies
      run: cd backend && npm audit --audit-level=high

    - name: Audit frontend dependencies
      run: cd frontend && npm audit --audit-level=high
```

### Dependency Vulnerability Policy

| Severity     | Action Required                         | SLA                |
|--------------|-----------------------------------------|--------------------|
| **Critical** | Patch immediately; emergency release    | 24 hours           |
| **High**     | Patch in current sprint                 | 3 business days    |
| **Medium**   | Patch in next sprint                    | 10 business days   |
| **Low**      | Track in backlog; patch when convenient | Best effort        |

---

## 5. Container Image Scanning

### Current State

Container image scanning is **not yet implemented**. The CD workflow builds and pushes Docker images to ACR without scanning them for vulnerabilities.

### Planned Configuration

| Aspect                     | Configuration                                               |
|----------------------------|-------------------------------------------------------------|
| **Scanner**                | Trivy (planned) or Microsoft Defender for Containers        |
| **Scan trigger**           | After every Docker image build in CD (planned)              |
| **Registry**               | Azure Container Registry: `acrcmmcassessorprod.azurecr.io`  |
| **Base image policy**      | Use official Node.js and Nginx images only                  |
| **Severity threshold**     | Block push on Critical findings (planned)                   |

### Planned GitHub Actions Container Scan

```yaml
# Planned: Add to CD workflow after image build
- name: Scan backend image with Trivy
  uses: aquasecurity/trivy-action@0.28.0
  with:
    image-ref: 'acrcmmcassessorprod.azurecr.io/cmmc-assessor-backend:${{ github.sha }}'
    format: 'sarif'
    output: 'trivy-backend.sarif'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'

- name: Scan frontend image with Trivy
  uses: aquasecurity/trivy-action@0.28.0
  with:
    image-ref: 'acrcmmcassessorprod.azurecr.io/cmmc-assessor-frontend:${{ github.sha }}'
    format: 'sarif'
    output: 'trivy-frontend.sarif'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'

- name: Upload Trivy results to GitHub Security
  uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: 'trivy-backend.sarif'
```

### Current Base Images

| Base Image                                    | Use Case                    | Review Cadence      |
|-----------------------------------------------|-----------------------------|---------------------|
| `node:20` (multi-stage build)                 | Backend application build   | Monthly (planned)   |
| `node:20-slim` or similar                     | Backend runtime             | Monthly (planned)   |
| `node:20` (multi-stage build)                 | Frontend Vite build         | Monthly (planned)   |
| `nginx:alpine`                                | Frontend static serving     | Monthly (planned)   |

---

## 6. Infrastructure Scanning (IaC)

### Current State

Infrastructure scanning for Bicep templates is **not yet implemented**. The `infra/main.bicep` file is deployed via manual workflow dispatch without automated security validation.

### Planned Configuration

| Aspect                     | Configuration                                               |
|----------------------------|-------------------------------------------------------------|
| **IaC tool**               | Bicep                                                       |
| **Scanner**                | Microsoft PSRule for Azure (planned) or Checkov             |
| **Scan trigger**           | Every PR that modifies `infra/` files (planned)             |
| **Severity threshold**     | Fail PR check on High + Critical findings (planned)         |

### Key IaC Security Rules (to be enforced)

| Rule                                    | Severity | Description                                          |
|-----------------------------------------|----------|------------------------------------------------------|
| Encryption at rest enabled              | High     | PostgreSQL and Storage Account must use encryption   |
| HTTPS-only endpoints                    | High     | Container Apps must enforce HTTPS ingress            |
| Managed identity preferred              | Medium   | Prefer managed identity for Azure resource access    |
| Diagnostic logging enabled              | Medium   | All resources must have diagnostics to Log Analytics |
| Key Vault soft-delete enabled           | High     | Prevent accidental secret deletion                   |
| PostgreSQL SSL enforcement              | High     | Require SSL for all database connections             |

---

## 7. Findings Triage Process

### Triage Workflow

1. **Detection:** Automated scan finds a vulnerability (CodeQL SARIF upload, npm audit failure, or manual review).
2. **Notification:** Finding appears in GitHub Security tab or as a failed CI check.
3. **Triage:** Security champion reviews the finding and classifies it:
   - **True Positive** -- assign to developer for fix; set fix target date per severity SLA.
   - **False Positive** -- suppress with documented justification.
   - **Accepted Risk** -- document risk acceptance with business justification and expiry date.
4. **Fix:** Developer implements fix and includes a regression test (once test suites exist).
5. **Verification:** Re-scan confirms the finding is resolved.
6. **Closure:** Finding is marked as resolved.

### Triage Responsibility

| Scanner Output               | Triage Owner                  | Fix Owner                     |
|------------------------------|-------------------------------|-------------------------------|
| CodeQL SAST findings         | Security champion             | Code author / development team|
| npm audit findings           | Security champion             | Development team / DevOps     |
| DAST findings (planned)      | Security champion             | Development team              |
| Container image CVEs (planned)| Security champion + DevOps   | DevOps team                   |
| IaC findings (planned)       | Security champion + DevOps   | DevOps team                   |

### Fix SLAs by Severity

| Severity     | Fix Target         | Escalation After       |
|--------------|--------------------|-----------------------|
| **Critical** | 24 hours           | 48 hours              |
| **High**     | 3 business days    | 5 business days       |
| **Medium**   | 10 business days   | 15 business days      |
| **Low**      | Next sprint        | End of quarter        |

---

## 8. Vulnerability Tracking

### Security Review Findings (2026-02-11)

A security review conducted on 2026-02-11 identified **47 findings** across the CMMC Assessor Platform. The findings are being tracked in GitHub Issues with the `security` label.

### Vulnerability Metrics

| Metric                              | Current Value    | Target          | Trend                     |
|-------------------------------------|------------------|-----------------|---------------------------|
| Total findings from security review | 47               | 0 Critical/High | Being remediated          |
| Open Critical vulnerabilities       | TBD              | 0               | Under triage              |
| Open High vulnerabilities           | TBD              | < 5             | Under triage              |
| Mean time to remediate (Critical)   | TBD              | < 1 day         | New process               |
| Mean time to remediate (High)       | TBD              | < 3 days        | New process               |
| Dependency vulnerabilities (total)  | Checked per PR   | 0 High+         | Enforced via npm audit    |

---

## 9. Penetration Testing

### Current State

Penetration testing has **not yet been conducted** on the CMMC Assessor Platform.

### Planned Configuration

| Aspect                     | Configuration                                               |
|----------------------------|-------------------------------------------------------------|
| **Provider**               | To be determined (third-party vendor recommended for CMMC compliance) |
| **Scope**                  | Full application: backend API, frontend web UI, authentication flows, CMMC assessment workflows |
| **Target environment**     | Staging (once provisioned)                                  |
| **Schedule**               | Annually (recommended: semi-annually given CMMC compliance requirements) |
| **Methodology**            | OWASP Testing Guide v4 + NIST SP 800-115                   |
| **Last pen test date**     | N/A (never conducted)                                       |
| **Next scheduled**         | TBD (after staging environment is provisioned)              |
| **Report location**        | Secure document store (to be determined)                    |

### Penetration Testing Priority

Given that the CMMC Assessor Platform handles sensitive cybersecurity maturity data, penetration testing is a high priority. It should be scheduled as soon as the staging environment is available.

---

## 10. Bug Bounty Program

| Aspect                     | Configuration                                               |
|----------------------------|-------------------------------------------------------------|
| **Program status**         | Not Applicable (at this stage)                              |
| **Rationale**              | The platform is in early production with limited user base. A bug bounty program will be evaluated once the user base grows and the security posture matures. |

---

## 11. Appendix

### Security Testing Contacts

| Role                        | Name                          | Contact               |
|-----------------------------|-------------------------------|-----------------------|
| Security Champion           | IntelliSecOps Security Team   | GitHub Issues         |
| Development Lead            | IntelliSecOps Dev Team        | GitHub Issues         |

### Planned Security Testing Milestones

| Milestone                                          | Target Date  | Priority |
|----------------------------------------------------|--------------|----------|
| Remediate critical/high findings from security review | Ongoing    | Critical |
| Implement container image scanning (Trivy)         | TBD          | High     |
| Implement IaC scanning (PSRule/Checkov)            | TBD          | Medium   |
| Set up DAST scanning (OWASP ZAP) on staging       | TBD          | High     |
| Schedule first penetration test                    | TBD          | High     |
| Configure Dependabot for automated dependency PRs  | TBD          | Medium   |

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Build Pipeline](../05-cicd-pipeline/build-pipeline.md)
- [GitHub Actions Overview](../05-cicd-pipeline/github-actions-overview.md)
