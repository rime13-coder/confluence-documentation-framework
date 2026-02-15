# Integration Architecture

| **Metadata**     | **Value**                                      |
|------------------|------------------------------------------------|
| Page Title       | M365-SecurityAssessment - Integration Architecture |
| Last Updated     | 2026-02-15                                     |
| Status           | `CURRENT`                                      |
| Owner            | Module Author                                  |
| Reviewers        | Security Consultant Lead, Engineering Manager  |
| Version          | 1.0                                            |
| Related HLD      | M365-SecurityAssessment - Architecture Overview (HLD) |

---

## 1. Document Purpose

This document defines the integration architecture for the **M365-SecurityAssessment** PowerShell module (v1.0.0). It describes how the module integrates with Microsoft Graph API, Exchange Online PowerShell, Microsoft Teams PowerShell, and SharePoint. It covers authentication flows, required permissions per module, pagination and retry logic, error handling, and rate limiting considerations.

---

## 2. Integration Landscape Diagram

<!-- Diagram: 07-integration-landscape.png -- embedded on Confluence page as attachment -->
<!--
    Shows:
    - M365-SecurityAssessment module (center)
    - Outbound: Microsoft Graph API v1.0 (Entra ID, Intune, SharePoint, Security)
    - Outbound: Microsoft Graph API beta (Intune advanced)
    - Outbound: Exchange Online PowerShell (email security)
    - Outbound: Microsoft Teams PowerShell (collaboration security)
    - Local: SQLite controls.db (read/write)
    - Local: DPAPI credential store (read)
    - Local: Pode dashboard (localhost:8080)
    All outbound connections are HTTPS; all local connections are file I/O
-->

---

## 3. Integration Inventory

### 3.1 External Service Integrations

| # | Target Service | Protocol | Pattern | Auth Method | Data Format | SLA (Availability) | Purpose |
|---|---------------|----------|---------|-------------|-------------|--------------------|---------|
| 1 | Microsoft Graph API v1.0 | HTTPS REST | Synchronous (request-response) | OAuth 2.0 App-only (certificate or client secret) | JSON | 99.9% (Microsoft Graph SLA) | Entra ID configuration, user accounts, role assignments, device management, SharePoint sites, security alerts, domains |
| 2 | Microsoft Graph API beta | HTTPS REST | Synchronous (request-response) | OAuth 2.0 App-only (same token as v1.0) | JSON | No SLA (beta) | Intune security baselines, configuration policies, Windows protection state |
| 3 | Exchange Online PowerShell | HTTPS (remote PS session) | Synchronous (cmdlet invocation) | Certificate-based auth via Connect-ExchangeOnline | PowerShell objects | 99.9% (Exchange Online SLA) | DKIM, anti-phishing, anti-spam, Safe Links, Safe Attachments, transport rules |
| 4 | Microsoft Teams PowerShell | HTTPS (remote PS session) | Synchronous (cmdlet invocation) | Certificate or client secret via Connect-MicrosoftTeams | PowerShell objects | 99.9% (Teams SLA) | Meeting policies, messaging policies, external access, app permissions |

### 3.2 Local Integrations

| # | Target | Protocol | Pattern | Auth Method | Purpose |
|---|--------|----------|---------|-------------|---------|
| 5 | SQLite controls.db | File I/O (PSSQLite) | Synchronous | N/A (local file) | Controls database: finding definitions, assessment history |
| 6 | DPAPI Credential Store | File I/O + Windows Crypto API | Synchronous | Windows user session | Credential profile encryption/decryption |
| 7 | Pode Web Dashboard | HTTP (localhost:8080) | Asynchronous (separate runspace) | N/A (localhost only) | Assessment status dashboard, finding browser, report download |
| 8 | Local Filesystem | File I/O | Synchronous | OS file permissions | Assessment output: reports, evidence, logs, checkpoints |

---

## 4. Microsoft Graph API Integration

### 4.1 Graph API Endpoints by Assessment Module

#### 4.1.1 Entra ID Module

