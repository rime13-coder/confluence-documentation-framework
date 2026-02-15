# Disaster Recovery & Business Continuity

| **Metadata**     | **Value**                                          |
|------------------|----------------------------------------------------|
| Page Title       | Disaster Recovery & Business Continuity            |
| Last Updated     | 2026-02-15                                         |
| Status           | IN PROGRESS                                        |
| Owner            | IntelliSec Solutions                               |

---

## 1. Document Purpose

This document defines the Disaster Recovery (DR) and Business Continuity (BC) strategy for the M365 Security Assessment Automation tool. Unlike cloud-hosted applications that require multi-region failover, database replication, and service redundancy, this tool runs locally on Windows workstations with no shared infrastructure. Recovery scenarios focus on workstation failure, credential loss, interrupted assessments, corrupted outputs, and database corruption. This document describes each scenario, the recovery procedure, and the backup strategy adapted for a locally executed tool.

---

## 2. Recovery Context: Local Tool vs. Cloud Service

| DR Attribute                    | Cloud-Hosted Application                       | This Tool (Local Execution)                    |
|---------------------------------|------------------------------------------------|------------------------------------------------|
| Primary risk                    | Cloud region outage, service failure           | Workstation failure, data loss                 |
| Failover mechanism              | Multi-region deployment, load balancer         | Rebuild workstation, re-run assessment         |
| Data replication                | Geo-redundant storage, DB replicas             | Git repo for code, local backups for outputs   |
| State management                | Database replication, session clustering        | Local SQLite, DPAPI credential profiles        |
| Service availability            | 99.9%+ SLA target                              | N/A -- tool runs on-demand, not continuously   |
| Recovery complexity             | High (orchestrated failover)                   | Low (re-install module, re-create credentials) |
| Data loss risk                  | RPO-dependent (minutes to hours)               | Assessment outputs are re-generable (idempotent) |

---

## 3. Recovery Scenarios

### 3.1 Scenario 1: Assessment Workstation Failure

**Trigger:** Consultant workstation hardware failure, OS corruption, stolen/lost device, or workstation replacement.

| Attribute              | Value                                                              |
|------------------------|--------------------------------------------------------------------|
| Severity               | Medium                                                             |
| Likelihood             | Low                                                                |
| Impact                 | Temporary loss of assessment capability for one consultant         |
| Data at Risk           | DPAPI credential profiles (non-transferable), in-progress assessment output, local SQLite data |

**Recovery Procedure:**

| Step | Action                                                           | Estimated Time | Responsibility   |
|------|------------------------------------------------------------------|----------------|------------------|
| 1    | Provision new or replacement Windows workstation                 | Varies         | IT / Consultant  |
| 2    | Install PowerShell 5.1/7.x and Microsoft Edge                   | 15 min         | Consultant       |
| 3    | Clone module repository from Git                                 | 5 min          | Consultant       |
| 4    | Run module dependency installation script                        | 10-15 min      | Consultant       |
| 5    | Import M365 Assessment module                                    | 2 min          | Consultant       |
| 6    | Re-create DPAPI credential profiles for active client tenants    | 5-10 min/client| Consultant       |
| 7    | Restore assessment outputs from backup (if available)            | Varies         | Consultant       |
| 8    | Resume or re-run interrupted assessments                         | 1-3 hours      | Consultant       |

**Total Estimated Recovery Time: 1-2 hours** (excluding workstation provisioning)

### 3.2 Scenario 2: Credential Profile Loss

**Trigger:** DPAPI credential profiles are inaccessible due to Windows user profile corruption, password reset without backup, or workstation change.

| Attribute              | Value                                                              |
|------------------------|--------------------------------------------------------------------|
| Severity               | Low-Medium                                                         |
| Likelihood             | Medium                                                             |
| Impact                 | Must re-create credential profiles; no client data loss            |
| Data at Risk           | Encrypted credential files only (tenant IDs, client IDs, secrets/thumbprints) |

**Recovery Procedure:**

| Step | Action                                                           | Estimated Time | Responsibility   |
|------|------------------------------------------------------------------|----------------|------------------|
| 1    | Verify Azure AD App Registration still exists in client tenant   | 2 min          | Consultant       |
| 2    | Retrieve App Registration details (Tenant ID, Client ID)         | 5 min          | Consultant       |
| 3    | Generate new client secret or use existing certificate           | 5 min          | Consultant / Client Admin |
| 4    | Re-create credential profile using Save-AssessmentCredential     | 5 min          | Consultant       |
| 5    | Test connectivity to client tenant                               | 2 min          | Consultant       |

