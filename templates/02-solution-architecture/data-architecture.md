# Data Architecture

| **Metadata**     | **Value**                                      |
|------------------|------------------------------------------------|
| Page Title       | [PROJECT_NAME] - Data Architecture             |
| Last Updated     | [YYYY-MM-DD]                                   |
| Status           | `DRAFT` / `IN REVIEW` / `APPROVED`             |
| Owner            | [OWNER_NAME]                                   |
| Reviewers        | [REVIEWER_1], [REVIEWER_2], [REVIEWER_3]       |
| Version          | [VERSION_NUMBER, e.g., 1.0]                    |
| Related HLD      | [LINK_TO_ARCHITECTURE_OVERVIEW_HLD]            |

---

## 1. Document Purpose

This document defines the data architecture for **[PROJECT_NAME]**. It covers all data stores, data classifications, data flows, retention policies, backup and recovery strategies, and data privacy considerations. This document ensures that data is managed consistently, securely, and in compliance with applicable regulations.

---

## 2. Data Stores Inventory

| Store Name | Type | Azure Service | SKU / Tier | Purpose | Data Classification | Retention | Region |
|-----------|------|--------------|------------|---------|--------------------|-----------|---------|
| [DB_NAME_1] | Relational (SQL) | Azure Database for PostgreSQL - Flexible Server | [e.g., GP D4s_v3, 128 GB] | [e.g., User accounts, roles, permissions] | Confidential | [e.g., Lifetime of account + 7 years] | [e.g., West Europe] |
| [DB_NAME_2] | Relational (SQL) | Azure Database for PostgreSQL - Flexible Server | [e.g., GP D4s_v3, 256 GB] | [e.g., Orders, payments, transactions] | Confidential | [e.g., 7 years (regulatory)] | [e.g., West Europe] |
| [DB_NAME_3] | Document (NoSQL) | Azure Cosmos DB | [e.g., Serverless] | [e.g., Product catalog, user preferences] | Internal | [e.g., Active + 1 year archive] | [e.g., West Europe] |
| [CACHE_NAME] | Key-Value (Cache) | Azure Cache for Redis | [e.g., Premium P1] | [e.g., Session state, API response caching] | Internal | [e.g., Ephemeral (TTL-based)] | [e.g., West Europe] |
| [BLOB_NAME] | Object / Blob | Azure Blob Storage | [e.g., Standard GRS] | [e.g., Document uploads, report outputs, media] | Confidential | [e.g., 5 years, then archive tier] | [e.g., West Europe] |
| [SEARCH_NAME] | Search Index | Azure AI Search | [e.g., Standard S1] | [e.g., Full-text product search, faceted navigation] | Internal | [e.g., Rebuilt from source on demand] | [e.g., West Europe] |
| [DW_NAME] | Data Warehouse | [e.g., Azure Synapse Analytics / Azure SQL] | [e.g., DW100c] | [e.g., Business intelligence, reporting] | Confidential | [e.g., 5 years] | [e.g., West Europe] |
| [QUEUE_STORE] | Message Queue | Azure Service Bus | [e.g., Premium] | [e.g., Async message delivery between services] | Internal | [e.g., 14 days max TTL] | [e.g., West Europe] |
| [ADDITIONAL_STORE] | [TYPE] | [AZURE_SERVICE] | [SKU] | [PURPOSE] | [CLASSIFICATION] | [RETENTION] | [REGION] |

---

## 3. Data Flow Diagram

<!-- Insert data flow diagram here using draw.io/Lucidchart -->
<!--
    Show:
    - All data stores from the inventory above
    - Data producers (services, users, external systems)
    - Data consumers (services, reports, analytics)
    - Direction and nature of data flow (read, write, sync, async)
    - Data transformation points (ETL, stream processing)
    - Boundaries (trust boundaries, network boundaries)
    Recommended tool: draw.io, Lucidchart
-->

### 3.1 Data Flow Summary

