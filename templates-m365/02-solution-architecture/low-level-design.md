# Low-Level Design (LLD)

| **Metadata**     | **Value**                                      |
|------------------|------------------------------------------------|
| Page Title       | M365-SecurityAssessment - Low-Level Design (LLD) |
| Last Updated     | 2026-02-15                                     |
| Status           | `CURRENT`                                      |
| Owner            | Module Author                                  |
| Reviewers        | Security Consultant Lead, Engineering Manager  |
| Version          | 1.0                                            |
| Related HLD      | M365-SecurityAssessment - Architecture Overview (HLD) |

---

## 1. Document Purpose

This document provides the detailed low-level design for the **M365-SecurityAssessment** PowerShell module (v1.0.0). It describes the internal structure of each engine component, the assessment module anatomy, data flow through the pipeline, the finding object model, report generation mechanics, dashboard architecture, SQLite schema, and the checkpoint/resume mechanism. This document is intended for developers extending the module and security consultants seeking to understand the internal operation.

---

## 2. Component Diagram (C4 Level 3)

<!-- Diagram: 03-engine-components.png -- embedded on Confluence page as attachment -->
<!--
    C4 Level 3 - Component Diagram
    Engine internals:
    - Auth.ps1 (credential management, DPAPI, service connections)
    - Config.ps1 (JSON configuration loading, parameter merging)
    - Logger.ps1 (JSONL structured logging, console output)
    - Orchestrator.ps1 (pipeline execution, checkpoint management)
    - ControlsDB.ps1 (SQLite CRUD, finding definition queries)
    - FindingTypes.ps1 (finding object constructors, severity enums)
    - ModuleLoader.ps1 (module discovery, dependency ordering, loading)

    Assessment module internals:
    - module.json (manifest)
    - ModuleName.psm1 (module entry point)
    - collectors/*.ps1 (data gathering functions)
    - checks/*.ps1 (evaluation functions)
-->

---

## 3. Engine Components Detailed Design

### 3.1 Engine Component Inventory

| Component | File | Responsibility | Exports | Dependencies |
|-----------|------|---------------|---------|-------------|
| Auth | Engine/Auth.ps1 | Credential management: save/load/delete DPAPI-encrypted profiles; establish connections to Graph API, Exchange Online, Teams | Save-M365Credential, Get-M365Credential, Remove-M365Credential, Connect-M365Services, Disconnect-M365Services | Windows DPAPI, Microsoft.Graph SDK, ExchangeOnlineManagement, MicrosoftTeams |
| Config | Engine/Config.ps1 | Load and merge configuration from JSON files; apply runtime parameter overrides; validate configuration schema | Get-M365Config, Set-M365ConfigOverride | ConvertFrom-Json (built-in) |
| Logger | Engine/Logger.ps1 | Structured JSONL logging to file and console; log level filtering; context enrichment | Write-M365Log, Initialize-M365LogSession, Close-M365LogSession | None (pure PowerShell) |
| Orchestrator | Engine/Orchestrator.ps1 | Pipeline execution: module discovery, collector invocation, check execution with deduplication, checkpoint management, report triggering | Start-M365Assessment, Resume-M365Assessment, Get-M365AssessmentStatus | Config, Logger, ModuleLoader, ControlsDB, FindingTypes, Auth |
| ControlsDB | Engine/ControlsDB.ps1 | SQLite database operations: initialize schema, CRUD for controls and finding definitions, query finding metadata | Initialize-M365ControlsDB, Get-M365Control, Set-M365Control, Get-M365FindingDefinition | PSSQLite module |
| FindingTypes | Engine/FindingTypes.ps1 | Finding object construction: create standardized finding PSCustomObjects with required properties; severity and status enums | New-M365Finding, Get-M365FindingSeverities, Get-M365FindingStatuses | None (pure PowerShell) |
| ModuleLoader | Engine/ModuleLoader.ps1 | Discover assessment modules by scanning for module.json files; resolve dependency order; load module PSM1 files; register collectors and checks | Get-M365AssessmentModules, Import-M365AssessmentModule | Config |

### 3.2 Auth.ps1 - Detailed Design

**Credential Storage Structure:**

```
%APPDATA%\M365-SecurityAssessment\
  credentials\
    {ProfileName}.cred           # DPAPI-encrypted credential file
    {ProfileName}.meta.json      # Unencrypted metadata (tenant ID, app ID, auth method)
```

**Credential Profile Metadata Schema (meta.json):**

```json
{
  "ProfileName": "ContosoTenant",
  "TenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "ClientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "AuthMethod": "Certificate | ClientSecret",
  "CertificateThumbprint": "AB12CD34EF56...",
  "CreatedAt": "2026-02-15T10:30:00Z",
  "LastUsed": "2026-02-15T14:00:00Z"
}
```

**DPAPI Encryption Flow:**

```
Save-M365Credential:
  1. Accept TenantId, ClientId, AuthMethod, and secret (certificate thumbprint or client secret)
  2. Serialize credential object to JSON byte array
  3. Call [System.Security.Cryptography.ProtectedData]::Protect($bytes, $null, 'CurrentUser')
  4. Write encrypted bytes to {ProfileName}.cred
  5. Write metadata (non-secret fields) to {ProfileName}.meta.json

Get-M365Credential:
  1. Read encrypted bytes from {ProfileName}.cred
  2. Call [System.Security.Cryptography.ProtectedData]::Unprotect($bytes, $null, 'CurrentUser')
  3. Deserialize JSON byte array to credential object
  4. Update LastUsed timestamp in meta.json
  5. Return credential object
```

**Service Connection Sequence:**

```
Connect-M365Services:
  1. Load credential profile via Get-M365Credential
  2. Determine required services from assessment scope configuration
  3. For Graph API:
     a. If Certificate auth: Connect-MgGraph -TenantId -ClientId -CertificateThumbprint
     b. If ClientSecret auth: Create SecureString, Connect-MgGraph -TenantId -ClientId -ClientSecretCredential
  4. For Exchange Online:
     a. Connect-ExchangeOnline -CertificateThumbprint -AppId -Organization
  5. For Microsoft Teams:
     a. Connect-MicrosoftTeams -TenantId -ApplicationId -CertificateThumbprint (or -ApplicationSecret)
  6. Validate each connection by making a lightweight API call
  7. Return connection status hashtable: @{ Graph = $true; Exchange = $true; Teams = $true }
```

### 3.3 Config.ps1 - Detailed Design

**Configuration Loading Order (last wins):**

```
1. Built-in defaults (hardcoded in Config.ps1)
2. assessment-defaults.json (module-level defaults)
3. findings.json (finding definitions -- 108 entries)
4. logic-definitions.json (check logic parameters)
5. Per-module module.json (module-specific overrides)
6. User-provided config file (via -ConfigPath parameter)
7. Command-line parameter overrides (via -Parameter hashtable)
```

**assessment-defaults.json Key Settings:**

| Setting | Default Value | Description |
|---------|---------------|-------------|
| `graphApiVersion` | `v1.0` | Default Graph API version (overridden to `beta` for specific collectors) |
| `graphApiBetaEndpoints` | `[list of paths]` | Endpoints that require beta API version |
| `pageSize` | `999` | Graph API `$top` parameter for paginated requests |
| `retryCount` | `3` | Number of retry attempts for failed API calls |
| `retryDelaySeconds` | `2` | Initial delay between retries (doubled on each retry for exponential backoff) |
| `breakGlassKeywords` | `["break glass", "emergency", "BreakGlass"]` | Keywords to identify break glass accounts excluded from certain checks |
| `severityColors` | `{ "Critical": "#DC3545", "High": "#FD7E14", ... }` | Color codes for severity levels in HTML reports |
| `checkpointIntervalMinutes` | `5` | Frequency of automatic checkpoint saves during assessment |
| `dashboardPort` | `8080` | Pode web server port for the dashboard |
| `outputFormats` | `["HTML", "PDF", "Excel"]` | Default report output formats |

### 3.4 Logger.ps1 - Detailed Design

**JSONL Log Entry Format:**

```json
{
  "timestamp": "2026-02-15T14:23:45.123Z",
  "level": "INFO",
  "module": "EntraID",
  "function": "Get-ConditionalAccessPolicies",
  "message": "Retrieved 47 conditional access policies",
  "context": {
    "policyCount": 47,
    "paginationPages": 1,
    "durationMs": 1234
  },
  "assessmentId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

**Log Levels and Console Color Mapping:**

| Level | Numeric | Console Color | File Logged | Description |
|-------|---------|---------------|-------------|-------------|
| DEBUG | 0 | Gray | Yes (if level <= DEBUG) | Detailed diagnostic information; API request/response metadata |
| INFO | 1 | White | Yes | Normal operational events; collector completion, check results |
| WARNING | 2 | Yellow | Yes | Non-fatal issues; API throttling detected, fallback behavior triggered |
| ERROR | 3 | Red | Yes | Failures requiring attention; collector failure, authentication error |

### 3.5 Orchestrator.ps1 - Detailed Design

**Assessment Pipeline Stages:**

```
Start-M365Assessment:
  Stage 1: INITIALIZATION
    1.1  Load configuration (Config.ps1)
    1.2  Initialize log session (Logger.ps1)
    1.3  Initialize controls database (ControlsDB.ps1)
    1.4  Generate assessmentId (GUID)
    1.5  Create output directory structure

  Stage 2: DISCOVERY
    2.1  Discover available assessment modules (ModuleLoader.ps1)
    2.2  Filter modules based on -Scope parameter (e.g., "EntraID,EmailProtection")
    2.3  Resolve module dependency order
    2.4  Load module PSM1 files and register collectors/checks

  Stage 3: CONNECTION
    3.1  Load credential profile (Auth.ps1)
    3.2  Connect to required M365 services
    3.3  Validate connections with lightweight API calls
    3.4  Log connection status for each service

  Stage 4: COLLECTION
    4.1  Initialize $CollectedData = @{} (shared cache hashtable)
    4.2  For each module (in dependency order):
         4.2.1  For each collector declared in module.json:
                - Check if collector output exists in $CollectedData (skip if cached)
                - Execute collector function
                - Store result in $CollectedData[$collectorName]
                - Log collector completion with item count and duration
         4.2.2  Save checkpoint after each module's collectors complete

  Stage 5: EVALUATION
    5.1  Initialize $executedFunctions = @{} (deduplication hashtable)
    5.2  Initialize $Findings = @() (findings accumulator)
    5.3  For each module (in dependency order):
         5.3.1  For each check declared in module.json:
                - Check if check function exists in $executedFunctions (skip if already run)
                - Execute check function, passing $CollectedData
                - Mark function in $executedFunctions[$functionName] = $true
                - Append returned findings to $Findings
                - Log check completion with finding count and severities
         5.3.2  Save checkpoint after each module's checks complete

  Stage 6: REPORTING
    6.1  Aggregate findings by module, severity, status
    6.2  Generate evidence CSV files for each finding with affected resources
    6.3  For each configured output format (HTML, PDF, DOCX, Excel):
         - Invoke format-specific report generator
         - Save output to reports/ directory
    6.4  Generate assessment summary JSON (assessment.json)
    6.5  Log report generation completion

  Stage 7: CLEANUP
    7.1  Disconnect from M365 services (Disconnect-M365Services)
    7.2  Close log session
    7.3  Remove checkpoint file (assessment completed successfully)
    7.4  Display final summary to console
```

**Function Deduplication Logic:**

```powershell
# Some check functions (e.g., Invoke-ConditionalAccessChecks) produce multiple findings
# from a single evaluation pass. Without deduplication, calling the function twice
# would create duplicate findings.

$executedFunctions = @{}

foreach ($check in $moduleChecks) {
    $functionName = $check.Function
    if ($executedFunctions.ContainsKey($functionName)) {
        Write-M365Log -Level DEBUG -Message "Skipping $functionName (already executed)"
        continue
    }
    $findings = & $functionName -CollectedData $CollectedData
    $executedFunctions[$functionName] = $true
    $allFindings += $findings
}
```

### 3.6 ControlsDB.ps1 - Detailed Design

**SQLite Schema (controls.db):**

```sql
CREATE TABLE IF NOT EXISTS Controls (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    FindingId       TEXT NOT NULL UNIQUE,
    Name            TEXT NOT NULL,
    Type            TEXT NOT NULL,          -- 'EntraID', 'DeviceManagement', 'EmailProtection', 'TeamsSharePoint'
    SubType         TEXT,                   -- e.g., 'ConditionalAccess', 'MFA', 'DKIM'
    Severity        TEXT NOT NULL,          -- 'Critical', 'High', 'Medium', 'Low', 'Informational'
    Status          TEXT DEFAULT 'Active',  -- 'Active', 'Deprecated', 'Draft'
    Description     TEXT,
    Recommendation  TEXT,
    Logic           TEXT,                   -- JSON string: evaluation parameters for the check
    References      TEXT,                   -- JSON string: array of reference URLs (CIS, NIST, Microsoft)
    CreatedAt       TEXT DEFAULT (datetime('now')),
    UpdatedAt       TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_controls_findingid ON Controls(FindingId);
CREATE INDEX IF NOT EXISTS idx_controls_type ON Controls(Type);
CREATE INDEX IF NOT EXISTS idx_controls_severity ON Controls(Severity);
CREATE INDEX IF NOT EXISTS idx_controls_status ON Controls(Status);

CREATE TABLE IF NOT EXISTS AssessmentHistory (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    AssessmentId    TEXT NOT NULL,
    TenantId        TEXT NOT NULL,
    StartedAt       TEXT NOT NULL,
    CompletedAt     TEXT,
    Status          TEXT NOT NULL,          -- 'Running', 'Completed', 'Failed', 'Interrupted'
    Scope           TEXT,                   -- JSON string: array of module names assessed
    FindingsSummary TEXT,                   -- JSON string: { Critical: N, High: N, ... }
    OutputPath      TEXT
);

CREATE INDEX IF NOT EXISTS idx_assessmenthistory_tenantid ON AssessmentHistory(TenantId);
CREATE INDEX IF NOT EXISTS idx_assessmenthistory_status ON AssessmentHistory(Status);
```

### 3.7 FindingTypes.ps1 - Detailed Design

**Finding Object Model:**

```powershell
# New-M365Finding creates a standardized PSCustomObject with the following properties:

[PSCustomObject]@{
    # Identity
    FindingId          = "ENTRA-001"                    # Unique finding identifier from findings.json
    AssessmentId       = "a1b2c3d4-..."                 # Parent assessment GUID

    # Classification
    Name               = "MFA Not Enforced for All Users"
    Category           = "EntraID"                       # Module that produced the finding
    SubCategory        = "ConditionalAccess"             # Sub-domain within the module
    Severity           = "Critical"                      # Critical | High | Medium | Low | Informational
    Status             = "Fail"                          # Pass | Fail | Warning | Informational | Unable to Assess

    # Detail
    Description        = "Multi-factor authentication is not enforced..."
    Recommendation     = "Create a conditional access policy that requires MFA..."
    Impact             = "Accounts without MFA are vulnerable to credential-based attacks..."

    # Evidence
    AffectedResources  = @(                              # Array of affected resource objects
        @{
            ResourceType = "User"
            ResourceId   = "user@contoso.com"
            ResourceName = "Jane Smith"
            Detail       = "No MFA-enforcing CA policy applies to this user"
        }
    )
    Evidence           = @{                              # Hashtable of supporting evidence
        PolicyCount     = 47
        MfaPolicies     = @("CA-001: Require MFA for Admins")
        UsersWithoutMfa = 142
        TotalUsers      = 500
        RawData         = $CollectedData["ConditionalAccessPolicies"]
    }

    # Metadata
    Timestamp          = "2026-02-15T14:30:00Z"
    ModuleVersion      = "1.0.0"
    CheckFunction      = "Invoke-MfaEnforcementCheck"

    # References
    CisControl         = "5.2.2.1"                       # CIS Microsoft 365 Benchmark control ID
    NistControl        = "IA-2(1)"                       # NIST SP 800-53 control
    MicrosoftReference = "https://learn.microsoft.com/..."
}
```

**Severity Definitions:**

| Severity | Numeric Weight | Description | Expected Action |
|----------|---------------|-------------|-----------------|
| Critical | 5 | Immediate risk of compromise; actively exploitable configuration | Remediate within 24 hours |
| High | 4 | Significant security gap; likely to be exploited if targeted | Remediate within 7 days |
| Medium | 3 | Notable weakness; increases attack surface | Remediate within 30 days |
| Low | 2 | Minor concern; defense-in-depth gap | Remediate within 90 days |
| Informational | 1 | Observation; no direct risk; best practice recommendation | Review and consider |

---

## 4. Assessment Module Structure

### 4.1 Module Directory Layout

```
Modules/
  EntraID/
    module.json                          # Module manifest
    EntraID.psm1                         # Module entry point (dot-sources collectors and checks)
    collectors/
      Get-ConditionalAccessPolicies.ps1  # Collector: CA policies via Graph API
      Get-EntraUsers.ps1                 # Collector: user accounts via Graph API
      Get-DirectoryRoleAssignments.ps1   # Collector: role assignments via Graph API
      Get-SecurityAlerts.ps1             # Collector: security alerts via Graph API
    checks/
      Invoke-MfaChecks.ps1              # Check: MFA enforcement evaluation
      Invoke-ConditionalAccessChecks.ps1 # Check: CA policy completeness
      Invoke-PrivilegedAccessChecks.ps1  # Check: privileged role evaluation
      Invoke-GuestAccessChecks.ps1       # Check: guest/external access evaluation

  DeviceManagement/
    module.json
    DeviceManagement.psm1
    collectors/
      Get-ManagedDevices.ps1             # Collector: Intune-managed devices
      Get-CompliancePolicies.ps1         # Collector: device compliance policies
      Get-SecurityBaselines.ps1          # Collector: Intune security baselines (beta API)
      Get-WindowsProtectionState.ps1     # Collector: Windows Defender status (beta API)
    checks/
      Invoke-DeviceComplianceChecks.ps1  # Check: compliance policy evaluation
      Invoke-SecurityBaselineChecks.ps1  # Check: baseline adherence
      Invoke-EndpointProtectionChecks.ps1 # Check: Defender/protection status

  EmailProtection/
    module.json
    EmailProtection.psm1
    collectors/
      Get-DkimConfiguration.ps1          # Collector: DKIM signing config via EXO PS
      Get-AntiSpamPolicies.ps1           # Collector: hosted content filter policies
      Get-AntiPhishPolicies.ps1          # Collector: anti-phishing policies
      Get-SafeLinksPolicies.ps1          # Collector: Safe Links policies
      Get-SafeAttachmentPolicies.ps1     # Collector: Safe Attachment policies
      Get-TransportRules.ps1             # Collector: mail flow / transport rules
    checks/
      Invoke-DkimChecks.ps1             # Check: DKIM enablement and configuration
      Invoke-AntiSpamChecks.ps1         # Check: spam filter effectiveness
      Invoke-AntiPhishChecks.ps1        # Check: phishing protection evaluation
      Invoke-SafeLinksChecks.ps1        # Check: Safe Links configuration
      Invoke-SafeAttachmentChecks.ps1   # Check: Safe Attachment configuration
      Invoke-TransportRuleChecks.ps1    # Check: mail flow rule security

  TeamsSharePoint/
    module.json
    TeamsSharePoint.psm1
    collectors/
      Get-TeamsMeetingPolicies.ps1       # Collector: Teams meeting policies
      Get-TeamsMessagingPolicies.ps1      # Collector: Teams messaging policies
      Get-TeamsExternalAccess.ps1        # Collector: external/federation access
      Get-TeamsAppPermissions.ps1        # Collector: third-party app permissions
      Get-SharePointSites.ps1            # Collector: SharePoint site configurations
    checks/
      Invoke-TeamsMeetingChecks.ps1      # Check: meeting security evaluation
      Invoke-TeamsMessagingChecks.ps1     # Check: messaging policy evaluation
      Invoke-TeamsExternalAccessChecks.ps1 # Check: federation/external access
      Invoke-SharePointSharingChecks.ps1  # Check: sharing and external access
```

### 4.2 module.json Schema

```json
{
  "name": "EntraID",
  "displayName": "Entra ID (Azure AD) Security Assessment",
  "version": "1.0.0",
  "description": "Evaluates Entra ID conditional access, MFA, privileged access, and identity configuration",
  "author": "M365-SecurityAssessment Team",
  "requiredServices": ["Graph"],
  "requiredPermissions": {
    "graph": [
      "Policy.Read.All",
      "User.Read.All",
      "RoleManagement.Read.All",
      "SecurityEvents.Read.All",
      "Directory.Read.All"
    ]
  },
  "collectors": [
    {
      "name": "ConditionalAccessPolicies",
      "function": "Get-ConditionalAccessPolicies",
      "description": "Retrieves all conditional access policies from Entra ID",
      "graphEndpoint": "/identity/conditionalAccess/policies",
      "apiVersion": "v1.0",
      "cacheable": true
    },
    {
      "name": "EntraUsers",
      "function": "Get-EntraUsers",
      "description": "Retrieves all user accounts from Entra ID",
      "graphEndpoint": "/users",
      "apiVersion": "v1.0",
      "cacheable": true
    },
    {
      "name": "DirectoryRoleAssignments",
      "function": "Get-DirectoryRoleAssignments",
      "description": "Retrieves all directory role assignments",
      "graphEndpoint": "/roleManagement/directory/roleAssignments",
      "apiVersion": "v1.0",
      "cacheable": true
    },
    {
      "name": "SecurityAlerts",
      "function": "Get-SecurityAlerts",
      "description": "Retrieves security alerts from Microsoft 365",
      "graphEndpoint": "/security/alerts",
      "apiVersion": "v1.0",
      "cacheable": true
    }
  ],
  "checks": [
    {
      "name": "MFA Enforcement",
      "function": "Invoke-MfaChecks",
      "description": "Evaluates MFA enforcement across the tenant",
      "dependsOnCollectors": ["ConditionalAccessPolicies", "EntraUsers"],
      "findingIds": ["ENTRA-001", "ENTRA-002", "ENTRA-003"]
    },
    {
      "name": "Conditional Access Completeness",
      "function": "Invoke-ConditionalAccessChecks",
      "description": "Evaluates conditional access policy coverage and configuration",
      "dependsOnCollectors": ["ConditionalAccessPolicies"],
      "findingIds": ["ENTRA-010", "ENTRA-011", "ENTRA-012", "ENTRA-013"]
    },
    {
      "name": "Privileged Access",
      "function": "Invoke-PrivilegedAccessChecks",
      "description": "Evaluates privileged role assignments and admin security",
      "dependsOnCollectors": ["DirectoryRoleAssignments", "EntraUsers", "ConditionalAccessPolicies"],
      "findingIds": ["ENTRA-020", "ENTRA-021", "ENTRA-022"]
    },
    {
      "name": "Guest Access",
      "function": "Invoke-GuestAccessChecks",
      "description": "Evaluates external/guest user access controls",
      "dependsOnCollectors": ["EntraUsers", "ConditionalAccessPolicies"],
      "findingIds": ["ENTRA-030", "ENTRA-031"]
    }
  ]
}
```

### 4.3 Collector Pattern

```powershell
# Standard collector function pattern:
function Get-ConditionalAccessPolicies {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $false)]
        [hashtable]$Config = @{}
    )

    $collectorName = "ConditionalAccessPolicies"
    Write-M365Log -Level INFO -Module "EntraID" -Function $collectorName `
        -Message "Starting collection of conditional access policies"

    try {
        $pageSize = if ($Config.pageSize) { $Config.pageSize } else { 999 }
        $allPolicies = @()
        $uri = "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies?`$top=$pageSize"

        # Paginated collection
        do {
            $response = Invoke-MgGraphRequest -Method GET -Uri $uri -ErrorAction Stop
            $allPolicies += $response.value

            # Handle pagination
            $uri = $response.'@odata.nextLink'
        } while ($uri)

        Write-M365Log -Level INFO -Module "EntraID" -Function $collectorName `
            -Message "Retrieved $($allPolicies.Count) conditional access policies" `
            -Context @{ policyCount = $allPolicies.Count }

        return $allPolicies
    }
    catch {
        Write-M365Log -Level ERROR -Module "EntraID" -Function $collectorName `
            -Message "Failed to retrieve conditional access policies: $($_.Exception.Message)"
        return $null
    }
}
```

### 4.4 Check Pattern

```powershell
# Standard check function pattern:
function Invoke-MfaChecks {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$CollectedData
    )

    $checkName = "MFA Enforcement"
    $findings = @()

    # Retrieve cached collector data
    $policies = $CollectedData["ConditionalAccessPolicies"]
    $users = $CollectedData["EntraUsers"]

    if ($null -eq $policies -or $null -eq $users) {
        Write-M365Log -Level WARNING -Module "EntraID" -Function $checkName `
            -Message "Required collector data not available; returning Unable to Assess"
        $findings += New-M365Finding -FindingId "ENTRA-001" -Status "Unable to Assess" `
            -Description "Could not evaluate MFA enforcement: collector data unavailable"
        return $findings
    }

    # Evaluation logic
    $mfaPolicies = $policies | Where-Object {
        $_.grantControls.builtInControls -contains "mfa" -and
        $_.state -eq "enabled"
    }

    if ($mfaPolicies.Count -eq 0) {
        $findings += New-M365Finding -FindingId "ENTRA-001" `
            -Status "Fail" -Severity "Critical" `
            -AffectedResources @($users | ForEach-Object { @{ ResourceType = "User"; ResourceId = $_.userPrincipalName } }) `
            -Evidence @{ MfaPolicies = 0; TotalPolicies = $policies.Count; TotalUsers = $users.Count }
    }
    else {
        # Further evaluation: check coverage across all users...
        $findings += New-M365Finding -FindingId "ENTRA-001" `
            -Status "Pass" -Severity "Critical" `
            -Evidence @{ MfaPolicies = $mfaPolicies.Count; TotalPolicies = $policies.Count }
    }

    return $findings
}
```

---

## 5. Data Flow: End-to-End Assessment Pipeline

### 5.1 Data Flow Diagram

```
[Configuration Files]
        |
        v
[Orchestrator] ---> [Auth] ---> [M365 Cloud Services]
        |                              |
        v                              v
[ModuleLoader] --> [Collectors] --> [CollectedData Cache ($hashtable)]
                                       |
                                       v
                               [Checks] --> [Findings Array (@())]
                                               |
                                               v
                                  [Report Generator] --> [HTML | PDF | DOCX | Excel]
                                               |
                                               v
                                  [Evidence Exporter] --> [CSV files per finding]
                                               |
                                               v
                                  [ControlsDB] --> [AssessmentHistory record in SQLite]
```

### 5.2 CollectedData Cache Structure

```powershell
$CollectedData = @{
    # EntraID module collectors
    "ConditionalAccessPolicies"  = @( <array of policy objects> )
    "EntraUsers"                 = @( <array of user objects> )
    "DirectoryRoleAssignments"   = @( <array of role assignment objects> )
    "SecurityAlerts"             = @( <array of alert objects> )

    # DeviceManagement module collectors
    "ManagedDevices"             = @( <array of device objects> )
    "CompliancePolicies"         = @( <array of compliance policy objects> )
    "SecurityBaselines"          = @( <array of baseline intent objects> )
    "WindowsProtectionState"     = @( <array of protection state objects> )

    # EmailProtection module collectors
    "DkimConfiguration"          = @( <array of DKIM signing configs> )
    "AntiSpamPolicies"           = @( <array of content filter policies> )
    "AntiPhishPolicies"          = @( <array of anti-phish policies> )
    "SafeLinksPolicies"          = @( <array of Safe Links policies> )
    "SafeAttachmentPolicies"     = @( <array of Safe Attachment policies> )
    "TransportRules"             = @( <array of transport rule objects> )

    # TeamsSharePoint module collectors
    "TeamsMeetingPolicies"       = @( <array of meeting policy objects> )
    "TeamsMessagingPolicies"     = @( <array of messaging policy objects> )
    "TeamsExternalAccess"        = @( <external access configuration object> )
    "TeamsAppPermissions"        = @( <array of app permission policy objects> )
    "SharePointSites"            = @( <array of SharePoint site objects> )
}
```

---

## 6. Report Generation Pipeline

### 6.1 Report Format Inventory

| Format | Generator | Dependencies | Output File | Description |
|--------|-----------|-------------|-------------|-------------|
| HTML | Internal template engine | None (pure PowerShell string interpolation) | `reports/assessment-{timestamp}.html` | Self-contained single-file HTML with embedded CSS; severity-colored finding cards; executive summary; detailed findings with evidence tables |
| PDF | Edge headless conversion | Microsoft Edge (Chromium) installed | `reports/assessment-{timestamp}.pdf` | Generated from HTML report via `msedge --headless --print-to-pdf`; preserves HTML formatting and styling |
| DOCX | PSWriteWord | PSWriteWord PowerShell module | `reports/assessment-{timestamp}.docx` | Structured Word document with cover page, table of contents, executive summary, findings by severity, appendices with evidence |
| Excel | ImportExcel | ImportExcel PowerShell module | `reports/assessment-{timestamp}.xlsx` | Multi-worksheet workbook: Summary, Findings (sortable/filterable), Evidence, Statistics, Raw Data |

### 6.2 HTML Report Generation Flow

```
1. Load HTML template (embedded in Report Generator)
2. Populate executive summary:
   - Assessment date, tenant name, scope, duration
   - Finding counts by severity (Critical/High/Medium/Low/Informational)
   - Pass/Fail ratio pie chart data (inline SVG)
3. For each finding (sorted by severity descending):
   - Render finding card with severity badge, name, status
   - Render description, recommendation, impact
   - Render affected resources table
   - Render evidence details
4. Append raw assessment metadata as hidden JSON block (for machine parsing)
5. Write complete HTML string to output file
6. If PDF requested: invoke Edge headless conversion on the HTML file
```

### 6.3 PDF Generation Command

```powershell
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$htmlPath = "$OutputPath\reports\assessment-$timestamp.html"
$pdfPath  = "$OutputPath\reports\assessment-$timestamp.pdf"

& $edgePath --headless --disable-gpu --print-to-pdf="$pdfPath" --no-margins "$htmlPath"
```

---

## 7. Dashboard Architecture (Pode)

### 7.1 Dashboard Routes

| Method | Route | Handler | Description |
|--------|-------|---------|-------------|
| GET | / | Home view | Dashboard home page with assessment overview |
| GET | /status | Status view | Real-time assessment progress (stage, module, percentage) |
| GET | /findings | Findings view | Finding browser with severity filtering and search |
| GET | /findings/:id | Finding detail view | Individual finding with evidence and recommendations |
| GET | /evidence/:findingId | Evidence view | Evidence detail for a specific finding |
| GET | /reports | Reports view | Report download links (HTML, PDF, DOCX, Excel) |
| GET | /api/status | REST endpoint | JSON: current assessment status object |
| GET | /api/findings | REST endpoint | JSON: array of all findings with filtering query params |
| GET | /api/findings/:id | REST endpoint | JSON: single finding detail |
| GET | /api/summary | REST endpoint | JSON: assessment summary (counts by severity, module, status) |
| GET | /api/reports | REST endpoint | JSON: available report files with download URLs |
| GET | /download/:filename | File download | Serve report or evidence file for download |

### 7.2 Dashboard State Management

```powershell
# The dashboard reads shared state from a synchronized hashtable:
$Global:M365AssessmentState = [System.Collections.Hashtable]::Synchronized(@{
    AssessmentId    = $null
    Status          = "Idle"           # Idle | Running | Completed | Failed
    CurrentStage    = $null            # Initialization | Discovery | Connection | Collection | Evaluation | Reporting
    CurrentModule   = $null            # Name of the module currently being processed
    Progress        = 0                # 0-100 percentage
    StartedAt       = $null
    Findings        = @()              # Accumulated findings (updated as checks complete)
    Errors          = @()              # Logged errors
    Reports         = @()              # Generated report file paths
    CheckpointFile  = $null            # Path to current checkpoint
})
```

---

## 8. Checkpoint/Resume Mechanism

### 8.1 Checkpoint File Schema (checkpoint.json)

```json
{
  "assessmentId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "startedAt": "2026-02-15T14:00:00Z",
  "lastCheckpointAt": "2026-02-15T14:15:00Z",
  "currentStage": "EVALUATION",
  "completedStages": ["INITIALIZATION", "DISCOVERY", "CONNECTION", "COLLECTION"],
  "scope": ["EntraID", "DeviceManagement", "EmailProtection", "TeamsSharePoint"],
  "completedModules": {
    "collection": ["EntraID", "DeviceManagement"],
    "evaluation": ["EntraID"]
  },
  "collectedDataKeys": ["ConditionalAccessPolicies", "EntraUsers", "DirectoryRoleAssignments", "SecurityAlerts", "ManagedDevices", "CompliancePolicies", "SecurityBaselines", "WindowsProtectionState"],
  "findingCount": 23,
  "configHash": "sha256:abc123...",
  "outputPath": "C:\\Assessments\\Contoso-2026-02-15"
}
```

### 8.2 Resume Logic

```
Resume-M365Assessment -CheckpointPath <path>:
  1. Load checkpoint.json
  2. Validate configHash matches current configuration (warn if different)
  3. Restore assessment state:
     a. Re-establish M365 service connections
     b. Reload CollectedData from cached evidence files (if available)
        OR re-run collectors for modules listed in collectedDataKeys
     c. Restore findings from partial results file
  4. Resume from currentStage:
     - If COLLECTION: skip completed collection modules, continue with remaining
     - If EVALUATION: skip completed evaluation modules, continue with remaining
     - If REPORTING: restart report generation (idempotent)
  5. Continue normal pipeline execution from resume point
```

---

## 9. Module Manifest (M365-SecurityAssessment.psd1) - Exported Functions

| # | Function Name | Category | Description |
|---|--------------|----------|-------------|
| 1 | `Start-M365Assessment` | Assessment | Start a new security assessment for an M365 tenant |
| 2 | `Resume-M365Assessment` | Assessment | Resume an interrupted assessment from checkpoint |
| 3 | `Get-M365AssessmentStatus` | Assessment | Get the current assessment status and progress |
| 4 | `Stop-M365Assessment` | Assessment | Gracefully stop a running assessment (saves checkpoint) |
| 5 | `Save-M365Credential` | Auth | Save an encrypted M365 credential profile |
| 6 | `Get-M365Credential` | Auth | Load a saved credential profile |
| 7 | `Remove-M365Credential` | Auth | Delete a saved credential profile |
| 8 | `Connect-M365Services` | Auth | Establish connections to M365 services |
| 9 | `Disconnect-M365Services` | Auth | Disconnect from all M365 services |
| 10 | `Get-M365Config` | Config | Get the current module configuration |
| 11 | `Set-M365ConfigOverride` | Config | Set a runtime configuration override |
| 12 | `Get-M365AssessmentModules` | Modules | List available assessment modules |
| 13 | `Import-M365AssessmentModule` | Modules | Import a specific assessment module |
| 14 | `Initialize-M365ControlsDB` | Database | Initialize or upgrade the controls SQLite database |
| 15 | `Get-M365Control` | Database | Query controls from the database |
| 16 | `Set-M365Control` | Database | Insert or update a control definition |
| 17 | `Get-M365FindingDefinition` | Database | Get finding definition metadata |
| 18 | `New-M365Finding` | Findings | Create a new standardized finding object |
| 19 | `Get-M365FindingSeverities` | Findings | Get the available finding severity levels |
| 20 | `Get-M365FindingStatuses` | Findings | Get the available finding status values |
| 21 | `Export-M365Report` | Reporting | Generate reports in specified formats |
| 22 | `Export-M365Evidence` | Reporting | Export evidence CSV files for findings |
| 23 | `Start-M365Dashboard` | Dashboard | Start the Pode web dashboard |
| 24 | `Stop-M365Dashboard` | Dashboard | Stop the Pode web dashboard |
| 25 | `Write-M365Log` | Logging | Write a structured log entry |
| 26 | `Initialize-M365LogSession` | Logging | Initialize a new log session for an assessment |
| 27 | `Close-M365LogSession` | Logging | Close the current log session |
| 28 | `Get-M365AssessmentHistory` | History | Query past assessment results from the database |
| 29 | `Compare-M365Assessments` | History | Compare findings between two assessments (delta report) |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | Module Author | Initial release aligned with M365-SecurityAssessment v1.0.0 |
