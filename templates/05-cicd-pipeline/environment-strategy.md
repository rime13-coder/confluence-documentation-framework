# Environment Strategy

| **Page Title**   | Environment Strategy                       |
|------------------|--------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                               |
| **Status**       | [Draft / In Review / Approved / Deprecated] |
| **Owner**        | [TEAM OR INDIVIDUAL NAME]                  |

---

## 1. Environment Inventory

| Environment        | Purpose                                 | Azure Subscription          | Resource Group          | URL                      | Access Level               | Data Type                 |
|--------------------|-----------------------------------------|-----------------------------|-------------------------|--------------------------|----------------------------|---------------------------|
| **Dev**            | Active development and debugging        | [DEV-SUBSCRIPTION-NAME/ID]  | [DEV-RG]                | [DEV-URL]                | All developers             | Synthetic / seed data     |
| **QA / Test**      | Functional and integration testing      | [QA-SUBSCRIPTION-NAME/ID]   | [QA-RG]                 | [QA-URL]                 | QA team + developers       | Synthetic test data       |
| **Staging / Pre-Prod** | Pre-production validation, UAT      | [STG-SUBSCRIPTION-NAME/ID]  | [STG-RG]                | [STG-URL]                | QA + product owners + ops  | Anonymized production data|
| **Production**     | Live customer-facing environment        | [PRD-SUBSCRIPTION-NAME/ID]  | [PRD-RG]                | [PRD-URL]                | Operations team only       | Real customer data        |
| **Ephemeral (PR)** | Per-pull-request preview environments   | [DEV-SUBSCRIPTION-NAME/ID]  | [EPHEMERAL-RG]          | Auto-generated           | PR author + reviewers      | Minimal seed data         |

---

## 2. Environment Parity Matrix

This matrix documents intentional differences between environments. The goal is to keep environments as similar as possible while managing cost and data sensitivity.

| Dimension                 | Dev                         | QA / Test                   | Staging / Pre-Prod          | Production                  |
|---------------------------|-----------------------------|-----------------------------|-----------------------------|------------------------------|
| **AKS Node Count**        | [NUMBER]                    | [NUMBER]                    | [NUMBER]                    | [NUMBER]                     |
| **AKS Node SKU**          | [SKU: e.g., Standard_B2s]  | [SKU]                       | [SKU: same as prod]         | [SKU: e.g., Standard_D4s_v5] |
| **App Service Plan SKU**  | [SKU: e.g., B1]            | [SKU: e.g., S1]            | [SKU: same as prod]         | [SKU: e.g., P2v3]           |
| **SQL Database Tier**     | [TIER: e.g., Basic]        | [TIER: e.g., S1]           | [TIER: same as prod]        | [TIER: e.g., P2]            |
| **Replicas / Instances**  | 1                           | 1-2                         | [SAME AS PROD or reduced]   | [NUMBER]                     |
| **Feature Flags**         | All enabled                 | Per test plan               | Mirror production            | Controlled rollout           |
| **SSL/TLS**               | Self-signed / Let's Encrypt | Let's Encrypt               | Org CA cert                  | Org CA cert (production)     |
| **Custom Domain**         | No                          | No                          | [STG-DOMAIN]                 | [PRD-DOMAIN]                 |
| **Monitoring Level**      | Basic (logs + metrics)      | Basic                       | Full (same as prod)          | Full (APM, alerts, dashboards)|
| **Auto-scaling**          | Disabled                    | Disabled                    | Enabled (conservative)       | Enabled (production rules)   |
| **Backup / DR**           | None                        | None                        | Daily backups                | [BACKUP-SCHEDULE] + geo-DR   |

---

## 3. Data Strategy per Environment

| Environment        | Data Source                           | Data Volume      | PII Present | Refresh Frequency       | Management Approach                            |
|--------------------|---------------------------------------|------------------|-------------|-------------------------|------------------------------------------------|
| **Dev**            | Seed scripts / synthetic generators   | Minimal          | No          | On-demand               | Developers run seed scripts locally or in CI   |
| **QA / Test**      | Synthetic test data suite             | Moderate         | No          | Before each test cycle  | Automated data setup/teardown in test framework|
| **Staging**        | Anonymized production snapshot        | Production-like  | No (masked) | [FREQUENCY: e.g., weekly] | Automated anonymization pipeline             |
| **Production**     | Real customer data                    | Full             | Yes         | N/A (live)              | Subject to data governance and compliance      |
| **Ephemeral (PR)** | Minimal seed data                     | Minimal          | No          | Per PR creation         | Provisioned and destroyed with PR lifecycle    |