| Endpoint | API Version | HTTP Method | Purpose | Pagination | Typical Response Size |
|----------|------------|-------------|---------|------------|----------------------|
| `/identity/conditionalAccess/policies` | v1.0 | GET | Retrieve all conditional access policies | Yes (`@odata.nextLink`) | 10-200 policies |
| `/users?$select=id,displayName,userPrincipalName,accountEnabled,userType,signInActivity,assignedLicenses` | v1.0 | GET | Retrieve all user accounts with key properties | Yes (`@odata.nextLink`) | 100-50,000 users |
| `/roleManagement/directory/roleAssignments?$expand=principal` | v1.0 | GET | Retrieve all directory role assignments with principal details | Yes (`@odata.nextLink`) | 10-500 assignments |
| `/security/alerts?$top=100` | v1.0 | GET | Retrieve active security alerts | Yes (`@odata.nextLink`) | 0-1,000 alerts |
| `/domains` | v1.0 | GET | Retrieve all verified domains | No (typically < 100) | 1-50 domains |

#### 4.1.2 Device Management Module

| Endpoint | API Version | HTTP Method | Purpose | Pagination | Typical Response Size |
|----------|------------|-------------|---------|------------|----------------------|
| `/deviceManagement/managedDevices?$select=id,deviceName,operatingSystem,complianceState,lastSyncDateTime,managementAgent` | v1.0 | GET | Retrieve all Intune-managed devices | Yes (`@odata.nextLink`) | 100-50,000 devices |
| `/deviceManagement/deviceCompliancePolicies?$expand=assignments` | v1.0 | GET | Retrieve device compliance policies with assignments | Yes (`@odata.nextLink`) | 5-50 policies |
| `/deviceManagement/intents` | **beta** | GET | Retrieve Intune security baseline configurations | Yes (`@odata.nextLink`) | 1-20 baselines |
| `/deviceManagement/configurationPolicies?$expand=settings,assignments` | **beta** | GET | Retrieve Intune configuration policies (Settings Catalog) | Yes (`@odata.nextLink`) | 10-100 policies |
| `/deviceManagement/windowsProtectionState` | **beta** | GET | Retrieve Windows Defender protection status per device | Yes (`@odata.nextLink`) | 100-50,000 states |

#### 4.1.3 SharePoint Module (via Graph API)

| Endpoint | API Version | HTTP Method | Purpose | Pagination | Typical Response Size |
|----------|------------|-------------|---------|------------|----------------------|
| `/sites?search=*` | v1.0 | GET | Discover SharePoint sites in the tenant | Yes (`@odata.nextLink`) | 10-5,000 sites |
| `/sites/{siteId}` | v1.0 | GET | Retrieve individual site configuration | No | Single site |
| `/sites/{siteId}/lists` | v1.0 | GET | Retrieve lists and document libraries for sharing analysis | Yes (`@odata.nextLink`) | 1-100 lists per site |

### 4.2 Graph API Authentication

**App-Only Authentication Flow:**

```
1. Load credential profile (Get-M365Credential)
   - Decrypts DPAPI-protected credential file
   - Returns: TenantId, ClientId, AuthMethod, Secret

2. If AuthMethod == "Certificate":
   a. Locate certificate in Windows certificate store by thumbprint
   b. Connect-MgGraph -TenantId $TenantId -ClientId $ClientId -CertificateThumbprint $Thumbprint
   c. Graph SDK internally:
      - Creates JWT assertion signed with certificate private key
      - POST https://login.microsoftonline.com/{TenantId}/oauth2/v2.0/token
        grant_type=client_credentials
        client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
        client_assertion={signed_jwt}
        scope=https://graph.microsoft.com/.default
      - Receives access token (1-hour validity)

3. If AuthMethod == "ClientSecret":
   a. Create PSCredential from ClientId and ClientSecret
   b. Connect-MgGraph -TenantId $TenantId -ClientSecretCredential $Credential
   c. Graph SDK internally:
      - POST https://login.microsoftonline.com/{TenantId}/oauth2/v2.0/token
        grant_type=client_credentials
        client_id={ClientId}
        client_secret={ClientSecret}
        scope=https://graph.microsoft.com/.default
      - Receives access token (1-hour validity)

4. Token refresh: Handled automatically by Microsoft.Graph SDK
   - SDK caches token and refreshes before expiry
   - No manual token management required for Graph API calls
```

