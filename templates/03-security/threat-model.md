# Threat Model

| **Page Title**   | Threat Model - [PROJECT_NAME]           |
|------------------|-----------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                            |
| **Status**       | NOT STARTED / IN PROGRESS / COMPLETE    |
| **Owner**        | [SECURITY_LEAD_NAME]                    |
| **Reviewers**    | [REVIEWER_NAMES]                        |
| **Methodology**  | STRIDE                                  |

---

## 1. Document Purpose

This threat model identifies, categorizes, and prioritizes potential security threats to **[PROJECT_NAME]** using the STRIDE methodology. It documents attack surfaces, trust boundaries, and mitigations to ensure the system meets enterprise security standards before progressing through approval gates.

---

## 2. STRIDE Methodology Overview

STRIDE is a threat classification model developed by Microsoft. Each category represents a type of security threat:

| Category                 | Abbreviation | Description                                                        | Security Property Violated |
|--------------------------|--------------|--------------------------------------------------------------------|----------------------------|
| **Spoofing**             | S            | Impersonating a user, system, or component                        | Authentication             |
| **Tampering**            | T            | Unauthorized modification of data or code                          | Integrity                  |
| **Repudiation**          | R            | Denying actions without the ability to prove otherwise             | Non-repudiation            |
| **Information Disclosure** | I          | Exposing data to unauthorized parties                              | Confidentiality            |
| **Denial of Service**    | D            | Disrupting availability of a service or resource                   | Availability               |
| **Elevation of Privilege** | E          | Gaining unauthorized access to higher privilege levels             | Authorization              |

---

## 3. System Decomposition

### 3.1 System Overview

| Attribute                | Details                                      |
|--------------------------|----------------------------------------------|
| **Application Name**     | [PROJECT_NAME]                               |
| **Environment**          | Azure ([AZURE_REGION])                       |
| **Deployment Model**     | [APP_SERVICE / AKS / CONTAINER_APPS / VMs]   |
| **Authentication**       | Azure AD / Entra ID                          |
| **Data Stores**          | [AZURE_SQL / COSMOS_DB / STORAGE_ACCOUNT]    |
| **External Integrations**| [LIST_EXTERNAL_SYSTEMS]                      |

### 3.2 Trust Boundaries

Define the boundaries where trust levels change. Each boundary represents a point where data crosses between zones of different trust.

| Boundary ID | Boundary Name               | From Zone              | To Zone                 | Protocol / Interface     |
|-------------|-----------------------------|------------------------|-------------------------|--------------------------|
| TB-001      | Internet to WAF             | Public Internet        | Azure Front Door / WAF  | HTTPS                    |
| TB-002      | WAF to Application          | DMZ / Front Door       | App Service / AKS       | HTTPS                    |
| TB-003      | Application to Database     | Application Tier       | Data Tier               | TDS (TLS) / HTTPS        |
| TB-004      | Application to Key Vault    | Application Tier       | Secrets Management      | HTTPS (Managed Identity) |
| TB-005      | [BOUNDARY_NAME]             | [FROM_ZONE]            | [TO_ZONE]               | [PROTOCOL]               |

### 3.3 Entry Points

| Entry Point ID | Name                      | Description                          | Trust Level Required | Protocol |
|----------------|---------------------------|--------------------------------------|----------------------|----------|
| EP-001         | Public API endpoint       | [DESCRIPTION]                        | Authenticated User   | HTTPS    |
| EP-002         | Admin portal              | [DESCRIPTION]                        | Admin Role           | HTTPS    |
| EP-003         | CI/CD pipeline            | GitHub Actions deployment            | Service Principal    | HTTPS    |
| EP-004         | [ENTRY_POINT_NAME]        | [DESCRIPTION]                        | [TRUST_LEVEL]        | [PROTO]  |

### 3.4 Assets

| Asset ID | Asset Name            | Description                       | Classification | Storage Location         |
|----------|-----------------------|-----------------------------------|----------------|--------------------------|
| A-001    | User PII              | [DESCRIPTION]                     | Confidential   | [AZURE_SQL / COSMOS_DB]  |
| A-002    | Authentication tokens  | OAuth2 / JWT tokens               | Restricted     | In-memory / cache        |
| A-003    | Application secrets    | API keys, connection strings      | Restricted     | Azure Key Vault          |
| A-004    | Audit logs             | User activity and system events   | Internal       | Log Analytics Workspace  |
| A-005    | [ASSET_NAME]          | [DESCRIPTION]                     | [LEVEL]        | [LOCATION]               |

---

## 4. Data Flow Diagram

> **Instructions:** Insert or link to the data flow diagram (DFD) showing trust boundaries, data stores, processes, and external entities. Use a tool such as Microsoft Threat Modeling Tool, draw.io, or Lucidchart.

