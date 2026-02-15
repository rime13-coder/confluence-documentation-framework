# GitHub Actions CI/CD Overview

| **Page Title**   | GitHub Actions CI/CD Overview              |
|------------------|--------------------------------------------|
| **Last Updated** | 2026-02-14                                 |
| **Status**       | In Review                                  |
| **Owner**        | IntelliSecOps DevOps Team                  |

---

## 1. CI/CD Philosophy

Our CI/CD philosophy is built on the following principles:

- **Automate everything** — every build, test, and deployment is triggered and executed through GitHub Actions with zero manual steps in the critical path.
- **Shift left** — catch defects as early as possible through linting, static analysis, type checking, and security scans that run on every PR.
- **Immutable artifacts** — Docker images are built once, tagged with the Git SHA, and promoted through environments without rebuilding.
- **Environment parity** — local Docker Compose mirrors the production Container Apps topology (backend API, frontend SPA, PostgreSQL) to reduce deployment surprises.
- **Fast feedback** — CI runs four parallel jobs (backend-ci, frontend-ci, security-scan, dependency-audit) so developers receive results quickly.
- **Auditability** — every production deployment is traceable to a commit, a pull request, and a workflow run via OIDC-authenticated Azure deployments.

---

## 2. Branching Strategy

### GitFlow (Simplified)

| Branch            | Purpose                                  | Lifetime     | Deploys To       |
|-------------------|------------------------------------------|--------------|------------------|
| `main`            | Production-ready code                    | Permanent    | Production (Azure Container Apps) |
| `develop`         | Integration branch for next release      | Permanent    | Local dev (Docker Compose) |
| `feature/*`       | New feature development                  | Short-lived  | Local dev         |

**Branch flow:**
- Developers create `feature/*` branches from `develop` and open PRs to `develop`.
- PRs to `main` or `develop` trigger the CI workflow.
- Pushing to `develop` also triggers CI.
- Pushing to `main` triggers the CD workflow for production deployment.

---

## 3. Repository Structure

| Approach    | Description                                                                 | Pros                                      | Cons                                          |
|-------------|-----------------------------------------------------------------------------|-------------------------------------------|-----------------------------------------------|
| **Mono-repo** | All services, libraries, and IaC live in a single repository.             | Atomic cross-service changes; shared workflows | Larger clone size; path-filter complexity     |

**Current approach:** MONO-REPO

The repository contains the following top-level structure:

| Directory / File          | Contents                                 | Primary Language     |
|---------------------------|------------------------------------------|----------------------|
| `backend/`                | Express.js API server with Prisma ORM    | TypeScript (Node.js) |
| `frontend/`               | React SPA built with Vite                | TypeScript (React)   |
| `infra/`                  | Infrastructure as Code (Bicep templates) | Bicep                |
| `.github/workflows/`      | CI/CD workflow definitions               | YAML                 |
| `docker-compose.yml`      | Local development environment            | YAML                 |

---

## 4. Workflow Inventory

| Workflow Name            | Trigger                                     | Purpose                                        | File Path                             | Target Environments        |
|--------------------------|---------------------------------------------|------------------------------------------------|---------------------------------------|----------------------------|
| **CI**                   | PR to `main`/`develop`, push to `develop`   | Build, lint, type-check, test, security scan   | `.github/workflows/ci.yml`            | N/A (CI only)              |
| **CD**                   | Push to `main`, manual `workflow_dispatch`   | Build Docker images, push to ACR, deploy to Azure Container Apps | `.github/workflows/cd.yml` | Production                 |
| **Infrastructure**       | Manual `workflow_dispatch` (plan or deploy)  | Azure resource provisioning via Bicep          | `.github/workflows/infrastructure.yml`| Production                 |

---

## 5. GitHub Environments Configuration

| Environment   | URL                                       | Protection Rules                         | Deployment Branch Filter   |
|---------------|-------------------------------------------|------------------------------------------|----------------------------|
| **Development** | http://localhost:5173 (frontend), http://localhost:3001 (backend) | None (local Docker Compose)     | Any branch               |
| **Production**| https://cmmc.intellisecops.com (frontend), https://api.cmmc.intellisecops.com (backend) | Push to `main` triggers CD | `main`                   |
| **Staging**   | Not yet configured                        | Planned                                  | Planned                   |

### Environment-Specific Variables (non-secret)

| Variable Name                | Development (Local)          | Production                       |
|------------------------------|------------------------------|----------------------------------|
| `VITE_API_URL`               | `http://localhost:3001`      | `https://api.cmmc.intellisecops.com` |
| Azure Resource Group         | N/A                          | `rg-cmmc-assessor-prod`         |
| Azure Region                 | N/A                          | Canada Central                   |

