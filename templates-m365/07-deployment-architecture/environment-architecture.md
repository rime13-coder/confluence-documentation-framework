# Environment Architecture (Dev / Test / Production)

| **Metadata**     | **Value**                                              |
|------------------|--------------------------------------------------------|
| Page Title       | Environment Architecture (Dev / Test / Production)     |
| Last Updated     | 2026-02-15                                             |
| Status           | IN PROGRESS                                            |
| Owner            | IntelliSec Solutions                                   |

---

## 1. Document Purpose

This document describes the environment architecture for the M365 Security Assessment Automation tool. Unlike cloud-hosted applications with distinct Azure subscriptions or resource groups per environment, this tool runs locally on Windows workstations. Environments are distinguished by the workstation purpose (development vs. production use), the target M365 tenant (test vs. client), and the handling of assessment outputs. This document defines the environment strategy, configuration differences, and data isolation practices.

---

## 2. Environment Overview

| Environment   | Purpose                                                  | Target Tenant                  | Workstation                          | Data Handling              | Status           |
|---------------|----------------------------------------------------------|--------------------------------|--------------------------------------|----------------------------|------------------|
| Development   | Active development, debugging, new check authoring       | M365 test tenant (IntelliSec)  | Developer workstation                | Test data, disposable      | Active           |
| Test          | Validation of checks against known-good/known-bad config | Dedicated M365 test tenant     | Developer or CI workstation          | Seeded test data           | PLANNED          |
| Production    | Client security assessments                              | Client M365 tenants            | Consultant workstations              | Client data, archived      | Active           |

> **Key Distinction:** There is no shared cloud infrastructure between environments. Each environment is simply a workstation running the same PowerShell module against a different M365 tenant. Environment separation is achieved through credential profiles, output directories, and operational procedures rather than infrastructure isolation.

---

## 3. Architecture Diagrams

### 3.1 Development Environment

```
Developer Workstation
+---------------------------------------------------------------+
|  PowerShell ISE / VS Code                                     |
|  +----------------------------------------------------------+ |
|  |  M365 Assessment Module (source code, editable)          | |
|  |  +-----------------------------------------------------+ | |
|  |  |  Module under development                            | | |
|  |  |  - New checks being authored                         | | |
|  |  |  - Pester tests (3.4.0) running locally              | | |
|  |  |  - Debugging with breakpoints                        | | |
|  |  +-----------------------------------------------------+ | |
|  |  |  Credential Profile: dev-test-tenant                 | | |
|  |  |  SQLite DB: dev assessment data                      | | |
|  |  |  Output: ./dev-output/ (not archived)                | | |
|  |  +-----------------------------------------------------+ | |
|  +----------------------------------------------------------+ |
|                                                               |
|  --> IntelliSec M365 Test Tenant (dev data)                  |
+---------------------------------------------------------------+
```

### 3.2 Test Environment (Planned)

```
Test Workstation / CI Runner
+---------------------------------------------------------------+
|  PowerShell (automated execution)                             |
|  +----------------------------------------------------------+ |
|  |  M365 Assessment Module (release candidate)              | |
|  |  +-----------------------------------------------------+ | |
|  |  |  Full assessment run against seeded tenant           | | |
|  |  |  - All 87+ checks executed                           | | |
|  |  |  - Expected results compared to baseline             | | |
|  |  |  - Regression detection                              | | |
|  |  +-----------------------------------------------------+ | |
|  |  |  Credential Profile: test-tenant                     | | |
|  |  |  SQLite DB: test assessment data                     | | |
|  |  |  Output: ./test-output/ (compared to baseline)       | | |
|  |  +-----------------------------------------------------+ | |
|  +----------------------------------------------------------+ |
|                                                               |
|  --> Dedicated M365 Test Tenant (seeded security config)     |
+---------------------------------------------------------------+
```

### 3.3 Production Environment

```
Consultant Workstation (one per consultant)
+---------------------------------------------------------------+
|  PowerShell (operational execution)                           |
|  +----------------------------------------------------------+ |
|  |  M365 Assessment Module (released version)               | |
|  |  +-----------------------------------------------------+ | |
|  |  |  Full assessment against client tenant               | | |
|  |  |  - All selected modules executed                     | | |
|  |  |  - Evidence exported as CSV                          | | |
|  |  |  - Reports generated (HTML/PDF/DOCX)                 | | |
|  |  +-----------------------------------------------------+ | |
|  |  |  Credential Profile: client-{name}                   | | |
|  |  |  SQLite DB: production assessment data               | | |
|  |  |  Output: ./Engagements/YYYY-MM-DD_ClientName/        | | |
|  |  +-----------------------------------------------------+ | |
|  +----------------------------------------------------------+ |
|                                                               |
|  --> Client M365 Tenant (real production data)               |
+---------------------------------------------------------------+
```

