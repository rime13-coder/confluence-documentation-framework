# Post-Release Verification

| **Page Title**   | M365-SecurityAssessment - Post-Release Verification      |
|------------------|----------------------------------------------------------|
| **Last Updated** | 2026-02-15                                               |
| **Status**       | `CURRENT`                                                |
| **Owner**        | IntelliSec Solutions                                     |
| **Module**       | M365-SecurityAssessment v1.0.0                           |

---

## 1. Document Purpose

This document defines the post-release verification procedures for the M365-SecurityAssessment PowerShell module. Because the module is distributed via `git pull` and runs locally on consultant workstations, "deployment" is the act of a consultant updating their local repository and re-importing the module. Post-release verification ensures that every consultant who updates to a new version confirms the module functions correctly before using it on client assessments.

Two verification levels are defined: a **Smoke Test** (5-minute quick validation) for routine updates, and a **Full Verification** (complete assessment cycle) for major releases or releases that modify finding logic.

---

## 2. Verification Levels

| Level                | When to Use                                                                                  | Duration     | Scope                                                   |
|----------------------|----------------------------------------------------------------------------------------------|--------------|----------------------------------------------------------|
| **Smoke Test**       | Patch releases (x.x.N), minor dependency updates, documentation-only changes                 | ~5 minutes   | Module load, manifest validation, Pester tests, credential check |
| **Full Verification**| Minor releases (x.N.0), major releases (N.0.0), any release modifying check logic or finding definitions | 30-60 minutes | Complete assessment cycle against test tenant, all report formats, dashboard |

---

## 3. Verification Checklist

The following checklist must be completed after updating to any new version. Items marked with **(Smoke)** are included in the Smoke Test. All items are included in the Full Verification.

| #  | Verification Item                                                      | Level          | Pass/Fail | Notes |
|----|------------------------------------------------------------------------|----------------|-----------|-------|
| 1  | Module imports successfully without errors                             | **(Smoke)**    | [ ]       |       |
| 2  | All Pester tests pass                                                  | **(Smoke)**    | [ ]       |       |
| 3  | Module manifest validates successfully                                 | **(Smoke)**    | [ ]       |       |
| 4  | Credential profiles load correctly                                     | **(Smoke)**    | [ ]       |       |
| 5  | Test tenant connectivity works                                         | **(Smoke)**    | [ ]       |       |
| 6  | Run assessment against test tenant -- findings match expected results  | Full           | [ ]       |       |
| 7  | Reports generate correctly (HTML, PDF, DOCX)                           | Full           | [ ]       |       |
| 8  | Dashboard starts and functions                                         | Full           | [ ]       |       |
| 9  | Controls database syncs properly                                       | Full           | [ ]       |       |
| 10 | New or modified findings produce correct results                       | Full           | [ ]       |       |

---

## 4. Smoke Test Procedure (~5 Minutes)

The Smoke Test is a rapid validation that the updated module loads, passes its own tests, and can connect to a tenant. This procedure should be completed by every consultant after pulling any update.

### 4.1 Prerequisites

| Prerequisite                                                     | Verification                                    |
|------------------------------------------------------------------|-------------------------------------------------|
| PowerShell 5.1+ or PowerShell 7+ installed                      | `$PSVersionTable.PSVersion`                     |
| Module repository updated to target version                      | `git log --oneline -1` shows expected commit    |
| At least one credential profile configured                       | Profile file exists in `%APPDATA%\M365-SecurityAssessment\credentials\` |
| Test M365 tenant accessible                                      | Network connectivity to `graph.microsoft.com`   |

### 4.2 Smoke Test Steps

```powershell
# =============================================================================
# M365-SecurityAssessment Post-Release Smoke Test
# Duration: ~5 minutes
# =============================================================================

# --- Step 1: Verify the correct version is checked out ---
cd C:\Tools\M365-SecurityAssessment
git log --oneline -1
# Expected: Commit SHA and message matching the release

Get-Content .\M365-SecurityAssessment.psd1 | Select-String "ModuleVersion"
# Expected: ModuleVersion = '<target version>'

# --- Step 2: Import the module (Checklist Item 1) ---
Import-Module .\M365-SecurityAssessment.psd1 -Force -Verbose
# Expected: Module imports with no errors
# Verify:
Get-Module M365-SecurityAssessment | Select-Object Name, Version, ExportedCommands
# Expected: Correct version, 29 exported commands

# --- Step 3: Validate the module manifest (Checklist Item 3) ---
Test-ModuleManifest .\M365-SecurityAssessment.psd1
# Expected: No errors; manifest properties displayed

