# Gate 5 - Go / No-Go Checklist

| **Page Title**   | Gate 5 - Go / No-Go Checklist - [PROJECT_NAME]   |
|------------------|---------------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                                      |
| **Status**       | NOT STARTED / IN PROGRESS / COMPLETE              |
| **Owner**        | [RELEASE_MANAGER_NAME]                            |
| **Gate Date**    | [YYYY-MM-DD]                                      |
| **Target Deploy**| [YYYY-MM-DD HH:MM] ([TIMEZONE])                   |

---

## 1. Gate Purpose

Gate 5 is the final checkpoint before production deployment. This comprehensive go/no-go checklist ensures every prerequisite is verified and all stakeholders confirm readiness. The checklist must be completed **no more than [24 HOURS / 4 HOURS]** before the approved deployment window.

### Timing in Project Lifecycle

```
[Gate 4: CAB Approved] --> ** GATE 5: Go / No-Go ** --> [Production Deployment] --> [Post-Deployment Verification]
```

---

## 2. Pre-Deployment Checklist

### 2.1 Code

| # | Check | Status (Ready / Not Ready / N/A) | Owner | Notes |
|---|-------|----------------------------------|-------|-------|
| 2.1.1 | All pull requests for this release are merged to the release branch | | [NAME] | |
| 2.1.2 | Release branch is created and frozen (code freeze in effect) | | [NAME] | Branch: [BRANCH_NAME] |
| 2.1.3 | No critical or high-severity bugs are open against this release | | [NAME] | Bug tracker: [LINK] |
| 2.1.4 | All known bugs included in the release are documented in release notes | | [NAME] | |
| 2.1.5 | Version number / build tag is finalized | | [NAME] | Version: [VERSION] |
| 2.1.6 | Release artifact is built and stored in the artifact repository | | [NAME] | Artifact: [LINK] |
| 2.1.7 | No uncommitted or unreviewed code changes exist | | [NAME] | |

### 2.2 Testing

| # | Check | Status (Ready / Not Ready / N/A) | Owner | Notes |
|---|-------|----------------------------------|-------|-------|
| 2.2.1 | Unit test suite passes with [TARGET]% code coverage (actual: [ACTUAL]%) | | [NAME] | Report: [LINK] |
| 2.2.2 | Integration test suite passes in staging environment | | [NAME] | Report: [LINK] |
| 2.2.3 | End-to-end (E2E) test suite passes in staging environment | | [NAME] | Report: [LINK] |
| 2.2.4 | User Acceptance Testing (UAT) is complete and signed off by Product Owner | | [NAME] | Sign-off: [LINK] |
| 2.2.5 | Performance / load testing meets baseline targets | | [NAME] | P95 latency: [X ms], Throughput: [X rps] |
| 2.2.6 | Regression testing confirms no existing functionality is broken | | [NAME] | Report: [LINK] |
| 2.2.7 | Smoke test scripts are ready for post-deployment verification | | [NAME] | Script: [LINK] |

### 2.3 Security

| # | Check | Status (Ready / Not Ready / N/A) | Owner | Notes |
|---|-------|----------------------------------|-------|-------|
| 2.3.1 | Gate 3 (Security Review) has been passed | | [NAME] | Gate 3: [LINK] |
| 2.3.2 | All Critical severity security findings are resolved | | [NAME] | |
| 2.3.3 | All High severity security findings are resolved or formally accepted | | [NAME] | Acceptance: [LINK] |
| 2.3.4 | SAST scan on release branch shows no new critical/high findings | | [NAME] | Report: [LINK] |
| 2.3.5 | Dependency scan shows no critical/high vulnerabilities | | [NAME] | Report: [LINK] |
| 2.3.6 | Security monitoring and alerting are configured for production | | [NAME] | |

### 2.4 Infrastructure

