# Environment Strategy

| **Page Title**   | Environment Strategy                                       |
|------------------|------------------------------------------------------------|
| **Last Updated** | 2026-02-15                                                 |
| **Status**       | IN PROGRESS - Development and production environments active |
| **Owner**        | IntelliSecOps DevOps Team                                  |
| **Module**       | M365-SecurityAssessment v1.0.0                             |

---

## 1. Environment Inventory

| Environment         | Purpose                                        | Infrastructure              | Status         | Data Type                            |
|---------------------|------------------------------------------------|-----------------------------|----------------|--------------------------------------|
| **Development**     | Module development, testing, and debugging     | Local workstation + test M365 tenant | IN PROGRESS | Test M365 tenant data (synthetic)   |
| **Production**      | Client security assessments                    | Client assessment workstations       | IN PROGRESS | Live client M365 tenant data        |
| **CI Validation**   | Automated pipeline testing (RECOMMENDED)       | GitHub Actions `windows-latest` runner | NOT STARTED | Mock data / no tenant connection    |

---

## 2. Environment Details

### 2.1 Development Environment

> **STATUS: IN PROGRESS** -- Active development environment on local workstations.

| Dimension                   | Detail                                                                |
|-----------------------------|-----------------------------------------------------------------------|
| **Workstation OS**          | Windows 10/11 Enterprise                                              |
| **PowerShell version**      | Windows PowerShell 5.1 (primary), PowerShell 7.x (optional)          |
| **Module location**         | Local git clone (`git clone <repo-url>`)                              |
| **Module loading**          | `Import-Module ./M365-SecurityAssessment.psd1 -Force`                 |
| **M365 tenant**             | Dedicated test tenant for development and validation                  |
| **Pester testing**          | Local `Invoke-Pester -Path ./Tests/`                                  |
| **Database**                | Local SQLite file (created by PSSQLite at runtime)                    |
| **Report output**           | Local filesystem (`./Reports/` or timestamped directory)              |
| **Dependencies installed**  | Manually via `Install-Module` for each required module                |
| **Authentication**          | Interactive login (Connect-MgGraph, Connect-ExchangeOnline)           |

#### Development Environment Setup

```powershell
# One-time setup for development workstation
Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force
Set-PSRepository -Name PSGallery -InstallationPolicy Trusted

# Install dependencies
Install-Module Microsoft.Graph -Force -Scope CurrentUser
Install-Module ExchangeOnlineManagement -Force -Scope CurrentUser
Install-Module MicrosoftTeams -Force -Scope CurrentUser
Install-Module Pode -Force -Scope CurrentUser
Install-Module PSSQLite -Force -Scope CurrentUser
Install-Module PSWriteWord -Force -Scope CurrentUser
Install-Module ImportExcel -Force -Scope CurrentUser
Install-Module Pester -RequiredVersion 3.4.0 -Force -Scope CurrentUser -SkipPublisherCheck

# Clone and import module
git clone https://github.com/IntelliSecOps/M365-SecurityAssessment.git
Import-Module ./M365-SecurityAssessment/M365-SecurityAssessment.psd1 -Force
```

### 2.2 Production Environment (Client Assessment Workstations)

> **STATUS: IN PROGRESS** -- Active assessment workstations used for client engagements.

| Dimension                   | Detail                                                                |
|-----------------------------|-----------------------------------------------------------------------|
| **Workstation OS**          | Windows 10/11 Enterprise (client-provided or assessor laptop)         |
| **PowerShell version**      | Windows PowerShell 5.1                                                |
| **Module location**         | Local git clone on assessment workstation                             |
| **Module loading**          | `Import-Module ./M365-SecurityAssessment.psd1`                        |
| **M365 tenant**             | Client production M365 tenant (read-only access)                      |
| **Assessment output**       | Timestamped engagement directory (see Section 6)                      |
| **Database**                | Per-engagement SQLite file for controls tracking                      |
| **Report generation**       | Word (PSWriteWord) and Excel (ImportExcel) to engagement directory    |
| **Authentication**          | Client-delegated app registration or interactive consent              |
| **Network requirements**    | HTTPS outbound to Microsoft Graph, Exchange Online, Teams endpoints   |

#### Production Environment Security Controls

| Control                          | Implementation                                                   |
|----------------------------------|------------------------------------------------------------------|
| **Least privilege access**       | Read-only Graph and Exchange permissions for assessment          |
| **No persistent credentials**    | Interactive auth or short-lived tokens; no stored secrets        |
| **Data handling**                | Assessment output stored locally; delivered to client securely   |
| **Module integrity**             | Verify git commit SHA matches expected release                   |
| **Audit trail**                  | Assessment run logs with timestamps and operator identity        |

