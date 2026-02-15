# Performance Testing

| **Page Title**   | Performance Testing -- M365 Security Assessment Automation |
|------------------|-------------------------------------------------------------|
| **Last Updated** | 2026-02-15                                                  |
| **Status**       | IN PROGRESS                                                 |
| **Owner**        | IntelliSecOps Development Team                              |

---

## 1. Current State

Performance testing for the M365-SecurityAssessment module is **informal**. No formal performance benchmarks, load tests, or stress tests have been established. Developers observe execution times during manual testing but do not systematically record or track them.

This document defines the key performance considerations, observed baselines, known bottlenecks, and optimization strategies specific to a PowerShell-based M365 assessment tool.

### What Needs to Be Done

1. Establish formal timing baselines for each assessment module against tenants of known sizes.
2. Document Graph API rate limiting behavior and validate retry logic.
3. Measure report generation times for each output format.
4. Test pagination handling with large tenant datasets (1000+ objects).
5. Profile SQLite query performance for the controls database.

---

## 2. Key Performance Considerations

Unlike a traditional web application, the M365-SecurityAssessment module is a client-side PowerShell tool that interacts with cloud APIs. Performance concerns center on API interaction efficiency, data processing for large tenants, and report generation.

| Consideration                         | Why It Matters                                                         |
|---------------------------------------|------------------------------------------------------------------------|
| **Large tenant handling**             | Tenants with 1000+ users, devices, or policies require pagination; incomplete data leads to missed findings |
| **Graph API rate limiting**           | Microsoft enforces per-app and per-tenant throttling; aggressive API calls trigger HTTP 429 responses |
| **Assessment duration**               | Long-running assessments risk timeout, session expiry, or user abandonment |
| **Report generation**                 | HTML, PDF, and DOCX report generation for large finding sets can be slow |
| **SQLite query performance**          | Controls database with hundreds of findings must support fast lookups   |
| **Exchange Online connection overhead** | Establishing EXO sessions is significantly slower than Graph API calls |

---

## 3. API Configuration and Rate Limiting

### Current Configuration

The module uses the following default API parameters, configurable via `config.json`:

| Parameter              | Default Value | Purpose                                                    |
|------------------------|---------------|------------------------------------------------------------|
| **retryCount**         | 3             | Number of retry attempts after a throttled (429) or transient error |
| **retryDelaySeconds**  | 2             | Initial delay between retries (doubles on each retry: 2s, 4s, 8s) |
| **pageSize**           | 999           | Number of records per Graph API page (`$top` parameter)    |
| **connectionTimeout**  | 30            | Seconds to wait for initial API connection                  |

### Rate Limiting Behavior

| Scenario                            | HTTP Status | Module Behavior                                      |
|-------------------------------------|-------------|------------------------------------------------------|
| Normal operation                    | 200         | Process response; continue to next page if paginated |
| Throttled by Graph API              | 429         | Wait `Retry-After` header value (or `retryDelaySeconds` default); retry up to `retryCount` times |
| Transient server error              | 500, 502, 503 | Retry with exponential backoff; fail after `retryCount` attempts |
| Authentication failure              | 401         | Do not retry; raise error immediately                 |
| Insufficient permissions            | 403         | Do not retry; log warning and skip data collection for that endpoint |

### Pagination Handling

```
Page 1: GET /users?$top=999
  -> 999 results + @odata.nextLink
Page 2: GET /users?$top=999&$skiptoken=...
  -> 999 results + @odata.nextLink
Page 3: GET /users?$top=999&$skiptoken=...
  -> 150 results (no nextLink = last page)
Total: 2,148 users collected
```

| Endpoint Category                    | Typical Page Count (1000-user tenant) | Typical Page Count (5000-user tenant) |
|--------------------------------------|---------------------------------------|---------------------------------------|
| `/users`                             | 1-2 pages                            | 5-6 pages                            |
| `/deviceManagement/managedDevices`   | 1-3 pages                            | 5-10 pages                           |
| `/identity/conditionalAccess/policies` | 1 page (typically < 50 policies)   | 1 page                               |
| `/groups`                            | 1-5 pages                            | 5-20 pages                           |

---

## 4. Performance Baselines by Module

> **Note:** These baselines are approximate observations from manual testing. Formal benchmarks have not been established. Times will vary based on tenant size, network latency, and API throttling.

