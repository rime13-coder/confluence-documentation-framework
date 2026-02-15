# Infrastructure as Code (IaC)

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Infrastructure as Code (IaC)       |
| Last Updated     | 2026-02-14                         |
| Status           | Draft                              |
| Owner            | IntelliSec Solutions               |

---

## 1. Document Purpose

This document defines the Infrastructure as Code (IaC) strategy, standards, and workflows for the CMMC Assessor Platform on Azure. It covers the chosen IaC tooling, repository structure, CI/CD pipeline integration with GitHub Actions, state management, and change management processes.

---

## 2. IaC Tool Selection

| Attribute                     | Value                                                     |
|-------------------------------|-----------------------------------------------------------|
| Primary IaC Tool              | Bicep                                                     |
| Version                       | Azure CLI bundled Bicep CLI                               |
| Secondary IaC Tool (if any)   | None                                                      |
| Rationale                     | Native Azure ARM integration, simpler syntax than ARM JSON, no state management overhead compared to Terraform |
| Provider Version (Terraform)  | N/A -- Bicep is used                                      |

---

## 3. Repository Structure

### 3.1 Current Bicep Structure

```
infrastructure/
+-- main.bicep                  # Single monolithic Bicep file
+-- parameters.prod.json        # Production parameter values
```

> **Current State:** The IaC consists of a single `main.bicep` file with a corresponding `parameters.prod.json`. There is no modular structure, no environment separation in the IaC layer, and no separate module files.

### Planned Improvements

- Refactor `main.bicep` into separate modules (networking, compute, data, monitoring)
- Add parameter files for staging/dev environments when those environments are created
- Add `bicepconfig.json` for linting configuration

---

## 4. Module / Template Organization

### 4.1 Module Inventory

| Module Name     | Purpose                                    | Dependencies                   | Environments Used  |
|-----------------|--------------------------------------------|--------------------------------|--------------------|
| `main.bicep`    | All resources (monolithic)                 | None (self-contained)          | Production only    |

> **Current State:** There are no separate modules. All resources are defined in a single `main.bicep` file. This includes Container Apps, Container Registry, PostgreSQL Flexible Server, Storage Account, Key Vault, Log Analytics, and the Container Apps Environment.

### 4.2 Module Design Principles (Target State)

- Each module should be self-contained with clear inputs (parameters) and outputs
- Modules should not hard-code environment-specific values
- Cross-module dependencies should be passed via outputs/parameters
- All parameters should include `@description()` decorators

---

## 5. State Management

### 5.1 Bicep Deployment History (State Management)

| Attribute                      | Value                                                   |
|--------------------------------|---------------------------------------------------------|
| Deployment Scope               | Resource Group (rg-cmmc-assessor-prod)                  |
| Deployment Mode                | Incremental (default)                                   |
| Deployment History Retention   | Azure retains last 800 deployments per scope            |
| What-If Validation             | NOT IMPLEMENTED -- no what-if step in pipeline          |
| Deployment Naming Convention   | Default Azure naming (timestamp-based)                  |

> **Note:** Bicep does not require external state management like Terraform. Azure Resource Manager tracks deployment history natively.

### Planned Improvements

- Add what-if validation step before production deployments
- Implement deployment naming convention for traceability

---

## 6. IaC CI/CD Pipeline (GitHub Actions)

### 6.1 Current Deployment Workflow

The infrastructure is deployed as part of the CD pipeline that runs on push to main. There is no separate IaC-only pipeline.

```yaml
# Current state: Infrastructure deployment is part of the main CD workflow
# Triggered on push to main branch
# Deploys directly to production -- no staging step
```

### 6.2 Bicep Validation Workflow

**Status: NOT IMPLEMENTED** -- There is no separate Bicep validation or what-if workflow on pull requests.

### Planned Bicep Validation Workflow

```yaml
# .github/workflows/bicep-validate.yml (PLANNED -- NOT IMPLEMENTED)
name: Bicep Validate
on:
  pull_request:
    paths:
      - 'infrastructure/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - name: Bicep Build
        run: az bicep build --file infrastructure/main.bicep
      - name: What-If (Production)
        run: |
          az deployment group what-if \
            --resource-group rg-cmmc-assessor-prod \
            --template-file infrastructure/main.bicep \
            --parameters infrastructure/parameters.prod.json
```

### 6.3 Pipeline Stages Overview

| Stage              | Trigger                 | Actions                                      | Approval Required | Status           |
|--------------------|-------------------------|----------------------------------------------|-------------------|------------------|
| Lint & Validate    | PR opened/updated       | NOT IMPLEMENTED                              | N/A               | NOT IMPLEMENTED  |
| Plan / What-If     | PR opened/updated       | NOT IMPLEMENTED                              | N/A               | NOT IMPLEMENTED  |
| Apply (Production) | Push to main            | Bicep deployment as part of CD workflow      | No                | Active           |

### Planned Improvements

- Add Bicep build validation on pull requests
- Add what-if preview step on pull requests
- Add approval gate before production infrastructure changes
- Separate infrastructure deployment from application deployment pipeline

---

## 7. Azure Resource Naming Conventions

