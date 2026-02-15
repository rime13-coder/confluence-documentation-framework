# Performance Testing

| **Page Title**   | Performance Testing                        |
|------------------|--------------------------------------------|
| **Last Updated** | 2026-02-14                                 |
| **Status**       | Draft                                      |
| **Owner**        | IntelliSecOps Development Team             |

---

## 1. Current State

Performance testing for the CMMC Assessor Platform is **not yet implemented**. No load tests, stress tests, or performance baselines have been established. This document defines the planned approach, tooling, and performance requirements.

### What Needs to Be Done

1. Define performance requirements and SLAs for key API endpoints.
2. Select and configure a load testing tool (k6 recommended).
3. Write baseline load test scripts.
4. Establish a performance testing environment (staging, once available).
5. Integrate baseline performance tests into the release pipeline.

---

## 2. Performance Requirements (Planned)

| Scenario                                   | Target Response Time (P95) | Target Throughput (RPS) | Max Error Rate | Notes                              |
|--------------------------------------------|----------------------------|--------------------------|----------------|------------------------------------|
| `GET /api/assessments` (list assessments)  | 500 ms                     | 50 RPS                  | < 1%           | Most frequently called endpoint; paginated |
| `POST /api/assessments` (create assessment)| 1000 ms                    | 20 RPS                  | < 1%           | Write operation; database insert   |
| `GET /api/assessments/:id` (single assessment) | 300 ms                 | 100 RPS                 | < 1%           | Single record lookup               |
| `PUT /api/assessments/:id/controls` (update controls) | 800 ms          | 30 RPS                  | < 1%           | Bulk update of CMMC control statuses |
| `GET /api/assessments/:id/report` (generate report)  | 3000 ms          | 10 RPS                  | < 2%           | Complex aggregation; potentially heavy |
| `POST /api/auth/login` (authentication)    | 500 ms                     | 50 RPS                  | < 1%           | Entra ID token validation          |
| Frontend static assets (Nginx)             | 100 ms                     | 200 RPS                 | < 0.1%         | Served from Nginx; should be very fast |

### Non-Functional Requirements Reference

- **SLA commitment:** 99.5% uptime with P99 response time < 3000 ms for API endpoints
- **Concurrent users:** System must support 50 concurrent users during peak hours (CMMC assessors conducting simultaneous assessments)
- **Note:** These requirements are preliminary estimates and should be refined based on actual usage patterns once the platform is in production.

---

## 3. Load Testing Tools (Planned)

| Tool                         | Purpose                              | License           | Integration                          |
|------------------------------|--------------------------------------|--------------------|--------------------------------------|
| **k6** (recommended)        | Scripted load tests, CI-friendly     | Open source (AGPLv3) | GitHub Actions (`grafana/k6-action@v0.3.1`) |
| **Azure Load Testing**      | Managed load testing at scale        | Azure service      | GitHub Actions (`azure/load-testing@v1`) |

### Tool Selection Rationale

> We recommend **k6** because: it is developer-friendly (tests written in JavaScript), has native CI integration via GitHub Actions, supports both local and cloud execution, and the team already uses JavaScript/TypeScript. Azure Load Testing is available as a managed alternative for large-scale tests.

---

## 4. Test Scenarios (Planned)

### 4.1 Baseline Load Test

| Attribute          | Value                                                      |
|--------------------|------------------------------------------------------------|
| **Purpose**        | Establish performance baselines under normal expected load  |
| **Virtual users**  | 25 (representing typical concurrent CMMC assessors)        |
| **Ramp-up**        | 30 seconds                                                 |
| **Steady state**   | 5 minutes                                                  |
| **Ramp-down**      | 15 seconds                                                 |
| **Frequency**      | Every release to Staging (once staging exists)             |

### 4.2 Stress Test

| Attribute          | Value                                                      |
|--------------------|------------------------------------------------------------|
| **Purpose**        | Find the breaking point -- maximum capacity before degradation |
| **Virtual users**  | Ramp from 10 to 200 (incrementally)                        |
| **Ramp-up**        | 10 minutes (gradual increase)                              |
| **Hold at peak**   | 5 minutes                                                  |
| **Frequency**      | Quarterly or before major releases                         |
| **Success criteria**| Identify max RPS before error rate exceeds 5%             |

