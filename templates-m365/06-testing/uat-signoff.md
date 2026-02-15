# UAT Sign-Off

| **Page Title**   | UAT Sign-Off -- M365 Security Assessment Automation |
|------------------|-------------------------------------------------------|
| **Last Updated** | 2026-02-15                                            |
| **Status**       | IN PROGRESS                                           |
| **Owner**        | IntelliSecOps Product Team                            |

---

## 1. Current State and Context

For the M365-SecurityAssessment module, UAT is adapted from traditional application UAT. Rather than business users validating a web application, **UAT means a security consultant validating the tool's assessment accuracy against a tenant with known security configurations.**

The goal is to confirm that:
- The tool correctly identifies known security gaps in the test M365 tenant.
- Assessment reports are accurate, complete, and professionally formatted.
- Evidence CSVs contain the correct affected resources for each finding.
- No false positives or false negatives exist for the tested configurations.

A formal UAT process is **in progress**. Initial validation has been performed informally by developers during integration testing, but a structured sign-off process is being established.

---

## 2. UAT Scope and Objectives

### Release Information

| Field                      | Value                                         |
|----------------------------|-----------------------------------------------|
| **Module version**         | M365-SecurityAssessment v1.0.0                |
| **Release type**           | Initial release                               |
| **UAT start date**         | TBD                                           |
| **UAT end date**           | TBD                                           |
| **Sign-off deadline**      | TBD                                           |

### Objectives

The purpose of UAT for each release is to:

1. **Accuracy validation** -- Confirm the tool correctly identifies security gaps that are known to exist in the test tenant.
2. **Completeness validation** -- Confirm that all defined findings for each module are evaluated (no skipped checks).
3. **Report quality validation** -- Confirm reports are professional, clearly written, and suitable for client delivery.
4. **Evidence validation** -- Confirm evidence CSVs contain the correct affected resources and no extraneous data.
5. **Regression validation** -- Confirm previously working modules still produce correct results.

### In Scope

| Feature / Change                         | Description                                                              |
|------------------------------------------|--------------------------------------------------------------------------|
| EntraID Assessment (39 findings)         | Validate MFA, Conditional Access, admin roles, guest access findings     |
| DeviceManagement Assessment (18 findings)| Validate Intune compliance, device configuration findings                |
| EmailProtection Assessment (13 findings) | Validate SPF/DKIM/DMARC, anti-spam, anti-phishing, Safe Links findings  |
| TeamsSharePoint Assessment (17 findings) | Validate Teams guest access, sharing policies, SharePoint settings       |
| Report Generation (HTML/PDF/DOCX)        | Validate all three report formats render correctly with accurate data    |
| Evidence CSV Export                       | Validate affected resource lists are accurate for each finding           |
| Checkpoint/Resume                        | Validate interrupted assessments can be resumed correctly                |

### Out of Scope

| Item                                     | Reason                                                    |
|------------------------------------------|-----------------------------------------------------------|
| Definition-only modules (4 modules)      | Checks not yet implemented; not ready for UAT             |
| Performance testing                      | Covered by performance testing (separate document)        |
| Security testing of the tool itself      | Covered by security testing (separate document)           |
| CI/CD pipeline validation                | No CI/CD pipeline exists yet                              |

---

## 3. UAT Environment and Access

| Aspect                       | Details                                                              |
|------------------------------|----------------------------------------------------------------------|
| **Environment**              | Test M365 tenant with known security configurations                  |
| **Tool execution**           | Local PowerShell session on tester's workstation                     |
| **Module version**           | Pre-release build of M365-SecurityAssessment v1.0.0                  |
| **Tenant credentials**       | App Registration with required Graph API, Exchange Online, Teams permissions |
| **Known-state configuration**| Documented security configurations with expected findings            |

### Test Tenant Configuration Summary

The test tenant must have the following configurations to enable validation:

