# Data Architecture

| **Metadata**     | **Value**                                      |
|------------------|------------------------------------------------|
| Page Title       | CMMC Assessor Platform - Data Architecture     |
| Last Updated     | 2026-02-15                                     |
| Status           | `DRAFT`                                        |
| Owner            | Solution Architect                             |
| Reviewers        | Technical Lead, Security Architect, Engineering Manager |
| Version          | 0.1                                            |
| Related HLD      | CMMC Assessor Platform - Architecture Overview (HLD) |

---

## 1. Document Purpose

This document defines the data architecture for the **CMMC Assessor Platform**. It covers all data stores, data classifications, data flows, retention policies, backup and recovery strategies, and data privacy considerations. This document ensures that data is managed consistently, securely, and in compliance with applicable regulations, particularly those related to Controlled Unclassified Information (CUI) and CMMC assessment data.

---

## 2. Data Stores Inventory

| Store Name | Type | Azure Service | SKU / Tier | Purpose | Data Classification | Retention | Region |
|-----------|------|--------------|------------|---------|--------------------|-----------|---------|
| cmmc-assessor-prod (PostgreSQL) | Relational (SQL) | Azure Database for PostgreSQL Flexible Server (psql-cmmc-assessor-prod) | B1ms (1 vCore, 2GB RAM) | All application data: tenants, users, assessments, controls, objectives, responses, POA&Ms, policies, audit logs, tokens (22 tables) | Confidential (contains CUI assessment data, user PII, encrypted tokens) | Lifetime of tenant + regulatory retention period | Canada Central |
| stcmmcassessorprod (Blob Storage) | Object / Blob | Azure Storage Account | Standard_LRS | Evidence file uploads, generated export files (Excel, PDF, DOCX), temporary file staging | Confidential (evidence files may contain CUI) | Lifetime of associated assessment; deletion on tenant offboarding | Canada Central |
| SharePoint (via Graph API) | Document Library | Microsoft 365 SharePoint Online (external to Azure infrastructure) | Customer's M365 license | Primary evidence document storage and management per tenant's SharePoint site | Confidential (evidence files related to CMMC compliance, may contain CUI) | Managed by tenant's SharePoint retention policies | Determined by tenant's M365 tenant geography |
| Azure Key Vault (kv-cmmc-assessor-prod) | Secret / Key Store | Azure Key Vault | Standard | Secrets: database connection strings, JWT signing keys, MSAL client secrets, AES-256 encryption keys | Restricted (cryptographic keys and credentials) | Secrets rotated per rotation policy; soft-delete enabled with 90-day purge protection | Canada Central |
| Azure Log Analytics (log-cmmc-assessor-prod) | Log Store | Azure Log Analytics Workspace | PerGB2018 | Container Apps console logs, system metrics, diagnostic data | Internal (operational logs; may contain user identifiers in audit-related log entries) | 30 days (current); to be reviewed for compliance requirements | Canada Central |

---

## 3. Data Flow Diagram

<!-- Diagram: 06-data-flow.png — embedded on Confluence page as attachment -->

### 3.1 Data Flow Summary

| # | Source | Destination | Data Description | Flow Type | Frequency | Volume |
|---|--------|-------------|-----------------|-----------|-----------|--------|
| 1 | cmmc-web (Browser) | cmmc-api | User actions: assessment CRUD, objective responses, implementation updates, POA&M management, policy acknowledgments, team management, SSP configuration | Sync (HTTPS REST) | On demand | Estimated ~500-2,000 API calls/day during active assessment |
| 2 | cmmc-api | PostgreSQL | All application data reads and writes: tenant-scoped queries via Prisma ORM | Sync (TCP/PostgreSQL) | On demand | ~2,000-5,000 queries/day |
| 3 | cmmc-api | Microsoft Entra ID | OAuth 2.0 token exchange: authorization code -> access/ID tokens; token refresh; user info | Sync (HTTPS) | On login, token refresh | ~50-200 auth events/day |
| 4 | cmmc-api | Microsoft Graph API (SharePoint) | Evidence file operations: list, upload, download, preview, delete on tenant's SharePoint document library | Sync (HTTPS REST) | On demand during evidence management | ~50-500 operations/day; file sizes 1KB-50MB typical |
| 5 | cmmc-api | Azure Blob Storage | Temporary evidence file staging, generated export files (Excel, PDF, DOCX) | Sync (HTTPS REST) | On demand during evidence upload and export generation | ~10-100 files/day; 1KB-50MB per file |
| 6 | cmmc-api | Azure Key Vault | Secret retrieval at application startup and on-demand for encryption operations | Sync (HTTPS) | On container start + periodic | ~10-50 requests/day |
| 7 | cmmc-api (AuditLog) | PostgreSQL (AuditLog table) | Immutable audit trail entries for all significant entity mutations | Sync (within transaction) | On every create/update/delete of assessed entities | ~500-2,000 audit entries/day |
| 8 | Container Apps | Log Analytics | Container stdout/stderr logs, system metrics, health probe results | Async (platform-managed) | Continuous | Varies; estimated ~100MB-500MB/month |
| 9 | GitHub Actions | Azure Container Registry + Container Apps | Docker image push and container revision deployment | Sync (CI/CD) | On merge to main | ~2-10 deployments/week |

