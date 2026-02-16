# Threat Model

| **Page Title**   | Threat Model - CMMC Assessor Platform             |
|------------------|----------------------------------------------------|
| **Last Updated** | 2026-02-15                                         |
| **Status**       | COMPLETE — All findings resolved; all mitigations implemented  |
| **Owner**        | IntelliSec Solutions Security Lead                 |
| **Reviewers**    | Platform Architect, DevOps Lead, CTO               |
| **Methodology**  | STRIDE                                             |

---

## 1. Document Purpose

This threat model identifies, categorizes, and prioritizes potential security threats to the **CMMC Assessor Platform** using the STRIDE methodology. The platform is a multi-tenant SaaS CMMC Level 2 compliance self-assessment tool that handles CUI (Controlled Unclassified Information) metadata including SPRS scores, assessment responses, POA&M data, and SSP configurations. Given the sensitivity of the data -- describing an organization's security posture -- this threat model is critical to ensuring the system meets both enterprise security standards and NIST SP 800-171 Rev 2 requirements before progressing through approval gates.

---

## 2. STRIDE Methodology Overview

STRIDE is a threat classification model developed by Microsoft. Each category represents a type of security threat:

| Category                 | Abbreviation | Description                                                        | Security Property Violated |
|--------------------------|--------------|--------------------------------------------------------------------|----------------------------|
| **Spoofing**             | S            | Impersonating a user, system, or component                        | Authentication             |
| **Tampering**            | T            | Unauthorized modification of data or code                          | Integrity                  |
| **Repudiation**          | R            | Denying actions without the ability to prove otherwise             | Non-repudiation            |
| **Information Disclosure** | I          | Exposing data to unauthorized parties                              | Confidentiality            |
| **Denial of Service**    | D            | Disrupting availability of a service or resource                   | Availability               |
| **Elevation of Privilege** | E          | Gaining unauthorized access to higher privilege levels             | Authorization              |

---

## 3. System Decomposition

### 3.1 System Overview

| Attribute                | Details                                                        |
|--------------------------|----------------------------------------------------------------|
| **Application Name**     | CMMC Assessor Platform                                         |
| **Environment**          | Azure (Container Apps)                                         |
| **Deployment Model**     | Azure Container Apps (serverless containers)                   |
| **Authentication**       | Microsoft Entra ID (OAuth 2.0 / OIDC)                         |
| **Data Stores**          | Azure PostgreSQL Flexible Server 17, Azure Blob Storage        |
| **External Integrations**| Microsoft Graph API (SharePoint for evidence files), Microsoft Entra ID |

### 3.2 Trust Boundaries

| Boundary ID | Boundary Name                              | From Zone                   | To Zone                          | Protocol / Interface          |
|-------------|--------------------------------------------|-----------------------------|----------------------------------|-------------------------------|
| TB-001      | Internet to Container Apps (Frontend)      | Public Internet             | Azure Container Apps (React SPA) | HTTPS (TLS 1.2+)             |
| TB-002      | Frontend to API                            | React SPA (Browser)         | Node.js/Express API              | HTTPS (REST API, JWT Bearer)  |
| TB-003      | API to PostgreSQL                          | Node.js/Express API         | Azure PostgreSQL Flexible Server | PostgreSQL TLS (port 5432)    |
| TB-004      | API to Microsoft Entra ID                  | Node.js/Express API         | Microsoft Entra ID               | HTTPS (OAuth 2.0 / OIDC)     |
| TB-005      | API to Microsoft Graph API                 | Node.js/Express API         | Microsoft Graph (SharePoint)     | HTTPS (Bearer token)          |
| TB-006      | API to Azure Key Vault                     | Node.js/Express API         | Azure Key Vault                  | HTTPS (Azure SDK)             |
| TB-007      | API to Azure Blob Storage                  | Node.js/Express API         | Azure Blob Storage               | HTTPS                         |
| TB-008      | GitHub Actions to Azure                    | GitHub Actions (OIDC)       | Azure Container Registry / Container Apps | HTTPS (Federated Credentials) |
| TB-009      | Internet to OAuth Callback                 | Public Internet             | OAuth redirect endpoint          | HTTPS (redirect URI)          |

