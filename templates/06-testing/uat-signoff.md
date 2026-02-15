# UAT Sign-Off

| **Page Title**   | UAT Sign-Off                               |
|------------------|--------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                               |
| **Status**       | [Draft / In Review / Approved / Deprecated] |
| **Owner**        | [TEAM OR INDIVIDUAL NAME]                  |

---

## 1. UAT Scope and Objectives

### Release Information

| Field                    | Value                              |
|--------------------------|------------------------------------|
| **Release version**      | [VERSION: e.g., v1.5.0]           |
| **Release name / title** | [RELEASE-NAME]                    |
| **Sprint / iteration**   | [SPRINT-NUMBER]                   |
| **UAT start date**       | [YYYY-MM-DD]                      |
| **UAT end date**         | [YYYY-MM-DD]                      |
| **Sign-off deadline**    | [YYYY-MM-DD]                      |

### Objectives

The purpose of this UAT cycle is to:

1. Validate that the delivered features meet the business requirements and acceptance criteria defined in the user stories.
2. Confirm that existing functionality has not regressed.
3. Obtain formal business stakeholder approval to proceed with production deployment.

### In Scope

| Feature / Change                    | User Story / Ticket       | Description                                       |
|-------------------------------------|---------------------------|---------------------------------------------------|
| [FEATURE-1]                         | [TICKET-ID]               | [BRIEF DESCRIPTION OF THE FEATURE]                |
| [FEATURE-2]                         | [TICKET-ID]               | [BRIEF DESCRIPTION OF THE FEATURE]                |
| [BUG-FIX-1]                        | [TICKET-ID]               | [BRIEF DESCRIPTION OF THE FIX]                    |
| [ADD MORE AS NEEDED]                |                           |                                                   |

### Out of Scope

| Item                                | Reason                                          |
|-------------------------------------|-------------------------------------------------|
| [ITEM-1]                            | [REASON: e.g., Deferred to next release]        |
| [ITEM-2]                            | [REASON: e.g., Not affected by this release]    |
| [ADD MORE AS NEEDED]                |                                                 |

---

## 2. UAT Environment and Access

| Aspect                     | Details                                                    |
|----------------------------|------------------------------------------------------------|
| **Environment**            | Staging ([STAGING-URL])                                    |
| **Version deployed**       | [VERSION / COMMIT-SHA]                                     |
| **Deployment date**        | [YYYY-MM-DD]                                               |
| **Azure Resource Group**   | [STAGING-RG]                                               |
| **Access method**          | [VPN required / Public / IP-restricted]                    |
| **Login credentials**      | [TEST-ACCOUNT-INSTRUCTIONS: e.g., "Use test accounts provided via email"] |
| **Data set**               | [DESCRIPTION: e.g., "Anonymized production data snapshot from YYYY-MM-DD"] |

### Test Accounts

| Account / Role             | Username                    | Access Level              | Notes                     |
|----------------------------|-----------------------------|---------------------------|---------------------------|
| [ROLE-1: e.g., Admin]     | [USERNAME]                  | Full administrative access| [NOTES]                   |
| [ROLE-2: e.g., Standard User] | [USERNAME]              | Standard user permissions | [NOTES]                   |
| [ROLE-3: e.g., Read-Only] | [USERNAME]                  | View-only access          | [NOTES]                   |
| [ADD MORE AS NEEDED]       |                             |                           |                           |

> **Note:** Passwords are distributed securely via [METHOD: e.g., Azure Key Vault, password manager, secure email]. Do not document passwords in this page.

### Support During UAT

| Support Type               | Contact                     | Availability              |
|----------------------------|-----------------------------|---------------------------|
| Technical support          | [NAME / TEAM]               | [HOURS: e.g., 9am-5pm ET]|
| Business / functional questions | [NAME / TEAM]          | [HOURS]                   |
| Environment issues         | [NAME / TEAM]               | [HOURS]                   |
| Defect reporting channel   | [TOOL: e.g., Jira, GitHub Issues, Teams channel] | Async      |

