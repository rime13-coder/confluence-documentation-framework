# Data Classification

| **Page Title**   | Data Classification - M365 Security Assessment Automation |
|------------------|-----------------------------------------------------------|
| **Last Updated** | 2026-02-15                                                |
| **Status**       | COMPLETE                                                  |
| **Owner**        | IntelliSec Solutions Security Lead                        |
| **Reviewers**    | Dev Lead, CTO, Compliance Advisor                         |
| **Policy Ref**   | NIST SP 800-171 Rev 2, Enterprise Data Classification Policy |

---

## 1. Document Purpose

This document defines the data classification framework for the **M365 Security Assessment Automation** tool, inventories all data elements processed by the system, specifies handling requirements per classification level, and establishes the data lifecycle from creation through deletion. The tool is a locally-executed PowerShell module that connects to client Microsoft 365 tenants to perform automated security assessments. It handles data spanning four classification levels: client credentials and app registration secrets (Restricted), assessment findings and tenant configurations (Confidential), controls databases and tool configuration (Internal), and public documentation (Public). Because the tool produces reports that detail specific security gaps in client environments, the data classification and handling requirements are critical to protecting client interests.

---

## 2. Classification Levels

| Level | Label | Description | Examples (M365 Assessment Tool) | Handling Requirements |
|-------|-------|-------------|--------------------------------|----------------------|
| **1** | **Public** | Information approved for unrestricted public access. Disclosure causes no harm. | Tool documentation, module README, PowerShell Gallery listing description, NIST SP 800-171 control definitions, CMMC framework references | No special handling. May be shared externally. No encryption requirement beyond standard TLS in transit. |
| **2** | **Internal** | Information intended for internal use within IntelliSec Solutions. Disclosure could cause minor inconvenience but no significant business or client harm. | SQLite controls database (finding definitions, severity ratings), assessment logic and module source code, tool configuration templates, JSONL log files (redacted), Pode dashboard route definitions | Access restricted to IntelliSec personnel. Store on controlled systems. Encrypt in transit (TLS 1.2+). Do not share externally without approval. |
| **3** | **Confidential** | Sensitive security posture data. Unauthorized disclosure could reveal specific security vulnerabilities in client environments, enabling targeted attacks against client organizations. | Assessment findings/reports (Word documents showing security gaps), evidence CSV exports (M365 tenant configurations), client tenant configuration details (security settings, policies, user counts), assessment result summaries | Encrypt at rest and in transit. Access restricted to authorized assessment operators. Log all access. Secure deletion after client delivery. Client-specific data must never be commingled across engagements. |
| **4** | **Restricted** | Highly sensitive authentication material. Unauthorized disclosure could enable unauthorized access to client M365 tenants with application-level permissions, potentially leading to full tenant data exfiltration. | Client credential profiles (DPAPI-encrypted), Azure AD App Registration client secrets, Exchange Online authentication certificates (private keys), OAuth access tokens (in-memory) | DPAPI encryption at rest (minimum). Strict need-to-know access. No copies on shared systems. Rotation policy required. Immediate rotation upon any suspected compromise. Full audit trail on access. |

---

## 3. Data Inventory

