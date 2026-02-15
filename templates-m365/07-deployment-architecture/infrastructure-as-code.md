# Infrastructure as Code & Automation

| **Metadata**     | **Value**                                          |
|------------------|----------------------------------------------------|
| Page Title       | Infrastructure as Code & Automation                |
| Last Updated     | 2026-02-15                                         |
| Status           | IN PROGRESS                                        |
| Owner            | IntelliSec Solutions                               |

---

## 1. Document Purpose

This document defines the automation and scripted setup strategy for the M365 Security Assessment Automation tool. Unlike cloud-hosted applications that use Terraform or Bicep to provision Azure infrastructure, this tool runs locally on Windows workstations and has no hosting infrastructure to manage. Instead, "Infrastructure as Code" for this project means automating workstation setup, module installation, Azure AD App Registration configuration, credential profile creation, and assessment execution. This document covers what IS automated, what SHOULD be automated, and the configuration-as-code approach for assessment definitions.

---

## 2. IaC Applicability

### 2.1 What Does NOT Apply

| Traditional IaC Concept         | Applicability to This Project                              |
|---------------------------------|------------------------------------------------------------|
| Terraform / Bicep               | NOT APPLICABLE -- no cloud hosting infrastructure          |
| Azure Resource Manager (ARM)    | NOT APPLICABLE -- no Azure resources to provision (except App Registration) |
| Kubernetes / Helm               | NOT APPLICABLE -- no container orchestration               |
| CI/CD infrastructure pipelines  | NOT APPLICABLE -- no infrastructure to deploy              |
| State management (tfstate)      | NOT APPLICABLE -- no infrastructure state to track         |
| Drift detection                 | NOT APPLICABLE -- no hosted infrastructure to drift        |

### 2.2 What IS Automated / Scriptable

| Automation Area                    | Current Status   | Implementation                                        |
|------------------------------------|------------------|-------------------------------------------------------|
| Module dependency installation     | IMPLEMENTED      | PowerShell Install-Module script for all dependencies |
| Credential profile creation        | IMPLEMENTED      | Save-AssessmentCredential cmdlet (DPAPI encryption)   |
| Assessment execution               | IMPLEMENTED      | Start-Assessment with module selection                |
| Evidence export                    | IMPLEMENTED      | Automated CSV export during assessment                |
| Report generation                  | IN PROGRESS      | HTML/PDF/DOCX generation post-assessment              |
| Web dashboard startup              | IMPLEMENTED      | Pode server launch on localhost:8080                  |
| Azure AD App Registration setup    | MANUAL           | Step-by-step guide; scripted setup planned            |
| Workstation bootstrap              | PLANNED          | PowerShell script for new consultant onboarding       |
| Controls database rebuild          | IMPLEMENTED      | Auto-rebuilt from findings.json and module.json       |

---

## 3. Module Installation Automation

### 3.1 Dependency Installation Script

The following script installs all required PowerShell modules for the M365 Security Assessment tool. This serves as the primary "infrastructure provisioning" for the project.

```powershell
<#
.SYNOPSIS
    Installs all PowerShell module dependencies for M365 Security Assessment.
.DESCRIPTION
    Bootstraps a new workstation with all required modules.
    Run as Administrator for AllUsers scope, or as standard user for CurrentUser scope.
#>
[CmdletBinding()]
param(
    [ValidateSet('CurrentUser', 'AllUsers')]
    [string]$Scope = 'CurrentUser'
)

$modules = @(
    @{ Name = 'Microsoft.Graph';            MinimumVersion = '2.0'    }
    @{ Name = 'ExchangeOnlineManagement';   MinimumVersion = $null    }
    @{ Name = 'MicrosoftTeams';             MinimumVersion = $null    }
    @{ Name = 'Pode';                       RequiredVersion = '2.12.1'}
    @{ Name = 'PSSQLite';                   MinimumVersion = $null    }
    @{ Name = 'PSWriteWord';                RequiredVersion = '1.1.14'}
    @{ Name = 'ImportExcel';                MinimumVersion = $null    }
    @{ Name = 'Pester';                     RequiredVersion = '3.4.0' }
)

foreach ($mod in $modules) {
    $params = @{
        Name  = $mod.Name
        Scope = $Scope
        Force = $true
    }
    if ($mod.RequiredVersion) { $params.RequiredVersion = $mod.RequiredVersion }
    elseif ($mod.MinimumVersion) { $params.MinimumVersion = $mod.MinimumVersion }
    if ($mod.Name -eq 'Pester') { $params.SkipPublisherCheck = $true }

    Write-Host "Installing $($mod.Name)..." -ForegroundColor Cyan
    Install-Module @params
}

Write-Host "All dependencies installed successfully." -ForegroundColor Green
```

