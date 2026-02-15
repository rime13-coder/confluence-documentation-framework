# Infrastructure & Prerequisites Overview

| **Metadata**     | **Value**                                          |
|------------------|----------------------------------------------------|
| Page Title       | Infrastructure & Prerequisites Overview            |
| Last Updated     | 2026-02-15                                         |
| Status           | IN PROGRESS                                        |
| Owner            | IntelliSec Solutions                               |

---

## 1. Document Purpose

This document provides a comprehensive overview of the infrastructure and prerequisites required to run the M365 Security Assessment Automation tool. Unlike cloud-hosted applications, this tool runs locally on Windows workstations and connects to client M365 tenants via Microsoft APIs. This document serves as the authoritative reference for Azure AD App Registration requirements, local workstation prerequisites, module dependencies, and per-client tenant configuration.

---

## 2. Architecture Model

### 2.1 Deployment Model

| Attribute                    | Value                                                                |
|------------------------------|----------------------------------------------------------------------|
| Deployment Model             | Local execution on Windows workstations (no cloud hosting)           |
| Hosting Infrastructure       | None -- tool runs as a PowerShell module on consultant machines      |
| Cloud Services Used          | Microsoft 365 tenant APIs (read-only data collection)                |
| Web Dashboard                | Pode-based, bound to localhost:8080 (no external access)             |
| Data Persistence             | Local SQLite database via PSSQLite                                   |
| Report Output                | Local filesystem (timestamped engagement directories)                |

> **Key Distinction:** This project has no Azure hosting infrastructure. There are no Azure subscriptions, resource groups, virtual machines, or container services to manage. The only Azure/M365 dependency is the Azure AD App Registration in each client tenant that grants the tool read-only API access.

### 2.2 High-Level Architecture

```
Consultant Workstation (Windows 10/11 or Server 2019+)
+---------------------------------------------------------------+
|                                                               |
|  PowerShell 5.1 / 7                                          |
|  +----------------------------------------------------------+|
|  |  M365 Security Assessment Module                         ||
|  |  +-----------------------------------------------------+ ||
|  |  |  Assessment Engine                                   | ||
|  |  |    EntraID | DeviceMgmt | EmailProtection | Teams/SP | ||
|  |  +-----------------------------------------------------+ ||
|  |  |  Credential Manager (DPAPI encrypted profiles)       | ||
|  |  |  Evidence Exporter (CSV)                             | ||
|  |  |  Report Generator (HTML / PDF / DOCX)                | ||
|  |  |  SQLite Database (PSSQLite)                          | ||
|  |  |  Web Dashboard (Pode, localhost:8080)                 | ||
|  |  +-----------------------------------------------------+ ||
|  +----------------------------------------------------------+||
|                                                               |
|  Outbound API Connections (HTTPS, TLS 1.2+):                 |
|    --> graph.microsoft.com (Microsoft Graph API)              |
|    --> login.microsoftonline.com (Azure AD Auth)              |
|    --> outlook.office365.com (Exchange Online)                |
|    --> *.sharepoint.com (SharePoint Admin)                    |
|    --> api.interfaces.records.teams.microsoft.com (Teams)     |
+---------------------------------------------------------------+
```

---

## 3. Azure AD App Registration Requirements

### 3.1 App Registration Overview

Each client M365 tenant requires a dedicated Azure AD App Registration to grant the assessment tool read-only API access. Admin consent is required for all application permissions.

| Attribute                    | Value                                                                |
|------------------------------|----------------------------------------------------------------------|
| Registration Scope           | Per-client tenant (one App Registration per engagement)              |
| Permission Type              | Application permissions (not delegated)                              |
| Authentication Method        | Client credentials (certificate for Exchange Online, client secret or certificate for Graph API) |
| Admin Consent                | Required for all permissions                                         |
| Certificate Requirement      | Self-signed or CA-issued certificate uploaded to App Registration for Exchange Online connectivity |

### 3.2 Application Permissions by Module

#### EntraID Module (Identity & Access Management)

| Permission                              | API        | Purpose                                              |
|-----------------------------------------|------------|------------------------------------------------------|
| Policy.Read.All                         | Graph API  | Read Conditional Access policies, authentication methods policies |
| Directory.Read.All                      | Graph API  | Read directory objects, tenant configuration         |
| User.Read.All                           | Graph API  | Read user profiles, MFA registration status          |
| RoleManagement.Read.Directory           | Graph API  | Read Azure AD role assignments, PIM configuration    |
| Agreement.Read.All                      | Graph API  | Read Terms of Use agreements                         |
| AuditLog.Read.All                       | Graph API  | Read sign-in logs, audit logs for risk analysis      |
| IdentityRiskyServicePrincipal.Read.All  | Graph API  | Read risky service principal detections              |
| UserAuthenticationMethod.Read.All       | Graph API  | Read user MFA methods, passwordless configuration    |

