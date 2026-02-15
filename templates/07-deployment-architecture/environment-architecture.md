# Environment Architecture

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Environment Architecture           |
| Last Updated     | [YYYY-MM-DD]                       |
| Status           | [Draft / In Review / Approved]     |
| Owner            | [TEAM OR INDIVIDUAL NAME]          |

---

## 1. Document Purpose

This document describes the architecture, configuration, and access strategy for each deployment environment (Development, Staging, Production) of the [PROJECT NAME] platform on Azure. It defines how environments differ, how code and configuration are promoted between them, and the network and identity boundaries that separate them.

---

## 2. Environment Overview

| Environment   | Purpose                                  | Azure Subscription           | Availability Target | Data Sensitivity       |
|---------------|------------------------------------------|------------------------------|---------------------|------------------------|
| Development   | Active development and integration       | [SUB-NONPROD]                | Best effort         | Synthetic / anonymized |
| Staging       | Pre-production validation and UAT        | [SUB-NONPROD or SUB-STAGING] | 99.5%               | Anonymized copy of prod |
| Production    | Live customer-facing workloads           | [SUB-PROD]                   | 99.9%               | Real / sensitive       |

---

## 3. Architecture Diagrams

### 3.1 Development Environment

```
[INSERT DEVELOPMENT ENVIRONMENT ARCHITECTURE DIAGRAM]

Recommended tool: draw.io, Visio, or Azure Architecture Diagram
Export as PNG and embed in Confluence page.
```

### 3.2 Staging Environment

```
[INSERT STAGING ENVIRONMENT ARCHITECTURE DIAGRAM]
```

### 3.3 Production Environment

```
[INSERT PRODUCTION ENVIRONMENT ARCHITECTURE DIAGRAM]
```

---

## 4. Environment Comparison Table

