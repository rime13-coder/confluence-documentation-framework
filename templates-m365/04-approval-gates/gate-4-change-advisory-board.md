# Gate 4 - Change Advisory Board (CAB)

| **Page Title**   | Gate 4 - Change Advisory Board - M365 Security Assessment Automation |
|------------------|----------------------------------------------------------------------|
| **Last Updated** | 2026-02-15                                                           |
| **Status**       | COMPLETE (Phases 1-3) / NOT STARTED (Phase 4)                       |
| **Owner**        | Lead Developer, IntelliSec Solutions (CloudSecOps)                   |
| **Gate Date**    | Phase 1: 2025-07-21 / Phase 2: 2025-10-20 / Phase 3: 2026-01-13    |

---

## 1. Gate Purpose

Gate 4 assesses the risk of releasing a new version of the M365-SecurityAssessment PowerShell module for internal distribution and formally approves or rejects the release. Because this is an internal PowerShell tool distributed manually (no CI/CD pipeline or package registry yet), the CAB functions as an internal release readiness review rather than a production deployment change board. The review evaluates the impact on existing assessments, backward compatibility with saved assessment data, credential profile compatibility, and the rollback plan (reverting to the previous module version).

### Timing in Project Lifecycle

```
[Gate 3: Security Review] --> [Final Remediation] --> ** GATE 4: CAB ** --> [Gate 5: Go/No-Go] --> [Internal Release]
```

---

## 2. Change Request Summary

### Phase 1 Release (EntraID Module)

| Field | Details |
|-------|---------|
| **Change ID** | M365SA-CHG-001 |
| **Change Title** | M365-SecurityAssessment v0.1.0 - EntraID Module Release |
| **What** | Release the initial version of the M365-SecurityAssessment PowerShell module containing the EntraID assessment module with 39 security checks covering Conditional Access, Authentication Methods, User Settings, Identity Protection, and Password Policies. Includes the modular assessment framework, collector caching, checkpoint system, evidence export, and HTML report generation. |
| **Why** | Enable IntelliSec assessors to perform automated M365 Entra ID security assessments against client tenants, replacing manual checklist-based assessments. Provides consistent, evidence-backed findings mapped to CMMC Level 2 and CIS Microsoft 365 Benchmark controls. |
| **When** | 2025-07-23 |
| **Who** | Release lead: Lead Developer; Distribution: internal file share |
| **Impact** | New tool (no existing users); no backward compatibility concern. Assessors will receive the module as a ZIP package with installation instructions. |
| **Change Type** | Normal (new internal tool release) |
| **Distribution** | Internal file share + email notification to assessment team |

### Phase 2 Release (DeviceManagement Module)

| Field | Details |
|-------|---------|
| **Change ID** | M365SA-CHG-002 |
| **Change Title** | M365-SecurityAssessment v0.2.0 - DeviceManagement Module Addition |
| **What** | Add the DeviceManagement assessment module with 18 security checks covering Device Compliance Policies, Device Configuration Profiles, and Intune enrollment settings. Framework enhancements include improved collector caching for cross-module scenarios. |
| **Why** | Extend assessment coverage to device management security posture; assessors need device compliance visibility alongside Entra ID assessment results. |
| **When** | 2025-10-22 |
| **Impact** | Additive change; existing EntraID module unchanged. Assessors using v0.1.0 must update to v0.2.0 to access DeviceManagement checks. App Registration requires additional permissions (DeviceManagementConfiguration.Read.All, DeviceManagementManagedDevices.Read.All). |

### Phase 3 Release (EmailProtection + TeamsSharePoint Modules)

| Field | Details |
|-------|---------|
| **Change ID** | M365SA-CHG-003 |
| **Change Title** | M365-SecurityAssessment v1.0.0 - Full Module Suite Release |
| **What** | Add EmailProtection module (13 checks) and TeamsSharePoint module (17 checks). Framework enhancements include Exchange Online session management, improved error handling, and token redaction fixes (SR-LOG-002). This release completes the v1.0.0 module suite with 87 total checks across 4 modules. |
| **Why** | Complete the assessment coverage for M365 security posture; v1.0.0 represents the full assessment capability covering Entra ID, Device Management, Email Protection, and Teams/SharePoint. |
| **When** | 2026-01-15 |
| **Impact** | Additive change; existing modules unchanged. App Registration requires additional permissions (Exchange.ManageAsApp, TeamSettings.Read.All, Sites.Read.All, Channel.ReadBasic.All). Certificate must have Exchange Online application access policy configured. |

