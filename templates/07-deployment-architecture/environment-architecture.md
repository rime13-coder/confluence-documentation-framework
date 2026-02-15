# Environment Architecture

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Environment Architecture           |
| Last Updated     | 2026-02-14                         |
| Status           | Draft                              |
| Owner            | IntelliSec Solutions               |

---

## 1. Document Purpose

This document describes the architecture, configuration, and access strategy for each deployment environment of the CMMC Assessor Platform on Azure. Currently only a single production environment exists. Development and staging environments are planned but NOT IMPLEMENTED.

---

## 2. Environment Overview

| Environment   | Purpose                                  | Azure Subscription           | Availability Target | Data Sensitivity       | Status           |
|---------------|------------------------------------------|------------------------------|---------------------|------------------------|------------------|
| Development   | Active development and integration       | NOT IMPLEMENTED              | N/A                 | N/A                    | NOT IMPLEMENTED  |
| Staging       | Pre-production validation and UAT        | NOT IMPLEMENTED              | N/A                 | N/A                    | NOT IMPLEMENTED  |
| Production    | Live customer-facing workloads           | CMMC Assessor Prod           | Best effort (no SLA defined) | Real / sensitive | Active           |

> **Current State:** Only a single production environment exists. All development is done locally. Code is deployed directly to production on push to main. There is no staging or development environment in Azure.

### Planned Improvements

- Create a staging environment for pre-production validation
- Implement environment promotion gates before production deployment
- Establish separate subscriptions or resource groups for non-production workloads

---

## 3. Architecture Diagrams

### 3.1 Development Environment

```
NOT IMPLEMENTED

Developers run the application locally using:
- Local Node.js/Next.js dev server (frontend)
- Local Node.js/Express server (backend API)
- Local PostgreSQL or connection to dev database
- No Azure resources for development
```

### 3.2 Staging Environment

```
NOT IMPLEMENTED

A staging environment is planned but does not currently exist.
```

### 3.3 Production Environment

```
Internet
   |
   +-- cmmc.intellisecops.com (CNAME)
   |      |
   |      v
   |   cmmc-web (Container App, 0.25 CPU, 0.5Gi)
   |      Frontend (Next.js)
   |
   +-- api.cmmc.intellisecops.com (CNAME)
          |
          v
       cmmc-api (Container App, 0.5 CPU, 1Gi)
          Backend API (Node.js/Express)
             |
             +-- psql-cmmc-assessor-prod (PostgreSQL Flexible Server, B1ms)
             +-- stcmmcassessorprod (Storage Account, Standard_LRS)
             +-- kv-cmmc-assessor-prod (Key Vault)

Shared:
   +-- acrcmmcassessorprod (Container Registry, Basic)
   +-- log-cmmc-assessor-prod (Log Analytics)
   +-- cae-cmmc-assessor-prod (Container Apps Environment)
```

---

## 4. Environment Comparison Table

| Attribute                   | Development                        | Staging                            | Production                          |
|-----------------------------|------------------------------------|------------------------------------|-------------------------------------|
| **Status**                  | NOT IMPLEMENTED                    | NOT IMPLEMENTED                    | Active                              |
| **Container Apps CPU**      | N/A                                | N/A                                | API: 0.5 CPU, Web: 0.25 CPU        |
| **Container Apps Memory**   | N/A                                | N/A                                | API: 1Gi, Web: 0.5Gi               |
| **Container Replicas**      | N/A                                | N/A                                | 0-3 (scale-to-zero enabled)         |
| **PostgreSQL Tier**         | N/A                                | N/A                                | B1ms (1 vCore, 2GB RAM, 32GB storage) |
| **PostgreSQL Replicas**     | N/A                                | N/A                                | 0 (no read replicas)                |
| **VNet Address Space**      | N/A                                | N/A                                | None (F-09: VNet not configured)    |
| **Network Isolation**       | N/A                                | N/A                                | None (public internet access)       |
| **Private Endpoints**       | N/A                                | N/A                                | None                                |
| **Data**                    | N/A                                | N/A                                | Real production data                |
| **Backups**                 | N/A                                | N/A                                | PostgreSQL: 7-day automated, LRS    |
| **Access**                  | N/A                                | N/A                                | Team (no formal RBAC)               |
| **Monitoring**              | N/A                                | N/A                                | Log Analytics (basic)               |
| **TLS Certificates**        | N/A                                | N/A                                | Azure managed certificates          |
| **Custom Domain**           | N/A                                | N/A                                | cmmc.intellisecops.com, api.cmmc.intellisecops.com |
| **Estimated Monthly Cost**  | N/A                                | N/A                                | CAD ~$35-70                         |

---

## 5. Network Topology per Environment

### 5.1 Development Network

NOT IMPLEMENTED -- no development environment exists in Azure.

### 5.2 Staging Network

NOT IMPLEMENTED -- no staging environment exists in Azure.

### 5.3 Production Network

| Component           | Configuration                                    |
|---------------------|--------------------------------------------------|
| VNet Name           | NOT IMPLEMENTED (security finding F-09)          |
| Address Space       | N/A                                              |
| Subnets             | N/A                                              |
| VNet Peering        | N/A                                              |
| Private Endpoints   | None                                             |
| DNS Resolution      | GoDaddy (external DNS)                           |

> **Current State:** The production environment has no VNet. Container Apps use external ingress. PostgreSQL uses AllowAzureServices firewall rule (0.0.0.0). All services are accessible over the public internet.

### Planned Improvements

