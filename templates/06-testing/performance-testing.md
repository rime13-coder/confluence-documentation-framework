# Performance Testing

| **Page Title**   | Performance Testing                        |
|------------------|--------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                               |
| **Status**       | [Draft / In Review / Approved / Deprecated] |
| **Owner**        | [TEAM OR INDIVIDUAL NAME]                  |

---

## 1. Performance Requirements

| Scenario                         | Target Response Time (P95) | Target Throughput (RPS) | Max Error Rate | Notes                              |
|----------------------------------|----------------------------|--------------------------|----------------|------------------------------------|
| [API-ENDPOINT-1: e.g., GET /orders] | [X] ms                  | [X] RPS                 | < [X]%         | Most frequently called endpoint    |
| [API-ENDPOINT-2: e.g., POST /orders]| [X] ms                  | [X] RPS                 | < [X]%         | Write-heavy; DB insert             |
| [API-ENDPOINT-3: e.g., GET /search] | [X] ms                  | [X] RPS                 | < [X]%         | Complex query; potential bottleneck|
| [BACKGROUND-JOB-1]              | [X] seconds (end-to-end)  | [X] messages/sec         | < [X]%         | Message processing throughput      |
| [USER-JOURNEY-1: e.g., login -> browse -> checkout] | [X] seconds total | N/A          | < [X]%         | End-to-end user experience         |
| [ADD MORE AS NEEDED]            |                            |                          |                |                                    |

### Non-Functional Requirements Reference

- **Source:** [LINK TO NFR DOCUMENT OR CONFLUENCE PAGE]
- **SLA commitment:** [X]% uptime with P99 response time < [X] ms
- **Concurrent users:** System must support [X] concurrent users during peak hours

---

## 2. Load Testing Tools

| Tool                         | Purpose                              | License           | Integration                          |
|------------------------------|--------------------------------------|--------------------|--------------------------------------|
| **k6**                       | Scripted load tests, CI-friendly     | Open source (AGPLv3) | GitHub Actions (`grafana/k6-action@v0.3.1`) |
| **Azure Load Testing**       | Managed load testing at scale        | Azure service      | GitHub Actions (`azure/load-testing@v1`) |
| **JMeter**                   | Complex test scenarios, GUI builder  | Open source (Apache 2.0) | GitHub Actions (headless mode) |
| **Locust**                   | Python-based, distributed testing    | Open source (MIT)  | GitHub Actions + Docker              |
| [CHOSEN-TOOL]                | **Primary tool for this project**    |                    |                                      |

### Tool Selection Rationale

> We use **[CHOSEN-TOOL]** because: [RATIONALE — e.g., developer-friendly scripting, native CI integration, cloud-scale execution, team familiarity].

---

## 3. Test Scenarios

### 3.1 Baseline Load Test

| Attribute          | Value                                                      |
|--------------------|------------------------------------------------------------|
| **Purpose**        | Establish performance baselines under normal expected load  |
| **Virtual users**  | [NUMBER] (representing typical concurrent users)           |
| **Ramp-up**        | [SECONDS] seconds                                          |
| **Steady state**   | [MINUTES] minutes                                          |
| **Ramp-down**      | [SECONDS] seconds                                          |
| **Frequency**      | Every release to Staging                                   |

### 3.2 Stress Test

| Attribute          | Value                                                      |
|--------------------|------------------------------------------------------------|
| **Purpose**        | Find the breaking point — maximum capacity before degradation |
| **Virtual users**  | Ramp from [START] to [MAX] (incrementally)                 |
| **Ramp-up**        | [MINUTES] minutes (gradual increase)                       |
| **Hold at peak**   | [MINUTES] minutes                                          |
| **Frequency**      | Quarterly or before major releases                         |
| **Success criteria**| Identify max RPS before error rate exceeds [X]%           |

### 3.3 Soak (Endurance) Test

| Attribute          | Value                                                      |
|--------------------|------------------------------------------------------------|
| **Purpose**        | Detect memory leaks, connection pool exhaustion, or gradual degradation over time |
| **Virtual users**  | [NUMBER] (moderate, sustained load)                        |
| **Duration**       | [HOURS] hours                                              |
| **Frequency**      | Monthly or before major releases                           |
| **Success criteria**| No increase in response time or error rate over duration; no memory growth |

### 3.4 Spike Test

| Attribute          | Value                                                      |
|--------------------|------------------------------------------------------------|
| **Purpose**        | Validate system behavior under sudden traffic bursts       |
| **Virtual users**  | Jump from [BASELINE] to [SPIKE-PEAK] in [SECONDS] seconds |
| **Spike duration** | [MINUTES] minutes                                          |
| **Recovery period**| [MINUTES] minutes at baseline after spike                  |
| **Frequency**      | Before major launches or marketing events                  |
| **Success criteria**| System recovers to baseline performance within [X] minutes; no data loss |