### Data Anonymization Pipeline

- **Tool:** [TOOL-NAME: e.g., Azure Data Factory, custom script, Delphix]
- **Schedule:** [SCHEDULE]
- **Anonymization rules:** [LINK TO DATA MASKING RULES DOCUMENT]
- **Validation:** Post-anonymization checks confirm no PII remains

---

## 4. Environment Provisioning (Infrastructure as Code)

### IaC Tooling

| Component                | Tool                                | Repository                        | State Storage                       |
|--------------------------|-------------------------------------|-----------------------------------|--------------------------------------|
| Azure infrastructure     | [Terraform / Bicep]                 | [ORG/INFRA-REPO]                  | [Azure Storage Account / Terraform Cloud] |
| Kubernetes manifests     | [Helm / Kustomize]                  | [ORG/K8S-REPO or same repo]      | Git (GitOps)                         |
| Database migrations      | [TOOL: e.g., Flyway, EF Migrations]| [ORG/APP-REPO]                    | N/A (applied at deploy time)         |

### Provisioning Workflow

1. Developer submits a PR modifying IaC files.
2. GitHub Actions runs `terraform plan` / `bicep what-if` and posts the plan as a PR comment.
3. Reviewer approves the PR after inspecting the plan.
4. On merge to `main`, GitHub Actions runs `terraform apply` / `az deployment group create` for the target environment.
5. Post-apply smoke tests validate infrastructure health.

### GitHub Actions IaC Workflow Triggers

| Action              | Trigger                           | Workflow File                          |
|---------------------|-----------------------------------|----------------------------------------|
| Plan (preview)      | `pull_request` on IaC paths      | `.github/workflows/infra-plan.yml`     |
| Apply (provision)   | `push` to `main` on IaC paths    | `.github/workflows/infra-apply.yml`    |
| Destroy (teardown)  | Manual `workflow_dispatch`        | `.github/workflows/infra-destroy.yml`  |

---

## 5. Ephemeral PR Environments

Ephemeral environments are created automatically for each pull request to enable isolated testing and review.

| Configuration Item        | Value                                  |
|---------------------------|----------------------------------------|
| **Trigger**               | PR opened or updated                   |
| **Namespace/Slot**        | `pr-[PR-NUMBER]`                       |
| **Infrastructure**        | Shared AKS cluster, dedicated namespace / shared App Service, new deployment slot |
| **URL Pattern**           | `https://pr-[PR-NUMBER].[BASE-DOMAIN]` |
| **Data**                  | Minimal seed data via init container/script |
| **TTL**                   | Destroyed when PR is closed or merged  |
| **Cost Limit**            | [MONTHLY-BUDGET] per PR environment    |

### Cleanup Automation

- A scheduled GitHub Actions workflow runs [FREQUENCY] to identify and destroy orphaned PR environments.
- Environments older than [MAX-AGE-HOURS] hours with no matching open PR are automatically torn down.

---

## 6. Environment Lifecycle

| Phase              | Dev                        | QA / Test                  | Staging                    | Production                 |
|--------------------|----------------------------|----------------------------|----------------------------|----------------------------|
| **Creation**       | Always running             | Always running             | Always running             | Always running             |
| **Updates**        | Continuous (auto-deploy)   | On test cycle start        | Pre-release                | Release schedule           |
| **Data Reset**     | On-demand                  | Before each test cycle     | [FREQUENCY]                | N/A                        |
| **Teardown**       | Never (persistent)         | Never (persistent)         | Never (persistent)         | Never (persistent)         |

> **Exception:** Ephemeral PR environments follow a create-on-PR-open / destroy-on-PR-close lifecycle.

---

## 7. Cost Management

