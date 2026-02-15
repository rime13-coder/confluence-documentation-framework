# Infrastructure as Code (IaC)

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Infrastructure as Code (IaC)       |
| Last Updated     | [YYYY-MM-DD]                       |
| Status           | [Draft / In Review / Approved]     |
| Owner            | [TEAM OR INDIVIDUAL NAME]          |

---

## 1. Document Purpose

This document defines the Infrastructure as Code (IaC) strategy, standards, and workflows for the [PROJECT NAME] platform on Azure. It covers the chosen IaC tooling, repository structure, CI/CD pipeline integration with GitHub Actions, state management, testing, and change management processes.

---

## 2. IaC Tool Selection

| Attribute                     | Value                                                     |
|-------------------------------|-----------------------------------------------------------|
| Primary IaC Tool              | [Terraform / Bicep]                                       |
| Version                       | [e.g., Terraform 1.7.x / Bicep CLI 0.25.x]               |
| Secondary IaC Tool (if any)   | [e.g., Bicep for ARM-native, Terraform for multi-cloud]   |
| Rationale                     | [RATIONALE FOR TOOL CHOICE]                               |
| Provider Version (Terraform)  | [azurerm ~> 3.x]                                          |

---

## 3. Repository Structure

### 3.1 If Using Terraform

```
infrastructure/
+-- README.md
+-- environments/
|   +-- dev/
|   |   +-- main.tf
|   |   +-- variables.tf
|   |   +-- terraform.tfvars
|   |   +-- backend.tf
|   |   +-- outputs.tf
|   +-- staging/
|   |   +-- main.tf
|   |   +-- variables.tf
|   |   +-- terraform.tfvars
|   |   +-- backend.tf
|   |   +-- outputs.tf
|   +-- prod/
|       +-- main.tf
|       +-- variables.tf
|       +-- terraform.tfvars
|       +-- backend.tf
|       +-- outputs.tf
+-- modules/
|   +-- aks/
|   |   +-- main.tf
|   |   +-- variables.tf
|   |   +-- outputs.tf
|   |   +-- README.md
|   +-- app-service/
|   |   +-- main.tf
|   |   +-- variables.tf
|   |   +-- outputs.tf
|   +-- functions/
|   |   +-- main.tf
|   |   +-- variables.tf
|   |   +-- outputs.tf
|   +-- networking/
|   |   +-- main.tf
|   |   +-- variables.tf
|   |   +-- outputs.tf
|   +-- sql-database/
|   |   +-- main.tf
|   |   +-- variables.tf
|   |   +-- outputs.tf
|   +-- key-vault/
|   |   +-- main.tf
|   |   +-- variables.tf
|   |   +-- outputs.tf
|   +-- monitoring/
|       +-- main.tf
|       +-- variables.tf
|       +-- outputs.tf
+-- shared/
|   +-- versions.tf
|   +-- providers.tf
+-- tests/
|   +-- aks_test.go
|   +-- networking_test.go
+-- .github/
|   +-- workflows/
|       +-- terraform-plan.yml
|       +-- terraform-apply.yml
+-- .tflint.hcl
+-- .pre-commit-config.yaml
```

### 3.2 If Using Bicep

```
infrastructure/
+-- README.md
+-- environments/
|   +-- dev/
|   |   +-- main.bicepparam
|   +-- staging/
|   |   +-- main.bicepparam
|   +-- prod/
|       +-- main.bicepparam
+-- modules/
|   +-- aks/
|   |   +-- main.bicep
|   |   +-- params.bicep
|   +-- app-service/
|   |   +-- main.bicep
|   |   +-- params.bicep
|   +-- functions/
|   |   +-- main.bicep
|   |   +-- params.bicep
|   +-- networking/
|   |   +-- main.bicep
|   |   +-- params.bicep
|   +-- sql-database/
|   |   +-- main.bicep
|   |   +-- params.bicep
|   +-- key-vault/
|   |   +-- main.bicep
|   |   +-- params.bicep
|   +-- monitoring/
|       +-- main.bicep
|       +-- params.bicep
+-- main.bicep
+-- bicepconfig.json
+-- .github/
|   +-- workflows/
|       +-- bicep-validate.yml
|       +-- bicep-deploy.yml
```

