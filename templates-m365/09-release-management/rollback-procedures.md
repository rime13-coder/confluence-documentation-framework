# Rollback Procedures

| **Page Title**   | M365-SecurityAssessment - Rollback Procedures            |
|------------------|----------------------------------------------------------|
| **Last Updated** | 2026-02-15                                               |
| **Status**       | `CURRENT`                                                |
| **Owner**        | IntelliSec Solutions                                     |
| **Module**       | M365-SecurityAssessment v1.0.0                           |

---

## 1. Document Purpose

This document defines the rollback procedures for the M365-SecurityAssessment PowerShell module. Because the module is distributed via `git clone` and runs locally on consultant workstations, rollback is performed through git version control operations rather than traditional deployment rollback. This document covers when to roll back, how to roll back each component, how to verify the rollback, and how to communicate rollback decisions to affected assessment engagements.

---

## 2. Rollback Decision Criteria

A rollback should be initiated when a new release introduces issues that materially impact assessment accuracy, module stability, or consultant productivity. The table below defines the criteria for triggering a rollback decision.

| # | Trigger Condition                                                                                 | Severity  | Example                                                                                          |
|---|---------------------------------------------------------------------------------------------------|-----------|--------------------------------------------------------------------------------------------------|
| 1 | **Finding logic errors**: One or more checks produce incorrect results (false positives or false negatives) that would compromise assessment deliverables | Critical  | EntraID MFA check reports Compliant when MFA is not enforced; DeviceManagement BitLocker check flags compliant devices as NonCompliant |
| 2 | **Breaking API changes**: A new release introduces calls to Microsoft Graph or Exchange Online endpoints that fail on production tenants | High      | Graph API beta endpoint removed or schema changed; Exchange Online cmdlet parameter renamed or removed |
| 3 | **Dependency conflicts**: Updated or new module dependencies conflict with existing installed modules on consultant workstations | High      | Microsoft.Graph v2.x conflicts with ExchangeOnlineManagement v3.x shared assemblies; Pode version mismatch crashes dashboard |
| 4 | **Module import failure**: The module fails to load via `Import-Module` due to manifest errors, missing files, or syntax errors | Critical  | `.psd1` manifest references a function that does not exist; `.psm1` has a parse error preventing module load |
| 5 | **Credential profile incompatibility**: Updated credential schema prevents loading of existing encrypted credential profiles | High      | New required field in credential profile breaks `Get-M365Credential` for all existing profiles |
| 6 | **Report generation failure**: One or more report formats fail to generate correctly | Medium    | PSWriteWord template change breaks DOCX generation; HTML report missing CSS or JavaScript assets |
| 7 | **Data loss or corruption**: Assessment data, evidence files, or database entries are lost or corrupted by the update | Critical  | SQLite schema migration deletes historical assessment records; checkpoint file format change invalidates in-progress assessments |

### Decision Authority

| Decision                                 | Authority                          | Escalation Path                         |
|------------------------------------------|------------------------------------|-----------------------------------------|
| Rollback on individual consultant workstation | Security Consultant (self-service) | Notify Module Author                    |
| Rollback recommendation for all consultants  | Module Author / Lead Developer      | Notify Platform Owner                   |
| Mandatory rollback for active engagements    | Platform Owner                      | Email notification to all consultants   |

---

## 3. Rollback Architecture Overview

The M365-SecurityAssessment module has four distinct components that may be affected by a rollback. Each component has different rollback characteristics.

