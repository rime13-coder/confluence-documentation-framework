# Release Notes Template

| **Page Title**   | M365-SecurityAssessment - Release Notes                |
|------------------|--------------------------------------------------------|
| **Last Updated** | 2026-02-15                                             |
| **Status**       | `CURRENT`                                              |
| **Owner**        | IntelliSec Solutions                                   |
| **Module**       | M365-SecurityAssessment v1.0.0                         |

---

## 1. Release Notes Format

All release notes for the M365-SecurityAssessment module follow the standard format documented below. Each release is published as a page under this section and linked from the module's main Confluence space. Release notes serve as the single source of truth for what changed between versions, what consultants need to do after updating, and what issues remain open.

### Standard Release Note Structure

| Section               | Description                                                                                      |
|-----------------------|--------------------------------------------------------------------------------------------------|
| **Version**           | Semantic version number (e.g., v1.0.0). Must match `ModuleVersion` in `M365-SecurityAssessment.psd1`. |
| **Release Date**      | ISO 8601 date (YYYY-MM-DD) when the version was tagged and announced.                            |
| **Release Summary**   | One-paragraph overview of the release purpose, scope, and significance.                          |
| **New Features**      | Bulleted list of new capabilities, modules, checks, or integrations added.                       |
| **Bug Fixes**         | Bulleted list of defects resolved, referencing issue numbers where applicable.                    |
| **Breaking Changes**  | Any changes that require consultant action, credential re-configuration, or workflow adjustments. |
| **Known Issues**      | Outstanding defects or limitations that consultants should be aware of in this release.           |
| **Upgrade Instructions** | Step-by-step procedure to update from the previous version.                                   |
| **Dependencies**      | Updated dependency versions or new dependencies introduced.                                      |

---

## 2. Release History

### v1.0.0 -- General Availability Release

| Field              | Value                                                    |
|--------------------|----------------------------------------------------------|
| **Version**        | v1.0.0                                                   |
| **Release Date**   | 2026-02-15                                               |
| **Status**         | `RELEASED`                                               |
| **Tag**            | `v1.0.0`                                                 |
| **Commit**         | *(insert SHA from `git log --oneline -1 v1.0.0`)*       |

#### Release Summary

The v1.0.0 General Availability release of M365-SecurityAssessment delivers the complete automated security assessment platform for Microsoft 365 tenants. This release includes four fully implemented assessment modules covering 87+ active security controls, multi-format report generation, a real-time web dashboard, secure credential management, and a SQLite-backed controls database. This is the first production release intended for full adoption by IntelliSec Solutions security consultants.

#### New Features