| Environment        | Monthly Budget (est.)   | Cost Optimization Measures                                      | Alert Threshold       |
|--------------------|-------------------------|-----------------------------------------------------------------|-----------------------|
| **Dev**            | $[AMOUNT]               | B-series VMs; scale to zero outside business hours              | [PERCENTAGE]% of budget |
| **QA / Test**      | $[AMOUNT]               | Spot instances for AKS; paused outside test cycles              | [PERCENTAGE]% of budget |
| **Staging**        | $[AMOUNT]               | Same SKUs as production but fewer replicas; scheduled scale-down | [PERCENTAGE]% of budget |
| **Production**     | $[AMOUNT]               | Reserved instances; auto-scaling; right-sizing reviews          | [PERCENTAGE]% of budget |
| **Ephemeral (PR)** | $[AMOUNT] per PR        | Auto-destroy on PR close; minimal SKUs                          | [AMOUNT] per PR        |

### Cost Optimization Checklist

- [ ] Azure Advisor recommendations reviewed monthly
- [ ] Dev/QA environments scaled down or stopped outside business hours via Azure Automation / GitHub Actions schedule
- [ ] Reserved Instances or Savings Plans purchased for production workloads
- [ ] Unused resources identified and removed (orphaned disks, IPs, etc.)
- [ ] Cost alerts configured in Azure Cost Management for each resource group
- [ ] Ephemeral environments have a hard TTL with automated cleanup

---

## 8. Access Control per Environment

| Environment        | Developer Access           | QA Access                  | Operations Access          | Business Stakeholder Access |
|--------------------|----------------------------|----------------------------|----------------------------|-----------------------------|
| **Dev**            | Full (deploy + debug)      | Read-only                  | Full                       | None                        |
| **QA / Test**      | Read-only (logs, metrics)  | Full (deploy + test)       | Full                       | None                        |
| **Staging**        | Read-only                  | Full (test execution)      | Full (deploy + manage)     | Read-only (UAT)             |
| **Production**     | None (emergency only via PIM) | None                    | Full (via PIM/JIT)         | Read-only (dashboards)      |

### Azure RBAC Roles

| Role                            | Assigned To             | Environments              | Azure Role                              |
|---------------------------------|-------------------------|---------------------------|-----------------------------------------|
| Infrastructure Admin            | [TEAM/GROUP]            | All                       | Owner                                   |
| Application Deployer            | GitHub Actions (OIDC)   | All                       | Contributor (scoped to RG)              |
| Developer                       | [AD-GROUP]              | Dev, QA                   | Reader + Log Analytics Reader           |
| QA Engineer                     | [AD-GROUP]              | QA, Staging               | Reader + App Service Contributor        |
| Operations                      | [AD-GROUP]              | Staging, Production       | Contributor (via PIM activation)        |
| Business Stakeholder            | [AD-GROUP]              | Staging                   | Reader                                  |

### Privileged Identity Management (PIM)

- Production access requires **Azure AD PIM activation** with justification.
- Maximum activation duration: [HOURS] hours.
- Approver: [APPROVER-ROLE/NAME].
- All PIM activations are logged and audited.

---

## 9. Appendix

### Environment URLs Quick Reference

| Environment   | Application URL           | Azure Portal (Resource Group)                                                 |
|---------------|---------------------------|-------------------------------------------------------------------------------|
| Dev           | [DEV-URL]                 | `https://portal.azure.com/#@[TENANT]/resource/subscriptions/[SUB-ID]/resourceGroups/[DEV-RG]` |
| QA            | [QA-URL]                  | `https://portal.azure.com/#@[TENANT]/resource/subscriptions/[SUB-ID]/resourceGroups/[QA-RG]`  |
| Staging       | [STG-URL]                 | `https://portal.azure.com/#@[TENANT]/resource/subscriptions/[SUB-ID]/resourceGroups/[STG-RG]` |
| Production    | [PRD-URL]                 | `https://portal.azure.com/#@[TENANT]/resource/subscriptions/[SUB-ID]/resourceGroups/[PRD-RG]` |

### Related Pages

- [GitHub Actions Overview](./github-actions-overview.md)
- [Release Pipeline](./release-pipeline.md)
- [Test Strategy](../06-testing/test-strategy.md)