---

## 4. Data Model / Entity-Relationship Diagram

<!-- Diagram: 05-entity-relationship.png — embedded on Confluence page as attachment -->
<!--
    Shows all 22 Prisma models with relationships:
    Tenant (root) -> TeamMember, Assessment, TenantPolicy, AuditLog, SSPConfig, TenantInvitation
    User -> TeamMember, ObjectiveResponse, PolicyAcknowledgment, UserToken, RefreshToken, AuditLog
    Assessment -> AssessmentObjective, ControlResponse, ControlImplementation, POAMItem
    Control -> AssessmentObjective, ControlResponse, ControlImplementation, POAMItem
    AssessmentObjective -> ObjectiveResponse
    TenantPolicy -> PolicyVersion -> PolicyAcknowledgment
    POAMItem -> POAMEvidence
-->

### 4.1 Logical Data Model - Key Entities

| Entity | Description | Key Attributes | Relationships |
|--------|-------------|---------------|---------------|
| Tenant | Root multi-tenant entity representing an organization using the platform | `id`, `name`, `domain`, `entraIdTenantId`, `sharepointSiteUrl`, `settings` | Has many TeamMembers, Assessments, TenantPolicies, AuditLogs, TenantInvitations; has one SSPConfig |
| User | Registered user account (Entra ID or legacy auth) | `id`, `email`, `name`, `passwordHash`, `entraIdObjectId`, `platformRole`, `status` | Has many TeamMembers (multi-tenant membership), ObjectiveResponses, PolicyAcknowledgments, UserTokens, RefreshTokens |
| TeamMember | Association between User and Tenant with a team role | `id`, `userId`, `tenantId`, `role` | Belongs to User, belongs to Tenant |
| Assessment | CMMC assessment instance within a tenant | `id`, `tenantId`, `name`, `description`, `status`, `level`, `score` | Belongs to Tenant; has many AssessmentObjectives, ControlResponses, ControlImplementations |
| Control | CMMC control reference data (e.g., AC.L2-3.1.1) | `id`, `controlId`, `domain`, `family`, `title`, `description`, `level`, `weight` | Has many AssessmentObjectives, ControlResponses, ControlImplementations, POAMItems |
| AssessmentObjective | Individual assessment objective tied to a control | `id`, `assessmentId`, `controlId`, `objectiveId`, `description`, `tenantId` | Belongs to Assessment, belongs to Control; has many ObjectiveResponses |
| ObjectiveResponse | Assessor's response to an objective (MET/NOT_MET/NA) | `id`, `objectiveId`, `response`, `notes`, `assessorId`, `tenantId` | Belongs to AssessmentObjective, belongs to User (assessor) |
| ControlResponse | Aggregated control-level assessment response | `id`, `assessmentId`, `controlId`, `status`, `notes`, `tenantId` | Belongs to Assessment, belongs to Control |
| ControlImplementation | Implementation status and evidence for a control | `id`, `assessmentId`, `controlId`, `status`, `description`, `evidence`, `tenantId` | Belongs to Assessment, belongs to Control |
| POAMItem | Plan of Action and Milestones item for non-compliant controls | `id`, `tenantId`, `controlId`, `weakness`, `milestone`, `scheduledCompletionDate`, `status` | Belongs to Tenant, belongs to Control; has many POAMEvidence |
| POAMEvidence | Evidence file attached to a POA&M item | `id`, `poamItemId`, `fileName`, `fileUrl` | Belongs to POAMItem |
| TenantPolicy | Security policy document managed by a tenant | `id`, `tenantId`, `title`, `content`, `status`, `category` | Belongs to Tenant; has many PolicyVersions |
| PolicyVersion | Versioned snapshot of a policy's content | `id`, `policyId`, `version`, `content`, `changedBy` | Belongs to TenantPolicy; has many PolicyAcknowledgments |
| PolicyAcknowledgment | User's acknowledgment of a specific policy version | `id`, `policyVersionId`, `userId`, `acknowledgedAt` | Belongs to PolicyVersion, belongs to User |
| AuditLog | Immutable audit trail entry for compliance | `id`, `tenantId`, `entityType`, `entityId`, `action`, `actorId`, `changes`, `ipAddress`, `timestamp` | Belongs to Tenant, references User (actor) |
| SSPConfig | System Security Plan configuration per tenant | `id`, `tenantId`, `organizationName`, `systemName`, `config` | Belongs to Tenant (one-to-one) |
| UserToken | Encrypted Microsoft Graph API tokens per user | `id`, `userId`, `accessToken`, `refreshToken`, `expiresAt`, `scope` | Belongs to User |
| RefreshToken | JWT refresh token with family-based rotation tracking | `id`, `userId`, `token`, `family`, `expiresAt`, `isRevoked` | Belongs to User |
| TokenDenyList | Revoked JWT for server-side logout enforcement | `id`, `token`, `expiresAt`, `revokedAt` | No foreign keys (standalone) |
| Invitation | Legacy invitation records | `id`, `email`, `role`, `tenantId`, `invitedBy`, `status`, `expiresAt` | Belongs to Tenant |
| TenantInvitation | Active tenant invitation for team onboarding | `id`, `email`, `role`, `tenantId`, `invitedById`, `status`, `token`, `expiresAt` | Belongs to Tenant, belongs to User (inviter) |
| Organization | Legacy organization entity (deprecated, migrating to Tenant) | `id`, `name`, `description` | Legacy references from Assessment (being removed) |