- **EntraID Assessment Module (39 checks)**: Automated evaluation of Conditional Access policies, MFA enforcement, PIM configuration, authentication methods, sign-in risk policies, user risk policies, password policies, guest access controls, admin role assignments, break glass account validation, and legacy authentication blocking.
- **DeviceManagement Assessment Module (18 checks)**: Automated evaluation of Intune compliance policies, device enrollment restrictions, BitLocker encryption, Windows Update rings, endpoint protection profiles, device configuration profiles, and mobile device management settings.
- **EmailProtection Assessment Module (13 checks)**: Automated evaluation of DKIM configuration, DMARC policy validation, SPF record verification, Safe Links policies, Safe Attachments policies, anti-phishing policies, anti-spam policies, mail flow rules, and quarantine policies.
- **TeamsSharePoint Assessment Module (17 checks)**: Automated evaluation of external sharing settings, guest access policies, Teams meeting policies, Teams messaging policies, SharePoint site-level permissions, OneDrive sharing configuration, sensitivity labels, and DLP policies.
- **Multi-Format Report Generation**: HTML report with interactive navigation, PDF report via Edge headless rendering, DOCX report via PSWriteWord, Excel export via ImportExcel.
- **Web Dashboard**: Pode-based local web dashboard (localhost:8080) with real-time assessment progress, finding browser, severity distribution charts, and domain-level status.
- **Credential Management**: DPAPI-encrypted credential profiles supporting multiple M365 tenant connections; per-profile storage under `%APPDATA%\M365-SecurityAssessment\credentials\`.
- **Controls Database**: SQLite-backed controls management via PSSQLite; auto-builds from `findings.json` definitions; supports historical assessment tracking.
- **Checkpoint/Resume**: Assessment progress persistence enabling recovery from network interruptions or workstation restarts.
- **Evidence Export**: Automated CSV export of raw configuration data and evaluation results for every assessed control.
- **Definition-Only Modules (Phase 4)**: Placeholder definitions for ApplicationProtection, DataProtection, VulnerabilityManagement, and FinSecOps domains (control definitions without automated evaluation logic).

#### Bug Fixes

- N/A (initial release).

#### Breaking Changes

- N/A (initial release).

#### Known Issues

| # | Description                                                                                     | Severity | Workaround                                   |
|---|-------------------------------------------------------------------------------------------------|----------|----------------------------------------------|
| 1 | Graph API beta endpoints for Intune security baselines may return inconsistent schema on some tenant configurations | Medium | Re-run assessment; baseline checks handle schema variations gracefully |
| 2 | PDF generation requires Microsoft Edge (Chromium) installed; fails silently if Edge is missing   | Low      | Use HTML or DOCX report format as alternative |
| 3 | Very large tenants (50,000+ users) may experience Graph API throttling extending assessment beyond 60 minutes | Low | Assessment checkpoint/resume handles this; re-run continues from last checkpoint |

#### Dependencies

| Module                       | Required Version | Notes                                       |
|------------------------------|------------------|---------------------------------------------|
| Microsoft.Graph              | 2.0+             | Microsoft 365 Graph API access              |
| ExchangeOnlineManagement     | 3.x              | Exchange Online assessment                  |
| MicrosoftTeams               | Latest           | Teams configuration assessment              |
| Pode                         | 2.12.1           | Web dashboard server                        |
| PSSQLite                     | Latest           | SQLite database for controls tracking       |
| PSWriteWord                  | 1.1.14           | Word document report generation             |
| ImportExcel                  | Latest           | Excel report generation                     |
| Pester                       | 3.4.0            | Test framework (development/validation)     |

#### Upgrade Instructions

N/A (initial release). For first-time installation:

```powershell
# 1. Clone the repository
git clone <repo-url> C:\Tools\M365-SecurityAssessment

# 2. Install dependencies
Install-Module -Name Microsoft.Graph -MinimumVersion 2.0 -Scope CurrentUser
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
Install-Module -Name MicrosoftTeams -Scope CurrentUser
Install-Module -Name Pode -RequiredVersion 2.12.1 -Scope CurrentUser
Install-Module -Name PSSQLite -Scope CurrentUser
Install-Module -Name PSWriteWord -RequiredVersion 1.1.14 -Scope CurrentUser
Install-Module -Name ImportExcel -Scope CurrentUser
Install-Module -Name Pester -RequiredVersion 3.4.0 -Scope CurrentUser

# 3. Import the module
Import-Module C:\Tools\M365-SecurityAssessment\M365-SecurityAssessment.psd1

