# Runbook

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Runbook -- CMMC Assessor Platform  |
| Last Updated     | 2026-02-15                         |
| Status           | Draft                              |
| Owner            | IntelliSec Solutions               |

---

## 1. Application Overview

| Attribute                    | Value                                                 |
|------------------------------|-------------------------------------------------------|
| Application Name             | CMMC Assessor Platform                                |
| Description                  | A web-based platform for conducting CMMC (Cybersecurity Maturity Model Certification) assessments, managing assessment workflows, and generating compliance reports |
| Business Criticality         | Tier 2                                                |
| Primary On-Call Team         | NOT IMPLEMENTED -- no on-call rotation                |
| On-Call Rotation Tool        | NOT IMPLEMENTED                                       |
| Primary Region               | Canada Central                                        |
| DR Region                    | NOT IMPLEMENTED                                       |
| Source Repository             | GitHub (refer to team for repository URL)            |
| IaC Repository               | Same repository (infrastructure/ directory)          |
| CI/CD Pipeline               | GitHub Actions                                        |

---

## 2. Architecture Summary

```
Internet
   |
   +-- cmmc.intellisecops.com (CNAME)
   |      v
   |   cmmc-web (Container App, 0.25 CPU, 0.5Gi, 0-3 replicas)
   |      Next.js frontend
   |
   +-- api.cmmc.intellisecops.com (CNAME)
          v
       cmmc-api (Container App, 0.5 CPU, 1Gi, 0-3 replicas)
          Node.js/Express API
             |
             +-- psql-cmmc-assessor-prod (PostgreSQL Flexible, B1ms)
             |      Prisma ORM, AuditLog table
             +-- stcmmcassessorprod (Storage Account, Standard_LRS)
             +-- kv-cmmc-assessor-prod (Key Vault)

Supporting:
   +-- acrcmmcassessorprod (Container Registry, Basic)
   +-- log-cmmc-assessor-prod (Log Analytics, 30-day retention)
   +-- cae-cmmc-assessor-prod (Container Apps Environment, Consumption)
```

### Key Components

| Component               | Azure Service              | Resource Name                   | Resource Group              | Purpose                              |
|--------------------------|----------------------------|---------------------------------|-----------------------------|--------------------------------------|
| Web Frontend            | Container Apps              | cmmc-web                        | rg-cmmc-assessor-prod       | Next.js user-facing web application  |
| API Layer               | Container Apps              | cmmc-api                        | rg-cmmc-assessor-prod       | Node.js/Express REST API             |
| Primary Database        | PostgreSQL Flexible Server  | psql-cmmc-assessor-prod         | rg-cmmc-assessor-prod       | Relational data store (Prisma ORM)   |
| Blob Storage            | Storage Account             | stcmmcassessorprod              | rg-cmmc-assessor-prod       | File and document storage            |
| Secrets                 | Key Vault                   | kv-cmmc-assessor-prod           | rg-cmmc-assessor-prod       | Secrets and configuration management |
| Container Images        | Container Registry          | acrcmmcassessorprod             | rg-cmmc-assessor-prod       | Docker image storage                 |
| Logs                    | Log Analytics Workspace     | log-cmmc-assessor-prod          | rg-cmmc-assessor-prod       | Centralized log aggregation          |

---

## 3. Key URLs and Endpoints

| Environment | Application URL                          | Health Check Endpoint                        | Status Page                     |
|-------------|------------------------------------------|----------------------------------------------|---------------------------------|
| Production  | https://cmmc.intellisecops.com           | https://api.cmmc.intellisecops.com/api/health | N/A (no status page)           |

> **Note:** The health endpoint (`GET /api/health`) has been cleaned up to return only a status indicator (F-38 resolved).

### Monitoring URLs

| Tool                    | URL                                              | Purpose                       |
|-------------------------|--------------------------------------------------|-------------------------------|
| Azure Portal            | https://portal.azure.com                         | Resource management           |
| Log Analytics           | Azure Portal > log-cmmc-assessor-prod            | Log queries (KQL)             |

> **Note:** Application Insights is NOT IMPLEMENTED. There is no Grafana dashboard or custom alerting dashboard.

---

## 4. Common Operational Procedures

### Table of Contents