### 2.3 CI Validation Environment (Recommended)

> **STATUS: NOT STARTED** -- Recommended GitHub Actions-based validation environment.

| Dimension                   | Detail                                                                |
|-----------------------------|-----------------------------------------------------------------------|
| **Runner**                  | GitHub-hosted `windows-latest`                                        |
| **PowerShell version**      | Windows PowerShell 5.1 (pre-installed on Windows runners)             |
| **M365 tenant connection**  | None (tests use mocks and local data only)                            |
| **Dependencies**            | Installed fresh on each run via `Install-Module`                      |
| **Test execution**          | `Invoke-Pester` with NUnit XML output                                 |
| **Lifetime**                | Ephemeral (destroyed after workflow completes)                        |
| **Cost**                    | Free tier: 2,000 minutes/month for private repos                     |

---

## 3. Test Tenant Configuration

### Dedicated M365 Test Tenant

A dedicated M365 test tenant is used for development and validation of assessment logic. This tenant is configured to mirror common client configurations.

| Configuration Item              | Value / Setting                                               |
|---------------------------------|---------------------------------------------------------------|
| **Tenant name**                 | IntelliSecOps Test (e.g., `intellisecopstest.onmicrosoft.com`) |
| **License type**                | Microsoft 365 E5 Developer (or E3 + add-ons)                 |
| **User accounts**               | 10-25 test users with various role assignments               |
| **Exchange Online**             | Configured with test mailboxes, transport rules, DMARC/DKIM  |
| **Teams**                       | Configured with meeting policies, messaging policies         |
| **Conditional Access**          | Sample policies (baseline, MFA, device compliance)           |
| **Information Protection**      | Sensitivity labels, DLP policies configured                   |
| **App registration**            | Dedicated app for module testing with appropriate Graph scopes|

### Test Tenant Maintenance Schedule

| Task                                    | Frequency    | Responsible Party          |
|-----------------------------------------|--------------|----------------------------|
| Verify license status                   | Monthly      | IntelliSecOps DevOps Team  |
| Reset test user passwords               | Quarterly    | IntelliSecOps DevOps Team  |
| Update conditional access policies      | As needed    | IntelliSecOps Security     |
| Validate app registration permissions   | Quarterly    | IntelliSecOps DevOps Team  |
| Review and refresh test data            | Before major release | Module lead           |

### Required Microsoft Graph API Permissions (Test App Registration)

| Permission                              | Type          | Purpose                                    |
|-----------------------------------------|---------------|--------------------------------------------|
| `User.Read.All`                         | Application   | Read user profiles and assignments         |
| `Policy.Read.All`                       | Application   | Read conditional access and auth policies  |
| `SecurityEvents.Read.All`               | Application   | Read security alerts and findings          |
| `Mail.Read`                             | Application   | Read mail flow rules and transport config  |
| `Team.ReadBasic.All`                    | Application   | Read Teams configuration                   |
| `InformationProtectionPolicy.Read.All`  | Application   | Read sensitivity labels and DLP policies   |
| `Organization.Read.All`                 | Application   | Read organization and tenant settings      |

---

## 4. Module Versioning Strategy

### Semantic Versioning

| Version Component | Rule                                                                   | Current  |
|-------------------|------------------------------------------------------------------------|----------|
| **MAJOR**         | Increment for breaking changes to exported functions or parameters     | 1        |
| **MINOR**         | Increment for new assessment capabilities or exported functions        | 0        |
| **PATCH**         | Increment for bug fixes, finding definition updates, documentation    | 0        |
| **Full version**  | `MAJOR.MINOR.PATCH`                                                    | `1.0.0`  |

### Version Source of Truth

The single source of truth for the module version is the `ModuleVersion` field in `M365-SecurityAssessment.psd1`. All other version references (git tags, GitHub Releases, package names) must match this value.

```powershell
# Verify current module version
(Test-ModuleManifest ./M365-SecurityAssessment.psd1).Version
# Output: 1.0.0
```

### Pre-Release Version Convention (Recommended)

| Suffix    | Purpose                           | Example        | PowerShell Gallery Compatible |
|-----------|-----------------------------------|----------------|-------------------------------|
| `-alpha`  | Early development, unstable       | `1.1.0-alpha`  | Yes (Prerelease tag in .psd1) |
| `-beta`   | Feature-complete, needs testing   | `1.1.0-beta`   | Yes                           |
| `-rc`     | Release candidate, final testing  | `1.1.0-rc1`    | Yes                           |
| (none)    | Stable release                    | `1.1.0`        | Yes                           |

---

## 5. Dependency Version Pinning

### Current Dependencies (from .psd1 RequiredModules)

