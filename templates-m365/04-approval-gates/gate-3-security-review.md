# Gate 3 - Security Review

| **Page Title**   | Gate 3 - Security Review - M365 Security Assessment Automation |
|------------------|----------------------------------------------------------------|
| **Last Updated** | 2026-02-15                                                     |
| **Status**       | COMPLETE (Phases 1-2) / IN PROGRESS (Phase 3)                 |
| **Owner**        | Security Lead, IntelliSec Solutions (CloudSecOps)              |
| **Gate Date**    | Phase 1: 2025-07-14 / Phase 2: 2025-10-13 / Phase 3: 2026-01-06 |

---

## 1. Gate Purpose

Gate 3 validates that the M365-SecurityAssessment PowerShell module's security posture is acceptable before it is released for internal distribution. Because this tool assesses the security posture of client M365 tenants, it must itself demonstrate strong security practices -- particularly around API permissions (least privilege), credential handling, sensitive data protection in logs and output, evidence file security, and output directory permissions. Unlike a deployed web application, this PowerShell module runs locally on assessor workstations and interacts with Microsoft Graph API and Exchange Online using App Registration credentials, making credential management and output security the primary review focus areas.

### Timing in Project Lifecycle

```
[Gate 2: ARB] --> [Module Development & Testing] --> ** GATE 3: Security Review ** --> [Gate 4: CAB] --> [Gate 5: Go/No-Go] --> [Internal Release]
```

---

## 2. Entry Criteria

| # | Entry Criterion | Status | Evidence / Link | Owner |
|---|----------------|--------|-----------------|-------|
| 2.1 | Gate 2 (Architecture Review Board) has been passed | COMPLETE (Phases 1-3) | Phase 1 ARB approved 2025-06-23; Phase 2 approved 2025-09-22; Phase 3 approved 2025-12-08 | CTO |
| 2.2 | Code is complete for the module(s) under review | COMPLETE (Phases 1-3) | Phase 1: 39 checks; Phase 2: 18 checks; Phase 3: 30 checks -- all implemented and unit tested | Lead Developer |
| 2.3 | All Pester unit tests pass for the module(s) under review | COMPLETE (Phases 1-3) | Pester test results: Phase 1 (156 tests, 0 failures); Phase 2 (72 tests, 0 failures); Phase 3 (120 tests, 0 failures) | Lead Developer |
| 2.4 | API permissions are documented per module | COMPLETE (Phases 1-3) | Permissions matrix with justification per permission per module; see API Permissions Matrix document | CTO |
| 2.5 | Code review has been completed by at least one reviewer | COMPLETE (Phases 1-3) | All check functions, collector functions, and framework code reviewed via pull requests | Lead Developer |
| 2.6 | Conditions from Gate 2 (if any) are resolved | COMPLETE | All Gate 2 action items completed | Lead Developer |

**Entry Criteria Met:** YES (Phases 1-3)

---

## 3. Security Assessment Summary

### 3.1 Assessment Overview

| Assessment Type | Tool / Method | Date Performed | Performed By | Scope |
|----------------|---------------|----------------|-------------|-------|
| Manual Code Review | Security-focused code review | Per phase gate date | Security Lead | All collector functions, check functions, credential handling, output generation |
| API Permission Audit | Manual Graph API permission review | Per phase gate date | Security Lead | App Registration permissions per module; least-privilege verification |
| Credential Handling Review | Manual review of authentication flows | Per phase gate date | Security Lead | Certificate auth, client secret handling, token storage, session management |
| Output Security Review | Manual review of evidence files and reports | Per phase gate date | Security Lead | JSON evidence files, HTML reports, checkpoint files, log output |
| PSScriptAnalyzer | Static analysis | Per phase gate date | Automated | All .ps1 and .psm1 files scanned for security rules |
| Secret Scanning | Manual + automated pattern matching | Per phase gate date | Security Lead | Regex scan for tokens, keys, passwords, connection strings in source code and output files |

### 3.2 Findings Summary by Severity

| Severity | Total Found | Resolved | Accepted | Open | Target Resolution |
|----------|-------------|----------|----------|------|-------------------|
| **Critical** | 0 | -- | -- | 0 | N/A |
| **High** | 3 | 3 | 0 | 0 | All resolved as of 2025-12-20 |
| **Medium** | 5 | 3 | 1 | 1 | Phase 3 review in progress |
| **Low** | 4 | 2 | 2 | 0 | Accepted with justification |
| **Informational** | 2 | -- | 2 | 0 | Noted for future improvement |

