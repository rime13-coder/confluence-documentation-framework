# Disaster Recovery & Business Continuity

| **Metadata**     | **Value**                                    |
|------------------|----------------------------------------------|
| Page Title       | Disaster Recovery & Business Continuity      |
| Last Updated     | [YYYY-MM-DD]                                 |
| Status           | [Draft / In Review / Approved]               |
| Owner            | [TEAM OR INDIVIDUAL NAME]                    |

---

## 1. Document Purpose

This document defines the Disaster Recovery (DR) and Business Continuity (BC) strategy for the [PROJECT NAME] platform on Azure. It covers business impact analysis, DR architecture, failover procedures, data backup strategies, testing schedules, and communication plans for disaster scenarios.

---

## 2. Business Impact Analysis Summary

| Application / Service   | RPO (Recovery Point Objective) | RTO (Recovery Time Objective) | MTPD (Max Tolerable Period of Disruption) | Priority | Business Impact if Unavailable          |
|--------------------------|-------------------------------|-------------------------------|-------------------------------------------|----------|-----------------------------------------|
| [Web Application]        | [15 minutes]                  | [1 hour]                      | [4 hours]                                 | [P1]     | [Revenue loss, customer impact]         |
| [API Services]           | [15 minutes]                  | [1 hour]                      | [4 hours]                                 | [P1]     | [Downstream system failures]            |
| [Background Processing]  | [1 hour]                      | [4 hours]                     | [8 hours]                                 | [P2]     | [Delayed processing, queue buildup]     |
| [Reporting / Analytics]  | [4 hours]                     | [8 hours]                     | [24 hours]                                | [P3]     | [No real-time reporting available]      |
| [Internal Tools]         | [24 hours]                    | [24 hours]                    | [48 hours]                                | [P4]     | [Reduced operational efficiency]        |
| [SERVICE NAME]           | [RPO]                         | [RTO]                         | [MTPD]                                    | [PRIORITY]| [IMPACT]                               |

### Key Definitions

| Term | Definition                                                                                  |
|------|---------------------------------------------------------------------------------------------|
| RPO  | Maximum acceptable amount of data loss measured in time                                      |
| RTO  | Maximum acceptable time to restore service after a disaster                                  |
| MTPD | Maximum time the business can tolerate an outage before irreversible impact                  |

---

## 3. DR Strategy

| Attribute                        | Value                                                     |
|----------------------------------|-----------------------------------------------------------|
| DR Strategy Type                 | [Active-Active / Active-Passive / Pilot Light / Backup-Restore] |
| Primary Region                   | [East US]                                                 |
| DR Region                        | [West US]                                                 |
| Region Pair                      | [Yes -- Azure paired region]                              |
| Failover Type                    | [Automatic / Manual with runbook]                         |
| DNS Failover                     | [Azure Traffic Manager / Front Door]                      |
| Data Replication Strategy        | [Synchronous / Asynchronous]                              |
| Estimated Failover Time          | [XX minutes]                                              |
| Estimated Failback Time          | [XX minutes]                                              |

### Strategy Rationale

[EXPLAIN WHY THIS DR STRATEGY WAS CHOSEN, considering RPO/RTO requirements, cost, complexity, and business requirements. For example: "Active-Passive was selected because the RPO of 15 minutes is achievable with asynchronous geo-replication, and the cost of running a full Active-Active deployment is not justified given the application's usage patterns."]

---

## 4. DR Architecture Diagram

```
[INSERT DR ARCHITECTURE DIAGRAM]

The diagram should illustrate:
- Primary region deployment (all services)
- DR region deployment (services, scaled-down or pilot light)
- Data replication paths between regions
- DNS / traffic routing (Traffic Manager / Front Door)
- Shared services (if any) that span regions
- Network connectivity between regions (Global VNet Peering)

Recommended tool: draw.io, Visio, or Azure Architecture Diagram
Export as PNG and embed in Confluence page.
```

---

## 5. Azure Services DR Configuration

