# Security Testing (SAST / DAST)

| **Page Title**   | Security Testing -- M365 Security Assessment Automation |
|------------------|----------------------------------------------------------|
| **Last Updated** | 2026-02-15                                               |
| **Status**       | IN PROGRESS                                              |
| **Owner**        | IntelliSecOps Security Team                              |

---

## 1. Security Testing Approach Overview

The M365-SecurityAssessment module is a PowerShell-based client-side tool, not a web application deployed to public infrastructure. Traditional SAST/DAST tooling designed for web applications does not directly apply. Instead, security testing is adapted to address the specific risks of a tool that:

- Handles privileged M365 tenant credentials (Client ID, Client Secret, Tenant ID).
- Connects to live customer environments via Graph API, Exchange Online, and Teams.
- Generates assessment reports containing sensitive security findings.
- Stores findings in a local SQLite database.
- Runs a localhost-only dashboard (Pode web server).

```
Code Review  -->  Static Analysis  -->  Credential Security  -->  API Security  -->  Output Security
 (Manual)        (PSScriptAnalyzer)      (DPAPI validation)     (TLS, scopes)    (File permissions)
```

| Security Layer                    | Stage                | Automated | Frequency            | Current State          |
|-----------------------------------|----------------------|-----------|----------------------|------------------------|
| Static Analysis (PSScriptAnalyzer)| Development          | Planned   | Before each release  | **Not yet implemented** |
| Credential Leak Detection         | Code review          | Planned   | Every code change    | **Manual review**      |
| Dependency / Module Scanning      | Development          | Planned   | Before each release  | **Not yet implemented** |
| DPAPI Credential Validation       | Integration testing  | Manual    | Before each release  | **Manual testing**     |
| API Security (TLS, Permissions)   | Integration testing  | Manual    | Before each release  | **Manual testing**     |
| Output Security (Reports, Logs)   | Integration testing  | Manual    | Before each release  | **Manual testing**     |
| Dashboard Security (Pode)         | Integration testing  | Manual    | Before each release  | **Manual testing**     |

---

## 2. Static Analysis: PSScriptAnalyzer

### Configuration

| Aspect                       | Configuration                                                      |
|------------------------------|--------------------------------------------------------------------|
| **Tool**                     | PSScriptAnalyzer (PowerShell static analysis module)               |
| **Version**                  | Latest stable                                                       |
| **Install**                  | `Install-Module PSScriptAnalyzer -Force`                           |
| **Severity threshold**       | All Warning and Error level findings must be addressed             |
| **Custom rules**             | Credential leak detection rules (planned)                          |

### How to Run

```powershell
# Analyze all module scripts
Invoke-ScriptAnalyzer -Path .\modules\ -Recurse -Severity Warning,Error

# Analyze a specific file
Invoke-ScriptAnalyzer -Path .\modules\EntraID\Check-EntraIDSecurity.ps1

# Analyze with specific rules
Invoke-ScriptAnalyzer -Path .\modules\ -Recurse -IncludeRule @(
    'PSAvoidUsingPlainTextForPassword',
    'PSAvoidUsingConvertToSecureStringWithPlainText',
    'PSAvoidUsingUserNameAndPasswordParams',
    'PSUseShouldProcessForStateChangingFunctions'
)
```

### Key PSScriptAnalyzer Rules

| Rule Name                                         | Severity | Purpose                                             | Applicable To                     |
|---------------------------------------------------|----------|-----------------------------------------------------|-----------------------------------|
| `PSAvoidUsingPlainTextForPassword`                | Error    | Detects plaintext password parameters               | All module scripts                |
| `PSAvoidUsingConvertToSecureStringWithPlainText`  | Error    | Detects insecure string-to-SecureString conversion  | Credential handling functions     |
| `PSAvoidUsingUserNameAndPasswordParams`           | Warning  | Flags username/password parameter pairs             | Connect/Auth functions            |
| `PSUseShouldProcessForStateChangingFunctions`     | Warning  | Ensures `-WhatIf` support for state changes         | Database write functions          |
| `PSAvoidUsingInvokeExpression`                    | Warning  | Detects code injection risk via `Invoke-Expression` | All scripts                       |
| `PSAvoidUsingWriteHost`                           | Warning  | Prefer `Write-Verbose` / `Write-Output` for testability | All scripts                 |
| `PSUseDeclaredVarsMoreThanAssignments`            | Warning  | Detect unused variables (potential dead code)       | All scripts                       |
| `PSAvoidGlobalVars`                               | Warning  | Global variables leak state between modules         | All scripts                       |

