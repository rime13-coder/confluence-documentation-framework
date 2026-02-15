# Post-Deployment Verification

| **Metadata**     | **Value**                              |
|------------------|----------------------------------------|
| Page Title       | Post-Deployment Verification           |
| Last Updated     | 2026-02-14                             |
| Status           | Draft                                  |
| Owner            | IntelliSec Solutions                   |

---

## 1. Document Purpose

This document defines the post-deployment verification process for the CMMC Assessor Platform. It provides structured checklists and criteria for validating that a deployment to production is successful -- covering smoke tests, health checks, monitoring, functional verification, and security checks. The current verification process is mostly manual and informal. This document establishes a target process.

**Current State:** Post-deployment verification is informal and ad-hoc. There are no automated smoke tests, no Application Insights to verify performance baselines, and no formal sign-off process. Verification typically consists of manually checking the health endpoint and loading the frontend.

---

## 2. Verification Process Overview

### 2.1 Verification Timeline

| Phase                          | Timing After Deployment     | Duration     | Responsible         |
|--------------------------------|-----------------------------|--------------|---------------------|
| Phase 1: Smoke Tests           | Immediately (T+0)          | 2-5 minutes  | Deploying engineer  |
| Phase 2: Health Checks         | T+2 minutes                | 2 minutes    | Deploying engineer  |
| Phase 3: Monitoring Validation | T+5 minutes                | 5 minutes    | Deploying engineer  |
| Phase 4: Functional Verification | T+10 minutes             | 10 minutes   | Deploying engineer  |
| Phase 5: Final Sign-Off        | T+30 minutes (minimum)    | 2 minutes    | Deploying engineer  |

> **Note:** Phases 5-8 from the template (Performance Comparison, Security Verification, Data Verification, Integration Verification) are NOT IMPLEMENTED due to lack of APM tooling and automated test suites.

### 2.2 Verification Decision Flow

```
Phases 1-2 checks pass?
  NO  -> INITIATE ROLLBACK (see Rollback Procedures)
  YES -> Continue

Phase 3-4 checks pass?
  NO  -> Assess severity:
         Critical failure -> ROLLBACK
         Minor issue -> LOG ISSUE, continue with known issue noted
  YES -> Continue

No new errors in Log Analytics for 30+ minutes?
  NO  -> Investigate, extend monitoring period
  YES -> DECLARE DEPLOYMENT SUCCESSFUL
```

---

## 3. Phase 1: Smoke Test Checklist

Smoke tests verify that the most critical paths are functional immediately after deployment.

### 3.1 Manual Smoke Tests

| # | Test                                          | Steps                                               | Expected Result             | Status       |
|---|-----------------------------------------------|------------------------------------------------------|-----------------------------|--------------|
| 1 | API health endpoint responds                  | `curl -s https://api.cmmc.intellisecops.com/api/health` | HTTP 200, JSON with status | [ ] Pass/Fail |
| 2 | Frontend loads                                | Open browser: `https://cmmc.intellisecops.com`       | Page loads without errors   | [ ] Pass/Fail |
| 3 | Frontend can reach API                        | Open browser dev tools, check network requests       | API calls return 200        | [ ] Pass/Fail |
| 4 | User login works                              | Log in with test credentials                         | Dashboard loads             | [ ] Pass/Fail |
| 5 | Basic navigation works                        | Navigate to assessments page                          | Page renders with data      | [ ] Pass/Fail |

### 3.2 Automated Smoke Tests

**Status: NOT IMPLEMENTED** -- No automated smoke test suite exists.

| Attribute                  | Value                                              |
|----------------------------|----------------------------------------------------|
| Smoke Test Tool            | NOT IMPLEMENTED                                    |
| Execution Command          | N/A                                                |
| Expected Duration          | N/A                                                |
| Pass Criteria              | N/A                                                |

### Planned Improvements

- Create a Postman collection or shell script for automated smoke tests
- Run smoke tests automatically as part of the CD pipeline
- Include API endpoint tests for key routes (login, assessments, reports)

---

## 4. Phase 2: Health Check Verification