### 3.2 Dependency Verification Script

```powershell
<#
.SYNOPSIS
    Verifies all required modules are installed and meet minimum version requirements.
#>
$requirements = @(
    @{ Name = 'Microsoft.Graph';          MinVersion = '2.0'    }
    @{ Name = 'ExchangeOnlineManagement'; MinVersion = $null    }
    @{ Name = 'MicrosoftTeams';           MinVersion = $null    }
    @{ Name = 'Pode';                     MinVersion = '2.12.1' }
    @{ Name = 'PSSQLite';                 MinVersion = $null    }
    @{ Name = 'PSWriteWord';              MinVersion = '1.1.14' }
    @{ Name = 'ImportExcel';              MinVersion = $null    }
    @{ Name = 'Pester';                   MinVersion = '3.4.0'  }
)

$allPassed = $true
foreach ($req in $requirements) {
    $installed = Get-Module -ListAvailable -Name $req.Name | Sort-Object Version -Descending | Select-Object -First 1
    if (-not $installed) {
        Write-Host "MISSING: $($req.Name)" -ForegroundColor Red
        $allPassed = $false
    } elseif ($req.MinVersion -and $installed.Version -lt [version]$req.MinVersion) {
        Write-Host "OUTDATED: $($req.Name) (installed: $($installed.Version), required: $($req.MinVersion))" -ForegroundColor Yellow
        $allPassed = $false
    } else {
        Write-Host "OK: $($req.Name) v$($installed.Version)" -ForegroundColor Green
    }
}

if ($allPassed) { Write-Host "`nAll dependencies satisfied." -ForegroundColor Green }
else { Write-Host "`nSome dependencies are missing or outdated. Run the installation script." -ForegroundColor Red }
```

---

## 4. Azure AD App Registration Setup

### 4.1 Current State: Manual Setup

Azure AD App Registration is currently configured manually through the Azure Portal or Azure CLI. A documented step-by-step guide is provided to consultants.

| Step | Action                                                     | Method           |
|------|------------------------------------------------------------|------------------|
| 1    | Navigate to Azure AD > App Registrations > New Registration | Azure Portal     |
| 2    | Set Name: "M365 Security Assessment - {ClientName}"       | Azure Portal     |
| 3    | Set Supported Account Types: Single tenant                 | Azure Portal     |
| 4    | Add API Permissions per assessment module                  | Azure Portal     |
| 5    | Grant Admin Consent                                        | Azure Portal (Global Admin) |
| 6    | Upload Certificate for Exchange Online auth                | Azure Portal     |
| 7    | Record App ID, Tenant ID, Certificate Thumbprint           | Manual           |

### 4.2 Future Recommendation: Scripted App Registration

A PowerShell or Azure CLI script to automate App Registration setup is recommended for future implementation.

```powershell
# PLANNED -- NOT YET IMPLEMENTED
# Azure CLI script to create App Registration with required permissions

az ad app create `
    --display-name "M365 Security Assessment - ClientName" `
    --sign-in-audience "AzureADMyOrg"

# Add required Graph API permissions
# Application ID for Microsoft Graph: 00000003-0000-0000-c000-000000000000

az ad app permission add `
    --id {app-id} `
    --api 00000003-0000-0000-c000-000000000000 `
    --api-permissions `
        246dd0d5-5bd0-4def-940b-0421030a5b68=Role ` # Policy.Read.All
        7ab1d382-f21e-4acd-a863-ba3e13f7da61=Role ` # Directory.Read.All
        df021288-bdef-4463-88db-98f22de89214=Role ` # User.Read.All
        483bed4a-2ad3-4361-a73b-c83ccdbdc53c=Role ` # RoleManagement.Read.Directory
        2f3e6f8c-093b-4c57-a58b-ba5ce494a169=Role ` # Agreement.Read.All
        b0afded3-3588-46d8-8b3d-9842eff778da=Role ` # AuditLog.Read.All
        # ... additional permissions per module

