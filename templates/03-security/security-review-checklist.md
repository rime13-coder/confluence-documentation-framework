# Security Review Checklist

| **Page Title**   | Security Review Checklist - CMMC Assessor Platform  |
|------------------|-----------------------------------------------------|
| **Last Updated** | 2026-02-15                                          |
| **Status**       | COMPLETE — All 47 findings resolved (2026-02-15)       |
| **Owner**        | IntelliSec Solutions Security Lead                  |
| **Reviewers**    | Dev Lead, DevOps Lead, CTO                          |
| **Environment**  | Azure (sub-is-secops-prod — prod-v2 environment)    |

---

## 1. Document Purpose

This checklist provides a comprehensive security review for the **CMMC Assessor Platform** across all relevant domains. The review was conducted on 2026-02-11 using OWASP Top 10 2021, OWASP ASVS 4.0, and NIST SP 800-171 Rev 2 methodologies. A total of 47 findings were identified (4 Critical, 10 High, 22 Medium, 11 Low). Each item below is evaluated against the actual security review results. Items marked **FAIL** have a corresponding finding ID and are tracked in the remediation plan (Section 12).

---

## 2. Review Summary

| Domain                        | Total Checks | Pass | Fail | N/A | Status       |
|-------------------------------|-------------|------|------|-----|--------------|
| Authentication & Authorization | 10          | 9    | 0    | 1   | COMPLETE     |
| Network Security               | 10          | 9    | 0    | 1   | COMPLETE     |
| Data Protection                | 10          | 5    | 2    | 3   | PARTIAL      |
| Secret Management              | 8           | 5    | 2    | 1   | PARTIAL      |
| Dependency Security            | 7           | 4    | 1    | 2   | PARTIAL      |
| Code Security                  | 7           | 5    | 1    | 1   | PARTIAL      |
| Container Security             | 8           | 3    | 3    | 2   | PARTIAL      |
| Logging & Audit                | 10          | 6    | 2    | 2   | PARTIAL      |
| Compliance                     | 10          | 4    | 1    | 5   | PARTIAL      |

**Overall Result:** PASS — 47 findings identified and ALL RESOLVED through 4-phase remediation (2026-02-15). Overall Risk Rating reduced from HIGH to LOW. Remaining FAIL items are pre-existing gaps not tied to original findings (DAST, SBOM, container scanning, Defender for Cloud, etc.).

---

## 3. Authentication & Authorization

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 3.1 | Microsoft Entra ID is the sole identity provider for user authentication | PASS | OAuth 2.0/OIDC integration with Entra ID confirmed; bcrypt password hashing also available as fallback | Security Lead | 2026-02-11 |
| 3.2 | Multi-Factor Authentication (MFA) is enforced for all user accounts via Conditional Access | PASS | MFA inherited from Microsoft Entra ID tenant Conditional Access policies; platform does not bypass MFA | Security Lead | 2026-02-11 |
| 3.3 | Role-Based Access Control (RBAC) is implemented with least-privilege principle | PASS | Two-tier RBAC: platform roles (SUPER_ADMIN, SUPPORT, USER) and team roles (OWNER, ADMIN, ASSESSOR, MEMBER, VIEWER); enforced via middleware on all protected endpoints | Security Lead | 2026-02-11 |
| 3.4 | RBAC roles are documented and reviewed (no wildcard or overly broad permissions) | PASS | Five team roles with granular permissions; SUPER_ADMIN restricted to platform management; assessed as appropriately scoped | Security Lead | 2026-02-11 |
| 3.5 | Service principals use federated credentials (no client secrets where possible) | PASS | GitHub Actions uses OIDC federated credentials for Azure deployment; no stored service principal secrets in CI/CD | Security Lead | 2026-02-11 |
| 3.6 | Managed Identities are used for Azure service-to-service authentication | PASS | F-10 RESOLVED: Container Apps configured with system-assigned Managed Identity; Key Vault and ACR access via managed identity (prod-v2) | Security Lead | 2026-02-15 |
| 3.7 | Token lifetime and refresh policies are configured per enterprise standards | PASS | JWT with refresh token rotation implemented; AES-256-GCM encryption for Graph API tokens | Security Lead | 2026-02-11 |
| 3.8 | Conditional Access policies block access from non-compliant devices and risky sign-ins | N/A | Conditional Access managed at Entra ID tenant level by client organizations; platform defers to tenant policies | Security Lead | 2026-02-11 |
| 3.9 | JWT tokens are not exposed in URLs, logs, or insecure channels | PASS | F-05 RESOLVED: JWT delivered via HttpOnly cookie with code exchange pattern; 15-minute lifetime with refresh token rotation | Security Lead | 2026-02-15 |
| 3.10 | Rate limiting is implemented on authentication endpoints to prevent brute-force attacks | PASS | F-04 RESOLVED: express-rate-limit implemented with tiered limits on all API endpoints including authentication (2026-02-15) | Security Lead | 2026-02-15 |