```
[INSERT DATA FLOW DIAGRAM HERE]

Suggested format:
- External entities (rectangles)
- Processes (circles)
- Data stores (parallel lines)
- Data flows (arrows with labels)
- Trust boundaries (dashed boxes)
```

**DFD Link:** [LINK_TO_DIAGRAM]

**Tool Used:** [MICROSOFT_THREAT_MODELING_TOOL / DRAW_IO / LUCIDCHART]

---

## 5. Threat Identification

| Threat ID | Category (STRIDE) | Threat Description                                                     | Component Affected          | Likelihood (H/M/L) | Impact (H/M/L) | Risk Rating | Mitigation                                          | Status                          |
|-----------|--------------------|------------------------------------------------------------------------|-----------------------------|---------------------|-----------------|-------------|-----------------------------------------------------|---------------------------------|
| T-001     | Spoofing           | Attacker impersonates a legitimate user via stolen credentials         | Authentication service      | M                   | H               | High        | Enforce MFA via Azure AD Conditional Access         | NOT STARTED / IN PROGRESS / COMPLETE |
| T-002     | Tampering          | API request body modified in transit                                   | Public API endpoint         | L                   | H               | Medium      | Enforce TLS 1.2+, implement request signing         | NOT STARTED / IN PROGRESS / COMPLETE |
| T-003     | Repudiation        | User denies performing a destructive action                            | Application tier            | M                   | M               | Medium      | Comprehensive audit logging to Log Analytics        | NOT STARTED / IN PROGRESS / COMPLETE |
| T-004     | Info Disclosure    | Database connection string exposed in logs or config                   | Application configuration   | M                   | H               | High        | Use Managed Identity, no secrets in app config      | NOT STARTED / IN PROGRESS / COMPLETE |
| T-005     | Denial of Service  | Volumetric DDoS attack against public endpoints                       | Azure Front Door / WAF      | H                   | H               | Critical    | Enable Azure DDoS Protection Standard, WAF rules    | NOT STARTED / IN PROGRESS / COMPLETE |
| T-006     | Elevation of Priv  | Unauthorized user escalates to admin role via RBAC misconfiguration    | RBAC / Azure AD             | L                   | H               | Medium      | Least-privilege RBAC, regular access reviews        | NOT STARTED / IN PROGRESS / COMPLETE |
| T-007     | [CATEGORY]         | [THREAT_DESCRIPTION]                                                   | [COMPONENT]                 | [H/M/L]             | [H/M/L]         | [RATING]    | [MITIGATION]                                        | NOT STARTED / IN PROGRESS / COMPLETE |

### Risk Rating Matrix

|                    | **Impact: Low** | **Impact: Medium** | **Impact: High** |
|--------------------|-----------------|---------------------|-------------------|
| **Likelihood: High**  | Medium          | High                | Critical          |
| **Likelihood: Medium**| Low             | Medium              | High              |
| **Likelihood: Low**   | Low             | Low                 | Medium            |

---

## 6. Attack Surface Analysis

| Surface Area            | Exposure Level | Description                                         | Hardening Measures                              |
|-------------------------|----------------|-----------------------------------------------------|-------------------------------------------------|
| Public API endpoints    | High           | REST APIs exposed to internet via Front Door         | WAF rules, rate limiting, input validation      |
| Authentication endpoint | High           | Azure AD login / token endpoint                      | Conditional Access, MFA, token lifetime policies|
| Management plane        | Medium         | Azure Portal / ARM API access                        | PIM for admin roles, IP restrictions             |
| CI/CD pipeline          | Medium         | GitHub Actions with Azure service principal          | Federated credentials, environment protection    |
| Internal APIs           | Low            | Service-to-service communication within VNET         | mTLS, NSG rules, private endpoints               |
| Storage accounts        | Medium         | Blob / table storage for application data            | Private endpoints, SAS token rotation, RBAC      |
| [SURFACE_AREA]          | [LEVEL]        | [DESCRIPTION]                                       | [HARDENING_MEASURES]                             |

---

## 7. Mitigations Summary

### 7.1 Critical Priority

| Mitigation ID | Threat(s) Addressed | Mitigation Description                                | Owner              | Target Date  | Status                          |
|---------------|----------------------|-------------------------------------------------------|--------------------|--------------|----------------------------------|
| M-001         | T-005                | Enable Azure DDoS Protection Standard                 | [OWNER]            | [YYYY-MM-DD] | NOT STARTED / IN PROGRESS / COMPLETE |
| M-002         | T-001                | Enforce MFA for all user accounts via Conditional Access | [OWNER]         | [YYYY-MM-DD] | NOT STARTED / IN PROGRESS / COMPLETE |
| [M-ID]        | [THREAT_IDS]         | [DESCRIPTION]                                         | [OWNER]            | [YYYY-MM-DD] | NOT STARTED / IN PROGRESS / COMPLETE |

