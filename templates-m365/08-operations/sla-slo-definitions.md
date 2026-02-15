# SLA and SLO Definitions

| **Metadata**     | **Value**                                                    |
|------------------|--------------------------------------------------------------|
| Page Title       | M365 Security Assessment Automation - SLA/SLO Definitions    |
| Last Updated     | 2026-02-15                                                   |
| Status           | `CURRENT`                                                    |
| Owner            | Lead Developer / Security Operations                         |
| Reviewers        | Security Consultant Lead, Engineering Manager                |
| Version          | 1.0                                                          |

---

## 1. Document Purpose

This document defines the Service Level Objectives (SLOs) and internal Service Level Agreements (SLAs) for the M365-SecurityAssessment PowerShell module. Because this is a locally executed internal tool (not a hosted SaaS product), traditional SLA/SLO frameworks are adapted to focus on assessment performance, finding quality, tool reliability, and internal development support commitments. These definitions establish measurable expectations for tool behavior and internal support responsiveness.

---

## 2. Applicability

| Aspect | Applicability |
|--------|---------------|
| External client SLAs | `NOT APPLICABLE` -- This tool has no external service consumers. Client-facing SLAs for assessment delivery are governed by engagement contracts, not this document. |
| Cloud infrastructure SLAs | `NOT APPLICABLE` -- No cloud hosting; tool runs locally on consultant workstations. |
| Uptime / availability SLAs | Adapted -- "Availability" is defined as the tool's ability to import, connect, and complete assessments successfully, not as server uptime. |
| Performance SLOs | Applicable -- Assessment completion times and report generation times are measurable and meaningful for operational planning. |
| Quality SLOs | Applicable -- Finding accuracy and evidence completeness are critical to the tool's value proposition. |
| Internal support SLAs | Applicable -- Internal development team commitments for bug fixes, feature requests, and dependency maintenance. |

---

## 3. Assessment Completion SLOs

These SLOs define the expected time for the assessment engine to complete its work, measured from the start of `Start-Assessment` to the availability of all output files. Timings assume a standard M365 tenant (< 10,000 users, < 100 Conditional Access policies, < 50 compliance policies) with stable network connectivity.

| SLO ID | Assessment Scope | Target Duration | Measurement Point | Current Performance |
|--------|-----------------|-----------------|--------------------|--------------------|
| PERF-01 | Full 4-module assessment (EntraID + DeviceManagement + EmailProtection + TeamsSharePoint) | < 30 minutes | `Start-Assessment` to final report file written | `MEETING SLO` |
| PERF-02 | Single module: EntraID (39 checks) | < 10 minutes | Module start to module completion in checkpoint | `MEETING SLO` |
| PERF-03 | Single module: DeviceManagement (18 checks) | < 8 minutes | Module start to module completion in checkpoint | `MEETING SLO` |
| PERF-04 | Single module: EmailProtection (13 checks) | < 7 minutes | Module start to module completion in checkpoint | `MEETING SLO` |
| PERF-05 | Single module: TeamsSharePoint (17 checks) | < 8 minutes | Module start to module completion in checkpoint | `MEETING SLO` |
| PERF-06 | Report generation (all formats: HTML + PDF + DOCX + Excel) | < 5 minutes | Report generation start to all output files written | `MEETING SLO` |
| PERF-07 | Assessment resume (from checkpoint) | < 5 minutes overhead | `Resume-Assessment` to resumption of next pending check | `MEETING SLO` |

**SLO Exceptions:**

| Condition | Impact on SLO | Handling |
|-----------|---------------|----------|
| Large tenant (> 10,000 users) | May exceed PERF-01 by up to 2x | Documented exception; logged as informational |
| Heavy Graph API throttling (sustained 429s) | May exceed individual module SLOs | Automatic retry with backoff; resume if timeout exceeds 60 minutes |
| Slow network connectivity | Proportional impact on all SLOs | Consultant responsibility to ensure adequate connectivity |
| First run after module update | May be slower due to cache warming | Not counted against SLO metrics |

---

## 4. Quality SLOs

These SLOs define the expected accuracy, completeness, and professionalism of assessment output.

### 4.1 Finding Accuracy

| SLO ID | Metric | Target | Measurement Method | Current Performance |
|--------|--------|--------|--------------------|---------------------|
| QUAL-01 | Finding accuracy rate (correct status for evaluated controls) | > 99% | Random 10% spot check of findings against manual verification per engagement | `MEETING SLO` |
| QUAL-02 | False negative rate on Critical/High controls | 0% | 100% manual verification of all Critical and High severity findings during pilot engagements; 10% spot check post-pilot | `MEETING SLO` |
| QUAL-03 | False positive rate on Critical/High controls | < 2% | Client feedback tracking; internal review of disputed findings | `MEETING SLO` |