**Total Estimated Recovery Time: 15-20 minutes per client tenant**

> **IMPORTANT:** DPAPI encryption is bound to both the Windows user account AND the machine. Credential profiles cannot be copied to a new machine or used by a different user. They must be re-created on the new machine by the consultant who will use them.

### 3.3 Scenario 3: Interrupted Assessment

**Trigger:** Assessment execution interrupted by network failure, workstation sleep/shutdown, PowerShell crash, or API throttling.

| Attribute              | Value                                                              |
|------------------------|--------------------------------------------------------------------|
| Severity               | Low                                                                |
| Likelihood             | Medium                                                             |
| Impact                 | Partial assessment results; time lost                              |
| Data at Risk           | In-progress findings since last checkpoint                         |

**Recovery Procedure:**

| Step | Action                                                           | Estimated Time | Responsibility   |
|------|------------------------------------------------------------------|----------------|------------------|
| 1    | Review assessment log for last completed checkpoint              | 5 min          | Consultant       |
| 2    | Resume assessment from last checkpoint (if checkpoint/resume supported) | Varies   | Consultant       |
| 3    | OR re-run the full assessment (idempotent, safe to re-run)       | 1-3 hours      | Consultant       |
| 4    | Verify all modules completed successfully                        | 10 min         | Consultant       |

**Total Estimated Recovery Time: Varies (re-run is 1-3 hours)**

> **Note:** The assessment engine is designed to be idempotent. Re-running an assessment against the same tenant produces the same results (assuming no tenant configuration changes). There is no risk of duplicate findings or corrupted data from a re-run.

### 3.4 Scenario 4: Corrupted Assessment Output

**Trigger:** Assessment output files (CSV evidence, reports, SQLite database) are corrupted due to disk failure, improper shutdown during write, or accidental modification.

| Attribute              | Value                                                              |
|------------------------|--------------------------------------------------------------------|
| Severity               | Low                                                                |
| Likelihood             | Low                                                                |
| Impact                 | Must regenerate output; no data permanently lost                   |
| Data at Risk           | Evidence CSVs, reports, local SQLite data for the affected engagement |

**Recovery Procedure:**

| Step | Action                                                           | Estimated Time | Responsibility   |
|------|------------------------------------------------------------------|----------------|------------------|
| 1    | Identify corrupted files in the engagement output directory      | 5 min          | Consultant       |
| 2    | Delete corrupted engagement directory                            | 1 min          | Consultant       |
| 3    | Re-run the assessment (full re-execution is safe and idempotent) | 1-3 hours      | Consultant       |
| 4    | Verify output integrity (all CSVs, reports, database present)    | 10 min         | Consultant       |

**Total Estimated Recovery Time: 1-3 hours** (assessment re-execution)

### 3.5 Scenario 5: Controls Database Corruption

**Trigger:** SQLite controls database is corrupted or missing, preventing assessment execution or historical data access.

| Attribute              | Value                                                              |
|------------------------|--------------------------------------------------------------------|
| Severity               | Low                                                                |
| Likelihood             | Low                                                                |
| Impact                 | Database must be rebuilt; historical data may be lost              |
| Data at Risk           | Historical assessment data in SQLite; control definitions are safe (in JSON files) |

**Recovery Procedure:**

| Step | Action                                                           | Estimated Time | Responsibility   |
|------|------------------------------------------------------------------|----------------|------------------|
| 1    | Delete corrupted SQLite database file                            | 1 min          | Consultant       |
| 2    | Module auto-rebuilds database from findings.json and module.json | Automatic      | Module           |
| 3    | Verify database structure and control count                      | 5 min          | Consultant       |
| 4    | Re-import historical assessment data from archived outputs (if needed) | Varies    | Consultant       |

**Total Estimated Recovery Time: 5-10 minutes** (database auto-rebuild is immediate)

> **Key Design Decision:** The controls database is auto-rebuilt from the findings.json and module.json configuration files. These JSON files are version-controlled in Git and serve as the single source of truth for control definitions. Database corruption does NOT result in loss of control definitions.

---

## 4. Recovery Summary Matrix

