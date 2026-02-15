# SLA / SLO / SLI Definitions

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | SLA / SLO / SLI Definitions       |
| Last Updated     | [YYYY-MM-DD]                       |
| Status           | [Draft / In Review / Approved]     |
| Owner            | [TEAM OR INDIVIDUAL NAME]          |

---

## 1. Document Purpose

This document defines the Service Level Agreements (SLAs), Service Level Objectives (SLOs), and Service Level Indicators (SLIs) for the [PROJECT NAME] platform. It establishes how reliability is measured, what targets the team commits to, how error budgets are managed, and how Azure service dependencies affect the composite SLA.

---

## 2. Definitions

| Term | Full Name                   | Definition                                                                                           | Audience          |
|------|-----------------------------|------------------------------------------------------------------------------------------------------|--------------------|
| SLI  | Service Level Indicator     | A quantitative measure of some aspect of the service's reliability. SLIs are the raw measurements.   | Engineering        |
| SLO  | Service Level Objective     | A target value or range for an SLI. SLOs define the acceptable reliability level the team aims for.  | Engineering, Product |
| SLA  | Service Level Agreement     | A contractual commitment to customers defining service levels, with consequences if not met.          | Customers, Legal, Business |

### Relationship

```
SLI (what you measure) -> SLO (what you target internally) -> SLA (what you promise externally)

Example:
  SLI: Percentage of successful HTTP requests (status < 500)
  SLO: 99.95% of requests succeed, measured over a 30-day rolling window
  SLA: 99.9% monthly uptime guaranteed to customers (with credits for breach)
```

**Key Principle:** SLOs should always be stricter than SLAs. The gap between SLO and SLA provides a buffer before contractual obligations are breached.

---

## 3. SLI Inventory

| SLI Name                  | Definition                                                       | Measurement Method                                           | Data Source              | Good Event                                | Valid Event                         |
|---------------------------|------------------------------------------------------------------|--------------------------------------------------------------|--------------------------|-------------------------------------------|-------------------------------------|
| Availability              | Proportion of successful requests out of total valid requests    | `count(status < 500) / count(all requests)`                  | Application Insights     | HTTP response with status code < 500      | All HTTP requests (excluding health checks) |
| Latency (P95)             | 95th percentile of request duration                              | `percentile(duration, 95)` over rolling window               | Application Insights     | Request completed in < [X]ms              | All HTTP requests                   |
| Latency (P99)             | 99th percentile of request duration                              | `percentile(duration, 99)` over rolling window               | Application Insights     | Request completed in < [X]ms              | All HTTP requests                   |
| Error Rate                | Proportion of requests resulting in errors                       | `count(status >= 500) / count(all requests)`                 | Application Insights     | N/A (inverse of availability)             | All HTTP requests                   |
| Throughput                | Number of requests processed per second                          | `count(requests) / time_window`                              | Application Insights     | Request completed (any status)            | Time window                         |
| Data Freshness            | Time since last successful data pipeline run                     | Custom metric: pipeline completion timestamp                 | Log Analytics            | Pipeline completed < [X] minutes ago      | Each pipeline run cycle             |
| [SLI NAME]                | [DEFINITION]                                                     | [METHOD]                                                     | [SOURCE]                 | [GOOD EVENT]                              | [VALID EVENT]                       |

---

## 4. SLO Targets

### 4.1 Service-Level SLOs