# Grant admin consent
az ad app permission admin-consent --id {app-id}
```

### 4.3 ARM Template for App Registration (Future Recommendation)

An ARM/Bicep template for App Registration provisioning is a potential improvement for standardized, repeatable client setup. This would allow version-controlled, reviewable permission sets.

| Attribute                | Current State    | Target State                          |
|--------------------------|------------------|---------------------------------------|
| App Registration method  | Manual (Portal)  | Scripted (Azure CLI / PowerShell)     |
| Permission management    | Manual selection | Codified in script/template           |
| Certificate upload       | Manual           | Scripted with certificate generation  |
| Admin consent            | Manual           | Scripted (requires Global Admin)      |
| Repeatability            | Low              | High (script can be re-run per client)|

---

## 5. Credential Profile Management

### 5.1 Save-AssessmentCredential

Credential profiles are created using the `Save-AssessmentCredential` cmdlet. This encrypts tenant connection details using Windows DPAPI and stores them locally.

```powershell
# Create a credential profile for a client tenant
Save-AssessmentCredential `
    -ProfileName "client-acme" `
    -TenantId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" `
    -ClientId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" `
    -CertificateThumbprint "ABCDEF1234567890ABCDEF1234567890ABCDEF12"
```

### 5.2 Credential Profile Storage

| Attribute                | Value                                                      |
|--------------------------|------------------------------------------------------------|
| Encryption Method        | Windows Data Protection API (DPAPI)                        |
| Scope                    | Current user + current machine (cannot be copied)          |
| Storage Location         | User profile directory (encrypted files)                   |
| Profile Listing          | Get-AssessmentCredential -List                             |
| Profile Deletion         | Remove-AssessmentCredential -ProfileName "client-acme"     |
| Portability              | Not portable -- must be re-created on each workstation     |

---

## 6. Assessment Execution Automation

### 6.1 Start-Assessment

The primary assessment execution is a single cmdlet that orchestrates all modules, evidence collection, and reporting.

```powershell
# Run a full assessment against a client tenant
Start-Assessment `
    -CredentialProfile "client-acme" `
    -Modules @("EntraID", "DeviceManagement", "EmailProtection", "TeamsSharePoint") `
    -OutputPath "./Engagements/2026-02-15_ACME"

# Run a targeted assessment (specific modules only)
Start-Assessment `
    -CredentialProfile "client-acme" `
    -Modules @("EntraID") `
    -OutputPath "./Engagements/2026-02-15_ACME_EntraID-only"
```

### 6.2 Assessment Execution Flow

| Step | Action                                          | Automated | Output                          |
|------|-------------------------------------------------|-----------|---------------------------------|
| 1    | Load credential profile                         | Yes       | Decrypted credentials in memory |
| 2    | Connect to M365 tenant APIs                     | Yes       | Authenticated sessions          |
| 3    | Execute Collector functions (data gathering)     | Yes       | Raw configuration data          |
| 4    | Execute Check functions (evaluation logic)       | Yes       | Findings with severity ratings  |
| 5    | Export evidence as CSV                           | Yes       | CSV files per control           |
| 6    | Persist findings to SQLite                       | Yes       | Updated database                |
| 7    | Generate reports (HTML, PDF, DOCX)              | Yes       | Report files in output path     |
| 8    | Disconnect from M365 tenant APIs                | Yes       | Sessions cleaned up             |

---

## 7. Configuration as Code

### 7.1 Configuration File Inventory

Assessment behavior is driven by configuration files that serve as the "code" defining the assessment scope, control definitions, and module structure.

| File                     | Purpose                                              | Format  | Version Controlled |
|--------------------------|------------------------------------------------------|---------|--------------------|
| assessment-defaults.json | Default assessment parameters, severity thresholds, output format preferences | JSON | Yes |
| findings.json            | Control definitions, finding templates, severity mappings, remediation guidance | JSON | Yes |
| module.json              | Module manifest -- version, exported functions, dependencies, module metadata | JSON | Yes |
| *.psd1                   | PowerShell module manifest (entry point)              | PSD1    | Yes                |

### 7.2 Configuration File Roles

#### assessment-defaults.json

Defines default parameters for assessment execution when not explicitly overridden by the consultant.

```json
{
    "defaultModules": ["EntraID", "DeviceManagement", "EmailProtection", "TeamsSharePoint"],
    "outputFormats": ["HTML", "PDF", "DOCX"],
    "evidenceExport": true,
    "severityThresholds": {
        "Critical": 9.0,
        "High": 7.0,
        "Medium": 4.0,
        "Low": 1.0
    },
    "dashboardPort": 8080,
    "logLevel": "Information"
}
```

#### findings.json

Defines all security controls, their evaluation criteria, severity ratings, and remediation guidance. This file IS the assessment knowledge base.

```json
{
    "controls": [
        {
            "id": "ENTRA-001",
            "domain": "EntraID",
            "title": "Conditional Access - MFA Required for All Users",
            "severity": "Critical",
            "description": "Verify that a Conditional Access policy requires MFA for all users.",
            "remediation": "Create a Conditional Access policy targeting All Users with Grant: Require MFA.",
            "references": ["CIS M365 1.1.1", "NIST AC-7"]
        }
    ]
}
```

#### module.json

Defines module metadata, version, and structure. Used to rebuild the controls database and validate module integrity.

---

## 8. Consultant Workstation Bootstrap (Planned)

### 8.1 Bootstrap Script (Recommended)

A single PowerShell script to prepare a new consultant workstation for assessment operations.

```powershell
# PLANNED -- RECOMMENDED IMPLEMENTATION
<#
.SYNOPSIS
    Bootstraps a new consultant workstation for M365 Security Assessment operations.
