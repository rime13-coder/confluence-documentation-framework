# Disaster Recovery & Business Continuity

| **Metadata**     | **Value**                                    |
|------------------|----------------------------------------------|
| Page Title       | Disaster Recovery & Business Continuity      |
| Last Updated     | 2026-02-14                                   |
| Status           | Draft                                        |
| Owner            | IntelliSec Solutions                         |

---

## 1. Document Purpose

This document defines the Disaster Recovery (DR) and Business Continuity (BC) strategy for the CMMC Assessor Platform on Azure. The current state is minimal -- there is no DR region, no failover strategy, and limited backup capabilities. This document honestly describes the current state and outlines planned improvements.

---

## 2. Business Impact Analysis Summary

| Application / Service   | RPO (Recovery Point Objective) | RTO (Recovery Time Objective) | MTPD (Max Tolerable Period of Disruption) | Priority | Business Impact if Unavailable          |
|--------------------------|-------------------------------|-------------------------------|-------------------------------------------|----------|-----------------------------------------|
| Web Application (cmmc-web) | Not defined                 | Not defined                   | Not defined                               | P1       | Assessors cannot access the platform    |
| API Services (cmmc-api)   | Not defined                  | Not defined                   | Not defined                               | P1       | All platform functionality unavailable  |
| PostgreSQL Database        | 7 days (backup retention)    | Not defined                   | Not defined                               | P1       | Complete data loss beyond backup window |
| Blob Storage               | Not defined                  | Not defined                   | Not defined                               | P2       | Document uploads unavailable            |

> **Status: NOT IMPLEMENTED.** RPO, RTO, and MTPD targets have not been formally defined. The values above reflect the implicit capabilities of current Azure service configurations (e.g., PostgreSQL 7-day automated backup).

### Key Definitions

| Term | Definition                                                                                  |
|------|---------------------------------------------------------------------------------------------|
| RPO  | Maximum acceptable amount of data loss measured in time                                      |
| RTO  | Maximum acceptable time to restore service after a disaster                                  |
| MTPD | Maximum time the business can tolerate an outage before irreversible impact                  |

### Planned Improvements

- Formally define RPO, RTO, and MTPD for each service component
- Align backup and DR strategy to meet defined targets

---

## 3. DR Strategy

| Attribute                        | Value                                                     |
|----------------------------------|-----------------------------------------------------------|
| DR Strategy Type                 | Backup-Restore only (minimal)                             |
| Primary Region                   | Canada Central                                            |
| DR Region                        | NOT IMPLEMENTED -- no DR region                           |
| Region Pair                      | Canada Central <-> Canada East (not leveraged)            |
| Failover Type                    | NOT IMPLEMENTED -- no failover mechanism                  |
| DNS Failover                     | NOT IMPLEMENTED                                           |
| Data Replication Strategy        | None (LRS only for storage, no geo-replication)           |
| Estimated Failover Time          | N/A -- no failover capability exists                      |
| Estimated Failback Time          | N/A                                                       |

### Strategy Rationale (Current State)

The current DR posture is minimal. The project is in its early stages with a limited user base. Cost optimization has been prioritized over disaster recovery capabilities. The only recovery mechanism is restoring from PostgreSQL automated backups (7-day retention, locally redundant). Blob storage uses LRS only with no geo-redundancy.

This posture is acknowledged as insufficient for a production platform handling CMMC assessment data and is slated for improvement.

### Planned Improvements

- Evaluate Canada East as DR region
- Increase PostgreSQL backup retention from 7 days to 35 days (F-27)
- Enable geo-redundant backup for PostgreSQL
- Upgrade storage account to GRS or RA-GRS
- Implement a documented failover procedure
- Define DNS failover strategy using Azure Traffic Manager or Front Door

---

## 4. DR Architecture Diagram

```
CURRENT STATE: Single Region, No DR

Canada Central (Primary -- ONLY region)
+--------------------------------------------------+
|  rg-cmmc-assessor-prod                           |
|                                                   |
|  cmmc-web (Container App)                        |
|  cmmc-api (Container App)                        |
|  psql-cmmc-assessor-prod (PostgreSQL Flexible)   |
|    - 7-day automated backup (local only)          |
|  stcmmcassessorprod (Storage, LRS)               |
|  kv-cmmc-assessor-prod (Key Vault)               |
|  acrcmmcassessorprod (Container Registry, Basic) |
|  log-cmmc-assessor-prod (Log Analytics)          |
+--------------------------------------------------+

DR Region: NONE
Replication: NONE
Failover: NONE
```

---

## 5. Azure Services DR Configuration

