# Test Strategy

| **Page Title**   | Test Strategy -- M365 Security Assessment Automation |
|------------------|------------------------------------------------------|
| **Last Updated** | 2026-02-15                                           |
| **Status**       | IN PROGRESS                                          |
| **Owner**        | IntelliSecOps Development Team                       |

---

## 1. Testing Philosophy and Principles

The M365-SecurityAssessment module (v1.0.0) is a PowerShell-based tool that connects to live Microsoft 365 tenants via Graph API, Exchange Online, and Teams to perform automated security assessments. Because assessment results directly inform security decisions for client organizations, **testing must validate assessment logic thoroughly before the tool is run against production tenants.**

Our testing philosophy is grounded in the following principles:

1. **Validate before you assess** -- every check function must be proven correct with known-good and known-bad inputs before it evaluates a real client tenant. Incorrect findings erode trust and credibility.
2. **Mock the cloud, test the logic** -- unit tests isolate assessment logic from live API dependencies by mocking Graph API, Exchange Online, and Teams responses. This ensures tests are fast, repeatable, and do not require network access.
3. **Test at the right level** -- use the testing pyramid adapted for a PowerShell module: heavy investment in Pester unit tests, targeted manual validation against a test tenant, and lightweight integration checks for module loading and credential handling.
4. **Tests are first-class code** -- test scripts follow the same coding standards and review expectations as production module code. Test naming, structure, and documentation are maintained rigorously.
5. **Deterministic and repeatable** -- tests produce the same result regardless of execution environment or order. Mock data is embedded in test files; no external state is required for unit tests.
6. **Fail fast, fix fast** -- all Pester tests must pass before any release. A single failing test blocks the release until resolved.

### Current State

Testing for the M365-SecurityAssessment module is **in progress**. The project has **7 test files containing 71+ Pester tests** that validate core assessment logic. Tests are executed manually via `Invoke-Pester`. There is no CI/CD pipeline; tests are run locally before releases. Integration testing against live M365 APIs is performed manually against a test tenant.

---

## 2. Testing Pyramid (Adapted for PowerShell Module)

```
          /\
         /  \        Manual Validation         (~5% of effort)
        /    \       Run tool against test M365 tenant;
       /      \      verify findings match known configuration
      /--------\
     /          \    Integration Tests          (~15% of effort)
    /            \   Module import, credential cycle,
   /              \  collector -> check -> finding flow
  /----------------\
 /                  \ Unit Tests (Pester)       (~80% of effort)
/                    \ Individual check functions,
/______________________\ DB operations, finding generation
```

| Test Level                | Proportion | Current State                          | Tooling                                |
|---------------------------|------------|----------------------------------------|----------------------------------------|
| **Unit (Pester)**         | ~80%       | **71+ tests implemented across 7 files** | Pester 3.4.0                          |
| **Integration**           | ~15%       | Manual only (no automated integration) | Manual execution against test tenant   |
| **Manual Validation**     | ~5%        | Ad-hoc against test M365 tenant        | PowerShell console + M365 Admin Center |

---

## 3. Test Scope by Module

| Module                     | # Automated Tests | Coverage Status        | Test File(s)                          | Notes                                       |
|----------------------------|-------------------|------------------------|---------------------------------------|---------------------------------------------|
| **ControlsDB**             | 34                | Good                   | `ControlsDB.Tests.ps1`               | SQLite CRUD, JSON sync, schema validation   |
| **EmailProtection**        | 37                | Good                   | `EmailProtection.Tests.ps1`          | SPF/DKIM/DMARC, anti-spam, Safe Links       |
| **ApplicationProtection**  | TBD               | Stub / In Progress     | `ApplicationProtection.Tests.ps1`    | App protection policy checks                |
| **DataProtection**         | TBD               | Stub / In Progress     | `DataProtection.Tests.ps1`           | DLP, sensitivity labels, retention          |
| **FinSecOps**              | TBD               | Stub / In Progress     | `FinSecOps.Tests.ps1`               | Financial security operations checks        |
| **TeamsSharePoint**        | TBD               | Stub / In Progress     | `TeamsSharePoint.Tests.ps1`         | Teams/SharePoint configuration checks       |
| **VulnerabilityManagement**| TBD               | Stub / In Progress     | `VulnerabilityManagement.Tests.ps1` | Vulnerability management checks             |
| **EntraID**                | 0 (manual only)   | Definition only (39 findings defined) | N/A                          | Checks defined, tests not yet written       |
| **DeviceManagement**       | 0 (manual only)   | Definition only (18 findings defined) | N/A                          | Checks defined, tests not yet written       |

### Module Finding Counts (Assessment Coverage)