### Components Affected (Cumulative at v1.0.0)

| Component | Version | Change Description |
|-----------|---------|-------------------|
| M365-SecurityAssessment (framework) | 1.0.0 | Core assessment framework: authentication, collector caching, checkpoint system, evidence export, HTML report generation |
| EntraID Module | 1.0.0 | 39 checks: Conditional Access, Authentication Methods, User Settings, Identity Protection, Password Policies |
| DeviceManagement Module | 1.0.0 | 18 checks: Device Compliance Policies, Device Configuration Profiles, Intune enrollment |
| EmailProtection Module | 1.0.0 | 13 checks: Transport Rules, Anti-Phishing, Anti-Spam, Anti-Malware, Safe Links, Safe Attachments |
| TeamsSharePoint Module | 1.0.0 | 17 checks: Teams Meeting Policies, Messaging Policies, Guest Access, SharePoint Sharing, External Collaboration |
| findings.json | 1.0.0 | 87 finding definitions with CMMC and CIS control mappings |
| controls.db | 1.0.0 | SQLite database mapping findings to CMMC Level 2 practices, CIS benchmarks, and NIST 800-171 controls |

---

## 3. Risk Assessment

### 3.1 Risk Matrix

| Risk Factor | Rating | Details |
|------------|--------|---------|
| **Likelihood of release failure** | Low | Module is a PowerShell package distributed as a ZIP; no deployment infrastructure to fail; installation is file copy + Import-Module |
| **Impact if release has defects** | Medium | Incorrect assessment results could lead to inaccurate security findings reported to clients; mitigated by manual verification step in assessment process |
| **Impact on existing assessments** | Low | New modules are additive; existing EntraID and DeviceManagement checks are unchanged in v1.0.0; previously generated evidence files and reports remain valid |
| **Backward compatibility risk** | Low | Assessment output format is versioned; new modules do not modify existing module behavior; credential profiles from earlier versions remain compatible |
| **Credential profile compatibility** | Low | Existing App Registrations work for previously released modules; new modules require additional permissions to be granted (documented in release notes) |
| **Dependency risk** | Medium | Depends on Microsoft Graph API and Exchange Online PowerShell; API changes or deprecations could break collectors; mitigated by using v1.0 stable endpoints |

### 3.2 Overall Risk Level

**Overall Risk Assessment:** LOW

> Release risk is low because the module is distributed as a file package with no deployment infrastructure. Impact risk is medium due to the possibility of incorrect assessment results, mitigated by the manual verification step that assessors perform. Adding new modules is additive and does not affect existing functionality.

### 3.3 Risk Mitigations

| Risk | Mitigation | Owner |
|------|-----------|-------|
| Incorrect assessment results | All checks validated against test tenant with known configuration; Pester unit tests cover pass/fail logic; manual verification step in assessment SOP | Lead Developer |
| App Registration permission changes break existing workflow | Release notes document required permission changes; migration guide provided; backward compatible (old modules work without new permissions) | Lead Developer |
| Graph API endpoint deprecation | All collectors use v1.0 stable endpoints; beta endpoints documented with fallback plan; Microsoft deprecation notices monitored | CTO |
| Module import failure on assessor workstation | PowerShell version compatibility tested (5.1, 7.x); dependency check at module load; clear error messages for missing prerequisites | Lead Developer |
| Exchange Online connectivity issues | EmailProtection module has retry logic, session cleanup, and graceful degradation; assessment continues with other modules if Exchange connection fails | Lead Developer |

---

## 4. Release Plan

### 4.1 Release Steps

