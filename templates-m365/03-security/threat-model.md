# Threat Model

| **Page Title**   | Threat Model - M365 Security Assessment Automation       |
|------------------|----------------------------------------------------------|
| **Last Updated** | 2026-02-15                                               |
| **Status**       | IN PROGRESS                                              |
| **Owner**        | IntelliSec Solutions Security Lead                       |
| **Reviewers**    | Platform Architect, DevOps Lead, CTO                     |
| **Methodology**  | STRIDE                                                   |

---

## 1. Document Purpose

This threat model identifies, categorizes, and prioritizes potential security threats to the **M365 Security Assessment Automation** tool using the STRIDE methodology. The tool is a locally-executed PowerShell module that connects to client Microsoft 365 tenants via Azure AD App Registration with application-level permissions to perform automated security assessments. It handles highly sensitive data including client credential profiles (DPAPI-encrypted), assessment findings that expose security vulnerabilities in client environments, Azure AD App Registration secrets, and a local SQLite controls database. Given that the tool operates with broad read permissions across client tenants and produces reports detailing security gaps, this threat model is critical to ensuring the assessment workstation, credential storage, network communications, and output handling meet enterprise security standards.

---

## 2. STRIDE Methodology Overview

STRIDE is a threat classification model developed by Microsoft. Each category represents a type of security threat:

| Category                   | Abbreviation | Description                                                        | Security Property Violated |
|----------------------------|--------------|--------------------------------------------------------------------|----------------------------|
| **Spoofing**               | S            | Impersonating a user, system, or component                        | Authentication             |
| **Tampering**              | T            | Unauthorized modification of data or code                          | Integrity                  |
| **Repudiation**            | R            | Denying actions without the ability to prove otherwise             | Non-repudiation            |
| **Information Disclosure** | I            | Exposing data to unauthorized parties                              | Confidentiality            |
| **Denial of Service**      | D            | Disrupting availability of a service or resource                   | Availability               |
| **Elevation of Privilege** | E            | Gaining unauthorized access to higher privilege levels             | Authorization              |

---

## 3. System Decomposition

### 3.1 System Overview