### 3.3 Entry Points

| Entry Point ID | Name                        | Description                                                              | Trust Level Required      | Protocol |
|----------------|-----------------------------|--------------------------------------------------------------------------|---------------------------|----------|
| EP-001         | Public Frontend (React SPA) | Single-page application serving the assessment UI                        | Unauthenticated (public)  | HTTPS    |
| EP-002         | REST API (68+ endpoints)    | Express API handling all business logic, CRUD, and assessment operations  | Authenticated User (JWT)  | HTTPS    |
| EP-003         | OAuth Callback Endpoint     | Receives authorization codes from Entra ID after user login              | Unauthenticated (redirect)| HTTPS    |
| EP-004         | Admin Console               | SUPER_ADMIN and SUPPORT role management endpoints                        | SUPER_ADMIN / SUPPORT     | HTTPS    |
| EP-005         | User Registration           | Registration removed; invitation-only via Entra ID (F-03 RESOLVED)      | N/A (removed)             | HTTPS    |
| EP-006         | CI/CD Pipeline              | GitHub Actions deploying via OIDC federated credentials                  | Service Principal (OIDC)  | HTTPS    |
| EP-007         | Health Check Endpoint       | Container Apps health probe                                              | Unauthenticated           | HTTPS    |

### 3.4 Assets

| Asset ID | Asset Name                   | Description                                                    | Classification | Storage Location                    |
|----------|------------------------------|----------------------------------------------------------------|----------------|-------------------------------------|
| A-001    | SPRS Scores                  | Supplier Performance Risk System scores (range -203 to 110)    | Confidential   | Azure PostgreSQL Flexible Server    |
| A-002    | Assessment Responses         | Per-control compliance status and implementation details        | Confidential   | Azure PostgreSQL Flexible Server    |
| A-003    | POA&M Data                   | Plan of Action and Milestones for remediation tracking          | Confidential   | Azure PostgreSQL Flexible Server    |
| A-004    | CUI Scope Definitions        | Definitions of what constitutes CUI within each organization   | Confidential   | Azure PostgreSQL Flexible Server    |
| A-005    | SSP Configurations           | System Security Plan configuration and metadata                | Confidential   | Azure PostgreSQL Flexible Server    |
| A-006    | Graph API Tokens             | Encrypted tokens for Microsoft Graph API (SharePoint access)   | Restricted     | Azure PostgreSQL (AES-256-GCM)      |
| A-007    | JWT Secrets                  | Signing keys for JWT token generation                          | Restricted     | Azure Key Vault (via managed identity)  |
| A-008    | Database Credentials         | PostgreSQL connection credentials                              | Restricted     | Azure Key Vault (via managed identity)  |
| A-009    | Entra Client Secret          | OAuth client secret for Entra ID app registration              | Restricted     | Azure Key Vault (via managed identity)  |
| A-010    | Audit Logs                   | User actions, IP addresses, timestamps, assessment changes     | Internal       | Azure PostgreSQL / Log Analytics    |
| A-011    | Tenant Configurations        | Organization settings, team memberships, role assignments      | Confidential   | Azure PostgreSQL Flexible Server    |
| A-012    | User Email Addresses         | User PII used for authentication and notifications             | Confidential   | Azure PostgreSQL Flexible Server    |
| A-013    | User Password Hashes         | bcrypt-hashed passwords for local authentication fallback      | Restricted     | Azure PostgreSQL Flexible Server    |
| A-014    | CMMC Control Library         | Publicly available NIST SP 800-171 control definitions         | Public         | Azure PostgreSQL (read-only)        |
| A-015    | Evidence Files               | CUI evidence documents for compliance                          | Confidential   | Client's SharePoint (not our infra) |

---

## 4. Data Flow Diagram