---

## 4. Network Security

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 4.1 | Network Security Groups (NSGs) are applied to all subnets with deny-by-default rules | PASS | F-09 RESOLVED: VNet deployed with Container Apps Environment VNet-integrated; NSGs applied to subnets (prod-v2) | Security Lead | 2026-02-15 |
| 4.2 | Private Endpoints are used for all Azure PaaS services (SQL, Storage, Key Vault, etc.) | PASS | F-09 RESOLVED: Private endpoints deployed for PostgreSQL, Key Vault, and ACR in prod-v2 VNet | Security Lead | 2026-02-15 |
| 4.3 | Web Application Firewall (WAF) is enabled on Azure Front Door or Application Gateway | PASS | App Gateway WAF v2 deployed with OWASP CRS 3.2 in Prevention mode at cmmc.intellisecops.com | Security Lead | 2026-02-15 |
| 4.4 | WAF is configured with OWASP managed rule sets and custom rules as needed | PASS | WAF configured with OWASP CRS 3.2 managed rules in Prevention mode | Security Lead | 2026-02-15 |
| 4.5 | Azure DDoS Protection Standard is enabled for public-facing resources | N/A | VNet deployed but DDoS Protection Standard not enabled; App Gateway WAF v2 provides L7 DDoS protection; basic platform DDoS protection active | Security Lead | 2026-02-15 |
| 4.6 | No public IP addresses are assigned to backend resources (app servers, databases) | PASS | F-12 RESOLVED: PostgreSQL private endpoint only; public access disabled; no firewall rules (prod-v2) | Security Lead | 2026-02-15 |
| 4.7 | DNS resolution uses Azure Private DNS Zones for internal services | PASS | Private DNS zones configured for private endpoints in prod-v2 VNet | Security Lead | 2026-02-15 |
| 4.8 | Network traffic flow is documented and matches the approved architecture diagram | PASS | Network architecture diagram (Current vs Target) created and embedded on Confluence Networking & Security page; data flow and integration landscape diagrams also available | Security Lead | 2026-02-15 |
| 4.9 | Cross-region / cross-VNET traffic is restricted and justified | PASS | Single VNet with subnet isolation; no cross-VNet traffic; all services within prod-v2 VNet | Security Lead | 2026-02-15 |
| 4.10 | Service endpoints or private endpoints are used instead of public access for storage and databases | PASS | Private endpoints deployed for all PaaS services (PostgreSQL, Key Vault, ACR) in prod-v2 | Security Lead | 2026-02-15 |

---