---

## 4. Security Findings Detail

### 4.1 API Permissions (Least Privilege)

| Finding ID | Severity | Finding Description | Module | Status | Remediation | Owner | Date |
|-----------|----------|--------------------|---------|----|-------------|-------|------|
| SR-PERM-001 | High | EntraID module requested Policy.ReadWrite.ConditionalAccess; only read access is needed for assessment | EntraID | RESOLVED | Downgraded to Policy.Read.All; verified all collector functions work with read-only permission | Lead Developer | 2025-07-14 |
| SR-PERM-002 | Medium | EmailProtection module uses Exchange.ManageAsApp which grants broad Exchange admin access | EmailProtection | ACCEPTED | Exchange.ManageAsApp is the only application permission model for Exchange Online; all operations verified as read-only; no write cmdlets invoked; documented as accepted risk with compensating controls | CTO | 2026-01-06 |
| SR-PERM-003 | Low | TeamsSharePoint module requests Sites.Read.All which provides read access to all SharePoint sites; could be scoped with Sites.Selected | TeamsSharePoint | ACCEPTED | Sites.Selected requires per-site consent which is impractical for assessment scenarios; Sites.Read.All is standard for tenant-wide assessment; accepted with documentation | CTO | 2026-01-06 |

### 4.2 Credential Handling

| Finding ID | Severity | Finding Description | Component | Status | Remediation | Owner | Date |
|-----------|----------|--------------------|-----------|----|-------------|-------|------|
| SR-CRED-001 | High | Client secret was stored in module configuration file in plaintext during initial Phase 1 implementation | Framework (Connect-M365Assessment) | RESOLVED | Implemented certificate-based authentication as primary method; client secret method requires SecureString input and is never written to disk; configuration file stores only TenantID, ClientID, and CertificateThumbprint | Lead Developer | 2025-07-21 |
| SR-CRED-002 | High | Access tokens were retained in module-scope variables after assessment completion | Framework (token management) | RESOLVED | Implemented `Disconnect-M365Assessment` function that clears all token variables, disposes MSAL token cache, and disconnects Exchange Online sessions; called automatically in finally block of assessment pipeline | Lead Developer | 2025-07-21 |
| SR-CRED-003 | Medium | Exchange Online session token persisted beyond module scope when assessment was interrupted without graceful shutdown | EmailProtection (session management) | RESOLVED | Added trap handler for Ctrl+C and unhandled exceptions that invokes session cleanup; Exchange Online session now has 15-minute idle timeout configured | Lead Developer | 2026-01-13 |

### 4.3 Sensitive Data in Logs and Output

| Finding ID | Severity | Finding Description | Component | Status | Remediation | Owner | Date |
|-----------|----------|--------------------|-----------|----|-------------|-------|------|
| SR-LOG-001 | Medium | Verbose logging mode included full Graph API response bodies which could contain user PII (email addresses, display names, UPNs) | Framework (logging) | RESOLVED | Verbose mode now redacts PII fields (mail, userPrincipalName, displayName) from log output; full data retained only in evidence JSON files which are controlled output | Lead Developer | 2025-07-28 |
| SR-LOG-002 | Medium | Error messages from Graph API could include access token fragments in the Authorization header | Framework (error handling) | OPEN | Implement regex-based token redaction in all error output paths; currently partially implemented for standard error paths but edge cases remain | Lead Developer | 2026-01-20 |
| SR-LOG-003 | Low | Assessment summary HTML report includes tenant display name and tenant ID in the report header | Report generation | ACCEPTED | Tenant identification in the report is intentional and expected by assessors; reports are saved to the assessor's local machine in a controlled output directory; no sensitive configuration data is included | CTO | 2025-07-14 |

### 4.4 Evidence File Security

| Finding ID | Severity | Finding Description | Component | Status | Remediation | Owner | Date |
|-----------|----------|--------------------|-----------|----|-------------|-------|------|
| SR-EVID-001 | Medium | Output directory is created with default file system permissions; on shared workstations, other users could access assessment evidence | Framework (output directory) | RESOLVED | Output directory now created with restrictive ACL (creator owner only: FullControl); warning displayed if output path is on a network share | Lead Developer | 2025-07-28 |
| SR-EVID-002 | Low | Evidence JSON files contain raw Graph API responses which may include PII (user lists, group memberships) | Collector evidence files | ACCEPTED | Evidence files are a core feature of the assessment tool; assessors need raw data for compliance evidence. Output directory permissions (SR-EVID-001) provide access control. Assessment guidance documentation instructs assessors to handle evidence files according to their organization's data classification policy. | CTO | 2025-07-14 |
| SR-EVID-003 | Informational | Checkpoint files do not contain evidence data but do contain finding IDs and pass/fail results which could reveal assessment scope | Checkpoint system | ACCEPTED | Checkpoint files contain only finding IDs and statuses; no configuration data, API responses, or PII; risk is minimal and outweighed by the operational benefit of resumable assessments | Security Lead | 2025-07-14 |