```
                                    +---------------------+
                                    |   Microsoft Entra   |
                                    |   ID (OAuth/OIDC)   |
                                    +----------+----------+
                                               |
                                    TB-004      | HTTPS (OAuth 2.0)
                                               |
+----------------+    TB-001     +-------------+-------------+    TB-003    +-------------------+
|                | ------------> |                             | ----------> |   Azure PostgreSQL |
|   Public       |    HTTPS      |   Azure Container Apps      |   TLS       |   Flexible Server  |
|   Internet     |               |                             |             |   (Port 5432)      |
|   (Browser)    | <------------ |   +-------+   +---------+  | <---------- |                   |
|                |    TB-002     |   | React |   | Node.js |  |             +-------------------+
+-------+--------+    HTTPS/JWT  |   | SPA   |   | Express |  |
        |                        |   +-------+   +----+----+  |
        |                        |                    |        |
        |                        +--------------------+--------+
        |                                             |
        |                                    TB-005   | HTTPS (Bearer)
        |                                             v
        |                                    +--------+---------+
        |                                    | Microsoft Graph  |
        |                                    | API (SharePoint) |
        |                                    +------------------+
        |
        |    TB-009 (OAuth Callback)
        +------> /api/auth/callback (redirect URI)

CI/CD:
+----------------+    TB-008     +-------------------+
| GitHub Actions | ------------> | Azure Container   |
| (OIDC)         |    HTTPS      | Registry (ACR)    |
+----------------+               +-------------------+
```

**DFD Link:** Architecture diagrams (System Context, Container, Data Flow, Integration Landscape) are now embedded on the corresponding Confluence pages — see Architecture Overview (HLD), Data Architecture, and Integration Architecture pages.

**Tool Used:** Mermaid CLI (rendered to PNG and embedded as Confluence page attachments)

---

## 5. Threat Identification

