# Incident Response Plan

| **Metadata**     | **Value**                                                       |
|------------------|-----------------------------------------------------------------|
| Page Title       | M365 Security Assessment Automation - Incident Response Plan    |
| Last Updated     | 2026-02-15                                                      |
| Status           | `CURRENT`                                                       |
| Owner            | Lead Developer / Security Operations                            |
| Reviewers        | Security Consultant Lead, Engineering Manager, Compliance Lead  |
| Version          | 1.0                                                             |

---

## 1. Document Purpose

This document defines the incident response plan for the M365-SecurityAssessment tool and the operational processes surrounding it. Because this is a locally executed PowerShell assessment tool (not a hosted service), the incident types and response procedures are adapted to the specific risks associated with client credential management, assessment data handling, finding accuracy, API permission governance, and tool integrity. This plan ensures that IntelliSec Solutions can detect, contain, remediate, and learn from incidents related to the assessment platform.

---

## 2. Incident Severity Classification

All incidents are classified using the following severity matrix. Severity determines response timelines and escalation paths.

| Severity | Label | Definition | Response Initiation | Resolution Target |
|----------|-------|------------|---------------------|-------------------|
| SEV-1 | `CRITICAL` | Active credential compromise or client data exposure; immediate risk to client environments or IntelliSec reputation | Within 30 minutes | Within 4 hours |
| SEV-2 | `HIGH` | Confirmed finding accuracy issue affecting delivered client reports; API permission abuse detected | Within 2 hours | Within 24 hours |
| SEV-3 | `MEDIUM` | Tool integrity concern; suspected code modification; single-engagement data issue contained to IntelliSec systems | Within 8 hours | Within 72 hours |
| SEV-4 | `LOW` | Minor tool malfunction; non-client-impacting issue; process improvement identified | Within 24 hours | Within 1 week |

---

## 3. Incident Types and Response Procedures

### 3.1 Incident Type 1: Credential Compromise

**Description:** An Azure AD App Registration client secret or certificate private key used by the assessment tool is exposed, leaked, or suspected of unauthorized access.

**Severity:** `CRITICAL` (SEV-1)

**Indicators of Compromise:**

- Client secret found in logs, email, chat, or version control
- Certificate .pfx file discovered in an unsecured location
- Unexpected sign-in activity on the App Registration in Azure AD audit logs
- DPAPI credential profile accessed from unauthorized user session
- Consultant workstation compromised or stolen

**Response Procedure:**

| Step | Action | Owner | Timeline |
|------|--------|-------|----------|
| 1 | **Contain:** Immediately rotate the compromised client secret or certificate in the Azure AD App Registration for the affected tenant | Incident Lead | Within 30 minutes |
| 2 | **Revoke:** Revoke all existing access tokens issued to the App Registration by cycling the application credentials | Incident Lead | Within 30 minutes |
| 3 | **Delete:** Remove the DPAPI-encrypted credential profile from the affected workstation (`Remove-AssessmentCredential -ProfileName "affected"`) | Consultant | Within 1 hour |
| 4 | **Audit:** Review Azure AD sign-in logs and audit logs for the App Registration to determine if unauthorized access occurred | Security Lead | Within 2 hours |
| 5 | **Notify:** Inform the affected client's IT security team of the potential exposure, scope of access (read-only), and remediation steps taken | Security Consultant Lead | Within 4 hours |
| 6 | **Re-create:** Generate new credentials (certificate or secret) and create a new credential profile | Consultant | Within 4 hours |
| 7 | **Verify:** Confirm that the old credentials are fully revoked and cannot authenticate | Security Lead | Within 4 hours |

**Mitigating Factors:**
- App Registrations are configured with read-only permissions; no tenant modifications are possible even with compromised credentials
- DPAPI encryption means credential profiles cannot be decrypted on a different machine or by a different user

---

### 3.2 Incident Type 2: Assessment Data Breach

**Description:** Report files, evidence CSVs, or findings JSON containing client security posture information are exposed to unauthorized parties.

**Severity:** `CRITICAL` (SEV-1) if client data is externally exposed; `HIGH` (SEV-2) if contained within IntelliSec systems.

**Indicators:**

- Assessment output files found on shared drives, cloud storage, or email outside secure channels
- Unauthorized access to a consultant workstation containing assessment data
- Client-specific assessment data visible to consultants not assigned to that engagement