---

## 4. Module / Template Organization

### 4.1 Module Inventory

| Module Name     | Purpose                                    | Dependencies                   | Environments Used  |
|-----------------|--------------------------------------------|--------------------------------|--------------------|
| `networking`    | VNets, subnets, NSGs, peering              | None                           | All                |
| `aks`           | AKS cluster, node pools, identities        | `networking`, `key-vault`      | All                |
| `app-service`   | App Service Plan, Web Apps, slots           | `networking`                   | All                |
| `functions`     | Function Apps, consumption/premium plans    | `networking`, `key-vault`      | All                |
| `sql-database`  | SQL Server, databases, firewall rules       | `networking`                   | All                |
| `key-vault`     | Key Vault, access policies                 | None                           | All                |
| `monitoring`    | Log Analytics, App Insights, dashboards     | None                           | All                |
| [MODULE NAME]   | [PURPOSE]                                  | [DEPENDENCIES]                 | [ENVIRONMENTS]     |

### 4.2 Module Design Principles

- Each module is self-contained with clear inputs (variables) and outputs
- Modules do not hard-code environment-specific values
- Cross-module dependencies are passed via outputs/variables, not data sources
- All modules include a README with usage examples
- Module versioning follows semantic versioning when published to a registry

---

## 5. State Management

### 5.1 Terraform State Management

| Attribute                      | Value                                                   |
|--------------------------------|---------------------------------------------------------|
| Backend Type                   | `azurerm` (Azure Storage Account)                       |
| Storage Account Name           | [stterraformstate001]                                   |
| Container Name                 | [tfstate]                                               |
| State File Naming              | [{environment}/{project}.tfstate]                       |
| State Locking                  | [Enabled via Azure Blob Lease]                          |
| Encryption                     | [Encrypted at rest (Azure Storage encryption)]          |
| Access Control                 | [Service principal with Storage Blob Data Contributor]  |
| State File Backup              | [Blob versioning enabled, soft delete 30 days]          |

### State File Inventory

| Environment | State File Path                          | Storage Account         | Resource Group          |
|-------------|------------------------------------------|-------------------------|-------------------------|
| Development | [dev/project.tfstate]                    | [stterraformstate001]   | [rg-infra-shared-001]   |
| Staging     | [staging/project.tfstate]                | [stterraformstate001]   | [rg-infra-shared-001]   |
| Production  | [prod/project.tfstate]                   | [stterraformstate001]   | [rg-infra-shared-001]   |

### 5.2 Bicep Deployment History (State Management)

| Attribute                      | Value                                                   |
|--------------------------------|---------------------------------------------------------|
| Deployment Scope               | [Resource Group / Subscription]                         |
| Deployment Mode                | [Incremental (default)]                                 |
| Deployment History Retention   | [Azure retains last 800 deployments per scope]          |
| What-If Validation             | [Run before every deployment]                           |
| Deployment Naming Convention   | [deploy-{project}-{env}-{timestamp}]                    |

---

## 6. IaC CI/CD Pipeline (GitHub Actions)

### 6.1 Terraform Workflow

```yaml
# .github/workflows/terraform-plan.yml (simplified reference)
name: Terraform Plan
on:
  pull_request:
    paths:
      - 'infrastructure/**'

jobs:
  plan:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev, staging, prod]
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - name: Terraform Init
        run: terraform init -backend-config=environments/${{ matrix.environment }}/backend.tf
        working-directory: infrastructure/environments/${{ matrix.environment }}
      - name: Terraform Validate
        run: terraform validate
      - name: Terraform Plan
        run: terraform plan -out=tfplan
        env:
          ARM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          ARM_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
          ARM_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          ARM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
      - name: Post Plan to PR
        uses: actions/github-script@v7
        # [POST PLAN OUTPUT AS PR COMMENT]
```

```yaml
# .github/workflows/terraform-apply.yml (simplified reference)
name: Terraform Apply
on:
  push:
    branches: [main]
    paths:
      - 'infrastructure/**'

jobs:
  apply:
    runs-on: ubuntu-latest
    environment: [ENVIRONMENT_NAME]  # GitHub Environment with required reviewers
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - name: Terraform Init
        run: terraform init
      - name: Terraform Apply
        run: terraform apply -auto-approve
        env:
          ARM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          ARM_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
          ARM_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          ARM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
```