### Current State

PSScriptAnalyzer is **not yet integrated** into the development workflow. Running it is planned as a pre-release quality gate.

---

## 3. Credential Leak Detection

### What to Check

| Check                                              | Method                  | Severity if Found |
|----------------------------------------------------|-------------------------|-------------------|
| Hardcoded Client Secret in source files            | Manual review + grep    | Critical          |
| Hardcoded Tenant ID / Client ID in source files    | Manual review + grep    | High              |
| Credentials written to log files                   | Manual review           | Critical          |
| Credentials in PowerShell transcript/history       | Manual review           | High              |
| `.env` or `config.json` committed to source control | `.gitignore` review   | Critical          |
| Credentials in error messages or stack traces      | Manual testing          | High              |

### Automated Detection (Planned)

```powershell
# Search for potential credential patterns in module code
$credPatterns = @(
    'password\s*=\s*[''"][^''"]+[''"]',     # password = "value"
    'secret\s*=\s*[''"][^''"]+[''"]',        # secret = "value"
    'clientsecret\s*=\s*[''"][^''"]+[''"]',  # clientsecret = "value"
    '[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}', # GUID patterns (potential tenant/client IDs)
    'ConvertTo-SecureString\s+[''"]'         # Plaintext to SecureString
)

Get-ChildItem .\modules\ -Recurse -Filter *.ps1 | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    foreach ($pattern in $credPatterns) {
        if ($content -match $pattern) {
            Write-Warning "Potential credential in $($_.FullName): $($Matches[0])"
        }
    }
}
```

---

## 4. Dependency and Module Scanning

### Module Version Auditing

The M365-SecurityAssessment module depends on external PowerShell modules that should be monitored for known vulnerabilities and kept up to date.

| Dependency Module                 | Current Version | Purpose                                        | Known Vulnerabilities | Last Reviewed |
|-----------------------------------|-----------------|-------------------------------------------------|-----------------------|---------------|
| **Pester**                        | 3.4.0           | Unit testing framework                          | None known            | 2026-02-15    |
| **Microsoft.Graph**               | Latest          | Graph API access for EntraID, DeviceManagement  | Check per release     | 2026-02-15    |
| **ExchangeOnlineManagement**      | Latest          | Exchange Online PowerShell session              | Check per release     | 2026-02-15    |
| **MicrosoftTeams**                | Latest          | Teams PowerShell administration                 | Check per release     | 2026-02-15    |
| **System.Data.SQLite**            | Bundled         | SQLite database engine for ControlsDB           | Check per release     | 2026-02-15    |
| **Pode**                          | Latest          | Localhost web server for assessment dashboard   | Check per release     | 2026-02-15    |

### Module Version Check Script

```powershell
# Check installed module versions against latest available
$requiredModules = @(
    'Pester',
    'Microsoft.Graph',
    'ExchangeOnlineManagement',
    'MicrosoftTeams',
    'Pode'
)

foreach ($mod in $requiredModules) {
    $installed = Get-Module $mod -ListAvailable | Select-Object -First 1
    $latest = Find-Module $mod -ErrorAction SilentlyContinue

    $status = if ($installed.Version -eq $latest.Version) { "UP TO DATE" } else { "UPDATE AVAILABLE" }

    [PSCustomObject]@{
        Module    = $mod
        Installed = $installed.Version
        Latest    = $latest.Version
        Status    = $status
    }
}
```

---

## 5. Credential Security: DPAPI Validation

### What DPAPI Provides

| Aspect                       | Details                                                               |
|------------------------------|-----------------------------------------------------------------------|
| **Encryption scope**         | User-level: only the Windows user who encrypted the data can decrypt it |
| **Machine binding**          | Credentials encrypted on Machine A cannot be decrypted on Machine B   |
| **Key management**           | Windows manages the encryption keys; no key files to protect          |
| **At-rest protection**       | Credential files on disk are encrypted; cannot be read without the user's Windows session |

### Security Test Cases for Credential Handling

| Test ID  | Test Case                                                  | Expected Result                                          | Pass/Fail |
|----------|------------------------------------------------------------|---------------------------------------------------------|-----------|
| CRED-01  | Save credentials and verify file is not plaintext          | `credentials.xml` content is DPAPI-encrypted binary     |           |
| CRED-02  | Attempt to load credentials as a different Windows user    | Decryption fails with access denied error               |           |
| CRED-03  | Copy credential file to different machine and load         | Decryption fails (machine-bound)                        |           |
| CRED-04  | Verify no plaintext credentials in PowerShell transcript   | `Start-Transcript` output contains no secrets           |           |
| CRED-05  | Verify no credentials in module verbose/debug output       | `-Verbose` and `-Debug` output contains no secret values |           |
| CRED-06  | Verify credential file permissions                         | File is only accessible by the creating user             |           |
| CRED-07  | Verify credentials are not stored in PowerShell history    | `Get-History` and `PSReadLine` history contain no secrets |           |