### 4.2 Evidence Completeness

| SLO ID | Metric | Target | Measurement Method | Current Performance |
|--------|--------|--------|--------------------|---------------------|
| QUAL-04 | Evidence coverage (non-compliant findings with CSV evidence) | 100% | Automated post-assessment validation: every finding with status `NonCompliant` has a corresponding evidence CSV | `MEETING SLO` |
| QUAL-05 | Evidence traceability (evidence files reference specific control IDs) | 100% | Evidence file naming convention includes module and control identifier | `MEETING SLO` |
| QUAL-06 | Evidence freshness (evidence collected during the assessment run, not cached from prior runs) | 100% | Evidence file timestamps match the assessment execution window | `MEETING SLO` |

### 4.3 Report Quality

| SLO ID | Metric | Target | Measurement Method | Current Performance |
|--------|--------|--------|--------------------|---------------------|
| QUAL-07 | Report formatting consistency (professional, client-ready output) | 100% of reports pass formatting checklist | Manual review of report against formatting checklist (branding, table alignment, severity color coding, page breaks, table of contents) | `MEETING SLO` |
| QUAL-08 | Report content completeness (all evaluated controls appear in report) | 100% | Cross-reference report findings with `findings.json` output; every evaluated control has a report entry | `MEETING SLO` |
| QUAL-09 | Multi-format parity (HTML, PDF, DOCX contain the same findings data) | 100% | Automated comparison of finding counts across report formats | `MEETING SLO` |

---

## 5. Tool Availability and Reliability SLOs

These SLOs define the expected reliability of the tool itself -- its ability to import, connect, execute, and produce output without failures.

### 5.1 Module Reliability

| SLO ID | Metric | Target | Measurement Method | Current Performance |
|--------|--------|--------|--------------------|---------------------|
| AVAIL-01 | Module import success rate (given correct dependencies installed) | 100% | Track `Import-Module` failures across all consultant workstations; any import failure is a violation | `MEETING SLO` |
| AVAIL-02 | Dependency compatibility (all required modules load without conflict) | 100% | Tested against pinned dependency versions in requirements manifest; any version conflict is a violation | `MEETING SLO` |

### 5.2 Assessment Reliability

| SLO ID | Metric | Target | Measurement Method | Current Performance |
|--------|--------|--------|--------------------|---------------------|
| AVAIL-03 | Assessment completion rate (assessment runs to completion without unhandled exception) | > 95% | Track completed vs. failed assessments across all engagements; transient API failures covered by retry logic | `MEETING SLO` |
| AVAIL-04 | Graceful degradation rate (individual module failure does not crash entire assessment) | 100% | Any module failure that crashes the assessment engine (rather than being caught and logged) is a violation | `MEETING SLO` |
| AVAIL-05 | Resume success rate (checkpoint/resume system recovers interrupted assessments) | 100% | Track all `Resume-Assessment` invocations; any resume failure from a valid checkpoint is a violation | `MEETING SLO` |

### 5.3 Connectivity Reliability

| SLO ID | Metric | Target | Measurement Method | Current Performance |
|--------|--------|--------|--------------------|---------------------|
| AVAIL-06 | Authentication success rate (given valid credentials and permissions) | > 99% | Track `Connect-AssessmentTenant` outcomes; transient failures retried automatically | `MEETING SLO` |
| AVAIL-07 | API retry effectiveness (transient 429/5xx errors recovered by retry logic) | > 90% | Track retried API calls that eventually succeed vs. those that exhaust all retries | `MEETING SLO` |

---

## 6. Internal Support SLAs

These SLAs define the internal development team's response and resolution commitments for issues reported by security consultants.

### 6.1 Bug Fix SLAs

| SLA ID | Issue Category | Response Time | Resolution Target | Escalation Path |
|--------|---------------|---------------|-------------------|-----------------|
| SUP-01 | **Critical finding logic error** (false negative on Critical/High control) | Within 2 hours | Fix deployed within 24 hours | Lead Developer > Platform Owner |
| SUP-02 | **Assessment-blocking bug** (module fails to import, assessment cannot start, unhandled crash) | Within 4 hours | Fix deployed within 48 hours | Lead Developer > Platform Owner |
| SUP-03 | **Non-blocking bug** (incorrect formatting, minor calculation error, cosmetic issue) | Within 1 business day | Fix included in next scheduled release | Lead Developer |
| SUP-04 | **Enhancement request** (new check, new report format, UX improvement) | Acknowledged within 3 business days | Per project timeline and prioritization | Lead Developer > Platform Owner |

### 6.2 Dependency Maintenance SLAs