### 4.1 Service Health Endpoints

| Service                  | Health Endpoint                                        | Expected Response                      | Status       |
|--------------------------|--------------------------------------------------------|----------------------------------------|--------------|
| Backend API (cmmc-api)   | `https://api.cmmc.intellisecops.com/api/health`        | HTTP 200, JSON with health status      | [ ] Pass/Fail |
| Frontend (cmmc-web)      | `https://cmmc.intellisecops.com`                       | HTTP 200, HTML page renders            | [ ] Pass/Fail |

> **Note:** The health endpoint currently returns configuration information (F-38). The response should be verified for HTTP 200 status, but the content should not be relied upon for version verification until F-38 is remediated.

### 4.2 Azure Resource Health

| Resource                      | Check Method                                    | Expected State       | Status       |
|-------------------------------|------------------------------------------------|----------------------|--------------|
| cmmc-api (Container App)      | Azure Portal > Container Apps > cmmc-api       | Running              | [ ] Pass/Fail |
| cmmc-web (Container App)      | Azure Portal > Container Apps > cmmc-web       | Running              | [ ] Pass/Fail |
| psql-cmmc-assessor-prod       | Azure Portal > PostgreSQL > Overview           | Available            | [ ] Pass/Fail |
| kv-cmmc-assessor-prod         | Azure Portal > Key Vault > Overview            | Available            | [ ] Pass/Fail |

### 4.3 Container App Revision Checks

| Check                             | Command                                                          | Expected Result                | Status       |
|-----------------------------------|------------------------------------------------------------------|--------------------------------|--------------|
| Active revision running           | `az containerapp revision list --name cmmc-api --resource-group rg-cmmc-assessor-prod -o table` | Latest revision active, running | [ ] Pass/Fail |
| Correct image deployed            | `az containerapp show --name cmmc-api --resource-group rg-cmmc-assessor-prod --query "properties.template.containers[0].image"` | Expected image tag | [ ] Pass/Fail |
| No revision failures              | Check Azure Portal > Container App > Revisions                  | No failed revisions            | [ ] Pass/Fail |

---

## 5. Phase 3: Monitoring Verification

### 5.1 Log Analytics Check

| Check                              | Method                                                  | Expected                                | Status       |
|------------------------------------|---------------------------------------------------------|-----------------------------------------|--------------|
| Container App logs flowing         | Log Analytics query: `ContainerAppConsoleLogs_CL \| where TimeGenerated > ago(5m) \| take 10` | Recent log entries visible | [ ] Pass/Fail |
| No error spikes                    | `ContainerAppConsoleLogs_CL \| where TimeGenerated > ago(10m) \| where Log_s contains "error" \| count` | Error count within baseline | [ ] Pass/Fail |
| System logs clean                  | `ContainerAppSystemLogs_CL \| where TimeGenerated > ago(10m) \| where Type_s == "Error" \| count` | No system errors | [ ] Pass/Fail |

### 5.2 Azure Monitor Quick Check

| Check                              | Method                                            | Expected                     | Status       |
|------------------------------------|----------------------------------------------------|------------------------------|--------------|
| Container App CPU normal           | Azure Portal > cmmc-api > Metrics > CPU            | Within baseline range        | [ ] Pass/Fail |
| Container App memory normal        | Azure Portal > cmmc-api > Metrics > Memory         | Within baseline range        | [ ] Pass/Fail |
| PostgreSQL connections normal      | Azure Portal > PostgreSQL > Metrics > Connections   | Within baseline range        | [ ] Pass/Fail |

> **Note:** Application Insights is NOT IMPLEMENTED. There is no application-level telemetry to compare pre vs. post deployment metrics. Verification is limited to platform metrics and manual checks.

---

## 6. Phase 4: Functional Verification

### 6.1 Key Business Flows