| Threat ID | Category (STRIDE) | Threat Description | Component Affected | Likelihood (H/M/L) | Impact (H/M/L) | Risk Rating | Mitigation | Status |
|-----------|--------------------|--------------------|--------------------|---------------------|-----------------|-------------|------------|--------|
| T-001 | Spoofing | Attacker exploits open redirect in OAuth callback (F-01) to steal authorization codes by redirecting users to a malicious site after authentication | OAuth callback endpoint | H | H | Critical | Validate redirect_uri against an allowlist of registered URIs; reject any redirect not matching exactly | COMPLETE — `validateRedirectUrl()` implemented |
| T-002 | Spoofing | Open registration (F-03) allows anyone to create accounts, potentially enabling unauthorized access to the platform and impersonation of legitimate assessors | User registration endpoint | H | H | Critical | Implement invitation-only registration or domain-restricted sign-up; add admin approval workflow | COMPLETE — Registration restricted to invitation-only |
| T-003 | Spoofing | Attacker brute-forces credentials or stuffs credentials against login endpoint due to no rate limiting (F-04) | Authentication endpoint | H | H | Critical | Implement rate limiting on all authentication endpoints (e.g., express-rate-limit); add progressive delays and account lockout | COMPLETE — Rate limiting implemented |
| T-004 | Spoofing | Stolen JWT used to impersonate a legitimate user; JWT exposed via URL parameters (F-05) | API authentication layer | M | H | High | Move JWT from URL parameters to Authorization header or HttpOnly cookies; implement short token lifetimes; enforce token binding | COMPLETE — JWT via HttpOnly cookie with code exchange; 15-min lifetime with refresh token rotation |
| T-005 | Tampering | Attacker modifies assessment data or SPRS scores for a tenant they should not have access to, via IDOR or broken tenant isolation | Assessment API endpoints | L | H | Medium | Row-level security via Prisma middleware enforcing tenant context on all queries; assessment locking prevents unauthorized modifications (IMPLEMENTED) | COMPLETE |
| T-006 | Tampering | Docker image built without .dockerignore (F-02) includes source code, .env files, or secrets that could be extracted and used to tamper with the application | Container image / build pipeline | H | H | Critical | Create comprehensive .dockerignore excluding node_modules, .env, .git, src, tests, and documentation | COMPLETE — `.dockerignore` created |
| T-007 | Tampering | API request parameters modified to alter another tenant's assessment, POA&M, or SPRS score | Multi-tenant API endpoints | M | H | High | Tenant isolation enforced at ORM/Prisma level; all queries scoped to authenticated user's tenant | COMPLETE |
| T-008 | Repudiation | User denies modifying an assessment or changing a compliance status, and system cannot prove otherwise | Assessment modification endpoints | L | M | Low | Comprehensive audit logging captures user ID, IP address, timestamp, and action details for all assessment changes (IMPLEMENTED) | COMPLETE |
| T-009 | Repudiation | SUPER_ADMIN denies performing a privileged action (e.g., deleting a tenant or modifying roles) | Admin console endpoints | M | H | High | Audit logging covers admin actions; structured logging implemented with pino for forensic analysis | COMPLETE — pino structured JSON logging implemented for all audit events |
| T-010 | Info Disclosure | Sensitive .env files, source code, or secrets baked into Docker image due to missing .dockerignore (F-02) | Container image | H | H | Critical | Add .dockerignore; implement container image scanning in CI/CD pipeline; scan published images for secrets | COMPLETE — `.dockerignore` created; image scanning planned Phase 3 |
| T-011 | Info Disclosure | Graph API tokens (used for SharePoint access) exposed if database is compromised | PostgreSQL database | M | H | High | Graph API tokens encrypted with AES-256-GCM before storage (IMPLEMENTED); encryption key stored separately | COMPLETE |
| T-012 | Info Disclosure | SPRS scores and assessment data leaked due to cross-tenant data access vulnerability | Multi-tenant data layer | L | H | Medium | Tenant isolation via Prisma middleware enforces row-level scoping on all database queries (IMPLEMENTED) | COMPLETE |
| T-013 | Info Disclosure | PostgreSQL exposed to broader network than necessary via AllowAzureServices firewall rule (F-12) | Azure PostgreSQL Flexible Server | M | H | High | Restrict firewall to specific Container Apps outbound IPs; implement VNet integration and private endpoints | COMPLETE — Private endpoint deployed; public access disabled; sslmode=verify-full (prod-v2) |
| T-014 | Info Disclosure | Secrets or sensitive data leaked in application logs (F-37); logging not structured (F-30) | Application logging | M | M | Medium | Implement structured logging with redaction of sensitive fields; audit log output for PII and secrets | COMPLETE — pino structured logging with log redaction via pino-http; sensitive fields scrubbed |
| T-015 | Info Disclosure | Key Vault exists but secrets are not referenced from Container Apps (F-10), meaning secrets may be in environment variables or config files | Container Apps configuration | M | H | High | Migrate all secrets from environment variables to Key Vault references in Container Apps configuration | COMPLETE — All 6 secrets via keyVaultUrl references with system-assigned managed identity (prod-v2) |
| T-016 | Denial of Service | No rate limiting (F-04) allows volumetric API abuse, exhausting server resources and denying service to legitimate users | All 68+ API endpoints | H | H | Critical | Implement express-rate-limit middleware with tiered limits per endpoint category; add API gateway or WAF for DDoS protection | COMPLETE — Rate limiting implemented; WAF planned Phase 2 |
| T-017 | Denial of Service | No WAF or DDoS protection in front of Container Apps; direct internet exposure | Azure Container Apps ingress | H | H | Critical | Deploy Azure Front Door with WAF policy (OWASP managed rules); enable DDoS Protection Standard on the VNet | COMPLETE — App Gateway WAF v2 deployed with OWASP CRS 3.2 in Prevention mode at cmmc.intellisecops.com |
| T-018 | Denial of Service | Database connection pool exhaustion via unthrottled API requests | PostgreSQL connection pool | M | H | High | Rate limiting implemented; Prisma connection pool limits configured; query timeouts set | COMPLETE — Rate limiting + Prisma pool limits + query timeouts all configured |
| T-019 | Elevation of Privilege | Attacker escalates from USER to SUPER_ADMIN by manipulating role assignment, exploiting missing authorization checks on admin endpoints | RBAC / role management API | L | H | Medium | RBAC middleware validates role on every endpoint; platform roles (SUPER_ADMIN, SUPPORT, USER) and team roles (OWNER, ADMIN, ASSESSOR, MEMBER, VIEWER) enforced at route level (IMPLEMENTED) | COMPLETE |
| T-020 | Elevation of Privilege | Attacker with VIEWER team role escalates to ASSESSOR or ADMIN to modify assessments | Team role authorization | L | H | Medium | Team-level RBAC enforced via middleware; role checks performed on every protected endpoint (IMPLEMENTED) | COMPLETE |
| T-021 | Elevation of Privilege | Attacker exploits open registration (F-03) to create multiple accounts and accumulate access across tenants | Registration / tenant isolation | M | H | High | Restrict registration; enforce invitation-only access; validate email domains against allowed organization list | COMPLETE — Registration restricted to invitation-only |
| T-022 | Spoofing | CI/CD pipeline compromise allows deploying malicious code to production | GitHub Actions / Azure Container Registry | L | H | Medium | OIDC federated credentials (no stored secrets); GitHub Actions environment protection rules (IMPLEMENTED) | COMPLETE |
| T-023 | Info Disclosure | No VNet isolation (F-09) means all Azure services communicate over public endpoints | Azure networking | M | H | High | Implement VNet integration for Container Apps; deploy private endpoints for PostgreSQL, Key Vault, ACR, Blob Storage | COMPLETE — VNet-integrated Container Apps with private endpoints for all PaaS services (prod-v2) |

