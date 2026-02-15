# Runbook

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Runbook -- [PROJECT NAME]          |
| Last Updated     | [YYYY-MM-DD]                       |
| Status           | [Draft / In Review / Approved]     |
| Owner            | [TEAM OR INDIVIDUAL NAME]          |

---

## 1. Application Overview

| Attribute                    | Value                                                 |
|------------------------------|-------------------------------------------------------|
| Application Name             | [PROJECT NAME]                                        |
| Description                  | [BRIEF DESCRIPTION OF WHAT THE APPLICATION DOES]      |
| Business Criticality         | [Tier 1 / Tier 2 / Tier 3]                            |
| Primary On-Call Team         | [TEAM NAME]                                           |
| On-Call Rotation Tool        | [PagerDuty / OpsGenie / Azure On-Call]                |
| Primary Region               | [East US]                                             |
| DR Region                    | [West US]                                             |
| Source Repository             | [https://github.com/ORG/REPO]                        |
| IaC Repository               | [https://github.com/ORG/INFRA-REPO]                  |
| CI/CD Pipeline               | [GitHub Actions]                                      |

---

## 2. Architecture Summary

```
[INSERT SIMPLIFIED ARCHITECTURE DIAGRAM FOR ON-CALL REFERENCE]

This should be a high-level diagram showing:
- User traffic flow (Internet -> Front Door/AGW -> AKS/App Service)
- Backend services (Functions, VMs)
- Data stores (SQL, Storage, Cache)
- External dependencies
- Monitoring (Application Insights)
```

### Key Components

| Component               | Azure Service              | Resource Name                   | Resource Group              | Purpose                              |
|--------------------------|----------------------------|---------------------------------|-----------------------------|--------------------------------------|
| Web Frontend            | [App Service]               | [app-web-prod-eus-001]          | [rg-app-prod-eus-001]      | [User-facing web application]        |
| API Layer               | [AKS]                      | [aks-app-prod-eus-001]          | [rg-app-prod-eus-001]      | [REST API services]                  |
| Background Jobs         | [Azure Functions]           | [func-proc-prod-eus-001]        | [rg-app-prod-eus-001]      | [Async processing, scheduled tasks]  |
| Legacy Service          | [Virtual Machine]           | [vm-legacy-prod-eus-001]        | [rg-app-prod-eus-001]      | [Legacy backend service]             |
| Primary Database        | [Azure SQL Database]        | [sql-db-prod-eus-001]           | [rg-data-prod-eus-001]     | [Relational data store]              |
| Cache                   | [Azure Cache for Redis]     | [redis-app-prod-eus-001]        | [rg-data-prod-eus-001]     | [Session and data caching]           |
| Blob Storage            | [Azure Storage]             | [stapprodeus001]                | [rg-data-prod-eus-001]     | [File and blob storage]              |
| Message Queue           | [Azure Service Bus]         | [sb-app-prod-eus-001]           | [rg-app-prod-eus-001]      | [Async messaging]                    |
| Secrets                 | [Azure Key Vault]           | [kv-app-prod-eus-001]           | [rg-infra-prod-eus-001]    | [Secrets and certificate management] |

---

## 3. Key URLs and Endpoints

| Environment | Application URL                  | Health Check Endpoint              | Status Page                     | Azure Portal Link                   |
|-------------|----------------------------------|------------------------------------|---------------------------------|-------------------------------------|
| Production  | [https://app.company.com]        | [https://app.company.com/health]   | [https://status.company.com]    | [AZURE PORTAL DEEP LINK]           |
| Staging     | [https://staging.company.com]    | [https://staging.company.com/health]| [N/A]                          | [AZURE PORTAL DEEP LINK]           |
| Development | [https://dev.internal.company.com]| [https://dev.internal.company.com/health] | [N/A]                   | [AZURE PORTAL DEEP LINK]           |

### Monitoring URLs

| Tool                    | URL                                              | Purpose                       |
|-------------------------|--------------------------------------------------|-------------------------------|
| Azure Portal            | [https://portal.azure.com]                       | Resource management           |
| Application Insights    | [DIRECT LINK TO APP INSIGHTS DASHBOARD]          | Application telemetry         |
| Grafana Dashboard       | [https://grafana.company.com/d/DASHBOARD_ID]     | Custom metrics dashboard      |
| Log Analytics           | [DIRECT LINK TO LOG ANALYTICS WORKSPACE]         | Log queries                   |
| Alert Dashboard         | [DIRECT LINK TO AZURE MONITOR ALERTS]            | Active alert management       |

---

## 4. Common Operational Procedures

### Table of Contents

| #  | Procedure                        | When to Use                                        | Estimated Duration |
|----|----------------------------------|----------------------------------------------------|--------------------|
| 4.1 | Application Restart             | Unresponsive application, memory leak suspected   | 5-10 minutes       |
| 4.2 | Scale Up / Scale Down           | High load or cost optimization                    | 5-15 minutes       |
| 4.3 | Database Maintenance            | Scheduled maintenance, index rebuild              | 30-60 minutes      |
| 4.4 | Certificate Renewal             | Certificate approaching expiry                    | 15-30 minutes      |
| 4.5 | Log Retrieval                   | Investigating issues, audit requests              | 5-15 minutes       |
| 4.6 | Cache Clear                     | Stale data, cache corruption suspected            | 5 minutes          |
| 4.7 | Feature Flag Toggle             | Enable/disable feature in production              | 5 minutes          |

---

### 4.1 Application Restart

**When to Use:** Application is unresponsive, returning 5xx errors consistently, or memory usage is abnormally high with no other clear cause.

**Prerequisites:**
- [ ] Azure portal access or Azure CLI configured
- [ ] Confirm the issue is not caused by an upstream dependency

**Steps:**

| Step | Action                                                                          | Command / Instructions                                                  |
|------|---------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| 1    | Verify current application status                                               | Check health endpoint: `curl https://app.company.com/health`            |
| 2    | Check Application Insights for errors                                           | Navigate to App Insights > Failures blade                               |
| 3    | **App Service restart**                                                          | `az webapp restart --name [APP_NAME] --resource-group [RG_NAME]`        |
| 4    | **AKS pod restart** (specific deployment)                                       | `kubectl rollout restart deployment/[DEPLOYMENT_NAME] -n [NAMESPACE]`   |
| 5    | **Azure Functions restart**                                                      | `az functionapp restart --name [FUNC_NAME] --resource-group [RG_NAME]`  |
| 6    | **VM restart**                                                                   | `az vm restart --name [VM_NAME] --resource-group [RG_NAME]`             |
| 7    | Wait for service to become healthy (allow [XX] seconds warm-up)                 | Monitor health endpoint and Application Insights                        |

**Verification:**
- [ ] Health check endpoint returns 200 OK
- [ ] Application Insights shows successful requests
- [ ] No new 5xx errors in the last 5 minutes

**Rollback:** If restart does not resolve the issue, escalate to [ESCALATION CONTACT] and consider rolling back to the previous deployment version.

---

### 4.2 Scale Up / Scale Down

**When to Use:** Sustained high CPU/memory usage (>80% for 15+ minutes) or planned high-traffic events; or scaling down after traffic normalizes.

**Prerequisites:**
- [ ] Confirm scaling limits with budget owner for cost implications
- [ ] Verify current resource utilization metrics

**Steps:**

| Step | Action                                                                 | Command / Instructions                                                                       |
|------|------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|
| 1    | Check current metrics (CPU, memory, request count)                     | Azure Portal > Metrics blade or Grafana dashboard                                            |
| 2    | **AKS: Scale node pool**                                               | `az aks nodepool scale --cluster-name [AKS_NAME] --name [POOL_NAME] --node-count [N] --resource-group [RG_NAME]` |
| 3    | **AKS: Scale deployment replicas**                                     | `kubectl scale deployment/[DEPLOYMENT_NAME] --replicas=[N] -n [NAMESPACE]`                   |
| 4    | **App Service: Scale up (change tier)**                                | `az appservice plan update --name [PLAN_NAME] --resource-group [RG_NAME] --sku [SKU]`        |
| 5    | **App Service: Scale out (add instances)**                             | `az appservice plan update --name [PLAN_NAME] --resource-group [RG_NAME] --number-of-workers [N]` |
| 6    | **VM: Resize**                                                          | `az vm resize --name [VM_NAME] --resource-group [RG_NAME] --size [NEW_SIZE]`                 |
| 7    | Monitor metrics after scaling                                          | Verify CPU/memory reduced, response times improved                                           |

**Verification:**
- [ ] Resource metrics show reduced utilization
- [ ] Response times within acceptable thresholds
- [ ] No errors introduced by scaling operation

**Rollback:** Reverse the scaling operation using the same commands with the original values.

---

### 4.3 Database Maintenance

**When to Use:** Scheduled maintenance windows, index fragmentation >30%, long-running query performance degradation.

**Prerequisites:**
- [ ] Maintenance window confirmed with stakeholders
- [ ] Database backup verified
- [ ] Read replica available for queries during maintenance

**Steps:**

| Step | Action                                                           | Command / Instructions                                                      |
|------|------------------------------------------------------------------|-----------------------------------------------------------------------------|
| 1    | Verify latest backup exists                                      | Azure Portal > SQL Database > Backups                                       |
| 2    | Check index fragmentation                                        | Run: `SELECT * FROM sys.dm_db_index_physical_stats(...)`                    |
| 3    | Rebuild fragmented indexes                                       | Run: `ALTER INDEX ALL ON [TABLE] REBUILD`                                   |
| 4    | Update statistics                                                | Run: `EXEC sp_updatestats`                                                  |
| 5    | Check for long-running queries                                   | Query `sys.dm_exec_requests` for queries running > [XX] seconds             |
| 6    | Verify DTU/vCore usage post-maintenance                          | Azure Portal > SQL Database > Metrics                                       |

**Verification:**
- [ ] Index fragmentation levels acceptable (<10%)
- [ ] Query performance metrics improved
- [ ] No blocked queries or deadlocks

**Rollback:** Index rebuilds do not require rollback. If performance degrades, restore from the latest backup.

---

### 4.4 Certificate Renewal

**When to Use:** Certificate expires within 30 days, certificate renewal alert triggered.

**Prerequisites:**
- [ ] Access to Azure Key Vault
- [ ] New certificate obtained from CA (if not auto-renewed)

**Steps:**

| Step | Action                                                              | Command / Instructions                                                   |
|------|---------------------------------------------------------------------|--------------------------------------------------------------------------|
| 1    | Check current certificate expiry                                    | `az keyvault certificate show --vault-name [KV_NAME] --name [CERT_NAME]`|
| 2    | Import new certificate to Key Vault (if manual)                     | `az keyvault certificate import --vault-name [KV_NAME] --name [CERT_NAME] --file [CERT_FILE]` |
| 3    | Update Application Gateway SSL binding (if applicable)              | Azure Portal > Application Gateway > Listeners > Update certificate      |
| 4    | Update AKS TLS secret (if applicable)                               | `kubectl create secret tls [SECRET_NAME] --cert=[CRT] --key=[KEY] -n [NS] --dry-run=client -o yaml \| kubectl apply -f -` |
| 5    | Restart affected services to pick up new certificate                | Restart App Service / AKS pods as per Section 4.1                        |
| 6    | Verify HTTPS connectivity with new certificate                      | `curl -vI https://app.company.com 2>&1 \| grep -i "expire"`             |

**Verification:**
- [ ] New certificate shows correct expiry date (>11 months)
- [ ] HTTPS connections successful with no certificate warnings
- [ ] SSL Labs test shows A+ rating (if public-facing)

**Rollback:** Re-import the previous certificate from Key Vault backup if the new certificate causes issues.

---

### 4.5 Log Retrieval

**When to Use:** Investigating production issues, responding to audit requests, debugging customer-reported problems.

**Prerequisites:**
- [ ] Access to Log Analytics workspace
- [ ] Application Insights access

**Steps:**

| Step | Action                                                        | Command / Instructions                                                               |
|------|---------------------------------------------------------------|--------------------------------------------------------------------------------------|
| 1    | **Application logs (App Insights)**                           | App Insights > Logs > `traces \| where timestamp > ago(1h) \| where message contains "[SEARCH_TERM]"` |
| 2    | **Request logs**                                               | App Insights > Logs > `requests \| where timestamp > ago(1h) \| where resultCode >= 500` |
| 3    | **AKS container logs**                                        | `kubectl logs deployment/[DEPLOYMENT_NAME] -n [NAMESPACE] --tail=500`                |
| 4    | **AKS container logs (previous instance)**                    | `kubectl logs deployment/[DEPLOYMENT_NAME] -n [NAMESPACE] --previous`                |
| 5    | **Azure resource logs (Log Analytics)**                       | Log Analytics > `AzureDiagnostics \| where ResourceType == "[TYPE]" \| where TimeGenerated > ago(1h)` |
| 6    | **VM logs**                                                    | Connect via Bastion, check `/var/log/` or Windows Event Viewer                       |
| 7    | **Export logs for external sharing**                           | App Insights > Logs > Export to CSV                                                  |

**Verification:**
- [ ] Relevant log entries retrieved successfully
- [ ] Sensitive data redacted before sharing externally

**Rollback:** N/A -- read-only operation.

---

### 4.6 Cache Clear

**When to Use:** Stale data suspected, cache corruption, after major data migration.

**Prerequisites:**
- [ ] Confirm clearing cache will not cause a thundering herd problem (gradual warm-up preferred)
- [ ] Notify team of potential temporary performance degradation

**Steps:**

| Step | Action                                                              | Command / Instructions                                                   |
|------|---------------------------------------------------------------------|--------------------------------------------------------------------------|
| 1    | Check current cache metrics (hit rate, memory)                      | Azure Portal > Redis Cache > Metrics                                     |
| 2    | **Clear specific cache keys (preferred)**                           | `redis-cli -h [REDIS_HOST] -p 6380 -a [PASSWORD] --tls DEL [KEY_PATTERN]` |
| 3    | **Flush entire cache (use with caution)**                           | `redis-cli -h [REDIS_HOST] -p 6380 -a [PASSWORD] --tls FLUSHALL`        |
| 4    | Monitor application performance after cache clear                   | Watch response times in Application Insights for 15 minutes              |

**Verification:**
- [ ] Cache metrics show fresh data being populated
- [ ] Application response times return to normal within [XX] minutes
- [ ] No increase in database load beyond acceptable thresholds

**Rollback:** Cache will repopulate automatically. If database load spikes, consider rate-limiting or feature-flagging cache-dependent features temporarily.

---

### 4.7 Feature Flag Toggle

**When to Use:** Enabling or disabling a feature in production, emergency feature kill switch.

**Prerequisites:**
- [ ] Feature flag name confirmed
- [ ] Impact of toggling assessed

**Steps:**

| Step | Action                                                         | Command / Instructions                                                          |
|------|----------------------------------------------------------------|---------------------------------------------------------------------------------|
| 1    | Identify feature flag name and current state                   | Azure App Configuration > Feature Manager > [FLAG_NAME]                         |
| 2    | Toggle feature flag                                            | `az appconfig feature set --name [APPCONFIG_NAME] --feature [FLAG_NAME] --label [ENVIRONMENT] --yes` |
| 3    | Enable: `az appconfig feature enable ...`                      | `az appconfig feature enable --name [APPCONFIG_NAME] --feature [FLAG_NAME] --label prod --yes` |
| 4    | Disable: `az appconfig feature disable ...`                    | `az appconfig feature disable --name [APPCONFIG_NAME] --feature [FLAG_NAME] --label prod --yes` |
| 5    | Verify application picks up the change (may require restart)   | Check application logs for feature flag refresh                                  |

**Verification:**
- [ ] Feature flag shows correct state in App Configuration
- [ ] Application behavior matches expected state
- [ ] No errors introduced by flag toggle

**Rollback:** Toggle the flag back to its previous state using the same commands.

---

## 5. Troubleshooting Guide

| # | Symptom                                        | Likely Cause                                    | Resolution                                                | Runbook Section |
|---|------------------------------------------------|-------------------------------------------------|-----------------------------------------------------------|-----------------|
| 1 | Application returns 503 errors                 | App Service / AKS pods not running              | Restart application (Section 4.1)                         | 4.1             |
| 2 | High response times (>5 seconds)               | Database CPU high, cache miss rate high         | Check SQL metrics, consider scaling DB or clearing cache  | 4.2, 4.6        |
| 3 | 500 errors on specific API endpoints           | Application exception, recent deployment issue  | Check App Insights exceptions, consider rollback          | 4.5             |
| 4 | Database connection timeout errors             | Connection pool exhausted, SQL firewall issue   | Check SQL connections, restart app, verify private endpoint| 4.3            |
| 5 | SSL certificate warning in browser             | Certificate expired or misconfigured            | Renew certificate (Section 4.4)                           | 4.4             |
| 6 | Messages not processing from queue             | Functions stopped, Service Bus dead-letter full  | Restart Functions, check dead-letter queue                 | 4.1             |
| 7 | VM unreachable                                  | VM stopped, NSG blocking, disk full             | Check VM status, restart if needed, check disk space       | 4.1             |
| 8 | AKS pods in CrashLoopBackOff                   | Application crash, misconfiguration, OOM kill   | Check pod logs, describe pod, check resource limits        | 4.5             |
| 9 | Deployment pipeline failing                    | GitHub Actions runner issue, credential expired | Check pipeline logs, verify service principal credentials  | N/A             |
| 10| Sudden spike in 429 (rate limit) errors        | API rate limiting triggered, DDoS attempt       | Check traffic patterns, adjust rate limits or WAF rules    | 4.2             |

---

## 6. Escalation Matrix

| Severity | Definition                                  | Response Time | Update Frequency | Escalation Path                                       | Contact Method |
|----------|---------------------------------------------|---------------|------------------|-------------------------------------------------------|----------------|
| SEV 1    | Complete outage, all users impacted         | 15 minutes    | Every 30 minutes | On-Call -> SRE Lead -> VP Engineering -> CTO          | [PagerDuty + Phone] |
| SEV 2    | Partial outage, major feature impacted      | 30 minutes    | Every 60 minutes | On-Call -> SRE Lead -> Engineering Manager            | [PagerDuty + Slack] |
| SEV 3    | Degraded performance, minor feature issue   | 2 hours       | Every 4 hours    | On-Call -> Team Lead                                   | [Slack + Email]     |
| SEV 4    | Cosmetic issue, no user impact              | Next business day | Daily          | Logged as ticket                                       | [Jira / Azure DevOps] |

---

## 7. Emergency Contacts

| Role                        | Name              | Phone               | Email                      | Slack Handle    | Availability           |
|-----------------------------|-------------------|----------------------|----------------------------|-----------------|------------------------|
| Primary On-Call              | [NAME]            | [+1-XXX-XXX-XXXX]   | [email@company.com]        | [@handle]       | [24/7 rotation]        |
| Secondary On-Call            | [NAME]            | [+1-XXX-XXX-XXXX]   | [email@company.com]        | [@handle]       | [24/7 rotation]        |
| SRE Lead                     | [NAME]            | [+1-XXX-XXX-XXXX]   | [email@company.com]        | [@handle]       | [Business hours + oncall] |
| DBA                          | [NAME]            | [+1-XXX-XXX-XXXX]   | [email@company.com]        | [@handle]       | [Business hours + oncall] |
| Engineering Manager          | [NAME]            | [+1-XXX-XXX-XXXX]   | [email@company.com]        | [@handle]       | [Business hours]       |
| VP Engineering               | [NAME]            | [+1-XXX-XXX-XXXX]   | [email@company.com]        | [@handle]       | [SEV1 only]            |
| Azure Support                | [N/A]             | [N/A]                | [N/A]                      | [N/A]           | [24/7 -- Premier/Unified] |
| Azure Support Ticket Portal  | [N/A]             | [N/A]                | [https://portal.azure.com] | [N/A]           | [24/7]                 |

---

## 8. Revision History

| Date           | Author            | Changes Made                              |
|----------------|-------------------|-------------------------------------------|
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [Initial document creation]               |
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [DESCRIPTION OF CHANGES]                  |