### 7.2 High Priority

| Mitigation ID | Threat(s) Addressed | Mitigation Description                                | Owner              | Target Date  | Status                          |
|---------------|----------------------|-------------------------------------------------------|--------------------|--------------|----------------------------------|
| M-003         | T-004                | Migrate all secrets to Azure Key Vault, use Managed Identity | [OWNER]       | [YYYY-MM-DD] | NOT STARTED / IN PROGRESS / COMPLETE |
| [M-ID]        | [THREAT_IDS]         | [DESCRIPTION]                                         | [OWNER]            | [YYYY-MM-DD] | NOT STARTED / IN PROGRESS / COMPLETE |

### 7.3 Medium Priority

| Mitigation ID | Threat(s) Addressed | Mitigation Description                                | Owner              | Target Date  | Status                          |
|---------------|----------------------|-------------------------------------------------------|--------------------|--------------|----------------------------------|
| M-004         | T-002                | Implement request signing for sensitive API operations | [OWNER]            | [YYYY-MM-DD] | NOT STARTED / IN PROGRESS / COMPLETE |
| M-005         | T-003, T-006         | Implement comprehensive audit logging and access reviews | [OWNER]          | [YYYY-MM-DD] | NOT STARTED / IN PROGRESS / COMPLETE |
| [M-ID]        | [THREAT_IDS]         | [DESCRIPTION]                                         | [OWNER]            | [YYYY-MM-DD] | NOT STARTED / IN PROGRESS / COMPLETE |

### 7.4 Low Priority

| Mitigation ID | Threat(s) Addressed | Mitigation Description                                | Owner              | Target Date  | Status                          |
|---------------|----------------------|-------------------------------------------------------|--------------------|--------------|----------------------------------|
| [M-ID]        | [THREAT_IDS]         | [DESCRIPTION]                                         | [OWNER]            | [YYYY-MM-DD] | NOT STARTED / IN PROGRESS / COMPLETE |

---

## 8. Residual Risk Acceptance

Residual risks are those that remain after mitigations have been applied. Each must be formally accepted by an authorized stakeholder.

| Risk ID | Residual Risk Description                                       | Accepted By            | Role                   | Date         | Justification / Rationale                                       |
|---------|-----------------------------------------------------------------|------------------------|------------------------|--------------|-----------------------------------------------------------------|
| RR-001  | [RESIDUAL_RISK_DESCRIPTION]                                     | [ACCEPTOR_NAME]        | [ROLE]                 | [YYYY-MM-DD] | [JUSTIFICATION]                                                 |
| RR-002  | [RESIDUAL_RISK_DESCRIPTION]                                     | [ACCEPTOR_NAME]        | [ROLE]                 | [YYYY-MM-DD] | [JUSTIFICATION]                                                 |

> **Policy:** Residual risks rated **Critical** or **High** require acceptance by the **[CISO / VP_ENGINEERING / SECURITY_DIRECTOR]**. Medium and Low risks may be accepted by the **[PROJECT_SECURITY_LEAD]**.

---

## 9. Review Schedule

| Review Type               | Frequency         | Next Review Date | Responsible Party      |
|---------------------------|--------------------|------------------|------------------------|
| Full threat model review  | Annually           | [YYYY-MM-DD]     | [SECURITY_LEAD]        |
| Incremental update        | Each major release | [YYYY-MM-DD]     | [DEVELOPMENT_LEAD]     |
| Post-incident review      | After incidents    | As needed        | [INCIDENT_RESPONSE_TEAM] |
| Risk acceptance re-validation | Quarterly      | [YYYY-MM-DD]     | [SECURITY_LEAD]        |

---

## 10. References

| Document                        | Link                        |
|---------------------------------|-----------------------------|
| Security Review Checklist       | [LINK_TO_CHECKLIST]         |
| Data Classification Policy      | [LINK_TO_DATA_CLASSIFICATION] |
| Architecture Decision Records   | [LINK_TO_ADRs]              |
| High-Level Design               | [LINK_TO_HLD]               |
| Microsoft STRIDE Reference      | https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool |

---

## Approval

| Name               | Role                  | Signature / Approval | Date         |
|--------------------|-----------------------|----------------------|--------------|
| [SECURITY_LEAD]    | Security Lead         |                      | [YYYY-MM-DD] |
| [ARCHITECT_NAME]   | Solution Architect    |                      | [YYYY-MM-DD] |
| [PROJECT_MANAGER]  | Project Manager       |                      | [YYYY-MM-DD] |