### 4.5 Output Directory Permissions

| Finding ID | Severity | Finding Description | Component | Status | Remediation | Owner | Date |
|-----------|----------|--------------------|-----------|----|-------------|-------|------|
| SR-DIR-001 | Informational | No integrity protection on output files; a malicious actor with file system access could modify evidence files after assessment | Output directory | ACCEPTED | File integrity verification is out of scope for the PowerShell module; assessors are responsible for evidence chain of custody. Future enhancement: optional file hash manifest generation for evidence integrity verification. | CTO | 2025-07-14 |

---

## 5. Special Focus: App Registration Permissions per Module

### 5.1 Certificate vs. Secret Authentication

| Authentication Method | Recommendation | Status | Justification |
|----------------------|----------------|--------|---------------|
| Certificate-based (X.509) | **RECOMMENDED (Primary)** | Implemented | Certificates cannot be easily exfiltrated from the certificate store; support automated rotation; align with Microsoft best practices for application authentication |
| Client secret | Allowed (Secondary) | Implemented with restrictions | Required for environments where certificate deployment is impractical; secret is accepted only as SecureString input; never stored on disk; session-scoped only |
| Interactive (delegated) | Not supported | N/A | Assessment tool requires application-level permissions for unattended operation; delegated permissions would require user presence and consent per session |

### 5.2 App Registration Configuration per Module

| Module | App Registration Permissions | Admin Consent Required | Certificate Auth Supported | Verified Least Privilege |
|--------|------------------------------|----------------------|---------------------------|-------------------------|
| EntraID | Policy.Read.All, UserAuthenticationMethod.Read.All, User.Read.All, Directory.Read.All, IdentityProvider.Read.All | YES | YES | YES -- all read-only |
| DeviceManagement | DeviceManagementConfiguration.Read.All, DeviceManagementManagedDevices.Read.All | YES | YES | YES -- all read-only |
| EmailProtection | Exchange.ManageAsApp | YES | YES | PARTIAL -- Exchange.ManageAsApp is broad; compensated by read-only cmdlet usage |
| TeamsSharePoint | TeamSettings.Read.All, Sites.Read.All, Channel.ReadBasic.All | YES | YES | YES -- all read-only |
| Phase 4 (definition-only) | None (no runtime API calls) | N/A | N/A | N/A |

### 5.3 Permission Justification Matrix

| Permission | Module(s) | Collector(s) Using It | What It Accesses | Why It Is Needed |
|------------|----------|----------------------|------------------|------------------|
| Policy.Read.All | EntraID | Get-ConditionalAccessPolicies, Get-AuthenticationMethodPolicies | Conditional Access policies, Authentication method policies | Assess CA policy configurations (MFA, device compliance, location-based access) |
| UserAuthenticationMethod.Read.All | EntraID | Get-UserAuthenticationMethods | Per-user authentication method registrations | Assess MFA registration coverage across all users |
| User.Read.All | EntraID, DeviceManagement | Get-EntraIDUsers | User profiles, license assignments, account status | Assess user configuration, identify accounts without MFA, stale accounts |
| Directory.Read.All | EntraID | Get-DirectorySettings, Get-AdminRoles | Directory-wide settings, role assignments | Assess directory security settings, privileged role assignments |
| DeviceManagementConfiguration.Read.All | DeviceManagement | Get-DeviceCompliancePolicies, Get-DeviceConfigurationProfiles | Intune compliance and configuration policies | Assess device management policy coverage and configuration |
| DeviceManagementManagedDevices.Read.All | DeviceManagement | Get-ManagedDevices | Enrolled device inventory | Assess device compliance status and enrollment coverage |
| Exchange.ManageAsApp | EmailProtection | Get-TransportRules, Get-AntiPhishPolicies, Get-AntiSpamPolicies | Exchange Online configuration | Assess email security configurations (transport rules, anti-phishing, anti-spam, anti-malware, Safe Links/Attachments) |
| TeamSettings.Read.All | TeamsSharePoint | Get-TeamsSettings, Get-TeamsMeetingPolicies | Teams tenant and meeting settings | Assess Teams meeting security, guest access, messaging policies |
| Sites.Read.All | TeamsSharePoint | Get-SharePointSettings, Get-SharePointSharingPolicies | SharePoint tenant settings and site configurations | Assess SharePoint sharing settings, external collaboration policies |

