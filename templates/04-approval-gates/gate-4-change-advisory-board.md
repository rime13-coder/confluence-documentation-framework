# Gate 4 - Change Advisory Board (CAB)

| **Page Title**   | Gate 4 - Change Advisory Board - CMMC Assessor Platform   |
|------------------|-----------------------------------------------------------|
| **Last Updated** | 2026-02-14                                                |
| **Status**       | IN PROGRESS                                               |
| **Owner**        | DevOps Lead, IntelliSec Solutions                         |
| **Gate Date**    | 2026-02-17 (planned, pending Phase 1 completion)          |
| **Change ID**    | CHG-001                                                   |

---

## 1. Gate Purpose

Gate 4 assesses the risk of deploying the CMMC Assessor Platform to production and formally approves or rejects the change request. Given the small team at IntelliSec Solutions, the CAB functions as an internal deployment readiness review rather than a formal enterprise board. The review evaluates the deployment plan for Azure Container Apps, risk assessment given the 47 security findings (with Critical findings resolved), rollback strategy, and communication plan.

### Timing in Project Lifecycle

```
[Gate 3: Security Review] --> [Phase 1 Remediation] --> ** GATE 4: CAB ** --> [Gate 5: Go/No-Go] --> [Production Deployment]
```

---

## 2. Change Request Summary

| Field | Details |
|-------|---------|
| **Change ID** | CHG-001 |
| **Change Title** | CMMC Assessor Platform - Initial Production Deployment (MVP) |
| **What** | Deploy the full CMMC Assessor Platform to production Azure environment: React 18 SPA frontend, Node.js/Express API (68+ endpoints), PostgreSQL 17 database with Prisma schema, Azure Container Apps infrastructure (via Bicep), Azure Container Registry, Key Vault, Blob Storage, and Log Analytics. |
| **Why** | Enable defense industrial base (DIB) organizations to perform CMMC Level 2 self-assessments, calculate SPRS scores, and manage POA&M remediation plans. First production release of the IntelliSec CMMC Assessor Platform MVP. |
| **When** | Deployment window: 2026-02-19 09:00 to 2026-02-19 13:00 (EST) -- subject to Phase 1 completion |
| **Who** | Deployment lead: DevOps Lead; Team: Dev Lead, CTO (on call) |
| **Impact** | New deployment (no existing users); no downtime impact. First-time production environment creation. Internal team will perform smoke testing before opening access. |
| **Change Type** | Normal (first production deployment) |
| **Environment** | Production (Azure, East US region) |

### Components Affected

| Component | Current Version | New Version | Change Description |
|-----------|----------------|-------------|-------------------|
| React 18 SPA (Frontend) | N/A (new) | 1.0.0 | Initial deployment of React SPA to Container Apps |
| Node.js/Express API | N/A (new) | 1.0.0 | Initial deployment of Express API with 68+ endpoints |
| PostgreSQL 17 Database | N/A (new) | Schema v1.0 | Initial Prisma schema migration: tenants, teams, users, assessments, controls, POA&M, audit logs |
| Azure Infrastructure (Bicep) | N/A (new) | 1.0.0 | Container Apps environment, ACR, PostgreSQL Flexible Server, Key Vault, Blob Storage, Log Analytics |
| GitHub Actions CI/CD | Existing (staging) | Production workflow | Add production deployment workflow with environment protection rules |

---

## 3. Risk Assessment

### 3.1 Risk Matrix

| Risk Factor | Rating (High / Medium / Low) | Details |
|------------|------------------------------|---------|
| **Likelihood of deployment failure** | Low | Deployment is automated via GitHub Actions and Bicep; tested on staging environment; infrastructure is declarative and idempotent |
| **Impact if deployment fails** | Low | New deployment with no existing users; rollback is straightforward (delete resource group and redeploy) |
| **Likelihood of production incident post-deployment** | Medium | 47 security findings identified; Phase 1 (Critical) resolved but Phase 2 (High) still open; limited access during initial period mitigates risk |
| **Impact on end users during deployment** | Low | No existing users; first production deployment; no service interruption |
| **Data loss risk** | Low | New deployment with empty database; seed data (CMMC control library) can be regenerated; no production data exists |
| **Dependency risk (third-party systems)** | Medium | Depends on Microsoft Entra ID (OAuth) and Microsoft Graph API (SharePoint); both are stable Azure services but require correct app registration configuration |

### 3.2 Overall Risk Level