---

## 4. Test Environment

| Aspect                    | Configuration                                               |
|---------------------------|-------------------------------------------------------------|
| **Environment**           | [Dedicated performance environment / Staging]               |
| **Azure resource sizing** | [MATCH PRODUCTION / SCALED-DOWN: specify details]           |
| **Data volume**           | [X] records in database (representative of production scale)|
| **Data generation**       | [TOOL: e.g., custom seed script, Faker, production snapshot]|
| **External dependencies** | [Stubbed with WireMock / Real integration / Rate-limited]   |
| **Network**               | [Same Azure region as production / Cross-region]            |
| **Load generator location**| [Azure region / GitHub Actions runner / Azure Load Testing managed] |
| **Monitoring**            | [Azure Monitor / Application Insights / Grafana + Prometheus] |

### Environment Isolation

- [ ] Performance tests run in an isolated environment that does not share resources with other test activities.
- [ ] No other teams or automated processes are active during performance test windows.
- [ ] Auto-scaling is configured to match production rules (or disabled, depending on test scenario).

---

## 5. Performance Baselines

> Update this table after each baseline test run. Keep at least the last 3 runs for trend analysis.

| Endpoint / Scenario          | P50 (ms) | P95 (ms) | P99 (ms) | Throughput (RPS) | Error Rate (%) | Date Measured | Version    |
|------------------------------|----------|----------|----------|------------------|----------------|---------------|------------|
| [API-ENDPOINT-1]             | [VALUE]  | [VALUE]  | [VALUE]  | [VALUE]          | [VALUE]        | [YYYY-MM-DD]  | [VERSION]  |
| [API-ENDPOINT-2]             | [VALUE]  | [VALUE]  | [VALUE]  | [VALUE]          | [VALUE]        | [YYYY-MM-DD]  | [VERSION]  |
| [API-ENDPOINT-3]             | [VALUE]  | [VALUE]  | [VALUE]  | [VALUE]          | [VALUE]        | [YYYY-MM-DD]  | [VERSION]  |
| [USER-JOURNEY-1]             | [VALUE]  | [VALUE]  | [VALUE]  | N/A              | [VALUE]        | [YYYY-MM-DD]  | [VERSION]  |
| [ADD MORE AS NEEDED]         |          |          |          |                  |                |               |            |

### Baseline Trend (Historical)

| Endpoint           | v[X.Y.Z] P95 | v[X.Y.Z] P95 | v[X.Y.Z] P95 | Trend      |
|--------------------|---------------|---------------|---------------|------------|
| [API-ENDPOINT-1]   | [VALUE] ms    | [VALUE] ms    | [VALUE] ms    | [IMPROVING/STABLE/DEGRADING] |
| [API-ENDPOINT-2]   | [VALUE] ms    | [VALUE] ms    | [VALUE] ms    | [IMPROVING/STABLE/DEGRADING] |

---

## 6. Performance Test Execution Schedule

| Test Type        | Trigger                                  | Cadence              | Duration         | Executed By          |
|------------------|------------------------------------------|----------------------|------------------|----------------------|
| **Baseline**     | Pre-release (deploy to Staging)          | Every release        | [MINUTES] min    | GitHub Actions (automated) |
| **Stress**       | Manual trigger or scheduled              | Quarterly            | [MINUTES] min    | Performance team     |
| **Soak**         | Manual trigger                           | Monthly              | [HOURS] hours    | Performance team     |
| **Spike**        | Before major launches                    | Ad-hoc               | [MINUTES] min    | Performance team     |

### Automated Performance Gate in CI

For baseline tests integrated into the release pipeline:

```yaml
# Example: k6 performance test step in GitHub Actions
- name: Run k6 baseline load test
  uses: grafana/k6-action@v0.3.1
  with:
    filename: tests/performance/baseline.js
    flags: --out json=results.json
  env:
    K6_TARGET_URL: ${{ vars.STAGING_URL }}

- name: Check performance thresholds
  run: |
    # k6 exits with non-zero if thresholds are breached
    # Thresholds are defined in the k6 script itself
    echo "Performance test completed. Check results.json for details."
```

---

## 7. Performance Regression Detection

| Method                       | Implementation                                              | Action on Regression                     |
|------------------------------|-------------------------------------------------------------|------------------------------------------|
| **Automated threshold check**| k6 thresholds / Azure Load Testing pass/fail criteria       | Block deployment; notify team             |
| **Baseline comparison**      | Compare current run P95 to stored baseline; fail if > [X]% regression | Block deployment; require investigation |
| **Manual review**            | Performance team reviews dashboards before Production deploy | Approve or reject release                 |
| **Continuous monitoring**    | Application Insights alerts on latency/error regression post-deploy | Alert on-call; trigger rollback if severe |