| Resource Type              | Convention                             | Example                          |
|----------------------------|----------------------------------------|----------------------------------|
| Resource Group             | `rg-{baseName}-{env}`                  | `rg-cmmc-assessor-prod`          |
| Container App              | `{appName}`                            | `cmmc-api`, `cmmc-web`           |
| Container Apps Environment | `cae-{baseName}-{env}`                 | `cae-cmmc-assessor-prod`         |
| Container Registry         | `acr{baseName}{env}` (no hyphens)      | `acrcmmcassessorprod`            |
| PostgreSQL Flexible Server | `psql-{baseName}-{env}`                | `psql-cmmc-assessor-prod`        |
| Storage Account            | `st{baseName}{env}` (no hyphens)       | `stcmmcassessorprod`             |
| Key Vault                  | `kv-{baseName}-{env}`                  | `kv-cmmc-assessor-prod`          |
| Log Analytics Workspace    | `log-{baseName}-{env}`                 | `log-cmmc-assessor-prod`         |

---

## 8. IaC Coding Standards

### 8.1 General Standards

- [x] No hard-coded secrets; use Key Vault references or GitHub Secrets
- [ ] All resources must include required tags -- **Partially implemented (3 tags applied)**
- [ ] No hard-coded environment-specific values; use parameters -- **Partially (some values in main.bicep)**
- [ ] All modules must have input validation on parameters -- **NOT IMPLEMENTED (no modules)**
- [ ] Use consistent formatting -- **Not enforced**
- [ ] Include descriptions on all parameters and outputs -- **NOT IMPLEMENTED**

### 8.2 Bicep-Specific Standards

- [x] Use parameter files (`.bicepparam` / `.json`) for environment-specific values
- [ ] Leverage Bicep modules for reusable components -- **NOT IMPLEMENTED (monolithic)**
- [ ] Use `@description()` decorator on all parameters and outputs -- **NOT IMPLEMENTED**
- [ ] Use `@allowed()` for constrained parameter values -- **NOT IMPLEMENTED**
- [ ] Use `existing` keyword when referencing pre-existing resources -- **Not verified**
- [x] Always use incremental deployment mode

### Planned Improvements

- Refactor main.bicep into modules
- Add parameter decorators (`@description`, `@allowed`, `@minLength`, etc.)
- Add `bicepconfig.json` with linting rules enabled
- Implement Bicep linting in CI pipeline

---

## 9. Drift Detection Strategy

| Attribute                     | Value                                                    |
|-------------------------------|----------------------------------------------------------|
| Detection Method              | NOT IMPLEMENTED                                          |
| Detection Frequency           | N/A                                                      |
| Detection Pipeline            | N/A                                                      |
| Notification Channel          | N/A                                                      |
| Remediation Process           | N/A                                                      |
| Drift Tolerance               | N/A                                                      |

> **Status: NOT IMPLEMENTED.** There is no drift detection mechanism. Infrastructure changes made manually in the Azure Portal are not detected or reconciled with the Bicep templates.

### Planned Improvements

- Implement scheduled what-if runs to detect drift
- Send drift notifications via email or messaging channel
- Establish zero-tolerance drift policy for production

---

## 10. IaC Testing

### 10.1 Bicep Testing

| Test Type         | Tool             | Scope                              | Execution              | Status           |
|-------------------|------------------|-------------------------------------|------------------------|------------------|
| Build Validation  | `az bicep build`  | Syntax and compilation             | NOT IMPLEMENTED        | NOT IMPLEMENTED  |
| What-If           | `az deployment what-if` | Preview changes              | NOT IMPLEMENTED        | NOT IMPLEMENTED  |
| Lint              | Bicep Linter     | Best practice checks                | NOT IMPLEMENTED        | NOT IMPLEMENTED  |
| Security Scan     | Checkov          | Security misconfigurations          | NOT IMPLEMENTED        | NOT IMPLEMENTED  |
| Policy Compliance | Azure Policy     | Compliance against policies         | NOT IMPLEMENTED        | NOT IMPLEMENTED  |

### Planned Improvements

- Add `az bicep build` validation to PR pipeline
- Add what-if preview to PR pipeline
- Enable Bicep linter via `bicepconfig.json`
- Add Checkov or similar security scanning for Bicep templates

---

## 11. Change Management for Infrastructure Changes

### 11.1 Change Process (Current State)

| Step | Action                                     | Responsibility       |
|------|--------------------------------------------|----------------------|
| 1    | Modify main.bicep or parameters.prod.json  | Engineer             |
| 2    | Create PR and merge to main                | Engineer + Reviewer  |
| 3    | CD pipeline deploys infrastructure + app   | GitHub Actions       |

> **Current State:** Infrastructure changes follow the same workflow as application code changes. There is no separate approval process, no plan/what-if review, and no staged rollout for infrastructure changes.

### 11.2 Change Classification

| Change Type    | Examples                                | Approval Required        | Deployment Window      |
|----------------|-----------------------------------------|--------------------------|------------------------|
| Standard       | Tag updates, parameter changes          | 1 PR reviewer            | Anytime (no window)    |
| Normal         | New resources, configuration changes    | 1 PR reviewer            | Anytime (no window)    |
| Major          | Architecture changes, networking        | Team discussion          | Not defined            |

### Planned Improvements

- Implement separate IaC pipeline with what-if preview
- Add required approvals for production infrastructure changes
- Define deployment windows for infrastructure changes

---

## 12. Revision History

| Date           | Author               | Changes Made                              |
|----------------|-----------------------|-------------------------------------------|
| 2026-02-14     | IntelliSec Solutions  | Initial document creation                 |