### 4.3 Soak (Endurance) Test

| Attribute          | Value                                                      |
|--------------------|------------------------------------------------------------|
| **Purpose**        | Detect memory leaks, connection pool exhaustion, or gradual degradation over time |
| **Virtual users**  | 25 (moderate, sustained load)                              |
| **Duration**       | 2 hours                                                    |
| **Frequency**      | Monthly or before major releases                           |
| **Success criteria**| No increase in response time or error rate over duration; no memory growth in Container Apps |

### 4.4 Spike Test

| Attribute          | Value                                                      |
|--------------------|------------------------------------------------------------|
| **Purpose**        | Validate system behavior under sudden traffic bursts (e.g., multiple assessors starting at the same time) |
| **Virtual users**  | Jump from 10 to 100 in 10 seconds                         |
| **Spike duration** | 3 minutes                                                  |
| **Recovery period**| 3 minutes at baseline after spike                          |
| **Frequency**      | Before major launches                                      |
| **Success criteria**| System recovers to baseline performance within 2 minutes; no data loss |

---

## 5. Test Environment (Planned)

| Aspect                    | Configuration                                               |
|---------------------------|-------------------------------------------------------------|
| **Environment**           | Staging (once provisioned) or dedicated performance environment |
| **Azure resource sizing** | Match production: Backend 0.5 CPU / 1Gi, Frontend 0.25 CPU / 0.5Gi |
| **Database**              | PostgreSQL Flexible Server (B1ms, 32GB) -- same as production |
| **Data volume**           | Representative dataset with synthetic CMMC assessments (50-100 assessments, 1000+ control mappings) |
| **Data generation**       | Custom seed script using Prisma + faker.js                  |
| **External dependencies** | Entra ID auth stubbed or bypassed for load tests            |
| **Network**               | Same Azure region as production (Canada Central)            |
| **Load generator location**| GitHub Actions runner or Azure Load Testing managed infra  |
| **Monitoring**            | Azure Monitor / Log Analytics (same as production)          |
| **Scaling**               | Same as production: 0-3 replicas, HTTP concurrency trigger  |

### Environment Isolation (Planned)

- [ ] Performance tests run in an isolated staging environment that does not share resources with production.
- [ ] No other teams or automated processes are active during performance test windows.
- [ ] Auto-scaling is configured to match production rules.

---

## 6. Performance Baselines

> No baseline data is available yet. This table will be populated after the first performance test run.

| Endpoint / Scenario          | P50 (ms) | P95 (ms) | P99 (ms) | Throughput (RPS) | Error Rate (%) | Date Measured | Version    |
|------------------------------|----------|----------|----------|------------------|----------------|---------------|------------|
| `GET /api/assessments`       | TBD      | TBD      | TBD      | TBD              | TBD            | TBD           | TBD        |
| `POST /api/assessments`      | TBD      | TBD      | TBD      | TBD              | TBD            | TBD           | TBD        |
| `GET /api/assessments/:id`   | TBD      | TBD      | TBD      | TBD              | TBD            | TBD           | TBD        |
| `PUT /api/assessments/:id/controls` | TBD | TBD   | TBD      | TBD              | TBD            | TBD           | TBD        |
| `GET /api/assessments/:id/report` | TBD  | TBD      | TBD      | TBD              | TBD            | TBD           | TBD        |

---

## 7. Performance Test Execution Schedule (Planned)

| Test Type        | Trigger                                  | Cadence              | Duration         | Executed By          |
|------------------|------------------------------------------|----------------------|------------------|----------------------|
| **Baseline**     | Pre-release (deploy to Staging)          | Every release        | 6 min            | GitHub Actions (automated) |
| **Stress**       | Manual trigger                           | Quarterly            | 15 min           | DevOps team          |
| **Soak**         | Manual trigger                           | Monthly              | 2 hours          | DevOps team          |
| **Spike**        | Before major launches                    | Ad-hoc               | 10 min           | DevOps team          |

### Automated Performance Gate in CI (Planned)

