# Azure Infrastructure Overview

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Azure Infrastructure Overview      |
| Last Updated     | [YYYY-MM-DD]                       |
| Status           | [Draft / In Review / Approved]     |
| Owner            | [TEAM OR INDIVIDUAL NAME]          |

---

## 1. Document Purpose

This document provides a comprehensive overview of the Azure infrastructure underpinning the [PROJECT NAME] platform. It serves as the authoritative reference for subscription strategy, resource organization, regional deployment, service inventory, governance policies, and cost management.

---

## 2. Azure Subscription Strategy

### 2.1 Subscription Model

| Attribute                | Value                                              |
|--------------------------|----------------------------------------------------|
| Model                    | [Single Subscription / Multi-Subscription]         |
| Management Group Hierarchy | [MANAGEMENT GROUP STRUCTURE]                     |
| Naming Convention        | [e.g., sub-{org}-{workload}-{environment}]         |

### 2.2 Subscription Inventory

| Subscription Name          | Subscription ID                        | Purpose                  | Environment        | Monthly Budget |
|----------------------------|----------------------------------------|--------------------------|---------------------|----------------|
| [SUBSCRIPTION NAME]        | [xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx] | [Production workloads]   | [Production]        | [USD $X,XXX]   |
| [SUBSCRIPTION NAME]        | [xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx] | [Non-production]         | [Dev / Staging]     | [USD $X,XXX]   |
| [SUBSCRIPTION NAME]        | [xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx] | [Shared services / Hub]  | [All]               | [USD $X,XXX]   |

### 2.3 Management Group Hierarchy

```
Tenant Root Group
 +-- [ORG NAME]
      +-- Platform
      |    +-- Connectivity
      |    +-- Identity
      |    +-- Management
      +-- Landing Zones
      |    +-- Production
      |    +-- Non-Production
      +-- Sandbox
```

---

## 3. Resource Group Naming Convention and Organization

### 3.1 Naming Convention

```
rg-{workload}-{environment}-{region}-{instance}
```

| Token         | Description                        | Examples                        |
|---------------|------------------------------------|---------------------------------|
| `{workload}`  | Application or service name        | `app`, `data`, `infra`          |
| `{environment}` | Deployment environment           | `dev`, `stg`, `prod`            |
| `{region}`    | Azure region abbreviation          | `eus`, `wus`, `weu`             |
| `{instance}`  | Optional numeric instance          | `001`, `002`                    |

### 3.2 Resource Group Inventory

| Resource Group Name             | Subscription         | Region         | Purpose                          | Owner            |
|---------------------------------|----------------------|----------------|----------------------------------|------------------|
| [rg-app-prod-eus-001]          | [Production]         | [East US]      | [Production application tier]    | [TEAM NAME]      |
| [rg-data-prod-eus-001]         | [Production]         | [East US]      | [Production data tier]           | [TEAM NAME]      |
| [rg-infra-prod-eus-001]        | [Production]         | [East US]      | [Shared infrastructure]          | [TEAM NAME]      |
| [rg-app-dev-eus-001]           | [Non-Production]     | [East US]      | [Development environment]        | [TEAM NAME]      |

---

## 4. Azure Region Strategy

| Attribute                        | Value                                                    |
|----------------------------------|----------------------------------------------------------|
| Primary Region                   | [e.g., East US / eastus]                                 |
| Secondary / DR Region            | [e.g., West US / westus]                                 |
| Rationale for Primary            | [e.g., proximity to users, service availability, compliance] |
| Rationale for Secondary          | [e.g., geographic separation, paired region benefits]    |
| Data Residency Requirements      | [e.g., data must reside within the US]                   |
| Region Pair                      | [e.g., East US <-> West US]                              |

### Region Selection Considerations

- [ ] Compliance and data sovereignty requirements verified
- [ ] Required Azure services available in selected regions
- [ ] Latency requirements validated with target user base
- [ ] Region pair strategy aligns with DR requirements
- [ ] Cost differences between regions evaluated

---

## 5. Azure Services Inventory

