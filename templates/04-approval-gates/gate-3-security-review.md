# Gate 3 - Security Review

| **Page Title**   | Gate 3 - Security Review - [PROJECT_NAME]     |
|------------------|------------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                                   |
| **Status**       | NOT STARTED / IN PROGRESS / COMPLETE           |
| **Owner**        | [SECURITY_LEAD_NAME]                           |
| **Gate Date**    | [YYYY-MM-DD]                                   |

---

## 1. Gate Purpose

Gate 3 validates that the project's security posture is acceptable before deployment to production. This gate ensures all identified security risks are mitigated, accepted, or have a documented remediation plan with target dates. No production deployment proceeds without security team sign-off.

### Timing in Project Lifecycle

```
[Gate 2: ARB] --> [Development & Testing] --> ** GATE 3: Security Review ** --> [Gate 4: CAB] --> [Gate 5: Go/No-Go] --> [Production]
```

---

## 2. Entry Criteria

All entry criteria must be satisfied before the Security Review gate can be scheduled.

| # | Entry Criterion | Status (COMPLETE / NOT COMPLETE) | Evidence / Link | Owner |
|---|----------------|----------------------------------|-----------------|-------|
| 2.1 | Gate 2 (Architecture Review Board) has been passed | | [LINK_TO_GATE_2] | [NAME] |
| 2.2 | Threat model is complete and reviewed | | [LINK_TO_THREAT_MODEL] | [NAME] |
| 2.3 | Security review checklist is complete (all items evaluated) | | [LINK_TO_CHECKLIST] | [NAME] |
| 2.4 | SAST scan has been executed and results are available | | [LINK_TO_SAST_RESULTS] | [NAME] |
| 2.5 | DAST scan has been executed against staging environment | | [LINK_TO_DAST_RESULTS] | [NAME] |
| 2.6 | Dependency vulnerability scan results are available (Dependabot, npm audit, NuGet audit) | | [LINK_TO_DEPENDENCY_SCAN] | [NAME] |
| 2.7 | Penetration test is scheduled or complete (if required by policy) | | [LINK_TO_PENTEST_REPORT] | [NAME] |
| 2.8 | Data classification document is complete | | [LINK_TO_DATA_CLASSIFICATION] | [NAME] |
| 2.9 | Infrastructure security configuration is deployed to staging and verified | | [LINK] | [NAME] |
| 2.10 | Conditions from Gate 2 (if any) are resolved | | [LINK] | [NAME] |

**Entry Criteria Met:** YES / NO

**If NO, reason and expected resolution date:** [DETAILS]

---

## 3. Security Assessment Summary

### 3.1 Assessment Overview

| Assessment Type | Tool / Method | Date Performed | Performed By | Report Link |
|----------------|---------------|----------------|-------------|-------------|
| SAST (Static Analysis) | [CODEQL / SONARQUBE / CHECKMARX] | [YYYY-MM-DD] | [NAME / AUTOMATED] | [LINK] |
| DAST (Dynamic Analysis) | [OWASP_ZAP / BURP_SUITE / OTHER] | [YYYY-MM-DD] | [NAME / AUTOMATED] | [LINK] |
| Dependency Scan | [DEPENDABOT / SNYK / OTHER] | [YYYY-MM-DD] | [NAME / AUTOMATED] | [LINK] |
| Container Image Scan | [TRIVY / DEFENDER_FOR_CONTAINERS / N/A] | [YYYY-MM-DD] | [NAME / AUTOMATED] | [LINK] |
| Penetration Test | [INTERNAL / EXTERNAL_FIRM_NAME] | [YYYY-MM-DD] | [NAME] | [LINK] |
| Infrastructure Review | Manual / Azure Policy / Defender for Cloud | [YYYY-MM-DD] | [NAME] | [LINK] |
| Threat Model Review | STRIDE methodology | [YYYY-MM-DD] | [NAME] | [LINK] |

### 3.2 Findings Summary by Severity

| Severity | Total Found | Mitigated | Accepted | Open | Target Resolution |
|----------|-------------|-----------|----------|------|-------------------|
| **Critical** | [COUNT] | [COUNT] | [COUNT] | [COUNT] | Must be zero before production |
| **High** | [COUNT] | [COUNT] | [COUNT] | [COUNT] | Must be zero before production |
| **Medium** | [COUNT] | [COUNT] | [COUNT] | [COUNT] | [YYYY-MM-DD] |
| **Low** | [COUNT] | [COUNT] | [COUNT] | [COUNT] | [YYYY-MM-DD] |
| **Informational** | [COUNT] | -- | -- | -- | Best effort |

---

## 4. Security Findings Detail

