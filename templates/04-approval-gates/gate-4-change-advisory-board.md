# Gate 4 - Change Advisory Board (CAB)

| **Page Title**   | Gate 4 - Change Advisory Board - [PROJECT_NAME]  |
|------------------|---------------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                                      |
| **Status**       | NOT STARTED / IN PROGRESS / COMPLETE              |
| **Owner**        | [CHANGE_MANAGER_NAME]                             |
| **Gate Date**    | [YYYY-MM-DD]                                      |
| **Change ID**    | [CHG-XXXX]                                        |

---

## 1. Gate Purpose

Gate 4 assesses the risk of deploying changes to production and formally approves or rejects the change request. The Change Advisory Board (CAB) evaluates the deployment plan, risk assessment, rollback strategy, and communication plan to ensure production stability and minimize disruption.

### Timing in Project Lifecycle

```
[Gate 3: Security Review] --> [Pre-deployment prep] --> ** GATE 4: CAB ** --> [Gate 5: Go/No-Go] --> [Production Deployment]
```

---

## 2. Change Request Summary

| Field | Details |
|-------|---------|
| **Change ID** | [CHG-XXXX] |
| **Change Title** | [BRIEF_TITLE_OF_CHANGE] |
| **What** | [DESCRIPTION_OF_WHAT_IS_BEING_DEPLOYED — components, services, infrastructure changes] |
| **Why** | [BUSINESS_JUSTIFICATION — why this change is needed, what problem it solves, what value it delivers] |
| **When** | Deployment window: [YYYY-MM-DD HH:MM] to [YYYY-MM-DD HH:MM] ([TIMEZONE]) |
| **Who** | Deployment lead: [NAME]; Team: [TEAM_MEMBERS] |
| **Impact** | [DESCRIPTION_OF_USER_IMPACT — downtime expected? degraded performance? feature changes?] |
| **Change Type** | Standard / Normal / Emergency |
| **Environment** | Production ([AZURE_SUBSCRIPTION] / [AZURE_REGION]) |

### Components Affected

| Component | Current Version | New Version | Change Description |
|-----------|----------------|-------------|-------------------|
| [APP_SERVICE_NAME] | [v_CURRENT] | [v_NEW] | [DESCRIPTION] |
| [DATABASE_NAME] | [v_CURRENT] | [v_NEW] | [SCHEMA_CHANGES / DATA_MIGRATION] |
| [INFRASTRUCTURE] | [CURRENT_STATE] | [NEW_STATE] | [IaC_CHANGES] |
| [COMPONENT_NAME] | [v_CURRENT] | [v_NEW] | [DESCRIPTION] |

---

## 3. Risk Assessment

### 3.1 Risk Matrix

| Risk Factor | Rating (High / Medium / Low) | Details |
|------------|------------------------------|---------|
| **Likelihood of deployment failure** | [RATING] | [JUSTIFICATION] |
| **Impact if deployment fails** | [RATING] | [JUSTIFICATION] |
| **Likelihood of production incident post-deployment** | [RATING] | [JUSTIFICATION] |
| **Impact on end users during deployment** | [RATING] | [JUSTIFICATION] |
| **Data loss risk** | [RATING] | [JUSTIFICATION] |
| **Dependency risk (third-party systems)** | [RATING] | [JUSTIFICATION] |

### 3.2 Overall Risk Level

| Risk Level | Criteria |
|-----------|----------|
| **Low** | Minimal chance of failure; no user impact; automated rollback available |
| **Medium** | Some risk of failure; limited user impact; manual rollback feasible within 30 minutes |
| **High** | Significant risk of failure; broad user impact; rollback complex or time-consuming |

**Overall Risk Assessment:** LOW / MEDIUM / HIGH

### 3.3 Risk Mitigations

| Risk | Mitigation | Owner |
|------|-----------|-------|
| Deployment failure | [MITIGATION — e.g., blue/green deployment, canary release, staged rollout] | [NAME] |
| Database migration failure | [MITIGATION — e.g., backward-compatible migrations, tested rollback scripts] | [NAME] |
| Performance degradation | [MITIGATION — e.g., load testing completed, auto-scale configured, monitoring alerts] | [NAME] |
| [RISK] | [MITIGATION] | [NAME] |