# 4. Validate the module loaded
Get-Module M365-SecurityAssessment | Select-Object Name, Version
```

---

### v0.3.0 -- Email Protection and Teams/SharePoint Modules

| Field              | Value                                                    |
|--------------------|----------------------------------------------------------|
| **Version**        | v0.3.0                                                   |
| **Release Date**   | 2025-12-15                                               |
| **Status**         | `SUPERSEDED`                                             |
| **Tag**            | `v0.3.0`                                                 |

#### Release Summary

The v0.3.0 release completes Phase 3 of the module roadmap, adding the EmailProtection assessment module (13 checks) and the TeamsSharePoint assessment module (17 checks). This release brings the total active security controls to 87. Additionally, Exchange Online certificate-based authentication is now fully supported, replacing the previous interactive authentication flow for unattended assessment scenarios.

#### New Features

- **EmailProtection Assessment Module (13 checks)**: DKIM configuration, DMARC policy validation, SPF record verification, Safe Links policies, Safe Attachments policies, anti-phishing policies, anti-spam policies, mail flow rules review, and quarantine policies.
- **TeamsSharePoint Assessment Module (17 checks)**: External sharing settings, guest access policies, Teams meeting policies, Teams messaging policies, SharePoint site-level permissions, OneDrive sharing configuration, sensitivity labels, and DLP policies for collaboration.
- **Exchange Online Certificate Authentication**: Support for `Connect-ExchangeOnline` using certificate thumbprint for unattended assessment execution; eliminates interactive authentication prompts.
- **Expanded Credential Profiles**: Credential profiles now support certificate thumbprint and certificate file path for Exchange Online connections alongside existing Graph API credentials.

#### Bug Fixes

- Fixed: EntraID Conditional Access policy collector failed silently when policies used `locationCondition` with named locations that had been deleted.
- Fixed: DeviceManagement compliance policy check incorrectly flagged tenants with zero enrolled devices as NonCompliant instead of NotApplicable.
- Fixed: HTML report table of contents did not include anchors for findings with special characters in the finding name.

#### Breaking Changes

- Credential profiles created in v0.2.0 must be re-saved to include the new `ExchangeOnlineCertificateThumbprint` field. Run `Save-M365Credential -ProfileName <name>` to update existing profiles.

#### Known Issues

| # | Description                                                                                     | Severity | Workaround                                   |
|---|-------------------------------------------------------------------------------------------------|----------|----------------------------------------------|
| 1 | Teams module `Get-CsTeamsMeetingPolicy` may timeout on tenants with 50+ custom meeting policies | Medium   | Increase timeout in assessment-defaults.json  |
| 2 | SharePoint site enumeration does not paginate beyond 5,000 sites                                | Low      | Manual review of remaining sites recommended  |

#### Upgrade Instructions

```powershell
# 1. Pull the latest code
cd C:\Tools\M365-SecurityAssessment
git pull origin main

# 2. Install new dependency (if not already installed)
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser -Force
Install-Module -Name MicrosoftTeams -Scope CurrentUser -Force

# 3. Re-import the module (new PowerShell session recommended)
Import-Module .\M365-SecurityAssessment.psd1 -Force

# 4. Re-save credential profiles to pick up new schema fields
Save-M365Credential -ProfileName <your-profile-name>

# 5. Verify
Get-Module M365-SecurityAssessment | Select-Object Name, Version
Test-ModuleManifest .\M365-SecurityAssessment.psd1
```

---

### v0.2.0 -- Device Management Module

| Field              | Value                                                    |
|--------------------|----------------------------------------------------------|
| **Version**        | v0.2.0                                                   |
| **Release Date**   | 2025-09-01                                               |
| **Status**         | `SUPERSEDED`                                             |
| **Tag**            | `v0.2.0`                                                 |

#### Release Summary

The v0.2.0 release delivers Phase 2 of the module roadmap, adding the DeviceManagement assessment module with 18 automated security checks covering Intune compliance policies, device enrollment, BitLocker encryption, Windows Update rings, and endpoint protection. This release also introduces Graph API beta endpoint support for advanced Intune policy evaluation, bringing the total active controls to 57.

#### New Features

- **DeviceManagement Assessment Module (18 checks)**: Intune compliance policies, device enrollment restrictions, BitLocker encryption enforcement, Windows Update ring configuration, endpoint protection profiles, device configuration profiles, and mobile device management settings.
- **Graph API Beta Endpoint Support**: Collectors now support Graph API beta endpoints for Intune security baselines, device configuration v2 policies, and Windows protection state. Beta endpoints are used when v1.0 endpoints do not expose required data.
- **Intune Policy Evaluation**: Check logic for evaluating complex Intune policy structures including nested OMA-URI settings, compliance action schedules, and platform-specific enrollment restrictions.
- **Assessment Summary Statistics**: New summary output at assessment completion showing total checks, pass/fail/NA counts, and severity distribution.

#### Bug Fixes

- Fixed: EntraID PIM role assignment collector did not handle tenants without Azure AD Premium P2 licensing; now returns NotApplicable.
- Fixed: Logger JSONL output included malformed JSON when log messages contained unescaped double quotes.
- Fixed: Checkpoint file was not created on first assessment run until the second check completed.

#### Breaking Changes

- None. Credential profiles from v0.1.0 are forward-compatible.

#### Upgrade Instructions

```powershell
# 1. Pull the latest code
cd C:\Tools\M365-SecurityAssessment
git pull origin main