| #  | Procedure                        | When to Use                                        | Estimated Duration |
|----|----------------------------------|----------------------------------------------------|--------------------|
| 4.1 | Container App Restart           | Unresponsive application, memory issues            | 2-5 minutes        |
| 4.2 | Scale Up / Scale Down           | High load or cost optimization                     | 2-5 minutes        |
| 4.3 | Database Maintenance            | Performance issues, storage concerns               | 15-30 minutes      |
| 4.4 | Log Retrieval                   | Investigating issues, audit requests               | 5-15 minutes       |
| 4.5 | Force New Deployment            | Stuck deployment, container image update            | 5-10 minutes       |
| 4.6 | Database Backup Restore         | Data recovery needed                                | 30-60 minutes      |

---

### 4.1 Container App Restart

**When to Use:** Application is unresponsive, returning 5xx errors consistently, or container is in a crash loop.

**Prerequisites:**
- [ ] Azure CLI installed and logged in (`az login`)
- [ ] Confirm the issue is not caused by a database or upstream dependency

**Steps:**

| Step | Action                                                                          | Command / Instructions                                                  |
|------|---------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| 1    | Verify current application status                                               | `curl -s https://api.cmmc.intellisecops.com/api/health`                 |
| 2    | Check Container App status                                                      | `az containerapp show --name cmmc-api --resource-group rg-cmmc-assessor-prod --query "properties.runningStatus"` |
| 3    | Restart the backend API Container App                                           | `az containerapp revision restart --name cmmc-api --resource-group rg-cmmc-assessor-prod --revision $(az containerapp revision list --name cmmc-api --resource-group rg-cmmc-assessor-prod --query "[0].name" -o tsv)` |
| 4    | Restart the frontend Web Container App                                          | `az containerapp revision restart --name cmmc-web --resource-group rg-cmmc-assessor-prod --revision $(az containerapp revision list --name cmmc-web --resource-group rg-cmmc-assessor-prod --query "[0].name" -o tsv)` |
| 5    | Alternatively, create a new revision to force restart                           | `az containerapp update --name cmmc-api --resource-group rg-cmmc-assessor-prod --set-env-vars RESTART_TRIGGER=<timestamp>` |
| 6    | Wait for the service to become healthy (allow 30-60 seconds for cold start)     | `curl -s https://api.cmmc.intellisecops.com/api/health`                 |

**Verification:**
- [ ] Health check endpoint returns 200 OK
- [ ] Application is accessible at https://cmmc.intellisecops.com
- [ ] Check Log Analytics for new errors in the last 5 minutes

**Rollback:** If restart does not resolve the issue, consider redeploying the previous container image (see Section 4.5 or Rollback Procedures document).

---

### 4.2 Scale Up / Scale Down

**When to Use:** Sustained high response times, or scaling down after traffic normalizes to reduce cost.

**Prerequisites:**
- [ ] Azure CLI installed and logged in
- [ ] Understand cost implications (Container Apps consumption billing)

**Steps:**

| Step | Action                                                                 | Command / Instructions                                                                       |
|------|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| 1    | Check current replica count                                            | `az containerapp revision list --name cmmc-api --resource-group rg-cmmc-assessor-prod --query "[].{name:name, replicas:properties.replicas}" -o table` |
| 2    | Scale backend API (adjust max replicas)                                | `az containerapp update --name cmmc-api --resource-group rg-cmmc-assessor-prod --min-replicas 1 --max-replicas 5` |
| 3    | Scale frontend web (adjust max replicas)                               | `az containerapp update --name cmmc-web --resource-group rg-cmmc-assessor-prod --min-replicas 1 --max-replicas 5` |
| 4    | To scale back down (restore defaults)                                  | `az containerapp update --name cmmc-api --resource-group rg-cmmc-assessor-prod --min-replicas 0 --max-replicas 3` |
| 5    | To disable scale-to-zero temporarily (prevent cold starts)             | `az containerapp update --name cmmc-api --resource-group rg-cmmc-assessor-prod --min-replicas 1` |
| 6    | Monitor response times after scaling                                   | Check Log Analytics for request duration                                                     |

**Verification:**
- [ ] New replica count confirmed
- [ ] Response times within acceptable thresholds
- [ ] No errors introduced by scaling operation

**Rollback:** Reverse the scaling operation using the same commands with the original values (`--min-replicas 0 --max-replicas 3`).

---

### 4.3 Database Maintenance

**When to Use:** Slow queries, storage approaching capacity, or scheduled maintenance.

**Prerequisites:**
- [ ] Access to PostgreSQL via psql or Azure Portal
- [ ] Maintenance window communicated to team

**Steps:**