---

## 3. UAT Test Scenarios

| ID       | Scenario                                      | Preconditions                        | Steps                                               | Expected Result                                    | Actual Result | Status         | Tester     | Date       |
|----------|-----------------------------------------------|--------------------------------------|------------------------------------------------------|----------------------------------------------------|---------------|----------------|------------|------------|
| UAT-001  | [SCENARIO: e.g., Create new order]           | [PRECONDITION: e.g., Logged in as standard user] | 1. [STEP] 2. [STEP] 3. [STEP]            | [EXPECTED OUTCOME]                                 | [ACTUAL]      | [Pass/Fail/Blocked/Not Run] | [NAME] | [DATE] |
| UAT-002  | [SCENARIO: e.g., Search with filters]        | [PRECONDITION]                       | 1. [STEP] 2. [STEP]                                 | [EXPECTED OUTCOME]                                 | [ACTUAL]      | [STATUS]       | [NAME]     | [DATE]     |
| UAT-003  | [SCENARIO: e.g., Export report to PDF]       | [PRECONDITION]                       | 1. [STEP] 2. [STEP] 3. [STEP]                       | [EXPECTED OUTCOME]                                 | [ACTUAL]      | [STATUS]       | [NAME]     | [DATE]     |
| UAT-004  | [SCENARIO: e.g., Update user profile]        | [PRECONDITION]                       | 1. [STEP] 2. [STEP]                                 | [EXPECTED OUTCOME]                                 | [ACTUAL]      | [STATUS]       | [NAME]     | [DATE]     |
| UAT-005  | [SCENARIO: e.g., Role-based access control]  | [PRECONDITION]                       | 1. [STEP] 2. [STEP]                                 | [EXPECTED OUTCOME]                                 | [ACTUAL]      | [STATUS]       | [NAME]     | [DATE]     |
| UAT-006  | [SCENARIO: e.g., Email notification trigger] | [PRECONDITION]                       | 1. [STEP] 2. [STEP]                                 | [EXPECTED OUTCOME]                                 | [ACTUAL]      | [STATUS]       | [NAME]     | [DATE]     |
| UAT-007  | [SCENARIO: Regression — existing feature 1]  | [PRECONDITION]                       | 1. [STEP] 2. [STEP]                                 | [EXPECTED OUTCOME]                                 | [ACTUAL]      | [STATUS]       | [NAME]     | [DATE]     |
| UAT-008  | [SCENARIO: Regression — existing feature 2]  | [PRECONDITION]                       | 1. [STEP] 2. [STEP]                                 | [EXPECTED OUTCOME]                                 | [ACTUAL]      | [STATUS]       | [NAME]     | [DATE]     |
| [ADD MORE ROWS AS NEEDED] |                                |                                      |                                                      |                                                    |               |                |            |            |

### Test Scenario Summary

| Total Scenarios | Passed | Failed | Blocked | Not Run |
|-----------------|--------|--------|---------|---------|
| [NUMBER]        | [NUMBER]| [NUMBER]| [NUMBER]| [NUMBER]|

---

## 4. UAT Entry Criteria

All of the following must be true before UAT begins. The QA Lead and Product Owner jointly confirm readiness.