**Overall Risk Assessment:** LOW (for deployment mechanics) / MEDIUM (for post-deployment security posture)

> Deployment risk is low because this is a new deployment with no existing data or users. Post-deployment security risk is medium due to 10 open High findings under remediation.

### 3.3 Risk Mitigations

| Risk | Mitigation | Owner |
|------|-----------|-------|
| Deployment failure | Bicep IaC is idempotent; tested in staging; GitHub Actions workflow tested; can redeploy from scratch | DevOps Lead |
| Database migration failure | Prisma migration tested in staging; new database with no existing data; can drop and recreate | Dev Lead |
| Security incident post-deployment | Limited access (invitation-only after F-03 fix); rate limiting enabled (F-04 fix); monitored deployment with team on call | Dev Lead |
| Entra ID integration failure | App registration verified in staging; production app registration pre-configured and tested | Dev Lead |
| Graph API connectivity failure | SharePoint integration tested with staging credentials; production Graph API permissions pre-consented | Dev Lead |

---

## 4. Deployment Plan

### 4.1 Deployment Window

| Field | Value |
|-------|-------|
| **Deployment Start** | 2026-02-19 09:00 (EST) |
| **Deployment End (estimated)** | 2026-02-19 13:00 (EST) |
| **Maintenance Window** | N/A (new deployment, no existing service) |
| **Expected Downtime** | None (new deployment) |
| **Deployment Strategy** | Initial deployment via Bicep (infrastructure) + GitHub Actions (application) |

### 4.2 Deployment Steps

| Step | Action | Responsible | Estimated Duration | Verification |
|------|--------|-------------|-------------------|-------------|
| 1 | Verify all Phase 1 Critical findings (F-01, F-02, F-03, F-04) are resolved and merged to main | Dev Lead | 15 min | Code review + merge confirmation on GitHub |
| 2 | Create production resource group and deploy Bicep infrastructure (Container Apps environment, ACR, PostgreSQL, Key Vault, Blob Storage, Log Analytics) | DevOps Lead | 20 min | Azure Portal: verify all resources provisioned; check Bicep deployment output |
| 3 | Configure production Entra ID app registration (redirect URIs, client secret in Key Vault) | DevOps Lead | 15 min | Verify app registration in Entra ID portal; test OAuth flow endpoint |
| 4 | Configure Container Apps secrets and environment variables (from Key Vault references where possible) | DevOps Lead | 10 min | Verify Container Apps configuration in Azure Portal |
| 5 | Run Prisma database migration against production PostgreSQL | Dev Lead | 10 min | Verify schema tables created; seed CMMC control library data |
| 6 | Build and push production Docker image to ACR via GitHub Actions | DevOps Lead | 10 min | Verify image in ACR; check build logs for success |
| 7 | Deploy Container App revision with production image | DevOps Lead | 5 min | Verify Container App revision is running; check logs for startup errors |
| 8 | Run automated smoke tests against production endpoint | Dev Lead | 15 min | Health check returns 200; OAuth login flow completes; API returns CMMC controls |
| 9 | Perform manual verification: create test organization, start assessment, verify SPRS scoring | Dev Lead | 30 min | End-to-end workflow functional; tenant isolation verified |
| 10 | Configure DNS (custom domain and TLS certificate) | DevOps Lead | 15 min | Custom domain resolves; HTTPS with valid certificate |
| 11 | Monitor application metrics and logs for 30 minutes | All | 30 min | No errors in Container Apps logs; response times within targets |

### 4.3 Rollback Time Estimate

| Scenario | Estimated Rollback Time | Method |
|----------|------------------------|--------|
| Application rollback only | 5 minutes | Deactivate Container App revision; revert to previous revision (if exists) or scale to zero |
| Application + database rollback | 15 minutes | Scale Container App to zero; drop and recreate database (no production data in initial deployment) |
| Full infrastructure rollback | 30 minutes | Delete production resource group; redeploy from Bicep when ready |

---

## 5. Communication Plan

### 5.1 Pre-Deployment Notifications

| Audience | Channel | Timing | Message Owner |
|----------|---------|--------|--------------|
| IntelliSec team | Microsoft Teams | 24 hours before deployment | DevOps Lead |
| CTO | Direct message / email | 24 hours before deployment | DevOps Lead |
| Beta testers (if any) | Email | 1 week before deployment | Product Owner |

### 5.2 During Deployment