---

## 4. Environment Comparison Table

| Attribute                     | Development                              | Test (Planned)                            | Production                               |
|-------------------------------|------------------------------------------|-------------------------------------------|------------------------------------------|
| **Status**                    | Active                                   | PLANNED                                   | Active                                   |
| **Workstation**               | Developer machine                        | Dedicated test machine or CI runner       | Consultant workstation                   |
| **Module Source**             | Local source code (Git working copy)     | Released module version                   | Released module version                  |
| **Target M365 Tenant**       | IntelliSec test tenant                   | Dedicated test tenant (seeded config)     | Client tenant (real production data)     |
| **Data Source**               | Test/synthetic data                      | Seeded security configurations            | Real client M365 configuration           |
| **Credential Profile**       | dev-test-tenant                          | test-tenant                               | client-{name} (per client)               |
| **DPAPI Encryption**         | Bound to developer user + machine        | Bound to test user + machine              | Bound to consultant user + machine       |
| **Assessment Output Path**   | ./dev-output/ (ephemeral)                | ./test-output/ (compared to baseline)     | ./Engagements/YYYY-MM-DD_ClientName/     |
| **Output Retention**         | Disposable (deleted after dev sessions)  | Retained for regression comparison        | Archived per engagement (permanent)      |
| **Evidence Export**           | Optional (for development validation)    | Full export (validated against baseline)  | Full export (audit-grade, delivered to client) |
| **Report Generation**        | Selective (test specific formats)        | Full (all formats validated)              | Full (HTML + PDF + DOCX for delivery)    |
| **Web Dashboard**            | localhost:8080 (optional)                | localhost:8080 (automated validation)     | localhost:8080 (real-time monitoring)     |
| **SQLite Database**          | Dev database (reset frequently)          | Test database (reset per test run)        | Production database (per engagement)     |
| **Pester Tests**             | Active (run during development)          | Full suite (all checks validated)         | Not executed (operational use only)      |
| **Module Import**            | Import-Module ./path/to/module.psd1      | Import-Module M365Assessment              | Import-Module M365Assessment             |
| **Debugging**                | Enabled (breakpoints, verbose output)    | Disabled (clean execution)               | Disabled (standard output)               |

---

## 5. Assessment Output Isolation

### 5.1 Engagement Directory Structure

Each assessment engagement produces output in a self-contained timestamped directory. Client data is never commingled across engagements.

```
Engagements/
+-- 2026-01-15_ClientAlpha/
|   +-- findings/
|   +-- evidence/
|   +-- reports/
|   +-- logs/
|   +-- assessment-metadata.json
|
+-- 2026-02-01_ClientBeta/
|   +-- findings/
|   +-- evidence/
|   +-- reports/
|   +-- logs/
|   +-- assessment-metadata.json
|
+-- 2026-02-15_ClientGamma/
    +-- findings/
    +-- evidence/
    +-- reports/
    +-- logs/
    +-- assessment-metadata.json
```

### 5.2 Data Isolation Controls

| Control                               | Implementation                                              |
|---------------------------------------|-------------------------------------------------------------|
| Client data separation                | Each engagement gets a unique timestamped directory          |
| No cross-client data access           | Credential profiles are per-tenant; no shared credentials   |
| SQLite isolation                      | Assessment database is per-engagement or cleared between runs |
| Evidence integrity                    | CSV evidence files are immutable after export                |
| Report binding                        | Reports reference only data from the associated engagement  |
| Cleanup                               | Old engagement data can be archived or securely deleted      |

---

## 6. Environment-Specific Configuration

### 6.1 Configuration Files

| Configuration File           | Purpose                                              | Environment Variation                          |
|------------------------------|------------------------------------------------------|------------------------------------------------|
| assessment-defaults.json     | Default assessment parameters (modules, severity thresholds) | Same across environments                 |
| findings.json                | Control definitions, expected findings structure     | Same across environments                       |
| module.json                  | Module manifest (version, dependencies, exports)     | Same across environments (versioned)           |
| Credential profiles          | Encrypted tenant connection credentials              | Different per environment (different tenants)  |

