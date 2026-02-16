# Environment Architecture

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Environment Architecture           |
| Last Updated     | 2026-02-15                         |
| Status           | Updated -- prod-v2 migration       |
| Owner            | IntelliSec Solutions               |

---

## 1. Document Purpose

This document describes the architecture, configuration, and access strategy for each deployment environment of the CMMC Assessor Platform on Azure. The application has been migrated to the prod-v2 environment in subscription sub-is-secops-prod (400dce0f) as of 2026-02-15, with VNet isolation, private endpoints, Key Vault references, managed identity, and App Gateway WAF v2. Development and staging environments are planned but NOT IMPLEMENTED.

---

## 2. Environment Overview

| Environment   | Purpose                                  | Azure Subscription           | Availability Target | Data Sensitivity       | Status           |
|---------------|------------------------------------------|------------------------------|---------------------|------------------------|------------------|
| Development   | Active development and integration       | NOT IMPLEMENTED              | N/A                 | N/A                    | NOT IMPLEMENTED  |
| Staging       | Pre-production validation and UAT        | NOT IMPLEMENTED              | N/A                 | N/A                    | NOT IMPLEMENTED  |
| Production (legacy) | Deprecated legacy environment       | CMMC Assessor Prod           | N/A                 | N/A                    | Deprecated       |
| Production (prod-v2) | Live customer-facing workloads     | sub-is-secops-prod (400dce0f) | Best effort (no SLA defined) | Real / sensitive | Active           |

> **Current State:** The application has been migrated to prod-v2 in subscription sub-is-secops-prod (400dce0f). The legacy production environment is deprecated. All development is done locally. Development and staging environments are planned but NOT IMPLEMENTED.

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

### 3.3 Production Environment (prod-v2)

```
Internet
   |
   +-- cmmc.intellisecops.com (Custom domain)
          |
          v
       Application Gateway WAF v2 (appgw-ams)
          |
          v
       VNet (prod-v2, sub-is-secops-prod / 400dce0f)
          |
          +-- cae-cmmc-v2-prod (Container Apps Environment, VNet-integrated)
          |      |
          |      +-- cmmc-web (Container App, 0.25 CPU, 0.5Gi)
          |      |      Frontend (React 18 SPA)
          |      |      FQDN: cmmc-web.happybush-78cb0e6a.canadacentral.azurecontainerapps.io
          |      |
          |      +-- cmmc-api (Container App, 0.5 CPU, 1Gi)
          |             Backend API (Node.js/Express)
          |             FQDN: cmmc-api.happybush-78cb0e6a.canadacentral.azurecontainerapps.io
          |             |
          |             +-- psql-cmmc-v2-prod (PostgreSQL, private endpoint, no public access)
          |             +-- kv-cmmc-v2-prod (Key Vault, private endpoint, managed identity)
          |
          +-- acrcmmcv2prod (Container Registry, Basic)

Managed Identity: system-assigned on Container Apps for Key Vault, PostgreSQL, ACR
Custom Domain: cmmc.intellisecops.com via App Gateway WAF v2 (appgw-ams)
```

---

## 4. Environment Comparison Table

| Attribute                   | Development                        | Staging                            | Production (prod-v2)                |
|-----------------------------|------------------------------------|------------------------------------|-------------------------------------|
| **Status**                  | NOT IMPLEMENTED                    | NOT IMPLEMENTED                    | Active (sub-is-secops-prod / 400dce0f) |
| **Container Apps CPU**      | N/A                                | N/A                                | API: 0.5 CPU, Web: 0.25 CPU        |
| **Container Apps Memory**   | N/A                                | N/A                                | API: 1Gi, Web: 0.5Gi               |
| **Container Replicas**      | N/A                                | N/A                                | 0-3 (scale-to-zero enabled)         |
| **PostgreSQL Tier**         | N/A                                | N/A                                | B1ms (1 vCore, 2GB RAM, 32GB storage) |
| **PostgreSQL Replicas**     | N/A                                | N/A                                | 0 (no read replicas)                |
| **VNet Address Space**      | N/A                                | N/A                                | 10.0.0.0/16 (VNet deployed, F-09 RESOLVED) |
| **Network Isolation**       | N/A                                | N/A                                | VNet-integrated Container Apps Environment; private endpoints for PostgreSQL, Key Vault |
| **Private Endpoints**       | N/A                                | N/A                                | psql-cmmc-v2-prod, kv-cmmc-v2-prod (F-12 RESOLVED) |
| **WAF**                     | N/A                                | N/A                                | App Gateway WAF v2 (appgw-ams)      |
| **Data**                    | N/A                                | N/A                                | Real production data                |
| **Backups**                 | N/A                                | N/A                                | PostgreSQL: 7-day automated, LRS    |
| **Access**                  | N/A                                | N/A                                | Managed identity; team access       |
| **Monitoring**              | N/A                                | N/A                                | Log Analytics (basic)               |
| **TLS Certificates**        | N/A                                | N/A                                | App Gateway certificate + Azure managed certificates |
| **Custom Domain**           | N/A                                | N/A                                | cmmc.intellisecops.com (via App Gateway WAF v2) |
| **Backend FQDNs**           | N/A                                | N/A                                | cmmc-api.happybush-78cb0e6a.canadacentral.azurecontainerapps.io, cmmc-web.happybush-78cb0e6a.canadacentral.azurecontainerapps.io |
| **Estimated Monthly Cost**  | N/A                                | N/A                                | CAD ~$35-70                         |