---

## 6. Risk Acceptance for Accepted Findings

| Finding ID | Severity | Finding Summary | Business Justification | Compensating Controls | Accepted By | Date | Re-review Date |
|-----------|----------|-----------------|------------------------|-----------------------|-------------|------|----------------|
| SR-PERM-002 | Medium | Exchange.ManageAsApp broad permission | Only application permission model for Exchange Online; no alternative exists | All Exchange cmdlets used are read-only (Get-*); no Set/New/Remove cmdlets invoked; module code reviewed for compliance; PSScriptAnalyzer custom rule prevents write cmdlets | CTO | 2026-01-06 | 2026-07-06 |
| SR-PERM-003 | Low | Sites.Read.All vs. Sites.Selected | Sites.Selected requires per-site admin consent; impractical for tenant-wide assessment | Read-only access; no modification capability; standard permission for SharePoint assessment tools | CTO | 2026-01-06 | 2026-07-06 |
| SR-EVID-002 | Low | Evidence files contain PII | Core feature requirement; evidence is the deliverable of the assessment | Output directory ACLs restrict access to creator; assessment guidance documents data handling requirements | CTO | 2025-07-14 | 2026-01-14 |
| SR-LOG-003 | Low | Report includes tenant name/ID | Intentional identification for assessment reporting | Report stored locally; no network transmission; assessor controls distribution | CTO | 2025-07-14 | 2026-01-14 |
| SR-EVID-003 | Informational | Checkpoint reveals assessment scope | Minimal data exposure; operational benefit outweighs risk | Checkpoint contains only FindingIDs and statuses; no configuration or PII data | Security Lead | 2025-07-14 | N/A |
| SR-DIR-001 | Informational | No output file integrity protection | Out of scope for assessment tool; assessor responsibility | Output directory permissions limit access; future enhancement for hash manifest generation | CTO | 2025-07-14 | N/A |

### Risk Acceptance Policy

| Finding Severity | Approval Authority Required |
|-----------------|----------------------------|
| Critical | **Not permitted** -- must be resolved before any release |
| High | CTO |
| Medium | Security Lead / CTO |
| Low | Security Lead / Lead Developer |
| Informational | Documented; no formal acceptance required |

---

## 7. Exit Criteria

| # | Exit Criterion | Status | Evidence / Link | Owner |
|---|---------------|--------|-----------------|-------|
| 7.1 | Zero open Critical or High severity findings | COMPLETE | 0 Critical, 3 High all resolved | Security Lead |
| 7.2 | All Medium findings resolved or formally accepted | COMPLETE (Phases 1-2) / IN PROGRESS (Phase 3) | 3 resolved, 1 accepted, 1 open (SR-LOG-002 in Phase 3 remediation) | Security Lead |
| 7.3 | API permissions verified as least-privilege per module | COMPLETE | Permission justification matrix reviewed and approved; SR-PERM-001 resolved; SR-PERM-002 and SR-PERM-003 accepted with compensating controls | CTO |
| 7.4 | Credential handling follows security best practices | COMPLETE | Certificate auth primary; secret as SecureString only; tokens cleared on disconnect; Exchange sessions managed with cleanup handlers | Security Lead |
| 7.5 | No sensitive data in logs (tokens, secrets, credentials) | COMPLETE (Phases 1-2) / IN PROGRESS (Phase 3) | Token redaction implemented for standard paths; SR-LOG-002 edge case in remediation | Lead Developer |
| 7.6 | Evidence file security meets acceptable standards | COMPLETE | Output directory ACLs implemented; network share warning added; assessor guidance documented | Security Lead |
| 7.7 | Output directory permissions are restrictive by default | COMPLETE | Creator-owner-only ACL applied to output directories; verified on Windows workstations | Lead Developer |
| 7.8 | PSScriptAnalyzer shows no security-related warnings | COMPLETE | Zero security rule violations across all module files | Lead Developer |
| 7.9 | Risk acceptances are formally documented and signed | COMPLETE | 6 findings formally accepted with justification, compensating controls, and re-review dates | CTO |

