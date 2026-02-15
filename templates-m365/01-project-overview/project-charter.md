# Project Charter

| **Page Title**   | M365 Security Assessment Automation - Project Charter |
|------------------|-------------------------------------------------------|
| **Last Updated** | 2026-02-15                                            |
| **Status**       | IN PROGRESS                                           |
| **Owner**        | IntelliSec Solutions                                  |

---

## 1. Project Identity

| Field                | Value                                                          |
|----------------------|----------------------------------------------------------------|
| **Project Name**     | M365 Security Assessment Automation                            |
| **Project Code**     | M365-SA                                                        |
| **Project Sponsor**  | IntelliSec Solutions (brand: CloudSecOps)                      |
| **Project Manager**  | Lead Developer / Architect, IntelliSec Solutions               |
| **Department**       | Product Engineering / Security Services                        |
| **Start Date**       | 2025-01-01                                                     |
| **Target End Date**  | 2026-06-30                                                     |
| **Platform**         | Windows PowerShell 5.1+ / PowerShell 7 (local execution)      |
| **GitHub Repository** | Private (IntelliSec Solutions internal)                       |

---

## 2. Project Description

The M365 Security Assessment Automation tool is a locally executed PowerShell-based platform that automates Microsoft 365 tenant security assessments for Defense Industrial Base (DIB) clients. The tool evaluates 87+ active security controls across four primary assessment domains -- EntraID (Identity and Access Management), Device Management, Email Protection, and Teams/SharePoint -- replacing what was previously a multi-day manual assessment process with a repeatable, evidence-backed, and consistent evaluation methodology. The platform connects to target M365 tenants via Microsoft Graph API, Exchange Online PowerShell, and Microsoft Teams PowerShell modules to collect configuration data, evaluate each control against defined security baselines, and produce structured findings with severity ratings. Evidence is exported as CSV files for audit traceability, and comprehensive assessment reports are generated in HTML, PDF, and DOCX formats using PSWriteWord and ImportExcel. Assessment data is persisted locally in SQLite via PSSQLite, and a Pode-based web dashboard provides real-time visibility into assessment progress, findings, and control status. Credential profiles are managed securely using DPAPI encryption for stored tenant credentials. The tool is designed for use by IntelliSec Solutions' internal security consultants as part of the firm's managed security services offering, enabling them to deliver standardized, high-quality M365 security assessments at scale.

---

## 3. Vision Statement

To establish M365 Security Assessment Automation as the definitive internal tool for IntelliSec Solutions' security consultants, transforming multi-day manual Microsoft 365 tenant assessments into a streamlined, automated process that delivers consistent, evidence-backed security evaluations -- enabling the team to scale managed security services across the Defense Industrial Base without sacrificing depth, accuracy, or client trust.

---

## 4. Business Justification / Problem Statement

### Problem Statement

IntelliSec Solutions' security consultants currently perform Microsoft 365 tenant security assessments through a largely manual process. Each engagement requires a consultant to individually inspect dozens of M365 configuration settings across EntraID, device management, email protection, and collaboration services -- navigating multiple admin portals, running ad hoc PowerShell commands, manually documenting findings, and assembling reports by hand. This manual approach suffers from several critical shortcomings:

- **Time-intensive**: A thorough manual assessment of a single M365 tenant takes multiple days of senior consultant time, limiting the number of engagements the team can deliver per quarter.
- **Inconsistent**: Without a standardized checklist engine, the depth and coverage of an assessment varies depending on which consultant performs it, what they remember to check, and how they interpret results.
- **Error-prone**: Manual data collection and transcription introduces the risk of missed controls, incorrect findings, and evidence gaps that undermine the credibility of deliverables.
- **Does not scale**: As IntelliSec Solutions grows its managed security services client base, the manual model becomes a bottleneck -- adding clients requires adding consultants proportionally, with no efficiency gain.
- **Weak evidence chain**: Manual assessments produce ad hoc notes and screenshots rather than structured, exportable evidence tied to specific controls, making it difficult to demonstrate assessment rigor to clients or auditors.