| # | Business Flow                         | Test Steps                                                    | Expected Result                         | Priority   | Status       |
|---|---------------------------------------|---------------------------------------------------------------|-----------------------------------------|------------|--------------|
| 1 | User Login                            | Log in with valid test credentials                            | Dashboard loads, session created         | P1         | [ ] Pass/Fail |
| 2 | View Assessments List                 | Navigate to assessments page                                   | Assessments list renders with data      | P1         | [ ] Pass/Fail |
| 3 | Create/Open Assessment                | Create a new assessment or open existing                       | Assessment form/view loads              | P1         | [ ] Pass/Fail |
| 4 | Save Assessment Data                  | Make a change to an assessment and save                        | Data saves successfully, confirmation shown | P1     | [ ] Pass/Fail |
| 5 | Generate Report                       | Generate a compliance report for an assessment                 | Report generates and downloads          | P2         | [ ] Pass/Fail |
| 6 | User Logout                           | Log out of the application                                     | Redirected to login page                 | P2         | [ ] Pass/Fail |

### 6.2 Regression Test Suite

**Status: NOT IMPLEMENTED** -- No automated regression test suite exists.

| Attribute                  | Value                                              |
|----------------------------|----------------------------------------------------|
| Test Suite Tool            | NOT IMPLEMENTED                                    |
| Execution Command          | N/A                                                |
| Expected Duration          | N/A                                                |
| Pass Criteria              | N/A                                                |

### Planned Improvements

- Create automated end-to-end tests using Playwright or Cypress
- Run regression tests as part of the CD pipeline before production deployment
- Define pass criteria (100% P1 tests pass, >95% overall)

---

## 7. Phase 5: Performance Baseline Comparison

**Status: NOT IMPLEMENTED** -- No Application Insights or APM is deployed. Performance baseline comparison is not possible.

> **Current State:** Performance can only be observed through Azure Monitor platform metrics (CPU, memory) and manual response time checks. There is no automated comparison of pre vs. post deployment metrics.

### Manual Performance Check

| Check                          | Method                                          | Expected                     | Status       |
|--------------------------------|-------------------------------------------------|------------------------------|--------------|
| API response time feels normal | Manually test key endpoints                     | Responses feel comparable    | [ ] Pass/Fail |
| Frontend load time normal      | Load frontend in browser                        | Page loads in <5 seconds     | [ ] Pass/Fail |

### Planned Improvements

- Deploy Application Insights to enable request-level metrics
- Create a pre vs. post deployment comparison KQL query
- Define acceptable performance variance thresholds

---

## 8. Phase 6: Security Verification

| # | Check                                         | Method                                                  | Expected Result                    | Status       |
|---|-----------------------------------------------|---------------------------------------------------------|------------------------------------|--------------|
| 1 | HTTPS working on frontend                     | `curl -I https://cmmc.intellisecops.com`                | HTTP 200, HTTPS connection valid   | [ ] Pass/Fail |
| 2 | HTTPS working on API                           | `curl -I https://api.cmmc.intellisecops.com`            | HTTP 200, HTTPS connection valid   | [ ] Pass/Fail |
| 3 | TLS certificate valid                          | Browser check or `curl -vI https://cmmc.intellisecops.com 2>&1 \| grep "expire"` | Not expired | [ ] Pass/Fail |
| 4 | Key Vault accessible by application            | Health endpoint returns successfully (secrets loaded)   | Health check passes                | [ ] Pass/Fail |

> **Note:** WAF verification, private endpoint verification, and managed identity checks are N/A because these features are NOT IMPLEMENTED.

---

## 9. Phase 7: Data Verification

| # | Check                                         | Method                                                    | Expected Result                  | Status       |
|---|-----------------------------------------------|-----------------------------------------------------------|----------------------------------|--------------|
| 1 | Prisma migrations applied successfully        | Application starts without migration errors (check logs)  | No migration errors in logs      | [ ] Pass/Fail |
| 2 | Database connectivity confirmed               | Health endpoint returns successfully                       | Health check passes              | [ ] Pass/Fail |
| 3 | Existing data accessible                      | Load an existing assessment in the UI                      | Data displays correctly          | [ ] Pass/Fail |

---

## 10. Phase 8: Final Sign-Off

### 10.1 Sign-Off Table

