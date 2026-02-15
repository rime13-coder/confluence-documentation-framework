# Architecture Overview - High-Level Design (HLD)

| **Metadata**     | **Value**                                      |
|------------------|------------------------------------------------|
| Page Title       | M365-SecurityAssessment - Architecture Overview (HLD) |
| Last Updated     | 2026-02-15                                     |
| Status           | `CURRENT`                                      |
| Owner            | Module Author                                  |
| Reviewers        | Security Consultant Lead, Engineering Manager  |
| Version          | 1.0                                            |

---

## 1. Document Purpose

This document describes the high-level architecture for the **M365-SecurityAssessment** PowerShell module (v1.0.0). It establishes the architectural vision, component structure, technology decisions, and integration points that govern the solution design. The module automates Microsoft 365 tenant security assessments by collecting configuration data from cloud services, evaluating controls against industry best practices, and generating comprehensive compliance reports.

---

## 2. Architecture Vision

M365-SecurityAssessment is a locally-executed PowerShell module that connects to Microsoft 365 cloud services to perform automated security assessments. The architecture delivers a modular, extensible assessment engine that security consultants can run from their Windows workstations without deploying any cloud infrastructure. The module follows a collector-check-finding pipeline pattern where data is gathered once, evaluated against multiple controls, and consolidated into standardized findings with evidence. Reports are generated in multiple formats (HTML, PDF, DOCX, Excel), and an optional web dashboard provides a real-time view of assessment progress and results via a local Pode web server.

---

## 3. Guiding Principles