| Data Element | Source | Classification Level | Storage Location | Encryption at Rest | Encryption in Transit | Access Control | Retention Period | Notes |
|-------------|--------|---------------------|------------------|--------------------|-----------------------|---------------|-----------------|-------|
| Client Credential Profiles | Operator creation via tool setup | Restricted | Local file system (DPAPI-encrypted .xml files) | DPAPI (user-scope, tied to Windows user SID + machine key) | N/A (local only) | Windows user account (DPAPI binding); NTFS ACLs | Until client engagement ends or rotation occurs | Contains client ID, client secret or certificate reference, tenant ID; one profile per client |
| Azure AD App Registration Client Secret | Azure AD portal / app registration | Restricted | Embedded in DPAPI-encrypted credential profile | DPAPI (within credential profile) | HTTPS (TLS 1.2+) during OAuth token acquisition | DPAPI decryption requires specific user context | 90-day rotation recommended | Used for Graph API authentication; migrate to certificate-based auth recommended |
| Exchange Online Certificate (Private Key) | Certificate generation / PKI | Restricted | Local certificate store or DPAPI-encrypted file | Windows certificate store encryption or DPAPI | HTTPS (TLS 1.2+) during certificate auth | Certificate store ACLs; private key non-exportable recommended | 1-year rotation recommended | X.509 certificate for Exchange Online app-only auth |
| OAuth Access Tokens | Microsoft Identity Platform | Restricted | In-memory only (PowerShell runtime) | N/A (memory-resident) | HTTPS (TLS 1.2+) for API calls | Process-level isolation; cleared on Disconnect | Session lifetime only (typically 1 hour) | Never persisted to disk; acquired per-session; managed by Microsoft.Graph module |
| Assessment Findings / Reports | Assessment execution output | Confidential | Local file system (Word documents via PSWriteWord) | None (unencrypted files; BitLocker recommended) | N/A (local only; manual delivery to client) | NTFS file permissions; assessment operator access | 30 days after client delivery (recommended) | Contains specific security gaps, misconfigurations, and compliance failures per client |
| Evidence CSV Exports | Assessment execution output | Confidential | Local file system (CSV files) | None (unencrypted files; BitLocker recommended) | N/A (local only) | NTFS file permissions; assessment operator access | 30 days after client delivery (recommended) | Raw M365 configuration data: security settings, user lists, policy details, group memberships |
| Client Tenant Configuration Data | Microsoft Graph API and Exchange Online responses | Confidential | In-memory during assessment; persisted in reports and CSVs | In-memory: N/A; Persisted: see Reports/CSVs above | HTTPS (TLS 1.2+) from Microsoft APIs | Process-level isolation during assessment | Session lifetime (memory); report retention (files) | Security settings, Conditional Access policies, MFA status, mailbox configurations |
| JSONL Assessment Logs | Assessment execution | Internal | Local file system (JSONL files) | None (unencrypted files; BitLocker recommended) | N/A (local only) | NTFS file permissions; assessment operator access | Retained with assessment deliverables | Timestamps, control IDs, pass/fail results, assessment metadata; must not contain credentials or tokens (redaction required) |
| SQLite Controls Database | Tool distribution / development | Internal | Local file system (SQLite .db file) | None (unencrypted database file) | N/A (local only) | NTFS file permissions; read-only during assessment | Tool lifetime (updated with releases) | Finding definitions, control mappings, severity ratings, assessment logic; no client data |
| Tool Configuration Files | Operator setup | Internal | Local file system (JSON/config files) | None | N/A (local only) | NTFS file permissions | Tool lifetime | Assessment parameters, output paths, feature flags; no credentials (stored separately in DPAPI profiles) |
| Pode Dashboard Session Data | Dashboard runtime | Internal | In-memory (Pode web server) | N/A (memory-resident) | HTTP (localhost only) | Localhost binding; process-level isolation | Session lifetime only | Assessment results displayed in browser; cleared on Pode server shutdown |
| Module Source Code | Development / distribution | Internal | Local file system (.psm1, .ps1 files) | None | N/A (local only) | NTFS file permissions | Tool lifetime | Assessment logic, API queries, report generation code; no embedded credentials |
| Tool Documentation | Development | Public | Local file system; potentially published | N/A | N/A | Unrestricted | Indefinite | README, usage guides, module manifest; no client data or credentials |
| NIST Control Definitions | NIST SP 800-171 Rev 2 | Public | SQLite controls database (read-only reference) | N/A | N/A | Unrestricted (public standard) | Indefinite | Publicly available control text, practice descriptions, assessment objectives |

---

## 4. Handling Procedures by Classification Level

### 4.1 Public