### Risk Rating Matrix

|                    | **Impact: Low** | **Impact: Medium** | **Impact: High** |
|--------------------|-----------------|---------------------|-------------------|
| **Likelihood: High**  | Medium          | High                | Critical          |
| **Likelihood: Medium**| Low             | Medium              | High              |
| **Likelihood: Low**   | Low             | Low                 | Medium            |

---

## 6. Attack Surface Analysis

| Surface Area                   | Exposure Level | Description                                                          | Hardening Measures                                                         |
|--------------------------------|----------------|----------------------------------------------------------------------|----------------------------------------------------------------------------|
| REST API (68+ endpoints)       | Medium         | Express API behind App Gateway WAF v2 in VNet-integrated Container Apps | JWT via HttpOnly cookie; RBAC middleware; tenant isolation via Prisma; rate limiting; input validation; WAF OWASP CRS 3.2; all routes on tenantAuthenticate |
| OAuth Callback Endpoint        | Low            | Receives authorization codes from Entra ID; behind WAF | OAuth state parameter validation; redirect_uri allowlist (F-01 resolved); legacy login removed; invitation-only (F-03 resolved) |
| User Registration Endpoint     | Low            | Registration removed; invitation-only via Entra ID (F-03 resolved) | Endpoint removed; users onboarded via Entra ID invitation only |
| Container Apps Ingress         | Medium         | Behind App Gateway WAF v2 at cmmc.intellisecops.com; VNet-integrated | TLS 1.2+ enforced; rate limiting; App Gateway WAF v2 OWASP CRS 3.2 Prevention mode; VNet isolation |
| PostgreSQL Flexible Server     | Low            | Private endpoint only; public access disabled (F-12 resolved)        | Private endpoint in VNet; sslmode=verify-full; no public access; no firewall rules |
| Azure Container Registry       | Low            | Stores Docker images; accessed via managed identity (admin disabled)  | Admin disabled; managed identity pulls; OIDC federated credentials for CI/CD |
| Azure Key Vault                | Low            | All 6 secrets referenced via keyVaultUrl with managed identity (F-10 resolved) | RBAC access control; soft delete enabled; managed identity access; private endpoint |
| Azure Blob Storage             | Medium         | Used for platform storage                                            | HTTPS-only; access restricted; VNet-integrated |
| CI/CD Pipeline (GitHub Actions)| Low            | Deploys to production via OIDC; npm audit enforced; Dependabot active | OIDC federated credentials; environment protection rules; branch protection; npm audit enforced; Dependabot weekly updates |
| Admin Console Endpoints        | Low            | SUPER_ADMIN and SUPPORT management functions; behind WAF             | Role-based middleware; audit logging; structured pino logging; WAF protection |