### Business Justification

Automating the M365 security assessment process directly addresses each of these problems and unlocks significant operational leverage for IntelliSec Solutions' security services practice.

| Justification Category | Details                                                                                  |
|------------------------|------------------------------------------------------------------------------------------|
| Strategic Alignment    | Positions IntelliSec Solutions as a technology-driven security services provider; differentiates from competitors still relying on manual assessments |
| Time Savings           | Reduces a multi-day manual assessment to a single automated run (hours, not days); consultants focus on analysis and client delivery rather than data collection |
| Consistency & Quality  | Every assessment evaluates the same 87+ controls using the same logic, producing uniform, comparable results across all client engagements |
| Scalability            | Enables the team to scale the number of client assessments without proportional headcount growth; same team, more engagements |
| Evidence Integrity     | Automated evidence export (CSV) produces structured, auditable artifacts tied directly to each control evaluation |
| Cost Efficiency        | Minimal tooling cost (PowerShell-based, no cloud hosting, no per-seat licensing); ROI is realized through consultant time savings on the first engagement |
| Client Trust           | Professional HTML/PDF/DOCX reports with consistent formatting and comprehensive evidence build confidence with DIB clients and their auditors |

---

## 5. Objectives and Success Criteria

Each objective must be measurable. Define KPIs that can be tracked post-delivery.

| # | Objective | KPI | Baseline | Target | Measurement Method |
|---|-----------|-----|----------|--------|--------------------|
| 1 | Automate all 87+ active security controls across 4 assessment domains | Control automation completeness (active checks passing/failing with evidence) | 0 automated controls | 87+ active controls | Automated test run against reference M365 tenant; verify all checks execute and produce findings |
| 2 | Reduce single-tenant assessment time from multi-day manual effort to under 4 hours (including review) | End-to-end assessment duration (tool execution + consultant review) | 3-5 days manual | < 4 hours total | Time tracking across 5 consecutive client engagements |
| 3 | Achieve 100% evidence export coverage for all evaluated controls | Controls with associated CSV evidence artifacts | 0% | 100% | Audit evidence output directory after assessment run; confirm CSV exists for each control |
| 4 | Generate client-ready reports in all three formats (HTML, PDF, DOCX) without manual formatting | Report generation success rate across formats | Manual Word document assembly | Automated HTML + PDF + DOCX generation | Report generation test across 10 assessment runs |
| 5 | Onboard all internal security consultants onto the tool with zero manual assessment fallback | Consultant adoption rate; percentage of assessments using the tool vs. manual | 0% tool usage | 100% tool usage for M365 assessments | Quarterly engagement review; track assessment method per engagement |
| 6 | Maintain zero false-negative rate on critical and high-severity controls | False negatives identified in post-assessment manual spot checks | Unknown (no baseline) | 0 false negatives on Critical/High controls | Random 10% spot check of Critical/High findings against manual verification per engagement |

---

## 6. Scope

### In-Scope

- **EntraID Domain (39 checks)**: Conditional Access policies, MFA enforcement, PIM configuration, authentication methods, sign-in risk policies, user risk policies, password policies, guest access controls, admin role assignments, break glass account validation, legacy authentication blocking
- **Device Management Domain (18 checks)**: Intune compliance policies, device enrollment restrictions, BitLocker encryption, Windows Update rings, endpoint protection profiles, device configuration profiles, mobile device management settings
- **Email Protection Domain (13 checks)**: DKIM configuration, DMARC policy validation, SPF record verification, Safe Links policies, Safe Attachments policies, anti-phishing policies, anti-spam policies, mail flow rules review, quarantine policies
- **Teams/SharePoint Domain (17 checks)**: External sharing settings, guest access policies, Teams meeting policies, Teams messaging policies, SharePoint site-level permissions, OneDrive sharing configuration, sensitivity labels, DLP policies for collaboration
- **Evidence Export**: Automated CSV export of raw configuration data and evaluation results for each control, organized by assessment domain
- **Multi-Format Report Generation**: HTML report with interactive navigation, PDF report for formal delivery, DOCX report via PSWriteWord for client-editable deliverables
- **Web Dashboard**: Pode-based local web dashboard for real-time assessment progress, finding summaries, severity distribution, and domain-level status
- **Credential Management**: Secure storage and retrieval of M365 tenant credentials using DPAPI encryption; support for multiple credential profiles (one per client tenant)
- **SQLite Persistence**: Local assessment data storage via PSSQLite for historical comparison, trend analysis, and re-engagement support
- **Definition-Only Modules (Phase 4)**: Placeholder module definitions for ApplicationProtection, DataProtection, VulnerabilityManagement, and FinSecOps domains (control definitions without automated evaluation logic, reserved for future implementation)