| # | Check | Status (Ready / Not Ready / N/A) | Owner | Notes |
|---|-------|----------------------------------|-------|-------|
| 2.4.1 | Production Azure environment is provisioned and verified | | [NAME] | Subscription: [NAME] |
| 2.4.2 | Infrastructure-as-Code (IaC) has been applied to production | | [NAME] | IaC: [BICEP / TERRAFORM] |
| 2.4.3 | DNS records are configured and propagated | | [NAME] | Domain: [DOMAIN] |
| 2.4.4 | TLS/SSL certificates are provisioned and valid | | [NAME] | Expiry: [DATE] |
| 2.4.5 | Azure Key Vault secrets are populated for production | | [NAME] | |
| 2.4.6 | Database is provisioned, schema is current, seed data is loaded | | [NAME] | |
| 2.4.7 | Network security (NSGs, private endpoints, WAF) is configured | | [NAME] | |
| 2.4.8 | Auto-scaling rules are configured and tested | | [NAME] | |
| 2.4.9 | Backup and disaster recovery configuration is verified | | [NAME] | RPO: [X hrs], RTO: [X hrs] |

### 2.5 Operations

| # | Check | Status (Ready / Not Ready / N/A) | Owner | Notes |
|---|-------|----------------------------------|-------|-------|
| 2.5.1 | Operational runbooks are updated for the new release | | [NAME] | Runbook: [LINK] |
| 2.5.2 | Azure Monitor dashboards are configured for key metrics | | [NAME] | Dashboard: [LINK] |
| 2.5.3 | Alerting rules are configured with appropriate thresholds and escalation | | [NAME] | |
| 2.5.4 | Application Insights is configured for APM (traces, dependencies, exceptions) | | [NAME] | |
| 2.5.5 | Log Analytics queries are prepared for common troubleshooting scenarios | | [NAME] | |
| 2.5.6 | On-call schedule is confirmed for deployment window and 48 hours post-deployment | | [NAME] | On-call: [NAMES] |
| 2.5.7 | Escalation contacts are documented and reachable | | [NAME] | |

### 2.6 Communication

| # | Check | Status (Ready / Not Ready / N/A) | Owner | Notes |
|---|-------|----------------------------------|-------|-------|
| 2.6.1 | Internal stakeholders have been notified of the deployment window | | [NAME] | Sent: [DATE] |
| 2.6.2 | End users have been notified (if downtime or behavior changes expected) | | [NAME] | Channel: [METHOD] |
| 2.6.3 | Release notes are drafted and approved | | [NAME] | Release notes: [LINK] |
| 2.6.4 | Support team has been briefed on changes and known issues | | [NAME] | Briefing: [DATE] |
| 2.6.5 | Status page is prepared for updates during deployment (if applicable) | | [NAME] | Status page: [LINK] |
| 2.6.6 | Post-deployment communication is drafted and ready to send | | [NAME] | |

### 2.7 Rollback

| # | Check | Status (Ready / Not Ready / N/A) | Owner | Notes |
|---|-------|----------------------------------|-------|-------|
| 2.7.1 | Rollback plan is documented and reviewed | | [NAME] | Plan: [LINK] |
| 2.7.2 | Rollback has been tested in staging (or a prior deployment) | | [NAME] | Test date: [DATE] |
| 2.7.3 | Database rollback scripts are prepared and tested | | [NAME] | Scripts: [LINK] |
| 2.7.4 | Previous application version is available for redeployment | | [NAME] | Artifact: [LINK] |
| 2.7.5 | Rollback trigger criteria are defined and agreed upon | | [NAME] | See Gate 4: [LINK] |
| 2.7.6 | Rollback decision authority is confirmed | | [NAME] | Authority: [NAME] |
| 2.7.7 | Estimated rollback time: [X MINUTES] | | [NAME] | |

---

## 3. Checklist Summary

| Category | Total Checks | Ready | Not Ready | N/A |
|----------|-------------|-------|-----------|-----|
| Code | 7 | -- | -- | -- |
| Testing | 7 | -- | -- | -- |
| Security | 6 | -- | -- | -- |
| Infrastructure | 9 | -- | -- | -- |
| Operations | 7 | -- | -- | -- |
| Communication | 6 | -- | -- | -- |
| Rollback | 7 | -- | -- | -- |
| **Total** | **49** | **--** | **--** | **--** |

---

## 4. Go / No-Go Decision

### 4.1 Decision Criteria