### Threshold Configuration (k6 example)

```javascript
// tests/performance/baseline.js
export const options = {
  stages: [
    { duration: '[RAMP-UP]', target: [VUS] },
    { duration: '[STEADY-STATE]', target: [VUS] },
    { duration: '[RAMP-DOWN]', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<[TARGET-MS]'],   // 95th percentile response time
    http_req_failed: ['rate<[MAX-ERROR-RATE]'],  // Error rate
    http_reqs: ['rate>[MIN-RPS]'],               // Minimum throughput
  },
};
```

---

## 8. Performance Test Results Template

Use this template to document results after each performance test run.

---

### Performance Test Run Report

| Field                    | Value                             |
|--------------------------|-----------------------------------|
| **Test Date**            | [YYYY-MM-DD]                      |
| **Test Type**            | [Baseline / Stress / Soak / Spike]|
| **Application Version**  | [VERSION / COMMIT-SHA]           |
| **Environment**          | [ENVIRONMENT-NAME]                |
| **Duration**             | [MINUTES/HOURS]                   |
| **Virtual Users (peak)** | [NUMBER]                         |
| **Executed By**          | [NAME / AUTOMATED]                |

#### Results Summary

| Endpoint / Scenario     | P50 (ms) | P95 (ms) | P99 (ms) | Max (ms) | RPS   | Error Rate | Pass/Fail |
|-------------------------|----------|----------|----------|----------|-------|------------|-----------|
| [ENDPOINT-1]            | [VALUE]  | [VALUE]  | [VALUE]  | [VALUE]  | [VALUE]| [VALUE]%  | [PASS/FAIL] |
| [ENDPOINT-2]            | [VALUE]  | [VALUE]  | [VALUE]  | [VALUE]  | [VALUE]| [VALUE]%  | [PASS/FAIL] |
| [ADD MORE AS NEEDED]    |          |          |          |          |       |            |           |

#### Observations

- [OBSERVATION-1: e.g., "Database connection pool saturated at 200 VUs"]
- [OBSERVATION-2: e.g., "Cache hit rate dropped to 60% under spike load"]
- [ADD MORE AS NEEDED]

#### Recommendations

- [RECOMMENDATION-1: e.g., "Increase connection pool max size from 50 to 100"]
- [RECOMMENDATION-2: e.g., "Add read replica for search queries"]
- [ADD MORE AS NEEDED]

#### Attachments

- [ ] k6 / JMeter results file: [LINK]
- [ ] Azure Monitor dashboard screenshot: [LINK]
- [ ] Application Insights performance trace: [LINK]

---

## 9. Capacity Planning Inputs

| Metric                         | Current Production | Projected (6 months) | Projected (12 months) | Source               |
|--------------------------------|--------------------|----------------------|-----------------------|----------------------|
| **Peak concurrent users**      | [NUMBER]           | [NUMBER]             | [NUMBER]              | [ANALYTICS-TOOL]     |
| **Peak requests per second**   | [NUMBER]           | [NUMBER]             | [NUMBER]              | [APPLICATION-INSIGHTS]|
| **Database size (GB)**         | [NUMBER]           | [NUMBER]             | [NUMBER]              | [AZURE-METRICS]      |
| **Average payload size (KB)**  | [NUMBER]           | [NUMBER]             | [NUMBER]              | [APM-TOOL]           |
| **Monthly data growth rate**   | [NUMBER]%          | [NUMBER]%            | [NUMBER]%             | [HISTORICAL-DATA]    |

### Scaling Recommendations

| Component                | Current SKU / Config       | Recommended for [X] months | Trigger for Scale-Up         |
|--------------------------|----------------------------|----------------------------|------------------------------|
| AKS node pool            | [CURRENT-SKU] x [COUNT]   | [RECOMMENDED-SKU] x [COUNT]| CPU > [X]% for [Y] min      |
| App Service plan          | [CURRENT-TIER]            | [RECOMMENDED-TIER]         | Memory > [X]% for [Y] min   |
| SQL Database               | [CURRENT-TIER]           | [RECOMMENDED-TIER]         | DTU > [X]% for [Y] min      |
| Redis Cache                | [CURRENT-TIER]           | [RECOMMENDED-TIER]         | Memory > [X]% or evictions   |

---

## 10. Appendix

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Integration Testing](./integration-testing.md)
- [Release Pipeline](../05-cicd-pipeline/release-pipeline.md)
- [Environment Strategy](../05-cicd-pipeline/environment-strategy.md)