| Activity | Requirement |
|----------|-------------|
| Storage | Any storage medium; no special requirements |
| Transmission | HTTPS recommended but not required; content is non-sensitive |
| Sharing | May be shared externally without approval; published to PowerShell Gallery if applicable |
| Printing | No restrictions |
| Disposal | No special requirements; standard deletion |
| Backup | Standard backup procedures |
| Non-production use | No restrictions |

### 4.2 Internal

| Activity | Requirement |
|----------|-------------|
| Storage | IntelliSec-controlled systems only; assessment workstation, source control repository |
| Transmission | TLS 1.2+ for any electronic transmission; internal file sharing only |
| Sharing | IntelliSec Solutions team members only; no external sharing without CTO approval |
| Printing | Minimize; collect promptly; shred when no longer needed |
| Disposal | Delete from file system; secure delete recommended; clear SQLite database if decommissioning workstation |
| Backup | Standard backup procedures; backups stored on IntelliSec-controlled systems only |
| Non-production use | Permitted with access controls; no client-specific data commingling |

### 4.3 Confidential

| Activity | Requirement |
|----------|-------------|
| Storage | Assessment workstation only (local file system); full-disk encryption (BitLocker) required; file-level encryption recommended (remediation in progress); dedicated output directory per client engagement |
| Transmission | HTTPS (TLS 1.2+) if transmitted electronically; encrypted email or secure file transfer for client delivery; never transmitted over unencrypted channels |
| Sharing | Client-specific: share only with the assessed client organization; IntelliSec: assessment operator and project lead only; no cross-client data sharing under any circumstances |
| Printing | Prohibited for assessment reports and evidence exports; if required for client presentation, label as CONFIDENTIAL, account for all copies, shred immediately after use |
| Disposal | Secure deletion (overwrite) after confirmed client delivery and retention period expiration (30 days recommended); document disposal in engagement records; clear recycle bin |
| Backup | Encrypted backups only; backup access restricted to assessment operator; backups deleted when source files are deleted |
| Non-production use | Prohibited; no client assessment data in development, testing, or demonstration environments; use synthetic test data only |

### 4.4 Restricted

| Activity | Requirement |
|----------|-------------|
| Storage | DPAPI-encrypted credential profiles on assessment workstation; Exchange certificates in Windows certificate store (private key non-exportable); OAuth tokens in-memory only (never persisted to disk) |
| Transmission | DPAPI credentials: never transmitted (local-only); client secrets/certificates: HTTPS (TLS 1.2+) during OAuth flows only; never sent via email, chat, or file transfer |
| Sharing | Strictly prohibited; no human-readable sharing of credentials or secrets; app registration credentials managed by assessment operator only; client admin provides credentials via secure out-of-band channel |
| Printing | Prohibited under all circumstances |
| Disposal | DPAPI profiles: secure deletion when engagement ends; credentials: rotated in Azure AD before deletion; certificates: revoked in Azure AD before deletion; document disposal for compliance |
| Backup | DPAPI profiles: no backup (re-create from source credentials if needed); certificates: backed up in secure certificate store only (private key non-exportable) |
| Non-production use | Prohibited; development and testing must use separate Azure AD app registrations with dedicated test tenant credentials |

---

## 5. Data Lifecycle

### 5.1 Lifecycle Overview

```
+-------------+     +---------------+     +----------------+     +-------------+     +-------------+
|  CREATION   | --> |   STORAGE     | --> |  TRANSMISSION  | --> |  ARCHIVAL   | --> |  DELETION   |
|             |     |               |     |                |     |             |     |             |
| Credentials |     | DPAPI-encrypted|    | HTTPS to M365  |     | Retained    |     | Secure      |
| created     |     | on local disk |     | APIs (TLS 1.2+)|     | per policy  |     | deletion    |
|             |     |               |     |                |     |             |     | (overwrite) |
| Assessment  |     | Reports/CSVs  |     | Manual delivery|     | 30-day      |     |             |
| executed    |     | on local disk |     | to client      |     | retention   |     | Credential  |
|             |     |               |     |                |     | after       |     | rotation in |
| Reports     |     | SQLite DB     |     | Localhost only  |     | delivery    |     | Azure AD    |
| generated   |     | (read-only)   |     | (Pode dashboard)|    |             |     |             |
+-------------+     +---------------+     +----------------+     +-------------+     +-------------+
```