| Module                     | Findings Defined | Collectors Implemented | Checks Implemented |
|----------------------------|-----------------|------------------------|---------------------|
| **EntraID**                | 39              | Yes                    | Yes                 |
| **DeviceManagement**       | 18              | Yes                    | Yes                 |
| **EmailProtection**        | 13              | Yes                    | Yes                 |
| **TeamsSharePoint**        | 17              | Yes                    | Yes                 |
| **ApplicationProtection**  | Definition only | Partial                | Partial             |
| **DataProtection**         | Definition only | Partial                | Partial             |
| **FinSecOps**              | Definition only | Partial                | Partial             |
| **VulnerabilityManagement**| Definition only | Partial                | Partial             |

---

## 4. Test Types Matrix

| Test Type                  | Scope                                       | Tools                    | Current State        | Run Frequency              | Responsibility     |
|----------------------------|---------------------------------------------|--------------------------|----------------------|----------------------------|--------------------|
| **Unit (Pester)**          | Individual check functions, DB operations   | Pester 3.4.0             | **71+ tests**        | Before every release (manual) | Developers      |
| **Module Load**            | Import-Module, dependency resolution        | Manual PowerShell        | Manual               | Before every release       | Developers         |
| **Credential Cycle**       | Save/load DPAPI-encrypted credentials       | Manual PowerShell        | Manual               | Before every release       | Developers         |
| **Tenant Connection**      | Graph API, Exchange Online, Teams connect   | Manual PowerShell        | Manual               | Before every release       | Developers         |
| **Full Assessment Run**    | End-to-end: collect -> check -> report      | Manual PowerShell        | Manual               | Before every release       | Developers + QA    |
| **Security Review**        | Credential handling, output security        | Manual review            | Ad-hoc               | Before every release       | Security lead      |

---

## 5. Test Environment Requirements

| Requirement                  | Details                                                              |
|------------------------------|----------------------------------------------------------------------|
| **Operating System**         | Windows 10/11 or Windows Server 2016+                                |
| **PowerShell**               | PowerShell 5.1+ (Desktop edition; not PowerShell Core)               |
| **Pester Module**            | Pester 3.4.0 (installed via `Install-Module Pester -RequiredVersion 3.4.0`) |
| **SQLite Assembly**           | `System.Data.SQLite.dll` (bundled with module for ControlsDB tests) |
| **Test M365 Tenant**         | Required for integration/manual tests only; App Registration with Graph API, Exchange Online, and Teams permissions |
| **Network Access**           | Not required for unit tests (all API calls mocked); required for integration tests |
| **Admin Privileges**         | Not required for unit tests; may be required for module installation |

### Test M365 Tenant Configuration (for Integration Tests)

| Component                    | Requirement                                                          |
|------------------------------|----------------------------------------------------------------------|
| **App Registration**         | Client ID, Tenant ID, Client Secret with delegated + application permissions |
| **Graph API Permissions**    | `User.Read.All`, `Directory.Read.All`, `DeviceManagementConfiguration.Read.All`, `Policy.Read.All`, `SecurityEvents.Read.All` |
| **Exchange Online**          | Exchange Administrator role; test mailboxes with known SPF/DKIM/DMARC configurations |
| **Teams**                    | Teams Administrator role; test teams with known guest access and sharing policies |
| **Test Data**                | Known-state security configurations to validate findings against     |

---

## 6. Test Data Management Strategy

| Aspect                         | Approach                                                                   |
|--------------------------------|----------------------------------------------------------------------------|
| **Unit tests (Pester mocks)**  | Mock data embedded directly in test files; Graph API responses simulated via `Mock` cmdlet |
| **ControlsDB tests**           | Temporary SQLite databases created and destroyed per test run              |
| **Integration tests (manual)** | Test M365 tenant with seeded security configurations (known-good and known-bad states) |
| **Sensitive data**             | No real tenant credentials in test files; test tenant credentials stored via DPAPI encryption |
| **Mock data patterns**         | Mock objects match the structure of actual Graph API responses, Exchange Online policy objects, and Teams configuration objects |

---

## 7. Quality Gates

### Release Quality Gate

A release of M365-SecurityAssessment is approved when **all** of the following are true:

- [x] All 71+ Pester unit tests pass (`Invoke-Pester .\tests\ -Verbose` exits with 0 failures)
- [x] No test is skipped without documented justification
- [x] Module imports successfully (`Import-Module .\M365-SecurityAssessment.psd1`)
- [ ] Manual integration test against test tenant confirms key findings are detected correctly
- [ ] No plaintext credentials in any module file or output
- [ ] Assessment reports render correctly in HTML, PDF, and DOCX formats
- [ ] Checkpoint/resume functionality works after simulated interruption

