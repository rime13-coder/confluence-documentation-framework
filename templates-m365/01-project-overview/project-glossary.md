# Project Glossary

| **Page Title**   | M365 Security Assessment Automation - Project Glossary |
|------------------|--------------------------------------------------------|
| **Last Updated** | 2026-02-15                                             |
| **Status**       | IN PROGRESS                                            |
| **Owner**        | IntelliSec Solutions                                   |

---

## How to Use This Glossary

This glossary defines terms, acronyms, and abbreviations used throughout the M365 Security Assessment Automation project documentation. It is divided into the following sections:

1. **Microsoft 365 & Security Terms** -- M365 platform features, security protocols, and configuration concepts evaluated by the assessment tool.
2. **CMMC & Regulatory / Compliance Terms** -- Frameworks, standards, and compliance terminology relevant to the Defense Industrial Base clients served by the tool.
3. **Tool-Specific Terms** -- Concepts, conventions, and architecture patterns unique to the M365 Security Assessment Automation platform.
4. **Technical / Infrastructure Terms** -- PowerShell modules, APIs, libraries, and technical dependencies used in the tool's implementation.
5. **Finding Severity Levels & Statuses** -- Standardized classification system for assessment findings.

When referencing a term in other documentation pages, link back to this glossary for consistency.

---

## 1. Microsoft 365 & Security Terms

### A-C

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Anti-Phishing Policy | - | Exchange Online Protection policy that detects and prevents phishing attempts through impersonation detection, mailbox intelligence, and spoof protection | Evaluated in the Email Protection module; checks for policy existence, scope, and action configuration |
| Anti-Spam Policy | - | Exchange Online Protection policy that filters inbound and outbound spam, including bulk email, high-confidence spam, and phishing | Evaluated in the Email Protection module; checks for policy thresholds, quarantine actions, and allow/block lists |
| Authentication Methods | - | The set of sign-in methods configured in EntraID (password, FIDO2, Microsoft Authenticator, SMS, etc.) that users can use to prove their identity | Evaluated in the EntraID module; checks for strong method enforcement, legacy method deprecation, and per-user registration status |
| Conditional Access | CA | EntraID feature that enforces access policies based on signals such as user identity, device state, location, application, and risk level | Primary focus of the EntraID module; multiple checks evaluate CA policy coverage, grant/session controls, and exclusion hygiene |

### D

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Data Loss Prevention | DLP | Microsoft 365 feature that identifies, monitors, and protects sensitive information across Exchange, SharePoint, OneDrive, and Teams | Evaluated in the Teams/SharePoint module; checks for DLP policy existence and coverage across collaboration workloads |
| Device Compliance Policy | - | Microsoft Intune policy that defines the conditions a device must meet (OS version, encryption, antivirus) to be considered compliant | Central concept in the Device Management module; multiple checks evaluate policy configuration, assignment, and enforcement actions |
| Device Configuration Profile | - | Microsoft Intune profile that configures device settings (Wi-Fi, VPN, email, restrictions, endpoint protection) | Evaluated in the Device Management module; checks for security-relevant configuration profiles and their assignment scope |
| Device Enrollment Restriction | - | Microsoft Intune policy that controls which devices and platforms can enroll in device management | Evaluated in the Device Management module; checks for platform restrictions, personal device blocking, and enrollment limits |
| DKIM | - | DomainKeys Identified Mail; email authentication protocol that allows the sending domain to digitally sign outgoing messages, enabling receivers to verify the message was not altered in transit | Evaluated in the Email Protection module; checks for DKIM signing configuration on all accepted domains |
| DMARC | - | Domain-based Message Authentication, Reporting and Conformance; email authentication protocol that builds on SPF and DKIM to specify how receiving mail servers should handle messages that fail authentication | Evaluated in the Email Protection module; checks for DMARC record existence, policy mode (none/quarantine/reject), and reporting configuration |