### 5.2 Creation Phase

| Data Type | Creation Event | Creator | Classification at Creation |
|-----------|---------------|---------|---------------------------|
| Client Credential Profiles | Assessment operator runs tool setup, enters app registration credentials; DPAPI encrypts and stores | Assessment Operator | Restricted |
| Assessment Findings / Reports | PowerShell module executes assessment against client M365 tenant; PSWriteWord generates Word document | Automated (tool) | Confidential |
| Evidence CSV Exports | PowerShell module exports raw M365 configuration data during assessment | Automated (tool) | Confidential |
| JSONL Assessment Logs | PowerShell module logs all actions during assessment execution | Automated (tool) | Internal |
| Client Tenant Configuration Data | Retrieved from Microsoft Graph API and Exchange Online during assessment | Automated (tool via API) | Confidential |
| OAuth Access Tokens | Acquired from Microsoft Identity Platform at assessment start | Automated (Microsoft SDK) | Restricted |

### 5.3 Storage Phase

| Data Type | Storage Medium | Duration | Protection Mechanism |
|-----------|---------------|----------|---------------------|
| Client Credential Profiles | Local file system (DPAPI-encrypted) | Engagement lifetime | DPAPI (user-scope); NTFS ACLs; BitLocker (recommended) |
| Assessment Reports / CSVs | Local file system (unencrypted) | Until delivery + 30 days | NTFS ACLs; BitLocker (recommended); file-level encryption (planned) |
| JSONL Logs | Local file system | Retained with deliverables | NTFS ACLs; BitLocker (recommended) |
| SQLite Controls Database | Local file system | Tool lifetime | NTFS ACLs; read-only during assessment |
| OAuth Tokens | In-memory | Session only (1 hour max) | Process isolation; cleared on disconnect |

### 5.4 Transmission Phase

| Data Type | Transmission Channel | Encryption | Destination |
|-----------|---------------------|------------|-------------|
| OAuth Tokens / API Requests | HTTPS (TLS 1.2+) | Microsoft SDK-managed TLS | Microsoft Graph API, Exchange Online, Azure AD |
| Assessment Reports | Manual (encrypted email, secure file transfer) | Client-agreed encryption method | Client organization |
| Dashboard Data | HTTP (localhost 127.0.0.1) | None (localhost only) | Operator's local browser |
| Credential Profiles | Never transmitted | N/A | N/A (local-only) |

### 5.5 Archival Phase

| Data Type | Archival Policy | Archival Location | Access During Archival |
|-----------|----------------|-------------------|----------------------|
| Assessment Reports / CSVs | Retained on assessment workstation for 30 days after confirmed client delivery | Local file system (same as active storage) | Assessment operator only |
| JSONL Logs | Retained alongside reports for audit trail | Local file system | Assessment operator only |
| Credential Profiles | Retained for engagement duration; no archival after engagement ends | Local file system (DPAPI-encrypted) | Assessment operator only |

### 5.6 Deletion Phase

| Data Type | Deletion Trigger | Deletion Method | Verification |
|-----------|-----------------|-----------------|--------------|
| Assessment Reports / CSVs | 30 days after confirmed client delivery, or client request | Secure deletion (file overwrite + delete); clear recycle bin | Operator confirms deletion; document in engagement records |
| JSONL Logs | Deleted with associated reports | Secure deletion (file overwrite + delete) | Included in report deletion verification |
| Credential Profiles | Engagement ends; client offboarding; credential rotation | Secure deletion of DPAPI file; rotate/revoke credentials in Azure AD | Verify credential revocation in Azure AD audit logs |
| OAuth Tokens | Assessment session end | Automatic (Disconnect-MgGraph, Disconnect-ExchangeOnline) | Token invalidation confirmed by module disconnect |
| Evidence CSV Exports | Deleted with associated reports | Secure deletion (file overwrite + delete) | Included in report deletion verification |

