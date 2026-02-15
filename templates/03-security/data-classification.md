# Data Classification

| **Page Title**   | Data Classification - CMMC Assessor Platform     |
|------------------|--------------------------------------------------|
| **Last Updated** | 2026-02-15                                       |
| **Status**       | COMPLETE                                         |
| **Owner**        | IntelliSec Solutions Security Lead               |
| **Reviewers**    | Dev Lead, CTO, Compliance Advisor                |
| **Policy Ref**   | NIST SP 800-171 Rev 2, CMMC Level 2 Assessment Guide |

---

## 1. Document Purpose

This document defines the data classification framework for the **CMMC Assessor Platform**, inventories all data elements processed by the system, specifies handling requirements per classification level, and establishes access controls and incident procedures. The platform handles CUI (Controlled Unclassified Information) metadata -- the assessments, SPRS scores, and POA&M data describe an organization's security posture, which itself is sensitive. Evidence files containing actual CUI are stored in the client's own SharePoint and are not within our infrastructure. This document supports compliance with NIST SP 800-171 Rev 2 requirements and CMMC Level 2 practices.

---

## 2. Classification Levels

| Level | Label | Description | Examples (CMMC Assessor Platform) | Handling Requirements |
|-------|-------|-------------|-----------------------------------|----------------------|
| **1** | **Public** | Information approved for unrestricted public access. Disclosure causes no harm. | CMMC control library (NIST SP 800-171 control definitions), application UI assets, public documentation, CMMC framework descriptions | No special handling. May be stored on public endpoints. No encryption requirement beyond TLS in transit. |
| **2** | **Internal** | Information intended for internal use only. Disclosure could cause minor inconvenience but no significant harm. | Audit logs, system configuration, deployment parameters, policy templates, infrastructure architecture diagrams, error logs (sanitized) | Store on internal/corporate systems only. Access restricted to authenticated employees. Encrypt in transit (TLS 1.2+). |
| **3** | **Confidential** | Sensitive business or security posture information. Unauthorized disclosure could reveal an organization's cybersecurity weaknesses and cause significant harm. | SPRS scores, assessment responses, POA&M data, CUI scope definitions, SSP configurations, tenant settings, user email addresses, team membership data | Encrypt at rest and in transit. Access restricted by role (RBAC). Log all access. Mask in non-production environments. Retention policies enforced. Tenant isolation required. |
| **4** | **Restricted** | Highly sensitive cryptographic or authentication material. Unauthorized disclosure could lead to full system compromise or unauthorized access to client data. | Graph API tokens (AES-256-GCM encrypted), JWT signing secrets, database credentials, Entra ID client secret, bcrypt password hashes, encryption keys | Encrypt at rest (AES-256-GCM or Key Vault) and in transit. Strict need-to-know access. Full audit trail on every access. No copies in non-production without explicit approval. Automatic rotation where possible. |

---

## 3. Data Inventory