### 4.3 Graph API Pagination Logic

```powershell
# Standard pagination pattern used by all Graph API collectors:

function Invoke-M365GraphPagedRequest {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Uri,

        [int]$PageSize = 999,

        [int]$MaxRetries = 3,

        [int]$RetryDelaySeconds = 2
    )

    $allResults = @()
    $currentUri = "$Uri$(if ($Uri -match '\?') { '&' } else { '?' })`$top=$PageSize"
    $pageCount = 0

    do {
        $pageCount++
        $response = $null
        $retryCount = 0

        while ($retryCount -le $MaxRetries) {
            try {
                $response = Invoke-MgGraphRequest -Method GET -Uri $currentUri -ErrorAction Stop
                break  # Success, exit retry loop
            }
            catch {
                $retryCount++
                if ($_.Exception.Response.StatusCode -eq 429) {
                    # Throttled: respect Retry-After header
                    $retryAfter = $_.Exception.Response.Headers['Retry-After']
                    $delay = if ($retryAfter) { [int]$retryAfter } else { $RetryDelaySeconds * [Math]::Pow(2, $retryCount) }
                    Write-M365Log -Level WARNING -Message "Graph API throttled (429). Waiting $delay seconds (retry $retryCount/$MaxRetries)"
                    Start-Sleep -Seconds $delay
                }
                elseif ($_.Exception.Response.StatusCode -ge 500) {
                    # Server error: exponential backoff
                    $delay = $RetryDelaySeconds * [Math]::Pow(2, $retryCount)
                    Write-M365Log -Level WARNING -Message "Graph API server error ($($_.Exception.Response.StatusCode)). Waiting $delay seconds (retry $retryCount/$MaxRetries)"
                    Start-Sleep -Seconds $delay
                }
                else {
                    # Client error (4xx other than 429): do not retry
                    throw
                }

                if ($retryCount -gt $MaxRetries) {
                    Write-M365Log -Level ERROR -Message "Graph API request failed after $MaxRetries retries: $($_.Exception.Message)"
                    throw
                }
            }
        }

        $allResults += $response.value
        $currentUri = $response.'@odata.nextLink'

        Write-M365Log -Level DEBUG -Message "Page $pageCount retrieved: $($response.value.Count) items (total: $($allResults.Count))"
    } while ($currentUri)

    return $allResults
}
```

---

## 5. Exchange Online Integration

### 5.1 Connection Method

```powershell
# Certificate-based authentication (recommended):
Connect-ExchangeOnline `
    -CertificateThumbprint $credential.CertificateThumbprint `
    -AppId $credential.ClientId `
    -Organization "$($credential.TenantDomain)" `
    -ShowBanner:$false

# Validation: run lightweight cmdlet to confirm connection
$null = Get-OrganizationConfig -ErrorAction Stop
```

### 5.2 Exchange Online Cmdlets Used

| Cmdlet | Collector | Purpose | Typical Output |
|--------|-----------|---------|---------------|
| `Get-DkimSigningConfig` | Get-DkimConfiguration | DKIM signing status per domain | 1-20 domain configurations |
| `Get-HostedContentFilterPolicy` | Get-AntiSpamPolicies | Anti-spam/content filter policy settings | 1-10 policies |
| `Get-AntiPhishPolicy` | Get-AntiPhishPolicies | Anti-phishing policy configurations | 1-10 policies |
| `Get-SafeLinksPolicy` | Get-SafeLinksPolicies | Safe Links (URL protection) policy settings | 1-10 policies |
| `Get-SafeAttachmentPolicy` | Get-SafeAttachmentPolicies | Safe Attachments (sandboxing) policy settings | 1-10 policies |
| `Get-TransportRule` | Get-TransportRules | Mail flow / transport rules | 0-100 rules |

### 5.3 Exchange Online Required Roles

| Role | Justification | Minimum Scope |
|------|---------------|--------------|
| `Exchange.ManageAsApp` | Required for app-only authentication to Exchange Online PowerShell | Application permission on App Registration |
| Exchange Administrator (or Global Reader) | Required role assignment in Exchange Online for the App Registration service principal | Assigned via New-ManagementRoleAssignment -App -SecurityGroup |

---

## 6. Microsoft Teams Integration

### 6.1 Connection Method

```powershell
# Certificate-based authentication:
Connect-MicrosoftTeams `
    -TenantId $credential.TenantId `
    -ApplicationId $credential.ClientId `
    -CertificateThumbprint $credential.CertificateThumbprint

# Alternative: Client secret authentication
Connect-MicrosoftTeams `
    -TenantId $credential.TenantId `
    -ApplicationId $credential.ClientId `
    -ApplicationSecret (ConvertTo-SecureString $credential.ClientSecret -AsPlainText -Force)