| Component                | Storage Location                                                  | Rollback Method                  | Impact of Rollback                                         |
|--------------------------|-------------------------------------------------------------------|----------------------------------|------------------------------------------------------------|
| **Module Code**          | Local git repository (e.g., `C:\Tools\M365-SecurityAssessment`)  | `git checkout` to previous tag   | Reverts all PowerShell scripts, manifests, and templates   |
| **Credential Profiles**  | `%APPDATA%\M365-SecurityAssessment\credentials\`                 | No rollback needed (see 3.2)     | Profiles are forward-compatible; schema additions are optional fields |
| **Controls Database**    | `controls.db` in module directory                                 | Auto-rebuilds from code (see 3.3)| Database rebuilds from `findings.json` in the rolled-back code |
| **Assessment Outputs**   | Output directories per assessment run                             | Not affected (see 3.4)           | Outputs are independent of module version; previous reports remain intact |

### 3.1 Module Code Rollback

The module code is the primary rollback target. Rolling back the code reverts all PowerShell scripts (collectors, checks, engine), the module manifest (`.psd1`), configuration files (`findings.json`, `assessment-defaults.json`, `logic-definitions.json`), and report templates.

**Key behavior**: Because the module is a git repository, rollback is a `git checkout` to the desired version tag or commit SHA. No installer, package manager, or deployment pipeline is involved.

### 3.2 Credential Profile Compatibility

Credential profiles stored under `%APPDATA%\M365-SecurityAssessment\credentials\` are designed to be forward-compatible. New releases may add optional fields to the credential schema, but existing profiles remain loadable.

| Scenario                                     | Rollback Impact                                              | Action Required                   |
|----------------------------------------------|--------------------------------------------------------------|-----------------------------------|
| New release adds optional credential fields  | Rolling back removes awareness of new fields; profiles still load | None                              |
| New release adds required credential fields  | Rolling back removes the requirement; profiles still load    | None (rolled-back code does not expect the new fields) |
| New release changes credential encryption    | Rolling back may prevent loading profiles saved with new encryption | Re-save profiles after rollback using `Save-M365Credential` |

> **Important**: If a release changed the DPAPI encryption scope or credential serialization format (rare), profiles saved under the new version may not decrypt under the rolled-back version. In this case, consultants must re-enter and re-save their credential profiles after rollback.

### 3.3 Controls Database Rollback

The SQLite controls database (`controls.db`) is auto-built from `findings.json` when the module initializes. Rolling back the module code to a previous version also rolls back `findings.json`, and the controls database will automatically rebuild on the next module initialization to match the rolled-back finding definitions.

| Scenario                                         | Behavior                                                      |
|--------------------------------------------------|---------------------------------------------------------------|
| Rolled-back code has fewer finding definitions   | Database rebuilds with fewer entries; new findings are removed |
| Rolled-back code has different finding metadata   | Database rebuilds with the rolled-back metadata               |
| Historical assessment records in database         | Assessment records are preserved; only finding definitions are rebuilt |

**Recommendation**: Before rolling back, export any assessment data that may be affected:

```powershell
# Export current controls database before rollback
Copy-Item .\controls.db .\controls.db.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')
```

### 3.4 Assessment Output Preservation

Assessment outputs (reports, evidence CSVs, logs) are written to per-assessment output directories that are independent of the module version. Rolling back the module code does not affect previously generated outputs.

| Output Type        | Location                                         | Rollback Impact |
|--------------------|--------------------------------------------------|-----------------|
| HTML Reports       | `output/<assessment-id>/reports/`                | None            |
| PDF Reports        | `output/<assessment-id>/reports/`                | None            |
| DOCX Reports       | `output/<assessment-id>/reports/`                | None            |
| Excel Exports      | `output/<assessment-id>/reports/`                | None            |
| Evidence CSVs      | `output/<assessment-id>/evidence/`               | None            |
| JSONL Logs         | `output/<assessment-id>/logs/`                   | None            |
| Checkpoint Files   | `output/<assessment-id>/checkpoint.json`         | See note below  |

> **Note on Checkpoints**: If a rollback occurs while an assessment is in progress, the checkpoint file may reference checks or collectors that do not exist in the rolled-back version. In this case, delete the checkpoint file and restart the assessment from the beginning.

---

## 4. Step-by-Step Rollback Procedure

### 4.1 Pre-Rollback Checklist

Complete the following checklist before initiating a rollback.

| # | Item                                                                                    | Status  |
|---|-----------------------------------------------------------------------------------------|---------|
| 1 | Confirm the rollback trigger condition from Section 2                                   | [ ]     |
| 2 | Identify the target rollback version (tag or commit SHA)                                | [ ]     |
| 3 | Notify affected consultants that a rollback is in progress                              | [ ]     |
| 4 | Confirm no assessments are currently running on the workstation                          | [ ]     |
| 5 | Back up the controls database (`controls.db`)                                           | [ ]     |
| 6 | Document the issue that triggered the rollback (for post-mortem)                        | [ ]     |

### 4.2 Module Code Rollback Steps

```powershell
# Step 1: Navigate to the module directory
cd C:\Tools\M365-SecurityAssessment

# Step 2: Verify current version
Get-Content .\M365-SecurityAssessment.psd1 | Select-String "ModuleVersion"

# Step 3: List available version tags
git tag -l "v*" --sort=-version:refname

# Step 4: Stash any local changes (if any)
git stash

# Step 5: Check out the target version
# Option A: Roll back to a specific tag
git checkout v0.3.0

# Option B: Roll back to a specific commit SHA
git checkout abc1234

# Step 6: Verify the rolled-back version
Get-Content .\M365-SecurityAssessment.psd1 | Select-String "ModuleVersion"

# Step 7: Close any PowerShell sessions that have the module loaded
# Then open a new PowerShell session and import the rolled-back module
Import-Module C:\Tools\M365-SecurityAssessment\M365-SecurityAssessment.psd1 -Force