| Data Element | Source | Classification Level | Storage Location | Encryption at Rest | Encryption in Transit | Access Control | Retention Period | Notes |
|-------------|--------|---------------------|------------------|--------------------|-----------------------|---------------|-----------------|-------|
| SPRS Scores | Assessment calculations | Confidential | Azure PostgreSQL Flexible Server | Azure-managed TDE | TLS 1.2+ | App RBAC: ASSESSOR+ (team level); SUPER_ADMIN (platform) | Organization account lifetime | Range -203 to 110; reveals security posture |
| Assessment Responses | User input (per-control) | Confidential | Azure PostgreSQL Flexible Server | Azure-managed TDE | TLS 1.2+ | App RBAC: ASSESSOR+ within tenant | Organization account lifetime | Per-control compliance status (MET, NOT_MET, PARTIALLY_MET, N/A) |
| POA&M Data | User input | Confidential | Azure PostgreSQL Flexible Server | Azure-managed TDE | TLS 1.2+ | App RBAC: ASSESSOR+ within tenant | Organization account lifetime | Remediation milestones, target dates, responsible parties |
| CUI Scope Definitions | User input | Confidential | Azure PostgreSQL Flexible Server | Azure-managed TDE | TLS 1.2+ | App RBAC: ADMIN+ within tenant | Organization account lifetime | Defines what constitutes CUI within each organization |
| SSP Configurations | User input | Confidential | Azure PostgreSQL Flexible Server | Azure-managed TDE | TLS 1.2+ | App RBAC: ADMIN+ within tenant | Organization account lifetime | System Security Plan metadata and configuration |
| Tenant Settings | Admin configuration | Confidential | Azure PostgreSQL Flexible Server | Azure-managed TDE | TLS 1.2+ | App RBAC: OWNER/ADMIN within tenant; SUPER_ADMIN | Organization account lifetime | Organization name, settings, feature flags |
| User Email Addresses | User registration / Entra ID | Confidential | Azure PostgreSQL Flexible Server | Azure-managed TDE | TLS 1.2+ | App RBAC: ADMIN+ within tenant; SUPPORT; SUPER_ADMIN | Account lifetime | PII; used for authentication and notifications |
| User Display Names | User registration / Entra ID | Confidential | Azure PostgreSQL Flexible Server | Azure-managed TDE | TLS 1.2+ | App RBAC: MEMBER+ within tenant | Account lifetime | PII |
| Team Membership Data | Admin assignment | Confidential | Azure PostgreSQL Flexible Server | Azure-managed TDE | TLS 1.2+ | App RBAC: MEMBER+ within tenant | Account lifetime | Role assignments, team associations |
| Graph API Tokens | Microsoft Entra ID OAuth | Restricted | Azure PostgreSQL (AES-256-GCM encrypted) | AES-256-GCM application-layer encryption + Azure TDE | TLS 1.2+ | Application service only (no direct human access) | Token lifetime (with refresh rotation) | Used for SharePoint evidence file access; encrypted before DB storage |
| JWT Signing Secrets | Application configuration | Restricted | Environment variables (to be migrated to Key Vault per F-10) | Platform-managed (env vars) / HSM-backed (Key Vault) | TLS 1.2+ | Application runtime only | Until rotation | Must migrate to Key Vault; no rotation policy currently |
| Database Credentials | Infrastructure provisioning | Restricted | Environment variables (to be migrated to Key Vault per F-10) | Platform-managed (env vars) / HSM-backed (Key Vault) | TLS 1.2+ | Application runtime; DevOps for provisioning | Until rotation | PostgreSQL connection string; must migrate to Key Vault |
| Entra ID Client Secret | Entra ID app registration | Restricted | Environment variables (to be migrated to Key Vault per F-10) | Platform-managed (env vars) / HSM-backed (Key Vault) | TLS 1.2+ | Application runtime; DevOps for provisioning | Until rotation | OAuth client secret for Entra ID integration |
| User Password Hashes | User registration | Restricted | Azure PostgreSQL Flexible Server | Azure-managed TDE | TLS 1.2+ | Application only (no direct human access) | Account lifetime | bcrypt hashed; used as fallback authentication |
| Audit Logs | Application runtime | Internal | Azure PostgreSQL / Log Analytics Workspace | Azure-managed TDE / Platform-managed | TLS 1.2+ | SUPER_ADMIN; Security team; Compliance | 1 year minimum (NIST 800-171 AU requirements) | Contains user actions, IP addresses, timestamps; must not contain secrets (F-37) |
| System Configuration | Bicep IaC / deployment | Internal | GitHub repository / Azure Resource Manager | GitHub encryption / Platform-managed | TLS 1.2+ | DevOps team; SUPER_ADMIN | Repository lifetime | Azure resource configuration parameters |
| Deployment Parameters | CI/CD pipeline | Internal | GitHub Actions (secrets) / Azure | Platform-managed | TLS 1.2+ | DevOps team (GitHub Actions secrets) | Deployment lifetime | Non-secret deployment configuration |
| Policy Templates | Application seed data | Internal | Azure PostgreSQL Flexible Server | Azure-managed TDE | TLS 1.2+ | All authenticated users (read-only) | Application lifetime | Configurable assessment policy templates |
| CMMC Control Library | NIST SP 800-171 Rev 2 | Public | Azure PostgreSQL Flexible Server (read-only) | Azure-managed TDE | TLS 1.2+ | All users (read-only) | Application lifetime | Publicly available control definitions, practice descriptions |
| Application UI Assets | Development build | Public | Azure Container Apps (static files) | N/A (served via HTTPS) | TLS 1.2+ | Unauthenticated access | Current version | React SPA bundle, CSS, images, fonts |
| Evidence Files | Client upload | Confidential | Client's own SharePoint (not our infrastructure) | Client-managed | TLS 1.2+ (Graph API) | Client's SharePoint permissions; platform accesses via Graph API with delegated consent | Client-managed | CUI documents stored outside our infrastructure boundary |

---

## 4. Handling Procedures by Classification Level

### 4.1 Public

