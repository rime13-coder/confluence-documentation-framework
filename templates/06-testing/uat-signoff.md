# UAT Sign-Off

| **Page Title**   | UAT Sign-Off                               |
|------------------|--------------------------------------------|
| **Last Updated** | 2026-02-14                                 |
| **Status**       | Draft                                      |
| **Owner**        | IntelliSecOps Product Team                 |

---

## 1. Current State

A formal UAT process has **not yet been established** for the CMMC Assessor Platform. There is no staging environment for UAT, and no formal sign-off process is in place for production releases.

This document defines the UAT template and process to be followed once the staging environment is provisioned and the team is ready to implement a formal release approval workflow.

---

## 2. UAT Scope and Objectives

### Release Information (Template)

| Field                    | Value                              |
|--------------------------|------------------------------------|
| **Release version**      | TBD (to be filled per release)     |
| **Release name / title** | TBD                                |
| **Sprint / iteration**   | TBD                                |
| **UAT start date**       | TBD                                |
| **UAT end date**         | TBD                                |
| **Sign-off deadline**    | TBD                                |

### Objectives

The purpose of each UAT cycle is to:

1. Validate that the delivered CMMC assessment features meet the business requirements and acceptance criteria.
2. Confirm that existing functionality (assessment creation, control mapping, scoring, reporting) has not regressed.
3. Obtain formal business stakeholder approval to proceed with production deployment.

### In Scope (Typical CMMC Platform UAT Scenarios)

| Feature / Change                    | Description                                                   |
|-------------------------------------|---------------------------------------------------------------|
| CMMC Assessment Creation            | Create and configure new assessments at various CMMC levels   |
| Control Status Management           | Update implementation status of CMMC controls                 |
| Assessment Scoring                  | Verify scoring calculations are accurate                      |
| Report Generation                   | Generate and export assessment reports                        |
| User Authentication                 | Login via Microsoft Entra ID                                  |
| Role-Based Access Control           | Verify access restrictions by user role                       |
| Assessment Dashboard                | Verify dashboard displays correct summary data                |

### Out of Scope

| Item                                | Reason                                          |
|-------------------------------------|-------------------------------------------------|
| Infrastructure/DevOps changes       | Covered by IaC review, not business UAT         |
| Performance under load              | Covered by performance testing (planned)        |
| Security vulnerabilities            | Covered by security testing                     |

---

## 3. UAT Environment and Access (Planned)

| Aspect                     | Details                                                    |
|----------------------------|------------------------------------------------------------|
| **Environment**            | Staging (not yet provisioned)                              |
| **Planned URL**            | `https://staging.cmmc.intellisecops.com` (planned)         |
| **Version deployed**       | TBD (per release)                                          |
| **Access method**          | Web browser (public or VPN -- to be determined)            |
| **Login credentials**      | Microsoft Entra ID test accounts (to be provisioned)       |
| **Data set**               | Synthetic CMMC assessment data (to be created)             |

### Test Accounts (Planned)

| Account / Role             | Username                    | Access Level              | Notes                     |
|----------------------------|-----------------------------|---------------------------|---------------------------|
| CMMC Assessor (Admin)      | TBD                         | Full administrative access| Can manage all assessments|
| CMMC Assessor (Standard)   | TBD                         | Assessment creation + edit| Standard assessor role    |
| Read-Only Reviewer         | TBD                         | View-only access          | Can view but not edit     |

> **Note:** Passwords will be distributed securely via Azure Key Vault or secure communication channel. Do not document passwords in this page.

### Support During UAT (Planned)

| Support Type               | Contact                     | Availability              |
|----------------------------|-----------------------------|---------------------------|
| Technical support          | IntelliSecOps Dev Team      | Business hours            |
| Business / functional questions | Product Owner          | Business hours            |
| Environment issues         | IntelliSecOps DevOps        | Business hours            |
| Defect reporting channel   | GitHub Issues               | Async                     |

---

## 4. UAT Test Scenarios (Template)

The following scenarios should be executed during each UAT cycle. Add release-specific scenarios as needed.