| Attribute                | Details                                                                  |
|--------------------------|--------------------------------------------------------------------------|
| **Application Name**     | M365 Security Assessment Automation                                      |
| **Type**                 | Locally-executed PowerShell module (not a hosted service)                 |
| **Execution Environment**| Windows workstation (assessment operator's machine)                      |
| **Authentication**       | Azure AD App Registration with application-level permissions             |
| **Credential Storage**   | DPAPI-encrypted credential profiles (tied to Windows user/machine)       |
| **Data Stores**          | Local SQLite database (controls/findings), local file system (reports)   |
| **External Integrations**| Microsoft Graph API, Exchange Online (certificate-based auth), Azure AD  |
| **Reporting**            | Local Word documents (PSWriteWord), CSV evidence exports                 |
| **Web Dashboard**        | Pode-based local HTTP server for interactive assessment review           |

### 3.2 Trust Boundaries

| Boundary ID | Boundary Name                                | From Zone                          | To Zone                              | Protocol / Interface              |
|-------------|----------------------------------------------|------------------------------------|--------------------------------------|-----------------------------------|
| TB-001      | Assessment Workstation to Microsoft Graph API| Local PowerShell module            | Microsoft Graph API (cloud)          | HTTPS (TLS 1.2+, Bearer token)   |
| TB-002      | Assessment Workstation to Exchange Online    | Local PowerShell module            | Exchange Online Management           | HTTPS (TLS 1.2+, certificate auth)|
| TB-003      | Assessment Workstation to Azure AD           | Local PowerShell module            | Azure AD (app registration)          | HTTPS (OAuth 2.0 client credentials)|
| TB-004      | Local File System to PowerShell Module       | DPAPI-encrypted credential store   | PowerShell runtime (in-memory)       | Windows DPAPI decryption          |
| TB-005      | Pode Web Server to Local Browser             | Pode HTTP listener (localhost)     | Operator's web browser               | HTTP (localhost only)             |
| TB-006      | PowerShell Module to SQLite Database         | PowerShell runtime                 | Local SQLite file (PSSQLite)         | File I/O (local disk)            |
| TB-007      | Report Output to File System                 | PowerShell runtime                 | Local file system (Word/CSV/JSONL)   | File I/O (local disk)            |

### 3.3 Entry Points

| Entry Point ID | Name                            | Description                                                              | Trust Level Required        | Protocol    |
|----------------|---------------------------------|--------------------------------------------------------------------------|-----------------------------|-------------|
| EP-001         | PowerShell Console              | Operator invokes assessment cmdlets directly                             | Authenticated Windows user  | Local       |
| EP-002         | Pode Web Dashboard              | Local web interface for reviewing assessment results interactively       | Authenticated Windows user  | HTTP (localhost)|
| EP-003         | Credential Profile Files        | Encrypted credential files loaded at assessment startup                  | DPAPI-decryptable user context| File I/O  |
| EP-004         | SQLite Controls Database        | Finding definitions and control mappings loaded during assessment        | Authenticated Windows user  | File I/O    |
| EP-005         | Configuration Files             | Tool configuration (config.json) specifying tenant and assessment params | Authenticated Windows user  | File I/O    |

### 3.4 Assets

| Asset ID | Asset Name                              | Description                                                                     | Classification | Storage Location                         |
|----------|-----------------------------------------|---------------------------------------------------------------------------------|----------------|------------------------------------------|
| A-001    | Client Credential Profiles              | Azure AD App Registration credentials (client ID, client secret/certificate) encrypted with DPAPI | Restricted     | Local file system (DPAPI-encrypted)      |
| A-002    | Assessment Findings/Reports             | Word documents and CSVs containing client security gaps, misconfigurations, and compliance failures | Confidential   | Local file system (unencrypted files)    |
| A-003    | Azure AD App Registration Secrets       | Client secret or certificate private key for the app registration               | Restricted     | DPAPI-encrypted credential profile       |
| A-004    | SQLite Controls Database                | Finding definitions, control mappings, severity ratings, and assessment logic    | Internal       | Local file system (SQLite .db file)      |
| A-005    | Evidence CSV Exports                    | Raw data exports from M365 tenant showing configuration details                 | Confidential   | Local file system (CSV files)            |
| A-006    | JSONL Assessment Logs                   | Structured log files recording assessment actions, timestamps, and results      | Internal       | Local file system (JSONL files)          |
| A-007    | Client Tenant Configuration Data        | Security settings, policies, and configurations retrieved from M365 APIs        | Confidential   | In-memory during assessment; persisted in reports |
| A-008    | Pode Web Dashboard Session              | In-memory session data when interactive dashboard is active                     | Internal       | In-memory (Pode server)                 |
| A-009    | Exchange Online Certificate             | X.509 certificate used for certificate-based authentication to Exchange Online  | Restricted     | Local certificate store or file system   |
| A-010    | Tool Source Code / Modules              | PowerShell module files (.psm1, .ps1) containing assessment logic               | Internal       | Local file system                        |

---

## 4. Data Flow Diagram

```
+-----------------------------+
|   Assessment Workstation    |
|   (Windows, Local Execution)|
|                             |
|  +----------+  +--------+  |         TB-003           +------------------+
|  | Config   |  | DPAPI  |  |  ----- HTTPS/OAuth ----> | Azure AD         |
|  | Files    |  | Creds  |  |                           | (App Registration|
|  +----+-----+  +---+----+  |                           |  + Permissions)   |
|       |            |        |                           +------------------+
|       v            v        |
|  +----+------------+-----+  |         TB-001           +------------------+
|  |                       |  |  ----- HTTPS/Bearer ---> | Microsoft Graph  |
|  |   PowerShell Module   |  |                           | API              |
|  |   (Assessment Engine) |  |                           | (Security, AAD,  |
|  |                       |  |         TB-002           |  Compliance)     |
|  +---+-------+-------+--+  |  ----- HTTPS/Cert -----> +------------------+
|      |       |       |      |                           | Exchange Online  |
|      v       v       v      |                           | Management       |
|  +---+-+ +---+-+ +---+--+  |                           +------------------+
|  |SQLite| |Word | |CSV   |  |
|  |  DB  | |Rpt  | |Export |  |
|  +------+ +-----+ +------+  |
|      |                      |
|      v        TB-005        |
|  +--+---+  ---- HTTP --->   |    +------------------+
|  | Pode |                   |--->| Operator Browser  |
|  | Web  |  (localhost only) |    | (localhost)       |
|  +------+                   |    +------------------+
+-----------------------------+

Logging:
  PowerShell Module --> JSONL structured log files (local)
```

---

## 5. Threat Identification

| Threat ID | Category (STRIDE) | Threat Description | Component Affected | Likelihood (H/M/L) | Impact (H/M/L) | Risk Rating | Mitigation | Status |
|-----------|--------------------|--------------------|--------------------|---------------------|-----------------|-------------|------------|--------|
| T-001 | Spoofing | Stolen client credentials (DPAPI-encrypted profiles) could allow an attacker to authenticate as the assessment tool and gain unauthorized read access to client M365 tenants, including security configurations, user lists, and compliance data | Client Credential Profiles (A-001) | M | H | High | DPAPI encryption binds credentials to the Windows user account and machine; access to the workstation with the correct user context is required to decrypt | IN PROGRESS |
| T-002 | Spoofing | Compromised Azure AD App Registration (stolen client secret or certificate) could allow an attacker to impersonate the assessment tool from any machine, bypassing DPAPI protection entirely | Azure AD App Registration (A-003) | L | H | Medium | Certificate-based auth for Exchange Online eliminates client secret for that service; app registration credentials stored in DPAPI-encrypted profiles; credential rotation policy recommended | IN PROGRESS |
| T-003 | Spoofing | An unauthorized local user on the assessment workstation could run the tool under the legitimate operator's Windows session, gaining decrypted access to all stored credential profiles | PowerShell Console (EP-001) | M | H | High | Workstation access controls (Windows logon); DPAPI ties decryption to the specific user SID; no shared accounts policy | IN PROGRESS |
| T-004 | Tampering | Modified finding definitions in the SQLite controls database could hide security gaps or downgrade severity ratings, causing the assessment to report a false sense of security to the client | SQLite Controls Database (A-004) | L | H | Medium | Database file integrity monitoring recommended; read-only access during assessment execution; version-controlled finding definitions in source control | NOT STARTED |
| T-005 | Tampering | Malware on the assessment workstation could modify PowerShell module files to alter assessment logic, suppress findings, or exfiltrate credentials and report data | Tool Source Code (A-010) | M | H | High | PowerShell script signing (Authenticode) recommended; endpoint protection on assessment workstation; module integrity verification at startup | NOT STARTED |
| T-006 | Tampering | Assessment reports (Word/CSV) could be modified after generation to alter findings before delivery to the client, misrepresenting the security posture | Assessment Reports (A-002) | L | M | Low | JSONL log file provides an independent audit trail of all findings; report hash verification recommended; comparison of report contents against log entries | NOT STARTED |
| T-007 | Repudiation | Assessment results could be disputed by the client or the operator without a reliable audit trail proving what was assessed, when, and what the findings were | Assessment Findings (A-002), Logs (A-006) | M | M | Medium | JSONL structured logging records all assessment actions with timestamps; log files should be preserved alongside reports; tamper-evident log storage recommended | IN PROGRESS |
| T-008 | Repudiation | Operator could deny running an assessment or claim different results were produced, with no independent verification mechanism | PowerShell Console (EP-001), Logs (A-006) | L | M | Low | JSONL logs capture operator actions and timestamps; centralized log forwarding recommended for independent verification; report generation logged | IN PROGRESS |
| T-009 | Information Disclosure | Assessment reports contain detailed security posture data (misconfigurations, gaps, compliance failures) that would be highly valuable to attackers targeting the assessed client organization | Assessment Reports (A-002) | M | H | High | Reports stored locally only (not transmitted over network); operator responsible for secure handling and delivery; file encryption at rest recommended; output file cleanup procedures | IN PROGRESS |
| T-010 | Information Disclosure | Evidence CSV exports contain raw M365 tenant configuration data that reveals security settings, user lists, group memberships, and policy configurations | Evidence CSV Exports (A-005) | M | H | High | CSVs stored locally; same handling requirements as reports; cleanup after delivery; no sensitive data in file names | IN PROGRESS |
| T-011 | Information Disclosure | DPAPI encryption is tied to the Windows user account and machine; if the user profile is compromised (password reset by admin, backup/restore of user profile), credentials can be decrypted | Client Credential Profiles (A-001) | L | H | Medium | DPAPI is the strongest available local encryption without external key management; operator awareness of DPAPI limitations; credential rotation after any suspected user profile compromise | ACCEPTED |
| T-012 | Information Disclosure | Network interception of API calls (man-in-the-middle) could expose OAuth tokens, tenant configuration data, and security assessment results in transit | All API connections (TB-001, TB-002, TB-003) | L | H | Medium | All Microsoft API connections use HTTPS with TLS 1.2+; certificate pinning handled by Microsoft SDK; assessment should only be run on trusted networks | IN PROGRESS |
| T-013 | Information Disclosure | Pode web dashboard running on localhost could be accessed by other processes or users on the same machine if binding is misconfigured | Pode Web Dashboard (EP-002) | L | M | Low | Pode configured to bind to localhost (127.0.0.1) only; no external network exposure; session timeout recommended | IN PROGRESS |
| T-014 | Information Disclosure | Sensitive data (credentials, tokens, tenant configurations) could appear in JSONL log files or PowerShell transcript logs | JSONL Logs (A-006) | M | M | Medium | Log redaction for sensitive fields (tokens, secrets, passwords); no credential values written to logs; structured logging format enables targeted redaction | IN PROGRESS |
| T-015 | Denial of Service | Microsoft Graph API rate limiting (throttling) could prevent assessment completion, especially for large tenants with many users, groups, and policies | Microsoft Graph API (TB-001) | H | M | High | Exponential backoff and retry logic in API calls; Microsoft.Graph module handles throttling natively; assessment can be resumed; batch API calls where supported | IN PROGRESS |
| T-016 | Denial of Service | Exchange Online connectivity issues (service outages, certificate expiration, conditional access blocking) could prevent Exchange-related assessment controls from completing | Exchange Online (TB-002) | M | M | Medium | Certificate-based auth reduces dependency on interactive flows; graceful handling of Exchange connectivity failures; partial assessment completion supported | IN PROGRESS |
| T-017 | Denial of Service | SQLite database corruption (disk failure, concurrent access, abrupt termination) could prevent assessment execution entirely | SQLite Controls Database (A-004) | L | M | Low | Read-only access during assessment; database file backup included with tool distribution; PSSQLite handles connection management; file integrity check at startup | IN PROGRESS |
| T-018 | Elevation of Privilege | Azure AD App Registration has broad read permissions (Directory.Read.All, SecurityEvents.Read.All, Policy.Read.All, etc.) that exceed what is strictly needed for some individual assessment controls | Azure AD App Registration (A-003) | L | H | Medium | Permissions scoped to read-only (no write permissions); least-privilege principle applied where possible; some broad read permissions are unavoidable for comprehensive security assessment; permission scope documented and reviewed | ACCEPTED |
| T-019 | Elevation of Privilege | Malware or a malicious PowerShell script running in the same user context could load the assessment module and invoke cmdlets to access client tenant data using the stored credentials | PowerShell Console (EP-001), Credential Profiles (A-001) | M | H | High | Application whitelisting on assessment workstation recommended; PowerShell Constrained Language Mode consideration; endpoint detection and response (EDR) on workstation | NOT STARTED |
| T-020 | Elevation of Privilege | Compromised app registration could be modified to add write permissions (e.g., User.ReadWrite.All), enabling an attacker to not just read but modify the client's M365 tenant | Azure AD App Registration (A-003) | L | H | Medium | App registration managed by client or by IntelliSec with client oversight; admin consent required for permission changes; Azure AD audit logs capture permission modifications; break glass detection heuristics | IN PROGRESS |

### Risk Rating Matrix

|                        | **Impact: Low** | **Impact: Medium** | **Impact: High** |
|------------------------|-----------------|--------------------|-------------------|
| **Likelihood: High**   | Medium          | High               | Critical          |
| **Likelihood: Medium** | Low             | Medium             | High              |
| **Likelihood: Low**    | Low             | Low                | Medium            |

---

## 6. Attack Surface Analysis

| Surface Area                          | Exposure Level | Description                                                                        | Hardening Measures                                                                                     |
|---------------------------------------|----------------|------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| DPAPI Credential Store                | Medium         | Encrypted credential files on local disk; decryptable by the Windows user account  | DPAPI encryption with user-scope binding; file system ACLs restricting access to operator account only; no shared accounts |
| Microsoft Graph API Connection        | Medium         | HTTPS connection to cloud API with application-level bearer tokens                 | TLS 1.2+ enforced by Microsoft SDK; OAuth 2.0 client credentials flow; token caching with automatic refresh |
| Exchange Online Connection            | Low            | HTTPS connection using certificate-based authentication                            | Certificate-based auth (no client secret); TLS 1.2+ enforced; ExchangeOnlineManagement module handles auth |
| Azure AD App Registration             | Medium         | Application identity with broad read permissions across client tenant              | Read-only permissions; admin consent required; credential stored in DPAPI-encrypted profile; rotation recommended |
| Local File System (Reports/CSVs)      | High           | Assessment output files containing sensitive security posture data, stored unencrypted | Local-only storage; operator responsible for secure handling; cleanup procedures documented; no network shares |
| SQLite Database                       | Low            | Local database file containing control definitions and assessment logic            | Read-only during assessment; version-controlled definitions; integrity verification recommended |
| Pode Web Dashboard                    | Low            | Local HTTP server for interactive assessment review                                | Bound to localhost (127.0.0.1) only; no external network exposure; no persistent state |
| PowerShell Module Files               | Medium         | Script files containing assessment logic; modifiable by local users                | Script signing recommended (Authenticode); source control for integrity verification; endpoint protection |
| JSONL Log Files                       | Medium         | Structured logs recording assessment actions; could contain sensitive data          | Sensitive field redaction; no credential logging; local-only storage; cleanup with reports |
| Assessment Workstation                | High           | Windows machine running the tool; if compromised, all assets are at risk           | Endpoint protection; Windows updates; user access controls; no shared accounts; EDR recommended |

---

## 7. Mitigations Summary

### 7.1 Implemented Mitigations

| Mitigation ID | Threat(s) Addressed | Mitigation Description | Status |
|---------------|----------------------|------------------------|--------|
| M-001 | T-001, T-003, T-011 | DPAPI encryption for all credential profiles, binding decryption to the specific Windows user account and machine | **IMPLEMENTED** |
| M-002 | T-012 | HTTPS with TLS 1.2+ enforced for all Microsoft API connections (Graph API, Exchange Online, Azure AD) via Microsoft SDKs | **IMPLEMENTED** |
| M-003 | T-002, T-016 | Certificate-based authentication for Exchange Online, eliminating client secret dependency for that service | **IMPLEMENTED** |
| M-004 | T-015 | Exponential backoff and retry logic for Graph API throttling; Microsoft.Graph module handles HTTP 429 responses natively | **IMPLEMENTED** |
| M-005 | T-018 | Application permissions scoped to read-only; no write permissions granted to the app registration | **IMPLEMENTED** |
| M-006 | T-007, T-008 | JSONL structured logging capturing all assessment actions, timestamps, control evaluations, and findings | **IMPLEMENTED** |
| M-007 | T-013 | Pode web dashboard bound to localhost (127.0.0.1) only; no external network interface binding | **IMPLEMENTED** |
| M-008 | T-017 | SQLite database accessed in read-only mode during assessments; PSSQLite manages connection lifecycle | **IMPLEMENTED** |

### 7.2 High Priority -- Recommended (within 30 days)

| Mitigation ID | Threat(s) Addressed | Mitigation Description | Owner | Target Date | Status |
|---------------|----------------------|------------------------|-------|-------------|--------|
| M-009 | T-005, T-019 | Implement PowerShell script signing (Authenticode) for all module files; configure execution policy to AllSigned on assessment workstations | Security Lead | 2026-03-17 | NOT STARTED |
| M-010 | T-009, T-010 | Implement file-level encryption for assessment output files (reports, CSVs) using Windows EFS or a dedicated encryption wrapper | Dev Lead | 2026-03-17 | NOT STARTED |
| M-011 | T-014 | Implement comprehensive log redaction to ensure no sensitive data (tokens, secrets, passwords, tenant-specific security configurations) appears in JSONL logs | Dev Lead | 2026-03-17 | NOT STARTED |
| M-012 | T-001, T-002, T-003 | Document and enforce credential rotation policy: app registration secrets/certificates rotated every 90 days; DPAPI profiles regenerated after any suspected compromise | Security Lead | 2026-03-17 | NOT STARTED |

### 7.3 Medium Priority -- Recommended (within 90 days)

| Mitigation ID | Threat(s) Addressed | Mitigation Description | Owner | Target Date | Status |
|---------------|----------------------|------------------------|-------|-------------|--------|
| M-013 | T-004, T-005 | Implement file integrity monitoring for SQLite database and PowerShell module files; hash verification at tool startup | Dev Lead | 2026-05-16 | NOT STARTED |
| M-014 | T-006 | Generate SHA-256 hash of report files at creation time; store hash in JSONL log for tamper detection | Dev Lead | 2026-05-16 | NOT STARTED |
| M-015 | T-019 | Document assessment workstation hardening requirements: application whitelisting, EDR, PowerShell Constrained Language Mode evaluation | Security Lead | 2026-05-16 | NOT STARTED |
| M-016 | T-020 | Implement automated monitoring of Azure AD App Registration permission changes; alert on any consent grant or permission modification | Dev Lead | 2026-05-16 | NOT STARTED |

### 7.4 Low Priority -- Best Practice (within 6 months)

| Mitigation ID | Threat(s) Addressed | Mitigation Description | Owner | Target Date | Status |
|---------------|----------------------|------------------------|-------|-------------|--------|
| M-017 | T-007, T-008 | Implement centralized log forwarding to a SIEM or log aggregation service for independent audit trail verification | Security Lead | 2026-08-15 | NOT STARTED |
| M-018 | T-009, T-010 | Develop automated output file cleanup utility that securely deletes reports and CSVs after confirmed delivery to client | Dev Lead | 2026-08-15 | NOT STARTED |
| M-019 | T-011 | Evaluate migration from DPAPI to Azure Key Vault or hardware security module (HSM) for credential storage on assessment workstations | Security Lead | 2026-08-15 | NOT STARTED |

---

## 8. Residual Risk Acceptance

Residual risks are those that remain after mitigations have been applied. Each must be formally accepted by an authorized stakeholder.

| Risk ID | Residual Risk Description | Risk Rating | Accepted By | Role | Date | Justification / Rationale |
|---------|---------------------------|-------------|-------------|------|------|---------------------------|
| RR-001 | DPAPI encryption is tied to the Windows user account and machine. If the user profile is compromised (admin password reset, profile backup/restore, offline attack on Windows credentials), stored client credentials can be decrypted. No MFA gate protects tool execution. | High | Pending | CTO | Pending | DPAPI is the strongest available local encryption mechanism without requiring external infrastructure (Key Vault, HSM). The tool is designed for local execution by a single operator. Compensating controls: workstation access policies, no shared accounts, credential rotation policy. Migration to Key Vault-backed storage evaluated as future enhancement (M-019). |
| RR-002 | No MFA enforcement for tool execution. Once a Windows user session is active, the tool can be invoked and credentials decrypted without additional authentication challenge. | Medium | Pending | CTO | Pending | Windows logon (password/biometric/smart card) serves as the authentication gate. Adding MFA to a local PowerShell tool would require external infrastructure. Compensating controls: workstation lock policies, session timeout, DPAPI user binding. |
| RR-003 | Break glass detection for compromised app registrations is heuristic-based (monitoring for unusual API call patterns, permission changes, geographic anomalies) rather than deterministic. A sophisticated attacker could use stolen credentials within normal usage patterns. | Medium | Pending | Security Lead | Pending | Deterministic detection of credential theft is inherently difficult for application credentials. Compensating controls: credential rotation policy (M-012), permission change monitoring (M-016), read-only permissions limit blast radius, Azure AD sign-in logs and audit logs provide forensic trail. |
| RR-004 | Assessment reports and CSV exports are stored unencrypted on the local file system after generation. Until file-level encryption (M-010) is implemented, anyone with access to the file system can read sensitive security posture data. | High | Pending | CTO | Pending | Reports must be readable by the operator for review and client delivery. Full-disk encryption (BitLocker) on assessment workstations provides a layer of at-rest protection. Compensating controls: workstation access controls, output cleanup procedures, operator security awareness training. |
| RR-005 | Azure AD App Registration requires broad read permissions (Directory.Read.All, SecurityEvents.Read.All, Policy.Read.All) to perform comprehensive security assessments. These permissions cannot be further narrowed without losing assessment coverage. | Medium | Pending | Security Lead | Pending | Comprehensive M365 security assessment requires reading security configurations, policies, users, and groups across the tenant. Permissions are scoped to read-only with no write access. Client admin consent is required and can be revoked. App registration access is logged in Azure AD audit logs. |

> **Policy:** Residual risks rated **Critical** or **High** require acceptance by the **CTO**. Medium and Low risks may be accepted by the **Security Lead**.

---

## 9. Review Schedule

| Review Type               | Frequency          | Next Review Date | Responsible Party       |
|---------------------------|--------------------|------------------|-------------------------|
| Full threat model review  | Annually           | 2027-02-15       | Security Lead           |
| Incremental update        | Each major release | After next release| Dev Lead               |
| Post-incident review      | After incidents    | As needed        | IntelliSec Incident Response |
| Risk acceptance re-validation | Quarterly      | 2026-05-15       | Security Lead           |
| App registration permission review | Semi-annually | 2026-08-15  | Security Lead + Client  |

---

## 10. References

| Document                         | Link                                                                    |
|----------------------------------|-------------------------------------------------------------------------|
| Security Review Checklist        | ./security-review-checklist.md                                          |
| Data Classification Policy       | ./data-classification.md                                                |
| Microsoft STRIDE Reference       | https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool |
| DPAPI Documentation              | https://learn.microsoft.com/en-us/windows/win32/seccng/cng-dpapi       |
| Microsoft Graph API Permissions  | https://learn.microsoft.com/en-us/graph/permissions-reference           |
| Exchange Online Certificate Auth | https://learn.microsoft.com/en-us/powershell/exchange/app-only-auth-powershell-v2 |
| OWASP Top 10 2021               | https://owasp.org/Top10/                                                |

---

## Approval

| Name               | Role                  | Signature / Approval | Date         |
|--------------------|-----------------------|----------------------|--------------|
| (Pending)          | Security Lead         |                      |              |
| (Pending)          | Platform Architect    |                      |              |
| (Pending)          | CTO                   |                      |              |