| Activity | Requirement |
|----------|-------------|
| Storage | Any storage medium; Azure PostgreSQL (read-only table) for control library; static file hosting for UI assets |
| Transmission | HTTPS (TLS 1.2+) for delivery; content is non-sensitive |
| Sharing | May be shared externally without approval; NIST content is already public |
| Printing | No restrictions |
| Disposal | No special requirements; standard deletion |
| Backup | Standard Azure backup procedures |
| Non-production use | No restrictions |

### 4.2 Internal

| Activity | Requirement |
|----------|-------------|
| Storage | Azure-managed systems only (PostgreSQL, Log Analytics, GitHub); no local copies |
| Transmission | TLS 1.2+ required for all electronic transmission |
| Sharing | IntelliSec Solutions team members only; no external sharing without CTO approval |
| Printing | Minimize; collect promptly |
| Disposal | Delete from systems; clear Log Analytics workspace when retention expires |
| Backup | Standard Azure backup procedures with access controls |
| Non-production use | Permitted with access controls; sanitize IP addresses and user identifiers |

### 4.3 Confidential

| Activity | Requirement |
|----------|-------------|
| Storage | Azure PostgreSQL with TDE (AES-256); tenant-isolated via Prisma middleware row-level scoping |
| Transmission | TLS 1.2+ required; API responses scoped to authenticated tenant only |
| Sharing | Need-to-know basis within the tenant; cross-tenant access prohibited; SUPER_ADMIN can view for support purposes with audit logging |
| Printing | Prohibited for assessment data and SPRS scores; if required, label as confidential and shred after use |
| Disposal | Tenant data deletion on account closure; cryptographic erasure where possible; maintain disposal records |
| Backup | Azure PostgreSQL automated encrypted backups; backup access restricted to DevOps with SUPER_ADMIN approval |
| Non-production use | Data masking or synthetic data required; no production SPRS scores, assessment data, or PII in dev/test environments |

### 4.4 Restricted

| Activity | Requirement |
|----------|-------------|
| Storage | Graph API tokens: AES-256-GCM encrypted in PostgreSQL; JWT secrets, DB credentials, Entra client secret: Azure Key Vault (migration in progress per F-10); password hashes: bcrypt in PostgreSQL with TDE |
| Transmission | TLS 1.2+; Graph API tokens encrypted at application layer before database storage; secrets never transmitted in URL parameters (F-05 remediation in progress) |
| Sharing | Strictly prohibited; no human access to raw secrets; application runtime access only via Managed Identity (planned) |
| Printing | Prohibited under all circumstances |
| Disposal | Cryptographic erasure; rotate all associated credentials if compromise suspected; maintain records for compliance |
| Backup | Encrypted backups with separate access controls; Key Vault soft delete and purge protection enabled |
| Non-production use | Prohibited; non-production environments must use separate secrets, separate Entra ID app registrations, and separate database credentials |

---

## 5. Access Control Matrix

This matrix defines which platform and team roles can access data at each classification level.

### 5.1 Platform Roles

| Role | Public | Internal | Confidential | Restricted |
|------|--------|----------|--------------|------------|
| **SUPER_ADMIN** | Full access | Full access | Read / Write (all tenants, with audit logging) | No direct access (application-managed only) |
| **SUPPORT** | Full access | Read | Read (assigned tenant support cases, with audit logging) | No access |
| **USER** | Read | No access | Scoped by team role (see below) | No access |

### 5.2 Team Roles (within tenant scope)

| Role | Public | Internal | Confidential (own tenant only) | Restricted |
|------|--------|----------|-------------------------------|------------|
| **OWNER** | Read | Read (audit logs for own tenant) | Read / Write / Delete | No access |
| **ADMIN** | Read | Read (audit logs for own tenant) | Read / Write | No access |
| **ASSESSOR** | Read | No access | Read / Write (assessments, POA&M) | No access |
| **MEMBER** | Read | No access | Read (assessments, SPRS scores) | No access |
| **VIEWER** | Read | No access | Read (limited: assessment summary only) | No access |

### 5.3 System / Service Roles

| Role | Public | Internal | Confidential | Restricted |
|------|--------|----------|--------------|------------|
| **Application Runtime** | As configured | As configured | Full (via Prisma ORM with tenant scoping) | Read/Write (Graph API tokens, JWT operations) |
| **CI/CD Pipeline (GitHub Actions)** | As configured | As configured | No access | Key Vault secrets access only (via OIDC) |
| **DevOps Engineer** | Read / Write | Read / Write | Read (operational logs only; no assessment data) | Key Vault management (with CTO approval) |
| **External Auditor** | Read | Read (scoped, time-limited) | Read (scoped to specific tenant, time-limited, with audit trail) | No access |