### 6.2 Bicep Workflow

```yaml
# .github/workflows/bicep-validate.yml (simplified reference)
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
      - name: What-If (Dev)
        run: |
          az deployment group what-if \
            --resource-group [RESOURCE_GROUP] \
            --template-file infrastructure/main.bicep \
            --parameters infrastructure/environments/dev/main.bicepparam
```

### 6.3 Pipeline Stages Overview

| Stage              | Trigger                 | Actions                                      | Approval Required |
|--------------------|-------------------------|----------------------------------------------|-------------------|
| Lint & Validate    | PR opened/updated       | Format check, validate, lint (tflint/bicep)  | No                |
| Plan / What-If     | PR opened/updated       | Generate plan, post to PR as comment         | No                |
| Apply (Dev)        | Merge to main           | Apply to development environment             | No                |
| Apply (Staging)    | After Dev success       | Apply to staging environment                 | No                |
| Apply (Production) | After Staging success   | Apply to production environment              | Yes ([APPROVER])  |

---

## 7. Azure Resource Naming Conventions

| Resource Type          | Convention                                  | Example                        |
|------------------------|---------------------------------------------|--------------------------------|
| Resource Group         | `rg-{workload}-{env}-{region}-{instance}`   | `rg-app-prod-eus-001`         |
| AKS Cluster            | `aks-{workload}-{env}-{region}-{instance}`  | `aks-app-prod-eus-001`        |
| App Service Plan       | `asp-{workload}-{env}-{region}-{instance}`  | `asp-web-prod-eus-001`        |
| App Service            | `app-{workload}-{env}-{region}-{instance}`  | `app-web-prod-eus-001`        |
| Function App           | `func-{workload}-{env}-{region}-{instance}` | `func-proc-prod-eus-001`      |
| Virtual Machine        | `vm-{workload}-{env}-{region}-{instance}`   | `vm-legacy-prod-eus-001`      |
| SQL Server             | `sql-{workload}-{env}-{region}-{instance}`  | `sql-db-prod-eus-001`         |
| Storage Account        | `st{workload}{env}{region}{instance}`        | `stapprodeus001`               |
| Key Vault              | `kv-{workload}-{env}-{region}-{instance}`   | `kv-app-prod-eus-001`         |
| VNet                   | `vnet-{workload}-{env}-{region}-{instance}` | `vnet-app-prod-eus-001`       |
| Subnet                 | `snet-{purpose}`                            | `snet-aks`, `snet-data`       |
| NSG                    | `nsg-{purpose}-{env}`                       | `nsg-aks-prod`                |
| Log Analytics          | `log-{workload}-{env}-{region}-{instance}`  | `log-app-prod-eus-001`        |
| Application Insights   | `ai-{workload}-{env}-{region}-{instance}`   | `ai-app-prod-eus-001`         |
| Managed Identity       | `mi-{workload}-{env}-{region}-{instance}`   | `mi-aks-prod-eus-001`         |

---

## 8. IaC Coding Standards

### 8.1 General Standards

- [ ] All resources must include required tags (see Tagging Strategy)
- [ ] No hard-coded secrets; use Key Vault references or GitHub Secrets
- [ ] No hard-coded environment-specific values; use variables/parameters
- [ ] All modules must have input validation on variables
- [ ] Use consistent formatting (`terraform fmt` / Bicep formatter)
- [ ] Include descriptions on all variables and outputs
- [ ] Use data sources sparingly; prefer passing values via outputs

### 8.2 Terraform-Specific Standards

- [ ] Pin provider versions using `~>` constraint
- [ ] Pin module versions when using registry modules
- [ ] Use `locals` for derived/computed values, not in `variables.tf`
- [ ] Group related resources in the same `.tf` file
- [ ] Use `count` or `for_each` for conditional/repeated resources
- [ ] Never use `terraform destroy` in automated pipelines without safeguards

### 8.3 Bicep-Specific Standards