| SLA ID | Scenario | Resolution Target | Details |
|--------|----------|-------------------|---------|
| SUP-05 | Breaking change in Microsoft.Graph module | < 1 week | Microsoft.Graph SDK updates that break existing collectors; requires collector code update and regression testing |
| SUP-06 | Breaking change in ExchangeOnlineManagement module | < 1 week | Exchange Online PowerShell module updates affecting email security checks |
| SUP-07 | Breaking change in MicrosoftTeams module | < 1 week | Teams PowerShell module updates affecting collaboration security checks |
| SUP-08 | Microsoft Graph API endpoint deprecation | < 2 weeks | API endpoint removal or schema change requiring collector migration |
| SUP-09 | Security vulnerability in a dependency module | < 48 hours for assessment, < 1 week for patch | Evaluate exposure, apply patched version or implement workaround |

### 6.3 New Module Development SLAs

| SLA ID | Deliverable | Timeline | Details |
|--------|-------------|----------|---------|
| SUP-10 | New assessment module (full implementation with collectors, checks, and tests) | Per project timeline | Scoped during project planning; typical timeline is 4-8 weeks per module depending on check count and API complexity |
| SUP-11 | New individual check (added to existing module) | < 2 weeks | Includes collector update (if needed), check logic, Pester tests, findings.json entry, and documentation |
| SUP-12 | Report template customization | < 1 week | Modifications to HTML/DOCX report templates for branding or formatting changes |

---

## 7. SLO Monitoring and Reporting

### 7.1 How SLOs Are Measured

| Data Source | SLOs Covered | Collection Method |
|-------------|-------------|-------------------|
| Assessment JSONL logs | PERF-01 through PERF-07, AVAIL-03 through AVAIL-07 | Parse log timestamps for duration; count errors and retries; automated post-assessment analysis script |
| Post-assessment spot checks | QUAL-01 through QUAL-03 | Manual verification by senior consultant; results recorded in engagement notes |
| Output directory validation | QUAL-04 through QUAL-09 | Automated script checks evidence file presence, report file presence, and cross-format consistency |
| Issue tracker | SUP-01 through SUP-12 | Track reported issues with timestamps for response, resolution, and deployment |

### 7.2 Reporting Cadence

| Report | Frequency | Audience | Content |
|--------|-----------|----------|---------|
| Assessment performance summary | Per engagement | Consultant, Lead Developer | Execution duration, error count, retry count, SLO compliance |
| Quality metrics review | Monthly | Lead Developer, Security Consultant Lead | Finding accuracy spot check results, evidence completeness, report quality |
| Tool reliability dashboard | Quarterly | Platform Owner, Engineering Manager | Assessment completion rates, import success rates, resume reliability, dependency health |
| Support SLA compliance | Quarterly | Platform Owner | Bug fix and enhancement response/resolution times vs. SLA targets |

---

## 8. SLO Breach Handling

When an SLO is breached, the following process applies:

| Step | Action | Owner |
|------|--------|-------|
| 1 | Identify the breached SLO and document the specifics (which engagement, what failed, duration of breach) | Consultant / Lead Developer |
| 2 | Determine if the breach is due to an external factor (API throttling, network issue, tenant size) or an internal defect | Lead Developer |
| 3 | If internal defect: create a bug report with SLO reference and follow the appropriate SUP-XX SLA for resolution | Lead Developer |
| 4 | If external factor: document as an SLO exception; update SLO exception thresholds if the condition is recurring | Lead Developer |
| 5 | Track the breach in the quarterly reliability dashboard for trend analysis | Lead Developer |

---

## 9. Definitions

| Term | Definition |
|------|------------|
| **SLO (Service Level Objective)** | An internal target for a measurable aspect of tool performance, quality, or reliability. SLOs are goals, not contractual obligations. |
| **SLA (Service Level Agreement)** | An internal commitment from the development team to the consulting team for response and resolution of issues. SLAs are tracked and reported. |
| **SLO Breach** | An instance where measured performance falls below the defined SLO target. |
| **SLO Exception** | A documented case where an SLO breach is attributable to an external factor outside the tool's control. |
| **Assessment Completion** | The point at which all selected modules have finished executing and all report files have been written to the output directory. |
| **Transient Failure** | A temporary error (HTTP 429, 503, network timeout) that is expected to resolve on retry without human intervention. |

---

## 10. Approval and Sign-Off

| Role | Name | Date | Signature / Approval |
|------|------|------|----------------------|
| Lead Developer | ___________________ | __________ | [ ] Approved |
| Security Consultant Lead | ___________________ | __________ | [ ] Approved |
| Platform Owner | ___________________ | __________ | [ ] Approved |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | Lead Developer | Initial SLA/SLO definitions adapted for local PowerShell assessment tool |