.DESCRIPTION
    - Validates system prerequisites (OS version, PowerShell, .NET, Edge)
    - Installs all PowerShell module dependencies
    - Creates engagement output directory structure
    - Validates network connectivity to M365 API endpoints
    - Optionally creates a credential profile for a client tenant
#>

# Step 1: Validate prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Cyan
# Check OS version, PowerShell version, .NET version, Edge installation

# Step 2: Install dependencies
Write-Host "Installing module dependencies..." -ForegroundColor Cyan
# Invoke dependency installation script

# Step 3: Import assessment module
Write-Host "Importing M365 Assessment module..." -ForegroundColor Cyan
Import-Module ./M365SecurityAssessment.psd1

# Step 4: Create directory structure
Write-Host "Creating engagement directory structure..." -ForegroundColor Cyan
New-Item -Path "./Engagements" -ItemType Directory -Force

# Step 5: Test network connectivity
Write-Host "Testing network connectivity to M365 APIs..." -ForegroundColor Cyan
$endpoints = @(
    "https://graph.microsoft.com",
    "https://login.microsoftonline.com",
    "https://outlook.office365.com"
)
foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method Head -TimeoutSec 10
        Write-Host "  OK: $endpoint" -ForegroundColor Green
    } catch {
        Write-Host "  FAIL: $endpoint" -ForegroundColor Red
    }
}

Write-Host "Bootstrap complete." -ForegroundColor Green
```

### 8.2 Bootstrap Checklist

| Step | Action                                           | Automated | Status           |
|------|--------------------------------------------------|-----------|------------------|
| 1    | Validate Windows 10/11 or Server 2019+           | Planned   | NOT IMPLEMENTED  |
| 2    | Validate PowerShell 5.1 or 7.x                   | Planned   | NOT IMPLEMENTED  |
| 3    | Validate .NET Framework 4.7.2+                    | Planned   | NOT IMPLEMENTED  |
| 4    | Validate Microsoft Edge installed                 | Planned   | NOT IMPLEMENTED  |
| 5    | Install all PowerShell module dependencies        | IMPLEMENTED | Active         |
| 6    | Import M365 Assessment module                     | IMPLEMENTED | Active         |
| 7    | Create engagement directory structure             | Planned   | NOT IMPLEMENTED  |
| 8    | Test outbound HTTPS connectivity to M365 APIs     | Planned   | NOT IMPLEMENTED  |
| 9    | Create initial credential profile                 | IMPLEMENTED | Active         |
| 10   | Run sample assessment against test tenant          | Manual    | Manual process   |

---

## 9. Revision History

| Date           | Author               | Changes Made                                                  |
|----------------|-----------------------|---------------------------------------------------------------|
| 2026-02-15     | IntelliSec Solutions  | Initial document adapted for M365 Security Assessment Automation (local PowerShell tool) |
