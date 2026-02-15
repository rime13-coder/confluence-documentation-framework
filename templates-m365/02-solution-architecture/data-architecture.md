# Data Architecture

| **Metadata**     | **Value**                                      |
|------------------|------------------------------------------------|
| Page Title       | M365-SecurityAssessment - Data Architecture    |
| Last Updated     | 2026-02-15                                     |
| Status           | `CURRENT`                                      |
| Owner            | Module Author                                  |
| Reviewers        | Security Consultant Lead, Engineering Manager  |
| Version          | 1.0                                            |
| Related HLD      | M365-SecurityAssessment - Architecture Overview (HLD) |

---

## 1. Document Purpose

This document defines the data architecture for the **M365-SecurityAssessment** PowerShell module (v1.0.0). It covers all data stores (SQLite database, JSON configuration files, assessment output files, credential storage), data flows from M365 APIs through the assessment pipeline to reports and evidence, data retention considerations, and JSON schema examples for key data structures.

---

## 2. Data Stores Inventory

| Store Name | Type | Technology | Location | Purpose | Data Classification | Retention |
|-----------|------|-----------|----------|---------|---------------------|-----------|
| controls.db | Relational (embedded) | SQLite via PSSQLite | `{ModuleRoot}\data\controls.db` | Controls management: 108 finding definitions, assessment metadata, control mappings, assessment history | Internal (finding definitions are non-sensitive; assessment history may reference tenant identifiers) | Lifetime of module installation; backed up with module |
| findings.json | Configuration (JSON) | PowerShell ConvertFrom-Json | `{ModuleRoot}\config\findings.json` | 108 finding definitions: FindingId, Name, Severity, Category, Description, Recommendation templates | Internal (reference data; no tenant-specific information) | Version-controlled with module source |
| assessment-defaults.json | Configuration (JSON) | PowerShell ConvertFrom-Json | `{ModuleRoot}\config\assessment-defaults.json` | Global assessment parameters: retry settings, pagination, break glass keywords, severity colors, Graph API settings | Internal (configuration parameters; no secrets) | Version-controlled with module source |
| logic-definitions.json | Configuration (JSON) | PowerShell ConvertFrom-Json | `{ModuleRoot}\config\logic-definitions.json` | Check evaluation parameters: thresholds, expected values, pattern matches per finding | Internal (evaluation logic; no tenant-specific information) | Version-controlled with module source |
| module.json (per module) | Configuration (JSON) | PowerShell ConvertFrom-Json | `{ModuleRoot}\Modules\{ModuleName}\module.json` | Per-module manifest: collector declarations, check declarations, required permissions, metadata | Internal (module structure metadata) | Version-controlled with module source |
| Credential Profiles | Encrypted binary + JSON metadata | Windows DPAPI + JSON | `%APPDATA%\M365-SecurityAssessment\credentials\` | DPAPI-encrypted tenant credentials (App ID, tenant ID, certificate thumbprint or client secret) | Restricted (contains authentication secrets encrypted at rest) | Until manually deleted by user; survives module updates |
| Assessment Output | Mixed (JSON, JSONL, CSV, HTML, PDF, DOCX, XLSX) | Various | `{UserSpecifiedPath}\{TenantName}-{Date}\` | Complete assessment results: findings, evidence, reports, logs, checkpoints | Confidential (contains tenant security configuration details, vulnerability findings, remediation recommendations) | Managed by security consultant; typically retained per engagement policy |

---

## 3. Assessment Output Directory Structure

```
{OutputPath}\{TenantName}-{YYYY-MM-DD}\
  |
  +-- assessment.json                    # Assessment metadata and summary
  +-- findings.json                      # Complete findings array (all findings from all modules)
  +-- checkpoint.json                    # Checkpoint file (deleted on successful completion)
  |
  +-- logs\
  |     +-- assessment-{timestamp}.jsonl # Structured JSONL log file for the assessment run
  |
  +-- evidence\
  |     +-- ENTRA-001-affected-users.csv         # Evidence CSV: users without MFA
  |     +-- ENTRA-010-ca-policies.csv            # Evidence CSV: conditional access policy details
  |     +-- ENTRA-020-privileged-roles.csv       # Evidence CSV: privileged role assignments
  |     +-- DEVICE-001-noncompliant-devices.csv  # Evidence CSV: non-compliant devices
  |     +-- EMAIL-001-dkim-status.csv            # Evidence CSV: DKIM configuration per domain
  |     +-- TEAMS-001-meeting-policies.csv       # Evidence CSV: Teams meeting policy settings
  |     +-- ... (one CSV per finding with affected resources)
  |
  +-- reports\
  |     +-- assessment-{timestamp}.html          # HTML report (self-contained single file)
  |     +-- assessment-{timestamp}.pdf           # PDF report (generated from HTML via Edge headless)
  |     +-- assessment-{timestamp}.docx          # Word document report
  |     +-- assessment-{timestamp}.xlsx          # Excel workbook with multiple worksheets
  |
  +-- raw\
        +-- ConditionalAccessPolicies.json       # Raw collector output (optional, if configured)
        +-- EntraUsers.json                      # Raw collector output
        +-- ... (one JSON file per collector, for audit trail)