| Step | Action | Responsible | Duration | Verification |
|------|--------|-------------|----------|-------------|
| 1 | Verify all Pester tests pass on release branch | Lead Developer | 15 min | Test report: 348 tests, 0 failures (all modules) |
| 2 | Verify SR-LOG-002 remediation is merged (Phase 3 condition) | Security Lead | 5 min | Pull request merged and code reviewed |
| 3 | Run PSScriptAnalyzer on all module files | Lead Developer | 5 min | Zero warnings with security rules enabled |
| 4 | Run full assessment against test tenant and verify results | Lead Developer | 30 min | All 87 checks produce expected results against known test tenant configuration |
| 5 | Update module manifest version to release version | Lead Developer | 5 min | Version in .psd1 matches Module.json and CHANGELOG |
| 6 | Verify findings.json definitions are complete and match check functions | Lead Developer | 10 min | 87 finding definitions, 1:1 mapping to checks |
| 7 | Verify controls.db logic definitions are synchronized | CTO | 10 min | Logic definitions match findings.json; CMMC and CIS mappings are current |
| 8 | Package module as ZIP with release notes and installation guide | Lead Developer | 10 min | ZIP contains module files, findings.json, controls.db, README, CHANGELOG, INSTALL.md |
| 9 | Upload release package to internal file share | Lead Developer | 5 min | Package accessible at `\\intellisec\tools\M365-SecurityAssessment\v1.0.0\` |
| 10 | Send release notification email to assessment team | Lead Developer | 5 min | Email with release notes, download link, and App Registration permission changes |
| 11 | Assessor performs installation and runs quick validation | Security Assessor | 20 min | Module imports successfully; `Invoke-M365Assessment -Module EntraID` completes against test tenant |

### 4.2 Rollback Plan

| Scenario | Rollback Method | Time Estimate | Owner |
|----------|----------------|---------------|-------|
| Module import failure | Assessor reverts to previous module version from file share (v0.2.0 or v0.1.0) | 5 min | Lead Developer |
| Incorrect assessment results discovered | Issue reported; assessor reverts to previous version; hotfix prepared for next release | 10 min revert + hotfix timeline | Lead Developer |
| App Registration permission issue | Revert App Registration to previous permission set; use previous module version | 15 min | Lead Developer |
| Critical defect in new module | Remove new module folder from installation directory; previous modules continue to function independently | 5 min | Lead Developer |

**Rollback Availability:** Previous versions (v0.1.0, v0.2.0) retained on the internal file share at `\\intellisec\tools\M365-SecurityAssessment\archive\`. Rollback is a file replacement operation.

---

## 5. Impact on Existing Assessments

| Impact Area | Assessment | Mitigation |
|------------|-----------|------------|
| Previously generated evidence files | NOT AFFECTED -- evidence files are standalone JSON; format unchanged | None needed |
| Previously generated HTML reports | NOT AFFECTED -- report format is backward compatible; new modules add sections but do not modify existing module output | None needed |
| Existing App Registrations | REQUIRES UPDATE -- new modules need additional Graph API and Exchange Online permissions granted to existing App Registrations | Release notes include step-by-step App Registration update guide |
| Existing credential profiles (certificate auth) | COMPATIBLE -- existing certificate works for existing modules; EmailProtection may require Exchange Online application access policy on the certificate | Migration guide documents Exchange Online certificate configuration |
| Assessment checkpoint files | COMPATIBLE -- checkpoints from previous versions are recognized; new checks are appended to checkpoint when assessment includes new modules | Checkpoint version compatibility verified in Pester tests |
| controls.db and findings.json | UPDATED -- new finding definitions added; existing definitions unchanged; controls.db schema unchanged with new rows for Phase 2/3 findings | Assessors must use matching controls.db with module version |

---

## 6. CAB Decision

### Phase 1 (v0.1.0 - EntraID)

| Field | Value |
|-------|-------|
| **Decision** | APPROVED |
| **Decision Date** | 2025-07-21 |
| **Decision Rationale** | New internal tool with no existing users or backward compatibility concerns. EntraID module passed all quality gates (Design Review, ARB, Security Review). 39 checks validated against test tenant. Pester tests all passing. Module is approved for internal distribution to assessment team. |
| **Release Date** | 2025-07-23 |

### Phase 2 (v0.2.0 - DeviceManagement Addition)

| Field | Value |
|-------|-------|
| **Decision** | APPROVED |
| **Decision Date** | 2025-10-20 |
| **Decision Rationale** | Additive release with no changes to existing EntraID module. DeviceManagement module passed all quality gates. 18 new checks validated. Backward compatible with existing credential profiles (new permissions required for DeviceManagement only). Release notes document permission changes. |
| **Release Date** | 2025-10-22 |

### Phase 3 (v1.0.0 - Full Suite)

| Field | Value |
|-------|-------|
| **Decision** | APPROVED WITH CONDITIONS |
| **Decision Date** | 2026-01-13 |
| **Decision Rationale** | EmailProtection and TeamsSharePoint modules passed all quality gates with one condition: SR-LOG-002 (token redaction edge case) must be resolved before release. Additive release; existing modules unchanged. Exchange Online connectivity adds complexity but has proper session management and graceful degradation. 87 total checks across 4 modules represent comprehensive M365 security assessment coverage for v1.0.0. |
| **Condition** | SR-LOG-002 must be verified as resolved before release package is created |
| **Release Date** | 2026-01-15 (after SR-LOG-002 verification) |

### Conditions (Phase 3)

| # | Condition | Owner | Must Be Met By | Status |
|---|-----------|-------|---------------|--------|
| 1 | SR-LOG-002 (token fragment redaction in error output) must be resolved and verified | Lead Developer | 2026-01-15 | COMPLETE -- resolved 2026-01-14 |
| 2 | Exchange Online application access policy documentation must be included in release notes | Lead Developer | 2026-01-15 | COMPLETE |
| 3 | Full regression test (all 87 checks) must pass against test tenant after SR-LOG-002 fix | Lead Developer | 2026-01-15 | COMPLETE -- 348 Pester tests passing, 87 checks validated |

---

## 7. CAB Sign-Off

### Phase 1 (2025-07-21)

| Name | Role | Decision | Date |
|------|------|----------|------|
| (CTO) | CAB Chair / CTO | Approve | 2025-07-21 |
| (Lead Developer) | Release Manager / Technical Lead | Approve | 2025-07-21 |
| (Security Assessor) | Assessment Team Representative | Approve | 2025-07-21 |

### Phase 2 (2025-10-20)

| Name | Role | Decision | Date |
|------|------|----------|------|
| (CTO) | CAB Chair / CTO | Approve | 2025-10-20 |
| (Lead Developer) | Release Manager / Technical Lead | Approve | 2025-10-20 |
| (Security Assessor) | Assessment Team Representative | Approve | 2025-10-20 |

### Phase 3 (2026-01-13)

| Name | Role | Decision | Date |
|------|------|----------|------|
| (CTO) | CAB Chair / CTO | Approve with Conditions | 2026-01-13 |
| (Lead Developer) | Release Manager / Technical Lead | Approve with Conditions | 2026-01-13 |
| (Security Lead) | Security Lead | Approve with Conditions | 2026-01-13 |
| (Security Assessor) | Assessment Team Representative | Approve with Conditions | 2026-01-13 |

---

## 8. Post-Release Verification

### Phase 1 (v0.1.0)

| Field | Value |
|-------|-------|
| **Release Date (Actual)** | 2025-07-23 |
| **Result** | SUCCESS |
| **Issues Reported** | None; 3 assessors successfully installed and ran EntraID assessments within first week |
| **Rollback Executed** | No |
| **Lessons Learned** | Installation guide should include PowerShell execution policy requirements; added to v0.2.0 documentation |

### Phase 2 (v0.2.0)

| Field | Value |
|-------|-------|
| **Release Date (Actual)** | 2025-10-22 |
| **Result** | SUCCESS |
| **Issues Reported** | One assessor had App Registration permission issue; resolved by following the permission update guide in release notes |
| **Rollback Executed** | No |
| **Lessons Learned** | Include a `Test-M365Permissions` function that verifies App Registration has required permissions before starting assessment; implemented in v1.0.0 |

### Phase 3 (v1.0.0)

| Field | Value |
|-------|-------|
| **Release Date (Actual)** | 2026-01-15 |
| **Result** | SUCCESS |
| **Issues Reported** | Two assessors needed assistance configuring Exchange Online application access policy for certificate auth; documentation was correct but process is complex. Considering a setup wizard for future releases. |
| **Rollback Executed** | No |
| **Lessons Learned** | Exchange Online certificate configuration is the most complex step; consider adding an automated setup script (`Initialize-M365AppRegistration`) in a future release |

---

## 9. References

| Document | Link |
|----------|------|
| Gate 3 - Security Review | gate-3-security-review.md |
| Release Notes (v1.0.0) | ../09-release-management/release-notes-v1.0.0.md |
| App Registration Setup Guide | ../07-deployment-architecture/app-registration-setup.md |
| Rollback Procedures | ../09-release-management/rollback-procedures.md |
| Gate 5 - Go/No-Go Checklist | gate-5-go-no-go-checklist.md |
