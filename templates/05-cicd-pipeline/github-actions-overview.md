# GitHub Actions CI/CD Overview

| **Page Title**   | GitHub Actions CI/CD Overview              |
|------------------|--------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                               |
| **Status**       | [Draft / In Review / Approved / Deprecated] |
| **Owner**        | [TEAM OR INDIVIDUAL NAME]                  |

---

## 1. CI/CD Philosophy

Our CI/CD philosophy is built on the following principles:

- **Automate everything** — every build, test, and deployment is triggered and executed through GitHub Actions with zero manual steps in the critical path.
- **Shift left** — catch defects as early as possible through linting, static analysis, and unit tests that run on every push.
- **Immutable artifacts** — build once, deploy the same artifact through every environment.
- **Environment parity** — keep non-production environments as close to production as feasible to reduce deployment surprises.
- **Fast feedback** — optimize pipeline duration so developers receive results within minutes, not hours.
- **Auditability** — every deployment is traceable to a commit, a pull request, an approver, and a workflow run.

---

## 2. Branching Strategy

Choose **one** of the following strategies and delete the other.

### Option A — GitFlow

| Branch            | Purpose                                  | Lifetime     | Deploys To       |
|-------------------|------------------------------------------|--------------|------------------|
| `main`            | Production-ready code                    | Permanent    | Production       |
| `develop`         | Integration branch for next release      | Permanent    | Dev / QA         |
| `feature/*`       | New feature development                  | Short-lived  | Ephemeral / Dev  |
| `release/*`       | Release stabilization                    | Short-lived  | Staging          |
| `hotfix/*`        | Emergency production fixes               | Short-lived  | Staging -> Prod  |

**When to use:** Large teams with scheduled release cadences, multiple parallel releases, or regulatory environments that require formal release branches.

### Option B — Trunk-Based Development

| Branch            | Purpose                                  | Lifetime     | Deploys To       |
|-------------------|------------------------------------------|--------------|------------------|
| `main`            | Single source of truth; always deployable | Permanent    | All environments |
| `feature/*`       | Short-lived feature branches (< 2 days)  | Short-lived  | Ephemeral / Dev  |

**When to use:** Teams practicing continuous delivery, small-to-medium team sizes, and projects where feature flags control rollout.

---

## 3. Repository Structure

| Approach    | Description                                                                 | Pros                                      | Cons                                          |
|-------------|-----------------------------------------------------------------------------|-------------------------------------------|-----------------------------------------------|
| **Mono-repo** | All services, libraries, and IaC live in a single repository.             | Atomic cross-service changes; shared workflows | Larger clone size; path-filter complexity     |
| **Multi-repo** | Each service or bounded context has its own repository.                  | Clear ownership boundaries; isolated CI    | Cross-repo coordination; workflow duplication |

**Current approach:** [MONO-REPO / MULTI-REPO / HYBRID]

Repository list (if multi-repo):

| Repository                        | Contents                  | Primary Language | Team        |
|-----------------------------------|---------------------------|------------------|-------------|
| [ORG/REPO-NAME]                   | [SERVICE OR COMPONENT]    | [LANGUAGE]       | [TEAM NAME] |
| [ORG/REPO-NAME]                   | [SERVICE OR COMPONENT]    | [LANGUAGE]       | [TEAM NAME] |
| [ORG/REPO-NAME]                   | Infrastructure as Code    | Bicep / Terraform| [TEAM NAME] |

---

## 4. Workflow Inventory

| Workflow Name            | Trigger                          | Purpose                            | File Path                          | Target Environments        |
|--------------------------|----------------------------------|------------------------------------|------------------------------------|----------------------------|
| [BUILD-WORKFLOW]         | `push` to `main`, `pull_request` | Build, lint, unit test             | `.github/workflows/build.yml`      | N/A (CI only)              |
| [DEPLOY-DEV]             | Workflow completion (build)      | Deploy to Dev                      | `.github/workflows/deploy-dev.yml` | Dev                        |
| [DEPLOY-STAGING]         | Manual / on release branch push  | Deploy to Staging                  | `.github/workflows/deploy-stg.yml` | Staging                    |
| [DEPLOY-PRODUCTION]      | Manual with approval             | Deploy to Production               | `.github/workflows/deploy-prd.yml` | Production                 |
| [INFRA-PLAN]             | `pull_request` (IaC paths)       | Terraform/Bicep plan               | `.github/workflows/infra-plan.yml` | All                        |
| [INFRA-APPLY]            | `push` to `main` (IaC paths)    | Terraform/Bicep apply              | `.github/workflows/infra-apply.yml`| Per environment            |
| [SCHEDULED-SECURITY]     | `schedule` (cron)                | Dependency & container scanning    | `.github/workflows/security.yml`   | N/A                        |
| [ADD MORE AS NEEDED]     |                                  |                                    |                                    |                            |

---

## 5. GitHub Environments Configuration

| Environment   | URL                            | Protection Rules                                              | Deployment Branch Filter   |
|---------------|--------------------------------|---------------------------------------------------------------|----------------------------|
| **Dev**       | [DEV-URL]                      | None (auto-deploy)                                            | `main`, `develop`, `feature/*` |
| **Staging**   | [STAGING-URL]                  | Required reviewers: [REVIEWER-LIST]; Wait timer: [MINUTES] min | `main`, `release/*`        |
| **Production**| [PRODUCTION-URL]               | Required reviewers: [REVIEWER-LIST]; Wait timer: [MINUTES] min; Admin override only | `main`, `release/*` |

### Environment-Specific Variables (non-secret)