| Module                     | Typical Duration (Small Tenant, < 500 users) | Typical Duration (Medium Tenant, 500-2000 users) | Typical Duration (Large Tenant, 2000+ users) | Primary Bottleneck                    |
|----------------------------|----------------------------------------------|--------------------------------------------------|----------------------------------------------|---------------------------------------|
| **Tenant Connection**      | 15-30 sec                                    | 15-30 sec                                       | 15-30 sec                                   | Exchange Online module load           |
| **EntraID**                | 1-3 min                                      | 3-8 min                                         | 8-20 min                                    | Per-user role/group membership queries|
| **DeviceManagement**       | 30 sec - 2 min                               | 2-5 min                                         | 5-15 min                                    | Device compliance evaluation          |
| **EmailProtection**        | 1-2 min                                      | 1-3 min                                         | 2-5 min                                     | DNS lookups + EXO policy retrieval    |
| **TeamsSharePoint**        | 30 sec - 1 min                               | 1-2 min                                         | 2-5 min                                     | SharePoint site enumeration           |
| **Report Generation (HTML)** | 5-15 sec                                   | 10-30 sec                                       | 30 sec - 2 min                               | Finding table rendering               |
| **Report Generation (PDF)** | 15-45 sec                                   | 30 sec - 1 min                                  | 1-3 min                                     | Edge browser HTML-to-PDF conversion   |
| **Report Generation (DOCX)** | 10-30 sec                                  | 20 sec - 1 min                                  | 1-2 min                                     | DOCX template population              |
| **Full Assessment (all modules)** | 5-10 min                              | 10-25 min                                       | 25-60 min                                   | Cumulative API calls                  |

---

## 5. Known Bottlenecks

### 5.1 Per-Role Admin Queries (EntraID Module)

| Aspect                       | Details                                                               |
|------------------------------|-----------------------------------------------------------------------|
| **Description**              | Checking administrative role assignments requires a separate Graph API call per role, then per user within each role |
| **Impact**                   | Tenants with many admin roles and role members can generate hundreds of API calls |
| **Observed behavior**        | EntraID module accounts for 40-60% of total assessment time           |
| **Mitigation (current)**     | None; queries are sequential                                          |
| **Mitigation (planned)**     | Batch Graph API requests using `$batch` endpoint; cache role membership results |

### 5.2 Exchange Online Connection Time

| Aspect                       | Details                                                               |
|------------------------------|-----------------------------------------------------------------------|
| **Description**              | Establishing an Exchange Online PowerShell session takes 15-30 seconds due to module download and implicit remoting setup |
| **Impact**                   | Connection overhead is incurred even for tenants with minimal email configuration |
| **Observed behavior**        | Fixed overhead; does not scale with tenant size                       |
| **Mitigation (current)**     | Session is established once and reused for all EmailProtection checks |
| **Mitigation (planned)**     | Pre-connect in background while other modules run (parallel execution) |

### 5.3 Edge PDF Rendering

| Aspect                       | Details                                                               |
|------------------------------|-----------------------------------------------------------------------|
| **Description**              | PDF generation invokes Microsoft Edge in headless mode to convert HTML to PDF |
| **Impact**                   | Adds 15-60 seconds to report generation; requires Edge installed      |
| **Observed behavior**        | Slower on first invocation (Edge cold start); faster on subsequent runs |
| **Mitigation (current)**     | HTML report is primary format; PDF is optional                        |
| **Mitigation (planned)**     | Evaluate alternative PDF libraries (e.g., PSWritePDF) to remove Edge dependency |

### 5.4 SQLite Controls Database Operations

| Aspect                       | Details                                                               |
|------------------------------|-----------------------------------------------------------------------|
| **Description**              | Each finding write triggers a JSON sync operation (full database export to JSON) |
| **Impact**                   | For assessments generating 50+ findings, cumulative JSON sync time is noticeable |
| **Observed behavior**        | Each sync takes 50-200ms; 87 findings x 100ms avg = ~9 seconds total |
| **Mitigation (current)**     | JSON sync is immediate but lightweight for typical finding counts     |
| **Mitigation (planned)**     | Batch finding inserts with single JSON sync at end of each module     |

---

## 6. Performance Test Scenarios

### 6.1 Pagination Stress Test

| Attribute               | Value                                                              |
|-------------------------|--------------------------------------------------------------------|
| **Purpose**             | Verify the tool correctly handles pagination for large result sets |
| **Target**              | Test tenant with 2000+ users, 1000+ devices, 500+ groups          |
| **Success criteria**    | All objects collected; no data loss; no API errors after retries   |
| **Measurement**         | Total collection time; number of API calls; any 429 responses      |
| **Frequency**           | Before each major release                                          |

### 6.2 Rate Limit Recovery Test

| Attribute               | Value                                                              |
|-------------------------|--------------------------------------------------------------------|
| **Purpose**             | Verify retry logic correctly handles Graph API throttling          |
| **Method**              | Run assessment against a tenant while simultaneously generating API load to trigger throttling |
| **Success criteria**    | Tool retries throttled requests; assessment completes successfully; no data loss |
| **Measurement**         | Number of 429 responses; total retry count; additional time from retries |
| **Frequency**           | Quarterly                                                          |

### 6.3 Full Assessment Duration Benchmark

| Attribute               | Value                                                              |
|-------------------------|--------------------------------------------------------------------|
| **Purpose**             | Establish baseline assessment duration for different tenant sizes  |
| **Tenant sizes**        | Small (< 500 users), Medium (500-2000), Large (2000+)             |
| **Success criteria**    | Assessment completes within expected time range (see baselines table) |
| **Measurement**         | Total duration; per-module duration; API call count                |
| **Frequency**           | Before each release; results recorded in performance log           |

