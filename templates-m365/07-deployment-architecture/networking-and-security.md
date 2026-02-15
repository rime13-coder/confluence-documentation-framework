# Network Connectivity & Security

| **Metadata**     | **Value**                                          |
|------------------|----------------------------------------------------|
| Page Title       | Network Connectivity & Security                    |
| Last Updated     | 2026-02-15                                         |
| Status           | IN PROGRESS                                        |
| Owner            | IntelliSec Solutions                               |

---

## 1. Document Purpose

This document defines the network connectivity requirements and security controls for the M365 Security Assessment Automation tool. Unlike cloud-hosted applications that require VNets, NSGs, WAFs, and load balancers, this tool runs locally on Windows workstations and only requires outbound HTTPS connectivity to Microsoft cloud service endpoints. There are no inbound connections -- the web dashboard is bound to localhost only. This document covers outbound endpoint requirements, TLS configuration, proxy/firewall considerations, authentication security, and credential protection.

---

## 2. Network Architecture

### 2.1 Connectivity Model

```
Consultant Workstation
+---------------------------------------------------------------+
|                                                               |
|  M365 Security Assessment Module                             |
|                                                               |
|  Outbound HTTPS (TLS 1.2+) Only                             |
|  +----------------------------------------------------------+|
|  |                                                          ||
|  |  graph.microsoft.com ---------> Microsoft Graph API      ||
|  |  login.microsoftonline.com ---> Azure AD Authentication  ||
|  |  outlook.office365.com -------> Exchange Online          ||
|  |  *.sharepoint.com ------------> SharePoint Admin API     ||
|  |  api.interfaces.records       |                          ||
|  |    .teams.microsoft.com ------> Microsoft Teams API      ||
|  |                                                          ||
|  +----------------------------------------------------------+||
|                                                               |
|  Local Only (No External Access)                             |
|  +----------------------------------------------------------+|
|  |  localhost:8080 <-------------> Pode Web Dashboard       ||
|  |  Local SQLite DB                                         ||
|  |  Local filesystem (output)                               ||
|  +----------------------------------------------------------+||
|                                                               |
|  NO INBOUND CONNECTIONS                                      |
+---------------------------------------------------------------+
```

### 2.2 Network Model Summary

| Attribute                          | Value                                                    |
|------------------------------------|----------------------------------------------------------|
| Inbound Connections Required       | None -- dashboard bound to localhost:8080 only           |
| Outbound Connections Required      | HTTPS (TCP 443) to Microsoft cloud endpoints             |
| Protocol                          | HTTPS only (TLS 1.2 minimum)                             |
| VPN Required                      | No (unless corporate policy mandates VPN for internet)   |
| Static IP Required                | No                                                       |
| DNS Resolution                    | Standard public DNS                                      |
| Bandwidth Requirements            | Low -- API calls and JSON responses (typically < 50 MB per assessment) |

---

## 3. Outbound Endpoint Requirements

### 3.1 Required Endpoints

All outbound connections use HTTPS (TCP port 443). These endpoints must be reachable from the consultant workstation.

| Endpoint                                          | Protocol   | Port | Purpose                                              | Used By Module(s)                |
|---------------------------------------------------|------------|------|------------------------------------------------------|----------------------------------|
| https://graph.microsoft.com                       | HTTPS      | 443  | Microsoft Graph API (primary data collection API)    | All modules                      |
| https://login.microsoftonline.com                 | HTTPS      | 443  | Azure AD OAuth2 token endpoint (authentication)     | All modules                      |
| https://outlook.office365.com                     | HTTPS      | 443  | Exchange Online PowerShell remoting                  | EmailProtection                  |
| https://*.sharepoint.com                          | HTTPS      | 443  | SharePoint Online Admin API                          | TeamsSharePoint                  |
| https://api.interfaces.records.teams.microsoft.com | HTTPS     | 443  | Microsoft Teams service API                          | TeamsSharePoint                  |

### 3.2 Additional Microsoft Endpoints (Authentication Dependencies)

| Endpoint                                          | Protocol   | Port | Purpose                                              |
|---------------------------------------------------|------------|------|------------------------------------------------------|
| https://aadcdn.msftauth.net                       | HTTPS      | 443  | Azure AD authentication CDN                          |
| https://login.windows.net                         | HTTPS      | 443  | Legacy Azure AD endpoint (used by some modules)     |
| https://graph.windows.net                         | HTTPS      | 443  | Azure AD Graph (legacy, used by some cmdlets)        |
| https://*.microsoftonline-p.com                   | HTTPS      | 443  | Azure AD authentication proxy                        |

### 3.3 Module-to-Endpoint Mapping