### Out-of-Scope

- Cloud hosting or SaaS deployment of the assessment tool (tool runs locally on consultant workstations)
- Multi-tenant SaaS architecture or centralized web application
- Automated remediation (the tool assesses and reports but does not modify client tenant configurations)
- Real-time continuous monitoring or scheduled assessment runs
- Client-facing self-service portal (assessments are performed by IntelliSec consultants, not by clients directly)
- Mobile application or cross-platform GUI (PowerShell CLI and local Pode web dashboard only)
- Integration with third-party GRC platforms or ticketing systems
- Assessment of non-Microsoft 365 environments (AWS, Google Workspace, on-premises Active Directory)

### Future Scope (Planned for Later Phases)

- Automated evaluation logic for Phase 4 definition-only modules (ApplicationProtection, DataProtection, VulnerabilityManagement, FinSecOps)
- Scheduled and unattended assessment runs via Windows Task Scheduler or CI/CD pipeline
- Centralized results aggregation across multiple client assessments for trend analysis
- Integration with IntelliSec Solutions' ticketing system for remediation tracking
- Cross-tenant comparison and benchmarking dashboards
- PowerShell Gallery publication for controlled distribution

---

## 7. Key Assumptions and Constraints

### Assumptions

| # | Assumption | Impact if Invalid |
|---|------------|-------------------|
| 1 | Target M365 tenants grant IntelliSec Solutions service accounts with sufficient read permissions (Global Reader or equivalent) for automated data collection via Microsoft Graph API and Exchange Online PowerShell | Assessment cannot execute; would require elevated permissions negotiation with each client, delaying engagements |
| 2 | Security consultants run the tool on Windows workstations with PowerShell 5.1+ or PowerShell 7 installed and have internet connectivity to target M365 tenants | Need to support alternative execution environments (macOS, Linux); PowerShell 7 cross-platform support mitigates partially but Graph/Exchange modules may have compatibility issues |
| 3 | Microsoft Graph API and Exchange Online PowerShell module remain stable and backward-compatible for the data points the tool evaluates | Breaking API changes require module updates; mitigation via pinned module versions and Graph API versioning (beta vs. v1.0) |
| 4 | The 87+ active controls provide sufficient coverage for a commercially valuable M365 security assessment deliverable | Client feedback may require additional controls or domains sooner than planned, compressing the roadmap |
| 5 | SQLite is sufficient for local assessment data storage given the single-user, single-tenant-at-a-time execution model | Migration to a more robust local database if concurrent assessment support is needed |
| 6 | DPAPI provides adequate security for stored credential profiles on consultant workstations | Need to implement alternative credential vault integration (e.g., Windows Credential Manager, Azure Key Vault) if DPAPI is deemed insufficient |

### Constraints