#### DeviceManagement Module

| Permission                                  | API        | Purpose                                          |
|---------------------------------------------|------------|--------------------------------------------------|
| DeviceManagementConfiguration.Read.All      | Graph API  | Read Intune device configuration profiles        |
| DeviceManagementManagedDevices.Read.All     | Graph API  | Read managed device inventory and compliance     |
| DeviceManagementServiceConfig.Read.All      | Graph API  | Read Intune service configuration, enrollment    |
| SecurityEvents.Read.All                     | Graph API  | Read security alerts, Defender for Endpoint data |

#### EmailProtection Module

| Permission                | API               | Purpose                                          |
|---------------------------|-------------------|--------------------------------------------------|
| Domain.Read.All           | Graph API         | Read domain configurations (DKIM, DMARC, SPF)   |
| Exchange.ManageAsApp      | Exchange Online   | Read Exchange Online configuration via PowerShell (requires certificate authentication) |

#### TeamsSharePoint Module

| Permission                            | API        | Purpose                                          |
|---------------------------------------|------------|--------------------------------------------------|
| SharePointTenantSettings.Read.All     | Graph API  | Read SharePoint tenant-level sharing settings    |
| Sites.Read.All                        | Graph API  | Read SharePoint site configurations              |

### 3.3 App Registration Setup Checklist

- [ ] Create App Registration in client Azure AD tenant
- [ ] Record Application (Client) ID and Directory (Tenant) ID
- [ ] Add all required Application permissions (see tables above per module)
- [ ] Grant admin consent for all permissions
- [ ] Generate or upload certificate for Exchange Online authentication
- [ ] Upload certificate public key (.cer) to App Registration
- [ ] Store certificate thumbprint for credential profile configuration
- [ ] Create client secret (if using secret-based Graph API auth) and record expiry date
- [ ] Verify connectivity using `Test-AssessmentConnection` (if available)

---

## 4. Local Workstation Requirements

### 4.1 Operating System

| Requirement              | Minimum                                    | Recommended                                |
|--------------------------|--------------------------------------------|--------------------------------------------|
| Operating System         | Windows 10 (version 1809+)                | Windows 11 (latest feature update)         |
| Server OS (alternative)  | Windows Server 2019                        | Windows Server 2022                        |
| Architecture             | x64                                        | x64                                        |
| .NET Framework           | 4.7.2+                                     | 4.8.1                                      |
| PowerShell               | 5.1 (Windows PowerShell)                   | 7.x (PowerShell Core) alongside 5.1       |
| Microsoft Edge           | Required (Chromium-based, for PDF export)  | Latest stable version                      |
| Disk Space               | 500 MB free (tool + dependencies)          | 2 GB+ free (tool + assessment outputs)     |
| RAM                      | 4 GB                                       | 8 GB+                                      |
| Network                  | Internet connectivity (outbound HTTPS)     | Stable broadband connection                |

### 4.2 Software Prerequisites

| Software                 | Version        | Purpose                                          | Required |
|--------------------------|----------------|--------------------------------------------------|----------|
| PowerShell               | 5.1 or 7.x    | Runtime for the assessment module                | Yes      |
| Microsoft Edge           | Chromium-based | PDF report generation via headless rendering     | Yes      |
| .NET Framework           | 4.7.2+         | Runtime dependency for PowerShell modules        | Yes      |
| Git (optional)           | Latest         | Clone the module repository                      | No       |

---

## 5. Module Dependencies

### 5.1 PowerShell Module Dependencies

| Module                       | Required Version | Purpose                                              | Source            |
|------------------------------|------------------|------------------------------------------------------|-------------------|
| Microsoft.Graph              | 2.0+             | Microsoft Graph API connectivity for all modules     | PSGallery         |
| ExchangeOnlineManagement     | Latest           | Exchange Online PowerShell for Email Protection      | PSGallery         |
| MicrosoftTeams               | Latest           | Microsoft Teams PowerShell for Teams controls        | PSGallery         |
| Pode                         | 2.12.1           | Web dashboard framework (localhost:8080)             | PSGallery         |
| PSSQLite                     | Latest           | SQLite database for assessment data persistence      | PSGallery         |
| PSWriteWord                  | 1.1.14           | DOCX report generation                              | PSGallery         |
| ImportExcel                  | Latest           | Excel/CSV evidence export and formatting             | PSGallery         |
| Pester                       | 3.4.0            | Unit testing framework for check validation          | PSGallery         |

### 5.2 Dependency Installation