| Service                  | Resource (Primary)            | DR Mechanism                       | Recovery Region | Auto-Failover | DR Resource (Secondary)        | Current Status     |
|--------------------------|-------------------------------|-------------------------------------|-----------------|---------------|--------------------------------|--------------------|
| Container Apps           | cmmc-api                      | Redeploy from ACR image             | N/A             | No            | N/A                            | No DR              |
| Container Apps           | cmmc-web                      | Redeploy from ACR image             | N/A             | No            | N/A                            | No DR              |
| PostgreSQL Flexible      | psql-cmmc-assessor-prod       | 7-day automated backup (LRS)        | Local only      | No            | N/A                            | Backup only (local)|
| Storage Account          | stcmmcassessorprod             | LRS (locally redundant only)        | N/A             | No            | N/A                            | No geo-redundancy  |
| Key Vault                | kv-cmmc-assessor-prod          | Soft delete enabled (default)       | N/A             | No            | N/A                            | Soft delete only   |
| Container Registry       | acrcmmcassessorprod            | No geo-replication (Basic tier)     | N/A             | No            | N/A                            | No DR              |
| Log Analytics            | log-cmmc-assessor-prod         | No replication                      | N/A             | No            | N/A                            | No DR              |

---

## 6. Data Backup Strategy

| Data Store               | Backup Method                    | Frequency           | Retention              | Storage Location             | Recovery Procedure              | Last Tested     |
|--------------------------|----------------------------------|---------------------|------------------------|-----------------------------|---------------------------------|-----------------|
| PostgreSQL Flexible Server | Azure automated backups (PITR) | Continuous          | 7 days (F-27: should be 35 days) | Locally redundant (same region) | Point-in-time restore via Azure Portal/CLI | Never tested |
| Blob Storage             | No backup configured             | N/A                 | N/A                    | LRS (same region only)      | N/A                             | Never tested    |
| Key Vault Secrets        | Soft delete (Azure default)      | N/A                 | 90 days soft delete    | Same region                 | Recover from soft delete        | Never tested    |
| Audit Log (DB table)     | Part of PostgreSQL backup        | Continuous          | 7 days (with DB backup)| Same as database             | Restore database                | Never tested    |
| Container Images         | Stored in ACR                    | On push             | Indefinite (in ACR)    | Same region (Basic tier)    | Redeploy from ACR               | N/A             |

> **WARNING:** No manual backup testing has ever been performed. This is a significant gap. Backup restore procedures should be tested to validate recoverability.

### Planned Improvements

- Increase PostgreSQL backup retention to 35 days (F-27)
- Enable geo-redundant backup for PostgreSQL
- Upgrade storage account from LRS to GRS
- Implement blob versioning and soft delete on the storage account
- Schedule quarterly backup restore testing
- Document backup restore procedures as runbook entries

---

## 7. DR Runbook: Failover Procedure

**Status: NOT IMPLEMENTED**

There is no failover procedure because there is no DR region or secondary deployment.

### 7.1 Current Recovery Capabilities

In the event of a total failure, the only recovery path is:

| Step | Action                                                       | Estimated Time |
|------|--------------------------------------------------------------|----------------|
| 1    | Redeploy infrastructure using `main.bicep`                   | ~15 min        |
| 2    | Restore PostgreSQL from point-in-time backup                 | ~30-60 min     |
| 3    | Redeploy container images from ACR                           | ~10 min        |
| 4    | Verify DNS records point to new Container Apps endpoints     | ~5-15 min      |
| 5    | Run Prisma migrations if schema changes needed               | ~5 min         |
| 6    | Validate application health                                  | ~15 min        |

**Total Estimated Recovery Time: ~1.5-2 hours (untested)**

> **Note:** This recovery procedure has never been tested. Actual recovery time may be significantly longer.

---

## 8. DR Testing

### 8.1 Testing Schedule

| Test Type                 | Frequency        | Scope                                        | Duration    | Next Scheduled     |
|---------------------------|------------------|----------------------------------------------|-------------|--------------------|
| Tabletop Exercise         | NOT SCHEDULED    | N/A                                          | N/A         | TBD                |
| Component Failover Test   | NOT SCHEDULED    | N/A                                          | N/A         | TBD                |
| Full DR Failover Test     | NOT SCHEDULED    | N/A                                          | N/A         | TBD                |
| Backup Restore Test       | NOT SCHEDULED    | N/A                                          | N/A         | TBD                |

### 8.2 DR Test Results

No DR tests have been conducted.

### Planned Improvements

- Schedule quarterly backup restore tests (PostgreSQL point-in-time restore)
- Conduct a tabletop exercise to walk through the recovery procedure
- Document lessons learned from each test

---

## 9. Communication Plan During Disaster

### 9.1 Communication Matrix

| Audience               | Channel                          | Frequency                      | Responsible            |
|------------------------|----------------------------------|--------------------------------|------------------------|
| Internal Team          | Direct communication (email/chat)| As needed                      | Team lead              |
| Customers              | Email: support@intellisecsolutions.com | On status change          | Team lead              |

> **Status:** Formal communication templates and escalation processes are NOT IMPLEMENTED. See the Incident Response Plan for planned improvements.

---

## 10. Post-Disaster Recovery (Failback)

**Status: NOT IMPLEMENTED** -- No failback procedure exists because there is no DR region.

### Planned Improvements

- Document failback procedures once a DR region is established
- Define data synchronization strategy for failback scenarios

---

## 11. Revision History

| Date           | Author               | Changes Made                              |
|----------------|-----------------------|-------------------------------------------|
| 2026-02-14     | IntelliSec Solutions  | Initial document creation                 |