| Configuration Area              | Known State (Test Tenant)                                     | Expected Finding(s)     |
|---------------------------------|---------------------------------------------------------------|-------------------------|
| **MFA enforcement**             | MFA not enforced for 3 test users                             | ENTRA-001 (Critical)    |
| **Conditional Access policies** | No Conditional Access policies configured                     | ENTRA-003 (High)        |
| **Legacy authentication**       | Legacy auth not blocked                                       | ENTRA-005 (High)        |
| **Global admin accounts**       | 3 Global Admin accounts (excess)                              | ENTRA-010 (High)        |
| **Guest users**                 | 5 guest users with no access review                           | ENTRA-015 (Medium)      |
| **SPF record**                  | Primary domain has valid SPF; secondary domain missing SPF    | EMAIL-001 (High)        |
| **DMARC policy**                | Primary domain has `p=none` (monitoring only)                 | EMAIL-003 (Medium)      |
| **Anti-spam policy**            | Default policy with no customization                          | EMAIL-006 (Medium)      |
| **Safe Links**                  | Safe Links not enabled                                        | EMAIL-010 (High)        |
| **Device compliance**           | 5 non-compliant devices in Intune                             | DEVICE-004 (High)       |
| **Teams guest access**          | Guest access enabled with no restrictions                     | TEAMS-002 (Medium)      |
| **SharePoint external sharing** | External sharing enabled for all sites                        | TEAMS-008 (High)        |

---

## 4. Acceptance Criteria

### Overall Acceptance Criteria

| # | Criterion                                                                    | Threshold                                    |
|---|------------------------------------------------------------------------------|----------------------------------------------|
| 1 | Tool correctly identifies all known security gaps in test tenant             | 100% of known-gap findings detected          |
| 2 | No false positives for configurations known to be secure                     | 0 false positives on validated configurations|
| 3 | All defined findings for implemented modules are evaluated                   | 0 skipped checks (no "not evaluated" status) |
| 4 | Reports are accurate and suitable for professional client delivery           | Tester sign-off on report quality            |
| 5 | Evidence CSVs contain correct affected resources                             | Spot-check 5+ findings; all correct          |
| 6 | Assessment completes without errors for all implemented modules              | 0 unhandled errors during assessment run     |
| 7 | Checkpoint/resume produces identical results to uninterrupted run            | Finding sets match between interrupted and uninterrupted runs |

---

## 5. UAT Scenarios by Module

### EntraID Module (39 Findings Defined)

| ID       | Scenario                                           | Expected Result                                                | Actual Result | Status   | Tester | Date |
|----------|----------------------------------------------------|----------------------------------------------------------------|---------------|----------|--------|------|
| UAT-E01  | Run EntraID assessment against test tenant          | Assessment completes; all 39 finding definitions evaluated     |               | Not Run  |        |      |
| UAT-E02  | Verify MFA finding (ENTRA-001) detected             | Finding generated for users without MFA; severity = Critical   |               | Not Run  |        |      |
| UAT-E03  | Verify Conditional Access finding (ENTRA-003)       | Finding generated; lists missing CA policies                   |               | Not Run  |        |      |
| UAT-E04  | Verify legacy auth finding (ENTRA-005)              | Finding generated; severity = High                             |               | Not Run  |        |      |
| UAT-E05  | Verify Global Admin finding (ENTRA-010)             | Finding generated; lists 3 admin accounts in evidence          |               | Not Run  |        |      |
| UAT-E06  | Verify guest user finding (ENTRA-015)               | Finding generated; lists 5 guest users in evidence CSV         |               | Not Run  |        |      |
| UAT-E07  | Verify evidence CSV contains correct affected users | CSV rows match actual affected users in test tenant            |               | Not Run  |        |      |

### DeviceManagement Module (18 Findings Defined)

| ID       | Scenario                                           | Expected Result                                                | Actual Result | Status   | Tester | Date |
|----------|----------------------------------------------------|----------------------------------------------------------------|---------------|----------|--------|------|
| UAT-D01  | Run DeviceManagement assessment                     | Assessment completes; all 18 finding definitions evaluated     |               | Not Run  |        |      |
| UAT-D02  | Verify non-compliant device finding (DEVICE-004)    | Finding generated; lists 5 non-compliant devices               |               | Not Run  |        |      |
| UAT-D03  | Verify evidence CSV contains device details         | CSV includes device name, OS, compliance state, last check-in  |               | Not Run  |        |      |