| Service / Component      | SLI                | SLO Target   | Measurement Window | Current Performance | Error Budget (30d)     | Error Budget Remaining |
|--------------------------|--------------------|-------------|-------------------|---------------------|------------------------|------------------------|
| Web Application          | Availability       | [99.95%]    | [30-day rolling]  | [XX.XX%]            | [21.6 minutes]         | [XX minutes]           |
| Web Application          | Latency (P95)      | [<500ms]    | [30-day rolling]  | [XXX ms]            | [5% of requests >500ms]| [X.XX%]                |
| API Services             | Availability       | [99.95%]    | [30-day rolling]  | [XX.XX%]            | [21.6 minutes]         | [XX minutes]           |
| API Services             | Latency (P95)      | [<300ms]    | [30-day rolling]  | [XXX ms]            | [5% of requests >300ms]| [X.XX%]                |
| API Services             | Latency (P99)      | [<1000ms]   | [30-day rolling]  | [XXX ms]            | [1% of requests >1000ms]| [X.XX%]               |
| Background Processing    | Availability       | [99.9%]     | [30-day rolling]  | [XX.XX%]            | [43.2 minutes]         | [XX minutes]           |
| Background Processing    | Data Freshness     | [<15 min]   | [Continuous]      | [XX min]            | [N/A]                  | [N/A]                  |
| [SERVICE]                | [SLI]              | [TARGET]    | [WINDOW]          | [CURRENT]           | [BUDGET]               | [REMAINING]            |

### 4.2 Error Budget Calculation

```
Error Budget = (1 - SLO) x Window

Example for 99.95% SLO over 30 days:
  Error Budget = (1 - 0.9995) x 30 x 24 x 60 = 21.6 minutes of downtime allowed

Example for 99.9% SLO over 30 days:
  Error Budget = (1 - 0.999) x 30 x 24 x 60 = 43.2 minutes of downtime allowed
```

### 4.3 Error Budget Burn Rate Alerts

| Alert Level     | Burn Rate            | Window    | Meaning                                           | Action                                     |
|-----------------|----------------------|-----------|---------------------------------------------------|--------------------------------------------|
| Page (Urgent)   | [14.4x normal rate]  | [1 hour]  | Error budget will exhaust in ~2 days at this rate  | Page on-call, investigate immediately      |
| Page (Slow)     | [6x normal rate]     | [6 hours] | Error budget will exhaust in ~5 days at this rate  | Page on-call, investigate within shift      |
| Ticket (Warning)| [3x normal rate]     | [1 day]   | Error budget will exhaust in ~10 days at this rate | Create ticket, investigate next business day |
| Ticket (Info)   | [1x normal rate]     | [3 days]  | Error budget burning at expected rate              | Monitor, no immediate action required       |

---

## 5. Error Budget Policy

### 5.1 Error Budget Status Levels

| Status            | Condition                           | Implications                                                       |
|-------------------|-------------------------------------|--------------------------------------------------------------------|
| Healthy           | [>50% error budget remaining]       | Normal development velocity. Feature work proceeds as planned.     |
| Caution           | [25-50% error budget remaining]     | Increased focus on reliability. New features require SRE review.   |
| At Risk           | [10-25% error budget remaining]     | Reliability-focused sprint. Only reliability improvements and critical fixes deployed. |
| Exhausted         | [<10% or 0% error budget remaining] | Feature freeze. All engineering effort focused on reliability until budget recovers. |

### 5.2 Error Budget Exhaustion Protocol

When the error budget is exhausted:

- [ ] Feature deployments are paused until error budget recovers
- [ ] All engineering effort redirected to reliability improvements
- [ ] Post-mortem required for the incident(s) that consumed the budget
- [ ] Mandatory review of SLO targets (are they appropriate?)
- [ ] Executive stakeholders notified of feature freeze
- [ ] Exception process: [VP ENGINEERING] can approve critical feature deployments with justification

### 5.3 Error Budget Review

| Attribute              | Value                                          |
|------------------------|-------------------------------------------------|
| Review Cadence         | [Weekly at SRE standup, Monthly at engineering all-hands] |
| Review Participants    | [SRE, Engineering Leads, Product]               |
| Review Artifacts       | [SLO dashboard, error budget chart, incident summary] |
| Decision Authority     | [VP Engineering for feature freeze decisions]    |

---

## 6. SLA Commitments (External-Facing)

### 6.1 Customer SLAs

