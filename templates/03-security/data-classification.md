# Data Classification

| **Page Title**   | Data Classification - [PROJECT_NAME]     |
|------------------|------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                             |
| **Status**       | NOT STARTED / IN PROGRESS / COMPLETE     |
| **Owner**        | [DATA_OWNER_NAME]                        |
| **Reviewers**    | [REVIEWER_NAMES]                         |
| **Policy Ref**   | [ENTERPRISE_DATA_CLASSIFICATION_POLICY_LINK] |

---

## 1. Document Purpose

This document defines the data classification framework for **[PROJECT_NAME]**, inventories all data elements processed by the system, specifies handling requirements per classification level, and establishes access controls and incident procedures. It supports compliance with enterprise data governance policies and regulatory requirements (SOC 2, ISO 27001, GDPR, etc.).

---

## 2. Classification Levels

| Level | Label | Description | Examples | Handling Requirements |
|-------|-------|-------------|----------|----------------------|
| **1** | **Public** | Information approved for unrestricted public access. Disclosure causes no harm. | Marketing materials, public API documentation, published blog posts, open-source code | No special handling. May be stored on public endpoints. No encryption requirement beyond TLS in transit. |
| **2** | **Internal** | Information intended for internal use only. Disclosure could cause minor inconvenience but no significant harm. | Internal project plans, team rosters, non-sensitive meeting notes, internal wiki pages, architecture diagrams | Store on internal/corporate systems only. Access restricted to authenticated employees. Encrypt in transit (TLS 1.2+). |
| **3** | **Confidential** | Sensitive business or personal information. Unauthorized disclosure could cause significant harm to the organization or individuals. | Customer PII (names, emails, phone numbers), financial reports, source code, internal audit reports, employee HR data, API keys | Encrypt at rest and in transit. Access restricted by role (RBAC). Log all access. Mask in non-production environments. Retention policies enforced. |
| **4** | **Restricted** | Highly sensitive information. Unauthorized disclosure could cause severe harm, regulatory penalties, or legal liability. | Payment card data (PCI), health records (PHI), authentication secrets, encryption keys, Social Security numbers, biometric data | Encrypt at rest (CMK via Key Vault) and in transit. Strict need-to-know access. Full audit trail on every access. Data loss prevention (DLP) controls. No copies in non-production without explicit approval and tokenization. |

---

## 3. Data Inventory

| Data Element | Source | Classification Level | Storage Location | Encryption at Rest | Encryption in Transit | Access Control | Retention Period | Notes |
|-------------|--------|---------------------|------------------|--------------------|-----------------------|---------------|-----------------|-------|
| User display name | User registration | Confidential | Azure SQL Database | TDE (AES-256) | TLS 1.2+ | App RBAC - Admin, Support | [RETENTION_PERIOD] | |
| User email address | User registration | Confidential | Azure SQL Database | TDE (AES-256) | TLS 1.2+ | App RBAC - Admin, Support | [RETENTION_PERIOD] | PII |
| User password hash | Authentication | Restricted | Azure SQL Database | TDE (AES-256) | TLS 1.2+ | Application only (no direct human access) | Account lifetime | bcrypt/Argon2 hashed |
| OAuth tokens | Azure AD | Restricted | In-memory / Redis Cache | Encrypted | TLS 1.2+ | Application service identity | Token lifetime | Never persisted to disk |
| Application logs | Application runtime | Internal | Log Analytics Workspace | Platform-managed | TLS 1.2+ | Operations team | [90/365] days | Must not contain PII or secrets |
| Audit trail | Application runtime | Confidential | Log Analytics Workspace | Platform-managed | TLS 1.2+ | Security team, Compliance | [1 YEAR / 7 YEARS] | Immutable storage |
| API keys (third-party) | Configuration | Restricted | Azure Key Vault | HSM-backed | TLS 1.2+ | Managed Identity only | Rotation schedule | Auto-rotated every [90] days |
| Database connection strings | Configuration | Restricted | Azure Key Vault | HSM-backed | TLS 1.2+ | Managed Identity only | Rotation schedule | Prefer Managed Identity auth |
| Financial transaction data | [SOURCE] | Confidential | [STORAGE_LOCATION] | [ENCRYPTION_METHOD] | TLS 1.2+ | [ACCESS_CONTROL] | [RETENTION_PERIOD] | [NOTES] |
| [DATA_ELEMENT] | [SOURCE] | [LEVEL] | [LOCATION] | [ENCRYPTION] | [IN_TRANSIT] | [ACCESS_CONTROL] | [RETENTION] | [NOTES] |