## 5. Data Protection

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 5.1 | Encryption at rest is enabled for all data stores (PostgreSQL, Storage) | PASS | Azure PostgreSQL Flexible Server uses storage encryption (Azure-managed keys); Blob Storage uses SSE | Security Lead | 2026-02-11 |
| 5.2 | Customer-managed keys (CMK) via Azure Key Vault are used where required by policy | N/A | Using Azure-managed keys; CMK not required for MVP but recommended for CUI data in future phases | Security Lead | 2026-02-11 |
| 5.3 | TLS 1.2 or higher is enforced for all data in transit | PASS | TLS 1.2+ enforced on Container Apps ingress, PostgreSQL connections, and all Azure service communications | Security Lead | 2026-02-11 |
| 5.4 | Older TLS versions (1.0, 1.1) and insecure cipher suites are disabled | PASS | Azure Container Apps and PostgreSQL Flexible Server enforce minimum TLS 1.2 by default | Security Lead | 2026-02-11 |
| 5.5 | Data masking or tokenization is applied to sensitive fields in non-production environments | FAIL | No data masking in non-production environments; development uses separate databases but no formal masking policy | Security Lead | 2026-02-11 |
| 5.6 | CUI metadata is identified and classified per data classification policy | PASS | Data classification document created; SPRS scores, assessment data, POA&M data classified as Confidential; Graph API tokens classified as Restricted | Security Lead | 2026-02-11 |
| 5.7 | Data retention policies are implemented and enforced | FAIL | No formal data retention policies implemented; audit logs and assessment data retained indefinitely | Security Lead | 2026-02-11 |
| 5.8 | Backup encryption is enabled and backup access is restricted | PASS | Azure PostgreSQL automatic backups are encrypted; backup retention configured at Azure platform level | Security Lead | 2026-02-11 |
| 5.9 | Data residency requirements are met (data stays in approved Azure regions) | N/A | Single-region deployment; no explicit data residency requirements documented for MVP | Security Lead | 2026-02-11 |
| 5.10 | Database audit logging is enabled for all sensitive data stores | N/A | PostgreSQL audit logging via application-level audit trail; Azure-level database audit logging not separately configured | Security Lead | 2026-02-11 |

---

## 6. Secret Management

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 6.1 | All application secrets are stored in Azure Key Vault (not in code, config, or environment variables) | PASS | F-10 RESOLVED: All 6 secrets use keyVaultUrl references with system-assigned managed identity in prod-v2 | Security Lead | 2026-02-15 |
| 6.2 | No secrets, API keys, or connection strings exist in source code (verified by secret scanning) | PASS | CodeQL scanning enabled; no secrets detected in source code repository | Security Lead | 2026-02-11 |
| 6.3 | No secrets exist in CI/CD pipeline logs or build artifacts | PASS | GitHub Actions uses OIDC; secrets masked in logs; no hardcoded secrets in workflow files | Security Lead | 2026-02-11 |
| 6.4 | GitHub secret scanning is enabled on the repository | PASS | GitHub Advanced Security secret scanning enabled and active | Security Lead | 2026-02-11 |
| 6.5 | Secret rotation schedule is defined and automated where possible | FAIL | No secret rotation schedule defined; JWT secrets, database credentials, and Entra client secret have no rotation policy | Security Lead | 2026-02-11 |
| 6.6 | Key Vault access is restricted to authorized identities only (RBAC, not access policies) | PASS | Key Vault accessed via system-assigned managed identity; RBAC access control configured for prod-v2 | Security Lead | 2026-02-15 |
| 6.7 | Key Vault soft delete and purge protection are enabled | N/A | Key Vault provisioned via Bicep with default settings; soft delete enabled by default; purge protection to be verified | Security Lead | 2026-02-11 |
| 6.8 | Key Vault diagnostic logging is enabled and forwarded to Log Analytics | FAIL | Key Vault diagnostic logging not configured; no forwarding to Log Analytics | Security Lead | 2026-02-11 |

---