| Condition | Required for GO |
|-----------|----------------|
| All "Code" items are Ready or N/A | YES |
| All "Testing" items are Ready or N/A | YES |
| All "Security" items are Ready or N/A | YES |
| All "Infrastructure" items are Ready or N/A | YES |
| All "Operations" items are Ready or N/A | YES |
| All "Communication" items are Ready or N/A | YES |
| All "Rollback" items are Ready or N/A | YES |
| Zero "Not Ready" items remain in any category | YES (exceptions require unanimous approval) |

### 4.2 Decision

| Decision | Description |
|----------|-------------|
| **GO** | All checklist items are Ready or N/A. Deployment proceeds as planned. |
| **CONDITIONAL GO** | Minor items are Not Ready but have a plan to resolve before the deployment window opens. Requires unanimous approval from all decision-makers. |
| **NO-GO** | One or more blocking items are Not Ready. Deployment is postponed. |

### Decision Outcome

| Field | Value |
|-------|-------|
| **Decision** | GO / CONDITIONAL GO / NO-GO |
| **Decision Date/Time** | [YYYY-MM-DD HH:MM] ([TIMEZONE]) |
| **Decision Rationale** | [BRIEF_RATIONALE] |
| **Deployment Window (confirmed)** | [YYYY-MM-DD HH:MM] to [YYYY-MM-DD HH:MM] ([TIMEZONE]) |

### Conditions for Conditional GO (if applicable)

| # | Condition | Owner | Must Be Resolved By | Status |
|---|-----------|-------|---------------------|--------|
| 1 | [CONDITION] | [NAME] | [YYYY-MM-DD HH:MM] | NOT STARTED / IN PROGRESS / COMPLETE |
| 2 | [CONDITION] | [NAME] | [YYYY-MM-DD HH:MM] | NOT STARTED / IN PROGRESS / COMPLETE |

---

## 5. Decision Sign-Off

| Name | Role | Decision (GO / NO-GO) | Date |
|------|------|-----------------------|------|
| [RELEASE_MANAGER] | Release Manager | | [YYYY-MM-DD] |
| [PRODUCT_OWNER] | Product Owner | | [YYYY-MM-DD] |
| [TECH_LEAD] | Technical Lead | | [YYYY-MM-DD] |
| [OPERATIONS_LEAD] | Operations Lead | | [YYYY-MM-DD] |
| [SECURITY_LEAD] | Security Lead | | [YYYY-MM-DD] |
| [QA_LEAD] | QA Lead | | [YYYY-MM-DD] |
| [ENGINEERING_MANAGER] | Engineering Manager | | [YYYY-MM-DD] |

---

## 6. Escalation Path (if NO-GO)

If the decision is **NO-GO**, follow this escalation path:

| Step | Action | Responsible | Timeline |
|------|--------|-------------|----------|
| 1 | Document all blocking items and reasons for NO-GO | Release Manager | Immediately |
| 2 | Notify all stakeholders of deployment postponement | Release Manager | Within 1 hour |
| 3 | Schedule remediation working session for blocking items | Tech Lead / Item Owners | Within 4 hours |
| 4 | Identify new target deployment date | Release Manager + Product Owner | Within 1 business day |
| 5 | Re-submit to CAB if deployment window changes significantly | Change Manager | As needed |
| 6 | Escalate to [VP_ENGINEERING / CTO] if repeated NO-GO decisions | Engineering Manager | After 2nd NO-GO |

### Escalation Contacts

| Level | Contact | Role | Channel |
|-------|---------|------|---------|
| L1 | [NAME] | Release Manager | [EMAIL / PHONE] |
| L2 | [NAME] | Engineering Manager | [EMAIL / PHONE] |
| L3 | [NAME] | VP Engineering / CTO | [EMAIL / PHONE] |

---

## 7. References

| Document | Link |
|----------|------|
| Gate 4 - CAB Decision | [LINK_TO_GATE_4] |
| Deployment Runbook | [LINK_TO_RUNBOOK] |
| Rollback Plan | [LINK_TO_ROLLBACK_PLAN] |
| Release Notes | [LINK_TO_RELEASE_NOTES] |
| Monitoring Dashboard | [LINK_TO_DASHBOARD] |
| On-Call Schedule | [LINK_TO_ONCALL] |