| # | Constraint | Type |
|---|------------|------|
| 1 | Small development team (founder-led); module development is sequential, not parallel | Resource |
| 2 | Tool must run entirely locally on Windows workstations; no cloud infrastructure budget allocated | Budget / Technical |
| 3 | Dependent on Microsoft Graph API rate limits and throttling policies; large tenants may require pacing logic | Technical |
| 4 | Must not modify any configuration in client M365 tenants; read-only assessment | Security / Contractual |
| 5 | Credential profiles are workstation-specific due to DPAPI machine/user binding; profiles cannot be shared across machines | Technical |
| 6 | Assessment scope limited to controls that can be evaluated programmatically via available APIs; some controls may require manual verification notes | Technical |
| 7 | PowerShell module dependencies (Microsoft.Graph, ExchangeOnlineManagement, MicrosoftTeams, PSSQLite, Pode, PSWriteWord, ImportExcel) must be maintained and version-compatible | Technical |

---

## 8. Budget Summary

| Category | Estimated Cost | Approved Budget | Notes |
|----------|---------------|-----------------|-------|
| Cloud Infrastructure | $0 | $0 | Tool runs locally on consultant workstations; no cloud hosting, no Azure/AWS costs |
| PowerShell Modules & Dependencies | $0 | $0 | All modules are open-source: Microsoft.Graph, ExchangeOnlineManagement, MicrosoftTeams, PSSQLite, Pode, PSWriteWord, ImportExcel |
| Licensing / Third-Party Services | $0 | $0 | No per-seat licensing; GitHub private repo on existing plan; M365 admin access provided by clients |
| Development Hardware | $0 | $0 | Uses existing consultant workstations (Windows 10/11 with PowerShell 5.1+/7) |
| Personnel (internal) | Founder / Lead Developer time | N/A | Founder-led development; no external contractors in current phase |
| Testing Infrastructure | ~$50 USD/month | $100 USD/month | M365 developer tenant or test tenant for validation; may leverage existing IntelliSec M365 subscription |
| Contingency | ~$100 USD | $200 USD | Unexpected module licensing changes, test tenant costs |
| **Total (Year 1)** | **~$600-800 USD** | **~$1,400 USD** | Minimal cost; primary investment is development time |

---

## 9. Timeline / Milestones

| # | Milestone | Description | Target Date | Status | Dependencies |
|---|-----------|-------------|-------------|--------|--------------|
| 1 | Project Kickoff & Architecture | Repository created, module architecture defined, PowerShell project structure established, dependency management configured | 2025-01-15 | COMPLETE | Founder commitment, M365 test tenant access |
| 2 | Phase 1: EntraID Module (39 checks) | Automated evaluation of 39 EntraID/Identity controls: Conditional Access, MFA, PIM, authentication methods, sign-in/user risk policies, password policies, guest access, admin roles, break glass accounts, legacy auth blocking | 2025-06-30 | COMPLETE | Microsoft.Graph module, Graph API permissions, test tenant with representative EntraID configuration |
| 3 | Phase 2: Device Management Module (18 checks) | Automated evaluation of 18 Device Management controls: Intune compliance, enrollment restrictions, BitLocker, Update rings, endpoint protection, device configuration, MDM settings | 2025-09-30 | COMPLETE | Phase 1 complete, Intune-enrolled test devices, Graph API device management permissions |
| 4 | Phase 3: Email Protection + Teams/SharePoint (30 checks) | Automated evaluation of 13 Email Protection controls (DKIM, DMARC, SPF, Safe Links, Safe Attachments, anti-phishing, anti-spam, mail flow, quarantine) and 17 Teams/SharePoint controls (external sharing, guest access, meeting/messaging policies, site permissions, sensitivity labels, DLP) | 2026-01-31 | IN PROGRESS | Phase 2 complete, ExchangeOnlineManagement module, MicrosoftTeams module, SharePoint admin permissions |
| 5 | Evidence Export & Report Generation | CSV evidence export for all controls, HTML report with interactive navigation, PDF report generation, DOCX report via PSWriteWord | 2026-03-31 | NOT STARTED | Phases 1-3 checks complete, PSWriteWord and ImportExcel modules validated |
| 6 | Web Dashboard (Pode) | Local Pode-based web dashboard for assessment progress, finding summaries, severity distribution, domain-level status visualization | 2026-04-30 | NOT STARTED | Assessment engine and SQLite persistence operational |
| 7 | Phase 4: Definition-Only Modules | Control definitions (without automated evaluation) for ApplicationProtection, DataProtection, VulnerabilityManagement, and FinSecOps domains; placeholder module structure for future implementation | 2026-05-15 | NOT STARTED | Phase 3 complete; module architecture supports definition-only entries |
| 8 | Internal Pilot & Consultant Onboarding | Deploy tool to all internal security consultants; conduct training sessions; run parallel assessments (manual + automated) on 3 client engagements to validate accuracy | 2026-05-31 | NOT STARTED | All active modules complete, report generation working, credential management tested |
| 9 | Production Release (v1.0 GA) | Stable release for full internal adoption; retire manual M365 assessment process; all 87+ active controls automated with evidence and reporting | 2026-06-30 | NOT STARTED | Pilot validation complete, all Critical/High issues resolved, consultant sign-off |