| Service                  | SLA Commitment | Measurement Period | Measurement Method                     | Penalty / Credit                              |
|--------------------------|---------------|-------------------|----------------------------------------|-----------------------------------------------|
| [Web Application]        | [99.9%]       | [Calendar month]  | [% of 5-minute intervals with successful health checks] | [10% credit for <99.9%, 25% credit for <99.5%, 50% credit for <99.0%] |
| [API Services]           | [99.9%]       | [Calendar month]  | [% of successful API requests (non-5xx)]| [Same credit structure as above]              |
| [Data Processing]        | [99.5%]       | [Calendar month]  | [% of hours with successful pipeline completion] | [10% credit for <99.5%]                     |
| [SERVICE]                | [SLA %]       | [PERIOD]          | [METHOD]                               | [PENALTY]                                     |

### 6.2 SLA Exclusions

The following are excluded from SLA calculations:

- Scheduled maintenance windows (announced [72 hours] in advance)
- Force majeure events
- Customer-caused outages (misconfiguration, excessive load beyond contracted limits)
- Beta/preview features
- Third-party service outages beyond [PROJECT NAME]'s control
- [ADDITIONAL EXCLUSIONS]

---

## 7. Azure Service SLA Dependencies

### 7.1 Azure Service SLAs

| Azure Service                    | Azure SLA       | [PROJECT NAME] Usage                    | Impact if Azure SLA Breached                |
|----------------------------------|-----------------|-----------------------------------------|---------------------------------------------|
| Azure Kubernetes Service (AKS)   | [99.95%]        | [API and backend services]              | [API unavailable]                           |
| App Service (Standard+)          | [99.95%]        | [Web frontend]                          | [Web application unavailable]               |
| Azure Functions (Premium)        | [99.95%]        | [Background processing]                 | [Delayed message processing]                |
| Azure SQL Database (Business Critical) | [99.995%] | [Primary data store]                    | [Data read/write failures]                  |
| Azure Storage (RA-GRS)           | [99.99%]        | [Blob and file storage]                 | [File access failures]                      |
| Azure Cache for Redis (Premium)  | [99.9%]         | [Session and data caching]              | [Degraded performance, cache miss fallback] |
| Azure Service Bus (Premium)      | [99.95%]        | [Async messaging]                       | [Message delivery delays]                   |
| Azure Key Vault                  | [99.99%]        | [Secret and certificate management]     | [Unable to retrieve secrets on cold start]  |
| Azure Front Door                 | [99.99%]        | [Global load balancing, CDN]            | [Traffic routing failures]                  |
| Application Gateway (v2)         | [99.95%]        | [Regional L7 load balancing]            | [Regional traffic routing failures]         |
| Azure DNS                        | [100%]          | [DNS resolution]                        | [Unable to resolve application domains]     |
| [AZURE SERVICE]                  | [SLA %]         | [USAGE]                                 | [IMPACT]                                    |

### 7.2 Azure SLA Reference