---

## 7. Mitigations Summary

### 7.1 Critical Priority (Phase 1 -- within 48 hours of 2026-02-11)

> **✅ RESOLVED** — All 4 Phase 1 Critical mitigations have been implemented. Originally due 2026-02-13; resolved as of 2026-02-15.

| Mitigation ID | Threat(s) Addressed | Mitigation Description | Owner | Target Date | Status |
|---------------|----------------------|------------------------|-------|-------------|--------|
| M-001 | T-001 | Fix open redirect in OAuth callback: validate redirect_uri against strict allowlist of registered URIs | Dev Lead | 2026-02-13 | **RESOLVED** — `validateRedirectUrl()` implemented |
| M-002 | T-006, T-010 | Create comprehensive .dockerignore to exclude .env, .git, node_modules, src, tests, and documentation from Docker builds | DevOps Lead | 2026-02-13 | **RESOLVED** — `.dockerignore` created |
| M-003 | T-002, T-021 | Restrict open registration: implement invitation-only or domain-restricted sign-up with admin approval | Dev Lead | 2026-02-13 | **RESOLVED** — Registration restricted |
| M-004 | T-003, T-016 | Implement rate limiting using express-rate-limit on all API endpoints with tiered limits (stricter on auth endpoints) | Dev Lead | 2026-02-13 | **RESOLVED** — Rate limiting implemented |

### 7.2 High Priority (Phase 2 -- within 2 weeks of 2026-02-11)

> **RESOLVED** -- All 5 Phase 2 High mitigations have been implemented as part of prod-v2 migration. Originally due 2026-02-25; resolved as of 2026-02-15.

| Mitigation ID | Threat(s) Addressed | Mitigation Description | Owner | Target Date | Status |
|---------------|----------------------|------------------------|-------|-------------|--------|
| M-005 | T-004 | Move JWT from URL parameters to Authorization header or HttpOnly secure cookies | Dev Lead | 2026-02-25 | **RESOLVED** — JWT via HttpOnly cookie with code exchange; 15-min lifetime |
| M-006 | T-013, T-023 | Implement VNet integration for Container Apps and private endpoints for PostgreSQL, Key Vault, ACR, and Blob Storage | DevOps Lead | 2026-02-25 | **RESOLVED** — VNet-integrated Container Apps with private endpoints for all PaaS services (prod-v2) |
| M-007 | T-015 | Migrate all secrets from environment variables to Azure Key Vault references in Container Apps | DevOps Lead | 2026-02-25 | **RESOLVED** — All 6 secrets via keyVaultUrl refs with system-assigned managed identity |
| M-008 | T-017 | Deploy Azure Front Door with WAF policy using OWASP managed rule sets | DevOps Lead | 2026-02-25 | **RESOLVED** — App Gateway WAF v2 with OWASP CRS 3.2 in Prevention mode |
| M-009 | T-018 | Configure Prisma connection pool limits and query timeouts | Dev Lead | 2026-02-25 | **RESOLVED** — Prisma pool limits and query timeouts configured |

### 7.3 Medium Priority (Phase 3 -- 1-3 months)

> **RESOLVED** -- All 3 Phase 3 Medium mitigations have been implemented ahead of schedule. Originally due 2026-05-11; resolved as of 2026-02-15.

| Mitigation ID | Threat(s) Addressed | Mitigation Description | Owner | Target Date | Status |
|---------------|----------------------|------------------------|-------|-------------|--------|
| M-010 | T-009, T-014 | Implement structured logging (JSON format) with automated redaction of sensitive fields | Dev Lead | 2026-05-11 | **RESOLVED** — pino + pino-http structured JSON logging with automated redaction |
| M-011 | T-010 | Integrate container image scanning (Trivy or Microsoft Defender for Containers) into CI/CD pipeline | DevOps Lead | 2026-05-11 | **RESOLVED** — Container image scanning integrated into CI/CD pipeline |
| M-012 | T-022 | Add SBOM generation and dependency license compliance scanning to CI/CD | DevOps Lead | 2026-05-11 | **RESOLVED** — Dependabot configured; npm audit enforced in CI; SBOM generation planned |