### EmailProtection Module (13 Findings Defined)

| ID       | Scenario                                           | Expected Result                                                | Actual Result | Status   | Tester | Date |
|----------|----------------------------------------------------|----------------------------------------------------------------|---------------|----------|--------|------|
| UAT-M01  | Run EmailProtection assessment                      | Assessment completes; all 13 finding definitions evaluated     |               | Not Run  |        |      |
| UAT-M02  | Verify missing SPF finding (EMAIL-001)              | Finding generated for secondary domain; severity = High        |               | Not Run  |        |      |
| UAT-M03  | Verify DMARC p=none finding (EMAIL-003)             | Finding generated; severity = Medium                           |               | Not Run  |        |      |
| UAT-M04  | Verify anti-spam default policy finding (EMAIL-006) | Finding generated; details default policy settings             |               | Not Run  |        |      |
| UAT-M05  | Verify Safe Links finding (EMAIL-010)               | Finding generated; severity = High                             |               | Not Run  |        |      |
| UAT-M06  | Verify primary domain SPF passes (no false positive)| No SPF finding generated for primary domain                    |               | Not Run  |        |      |

### TeamsSharePoint Module (17 Findings Defined)

| ID       | Scenario                                           | Expected Result                                                | Actual Result | Status   | Tester | Date |
|----------|----------------------------------------------------|----------------------------------------------------------------|---------------|----------|--------|------|
| UAT-T01  | Run TeamsSharePoint assessment                      | Assessment completes; all 17 finding definitions evaluated     |               | Not Run  |        |      |
| UAT-T02  | Verify Teams guest access finding (TEAMS-002)       | Finding generated; severity = Medium                           |               | Not Run  |        |      |
| UAT-T03  | Verify SharePoint sharing finding (TEAMS-008)       | Finding generated; lists externally shared sites               |               | Not Run  |        |      |
| UAT-T04  | Verify evidence CSV for Teams findings              | CSV contains team names, guest counts, sharing status          |               | Not Run  |        |      |

### Report Generation

| ID       | Scenario                                           | Expected Result                                                | Actual Result | Status   | Tester | Date |
|----------|----------------------------------------------------|----------------------------------------------------------------|---------------|----------|--------|------|
| UAT-R01  | Generate HTML report                                | Report renders in browser; all findings listed with severity   |               | Not Run  |        |      |
| UAT-R02  | Generate PDF report                                 | PDF opens correctly; formatting matches HTML version           |               | Not Run  |        |      |
| UAT-R03  | Generate DOCX report                                | DOCX opens in Word; tables and formatting are correct          |               | Not Run  |        |      |
| UAT-R04  | Verify finding counts match in report               | Report summary counts match actual findings generated          |               | Not Run  |        |      |
| UAT-R05  | Verify remediation guidance in report               | Each finding includes actionable remediation steps             |               | Not Run  |        |      |
| UAT-R06  | Verify executive summary accuracy                   | Executive summary reflects correct risk posture                |               | Not Run  |        |      |

### Cross-Cutting Scenarios

| ID       | Scenario                                           | Expected Result                                                | Actual Result | Status   | Tester | Date |
|----------|----------------------------------------------------|----------------------------------------------------------------|---------------|----------|--------|------|
| UAT-X01  | Full assessment (all implemented modules)           | Assessment completes all modules without errors                |               | Not Run  |        |      |
| UAT-X02  | Checkpoint/resume mid-assessment                    | Resume produces same findings as uninterrupted run             |               | Not Run  |        |      |
| UAT-X03  | Assessment with empty/minimal tenant                | Tool handles gracefully; no errors; minimal findings generated |               | Not Run  |        |      |

### Test Scenario Summary

| Total Scenarios | Passed | Failed | Blocked | Not Run |
|-----------------|--------|--------|---------|---------|
| 30              | 0      | 0      | 0       | 30      |

---

## 6. UAT Entry Criteria

All of the following must be true before UAT begins.