| Module                       | Minimum Version | Pinned Version | Pin Strategy           | Notes                              |
|------------------------------|-----------------|----------------|------------------------|------------------------------------|
| Microsoft.Graph              | Not pinned      | N/A            | Use latest stable      | Frequent updates; test before bump |
| ExchangeOnlineManagement     | Not pinned      | N/A            | Use latest stable      | Microsoft-managed cadence          |
| MicrosoftTeams               | Not pinned      | N/A            | Use latest stable      | Microsoft-managed cadence          |
| Pode                         | Not pinned      | N/A            | Use latest stable      | Dashboard web server               |
| PSSQLite                     | Not pinned      | N/A            | Use latest stable      | Stable API, infrequent updates     |
| PSWriteWord                  | Not pinned      | N/A            | Use latest stable      | Report generation                  |
| ImportExcel                  | Not pinned      | N/A            | Use latest stable      | Report generation                  |
| Pester                       | 3.4.0           | 3.4.0          | Exact version pinned   | Test syntax depends on v3          |

### Recommended Dependency Pinning Strategy

| Strategy                         | When to Use                                    | Example                              |
|----------------------------------|------------------------------------------------|--------------------------------------|
| **Exact version pin**            | Test framework, breaking API changes expected  | `Pester -RequiredVersion 3.4.0`     |
| **Minimum version**              | Stable dependencies with backward compat       | `ImportExcel -MinimumVersion 7.0.0`  |
| **Latest stable**                | Microsoft-managed modules with frequent updates| `Microsoft.Graph` (latest)           |

### Dependency Update Process (Recommended)

| Step | Action                                                         | Frequency       |
|------|----------------------------------------------------------------|-----------------|
| 1    | Check for updated versions of all dependencies                 | Monthly         |
| 2    | Update one dependency at a time in a feature branch            | As needed       |
| 3    | Run full Pester test suite after each dependency update        | Per update      |
| 4    | Verify assessment output matches expected results              | Per update      |
| 5    | If tests pass, merge dependency update to main                 | After validation|
| 6    | Document dependency version change in changelog                | Per update      |

---

## 6. Assessment Output Isolation

### Per-Engagement Timestamped Directories

Each assessment engagement produces output in an isolated timestamped directory to prevent data mixing between client engagements.

#### Directory Structure

```
AssessmentOutput/
  |
  +-- 2026-02-15_ClientA_CMMC-L2/
  |     |-- ControlsDB.sqlite          (SQLite database for this engagement)
  |     |-- Assessment-Report.docx      (Word report)
  |     |-- Findings-Matrix.xlsx        (Excel findings spreadsheet)
  |     |-- RawData/
  |     |     |-- GraphAPI-Users.json
  |     |     |-- GraphAPI-Policies.json
  |     |     |-- Exchange-TransportRules.json
  |     |     |-- Teams-Policies.json
  |     |-- Logs/
  |           |-- assessment-run.log
  |
  +-- 2026-02-10_ClientB_CMMC-L1/
  |     |-- ... (same structure)
  |
  +-- 2026-01-28_ClientC_CMMC-L2/
        |-- ... (same structure)
```

#### Directory Naming Convention

```
<YYYY-MM-DD>_<ClientName>_<AssessmentType>/
```

| Component          | Format                    | Example                |
|--------------------|---------------------------|------------------------|
| Date               | `YYYY-MM-DD`              | `2026-02-15`           |
| Client name        | PascalCase, no spaces     | `ClientA`              |
| Assessment type    | Hyphenated descriptor     | `CMMC-L2`              |

### Data Isolation Requirements

| Requirement                         | Implementation                                                 |
|-------------------------------------|----------------------------------------------------------------|
| **No cross-client data access**     | Each engagement has its own SQLite DB and output directory      |
| **Complete output per engagement**  | All reports, raw data, and logs contained in one directory      |
| **Portable output**                 | Entire directory can be zipped and delivered to client          |
| **No shared state**                 | Module re-initializes for each engagement run                   |
| **Secure deletion**                 | After client delivery, local copies securely deleted            |

---

## 7. Environment Parity Matrix

| Dimension                 | Development                      | CI Validation (Recommended)      | Production (Client)              |
|---------------------------|----------------------------------|----------------------------------|----------------------------------|
| **OS**                    | Windows 10/11                    | Windows Server (GitHub runner)   | Windows 10/11                    |
| **PowerShell**            | 5.1                              | 5.1                              | 5.1                              |
| **Module version**        | Latest from `main` branch        | Commit under test                | Specific release version         |
| **M365 tenant**           | Test tenant (synthetic data)     | None (mocks only)                | Client production tenant         |
| **Database**              | Local SQLite                     | In-memory or temp SQLite         | Per-engagement SQLite            |
| **Network access**        | Full internet                    | GitHub runner network            | Client network (HTTPS outbound)  |
| **Authentication**        | Interactive (test tenant)        | None (unit tests only)           | Delegated or app-only (client)   |
| **Report output**         | Local `./Reports/`               | Not generated (tests only)       | Per-engagement timestamped dir   |
| **Pester tests**          | Manual invocation                | Automated (CI workflow)          | Not run (production use only)    |