| #  | Criterion                                                         | Met? (Yes/No) | Evidence / Notes              |
|----|-------------------------------------------------------------------|---------------|-------------------------------|
| 1  | All features in scope have passed integration testing              | [YES/NO]      | [LINK TO TEST RESULTS]        |
| 2  | No open Critical or High severity defects                          | [YES/NO]      | [LINK TO DEFECT TRACKER]      |
| 3  | Staging environment is deployed with the release candidate version | [YES/NO]      | [VERSION / DEPLOYMENT-LINK]   |
| 4  | Test data is loaded and verified in the Staging environment        | [YES/NO]      | [CONFIRMATION]                |
| 5  | UAT test scenarios are documented and reviewed by business         | [YES/NO]      | This document                 |
| 6  | Test accounts are provisioned and access confirmed                 | [YES/NO]      | [CONFIRMATION]                |
| 7  | All automated regression tests pass                                | [YES/NO]      | [LINK TO CI RUN]              |
| 8  | Smoke tests pass in Staging environment                            | [YES/NO]      | [LINK TO SMOKE TEST RESULTS]  |
| 9  | UAT testers have been briefed on new features and changes          | [YES/NO]      | [MEETING DATE / RECORDING]    |

**Entry criteria sign-off:**

| Role              | Name       | Confirmed | Date       |
|-------------------|------------|-----------|------------|
| QA Lead           | [NAME]     | [YES/NO]  | [DATE]     |
| Product Owner     | [NAME]     | [YES/NO]  | [DATE]     |

---

## 5. UAT Exit Criteria

All of the following must be true before UAT is considered complete and production deployment can proceed.

| #  | Criterion                                                         | Met? (Yes/No) | Evidence / Notes              |
|----|-------------------------------------------------------------------|---------------|-------------------------------|
| 1  | All UAT test scenarios have been executed (none remain "Not Run")  | [YES/NO]      | See section 3 summary         |
| 2  | All UAT test scenarios pass (or failures have accepted workarounds)| [YES/NO]      | See section 3 results         |
| 3  | No open Critical defects found during UAT                          | [YES/NO]      | See section 6                 |
| 4  | No open High defects found during UAT (or deferred with approval) | [YES/NO]      | See section 6                 |
| 5  | All business stakeholders have signed off                          | [YES/NO]      | See section 7                 |
| 6  | Outstanding issues and known limitations are documented and accepted | [YES/NO]    | See section 8                 |
| 7  | Release notes are reviewed and approved by Product Owner           | [YES/NO]      | [LINK TO RELEASE NOTES]       |

---

## 6. Defects Found During UAT

