# Post-Deployment Verification

| **Metadata**     | **Value**                              |
|------------------|----------------------------------------|
| Page Title       | Post-Deployment Verification           |
| Last Updated     | [YYYY-MM-DD]                           |
| Status           | [Draft / In Review / Approved]         |
| Owner            | [TEAM OR INDIVIDUAL NAME]              |

---

## 1. Document Purpose

This document defines the post-deployment verification process for the [PROJECT NAME] platform. It provides structured checklists and criteria for validating that a deployment to any environment is successful -- covering smoke tests, health checks, monitoring, performance, functional verification, security, data integrity, and integration validation. Completing this process is required before a deployment is declared successful.

---

## 2. Verification Process Overview

### 2.1 Verification Timeline

| Phase                          | Timing After Deployment     | Duration     | Responsible         |
|--------------------------------|-----------------------------|--------------|---------------------|
| Phase 1: Smoke Tests           | Immediately (T+0)          | 5-10 minutes | [On-Call / SRE]     |
| Phase 2: Health Checks         | T+5 minutes                | 5 minutes    | [On-Call / SRE]     |
| Phase 3: Monitoring Validation | T+10 minutes               | 10 minutes   | [SRE]               |
| Phase 4: Functional Verification | T+15 minutes             | 15-30 minutes| [QA / Engineers]    |
| Phase 5: Performance Comparison| T+30 minutes               | 15 minutes   | [SRE]               |
| Phase 6: Security Verification | T+30 minutes               | 10 minutes   | [SRE / Security]    |
| Phase 7: Data Verification     | T+30 minutes               | 10 minutes   | [DBA / Engineers]   |
| Phase 8: Integration Verification | T+30 minutes            | 15 minutes   | [Engineers]         |
| Phase 9: Final Sign-Off        | T+60 minutes (minimum)    | 5 minutes    | [Release Manager]   |

### 2.2 Verification Decision Flow

```
All Phase 1-3 checks pass?
  NO  -> INITIATE ROLLBACK (see Rollback Procedures)
  YES -> Continue

Phase 4-8 checks pass?
  NO  -> Assess severity:
         Critical failure -> ROLLBACK
         Minor issue -> LOG ISSUE, continue with known issue noted
  YES -> Continue

Monitoring stable for 60+ minutes?
  NO  -> Extend monitoring period, escalate if degrading
  YES -> DECLARE DEPLOYMENT SUCCESSFUL
```

---

## 3. Phase 1: Smoke Test Checklist

Smoke tests verify that the most critical user paths are functional immediately after deployment.

### 3.1 Automated Smoke Tests

| Test                                      | Endpoint / Flow                             | Expected Result          | Timeout | Status       |
|-------------------------------------------|---------------------------------------------|--------------------------|---------|--------------|
| Application loads                         | `GET /`                                     | HTTP 200, page renders   | 10s     | [ ] Pass/Fail |
| Health check passes                       | `GET /health`                               | HTTP 200, `"healthy"`    | 5s      | [ ] Pass/Fail |
| Readiness check passes                    | `GET /health/ready`                         | HTTP 200, all deps up    | 10s     | [ ] Pass/Fail |
| User login                                | `POST /api/auth/login`                      | HTTP 200, token returned | 10s     | [ ] Pass/Fail |
| API basic CRUD                            | `GET /api/v2/[RESOURCE]`                    | HTTP 200, data returned  | 10s     | [ ] Pass/Fail |
| Static assets load                        | `GET /static/main.js`                       | HTTP 200, content valid  | 5s      | [ ] Pass/Fail |
| [CRITICAL PATH TEST]                      | [ENDPOINT / FLOW]                           | [EXPECTED RESULT]        | [XXs]   | [ ] Pass/Fail |

### 3.2 Manual Smoke Tests (if automated not available)