| Service                  | Resource (Primary)          | DR Mechanism                       | Recovery Region | Auto-Failover | DR Resource (Secondary)        | Current Status  |
|--------------------------|-----------------------------|-------------------------------------|-----------------|---------------|--------------------------------|-----------------|
| AKS                      | [aks-app-prod-eus-001]      | [Redeployment from IaC + ACR geo-rep]| [West US]      | [No]          | [aks-app-dr-wus-001]           | [Pilot Light]   |
| App Service              | [app-web-prod-eus-001]      | [Redeployment / ASR]               | [West US]       | [No]          | [app-web-dr-wus-001]           | [Standby]       |
| Azure Functions          | [func-proc-prod-eus-001]    | [Redeployment from IaC]            | [West US]       | [No]          | [func-proc-dr-wus-001]         | [Pilot Light]   |
| Azure SQL Database       | [sql-db-prod-eus-001]       | [Active Geo-Replication]           | [West US]       | [Yes - Auto-failover group] | [sql-db-dr-wus-001]  | [Active]  |
| Azure Storage            | [stapprodeus001]            | [GRS / RA-GRS]                     | [West US]       | [Manual failover] | [RA-GRS secondary]          | [Active]        |
| Azure Key Vault          | [kv-app-prod-eus-001]       | [Soft delete + backup/restore]     | [West US]       | [No]          | [kv-app-dr-wus-001]            | [Backup only]   |
| Azure Service Bus        | [sb-app-prod-eus-001]       | [Geo-DR pairing]                   | [West US]       | [Yes]         | [sb-app-dr-wus-001]            | [Active]        |
| Container Registry       | [acrprodeus001]             | [Geo-replication]                  | [West US]       | [Automatic]   | [Same ACR, replicated]         | [Active]        |
| Application Gateway      | [agw-app-prod-eus-001]      | [Redeployment from IaC]            | [West US]       | [No]          | [agw-app-dr-wus-001]           | [Pilot Light]   |
| Virtual Machines         | [vm-legacy-prod-eus-001]    | [Azure Site Recovery (ASR)]        | [West US]       | [Manual]      | [ASR replicated VM]            | [Replicating]   |
| [SERVICE]                | [PRIMARY RESOURCE]          | [DR MECHANISM]                     | [REGION]        | [Y/N]         | [SECONDARY RESOURCE]           | [STATUS]        |

---

## 6. Data Backup Strategy

| Data Store               | Backup Method                    | Frequency           | Retention              | Storage Location             | Recovery Procedure              | Last Tested     |
|--------------------------|----------------------------------|---------------------|------------------------|-----------------------------|---------------------------------|-----------------|
| Azure SQL Database       | [Automated backups (PITR)]       | [Continuous]        | [35 days short-term, LTR: weekly 4 wk, monthly 12 mo, yearly 5 yr] | [Geo-redundant] | [Point-in-time restore via portal/CLI] | [YYYY-MM-DD] |
| Azure Storage (Blobs)    | [Blob versioning + soft delete]  | [Continuous]        | [Versioning: unlimited, Soft delete: 30 days]  | [RA-GRS paired region] | [Restore previous version / undelete] | [YYYY-MM-DD] |
| Cosmos DB (if used)      | [Continuous backup]              | [Continuous]        | [30 days]              | [Geo-redundant]             | [Point-in-time restore]         | [YYYY-MM-DD]    |
| VM Disks                 | [Azure Backup]                   | [Daily]             | [30 days daily, 12 monthly] | [Recovery Services Vault - GRS] | [Restore VM from backup]   | [YYYY-MM-DD]    |
| AKS (etcd / PV)          | [Velero + Azure Blob]            | [Every 6 hours]     | [14 days]              | [Azure Storage - GRS]       | [Velero restore]                | [YYYY-MM-DD]    |
| Key Vault Secrets        | [Manual backup / export]         | [On change]         | [Soft delete: 90 days] | [Key Vault - same region]   | [Restore from backup]           | [YYYY-MM-DD]    |
| App Configuration        | [Export to file / Git]           | [On change]         | [Git history]          | [Git repository]            | [Import from export file]       | [YYYY-MM-DD]    |
| [DATA STORE]             | [METHOD]                         | [FREQUENCY]         | [RETENTION]            | [LOCATION]                  | [PROCEDURE]                     | [DATE]          |

---

## 7. DR Runbook: Failover Procedure

### 7.1 Failover Decision

| Criteria                              | Threshold                                    |
|---------------------------------------|----------------------------------------------|
| Primary region total outage           | [Azure status page confirms region outage]   |
| Multiple services unavailable         | [>50% of critical services impacted]         |
| Estimated recovery by Azure           | [Exceeds RTO]                                |
| Failover authorization                | [CTO / VP Engineering / SRE Lead]            |