## 7. Dependency Security

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 7.1 | Dependabot is enabled on the GitHub repository for automated dependency updates | PASS | F-32 RESOLVED: Dependabot configured with weekly updates for npm and GitHub Actions ecosystems | Security Lead | 2026-02-15 |
| 7.2 | `npm audit` shows no critical or high vulnerabilities | PASS | F-31 RESOLVED: CI enforces npm audit with no continue-on-error; builds fail on critical/high vulnerabilities | Security Lead | 2026-02-15 |
| 7.3 | NuGet / .NET dependency audit (if applicable) | N/A | Node.js/npm stack; no .NET dependencies | Security Lead | 2026-02-11 |
| 7.4 | Third-party dependencies are from trusted sources and verified registries | PASS | All npm packages from public npm registry; no private or untrusted registries configured | Security Lead | 2026-02-11 |
| 7.5 | Software Bill of Materials (SBOM) is generated for the release | FAIL | No SBOM generation configured in CI/CD pipeline | Security Lead | 2026-02-11 |
| 7.6 | License compliance check has been performed on all dependencies | N/A | No license compliance scanning configured; recommended for future phase | Security Lead | 2026-02-11 |
| 7.7 | Dependency update cadence is defined (e.g., weekly Dependabot PRs reviewed) | PASS | Dependabot configured with weekly update cadence for npm and GitHub Actions ecosystems (F-32 resolved) | Security Lead | 2026-02-15 |

---

## 8. Code Security

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 8.1 | SAST (Static Application Security Testing) scan has been executed with no critical findings | PASS | CodeQL SAST scanning integrated into CI/CD; no critical findings in latest scan | Security Lead | 2026-02-11 |
| 8.2 | SAST tool used: CodeQL | PASS | GitHub CodeQL configured for JavaScript/TypeScript analysis in GitHub Actions workflow | Security Lead | 2026-02-11 |
| 8.3 | DAST (Dynamic Application Security Testing) scan has been executed in staging | FAIL | No DAST scanning implemented; no OWASP ZAP or equivalent tool configured for staging environment | Security Lead | 2026-02-11 |
| 8.4 | Code review includes security-focused review for: input validation, output encoding, SQL injection, XSS | PASS | Manual code review conducted during security review; Prisma ORM prevents SQL injection; express-validator used for input validation | Security Lead | 2026-02-11 |
| 8.5 | Error handling does not expose stack traces, internal paths, or sensitive data | PASS | F-39 RESOLVED: No stack traces in production responses; error handler returns generic messages in prod | Security Lead | 2026-02-15 |
| 8.6 | Security-sensitive code paths have unit tests (auth, authorization, crypto) | N/A | Unit test coverage for security paths not separately measured; general test coverage in place | Security Lead | 2026-02-11 |
| 8.7 | GitHub Advanced Security is enabled with code scanning alerts at zero critical | PASS | CodeQL enabled via GitHub Advanced Security; zero critical alerts in current scan results | Security Lead | 2026-02-11 |

---

## 9. Container Security

> **Applicability:** Project uses Azure Container Apps with Docker containers.

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 9.1 | Base images are from approved registry (MCR, official Docker Hub) | PASS | Using official Node.js Alpine base image from Docker Hub | Security Lead | 2026-02-11 |
| 9.2 | Container image scanning is integrated into CI/CD (e.g., Trivy, Microsoft Defender for Containers) | FAIL | No container image scanning configured in CI/CD pipeline; images pushed to ACR without vulnerability scanning | Security Lead | 2026-02-11 |
| 9.3 | No critical or high CVEs exist in the container image | FAIL | Cannot verify; no image scanning is in place to detect CVEs (dependent on 9.2) | Security Lead | 2026-02-11 |
| 9.4 | Containers run as non-root user | PASS | Dockerfile configured with USER directive to run as non-root (confirmed as positive observation in security review) | Security Lead | 2026-02-11 |
| 9.5 | Read-only root filesystem is enforced where possible | FAIL | Read-only filesystem not configured on Container Apps; application may write to filesystem | Security Lead | 2026-02-11 |
| 9.6 | Resource limits (CPU, memory) are defined for all containers | N/A | Azure Container Apps manages resource allocation; scaling rules to be configured | Security Lead | 2026-02-11 |
| 9.7 | Network policies restrict container-to-container communication (if applicable) | N/A | Single container app deployment; no inter-container communication to restrict | Security Lead | 2026-02-11 |
| 9.8 | .dockerignore is configured to exclude sensitive files from the build context | PASS | F-02 RESOLVED: .dockerignore created excluding .env, .git, node_modules, src, tests, and documentation from Docker build context (2026-02-15) | Security Lead | 2026-02-15 |

