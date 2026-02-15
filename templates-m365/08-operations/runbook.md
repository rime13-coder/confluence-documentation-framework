# Assessment Runbook

| **Metadata**     | **Value**                                                |
|------------------|----------------------------------------------------------|
| Page Title       | M365 Security Assessment Automation - Operations Runbook |
| Last Updated     | 2026-02-15                                               |
| Status           | `CURRENT`                                                |
| Owner            | Lead Developer / Security Operations                     |
| Reviewers        | Security Consultant Lead, Engineering Manager            |
| Version          | 1.0                                                      |

---

## 1. Document Purpose

This runbook provides step-by-step operational procedures for running M365 security assessments using the M365-SecurityAssessment PowerShell module. It covers pre-assessment setup, assessment execution (CLI and dashboard), progress monitoring, interrupted assessment recovery, and troubleshooting. This document is the primary reference for IntelliSec Solutions security consultants performing automated M365 tenant assessments.

---

## 2. Pre-Assessment Setup

Complete all steps in this section before initiating an assessment against a client M365 tenant.

### 2.1 Verify PowerShell Version and Dependencies

Confirm that the consultant workstation meets all runtime prerequisites.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open PowerShell and run `$PSVersionTable.PSVersion` | Version 5.1+ or 7.x displayed |
| 2 | Run `Get-Module -ListAvailable Microsoft.Graph` | Microsoft.Graph module listed with version |
| 3 | Run `Get-Module -ListAvailable ExchangeOnlineManagement` | ExchangeOnlineManagement 3.x listed |
| 4 | Run `Get-Module -ListAvailable MicrosoftTeams` | MicrosoftTeams module listed |
| 5 | Run `Get-Module -ListAvailable PSSQLite` | PSSQLite module listed |
| 6 | Run `Get-Module -ListAvailable Pode` | Pode module listed |
| 7 | Run `Get-Module -ListAvailable PSWriteWord` | PSWriteWord module listed |
| 8 | Run `Get-Module -ListAvailable ImportExcel` | ImportExcel module listed |
| 9 | Verify Microsoft Edge (Chromium) is installed at default path | Required for PDF report generation |

If any module is missing, install it:

```powershell
Install-Module -Name <ModuleName> -Scope CurrentUser -Force
```

### 2.2 Verify Azure AD App Registration and Permissions

Confirm that the target tenant has a properly configured App Registration for the assessment.

| Step | Action | Details |
|------|--------|---------|
| 1 | Confirm App Registration exists in target tenant | Must be a registered application with a known Application (client) ID |
| 2 | Verify required Graph API **application** permissions are granted | `Directory.Read.All`, `Policy.Read.All`, `DeviceManagementConfiguration.Read.All`, `DeviceManagementManagedDevices.Read.All`, `Mail.Read`, `Sites.Read.All`, `Organization.Read.All`, `RoleManagement.Read.Directory`, `IdentityRiskyUser.Read.All`, `IdentityRiskEvent.Read.All` |
| 3 | Verify Exchange Online permissions | App Registration certificate is registered; account has Exchange Administrator role or equivalent |
| 4 | Verify Teams permissions | `Skype and Teams Tenant Admin Center` or equivalent admin consent |
| 5 | Confirm admin consent has been granted | All permissions show "Granted for [tenant]" in Azure Portal |
| 6 | Confirm authentication credential is available | Client certificate (.pfx) installed on workstation **or** client secret recorded securely |

### 2.3 Save Credential Profile

Create an encrypted credential profile for the target tenant.

```powershell
Save-AssessmentCredential -ProfileName "ClientA" `
    -TenantId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" `
    -ClientId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" `
    -CertificateThumbprint "ABCDEF1234567890ABCDEF1234567890ABCDEF12"
```

For client-secret-based authentication:

```powershell
Save-AssessmentCredential -ProfileName "ClientA" `
    -TenantId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" `
    -ClientId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" `
    -ClientSecret (Read-Host -AsSecureString "Enter client secret")
```

Credential profiles are encrypted with DPAPI and stored at `%APPDATA%\M365-SecurityAssessment\credentials\`.

> **Note:** DPAPI-encrypted profiles are bound to the current Windows user and machine. They cannot be transferred to other workstations.

### 2.4 Test Connectivity

Validate that the credential profile can authenticate and reach all required M365 services.

```powershell
Connect-AssessmentTenant -CredentialProfile "ClientA"
```

| Expected Output | Meaning |
|-----------------|---------|
| `[INFO] Connected to Microsoft Graph API` | Graph API authentication successful |
| `[INFO] Connected to Exchange Online` | Exchange Online session established |
| `[INFO] Connected to Microsoft Teams` | Teams PowerShell session established |
| `[WARNING] Exchange Online connection failed: ...` | Check certificate and Exchange Admin role |
| `[ERROR] Authentication failed: ...` | Invalid credentials, expired secret, or missing permissions |

---

## 3. Running an Assessment (CLI)

### 3.1 Full Assessment (All Modules)

```powershell
# Step 1: Import the module
Import-Module M365-SecurityAssessment