# Validation:
$null = Get-CsTenant -ErrorAction Stop
```

### 6.2 Teams Cmdlets Used

| Cmdlet | Collector | Purpose | Typical Output |
|--------|-----------|---------|---------------|
| `Get-CsTeamsMeetingPolicy` | Get-TeamsMeetingPolicies | Meeting security settings (anonymous join, recording, lobby bypass) | 1-20 policies |
| `Get-CsTeamsMessagingPolicy` | Get-TeamsMessagingPolicies | Messaging settings (URL previews, memes, giphy, read receipts) | 1-20 policies |
| `Get-CsExternalAccessPolicy` | Get-TeamsExternalAccess | External/federation access settings | 1-5 policies |
| `Get-CsTeamsAppPermissionPolicy` | Get-TeamsAppPermissions | Third-party app permission and sideloading controls | 1-10 policies |

### 6.3 Teams Required Permissions

| Permission Type | Permission | Justification |
|----------------|------------|---------------|
| Application (App Registration) | Skype and Teams Tenant Admin API: `application_access` | Required for Teams PowerShell app-only authentication |
| Azure AD Role | Teams Administrator (or Global Reader) | Required for read access to Teams policies and configuration |

---

## 7. Azure AD App Registration Requirements

### 7.1 Complete Permission Matrix by Module

| Module | Permission Name | Permission Type | API | Justification |
|--------|----------------|-----------------|-----|---------------|
| **EntraID** | `Policy.Read.All` | Application | Microsoft Graph | Read conditional access policies |
| **EntraID** | `User.Read.All` | Application | Microsoft Graph | Read all user accounts and sign-in activity |
| **EntraID** | `RoleManagement.Read.All` | Application | Microsoft Graph | Read directory role assignments |
| **EntraID** | `SecurityEvents.Read.All` | Application | Microsoft Graph | Read security alerts |
| **EntraID** | `Directory.Read.All` | Application | Microsoft Graph | Read directory settings and domain configurations |
| **DeviceManagement** | `DeviceManagementManagedDevices.Read.All` | Application | Microsoft Graph | Read managed device inventory and compliance state |
| **DeviceManagement** | `DeviceManagementConfiguration.Read.All` | Application | Microsoft Graph | Read compliance policies, security baselines, configuration policies |
| **DeviceManagement** | `DeviceManagementApps.Read.All` | Application | Microsoft Graph | Read app protection policies and managed app configurations |
| **EmailProtection** | `Exchange.ManageAsApp` | Application | Office 365 Exchange Online | App-only authentication to Exchange Online PowerShell |
| **TeamsSharePoint** | `Sites.Read.All` | Application | Microsoft Graph | Read SharePoint site configurations and sharing settings |
| **TeamsSharePoint** | (Teams PS SDK permissions) | Application | Skype and Teams Tenant Admin API | Read Teams policies and configuration |

### 7.2 App Registration Configuration

| Setting | Required Value | Notes |
|---------|---------------|-------|
| Application Type | Web | Required for client credential flow |
| Supported Account Types | Single tenant (this organization only) | Assessment targets a specific tenant |
| Client Credentials | Certificate (recommended) OR Client Secret | Certificate preferred for production use |
| API Permissions | As listed in Section 7.1 | All permissions require admin consent |
| Token Configuration | Default (no custom claims needed) | Standard OAuth 2.0 client credentials |

### 7.3 Minimum Privilege Justification

All permissions are **read-only**. The module does not modify any tenant configuration. The permission set is designed to be the minimum required for a comprehensive security assessment:

| Permission | Why Read-Only Is Sufficient |
|------------|---------------------------|
| `Policy.Read.All` | Assessment evaluates policy configuration; does not create or modify policies |
| `User.Read.All` | Assessment counts users, checks MFA registration, identifies privileged accounts; does not modify users |
| `RoleManagement.Read.All` | Assessment audits role assignments; does not assign or remove roles |
| `DeviceManagementManagedDevices.Read.All` | Assessment checks device compliance state; does not modify devices or policies |
| `Sites.Read.All` | Assessment checks sharing settings; does not modify site configurations |

---

## 8. Authentication Flow: End-to-End

### 8.1 Full Authentication Sequence

```
[Security Consultant]
       |
       | (1) Save-M365Credential -ProfileName "Contoso" -TenantId "xxx" -ClientId "yyy" -AuthMethod Certificate -CertificateThumbprint "zzz"
       |
       v
