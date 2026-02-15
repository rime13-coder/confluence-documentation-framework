# Environment Strategy

| **Page Title**   | Environment Strategy                       |
|------------------|--------------------------------------------|
| **Last Updated** | 2026-02-14                                 |
| **Status**       | In Review                                  |
| **Owner**        | IntelliSecOps DevOps Team                  |

---

## 1. Environment Inventory

| Environment        | Purpose                                 | Azure Subscription          | Resource Group               | URL                              | Access Level               | Data Type                 |
|--------------------|-----------------------------------------|-----------------------------|------------------------------|----------------------------------|----------------------------|---------------------------|
| **Development**    | Active development and local debugging  | N/A (local Docker Compose)  | N/A                          | http://localhost:5173 (frontend), http://localhost:3001 (backend) | All developers | Synthetic / seed data (local PostgreSQL) |
| **Production**     | Live customer-facing environment        | CMMC Assessor Subscription  | `rg-cmmc-assessor-prod`     | https://cmmc.intellisecops.com (frontend), https://api.cmmc.intellisecops.com (backend) | Operations team + authorized users | Real customer data |
| **Staging**        | Pre-production validation (PLANNED)     | Not yet provisioned         | Planned: `rg-cmmc-assessor-stg` | Not yet configured           | Planned: QA + product owners | Planned: Anonymized data  |

---

## 2. Environment Parity Matrix

This matrix documents intentional differences between environments. The goal is to keep environments as similar as possible while managing cost and data sensitivity.

| Dimension                 | Development (Local)               | Staging (Planned)                 | Production                        |
|---------------------------|-----------------------------------|-----------------------------------|-----------------------------------|
| **Compute Platform**      | Docker Compose                    | Azure Container Apps (planned)    | Azure Container Apps              |
| **Backend Container**     | Node.js (hot-reload)              | Container image from ACR (planned)| Container image from ACR          |
| **Backend Resources**     | Unlimited (local)                 | 0.5 CPU, 1Gi (planned, same as prod) | 0.5 CPU, 1Gi                 |
| **Frontend Container**    | Vite dev server                   | Nginx (planned, same as prod)     | Nginx serving Vite build          |
| **Frontend Resources**    | Unlimited (local)                 | 0.25 CPU, 0.5Gi (planned, same as prod) | 0.25 CPU, 0.5Gi           |
| **Database**              | PostgreSQL 16 Alpine (Docker)     | PostgreSQL Flexible Server (planned) | PostgreSQL Flexible Server (B1ms, 32GB) |
| **Replicas**              | 1 per service                     | 0-3 (planned, same as prod)      | 0-3 (HTTP concurrency scaling)    |
| **SSL/TLS**               | None (HTTP localhost)             | Let's Encrypt or Azure managed (planned) | Azure managed (custom domain) |
| **Custom Domain**         | No (`localhost`)                  | Planned (e.g., `staging.cmmc.intellisecops.com`) | `cmmc.intellisecops.com` / `api.cmmc.intellisecops.com` |
| **Monitoring**            | Local logs only                   | Planned: Log Analytics            | Log Analytics workspace           |
| **Auto-scaling**          | N/A                               | Planned: 0-3 replicas            | 0-3 replicas, HTTP concurrency    |
| **Backup / DR**           | None                              | Planned: Daily backups            | Managed by Azure PostgreSQL       |
| **Key Vault**             | N/A (env vars in docker-compose)  | Planned                           | Azure Key Vault                   |
| **Container Registry**    | Local builds                      | `acrcmmcassessorprod` (shared, planned) | `acrcmmcassessorprod`       |
| **Additional Services**   | Adminer (DB admin GUI)            | None planned                      | None                              |

---

## 3. Data Strategy per Environment

| Environment        | Data Source                           | Data Volume      | PII Present | Refresh Frequency       | Management Approach                            |
|--------------------|---------------------------------------|------------------|-------------|-------------------------|------------------------------------------------|
| **Development**    | Prisma seed scripts / manual data     | Minimal          | No          | On-demand               | Developers run `npx prisma db seed` locally    |
| **Staging**        | Anonymized production snapshot (planned) | Production-like (planned) | No (planned) | Planned: weekly  | Planned: Automated anonymization pipeline      |
| **Production**     | Real customer/assessment data         | Full             | Yes         | N/A (live)              | Subject to CMMC compliance and data governance |