### Current Enforcement

| Gate                           | Enforced? | Mechanism                                        |
|--------------------------------|-----------|--------------------------------------------------|
| All Pester tests pass          | Yes       | Manual execution before release                  |
| Module import succeeds         | Yes       | Manual verification                              |
| Integration test pass          | Partial   | Manual verification against test tenant          |
| Code coverage threshold        | **No**    | No coverage tooling configured                   |
| Automated CI/CD gate           | **No**    | No CI/CD pipeline exists                         |

---

## 8. Current Gaps and Improvement Plan

| Gap                                          | Impact                                              | Priority | Planned Mitigation                                |
|----------------------------------------------|-----------------------------------------------------|----------|---------------------------------------------------|
| No CI/CD pipeline                            | Tests only run when developer remembers              | High     | Implement GitHub Actions or Azure DevOps pipeline |
| No automated integration tests               | Live API behavior changes could break assessments undetected | High | Record API responses for Pester mocking       |
| No code coverage metrics                     | Unknown percentage of assessment logic is tested     | Medium   | Investigate Pester code coverage or PSCodeCoverage |
| 4 modules have definition-only tests         | Assessment logic for those modules is untested       | Medium   | Write Pester tests as checks are implemented      |
| No performance benchmarks                    | Large tenant assessments may timeout without warning | Medium   | Establish timing baselines per module             |
| Manual test execution only                   | Human error in test execution; inconsistent runs     | Medium   | Automate with CI/CD pipeline                     |

---

## 9. Defect Management Process

### Defect Lifecycle

```
New -> Triaged -> In Progress -> Fixed -> Verified (Pester test added) -> Closed
                                    \-> Won't Fix -> Closed
                                    \-> Deferred -> Backlog
```

### Severity Definitions (Assessment Tool Context)

| Severity     | Definition                                                                      | Fix SLA             |
|--------------|---------------------------------------------------------------------------------|---------------------|
| **Critical** | Tool produces incorrect findings (false positive/negative on critical controls); credential exposure | Immediate (same day) |
| **High**     | Module fails to connect or collect data from a tenant; report generation broken  | 2 business days     |
| **Medium**   | Finding description inaccurate; evidence CSV missing data; non-critical check failure | 5 business days  |
| **Low**      | Cosmetic issue in reports; minor log formatting; non-functional improvement      | Next release        |

### Defect Tracking

- **Tool:** GitHub Issues (or internal tracking system)
- **Labels:** `bug`, `test-failure`, `false-positive`, `false-negative`, `severity/critical`, `severity/high`
- **Regression tests:** Every fixed defect must have a corresponding Pester test to prevent recurrence.

---

## 10. Testing Tools Inventory

| Tool                         | Purpose                                         | Version          | License            | Status          |
|------------------------------|-------------------------------------------------|------------------|--------------------|-----------------|
| Pester                       | PowerShell unit testing framework               | 3.4.0            | Apache 2.0         | **In Use**      |
| PSScriptAnalyzer             | Static analysis for PowerShell scripts          | Latest           | MIT                | **Planned**     |
| System.Data.SQLite           | SQLite database engine for ControlsDB tests     | Bundled          | Public Domain      | **In Use**      |
| Graph API (test tenant)      | Live API for manual integration testing         | v1.0 / beta      | Microsoft          | **In Use**      |
| Exchange Online PowerShell   | Exchange configuration for manual testing       | Latest           | Microsoft          | **In Use**      |
| Microsoft Teams PowerShell   | Teams configuration for manual testing          | Latest           | Microsoft          | **In Use**      |

---

## 11. Appendix

### Key Contacts

| Role                       | Name                       | Contact               |
|----------------------------|----------------------------|-----------------------|
| Development Lead           | IntelliSecOps Dev Team     | GitHub Issues         |
| Security Assessment SME    | IntelliSecOps Security     | GitHub Issues         |

### Testing Milestones

| Milestone                                        | Target Date  | Priority |
|--------------------------------------------------|--------------|----------|
| Complete Pester tests for all 4 definition-only modules | TBD     | High     |
| Implement CI/CD pipeline with automated Pester run | TBD         | High     |
| Record Graph API responses for automated integration tests | TBD  | Medium   |
| Establish code coverage baseline                  | TBD          | Medium   |
| Create automated performance benchmarks per module | TBD         | Low      |

### Related Pages

- [Unit Testing](./unit-testing.md)
- [Integration Testing](./integration-testing.md)
- [Performance Testing](./performance-testing.md)
- [Security Testing](./security-testing.md)
- [UAT Sign-Off](./uat-signoff.md)