| Step | Action                                                           | Command / Instructions                                                      |
|------|------------------------------------------------------------------|-----------------------------------------------------------------------------|
| 1    | Check database storage usage                                     | `az postgres flexible-server show --name psql-cmmc-assessor-prod --resource-group rg-cmmc-assessor-prod --query "{storageSizeGb:storage.storageSizeGb, storageUsed:storage.storageUsedInMb}"` |
| 2    | Check active connections                                         | Connect via psql: `SELECT count(*) FROM pg_stat_activity;`                  |
| 3    | Identify slow queries                                            | `SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;` |
| 4    | Run VACUUM ANALYZE on tables                                     | `VACUUM ANALYZE;`                                                           |
| 5    | Check index health                                               | `SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan ASC;` |
| 6    | Check Prisma migration status                                   | `npx prisma migrate status` (from application directory)                    |
| 7    | Verify database performance post-maintenance                    | Check query response times via application health endpoint                  |

**Verification:**
- [ ] Storage usage within acceptable limits (<80%)
- [ ] No long-running queries blocking operations
- [ ] Application response times normal

---

### 4.4 Log Retrieval

**When to Use:** Investigating production issues, responding to audit requests, debugging customer-reported problems.

**Prerequisites:**
- [ ] Access to Azure Portal / Log Analytics workspace

**Steps:**

| Step | Action                                                        | Command / Instructions                                                               |
|------|---------------------------------------------------------------|--------------------------------------------------------------------------------------|
| 1    | **Container App logs (backend API)**                          | Azure Portal > log-cmmc-assessor-prod > Logs: `ContainerAppConsoleLogs_CL \| where ContainerAppName_s == "cmmc-api" \| where TimeGenerated > ago(1h) \| order by TimeGenerated desc` |
| 2    | **Container App logs (frontend)**                             | `ContainerAppConsoleLogs_CL \| where ContainerAppName_s == "cmmc-web" \| where TimeGenerated > ago(1h) \| order by TimeGenerated desc` |
| 3    | **System logs for Container Apps**                            | `ContainerAppSystemLogs_CL \| where TimeGenerated > ago(1h) \| order by TimeGenerated desc` |
| 4    | **Search for specific error messages**                        | `ContainerAppConsoleLogs_CL \| where Log_s contains "error" \| where TimeGenerated > ago(24h) \| order by TimeGenerated desc` |
| 5    | **Via Azure CLI (stream logs)**                               | `az containerapp logs show --name cmmc-api --resource-group rg-cmmc-assessor-prod --follow` |
| 6    | **Export logs for external sharing**                          | Azure Portal > Log Analytics > Logs > Export to CSV                                  |

> **Note:** Logs now use pino structured JSON format (F-30 resolved). Log entries are machine-parseable and can be queried efficiently in Log Analytics using JSON field extraction.

**Verification:**
- [ ] Relevant log entries retrieved successfully
- [ ] Sensitive data redacted before sharing externally

---

### 4.5 Force New Deployment

**When to Use:** Need to redeploy the current or a specific container image, or deploy a hotfix.

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | List available images in ACR                                              | `az acr repository show-tags --name acrcmmcassessorprod --repository cmmc-api --output table` |
| 2    | Deploy a specific image tag to the backend API                            | `az containerapp update --name cmmc-api --resource-group rg-cmmc-assessor-prod --image acrcmmcassessorprod.azurecr.io/cmmc-api:<TAG>` |
| 3    | Deploy a specific image tag to the frontend                               | `az containerapp update --name cmmc-web --resource-group rg-cmmc-assessor-prod --image acrcmmcassessorprod.azurecr.io/cmmc-web:<TAG>` |
| 4    | Alternatively, trigger the CD workflow from GitHub                        | Go to GitHub Actions > select workflow > Run workflow (workflow_dispatch)     |
| 5    | Verify deployment                                                         | `curl -s https://api.cmmc.intellisecops.com/api/health`                      |
| 6    | Check revision status                                                     | `az containerapp revision list --name cmmc-api --resource-group rg-cmmc-assessor-prod -o table` |

---

### 4.6 Database Backup Restore

**When to Use:** Data corruption or accidental deletion requiring point-in-time recovery.

**Steps:**