### E-G

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Endpoint Protection Profile | - | Microsoft Intune profile that configures endpoint security features such as antivirus, firewall, disk encryption, and attack surface reduction rules | Evaluated in the Device Management module; checks for profile existence, configuration settings, and assignment scope |
| EntraID | - | Microsoft Entra ID (formerly Azure Active Directory); Microsoft's cloud-based identity and access management service for M365 and Azure | The first and largest assessment domain (39 checks); all identity, authentication, authorization, and access governance controls are evaluated here |
| External Sharing | - | SharePoint Online and OneDrive settings that control whether and how content can be shared with users outside the organization | Evaluated in the Teams/SharePoint module; checks for sharing level configuration (Anyone, New/Existing Guests, Only People in Org) at tenant and site level |
| Guest Access | - | M365 capability allowing external users (guests) to access Teams, SharePoint, and other resources with limited permissions | Evaluated in both EntraID module (guest invitation policies, guest access reviews) and Teams/SharePoint module (Teams guest access settings, SharePoint guest sharing) |

### H-L

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Intune | - | Microsoft Intune; cloud-based unified endpoint management service for managing devices, apps, and security policies | Primary platform for the Device Management assessment domain; all 18 checks query Intune configuration via Graph API |
| Legacy Authentication | - | Older authentication protocols (POP3, IMAP, SMTP AUTH, ActiveSync with basic auth) that do not support multi-factor authentication | Evaluated in the EntraID module; checks for Conditional Access policies that block legacy authentication protocols |

### M-O

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Mail Flow Rule | - | Exchange Online transport rule that applies conditions and actions to messages as they flow through the mail transport pipeline | Evaluated in the Email Protection module; checks for security-relevant mail flow rules (e.g., auto-forwarding restrictions, external email tagging) |
| MFA | - | Multi-Factor Authentication; security mechanism requiring users to provide two or more verification factors to gain access | Core control in the EntraID module; multiple checks evaluate MFA enforcement via Conditional Access, per-user MFA status, and MFA registration completeness |
| Microsoft Defender for Office 365 | MDO | Advanced threat protection service for Exchange Online that provides Safe Links, Safe Attachments, and advanced anti-phishing capabilities | Source of several Email Protection module checks; Safe Links and Safe Attachments policies are Plan 1/Plan 2 features |

### P-R

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Password Policy | - | EntraID configuration governing password complexity, expiration, banned passwords, and self-service password reset | Evaluated in the EntraID module; checks for password expiration settings, banned password lists, SSPR configuration, and password protection |
| PIM | - | Privileged Identity Management; EntraID feature that provides just-in-time privileged access, access reviews, and role activation workflows for admin roles | Evaluated in the EntraID module; checks for PIM enablement, eligible vs. permanent admin role assignments, and activation requirements |
| Quarantine Policy | - | Exchange Online policy that defines what actions end users can take on quarantined messages (preview, release, delete) | Evaluated in the Email Protection module; checks for quarantine policy configuration and notification settings |

### S

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Safe Attachments | - | Microsoft Defender for Office 365 feature that opens email attachments in a virtual environment (detonation sandbox) to detect malicious content before delivery | Evaluated in the Email Protection module; checks for Safe Attachments policy existence, action configuration (Block/Replace/Dynamic Delivery), and scope |
| Safe Links | - | Microsoft Defender for Office 365 feature that provides time-of-click URL scanning and rewriting to protect against malicious links in email and Office documents | Evaluated in the Email Protection module; checks for Safe Links policy existence, URL scanning enablement, and click-through tracking |
| Sensitivity Labels | - | Microsoft Information Protection labels that classify and protect documents and emails based on sensitivity (Public, Internal, Confidential, Highly Confidential) | Evaluated in the Teams/SharePoint module; checks for label policy publication, default labeling, and mandatory labeling configuration |
| Sign-In Risk Policy | - | EntraID Identity Protection policy that evaluates the risk level of a sign-in attempt (low/medium/high) and enforces controls such as MFA or block | Evaluated in the EntraID module; checks for policy enablement, risk level thresholds, and enforcement actions |
| SPF | - | Sender Policy Framework; email authentication protocol that specifies which mail servers are authorized to send email on behalf of a domain via DNS TXT records | Evaluated in the Email Protection module; checks for SPF record existence, syntax validity, and authorization scope on all accepted domains |