| Attribute                   | Development                        | Staging                            | Production                          |
|-----------------------------|------------------------------------|------------------------------------|-------------------------------------|
| **AKS Node SKU**            | [Standard_D2s_v5]                  | [Standard_D4s_v5]                  | [Standard_D8s_v5]                   |
| **AKS Node Count (min/max)**| [1 / 3]                            | [2 / 5]                            | [3 / 20]                            |
| **App Service Plan SKU**    | [B1]                               | [S1]                               | [P1v3]                              |
| **SQL Database Tier**       | [Basic / S0]                       | [Standard S2]                      | [Business Critical]                 |
| **SQL Database Replicas**   | [0]                                | [0]                                | [1 read replica + geo-replica]      |
| **Functions Plan**          | [Consumption]                      | [Premium EP1]                      | [Premium EP2]                       |
| **VM Size**                 | [Standard_B2ms]                    | [Standard_D2s_v5]                  | [Standard_D4s_v5]                   |
| **VM Count**                | [1]                                | [1]                                | [2+ with availability set/zone]     |
| **VNet Address Space**      | [10.1.0.0/16]                      | [10.2.0.0/16]                      | [10.0.0.0/16]                       |
| **Network Isolation**       | [Shared VNet, NSGs]                | [Dedicated VNet, NSGs]             | [Dedicated VNet, NSGs, Firewall]    |
| **Private Endpoints**       | [Limited]                          | [Full]                             | [Full]                              |
| **Data**                    | [Synthetic / seed data]            | [Anonymized prod copy]             | [Real production data]              |
| **Backups**                 | [None / minimal]                   | [Daily, 7-day retention]           | [Continuous, 30-day retention]      |
| **Access**                  | [All developers]                   | [Dev leads, QA, DevOps]            | [DevOps, SRE (limited)]            |
| **Monitoring**              | [Application Insights only]        | [Full monitoring, no paging]       | [Full monitoring + paging alerts]   |
| **SSL Certificates**        | [Self-signed / Let's Encrypt]      | [CA-signed wildcard]               | [CA-signed, auto-renewed]          |
| **Custom Domain**           | [dev.internal.company.com]         | [staging.company.com]              | [app.company.com]                  |
| **Estimated Monthly Cost**  | [USD $X,XXX]                       | [USD $X,XXX]                       | [USD $XX,XXX]                      |

---

## 5. Network Topology per Environment

### 5.1 Development Network

| Component           | Configuration                                    |
|---------------------|--------------------------------------------------|
| VNet Name           | [vnet-dev-eus-001]                               |
| Address Space       | [10.1.0.0/16]                                    |
| Subnets             | See subnet table below                           |
| VNet Peering        | [Peered to hub-vnet / None]                      |
| Private Endpoints   | [LIST OF SERVICES WITH PRIVATE ENDPOINTS]        |
| DNS Resolution      | [Azure DNS / Custom DNS]                         |

### 5.2 Staging Network

| Component           | Configuration                                    |
|---------------------|--------------------------------------------------|
| VNet Name           | [vnet-stg-eus-001]                               |
| Address Space       | [10.2.0.0/16]                                    |
| Subnets             | See subnet table below                           |
| VNet Peering        | [Peered to hub-vnet]                             |
| Private Endpoints   | [LIST OF SERVICES WITH PRIVATE ENDPOINTS]        |
| DNS Resolution      | [Azure Private DNS Zones]                        |

### 5.3 Production Network

| Component           | Configuration                                    |
|---------------------|--------------------------------------------------|
| VNet Name           | [vnet-prod-eus-001]                              |
| Address Space       | [10.0.0.0/16]                                    |
| Subnets             | See subnet table below                           |
| VNet Peering        | [Peered to hub-vnet]                             |
| Private Endpoints   | [LIST OF SERVICES WITH PRIVATE ENDPOINTS]        |
| DNS Resolution      | [Azure Private DNS Zones]                        |

### Subnet Design (Per Environment)

| Subnet Name               | Address Range       | Purpose                          | NSG                  | Delegated To           |
|----------------------------|---------------------|----------------------------------|----------------------|------------------------|
| [snet-aks]                 | [x.x.1.0/24]       | AKS node pool                    | [nsg-aks]            | [N/A]                  |
| [snet-appservice]          | [x.x.2.0/24]       | App Service VNet integration     | [nsg-appservice]     | [Microsoft.Web/serverFarms] |
| [snet-functions]           | [x.x.3.0/24]       | Functions VNet integration       | [nsg-functions]      | [Microsoft.Web/serverFarms] |
| [snet-data]                | [x.x.4.0/24]       | Database private endpoints       | [nsg-data]           | [N/A]                  |
| [snet-vm]                  | [x.x.5.0/24]       | Virtual machines                 | [nsg-vm]             | [N/A]                  |
| [snet-privateendpoints]    | [x.x.6.0/24]       | Shared private endpoints         | [nsg-pe]             | [N/A]                  |
| [snet-agw]                 | [x.x.7.0/24]       | Application Gateway              | [nsg-agw]            | [N/A]                  |

---

## 6. Identity and Access per Environment

### 6.1 Human Access

| Role                     | Development Access     | Staging Access         | Production Access        |
|--------------------------|------------------------|------------------------|--------------------------|
| Developers               | [Contributor]          | [Reader]               | [No access]              |
| QA Engineers             | [Reader]               | [Contributor]          | [No access]              |
| DevOps / SRE             | [Contributor]          | [Contributor]          | [Reader + JIT elevated]  |
| Engineering Leads        | [Contributor]          | [Contributor]          | [Reader]                 |
| On-Call Engineers        | [N/A]                  | [Reader]               | [JIT elevated access]    |

### 6.2 Service Principals and Managed Identities

| Identity Name                    | Type                | Environment  | Purpose                              | Permissions                  |
|----------------------------------|---------------------|--------------|--------------------------------------|------------------------------|
| [sp-github-actions-dev]          | Service Principal   | Development  | GitHub Actions deployments           | [Contributor on RG]          |
| [sp-github-actions-prod]         | Service Principal   | Production   | GitHub Actions deployments           | [Custom role - deploy only]  |
| [mi-aks-prod-eus-001]            | Managed Identity    | Production   | AKS workload identity               | [Key Vault Reader, ACR Pull] |
| [mi-app-prod-eus-001]            | Managed Identity    | Production   | App Service identity                 | [Key Vault Reader, SQL access] |
| [mi-func-prod-eus-001]           | Managed Identity    | Production   | Functions identity                   | [Storage Blob Data Contributor] |
| [IDENTITY NAME]                  | [TYPE]              | [ENV]        | [PURPOSE]                            | [PERMISSIONS]                |

### 6.3 Privileged Access Management

| Control                          | Implementation                                              |
|----------------------------------|-------------------------------------------------------------|
| Just-In-Time (JIT) Access        | [Azure AD PIM for production access]                        |
| Approval Workflow                | [Manager + SRE lead approval required for prod]             |
| Maximum Activation Duration      | [4 hours]                                                   |
| MFA Requirement                  | [Required for all privileged access]                        |
| Access Reviews                   | [Quarterly]                                                 |

---

## 7. Configuration Management

### 7.1 Azure App Configuration

| Attribute                     | Value                                             |
|-------------------------------|---------------------------------------------------|
| App Configuration Instance    | [appconfig-{project}-{env}-{region}]              |
| Feature Management Enabled    | [Yes / No]                                        |
| Key-Value Naming Convention   | [AppName:Section:Key]                             |
| Key Vault References          | [Yes -- secrets stored in Key Vault, referenced from App Config] |
| Label Strategy                | [Labels used for environment: dev, stg, prod]     |

### 7.2 Environment-Specific Settings

| Setting Category       | Dev Value                    | Staging Value                | Production Value              |
|------------------------|------------------------------|------------------------------|-------------------------------|
| Log Level              | [Debug]                      | [Information]                | [Warning]                     |
| API Rate Limiting      | [Disabled]                   | [Enabled, relaxed]           | [Enabled, strict]             |
| Caching TTL            | [60 seconds]                 | [300 seconds]                | [600 seconds]                 |
| External API Endpoints | [Sandbox / mock URLs]        | [Sandbox URLs]               | [Production URLs]             |
| Connection Strings     | [Key Vault ref - dev]        | [Key Vault ref - stg]        | [Key Vault ref - prod]        |
| Feature Flags Default  | [Most enabled]               | [Match planned prod state]   | [Controlled rollout]          |
| [SETTING]              | [DEV VALUE]                  | [STAGING VALUE]              | [PRODUCTION VALUE]            |

---

## 8. Feature Flags Strategy

| Attribute                    | Value                                                    |
|------------------------------|----------------------------------------------------------|
| Feature Flag Provider        | [Azure App Configuration / LaunchDarkly / Custom]        |
| Flag Naming Convention       | [FeatureArea.FlagName, e.g., Checkout.NewPaymentFlow]    |
| Default State (Dev)          | [All flags ON for testing]                               |
| Default State (Staging)      | [Match intended production state]                        |
| Default State (Production)   | [Controlled via percentage rollout or user targeting]    |
| Flag Lifecycle               | [Created -> Active -> Stale (>90 days) -> Removed]       |
| Stale Flag Review Cadence    | [Monthly]                                                |

### Active Feature Flags

| Flag Name                     | Description                     | Dev    | Staging | Production         | Target Removal Date |
|-------------------------------|---------------------------------|--------|---------|--------------------|---------------------|
| [Feature.NewCheckout]         | [New checkout experience]       | [ON]   | [ON]    | [10% rollout]      | [YYYY-MM-DD]        |
| [Feature.DarkMode]            | [UI dark mode support]          | [ON]   | [ON]    | [OFF]              | [YYYY-MM-DD]        |
| [FLAG NAME]                   | [DESCRIPTION]                   | [STATE]| [STATE] | [STATE]            | [DATE]              |

---

## 9. Environment Promotion Flow

### 9.1 Promotion Pipeline

```
Developer PR --> Main Branch --> DEV Deploy (auto)
                                    |
                                    v
                              DEV Validation (automated tests)
                                    |
                                    v
                              STAGING Deploy (auto on success)
                                    |
                                    v
                              STAGING Validation (automated + manual UAT)
                                    |
                                    v
                              Release Approval Gate (manual)
                                    |
                                    v
                              PRODUCTION Deploy (approved release)
                                    |
                                    v
                              Post-Deployment Verification
```

### 9.2 Promotion Rules

| Rule                                     | Details                                                       |
|------------------------------------------|---------------------------------------------------------------|
| Dev -> Staging                           | [Automatic after all CI checks pass on main branch]           |
| Staging -> Production                    | [Manual approval required by [APPROVER ROLE]]                 |
| Deployment Window (Production)           | [DEPLOYMENT WINDOW, e.g., Tue/Thu 10:00-14:00 UTC]            |
| Change Freeze Periods                    | [FREEZE PERIODS, e.g., last 2 weeks of December]              |
| Rollback Mechanism                       | [Slot swap / Helm rollback / Redeploy previous version]       |
| Configuration Promotion                  | [Config changes promoted independently via App Configuration] |
| Database Migration Promotion             | [Migrations run as part of deployment pipeline per environment]|

### 9.3 Artifact Flow

| Artifact Type        | Source                      | Promotion Method                                |
|----------------------|-----------------------------|-------------------------------------------------|
| Container Images     | GitHub Actions build        | Push to ACR, tag with SHA + env label           |
| App Packages         | GitHub Actions build        | Zip deploy via deployment slot                   |
| Function Packages    | GitHub Actions build        | Zip deploy to Functions                          |
| IaC Templates        | Git repository (IaC repo)   | PR-based promotion, plan/apply per environment   |
| Database Migrations  | Git repository (app repo)   | Run as deployment step per environment           |
| Configuration        | Azure App Configuration     | Label-based environment separation               |

---

## 10. Environment Lifecycle Management

### 10.1 Ephemeral Environments

| Attribute                     | Value                                                  |
|-------------------------------|--------------------------------------------------------|
| Supported                     | [Yes / No]                                             |
| Trigger                       | [Pull request creation]                                |
| Naming                        | [env-pr-{PR_NUMBER}]                                   |
| Auto-cleanup                  | [Destroyed on PR merge/close]                          |
| Scope                         | [Full stack / Application tier only]                   |
| Cost Control                  | [Minimum SKUs, auto-shutdown after 4 hours idle]       |

### 10.2 Data Management Across Environments

| Environment   | Data Source                          | Refresh Cadence      | Anonymization Required |
|---------------|--------------------------------------|----------------------|------------------------|
| Development   | [Seed scripts / synthetic data]      | [On demand]          | [N/A]                  |
| Staging       | [Anonymized production snapshot]     | [Weekly / monthly]   | [Yes]                  |
| Production    | [Live data]                          | [N/A]                | [N/A]                  |

---

## 11. Revision History

| Date           | Author            | Changes Made                              |
|----------------|-------------------|-------------------------------------------|
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [Initial document creation]               |
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [DESCRIPTION OF CHANGES]                  |