| # | Principle | Rationale |
|---|-----------|-----------|
| 1 | Local Execution, Cloud Data | The module runs entirely on the consultant's Windows workstation; no cloud infrastructure is deployed. Only read-only API calls are made to the target M365 tenant, ensuring zero impact on the customer environment. |
| 2 | Modular Assessment Architecture | Each security domain (Entra ID, Device Management, Email Protection, Teams/SharePoint) is an independent assessment module with its own collectors and checks, enabling selective execution and easy extension. |
| 3 | Collect Once, Check Many | Collectors cache their results in a shared `$CollectedData` hashtable. Multiple checks reuse the same collected data, minimizing API calls and respecting rate limits. |
| 4 | Standardized Findings | Every finding follows a consistent object model (FindingId, Name, Severity, Status, Description, Recommendation, AffectedResources, Evidence), enabling uniform reporting regardless of which module produced the finding. |
| 5 | Credential Security | Credentials are encrypted at rest using Windows DPAPI and stored in per-profile files under `%APPDATA%\M365-SecurityAssessment\credentials\`. No plaintext secrets are written to disk. |
| 6 | Resilient Execution | The checkpoint/resume system persists assessment progress so that interrupted assessments (network failures, timeouts, workstation restarts) can resume from the last successful checkpoint rather than restarting. |
| 7 | Comprehensive Evidence | Every finding includes machine-readable evidence (CSV exports, raw API responses) so that assessment results are auditable and verifiable by third parties. |

---

## 4. System Context Diagram (C4 Level 1)

<!-- Diagram: 01-system-context.png -- embedded on Confluence page as attachment -->
<!--
    Shows:
    - Security Consultant (user) running PowerShell on Windows workstation
    - M365-SecurityAssessment module (the system)
    - Microsoft 365 Tenant (external): Entra ID, Exchange Online, Intune, Teams, SharePoint
    - Microsoft Graph API (external): v1.0 and beta endpoints
    - Exchange Online PowerShell (external): remote PS session
    - Microsoft Teams PowerShell (external): remote PS session
    - Local filesystem: reports, evidence, credentials, checkpoints
-->

| Actor / External System | Description | Interaction |
|--------------------------|-------------|-------------|
| Security Consultant | Primary user who initiates assessments, reviews findings, and distributes reports to stakeholders | Runs PowerShell commands; views web dashboard at localhost:8080; reviews generated reports |
| Microsoft Entra ID (Azure AD) | Identity and access management service for the target M365 tenant | Graph API calls for conditional access policies, user accounts, role assignments, directory settings |
| Microsoft Intune (Endpoint Manager) | Device management and compliance service | Graph API calls for managed devices, compliance policies, security baselines, Windows protection state |
| Exchange Online | Email and messaging platform | Exchange Online PowerShell for DKIM, anti-phish, anti-spam, Safe Links, Safe Attachments, transport rules |
| Microsoft Teams | Collaboration and communication platform | Teams PowerShell for meeting policies, messaging policies, external access, app permissions |
| SharePoint Online | Document management and collaboration | Graph API calls for site configurations, sharing settings, external access policies |
| Local Filesystem | Assessment output storage | Reports (HTML/PDF/DOCX/Excel), evidence CSVs, checkpoint files, JSONL logs, SQLite database |

---

## 5. Container Diagram (C4 Level 2)

<!-- Diagram: 02-container-diagram.png -- embedded on Confluence page as attachment -->
<!--
    C4 Level 2 - Container Diagram
    Shows:
    - PowerShell Module (M365-SecurityAssessment.psd1/.psm1)
      - Engine Layer (Auth, Config, Logger, Orchestrator, ControlsDB, FindingTypes, ModuleLoader)
      - Assessment Modules (EntraID, DeviceManagement, EmailProtection, TeamsSharePoint, + 4 definition-only)
    - Web Dashboard (Pode server on localhost:8080)
    - Report Generator (HTML, PDF, DOCX, Excel output)
    - SQLite Database (controls.db)
    - JSON Configuration Files (findings.json, assessment-defaults.json, logic-definitions.json)
    - Credential Store (DPAPI-encrypted files under %APPDATA%)
-->

| Container | Description | Technology |
|-----------|-------------|------------|
| PowerShell Module | Root module manifest and loader; exports 29 public functions; loads engine and assessment modules in dependency order | PowerShell 5.1+ / 7+, M365-SecurityAssessment.psd1, M365-SecurityAssessment.psm1 |
| Engine Layer | Core infrastructure: authentication management, configuration loading, structured logging, assessment orchestration, controls database access, finding type definitions, module discovery and loading | Auth.ps1, Config.ps1, Logger.ps1, Orchestrator.ps1, ControlsDB.ps1, FindingTypes.ps1, ModuleLoader.ps1 |
| Assessment Modules | Independent security domain modules, each containing collectors (data gathering) and checks (evaluation logic); 4 fully implemented + 4 definition-only stubs | EntraID, DeviceManagement, EmailProtection, TeamsSharePoint modules; each with module.json, .psm1, collectors/*.ps1, checks/*.ps1 |
| Web Dashboard | Local web server providing real-time assessment status, finding browser, evidence viewer, and report download | Pode framework on localhost:8080; HTML/CSS/JS views; REST API endpoints |
| Report Generator | Multi-format report generation pipeline producing assessment deliverables | HTML templates, Microsoft Edge headless (PDF), PSWriteWord (DOCX), ImportExcel (Excel) |
| SQLite Database | Persistent controls management store; finding definitions, assessment metadata, and control mapping | SQLite via PSSQLite module; controls.db file |
| Configuration Files | Assessment parameters, finding definitions, and check logic | JSON files: findings.json (108 definitions), assessment-defaults.json, logic-definitions.json |
| Credential Store | Encrypted credential profiles for M365 tenant connections | DPAPI-encrypted files at %APPDATA%\M365-SecurityAssessment\credentials\ |

---

## 6. Technology Stack

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Primary Language** | PowerShell | 5.1+ / 7+ | Security consultants are familiar with PowerShell; native integration with Microsoft 365 management modules; DPAPI available on Windows; extensive module ecosystem |
| **Module Manifest** | PSD1/PSM1 | PowerShell module standard | Standard PowerShell module packaging; enables Install-Module distribution; dependency declaration; function export control |
| **M365 Authentication** | Microsoft.Graph PowerShell SDK | Latest | Certificate-based and client secret authentication to Microsoft Graph API; supports delegated and application permissions |
| **Exchange Online** | ExchangeOnlineManagement | 3.x | Official Microsoft module for Exchange Online PowerShell; certificate-based authentication; required for email security assessment |
| **Teams Management** | MicrosoftTeams | Latest | Official Microsoft module for Teams administration; required for collaboration security assessment |
| **Graph API** | Microsoft Graph REST API | v1.0 + beta | Primary data source for Entra ID, Intune, SharePoint configuration; v1.0 for stable endpoints, beta for advanced Intune features |
| **Web Dashboard** | Pode | Latest | Lightweight PowerShell-native web server; no external dependencies; runs as localhost; REST API + HTML views |
| **Database** | SQLite via PSSQLite | Latest | Zero-configuration embedded database; single-file storage; no server process; ideal for local tooling |
| **PDF Generation** | Microsoft Edge (headless) | Chromium-based | HTML-to-PDF conversion via Edge headless mode; high-fidelity rendering; available on all modern Windows systems |
| **DOCX Generation** | PSWriteWord | Latest | PowerShell module for Word document creation; template-based report generation |
| **Excel Generation** | ImportExcel | Latest | PowerShell module for Excel file creation without requiring Office installed; evidence export and summary tables |
| **Credential Encryption** | Windows DPAPI | OS-native | Machine/user-scoped encryption without key management overhead; built into Windows; no external dependencies |
| **Logging** | Custom Logger (JSONL) | N/A | Structured JSON Lines logging to files; includes timestamp, level, module, message, and context data |
| **Configuration** | JSON files | N/A | Human-readable configuration; easy to version control; standard PowerShell ConvertFrom-Json parsing |

---

## 7. Key Architectural Patterns

| Pattern | Where Applied | Description |
|---------|---------------|-------------|
| Pipeline Architecture | Assessment execution flow | Data flows through a linear pipeline: Discovery -> Load Collectors -> Run Checks (with deduplication) -> Generate Reports. Each stage transforms or enriches the data for the next. |
| Collector-Check Separation | Each assessment module | Collectors are pure data-gathering functions that call APIs and cache results. Checks are pure evaluation functions that read cached data and emit findings. This separation enables collect-once-check-many and simplifies testing. |
| Module Plugin Architecture | Assessment module loading | Each assessment module is a self-contained directory with a module.json manifest declaring its collectors, checks, and dependencies. The ModuleLoader discovers and loads modules dynamically, enabling new modules to be added without modifying the engine. |
| Shared Cache (Flyweight) | CollectedData hashtable | All collectors write to a shared `$CollectedData` hashtable keyed by collector name. Checks reference this cache, eliminating redundant API calls. If a collector has already run, its cached result is reused. |
| Function Deduplication | Orchestrator check execution | Some check functions produce multiple findings from a single evaluation. The `$executedFunctions` hashtable tracks which functions have already run, preventing duplicate execution and duplicate findings. |
| Checkpoint/Resume | Orchestrator state management | Assessment progress is periodically written to a checkpoint.json file. On resume, the orchestrator reads the checkpoint and skips completed stages, enabling recovery from interruptions without data loss. |
| Strategy Pattern | Report generation | The report generator selects the output strategy (HTML, PDF, DOCX, Excel) based on user configuration. Each format implements the same generation interface but produces different output. |
| Observer Pattern | Web dashboard | The Pode dashboard polls assessment state via REST API endpoints, displaying real-time progress. The assessment engine writes state updates that the dashboard reads asynchronously. |

---

## 8. Cross-Cutting Concerns

### 8.1 Authentication and Authorization

| Aspect | Approach |
|--------|----------|
| M365 Tenant Authentication | Azure AD App Registration with certificate-based or client secret authentication; credentials encrypted via DPAPI and stored as profiles |
| Graph API Permissions | Application permissions granted to the registered app; read-only permissions scoped per assessment module (see Integration Architecture for full permission list) |
| Exchange Online Authentication | Certificate-based authentication using the same App Registration; Connect-ExchangeOnline with CertificateThumbprint |
| Teams Authentication | Certificate-based or client secret authentication via Connect-MicrosoftTeams |
| Credential Management | Save-M365Credential exports DPAPI-encrypted profiles; Get-M365Credential loads and decrypts at runtime; profiles are user-scoped (DPAPI CurrentUser scope) |
| Authorization Model | No multi-user authorization -- the module runs under a single consultant's context with the permissions granted to the App Registration |

### 8.2 Logging

| Aspect | Approach |
|--------|----------|
| Logging Format | JSON Lines (JSONL) structured logging; each line is a valid JSON object |
| Log Fields | Timestamp (ISO 8601), Level (DEBUG, INFO, WARNING, ERROR), Module, Function, Message, Context (hashtable of additional data) |
| Log Destination | File-based: `logs/assessment-{timestamp}.jsonl` in the assessment output directory |
| Console Output | Parallel console output with color-coded severity levels for real-time operator feedback |
| Log Rotation | One log file per assessment run; no automatic rotation (assessments are discrete events) |
| Sensitive Data | API tokens and credentials are never logged; Graph API response bodies are truncated to prevent PII leakage in logs |

### 8.3 Error Handling

| Aspect | Approach |
|--------|----------|
| API Failures | Retry with configurable count (default: 3) and delay (default: 2 seconds); exponential backoff for rate-limited responses (429) |
| Module Failures | Individual module failures are caught and logged; assessment continues with remaining modules; failed modules are reported in the summary |
| Collector Failures | Failed collectors log an error and return null; dependent checks skip evaluation gracefully and report "Unable to Assess" status |
| Authentication Failures | Logged with remediation guidance; assessment halts if no service connections succeed |
| Checkpoint Recovery | On unhandled exceptions, the latest checkpoint is preserved; next run resumes from the last known good state |

### 8.4 Configuration Management

| Aspect | Approach |
|--------|----------|
| Assessment Defaults | assessment-defaults.json: break glass keywords, severity color mappings, Graph API pagination settings, retry configuration |
| Finding Definitions | findings.json: 108 finding definitions with FindingId, Name, Severity, Category, Description, Recommendation templates |
| Logic Definitions | logic-definitions.json: evaluation logic parameters for each check (thresholds, expected values, pattern matches) |
| Module Manifests | Per-module module.json: declares collector functions, check functions, required permissions, and module metadata |
| Runtime Overrides | Command-line parameters override configuration file defaults for one-off assessment customization |

---

## 9. Integration Points Summary

| # | External System | Protocol | Direction | Purpose | Auth Method |
|---|----------------|----------|-----------|---------|-------------|
| 1 | Microsoft Graph API v1.0 | HTTPS REST | Outbound | Entra ID policies, users, roles, SharePoint sites, domains, security alerts | OAuth 2.0 App-only (certificate or client secret) |
| 2 | Microsoft Graph API beta | HTTPS REST | Outbound | Intune security baselines, configuration policies, Windows protection state | OAuth 2.0 App-only (certificate or client secret) |
| 3 | Exchange Online PowerShell | HTTPS (remote PS) | Outbound | DKIM, anti-phish, anti-spam, Safe Links, Safe Attachments, transport rules | Certificate-based auth via Connect-ExchangeOnline |
| 4 | Microsoft Teams PowerShell | HTTPS (remote PS) | Outbound | Meeting policies, messaging policies, external access, app permissions | Certificate or client secret via Connect-MicrosoftTeams |
| 5 | SharePoint Admin | HTTPS REST (Graph) | Outbound | Site configurations, sharing policies, external access settings | OAuth 2.0 App-only (same as Graph API) |
| 6 | Local SQLite Database | File I/O | Local | Controls management, finding metadata, assessment state | N/A (local file, no auth) |
| 7 | Pode Web Server | HTTP (localhost:8080) | Local | Dashboard UI, real-time assessment status, report download | N/A (localhost only, no auth) |

---

## 10. Quality Attribute Requirements

| Quality Attribute | Requirement | How Achieved |
|-------------------|-------------|--------------|
| **Extensibility** | New assessment domains can be added without modifying the engine; new checks can be added to existing modules without modifying other checks | Plugin module architecture with module.json manifests; ModuleLoader discovers modules at runtime; collector-check separation allows independent additions |
| **Performance** | Large tenants (10,000+ users, 100+ conditional access policies) must complete assessment within 60 minutes | Collector caching eliminates redundant API calls; Graph API pagination handles large result sets; parallel collection where API rate limits allow |
| **Reliability** | Assessment must survive network interruptions, API throttling, and workstation restarts | Checkpoint/resume system; retry logic with exponential backoff (3 retries, 2s initial delay); graceful degradation when individual collectors fail |
| **Portability** | Must run on Windows 10/11 with PowerShell 5.1 (built-in) or PowerShell 7+ | No compiled dependencies; pure PowerShell with standard modules; DPAPI is Windows-specific (documented constraint) |
| **Security** | Credentials must never be stored in plaintext; assessment data must be protected on the consultant's workstation | DPAPI encryption for credentials; assessment output in user-scoped directories; no telemetry or external data transmission |
| **Usability** | Security consultants with PowerShell experience must be able to run an assessment in under 5 minutes of setup | 29 exported functions with consistent naming (Verb-M365Noun); comprehensive help documentation; web dashboard for non-CLI interaction |
| **Auditability** | Every assessment must produce traceable, evidence-backed findings | Structured JSONL logs; evidence CSV exports per finding; raw API response capture; timestamped assessment metadata |

---

## 11. Constraints

| # | Constraint | Impact |
|---|-----------|--------|
| 1 | Windows-only execution (DPAPI dependency for credential encryption) | Cannot run on macOS or Linux; PowerShell 7 on Windows is supported, but cross-platform PS 7 is not due to DPAPI |
| 2 | Requires Azure AD App Registration with appropriate permissions in the target tenant | Customer tenant administrators must create and consent to the App Registration before assessment can run |
| 3 | Graph API beta endpoints may change without notice | Intune-related collectors using beta endpoints (security baselines, configuration policies, Windows protection state) may break on API changes; requires monitoring Microsoft changelog |
| 4 | Exchange Online PowerShell rate limits and throttling | Large tenants with many policies may trigger throttling; retry logic mitigates but cannot eliminate delays |
| 5 | Single-threaded PowerShell execution model | Collectors run sequentially by default; parallel execution requires explicit runspace management (not yet implemented) |
| 6 | PDF generation requires Microsoft Edge (Chromium) installed | Workstations without Edge cannot generate PDF reports; HTML and DOCX remain available as alternatives |

---

## 12. Assumptions

| # | Assumption | If Invalid |
|---|-----------|------------|
| 1 | The target M365 tenant has an Azure AD App Registration with the required Graph API, Exchange Online, and Teams permissions | Assessment will fail with authentication errors; remediation: provide setup guide with exact permission requirements |
| 2 | The consultant's workstation runs Windows 10/11 with PowerShell 5.1 or later | Module will not load; remediation: document minimum system requirements |
| 3 | Microsoft Edge (Chromium) is installed for PDF generation | PDF generation will fail; HTML reports remain available; remediation: document Edge requirement or fall back to DOCX |
| 4 | The target tenant has fewer than 50,000 users and 500 conditional access policies | Very large tenants may exceed the 60-minute assessment window; remediation: implement parallel collection and incremental assessment |
| 5 | Internet connectivity is stable during the assessment window | Network interruptions will trigger checkpoint saves; assessment can be resumed; remediation: checkpoint/resume system handles this gracefully |
| 6 | The consultant has local administrator access or at minimum write access to %APPDATA% | Credential storage will fail without write access; remediation: allow configurable credential store path |

---

## 13. Approval and Sign-Off

| Role | Name | Date | Signature / Approval |
|------|------|------|----------------------|
| Module Author | ___________________ | __________ | [ ] Approved |
| Security Consultant Lead | ___________________ | __________ | [ ] Approved |
| Engineering Manager | ___________________ | __________ | [ ] Approved |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | Module Author | Initial release aligned with M365-SecurityAssessment v1.0.0 |