### T-Z

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Teams Meeting Policy | - | Microsoft Teams policy that controls meeting features such as recording, transcription, lobby bypass, anonymous join, and screen sharing permissions | Evaluated in the Teams/SharePoint module; checks for security-relevant meeting settings across assigned policies |
| Teams Messaging Policy | - | Microsoft Teams policy that controls messaging features such as message editing/deletion, read receipts, URL preview, and Giphy/meme usage | Evaluated in the Teams/SharePoint module; checks for messaging controls that affect data governance and information security |
| User Risk Policy | - | EntraID Identity Protection policy that evaluates cumulative user risk (leaked credentials, anomalous behavior) and enforces controls such as password change or block | Evaluated in the EntraID module; checks for policy enablement, risk level thresholds, and enforcement actions (password change vs. block) |
| Windows Update Ring | - | Microsoft Intune policy that configures Windows Update for Business settings including deferral periods, deadlines, and restart behavior | Evaluated in the Device Management module; checks for update ring configuration, deferral periods, and assignment scope |

---

## 2. CMMC & Regulatory / Compliance Terms

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Cybersecurity Maturity Model Certification | CMMC | U.S. Department of Defense framework requiring defense contractors to implement cybersecurity practices to protect Federal Contract Information (FCI) and Controlled Unclassified Information (CUI) | The regulatory context for IntelliSec Solutions' client base; M365 security assessments support clients preparing for CMMC certification by evaluating M365 tenant security posture |
| Controlled Unclassified Information | CUI | Government-created or -owned information that requires safeguarding controls per law, regulation, or policy, but is not classified | The data category that DIB clients must protect; M365 tenant security configuration directly affects CUI protection posture |
| Defense Federal Acquisition Regulation Supplement | DFARS | Supplement to the Federal Acquisition Regulation (FAR) specific to the Department of Defense; DFARS 252.204-7012 requires adequate security for CUI | Regulatory driver for DIB clients to engage IntelliSec Solutions for security assessments; DFARS compliance requires demonstrable security controls |
| Defense Industrial Base | DIB | The worldwide industrial complex of organizations that research, develop, produce, and maintain military weapons systems, subsystems, and components for the Department of Defense | Primary client segment for IntelliSec Solutions' managed security services; all M365 security assessments are performed for DIB organizations |
| National Institute of Standards and Technology | NIST | U.S. federal agency that develops cybersecurity frameworks, standards, and guidelines including SP 800-171 and the Cybersecurity Framework | Publisher of the security standards that inform many of the 87+ controls evaluated by the assessment tool |
| NIST SP 800-171 | - | "Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations"; defines 110 security requirements across 14 families that form the basis of CMMC Level 2 | Reference framework; many M365 security controls evaluated by the tool map to specific NIST SP 800-171 requirements (e.g., AC.L2-3.1.1 for access control, IA.L2-3.5.3 for MFA) |
| Supplier Performance Risk System | SPRS | DoD system where contractors submit self-assessment scores (range: -203 to 110) based on NIST SP 800-171 implementation status | Contextual awareness; M365 security assessment findings may impact a client's SPRS score if M365 controls map to unimplemented NIST 800-171 requirements |

---

## 3. Tool-Specific Terms