---

## 8. Gate Decision

### Phase 1 (EntraID)

| Field | Value |
|-------|-------|
| **Decision** | APPROVED |
| **Decision Date** | 2025-07-14 |
| **Decision Rationale** | Security review identified 8 findings (0 Critical, 2 High, 2 Medium, 2 Low, 2 Informational). Both High findings (SR-CRED-001 credential storage, SR-CRED-002 token retention) resolved within remediation window. Certificate-based authentication is strong. Output directory permissions are appropriate. Module is approved for internal distribution. |
| **Next Gate Target** | Gate 4 - CAB: 2025-07-21 |

### Phase 2 (DeviceManagement)

| Field | Value |
|-------|-------|
| **Decision** | APPROVED |
| **Decision Date** | 2025-10-13 |
| **Decision Rationale** | DeviceManagement module follows established security patterns from Phase 1. No new High or Critical findings. Permissions are appropriately scoped to read-only device management endpoints. Module is approved for internal distribution. |
| **Next Gate Target** | Gate 4 - CAB: 2025-10-20 |

### Phase 3 (EmailProtection + TeamsSharePoint)

| Field | Value |
|-------|-------|
| **Decision** | APPROVED WITH CONDITIONS |
| **Decision Date** | 2026-01-06 |
| **Decision Rationale** | Security review identified Exchange.ManageAsApp broad permission (accepted with compensating controls) and one remaining open finding (SR-LOG-002 token redaction edge case). SR-PERM-001 (over-privileged permission) was resolved during Phase 1. Exchange Online session management is now properly handled with cleanup on interruption. Approved with condition that SR-LOG-002 is resolved before final v1.0.0 release. |
| **Condition** | SR-LOG-002 (token fragment redaction in error output) must be resolved by 2026-01-20 |
| **Next Gate Target** | Gate 4 - CAB: 2026-01-13 |

---

## 9. Security Team Sign-Off

### Phase 1 (2025-07-14)

| Name | Role | Decision | Date |
|------|------|----------|------|
| (Security Lead) | Security Lead | Approve | 2025-07-14 |
| (CTO) | CTO / Acting Security Director | Approve | 2025-07-14 |
| (Lead Developer) | Technical Lead | Approve | 2025-07-14 |

### Phase 2 (2025-10-13)

| Name | Role | Decision | Date |
|------|------|----------|------|
| (Security Lead) | Security Lead | Approve | 2025-10-13 |
| (CTO) | CTO / Acting Security Director | Approve | 2025-10-13 |
| (Lead Developer) | Technical Lead | Approve | 2025-10-13 |

### Phase 3 (2026-01-06)

| Name | Role | Decision | Date |
|------|------|----------|------|
| (Security Lead) | Security Lead | Approve with Conditions | 2026-01-06 |
| (CTO) | CTO / Acting Security Director | Approve with Conditions | 2026-01-06 |
| (Lead Developer) | Technical Lead | Approve with Conditions | 2026-01-06 |

### Positive Observations

The security review noted the following positive security implementations:

1. **Certificate-based authentication** as the primary authentication method, avoiding client secret storage on disk
2. **SecureString enforcement** for client secret input when certificate auth is not available
3. **Token cleanup on disconnect** via `Disconnect-M365Assessment` with automatic invocation in finally blocks
4. **Collector/check isolation** preventing check functions from making direct API calls with elevated permissions
5. **Output directory ACLs** restricting evidence file access to the creator/owner
6. **PII redaction in verbose logs** while preserving full data in controlled evidence files
7. **Exchange Online session management** with trap handlers for graceful cleanup on interruption
8. **PSScriptAnalyzer integration** enforcing security rules across all module code

---

## 10. References

| Document | Link |
|----------|------|
| Gate 2 - Architecture Review Board | gate-2-architecture-review-board.md |
| API Permissions Matrix | ../03-security/api-permissions-matrix.md |
| Credential Handling Guide | ../03-security/credential-handling-guide.md |
| Evidence File Security | ../03-security/data-classification.md |
| PSScriptAnalyzer Rules | ../06-testing/security-testing.md |
| Microsoft Graph API Permissions Reference | https://learn.microsoft.com/en-us/graph/permissions-reference |
| Exchange Online App-Only Authentication | https://learn.microsoft.com/en-us/powershell/exchange/app-only-auth-powershell-v2 |
| Gate 4 - Change Advisory Board | gate-4-change-advisory-board.md |