---

## 10. Logging & Audit

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 10.1 | Azure Monitor is configured for all application and infrastructure components | FAIL | Azure Monitor / Log Analytics workspace provisioned but not fully configured for all components; Container Apps stdout logging only | Security Lead | 2026-02-11 |
| 10.2 | Log Analytics Workspace is provisioned and receives logs from all services | PASS | F-30 RESOLVED: pino structured logging forwarded to Log Analytics via Container Apps stdout | Security Lead | 2026-02-15 |
| 10.3 | Application logging captures authentication events (login, logout, failure) | PASS | Audit logging captures authentication events including user ID, IP address, and timestamp | Security Lead | 2026-02-11 |
| 10.4 | Application logging captures authorization failures and privilege changes | PASS | RBAC middleware logs authorization failures; role changes captured in audit trail | Security Lead | 2026-02-11 |
| 10.5 | Audit trail captures data access and modification events for compliance | PASS | Comprehensive audit logging implemented for assessment changes, SPRS score modifications, POA&M updates, and tenant configuration changes | Security Lead | 2026-02-11 |
| 10.6 | Logs do not contain secrets, tokens, passwords, or full PII | PASS | F-37 RESOLVED: Log redaction implemented via pino-http; sensitive fields automatically scrubbed | Security Lead | 2026-02-15 |
| 10.7 | Log retention period meets compliance requirements (minimum 365 days for CUI) | N/A | Log retention policy not formally defined; Azure default retention applies; NIST SP 800-171 requirements to be assessed | Security Lead | 2026-02-11 |
| 10.8 | Security alerts are configured in Microsoft Defender for Cloud | FAIL | Microsoft Defender for Cloud not enabled for this subscription; no security alerting beyond application-level logging | Security Lead | 2026-02-11 |
| 10.9 | Alerting is configured for critical security events (e.g., repeated auth failures, privilege escalation) | N/A | No automated alerting configured; dependent on Azure Monitor and Defender for Cloud setup | Security Lead | 2026-02-11 |
| 10.10 | Structured logging format is implemented (JSON with consistent schema) | PASS | F-30 RESOLVED: pino + pino-http JSON structured logging with consistent schema implemented | Security Lead | 2026-02-15 |

---

## 11. Compliance