---

## 5. Data Classification

### 5.1 Classification Framework

| Classification Level | Definition | Examples | Handling Requirements |
|---------------------|------------|----------|----------------------|
| **Public** | Data intended for public consumption | CMMC framework descriptions (publicly available from DoD), marketing content | No special controls required |
| **Internal** | Operational data with low risk if exposed | Application logs (excluding PII), system metrics, CMMC control reference data, non-sensitive configuration | Access restricted to authenticated team members; encryption in transit |
| **Confidential** | Sensitive business data, assessment data, user PII | Assessment results, SPRS scores, objective responses, implementation details, user profiles, tenant configurations, evidence files, POA&M items | Encryption at rest and in transit, tenant isolation enforced, access logged, RBAC-controlled |
| **Restricted** | Highly sensitive data, significant harm if exposed | Cryptographic keys (JWT signing, AES-256 encryption), database credentials, MSAL client secrets, Graph API tokens, password hashes | Strongest encryption, Azure Key Vault storage, no human-readable access, automated rotation planned |

### 5.2 Data Element Classification Matrix

| Data Element | Example Values | Classification | Encrypted at Rest | Encrypted in Transit | Masking in Logs | Access Control |
|-------------|----------------|---------------|-------------------|---------------------|-----------------|----------------|
| User Email | assessor@company.com | Confidential | Yes (PostgreSQL TDE) | Yes (TLS 1.2+) | No (required for audit trail) | RBAC (tenant-scoped) |
| User Display Name | Jane Smith | Confidential | Yes (PostgreSQL TDE) | Yes (TLS 1.2+) | No | RBAC (tenant-scoped) |
| Password Hash (legacy auth) | bcrypt hash | Restricted | Yes (PostgreSQL TDE) | Yes (TLS 1.2+) | Full mask | System only (no human access, no API exposure) |
| Assessment Results / SPRS Score | -87, 42, 110 | Confidential | Yes (PostgreSQL TDE) | Yes (TLS 1.2+) | No | RBAC (tenant-scoped, ASSESSOR+ for write) |
| Objective Responses (MET/NOT_MET/NA) | MET, NOT_MET | Confidential | Yes (PostgreSQL TDE) | Yes (TLS 1.2+) | No | RBAC (tenant-scoped, ASSESSOR+ for write) |
| Control Implementation Details | Description text, evidence references | Confidential | Yes (PostgreSQL TDE) | Yes (TLS 1.2+) | No | RBAC (tenant-scoped, ASSESSOR+ for write) |
| POA&M Items | Weakness descriptions, milestones, schedules | Confidential | Yes (PostgreSQL TDE) | Yes (TLS 1.2+) | No | RBAC (tenant-scoped, ASSESSOR+ for write) |
| Evidence Files (Blob/SharePoint) | PDF, DOCX, images | Confidential | Yes (Azure SSE / SharePoint encryption) | Yes (TLS 1.2+) | N/A (binary files) | RBAC (tenant-scoped); SharePoint permissions |
| Tenant Configuration | SharePoint site URL, settings JSON | Confidential | Yes (PostgreSQL TDE) | Yes (TLS 1.2+) | No | RBAC (ADMIN+ for write) |
| Entra ID Tenant ID | UUID | Internal | Yes (PostgreSQL TDE) | Yes (TLS 1.2+) | No | System use |
| Graph API Access/Refresh Tokens | Encrypted token strings | Restricted | Yes (AES-256-GCM before DB storage + PostgreSQL TDE) | Yes (TLS 1.2+) | Full mask | System only (encrypted at application layer) |
| JWT Signing Key | 256-bit secret | Restricted | Yes (Key Vault software-protected) | Yes (TLS 1.2+) | Full mask | Container Apps secret reference; no human access |
| AES-256 Encryption Key | 256-bit key | Restricted | Yes (Key Vault software-protected) | Yes (TLS 1.2+) | Full mask | Container Apps secret reference; no human access |
| Database Connection String | postgresql://user:pass@host/db | Restricted | Yes (Key Vault) | Yes (TLS 1.2+) | Full mask | Container Apps secret reference |
| MSAL Client Secret | Random string | Restricted | Yes (Key Vault) | Yes (TLS 1.2+) | Full mask | Container Apps secret reference |
| Audit Log Entries | Action, actor, timestamp, changes JSON | Confidential | Yes (PostgreSQL TDE) | Yes (TLS 1.2+) | No (audit trail by design) | RBAC (ADMIN+); append-only (no update/delete) |
| Policy Content | Security policy text, version history | Confidential | Yes (PostgreSQL TDE) | Yes (TLS 1.2+) | No | RBAC (tenant-scoped) |
| SSP Configuration | Organization details, system descriptions | Confidential | Yes (PostgreSQL TDE) | Yes (TLS 1.2+) | No | RBAC (ADMIN+ for write) |

