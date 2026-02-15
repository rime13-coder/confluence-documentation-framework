# Rollback Procedures

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Rollback Procedures                |
| Last Updated     | [YYYY-MM-DD]                       |
| Status           | [Draft / In Review / Approved]     |
| Owner            | [TEAM OR INDIVIDUAL NAME]          |

---

## 1. Document Purpose

This document defines the rollback procedures for all deployment types within the [PROJECT NAME] platform on Azure. It covers when to roll back versus roll forward, who can authorize a rollback, step-by-step procedures for each service type (App Service, AKS, Azure Functions, VMs, databases, and infrastructure), verification steps, and post-rollback processes.

---

## 2. Rollback Decision Criteria

### 2.1 When to Roll Back vs. Roll Forward

| Scenario                                          | Decision        | Rationale                                                    |
|---------------------------------------------------|-----------------|--------------------------------------------------------------|
| New deployment introduces a critical bug           | **Roll Back**   | Fastest path to restore service; fix can come later          |
| Deployment causes partial outage (>10% of users)  | **Roll Back**   | Blast radius too large; restore previous stable version      |
| Performance degradation >50% from baseline         | **Roll Back**   | Unacceptable user experience; investigate offline            |
| Data corruption detected                           | **Roll Back**   | Prevent further data damage; restore from backup if needed   |
| Minor bug affecting <1% of users with workaround   | **Roll Forward** | Impact is contained; faster to deploy a hotfix               |
| Fix is identified and can be deployed in <30 min   | **Roll Forward** | Fix is quicker than rollback process                         |
| Database migration is irreversible                 | **Roll Forward** | Rollback is not possible; must fix forward                   |
| [SCENARIO]                                        | [DECISION]      | [RATIONALE]                                                  |

### 2.2 Rollback Decision Flowchart

```
Is the deployment causing data corruption?
  YES -> ROLL BACK IMMEDIATELY
  NO  -> Continue

Is >10% of users impacted?
  YES -> Can we fix in <30 minutes?
    YES -> ROLL FORWARD
    NO  -> ROLL BACK
  NO  -> Continue

Is there a workaround?
  YES -> ROLL FORWARD (deploy hotfix in next cycle)
  NO  -> Can we fix in <30 minutes?
    YES -> ROLL FORWARD
    NO  -> ROLL BACK
```

---

## 3. Rollback Authority