# Step 2: Connect to the target tenant
Connect-AssessmentTenant -CredentialProfile "ClientA"

# Step 3: Start the assessment (all 4 modules)
Start-Assessment -EngagementName "ClientA_Q1" `
    -Modules @("EntraID", "DeviceManagement", "EmailProtection", "TeamsSharePoint")

# Step 4: Monitor progress output in the console
# Color-coded output: Green = Info, Yellow = Warning, Red = Error

# Step 5: Collect reports from output directory
Get-ChildItem -Path "output/ClientA_Q1/reports/"
```

### 3.2 Single Module Assessment

To run only a specific assessment domain:

```powershell
Start-Assessment -EngagementName "ClientA_EntraOnly" -Modules @("EntraID")
```

### 3.3 Assessment Output Directory Structure

After a completed assessment, the output directory contains:

```
output/
  ClientA_Q1/
    reports/
      ClientA_Q1_Assessment_Report.html
      ClientA_Q1_Assessment_Report.pdf
      ClientA_Q1_Assessment_Report.docx
      ClientA_Q1_Evidence_Summary.xlsx
    evidence/
      EntraID/
        ConditionalAccessPolicies.csv
        MFAStatus.csv
        RoleAssignments.csv
        ...
      DeviceManagement/
        CompliancePolicies.csv
        ...
      EmailProtection/
        DKIMStatus.csv
        ...
      TeamsSharePoint/
        SharingSettings.csv
        ...
    findings/
      findings.json
    logs/
      assessment_20260215_143022.jsonl
    checkpoints/
      checkpoint.json
```

---

## 4. Using the Web Dashboard

### 4.1 Start the Dashboard

```powershell
Import-Module M365-SecurityAssessment
Start-Dashboard
```

### 4.2 Access the Dashboard

| Step | Action |
|------|--------|
| 1 | Open a web browser on the same workstation |
| 2 | Navigate to `http://localhost:8080` |
| 3 | The dashboard home page displays available credential profiles and past assessments |

### 4.3 Dashboard Workflow

| Step | Action | Details |
|------|--------|---------|
| 1 | **Configure Tenant** | Select an existing credential profile or create a new one via the Settings page |
| 2 | **Run Assessment** | Click "New Assessment," enter engagement name, select modules, and click "Start" |
| 3 | **Monitor Progress** | The assessment progress page polls for status updates and displays real-time module completion, check counts, and finding summaries |
| 4 | **View Reports** | Once complete, navigate to the Reports page to view HTML findings, download PDF/DOCX reports, and browse evidence CSVs |
| 5 | **Review Findings** | The Findings browser allows filtering by severity, module, and compliance status |

### 4.4 Stop the Dashboard

Close the PowerShell session running the Pode server, or press `Ctrl+C` in the console.

---

## 5. Resuming an Interrupted Assessment

If an assessment is interrupted (network failure, workstation restart, manual cancellation), use the resume function to continue from the last checkpoint.

```powershell
Import-Module M365-SecurityAssessment
Connect-AssessmentTenant -CredentialProfile "ClientA"
Resume-Assessment -EngagementPath "output/ClientA_Q1"
```

| Behavior | Details |
|----------|---------|
| Checkpoint location | `output/{engagement}/checkpoints/checkpoint.json` |
| What is skipped | Completed collectors and checks recorded in the checkpoint file |
| What is re-run | The current in-progress module resumes from the last completed check |
| Report generation | Reports are generated (or regenerated) after all modules complete |

> **Important:** Do not manually edit or delete `checkpoint.json`. If the checkpoint file is corrupted, delete it and re-run the full assessment.

---

## 6. Troubleshooting Common Issues

### 6.1 Authentication Failures

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| `AADSTS700027: Client assertion contains an invalid signature` | Certificate mismatch or expired certificate | Verify the certificate thumbprint matches the App Registration; check certificate expiry with `Get-ChildItem Cert:\CurrentUser\My\<thumbprint>` |
| `AADSTS7000215: Invalid client secret provided` | Client secret has expired | Rotate the client secret in Azure Portal; update the credential profile with `Save-AssessmentCredential` |
| `AADSTS700016: Application not found in the directory` | Wrong TenantId or ClientId | Verify TenantId and ClientId in the credential profile match the App Registration in the target tenant |
| Token acquisition timeout | Network connectivity or proxy issue | Verify internet connectivity; check proxy settings; ensure `login.microsoftonline.com` and `graph.microsoft.com` are not blocked |