---

## 4. Deployment Plan

### 4.1 Deployment Window

| Field | Value |
|-------|-------|
| **Deployment Start** | [YYYY-MM-DD HH:MM] ([TIMEZONE]) |
| **Deployment End (estimated)** | [YYYY-MM-DD HH:MM] ([TIMEZONE]) |
| **Maintenance Window** | [YYYY-MM-DD HH:MM] to [YYYY-MM-DD HH:MM] ([TIMEZONE]) |
| **Expected Downtime** | [NONE / X MINUTES / X HOURS] |
| **Deployment Strategy** | [BLUE_GREEN / CANARY / ROLLING / IN_PLACE] |

### 4.2 Deployment Steps

| Step | Action | Responsible | Estimated Duration | Verification |
|------|--------|-------------|-------------------|-------------|
| 1 | [PRE_DEPLOYMENT_CHECK — e.g., verify staging is green] | [NAME] | [DURATION] | [HOW_TO_VERIFY] |
| 2 | [DEPLOY_INFRASTRUCTURE — e.g., run Bicep/Terraform via GitHub Actions] | [NAME] | [DURATION] | [HOW_TO_VERIFY] |
| 3 | [RUN_DATABASE_MIGRATIONS] | [NAME] | [DURATION] | [HOW_TO_VERIFY] |
| 4 | [DEPLOY_APPLICATION — e.g., trigger GitHub Actions production workflow] | [NAME] | [DURATION] | [HOW_TO_VERIFY] |
| 5 | [SMOKE_TESTS — run automated health checks] | [NAME] | [DURATION] | [HOW_TO_VERIFY] |
| 6 | [TRAFFIC_SHIFT — e.g., switch traffic from blue to green] | [NAME] | [DURATION] | [HOW_TO_VERIFY] |
| 7 | [MONITORING — observe metrics for X minutes] | [NAME] | [DURATION] | [HOW_TO_VERIFY] |
| 8 | [POST_DEPLOYMENT_VERIFICATION] | [NAME] | [DURATION] | [HOW_TO_VERIFY] |

### 4.3 Rollback Time Estimate

| Scenario | Estimated Rollback Time | Method |
|----------|------------------------|--------|
| Application rollback only | [X MINUTES] | [METHOD — e.g., swap deployment slots, revert container image] |
| Application + database rollback | [X MINUTES] | [METHOD — e.g., restore from backup, run reverse migration] |
| Full infrastructure rollback | [X MINUTES] | [METHOD — e.g., redeploy previous IaC state] |

---

## 5. Communication Plan

### 5.1 Pre-Deployment Notifications

| Audience | Channel | Timing | Message Owner |
|----------|---------|--------|--------------|
| Internal stakeholders | [EMAIL / TEAMS / SLACK] | [X HOURS / DAYS] before deployment | [NAME] |
| End users (if downtime expected) | [STATUS_PAGE / EMAIL / IN_APP_BANNER] | [X HOURS / DAYS] before deployment | [NAME] |
| Support team | [EMAIL / TEAMS] | [X HOURS] before deployment | [NAME] |
| On-call operations team | [PAGERDUTY / TEAMS] | [X HOURS] before deployment | [NAME] |

### 5.2 During Deployment

| Event | Notification Channel | Responsible |
|-------|---------------------|-------------|
| Deployment started | [CHANNEL] | [NAME] |
| Deployment milestone reached | [CHANNEL] | [NAME] |
| Issue encountered | [CHANNEL] | [NAME] |
| Rollback initiated (if applicable) | [CHANNEL] | [NAME] |

### 5.3 Post-Deployment Notifications

| Audience | Channel | Timing | Message Owner |
|----------|---------|--------|--------------|
| Internal stakeholders | [CHANNEL] | Immediately after completion | [NAME] |
| End users | [STATUS_PAGE / EMAIL] | Immediately after completion | [NAME] |
| Support team | [CHANNEL] | Immediately after completion | [NAME] |
| Executive stakeholders | [EMAIL] | Within [X HOURS] of completion | [NAME] |