| ID          | Description                                    | Severity     | Found By   | Found Date | Assigned To | Status                           | Resolution                        |
|-------------|------------------------------------------------|--------------|------------|------------|-------------|----------------------------------|-----------------------------------|
| [UAT-BUG-001] | [DESCRIPTION]                               | [Critical/High/Medium/Low] | [NAME] | [DATE] | [NAME]  | [Open/In Progress/Fixed/Deferred/Won't Fix] | [RESOLUTION DETAILS]      |
| [UAT-BUG-002] | [DESCRIPTION]                               | [SEVERITY]   | [NAME]     | [DATE]     | [NAME]      | [STATUS]                         | [RESOLUTION]                      |
| [UAT-BUG-003] | [DESCRIPTION]                               | [SEVERITY]   | [NAME]     | [DATE]     | [NAME]      | [STATUS]                         | [RESOLUTION]                      |
| [ADD MORE AS NEEDED] |                                        |              |            |            |             |                                  |                                   |

### Defect Summary

| Severity  | Found | Fixed | Deferred | Won't Fix | Open |
|-----------|-------|-------|----------|-----------|------|
| Critical  | [N]   | [N]   | [N]      | [N]       | [N]  |
| High      | [N]   | [N]   | [N]      | [N]       | [N]  |
| Medium    | [N]   | [N]   | [N]      | [N]       | [N]  |
| Low       | [N]   | [N]   | [N]      | [N]       | [N]  |
| **Total** | **[N]** | **[N]** | **[N]** | **[N]** | **[N]** |

---

## 7. UAT Sign-Off

Each business stakeholder must record their decision below. All required stakeholders must approve before production deployment proceeds.

| Business Stakeholder     | Role                        | Decision                    | Comments                                     | Date       |
|--------------------------|-----------------------------|-----------------------------|----------------------------------------------|------------|
| [NAME]                   | [ROLE: e.g., Product Owner] | [Approved / Rejected / Conditional Approval] | [COMMENTS]                      | [DATE]     |
| [NAME]                   | [ROLE: e.g., Business Analyst] | [DECISION]              | [COMMENTS]                                   | [DATE]     |
| [NAME]                   | [ROLE: e.g., Department Head]  | [DECISION]              | [COMMENTS]                                   | [DATE]     |
| [NAME]                   | [ROLE: e.g., Compliance Officer] | [DECISION]            | [COMMENTS]                                   | [DATE]     |
| [ADD MORE AS NEEDED]     |                             |                             |                                              |            |

### Conditional Approvals

If any stakeholder provides a "Conditional Approval," document the conditions here:

| Stakeholder     | Condition                                                    | Accepted By    | Target Date |
|-----------------|--------------------------------------------------------------|----------------|-------------|
| [NAME]          | [CONDITION: e.g., "Fix UAT-BUG-002 before production deploy"] | [NAME]       | [DATE]      |
| [ADD MORE AS NEEDED] |                                                        |                |             |

### Final Decision

| Field                    | Value                              |
|--------------------------|------------------------------------|
| **Overall UAT Result**   | [APPROVED / REJECTED / CONDITIONAL]|
| **Decision Date**        | [YYYY-MM-DD]                       |
| **Decision Maker**       | [NAME AND ROLE]                    |
| **Production Deploy Date** | [YYYY-MM-DD] (planned)           |

---

## 8. Outstanding Issues / Known Limitations Accepted for Go-Live

The following issues are known and have been explicitly accepted by business stakeholders for the production release. They will be addressed in subsequent releases.

| ID               | Description                                               | Severity  | Workaround                                     | Target Fix Release | Accepted By   |
|------------------|-----------------------------------------------------------|-----------|-------------------------------------------------|--------------------|---------------|
| [KNOWN-001]      | [DESCRIPTION OF KNOWN ISSUE]                              | [SEVERITY]| [WORKAROUND DESCRIPTION OR "None"]              | [VERSION / DATE]   | [NAME]        |
| [KNOWN-002]      | [DESCRIPTION OF KNOWN LIMITATION]                         | [SEVERITY]| [WORKAROUND DESCRIPTION OR "None"]              | [VERSION / DATE]   | [NAME]        |
| [KNOWN-003]      | [DESCRIPTION]                                             | [SEVERITY]| [WORKAROUND]                                    | [VERSION / DATE]   | [NAME]        |
| [ADD MORE AS NEEDED] |                                                       |           |                                                 |                    |               |

### Risk Assessment for Known Issues

| Issue ID    | Business Impact                    | Likelihood  | Risk Level          | Monitoring Plan                        |
|-------------|------------------------------------|-------------|---------------------|----------------------------------------|
| [KNOWN-001] | [IMPACT DESCRIPTION]               | [High/Med/Low] | [High/Med/Low]  | [HOW THIS WILL BE MONITORED POST-GO-LIVE] |
| [KNOWN-002] | [IMPACT DESCRIPTION]               | [LIKELIHOOD]| [RISK LEVEL]        | [MONITORING PLAN]                      |
| [ADD MORE]  |                                    |             |                     |                                        |

---

## 9. Appendix

### UAT Participants

| Name               | Role                    | Department           | Email                |
|--------------------|-------------------------|----------------------|----------------------|
| [NAME]             | [ROLE]                  | [DEPARTMENT]         | [EMAIL]              |
| [NAME]             | [ROLE]                  | [DEPARTMENT]         | [EMAIL]              |
| [NAME]             | [ROLE]                  | [DEPARTMENT]         | [EMAIL]              |
| [ADD MORE AS NEEDED]|                        |                      |                      |

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Release Pipeline](../05-cicd-pipeline/release-pipeline.md)
- [Environment Strategy](../05-cicd-pipeline/environment-strategy.md)