| ID       | Scenario                                      | Preconditions                        | Steps                                               | Expected Result                                    | Actual Result | Status         | Tester     | Date       |
|----------|-----------------------------------------------|--------------------------------------|------------------------------------------------------|----------------------------------------------------|---------------|----------------|------------|------------|
| UAT-001  | Create new CMMC Level 2 assessment            | Logged in as Assessor (Admin)        | 1. Navigate to Assessments 2. Click "New Assessment" 3. Select Level 2 4. Enter details 5. Save | Assessment created and appears in list             |               | Not Run        |            |            |
| UAT-002  | Update control implementation status          | Assessment exists in IN_PROGRESS state | 1. Open assessment 2. Navigate to controls 3. Set control status to "Implemented" 4. Save | Control status updated; score recalculated         |               | Not Run        |            |            |
| UAT-003  | Generate assessment report                    | Assessment has controls with statuses | 1. Open assessment 2. Click "Generate Report" 3. Review report content | Report generated with correct scores and control data |            | Not Run        |            |            |
| UAT-004  | Login via Microsoft Entra ID                  | Valid Entra ID test account           | 1. Navigate to login page 2. Click "Sign in with Microsoft" 3. Enter credentials | Successfully authenticated and redirected to dashboard |            | Not Run        |            |            |
| UAT-005  | Verify RBAC (Read-Only user cannot edit)      | Logged in as Read-Only Reviewer       | 1. Navigate to assessment 2. Attempt to edit control status | Edit controls are disabled; changes blocked        |               | Not Run        |            |            |
| UAT-006  | Dashboard displays correct assessment summary | Multiple assessments exist            | 1. Navigate to dashboard 2. Verify assessment count 3. Verify overall score display | Dashboard shows correct count and scores           |               | Not Run        |            |            |
| UAT-007  | Regression -- existing assessment data intact | Pre-existing assessment data in staging | 1. Navigate to existing assessment 2. Verify all data is intact | All previously entered data is present and correct |               | Not Run        |            |            |
| UAT-008  | Regression -- navigation and page loading     | Logged in as any role                 | 1. Navigate through all main pages 2. Verify no broken links or errors | All pages load correctly; no console errors        |               | Not Run        |            |            |

### Test Scenario Summary (Template)

| Total Scenarios | Passed | Failed | Blocked | Not Run |
|-----------------|--------|--------|---------|---------|
| 8               | 0      | 0      | 0       | 8       |

---

## 5. UAT Entry Criteria

All of the following must be true before UAT begins. The Development Lead and Product Owner jointly confirm readiness.

| #  | Criterion                                                         | Met? (Yes/No) | Evidence / Notes              |
|----|-------------------------------------------------------------------|---------------|-------------------------------|
| 1  | All features in scope have passed CI (type check, lint, security scan) | TBD       | Link to CI run                |
| 2  | No open Critical or High severity defects                          | TBD           | GitHub Issues query           |
| 3  | Staging environment is deployed with the release candidate version | TBD           | Staging URL accessible        |
| 4  | Test data is loaded and verified in the Staging environment        | TBD           | Seed script executed          |
| 5  | UAT test scenarios are documented and reviewed by business         | TBD           | This document                 |
| 6  | Test accounts are provisioned and access confirmed                 | TBD           | Entra ID accounts created     |
| 7  | All automated checks pass (tsc, lint, CodeQL, npm audit)           | TBD           | Link to CI run                |
| 8  | UAT testers have been briefed on new features and changes          | TBD           | Meeting date / recording      |

**Entry criteria sign-off:**

| Role              | Name       | Confirmed | Date       |
|-------------------|------------|-----------|------------|
| Development Lead  | TBD        | TBD       | TBD        |
| Product Owner     | TBD        | TBD       | TBD        |

---

## 6. UAT Exit Criteria

All of the following must be true before UAT is considered complete and production deployment can proceed.

| #  | Criterion                                                         | Met? (Yes/No) | Evidence / Notes              |
|----|-------------------------------------------------------------------|---------------|-------------------------------|
| 1  | All UAT test scenarios have been executed (none remain "Not Run")  | TBD           | See section 4 summary         |
| 2  | All UAT test scenarios pass (or failures have accepted workarounds)| TBD           | See section 4 results         |
| 3  | No open Critical defects found during UAT                          | TBD           | See section 7                 |
| 4  | No open High defects found during UAT (or deferred with approval) | TBD           | See section 7                 |
| 5  | All business stakeholders have signed off                          | TBD           | See section 8                 |
| 6  | Outstanding issues and known limitations are documented and accepted | TBD          | See section 9                 |
| 7  | Release notes are reviewed and approved by Product Owner           | TBD           | Link to release notes         |

---

## 7. Defects Found During UAT (Template)

| ID          | Description                                    | Severity     | Found By   | Found Date | Assigned To | Status                           | Resolution                        |
|-------------|------------------------------------------------|--------------|------------|------------|-------------|----------------------------------|-----------------------------------|
|             | (No UAT has been conducted yet)                |              |            |            |             |                                  |                                   |