| #  | Criterion                                                              | Met? (Yes/No) | Evidence / Notes                    |
|----|------------------------------------------------------------------------|---------------|-------------------------------------|
| 1  | All 71+ Pester unit tests pass (`Invoke-Pester .\tests\ -Verbose`)    | TBD           | Test run output                     |
| 2  | Module imports successfully on tester's workstation                     | TBD           | `Import-Module` output              |
| 3  | Test M365 tenant is configured with known security states              | TBD           | Configuration documentation         |
| 4  | Test tenant App Registration has all required permissions               | TBD           | Azure AD portal verification       |
| 5  | Tester has valid credentials for the test tenant                       | TBD           | Credential save/load verified       |
| 6  | UAT scenarios are documented and reviewed                              | TBD           | This document                       |
| 7  | No known Critical defects in the module                                | TBD           | Issue tracker query                 |

**Entry criteria sign-off:**

| Role               | Name       | Confirmed | Date       |
|--------------------|------------|-----------|------------|
| Development Lead   | TBD        | TBD       | TBD        |
| Security Lead      | TBD        | TBD       | TBD        |

---

## 7. UAT Exit Criteria

All of the following must be true before UAT is considered complete and the module version can be released.

| #  | Criterion                                                              | Met? (Yes/No) | Evidence / Notes                    |
|----|------------------------------------------------------------------------|---------------|-------------------------------------|
| 1  | All UAT scenarios have been executed (none remain "Not Run")           | TBD           | See section 5 summary               |
| 2  | All known-gap findings were correctly detected (100% detection rate)   | TBD           | Scenario results                    |
| 3  | No false positives on configurations known to be secure                | TBD           | Scenario UAT-M06 and similar        |
| 4  | Reports are deemed professional and client-ready by tester             | TBD           | Tester sign-off on report quality   |
| 5  | Evidence CSVs are accurate for all spot-checked findings               | TBD           | Tester verification                 |
| 6  | No open Critical defects found during UAT                              | TBD           | See section 8                       |
| 7  | All open High defects have accepted workarounds or are deferred        | TBD           | See section 8                       |
| 8  | Sign-off obtained from all required stakeholders                       | TBD           | See section 9                       |

---

## 8. Defects Found During UAT

| ID          | Description                                    | Severity     | Found By   | Found Date | Assigned To | Status         | Resolution               |
|-------------|------------------------------------------------|--------------|------------|------------|-------------|----------------|--------------------------|
|             | (UAT not yet conducted)                        |              |            |            |             |                |                          |

### Defect Summary

| Severity  | Found | Fixed | Deferred | Won't Fix | Open |
|-----------|-------|-------|----------|-----------|------|
| Critical  | 0     | 0     | 0        | 0         | 0    |
| High      | 0     | 0     | 0        | 0         | 0    |
| Medium    | 0     | 0     | 0        | 0         | 0    |
| Low       | 0     | 0     | 0        | 0         | 0    |
| **Total** | **0** | **0** | **0**    | **0**     | **0**|

---

## 9. UAT Sign-Off Record

Each stakeholder must record their decision below. All required stakeholders must approve before the module version is released.

| Tester / Stakeholder       | Role                          | Module(s) Tested          | Decision    | Comments                           | Date       |
|----------------------------|-------------------------------|---------------------------|-------------|-------------------------------------|------------|
| TBD                        | Security Consultant (Primary) | All implemented modules   | Pending     | UAT not yet conducted               | TBD        |
| TBD                        | Development Lead              | All implemented modules   | Pending     | UAT not yet conducted               | TBD        |
| TBD                        | Product Owner                 | Report quality review     | Pending     | UAT not yet conducted               | TBD        |

### Conditional Approvals

If any stakeholder provides a "Conditional Approval," document the conditions here:

| Stakeholder     | Condition                                                    | Accepted By    | Target Date |
|-----------------|--------------------------------------------------------------|----------------|-------------|
|                 | (No conditional approvals -- UAT not yet conducted)          |                |             |

### Final Decision

| Field                        | Value                                    |
|------------------------------|------------------------------------------|
| **Overall UAT Result**       | Pending (UAT not yet conducted)          |
| **Decision Date**            | TBD                                      |
| **Decision Maker**           | TBD (Security Lead)                      |
| **Release Approved?**        | TBD                                      |