- [ ] Use parameter files (`.bicepparam`) for environment-specific values
- [ ] Leverage Bicep modules for reusable components
- [ ] Use `@description()` decorator on all parameters and outputs
- [ ] Use `@allowed()` for constrained parameter values
- [ ] Use `existing` keyword when referencing pre-existing resources
- [ ] Always use incremental deployment mode

---

## 9. Drift Detection Strategy

| Attribute                     | Value                                                    |
|-------------------------------|----------------------------------------------------------|
| Detection Method              | [Scheduled Terraform plan / Azure Policy audit / Manual] |
| Detection Frequency           | [Daily / Weekly]                                         |
| Detection Pipeline            | [GitHub Actions scheduled workflow]                      |
| Notification Channel          | [Slack / Teams / Email]                                  |
| Remediation Process           | [Auto-remediate / Manual review + apply]                 |
| Drift Tolerance               | [Zero tolerance for production]                          |

### Drift Detection Workflow

```yaml
# .github/workflows/drift-detection.yml (simplified reference)
name: Drift Detection
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 06:00 UTC

jobs:
  detect:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [dev, staging, prod]
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - name: Terraform Plan (Detect Drift)
        run: |
          terraform init
          terraform plan -detailed-exitcode
          # Exit code 2 = changes detected (drift)
      - name: Notify on Drift
        if: failure()
        run: |
          # [SEND NOTIFICATION TO TEAM CHANNEL]
```

---

## 10. IaC Testing

### 10.1 Terraform Testing (Terratest)

| Test Type         | Tool        | Scope                              | Execution              |
|-------------------|-------------|-------------------------------------|------------------------|
| Unit Tests        | Terratest   | Module input/output validation      | PR pipeline            |
| Integration Tests | Terratest   | Deploy module, validate, destroy    | Nightly / on demand    |
| Plan Validation   | Terraform   | `terraform validate` + `plan`       | Every PR               |
| Lint              | tflint      | Best practice checks                | Every PR               |
| Security Scan     | tfsec/Checkov | Security misconfigurations        | Every PR               |

### 10.2 Bicep Testing

| Test Type         | Tool             | Scope                              | Execution              |
|-------------------|------------------|-------------------------------------|------------------------|
| Build Validation  | `az bicep build`  | Syntax and compilation             | Every PR               |
| What-If           | `az deployment what-if` | Preview changes              | Every PR               |
| Lint              | Bicep Linter     | Best practice checks                | Every PR               |
| Security Scan     | Checkov          | Security misconfigurations          | Every PR               |
| Policy Compliance | Azure Policy     | Compliance against policies         | On deployment          |

---

## 11. Change Management for Infrastructure Changes

### 11.1 Change Process

| Step | Action                                     | Responsibility       |
|------|--------------------------------------------|----------------------|
| 1    | Create PR with infrastructure changes      | Engineer             |
| 2    | Automated lint, validate, and plan run      | CI Pipeline          |
| 3    | Plan output reviewed by team               | Peer reviewer        |
| 4    | PR approved (minimum [NUMBER] approvals)   | Reviewer(s)          |
| 5    | Merge to main triggers apply to Dev        | CI Pipeline          |
| 6    | Validation in Dev environment              | Engineer             |
| 7    | Promotion to Staging (auto or manual)      | CI Pipeline          |
| 8    | Validation in Staging                       | Engineer / QA        |
| 9    | Production apply with required approval    | CI Pipeline + Approver |
| 10   | Post-deployment verification               | Engineer / SRE       |

### 11.2 Change Classification

| Change Type    | Examples                                | Approval Required        | Deployment Window      |
|----------------|-----------------------------------------|--------------------------|------------------------|
| Standard       | Scaling, config updates, tag changes    | 1 reviewer               | Anytime                |
| Normal         | New resources, network changes          | 2 reviewers              | Business hours         |
| Emergency      | Hotfix, security patch                  | 1 reviewer (post-facto)  | Immediate              |
| Major          | Architecture changes, region migration  | Team lead + architect    | Scheduled maintenance  |

---

## 12. Revision History

| Date           | Author            | Changes Made                              |
|----------------|-------------------|-------------------------------------------|
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [Initial document creation]               |
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [DESCRIPTION OF CHANGES]                  |