| Scenario                       | Severity | Likelihood | RTO                  | RPO                    | Data Loss Risk     | Recovery Method                    |
|--------------------------------|----------|------------|----------------------|------------------------|--------------------|-------------------------------------|
| Workstation failure            | Medium   | Low        | 1-2 hours            | Last backup of outputs | Credential profiles, in-progress output | Rebuild workstation, re-create credentials |
| Credential loss                | Low-Med  | Medium     | 15-20 min/tenant     | N/A (re-create)        | None (re-creatable)| Re-create DPAPI profiles            |
| Interrupted assessment         | Low      | Medium     | 1-3 hours (re-run)   | Last checkpoint        | In-progress findings | Resume from checkpoint or re-run   |
| Corrupted output               | Low      | Low        | 1-3 hours (re-run)   | N/A (re-generable)     | None (idempotent)  | Delete and re-run assessment       |
| Database corruption            | Low      | Low        | 5-10 minutes         | Historical data only   | Historical only    | Auto-rebuild from JSON files       |

---

## 5. Backup Strategy

### 5.1 What to Back Up

| Data Category              | Backup Method                              | Frequency                  | Retention            | Storage Location           |
|----------------------------|--------------------------------------------|----------------------------|----------------------|----------------------------|
| Module source code         | Git repository (version control)           | Every commit               | Indefinite (Git history) | Remote Git repository    |
| Configuration files        | Git repository (version control)           | Every commit               | Indefinite (Git history) | Remote Git repository    |
| findings.json / module.json | Git repository (version control)          | Every commit               | Indefinite (Git history) | Remote Git repository    |
| Credential profiles        | NOT BACKED UP (DPAPI, non-transferable)    | N/A                        | N/A                  | Re-created on demand       |
| Assessment outputs         | Manual archive (file copy to secure storage) | After each engagement    | Per client retention policy | Secure file share, encrypted USB, or secure cloud storage |
| SQLite database            | Included in assessment output archive      | After each engagement      | Per client retention  | With assessment archive   |

### 5.2 What Does NOT Need Backup

| Item                          | Reason                                                       |
|-------------------------------|--------------------------------------------------------------|
| PowerShell module dependencies | Re-installable from PSGallery at any time                  |
| DPAPI credential profiles     | Non-transferable; must be re-created on each machine        |
| Controls database             | Auto-rebuilt from version-controlled JSON files             |
| Web dashboard (Pode)          | Stateless; re-launches from module code                     |
| Assessment results            | Idempotent; can be regenerated by re-running the assessment |

### 5.3 Assessment Output Archival

```
Archive Strategy:

After each engagement:
1. Copy entire engagement directory to secure archive
   Engagements/YYYY-MM-DD_ClientName/ --> Archive/ClientName/YYYY-MM-DD/

2. Archive contents:
   +-- findings/          (JSON findings per module)
   +-- evidence/          (CSV evidence per control)
   +-- reports/           (HTML, PDF, DOCX reports)
   +-- logs/              (Assessment execution logs)
   +-- assessment-metadata.json (engagement metadata)

3. Verify archive integrity (file count, checksums)

4. Optionally remove local copy after successful archive
```

### 5.4 Archive Security Requirements

| Requirement                     | Implementation                                              |
|---------------------------------|-------------------------------------------------------------|
| Encryption at rest              | BitLocker (local), encrypted archive (remote)               |
| Access control                  | Limited to authorized consultants and management            |
| Retention period                | Per client contract and regulatory requirements             |
| Secure deletion                 | Secure wipe when retention period expires                   |
| Audit trail                     | Record who archived, when, and where                       |

---

## 6. RTO / RPO Targets (Adapted for Local Tool)

### 6.1 Recovery Time Objective (RTO)

| Component                       | RTO Target        | Justification                                            |
|---------------------------------|-------------------|----------------------------------------------------------|
| Assessment capability (new workstation) | 2 hours  | Consultant must be able to run assessments within 2 hours of starting workstation setup |
| Credential profile re-creation  | 30 minutes        | All active client credentials re-created within 30 minutes |
| Assessment re-execution         | 4 hours           | Full assessment can be re-run within a standard work session |
| Output regeneration              | 4 hours           | All deliverables regenerated within a standard work session |

### 6.2 Recovery Point Objective (RPO)