**Response Procedure:**

| Step | Action | Owner | Timeline |
|------|--------|-------|----------|
| 1 | **Contain:** Identify all locations where the exposed data exists and restrict access immediately | Incident Lead | Within 1 hour |
| 2 | **Delete:** Remove or securely delete exposed assessment files from all unauthorized locations | Incident Lead | Within 2 hours |
| 3 | **Assess Scope:** Determine which client engagements are affected and what specific data was exposed (findings, evidence, raw configurations) | Security Lead | Within 4 hours |
| 4 | **Notify Client:** Inform the affected client(s) of the exposure, what data was involved, and remediation actions taken | Security Consultant Lead | Within 8 hours (SEV-1) or 24 hours (SEV-2) |
| 5 | **Review Access Controls:** Audit workstation access controls, file sharing practices, and data handling procedures | Security Lead | Within 24 hours |
| 6 | **Implement Controls:** Apply corrective measures (e.g., enforce disk encryption, restrict output directory permissions, implement data retention policies) | Lead Developer | Within 72 hours |

**Data Sensitivity Classification:**

| Data Type | Sensitivity | Exposure Risk |
|-----------|-------------|---------------|
| Assessment reports (HTML/PDF/DOCX) | `HIGH` | Contains security gap analysis with specific misconfigurations identified |
| Evidence CSVs | `HIGH` | Contains raw M365 configuration data (policy details, user lists, role assignments) |
| Findings JSON | `HIGH` | Machine-readable security findings with severity ratings and affected resources |
| Assessment logs (JSONL) | `MEDIUM` | Contains operational data; may include tenant identifiers but not configuration details |
| Checkpoint files | `LOW` | Contains assessment progress metadata; no client configuration data |

---

### 3.3 Incident Type 3: False Findings

**Description:** The assessment tool reports incorrect security posture information -- either false negatives (reports compliant when actually non-compliant) or false positives (reports non-compliant when actually compliant) -- in findings delivered to clients.

**Severity:** `HIGH` (SEV-2) for false negatives on Critical/High controls; `MEDIUM` (SEV-3) for false positives or false negatives on Medium/Low controls.

**Indicators:**

- Client or consultant identifies a finding that contradicts manual verification
- Post-engagement spot check reveals discrepancy between automated and manual results
- Multiple clients report the same incorrect finding
- Code review identifies a logic error in a check function

**Response Procedure:**

| Step | Action | Owner | Timeline |
|------|--------|-------|----------|
| 1 | **Identify Scope:** Determine which check function(s) are affected and which engagements used the faulty logic | Lead Developer | Within 2 hours |
| 2 | **Root Cause:** Analyze the check function code, input data, and evaluation logic to identify the source of the incorrect finding | Lead Developer | Within 4 hours |
| 3 | **Fix:** Correct the finding logic in the check function; add Pester unit tests covering the identified edge case | Lead Developer | Within 24 hours |
| 4 | **Re-run:** Re-run the affected checks against all impacted engagements to generate corrected findings | Consultant | Within 48 hours |
| 5 | **Notify Clients:** Contact affected clients with corrected findings and an explanation of the error | Security Consultant Lead | Within 72 hours |
| 6 | **Update Reports:** Regenerate and re-deliver corrected assessment reports to affected clients | Consultant | Within 72 hours |
| 7 | **Process Improvement:** Update the spot-check procedure to cover the identified gap; consider expanding automated test coverage | Lead Developer | Within 1 week |

**Impact Assessment Matrix:**

| Finding Error Type | Control Severity | Impact | Response Priority |
|--------------------|-----------------|--------|-------------------|
| False negative | Critical / High | Client has undetected critical security gaps | `CRITICAL` -- immediate correction |
| False negative | Medium / Low | Client has undetected lower-severity gaps | `HIGH` -- correct within 48 hours |
| False positive | Critical / High | Client may waste resources fixing non-issues | `HIGH` -- correct within 48 hours |
| False positive | Medium / Low | Minor noise in assessment results | `MEDIUM` -- correct in next release |

---

### 3.4 Incident Type 4: API Permission Abuse

**Description:** An Azure AD App Registration created for assessment purposes is exploited with over-privileged permissions, or a threat actor leverages the assessment app's permissions for unauthorized access to client tenant data.