| # | Source | Destination | Data Description | Flow Type | Frequency | Volume |
|---|--------|-------------|-----------------|-----------|-----------|--------|
| 1 | [WEB_FRONTEND] | [SERVICE_A] | [e.g., User registration data] | Sync (REST) | [e.g., On demand] | [e.g., ~500 req/day] |
| 2 | [SERVICE_A] | [DB_NAME_1] | [e.g., User profile CRUD] | Sync (SQL) | [e.g., On demand] | [e.g., ~2,000 ops/day] |
| 3 | [SERVICE_B] | [SERVICE_BUS] | [e.g., OrderPlaced events] | Async (AMQP) | [e.g., On demand] | [e.g., ~1,000 events/day] |
| 4 | [SERVICE_C] | [BLOB_STORAGE] | [e.g., Generated PDF reports] | Sync (REST) | [e.g., Nightly batch] | [e.g., ~200 files/day, 5MB avg] |
| 5 | [DB_NAME_2] | [DW_NAME] | [e.g., Transactional data for BI] | Batch (ETL) | [e.g., Every 6 hours] | [e.g., ~500K rows/batch] |
| 6 | [EXTERNAL_SYSTEM] | [SERVICE_A] | [e.g., User sync from HR system] | Batch (SFTP/API) | [e.g., Daily at 02:00 UTC] | [e.g., ~10K records] |
| [#] | [SOURCE] | [DESTINATION] | [DESCRIPTION] | [FLOW_TYPE] | [FREQUENCY] | [VOLUME] |

---

## 4. Data Model / Entity-Relationship Diagram

<!-- Insert ERD here using draw.io/Lucidchart/dbdiagram.io -->
<!--
    Show:
    - All major entities and their attributes
    - Primary keys and foreign keys
    - Relationship cardinality (1:1, 1:N, M:N)
    - Data types for key columns
    Recommended tool: dbdiagram.io, draw.io, Lucidchart, or DBeaver
-->

### 4.1 Logical Data Model - Key Entities

| Entity | Description | Key Attributes | Relationships |
|--------|-------------|---------------|---------------|
| User | [e.g., Registered user account] | `id`, `email`, `display_name`, `status`, `created_at` | Has many Orders, has many Roles |
| Role | [e.g., Authorization role] | `id`, `name`, `description` | Belongs to many Users |
| Order | [e.g., Customer purchase order] | `id`, `user_id`, `status`, `total`, `currency`, `created_at` | Belongs to User, has many OrderItems, has many Payments |
| OrderItem | [e.g., Line item within an order] | `id`, `order_id`, `product_id`, `quantity`, `unit_price` | Belongs to Order |
| Product | [e.g., Purchasable product/service] | `id`, `name`, `description`, `price`, `category`, `status` | Has many OrderItems |
| Payment | [e.g., Payment transaction record] | `id`, `order_id`, `amount`, `provider`, `status`, `processed_at` | Belongs to Order |
| AuditLog | [e.g., Immutable audit trail entry] | `id`, `entity_type`, `entity_id`, `action`, `actor_id`, `timestamp`, `changes` | References User (actor) |
| [ADDITIONAL_ENTITY] | [DESCRIPTION] | [KEY_ATTRIBUTES] | [RELATIONSHIPS] |

---

## 5. Data Classification

### 5.1 Classification Framework

| Classification Level | Definition | Examples | Handling Requirements |
|---------------------|------------|----------|----------------------|
| **Public** | Data intended for public consumption | Marketing content, public API docs | No special controls required |
| **Internal** | Data for internal use, low risk if exposed | Internal dashboards, non-sensitive configs | Access restricted to authenticated employees |
| **Confidential** | Sensitive business or personal data | Customer PII, financial records, contracts | Encryption required, access logged, need-to-know basis |
| **Restricted** | Highly sensitive data, significant harm if exposed | Passwords, encryption keys, payment card data | Strongest encryption, strict access controls, additional audit |

### 5.2 Data Element Classification Matrix

| Data Element | Example Values | Classification | Encrypted at Rest | Encrypted in Transit | Masking in Logs | Access Control |
|-------------|----------------|---------------|-------------------|---------------------|-----------------|----------------|
| User Email | user@example.com | Confidential | Yes (TDE / SSE) | Yes (TLS 1.2+) | Partial (`u***@example.com`) | RBAC (Admin, Support) |
| User Display Name | John Doe | Internal | Yes (TDE / SSE) | Yes (TLS 1.2+) | No | RBAC (All authenticated) |
| Password Hash | bcrypt hash | Restricted | Yes (TDE / SSE) | Yes (TLS 1.2+) | Full mask | System only (no human access) |
| Payment Card Number | 4111...1111 | Restricted | Yes (tokenized via PCI-compliant provider) | Yes (TLS 1.2+) | Tokenized | PCI DSS scoped systems only |
| Order Total | 149.99 | Confidential | Yes (TDE / SSE) | Yes (TLS 1.2+) | No | RBAC (Admin, Finance) |
| Product Name | Widget Pro | Public | Yes (TDE / SSE) | Yes (TLS 1.2+) | No | Public |
| API Keys / Secrets | sk_live_... | Restricted | Yes (Key Vault HSM) | Yes (TLS 1.2+) | Full mask | Managed Identity only |
| IP Address | 192.168.1.1 | Confidential | Yes (TDE / SSE) | Yes (TLS 1.2+) | Full mask | RBAC (Admin, Security) |
| Audit Log Entries | Action timestamps | Internal | Yes (TDE / SSE) | Yes (TLS 1.2+) | No | RBAC (Admin, Compliance) |
| [ADDITIONAL_ELEMENT] | [EXAMPLE] | [CLASSIFICATION] | [AT_REST] | [IN_TRANSIT] | [MASKING] | [ACCESS] |

---

## 6. Data Retention and Lifecycle Policies

### 6.1 Retention Schedule

| Data Category | Retention Period (Active) | Archive Period | Deletion Method | Regulatory Basis |
|--------------|--------------------------|----------------|-----------------|------------------|
| User Account Data | Lifetime of account | [e.g., 7 years post-deletion] | [e.g., Soft delete -> hard delete after archive period] | [e.g., GDPR Art. 17, Tax regulations] |
| Transaction / Order Data | [e.g., 3 years active] | [e.g., 7 years archive (cool/archive tier)] | [e.g., Automated purge job] | [e.g., Financial regulations, tax law] |
| Audit Logs | [e.g., 1 year hot storage] | [e.g., 7 years archive] | [e.g., Automated lifecycle policy] | [e.g., SOC 2, ISO 27001] |
| Application Logs | [e.g., 90 days] | [e.g., None] | [e.g., Log Analytics workspace retention policy] | [e.g., Operational needs] |
| Session / Cache Data | [e.g., TTL-based (30 min)] | N/A | [e.g., Auto-expiry by Redis] | N/A |
| Uploaded Documents | [e.g., Lifetime of associated entity] | [e.g., 5 years archive tier] | [e.g., Blob lifecycle management policy] | [e.g., Business requirement] |
| Backup Data | [e.g., 35 days (short-term)] | [e.g., 1 year (long-term)] | [e.g., Automatic expiry per backup policy] | [e.g., DR requirements] |
| [ADDITIONAL_CATEGORY] | [ACTIVE_PERIOD] | [ARCHIVE_PERIOD] | [DELETION_METHOD] | [REGULATORY_BASIS] |

### 6.2 Data Lifecycle Stages

```
[Creation] -> [Active Use] -> [Inactive/Warm] -> [Archive/Cool] -> [Deletion/Purge]
     |              |                |                  |                 |
  Validation    Full access     Reduced access     Read-only,       Secure erasure,
  & encryption  & indexing      & monitoring       moved to          crypto-shredding
                                                   archive tier      or hard delete
```

### 6.3 Azure Storage Lifecycle Policies

| Storage Account | Rule Name | Condition | Action |
|----------------|-----------|-----------|--------|
| [BLOB_STORAGE_ACCOUNT] | Move to Cool | [e.g., Blob not modified for 90 days] | Move to Cool tier |
| [BLOB_STORAGE_ACCOUNT] | Move to Archive | [e.g., Blob not modified for 365 days] | Move to Archive tier |
| [BLOB_STORAGE_ACCOUNT] | Delete old blobs | [e.g., Blob not modified for 2,555 days (7 years)] | Delete blob |
| [ADDITIONAL_ACCOUNT] | [RULE_NAME] | [CONDITION] | [ACTION] |

---

## 7. Backup and Recovery Strategy

### 7.1 Backup Matrix

| Data Store | Backup Method | Frequency | Retention | RPO | RTO | Geo-Redundancy | Tested |
|-----------|--------------|-----------|-----------|-----|-----|-----------------|--------|
| [DB_NAME_1] (PostgreSQL) | [e.g., Azure automated backups (point-in-time restore)] | [e.g., Continuous (WAL)] | [e.g., 35 days PITR] | [e.g., < 5 minutes] | [e.g., < 1 hour] | [e.g., Yes (geo-redundant backup)] | [e.g., Quarterly] |
| [DB_NAME_2] (PostgreSQL) | [e.g., Azure automated backups + weekly long-term] | [e.g., Continuous + weekly] | [e.g., 35 days PITR + 1 year LTR] | [e.g., < 5 minutes] | [e.g., < 1 hour] | [e.g., Yes] | [e.g., Quarterly] |
| [DB_NAME_3] (Cosmos DB) | [e.g., Continuous backup mode] | [e.g., Continuous] | [e.g., 30 days] | [e.g., 0 (continuous)] | [e.g., < 4 hours (support request)] | [e.g., Yes (multi-region writes)] | [e.g., Quarterly] |
| [BLOB_STORAGE] | [e.g., Soft delete + versioning + GRS] | [e.g., Continuous (versioning)] | [e.g., 30 days soft delete, versioning unlimited] | [e.g., 0] | [e.g., < 30 minutes] | [e.g., Yes (RA-GRS)] | [e.g., Quarterly] |
| [REDIS_CACHE] | [e.g., RDB snapshots (Premium tier)] | [e.g., Every 6 hours] | [e.g., 2 snapshots] | [e.g., < 6 hours] | [e.g., < 30 minutes] | [e.g., No (ephemeral cache)] | [e.g., Annually] |
| [VM_DATA] | [e.g., Azure Backup (VM snapshots)] | [e.g., Daily] | [e.g., 30 days daily, 12 months monthly] | [e.g., < 24 hours] | [e.g., < 4 hours] | [e.g., Yes (GRS vault)] | [e.g., Quarterly] |
| [ADDITIONAL_STORE] | [BACKUP_METHOD] | [FREQUENCY] | [RETENTION] | [RPO] | [RTO] | [GEO_REDUNDANCY] | [TESTED] |

### 7.2 Recovery Procedures

| Scenario | Procedure | Responsible Team | Estimated Duration |
|----------|-----------|-----------------|-------------------|
| Single database corruption | [e.g., Point-in-time restore to new server, verify data, swap connection strings] | [e.g., Platform / DBA team] | [e.g., 1-2 hours] |
| Full region outage | [e.g., Failover to geo-secondary, update DNS, validate services] | [e.g., Platform / SRE team] | [e.g., 2-4 hours] |
| Accidental data deletion (blob) | [e.g., Restore from soft-deleted version or previous blob version] | [e.g., Application team] | [e.g., < 30 minutes] |
| Ransomware / security breach | [e.g., Isolate affected resources, restore from immutable backups, forensics] | [e.g., Security + Platform team] | [e.g., 4-24 hours] |
| [ADDITIONAL_SCENARIO] | [PROCEDURE] | [RESPONSIBLE_TEAM] | [ESTIMATED_DURATION] |

### 7.3 Disaster Recovery Testing

| Aspect | Approach |
|--------|----------|
| Test Frequency | [e.g., Full DR test quarterly, tabletop exercise monthly] |
| Test Scope | [e.g., Rotate between individual store recovery and full region failover] |
| Success Criteria | [e.g., RPO and RTO targets met, data integrity verified, all services operational] |
| Documentation | [e.g., DR test results documented in [LINK_TO_DR_TEST_LOG]] |

---

## 8. Data Migration Strategy

> [OPTIONAL] Include this section if migrating data from a legacy system or performing a major data platform change.

### 8.1 Migration Overview

| Aspect | Detail |
|--------|--------|
| Source System | [e.g., On-premises SQL Server 2016] |
| Target System | [e.g., Azure Database for PostgreSQL Flexible Server] |
| Data Volume | [e.g., ~500 GB, 150 tables, 200M rows in largest table] |
| Migration Approach | [e.g., Phased migration with dual-write period] |
| Downtime Window | [e.g., Maximum 4 hours for final cutover] |
| Rollback Plan | [e.g., Revert application to point at source system; source kept read-only during migration] |

### 8.2 Migration Phases

| Phase | Description | Duration | Validation |
|-------|-------------|----------|------------|
| 1. Schema Migration | [e.g., Convert SQL Server schema to PostgreSQL, test with empty DB] | [e.g., 2 weeks] | [e.g., Schema comparison, all migrations run successfully] |
| 2. Historical Data Migration | [e.g., Bulk load historical data using Azure Data Factory / pg_dump] | [e.g., 1 week] | [e.g., Row counts, checksum validation, sample data verification] |
| 3. Delta Sync | [e.g., Change data capture (CDC) for incremental sync during transition] | [e.g., 2 weeks parallel run] | [e.g., Continuous row count comparison, data integrity checks] |
| 4. Cutover | [e.g., Stop source writes, final delta sync, switch application to target] | [e.g., 4-hour window] | [e.g., Full regression test suite, smoke tests, data validation queries] |
| 5. Post-Migration | [e.g., Monitor for issues, decommission source after 30-day bake period] | [e.g., 30 days] | [e.g., No data discrepancies, performance within SLA] |

### 8.3 Data Transformation Rules

| Source Table/Field | Target Table/Field | Transformation | Notes |
|-------------------|-------------------|----------------|-------|
| [SOURCE_TABLE.FIELD] | [TARGET_TABLE.FIELD] | [e.g., NVARCHAR -> TEXT, date format conversion] | [NOTES] |
| [SOURCE_TABLE.FIELD] | [TARGET_TABLE.FIELD] | [e.g., Split into separate table (normalization)] | [NOTES] |
| [ADDITIONAL_MAPPING] | [TARGET] | [TRANSFORMATION] | [NOTES] |

---

## 9. GDPR and Data Privacy Considerations

### 9.1 Data Subject Rights Implementation

| Right | Implementation | Endpoint / Process |
|-------|---------------|-------------------|
| Right to Access (Art. 15) | [e.g., Data export API generates JSON/CSV of all user data] | [e.g., GET /api/v1/users/{id}/data-export] |
| Right to Rectification (Art. 16) | [e.g., Standard user profile update functionality] | [e.g., PUT /api/v1/users/{id}] |
| Right to Erasure (Art. 17) | [e.g., Anonymization of PII, cascade to all dependent data stores] | [e.g., DELETE /api/v1/users/{id}/personal-data] |
| Right to Restrict Processing (Art. 18) | [e.g., User status set to "restricted", data retained but not processed] | [e.g., PATCH /api/v1/users/{id}/processing-status] |
| Right to Data Portability (Art. 20) | [e.g., Machine-readable export (JSON) of user-provided data] | [e.g., GET /api/v1/users/{id}/portable-data] |
| Right to Object (Art. 21) | [e.g., Opt-out flags for marketing, profiling] | [e.g., PATCH /api/v1/users/{id}/consent-preferences] |

### 9.2 Data Processing Inventory

| Processing Activity | Legal Basis | Data Categories | Data Subjects | Processor | Transfer Outside EU |
|--------------------|-------------|-----------------|---------------|-----------|---------------------|
| User account management | Contract (Art. 6(1)(b)) | Name, email, phone | Customers | [PROJECT_NAME] (controller) | [e.g., No] |
| Order processing | Contract (Art. 6(1)(b)) | Order details, payment info | Customers | [PROJECT_NAME] + [PAYMENT_PROVIDER] | [e.g., No / Yes with SCCs] |
| Analytics and reporting | Legitimate Interest (Art. 6(1)(f)) | Aggregated usage data | Customers, employees | [ANALYTICS_PROVIDER] | [e.g., No] |
| Marketing communications | Consent (Art. 6(1)(a)) | Email, preferences | Customers | [EMAIL_PROVIDER] | [e.g., Yes, EU SCCs in place] |
| [ADDITIONAL_ACTIVITY] | [LEGAL_BASIS] | [DATA_CATEGORIES] | [DATA_SUBJECTS] | [PROCESSOR] | [TRANSFER] |

### 9.3 Privacy by Design Controls

| Control | Implementation |
|---------|---------------|
| Data Minimization | [e.g., Only collect data fields necessary for the stated purpose; review quarterly] |
| Purpose Limitation | [e.g., Data used only for the purpose declared at collection; enforced via RBAC] |
| Storage Limitation | [e.g., Automated retention policies with scheduled purge jobs (see Section 6)] |
| Pseudonymization | [e.g., Internal IDs (UUIDs) used instead of natural keys; PII separated from transactional data] |
| Consent Management | [e.g., Granular consent tracking per purpose, with timestamp and version of consent text] |
| Data Protection Impact Assessment (DPIA) | [e.g., DPIA completed for [HIGH_RISK_PROCESSING]; document at [LINK_TO_DPIA]] |
| Breach Notification Process | [e.g., 72-hour notification to supervisory authority; process documented in [LINK_TO_INCIDENT_RESPONSE]] |

### 9.4 Cross-Border Data Transfer

| Destination | Mechanism | Data Categories | Safeguards |
|-------------|-----------|-----------------|------------|
| [e.g., United States (GitHub)] | [e.g., EU SCCs + DPA] | [e.g., Source code (no PII)] | [e.g., Encryption in transit, access controls] |
| [e.g., United States (monitoring provider)] | [e.g., EU SCCs + DPA] | [e.g., Telemetry data (anonymized)] | [e.g., No PII in telemetry, data anonymized before export] |
| [ADDITIONAL_DESTINATION] | [MECHANISM] | [DATA_CATEGORIES] | [SAFEGUARDS] |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | [YYYY-MM-DD] | [AUTHOR] | Initial draft |
| [VERSION] | [YYYY-MM-DD] | [AUTHOR] | [CHANGES] |