### Assessment Architecture

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Assessment Engagement | - | A complete M365 security assessment performed against a specific client tenant, encompassing all active checks across all enabled domains, producing findings and a deliverable report | Top-level unit of work; each client engagement produces one assessment with findings, evidence, and reports |
| Collector | - | A PowerShell function within a module that connects to M365 APIs (Graph, Exchange Online, Teams) and retrieves raw configuration data for one or more related checks | Architecture pattern: Collectors gather data, Checks evaluate it. Collectors are domain-specific (e.g., `Get-EntraIDConditionalAccessPolicies`, `Get-IntuneCompliancePolicies`) and cache results to minimize API calls |
| Check | - | A PowerShell function that evaluates a specific security control by analyzing data retrieved by a Collector and producing a structured finding with a status and severity | Architecture pattern: each of the 87+ active controls is implemented as a Check function. Checks are deterministic -- given the same Collector data, they always produce the same finding |
| Finding | - | The output of a single Check execution; a structured object containing the FindingId, title, description, severity, status, evidence references, and remediation guidance | Core data object; all findings from an assessment are aggregated into reports and persisted in SQLite |
| FindingId | - | A unique, hierarchical identifier for each check following domain-specific naming conventions | Convention: `IAM-AUTH-001` through `IAM-AUTH-039` (EntraID), `DM-DS-001` through `DM-DS-018` (Device Management), `ASM-MP-001` through `ASM-MP-013` (Email Protection), `ASM-TSP-001` through `ASM-TSP-017` (Teams/SharePoint). Format: `{DomainCode}-{SubdomainCode}-{SequentialNumber}` |
| Module | - | A self-contained PowerShell module (.psm1) encapsulating all Collectors, Checks, and supporting functions for a single assessment domain | Four active modules: EntraID, DeviceManagement, EmailProtection, TeamsSharePoint. Four definition-only modules planned: ApplicationProtection, DataProtection, VulnerabilityManagement, FinSecOps |
| Definition-Only Module | - | A module that contains control definitions (FindingId, title, description, severity, remediation guidance) but no automated Collector or Check logic; controls in these modules produce a NotApplicable status | Phase 4 deliverable; provides a complete control catalog for future automation while acknowledging that evaluation logic has not yet been implemented |

### FindingId Domain Codes

| Domain Code | Subdomain Code | Domain Name | Example FindingId | Active Checks |
|-------------|----------------|-------------|-------------------|---------------|
| IAM | AUTH | EntraID (Identity and Access Management) | IAM-AUTH-001 | 39 |
| DM | DS | Device Management | DM-DS-001 | 18 |
| ASM | MP | Email Protection (Application Security Management - Mail Protection) | ASM-MP-001 | 13 |
| ASM | TSP | Teams/SharePoint (Application Security Management - Teams & SharePoint) | ASM-TSP-001 | 17 |
| ASM | AP | Application Protection (definition-only) | ASM-AP-001 | 0 (Phase 4) |
| DPR | DP | Data Protection (definition-only) | DPR-DP-001 | 0 (Phase 4) |
| VLN | VM | Vulnerability Management (definition-only) | VLN-VM-001 | 0 (Phase 4) |
| FIN | FS | FinSecOps (definition-only) | FIN-FS-001 | 0 (Phase 4) |

### Credential & Access Management

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Credential Profile | - | A named, encrypted configuration containing the M365 tenant ID, client ID, client secret (or certificate thumbprint), and connection parameters needed to authenticate to a specific client tenant | Stored locally on the consultant's workstation; encrypted with DPAPI; one profile per client tenant; selected at assessment launch time |
| Break Glass Account | - | An emergency-access admin account in EntraID configured to bypass Conditional Access and MFA policies, used only in break-glass scenarios (e.g., all other admin accounts locked out) | Evaluated in the EntraID module (IAM-AUTH series); checks verify that break glass accounts exist, are excluded from CA policies, and have appropriate monitoring/alerting configured |
| Service Account | - | The M365 account (application registration or user account) used by the assessment tool to authenticate and query tenant configuration via Graph API and PowerShell modules | Requires read-only permissions; should be Global Reader or a custom role with minimum necessary Graph API scopes; created by the client IT admin per the pre-engagement checklist |

### Evidence & Reporting

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Evidence Export | - | The automated process of writing raw configuration data and check evaluation details to structured CSV files, organized by assessment domain, for audit traceability and client delivery | One CSV per Collector data set; stored in a timestamped output directory alongside generated reports |
| Assessment Report | - | The comprehensive document generated after an assessment completes, containing all findings organized by domain, severity distribution, executive summary, detailed check results, and remediation guidance | Generated in three formats: HTML (interactive navigation), PDF (formal delivery), DOCX (client-editable via PSWriteWord) |
| Executive Summary | - | The opening section of the assessment report providing a high-level overview of findings by severity, domain-level compliance posture, and prioritized remediation recommendations | Auto-generated from finding aggregation; designed for CISO/leadership consumption |

