# Azure Infrastructure Overview

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Azure Infrastructure Overview      |
| Last Updated     | 2026-02-14                         |
| Status           | Draft                              |
| Owner            | IntelliSec Solutions               |

---

## 1. Document Purpose

This document provides a comprehensive overview of the Azure infrastructure underpinning the CMMC Assessor Platform. It serves as the authoritative reference for subscription strategy, resource organization, regional deployment, service inventory, governance policies, and cost management.

---

## 2. Azure Subscription Strategy

### 2.1 Subscription Model

| Attribute                | Value                                              |
|--------------------------|----------------------------------------------------|
| Model                    | Single Subscription                                |
| Management Group Hierarchy | N/A -- single subscription, no management group hierarchy configured |
| Naming Convention        | N/A -- single subscription used for all workloads  |

### 2.2 Subscription Inventory

| Subscription Name          | Subscription ID                        | Purpose                  | Environment        | Monthly Budget |
|----------------------------|----------------------------------------|--------------------------|---------------------|----------------|
| CMMC Assessor Production   | (Refer to Azure Portal)               | All workloads            | Production          | CAD ~$70       |

> **Note:** Only a single subscription exists. There are no separate subscriptions for non-production or shared services. A staging/dev subscription is planned but NOT IMPLEMENTED.

### 2.3 Management Group Hierarchy

```
N/A -- No management group hierarchy is configured.
The project operates under a single subscription with a single resource group.
```

---

## 3. Resource Group Naming Convention and Organization

### 3.1 Naming Convention

```
{type}-{baseName}-{env}
```

| Token           | Description                        | Examples                        |
|-----------------|------------------------------------|---------------------------------|
| `{type}`        | Azure resource type abbreviation   | `psql`, `kv`, `cae`, `log`     |
| `{baseName}`    | Project name                       | `cmmc-assessor`                 |
| `{env}`         | Deployment environment             | `prod`                          |

### 3.2 Resource Group Inventory

| Resource Group Name             | Subscription         | Region           | Purpose                          | Owner                |
|---------------------------------|----------------------|------------------|----------------------------------|----------------------|
| rg-cmmc-assessor-prod           | CMMC Assessor Prod   | Canada Central   | All production resources         | IntelliSec Solutions |

> **Note:** All resources are deployed to a single resource group. No separation between application, data, and infrastructure tiers.

---

## 4. Azure Region Strategy

| Attribute                        | Value                                                    |
|----------------------------------|----------------------------------------------------------|
| Primary Region                   | Canada Central (canadacentral)                           |
| Secondary / DR Region            | NOT IMPLEMENTED -- no DR region configured               |
| Rationale for Primary            | Data residency requirements for Canadian clients, proximity to users |
| Rationale for Secondary          | N/A                                                      |
| Data Residency Requirements      | Data should reside within Canada                         |
| Region Pair                      | Canada Central <-> Canada East (not leveraged)           |

### Region Selection Considerations

- [x] Compliance and data sovereignty requirements verified
- [x] Required Azure services available in selected regions
- [x] Latency requirements validated with target user base
- [ ] Region pair strategy aligns with DR requirements -- **NOT IMPLEMENTED**
- [x] Cost differences between regions evaluated

### Planned Improvements

- Evaluate Canada East as a DR region
- Implement geo-redundant backups leveraging the region pair

---

## 5. Azure Services Inventory

| Service Type             | Resource Name                  | SKU / Tier                    | Resource Group              | Region           | Purpose                            | Monthly Cost Estimate (CAD) |
|--------------------------|--------------------------------|-------------------------------|-----------------------------|-----------------|------------------------------------|------------------------------|
| Container Apps           | cmmc-api                       | Consumption (0.5 CPU, 1Gi)   | rg-cmmc-assessor-prod       | Canada Central   | Backend API service                | $0-35                        |
| Container Apps           | cmmc-web                       | Consumption (0.25 CPU, 0.5Gi)| rg-cmmc-assessor-prod       | Canada Central   | Frontend web application           | $0-10                        |
| Container Registry       | acrcmmcassessorprod             | Basic                         | rg-cmmc-assessor-prod       | Canada Central   | Container image storage            | ~$7                          |
| PostgreSQL Flexible      | psql-cmmc-assessor-prod         | B1ms (1 vCore, 2GB, 32GB)   | rg-cmmc-assessor-prod       | Canada Central   | Primary relational datastore       | ~$22                         |
| Storage Account          | stcmmcassessorprod              | Standard_LRS                  | rg-cmmc-assessor-prod       | Canada Central   | Blob and file storage              | ~$2                          |
| Key Vault                | kv-cmmc-assessor-prod           | Standard                      | rg-cmmc-assessor-prod       | Canada Central   | Secrets management                 | ~$4                          |
| Log Analytics            | log-cmmc-assessor-prod          | PerGB2018 (30-day retention) | rg-cmmc-assessor-prod       | Canada Central   | Centralized log aggregation        | ~$0 (free tier)              |
| Container Apps Environment | cae-cmmc-assessor-prod        | Consumption                   | rg-cmmc-assessor-prod       | Canada Central   | Container Apps hosting environment | Included                     |
| **Total**                |                                 |                               |                             |                  |                                    | **~$35-70**                  |