| Variable Name                | Dev                  | Staging              | Production           |
|------------------------------|----------------------|----------------------|----------------------|
| `AZURE_SUBSCRIPTION_ID`     | [DEV-SUB-ID]        | [STG-SUB-ID]        | [PRD-SUB-ID]        |
| `AZURE_RESOURCE_GROUP`      | [DEV-RG]            | [STG-RG]            | [PRD-RG]            |
| `APP_URL`                   | [DEV-URL]           | [STG-URL]           | [PRD-URL]           |
| [ADD MORE AS NEEDED]        |                      |                      |                      |

---

## 6. Secrets Management

### 6.1 GitHub Secrets

| Secret Name                  | Scope             | Description                          | Rotation Schedule     |
|------------------------------|--------------------|--------------------------------------|-----------------------|
| `AZURE_CLIENT_ID`           | Environment        | Azure AD app registration client ID  | [ROTATION-SCHEDULE]   |
| `AZURE_TENANT_ID`           | Organization       | Azure AD tenant ID                   | N/A                   |
| `AZURE_SUBSCRIPTION_ID`     | Environment        | Target Azure subscription            | N/A                   |
| [ADD MORE AS NEEDED]        |                    |                                      |                       |

### 6.2 Azure Key Vault Integration

- **Key Vault name per environment:**
  - Dev: `[DEV-KEYVAULT-NAME]`
  - Staging: `[STG-KEYVAULT-NAME]`
  - Production: `[PRD-KEYVAULT-NAME]`
- **Access method:** [OIDC federation / Service Principal]
- **Secrets consumed at:** [Build time / Deploy time / Runtime]
- **Key Vault reference pattern:** Application settings reference Key Vault URIs so secrets are never stored in app config.

### 6.3 OIDC Federation for Azure Authentication

We use **OpenID Connect (OIDC) federation** to authenticate GitHub Actions with Azure, eliminating long-lived service principal secrets.

| Configuration Item               | Value                          |
|----------------------------------|--------------------------------|
| Azure AD App Registration        | [APP-REGISTRATION-NAME]       |
| Federated Credential Subject     | `repo:[ORG/REPO]:environment:[ENV]` |
| Audience                         | `api://AzureADTokenExchange`  |
| GitHub Actions action            | `azure/login@v2`              |

---

## 7. Reusable Workflows and Composite Actions

### Reusable Workflows

| Workflow                         | Location                                        | Purpose                                  |
|----------------------------------|-------------------------------------------------|------------------------------------------|
| [REUSABLE-BUILD]                 | `.github/workflows/reusable-build.yml`          | Standard build, test, and artifact publish |
| [REUSABLE-DEPLOY]                | `.github/workflows/reusable-deploy.yml`         | Deploy to any Azure environment           |
| [REUSABLE-INFRA]                 | `.github/workflows/reusable-infra.yml`          | Terraform/Bicep plan and apply            |
| [ADD MORE AS NEEDED]             |                                                 |                                          |

### Composite Actions

| Action                           | Location                                        | Purpose                                  |
|----------------------------------|-------------------------------------------------|------------------------------------------|
| [SETUP-DOTNET]                   | `.github/actions/setup-dotnet/action.yml`       | Install .NET SDK with caching            |
| [RUN-TESTS]                      | `.github/actions/run-tests/action.yml`          | Execute tests and publish results        |
| [ADD MORE AS NEEDED]             |                                                 |                                          |

---

## 8. Workflow Status Badges

Add these badges to repository README files for at-a-glance pipeline health.

| Workflow         | Badge                                                                                         |
|------------------|-----------------------------------------------------------------------------------------------|
| Build            | `![Build](https://github.com/[ORG]/[REPO]/actions/workflows/build.yml/badge.svg)`            |
| Deploy Staging   | `![Deploy Staging](https://github.com/[ORG]/[REPO]/actions/workflows/deploy-stg.yml/badge.svg)` |
| Deploy Production| `![Deploy Prod](https://github.com/[ORG]/[REPO]/actions/workflows/deploy-prd.yml/badge.svg)` |
| Security Scan    | `![Security](https://github.com/[ORG]/[REPO]/actions/workflows/security.yml/badge.svg)`      |

---

## 9. Branch Protection Rules

| Branch        | Required Reviews | Required Status Checks                        | Dismiss Stale Reviews | Require Signed Commits | Restrict Pushes To        | Allow Force Push |
|---------------|------------------|------------------------------------------------|-----------------------|------------------------|---------------------------|------------------|
| `main`        | [NUMBER]         | `build`, `lint`, `unit-test`, `security-scan`  | Yes                   | [YES/NO]               | [TEAM OR ROLE]            | No               |
| `develop`     | [NUMBER]         | `build`, `lint`, `unit-test`                   | Yes                   | [YES/NO]               | [TEAM OR ROLE]            | No               |
| `release/*`   | [NUMBER]         | `build`, `integration-test`                    | Yes                   | [YES/NO]               | [TEAM OR ROLE]            | No               |

---

## 10. Appendix

### Key Contacts

| Role                     | Name              | GitHub Handle      |
|--------------------------|-------------------|--------------------|
| CI/CD Pipeline Owner     | [NAME]            | @[HANDLE]          |
| Platform / DevOps Lead   | [NAME]            | @[HANDLE]          |
| Security Champion        | [NAME]            | @[HANDLE]          |

### Related Pages

- [Build Pipeline](./build-pipeline.md)
- [Release Pipeline](./release-pipeline.md)
- [Environment Strategy](./environment-strategy.md)
- [Test Strategy](../06-testing/test-strategy.md)