| Module            | Primary Endpoint(s)                                         | Authentication Method                    |
|-------------------|-------------------------------------------------------------|------------------------------------------|
| EntraID           | graph.microsoft.com, login.microsoftonline.com              | Client credentials (certificate or secret) |
| DeviceManagement  | graph.microsoft.com, login.microsoftonline.com              | Client credentials (certificate or secret) |
| EmailProtection   | outlook.office365.com, graph.microsoft.com, login.microsoftonline.com | Certificate-based authentication   |
| TeamsSharePoint   | graph.microsoft.com, *.sharepoint.com, api.interfaces.records.teams.microsoft.com | Client credentials (certificate or secret) |

---

## 4. TLS Configuration

### 4.1 TLS Requirements

| Attribute                    | Value                                                      |
|------------------------------|------------------------------------------------------------|
| Minimum TLS Version          | TLS 1.2                                                    |
| Required By                  | All Microsoft cloud API endpoints                          |
| PowerShell Configuration     | `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12` |
| .NET Framework Requirement   | 4.7.2+ (TLS 1.2 enabled by default)                       |
| Certificate Validation       | Standard Windows certificate store (trusted root CAs)     |

### 4.2 TLS Verification

```powershell
# Verify TLS 1.2 is available and enabled
[Net.ServicePointManager]::SecurityProtocol

# Force TLS 1.2 (add to module initialization if needed)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Test connectivity to Graph API with TLS
try {
    $response = Invoke-RestMethod -Uri "https://graph.microsoft.com/v1.0/$metadata" -Method Head
    Write-Host "TLS connectivity to Graph API: OK" -ForegroundColor Green
} catch {
    Write-Host "TLS connectivity to Graph API: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}
```

---

## 5. Proxy and Firewall Considerations

### 5.1 Corporate Network Requirements

When the assessment tool runs on a consultant workstation within a corporate network, the following proxy and firewall configurations may be required.

| Scenario                        | Configuration Required                                       |
|---------------------------------|--------------------------------------------------------------|
| Direct internet access          | No additional configuration needed                           |
| HTTP proxy (no auth)            | Configure system proxy in Windows network settings           |
| HTTP proxy (with auth)          | Configure proxy credentials; may need `$env:HTTP_PROXY`      |
| SSL inspection / MITM proxy     | Import corporate root CA certificate into Windows trust store; may break certificate pinning in some modules |
| Firewall with URL filtering     | Whitelist all endpoints listed in Section 3                  |
| Firewall with IP filtering      | Whitelist Microsoft Azure IP ranges for target services (ranges change frequently; use Microsoft service tags) |

### 5.2 PowerShell Proxy Configuration

```powershell
# If behind a proxy, configure the default proxy for PowerShell
[System.Net.WebRequest]::DefaultWebProxy = New-Object System.Net.WebProxy("http://proxy.corp.example.com:8080")
[System.Net.WebRequest]::DefaultWebProxy.Credentials = [System.Net.CredentialCache]::DefaultNetworkCredentials

# Or set environment variables
$env:HTTP_PROXY = "http://proxy.corp.example.com:8080"
$env:HTTPS_PROXY = "http://proxy.corp.example.com:8080"
$env:NO_PROXY = "localhost,127.0.0.1"
```

### 5.3 Firewall Whitelist

The following endpoints must be accessible from the consultant workstation. Provide this list to the network/firewall team when running assessments from a corporate network.

| Rule | Direction | Protocol | Destination                                        | Port | Action |
|------|-----------|----------|---------------------------------------------------|------|--------|
| 1    | Outbound  | HTTPS    | graph.microsoft.com                               | 443  | Allow  |
| 2    | Outbound  | HTTPS    | login.microsoftonline.com                         | 443  | Allow  |
| 3    | Outbound  | HTTPS    | outlook.office365.com                             | 443  | Allow  |
| 4    | Outbound  | HTTPS    | *.sharepoint.com                                  | 443  | Allow  |
| 5    | Outbound  | HTTPS    | api.interfaces.records.teams.microsoft.com        | 443  | Allow  |
| 6    | Outbound  | HTTPS    | aadcdn.msftauth.net                               | 443  | Allow  |
| 7    | Outbound  | HTTPS    | login.windows.net                                 | 443  | Allow  |
| 8    | Outbound  | HTTPS    | *.microsoftonline-p.com                           | 443  | Allow  |