- Deploy VNet with proper subnet design for Container Apps Environment (F-09)
- Configure private endpoints for PostgreSQL and Key Vault
- Remove AllowAzureServices firewall rule from PostgreSQL (F-12)

---

## 6. Identity and Access per Environment

### 6.1 Human Access

| Role                     | Development Access     | Staging Access         | Production Access        |
|--------------------------|------------------------|------------------------|--------------------------|
| Developers               | N/A                    | N/A                    | No formal RBAC configured |

> **Status: NOT IMPLEMENTED.** Formal RBAC and access controls for Azure resources are not documented. Access is managed ad-hoc.

### 6.2 Service Principals and Managed Identities

| Identity Name                    | Type                | Environment  | Purpose                              | Permissions                  |
|----------------------------------|---------------------|--------------|--------------------------------------|------------------------------|
| GitHub Actions Service Principal | Service Principal   | Production   | CD pipeline deployments              | Contributor on resource group |

### 6.3 Privileged Access Management

| Control                          | Implementation                                              |
|----------------------------------|-------------------------------------------------------------|
| Just-In-Time (JIT) Access        | NOT IMPLEMENTED                                             |
| Approval Workflow                | NOT IMPLEMENTED                                             |
| Maximum Activation Duration      | N/A                                                         |
| MFA Requirement                  | NOT IMPLEMENTED for Azure resource access                   |
| Access Reviews                   | NOT IMPLEMENTED                                             |

### Planned Improvements

- Implement Azure AD PIM for production access
- Configure RBAC roles for the resource group
- Enable MFA for all Azure access

---

## 7. Configuration Management

### 7.1 Azure App Configuration

| Attribute                     | Value                                             |
|-------------------------------|---------------------------------------------------|
| App Configuration Instance    | NOT IMPLEMENTED                                   |
| Feature Management Enabled    | No                                                |
| Key-Value Naming Convention   | N/A                                               |
| Key Vault References          | Secrets stored in Key Vault (kv-cmmc-assessor-prod), referenced as Container App secrets |
| Label Strategy                | N/A                                               |

### 7.2 Environment-Specific Settings

| Setting Category       | Production Value                                    |
|------------------------|-----------------------------------------------------|
| Log Level              | Console.log (unstructured, F-30)                    |
| API Rate Limiting      | NOT IMPLEMENTED                                     |
| Caching TTL            | Not configured                                      |
| Connection Strings     | Key Vault references for PostgreSQL                 |
| CORS                   | Allows custom domain + localhost in prod (F-40)     |

---

## 8. Feature Flags Strategy

| Attribute                    | Value                                                    |
|------------------------------|----------------------------------------------------------|
| Feature Flag Provider        | NOT IMPLEMENTED                                          |

> **Status: NOT IMPLEMENTED.** No feature flag system is in use. Feature toggling is managed through code changes deployed directly to production.

---

## 9. Environment Promotion Flow

### 9.1 Promotion Pipeline (Current State)

```
Developer PR --> Main Branch --> PRODUCTION Deploy (auto)
                                    |
                                    v
                              No staging validation
                              No approval gate
                              No post-deployment verification (automated)
```

> **Current State:** There is no environment promotion flow. Code merged to main deploys directly to production. There is no staging environment, no approval gate, and no automated post-deployment verification.

### 9.2 Promotion Rules

| Rule                                     | Details                                                       |
|------------------------------------------|---------------------------------------------------------------|
| Dev -> Staging                           | NOT IMPLEMENTED -- no staging environment                      |
| Staging -> Production                    | NOT IMPLEMENTED -- deploys directly to production on push to main |
| Deployment Window (Production)           | No defined deployment window                                  |
| Change Freeze Periods                    | NOT IMPLEMENTED                                               |
| Rollback Mechanism                       | Redeploy previous image tag via manual workflow dispatch or `az containerapp update` |
| Configuration Promotion                  | Manual -- secrets managed in Key Vault                        |
| Database Migration Promotion             | Prisma migrate deploy runs in container startup               |

### 9.3 Artifact Flow

| Artifact Type        | Source                      | Promotion Method                                |
|----------------------|-----------------------------|-------------------------------------------------|
| Container Images     | GitHub Actions build        | Push to ACR (acrcmmcassessorprod), deploy to Container Apps |
| IaC Templates        | Git repository              | Single main.bicep with parameters.prod.json      |
| Database Migrations  | Git repository (Prisma)     | Prisma migrate deploy runs on container startup  |

### Planned Improvements

- Create a staging environment in Azure
- Add approval gates before production deployment
- Implement blue-green or canary deployment strategy
- Define deployment windows and change freeze periods

---

## 10. Environment Lifecycle Management

### 10.1 Ephemeral Environments

| Attribute                     | Value                                                  |
|-------------------------------|--------------------------------------------------------|
| Supported                     | No                                                     |
| Trigger                       | N/A                                                    |
| Auto-cleanup                  | N/A                                                    |

### 10.2 Data Management Across Environments

| Environment   | Data Source                          | Refresh Cadence      | Anonymization Required |
|---------------|--------------------------------------|----------------------|------------------------|
| Production    | Live data                            | N/A                  | N/A                    |

> **Note:** Since only production exists, there is no data management across environments. Seed data and test data processes are not formalized.

---

## 11. Revision History

| Date           | Author               | Changes Made                              |
|----------------|-----------------------|-------------------------------------------|
| 2026-02-14     | IntelliSec Solutions  | Initial document creation                 |