---

## 6. Rollback Trigger Criteria

Rollback will be initiated if **any** of the following conditions are met during or after deployment:

| # | Trigger Condition | Detection Method | Decision Authority |
|---|------------------|------------------|-------------------|
| 1 | Application error rate exceeds [X]% (baseline: [Y]%) | Azure Monitor alerts / Application Insights | Deployment Lead |
| 2 | Response time exceeds [X ms] P95 for more than [X MINUTES] | Application Insights metrics | Deployment Lead |
| 3 | Health check endpoints return non-200 for more than [X MINUTES] | Automated health check script | Deployment Lead |
| 4 | Critical business functionality is broken (e.g., [LOGIN / PAYMENTS / CORE_FEATURE]) | Smoke tests / Manual verification | Deployment Lead + Product Owner |
| 5 | Database migration fails or causes data integrity issues | Migration logs / Data validation queries | Deployment Lead + DBA |
| 6 | Security incident detected during deployment | Security monitoring alerts | Security Lead |
| 7 | [CUSTOM_TRIGGER] | [DETECTION_METHOD] | [AUTHORITY] |

**Rollback Decision Authority:** [DEPLOYMENT_LEAD_NAME] has authority to initiate rollback without further approval during the deployment window.

---

## 7. CAB Decision

| Decision | Description |
|----------|-------------|
| **APPROVED** | Change is approved for the specified deployment window. |
| **APPROVED WITH CONDITIONS** | Change is approved contingent on documented conditions being met before deployment. |
| **DEFERRED** | Change is not approved for this window. Must be re-submitted for a future window. |
| **REJECTED** | Change is not approved. Significant concerns must be addressed before re-submission. |

### Decision Outcome

| Field | Value |
|-------|-------|
| **Decision** | APPROVED / APPROVED WITH CONDITIONS / DEFERRED / REJECTED |
| **Decision Date** | [YYYY-MM-DD] |
| **Decision Rationale** | [BRIEF_RATIONALE] |
| **Approved Deployment Window** | [YYYY-MM-DD HH:MM] to [YYYY-MM-DD HH:MM] ([TIMEZONE]) |
| **Next Step** | Gate 5 - Go/No-Go Checklist: [YYYY-MM-DD] |

### Conditions (if applicable)

| # | Condition | Owner | Must Be Met By | Status (NOT STARTED / IN PROGRESS / COMPLETE) |
|---|-----------|-------|---------------|----------------------------------------------|
| 1 | [CONDITION_DESCRIPTION] | [NAME] | [YYYY-MM-DD] | NOT STARTED |
| 2 | [CONDITION_DESCRIPTION] | [NAME] | [YYYY-MM-DD] | NOT STARTED |

---

## 8. CAB Sign-Off

| Name | Role | Decision (Approve / Defer / Reject) | Date |
|------|------|-------------------------------------|------|
| [CAB_CHAIR] | CAB Chair | | [YYYY-MM-DD] |
| [CHANGE_MANAGER] | Change Manager | | [YYYY-MM-DD] |
| [OPERATIONS_LEAD] | Operations Lead | | [YYYY-MM-DD] |
| [SECURITY_REPRESENTATIVE] | Security Representative | | [YYYY-MM-DD] |
| [BUSINESS_REPRESENTATIVE] | Business / Product Representative | | [YYYY-MM-DD] |
| [CAB_MEMBER] | [ROLE] | | [YYYY-MM-DD] |

---

## 9. Post-Deployment Review

> Complete this section after the deployment is finished.

| Field | Value |
|-------|-------|
| **Deployment Start (Actual)** | [YYYY-MM-DD HH:MM] |
| **Deployment End (Actual)** | [YYYY-MM-DD HH:MM] |
| **Result** | SUCCESS / PARTIAL SUCCESS / ROLLED BACK / FAILED |
| **Rollback Executed** | YES / NO |
| **Incidents Created** | [INCIDENT_IDs or NONE] |
| **Lessons Learned** | [NOTES] |