### 6.4 Report Generation Benchmark

| Attribute               | Value                                                              |
|-------------------------|--------------------------------------------------------------------|
| **Purpose**             | Measure report generation time for each output format              |
| **Input data**          | Assessment with 20 findings, 50 findings, 100 findings            |
| **Formats tested**      | HTML, PDF, DOCX                                                    |
| **Success criteria**    | All formats generate without errors; times within expected range   |
| **Measurement**         | Generation time per format; output file size                       |
| **Frequency**           | Before each release                                                |

---

## 7. Performance Test Results Template

Use this template to document results after each performance measurement.

| Field                      | Value                              |
|----------------------------|------------------------------------|
| **Test Date**              |                                    |
| **Module Version**         | M365-SecurityAssessment v1.0.0     |
| **Tenant Size**            | Users: ___ / Devices: ___ / Groups: ___ |
| **Tester**                 |                                    |
| **PowerShell Version**     |                                    |
| **Network Conditions**     |                                    |

### Per-Module Timing

| Module                     | Duration    | API Calls | 429 Responses | Findings Generated | Notes |
|----------------------------|-------------|-----------|---------------|---------------------|-------|
| Tenant Connection          |             |           | N/A           | N/A                 |       |
| EntraID                    |             |           |               |                     |       |
| DeviceManagement           |             |           |               |                     |       |
| EmailProtection            |             |           |               |                     |       |
| TeamsSharePoint            |             |           |               |                     |       |
| Report (HTML)              |             | N/A       | N/A           | N/A                 |       |
| Report (PDF)               |             | N/A       | N/A           | N/A                 |       |
| Report (DOCX)              |             | N/A       | N/A           | N/A                 |       |
| **Total**                  |             |           |               |                     |       |

---

## 8. Optimization Strategies

### Current Optimizations

| Strategy                                | Status       | Impact                                        |
|-----------------------------------------|--------------|-----------------------------------------------|
| Reuse Exchange Online session           | Implemented  | Saves 15-30 sec per additional EXO operation  |
| Graph API `$top=999` page size          | Implemented  | Minimizes number of pagination requests        |
| Exponential backoff on 429              | Implemented  | Prevents aggressive retry storms               |
| Checkpoint after each module            | Implemented  | Avoids re-running completed modules on resume  |

### Planned Optimizations

| Strategy                                | Priority | Expected Impact                                | Complexity |
|-----------------------------------------|----------|------------------------------------------------|------------|
| **Collector caching**                   | High     | Avoid redundant API calls when multiple checks need the same data | Medium |
| **Batch Graph API calls ($batch)**      | High     | Reduce per-role admin queries from N calls to N/20 calls | Medium |
| **Parallel module execution**           | Medium   | Run independent modules simultaneously (e.g., EntraID + EmailProtection) | High |
| **Deferred JSON sync**                  | Medium   | Batch finding inserts; sync JSON once per module instead of per finding | Low |
| **Background EXO connection**           | Low      | Start Exchange Online session while Graph API modules run | Medium |
| **Incremental assessment mode**         | Low      | Only re-check configurations that changed since last assessment | High |

---

## 9. Capacity Planning

### Tenant Size Impact Matrix

| Tenant Size Category | Users    | Devices  | Expected Assessment Duration | API Calls (approx) | Notes                                   |
|----------------------|----------|----------|------------------------------|---------------------|-----------------------------------------|
| **Small**            | < 500    | < 200    | 5-10 minutes                 | 50-150              | Most endpoints fit in a single page     |
| **Medium**           | 500-2000 | 200-1000 | 10-25 minutes                | 150-500             | Pagination on users and devices         |
| **Large**            | 2000-10K | 1000-5000| 25-60 minutes                | 500-2000            | Heavy pagination; rate limiting likely  |
| **Enterprise**       | 10K+     | 5000+    | 60+ minutes                  | 2000+               | Rate limiting guaranteed; parallel exec needed |

### Scaling Recommendations

| Threshold                              | Recommendation                                              |
|----------------------------------------|-------------------------------------------------------------|
| Assessment > 30 minutes                | Implement parallel module execution                         |
| > 5 rate-limited (429) responses       | Increase `retryDelaySeconds` or reduce `pageSize`           |
| > 100 findings generated               | Implement deferred JSON sync                                |
| Enterprise tenant (10K+ users)         | Implement batch Graph API calls; consider incremental mode  |

---

## 10. Appendix

### Performance Monitoring Commands

```powershell
# Measure single module execution time
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$findings = Check-EntraIDSecurity -CollectedData $data
$sw.Stop()
Write-Host "EntraID check completed in $($sw.Elapsed.TotalSeconds) seconds"

# Measure full assessment with per-module timing
Start-M365Assessment -TenantId $tid -ClientId $cid -ClientSecret $cs `
                     -OutputPath "C:\Temp\PerfTest" `
                     -Verbose `
                     -MeasurePerformance  # Writes per-module timing to console
```

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Integration Testing](./integration-testing.md)
- [Security Testing](./security-testing.md)