| Component                       | RPO Target        | Justification                                            |
|---------------------------------|-------------------|----------------------------------------------------------|
| Module source code              | 0 (Git)           | All code is version-controlled; no data loss possible    |
| Configuration files             | 0 (Git)           | All config is version-controlled; no data loss possible  |
| Assessment outputs              | Last archived engagement | Outputs are archived after each engagement; in-progress work can be re-generated |
| Historical assessment data      | Last database backup | SQLite data included in engagement archive              |

---

## 7. Business Continuity

### 7.1 Continuity Model

The M365 Security Assessment tool is inherently resilient because each consultant operates independently on their own workstation. There is no shared infrastructure, no single point of failure in the architecture, and no dependency on a central service.

| Continuity Attribute              | Value                                                      |
|-----------------------------------|------------------------------------------------------------|
| Single point of failure           | None -- each workstation is independent                    |
| Concurrent assessments            | Multiple consultants can run assessments simultaneously    |
| Cross-consultant dependency       | None -- no shared database, no shared credentials          |
| Module distribution               | Git repository; any consultant can pull the latest version |
| Assessment portability            | Credential profiles are not portable; everything else is   |

### 7.2 Business Continuity Scenarios

| Scenario                                    | Impact                                    | Mitigation                                              |
|---------------------------------------------|-------------------------------------------|---------------------------------------------------------|
| One consultant workstation fails            | One consultant temporarily unable to run assessments | Other consultants unaffected; rebuild workstation per Section 3.1 |
| Multiple workstations fail simultaneously   | Multiple consultants unable to run assessments | Unlikely; each workstation is independent; stagger rebuilds |
| Git repository unavailable                  | Cannot pull module updates or clone to new workstations | Use local copies; Git is distributed (local clones contain full history) |
| Microsoft Graph API outage                  | All assessments blocked (cannot collect data) | Wait for Microsoft to restore service; assessments are not time-critical to the minute |
| Azure AD App Registration deleted           | Specific client assessment blocked        | Re-create App Registration in client tenant; consultant can work on other clients |
| Key developer unavailable                   | No module development; existing assessments unaffected | Module is self-contained; assessments continue with current version; documented architecture enables onboarding |

### 7.3 Continuity Checklist

- [ ] At least two consultants have the module installed and tested on their workstations
- [ ] Module source code is pushed to remote Git repository (not only on local machines)
- [ ] Assessment output archive procedure is documented and followed
- [ ] Each consultant knows how to re-create credential profiles from scratch
- [ ] Module dependency installation script is tested and current
- [ ] At least one consultant has been through the full workstation rebuild procedure

---

## 8. Incident Response for Tool-Related Issues

### 8.1 Issue Classification

| Classification | Examples                                                    | Response Time   | Resolution Target |
|----------------|-------------------------------------------------------------|-----------------|-------------------|
| Critical       | Module fails to execute any assessment; all API calls fail  | Same day        | 24 hours          |
| High           | One assessment module fails; partial assessment possible    | Same day        | 48 hours          |
| Medium         | Report generation fails; assessment data is collected       | Next business day | 1 week           |
| Low            | Dashboard cosmetic issue; minor logging gap                 | Backlog         | Next release      |

### 8.2 Escalation Path

| Level | Responsibility              | Action                                              |
|-------|-----------------------------|-----------------------------------------------------|
| 1     | Consultant (self-service)   | Review error logs, retry assessment, check network   |
| 2     | Lead Consultant / Senior    | Investigate module code, test against reference tenant |
| 3     | Lead Developer              | Debug and patch module code, issue hotfix release     |

---

## 9. DR Testing Schedule

| Test Type                        | Frequency        | Scope                                                  | Owner              |
|----------------------------------|------------------|--------------------------------------------------------|--------------------|
| Workstation rebuild drill        | Semi-annually    | Full workstation setup from scratch (Scenario 3.1)     | Lead Consultant    |
| Credential re-creation test      | Quarterly        | Re-create all credential profiles on a test machine    | Any Consultant     |
| Assessment re-run validation     | After each release | Re-run assessment against test tenant, compare results | Lead Developer   |
| Output archive verification      | Quarterly        | Verify archived assessment outputs are complete and intact | Lead Consultant |
| Database rebuild test            | After each release | Delete SQLite DB, verify auto-rebuild from JSON       | Lead Developer     |

---

## 10. Revision History

| Date           | Author               | Changes Made                                                  |
|----------------|-----------------------|---------------------------------------------------------------|
| 2026-02-15     | IntelliSec Solutions  | Initial document adapted for M365 Security Assessment Automation (local PowerShell tool) |