### 7.2 Failover Steps

| Step | Action                                                       | Responsible      | Estimated Time | Verification                         |
|------|--------------------------------------------------------------|------------------|----------------|--------------------------------------|
| 1    | Declare disaster and activate DR plan                        | [Incident Commander] | [5 min]     | [Communication sent to stakeholders] |
| 2    | Verify data replication status (SQL, Storage, Service Bus)   | [DBA / SRE]      | [10 min]       | [Replication lag < RPO]              |
| 3    | Initiate SQL failover group failover                         | [DBA]            | [5 min]        | [DR database is read-write]          |
| 4    | Initiate Storage account failover (if needed)                | [SRE]            | [15 min]       | [Storage accessible in DR region]    |
| 5    | Scale up DR AKS cluster (if pilot light)                     | [SRE]            | [10 min]       | [Nodes are ready]                    |
| 6    | Deploy latest application version to DR AKS                  | [SRE]            | [15 min]       | [Pods are running and healthy]       |
| 7    | Scale up DR App Service (if standby)                         | [SRE]            | [5 min]        | [App Service responding]             |
| 8    | Deploy latest application to DR App Service                  | [SRE]            | [10 min]       | [Health check passing]               |
| 9    | Deploy Azure Functions to DR region                          | [SRE]            | [10 min]       | [Functions executing]                |
| 10   | Start ASR failover for VMs                                   | [SRE]            | [15 min]       | [VMs running in DR region]           |
| 11   | Update DNS / Traffic Manager to route to DR region           | [SRE]            | [5 min]        | [Traffic routing to DR region]       |
| 12   | Verify all health checks passing                             | [SRE + QA]       | [15 min]       | [All endpoints healthy]              |
| 13   | Run smoke tests against DR deployment                        | [QA]             | [15 min]       | [Critical paths verified]            |
| 14   | Communicate "service restored" to stakeholders               | [Comms Lead]     | [5 min]        | [Communication sent]                 |

**Total Estimated Failover Time: [~2 hours]**

### 7.3 Failover Verification Checklist

- [ ] All databases accessible and read-write in DR region
- [ ] All application services responding to health checks
- [ ] SSL/TLS certificates valid in DR region
- [ ] DNS resolution pointing to DR region endpoints
- [ ] Monitoring and alerting active for DR deployment
- [ ] Background jobs and scheduled tasks running
- [ ] External integrations connecting successfully
- [ ] Smoke tests passing for all critical user journeys

---

## 8. DR Testing

### 8.1 Testing Schedule

| Test Type                 | Frequency        | Scope                                        | Duration    | Next Scheduled     |
|---------------------------|------------------|----------------------------------------------|-------------|--------------------|
| Tabletop Exercise         | [Quarterly]      | [Walk through failover procedure with team]  | [2 hours]   | [YYYY-MM-DD]       |
| Component Failover Test   | [Monthly]        | [Test individual service failover: SQL, etc.] | [1 hour]    | [YYYY-MM-DD]       |
| Full DR Failover Test     | [Semi-annually]  | [Complete failover to DR region]             | [4 hours]   | [YYYY-MM-DD]       |
| Backup Restore Test       | [Monthly]        | [Restore from backup, verify data integrity] | [2 hours]   | [YYYY-MM-DD]       |

### 8.2 DR Test Results

| Test Date      | Test Type              | Scenario                         | Result       | RTO Achieved | RPO Achieved | Issues Found                      | Action Items                |
|----------------|------------------------|----------------------------------|--------------|--------------|--------------|-----------------------------------|-----------------------------|
| [YYYY-MM-DD]   | [Full Failover]        | [Simulated primary region outage]| [Pass/Fail]  | [XX min]     | [XX min]     | [ISSUES FOUND DURING TEST]        | [ACTION ITEMS FROM TEST]    |
| [YYYY-MM-DD]   | [Component Failover]   | [SQL failover group test]        | [Pass/Fail]  | [XX min]     | [XX min]     | [ISSUES FOUND]                    | [ACTION ITEMS]              |
| [YYYY-MM-DD]   | [Backup Restore]       | [SQL PITR to new server]         | [Pass/Fail]  | [N/A]        | [XX min]     | [ISSUES FOUND]                    | [ACTION ITEMS]              |
| [DATE]         | [TYPE]                 | [SCENARIO]                       | [RESULT]     | [RTO]        | [RPO]        | [ISSUES]                          | [ACTIONS]                   |

