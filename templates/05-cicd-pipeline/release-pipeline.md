# Release Pipeline

| **Page Title**   | Release Pipeline                           |
|------------------|--------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                               |
| **Status**       | [Draft / In Review / Approved / Deprecated] |
| **Owner**        | [TEAM OR INDIVIDUAL NAME]                  |

---

## 1. Release Workflow Diagram

> **[INSERT RELEASE WORKFLOW DIAGRAM HERE]**
>
> Recommended tools: Mermaid, draw.io, or Lucidchart.
> Export as PNG and attach to this Confluence page.
>
> The diagram should show the full promotion path from Dev through Production, including approval gates, smoke tests, and rollback decision points.

---

## 2. Deployment Stages

```
  +---------+     +------------+     +-----------+     +--------------+
  |  Build  | --> |    Dev     | --> |  Staging  | --> |  Production  |
  | (CI)    |     | (auto)     |     | (approval)|     | (approval)   |
  +---------+     +------------+     +-----------+     +--------------+
                       |                   |                  |
                   Smoke Tests         Smoke Tests        Smoke Tests
                                    + Integration       + Synthetic
                                       Tests             Monitoring
```

| Stage           | Trigger                          | Approval Required | Smoke Tests | Additional Validation            |
|-----------------|----------------------------------|-------------------|-------------|----------------------------------|
| **Dev**         | Automatic on successful build    | No                | Yes         | Basic health check               |
| **Staging**     | Manual trigger or scheduled      | Yes — [REVIEWER-LIST] | Yes     | Integration tests, performance baseline |
| **Production**  | Manual trigger after staging sign-off | Yes — [REVIEWER-LIST] | Yes | Synthetic monitoring, canary analysis |

---

## 3. Deployment Strategy by Environment

| Environment   | Strategy         | Description                                                                                      | Rollback Method               |
|---------------|------------------|--------------------------------------------------------------------------------------------------|-------------------------------|
| **Dev**       | **Rolling**      | Replace all instances in-place. Acceptable downtime in Dev.                                      | Redeploy previous artifact    |
| **Staging**   | **Blue-Green**   | Deploy to inactive slot; swap after smoke tests pass. Full rollback by swapping back.            | Swap back to previous slot    |
| **Production**| **Canary**       | Route [X]% of traffic to new version; monitor error rates and latency; gradually increase to 100%. | Route 100% back to old version |

### When to Use Each Strategy

| Strategy       | Best For                                                         | Trade-offs                                          |
|----------------|------------------------------------------------------------------|-----------------------------------------------------|
| **Rolling**    | Non-critical environments, stateless services, speed             | Brief mixed-version state; harder rollback           |
| **Blue-Green** | Zero-downtime requirement, quick rollback, staging validation    | 2x infrastructure cost during deployment             |
| **Canary**     | High-traffic production, risk-sensitive changes, gradual rollout | More complex; requires traffic splitting and metrics |

---

## 4. GitHub Actions Environment Protection Rules

| Environment   | Required Reviewers               | Wait Timer  | Branch Policy             | Custom Rules                     |
|---------------|----------------------------------|-------------|---------------------------|----------------------------------|
| **Dev**       | None                             | 0 min       | `main`, `develop`, `feature/*` | None                        |
| **Staging**   | [REVIEWER-1], [REVIEWER-2]       | [MINUTES] min | `main`, `release/*`     | [CUSTOM-RULE-DESCRIPTION]        |
| **Production**| [REVIEWER-1], [REVIEWER-2], [REVIEWER-3] | [MINUTES] min | `main`, `release/*` | Deployment window: [DAY] [TIME-RANGE] UTC |

### Approval Workflow

1. Deployer triggers the workflow (manual `workflow_dispatch` or automatic promotion).
2. GitHub pauses the job and notifies the required reviewers.
3. Reviewer inspects the change summary (commit diff, linked PR, test results).
4. Reviewer approves or rejects in the GitHub Actions UI.
5. If approved, the deployment proceeds after any configured wait timer.

---

## 5. Azure Deployment Methods

| Target Platform         | Deployment Method                          | Tool / Action                                   | Notes                                           |
|-------------------------|--------------------------------------------|--------------------------------------------------|------------------------------------------------|
| **AKS (Kubernetes)**    | Helm upgrade                               | `azure/k8s-deploy@v5` or `helm upgrade` via CLI | Supports canary with Istio/Linkerd or Flagger  |
| **App Service**         | Deployment slot swap                       | `azure/webapps-deploy@v3` + slot swap            | Deploy to staging slot, swap after smoke test   |
| **Azure Functions**     | Zip deploy to slot                         | `azure/functions-action@v2`                      | Use deployment slots for zero-downtime          |
| **Infrastructure (IaC)**| Terraform apply / Bicep deploy             | `hashicorp/setup-terraform@v3` or `azure/arm-deploy@v2` | Plan in PR, apply on merge to `main`    |
| **Container Registry**  | Docker push to ACR                         | `docker/build-push-action@v6` + `azure/docker-login@v2` | Tag with version + SHA                 |