---

## 6. Azure Landing Zone Alignment

| Attribute                           | Value                                                      |
|-------------------------------------|------------------------------------------------------------|
| Landing Zone Framework              | N/A -- no landing zone framework adopted                   |
| Reference Architecture              | N/A                                                        |
| Hub-Spoke / Virtual WAN             | N/A -- no VNet deployed (security finding F-09)            |
| Platform Landing Zone               | N/A                                                        |
| Application Landing Zone            | Single resource group, flat architecture                   |

### Landing Zone Compliance Checklist

- [ ] Identity and access management aligned with landing zone design -- **NOT IMPLEMENTED**
- [ ] Network topology follows hub-spoke / Virtual WAN pattern -- **NOT IMPLEMENTED (F-09)**
- [ ] Logging and monitoring centralized in management subscription -- **Partial: Log Analytics exists but limited**
- [ ] Security baselines applied via Azure Policy -- **NOT IMPLEMENTED**
- [ ] Subscription vending process defined -- **N/A (single subscription)**

### Planned Improvements

- Adopt Azure Landing Zone best practices as the project matures
- Implement VNet integration as part of Phase 1 remediation (F-09)

---

## 7. Tagging Strategy

### 7.1 Tag Taxonomy

| Tag Name            | Required / Optional | Example Value             | Purpose                                    |
|---------------------|---------------------|---------------------------|--------------------------------------------|
| `project`           | Required            | `cmmc-assessor`           | Associate resource with the project        |
| `environment`       | Required            | `production`              | Identify deployment environment            |
| `managedBy`         | Required            | `bicep`                   | Track provisioning method (IaC tool)       |

### 7.2 Tag Enforcement

| Enforcement Method   | Scope                  | Tags Enforced                              | Effect           |
|----------------------|------------------------|--------------------------------------------|------------------|
| Bicep Templates      | All IaC deployments    | `project`, `environment`, `managedBy`      | Hard-coded       |
| Azure Policy         | NOT IMPLEMENTED        | N/A                                        | N/A              |

> **Note:** Tag enforcement via Azure Policy is NOT IMPLEMENTED. Tags are currently only applied through Bicep templates. No deny/audit policies exist.

### Planned Improvements

- Add Azure Policy to enforce required tags at the resource group scope
- Add additional tags: `Owner`, `CostCenter`, `DataClassification`

---

## 8. Cost Management

### 8.1 Azure Cost Management Configuration

| Attribute                      | Value                                          |
|--------------------------------|------------------------------------------------|
| Cost Management Scope          | Subscription                                   |
| Budget Notification Threshold  | NOT IMPLEMENTED                                |
| Budget Alert Recipients        | NOT IMPLEMENTED                                |
| Cost Anomaly Detection         | NOT IMPLEMENTED                                |
| Export Schedule                 | NOT IMPLEMENTED                                |
| Reporting Frequency            | Ad-hoc manual review                           |

### 8.2 Budget Summary

| Subscription / Scope        | Monthly Budget    | Alert Thresholds        | Action Group              |
|------------------------------|-------------------|-------------------------|---------------------------|
| CMMC Assessor Production     | CAD ~$70 (soft)   | NOT IMPLEMENTED         | NOT IMPLEMENTED           |

### 8.3 Cost Optimization Measures

- [ ] Reserved Instances purchased for predictable workloads -- **N/A (Consumption model)**
- [ ] Azure Savings Plans evaluated for compute -- **Not evaluated**
- [ ] Auto-shutdown configured for non-production VMs -- **N/A (no VMs)**
- [x] Container Apps scale-to-zero configured for cost optimization
- [ ] Storage lifecycle management policies in place -- **NOT IMPLEMENTED**
- [ ] Unused resources identified and decommissioned (Azure Advisor) -- **Not reviewed**
- [ ] Right-sizing recommendations reviewed monthly -- **NOT IMPLEMENTED**

### Planned Improvements

- Set up Azure budget alerts at CAD $100/month threshold
- Configure cost anomaly detection
- Review Azure Advisor recommendations monthly

---

## 9. Azure Governance

### 9.1 Azure Policy Assignments

| Policy / Initiative                     | Scope                  | Effect       | Purpose                                     |
|-----------------------------------------|------------------------|--------------|---------------------------------------------|
| NOT IMPLEMENTED                         | N/A                    | N/A          | No Azure Policies are configured            |

> **Status: NOT IMPLEMENTED.** No Azure Policies are assigned. Governance is currently managed manually through IaC (Bicep) and code review processes.

### 9.2 Azure Blueprints (if applicable)

N/A -- Azure Blueprints are not used.

### 9.3 Regulatory Compliance

| Standard              | Azure Compliance Status | Assessment Frequency | Owner                |
|-----------------------|------------------------|----------------------|----------------------|
| CMMC Level 2          | In Progress            | Continuous           | IntelliSec Solutions |

> **Note:** The platform itself is a CMMC assessment tool. The platform's own compliance posture is being hardened through ongoing security remediation (tracked as security findings F-01 through F-43+).

---

## 10. Revision History

| Date           | Author            | Changes Made                              |
|----------------|-------------------|-------------------------------------------|
| 2026-02-14     | IntelliSec Solutions | Initial document creation              |