# Step 8: Verify the module loaded with the correct version
Get-Module M365-SecurityAssessment | Select-Object Name, Version
```

> **Important**: After `git checkout` to a tag, git will be in "detached HEAD" state. This is expected for a rollback scenario. If you need to make fixes on the rolled-back version, create a branch: `git checkout -b hotfix/rollback-fix`.

### 4.3 Controls Database Rebuild

After rolling back the module code, force a controls database rebuild.

```powershell
# Option 1: Delete the existing database and let the module rebuild it
Remove-Item .\controls.db -ErrorAction SilentlyContinue

# Option 2: Or simply re-import the module; it will detect a stale DB and rebuild
Import-Module .\M365-SecurityAssessment.psd1 -Force
```

### 4.4 Dependency Rollback (If Required)

If the rollback was triggered by a dependency conflict, the consultant may also need to rollback the conflicting PowerShell module dependency.

```powershell
# List installed versions of a dependency
Get-Module -Name Pode -ListAvailable

# Install a specific previous version
Install-Module -Name Pode -RequiredVersion 2.12.1 -Scope CurrentUser -Force

# Verify the correct version is loaded
Import-Module Pode -RequiredVersion 2.12.1
Get-Module Pode | Select-Object Name, Version
```

**Dependency version matrix for v1.0.0**:

| Module                   | Required Version | Notes                                     |
|--------------------------|------------------|-------------------------------------------|
| Pode                     | 2.12.1           | Exact version required for dashboard      |
| PSWriteWord              | 1.1.14           | Exact version required for DOCX reports   |
| Pester                   | 3.4.0            | V3 syntax required by test suite          |
| Microsoft.Graph          | 2.0+             | Minimum version; latest compatible        |
| ExchangeOnlineManagement | 3.x              | Major version 3 required                  |
| MicrosoftTeams           | Latest           | Latest stable version                     |
| PSSQLite                 | Latest           | Latest stable version                     |
| ImportExcel              | Latest           | Latest stable version                     |

### 4.5 Checkpoint Cleanup (If Assessment Was In Progress)

If a rollback occurs while an assessment was in progress, clean up the checkpoint to avoid conflicts.

```powershell
# Identify in-progress assessment directories
Get-ChildItem .\output\ -Directory | Where-Object {
    Test-Path (Join-Path $_.FullName "checkpoint.json")
} | ForEach-Object {
    Write-Host "In-progress assessment: $($_.Name)"
    Write-Host "  Checkpoint: $(Join-Path $_.FullName 'checkpoint.json')"
}

# Delete checkpoint for an in-progress assessment (assessment will restart from beginning)
Remove-Item .\output\<assessment-id>\checkpoint.json -ErrorAction SilentlyContinue
```

---

## 5. Rollback Verification Checklist

After completing the rollback procedure, verify the following items to confirm the rollback was successful.

| # | Verification Item                                                    | Command / Procedure                                              | Expected Result                           | Status  |
|---|----------------------------------------------------------------------|------------------------------------------------------------------|-------------------------------------------|---------|
| 1 | Module version matches target rollback version                       | `Get-Module M365-SecurityAssessment \| Select Version`           | Target version number displayed            | [ ]     |
| 2 | Module imports without errors                                        | `Import-Module .\M365-SecurityAssessment.psd1 -Force`           | No errors or warnings                     | [ ]     |
| 3 | Module manifest is valid                                             | `Test-ModuleManifest .\M365-SecurityAssessment.psd1`            | Manifest validates successfully            | [ ]     |
| 4 | All Pester tests pass                                                | `Invoke-Pester .\Tests\`                                        | All tests pass; zero failures             | [ ]     |
| 5 | Credential profiles load correctly                                   | `Get-M365Credential -ProfileName <name>`                        | Credential object returned without errors | [ ]     |
| 6 | Controls database rebuilt successfully                               | Check `controls.db` exists and has expected row count            | Database present with correct schema      | [ ]     |
| 7 | Previous assessment outputs are intact                               | Browse `output/` directories; verify reports and evidence exist  | All previous output files present         | [ ]     |
| 8 | The issue that triggered the rollback is resolved                    | Reproduce the original issue                                     | Issue no longer occurs                    | [ ]     |
| 9 | Git status is clean (no unexpected modified files)                   | `git status`                                                     | Clean working tree or expected detached HEAD | [ ]  |
| 10| Dashboard starts correctly (if applicable to rolled-back version)    | Start the Pode dashboard and access `http://localhost:8080`      | Dashboard loads without errors            | [ ]     |

---

## 6. Communication Plan

When a rollback is initiated, the following communication steps must be followed to ensure all affected parties are informed and assessments in progress are handled appropriately.

### 6.1 Notification Timeline