# --- Step 4: Run all Pester tests (Checklist Item 2) ---
Invoke-Pester .\Tests\ -Verbose
# Expected: All tests pass (71+ tests, 0 failures)
# Note: If any tests fail, STOP. Do not proceed with client assessments.
#        Report failures to Module Author and initiate rollback if needed.

# --- Step 5: Load credential profile (Checklist Item 4) ---
$cred = Get-M365Credential -ProfileName "TestTenant"
# Expected: Credential object returned without errors
# Verify the credential object has expected properties:
$cred | Format-List
# Expected: TenantId, ClientId, and authentication properties populated

# --- Step 6: Test tenant connectivity (Checklist Item 5) ---
# Connect to Microsoft Graph using the test tenant credential
Connect-MgGraph -TenantId $cred.TenantId -ClientId $cred.ClientId -CertificateThumbprint $cred.CertificateThumbprint
# Expected: Connected successfully, no errors
# Quick validation:
Get-MgOrganization | Select-Object DisplayName, Id
# Expected: Test tenant organization name displayed
Disconnect-MgGraph

# =============================================================================
# SMOKE TEST COMPLETE
# If all 5 steps passed: Module is ready for client assessments.
# If any step failed: Do NOT use this version. Initiate rollback procedure.
# =============================================================================
```

### 4.3 Smoke Test Results Record

| Field                | Value                              |
|----------------------|------------------------------------|
| Module Version       |                                    |
| Consultant Name      |                                    |
| Workstation Name     |                                    |
| Date / Time          |                                    |
| PowerShell Version   |                                    |
| Smoke Test Result    | PASS / FAIL                        |
| Failure Details      | *(if FAIL, describe which step failed and the error message)* |

---

## 5. Full Verification Procedure (30-60 Minutes)

The Full Verification procedure runs a complete assessment cycle against the IntelliSec test M365 tenant and validates all output artifacts. This procedure is required for minor and major releases, and for any release that modifies check logic or finding definitions.

### 5.1 Prerequisites

All Smoke Test prerequisites, plus:

| Prerequisite                                                            | Verification                                                    |
|-------------------------------------------------------------------------|-----------------------------------------------------------------|
| Smoke Test completed and passed                                         | Smoke Test results record shows PASS                            |
| Test M365 tenant with known configuration state                         | Reference baseline document available for comparison            |
| Expected findings baseline for test tenant                              | JSON or spreadsheet of expected finding statuses per check      |
| Microsoft Edge (Chromium) installed for PDF generation                  | `(Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Edge').Version`    |
| Sufficient disk space for assessment output (~500 MB)                   | `Get-PSDrive C \| Select Used, Free`                            |

### 5.2 Full Verification Steps

#### Phase 1: Assessment Execution (Checklist Item 6)

```powershell
# =============================================================================
# Full Verification - Phase 1: Assessment Execution
# =============================================================================

# Run a complete assessment against the test tenant
$assessmentParams = @{
    ProfileName     = "TestTenant"
    OutputDirectory = ".\output\verification-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Modules         = @("EntraID", "DeviceManagement", "EmailProtection", "TeamsSharePoint")
}
Start-M365Assessment @assessmentParams

# Expected: Assessment completes without errors
# Expected: All 87+ checks execute (some may return NotApplicable based on tenant config)

# Review the assessment summary
# Expected: Total checks, pass/fail/NA counts displayed
# Compare finding results against the expected findings baseline
```

**Finding Comparison Checklist**:

| Assessment Module    | Total Checks | Expected Compliant | Expected NonCompliant | Expected NotApplicable | Actual Match? |
|----------------------|-------------|--------------------|-----------------------|------------------------|---------------|
| EntraID              | 39          |                    |                       |                        | [ ]           |
| DeviceManagement     | 18          |                    |                       |                        | [ ]           |
| EmailProtection      | 13          |                    |                       |                        | [ ]           |
| TeamsSharePoint      | 17          |                    |                       |                        | [ ]           |
| **Total**            | **87**      |                    |                       |                        | [ ]           |

> **Note**: Fill in the "Expected" columns from the reference baseline for your test tenant. The actual finding counts must match within tolerance (account for any known test tenant configuration changes since the baseline was last updated).

#### Phase 2: Report Generation (Checklist Item 7)

```powershell
# =============================================================================
# Full Verification - Phase 2: Report Generation
# =============================================================================

# Verify all report formats were generated
$outputDir = ".\output\verification-<timestamp>"

# HTML Report
$htmlReport = Get-ChildItem "$outputDir\reports\*.html"
# Expected: At least one HTML file exists
# Manual check: Open the HTML report in a browser
#   - Table of contents navigates to correct sections
#   - All findings displayed with correct severity colors
#   - Evidence links are functional
#   - No broken layout or missing assets

# PDF Report
$pdfReport = Get-ChildItem "$outputDir\reports\*.pdf"
# Expected: At least one PDF file exists (requires Edge installed)
# Manual check: Open the PDF
#   - Content matches the HTML report
#   - Pages are properly formatted
#   - No blank pages or truncated content

# DOCX Report
$docxReport = Get-ChildItem "$outputDir\reports\*.docx"
# Expected: At least one DOCX file exists
# Manual check: Open in Word
#   - Document structure is correct (headings, tables, styles)
#   - Finding data matches other report formats
#   - Document is editable without corruption warnings

# Excel Export (if applicable)
$excelExport = Get-ChildItem "$outputDir\reports\*.xlsx" -ErrorAction SilentlyContinue
# Check if Excel export was generated
```

**Report Validation Matrix**:

| Report Format | File Generated? | File Size > 0? | Content Visually Correct? | Status |
|---------------|-----------------|-----------------|---------------------------|--------|
| HTML          | [ ]             | [ ]             | [ ]                       |        |
| PDF           | [ ]             | [ ]             | [ ]                       |        |
| DOCX          | [ ]             | [ ]             | [ ]                       |        |
| Excel         | [ ]             | [ ]             | [ ]                       |        |

#### Phase 3: Dashboard Verification (Checklist Item 8)

```powershell
# =============================================================================
# Full Verification - Phase 3: Dashboard
# =============================================================================

# Start the Pode web dashboard
Start-M365Dashboard

# Expected: Dashboard starts on http://localhost:8080
# Manual checks:
#   1. Open http://localhost:8080 in a browser
#   2. Dashboard home page loads without errors
#   3. Assessment results from the verification run are visible
#   4. Finding browser displays all findings with correct data
#   5. Severity distribution chart renders correctly
#   6. Domain-level status shows all four assessment modules
#   7. Evidence viewer can open and display evidence files

# Stop the dashboard after verification
Stop-M365Dashboard
```

**Dashboard Validation Matrix**:

| Dashboard Feature               | Functional? | Status |
|---------------------------------|-------------|--------|
| Home page loads                 | [ ]         |        |
| Assessment results displayed    | [ ]         |        |
| Finding browser works           | [ ]         |        |
| Severity distribution chart     | [ ]         |        |
| Domain-level status correct     | [ ]         |        |
| Evidence viewer operational     | [ ]         |        |

#### Phase 4: Controls Database Verification (Checklist Item 9)

```powershell
# =============================================================================
# Full Verification - Phase 4: Controls Database
# =============================================================================

# Verify the controls database exists and has the correct schema
Test-Path .\controls.db
# Expected: True

# Query the database for finding count (requires PSSQLite)
Import-Module PSSQLite
$db = ".\controls.db"
$findingCount = (Invoke-SqliteQuery -DataSource $db -Query "SELECT COUNT(*) as Count FROM findings").Count
Write-Host "Total findings in database: $findingCount"
# Expected: Count matches the number of finding definitions in findings.json

# Verify assessment data was persisted
$assessments = Invoke-SqliteQuery -DataSource $db -Query "SELECT * FROM assessments ORDER BY created_at DESC LIMIT 5"
$assessments | Format-Table
# Expected: Verification assessment run appears in the results
```

#### Phase 5: New/Modified Finding Validation (Checklist Item 10)

This phase is only required when the release introduces new checks or modifies existing check logic.

```powershell
# =============================================================================
# Full Verification - Phase 5: New/Modified Findings
# =============================================================================

# Identify new or modified findings in this release
# Compare findings.json against the previous version:
git diff v<previous-version>..v<current-version> -- FindingDefinitions/findings.json

# For each new or modified finding:
# 1. Verify the finding appears in the assessment output
# 2. Verify the compliance status matches the expected result for the test tenant
# 3. Verify the evidence CSV contains the expected data fields
# 4. Verify the finding details in the HTML report are complete and accurate
```

**New/Modified Finding Validation Matrix**:

| Finding ID | Finding Name | Change Type | Expected Status | Actual Status | Evidence Valid? | Report Correct? | Status |
|------------|-------------|-------------|-----------------|---------------|-----------------|-----------------|--------|
|            |             | New / Modified |              |               | [ ]             | [ ]             |        |
|            |             | New / Modified |              |               | [ ]             | [ ]             |        |
|            |             | New / Modified |              |               | [ ]             | [ ]             |        |

---

## 6. Verification Failure Handling

If any verification item fails, follow the decision matrix below.

| Failure Severity | Criteria                                                                                   | Action                                                                                    |
|------------------|--------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| **Critical**     | Module fails to import, Pester tests fail, or credential profiles cannot load              | Initiate rollback immediately. Do not use this version for any client assessment.          |
| **High**         | Assessment produces incorrect finding results, or a report format fails to generate        | Do not use this version for client assessments. Report to Module Author for hotfix.        |
| **Medium**       | Dashboard has rendering issues, or a single non-critical finding has incorrect evidence     | Proceed with caution. Document the issue. Use alternative report format if one fails.      |
| **Low**          | Cosmetic issues in reports, minor log formatting, or non-blocking warnings during import   | Proceed with this version. Document the issue for the next release.                       |

### Failure Escalation Path

| Step | Action                                                                                          |
|------|-------------------------------------------------------------------------------------------------|
| 1    | Document the failure: which checklist item failed, the exact error message, and steps to reproduce |
| 2    | Notify the Module Author via Teams or email with the failure documentation                      |
| 3    | If Critical or High severity: initiate rollback per the [Rollback Procedures](./rollback-procedures.md) |
| 4    | Module Author triages and determines fix timeline                                                |
| 5    | Module Author issues a hotfix release or confirms rollback as the interim solution               |

---

## 7. Sign-Off Record

After completing verification, the consultant records their sign-off below. For major releases, the Module Author and Security Consultant Lead must also sign off before the release is approved for client assessments.

### Consultant Sign-Off (Required for All Releases)

| Field                  | Value                              |
|------------------------|------------------------------------|
| Module Version         |                                    |
| Verification Level     | Smoke Test / Full Verification     |
| Consultant Name        |                                    |
| Workstation Name       |                                    |
| Date / Time            |                                    |
| PowerShell Version     |                                    |
| Overall Result         | PASS / FAIL                        |
| Items Failed (if any)  |                                    |
| Failure Details        |                                    |
| Rollback Initiated?    | Yes / No                           |

### Release Approval Sign-Off (Required for Minor and Major Releases)

| Role                     | Name                | Verification Level  | Result      | Date       | Signature / Approval |
|--------------------------|---------------------|---------------------|-------------|------------|----------------------|
| Module Author            | ___________________ | Full Verification   |             | __________ | [ ] Approved         |
| Security Consultant Lead | ___________________ | Full Verification   |             | __________ | [ ] Approved         |
| Platform Owner           | ___________________ | Review sign-offs    |             | __________ | [ ] Approved         |

> **Note**: A release is not approved for client assessments until at least the Module Author and one Security Consultant have completed Full Verification with a PASS result and signed off above.

---

## 8. Verification Environment Reference

### Test Tenant Configuration Baseline

The test M365 tenant should be maintained in a known configuration state that produces a predictable set of findings. This enables consistent verification across releases.

| Configuration Area      | Test Tenant State                                                                    | Purpose                                                |
|-------------------------|--------------------------------------------------------------------------------------|--------------------------------------------------------|
| Conditional Access      | 3 policies enabled (MFA for admins, block legacy auth, require compliant devices)    | Validates EntraID CA checks produce expected pass/fail |
| MFA                     | Enabled for all users via Security Defaults                                          | Validates MFA enforcement checks                       |
| PIM                     | Configured with 2 eligible role assignments                                          | Validates PIM configuration checks                     |
| Intune                  | 1 compliance policy, 1 device configuration profile, BitLocker policy enabled        | Validates DeviceManagement checks                      |
| Email Protection        | DKIM enabled, DMARC published, SPF valid, Safe Links default policy                 | Validates EmailProtection checks                       |
| Teams                   | Default meeting and messaging policies, external access restricted                   | Validates TeamsSharePoint checks                       |
| SharePoint              | External sharing restricted to authenticated guests only                             | Validates sharing policy checks                        |

### Maintaining the Baseline

| Action                                                   | Frequency       | Responsible          |
|----------------------------------------------------------|-----------------|----------------------|
| Review test tenant configuration against baseline        | Before each major release verification | Module Author |
| Update expected findings document if tenant config changes | As needed       | Module Author        |
| Rotate test tenant credentials                           | Quarterly       | Module Author        |
| Document any intentional baseline changes                | As needed       | Module Author        |

---

## 9. Related Documents

| Document                                                  | Relationship                                              |
|-----------------------------------------------------------|-----------------------------------------------------------|
| [Release Notes Template](./release-notes-template.md)     | Defines what changed in each release; informs verification scope |
| [Rollback Procedures](./rollback-procedures.md)           | Invoked when verification fails at Critical or High severity |
| [Test Strategy](../06-testing/test-strategy.md)           | Defines the Pester test suite executed during verification |
| [CI/CD Strategy](../05-cicd-pipeline/github-actions-overview.md) | Future automated verification via CI pipeline       |

---

## Revision History

| Version | Date       | Author              | Changes                                                       |
|---------|------------|----------------------|---------------------------------------------------------------|
| 1.0     | 2026-02-15 | IntelliSec Solutions | Initial post-release verification procedures with smoke test and full verification |