[Auth.ps1: Save-M365Credential]
       |
       | (2) Serialize credential to JSON bytes
       | (3) DPAPI encrypt: ProtectedData.Protect(bytes, null, CurrentUser)
       | (4) Write to %APPDATA%\M365-SecurityAssessment\credentials\Contoso.cred
       | (5) Write metadata to Contoso.meta.json
       |
       v
[Credential stored on disk (encrypted)]
       |
       | (Later, when assessment starts)
       |
       | (6) Start-M365Assessment -ProfileName "Contoso" -Scope "EntraID,EmailProtection"
       |
       v
[Auth.ps1: Get-M365Credential]
       |
       | (7) Read Contoso.cred from disk
       | (8) DPAPI decrypt: ProtectedData.Unprotect(bytes, null, CurrentUser)
       | (9) Deserialize JSON to credential object
       |
       v
[Auth.ps1: Connect-M365Services]
       |
       | (10) Connect-MgGraph -TenantId -ClientId -CertificateThumbprint
       |      -> Graph SDK obtains OAuth 2.0 access token via client_credentials flow
       |      -> Token cached in-memory by SDK; auto-refreshed before expiry
       |
       | (11) Connect-ExchangeOnline -CertificateThumbprint -AppId -Organization
       |      -> EXO module establishes remote PS session with certificate auth
       |
       | (12) Connect-MicrosoftTeams -TenantId -ApplicationId -CertificateThumbprint
       |      -> Teams module authenticates via certificate
       |
       | (13) Validate each connection with lightweight API call
       |      -> Graph: GET /organization | EXO: Get-OrganizationConfig | Teams: Get-CsTenant
       |
       v