---

## 5. Network Topology per Environment

### 5.1 Development Network

NOT IMPLEMENTED -- no development environment exists in Azure.

### 5.2 Staging Network

NOT IMPLEMENTED -- no staging environment exists in Azure.

### 5.3 Production Network (prod-v2)

| Component           | Configuration                                    |
|---------------------|--------------------------------------------------|
| VNet Name           | VNet (prod-v2) -- DEPLOYED (F-09 RESOLVED)       |
| Address Space       | 10.0.0.0/16                                      |
| Subnets             | snet-container-apps (10.0.0.0/23), snet-postgresql (10.0.2.0/24), snet-private-endpoints (10.0.3.0/24) |
| VNet Peering        | N/A                                              |
| Private Endpoints   | psql-cmmc-v2-prod (PostgreSQL), kv-cmmc-v2-prod (Key Vault) |
| WAF                 | App Gateway WAF v2 (appgw-ams)                   |
| DNS Resolution      | Custom domain cmmc.intellisecops.com via App Gateway; private DNS zones for VNet services |

> **Current State:** The prod-v2 environment has full VNet isolation. Container Apps Environment (cae-cmmc-v2-prod) is VNet-integrated. PostgreSQL and Key Vault use private endpoints with no public access. Traffic to cmmc.intellisecops.com routes through App Gateway WAF v2 (appgw-ams). All security findings (F-09, F-12) are RESOLVED.

### Planned Improvements

- ~~Deploy VNet with proper subnet design for Container Apps Environment (F-09)~~ -- **DEPLOYED** (2026-02-15)
- ~~Configure private endpoints for PostgreSQL and Key Vault~~ -- **DEPLOYED** (2026-02-15)
- ~~Remove AllowAzureServices firewall rule from PostgreSQL (F-12)~~ -- **RESOLVED** (2026-02-15)

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
| GitHub Actions Service Principal | Service Principal   | Production (prod-v2) | CD pipeline deployments        | Contributor on resource group |
| Container Apps Managed Identity  | System-assigned Managed Identity | Production (prod-v2) | Key Vault, PostgreSQL, ACR access (F-11 RESOLVED) | Key Vault Secrets User, ACR Pull |

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
| Key Vault References          | Secrets stored in Key Vault (kv-cmmc-v2-prod), referenced via Key Vault refs with managed identity |
| Label Strategy                | N/A                                               |

### 7.2 Environment-Specific Settings

| Setting Category       | Production Value                                    |
|------------------------|-----------------------------------------------------|
| Log Level              | Console.log (unstructured, F-30)                    |
| API Rate Limiting      | express-rate-limit with tiered limits (F-04 RESOLVED) |
| Caching TTL            | Not configured                                      |
| Connection Strings     | Key Vault references (kv-cmmc-v2-prod) via managed identity |
| CORS                   | Strict allowlist for cmmc.intellisecops.com only (F-40 RESOLVED) |

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
| Container Images     | GitHub Actions build        | Push to ACR (acrcmmcv2prod), deploy to Container Apps in prod-v2 |
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
| 2026-02-15     | IntelliSec Solutions  | Updated for prod-v2 migration to sub-is-secops-prod (400dce0f); added prod-v2 resources, FQDNs, custom domain; VNet isolation, private endpoints, Key Vault refs, managed identity, App Gateway WAF v2; all 47 findings resolved |