```

---

## 4. Data Flow Diagram

### 4.1 End-to-End Data Flow

```
[M365 Cloud Services]                    [Local Workstation]
  |                                         |
  | (1) Graph API REST calls                |
  |     Exchange Online PS cmdlets          |
  |     Teams PS cmdlets                    |
  |                                         |
  v                                         v
[API Responses]  -------(2)------->  [Collectors]
  (JSON objects,                      (Parse, normalize,
   PS objects)                         log item counts)
                                         |
                                    (3)  v
                               [CollectedData Cache]
                               ($hashtable in memory)
                                         |
                                    (4)  v
                                   [Checks]
                                   (Evaluate against
                                    logic-definitions.json,
                                    emit findings)
                                         |
                                    (5)  v
                               [Findings Array]
                               (@() in memory)
                                   /    |    \
                             (6a) /  (6b)|  (6c)\
                                 v       v       v
                           [Evidence]  [Reports]  [assessment.json]
                           (CSV files) (HTML/PDF/  (Summary metadata)
                                       DOCX/XLSX)
                                         |
                                    (7)  v
                               [ControlsDB]
                               (AssessmentHistory
                                record in SQLite)
```

### 4.2 Data Flow Steps

| # | Source | Destination | Data Description | Flow Type | Volume |
|---|--------|-------------|-----------------|-----------|--------|
| 1 | M365 Cloud Services | Collectors (via API clients) | Raw configuration data: CA policies, users, role assignments, devices, email policies, Teams policies, SharePoint sites | Synchronous HTTPS | Varies: 10-50,000 objects per collector depending on tenant size |
| 2 | Collectors | CollectedData Cache | Normalized PowerShell objects (arrays of PSCustomObject or API response objects) | In-memory write | Same as step 1; stored as hashtable values |
| 3 | CollectedData Cache | Checks | Read-only reference to cached collector data | In-memory read | Same data, read multiple times by different checks |
| 4 | Checks | Findings Array | Standardized finding objects (New-M365Finding output) | In-memory append | 108 maximum (one per finding definition); typically 40-80 findings per assessment |
| 5a | Findings Array | Evidence CSV files | Per-finding affected resource lists and evidence details | File write | One CSV per finding with status Fail or Warning; 20-60 CSV files typical |
| 5b | Findings Array | Report Generator | Complete findings array for report rendering | In-memory read | Full array passed to each report format generator |
| 5c | Findings Array | assessment.json | Assessment summary with finding counts by severity and module | File write | Single JSON file, typically 5-20 KB |
| 6 | Assessment metadata | ControlsDB (SQLite) | AssessmentHistory record: assessment ID, tenant ID, timestamps, scope, summary | SQLite INSERT | Single row per assessment |

---

## 5. Configuration File Schemas

### 5.1 findings.json Schema (108 Finding Definitions)

```json
[
  {
    "FindingId": "ENTRA-001",
    "Name": "MFA Not Enforced for All Users",
    "Category": "EntraID",
    "SubCategory": "ConditionalAccess",
    "Severity": "Critical",
    "Description": "Multi-factor authentication (MFA) is not enforced for all users via conditional access policies. Without MFA, user accounts are vulnerable to credential-based attacks including phishing, password spray, and brute force.",
    "Recommendation": "Create a conditional access policy that requires MFA for all users. At minimum, enforce MFA for: (1) all administrators, (2) all users accessing cloud apps, (3) Azure management. Exclude only validated break glass accounts.",
    "Impact": "Credential compromise leading to unauthorized access to M365 resources, data exfiltration, and lateral movement within the tenant.",
    "References": [
      {
        "framework": "CIS Microsoft 365 Benchmark",
        "control": "5.2.2.1",
        "title": "Ensure multifactor authentication is enabled for all users"
      },
      {
        "framework": "NIST SP 800-53",
        "control": "IA-2(1)",
        "title": "Multi-factor Authentication to Privileged Accounts"
      }
    ],
    "DefaultStatus": "Active",
    "Version": "1.0.0"
  },
  {
    "FindingId": "ENTRA-002",
    "Name": "Break Glass Accounts Not Excluded from MFA Policies",
    "Category": "EntraID",
    "SubCategory": "ConditionalAccess",
    "Severity": "Medium",
    "Description": "Emergency access (break glass) accounts are not properly excluded from conditional access policies. These accounts should be excluded from MFA requirements to ensure emergency access when MFA systems fail.",
    "Recommendation": "Identify break glass accounts and add them as exclusions to MFA-enforcing conditional access policies. Monitor break glass account usage with alerts.",
    "Impact": "Loss of emergency access to the M365 tenant if MFA systems experience an outage.",
    "References": [
      {
        "framework": "Microsoft Best Practice",
        "control": "N/A",
        "title": "Manage emergency access accounts in Azure AD"
      }
    ],
    "DefaultStatus": "Active",
    "Version": "1.0.0"
  },
  {
    "FindingId": "EMAIL-001",
    "Name": "DKIM Signing Not Enabled for All Domains",
    "Category": "EmailProtection",
    "SubCategory": "DKIM",
    "Severity": "High",
    "Description": "DomainKeys Identified Mail (DKIM) signing is not enabled for one or more accepted domains. DKIM provides email authentication that helps prevent spoofing and ensures message integrity.",
    "Recommendation": "Enable DKIM signing for all accepted domains in Exchange Online. Configure DKIM CNAME records in DNS for each domain. Verify DKIM is active using Get-DkimSigningConfig.",
    "Impact": "Email spoofing of the organization's domains; recipient mail systems may mark legitimate emails as spam or reject them.",
    "References": [
      {
        "framework": "CIS Microsoft 365 Benchmark",
        "control": "2.1.9",
        "title": "Ensure DKIM is enabled for all Exchange Online domains"
      }
    ],
    "DefaultStatus": "Active",
    "Version": "1.0.0"
  }
]
```

**Note:** The complete findings.json contains 108 entries across all four assessment categories: EntraID (30+), DeviceManagement (20+), EmailProtection (30+), TeamsSharePoint (20+). The above shows representative examples.

### 5.2 logic-definitions.json Schema

```json
{
  "ENTRA-001": {
    "evaluationType": "policy_coverage",
    "conditions": {
      "requiredGrantControl": "mfa",
      "requiredPolicyState": "enabled",
      "minimumCoverage": "allUsers",
      "excludeBreakGlass": true,
      "breakGlassIdentification": {
        "method": "keyword_match",
        "keywords": ["break glass", "emergency", "BreakGlass"],
        "matchFields": ["displayName", "userPrincipalName"]
      }
    },
    "passCondition": "At least one enabled CA policy requires MFA for all users (excluding break glass accounts)",
    "failCondition": "No enabled CA policy requires MFA for all users"
  },
  "EMAIL-001": {
    "evaluationType": "per_domain_check",
    "conditions": {
      "requiredProperty": "Enabled",
      "expectedValue": true,
      "checkAllDomains": true
    },
    "passCondition": "DKIM signing is enabled for all accepted domains",
    "failCondition": "One or more accepted domains do not have DKIM signing enabled"
  },
  "DEVICE-001": {
    "evaluationType": "compliance_ratio",
    "conditions": {
      "complianceProperty": "complianceState",
      "compliantValue": "compliant",
      "minimumCompliancePercent": 95,
      "excludeStaleDevices": true,
      "staleDeviceThresholdDays": 90
    },
    "passCondition": "95% or more of active managed devices are compliant",
    "failCondition": "Less than 95% of active managed devices are compliant"
  }
}
```

### 5.3 assessment-defaults.json Schema

```json
{
  "graphApi": {
    "defaultVersion": "v1.0",
    "betaEndpoints": [
      "/deviceManagement/intents",
      "/deviceManagement/configurationPolicies",
      "/deviceManagement/windowsProtectionState"
    ],
    "pageSize": 999,
    "retryCount": 3,
    "retryDelaySeconds": 2,
    "retryBackoffMultiplier": 2,
    "requestTimeoutSeconds": 30
  },
  "assessment": {
    "checkpointIntervalMinutes": 5,
    "defaultScope": ["EntraID", "DeviceManagement", "EmailProtection", "TeamsSharePoint"],
    "outputFormats": ["HTML", "PDF", "Excel"],
    "includeRawData": false,
    "evidenceExport": true
  },
  "breakGlass": {
    "keywords": ["break glass", "emergency", "BreakGlass", "EmergencyAccess"],
    "matchFields": ["displayName", "userPrincipalName", "mailNickname"]
  },
  "severity": {
    "colors": {
      "Critical": "#DC3545",
      "High": "#FD7E14",
      "Medium": "#FFC107",
      "Low": "#17A2B8",
      "Informational": "#6C757D"
    },
    "weights": {
      "Critical": 5,
      "High": 4,
      "Medium": 3,
      "Low": 2,
      "Informational": 1
    }
  },
  "dashboard": {
    "port": 8080,
    "hostname": "localhost",
    "autoOpen": true
  },
  "logging": {
    "defaultLevel": "INFO",
    "consoleOutput": true,
    "fileOutput": true,
    "truncateApiResponses": true,
    "maxApiResponseLogLength": 1000
  }
}
```

---

## 6. Credential Storage Architecture

### 6.1 Credential Store Layout

```
%APPDATA%\M365-SecurityAssessment\
  credentials\
    ContosoTenant.cred              # DPAPI-encrypted credential blob
    ContosoTenant.meta.json         # Unencrypted metadata
    FabrikamTest.cred               # Another tenant profile
    FabrikamTest.meta.json
  settings\
    user-preferences.json           # User-level preferences (default profile, output path, etc.)