---

## 4. Handling Procedures by Classification Level

### 4.1 Public

| Activity | Requirement |
|----------|-------------|
| Storage | Any storage medium; public cloud storage acceptable |
| Transmission | No restrictions; TLS recommended but not required |
| Sharing | May be shared externally without approval |
| Printing | No restrictions |
| Disposal | No special requirements; standard deletion |
| Backup | Standard backup procedures |
| Non-production use | No restrictions |

### 4.2 Internal

| Activity | Requirement |
|----------|-------------|
| Storage | Corporate-managed systems only (Azure tenant, approved SaaS) |
| Transmission | TLS 1.2+ required for electronic transmission |
| Sharing | Internal employees and approved contractors only; no external sharing without manager approval |
| Printing | Collect promptly; do not leave unattended |
| Disposal | Delete from systems; shred physical copies |
| Backup | Standard backup procedures with access controls |
| Non-production use | Permitted with access controls |

### 4.3 Confidential

| Activity | Requirement |
|----------|-------------|
| Storage | Encrypted at rest (AES-256 or equivalent); Azure managed or customer-managed keys |
| Transmission | TLS 1.2+ required; encrypted email or secure file transfer for external sharing |
| Sharing | Need-to-know basis; requires data owner approval for external sharing; NDA required for third parties |
| Printing | Minimize; label as confidential; shred after use |
| Disposal | Cryptographic erasure or certified destruction; maintain disposal records |
| Backup | Encrypted backups; backup access restricted to authorized personnel |
| Non-production use | Data masking or synthetic data required; no raw confidential data in dev/test without explicit approval |

### 4.4 Restricted

| Activity | Requirement |
|----------|-------------|
| Storage | Encrypted at rest with customer-managed keys (Azure Key Vault CMK); dedicated storage with access logging |
| Transmission | TLS 1.2+ with strong cipher suites; application-layer encryption for highly sensitive fields |
| Sharing | Strict need-to-know; requires CISO or data owner approval; encrypted channels only; full audit trail |
| Printing | Prohibited unless explicitly authorized; watermarked; shred immediately after use |
| Disposal | Cryptographic erasure with certificate of destruction; maintain records for compliance audit |
| Backup | Encrypted backups with separate access controls; backup tested for restore integrity |
| Non-production use | Prohibited without CISO approval; must use tokenized or synthetic data; full audit if approved |

---

## 5. Access Control Matrix

This matrix defines which roles can access data at each classification level and what actions they can perform.

| Role | Public | Internal | Confidential | Restricted |
|------|--------|----------|--------------|------------|
| **End User** | Read | Read (own data) | Read (own data only) | No access |
| **Support Agent** | Read | Read | Read (assigned cases) | No access |
| **Application Developer** | Read / Write | Read / Write | Read (masked in non-prod) | No access |
| **DevOps Engineer** | Read / Write | Read / Write | Read (operational logs only) | Read (Key Vault via pipeline only) |
| **Team Lead / Manager** | Read / Write | Read / Write | Read / Write (team scope) | Read (with approval) |
| **Security Engineer** | Read / Write | Read / Write | Read / Write / Audit | Read / Audit (with approval) |
| **DBA / Data Engineer** | Read / Write | Read / Write | Read / Write | Read / Write (with CISO approval, full audit) |
| **CISO / Security Director** | Full | Full | Full | Full |
| **External Auditor** | Read | Read (scoped) | Read (scoped, time-limited) | Read (scoped, time-limited, escorted) |
| **Service Principal (CI/CD)** | As configured | As configured | As configured (Managed Identity) | Key Vault secrets access only |