| Service Type       | Resource Name                  | SKU / Tier          | Resource Group              | Region     | Purpose                            | Monthly Cost Estimate |
|--------------------|--------------------------------|---------------------|-----------------------------|------------|------------------------------------|-----------------------|
| AKS                | [aks-app-prod-eus-001]         | [Standard]          | [rg-app-prod-eus-001]       | [East US]  | [Container orchestration]          | [USD $X,XXX]          |
| App Service        | [app-web-prod-eus-001]         | [P1v3]              | [rg-app-prod-eus-001]       | [East US]  | [Web frontend]                     | [USD $XXX]            |
| Azure Functions    | [func-proc-prod-eus-001]       | [Premium EP1]       | [rg-app-prod-eus-001]       | [East US]  | [Background processing]            | [USD $XXX]            |
| Virtual Machine    | [vm-legacy-prod-eus-001]       | [Standard_D4s_v5]   | [rg-app-prod-eus-001]       | [East US]  | [Legacy service hosting]           | [USD $XXX]            |
| SQL Database       | [sql-db-prod-eus-001]          | [Business Critical] | [rg-data-prod-eus-001]      | [East US]  | [Primary relational datastore]     | [USD $X,XXX]          |
| Storage Account    | [stapprodeus001]               | [Standard LRS]      | [rg-data-prod-eus-001]      | [East US]  | [Blob and file storage]            | [USD $XXX]            |
| Key Vault          | [kv-app-prod-eus-001]          | [Standard]          | [rg-infra-prod-eus-001]     | [East US]  | [Secrets management]               | [USD $XX]             |
| Application Insights | [ai-app-prod-eus-001]        | [Pay-as-you-go]     | [rg-infra-prod-eus-001]     | [East US]  | [Application monitoring]           | [USD $XXX]            |
| [SERVICE TYPE]     | [RESOURCE NAME]                | [SKU/TIER]          | [RESOURCE GROUP]            | [REGION]   | [PURPOSE]                          | [USD $X,XXX]          |

---

## 6. Azure Landing Zone Alignment

| Attribute                           | Value                                                      |
|-------------------------------------|------------------------------------------------------------|
| Landing Zone Framework              | [Azure Landing Zone / CAF / Custom]                        |
| Reference Architecture              | [e.g., Enterprise-Scale, Start Small]                      |
| Hub-Spoke / Virtual WAN             | [Hub-Spoke / Virtual WAN / N/A]                            |
| Platform Landing Zone               | [Connectivity, Identity, Management subscription details]  |
| Application Landing Zone            | [Workload subscription details]                            |

### Landing Zone Compliance Checklist

- [ ] Identity and access management aligned with landing zone design
- [ ] Network topology follows hub-spoke / Virtual WAN pattern
- [ ] Logging and monitoring centralized in management subscription
- [ ] Security baselines applied via Azure Policy
- [ ] Subscription vending process defined

---

## 7. Tagging Strategy

### 7.1 Tag Taxonomy

| Tag Name            | Required / Optional | Example Value             | Purpose                                    |
|---------------------|---------------------|---------------------------|--------------------------------------------|
| `Environment`       | Required            | `Production`              | Identify deployment environment            |
| `Application`       | Required            | `[PROJECT NAME]`          | Associate resource with application        |
| `Owner`             | Required            | `[team@company.com]`      | Identify responsible team                  |
| `CostCenter`        | Required            | `[CC-12345]`              | Financial tracking and chargeback          |
| `Department`        | Optional            | `[Engineering]`           | Organizational mapping                     |
| `CreatedBy`         | Optional            | `[Terraform / Manual]`    | Track provisioning method                  |
| `DataClassification`| Required            | `[Confidential]`          | Data handling requirements                 |
| `Compliance`        | Optional            | `[SOC2 / HIPAA / N/A]`    | Regulatory compliance scope                |
| `DR-Tier`           | Optional            | `[Tier-1]`                | Disaster recovery priority                 |
| `MaintenanceWindow` | Optional            | `[Sat 02:00-06:00 UTC]`   | Scheduled maintenance window               |