---

## 6. Data Retention and Lifecycle Policies

### 6.1 Retention Schedule

| Data Category | Retention Period (Active) | Archive Period | Deletion Method | Regulatory Basis |
|--------------|--------------------------|----------------|-----------------|------------------|
| Tenant and User Account Data | Lifetime of tenant subscription | 90 days post-subscription cancellation for recovery | Soft delete (status = INACTIVE) -> hard delete after archive period, including cascade to all dependent tenant data | CMMC assessment record requirements, contractual obligation |
| Assessment Data (assessments, objectives, responses, implementations) | Lifetime of tenant subscription | 7 years post-assessment completion (regulatory hold for CMMC audit trail) | Retain in database; archival to cold storage planned for future phase | DFARS 252.204-7012 (CUI retention), NIST SP 800-171 audit requirements |
| POA&M Items and Evidence | Lifetime of tenant subscription + 3 years post-completion | Same as assessment data | Retain in database; evidence files retained in SharePoint/Blob | CMMC assessment continuity requirement |
| Audit Logs (PostgreSQL AuditLog table) | Lifetime of tenant + 7 years | No separate archive (retained in primary store) | No deletion (immutable audit trail); future consideration for archival to Azure Archive tier | CMMC audit trail requirement, SOC 2-equivalent compliance |
| Application Logs (Log Analytics) | 30 days | None | Automatic expiry per Log Analytics workspace retention policy | Operational needs; to be increased if compliance requires longer retention |
| Refresh Tokens | Until expiry or revocation | N/A | Automatic cleanup of expired tokens via scheduled process (planned) | Security best practice |
| Token Deny List | Until token expiry (JWT_EXPIRY, currently 7 days) | N/A | Automatic cleanup of entries where expiresAt < now (planned) | Security best practice |
| UserTokens (Graph API tokens) | Until token refresh or user revocation | N/A | Overwritten on refresh; deleted on user account deletion | Minimal retention principle |
| Evidence Files (Blob Storage) | Lifetime of associated assessment | Same as assessment data | Deleted on tenant offboarding; lifecycle policy to move to cool/archive tier planned | CMMC evidence requirements |
| Evidence Files (SharePoint) | Managed by tenant's SharePoint retention policies | Managed by tenant | N/A (tenant-managed) | Tenant's own compliance requirements |
| Backup Data (PostgreSQL) | 7 days (current PITR), increasing to 35 days | None currently | Automatic expiry per Azure backup policy | DR requirements |
| Policy Documents and Versions | Lifetime of tenant subscription | Retained with assessment data | Cascade delete on tenant offboarding | CMMC policy compliance tracking |