### Data Anonymization Pipeline

- **Tool:** Not yet implemented
- **Schedule:** Planned for when staging environment is provisioned
- **Anonymization rules:** To be defined (must comply with CMMC data handling requirements)
- **Validation:** Post-anonymization checks to confirm no PII remains

---

## 4. Environment Provisioning (Infrastructure as Code)

### IaC Tooling

| Component                | Tool                   | Repository / Location              | State Storage                       |
|--------------------------|------------------------|------------------------------------|--------------------------------------|
| Azure infrastructure     | Bicep                  | `infra/main.bicep` (mono-repo)    | N/A (Bicep is declarative; Azure Resource Manager handles state) |
| Container configuration  | Docker / Docker Compose| `docker-compose.yml`, `Dockerfile` files in backend/ and frontend/ | Git |
| Database schema          | Prisma Migrations      | `backend/prisma/`                  | N/A (applied at deploy time)         |

### IaC Resources Defined in `main.bicep`

| Resource                        | Azure Resource Type                    | Notes                                    |
|---------------------------------|----------------------------------------|------------------------------------------|
| Log Analytics Workspace         | `Microsoft.OperationalInsights/workspaces` | Centralized logging                  |
| Container Registry              | `Microsoft.ContainerRegistry/registries` | `acrcmmcassessorprod`                 |
| Container Apps Environment      | `Microsoft.App/managedEnvironments`    | `cae-cmmc-assessor-prod`                |
| PostgreSQL Flexible Server      | `Microsoft.DBforPostgreSQL/flexibleServers` | B1ms SKU, 32GB storage              |
| Storage Account                 | `Microsoft.Storage/storageAccounts`    | General purpose storage                  |
| Key Vault                       | `Microsoft.KeyVault/vaults`            | Secrets management                       |
| Backend Container App           | `Microsoft.App/containerApps`          | `cmmc-api` (port 3001)                  |
| Frontend Container App          | `Microsoft.App/containerApps`          | `cmmc-web` (port 80)                    |

### Bicep Parameters

| Parameter          | Description                                     |
|--------------------|-------------------------------------------------|
| `environment`      | Environment name (e.g., `prod`)                 |
| `location`         | Azure region (Canada Central)                   |
| `baseName`         | Base name for resource naming                   |
| `dbAdminPassword`  | PostgreSQL admin password (secure)              |
| `jwtSecret`        | JWT signing secret (secure)                     |
| `entraClientId`    | Microsoft Entra ID client ID                    |
| `entraClientSecret`| Microsoft Entra ID client secret (secure)       |
| `customDomain`     | Custom domain for frontend                      |
| `apiDomain`        | Custom domain for backend API                   |

### Provisioning Workflow

1. Operator triggers the Infrastructure workflow manually via `workflow_dispatch`.
2. Selects action: `plan` (what-if preview) or `deploy` (actual deployment).
3. GitHub Actions authenticates to Azure via OIDC.
4. **If plan:** Runs `az deployment group what-if` and outputs the result summary.
5. **If deploy:** Creates the resource group (if needed) and runs `az deployment group create` using `infra/main.bicep` with `parameters.prod.json`.
6. Output summary is written to `GITHUB_STEP_SUMMARY`.

### GitHub Actions Infrastructure Workflow Triggers

| Action              | Trigger                           | Workflow File                                |
|---------------------|-----------------------------------|----------------------------------------------|
| Plan (what-if)      | Manual `workflow_dispatch` (action: plan)   | `.github/workflows/infrastructure.yml` |
| Deploy (provision)  | Manual `workflow_dispatch` (action: deploy) | `.github/workflows/infrastructure.yml` |

---

## 5. Ephemeral PR Environments

Ephemeral PR environments are **not yet implemented**.

### Planned Configuration

| Configuration Item        | Value                                  |
|---------------------------|----------------------------------------|
| **Trigger**               | PR opened or updated (planned)         |
| **Infrastructure**        | Azure Container Apps revision (planned)|
| **URL Pattern**           | `https://pr-[PR-NUMBER].cmmc.intellisecops.com` (planned) |
| **Data**                  | Minimal seed data (planned)            |
| **TTL**                   | Destroyed when PR is closed or merged  |
| **Priority**              | Low (nice-to-have after staging is set up) |