| Decision Type                  | Authorized By                          | Notification Required                    |
|--------------------------------|----------------------------------------|------------------------------------------|
| Standard rollback (SEV 3/4)    | [On-Call Engineer + Team Lead]         | [Slack notification to #deployments]     |
| Urgent rollback (SEV 1/2)      | [On-Call Engineer (immediate, inform later)] | [Page SRE Lead + Incident Commander] |
| Rollback during change freeze  | [VP Engineering]                       | [Email to engineering-leads DL]          |
| Database rollback               | [DBA + Engineering Lead]              | [Slack + Email to data team]             |
| Infrastructure rollback         | [SRE Lead + Engineering Lead]         | [Slack + Email to infrastructure team]   |

**Important:** During a SEV 1 incident, the on-call engineer is authorized to initiate a rollback immediately without waiting for approval. Approvals can be obtained retroactively.

---

## 4. Rollback Procedures by Deployment Type

---

### 4.1 App Service Rollback

#### Method A: Deployment Slot Swap Back (Preferred)

**Prerequisites:**
- [ ] Previous version still running in the staging slot
- [ ] Slot swap is the deployment method used for the current release

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | Verify the staging slot still has the previous version                    | `az webapp deployment slot list --name [APP_NAME] --resource-group [RG_NAME]` |
| 2    | Check staging slot health                                                 | `curl https://[APP_NAME]-staging.azurewebsites.net/health`                   |
| 3    | Swap production back to staging slot                                      | `az webapp deployment slot swap --name [APP_NAME] --resource-group [RG_NAME] --slot staging --target-slot production` |
| 4    | Verify production is now running previous version                         | `curl https://[APP_NAME].azurewebsites.net/health` -- check version in response |
| 5    | Monitor Application Insights for 15 minutes                              | Verify error rates return to baseline                                        |

**Estimated Time:** 2-5 minutes

#### Method B: Redeploy Previous Version

**Prerequisites:**
- [ ] Previous deployment artifact available in GitHub Actions / artifact storage
- [ ] Previous version tag identified in Git

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | Identify previous version Git tag                                         | `git tag --sort=-version:refname \| head -5`                                |
| 2    | Trigger GitHub Actions deployment with previous version                   | Re-run deployment workflow with tag `[PREVIOUS_VERSION_TAG]`                 |
| 3    | Alternatively, deploy from CLI                                            | `az webapp deployment source config-zip --name [APP_NAME] --resource-group [RG_NAME] --src [PREVIOUS_ARTIFACT_PATH]` |
| 4    | Verify deployment succeeded                                               | Check health endpoint and Application Insights                               |
| 5    | Monitor for 15 minutes                                                    | Verify error rates return to baseline                                        |

**Estimated Time:** 5-15 minutes

---

### 4.2 AKS Rollback

#### Method A: Helm Rollback (Preferred for Helm-managed deployments)

**Prerequisites:**
- [ ] `kubectl` configured for the target AKS cluster
- [ ] Helm release history available

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | Connect to the AKS cluster                                               | `az aks get-credentials --name [AKS_NAME] --resource-group [RG_NAME]`        |
| 2    | List Helm release history                                                 | `helm history [RELEASE_NAME] -n [NAMESPACE]`                                |
| 3    | Identify the target revision number to roll back to                       | Note the revision number of the last known good release                      |
| 4    | Execute Helm rollback                                                     | `helm rollback [RELEASE_NAME] [REVISION_NUMBER] -n [NAMESPACE]`             |
| 5    | Verify rollback succeeded                                                 | `helm status [RELEASE_NAME] -n [NAMESPACE]`                                 |
| 6    | Check pod status                                                          | `kubectl get pods -n [NAMESPACE] -l app=[APP_LABEL]`                         |
| 7    | Verify pods are running the previous image                                | `kubectl describe pod -n [NAMESPACE] -l app=[APP_LABEL] \| grep Image`      |
| 8    | Check health endpoints                                                    | `curl https://[SERVICE_URL]/health`                                          |
| 9    | Monitor for 15 minutes                                                    | Verify error rates return to baseline in Application Insights                |

**Estimated Time:** 5-10 minutes

#### Method B: kubectl Rollout Undo

**Prerequisites:**
- [ ] `kubectl` configured for the target AKS cluster
- [ ] Deployment managed via `kubectl` (not Helm)

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | Connect to the AKS cluster                                               | `az aks get-credentials --name [AKS_NAME] --resource-group [RG_NAME]`        |
| 2    | Check rollout history                                                     | `kubectl rollout history deployment/[DEPLOYMENT_NAME] -n [NAMESPACE]`        |
| 3    | Undo the last rollout                                                     | `kubectl rollout undo deployment/[DEPLOYMENT_NAME] -n [NAMESPACE]`           |
| 4    | Or, undo to a specific revision                                           | `kubectl rollout undo deployment/[DEPLOYMENT_NAME] -n [NAMESPACE] --to-revision=[REV]` |
| 5    | Verify rollout status                                                     | `kubectl rollout status deployment/[DEPLOYMENT_NAME] -n [NAMESPACE]`         |
| 6    | Verify pods are healthy                                                   | `kubectl get pods -n [NAMESPACE] -l app=[APP_LABEL]`                         |
| 7    | Check health endpoints and monitor                                        | `curl https://[SERVICE_URL]/health`                                          |

**Estimated Time:** 3-7 minutes

---

### 4.3 Azure Functions Rollback

#### Redeploy Previous Package

**Prerequisites:**
- [ ] Previous deployment package available in artifact storage
- [ ] Previous version identified

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | Identify previous version to deploy                                       | Check GitHub Actions run history or artifact storage                          |
| 2    | Stop the Function App (optional, prevents processing during deploy)       | `az functionapp stop --name [FUNC_NAME] --resource-group [RG_NAME]`          |
| 3    | Deploy previous version package                                           | `az functionapp deployment source config-zip --name [FUNC_NAME] --resource-group [RG_NAME] --src [PREVIOUS_PACKAGE_PATH]` |
| 4    | Alternatively: Re-run GitHub Actions for previous version                 | Trigger deployment workflow with tag `[PREVIOUS_VERSION_TAG]`                |
| 5    | Start the Function App (if stopped in step 2)                             | `az functionapp start --name [FUNC_NAME] --resource-group [RG_NAME]`         |
| 6    | Verify Functions are executing                                            | Check Application Insights > Live Metrics or Invocation logs                 |
| 7    | Check for message processing (if queue-triggered)                         | Verify Service Bus queue messages are being consumed                         |
| 8    | Monitor for 15 minutes                                                    | Verify error rates return to baseline                                        |

**Estimated Time:** 5-15 minutes

---

### 4.4 Database Rollback

#### Migration Rollback Scripts

**Prerequisites:**
- [ ] Down migration scripts exist and have been tested
- [ ] Database backup taken before the current deployment
- [ ] DBA or authorized engineer available

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | **CRITICAL: Take a backup before rolling back**                          | Azure Portal > SQL Database > Export, or `az sql db export`                  |
| 2    | Identify migrations to reverse                                            | Check migration history: `SELECT * FROM __EFMigrationsHistory ORDER BY MigrationId DESC` (or equivalent) |
| 3    | Stop application traffic (if data-sensitive rollback)                     | Set App Service / AKS to maintenance mode or scale to 0                      |
| 4    | Execute down migration scripts                                            | For EF Core: `dotnet ef database update [TARGET_MIGRATION] --project [PROJECT]` |
| 5    | For manual SQL scripts: Execute in order                                  | Run rollback scripts: `[ROLLBACK_SCRIPT_1.sql]`, `[ROLLBACK_SCRIPT_2.sql]`   |
| 6    | Verify database schema matches expected state                             | Run schema comparison tool or validate key tables                             |
| 7    | Verify data integrity                                                     | Run data integrity checks: `[DATA_VALIDATION_QUERY]`                         |
| 8    | Restore application traffic                                               | Re-enable App Service / AKS                                                  |
| 9    | Roll back application code (see sections 4.1-4.3)                         | Application must match database schema version                               |

**Estimated Time:** 15-60 minutes (depends on migration complexity)

#### Point-in-Time Restore (Last Resort)

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | Identify the target restore point (before deployment)                     | Azure Portal > SQL Database > Backups > Point-in-time restore               |
| 2    | Restore to a new database                                                 | `az sql db restore --dest-name [DB_NAME]-restored --edition [EDITION] --name [DB_NAME] --resource-group [RG_NAME] --server [SERVER_NAME] --time [YYYY-MM-DDTHH:MM:SSZ]` |
| 3    | Validate restored database                                                | Connect and run validation queries                                           |
| 4    | Swap connection strings to point to restored database                     | Update Key Vault / App Configuration                                         |
| 5    | Restart application services                                              | Restart App Service, AKS pods, Functions                                     |

**Estimated Time:** 30-90 minutes

---

### 4.5 Infrastructure Rollback (IaC)

#### Terraform Rollback

**Prerequisites:**
- [ ] Previous Terraform state is available
- [ ] Git history for IaC repository accessible

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | Identify the Git commit of the last known good infrastructure state       | `git log --oneline infrastructure/`                                          |
| 2    | Create a revert commit or check out the previous version                  | `git revert [COMMIT_SHA]` or create a PR reverting the change                |
| 3    | Run Terraform plan to preview the rollback                                | `terraform plan -out=rollback.tfplan`                                        |
| 4    | **Review the plan carefully** -- ensure no unintended resource deletions  | Team review of plan output                                                   |
| 5    | Apply the rollback plan                                                   | `terraform apply rollback.tfplan`                                            |
| 6    | Verify resources are in expected state                                    | Check Azure Portal, run health checks                                        |
| 7    | Monitor for 30 minutes                                                    | Verify all services are healthy post infrastructure change                   |

**Estimated Time:** 15-60 minutes (depends on resource types)

#### Bicep Rollback

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | Identify the previous Bicep template version in Git                       | `git log --oneline infrastructure/`                                          |
| 2    | Create a revert commit or check out the previous version                  | `git revert [COMMIT_SHA]`                                                    |
| 3    | Run what-if to preview changes                                            | `az deployment group what-if --resource-group [RG_NAME] --template-file [TEMPLATE] --parameters [PARAMS]` |
| 4    | Review the what-if output                                                 | Ensure no unintended resource deletions                                      |
| 5    | Deploy the previous version                                               | `az deployment group create --resource-group [RG_NAME] --template-file [TEMPLATE] --parameters [PARAMS]` |
| 6    | Verify resources and monitor                                              | Check Azure Portal and health checks                                         |

**Estimated Time:** 15-60 minutes

---

## 5. Rollback Verification Steps

After completing any rollback, verify the following:

### 5.1 Universal Verification Checklist

- [ ] Application health check endpoints returning 200 OK
- [ ] Application version matches the expected rolled-back version
- [ ] Error rates in Application Insights returning to pre-deployment baseline
- [ ] Response latency (P95) within acceptable thresholds
- [ ] No new exceptions or error patterns in logs
- [ ] Database connectivity confirmed
- [ ] Cache connectivity confirmed
- [ ] Queue / message processing resumed (if applicable)
- [ ] Background jobs executing (if applicable)
- [ ] SSL/TLS certificates valid
- [ ] All external integrations responding correctly
- [ ] Monitoring dashboards showing healthy state
- [ ] Smoke tests passing (run automated suite if available)

### 5.2 Verification Sign-Off

| Area              | Verified By   | Status       | Timestamp       | Notes               |
|-------------------|---------------|--------------|-----------------|----------------------|
| Health Checks     | [NAME]        | [Pass/Fail]  | [HH:MM UTC]     |                      |
| Error Rates       | [NAME]        | [Pass/Fail]  | [HH:MM UTC]     |                      |
| Performance       | [NAME]        | [Pass/Fail]  | [HH:MM UTC]     |                      |
| Data Integrity    | [NAME]        | [Pass/Fail]  | [HH:MM UTC]     |                      |
| Integrations      | [NAME]        | [Pass/Fail]  | [HH:MM UTC]     |                      |
| Monitoring        | [NAME]        | [Pass/Fail]  | [HH:MM UTC]     |                      |

---

## 6. Post-Rollback Communication

### 6.1 Internal Communication

```
ROLLBACK COMPLETED -- [VERSION] -> [PREVIOUS VERSION]

Time: [HH:MM UTC]
Reason: [BRIEF REASON FOR ROLLBACK]
Impact: [DESCRIPTION OF IMPACT DURING INCIDENT]
Duration of Impact: [XX minutes]
Current Status: Service restored, running [PREVIOUS VERSION]
Next Steps: [Root cause investigation, hotfix timeline]

Incident ticket: [INC-XXXX]
```

### 6.2 External Communication (if applicable)

```
[RESOLVED] -- [SERVICE NAME] Service Disruption

The issue affecting [DESCRIPTION] has been resolved as of [TIME UTC].
We have reverted to the previous stable version while we investigate.

Impact Duration: [XX minutes]
Data Loss: [None / DESCRIPTION]

We apologize for the inconvenience and will share a post-mortem
within 48 hours.
```

---

## 7. Post-Rollback Investigation Process

| Step | Action                                             | Responsible     | Timeline            |
|------|----------------------------------------------------|-----------------|---------------------|
| 1    | Create investigation ticket                         | [On-Call]       | [Immediately]       |
| 2    | Preserve logs and telemetry from failed deployment  | [SRE]           | [Within 1 hour]     |
| 3    | Conduct root cause analysis                         | [Engineering]   | [Within 24 hours]   |
| 4    | Reproduce issue in non-production environment       | [Engineering]   | [Within 48 hours]   |
| 5    | Develop fix with additional test coverage           | [Engineering]   | [TBD based on RCA]  |
| 6    | Test fix in Dev and Staging environments            | [QA]            | [Before re-release] |
| 7    | Schedule re-release with additional monitoring      | [Release Manager]| [TBD]              |
| 8    | Conduct post-mortem (if SEV 1/2)                    | [IC]            | [Within 48 hours]   |

---

## 8. Rollback Testing Schedule

| Test Type                              | Frequency        | Scope                                       | Last Tested      | Next Scheduled   |
|----------------------------------------|------------------|---------------------------------------------|------------------|------------------|
| App Service slot swap rollback         | [Quarterly]      | [Swap staging to production and verify]     | [YYYY-MM-DD]     | [YYYY-MM-DD]     |
| AKS Helm rollback                      | [Quarterly]      | [Roll back one revision and verify]         | [YYYY-MM-DD]     | [YYYY-MM-DD]     |
| Functions redeploy previous version    | [Quarterly]      | [Deploy previous package and verify]        | [YYYY-MM-DD]     | [YYYY-MM-DD]     |
| Database migration rollback            | [Monthly]        | [Run down migration in staging]             | [YYYY-MM-DD]     | [YYYY-MM-DD]     |
| Infrastructure IaC rollback            | [Semi-annually]  | [Revert IaC commit, apply in staging]       | [YYYY-MM-DD]     | [YYYY-MM-DD]     |
| Full end-to-end rollback drill         | [Semi-annually]  | [Simulate bad deployment, execute full rollback] | [YYYY-MM-DD] | [YYYY-MM-DD]     |

### Rollback Test Results

| Test Date      | Test Type                    | Environment | Result      | Duration   | Issues Found             | Action Items               |
|----------------|------------------------------|-------------|-------------|------------|--------------------------|----------------------------|
| [YYYY-MM-DD]   | [App Service slot swap]      | [Staging]   | [Pass/Fail] | [X min]    | [ISSUES OR "None"]       | [ACTIONS OR "None"]        |
| [YYYY-MM-DD]   | [AKS Helm rollback]          | [Staging]   | [Pass/Fail] | [X min]    | [ISSUES OR "None"]       | [ACTIONS OR "None"]        |
| [YYYY-MM-DD]   | [Database migration rollback]| [Staging]   | [Pass/Fail] | [X min]    | [ISSUES OR "None"]       | [ACTIONS OR "None"]        |
| [DATE]         | [TYPE]                       | [ENV]       | [RESULT]    | [DURATION] | [ISSUES]                 | [ACTIONS]                  |

---

## 9. Revision History

| Date           | Author            | Changes Made                              |
|----------------|-------------------|-------------------------------------------|
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [Initial document creation]               |
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [DESCRIPTION OF CHANGES]                  |