| Event | Notification Channel | Responsible |
|-------|---------------------|-------------|
| Deployment started | Teams channel | DevOps Lead |
| Infrastructure provisioned successfully | Teams channel | DevOps Lead |
| Application deployed and smoke tests passing | Teams channel | Dev Lead |
| Deployment complete and verified | Teams channel + email | DevOps Lead |
| Issue encountered (if any) | Teams channel + phone call to CTO | DevOps Lead |

### 5.3 Post-Deployment Notifications

| Audience | Channel | Timing | Message Owner |
|----------|---------|--------|--------------|
| IntelliSec team | Microsoft Teams | Immediately after completion | DevOps Lead |
| CTO | Email with summary | Within 1 hour of completion | DevOps Lead |
| Beta testers | Email with access instructions | Within 24 hours of completion | Product Owner |

---

## 6. Rollback Trigger Criteria

Rollback will be initiated if **any** of the following conditions are met during or after deployment:

| # | Trigger Condition | Detection Method | Decision Authority |
|---|------------------|------------------|-------------------|
| 1 | Bicep infrastructure deployment fails with errors | Azure deployment logs / GitHub Actions output | DevOps Lead |
| 2 | Prisma database migration fails or produces schema errors | Migration CLI output / database inspection | Dev Lead |
| 3 | Container App fails to start or enters crash loop | Container Apps logs / Azure Monitor | DevOps Lead |
| 4 | Health check endpoint returns non-200 for more than 5 minutes after deployment | Automated health check / manual curl | Dev Lead |
| 5 | OAuth login flow fails (Entra ID integration broken) | Manual smoke test | Dev Lead |
| 6 | Tenant isolation failure detected (cross-tenant data access) | Manual smoke test with multiple test organizations | Dev Lead + CTO |
| 7 | Any of the resolved Critical findings (F-01, F-02, F-03, F-04) are found to be incompletely fixed | Manual verification during smoke testing | Dev Lead |

**Rollback Decision Authority:** DevOps Lead has authority to initiate rollback without further approval during the deployment window. CTO must be notified within 15 minutes of any rollback decision.

---

## 7. CAB Decision

| Decision | Description |
|----------|-------------|
| **APPROVED WITH CONDITIONS** | Change is approved contingent on documented conditions being met before deployment. |

### Decision Outcome

| Field | Value |
|-------|-------|
| **Decision** | APPROVED WITH CONDITIONS |
| **Decision Date** | 2026-02-17 (planned) |
| **Decision Rationale** | First production deployment with low deployment risk (new environment, no existing users, automated IaC). Post-deployment security risk is medium due to open High findings, mitigated by invitation-only access and Phase 2 remediation timeline. Deployment approved conditional on all Phase 1 Critical findings being verified as resolved. |
| **Approved Deployment Window** | 2026-02-19 09:00 to 2026-02-19 13:00 (EST) |
| **Next Step** | Gate 5 - Go/No-Go Checklist: 2026-02-19 08:00 (EST) |

### Conditions (if applicable)

| # | Condition | Owner | Must Be Met By | Status |
|---|-----------|-------|---------------|--------|
| 1 | All 4 Critical findings (F-01, F-02, F-03, F-04) must be verified as resolved and merged to main branch | Dev Lead | 2026-02-18 | COMPLETE — All 4 resolved 2026-02-15 |
| 2 | Production Entra ID app registration must be created and tested | DevOps Lead | 2026-02-18 | NOT STARTED |
| 3 | Production Bicep parameters file must be reviewed and approved | CTO | 2026-02-18 | NOT STARTED |
| 4 | CTO must sign risk acceptance for any remaining open High findings | CTO | 2026-02-18 | NOT STARTED |

---

## 8. CAB Sign-Off

| Name | Role | Decision (Approve / Defer / Reject) | Date |
|------|------|-------------------------------------|------|
| (CTO) | CAB Chair / CTO | Pending | |
| (DevOps Lead) | Change Manager / DevOps Lead | Pending | |
| (Dev Lead) | Technical Lead | Pending | |
| (Product Owner) | Business / Product Representative | Pending | |

---

## 9. Post-Deployment Review

> Complete this section after the deployment is finished.

| Field | Value |
|-------|-------|
| **Deployment Start (Actual)** | |
| **Deployment End (Actual)** | |
| **Result** | |
| **Rollback Executed** | |
| **Incidents Created** | |
| **Lessons Learned** | |