**Severity:** `CRITICAL` (SEV-1) if active exploitation confirmed; `HIGH` (SEV-2) if over-privileged permissions discovered without exploitation evidence.

**Indicators:**

- App Registration has write or admin permissions beyond what the tool requires (read-only)
- Azure AD audit logs show API calls not consistent with assessment activity (write operations, unusual endpoints)
- Client reports suspicious activity traced to the assessment App Registration
- App Registration consent granted for permissions not in the documented requirements

**Response Procedure:**

| Step | Action | Owner | Timeline |
|------|--------|-------|----------|
| 1 | **Contain:** Immediately disable the App Registration in the affected tenant (Azure Portal > App Registrations > Properties > Enabled = No) | Incident Lead | Within 30 minutes |
| 2 | **Revoke:** Revoke all tokens and rotate all credentials associated with the App Registration | Incident Lead | Within 30 minutes |
| 3 | **Audit:** Pull the full Azure AD audit log and sign-in log for the App Registration for the past 90 days | Security Lead | Within 2 hours |
| 4 | **Analyze:** Determine what data was accessed, what operations were performed, and whether any modifications were made to the client tenant | Security Lead | Within 4 hours |
| 5 | **Notify Client:** Provide the client with a full incident report including timeline, scope, and remediation | Security Consultant Lead | Within 8 hours |
| 6 | **Re-create:** Create a new App Registration with exact least-privilege permissions as documented in the module's permission requirements | Lead Developer | Within 24 hours |
| 7 | **Policy Update:** Update the pre-engagement checklist to include a permission audit step; implement automated permission verification in `Connect-AssessmentTenant` | Lead Developer | Within 1 week |

**Required vs. Excessive Permissions Reference:**

| Permission | Required | Excessive If |
|------------|----------|-------------|
| `Directory.Read.All` | Yes | `Directory.ReadWrite.All` granted instead |
| `Policy.Read.All` | Yes | `Policy.ReadWrite.ConditionalAccess` granted |
| `DeviceManagementConfiguration.Read.All` | Yes | `DeviceManagementConfiguration.ReadWrite.All` granted |
| `Mail.Read` | Yes | `Mail.ReadWrite` or `Mail.Send` granted |
| `Sites.Read.All` | Yes | `Sites.FullControl.All` granted |
| Any `*.ReadWrite.*` | No | Write permissions are never required for assessment |

---

### 3.5 Incident Type 5: Tool Integrity Compromise

**Description:** The M365-SecurityAssessment module code has been modified (maliciously or accidentally) in a way that produces incorrect assessment results, exfiltrates data, or otherwise deviates from expected behavior.

**Severity:** `HIGH` (SEV-2) if code modification confirmed; `MEDIUM` (SEV-3) if integrity concern is unverified.

**Indicators:**

- Git diff reveals unexpected changes to check functions, collectors, or engine code
- Module hash does not match the known-good release hash
- Assessment results differ significantly between two runs against the same tenant with no configuration changes
- Unexpected network activity (connections to endpoints other than Microsoft Graph, Exchange Online, Teams)
- Modified `findings.json` or `logic-definitions.json` with altered severity or evaluation criteria

**Response Procedure:**

| Step | Action | Owner | Timeline |
|------|--------|-------|----------|
| 1 | **Verify:** Run `git status` and `git diff` against the known-good release tag to identify all code changes | Lead Developer | Within 1 hour |
| 2 | **Contain:** If unauthorized modifications are confirmed, quarantine the affected workstation's copy of the module | Incident Lead | Within 2 hours |
| 3 | **Assess Impact:** Determine which assessments were run with the modified code and what the modifications affected | Lead Developer | Within 4 hours |
| 4 | **Restore:** Deploy the known-good version of the module from the verified Git repository to the affected workstation | Lead Developer | Within 4 hours |
| 5 | **Re-run:** Re-run affected assessments using the verified module to produce corrected results | Consultant | Within 72 hours |
| 6 | **Notify:** If client-delivered reports were generated with compromised code, notify affected clients with corrected reports | Security Consultant Lead | Within 72 hours |
| 7 | **Harden:** Implement module integrity verification (file hash comparison on import) and restrict write access to the module directory | Lead Developer | Within 1 week |

---

## 4. Communication Templates

### 4.1 Internal Escalation Notification

