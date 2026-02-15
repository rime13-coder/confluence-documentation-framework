# Rollback Procedures

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Rollback Procedures                |
| Last Updated     | 2026-02-14                         |
| Status           | Draft                              |
| Owner            | IntelliSec Solutions               |

---

## 1. Document Purpose

This document defines the rollback procedures for all deployment types within the CMMC Assessor Platform on Azure. It covers when to roll back versus roll forward, who can authorize a rollback, step-by-step procedures for Container Apps revision rollback, database rollback (Prisma), infrastructure rollback (Bicep), verification steps, and post-rollback processes.

---

## 2. Rollback Decision Criteria

### 2.1 When to Roll Back vs. Roll Forward

| Scenario                                          | Decision        | Rationale                                                    |
|---------------------------------------------------|-----------------|--------------------------------------------------------------|
| New deployment introduces a critical bug           | **Roll Back**   | Fastest path to restore service; fix can come later          |
| Deployment causes complete outage                  | **Roll Back**   | Restore previous stable version immediately                  |
| Performance degradation >50% from baseline         | **Roll Back**   | Unacceptable user experience; investigate offline            |
| Data corruption detected                           | **Roll Back**   | Prevent further data damage; restore from backup if needed   |
| Minor bug affecting <5% of users with workaround   | **Roll Forward** | Impact is contained; faster to deploy a hotfix               |
| Fix is identified and can be deployed in <30 min   | **Roll Forward** | Fix is quicker than rollback process                         |
| Prisma migration is irreversible (destructive)     | **Roll Forward** | Rollback is not possible for the database; must fix forward  |

### 2.2 Rollback Decision Flowchart

```
Is the deployment causing data corruption?
  YES -> ROLL BACK IMMEDIATELY (also restore DB if needed)
  NO  -> Continue

Is the platform completely inaccessible?
  YES -> ROLL BACK IMMEDIATELY
  NO  -> Continue

Is >10% of users impacted?
  YES -> Can we fix in <30 minutes?
    YES -> ROLL FORWARD
    NO  -> ROLL BACK
  NO  -> Continue

Is there a workaround?
  YES -> ROLL FORWARD (deploy hotfix)
  NO  -> Can we fix in <30 minutes?
    YES -> ROLL FORWARD
    NO  -> ROLL BACK
```

---

## 3. Rollback Authority

| Decision Type                  | Authorized By                          | Notification Required                    |
|--------------------------------|----------------------------------------|------------------------------------------|
| Standard rollback              | Any engineer with Azure access         | Notify team lead                         |
| Urgent rollback (SEV 1/2)      | Any engineer (immediate, inform later) | Notify team lead after action            |
| Database rollback               | Engineer with DB access                | Notify team lead before action           |
| Infrastructure rollback         | Engineer with Azure access             | Notify team lead before action           |

**Important:** During a SEV 1 incident, any engineer with access is authorized to initiate a rollback immediately without waiting for approval. Approvals can be obtained retroactively.

---

## 4. Rollback Procedures by Deployment Type

---

### 4.1 Container Apps Rollback (Primary Method)

Container Apps uses a single-revision mode. Rollback is achieved by redeploying a previous container image.

#### Method A: Redeploy Previous Image via Azure CLI (Preferred)

**Prerequisites:**
- [ ] Azure CLI installed and logged in (`az login`)
- [ ] Previous container image tag identified in ACR (acrcmmcassessorprod)

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | List available image tags in ACR (backend API)                            | `az acr repository show-tags --name acrcmmcassessorprod --repository cmmc-api --orderby time_desc --output table` |
| 2    | List available image tags in ACR (frontend)                               | `az acr repository show-tags --name acrcmmcassessorprod --repository cmmc-web --orderby time_desc --output table` |
| 3    | Identify the previous known-good image tag                                | Note the tag from before the problematic deployment                          |
| 4    | Roll back backend API to previous image                                   | `az containerapp update --name cmmc-api --resource-group rg-cmmc-assessor-prod --image acrcmmcassessorprod.azurecr.io/cmmc-api:<PREVIOUS_TAG>` |
| 5    | Roll back frontend to previous image                                      | `az containerapp update --name cmmc-web --resource-group rg-cmmc-assessor-prod --image acrcmmcassessorprod.azurecr.io/cmmc-web:<PREVIOUS_TAG>` |
| 6    | Verify new revision is active                                             | `az containerapp revision list --name cmmc-api --resource-group rg-cmmc-assessor-prod -o table` |
| 7    | Verify health endpoint                                                    | `curl -s https://api.cmmc.intellisecops.com/api/health`                      |
| 8    | Verify frontend is accessible                                             | `curl -s -o /dev/null -w "%{http_code}" https://cmmc.intellisecops.com`      |
| 9    | Monitor Log Analytics for 15 minutes                                      | Check for errors: `ContainerAppConsoleLogs_CL \| where ContainerAppName_s == "cmmc-api" \| where TimeGenerated > ago(15m) \| where Log_s contains "error"` |