### Authentication

All Azure deployments authenticate using **OIDC federation** (see [GitHub Actions Overview](./github-actions-overview.md#63-oidc-federation-for-azure-authentication)) via:

```yaml
- name: Azure Login
  uses: azure/login@v2
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

---

## 6. Smoke Tests After Deployment

| Environment   | Smoke Test Type            | Tool                             | Timeout  | Success Criteria                          |
|---------------|----------------------------|----------------------------------|----------|-------------------------------------------|
| **Dev**       | Health endpoint check      | `curl` / `wget` in workflow      | 2 min    | HTTP 200 from `/health`                   |
| **Staging**   | Health + critical path API | [TEST-FRAMEWORK: e.g., Newman/Postman, pytest, k6] | 5 min | All assertions pass; P95 < [X] ms |
| **Production**| Synthetic transaction      | [MONITORING-TOOL: e.g., Azure Application Insights availability tests] | 5 min | Transaction completes; no 5xx errors |

### Smoke Test Failure Behavior

- **Dev:** Log warning; do not block further development.
- **Staging:** Automatically trigger rollback (slot swap back); notify team via [CHANNEL].
- **Production:** Automatically route traffic back to previous version (canary) or swap slot back (blue-green); page on-call.

---

## 7. Rollback Automation

### Automatic Rollback Triggers

| Condition                                      | Detection Method                    | Rollback Action                             |
|------------------------------------------------|-------------------------------------|---------------------------------------------|
| Smoke test failure post-deploy                 | GitHub Actions job failure          | Re-run previous deployment / swap slot back |
| Error rate exceeds [X]% threshold              | Azure Monitor alert -> webhook      | Trigger rollback workflow via `workflow_dispatch` |
| Latency P99 exceeds [X] ms for [Y] minutes    | Azure Monitor alert -> webhook      | Trigger rollback workflow via `workflow_dispatch` |
| Manual decision                                | On-call engineer judgment           | Manual `workflow_dispatch` of rollback workflow |

### Rollback Procedure

1. **AKS:** `helm rollback [RELEASE-NAME] [PREVIOUS-REVISION]` or redeploy previous image tag.
2. **App Service:** Swap deployment slot back to previous version: `az webapp deployment slot swap`.
3. **Azure Functions:** Swap slot back or redeploy previous package.
4. **Infrastructure:** Revert IaC commit and re-apply, or apply previous Terraform state (use with caution).

### Rollback Workflow

A dedicated `rollback.yml` workflow is available for manual invocation:

```yaml
# .github/workflows/rollback.yml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options: [dev, staging, production]
      version:
        description: 'Version to roll back to (e.g., 1.3.1 or image tag)'
        required: true
        type: string
      reason:
        description: 'Reason for rollback'
        required: true
        type: string
```

---

## 8. Release Tagging and Versioning

### Versioning Scheme

We follow **Semantic Versioning (SemVer)**: `MAJOR.MINOR.PATCH`

| Component  | When to Increment                                       | Example          |
|------------|---------------------------------------------------------|------------------|
| **MAJOR**  | Breaking changes to public API or contracts             | `2.0.0`          |
| **MINOR**  | New features, backward-compatible                       | `1.4.0`          |
| **PATCH**  | Bug fixes, backward-compatible                          | `1.4.2`          |

### Pre-release Tags

| Tag Format             | Purpose                        | Example           |
|------------------------|--------------------------------|--------------------|
| `vX.Y.Z-alpha.N`      | Early development builds       | `v1.5.0-alpha.1`  |
| `vX.Y.Z-beta.N`       | Feature-complete, in testing   | `v1.5.0-beta.3`   |
| `vX.Y.Z-rc.N`         | Release candidate              | `v1.5.0-rc.1`     |

### Tagging Process

1. Version is determined automatically using [VERSIONING-TOOL: e.g., GitVersion, semantic-release, Nerdbank.GitVersioning].
2. On merge to `main`, the release workflow creates a Git tag: `v[MAJOR].[MINOR].[PATCH]`.
3. A GitHub Release is created with auto-generated release notes.
4. Container images are tagged with both the SemVer version and the Git SHA.

---

## 9. Deployment Notifications

| Event                          | Channel                        | Message Content                                              |
|--------------------------------|--------------------------------|--------------------------------------------------------------|
| Deployment started             | [SLACK-CHANNEL / TEAMS-CHANNEL] | Environment, version, deployer, link to workflow run        |
| Deployment succeeded           | [SLACK-CHANNEL / TEAMS-CHANNEL] | Environment, version, duration, smoke test results          |
| Deployment failed              | [SLACK-CHANNEL / TEAMS-CHANNEL] | Environment, version, failure step, link to logs            |
| Rollback triggered             | [SLACK-CHANNEL / TEAMS-CHANNEL] + [PAGERDUTY/OPSGENIE] | Environment, rolled-back-from, rolled-back-to, reason |
| Production release published   | [EMAIL-DL / TEAMS-CHANNEL]    | Release notes, version, changelog link                       |

---

## 10. Example Multi-Stage Deployment Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  workflow_run:
    workflows: ["Build & Test"]
    types: [completed]
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options: [dev, staging, production]

permissions:
  id-token: write
  contents: read

jobs:
  # ── Deploy to Dev ──────────────────────────────────────────
  deploy-dev:
    name: Deploy to Dev
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' || github.event.inputs.environment == 'dev' }}
    environment:
      name: dev
      url: ${{ vars.APP_URL }}
    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: [ARTIFACT-NAME]-${{ github.sha }}

      - name: Azure Login (OIDC)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deploy to Azure App Service (Dev)
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ vars.APP_SERVICE_NAME }}
          slot-name: staging
          package: .

      - name: Smoke Test
        run: |
          for i in {1..10}; do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${{ vars.APP_URL }}/health")
            if [ "$STATUS" = "200" ]; then echo "Health check passed"; exit 0; fi
            sleep 5
          done
          echo "Health check failed"; exit 1

  # ── Deploy to Staging ──────────────────────────────────────
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: deploy-dev
    environment:
      name: staging
      url: ${{ vars.APP_URL }}
    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: [ARTIFACT-NAME]-${{ github.sha }}

      - name: Azure Login (OIDC)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deploy to Staging Slot
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ vars.APP_SERVICE_NAME }}
          slot-name: staging
          package: .

      - name: Run Smoke & Integration Tests
        run: |
          [TEST-COMMAND]   # e.g., npx newman run tests/postman/smoke.json --env-var "baseUrl=${{ vars.APP_URL }}"

      - name: Swap Staging Slot to Production Slot
        run: |
          az webapp deployment slot swap \
            --resource-group ${{ vars.AZURE_RESOURCE_GROUP }} \
            --name ${{ vars.APP_SERVICE_NAME }} \
            --slot staging \
            --target-slot production

  # ── Deploy to Production ───────────────────────────────────
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      url: ${{ vars.APP_URL }}
    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: [ARTIFACT-NAME]-${{ github.sha }}

      - name: Azure Login (OIDC)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Deploy to Production Slot (Canary)
        uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ vars.APP_SERVICE_NAME }}
          slot-name: canary
          package: .

      - name: Configure Traffic Split (10% canary)
        run: |
          az webapp traffic-routing set \
            --resource-group ${{ vars.AZURE_RESOURCE_GROUP }} \
            --name ${{ vars.APP_SERVICE_NAME }} \
            --distribution canary=10

      - name: Monitor Canary (wait and check metrics)
        run: |
          echo "Monitoring canary for [MINUTES] minutes..."
          sleep [SECONDS]
          # [INSERT-METRIC-CHECK-SCRIPT: query Azure Monitor for error rates and latency]

      - name: Promote Canary to 100%
        run: |
          az webapp deployment slot swap \
            --resource-group ${{ vars.AZURE_RESOURCE_GROUP }} \
            --name ${{ vars.APP_SERVICE_NAME }} \
            --slot canary \
            --target-slot production

      - name: Post-Deployment Smoke Test
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${{ vars.APP_URL }}/health")
          if [ "$STATUS" != "200" ]; then echo "Production smoke test failed!"; exit 1; fi

      - name: Notify Success
        if: success()
        run: |
          # [NOTIFICATION-COMMAND: e.g., post to Slack/Teams webhook]
          echo "Deployment to production succeeded: version [VERSION]"

      - name: Notify Failure & Trigger Rollback
        if: failure()
        run: |
          # [NOTIFICATION-COMMAND]
          echo "Deployment to production failed — initiating rollback"
          # [ROLLBACK-COMMAND: e.g., az webapp deployment slot swap back]
```

> **Note:** Replace all `[PLACEHOLDER]` values with project-specific settings. For AKS deployments, substitute the App Service steps with Helm upgrade commands.

---

## 11. Appendix

### Related Pages

- [GitHub Actions Overview](./github-actions-overview.md)
- [Build Pipeline](./build-pipeline.md)
- [Environment Strategy](./environment-strategy.md)
- [UAT Sign-Off](../06-testing/uat-signoff.md)