```

### 6.2 DPAPI Security Properties

| Property | Value |
|----------|-------|
| Protection Scope | `DataProtectionScope.CurrentUser` -- only the Windows user who encrypted the credential can decrypt it |
| Encryption Algorithm | Windows DPAPI (internally uses AES-256 with a key derived from the user's Windows credentials) |
| Key Management | Fully managed by Windows; no explicit key storage or rotation by the module |
| Portability | Credentials are NOT portable between machines or user accounts; re-creation required on a new workstation |
| Backup | The .cred files are meaningless without the original Windows user profile; standard file backup is safe (encrypted at rest) |
| Attack Surface | An attacker with access to the Windows user session (logged in or compromised credentials) can decrypt the credentials |

### 6.3 Credential Data Classification

| Data Element | Stored In | Encrypted | Classification |
|-------------|-----------|-----------|----------------|
| Tenant ID (GUID) | meta.json (plaintext) | No (non-sensitive identifier) | Internal |
| Client/App ID (GUID) | meta.json (plaintext) | No (non-sensitive identifier) | Internal |
| Authentication Method | meta.json (plaintext) | No (non-sensitive metadata) | Internal |
| Certificate Thumbprint | meta.json (plaintext) | No (identifies certificate but does not contain private key) | Internal |
| Client Secret | .cred (DPAPI encrypted) | Yes (DPAPI) | Restricted |
| Certificate Private Key Reference | .cred (DPAPI encrypted) | Yes (DPAPI) | Restricted |
| Profile Name | Filename | No | Internal |
| Created/Last Used Timestamps | meta.json (plaintext) | No | Internal |

---

## 7. Assessment Output Data Model

### 7.1 assessment.json Schema

```json
{
  "assessmentId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "moduleVersion": "1.0.0",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantDisplayName": "Contoso Corporation",
  "assessedBy": "security-consultant@partner.com",
  "startedAt": "2026-02-15T14:00:00Z",
  "completedAt": "2026-02-15T14:47:23Z",
  "durationMinutes": 47.4,
  "scope": ["EntraID", "DeviceManagement", "EmailProtection", "TeamsSharePoint"],
  "status": "Completed",
  "summary": {
    "totalFindings": 108,
    "bySeverity": {
      "Critical": 4,
      "High": 12,
      "Medium": 23,
      "Low": 18,
      "Informational": 8
    },
    "byStatus": {
      "Pass": 43,
      "Fail": 38,
      "Warning": 12,
      "Informational": 8,
      "Unable to Assess": 7
    },
    "byModule": {
      "EntraID": { "total": 32, "pass": 14, "fail": 12, "warning": 4, "informational": 1, "unableToAssess": 1 },
      "DeviceManagement": { "total": 22, "pass": 10, "fail": 7, "warning": 3, "informational": 1, "unableToAssess": 1 },
      "EmailProtection": { "total": 30, "pass": 12, "fail": 11, "warning": 3, "informational": 3, "unableToAssess": 1 },
      "TeamsSharePoint": { "total": 24, "pass": 7, "fail": 8, "warning": 2, "informational": 3, "unableToAssess": 4 }
    },
    "riskScore": 72,
    "maxRiskScore": 100
  },
  "environment": {
    "powershellVersion": "7.4.1",
    "operatingSystem": "Microsoft Windows 11 Enterprise 10.0.26200",
    "graphModuleVersion": "2.15.0",
    "exchangeModuleVersion": "3.4.0",
    "teamsModuleVersion": "6.0.0"
  },
  "outputFiles": {
    "findings": "findings.json",
    "log": "logs/assessment-20260215-140000.jsonl",
    "reports": [
      "reports/assessment-20260215-140000.html",
      "reports/assessment-20260215-140000.pdf",
      "reports/assessment-20260215-140000.xlsx"
    ],
    "evidenceDirectory": "evidence/"
  }
}
```

### 7.2 Evidence CSV Structure (per finding)

**Example: ENTRA-001-affected-users.csv**

```csv
FindingId,FindingName,Severity,ResourceType,ResourceId,ResourceName,Detail,CollectedAt
ENTRA-001,MFA Not Enforced for All Users,Critical,User,user1@contoso.com,Jane Smith,No MFA-enforcing CA policy applies to this user,2026-02-15T14:12:34Z
ENTRA-001,MFA Not Enforced for All Users,Critical,User,user2@contoso.com,John Doe,No MFA-enforcing CA policy applies to this user,2026-02-15T14:12:34Z
ENTRA-001,MFA Not Enforced for All Users,Critical,User,admin@contoso.com,Admin Account,No MFA-enforcing CA policy applies to this user,2026-02-15T14:12:34Z
```

**Example: EMAIL-001-dkim-status.csv**

```csv
FindingId,FindingName,Severity,ResourceType,ResourceId,ResourceName,Detail,CollectedAt
EMAIL-001,DKIM Signing Not Enabled,High,Domain,contoso.com,contoso.com,DKIM signing enabled: True,2026-02-15T14:25:00Z
EMAIL-001,DKIM Signing Not Enabled,High,Domain,fabrikam.com,fabrikam.com,DKIM signing enabled: False,2026-02-15T14:25:00Z
EMAIL-001,DKIM Signing Not Enabled,High,Domain,subsidiary.contoso.com,subsidiary.contoso.com,DKIM signing enabled: False,2026-02-15T14:25:00Z
```

---

## 8. Data Retention and Output Management

### 8.1 Retention Guidelines

| Data Category | Default Retention | Location | Deletion Method | Notes |
|--------------|-------------------|----------|-----------------|-------|
| Assessment Output (reports, evidence, findings) | Managed by consultant per engagement policy; typically 1-3 years | User-specified output directory | Manual deletion or engagement archival process | Output directory is fully self-contained; can be archived as a zip file |
| Assessment Logs (JSONL) | Same as assessment output | Within assessment output directory | Deleted with assessment output | Logs may contain API error details; no credentials logged |
| Credential Profiles | Until manually deleted by user | %APPDATA%\M365-SecurityAssessment\credentials\ | Remove-M365Credential cmdlet or manual file deletion | Credentials persist across module updates; user-managed lifecycle |
| Controls Database (controls.db) | Lifetime of module installation | Module installation directory | Deleted with module uninstallation | Finding definitions are recreated from findings.json on Initialize-M365ControlsDB |
| Assessment History (in controls.db) | Lifetime of module installation | Within controls.db SQLite database | Accumulates across assessments; no automatic purge | Contains assessment summaries (not full findings); useful for trend analysis via Compare-M365Assessments |
| Checkpoint Files (checkpoint.json) | Deleted on successful assessment completion | Within assessment output directory | Auto-deleted on completion; persists on interruption for resume | Only exists while an assessment is in progress or was interrupted |
| Raw Collector Output (optional) | Same as assessment output | Within assessment output `raw/` directory | Deleted with assessment output | Only generated if `includeRawData: true` in configuration; can be large for big tenants |

### 8.2 Data Sensitivity Considerations

| Concern | Mitigation |
|---------|------------|
| Assessment findings reveal tenant security weaknesses | Output directory should be access-restricted; reports should be treated as Confidential; encrypt at rest if stored on shared drives |
| Evidence CSVs contain user email addresses and resource identifiers | PII is limited to userPrincipalName and displayName; necessary for actionable remediation; classify as Confidential |
| Raw collector output contains full API responses | May include extensive tenant configuration details; disabled by default (`includeRawData: false`); enable only when full audit trail is required |
| JSONL logs may contain API endpoint URLs with tenant identifiers | Non-sensitive (tenant ID is a GUID); API responses are truncated in logs; no credentials logged |
| Credential profiles contain encrypted secrets | DPAPI encryption protects at rest; user session compromise is the remaining risk; credentials are user-scoped and machine-specific |
| Assessment history in controls.db accumulates tenant identifiers | SQLite database is in the module installation directory; accessible only to the module user; does not contain detailed findings or evidence |

---

## 9. Data Flow from M365 APIs to Reports

### 9.1 Collector-to-Report Traceability Matrix

| Collector | API Source | Data Collected | Used By Checks | Produces Findings | Evidence CSV |
|-----------|-----------|---------------|---------------|-------------------|-------------|
| Get-ConditionalAccessPolicies | Graph v1.0: /identity/conditionalAccess/policies | All CA policies with conditions, grant controls, session controls | Invoke-MfaChecks, Invoke-ConditionalAccessChecks, Invoke-PrivilegedAccessChecks, Invoke-GuestAccessChecks | ENTRA-001 through ENTRA-015 | ENTRA-0xx-ca-policies.csv |
| Get-EntraUsers | Graph v1.0: /users | All user accounts with sign-in activity, MFA registration | Invoke-MfaChecks, Invoke-PrivilegedAccessChecks, Invoke-GuestAccessChecks | ENTRA-001, ENTRA-020 through ENTRA-031 | ENTRA-0xx-affected-users.csv |
| Get-DirectoryRoleAssignments | Graph v1.0: /roleManagement/directory/roleAssignments | All directory role assignments (Global Admin, Exchange Admin, etc.) | Invoke-PrivilegedAccessChecks | ENTRA-020 through ENTRA-022 | ENTRA-020-privileged-roles.csv |
| Get-SecurityAlerts | Graph v1.0: /security/alerts | Active security alerts from Microsoft 365 | Invoke-SecurityAlertChecks | ENTRA-040, ENTRA-041 | ENTRA-040-security-alerts.csv |
| Get-ManagedDevices | Graph v1.0: /deviceManagement/managedDevices | All Intune-managed devices with compliance state | Invoke-DeviceComplianceChecks | DEVICE-001 through DEVICE-005 | DEVICE-0xx-devices.csv |
| Get-SecurityBaselines | Graph beta: /deviceManagement/intents | Intune security baseline assignments and compliance | Invoke-SecurityBaselineChecks | DEVICE-010 through DEVICE-015 | DEVICE-01x-baselines.csv |
| Get-WindowsProtectionState | Graph beta: /deviceManagement/windowsProtectionState | Windows Defender status per device | Invoke-EndpointProtectionChecks | DEVICE-020 through DEVICE-025 | DEVICE-02x-protection.csv |
| Get-DkimConfiguration | EXO PS: Get-DkimSigningConfig | DKIM signing status per accepted domain | Invoke-DkimChecks | EMAIL-001 | EMAIL-001-dkim-status.csv |
| Get-AntiSpamPolicies | EXO PS: Get-HostedContentFilterPolicy | Spam filter policy configurations | Invoke-AntiSpamChecks | EMAIL-010 through EMAIL-015 | EMAIL-01x-antispam.csv |
| Get-AntiPhishPolicies | EXO PS: Get-AntiPhishPolicy | Anti-phishing policy configurations | Invoke-AntiPhishChecks | EMAIL-020 through EMAIL-025 | EMAIL-02x-antiphish.csv |
| Get-SafeLinksPolicies | EXO PS: Get-SafeLinksPolicy | Safe Links policy configurations | Invoke-SafeLinksChecks | EMAIL-030, EMAIL-031 | EMAIL-03x-safelinks.csv |
| Get-SafeAttachmentPolicies | EXO PS: Get-SafeAttachmentPolicy | Safe Attachment policy configurations | Invoke-SafeAttachmentChecks | EMAIL-035, EMAIL-036 | EMAIL-03x-safeattach.csv |
| Get-TransportRules | EXO PS: Get-TransportRule | Mail flow / transport rule configurations | Invoke-TransportRuleChecks | EMAIL-040 through EMAIL-045 | EMAIL-04x-transport.csv |
| Get-TeamsMeetingPolicies | Teams PS: Get-CsTeamsMeetingPolicy | Teams meeting policy settings | Invoke-TeamsMeetingChecks | TEAMS-001 through TEAMS-005 | TEAMS-00x-meeting.csv |
| Get-TeamsMessagingPolicies | Teams PS: Get-CsTeamsMessagingPolicy | Teams messaging policy settings | Invoke-TeamsMessagingChecks | TEAMS-010 through TEAMS-013 | TEAMS-01x-messaging.csv |
| Get-TeamsExternalAccess | Teams PS: Get-CsExternalAccessPolicy | External/federation access configuration | Invoke-TeamsExternalAccessChecks | TEAMS-020, TEAMS-021 | TEAMS-02x-external.csv |
| Get-TeamsAppPermissions | Teams PS: Get-CsTeamsAppPermissionPolicy | Third-party app permission policies | Invoke-TeamsAppChecks | TEAMS-030, TEAMS-031 | TEAMS-03x-apps.csv |
| Get-SharePointSites | Graph v1.0: /sites | SharePoint site configurations and sharing settings | Invoke-SharePointSharingChecks | SP-001 through SP-005 | SP-00x-sites.csv |

---

## 10. SQLite Database Operations

### 10.1 Database Initialization

```powershell
# Initialize-M365ControlsDB:
# 1. Create controls.db if it does not exist
# 2. Execute CREATE TABLE IF NOT EXISTS for Controls and AssessmentHistory tables
# 3. Load findings.json (108 definitions)
# 4. UPSERT each finding definition into Controls table (INSERT OR REPLACE ON FindingId)
# 5. Log initialization summary: "Initialized controls database with 108 finding definitions"
```

### 10.2 Key Database Queries

| Operation | SQL | Used By |
|-----------|-----|---------|
| Get all controls by module | `SELECT * FROM Controls WHERE Type = @Type AND Status = 'Active' ORDER BY Severity DESC, FindingId ASC` | ModuleLoader (to determine which findings a module can produce) |
| Get control by FindingId | `SELECT * FROM Controls WHERE FindingId = @FindingId` | New-M365Finding (to populate finding metadata from definition) |
| Record assessment start | `INSERT INTO AssessmentHistory (AssessmentId, TenantId, StartedAt, Status, Scope) VALUES (@Id, @TenantId, @StartedAt, 'Running', @Scope)` | Orchestrator Stage 1 |
| Update assessment completion | `UPDATE AssessmentHistory SET CompletedAt = @CompletedAt, Status = 'Completed', FindingsSummary = @Summary, OutputPath = @Path WHERE AssessmentId = @Id` | Orchestrator Stage 7 |
| Query assessment history | `SELECT * FROM AssessmentHistory WHERE TenantId = @TenantId ORDER BY StartedAt DESC LIMIT @Limit` | Get-M365AssessmentHistory |
| Compare assessments | `SELECT ah1.FindingsSummary as Previous, ah2.FindingsSummary as Current FROM AssessmentHistory ah1, AssessmentHistory ah2 WHERE ah1.AssessmentId = @PreviousId AND ah2.AssessmentId = @CurrentId` | Compare-M365Assessments |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | Module Author | Initial release aligned with M365-SecurityAssessment v1.0.0 |