---

## 10. Known Limitations Documented for Users

The following are known limitations of the M365-SecurityAssessment module v1.0.0 that users should be aware of:

| ID         | Limitation                                                             | Impact                                              | Workaround                                       |
|------------|------------------------------------------------------------------------|-----------------------------------------------------|--------------------------------------------------|
| LIMIT-001  | 4 assessment modules are definition-only (no automated checks)         | ApplicationProtection, DataProtection, FinSecOps, VulnerabilityManagement findings must be assessed manually | Manual review using finding definitions as guidance |
| LIMIT-002  | No automated integration tests against live APIs                       | API behavior changes could affect finding accuracy without detection | Manual validation against test tenant before client use |
| LIMIT-003  | DPAPI credentials are machine+user specific                            | Credentials saved on one machine cannot be used on another | Re-save credentials on each workstation          |
| LIMIT-004  | PDF generation requires Microsoft Edge installed                       | Workstations without Edge cannot generate PDF reports | Use HTML or DOCX format instead                  |
| LIMIT-005  | No CI/CD pipeline; tests run manually                                  | Test execution depends on developer discipline       | Run `Invoke-Pester .\tests\ -Verbose` before every release |
| LIMIT-006  | Exchange Online connection adds 15-30 second overhead                  | Assessment startup is slower than expected            | No workaround; EXO module architecture constraint |
| LIMIT-007  | Large tenants (10K+ users) may experience Graph API throttling         | Assessment duration significantly extended            | Increase `retryDelaySeconds` in config.json      |
| LIMIT-008  | Pode dashboard binds to localhost only                                 | Dashboard cannot be shared with other team members remotely | Share via report files instead; or screen share  |

### Risk Assessment for Known Limitations

| Limitation ID | Business Impact                                    | Likelihood  | Risk Level | Monitoring Plan                        |
|---------------|----------------------------------------------------|-------------|------------|----------------------------------------|
| LIMIT-001     | Incomplete assessment coverage for 4 security areas| High        | High       | Prioritize module implementation       |
| LIMIT-002     | Findings may be incorrect if APIs change           | Medium      | Medium     | Manual validation before client use    |
| LIMIT-003     | Credential portability friction                    | Low         | Low        | Document in user guide                 |
| LIMIT-004     | PDF reports unavailable on some workstations       | Low         | Low        | Offer HTML/DOCX alternatives           |
| LIMIT-005     | Tests may not be run before release                | Medium      | High       | Implement CI/CD pipeline               |
| LIMIT-006     | User perception of slow startup                    | Low         | Low        | Document in user guide                 |
| LIMIT-007     | Large tenant assessments may fail                  | Medium      | Medium     | Test with large tenants; optimize API calls |
| LIMIT-008     | Remote collaboration limited                       | Low         | Low        | Document; consider future enhancement  |

---

## 11. Appendix

### UAT Participants

| Name               | Role                              | Department           | Contact              |
|--------------------|-----------------------------------|----------------------|----------------------|
| TBD                | Security Consultant (Primary)     | Security Services    | TBD                  |
| TBD                | Security Consultant (Secondary)   | Security Services    | TBD                  |
| TBD                | Development Lead                  | Engineering          | TBD                  |
| TBD                | Product Owner                     | Product              | TBD                  |

### Prerequisites for First UAT Cycle

Before the first formal UAT cycle can be conducted, the following must be completed:

1. **Test tenant configured** -- M365 tenant with documented known-state security configurations.
2. **App Registration provisioned** -- Test app with all required API permissions granted.
3. **Test credentials saved** -- DPAPI-encrypted credentials on tester's workstation.
4. **Tester briefed** -- Walkthrough of the tool, assessment workflow, and UAT scenarios.
5. **Expected findings documented** -- Mapping of each known configuration gap to its expected finding ID and severity.
6. **All Pester tests passing** -- `Invoke-Pester .\tests\ -Verbose` returns 0 failures.

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Unit Testing](./unit-testing.md)
- [Integration Testing](./integration-testing.md)
- [Performance Testing](./performance-testing.md)
- [Security Testing](./security-testing.md)