```javascript
// tests/performance/baseline.js (k6 script -- planned)
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 25 },    // ramp up to 25 VUs
    { duration: '5m', target: 25 },     // steady state
    { duration: '15s', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],    // 95th percentile < 500ms
    http_req_failed: ['rate<0.01'],      // Error rate < 1%
    http_reqs: ['rate>10'],              // Minimum 10 RPS throughput
  },
};

export default function () {
  const baseUrl = __ENV.K6_TARGET_URL || 'https://api.cmmc.intellisecops.com';

  const assessmentsRes = http.get(`${baseUrl}/api/assessments`, {
    headers: { Authorization: `Bearer ${__ENV.TEST_TOKEN}` },
  });

  check(assessmentsRes, {
    'GET /api/assessments returns 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### Planned GitHub Actions Integration

```yaml
# Planned step in release pipeline:
- name: Run k6 baseline load test
  uses: grafana/k6-action@v0.3.1
  with:
    filename: tests/performance/baseline.js
    flags: --out json=results.json
  env:
    K6_TARGET_URL: ${{ vars.STAGING_URL }}
    TEST_TOKEN: ${{ secrets.PERF_TEST_TOKEN }}

- name: Check performance thresholds
  run: |
    # k6 exits with non-zero if thresholds are breached
    echo "Performance test completed. Check results.json for details."
```

---

## 8. Performance Regression Detection (Planned)

| Method                       | Implementation                                              | Action on Regression                     |
|------------------------------|-------------------------------------------------------------|------------------------------------------|
| **Automated threshold check**| k6 thresholds defined in test script                        | Block deployment; notify team             |
| **Baseline comparison**      | Compare current run P95 to stored baseline; fail if > 20% regression | Block deployment; require investigation |
| **Manual review**            | Team reviews Azure Monitor dashboards before Production deploy | Approve or reject release               |
| **Continuous monitoring**    | Azure Monitor alerts on latency/error regression post-deploy | Alert on-call; trigger rollback if severe |

---

## 9. Performance Test Results Template

Use this template to document results after each performance test run.

---

### Performance Test Run Report

| Field                    | Value                             |
|--------------------------|-----------------------------------|
| **Test Date**            | TBD                               |
| **Test Type**            | Baseline / Stress / Soak / Spike  |
| **Application Version**  | TBD                              |
| **Environment**          | Staging (once available)          |
| **Duration**             | TBD                               |
| **Virtual Users (peak)** | TBD                              |
| **Executed By**          | TBD                               |

#### Results Summary

> No test results available yet. This section will be populated after the first performance test run.

#### Observations

- No performance tests have been conducted yet.

#### Recommendations

- Establish staging environment to enable performance testing.
- Implement baseline k6 scripts for critical API endpoints.
- Configure Azure Monitor alerts for latency and error rate thresholds.

---

## 10. Capacity Planning Inputs

| Metric                         | Current Production   | Projected (6 months) | Projected (12 months) | Source               |
|--------------------------------|----------------------|----------------------|-----------------------|----------------------|
| **Peak concurrent users**      | ~5-10 (early stage)  | ~25                  | ~50                   | Business projections |
| **Peak requests per second**   | TBD                  | ~50 RPS              | ~100 RPS              | Estimated            |
| **Database size (GB)**         | < 1 GB               | ~2 GB                | ~5 GB                 | Estimated            |

### Scaling Recommendations

| Component                | Current SKU / Config                | Recommended (6 months)              | Trigger for Scale-Up         |
|--------------------------|-------------------------------------|-------------------------------------|------------------------------|
| Backend Container App    | 0.5 CPU, 1Gi, 0-3 replicas         | Same (adequate for projected load)  | CPU > 80% for 5 min         |
| Frontend Container App   | 0.25 CPU, 0.5Gi, 0-3 replicas      | Same (adequate for static serving)  | CPU > 80% for 5 min         |
| PostgreSQL Flexible Server| B1ms, 32GB storage                 | B2s if queries slow (evaluate after baselines) | DTU > 80% for 5 min |

---

## 11. Appendix

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Integration Testing](./integration-testing.md)
- [Release Pipeline](../05-cicd-pipeline/release-pipeline.md)
- [Environment Strategy](../05-cicd-pipeline/environment-strategy.md)