# 2. Re-import the module
Import-Module .\M365-SecurityAssessment.psd1 -Force

# 3. Verify
Get-Module M365-SecurityAssessment | Select-Object Name, Version
Invoke-Pester .\Tests\
```

---

### v0.1.0 -- Initial EntraID Module

| Field              | Value                                                    |
|--------------------|----------------------------------------------------------|
| **Version**        | v0.1.0                                                   |
| **Release Date**   | 2025-06-01                                               |
| **Status**         | `SUPERSEDED`                                             |
| **Tag**            | `v0.1.0`                                                 |

#### Release Summary

The v0.1.0 release is the initial release of the M365-SecurityAssessment module, delivering the core assessment engine and the first assessment module -- EntraID (39 checks). This release establishes the foundational architecture including the collector-check-finding pipeline, DPAPI credential management, SQLite controls database, structured JSONL logging, and HTML report generation.

#### New Features

- **EntraID Assessment Module (39 checks)**: Conditional Access policies, MFA enforcement, PIM configuration, authentication methods, sign-in risk policies, user risk policies, password policies, guest access controls, admin role assignments, break glass account validation, and legacy authentication blocking.
- **Core Assessment Engine**: Orchestrator with collector-check pipeline, shared `$CollectedData` cache, function deduplication, and finding standardization.
- **DPAPI Credential Management**: `Save-M365Credential` and `Get-M365Credential` commands for encrypted credential profile storage and retrieval.
- **SQLite Controls Database**: `controls.db` auto-built from `findings.json` definitions via PSSQLite; stores finding metadata, assessment results, and control mappings.
- **HTML Report Generation**: Interactive HTML report with table of contents, severity color coding, finding details, and evidence links.
- **Structured Logging**: JSONL log files with timestamp, level, module, function, message, and context fields.
- **Checkpoint/Resume System**: Assessment progress persistence for recovery from interruptions.
- **29 Exported Functions**: Full public API surface with consistent `Verb-M365Noun` naming convention.

#### Bug Fixes

- N/A (initial release).

#### Breaking Changes

- N/A (initial release).

#### Known Issues

| # | Description                                                                                     | Severity | Workaround                                   |
|---|-------------------------------------------------------------------------------------------------|----------|----------------------------------------------|
| 1 | PDF and DOCX report generation not yet implemented; only HTML reports available                  | Medium   | Use HTML report for all deliverables         |
| 2 | Web dashboard not yet implemented                                                                | Low      | Review findings via HTML report or SQLite DB |
| 3 | No automated tests for EntraID check logic; validation is manual                                 | Medium   | Manual spot-check of findings against known tenant state |

#### Upgrade Instructions

N/A (initial release). See v1.0.0 installation instructions above.

---

## 3. Blank Template for Future Releases

Copy the template below when preparing release notes for a new version.

---

### vX.Y.Z -- Release Title

| Field              | Value                                                    |
|--------------------|----------------------------------------------------------|
| **Version**        | vX.Y.Z                                                   |
| **Release Date**   | YYYY-MM-DD                                               |
| **Status**         | `RELEASED` / `PRE-RELEASE` / `SUPERSEDED`                |
| **Tag**            | `vX.Y.Z`                                                 |
| **Commit**         | *(insert SHA from `git log --oneline -1 vX.Y.Z`)*       |

#### Release Summary

*(One paragraph summarizing the purpose, scope, and significance of this release.)*

#### New Features

- *(Bulleted list of new capabilities, modules, checks, or integrations.)*

#### Bug Fixes

- *(Bulleted list of defects resolved. Reference issue numbers where applicable.)*

#### Breaking Changes

- *(Any changes requiring consultant action, credential re-configuration, or workflow adjustments. Write "None" if no breaking changes.)*

#### Known Issues

| # | Description | Severity | Workaround |
|---|-------------|----------|------------|
| 1 |             |          |            |

#### Dependencies (Changed)

| Module | Previous Version | New Version | Change Type |
|--------|-----------------|-------------|-------------|
|        |                 |             | Added / Updated / Removed |

#### Upgrade Instructions

```powershell
# 1. Pull the latest code
cd C:\Tools\M365-SecurityAssessment
git pull origin main