### 6.2 Data Lifecycle Stages

```
[Creation] -> [Active Use] -> [Inactive/Completed] -> [Regulatory Hold] -> [Deletion/Purge]
     |              |                |                       |                    |
  Validation    Full RBAC        Assessment complete     7-year hold for       Secure deletion,
  & tenant      access &         or tenant inactive;     CMMC audit trail;     cascade to all
  scoping       tenant-scoped    reduced access          read-only access      dependent records
                queries          (no modifications)
```

### 6.3 Azure Storage Lifecycle Policies

| Storage Account | Rule Name | Condition | Action |
|----------------|-----------|-----------|--------|
| stcmmcassessorprod | Move exports to Cool | Blob not modified for 30 days (generated exports that have been downloaded) | Move to Cool tier |
| stcmmcassessorprod | Move evidence to Cool | Blob not modified for 90 days (evidence files not actively accessed) | Move to Cool tier (planned) |
| stcmmcassessorprod | Move to Archive | Blob not modified for 365 days | Move to Archive tier (planned) |
| stcmmcassessorprod | Delete temporary files | Blob with prefix `temp/` not modified for 7 days | Delete blob |

**Note:** Storage lifecycle policies are planned but not yet implemented. Current state: all blobs remain in Hot tier.

---

## 7. Backup and Recovery Strategy

### 7.1 Backup Matrix