| Verifier           | Area                        | Status         | Notes                        | Timestamp              |
|--------------------|-----------------------------|----------------|------------------------------|------------------------|
| [NAME]             | Smoke Tests (Phase 1)       | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| [NAME]             | Health Checks (Phase 2)     | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| [NAME]             | Monitoring (Phase 3)        | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| [NAME]             | Functional (Phase 4)        | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| [NAME]             | Security (Phase 6)          | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| [NAME]             | Data (Phase 7)              | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| **[ENGINEER]**     | **OVERALL SIGN-OFF**        | **[Pass/Fail]** | **[FINAL NOTES]**           | **[TIMESTAMP]**        |

> **Note:** Currently only the deploying engineer performs verification. There is no separate QA or SRE sign-off.

### 10.2 Criteria for Declaring Deployment Successful

All of the following must be true:

- [ ] API health check endpoint returns 200 OK
- [ ] Frontend loads successfully in browser
- [ ] User login works
- [ ] Container App revisions are active and running
- [ ] No new error spikes in Log Analytics
- [ ] Prisma migrations applied without errors
- [ ] Core assessment workflow functional (at least view and save)
- [ ] No new critical errors for at least 30 minutes post-deployment

### 10.3 Deployment Declaration

| Attribute              | Value                                          |
|------------------------|------------------------------------------------|
| Deployment Status      | [SUCCESSFUL / FAILED / ROLLED BACK]            |
| Deployment Version     | [IMAGE TAG or COMMIT SHA]                      |
| Declared At            | [YYYY-MM-DD HH:MM UTC]                        |
| Declared By            | [ENGINEER NAME]                                |
| Known Issues (if any)  | [LIST OR "None"]                               |
| Monitoring Extension   | [Extended monitoring if any concerns noted]    |

---

## 11. Appendix: Quick Verification Script

```bash
#!/bin/bash
# Post-deployment verification script for CMMC Assessor Platform
# Usage: ./verify-deployment.sh

FAILED=0

echo "=== CMMC Assessor Platform Post-Deployment Verification ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Health checks
echo "--- Health Checks ---"
endpoints=(
  "https://api.cmmc.intellisecops.com/api/health"
  "https://cmmc.intellisecops.com"
)

for url in "${endpoints[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 15)
  if [ "$status" = "200" ]; then
    echo "PASS: $url (HTTP $status)"
  else
    echo "FAIL: $url (HTTP $status)"
    FAILED=$((FAILED + 1))
  fi
done

# TLS check
echo ""
echo "--- TLS Check ---"
tls_status=$(curl -s -o /dev/null -w "%{ssl_verify_result}" "https://api.cmmc.intellisecops.com" --max-time 10)
if [ "$tls_status" = "0" ]; then
  echo "PASS: TLS certificate valid"
else
  echo "FAIL: TLS certificate issue (verify result: $tls_status)"
  FAILED=$((FAILED + 1))
fi

# Container App revision check
echo ""
echo "--- Container App Revisions ---"
echo "Backend API:"
az containerapp revision list --name cmmc-api --resource-group rg-cmmc-assessor-prod --query "[0].{name:name, active:properties.active, running:properties.runningState}" -o table 2>/dev/null || echo "WARN: Could not check Container App revision (az CLI not configured)"
echo ""
echo "Frontend:"
az containerapp revision list --name cmmc-web --resource-group rg-cmmc-assessor-prod --query "[0].{name:name, active:properties.active, running:properties.runningState}" -o table 2>/dev/null || echo "WARN: Could not check Container App revision (az CLI not configured)"

# Summary
echo ""
echo "=== Summary ==="
if [ $FAILED -eq 0 ]; then
  echo "ALL CHECKS PASSED"
  echo "Deployment can be declared SUCCESSFUL"
else
  echo "FAILED CHECKS: $FAILED"
  echo "ACTION REQUIRED: Review failed checks and consider rollback"
  echo "See: rollback-procedures.md for rollback instructions"
fi

exit $FAILED
```

---

## 12. Revision History

| Date           | Author               | Changes Made                              |
|----------------|-----------------------|-------------------------------------------|
| 2026-02-14     | IntelliSec Solutions  | Initial document creation                 |