---

## 6. Retention Policy Summary

| Data Category | Classification | Retention Period | Retention Start | Deletion Authority |
|--------------|---------------|-----------------|-----------------|-------------------|
| Client Credential Profiles | Restricted | Duration of client engagement | Engagement start | Assessment Operator (with Security Lead approval) |
| Assessment Reports | Confidential | 30 days after confirmed client delivery | Client delivery confirmation date | Assessment Operator |
| Evidence CSV Exports | Confidential | 30 days after confirmed client delivery | Client delivery confirmation date | Assessment Operator |
| JSONL Assessment Logs | Internal | Retained with associated reports (30 days after delivery) | Client delivery confirmation date | Assessment Operator |
| SQLite Controls Database | Internal | Tool lifetime (updated with each release) | Tool installation | Dev Lead |
| Tool Configuration | Internal | Tool lifetime | Tool installation | Assessment Operator |
| OAuth Access Tokens | Restricted | Session only (maximum 1 hour) | Token acquisition | Automatic (module disconnect) |
| Pode Dashboard Sessions | Internal | Session only | Dashboard start | Automatic (server shutdown) |

---

## 7. Data Flow Diagram Description

### 7.1 Assessment Execution Data Flow

1. **Credential Load**: Assessment operator invokes assessment cmdlet. PowerShell module loads DPAPI-encrypted credential profile from local file system. Windows DPAPI decrypts in-memory using the operator's user context (user SID + machine key).

2. **Authentication**: Module uses decrypted credentials to authenticate with Azure AD via OAuth 2.0 client credentials flow (HTTPS/TLS 1.2+). For Exchange Online, certificate-based authentication is used. OAuth access tokens are received and held in-memory.

3. **Data Retrieval**: Module makes HTTPS calls to Microsoft Graph API and Exchange Online using Bearer tokens / certificate auth. Retrieves tenant security configurations, user/group data, policy settings, mailbox configurations. All data received over TLS 1.2+.

4. **Assessment Processing**: Retrieved configuration data is evaluated against the SQLite controls database (finding definitions, severity mappings). Assessment logic determines PASS/FAIL/N_A for each control. Results held in-memory.

5. **Output Generation**: PSWriteWord generates Word report documenting findings. CSV evidence files exported. JSONL log file captures all assessment actions. All output written to local file system in a client-specific output directory.

6. **Session Cleanup**: `Disconnect-MgGraph` and `Disconnect-ExchangeOnline` called. OAuth tokens invalidated. In-memory data released by PowerShell garbage collection.

7. **Delivery**: Assessment operator manually delivers reports to client via agreed-upon secure channel (encrypted email, secure file transfer). Delivery confirmed.

8. **Retention and Deletion**: Output files retained on workstation for 30 days after delivery confirmation. Secure deletion performed. Credential profiles retained for engagement duration, then securely deleted with Azure AD credential rotation.

### 7.2 Data Flow Boundaries

| Boundary | Data Crossing | Classification | Protection |
|----------|--------------|---------------|------------|
| Workstation to Azure AD | Client credentials (OAuth request) | Restricted | HTTPS/TLS 1.2+; OAuth 2.0 client credentials flow |
| Workstation to Graph API | Bearer token + API queries | Restricted (token) / Confidential (responses) | HTTPS/TLS 1.2+; Bearer authorization header |
| Workstation to Exchange Online | Certificate auth + cmdlet calls | Restricted (certificate) / Confidential (responses) | HTTPS/TLS 1.2+; certificate-based auth |
| PowerShell to Local Disk | Reports, CSVs, logs, credential profiles | Confidential / Restricted | DPAPI (credentials); NTFS ACLs; BitLocker (recommended) |
| Pode Server to Local Browser | Assessment results display | Internal | HTTP localhost (127.0.0.1) binding |