[All services connected -- assessment proceeds]
```

---

## 9. Error Handling and Retry Strategy

### 9.1 Retry Configuration

| Parameter | Default Value | Source | Description |
|-----------|---------------|--------|-------------|
| `retryCount` | 3 | assessment-defaults.json | Maximum number of retry attempts per failed API call |
| `retryDelaySeconds` | 2 | assessment-defaults.json | Initial delay between retries (first retry) |
| `retryBackoffMultiplier` | 2 | assessment-defaults.json | Multiplier applied to delay on each subsequent retry (exponential backoff) |
| `requestTimeoutSeconds` | 30 | assessment-defaults.json | Timeout for individual API requests |

**Retry Delay Progression (default settings):**

| Retry # | Delay | Cumulative Wait |
|---------|-------|-----------------|
| 1 | 2 seconds | 2 seconds |
| 2 | 4 seconds | 6 seconds |
| 3 | 8 seconds | 14 seconds |
| (failure) | N/A | Total: 14 seconds + 3 request times |

### 9.2 Error Classification and Handling

| Error Type | HTTP Status | Retryable | Handling Strategy | User Impact |
|-----------|-------------|-----------|-------------------|-------------|
| Throttled | 429 | Yes | Read `Retry-After` header; wait specified duration; retry up to `retryCount` times | Collector takes longer; warning logged; no data loss |
| Server Error | 500, 502, 503, 504 | Yes | Exponential backoff retry up to `retryCount` times | Collector takes longer; warning logged; no data loss if retry succeeds |
| Unauthorized | 401 | No | Log error; attempt token refresh (Graph SDK handles automatically); if refresh fails, report authentication failure | Assessment halts for the affected service; other services continue |
| Forbidden | 403 | No | Log error with permission details; mark affected collectors as failed; report missing permission in findings | Affected checks return "Unable to Assess" status; assessment continues |
| Not Found | 404 | No | Log warning; return empty result set; endpoint may not exist in tenant (e.g., no Intune license) | Affected checks evaluate empty data; findings reflect "Not Configured" |
| Bad Request | 400 | No | Log error with request details; likely a module bug or API schema change | Collector fails; affected checks return "Unable to Assess" |
| Network Timeout | N/A | Yes | Retry with exponential backoff | Same as server error handling |
| Connection Failure | N/A | Yes (for initial connection) | Retry connection up to `retryCount` times; if all fail, skip service | Assessment continues without the failed service; affected modules produce "Unable to Assess" findings |
| PowerShell Cmdlet Error | N/A | Depends | Caught by try/catch; logged; collector returns null | Check receives null data and returns "Unable to Assess" |

### 9.3 Graceful Degradation Model

```
[Connection Attempt]
      |
      |--- Graph API connected? -----> YES: EntraID + DeviceManagement + SharePoint modules proceed
      |                           \--> NO:  Skip EntraID, DeviceManagement, SharePoint modules; log error
      |
      |--- Exchange Online connected? -> YES: EmailProtection module proceeds
      |                           \--> NO:  Skip EmailProtection module; log error
      |
      |--- Teams connected? ---------> YES: TeamsSharePoint module proceeds (Teams portion)
      |                           \--> NO:  Skip Teams checks; SharePoint checks proceed via Graph API
      |
      v