### 6.2 Graph API Errors

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| `403 Forbidden` on a specific API call | Missing application permission for that endpoint | Review the required permissions for the failing module; grant the missing permission in Azure Portal and re-consent |
| `429 Too Many Requests` | Graph API rate limiting (throttled) | The module retries automatically with exponential backoff (3 retries, 2s initial delay). For persistent throttling, wait 5-10 minutes and resume the assessment |
| `404 Not Found` on beta endpoint | Target tenant does not have the feature enabled, or Microsoft deprecated the endpoint | Check if the target tenant has the required license (e.g., Intune, P2). If the endpoint is deprecated, check for module updates |

### 6.3 Exchange Online Connection Failures

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| `The term 'Connect-ExchangeOnline' is not recognized` | ExchangeOnlineManagement module not installed | Run `Install-Module ExchangeOnlineManagement -Scope CurrentUser` |
| `Certificate not found in the local certificate store` | Certificate thumbprint does not match any installed certificate | Import the .pfx certificate to `Cert:\CurrentUser\My` using `Import-PfxCertificate` |
| `You don't have Exchange administrator permissions` | App Registration or service account lacks Exchange Admin role | Assign Exchange Administrator role to the App Registration's service principal in the target tenant |
| `New-ExchangeSession: Access Denied` | Admin consent not granted for Exchange Online | Grant admin consent for Exchange Online permissions in Azure Portal |

### 6.4 PIM Check Errors

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| `Privileged Identity Management data unavailable` | Target tenant does not have Azure AD P2 license | PIM checks require Azure AD Premium P2. These checks will report `NotApplicable` status. Inform the client that PIM assessment requires P2 licensing |
| `403 Forbidden` on PIM endpoints | Missing `RoleManagement.Read.Directory` permission | Grant the permission and re-consent |

### 6.5 PDF Export Failures

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| `Microsoft Edge executable not found` | Edge is not installed or not at the expected path | Install Microsoft Edge (Chromium) or set the Edge path in configuration: `Set-AssessmentConfig -EdgePath "C:\path\to\msedge.exe"` |
| PDF generation hangs | Edge headless process is stuck | Kill any orphaned `msedge.exe` processes with `Stop-Process -Name msedge -Force` and re-run report generation |
| PDF is blank or malformed | HTML template rendering issue | Use the HTML report as an alternative; report the issue for investigation |

### 6.6 Module Import Errors

| Symptom | Likely Cause | Resolution |
|---------|-------------|------------|
| `Import-Module: Could not load type from assembly` | Microsoft.Graph module version conflict with other loaded modules | Close all PowerShell sessions, open a fresh session, and import M365-SecurityAssessment first before any other modules |
| `Module 'X' version 'Y' is not compatible` | Dependency version mismatch | Run `Update-Module <ModuleName>` to update to the latest compatible version; check the module's requirements manifest for pinned versions |
| `Function 'X' already exists` | Another module exports a function with the same name | Use `-Prefix` parameter when importing conflicting modules, or load M365-SecurityAssessment in an isolated PowerShell session |

---

## 7. Quick Reference Card

| Task | Command |
|------|---------|
| Import module | `Import-Module M365-SecurityAssessment` |
| Save credentials | `Save-AssessmentCredential -ProfileName "Name" -TenantId "..." -ClientId "..." -CertificateThumbprint "..."` |
| Connect to tenant | `Connect-AssessmentTenant -CredentialProfile "Name"` |
| Run full assessment | `Start-Assessment -EngagementName "Name" -Modules @("EntraID","DeviceManagement","EmailProtection","TeamsSharePoint")` |
| Run single module | `Start-Assessment -EngagementName "Name" -Modules @("EntraID")` |
| Resume assessment | `Resume-Assessment -EngagementPath "output/Name"` |
| Start dashboard | `Start-Dashboard` |
| View logs | `Get-Content "output/{engagement}/logs/assessment_*.jsonl"` |
| List credential profiles | `Get-AssessmentCredential -List` |
| Remove credential profile | `Remove-AssessmentCredential -ProfileName "Name"` |
| Disconnect from tenant | `Disconnect-AssessmentTenant` |

---

## 8. Approval and Sign-Off

| Role | Name | Date | Signature / Approval |
|------|------|------|----------------------|
| Lead Developer | ___________________ | __________ | [ ] Approved |
| Security Consultant Lead | ___________________ | __________ | [ ] Approved |
| Engineering Manager | ___________________ | __________ | [ ] Approved |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | Lead Developer | Initial runbook covering pre-assessment setup, CLI and dashboard execution, resume, and troubleshooting |