### 7.2 Tag Enforcement

| Enforcement Method   | Scope                  | Tags Enforced                         | Effect           |
|----------------------|------------------------|---------------------------------------|------------------|
| Azure Policy         | [Management Group]     | `Environment`, `Application`, `Owner` | [Deny / Audit]   |
| IaC Template Default | [All IaC deployments]  | All required tags                     | [Hard-coded]     |
| Manual Review        | [Ad-hoc resources]     | All tags                              | [Governance]     |

---

## 8. Cost Management

### 8.1 Azure Cost Management Configuration

| Attribute                      | Value                                          |
|--------------------------------|------------------------------------------------|
| Cost Management Scope          | [Subscription / Management Group]              |
| Budget Notification Threshold  | [50%, 75%, 90%, 100%]                          |
| Budget Alert Recipients        | [DISTRIBUTION LIST OR TEAM EMAIL]              |
| Cost Anomaly Detection         | [Enabled / Disabled]                           |
| Export Schedule                 | [Daily / Weekly export to Storage Account]     |
| Reporting Frequency            | [Monthly cost review cadence]                  |

### 8.2 Budget Summary

| Subscription / Scope        | Monthly Budget  | Alert Thresholds        | Action Group              |
|------------------------------|-----------------|-------------------------|---------------------------|
| [Production]                 | [USD $XX,XXX]   | [50%, 75%, 90%, 100%]   | [ag-cost-alerts-prod]     |
| [Non-Production]             | [USD $X,XXX]    | [75%, 100%]             | [ag-cost-alerts-nonprod]  |

### 8.3 Cost Optimization Measures

- [ ] Reserved Instances purchased for predictable workloads
- [ ] Azure Savings Plans evaluated for compute
- [ ] Auto-shutdown configured for non-production VMs
- [ ] AKS node pool autoscaling configured with appropriate min/max
- [ ] Storage lifecycle management policies in place
- [ ] Unused resources identified and decommissioned (Azure Advisor)
- [ ] Right-sizing recommendations reviewed monthly

---

## 9. Azure Governance

### 9.1 Azure Policy Assignments

| Policy / Initiative                     | Scope                  | Effect       | Purpose                                     |
|-----------------------------------------|------------------------|--------------|---------------------------------------------|
| [Allowed locations]                     | [Management Group]     | [Deny]       | [Restrict deployments to approved regions]   |
| [Require tag on resource group]         | [Subscription]         | [Deny]       | [Enforce tagging compliance]                 |
| [Audit VMs without managed disks]       | [Subscription]         | [Audit]      | [Security baseline]                          |
| [Deploy Diagnostic Settings]            | [Management Group]     | [DeployIfNotExists] | [Centralized logging]                 |
| [Allowed resource types]               | [Subscription]         | [Deny]       | [Prevent unapproved resource types]          |
| [POLICY NAME]                           | [SCOPE]                | [EFFECT]     | [PURPOSE]                                    |

### 9.2 Azure Blueprints (if applicable)

| Blueprint Name                 | Version   | Scope                | Artifacts Included                          |
|--------------------------------|-----------|----------------------|---------------------------------------------|
| [bp-baseline-governance]       | [v1.0]    | [Management Group]   | [Policy, RBAC, Resource Groups, ARM templates] |

### 9.3 Regulatory Compliance

| Standard              | Azure Compliance Status | Assessment Frequency | Owner            |
|-----------------------|------------------------|----------------------|------------------|
| [SOC 2 Type II]       | [Compliant]            | [Annual]             | [TEAM NAME]      |
| [ISO 27001]           | [In Progress]          | [Annual]             | [TEAM NAME]      |
| [GDPR]                | [Compliant]            | [Continuous]         | [TEAM NAME]      |
| [STANDARD]            | [STATUS]               | [FREQUENCY]          | [OWNER]          |

---

## 10. Revision History

| Date           | Author            | Changes Made                              |
|----------------|-------------------|-------------------------------------------|
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [Initial document creation]               |
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [DESCRIPTION OF CHANGES]                  |