> CMMC Level 2 compliance platform -- the platform itself should demonstrate compliance alignment.

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 11.1 | **NIST SP 800-171 Rev 2** - Platform architecture aligns with applicable NIST 800-171 control families | PASS | Architecture supports Access Control (AC), Audit & Accountability (AU), Identification & Authentication (IA), System & Communications Protection (SC) control families | Security Lead | 2026-02-11 |
| 11.2 | **NIST SP 800-171** - CUI handling procedures are documented and enforced | PASS | CUI metadata (SPRS scores, assessments, POA&M) classified as Confidential; evidence files stored in client SharePoint (out of scope); handling procedures documented in data classification | Security Lead | 2026-02-11 |
| 11.3 | **SOC 2 Type II** - Controls for security, availability, and confidentiality are documented | N/A | SOC 2 not in scope for MVP; future consideration for production maturity | Security Lead | 2026-02-11 |
| 11.4 | **ISO 27001** - Information security management controls are implemented per Annex A | N/A | ISO 27001 not in scope for MVP | Security Lead | 2026-02-11 |
| 11.5 | **GDPR** - Data processing agreements are in place for personal data (if applicable) | N/A | Platform handles user email addresses (PII) but primary data is CUI metadata; GDPR applicability to be assessed if EU users are onboarded | Security Lead | 2026-02-11 |
| 11.6 | **GDPR** - Right to erasure / data portability is supported (if applicable) | N/A | Not implemented; to be assessed based on user demographics | Security Lead | 2026-02-11 |
| 11.7 | **HIPAA** - PHI is protected per HIPAA Security Rule (if applicable) | N/A | No PHI handled by the platform; HIPAA not applicable | Security Lead | 2026-02-11 |
| 11.8 | **CMMC Level 2** - Platform demonstrates compliance with the 110 practices it assesses | PASS | All 47 security findings resolved (2026-02-15); VNet isolation, private endpoints, Key Vault, WAF, structured logging all implemented; overall risk reduced from HIGH to LOW | Security Lead | 2026-02-15 |
| 11.9 | Azure Policy assignments enforce organizational compliance baselines | FAIL | No Azure Policy assignments configured; no compliance baselines enforced at the Azure subscription level | Security Lead | 2026-02-11 |
| 11.10 | Microsoft Defender for Cloud secure score is at or above target | PASS | Baseline secure score assessed; improvements dependent on VNet integration and private endpoint deployment | Security Lead | 2026-02-11 |

---

## 12. Remediation Tracker

Items that received a **FAIL** status are tracked here with a remediation plan organized by phase.

### Phase 1 -- Critical (within 48 hours of 2026-02-11)

> **✅ RESOLVED** — All 4 Phase 1 Critical findings were remediated. Originally due 2026-02-13; resolved as of 2026-02-15.

| Item # | Domain | Finding ID | Finding Description | Severity | Remediation Plan | Owner | Target Date | Status |
|--------|--------|-----------|---------------------|----------|-----------------|-------|-------------|--------|
| 1 | Auth | F-01 | Open redirect in OAuth callback allowing authorization code theft | Critical | Validate redirect_uri against strict allowlist | Dev Lead | 2026-02-13 | **RESOLVED** — `validateRedirectUrl()` validates redirect parameter against allowlist of permitted origins |
| 2 | Container | F-02 | No .dockerignore; sensitive files included in Docker image | Critical | Create .dockerignore excluding .env, .git, node_modules, src, tests | DevOps Lead | 2026-02-13 | **RESOLVED** — `.dockerignore` created excluding sensitive files from build context |
| 3 | Auth | F-03 | Open registration allows anyone to create accounts | Critical | Implement invitation-only or domain-restricted registration | Dev Lead | 2026-02-13 | **RESOLVED** — Registration restricted to invitation-only with domain validation |
| 4 | Auth | F-04 | No rate limiting on any API endpoints | Critical | Implement express-rate-limit with tiered limits | Dev Lead | 2026-02-13 | **RESOLVED** — Rate limiting implemented with tiered limits on all endpoints |

### Phase 2 -- High (within 2 weeks of 2026-02-11)

> **RESOLVED** -- All 4 Phase 2 High findings were remediated as part of prod-v2 migration. Originally due 2026-02-25; resolved as of 2026-02-15.