| Data Store | Backup Method | Frequency | Retention | RPO | RTO | Geo-Redundancy | Tested |
|-----------|--------------|-----------|-----------|-----|-----|-----------------|--------|
| PostgreSQL (psql-cmmc-assessor-prod) | Azure automated backups (point-in-time restore) | Continuous (WAL-based) | 7 days PITR (current); planned increase to 35 days | < 5 minutes | < 1 hour | No (locally redundant backups currently); geo-redundant backup planned | Not yet tested |
| Azure Blob Storage (stcmmcassessorprod) | Soft delete + Standard_LRS | Continuous (on write) | 7 days soft delete (planned) | 0 (synchronous writes) | < 30 minutes | No (LRS currently); upgrade to GRS planned | Not yet tested |
| SharePoint Evidence | Managed by Microsoft 365 (tenant's responsibility) | Continuous (SharePoint versioning) | Per tenant's M365 retention policies | Depends on M365 backup | Depends on M365 recovery | Yes (M365 global infrastructure) | N/A (tenant-managed) |
| Azure Key Vault (kv-cmmc-assessor-prod) | Azure built-in soft delete + purge protection | Continuous | 90 days soft delete retention | 0 | < 5 minutes (undelete) | No (Standard tier, locally redundant) | Not yet tested |
| Log Analytics (log-cmmc-assessor-prod) | Azure managed | Continuous | 30 days | N/A (operational data) | N/A | Azure-managed redundancy | N/A |

### 7.2 Recovery Procedures

| Scenario | Procedure | Responsible Team | Estimated Duration |
|----------|-----------|-----------------|-------------------|
| Single table data corruption (PostgreSQL) | Point-in-time restore to a new PostgreSQL server at the moment before corruption; validate restored data; migrate corrected data back to production database | Development Team | 1-2 hours |
| Full database loss | Point-in-time restore to latest available point; deploy new PostgreSQL Flexible Server via Bicep if needed; update connection string in Key Vault; restart Container Apps | Development Team | 2-4 hours |
| Accidental blob deletion | Restore from soft-deleted blobs (if soft delete is enabled) or re-upload from SharePoint source | Development Team | < 30 minutes |
| Key Vault secret compromise | Rotate compromised secret immediately; update dependent services (Container Apps restart); revoke all active JWTs via TokenDenyList if JWT signing key compromised; force re-authentication for all users | Development Team + Security | 1-4 hours |
| Container App failure / bad deployment | Revert to previous container image tag in Azure Container Registry; redeploy via GitHub Actions or manual Bicep deployment | Development Team | < 30 minutes |
| Entra ID integration failure | Verify Entra ID app registration; check client secret expiry; re-consent if needed; legacy auth serves as temporary fallback | Development Team | 30 minutes - 2 hours |

### 7.3 Disaster Recovery Testing

| Aspect | Approach |
|--------|----------|
| Test Frequency | Not yet established; planned for quarterly once production stabilizes |
| Test Scope | Initial focus: PostgreSQL PITR test, container redeployment from previous image, Key Vault secret rotation drill |
| Success Criteria | RPO and RTO targets met; data integrity verified via row counts and spot checks; all API endpoints operational; tenant isolation verified post-recovery |
| Documentation | DR test results to be documented in Confluence upon completion |

**Note:** DR testing is identified as a gap and is part of the security remediation roadmap. The 7-day backup retention is being increased to 35 days as an early remediation item.

---

## 8. Data Migration Strategy

### 8.1 Migration Overview

| Aspect | Detail |
|--------|--------|
| Source System | Legacy Organization model (within same database) |
| Target System | New Tenant model (within same database) |
| Data Volume | Small (< 1,000 organizations to migrate to tenant model) |
| Migration Approach | In-place migration via Prisma migrations; Organization table retained temporarily for backward compatibility; data copied to Tenant model; references updated |
| Downtime Window | Zero downtime; expand-and-contract migration pattern |
| Rollback Plan | Organization table retained; application code can fall back to Organization queries if needed |

### 8.2 Migration Phases

| Phase | Description | Duration | Validation |
|-------|-------------|----------|------------|
| 1. Schema Expansion | Add Tenant table and TeamMember table via Prisma migration; keep Organization table | 1 sprint | Prisma migration applies cleanly; existing functionality unaffected |
| 2. Data Copy | Copy Organization data to Tenant; create TeamMember records for existing users | 1 sprint | Row counts match; all users have valid TeamMember entries |
| 3. Application Cutover | Update all application code to use Tenant/TeamMember instead of Organization | 2-3 sprints | All API endpoints work with tenant-scoped queries; no regression |
| 4. Schema Contraction | Remove Organization table references; mark Organization as deprecated | 1 sprint | No foreign key references to Organization remain; clean Prisma schema |

---

## 9. GDPR and Data Privacy Considerations

### 9.1 Data Subject Rights Implementation

| Right | Implementation | Endpoint / Process |
|-------|---------------|-------------------|
| Right to Access (Art. 15) | Export all user data including profile, team memberships, objective responses, policy acknowledgments, and audit log entries referencing the user | Manual process currently; planned: GET /api/users/{id}/data-export |
| Right to Rectification (Art. 16) | User profile update via existing team management and settings endpoints | PUT /api/team/members/:id (name, email updates) |
| Right to Erasure (Art. 17) | User account deletion with cascade: remove TeamMember records, anonymize AuditLog actor references, delete UserTokens and RefreshTokens; retain assessment data for regulatory compliance with anonymized assessor references | Manual process currently; planned: DELETE /api/users/{id}/personal-data |
| Right to Restrict Processing (Art. 18) | Set user status to INACTIVE; retain data but prevent login and API access | PATCH user status via admin endpoint |
| Right to Data Portability (Art. 20) | Export user-provided data (profile, objective responses, policy acknowledgments) in JSON format | Planned: GET /api/users/{id}/portable-data |
| Right to Object (Art. 21) | No marketing or profiling data is collected; platform is a professional B2B tool | N/A (no marketing data processing) |

### 9.2 Data Processing Inventory

| Processing Activity | Legal Basis | Data Categories | Data Subjects | Processor | Transfer Outside Canada |
|--------------------|-------------|-----------------|---------------|-----------|------------------------|
| User account management (Entra ID) | Contract (Art. 6(1)(b)) -- necessary for service delivery | Name, email, Entra ID object ID, team role | Assessors, team members, platform admins | CMMC Assessor Platform (controller) | Yes -- Microsoft Entra ID (governed by Microsoft DPA; data processed in Microsoft global infrastructure) |
| CMMC assessment processing | Contract (Art. 6(1)(b)) -- core service function | Assessment responses, SPRS scores, implementation details, POA&M items | Assessors | CMMC Assessor Platform (controller) | No (all assessment data stored in Canada Central PostgreSQL) |
| Evidence management (SharePoint) | Contract (Art. 6(1)(b)) | Evidence files (may contain CUI) | Assessors, tenant organizations | Microsoft 365 (processor, governed by tenant's M365 agreement) | Depends on tenant's M365 geography; governed by tenant's own DPA with Microsoft |
| Audit logging | Legitimate Interest (Art. 6(1)(f)) -- security and compliance monitoring | User actions, IP addresses, entity changes | All authenticated users | CMMC Assessor Platform (controller) | No (stored in Canada Central PostgreSQL) |
| Application logging | Legitimate Interest (Art. 6(1)(f)) -- operational monitoring | System events, error details (may include user identifiers) | All users (indirectly) | Microsoft Azure (Log Analytics) | No (Log Analytics in Canada Central) |

### 9.3 Privacy by Design Controls

| Control | Implementation |
|---------|---------------|
| Data Minimization | Only collect data necessary for CMMC assessment workflows; no marketing data, no behavioral analytics, no third-party tracking; user profile limited to name, email, and role |
| Purpose Limitation | All data used exclusively for CMMC assessment, scoring, and compliance reporting; no secondary use or sharing |
| Storage Limitation | Automated retention policies planned; assessment data retained per CMMC audit trail requirements (7 years); operational data (logs, tokens) subject to shorter retention |
| Pseudonymization | Internal UUIDs used as primary identifiers; Entra ID object IDs separate from display names; AuditLog references user by ID (not email) |
| Tenant Data Isolation | Every database query scoped to authenticated tenant via Prisma middleware (tenantAuth.ts); no cross-tenant data access possible through application layer |
| Encryption at Rest | PostgreSQL Transparent Data Encryption (Azure-managed); Azure Storage Service Encryption; Key Vault HSM-backed key storage; Application-layer AES-256-GCM for Graph API tokens |
| Encryption in Transit | TLS 1.2+ enforced on all connections: browser-to-API, API-to-database (sslmode=require), API-to-Graph API, API-to-Key Vault |
| Breach Notification Process | Not yet formalized; planned as part of security remediation; target: 72-hour notification to supervisory authority per GDPR Art. 33 |

### 9.4 Cross-Border Data Transfer

| Destination | Mechanism | Data Categories | Safeguards |
|-------------|-----------|-----------------|------------|
| Microsoft Entra ID (Global) | Microsoft Data Protection Agreement (DPA) | User identity data (email, name, Entra ID object ID) | Encrypted in transit; Microsoft contractual commitments per DPA; no CUI transferred to Entra ID |
| Microsoft Graph API / SharePoint (Tenant's M365 geography) | Tenant's own M365 DPA | Evidence files (may contain CUI) | Governed by tenant's own Microsoft 365 agreement; evidence management is opt-in; tenants control their SharePoint data residency |
| GitHub (United States) | GitHub Enterprise DPA | Source code, CI/CD configuration (no PII, no CUI, no customer data) | No customer data in source code; CI/CD uses OIDC federation (no stored secrets); Docker images contain only application code |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-14 | Solution Architect | Initial draft |