> **Note:** All access to Confidential and Restricted data must be logged and auditable. Access reviews are conducted [QUARTERLY / SEMI-ANNUALLY].

---

## 6. Incident Procedures for Data Exposure

### 6.1 General Incident Response Flow

1. **Detection** - Data exposure identified (automated alert, manual discovery, or third-party report)
2. **Containment** - Immediately restrict access and stop further exposure
3. **Assessment** - Determine classification level of exposed data, scope of exposure, and affected individuals
4. **Escalation** - Follow escalation path based on classification level (see below)
5. **Notification** - Notify required parties per classification level
6. **Remediation** - Fix the root cause of the exposure
7. **Post-Incident Review** - Document lessons learned and update controls

### 6.2 Escalation by Classification Level

| Classification | Response Time | Escalation Path | Notification Requirements | Regulatory Reporting |
|---------------|--------------|-----------------|--------------------------|---------------------|
| **Public** | Best effort | Team lead | None required | None |
| **Internal** | 24 hours | Team lead, Security team | Internal stakeholders | None |
| **Confidential** | 4 hours | Security team, CISO, Legal | Affected individuals (if PII); executive leadership | GDPR (72 hrs), state breach notification laws as applicable |
| **Restricted** | 1 hour | CISO, Legal, CTO, CEO | Affected individuals, regulatory bodies, potentially law enforcement | GDPR (72 hrs), PCI DSS (immediately), HIPAA (60 days), state/federal laws |

### 6.3 Classification-Specific Procedures

#### Public Data Exposure
- [ ] Verify the data is truly classified as Public
- [ ] If misclassified, re-assess and follow the appropriate procedure
- [ ] No further action required for confirmed Public data

#### Internal Data Exposure
- [ ] Contain the exposure (revoke access, remove from public location)
- [ ] Notify team lead and security team within 24 hours
- [ ] Document the incident in the incident tracking system
- [ ] Conduct root cause analysis
- [ ] Implement corrective controls

#### Confidential Data Exposure
- [ ] Immediately contain the exposure
- [ ] Notify security team and CISO within 4 hours
- [ ] Engage Legal for regulatory assessment
- [ ] Identify all affected individuals
- [ ] Prepare breach notification if PII is involved (GDPR: 72-hour window)
- [ ] Rotate any exposed credentials or secrets
- [ ] Preserve forensic evidence
- [ ] Conduct full incident review and update threat model

#### Restricted Data Exposure
- [ ] Immediately contain the exposure (all-hands priority)
- [ ] Notify CISO, Legal, CTO within 1 hour
- [ ] Activate incident response team
- [ ] Engage external forensics if needed
- [ ] Notify regulatory bodies per applicable regulations
- [ ] Notify affected individuals per legal requirements
- [ ] Rotate all potentially compromised credentials and keys
- [ ] Preserve all forensic evidence (chain of custody)
- [ ] Executive-level incident review
- [ ] Update security controls, policies, and training

---

## 7. References

| Document | Link |
|----------|------|
| Enterprise Data Classification Policy | [LINK_TO_ENTERPRISE_POLICY] |
| Threat Model | [LINK_TO_THREAT_MODEL] |
| Security Review Checklist | [LINK_TO_SECURITY_CHECKLIST] |
| Incident Response Plan | [LINK_TO_INCIDENT_RESPONSE_PLAN] |
| Data Retention Policy | [LINK_TO_RETENTION_POLICY] |
| Privacy Policy | [LINK_TO_PRIVACY_POLICY] |

---

## 8. Approval

| Name | Role | Signature / Approval | Date |
|------|------|---------------------|------|
| [DATA_OWNER] | Data Owner | | [YYYY-MM-DD] |
| [SECURITY_LEAD] | Security Lead | | [YYYY-MM-DD] |
| [COMPLIANCE_OFFICER] | Compliance Officer | | [YYYY-MM-DD] |
| [PROJECT_MANAGER] | Project Manager | | [YYYY-MM-DD] |