---

## 6. API Security

### TLS Enforcement

| Test ID  | Test Case                                                  | Expected Result                                          | Pass/Fail |
|----------|------------------------------------------------------------|---------------------------------------------------------|-----------|
| API-01   | Verify all Graph API calls use HTTPS                       | No HTTP (non-TLS) requests in network trace             |           |
| API-02   | Verify Exchange Online connection uses TLS 1.2+            | Connection negotiates TLS 1.2 or higher                 |           |
| API-03   | Verify certificate validation is not bypassed              | No `[System.Net.ServicePointManager]::ServerCertificateValidationCallback` overrides |           |
| API-04   | Verify TLS version is explicitly set                       | `[Net.ServicePointManager]::SecurityProtocol` includes `Tls12` |           |

### Permission Scope Review

| Test ID  | Test Case                                                  | Expected Result                                          | Pass/Fail |
|----------|------------------------------------------------------------|---------------------------------------------------------|-----------|
| PERM-01  | Review App Registration permissions for least privilege    | Only `Read` permissions; no `ReadWrite` unless required  |           |
| PERM-02  | Verify no admin consent for unnecessary permissions        | Each permission has documented justification             |           |
| PERM-03  | Verify application vs delegated permission usage           | Application permissions used only where necessary        |           |
| PERM-04  | Verify the tool does not modify tenant configuration       | All API calls are GET/read operations; no POST/PUT/DELETE on tenant resources |           |

---

## 7. Output Security

### Assessment Report Security

Assessment reports contain sensitive information about a client's security posture, including specific vulnerabilities, misconfigured policies, and affected user/device lists.

| Test ID  | Test Case                                                  | Expected Result                                          | Pass/Fail |
|----------|------------------------------------------------------------|---------------------------------------------------------|-----------|
| OUT-01   | Verify report output directory permissions                 | Output directory is not world-readable                   |           |
| OUT-02   | Verify evidence CSVs do not contain credentials            | CSV files contain resource IDs/names only, no secrets    |           |
| OUT-03   | Verify report files are written to user-specified path only | No reports written to temp directories or unexpected locations |     |
| OUT-04   | Verify SQLite database file permissions                    | Database file is only accessible by the creating user    |           |
| OUT-05   | Verify no sensitive data in PowerShell console output      | Console output shows finding titles and counts, not detailed evidence |     |
| OUT-06   | Verify log files (if any) do not contain tenant credentials | Log output contains no Client Secret, tokens, or passwords |         |

---

## 8. Dashboard Security (Pode)

The Pode-based assessment dashboard runs as a localhost-only web server. It must not be accessible from the network.

| Test ID  | Test Case                                                  | Expected Result                                          | Pass/Fail |
|----------|------------------------------------------------------------|---------------------------------------------------------|-----------|
| DASH-01  | Verify dashboard binds to localhost only                   | Pode listener bound to `127.0.0.1` or `localhost`; not `0.0.0.0` |     |
| DASH-02  | Attempt to access dashboard from another machine           | Connection refused from remote IP                        |           |
| DASH-03  | Verify no authentication bypass on dashboard               | If auth is implemented, all routes require authentication |           |
| DASH-04  | Verify dashboard does not expose raw SQLite database       | No route serves the `.db` file directly                  |           |
| DASH-05  | Verify dashboard stops cleanly (no orphaned listeners)     | After `Stop-AssessmentDashboard`, port is released        |           |
| DASH-06  | Verify no external CDN/script dependencies                 | Dashboard serves all assets locally; no external HTTP calls |         |

---

## 9. Security Test Checklist (Pre-Release)

Execute this checklist before every release of the M365-SecurityAssessment module.