```
SUBJECT: [SEV-{severity}] M365 Assessment Incident - {incident_type}

INCIDENT SUMMARY
- Type: {incident_type}
- Severity: SEV-{severity}
- Detected: {detection_timestamp}
- Detected By: {detector_name}
- Affected Engagement(s): {engagement_list}
- Affected Client(s): {client_list}

CURRENT STATUS
{brief_description_of_what_happened}

IMMEDIATE ACTIONS TAKEN
{list_of_containment_actions}

NEXT STEPS
{planned_remediation_actions}

INCIDENT LEAD: {incident_lead_name}
```

### 4.2 Client Notification Template

```
SUBJECT: Security Notice - M365 Assessment Engagement [{engagement_name}]

Dear {client_contact_name},

We are writing to inform you of a {incident_type_description} that may affect
the M365 security assessment engagement [{engagement_name}] conducted on
{assessment_date}.

WHAT HAPPENED
{plain_language_description}

WHAT DATA WAS INVOLVED
{description_of_affected_data}

WHAT WE HAVE DONE
{list_of_remediation_actions_taken}

WHAT YOU SHOULD DO
{recommended_client_actions}

We take the security of your data seriously and are committed to full
transparency. If you have questions or need additional information, please
contact {contact_name} at {contact_email}.

Sincerely,
{signatory_name}
IntelliSec Solutions
```

---

## 5. Post-Incident Review Process

Every SEV-1 and SEV-2 incident requires a formal post-incident review. SEV-3 incidents require a review at the discretion of the Incident Lead.

### 5.1 Review Timeline

| Activity | Timeline |
|----------|----------|
| Post-incident review meeting | Within 5 business days of incident resolution |
| Post-incident report drafted | Within 3 business days of review meeting |
| Corrective actions assigned | During the review meeting |
| Corrective actions completed | Per assigned deadlines (tracked in project backlog) |

### 5.2 Post-Incident Report Template

| Section | Content |
|---------|---------|
| Incident Summary | Type, severity, timeline, affected clients/engagements |
| Detection | How was the incident detected? By whom? How long between occurrence and detection? |
| Timeline | Minute-by-minute (SEV-1) or hour-by-hour (SEV-2) chronology of events and actions |
| Root Cause | What was the underlying cause? (5-Whys analysis) |
| Impact | What clients, engagements, and data were affected? What was the business impact? |
| Response Effectiveness | What went well? What could have been faster or better? |
| Corrective Actions | Specific, measurable actions to prevent recurrence, with owners and deadlines |
| Lessons Learned | Key takeaways for the team |

---

## 6. Incident Response Team

| Role | Responsibility | Primary | Backup |
|------|---------------|---------|--------|
| Incident Lead | Overall incident coordination, timeline management, communication | Lead Developer | Security Consultant Lead |
| Technical Lead | Root cause analysis, containment actions, technical remediation | Lead Developer | Senior Consultant |
| Client Communication | Client notification, relationship management, status updates | Security Consultant Lead | Platform Owner |
| Compliance Lead | Regulatory impact assessment, documentation, audit trail | Platform Owner | Security Consultant Lead |

---

## 7. Incident Log

All incidents are tracked in the following log. This table serves as the master incident register.

| Incident # | Date | Type | Severity | Description | Status | Resolution |
|-------------|------|------|----------|-------------|--------|------------|
| _No incidents recorded_ | | | | | | |

---

## 8. Annual Review

This incident response plan is reviewed annually or after any SEV-1 incident, whichever comes first. The review includes:

- Validation that all incident types remain relevant
- Update of contact information and role assignments
- Tabletop exercise for at least one SEV-1 scenario
- Review of all incidents from the prior year for pattern analysis

| Last Review Date | Next Review Date | Reviewed By |
|------------------|------------------|-------------|
| 2026-02-15 | 2027-02-15 | Lead Developer, Security Consultant Lead |

---

## 9. Approval and Sign-Off

| Role | Name | Date | Signature / Approval |
|------|------|------|----------------------|
| Lead Developer | ___________________ | __________ | [ ] Approved |
| Security Consultant Lead | ___________________ | __________ | [ ] Approved |
| Platform Owner | ___________________ | __________ | [ ] Approved |
| Compliance Lead | ___________________ | __________ | [ ] Approved |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | Lead Developer | Initial incident response plan adapted for local PowerShell assessment tool |