---

## 9. Communication Plan During Disaster

### 9.1 Communication Matrix

| Audience               | Channel                          | Frequency                      | Responsible            | Template Location       |
|------------------------|----------------------------------|--------------------------------|------------------------|-------------------------|
| Executive Leadership   | [Email + Phone]                  | [Every 30 minutes during SEV1] | [Incident Commander]   | [LINK TO TEMPLATE]      |
| Engineering Team       | [Slack #incident-channel / Teams]| [Continuous]                   | [Technical Lead]       | [LINK TO TEMPLATE]      |
| Customer Support       | [Email + Slack]                  | [Every 30 minutes]             | [Communications Lead]  | [LINK TO TEMPLATE]      |
| External Customers     | [Status page + Email]            | [Every 60 minutes]             | [Communications Lead]  | [LINK TO TEMPLATE]      |
| Partners / Vendors     | [Email]                          | [On status change]             | [Communications Lead]  | [LINK TO TEMPLATE]      |

### 9.2 Communication Templates

**Initial Notification:**
> **Subject:** [SEVERITY] -- [PROJECT NAME] Service Disruption -- [REGION/SERVICE]
>
> We are currently experiencing a service disruption affecting [AFFECTED SERVICES]. Our team has been activated and is working to restore services. The issue was first detected at [TIME UTC].
>
> **Impact:** [DESCRIPTION OF CUSTOMER IMPACT]
> **Current Status:** [Investigating / Mitigating / Failing over to DR]
> **Next Update:** [TIME UTC]

**Update Notification:**
> **Subject:** [UPDATE #X] -- [PROJECT NAME] Service Disruption
>
> **Status:** [In Progress / DR Failover Initiated / Service Restoring]
> **Actions Taken:** [SUMMARY OF ACTIONS]
> **Current Impact:** [REMAINING IMPACT]
> **Next Update:** [TIME UTC]

**Resolution Notification:**
> **Subject:** [RESOLVED] -- [PROJECT NAME] Service Disruption
>
> The service disruption has been resolved. All services are operating normally as of [TIME UTC].
>
> **Duration:** [TOTAL DURATION]
> **Root Cause:** [BRIEF ROOT CAUSE]
> **Data Loss:** [None / DESCRIPTION]
> **Post-Mortem:** [A blameless post-mortem will be published within 48 hours]

---

## 10. Post-Disaster Recovery (Failback)

### 10.1 Failback Decision Criteria

- [ ] Primary region confirmed fully operational by Azure
- [ ] All Azure services in primary region healthy
- [ ] Data replication from DR to primary region verified
- [ ] Failback tested in non-production environment
- [ ] Failback window approved by stakeholders

### 10.2 Failback Steps

| Step | Action                                                     | Responsible      | Estimated Time | Verification                        |
|------|-------------------------------------------------------------|------------------|----------------|-------------------------------------|
| 1    | Verify primary region readiness                             | [SRE]            | [30 min]       | [All Azure services healthy]        |
| 2    | Re-establish data replication from DR back to primary       | [DBA]            | [30 min]       | [Replication healthy, lag minimal]  |
| 3    | Allow replication to fully synchronize                      | [DBA]            | [1-4 hours]    | [Replication lag = 0]               |
| 4    | Deploy latest application to primary region                 | [SRE]            | [30 min]       | [All services healthy in primary]   |
| 5    | Run smoke tests against primary region                      | [QA]             | [30 min]       | [All critical paths passing]        |
| 6    | Switch DNS / Traffic Manager back to primary region         | [SRE]            | [5 min]        | [Traffic routing to primary]        |
| 7    | Monitor for 2 hours post-failback                           | [SRE]            | [2 hours]      | [No errors or performance issues]   |
| 8    | Scale down DR region resources (if pilot light)             | [SRE]            | [15 min]       | [DR resources scaled down]          |
| 9    | Update stakeholders on successful failback                  | [Comms Lead]     | [5 min]        | [Communication sent]                |
| 10   | Schedule post-incident review                               | [Incident Commander] | [5 min]    | [Meeting scheduled]                 |

---

## 11. Revision History

| Date           | Author            | Changes Made                              |
|----------------|-------------------|-------------------------------------------|
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [Initial document creation]               |
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [DESCRIPTION OF CHANGES]                  |