# 2. Install or update dependencies (if changed)
# Install-Module -Name <module> -RequiredVersion <version> -Scope CurrentUser -Force

# 3. Re-import the module (new PowerShell session recommended)
Import-Module .\M365-SecurityAssessment.psd1 -Force

# 4. Run post-update verification
Test-ModuleManifest .\M365-SecurityAssessment.psd1
Invoke-Pester .\Tests\
Get-Module M365-SecurityAssessment | Select-Object Name, Version
```

---

## 4. Distribution Process

The M365-SecurityAssessment module is distributed manually via the private GitHub repository. There is no CI/CD pipeline or PowerShell Gallery publication at this time.

### Distribution Workflow

| Step | Action                                                | Command / Procedure                                          |
|------|-------------------------------------------------------|--------------------------------------------------------------|
| 1    | Developer finalizes code changes on feature branch    | `git push origin feature/<name>`                             |
| 2    | Developer merges to main branch                       | Merge PR or `git merge` to `main`                            |
| 3    | Developer updates `ModuleVersion` in `.psd1` manifest | Edit `M365-SecurityAssessment.psd1`, set `ModuleVersion`     |
| 4    | Developer tags the release                            | `git tag -a vX.Y.Z -m "Release vX.Y.Z"` then `git push --tags` |
| 5    | Developer publishes release notes to Confluence       | Copy from blank template above; fill in all sections         |
| 6    | Developer notifies consultants                        | Email or Teams message with version number and key changes   |
| 7    | Consultants pull the update                           | `git pull origin main`                                       |
| 8    | Consultants re-import the module                      | `Import-Module .\M365-SecurityAssessment.psd1 -Force`       |
| 9    | Consultants verify the update                         | Follow post-deployment verification checklist                |

### Version Numbering Convention

| Component | Meaning                                                               | Example        |
|-----------|-----------------------------------------------------------------------|----------------|
| Major     | Breaking changes to public API, credential schema, or finding format  | 1.0.0 -> 2.0.0 |
| Minor     | New assessment modules, new checks, new report formats                | 1.0.0 -> 1.1.0 |
| Patch     | Bug fixes, check logic corrections, documentation updates             | 1.0.0 -> 1.0.1 |

---

## 5. Approval and Sign-Off

| Role                     | Name                | Date       | Signature / Approval |
|--------------------------|---------------------|------------|----------------------|
| Module Author            | ___________________ | __________ | [ ] Approved         |
| Security Consultant Lead | ___________________ | __________ | [ ] Approved         |
| Platform Owner           | ___________________ | __________ | [ ] Approved         |

---

## Revision History

| Version | Date       | Author              | Changes                                                                |
|---------|------------|----------------------|------------------------------------------------------------------------|
| 1.0     | 2026-02-15 | IntelliSec Solutions | Initial release notes template with v0.1.0 through v1.0.0 examples    |