---

## 10. Key Risks

**Likelihood:** Low (1) / Medium (2) / High (3)
**Impact:** Low (1) / Medium (2) / High (3)
**Risk Score:** Likelihood x Impact (1-9)

| # | Risk Description | Likelihood | Impact | Score | Mitigation Strategy | Owner |
|---|------------------|------------|--------|-------|---------------------|-------|
| 1 | Microsoft Graph API breaking changes or deprecations invalidate existing check logic, requiring rework of affected modules | Medium | High | 6 | Pin Graph API version (v1.0 preferred over beta); subscribe to Microsoft Graph changelog; implement API version abstraction layer in module architecture | Lead Developer |
| 2 | Key personnel dependency (single founder/developer); unavailability halts all development progress | High | High | 9 | Comprehensive module documentation; standardized check architecture (Collector/Check pattern) enables onboarding of additional developers; maintain runbooks for all modules | Platform Owner |
| 3 | Client M365 tenants have restrictive permissions that prevent the tool from collecting required data, producing incomplete assessments | Medium | Medium | 4 | Document minimum required permissions per module; provide clients with a pre-engagement permissions checklist; implement graceful degradation (skip inaccessible checks with NotApplicable status rather than failing) | Lead Developer |
| 4 | PowerShell module dependency conflicts across Microsoft.Graph, ExchangeOnlineManagement, and MicrosoftTeams modules due to shared assemblies or version incompatibilities | Medium | Medium | 4 | Pin module versions in requirements manifest; test full dependency chain in CI; isolate module imports where possible; document known compatibility matrix | Lead Developer |
| 5 | False negatives in security checks (tool reports Compliant when the control is actually NonCompliant) erode client trust and IntelliSec credibility | Low | High | 3 | Parallel manual verification during pilot phase; peer review of all check logic; Pester unit tests for each check with known-good and known-bad test cases; post-engagement spot checks | Lead Developer |
| 6 | Assessment execution time exceeds acceptable limits on large M365 tenants due to Graph API throttling or large dataset retrieval | Medium | Low | 2 | Implement throttling-aware retry logic with exponential backoff; parallelize independent API calls where safe; provide progress indicators; allow partial/incremental assessment runs | Lead Developer |
| 7 | DPAPI credential storage is compromised if a consultant workstation is breached, exposing client M365 tenant credentials | Low | High | 3 | Enforce full-disk encryption (BitLocker) on consultant workstations; implement credential expiration; document secure credential handling procedures; evaluate migration to Windows Credential Manager or certificate-based auth | Security Lead |

---

## 11. Approval Sign-Off

This charter is approved by the following stakeholders. Approval indicates agreement with the project scope, objectives, timeline, and budget as described above.

| Name | Role | Date | Signature |
|------|------|------|-----------|
| IntelliSec Solutions Founder | Platform Owner / Executive Sponsor | 2026-02-15 | |
| Lead Developer | Lead Architect / Project Manager | 2026-02-15 | |
| Security Services Lead | Security Consultant Team Lead | | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-15 | IntelliSec Solutions | Initial draft with full project charter for M365 Security Assessment Automation |