---

## 8. Incident Procedures for Data Exposure

### 8.1 General Incident Response Flow

1. **Detection** -- Data exposure identified (suspected credential compromise, unauthorized file access, workstation breach, or client notification)
2. **Containment** -- Immediately revoke/rotate affected credentials; disconnect active assessment sessions; isolate assessment workstation if compromised
3. **Assessment** -- Determine classification level of exposed data, number of affected clients, and scope of exposure
4. **Escalation** -- Follow escalation path based on classification level (see below)
5. **Notification** -- Notify required parties per classification level and contractual obligations
6. **Remediation** -- Fix the root cause; rotate all potentially affected credentials; regenerate DPAPI profiles if user account compromised
7. **Post-Incident Review** -- Document lessons learned; update threat model, security review checklist, and handling procedures

### 8.2 Escalation by Classification Level

| Classification | Response Time | Escalation Path | Notification Requirements |
|---------------|--------------|-----------------|--------------------------|
| **Public** | Best effort | Dev Lead | None required |
| **Internal** | 24 hours | Dev Lead, Security Lead | Internal team notification |
| **Confidential** | 4 hours | Security Lead, CTO, Legal counsel | Affected client organization(s); contractual notification obligations; assess regulatory reporting requirements |
| **Restricted** | 1 hour | CTO, Legal counsel, all hands | Affected client organization(s); immediate credential rotation for all potentially affected clients; Azure AD app registration remediation |

### 8.3 Restricted Data Exposure (Credentials, Secrets, Certificates)

- [ ] Immediately contain the exposure (all-hands priority)
- [ ] Notify CTO and legal counsel within 1 hour
- [ ] Immediately rotate ALL potentially compromised credentials:
  - [ ] Azure AD App Registration client secrets (regenerate in Azure AD portal)
  - [ ] Exchange Online certificates (revoke and reissue)
  - [ ] DPAPI credential profiles (delete and regenerate with new credentials)
- [ ] Assess whether any client tenant data was accessed using compromised credentials
- [ ] Review Azure AD sign-in logs for the affected app registration for unauthorized access
- [ ] If client data was accessed, follow Confidential exposure procedures for each affected client
- [ ] Preserve all forensic evidence (JSONL logs, Windows event logs, Azure AD audit logs)
- [ ] Executive-level incident review with CTO
- [ ] Update credential management practices and monitoring

### 8.4 Confidential Data Exposure (Reports, Findings, Tenant Configurations)

- [ ] Contain the exposure (identify all copies of exposed data; revoke access where possible)
- [ ] Notify Security Lead and CTO within 4 hours
- [ ] Identify all affected client organizations and the scope of exposed data
- [ ] Prepare client notification with specifics of what data was exposed
- [ ] Assess contractual obligations for breach notification per client engagement agreement
- [ ] Assess regulatory reporting requirements based on data content and jurisdiction
- [ ] Initiate accelerated secure deletion of affected files on compromised systems
- [ ] Conduct full incident review and update data handling procedures

---

## 9. References

| Document | Link |
|----------|------|
| Threat Model | ./threat-model.md |
| Security Review Checklist | ./security-review-checklist.md |
| NIST SP 800-171 Rev 2 | https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final |
| DPAPI Documentation | https://learn.microsoft.com/en-us/windows/win32/seccng/cng-dpapi |
| Microsoft Graph API Permissions | https://learn.microsoft.com/en-us/graph/permissions-reference |
| Windows Data Protection (DPAPI) | https://learn.microsoft.com/en-us/dotnet/standard/security/how-to-use-data-protection |

---

## 10. Approval

| Name | Role | Signature / Approval | Date |
|------|------|---------------------|------|
| (Pending) | Data Owner / CTO | | |
| (Pending) | Security Lead | | |
| (Pending) | Compliance Advisor | | |
| (Pending) | Dev Lead | | |