| #  | Category                  | Test                                                              | Status        | Tester | Date       |
|----|---------------------------|-------------------------------------------------------------------|---------------|--------|------------|
| 1  | Static Analysis           | Run PSScriptAnalyzer on all module scripts; no Error-level findings | Not Run     |        |            |
| 2  | Credential Leak Detection | Search all `.ps1` files for hardcoded secrets; none found          | Not Run      |        |            |
| 3  | Credential Leak Detection | Verify `config.json` is in `.gitignore`                           | Not Run       |        |            |
| 4  | Dependency Scanning       | Check all dependent modules for known vulnerabilities              | Not Run      |        |            |
| 5  | DPAPI Validation          | Save/load credential cycle works; file is encrypted                | Not Run      |        |            |
| 6  | DPAPI Validation          | Credential file cannot be read by different user                   | Not Run      |        |            |
| 7  | API Security              | All API calls use HTTPS with TLS 1.2+                             | Not Run       |        |            |
| 8  | API Security              | App Registration has least-privilege permissions                   | Not Run      |        |            |
| 9  | API Security              | Tool performs read-only operations on tenant                       | Not Run      |        |            |
| 10 | Output Security           | Reports do not contain credentials or tokens                       | Not Run      |        |            |
| 11 | Output Security           | Evidence CSVs contain resource identifiers only                    | Not Run      |        |            |
| 12 | Output Security           | No sensitive data in verbose/debug console output                  | Not Run      |        |            |
| 13 | Dashboard Security        | Pode binds to localhost only (not `0.0.0.0`)                      | Not Run       |        |            |
| 14 | Dashboard Security        | Dashboard not accessible from remote machines                      | Not Run      |        |            |
| 15 | Source Control             | No credential files or database files committed to repository     | Not Run       |        |            |

---

## 10. Findings Triage Process

### Triage Workflow

1. **Detection:** Security test identifies a vulnerability (PSScriptAnalyzer finding, credential leak, insecure configuration).
2. **Classification:** Determine severity based on impact to credential security or client data exposure.
3. **Triage:**
   - **True Positive** -- assign to developer for fix; set fix target per severity SLA.
   - **False Positive** -- document justification and suppress.
   - **Accepted Risk** -- document risk acceptance with business justification and review date.
4. **Fix:** Developer implements fix and adds regression test (Pester test or checklist item).
5. **Verification:** Re-run security test to confirm resolution.
6. **Closure:** Finding marked as resolved.

### Fix SLAs by Severity

| Severity     | Definition (Assessment Tool Context)                                   | Fix SLA             |
|--------------|------------------------------------------------------------------------|---------------------|
| **Critical** | Credential exposure; plaintext secrets in code, logs, or output        | Immediate (same day)|
| **High**     | Insecure API communication; dashboard accessible remotely; permission over-scoping | 2 business days |
| **Medium**   | Missing static analysis rule; outdated dependency with non-critical CVE | 5 business days    |
| **Low**      | Code style issue; minor PSScriptAnalyzer warning                       | Next release        |

---

## 11. Penetration Testing and DAST

### Why Traditional DAST Does Not Apply

| Aspect                       | Traditional Web App                    | M365-SecurityAssessment Module          |
|------------------------------|----------------------------------------|----------------------------------------|
| **Deployment**               | Publicly accessible web server         | Local PowerShell module; not deployed   |
| **Attack surface**           | HTTP endpoints, forms, APIs            | Localhost dashboard (if running); file system |
| **DAST applicability**       | Full DAST scan (OWASP ZAP, Burp Suite) | Not applicable for main module          |
| **Dashboard DAST**           | N/A                                    | Pode dashboard is localhost-only; DAST can run locally against `http://localhost:port` if desired |

### Recommended Approach

- **No external DAST** is needed since the tool is not a deployed web application.
- **Localhost DAST** (optional): Run OWASP ZAP against the Pode dashboard on `http://localhost:8080` to verify no common web vulnerabilities in the dashboard UI.
- **Manual security review** of the module code is the primary security testing method.
- **Periodic third-party code review** recommended for high-assurance environments.

---

## 12. Appendix

### Security Testing Contacts

| Role                          | Name                          | Contact               |
|-------------------------------|-------------------------------|-----------------------|
| Security Champion             | IntelliSecOps Security Team   | GitHub Issues         |
| Development Lead              | IntelliSecOps Dev Team        | GitHub Issues         |

### Planned Security Testing Milestones

| Milestone                                            | Target Date  | Priority |
|------------------------------------------------------|--------------|----------|
| Integrate PSScriptAnalyzer into pre-release checklist | TBD         | High     |
| Automate credential leak detection script            | TBD          | High     |
| Establish dependency scanning cadence                | TBD          | Medium   |
| Run localhost DAST scan against Pode dashboard       | TBD          | Low      |
| Schedule third-party code review                     | TBD          | Medium   |

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Unit Testing](./unit-testing.md)
- [Integration Testing](./integration-testing.md)