---

## 4. Technical / Infrastructure Terms

### PowerShell & Runtime

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| PowerShell 5.1 | - | Windows PowerShell 5.1; the version of PowerShell included with Windows 10/11; built on the .NET Framework | Minimum supported runtime for the assessment tool; ensures compatibility with Windows-only modules (e.g., DPAPI) |
| PowerShell 7 | - | Cross-platform version of PowerShell built on .NET (formerly PowerShell Core); supports Windows, macOS, and Linux | Preferred runtime for improved performance, better error handling, and pipeline parallelism; all modules are tested on both 5.1 and 7 |
| Pester | - | PowerShell testing framework for writing and running unit, integration, and acceptance tests | Used for unit testing all Check functions; each check has Pester tests with known-compliant and known-noncompliant input data to validate evaluation logic |

### APIs & Connectivity Modules

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Microsoft Graph API | - | Microsoft's unified REST API providing access to M365 services including EntraID, Intune, SharePoint, Teams, and Exchange Online data | Primary data source for EntraID, Device Management, and Teams/SharePoint modules; accessed via the Microsoft.Graph PowerShell SDK |
| Microsoft.Graph PowerShell SDK | - | Official PowerShell module for interacting with Microsoft Graph API; provides cmdlets for querying and managing M365 resources | Core dependency for EntraID, Device Management, and Teams/SharePoint Collectors; version-pinned for stability |
| Exchange Online Management | EXO | PowerShell module (ExchangeOnlineManagement) providing cmdlets for managing Exchange Online configuration including mail flow, protection policies, and recipient objects | Primary data source for the Email Protection module; provides access to DKIM, DMARC, anti-phishing, anti-spam, Safe Links, Safe Attachments, and mail flow rule configuration |
| Microsoft Teams PowerShell | - | PowerShell module (MicrosoftTeams) providing cmdlets for managing Teams policies, configurations, and settings | Data source for Teams-specific checks in the Teams/SharePoint module; provides meeting policies, messaging policies, and guest access configuration |

### Data & Persistence

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| SQLite | - | Lightweight, serverless, file-based relational database engine | Local persistence layer for assessment data; stores findings, assessment metadata, and historical results for trend analysis and re-engagement support |
| PSSQLite | - | PowerShell module providing cmdlets for interacting with SQLite databases | Wrapper module used by the tool to read/write assessment data to the local SQLite database file |
| DPAPI | - | Data Protection Application Programming Interface; Windows API that provides data encryption using credentials derived from the current user or machine context | Used to encrypt stored credential profiles on consultant workstations; ensures credentials are bound to the specific user and machine, preventing extraction if the profile file is copied to another system |

### Reporting & Output Libraries

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| PSWriteWord | - | PowerShell module for creating and manipulating Microsoft Word (DOCX) documents programmatically | Used to generate the DOCX format of the assessment report; provides structured document creation with styles, tables, and formatting |
| ImportExcel | - | PowerShell module for reading and writing Excel (XLSX) files without requiring Excel to be installed | Used for evidence export in Excel format and for any supplementary data tables included in assessment deliverables |
| Pode | - | Cross-platform PowerShell web framework for building REST APIs, web pages, and server-side applications | Powers the local web dashboard that provides real-time assessment progress, finding summaries, severity distribution charts, and domain-level status visualization |

---

## 5. Finding Severity Levels

The assessment tool classifies each finding into one of five severity levels based on the potential security impact of the evaluated control's current configuration state.