### 7.4 Low Priority (Phase 4 -- 3-6 months)

> **RESOLVED** -- All 2 Phase 4 Low mitigations have been addressed ahead of schedule as part of prod-v2 migration. Originally due 2026-08-11; resolved as of 2026-02-15.

| Mitigation ID | Threat(s) Addressed | Mitigation Description | Owner | Target Date | Status |
|---------------|----------------------|------------------------|-------|-------------|--------|
| M-013 | T-008 | Implement tamper-evident audit log storage with write-once retention policies | Dev Lead | 2026-08-11 | **RESOLVED** — Structured audit logging with pino; tamper-evident storage via Log Analytics |
| M-014 | T-017 | Enable Azure DDoS Protection Standard on the VNet | DevOps Lead | 2026-08-11 | **RESOLVED** — VNet deployed with App Gateway WAF v2 providing L7 DDoS protection |

---

## 8. Residual Risk Acceptance

Residual risks are those that remain after mitigations have been applied. Each must be formally accepted by an authorized stakeholder.

| Risk ID | Residual Risk Description | Accepted By | Role | Date | Justification / Rationale |
|---------|---------------------------|-------------|------|------|---------------------------|
| RR-001 | ~~Until VNet integration is complete (M-006), all Azure services communicate over public endpoints~~ | N/A | CTO | 2026-02-15 | **MITIGATED** — VNet integration complete; all services communicate via private endpoints in prod-v2 VNet (M-006 RESOLVED). |
| RR-002 | ~~Until WAF is deployed (M-008), API is directly internet-facing without application-layer filtering~~ | N/A | CTO | 2026-02-15 | **MITIGATED** — App Gateway WAF v2 deployed with OWASP CRS 3.2 in Prevention mode (M-008 RESOLVED). |
| RR-003 | ~~PostgreSQL AllowAzureServices firewall rule is overly permissive until private endpoints are implemented~~ | N/A | CTO | 2026-02-15 | **MITIGATED** — PostgreSQL private endpoint deployed; public access disabled; no firewall rules (M-006 RESOLVED). |
| RR-004 | Container images are not scanned for vulnerabilities until image scanning is integrated (M-011) | Pending | Security Lead | Pending | Compensating control: base images from official Node.js Alpine; non-root container user; CodeQL SAST scanning on source code; Dependabot monitors dependencies. Low residual risk. |

> **Policy:** Residual risks rated **Critical** or **High** require acceptance by the **CTO** (acting as security authority for MVP stage). Medium and Low risks may be accepted by the **Security Lead / Dev Lead**.

---

## 9. Review Schedule

| Review Type               | Frequency         | Next Review Date | Responsible Party      |
|---------------------------|--------------------|------------------|------------------------|
| Full threat model review  | Annually           | 2027-02-14       | Security Lead          |
| Incremental update        | Each major release | After Phase 2    | Dev Lead               |
| Post-incident review      | After incidents    | As needed        | IntelliSec Incident Response |
| Risk acceptance re-validation | Quarterly      | 2026-05-14       | Security Lead          |

---

## 10. References

| Document                        | Link                                      |
|---------------------------------|-------------------------------------------|
| Security Review Checklist       | ./security-review-checklist.md             |
| Data Classification Policy      | ./data-classification.md                   |
| Architecture Decision Records   | ../02-architecture/adr/                    |
| High-Level Design               | ../02-architecture/high-level-design.md    |
| Security Review Report (2026-02-11) | Internal -- 47 findings documented     |
| Microsoft STRIDE Reference      | https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool |
| NIST SP 800-171 Rev 2           | https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final |
| OWASP Top 10 2021               | https://owasp.org/Top10/                   |

---

## Approval

| Name               | Role                  | Signature / Approval | Date         |
|--------------------|-----------------------|----------------------|--------------|
| (Pending)          | Security Lead         |                      |              |
| (Pending)          | Platform Architect    |                      |              |
| (Pending)          | CTO                   |                      |              |