> **Note:** Microsoft IP ranges for these services change frequently. If IP-based filtering is required instead of FQDN-based filtering, refer to the [Microsoft Azure IP Ranges and Service Tags](https://www.microsoft.com/en-us/download/details.aspx?id=56519) document, which is updated weekly.

---

## 6. Authentication Security

### 6.1 Authentication Methods

| Authentication Target      | Method                                    | Security Mechanism                        |
|----------------------------|-------------------------------------------|-------------------------------------------|
| Microsoft Graph API        | OAuth2 client credentials flow            | Client certificate or client secret       |
| Exchange Online PowerShell | Certificate-based authentication          | X.509 certificate uploaded to App Registration |
| Microsoft Teams PowerShell | OAuth2 client credentials flow            | Client certificate or client secret       |
| SharePoint Online          | OAuth2 client credentials flow            | Client certificate or client secret       |

### 6.2 Certificate-Based Authentication (Exchange Online)

Exchange Online PowerShell requires certificate-based authentication when connecting with application permissions.

| Attribute                    | Value                                                      |
|------------------------------|------------------------------------------------------------|
| Certificate Type             | Self-signed or CA-issued X.509 certificate                |
| Key Length                   | Minimum 2048-bit RSA                                       |
| Certificate Storage          | Windows Certificate Store (CurrentUser\My)                |
| Public Key Upload            | Uploaded to Azure AD App Registration                      |
| Private Key Protection       | Windows Certificate Store with private key marked non-exportable (recommended) |
| Certificate Expiry           | Recommended: 1-2 years; track and renew before expiry     |

### 6.3 Authentication Flow

```
1. Assessment module loads credential profile
2. DPAPI decrypts stored tenant ID, client ID, certificate thumbprint
3. Module acquires OAuth2 access token from login.microsoftonline.com
   - Client credentials flow with certificate assertion (Exchange Online)
   - Client credentials flow with client secret or certificate (Graph API)
4. Access token is used for all API calls (bearer token)
5. Token is refreshed automatically by Microsoft modules when nearing expiry
6. On assessment completion, sessions are disconnected and tokens discarded
```

---

## 7. Credential Protection (DPAPI)

### 7.1 DPAPI Encryption Overview

| Attribute                    | Value                                                      |
|------------------------------|------------------------------------------------------------|
| Encryption API               | Windows Data Protection API (DPAPI)                       |
| Encryption Scope             | Current User + Current Machine                             |
| Key Material                 | Derived from Windows user credentials and machine SID     |
| Portability                  | Not portable -- encrypted data can only be decrypted by the same user on the same machine |
| Protected Data               | Tenant ID, Client ID, Client Secret (if used), Certificate Thumbprint |
| Storage Location             | Encrypted files in user profile directory                  |
| Access Control               | Windows NTFS permissions on user profile directory         |

### 7.2 DPAPI Security Properties

| Security Property             | Status                                                     |
|-------------------------------|-------------------------------------------------------------|
| At-rest encryption            | IMPLEMENTED -- DPAPI encryption on disk                    |
| User-bound access             | IMPLEMENTED -- only the creating user can decrypt          |
| Machine-bound access          | IMPLEMENTED -- only decryptable on the creating machine    |
| Memory protection             | PARTIAL -- credentials exist in plaintext in memory during assessment execution |
| Credential rotation           | MANUAL -- consultant must update profile when secrets/certs rotate |
| Credential expiry tracking    | NOT IMPLEMENTED -- no automated tracking of secret/cert expiry |

### 7.3 Credential Security Best Practices

- [ ] Full-disk encryption (BitLocker) enabled on all consultant workstations
- [ ] Windows user accounts protected with strong passwords
- [ ] Workstation screen lock configured (max 5 minutes idle)
- [ ] Credential profiles deleted after engagement completion (if single-use)
- [ ] Client secrets set to shortest acceptable expiry (recommended: 90 days)
- [ ] Certificate private keys stored as non-exportable in Windows Certificate Store
- [ ] Workstation antivirus/EDR active and updated

---

## 8. Dashboard Security (Localhost)

### 8.1 Pode Web Dashboard

| Attribute                    | Value                                                      |
|------------------------------|------------------------------------------------------------|
| Framework                    | Pode v2.12.1                                               |
| Binding Address              | localhost (127.0.0.1)                                      |
| Port                         | 8080                                                       |
| External Access              | None -- bound to loopback interface only                   |
| TLS for Dashboard            | Not required (localhost only, no network exposure)          |
| Authentication               | None (localhost access assumed to be the authenticated user) |
| Cross-Origin Requests        | Not applicable (no external origins)                       |

### 8.2 Dashboard Security Considerations

| Risk                              | Mitigation                                                 |
|-----------------------------------|------------------------------------------------------------|
| Local process access              | Dashboard only accessible to processes on the same machine |
| Local user access                 | Any local user can access localhost:8080 while dashboard is running; mitigated by single-user workstations |
| Data exposure                     | Dashboard displays assessment findings; workstation access controls are the security boundary |
| Port conflict                     | If port 8080 is in use, Pode will fail to start; configurable via assessment-defaults.json |

---

## 9. Data in Transit

### 9.1 Data Flow Security

| Data Flow                                    | Encryption       | Protocol    | Sensitivity              |
|----------------------------------------------|------------------|-------------|--------------------------|
| Workstation to Graph API                     | TLS 1.2+         | HTTPS       | High (authentication tokens, tenant config data) |
| Workstation to Azure AD (token request)      | TLS 1.2+         | HTTPS       | High (client credentials) |
| Workstation to Exchange Online               | TLS 1.2+         | HTTPS       | High (email security config) |
| Workstation to SharePoint Admin              | TLS 1.2+         | HTTPS       | Medium (sharing settings) |
| Workstation to Teams API                     | TLS 1.2+         | HTTPS       | Medium (collaboration settings) |
| Dashboard to browser (localhost)             | Plaintext HTTP   | HTTP        | Medium (findings data, local only) |
| Assessment output to local disk              | Not encrypted    | Filesystem  | High (findings, evidence); NTFS permissions only |

### 9.2 Data at Rest

| Data Store                          | Encryption       | Location         | Sensitivity              |
|-------------------------------------|------------------|------------------|--------------------------|
| Credential profiles                 | DPAPI encrypted  | User profile dir | Critical (tenant creds)  |
| SQLite assessment database          | Not encrypted    | Engagement dir   | High (findings data)     |
| CSV evidence files                  | Not encrypted    | Engagement dir   | High (tenant config data)|
| HTML/PDF/DOCX reports               | Not encrypted    | Engagement dir   | High (assessment results)|
| Assessment log files                | Not encrypted    | Engagement dir   | Low-Medium (operational) |

> **Note:** Assessment output files (evidence, reports, database) are stored unencrypted on the local filesystem. Data at rest protection relies on workstation full-disk encryption (BitLocker) and NTFS access controls.

---

## 10. Network Security Checklist

### 10.1 Pre-Assessment Network Verification

- [ ] Outbound HTTPS connectivity to graph.microsoft.com verified
- [ ] Outbound HTTPS connectivity to login.microsoftonline.com verified
- [ ] Outbound HTTPS connectivity to outlook.office365.com verified
- [ ] Outbound HTTPS connectivity to *.sharepoint.com verified
- [ ] Outbound HTTPS connectivity to api.interfaces.records.teams.microsoft.com verified
- [ ] TLS 1.2 enabled and functioning on the workstation
- [ ] Proxy configuration applied (if applicable)
- [ ] Firewall whitelist rules in place (if applicable)
- [ ] DNS resolution functioning for all required endpoints

### 10.2 Credential Security Verification

- [ ] DPAPI credential profiles created successfully
- [ ] Certificate installed in Windows Certificate Store (for Exchange Online)
- [ ] Certificate thumbprint matches App Registration configuration
- [ ] Client secret expiry date recorded and tracked (if using secrets)
- [ ] BitLocker enabled on workstation drive
- [ ] Workstation screen lock configured

### 10.3 Operational Security

- [ ] Assessment output directory has appropriate NTFS permissions
- [ ] No assessment data stored on shared/network drives without encryption
- [ ] Credential profiles for completed engagements removed (if single-use)
- [ ] Assessment logs reviewed for error conditions or failed API calls
- [ ] Dashboard (Pode) stopped after assessment review is complete

---

## 11. Connectivity Test Script

```powershell
<#
.SYNOPSIS
    Tests outbound network connectivity to all required M365 API endpoints.
.DESCRIPTION
    Validates that the workstation can reach all Microsoft cloud service
    endpoints required by the M365 Security Assessment tool.
#>

$endpoints = @(
    @{ Name = "Microsoft Graph API";           Url = "https://graph.microsoft.com/v1.0/`$metadata" }
    @{ Name = "Azure AD Authentication";       Url = "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration" }
    @{ Name = "Exchange Online";               Url = "https://outlook.office365.com" }
    @{ Name = "SharePoint Online";             Url = "https://admin.sharepoint.com" }
    @{ Name = "Microsoft Teams API";           Url = "https://api.interfaces.records.teams.microsoft.com" }
)

Write-Host "M365 Security Assessment - Network Connectivity Test" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

foreach ($ep in $endpoints) {
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $ep.Url -Method Head -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
        $sw.Stop()
        Write-Host "  PASS: $($ep.Name) ($($sw.ElapsedMilliseconds)ms)" -ForegroundColor Green
    } catch {
        Write-Host "  FAIL: $($ep.Name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test TLS version
$tlsProtocols = [Net.ServicePointManager]::SecurityProtocol
if ($tlsProtocols -band [Net.SecurityProtocolType]::Tls12) {
    Write-Host "  PASS: TLS 1.2 is enabled" -ForegroundColor Green
} else {
    Write-Host "  FAIL: TLS 1.2 is NOT enabled" -ForegroundColor Red
}
```

---

## 12. Revision History

| Date           | Author               | Changes Made                                                  |
|----------------|-----------------------|---------------------------------------------------------------|
| 2026-02-15     | IntelliSec Solutions  | Initial document adapted for M365 Security Assessment Automation (local PowerShell tool) |