---

## 8. Environment Lifecycle

| Phase              | Development                      | CI Validation (Recommended)      | Production (Client)              |
|--------------------|----------------------------------|----------------------------------|----------------------------------|
| **Setup**          | `git clone` + `Install-Module`   | Automated (workflow steps)       | Copy module to workstation       |
| **Configuration**  | Connect to test tenant           | No configuration needed          | Register client app, consent     |
| **Execution**      | Run assessments against test     | Run Pester tests only            | Run assessments against client   |
| **Output**         | Review in `./Reports/`           | Test results uploaded as artifact| Deliver engagement directory     |
| **Teardown**       | N/A (persistent)                 | Automatic (ephemeral runner)     | Secure-delete local assessment data |

---

## 9. Access Control per Environment

| Environment         | Who Has Access                     | Access Method                      | Data Sensitivity       |
|---------------------|------------------------------------|------------------------------------|------------------------|
| **Development**     | Module developers                  | GitHub repo access + local clone   | Low (test data)        |
| **CI Validation**   | Automated (GitHub Actions)         | Repository permissions             | None (no tenant data)  |
| **Production**      | Authorized assessors only          | Client-authorized workstation      | High (client PII/CUI)  |

### Production Access Controls

| Control                              | Enforcement                                                    |
|--------------------------------------|----------------------------------------------------------------|
| Assessor authorization               | Named individuals approved per engagement                      |
| Workstation security                  | Full-disk encryption, endpoint protection, patch current       |
| Module version control                | Use specific tagged release; verify SHA integrity              |
| M365 permissions                      | Minimum read-only Graph permissions as documented              |
| Assessment data handling              | Encrypted in transit and at rest; secure deletion after delivery|

---

## 10. Cost Management

| Environment         | Monthly Cost (est.)     | Cost Driver                                              |
|---------------------|-------------------------|----------------------------------------------------------|
| **Development**     | ~$0 (module) + ~$25/mo (test tenant license) | M365 developer tenant subscription        |
| **CI Validation**   | $0 (within free tier)   | GitHub Actions free minutes (2,000/month for private repos) |
| **Production**      | $0 (module is free)     | No infrastructure cost; runs on existing workstations    |

---

## 11. Implementation Roadmap

| Phase   | Milestone                                          | Priority  | Estimated Effort | Status       |
|---------|----------------------------------------------------|-----------|------------------|--------------|
| Phase 1 | Document current environment configurations        | High      | 2-3 hours        | IN PROGRESS  |
| Phase 2 | Standardize test tenant configuration              | High      | 4-6 hours        | NOT STARTED  |
| Phase 3 | Create CI validation environment (GitHub Actions)  | High      | 4-8 hours        | NOT STARTED  |
| Phase 4 | Define dependency version pinning policy           | Medium    | 2-3 hours        | NOT STARTED  |
| Phase 5 | Automate assessment output directory creation      | Low       | 2-3 hours        | NOT STARTED  |

---

## 12. Appendix

### Environment Quick Reference

| Environment    | M365 Tenant        | Module Source               | Pester Tests | Output Location                       |
|----------------|---------------------|-----------------------------|--------------|---------------------------------------|
| Development    | Test tenant         | `git clone` (main branch)   | Manual       | `./Reports/`                          |
| CI Validation  | None (mocks)        | Checkout (PR/push commit)   | Automated    | GitHub Actions artifacts              |
| Production     | Client tenant       | Tagged release (git clone)  | Not run      | `AssessmentOutput/<timestamp>/`       |

### Useful Commands

```powershell
# Check installed module versions
Get-Module -ListAvailable M365-SecurityAssessment
Get-Module -ListAvailable Microsoft.Graph, ExchangeOnlineManagement, MicrosoftTeams, Pode, PSSQLite, PSWriteWord, ImportExcel, Pester

# Verify module manifest
Test-ModuleManifest ./M365-SecurityAssessment.psd1

# Check current Pester version
(Get-Module Pester -ListAvailable).Version

# Run tests with verbose output
Invoke-Pester -Path ./Tests/ -Verbose
```

### Related Pages

- [CI/CD Strategy Overview](./github-actions-overview.md)
- [Build & Validation Pipeline](./build-pipeline.md)
- [Release & Distribution Pipeline](./release-pipeline.md)
- [Test Strategy](../06-testing/test-strategy.md)