| Severity | Color Code | Definition | Typical Examples |
|----------|------------|------------|------------------|
| **Critical** | Red | A control misconfiguration or absence that presents an immediate, exploitable risk to the M365 tenant, likely resulting in unauthorized access, data exfiltration, or complete security bypass if left unaddressed | No Conditional Access policies enforcing MFA for admins; legacy authentication not blocked; no break glass account configured; Global Admin role permanently assigned to 10+ accounts |
| **High** | Orange | A significant control gap that materially weakens the tenant's security posture and should be remediated promptly, though exploitation may require additional conditions or attacker capability | MFA not enforced for all users (admins covered but standard users excluded); PIM not enabled for privileged roles; Safe Attachments policy missing; DMARC policy set to "none" (monitoring only) |
| **Medium** | Yellow | A control configuration that deviates from security best practices and incrementally increases risk, but does not represent an immediate exploitable vulnerability | SPF record uses soft fail (~all) instead of hard fail (-all); device compliance policy exists but non-compliant devices are not blocked; Teams external access enabled for all domains |
| **Low** | Blue | A minor configuration deviation or hardening opportunity that represents a defense-in-depth improvement with limited direct security impact | Quarantine notification not enabled; Teams meeting lobby bypass enabled for trusted organizations; password expiration policy set but not aligned with NIST 800-63B guidance (which recommends no expiration) |
| **Info** | Gray | An informational finding that documents a configuration observation, contextual note, or positive security posture confirmation; no remediation action required | MFA registration is 100% complete; all Conditional Access policies are properly scoped; DKIM signing is enabled on all accepted domains |

---

## 6. Finding Statuses

Each check produces a finding with one of four possible statuses indicating the evaluation outcome.

| Status | Definition | Report Treatment | Typical Cause |
|--------|------------|------------------|---------------|
| **NonCompliant** | The evaluated control does not meet the expected security baseline; a gap or misconfiguration has been identified | Included in findings with severity rating, detailed description, evidence references, and remediation guidance | Control is disabled, misconfigured, missing, or insufficiently scoped |
| **Compliant** | The evaluated control meets or exceeds the expected security baseline; no gap identified | Included in report as a positive confirmation; counted toward the compliant control total | Control is properly configured and appropriately scoped |
| **Error** | The check could not complete evaluation due to a technical issue (API error, insufficient permissions, unexpected data format, timeout) | Flagged in report as requiring manual review; does not count as Compliant or NonCompliant | Graph API returned an error; insufficient permissions on the service account; Exchange Online module connection failure; unexpected null or empty response |
| **NotApplicable** | The control is not relevant to the target tenant's configuration, licensing, or the check is in a definition-only module without automated evaluation logic | Documented in report for completeness; excluded from compliance percentage calculations | Tenant does not have the required license (e.g., no Defender for Office 365 Plan 2 for Safe Attachments); control is in a Phase 4 definition-only module; feature is not provisioned in the tenant |

---

## 7. Assessment Domain Summary

Quick reference for the four active assessment domains and their check counts.

| Domain | Module Name | FindingId Prefix | Active Checks | Key Data Sources | Phase |
|--------|-------------|------------------|---------------|------------------|-------|
| EntraID (Identity & Access Management) | EntraID | IAM-AUTH-xxx | 39 | Microsoft Graph API (Identity, Conditional Access, PIM, Authentication Methods) | Phase 1 (Complete) |
| Device Management | DeviceManagement | DM-DS-xxx | 18 | Microsoft Graph API (Intune Device Management, Compliance, Configuration) | Phase 2 (Complete) |
| Email Protection | EmailProtection | ASM-MP-xxx | 13 | Exchange Online Management (DKIM, DMARC, SPF, Anti-Phishing, Anti-Spam, Safe Links, Safe Attachments, Mail Flow Rules) | Phase 3 (In Progress) |
| Teams & SharePoint | TeamsSharePoint | ASM-TSP-xxx | 17 | Microsoft Graph API (SharePoint), Microsoft Teams PowerShell (Teams Policies, Guest Access, Meeting/Messaging Policies) | Phase 3 (In Progress) |
| **Total Active** | | | **87** | | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-15 | IntelliSec Solutions | Initial draft with M365 security terms, CMMC/regulatory terms, tool-specific terms (Collector/Check/Finding architecture, FindingId conventions), technical dependencies, severity levels, finding statuses, and domain summary |