| # | Test                                          | Steps                                               | Expected Result             | Status       |
|---|-----------------------------------------------|------------------------------------------------------|-----------------------------|--------------|
| 1 | Navigate to application URL                   | Open browser, go to `https://[APP_URL]`              | Page loads without errors   | [ ] Pass/Fail |
| 2 | Log in with test account                      | Enter test credentials, submit                       | Dashboard loads             | [ ] Pass/Fail |
| 3 | Perform core business action                  | [DESCRIBE THE ACTION, e.g., create an order]         | Action succeeds             | [ ] Pass/Fail |
| 4 | Verify data display                           | [DESCRIBE WHAT TO CHECK, e.g., order history loads]  | Data is current and correct | [ ] Pass/Fail |
| 5 | [TEST DESCRIPTION]                            | [STEPS]                                              | [EXPECTED]                  | [ ] Pass/Fail |

### Smoke Test Execution

| Attribute                  | Value                                              |
|----------------------------|----------------------------------------------------|
| Smoke Test Tool            | [Postman / Newman / Custom script / Cypress]       |
| Execution Command          | `[COMMAND TO RUN SMOKE TESTS]`                     |
| Test Suite Location        | [https://github.com/ORG/REPO/tests/smoke]          |
| Expected Duration          | [5-10 minutes]                                     |
| Pass Criteria              | [All tests pass. Any failure triggers rollback assessment.] |

---

## 4. Phase 2: Health Check Verification

### 4.1 Service Health Endpoints

| Service                  | Health Endpoint                                | Expected Response                                  | Status       |
|--------------------------|------------------------------------------------|----------------------------------------------------|--------------|
| Web Application          | `https://[APP_URL]/health`                     | `{"status":"healthy","version":"[VERSION]"}`       | [ ] Pass/Fail |
| API (AKS)                | `https://[API_URL]/health`                     | `{"status":"healthy","version":"[VERSION]"}`       | [ ] Pass/Fail |
| API Readiness            | `https://[API_URL]/health/ready`               | `{"status":"ready","db":"ok","cache":"ok","queue":"ok"}` | [ ] Pass/Fail |
| Azure Functions          | `https://[FUNC_URL]/api/health`                | `{"status":"healthy"}`                             | [ ] Pass/Fail |
| Legacy Service (VM)      | `http://[VM_INTERNAL_IP]:[PORT]/health`        | `{"status":"ok"}`                                  | [ ] Pass/Fail |
| [SERVICE]                | [ENDPOINT]                                     | [EXPECTED RESPONSE]                                | [ ] Pass/Fail |

### 4.2 Azure Resource Health

| Resource                      | Check Method                                    | Expected State       | Status       |
|-------------------------------|------------------------------------------------|----------------------|--------------|
| AKS Cluster                   | Azure Portal > Resource Health                 | Available            | [ ] Pass/Fail |
| App Service                   | Azure Portal > Resource Health                 | Available            | [ ] Pass/Fail |
| Azure Functions               | Azure Portal > Resource Health                 | Available            | [ ] Pass/Fail |
| SQL Database                  | Azure Portal > Resource Health                 | Available            | [ ] Pass/Fail |
| Redis Cache                   | Azure Portal > Resource Health                 | Available            | [ ] Pass/Fail |
| Service Bus                   | Azure Portal > Resource Health                 | Available            | [ ] Pass/Fail |
| [RESOURCE]                    | [CHECK METHOD]                                 | [EXPECTED STATE]     | [ ] Pass/Fail |

### 4.3 AKS-Specific Health Checks

| Check                             | Command                                                          | Expected Result                | Status       |
|-----------------------------------|------------------------------------------------------------------|--------------------------------|--------------|
| All pods running                  | `kubectl get pods -n [NAMESPACE] -l app=[APP]`                  | All pods STATUS=Running        | [ ] Pass/Fail |
| No pod restarts                   | `kubectl get pods -n [NAMESPACE]` -- check RESTARTS column      | RESTARTS = 0 (for new pods)   | [ ] Pass/Fail |
| Correct image version             | `kubectl get pods -n [NS] -o jsonpath='{.items[*].spec.containers[*].image}'` | Image tag = [VERSION]  | [ ] Pass/Fail |
| Kubernetes events clean           | `kubectl get events -n [NAMESPACE] --sort-by='.lastTimestamp'`  | No Warning/Error events        | [ ] Pass/Fail |
| Ingress responding                | `kubectl get ingress -n [NAMESPACE]`                            | ADDRESS populated              | [ ] Pass/Fail |
| HPA working (if applicable)       | `kubectl get hpa -n [NAMESPACE]`                                | TARGETS show current metrics   | [ ] Pass/Fail |

---

## 5. Phase 3: Monitoring Verification

### 5.1 Metrics Flowing

| Metric Source              | Check                                                  | Expected                                | Status       |
|----------------------------|--------------------------------------------------------|-----------------------------------------|--------------|
| Application Insights       | Live Metrics stream is active                          | Requests, dependencies, exceptions visible | [ ] Pass/Fail |
| Azure Monitor              | Metrics blade shows current data for all resources     | No gaps in last 10 minutes              | [ ] Pass/Fail |
| Log Analytics              | Recent logs ingested from all expected sources         | Logs from last 5 minutes visible        | [ ] Pass/Fail |
| Grafana Dashboards         | All panels loading with current data                   | No "No Data" panels                     | [ ] Pass/Fail |
| Custom Metrics             | Application custom metrics being emitted               | Custom metrics visible in App Insights  | [ ] Pass/Fail |

### 5.2 Alert Rules Active

| Verification                              | Method                                            | Expected                     | Status       |
|-------------------------------------------|---------------------------------------------------|------------------------------|--------------|
| Alert rules are enabled                   | Azure Monitor > Alerts > Alert rules              | All production rules enabled | [ ] Pass/Fail |
| No active alerts firing                   | Azure Monitor > Alerts > Summary                  | No unexpected fired alerts   | [ ] Pass/Fail |
| Availability tests running                | Application Insights > Availability               | Tests passing from all locations | [ ] Pass/Fail |

### 5.3 Dashboard Spot-Check

| Dashboard                      | URL                                            | What to Check                              | Status       |
|--------------------------------|------------------------------------------------|--------------------------------------------|--------------|
| System Health Overview         | [GRAFANA URL]                                  | All panels green / within thresholds       | [ ] Pass/Fail |
| Application Performance        | [APP INSIGHTS URL]                             | Request rate, error rate, response time OK | [ ] Pass/Fail |
| AKS Cluster Health             | [GRAFANA URL]                                  | Node/pod health, resource utilization OK   | [ ] Pass/Fail |
| [DASHBOARD]                    | [URL]                                          | [WHAT TO CHECK]                            | [ ] Pass/Fail |

---

## 6. Phase 4: Functional Verification

### 6.1 Key Business Flows

| # | Business Flow                         | Test Steps                                                    | Expected Result                         | Priority   | Status       |
|---|---------------------------------------|---------------------------------------------------------------|-----------------------------------------|------------|--------------|
| 1 | User Registration                     | Register new account with test email                          | Account created, confirmation email sent | [P1]       | [ ] Pass/Fail |
| 2 | User Login / Authentication           | Log in with valid credentials                                 | Dashboard loads, session created         | [P1]       | [ ] Pass/Fail |
| 3 | [Core Business Action 1]             | [DESCRIBE STEPS]                                              | [EXPECTED RESULT]                       | [P1]       | [ ] Pass/Fail |
| 4 | [Core Business Action 2]             | [DESCRIBE STEPS]                                              | [EXPECTED RESULT]                       | [P1]       | [ ] Pass/Fail |
| 5 | Search Functionality                  | Search for known item                                         | Results returned correctly               | [P2]       | [ ] Pass/Fail |
| 6 | Report / Export Generation            | Generate a standard report                                    | Report downloads successfully            | [P2]       | [ ] Pass/Fail |
| 7 | Email / Notification Delivery        | Trigger a notification event                                  | Email/notification received              | [P2]       | [ ] Pass/Fail |
| 8 | Background Job Processing            | Trigger or wait for scheduled job                             | Job completes successfully               | [P2]       | [ ] Pass/Fail |
| 9 | [BUSINESS FLOW]                      | [STEPS]                                                       | [EXPECTED]                              | [PRIORITY] | [ ] Pass/Fail |

### 6.2 Regression Test Suite (if applicable)

| Attribute                  | Value                                              |
|----------------------------|----------------------------------------------------|
| Test Suite Tool            | [Selenium / Cypress / Playwright / Postman]        |
| Execution Command          | `[COMMAND TO RUN REGRESSION TESTS]`                |
| Test Suite Location        | [https://github.com/ORG/REPO/tests/regression]    |
| Expected Duration          | [15-30 minutes]                                    |
| Pass Criteria              | [>95% pass rate, all P1 tests pass]               |
| Results Dashboard          | [URL TO TEST RESULTS]                              |

---

## 7. Phase 5: Performance Baseline Comparison

### 7.1 Pre vs. Post Deployment Metrics

| Metric                          | Source              | Pre-Deployment Baseline | Post-Deployment Value | Acceptable Variance | Status       |
|---------------------------------|---------------------|-------------------------|-----------------------|---------------------|--------------|
| Request Rate (req/s)            | App Insights        | [XXX req/s]             | [XXX req/s]           | [+/- 20%]           | [ ] Pass/Fail |
| Response Time P50 (ms)          | App Insights        | [XXX ms]                | [XXX ms]              | [+/- 20%]           | [ ] Pass/Fail |
| Response Time P95 (ms)          | App Insights        | [XXX ms]                | [XXX ms]              | [+/- 30%]           | [ ] Pass/Fail |
| Response Time P99 (ms)          | App Insights        | [XXX ms]                | [XXX ms]              | [+/- 50%]           | [ ] Pass/Fail |
| Error Rate (%)                  | App Insights        | [X.XX%]                 | [X.XX%]               | [No increase]       | [ ] Pass/Fail |
| CPU Utilization (%)             | Azure Monitor       | [XX%]                   | [XX%]                 | [+/- 15%]           | [ ] Pass/Fail |
| Memory Utilization (%)          | Azure Monitor       | [XX%]                   | [XX%]                 | [+/- 15%]           | [ ] Pass/Fail |
| SQL DTU/vCore Utilization (%)   | Azure Monitor       | [XX%]                   | [XX%]                 | [+/- 20%]           | [ ] Pass/Fail |
| Redis Cache Hit Rate (%)        | Azure Monitor       | [XX%]                   | [XX%]                 | [No decrease >5%]   | [ ] Pass/Fail |
| Service Bus Queue Length         | Azure Monitor       | [XXX messages]          | [XXX messages]        | [No growing backlog]| [ ] Pass/Fail |

### 7.2 Performance Comparison Method

```kql
// Compare response times: 1 hour before vs 1 hour after deployment
let deployTime = datetime([YYYY-MM-DDTHH:MM:SSZ]);
let preStart = deployTime - 1h;
let postStart = deployTime + 15m;  // Allow 15 min warm-up
let postEnd = postStart + 1h;
requests
| where timestamp between (preStart .. deployTime) or timestamp between (postStart .. postEnd)
| extend Period = iff(timestamp < deployTime, "Pre-Deploy", "Post-Deploy")
| summarize
    count(),
    avg(duration),
    percentile(duration, 50),
    percentile(duration, 95),
    percentile(duration, 99),
    countif(toint(resultCode) >= 500)
    by Period
```

---

## 8. Phase 6: Security Verification

| # | Check                                         | Method                                                  | Expected Result                    | Status       |
|---|-----------------------------------------------|---------------------------------------------------------|------------------------------------|--------------|
| 1 | SSL/TLS certificate valid                     | `curl -vI https://[APP_URL] 2>&1 \| grep "expire"`     | Not expired, >30 days remaining   | [ ] Pass/Fail |
| 2 | TLS version >= 1.2                            | `nmap --script ssl-enum-ciphers -p 443 [DOMAIN]`       | Only TLS 1.2+ accepted            | [ ] Pass/Fail |
| 3 | WAF active and in Prevention mode             | Azure Portal > Application Gateway > WAF                | WAF mode = Prevention              | [ ] Pass/Fail |
| 4 | HTTPS redirect working                        | `curl -I http://[APP_URL]`                              | 301 redirect to HTTPS              | [ ] Pass/Fail |
| 5 | Security headers present                      | `curl -I https://[APP_URL]`                             | X-Frame-Options, CSP, HSTS present| [ ] Pass/Fail |
| 6 | Private endpoints active                      | Azure Portal > Private Endpoint connections              | All endpoints in Approved state   | [ ] Pass/Fail |
| 7 | Key Vault accessible                          | Application can read secrets at startup                  | Secrets retrieved successfully     | [ ] Pass/Fail |
| 8 | Managed Identity working                      | Check App Insights for auth failures to Azure services  | No managed identity failures       | [ ] Pass/Fail |
| 9 | No public access to databases                 | Verify SQL firewall rules / private endpoint only       | No public IP access                | [ ] Pass/Fail |
| 10| [SECURITY CHECK]                              | [METHOD]                                                | [EXPECTED RESULT]                  | [ ] Pass/Fail |

---

## 9. Phase 7: Data Verification

| # | Check                                         | Method                                                    | Expected Result                  | Status       |
|---|-----------------------------------------------|-----------------------------------------------------------|----------------------------------|--------------|
| 1 | Database migrations applied successfully      | Check migration history table                             | Latest migration ID matches expected | [ ] Pass/Fail |
| 2 | No pending migrations                         | `dotnet ef migrations list` or migration tool check       | All migrations applied           | [ ] Pass/Fail |
| 3 | Database schema matches expected state         | Run schema comparison or spot-check key tables            | Schema matches version           | [ ] Pass/Fail |
| 4 | Data integrity check                          | Run validation queries for key data relationships         | No orphaned records, FK valid    | [ ] Pass/Fail |
| 5 | Seed data / reference data present            | Query reference data tables                               | Required reference data exists   | [ ] Pass/Fail |
| 6 | Backfill jobs completed (if applicable)       | Check backfill job status                                 | Job completed successfully       | [ ] Pass/Fail |
| 7 | Storage account accessible                    | Upload/download test blob                                 | Operations succeed               | [ ] Pass/Fail |
| 8 | Redis cache populated (if pre-warmed)         | Check cache key count / hit rate                          | Cache warming complete           | [ ] Pass/Fail |
| 9 | [DATA CHECK]                                  | [METHOD]                                                  | [EXPECTED]                       | [ ] Pass/Fail |

---

## 10. Phase 8: Integration Verification

| # | Integration                          | Verification Method                                     | Expected Result                         | Status       |
|---|--------------------------------------|---------------------------------------------------------|-----------------------------------------|--------------|
| 1 | [Payment Provider API]               | Process test transaction in sandbox/live                | Transaction succeeds                     | [ ] Pass/Fail |
| 2 | [Email Service Provider]             | Trigger test email, verify delivery                     | Email received within 60 seconds         | [ ] Pass/Fail |
| 3 | [SSO / Identity Provider]            | Perform SSO login flow                                  | SSO authentication succeeds              | [ ] Pass/Fail |
| 4 | [CDN / Static Assets]                | Verify static assets served from CDN                    | Assets load from CDN endpoint            | [ ] Pass/Fail |
| 5 | [Service Bus / Queue Consumer]       | Publish test message, verify consumption                | Message consumed and processed           | [ ] Pass/Fail |
| 6 | [Third-Party API]                    | Call dependent API endpoint                             | Successful response received             | [ ] Pass/Fail |
| 7 | [Internal Microservice Dependency]   | Call internal service health endpoint                   | Service healthy and responding           | [ ] Pass/Fail |
| 8 | [Webhook Endpoints]                  | Trigger test webhook event                              | Webhook received and processed           | [ ] Pass/Fail |
| 9 | [INTEGRATION]                        | [METHOD]                                                | [EXPECTED]                               | [ ] Pass/Fail |

---

## 11. Phase 9: Final Sign-Off

### 11.1 Sign-Off Table

| Verifier           | Area                        | Status         | Notes                        | Timestamp        |
|--------------------|-----------------------------|----------------|------------------------------|------------------|
| [NAME]             | Smoke Tests (Phase 1)       | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| [NAME]             | Health Checks (Phase 2)     | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| [NAME]             | Monitoring (Phase 3)        | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| [NAME]             | Functional (Phase 4)        | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| [NAME]             | Performance (Phase 5)       | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| [NAME]             | Security (Phase 6)          | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| [NAME]             | Data (Phase 7)              | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| [NAME]             | Integrations (Phase 8)      | [Pass / Fail]  | [NOTES OR "All clear"]       | [YYYY-MM-DD HH:MM UTC] |
| **[RELEASE MGR]**  | **OVERALL SIGN-OFF**        | **[Pass/Fail]** | **[FINAL NOTES]**           | **[TIMESTAMP]**  |

### 11.2 Criteria for Declaring Deployment Successful

All of the following must be true:

- [ ] All Phase 1 (Smoke Test) checks pass
- [ ] All Phase 2 (Health Check) endpoints return healthy
- [ ] Phase 3 (Monitoring) confirms metrics and logs flowing normally
- [ ] All P1 functional tests pass (Phase 4); any P2 failures have documented workarounds
- [ ] Phase 5 (Performance) metrics are within acceptable variance of baseline
- [ ] Phase 6 (Security) verifications pass -- no new vulnerabilities introduced
- [ ] Phase 7 (Data) migrations applied, integrity checks pass
- [ ] Phase 8 (Integration) downstream systems responding correctly
- [ ] No new critical or major alerts firing for at least 60 minutes post-deployment
- [ ] Release Manager has provided final sign-off

### 11.3 Deployment Declaration

| Attribute              | Value                                          |
|------------------------|------------------------------------------------|
| Deployment Status      | [SUCCESSFUL / FAILED / ROLLED BACK]            |
| Deployment Version     | [VERSION NUMBER]                               |
| Declared At            | [YYYY-MM-DD HH:MM UTC]                        |
| Declared By            | [RELEASE MANAGER NAME]                         |
| Known Issues (if any)  | [LIST OR "None"]                               |
| Monitoring Extension   | [Extended monitoring for XX hours if needed]   |

---

## 12. Appendix: Verification Scripts

### Quick Verification Script (All Health Checks)

```bash
#!/bin/bash
# Post-deployment health check script
# Usage: ./verify-deployment.sh [ENVIRONMENT]

ENVIRONMENT=${1:-production}
FAILED=0

echo "=== Post-Deployment Verification: $ENVIRONMENT ==="

# Health checks
echo "--- Health Checks ---"
endpoints=(
  "https://[APP_URL]/health"
  "https://[API_URL]/health"
  "https://[API_URL]/health/ready"
  "https://[FUNC_URL]/api/health"
)

for url in "${endpoints[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
  if [ "$status" = "200" ]; then
    echo "PASS: $url (HTTP $status)"
  else
    echo "FAIL: $url (HTTP $status)"
    FAILED=$((FAILED + 1))
  fi
done

# Version check
echo "--- Version Check ---"
version=$(curl -s "https://[API_URL]/health" | jq -r '.version')
echo "Deployed version: $version"
echo "Expected version: [EXPECTED_VERSION]"

# Summary
echo "=== Summary ==="
if [ $FAILED -eq 0 ]; then
  echo "ALL CHECKS PASSED"
else
  echo "FAILED CHECKS: $FAILED"
  echo "ACTION REQUIRED: Review failed checks and consider rollback"
fi

exit $FAILED
```

---

## 13. Revision History

| Date           | Author            | Changes Made                              |
|----------------|-------------------|-------------------------------------------|
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [Initial document creation]               |
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [DESCRIPTION OF CHANGES]                  |