[Assessment continues with available services]
[Failed modules produce "Unable to Assess" findings in the report]
[Assessment summary clearly indicates which services were unavailable]
```

---

## 10. Rate Limiting Considerations

### 10.1 Microsoft Graph API Rate Limits

| Limit Type | Threshold | Scope | Impact on Module |
|-----------|-----------|-------|-----------------|
| Per-app per-tenant | 10,000 requests per 10 minutes | All Graph API calls from the App Registration | Unlikely to hit with default pagination (pageSize=999); large tenants with many paginated requests may approach limit |
| Per-app global | Varies by endpoint | Across all tenants | Not applicable (module assesses one tenant at a time) |
| Delta query | Service-specific | Per endpoint | Not used (module collects full snapshots, not deltas) |
| Concurrent requests | ~4 concurrent per app per tenant | Parallel requests | Not applicable (module executes sequentially by default) |

### 10.2 Exchange Online Rate Limits

| Limit Type | Threshold | Impact on Module |
|-----------|-----------|-----------------|
| PowerShell session limit | 3 concurrent sessions per user/app | Module uses 1 session; no risk |
| Cmdlet execution throttling | Varies by cmdlet | Low risk; module executes ~6 cmdlets with minimal parameters |
| Connection timeout | 60 minutes idle | If assessment takes > 60 min, EXO session may disconnect; retry logic handles reconnection |

### 10.3 Teams PowerShell Rate Limits

| Limit Type | Threshold | Impact on Module |
|-----------|-----------|-----------------|
| Session limit | Varies | Module uses 1 session; low risk |
| Cmdlet throttling | Varies by cmdlet | Low risk; module executes ~4 cmdlets |

### 10.4 Rate Limit Mitigation Strategies

| Strategy | Implementation | Effectiveness |
|----------|---------------|--------------|
| Collector caching | Each collector runs once; results cached in `$CollectedData`; no redundant API calls | Eliminates duplicate calls across multiple checks |
| Pagination with large page size | `$top=999` reduces total number of API calls for large result sets | Reduces call count by 10-100x compared to default page sizes |
| Sequential execution | Collectors run one at a time; no parallel API calls | Avoids concurrent request limits; trades speed for reliability |
| Retry-After compliance | 429 responses are handled by waiting the specified duration | Prevents aggressive retry patterns that worsen throttling |
| Exponential backoff | Server errors trigger increasing delays between retries | Gives services time to recover before retrying |

---

## 11. Integration Monitoring and Observability

### 11.1 Collector Performance Metrics (Logged)

| Metric | Log Level | Format | Purpose |
|--------|-----------|--------|---------|
| Collector duration | INFO | `"Retrieved {count} items in {duration}ms"` | Identify slow collectors; detect API performance degradation |
| Page count per collector | DEBUG | `"Page {n} retrieved: {count} items (total: {total})"` | Monitor pagination behavior; detect unexpected large result sets |
| Retry events | WARNING | `"Graph API throttled (429). Waiting {delay}s (retry {n}/{max})"` | Track throttling frequency; identify tenants that trigger rate limits |
| Collector failures | ERROR | `"Failed to retrieve {collector}: {error}"` | Detect broken integrations; monitor API compatibility |
| Connection validation | INFO | `"Connected to {service}: {status}"` | Confirm service availability at assessment start |
| Total assessment duration | INFO | `"Assessment completed in {duration} minutes"` | Baseline assessment performance; track regressions |

### 11.2 Health Check Validation Calls

| Service | Validation Call | Expected Result | Failure Action |
|---------|----------------|-----------------|----------------|
| Microsoft Graph API | `Invoke-MgGraphRequest -Method GET -Uri "https://graph.microsoft.com/v1.0/organization"` | 200 OK with organization object | Log error; mark Graph as unavailable; skip Graph-dependent modules |
| Exchange Online | `Get-OrganizationConfig -ErrorAction Stop` | Organization config object returned | Log error; mark EXO as unavailable; skip EmailProtection module |
| Microsoft Teams | `Get-CsTenant -ErrorAction Stop` | Tenant object returned | Log error; mark Teams as unavailable; skip Teams checks |

---

## 12. Third-Party Dependency Risk Assessment

| Dependency | Criticality | Risk | Mitigation |
|-----------|------------|------|------------|
| Microsoft Graph API v1.0 | Critical (primary data source) | API deprecation or breaking changes | Use stable v1.0 endpoints where possible; monitor Microsoft Graph changelog; pin to known API behaviors in logic-definitions.json |
| Microsoft Graph API beta | High (Intune advanced features) | Beta endpoints may change without notice; no SLA guarantee | Wrap beta calls in robust error handling; document beta dependency; fall back to "Unable to Assess" if beta endpoints break |
| ExchangeOnlineManagement module | High (email security assessment) | Module updates may change cmdlet behavior | Pin to tested module version in requirements; test new versions before adoption |
| MicrosoftTeams module | Medium (Teams security assessment) | Module updates may change cmdlet behavior | Pin to tested module version; Teams checks are not on the critical path |
| PSSQLite module | Low (local database) | Module could become unmaintained | SQLite is a stable technology; PSSQLite is a thin wrapper; easy to replace with direct SQLite interop if needed |
| Pode module | Low (optional dashboard) | Module could become unmaintained | Dashboard is optional; assessment functions fully without it; Pode is actively maintained as of 2026 |
| PSWriteWord module | Low (DOCX generation) | Module could become unmaintained | DOCX is one of four report formats; HTML and Excel remain available if PSWriteWord fails |
| ImportExcel module | Low (Excel generation) | Module could become unmaintained | Excel is one of four report formats; well-maintained module with large community |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | Module Author | Initial release aligned with M365-SecurityAssessment v1.0.0 |