```powershell
# Install all required modules (run as Administrator for AllUsers scope)
Install-Module -Name Microsoft.Graph -MinimumVersion 2.0 -Scope CurrentUser -Force
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser -Force
Install-Module -Name MicrosoftTeams -Scope CurrentUser -Force
Install-Module -Name Pode -RequiredVersion 2.12.1 -Scope CurrentUser -Force
Install-Module -Name PSSQLite -Scope CurrentUser -Force
Install-Module -Name PSWriteWord -RequiredVersion 1.1.14 -Scope CurrentUser -Force
Install-Module -Name ImportExcel -Scope CurrentUser -Force
Install-Module -Name Pester -RequiredVersion 3.4.0 -Scope CurrentUser -Force -SkipPublisherCheck
```

### 5.3 Dependency Compatibility Matrix

| Module                   | PowerShell 5.1 | PowerShell 7.x | Known Issues                              |
|--------------------------|----------------|-----------------|-------------------------------------------|
| Microsoft.Graph 2.0+     | Yes            | Yes             | Large module; initial import takes time    |
| ExchangeOnlineManagement | Yes            | Yes             | Certificate auth requires specific setup   |
| MicrosoftTeams           | Yes            | Yes             | Some cmdlets PS 5.1 only                  |
| Pode 2.12.1              | Yes            | Yes             | None known                                |
| PSSQLite                 | Yes            | Yes             | None known                                |
| PSWriteWord 1.1.14       | Yes            | Limited         | Best compatibility on PS 5.1              |
| ImportExcel              | Yes            | Yes             | None known                                |
| Pester 3.4.0             | Yes            | Yes             | Legacy version; not compatible with Pester 5.x syntax |

---

## 6. Per-Client Engagement Setup

### 6.1 Engagement Configuration Workflow

| Step | Action                                                       | Performed By      | Estimated Time |
|------|--------------------------------------------------------------|--------------------|----------------|
| 1    | Create Azure AD App Registration in client tenant            | Client IT / Consultant | 15-30 min  |
| 2    | Assign application permissions per assessment scope          | Client IT Admin    | 10-15 min      |
| 3    | Grant admin consent for all permissions                      | Client Global Admin | 5 min         |
| 4    | Generate and upload authentication certificate               | Consultant         | 10 min         |
| 5    | Create credential profile using Save-AssessmentCredential    | Consultant         | 5 min          |
| 6    | Test connectivity to client tenant                           | Consultant         | 5 min          |
| 7    | Run assessment with selected modules                         | Consultant         | 1-3 hours      |

### 6.2 Assessment Output Structure

```
Engagements/
+-- 2026-02-15_ClientName/
    +-- findings/
    |   +-- EntraID-findings.json
    |   +-- DeviceManagement-findings.json
    |   +-- EmailProtection-findings.json
    |   +-- TeamsSharePoint-findings.json
    +-- evidence/
    |   +-- EntraID/
    |   |   +-- ConditionalAccessPolicies.csv
    |   |   +-- MFARegistrationStatus.csv
    |   |   +-- ...
    |   +-- DeviceManagement/
    |   +-- EmailProtection/
    |   +-- TeamsSharePoint/
    +-- reports/
    |   +-- Assessment-Report.html
    |   +-- Assessment-Report.pdf
    |   +-- Assessment-Report.docx
    +-- logs/
        +-- assessment.log
```

---

## 7. Infrastructure Comparison: This Tool vs. Cloud-Hosted Application

| Attribute                    | M365 Assessment Tool (This Project)         | Typical Cloud-Hosted Application            |
|------------------------------|---------------------------------------------|---------------------------------------------|
| Hosting                      | Local workstation                           | Azure / AWS / GCP                           |
| Subscription / Account       | None required for hosting                   | Azure Subscription or equivalent            |
| Compute                      | Local CPU/RAM                               | VMs, Containers, Serverless                 |
| Database                     | Local SQLite file                           | Azure SQL, PostgreSQL, CosmosDB             |
| Web Server                   | Pode on localhost:8080                      | App Service, Container Apps, etc.           |
| Credential Storage           | DPAPI-encrypted local profiles              | Key Vault, Secrets Manager                  |
| Network                      | Outbound HTTPS only                         | VNets, NSGs, Load Balancers, WAF           |
| Cost                         | $0 hosting cost                             | Monthly cloud service costs                 |
| Scaling                      | One assessment per workstation               | Horizontal / vertical scaling               |
| DR / HA                      | Re-install module, re-create credentials    | Multi-region, failover, replication         |

---

## 8. Revision History

| Date           | Author               | Changes Made                                                  |
|----------------|-----------------------|---------------------------------------------------------------|
| 2026-02-15     | IntelliSec Solutions  | Initial document adapted for M365 Security Assessment Automation (local PowerShell tool) |