| Timing                     | Action                                                                                   | Audience                     | Channel              |
|----------------------------|------------------------------------------------------------------------------------------|------------------------------|----------------------|
| Immediately (T+0)         | Announce rollback decision and reason                                                    | All security consultants     | Teams channel + Email |
| Within 30 minutes (T+30)  | Provide rollback instructions and target version                                         | All security consultants     | Teams channel + Email |
| Within 2 hours (T+2h)     | Confirm all consultants have completed rollback                                          | Module Author / Platform Owner | Teams channel        |
| Within 24 hours (T+24h)   | Publish post-mortem summary with root cause and fix timeline                             | All security consultants     | Confluence + Email   |

### 6.2 Notification Template

```
Subject: [M365-SecurityAssessment] Rollback to vX.Y.Z - Action Required

Team,

We are rolling back M365-SecurityAssessment from vA.B.C to vX.Y.Z due to:
[Brief description of the issue]

Impact:
- [Which checks/modules/reports are affected]
- [Whether in-progress assessments are impacted]

Required Action:
1. Stop any in-progress assessments
2. Open a new PowerShell session
3. Navigate to your M365-SecurityAssessment directory
4. Run: git checkout vX.Y.Z
5. Run: Import-Module .\M365-SecurityAssessment.psd1 -Force
6. Verify: Get-Module M365-SecurityAssessment | Select Version
7. Complete the rollback verification checklist (link)

Assessments affected:
- [List any client assessments that may need re-evaluation]

Timeline for fix:
- [Expected date for corrected release]

Contact [Module Author] with questions.
```

### 6.3 Assessment Impact Handling

| Scenario                                                        | Action                                                                                |
|-----------------------------------------------------------------|---------------------------------------------------------------------------------------|
| Assessment completed with the flawed version before rollback    | Review affected findings; re-run specific checks if finding logic was incorrect        |
| Assessment in progress during rollback                          | Delete checkpoint; restart assessment from the beginning on rolled-back version        |
| Reports already delivered to client with incorrect findings     | Notify client; re-run assessment on rolled-back version; deliver corrected reports     |
| Assessment not yet started                                      | No action needed; proceed with rolled-back version                                     |

---

## 7. Rollback Scenarios and Runbooks

### Scenario A: Finding Logic Error

**Trigger**: A check produces incorrect compliance status (false positive or false negative).

| Step | Action                                                                                          |
|------|-------------------------------------------------------------------------------------------------|
| 1    | Identify the affected finding ID(s) and assessment module                                       |
| 2    | Determine which client assessments used the affected check                                      |
| 3    | Follow Section 4 rollback procedure to revert to the last known-good version                    |
| 4    | Re-run affected assessments against the rolled-back module                                      |
| 5    | Compare new results with previously delivered reports                                           |
| 6    | If client reports were affected, follow Assessment Impact Handling (Section 6.3)                |

### Scenario B: Dependency Conflict

**Trigger**: Module fails to import or crashes during assessment due to module dependency conflict.

| Step | Action                                                                                          |
|------|-------------------------------------------------------------------------------------------------|
| 1    | Identify the conflicting dependency (check error messages for module name and version)           |
| 2    | Follow Section 4.2 to roll back module code                                                     |
| 3    | Follow Section 4.4 to roll back the conflicting dependency to the version required by the target release |
| 4    | Verify module imports and all tests pass                                                        |
| 5    | Document the dependency conflict for the Module Author to resolve in the next release           |

### Scenario C: Breaking API Change

**Trigger**: Microsoft Graph API or Exchange Online endpoint change causes collector failures.

| Step | Action                                                                                          |
|------|-------------------------------------------------------------------------------------------------|
| 1    | Identify the affected collector(s) and API endpoint(s) from error logs                          |
| 2    | Determine if the API change is temporary (outage) or permanent (deprecation)                    |
| 3    | If temporary: wait and retry. If permanent: roll back module code to the last version that did not call the removed endpoint |
| 4    | Affected checks will report "Unable to Assess" on the rolled-back version if the collector was newly added |
| 5    | Module Author to issue a hotfix release with updated API calls                                  |

---

## 8. Approval and Sign-Off

| Role                     | Name                | Date       | Signature / Approval |
|--------------------------|---------------------|------------|----------------------|
| Module Author            | ___________________ | __________ | [ ] Approved         |
| Security Consultant Lead | ___________________ | __________ | [ ] Approved         |
| Platform Owner           | ___________________ | __________ | [ ] Approved         |

---

## Revision History

| Version | Date       | Author              | Changes                                                    |
|---------|------------|----------------------|------------------------------------------------------------|
| 1.0     | 2026-02-15 | IntelliSec Solutions | Initial rollback procedures for M365-SecurityAssessment    |