| Step | Action                                                                    | Command / Instructions                                                       |
|------|---------------------------------------------------------------------------|------------------------------------------------------------------------------|
| 1    | Identify the target restore point (before the issue occurred)             | Determine timestamp in UTC                                                   |
| 2    | Restore PostgreSQL to a new server                                        | `az postgres flexible-server restore --resource-group rg-cmmc-assessor-prod --name psql-cmmc-assessor-restore --source-server psql-cmmc-assessor-prod --restore-time "YYYY-MM-DDTHH:MM:SSZ"` |
| 3    | Validate restored database                                                | Connect to the restored server and run validation queries                    |
| 4    | Update application connection string                                      | Update Key Vault secret with new server hostname, then restart Container Apps |
| 5    | Verify application connectivity                                           | `curl -s https://api.cmmc.intellisecops.com/api/health`                      |
| 6    | Delete old server (if replacing) or swap DNS                              | `az postgres flexible-server delete --name psql-cmmc-assessor-prod --resource-group rg-cmmc-assessor-prod` (use with extreme caution) |

> **WARNING:** This procedure has never been tested. Estimated time is 30-60 minutes but actual time is unknown.

---

## 5. Troubleshooting Guide

| # | Symptom                                        | Likely Cause                                    | Resolution                                                | Runbook Section |
|---|------------------------------------------------|-------------------------------------------------|-----------------------------------------------------------|-----------------|
| 1 | Application returns 502/503 errors             | Container App replicas not running (scale-to-zero cold start) | Wait 30-60s for cold start, or set min-replicas to 1 | 4.2             |
| 2 | Slow API responses (>5 seconds)                | Database connection issues, cold start          | Check database connectivity, restart Container App        | 4.1, 4.3        |
| 3 | 500 errors on API endpoints                    | Application exception, database migration issue | Check Container App logs in Log Analytics                 | 4.4             |
| 4 | Database connection timeout                    | Connection pool exhausted, PostgreSQL firewall   | Check PostgreSQL status, restart API Container App        | 4.1, 4.3        |
| 5 | Container App stuck in provisioning            | Image pull failure, ACR authentication issue    | Check ACR credentials, verify image tag exists             | 4.5             |
| 6 | Health endpoint returns config info            | Resolved (F-38)                                 | Health endpoint cleaned up; returns only status indicator  | N/A             |
| 7 | CORS errors in browser                         | CORS misconfiguration                           | Check Bicep CORS settings, verify allowed origins          | N/A             |
| 8 | Prisma migration fails on startup             | Schema conflict, database connectivity          | Check migration status, review Prisma logs                 | 4.3, 4.4        |
| 9 | Deployment pipeline failing                    | GitHub Actions runner issue, ACR push failure   | Check pipeline logs, verify service principal credentials  | N/A             |
| 10| Cannot access Azure resources                  | Service principal credentials expired           | Rotate credentials in GitHub Secrets                       | N/A             |

---

## 6. Escalation Matrix

| Severity | Definition                                  | Response Time      | Update Frequency   | Escalation Path                                       | Contact Method        |
|----------|---------------------------------------------|--------------------|--------------------|-------------------------------------------------------|-----------------------|
| SEV 1    | Complete outage, all users impacted         | Best effort        | As needed          | Team lead (no formal escalation path)                 | Email / direct message |
| SEV 2    | Partial outage, major feature impacted      | Best effort        | As needed          | Team lead                                              | Email / direct message |
| SEV 3    | Degraded performance, minor feature issue   | Next business day  | Daily              | Logged as issue                                        | Email                  |
| SEV 4    | Cosmetic issue, no user impact              | Backlog            | N/A                | Logged as issue                                        | Issue tracker          |

> **Status:** Formal escalation paths, response times, and on-call rotations are NOT IMPLEMENTED.

---

## 7. Emergency Contacts

| Role                        | Name              | Email                                  | Availability           |
|-----------------------------|-------------------|----------------------------------------|------------------------|
| Support Contact             | IntelliSec Solutions | support@intellisecsolutions.com     | Business hours         |
| Azure Support               | N/A               | https://portal.azure.com               | Per Azure support plan |

> **Status:** Formal on-call rotation and emergency contacts are NOT IMPLEMENTED. No PagerDuty, OpsGenie, or similar on-call management tool is in use.

### Planned Improvements

- Establish an on-call rotation
- Define formal escalation paths with response time SLAs
- Set up alerting integration with an on-call management tool

---

## 8. Revision History

| Date           | Author               | Changes Made                              |
|----------------|-----------------------|-------------------------------------------|
| 2026-02-14     | IntelliSec Solutions  | Initial document creation                 |
| 2026-02-15     | IntelliSec Solutions  | Updated: F-30 (structured logging) and F-38 (health endpoint) resolved |