---

## 6. Secrets Management

### 6.1 GitHub Secrets

| Secret Name                  | Scope             | Description                              | Rotation Schedule     |
|------------------------------|--------------------|------------------------------------------|-----------------------|
| `AZURE_CLIENT_ID`           | Repository         | Azure AD app registration client ID (OIDC) | On credential rotation |
| `AZURE_TENANT_ID`           | Repository         | Azure AD tenant ID                       | N/A                   |
| `AZURE_SUBSCRIPTION_ID`     | Repository         | Target Azure subscription                | N/A                   |
| `DB_ADMIN_PASSWORD`         | Repository         | PostgreSQL Flexible Server admin password | Quarterly             |
| `JWT_SECRET`                | Repository         | JWT signing secret for backend auth      | Quarterly             |
| `ENTRA_CLIENT_ID`           | Repository         | Microsoft Entra ID client ID             | On credential rotation |
| `ENTRA_CLIENT_SECRET`       | Repository         | Microsoft Entra ID client secret         | On credential rotation |
| `TOKEN_ENCRYPTION_KEY`      | Repository         | Encryption key for token storage         | Quarterly             |
| `API_URL`                   | Repository         | Backend API URL for deployment config    | N/A                   |

### 6.2 Azure Key Vault Integration

- **Key Vault name:** Provisioned via Bicep (`main.bicep` includes Key Vault resource)
- **Production Key Vault:** Deployed as part of `rg-cmmc-assessor-prod` resource group
- **Access method:** OIDC federation
- **Secrets consumed at:** Runtime (Container Apps environment variables reference Key Vault)
- **Key Vault reference pattern:** Application settings are injected as environment variables into Container Apps at deployment time.

### 6.3 OIDC Federation for Azure Authentication

We use **OpenID Connect (OIDC) federation** to authenticate GitHub Actions with Azure, eliminating long-lived service principal secrets.

| Configuration Item               | Value                          |
|----------------------------------|--------------------------------|
| Azure AD App Registration        | CMMC Assessor GitHub Actions   |
| Federated Credential Subject     | `repo:IntelliSecOps/cmmc-assessor:ref:refs/heads/main` |
| Audience                         | `api://AzureADTokenExchange`  |
| GitHub Actions action            | `azure/login@v2`              |

---

## 7. Reusable Workflows and Composite Actions

### Reusable Workflows

Currently, the project does not use reusable workflows or composite actions. Each of the three workflows (CI, CD, Infrastructure) is self-contained.

### Planned Improvements

| Improvement                      | Description                                           | Priority    |
|----------------------------------|-------------------------------------------------------|-------------|
| Extract shared Node.js setup     | Create a composite action for checkout + Node 20 setup + npm ci | Medium |
| Extract Docker build steps       | Create a reusable workflow for multi-stage Docker builds | Low       |

---

## 8. Workflow Status Badges

Add these badges to the repository README for at-a-glance pipeline health.

| Workflow         | Badge                                                                                         |
|------------------|-----------------------------------------------------------------------------------------------|
| CI               | `![CI](https://github.com/IntelliSecOps/cmmc-assessor/actions/workflows/ci.yml/badge.svg)`   |
| CD               | `![CD](https://github.com/IntelliSecOps/cmmc-assessor/actions/workflows/cd.yml/badge.svg)`   |
| Infrastructure   | `![Infra](https://github.com/IntelliSecOps/cmmc-assessor/actions/workflows/infrastructure.yml/badge.svg)` |

---

## 9. Branch Protection Rules

| Branch        | Required Reviews | Required Status Checks                                        | Dismiss Stale Reviews | Require Signed Commits | Allow Force Push |
|---------------|------------------|---------------------------------------------------------------|-----------------------|------------------------|------------------|
| `main`        | 1                | `backend-ci`, `frontend-ci`, `security-scan`, `dependency-audit` | Yes                | No                     | No               |
| `develop`     | 1                | `backend-ci`, `frontend-ci`                                   | Yes                   | No                     | No               |

---

## 10. Appendix

### Key Contacts

| Role                     | Name                    | GitHub Handle      |
|--------------------------|-------------------------|--------------------|
| CI/CD Pipeline Owner     | IntelliSecOps DevOps    | @intellisecops     |
| Platform / DevOps Lead   | IntelliSecOps DevOps    | @intellisecops     |
| Security Champion        | IntelliSecOps Security  | @intellisecops     |

### Related Pages

- [Build Pipeline](./build-pipeline.md)
- [Release Pipeline](./release-pipeline.md)
- [Environment Strategy](./environment-strategy.md)
- [Test Strategy](../06-testing/test-strategy.md)