### Defect Summary (Template)

| Severity  | Found | Fixed | Deferred | Won't Fix | Open |
|-----------|-------|-------|----------|-----------|------|
| Critical  | 0     | 0     | 0        | 0         | 0    |
| High      | 0     | 0     | 0        | 0         | 0    |
| Medium    | 0     | 0     | 0        | 0         | 0    |
| Low       | 0     | 0     | 0        | 0         | 0    |
| **Total** | **0** | **0** | **0**    | **0**     | **0**|

---

## 8. UAT Sign-Off (Template)

Each business stakeholder must record their decision below. All required stakeholders must approve before production deployment proceeds.

| Business Stakeholder     | Role                        | Decision                    | Comments                                     | Date       |
|--------------------------|-----------------------------|-----------------------------|----------------------------------------------|------------|
| TBD                      | Product Owner               | Pending                     | UAT not yet conducted                        | TBD        |
| TBD                      | Business Analyst            | Pending                     | UAT not yet conducted                        | TBD        |
| TBD                      | Compliance Officer          | Pending                     | UAT not yet conducted (CMMC compliance review) | TBD      |

### Conditional Approvals

If any stakeholder provides a "Conditional Approval," document the conditions here:

| Stakeholder     | Condition                                                    | Accepted By    | Target Date |
|-----------------|--------------------------------------------------------------|----------------|-------------|
|                 | (No conditional approvals -- UAT not yet conducted)          |                |             |

### Final Decision (Template)

| Field                    | Value                              |
|--------------------------|------------------------------------|
| **Overall UAT Result**   | Pending (UAT not yet conducted)    |
| **Decision Date**        | TBD                                |
| **Decision Maker**       | TBD (Product Owner)                |
| **Production Deploy Date** | TBD (planned)                    |

---

## 9. Outstanding Issues / Known Limitations Accepted for Go-Live

The following issues are known from the security review and current state of the platform:

| ID               | Description                                               | Severity  | Workaround                                     | Target Fix Release | Accepted By   |
|------------------|-----------------------------------------------------------|-----------|-------------------------------------------------|--------------------|---------------|
| KNOWN-001        | No staging environment for pre-production validation      | High      | Testing conducted directly in production with caution | TBD (staging provisioning) | TBD    |
| KNOWN-002        | No automated test suites (unit, integration, E2E)         | High      | Manual testing + CI type checking and linting   | TBD                | TBD           |
| KNOWN-003        | 47 security findings from 2026-02-11 review under remediation | Medium | Being actively remediated; tracked in GitHub Issues | Ongoing       | TBD           |
| KNOWN-004        | No automated smoke tests post-deployment                  | Medium    | Manual verification after each deployment       | TBD                | TBD           |

### Risk Assessment for Known Issues

| Issue ID    | Business Impact                            | Likelihood  | Risk Level  | Monitoring Plan                        |
|-------------|--------------------------------------------|-------------|-------------|----------------------------------------|
| KNOWN-001   | Potential for untested changes reaching production | High   | High        | Prioritize staging environment setup   |
| KNOWN-002   | Regressions may not be caught before deployment | Medium   | High        | Prioritize unit test implementation    |
| KNOWN-003   | Security vulnerabilities may be exploitable | Medium      | Medium      | Track remediation progress weekly      |
| KNOWN-004   | Failed deployments may not be detected quickly | Medium   | Medium      | Manual health check after each deploy  |

---

## 10. Appendix

### UAT Participants (Planned)

| Name               | Role                    | Department           | Email                |
|--------------------|-------------------------|----------------------|----------------------|
| TBD                | Product Owner           | Product              | TBD                  |
| TBD                | CMMC Subject Matter Expert | Compliance         | TBD                  |
| TBD                | Business Analyst        | Product              | TBD                  |
| TBD                | Development Lead        | Engineering          | TBD                  |

### Prerequisites for First UAT Cycle

Before the first UAT cycle can be conducted, the following must be completed:

1. **Staging environment provisioned** -- Azure Container Apps environment mirroring production.
2. **Test accounts created** -- Microsoft Entra ID test accounts with appropriate roles.
3. **Synthetic test data loaded** -- Representative CMMC assessment data seeded in staging database.
4. **UAT testers briefed** -- Walkthrough of application features and UAT process.
5. **Defect tracking process established** -- GitHub Issues labels and workflow configured.

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Release Pipeline](../05-cicd-pipeline/release-pipeline.md)
- [Environment Strategy](../05-cicd-pipeline/environment-strategy.md)