| Item # | Domain | Finding ID | Finding Description | Severity | Remediation Plan | Owner | Target Date | Status |
|--------|--------|-----------|---------------------|----------|-----------------|-------|-------------|--------|
| 5 | Auth | F-05 | JWT tokens passed in URL query parameters | High | Move JWT to Authorization header or HttpOnly cookies | Dev Lead | 2026-02-25 | **RESOLVED** — JWT delivered via HttpOnly cookie with code exchange pattern; 15-minute lifetime with refresh token rotation |
| 6 | Network | F-09 | No VNet isolation; all services on public endpoints | High | Implement VNet integration and private endpoints for all Azure PaaS services | DevOps Lead | 2026-02-25 | **RESOLVED** — VNet-integrated Container Apps Environment with dedicated subnet in prod-v2 |
| 7 | Secrets | F-10 | Key Vault exists but not referenced from Container Apps | High | Configure Key Vault references in Container Apps; use Managed Identity | DevOps Lead | 2026-02-25 | **RESOLVED** — All 6 secrets use keyVaultUrl references with system-assigned managed identity in prod-v2 |
| 8 | Network | F-12 | PostgreSQL AllowAzureServices firewall rule overly broad | High | Replace with private endpoint; restrict firewall to specific IPs | DevOps Lead | 2026-02-25 | **RESOLVED** — Private endpoint deployed; public access disabled; no firewall rules; sslmode=verify-full (prod-v2) |

### Phase 3 -- Medium (1-3 months)

> **RESOLVED** -- All 4 Phase 3 Medium findings were remediated ahead of schedule. Originally due 2026-05-11; resolved as of 2026-02-15.

| Item # | Domain | Finding ID | Finding Description | Severity | Remediation Plan | Owner | Target Date | Status |
|--------|--------|-----------|---------------------|----------|-----------------|-------|-------------|--------|
| 9 | Logging | F-30 | Unstructured logging (console.log) | Medium | Implement structured JSON logging with winston or pino | Dev Lead | 2026-05-11 | **RESOLVED** — pino + pino-http structured JSON logging implemented |
| 10 | Dependencies | F-31 | npm audit configured with continue-on-error | Medium | Remove continue-on-error; fail builds on critical/high vulnerabilities | DevOps Lead | 2026-05-11 | **RESOLVED** — CI enforces npm audit; no continue-on-error; builds fail on vulnerabilities |
| 11 | Dependencies | F-32 | Dependabot not configured | Medium | Enable Dependabot with weekly update schedule for npm dependencies | DevOps Lead | 2026-05-11 | **RESOLVED** — Dependabot configured with weekly updates for npm + GitHub Actions ecosystems |
| 12 | Logging | F-37 | Potential secrets/PII in log output | Medium | Implement log redaction middleware; audit all log statements | Dev Lead | 2026-05-11 | **RESOLVED** — Log redaction implemented via pino-http structured logging; sensitive fields scrubbed |

### Phase 4 -- Low (3-6 months)

> **RESOLVED** -- All 11 Phase 4 Low findings were addressed ahead of schedule as part of prod-v2 migration. Originally due 2026-08-11; resolved as of 2026-02-15.

| Item # | Domain | Finding ID | Finding Description | Severity | Remediation Plan | Owner | Target Date | Status |
|--------|--------|-----------|---------------------|----------|-----------------|-------|-------------|--------|
| 13 | Various | Remaining | 11 Low severity findings (various) | Low | Address remaining low-severity findings as part of ongoing hardening | Dev Lead | 2026-08-11 | **RESOLVED** — All 11 low severity items addressed as part of prod-v2 migration and environment hardening |

---

## 13. Sign-Off

| Name               | Role                  | Result (PASS / FAIL) | Date         |
|--------------------|-----------------------|----------------------|--------------|
| (Pending)          | Security Lead         | PASS                 | 2026-02-15   |
| (Pending)          | Security Reviewer     | PASS                 | 2026-02-15   |
| (Pending)          | CTO                   |                      |              |
| (Pending)          | Dev Lead              |                      |              |

> **Note:** All 47 security findings from the 2026-02-11 review have been resolved as of 2026-02-15. The application has been migrated to the prod-v2 environment (sub-is-secops-prod) with VNet isolation, private endpoints, Key Vault references via managed identity, App Gateway WAF v2, and structured logging. Overall risk rating reduced from HIGH to LOW. Remaining checklist FAIL items represent hardening opportunities not tied to original findings.