| Finding ID | Source | Severity (Critical / High / Medium / Low) | Finding Description | Component Affected | Status (Open / Mitigated / Accepted) | Remediation / Justification | Owner | Target Date |
|-----------|--------|-------------------------------------------|--------------------|--------------------|--------------------------------------|----------------------------|-------|-------------|
| SF-001 | SAST | [SEVERITY] | [DESCRIPTION] | [COMPONENT] | [STATUS] | [REMEDIATION_OR_JUSTIFICATION] | [NAME] | [YYYY-MM-DD] |
| SF-002 | DAST | [SEVERITY] | [DESCRIPTION] | [COMPONENT] | [STATUS] | [REMEDIATION_OR_JUSTIFICATION] | [NAME] | [YYYY-MM-DD] |
| SF-003 | Dependency Scan | [SEVERITY] | [DESCRIPTION] | [COMPONENT] | [STATUS] | [REMEDIATION_OR_JUSTIFICATION] | [NAME] | [YYYY-MM-DD] |
| SF-004 | Penetration Test | [SEVERITY] | [DESCRIPTION] | [COMPONENT] | [STATUS] | [REMEDIATION_OR_JUSTIFICATION] | [NAME] | [YYYY-MM-DD] |
| SF-005 | Threat Model | [SEVERITY] | [DESCRIPTION] | [COMPONENT] | [STATUS] | [REMEDIATION_OR_JUSTIFICATION] | [NAME] | [YYYY-MM-DD] |
| SF-006 | Infrastructure Review | [SEVERITY] | [DESCRIPTION] | [COMPONENT] | [STATUS] | [REMEDIATION_OR_JUSTIFICATION] | [NAME] | [YYYY-MM-DD] |
| [SF-NNN] | [SOURCE] | [SEVERITY] | [DESCRIPTION] | [COMPONENT] | [STATUS] | [REMEDIATION_OR_JUSTIFICATION] | [NAME] | [YYYY-MM-DD] |

---

## 5. Risk Acceptance for Open Findings

> Any finding that is not fully mitigated before production deployment must be formally accepted. Critical and High findings require CISO or Security Director approval.

| Finding ID | Severity | Finding Summary | Business Justification for Acceptance | Compensating Controls | Accepted By | Role | Date | Expiry / Re-review Date |
|-----------|----------|-----------------|--------------------------------------|-----------------------|-------------|------|------|------------------------|
| [SF-NNN] | [SEVERITY] | [SUMMARY] | [JUSTIFICATION] | [COMPENSATING_CONTROLS] | [NAME] | [ROLE] | [YYYY-MM-DD] | [YYYY-MM-DD] |

### Risk Acceptance Policy

| Finding Severity | Approval Authority Required |
|-----------------|----------------------------|
| Critical | **Not permitted** - must be mitigated before production |
| High | CISO or Security Director |
| Medium | Security Lead |
| Low | Project Security Lead or Tech Lead |

---

## 6. Exit Criteria

| # | Exit Criterion | Status (COMPLETE / NOT COMPLETE) | Evidence / Link | Owner |
|---|---------------|----------------------------------|-----------------|-------|
| 6.1 | Zero open Critical severity findings | | [LINK] | [NAME] |
| 6.2 | Zero open High severity findings (or formally accepted by CISO) | | [LINK] | [NAME] |
| 6.3 | All Medium findings have a remediation plan with target dates | | [LINK] | [NAME] |
| 6.4 | Threat model is reviewed and approved by security team | | [LINK] | [NAME] |
| 6.5 | Security review checklist shows overall PASS | | [LINK] | [NAME] |
| 6.6 | Data classification is complete and handling procedures are implemented | | [LINK] | [NAME] |
| 6.7 | Penetration test findings (if applicable) are addressed | | [LINK] | [NAME] |
| 6.8 | Risk acceptances are formally documented and signed | | [LINK] | [NAME] |
| 6.9 | Security monitoring and alerting are configured for production | | [LINK] | [NAME] |
| 6.10 | Incident response procedures are documented for this application | | [LINK] | [NAME] |

---

## 7. Gate Decision

| Decision | Description |
|----------|-------------|
| **APPROVED** | Security posture is acceptable. Project may proceed to production deployment gates. |
| **APPROVED WITH CONDITIONS** | Security posture is acceptable with documented conditions that must be resolved by specified dates. |
| **REJECTED** | Unacceptable security risk. Project must remediate findings and re-submit for review. |

### Decision Outcome

| Field | Value |
|-------|-------|
| **Decision** | APPROVED / APPROVED WITH CONDITIONS / REJECTED |
| **Decision Date** | [YYYY-MM-DD] |
| **Decision Rationale** | [BRIEF_RATIONALE] |
| **Next Gate Target** | Gate 4 - Change Advisory Board: [YYYY-MM-DD] |

---

## 8. Security Team Sign-Off

| Name | Role | Decision (Approve / Approve with Conditions / Reject) | Date |
|------|------|-------------------------------------------------------|------|
| [CISO_NAME] | CISO / Security Director | | [YYYY-MM-DD] |
| [SECURITY_LEAD] | Security Lead | | [YYYY-MM-DD] |
| [SECURITY_ENGINEER_1] | Security Engineer | | [YYYY-MM-DD] |
| [SECURITY_ENGINEER_2] | Security Engineer | | [YYYY-MM-DD] |
| [COMPLIANCE_OFFICER] | Compliance Officer (if applicable) | | [YYYY-MM-DD] |

---

## 9. References

| Document | Link |
|----------|------|
| Threat Model | [LINK_TO_THREAT_MODEL] |
| Security Review Checklist | [LINK_TO_CHECKLIST] |
| Data Classification | [LINK_TO_DATA_CLASSIFICATION] |
| SAST Report | [LINK_TO_SAST] |
| DAST Report | [LINK_TO_DAST] |
| Penetration Test Report | [LINK_TO_PENTEST] |
| Gate 2 - ARB Decision | [LINK_TO_GATE_2] |