---

## 6. Environment Lifecycle

| Phase              | Development (Local)            | Staging (Planned)              | Production                     |
|--------------------|--------------------------------|--------------------------------|--------------------------------|
| **Creation**       | `docker-compose up`            | Planned: IaC deployment        | IaC deployment (Bicep)         |
| **Updates**        | Live reload on code changes    | Planned: CD after staging gate | CD auto-deploys on push to `main` |
| **Data Reset**     | `npx prisma db push` / seed   | Planned: Before each UAT cycle | N/A                            |
| **Teardown**       | `docker-compose down`          | Planned: Persistent            | Never (persistent)             |

---

## 7. Cost Management

| Environment        | Monthly Budget (est.)   | Cost Optimization Measures                                      | Alert Threshold       |
|--------------------|-------------------------|-----------------------------------------------------------------|-----------------------|
| **Development**    | $0                      | Runs locally on developer machines (Docker)                     | N/A                   |
| **Production**     | Estimated ~$150-300/mo  | Minimum 0 replicas (scale to zero when idle); B1ms PostgreSQL tier; small Container App SKUs | 80% of budget |
| **Staging**        | Estimated ~$100-200/mo (planned) | Planned: Same scale-to-zero; B1ms PostgreSQL; schedule scale-down | Planned        |

### Cost Optimization Checklist

- [x] Production Container Apps configured with minimum 0 replicas (scale to zero)
- [x] PostgreSQL Flexible Server uses B1ms (burstable) tier
- [x] Container Apps use minimal CPU/memory allocations (0.25-0.5 CPU)
- [ ] Azure Advisor recommendations reviewed monthly (planned)
- [ ] Cost alerts configured in Azure Cost Management (planned)
- [ ] Staging environment scaled down outside business hours (planned)

---

## 8. Access Control per Environment

| Environment        | Developer Access           | Operations Access          | Business Stakeholder Access |
|--------------------|----------------------------|----------------------------|-----------------------------|
| **Development**    | Full (local machine)       | N/A                        | None                        |
| **Production**     | Read-only (Azure Portal, logs) | Full (via Azure RBAC)  | Application access only (via CMMC platform) |
| **Staging**        | Planned: Read-only         | Planned: Full              | Planned: UAT access         |

### Azure RBAC Roles (Production)

| Role                            | Assigned To             | Azure Role                              |
|---------------------------------|-------------------------|-----------------------------------------|
| Application Deployer            | GitHub Actions (OIDC)   | Contributor (scoped to `rg-cmmc-assessor-prod`) |
| Infrastructure Admin            | DevOps Team             | Owner (scoped to subscription)          |
| Operations                      | Operations Team         | Contributor (scoped to `rg-cmmc-assessor-prod`) |

---

## 9. Appendix

### Environment URLs Quick Reference

| Environment   | Frontend URL                        | Backend URL                              | Azure Resource Group            |
|---------------|-------------------------------------|------------------------------------------|---------------------------------|
| Development   | http://localhost:5173               | http://localhost:3001                     | N/A (local Docker Compose)      |
| Production    | https://cmmc.intellisecops.com      | https://api.cmmc.intellisecops.com       | `rg-cmmc-assessor-prod` (Canada Central) |
| Staging       | Not yet configured                  | Not yet configured                       | Planned: `rg-cmmc-assessor-stg` |

### Docker Compose Services (Development)

| Service    | Image                  | Port Mapping   | Purpose                              |
|------------|------------------------|----------------|--------------------------------------|
| postgres   | `postgres:16-alpine`   | 5432:5432      | Local PostgreSQL database            |
| backend    | Built from `./backend` | 3001:3001      | Express.js API server                |
| frontend   | Built from `./frontend`| 5173:5173      | Vite dev server for React SPA        |
| adminer    | `adminer`              | 8080:8080      | Database administration GUI          |

### Related Pages

- [GitHub Actions Overview](./github-actions-overview.md)
- [Release Pipeline](./release-pipeline.md)
- [Test Strategy](../06-testing/test-strategy.md)