> **Note:** All access to Confidential and Restricted data is logged in the audit trail. Access reviews are conducted quarterly. Cross-tenant data access is architecturally prevented by Prisma middleware tenant scoping.

---

## 6. Incident Procedures for Data Exposure

### 6.1 General Incident Response Flow

1. **Detection** - Data exposure identified (automated alert, manual discovery, security review finding, or third-party report)
2. **Containment** - Immediately restrict access and stop further exposure; rotate compromised credentials
3. **Assessment** - Determine classification level of exposed data, scope of exposure, number of affected tenants, and affected individuals
4. **Escalation** - Follow escalation path based on classification level (see below)
5. **Notification** - Notify required parties per classification level; for CUI metadata exposure, assess DFARS 252.204-7012 reporting requirements
6. **Remediation** - Fix the root cause of the exposure
7. **Post-Incident Review** - Document lessons learned and update controls, threat model, and security review checklist

### 6.2 Escalation by Classification Level

| Classification | Response Time | Escalation Path | Notification Requirements | Regulatory Reporting |
|---------------|--------------|-----------------|--------------------------|---------------------|
| **Public** | Best effort | Dev Lead | None required | None |
| **Internal** | 24 hours | Dev Lead, CTO | Internal team notification | None |
| **Confidential** | 4 hours | CTO, Legal counsel | Affected tenant organizations; if CUI metadata: assess DFARS 252.204-7012 (72-hour reporting to DIBNet) | DFARS 252.204-7012 (if CUI scope); state breach notification laws (if PII) |
| **Restricted** | 1 hour | CTO, Legal counsel, all hands | Affected tenant organizations; credential rotation for all tenants; potential law enforcement notification | DFARS 252.204-7012 (if CUI scope); all applicable breach notification laws |

### 6.3 Classification-Specific Procedures

#### Public Data Exposure
- [ ] Verify the data is truly classified as Public
- [ ] If misclassified, re-assess and follow the appropriate procedure
- [ ] No further action required for confirmed Public data

#### Internal Data Exposure
- [ ] Contain the exposure (revoke access, remove from public location)
- [ ] Notify Dev Lead and CTO within 24 hours
- [ ] Document the incident in the incident tracking system
- [ ] Conduct root cause analysis
- [ ] Implement corrective controls

#### Confidential Data Exposure (SPRS Scores, Assessments, POA&M, PII)
- [ ] Immediately contain the exposure; verify tenant isolation is intact
- [ ] Notify CTO and legal counsel within 4 hours
- [ ] Identify all affected tenant organizations and data scope
- [ ] Assess whether exposed data falls under DFARS 252.204-7012 CUI reporting requirements
- [ ] Prepare tenant notification with details of exposed data scope
- [ ] If PII (email addresses) exposed, assess state breach notification requirements
- [ ] Rotate any exposed credentials or tokens
- [ ] Preserve forensic evidence (audit logs, database logs, container logs)
- [ ] Conduct full incident review and update threat model

#### Restricted Data Exposure (Secrets, Tokens, Credentials)
- [ ] Immediately contain the exposure (all-hands priority)
- [ ] Notify CTO and legal counsel within 1 hour
- [ ] Immediately rotate ALL potentially compromised credentials:
  - [ ] JWT signing secrets
  - [ ] Database credentials
  - [ ] Entra ID client secret
  - [ ] Graph API token encryption key
  - [ ] All affected users' Graph API tokens (re-encryption required)
- [ ] Invalidate all active JWT sessions (force re-authentication)
- [ ] Assess whether any tenant Confidential data was accessed using compromised credentials
- [ ] If tenant data was accessed, follow Confidential exposure procedures for affected tenants
- [ ] Preserve all forensic evidence (chain of custody)
- [ ] Executive-level incident review with CTO
- [ ] Update security controls, secret management practices, and monitoring

---

## 7. References

| Document | Link |
|----------|------|
| Threat Model | ./threat-model.md |
| Security Review Checklist | ./security-review-checklist.md |
| NIST SP 800-171 Rev 2 | https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final |
| CMMC Level 2 Assessment Guide | https://dodcio.defense.gov/CMMC/ |
| DFARS 252.204-7012 (CUI Incident Reporting) | https://www.acquisition.gov/dfars/252.204-7012 |
| Security Review Report (2026-02-11) | Internal -- 47 findings documented |

---

## 8. Approval

| Name | Role | Signature / Approval | Date |
|------|------|---------------------|------|
| (Pending) | Data Owner / CTO | | |
| (Pending) | Security Lead | | |
| (Pending) | Compliance Advisor | | |
| (Pending) | Dev Lead | | |