**Estimated Time:** 5-10 minutes

#### Method B: Redeploy via GitHub Actions Workflow Dispatch

**Prerequisites:**
- [ ] Access to the GitHub repository
- [ ] Workflow dispatch is enabled on the CD workflow

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | Go to GitHub repository > Actions tab                                     | Navigate to the CD workflow                                                  |
| 2    | Click "Run workflow"                                                      | Select the main branch or input the previous commit SHA / tag                |
| 3    | Wait for the workflow to complete                                         | Monitor GitHub Actions logs                                                  |
| 4    | Verify deployment                                                         | `curl -s https://api.cmmc.intellisecops.com/api/health`                      |
| 5    | Monitor for 15 minutes                                                    | Check Log Analytics for errors                                               |

**Estimated Time:** 10-15 minutes (includes CI/CD pipeline time)

#### Method C: Revert Git Commit and Push

**Prerequisites:**
- [ ] Git repository cloned locally
- [ ] Ability to push to main branch

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | Identify the commit to revert                                             | `git log --oneline -10`                                                      |
| 2    | Create a revert commit                                                    | `git revert <COMMIT_SHA>`                                                    |
| 3    | Push to main (triggers CD pipeline)                                       | `git push origin main`                                                       |
| 4    | Wait for CD pipeline to deploy                                            | Monitor GitHub Actions                                                       |
| 5    | Verify deployment                                                         | `curl -s https://api.cmmc.intellisecops.com/api/health`                      |

**Estimated Time:** 10-15 minutes (includes CI/CD pipeline time)

---

### 4.2 Database Rollback (Prisma)

#### Option A: Prisma Migration Rollback (if migration is reversible)

**Prerequisites:**
- [ ] Prisma CLI available
- [ ] Migration down scripts exist (Prisma does not auto-generate down migrations)
- [ ] Database backup taken before proceeding

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | **CRITICAL: Take a backup before rolling back**                          | `az postgres flexible-server restore --resource-group rg-cmmc-assessor-prod --name psql-cmmc-assessor-backup --source-server psql-cmmc-assessor-prod --restore-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)"` |
| 2    | Check current migration status                                           | `npx prisma migrate status`                                                  |
| 3    | If down migration exists, apply it                                        | Manual SQL execution of the rollback script against psql-cmmc-assessor-prod  |
| 4    | Verify schema matches expected state                                      | `npx prisma db pull` and compare with previous schema                        |
| 5    | Roll back application code (see Section 4.1)                              | Application code must match database schema version                          |

> **WARNING:** Prisma does not natively generate down migrations. Reversing a migration requires manually writing and executing SQL rollback scripts. If no down migration script exists, use Option B.

#### Option B: Point-in-Time Restore (Last Resort)

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | Identify the target restore point (before the deployment)                 | Determine timestamp in UTC (before the problematic migration ran)            |
| 2    | Restore to a new database server                                          | `az postgres flexible-server restore --resource-group rg-cmmc-assessor-prod --name psql-cmmc-assessor-restored --source-server psql-cmmc-assessor-prod --restore-time "YYYY-MM-DDTHH:MM:SSZ"` |
| 3    | Validate restored database                                                | Connect via psql and verify data integrity                                   |
| 4    | Update application connection string in Key Vault                         | `az keyvault secret set --vault-name kv-cmmc-assessor-prod --name DATABASE-URL --value "postgresql://...@psql-cmmc-assessor-restored.postgres.database.azure.com:5432/..."` |
| 5    | Restart Container Apps to pick up new connection string                    | `az containerapp update --name cmmc-api --resource-group rg-cmmc-assessor-prod --set-env-vars RESTART_TRIGGER=$(date +%s)` |
| 6    | Verify application connectivity                                           | `curl -s https://api.cmmc.intellisecops.com/api/health`                      |
| 7    | Roll back application code to match restored schema (see Section 4.1)     | Deploy the image version that matches the restored database schema            |

**Estimated Time:** 30-60 minutes

> **WARNING:** Point-in-time restore will lose any data written after the restore point. This should only be used as a last resort.

---

### 4.3 Infrastructure Rollback (Bicep)

**Prerequisites:**
- [ ] Git history for the IaC files accessible
- [ ] Azure CLI logged in with sufficient permissions

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | Identify the Git commit of the last known good infrastructure state       | `git log --oneline infrastructure/`                                          |
| 2    | Create a revert commit                                                    | `git revert <COMMIT_SHA>`                                                    |
| 3    | Run what-if to preview the rollback                                       | `az deployment group what-if --resource-group rg-cmmc-assessor-prod --template-file infrastructure/main.bicep --parameters infrastructure/parameters.prod.json` |
| 4    | **Review the what-if output carefully** -- ensure no unintended deletions | Team review of output                                                        |
| 5    | Deploy the previous version                                               | `az deployment group create --resource-group rg-cmmc-assessor-prod --template-file infrastructure/main.bicep --parameters infrastructure/parameters.prod.json` |
| 6    | Verify resources are in expected state                                    | Check Azure Portal, run health checks                                        |
| 7    | Push the revert commit to trigger CD pipeline                              | `git push origin main`                                                       |