### 6.2 Environment Variables / Runtime Configuration

| Setting                      | Development                     | Test (Planned)                  | Production                      |
|------------------------------|---------------------------------|---------------------------------|---------------------------------|
| Verbose Output               | Enabled                         | Disabled                        | Disabled                        |
| Debug Logging                | Enabled                         | Enabled (for test tracing)      | Disabled (standard logging)     |
| Assessment Modules           | Selective (module under dev)    | All active modules              | All or selected per engagement  |
| Output Format                | Console + optional files        | All formats (validation)        | All formats (client delivery)   |
| Dashboard Auto-Start         | Optional                        | Optional                        | Recommended                     |

---

## 7. No Shared Infrastructure

| Aspect                        | Cloud-Hosted Application                     | This Tool                                    |
|-------------------------------|----------------------------------------------|----------------------------------------------|
| Environment isolation         | Separate Azure subscriptions or resource groups | Separate workstations and credential profiles |
| Shared services               | Shared VNet, shared Key Vault, shared ACR    | None -- fully independent workstations       |
| Environment promotion         | CI/CD pipeline promotes artifacts across envs | Module version release (Git tag / copy)      |
| Database sharing              | Shared database server, separate databases   | Local SQLite per workstation, no sharing     |
| Configuration management      | Azure App Configuration, Key Vault           | Local JSON files + DPAPI credential profiles |
| Network dependencies          | VNet peering, private endpoints              | Direct outbound HTTPS to M365 APIs           |

---

## 8. Environment Promotion Flow

### 8.1 Module Release Flow

```
Development (Developer Workstation)
   |
   |  Code changes committed to Git
   |  Pester tests pass locally
   |
   v
Test (Planned -- Test Workstation)
   |
   |  Full assessment run against seeded test tenant
   |  Results compared to expected baseline
   |  All 87+ checks produce expected findings
   |  All report formats generated successfully
   |
   v
Production (Consultant Workstations)
   |
   |  Released module version deployed
   |  Consultant runs assessment against client tenant
   |
   v
Client Deliverables (Reports + Evidence)
```

### 8.2 Promotion Checklist

- [ ] All Pester unit tests pass on the development workstation
- [ ] Full assessment completes against the test tenant without errors
- [ ] Findings match expected baseline for seeded test configurations
- [ ] Evidence CSV files are generated for all evaluated controls
- [ ] HTML, PDF, and DOCX reports generate without errors
- [ ] Web dashboard displays all findings and metrics correctly
- [ ] Module version number incremented in module.json
- [ ] Release notes documented for changes since last version
- [ ] Module deployed to consultant workstations (Git pull or file copy)

---

## 9. Test Tenant Configuration (Planned)

### 9.1 Seeded Security Configurations

The dedicated M365 test tenant should be configured with known-good and known-bad security settings to validate check accuracy.

| Domain             | Seeded Configuration                                          | Expected Check Result     |
|--------------------|---------------------------------------------------------------|---------------------------|
| EntraID            | Conditional Access policy with MFA enabled for all users      | Compliant                 |
| EntraID            | Legacy authentication NOT blocked                             | NonCompliant (Critical)   |
| EntraID            | Break glass account without proper exclusions                 | NonCompliant (High)       |
| DeviceManagement   | Intune compliance policy requiring BitLocker                  | Compliant                 |
| DeviceManagement   | No Windows Update ring configured                             | NonCompliant (Medium)     |
| EmailProtection    | DMARC record set to p=reject                                  | Compliant                 |
| EmailProtection    | No DKIM signing configured                                    | NonCompliant (High)       |
| TeamsSharePoint    | External sharing disabled for SharePoint                      | Compliant                 |
| TeamsSharePoint    | Guest access enabled for Teams with no restrictions           | NonCompliant (Medium)     |

### 9.2 Baseline Expected Results

A baseline findings file should be maintained that documents the expected assessment outcome for the seeded test tenant. After each test run, the actual findings are compared to this baseline to detect regressions or unintended changes in check logic.

---

## 10. Revision History

| Date           | Author               | Changes Made                                                  |
|----------------|-----------------------|---------------------------------------------------------------|
| 2026-02-15     | IntelliSec Solutions  | Initial document adapted for M365 Security Assessment Automation (local PowerShell tool) |