Azure SLAs are published at: [https://azure.microsoft.com/en-us/support/legal/sla/](https://azure.microsoft.com/en-us/support/legal/sla/)

---

## 8. Composite SLA Calculation

### 8.1 Methodology

The composite SLA for the [PROJECT NAME] platform is calculated based on the Azure service SLAs in the critical request path.

**Serial dependencies:** Multiply the SLAs together.
```
Composite SLA = SLA_A x SLA_B x SLA_C
```

**Parallel/redundant dependencies:** Use the formula:
```
Composite SLA = 1 - (1 - SLA_A) x (1 - SLA_B)
```

### 8.2 Critical Path SLA Calculation

**Critical request path:** User -> Front Door -> Application Gateway -> AKS -> SQL Database

```
Composite SLA = Front Door SLA x App Gateway SLA x AKS SLA x SQL SLA
Composite SLA = 0.9999 x 0.9995 x 0.9995 x 0.99995
Composite SLA = [CALCULATED VALUE, approximately 99.885%]
```

### 8.3 Composite SLA Summary

| Request Path                                         | Component SLAs                                | Composite SLA | Meets SLA Target? |
|------------------------------------------------------|-----------------------------------------------|---------------|-------------------|
| [Web: User -> Front Door -> AGW -> AKS -> SQL]       | [99.99% x 99.95% x 99.95% x 99.995%]         | [~99.885%]    | [Yes/No]          |
| [API: Client -> Front Door -> AGW -> AKS -> SQL]     | [99.99% x 99.95% x 99.95% x 99.995%]         | [~99.885%]    | [Yes/No]          |
| [Processing: Service Bus -> Functions -> SQL]         | [99.95% x 99.95% x 99.995%]                   | [~99.895%]    | [Yes/No]          |
| [PATH]                                               | [SLAs]                                         | [COMPOSITE]   | [YES/NO]          |

### 8.4 Improving Composite SLA

| Strategy                                    | Impact                                              | Implementation                              |
|---------------------------------------------|-----------------------------------------------------|---------------------------------------------|
| Multi-region deployment                     | Reduces single-region failure impact                | Active-Active or Active-Passive DR          |
| Availability Zones                          | Higher per-region availability                       | Deploy across 3 AZs within region           |
| Retry with exponential backoff              | Handles transient failures                          | Application-level retry logic               |
| Circuit breaker pattern                     | Prevents cascade failures                           | Polly / Resilience4j implementation         |
| Cache as fallback                           | Serves cached data when primary fails               | Redis with stale-while-revalidate           |
| Queue-based load leveling                   | Smooths out traffic spikes                          | Service Bus with competing consumers        |

---

## 9. SLO Review Cadence

| Review Type            | Frequency    | Participants                         | Agenda                                                   | Output                         |
|------------------------|--------------|--------------------------------------|----------------------------------------------------------|--------------------------------|
| Weekly SLO Check       | Weekly       | SRE on-call                          | Review SLO dashboards, error budget status               | Slack update to team           |
| Monthly SLO Review     | Monthly      | SRE, Engineering Leads, Product      | Review 30-day SLO performance, incident impact, trends   | Monthly reliability report     |
| Quarterly SLO Tuning   | Quarterly    | SRE, Engineering, Product, Executive | Review and adjust SLO targets, evaluate new SLIs         | Updated SLO targets            |
| Annual SLA Review      | Annually     | Engineering, Product, Legal, Sales   | Review customer SLA terms, evaluate penalty structure     | Updated SLA contracts          |

### SLO Dashboard

| Dashboard             | URL                                            | Key Visualizations                                          |
|-----------------------|------------------------------------------------|-------------------------------------------------------------|
| SLO Overview          | [https://grafana.company.com/d/slo-overview]   | SLO compliance %, error budget remaining, burn rate         |
| Error Budget Tracker  | [https://grafana.company.com/d/error-budget]   | Error budget consumption over time, budget projections      |
| SLI Detail            | [https://grafana.company.com/d/sli-detail]     | Individual SLI values, time series, anomaly detection       |

### KQL Query: Monthly Availability SLI

```kql
let startTime = startofmonth(now());
let endTime = now();
requests
| where timestamp between (startTime .. endTime)
| where name !contains "health"
| summarize
    TotalRequests = count(),
    SuccessfulRequests = countif(toint(resultCode) < 500),
    Availability = round(100.0 * countif(toint(resultCode) < 500) / count(), 4)
| extend
    ErrorBudgetTotal_min = round((1 - 0.9995) * datetime_diff('minute', endTime, startTime), 2),
    ErrorBudgetConsumed_min = round((1 - Availability / 100.0) * datetime_diff('minute', endTime, startTime), 2)
| extend
    ErrorBudgetRemaining_min = ErrorBudgetTotal_min - ErrorBudgetConsumed_min,
    ErrorBudgetRemaining_pct = round(100.0 * (ErrorBudgetTotal_min - ErrorBudgetConsumed_min) / ErrorBudgetTotal_min, 2)
```

---

## 10. Revision History

| Date           | Author            | Changes Made                              |
|----------------|-------------------|-------------------------------------------|
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [Initial document creation]               |
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [DESCRIPTION OF CHANGES]                  |