**Estimated Time:** 15-30 minutes

---

## 5. Rollback Verification Steps

After completing any rollback, verify the following:

### 5.1 Universal Verification Checklist

- [ ] API health check returns 200 OK: `curl -s https://api.cmmc.intellisecops.com/api/health`
- [ ] Frontend loads successfully: `curl -s -o /dev/null -w "%{http_code}" https://cmmc.intellisecops.com`
- [ ] Container App revision is active: `az containerapp revision list --name cmmc-api --resource-group rg-cmmc-assessor-prod -o table`
- [ ] No new errors in Log Analytics (check last 15 minutes)
- [ ] Database connectivity confirmed (health endpoint returns successfully)
- [ ] User login works (manual test)
- [ ] Core assessment workflow functional (manual test)
- [ ] No new crash loops in Container App system logs

### 5.2 Verification Sign-Off

| Area              | Verified By   | Status       | Timestamp       | Notes               |
|-------------------|---------------|--------------|-----------------|----------------------|
| Health Checks     | [NAME]        | [Pass/Fail]  | [HH:MM UTC]     |                      |
| Error Rates       | [NAME]        | [Pass/Fail]  | [HH:MM UTC]     |                      |
| Data Integrity    | [NAME]        | [Pass/Fail]  | [HH:MM UTC]     |                      |
| User Functionality| [NAME]        | [Pass/Fail]  | [HH:MM UTC]     |                      |

---

## 6. Post-Rollback Communication

### 6.1 Internal Communication

```
ROLLBACK COMPLETED -- [NEW_IMAGE_TAG] -> [PREVIOUS_IMAGE_TAG]

Time: [HH:MM UTC]
Reason: [BRIEF REASON FOR ROLLBACK]
Impact: [DESCRIPTION OF IMPACT DURING INCIDENT]
Duration of Impact: [XX minutes]
Current Status: Service restored, running [PREVIOUS_IMAGE_TAG]
Next Steps: [Root cause investigation, hotfix timeline]

Affected services:
- cmmc-api: rolled back to image tag [TAG]
- cmmc-web: rolled back to image tag [TAG]
- Database: [unchanged / restored to point-in-time YYYY-MM-DDTHH:MM]
```

### 6.2 External Communication (if applicable)

```
Subject: RESOLVED -- CMMC Assessor Platform Service Disruption

The issue affecting [DESCRIPTION] has been resolved as of [TIME UTC].
We have reverted to the previous stable version while we investigate.

Impact Duration: [XX minutes]
Data Loss: [None / DESCRIPTION]

We apologize for the inconvenience. For questions, contact support@intellisecsolutions.com.
```

---

## 7. Post-Rollback Investigation Process

| Step | Action                                             | Responsible     | Timeline            |
|------|----------------------------------------------------|-----------------|---------------------|
| 1    | Document the rollback in the project issue tracker  | Engineer        | Immediately         |
| 2    | Preserve logs from the failed deployment             | Engineer        | Within 1 hour       |
| 3    | Conduct root cause analysis                          | Engineer        | Within 24 hours     |
| 4    | Reproduce issue locally                              | Engineer        | Within 48 hours     |
| 5    | Develop fix with additional test coverage            | Engineer        | TBD based on RCA    |
| 6    | Test fix locally before re-deploying                 | Engineer        | Before re-release   |
| 7    | Re-deploy with monitoring                            | Engineer        | TBD                 |

---

## 8. Rollback Testing Schedule

**Status: NOT IMPLEMENTED** -- No regular rollback testing is conducted.

| Test Type                              | Frequency        | Scope                                       | Last Tested      | Next Scheduled   |
|----------------------------------------|------------------|---------------------------------------------|------------------|------------------|
| Container App image rollback           | NOT SCHEDULED    | Redeploy previous image, verify             | Never            | TBD              |
| Database point-in-time restore         | NOT SCHEDULED    | Restore to new server, verify data          | Never            | TBD              |
| Bicep infrastructure rollback          | NOT SCHEDULED    | Revert Bicep commit, what-if, apply         | Never            | TBD              |
| Full end-to-end rollback drill         | NOT SCHEDULED    | Simulate bad deployment, execute rollback    | Never            | TBD              |

### Planned Improvements

- Schedule quarterly rollback drills
- Test Container App image rollback procedure in production
- Test PostgreSQL point-in-time restore at least once
- Document results and improve procedures based on findings

---

## 9. Revision History

| Date           | Author               | Changes Made                              |
|----------------|-----------------------|-------------------------------------------|
| 2026-02-14     | IntelliSec Solutions  | Initial document creation                 |
