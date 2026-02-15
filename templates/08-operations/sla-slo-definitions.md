# SLA / SLO / SLI Definitions

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | SLA / SLO / SLI Definitions       |
| Last Updated     | 2026-02-14                         |
| Status           | Draft                              |
| Owner            | IntelliSec Solutions               |

---

## 1. Document Purpose

This document defines the Service Level Agreements (SLAs), Service Level Objectives (SLOs), and Service Level Indicators (SLIs) for the CMMC Assessor Platform. Currently, no formal SLAs, SLOs, or SLIs have been defined or measured. This document establishes the framework and proposes initial targets.

**Current State: No SLAs, SLOs, or SLIs are formally defined or monitored.**

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

Example for CMMC Assessor Platform:
  SLI: Percentage of successful HTTP requests (status < 500)
  SLO: 99.5% of requests succeed, measured over a 30-day rolling window (proposed)
  SLA: Not yet defined externally
```

---

## 3. SLI Inventory

### Proposed SLIs (NOT YET MEASURED)

| SLI Name                  | Definition                                                       | Measurement Method                                           | Data Source              | Status           |
|---------------------------|------------------------------------------------------------------|--------------------------------------------------------------|--------------------------|------------------|
| Availability              | Proportion of successful requests out of total valid requests    | `count(status < 500) / count(all requests)`                  | NOT AVAILABLE (no Application Insights) | NOT IMPLEMENTED |
| Latency (P95)             | 95th percentile of request duration                              | `percentile(duration, 95)` over rolling window               | NOT AVAILABLE            | NOT IMPLEMENTED  |
| Error Rate                | Proportion of requests resulting in server errors                | `count(status >= 500) / count(all requests)`                 | NOT AVAILABLE            | NOT IMPLEMENTED  |
| Health Check Success      | Proportion of health check calls returning 200                   | External monitoring (proposed)                               | NOT AVAILABLE            | NOT IMPLEMENTED  |

> **Note:** SLI measurement requires Application Insights or equivalent APM tooling, which is NOT IMPLEMENTED. Basic platform metrics from Azure Monitor do not provide request-level SLIs.

### Planned Improvements

- Deploy Application Insights to enable SLI measurement
- Implement structured request logging with status codes and durations
- Create KQL queries for each SLI calculation

---

## 4. SLO Targets

### 4.1 Proposed Service-Level SLOs

| Service / Component      | SLI                | Proposed SLO Target | Measurement Window | Current Performance | Status           |
|--------------------------|--------------------|--------------------|--------------------|---------------------|------------------|
| Web Application (cmmc-web) | Availability     | 99.5%              | 30-day rolling     | Unknown             | NOT MEASURED     |
| Web Application (cmmc-web) | Latency (P95)    | <3 seconds         | 30-day rolling     | Unknown             | NOT MEASURED     |
| API Services (cmmc-api)   | Availability      | 99.5%              | 30-day rolling     | Unknown             | NOT MEASURED     |
| API Services (cmmc-api)   | Latency (P95)     | <1 second          | 30-day rolling     | Unknown             | NOT MEASURED     |

> **Note:** The proposed SLO of 99.5% reflects the current infrastructure capabilities. With scale-to-zero enabled and no redundancy, achieving higher SLOs (e.g., 99.9%+) is unrealistic without infrastructure improvements. Cold starts from scale-to-zero will cause periodic latency spikes.

### 4.2 Error Budget Calculation

```
Error Budget = (1 - SLO) x Window

For proposed 99.5% SLO over 30 days:
  Error Budget = (1 - 0.995) x 30 x 24 x 60 = 216 minutes (~3.6 hours) of downtime allowed

For comparison, 99.9% SLO over 30 days:
  Error Budget = (1 - 0.999) x 30 x 24 x 60 = 43.2 minutes of downtime allowed
```

### 4.3 Error Budget Burn Rate Alerts

**Status: NOT IMPLEMENTED** -- Error budget tracking and burn rate alerts require Application Insights and custom alerting, neither of which is deployed.

---

## 5. Error Budget Policy

**Status: NOT IMPLEMENTED** -- No error budget policy exists. The following is a proposed policy for future adoption.

### 5.1 Proposed Error Budget Status Levels

| Status            | Condition                           | Implications                                                       |
|-------------------|-------------------------------------|--------------------------------------------------------------------|
| Healthy           | >50% error budget remaining         | Normal development. Feature work proceeds as planned.              |
| Caution           | 25-50% error budget remaining       | Increased focus on reliability. Review recent changes.             |
| At Risk           | 10-25% error budget remaining       | Prioritize reliability fixes over new features.                    |
| Exhausted         | <10% error budget remaining         | Pause feature deployments. Focus on stability.                     |

---

## 6. SLA Commitments (External-Facing)

### 6.1 Customer SLAs

**Status: NOT IMPLEMENTED** -- No formal SLA commitments exist with customers.

| Service                  | SLA Commitment | Status           |
|--------------------------|---------------|------------------|
| Web Application          | Not defined   | NOT IMPLEMENTED  |
| API Services             | Not defined   | NOT IMPLEMENTED  |

> **Note:** Before defining external SLAs, internal SLOs must be established, measured, and consistently met. External SLAs should be set below internal SLO targets to provide an error budget buffer.

### Planned Improvements

- Establish internal SLOs first (requires Application Insights)
- Measure SLO compliance for at least 3 months before committing to external SLAs
- Define SLA terms and penalty/credit structure with legal review
- Publish SLA documentation for customers

---

## 7. Azure Service SLA Dependencies

### 7.1 Azure Service SLAs

| Azure Service                         | Azure SLA       | CMMC Assessor Usage                     | Impact if Azure SLA Breached                |
|---------------------------------------|-----------------|-----------------------------------------|---------------------------------------------|
| Azure Container Apps (Consumption)    | 99.95%          | Backend API and frontend web app        | Platform unavailable                        |
| Azure PostgreSQL Flexible Server      | 99.99% (with HA) / 99.9% (without HA) | Primary data store | Data read/write failures              |
| Azure Storage (LRS)                   | 99.9%           | Blob and file storage                   | File access failures                        |
| Azure Key Vault                       | 99.99%          | Secret management                       | Unable to retrieve secrets on cold start    |
| Azure Container Registry (Basic)      | 99.9%           | Container image storage                 | Unable to pull images for new deployments   |

> **Note:** The PostgreSQL Flexible Server is deployed WITHOUT high availability (single zone), so the applicable Azure SLA is 99.9%, not 99.99%.

### 7.2 Azure SLA Reference

Azure SLAs are published at: [https://azure.microsoft.com/en-us/support/legal/sla/](https://azure.microsoft.com/en-us/support/legal/sla/)

---

## 8. Composite SLA Calculation

### 8.1 Critical Path SLA Calculation

**Critical request path:** User -> Container Apps (cmmc-web) -> Container Apps (cmmc-api) -> PostgreSQL

```
Composite SLA = Container Apps SLA x Container Apps SLA x PostgreSQL SLA (no HA)
Composite SLA = 0.9995 x 0.9995 x 0.999
Composite SLA = ~0.998 (99.8%)
```

> **Note:** This means the Azure platform alone can be expected to provide approximately 99.8% availability on the critical path. This translates to approximately 87 minutes of potential unavailability per month from Azure platform issues alone. Actual availability will be lower due to application-level issues, deployments, and cold starts.

### 8.2 Composite SLA Summary

| Request Path                                         | Component SLAs                                | Composite SLA | Realistic with Cold Starts? |
|------------------------------------------------------|-----------------------------------------------|---------------|-----------------------------|
| Web: User -> cmmc-web -> cmmc-api -> PostgreSQL      | 99.95% x 99.95% x 99.9%                      | ~99.8%        | Lower due to cold starts    |
| API: Client -> cmmc-api -> PostgreSQL                | 99.95% x 99.9%                                | ~99.85%       | Lower due to cold starts    |

### 8.3 Improving Composite SLA

| Strategy                                    | Impact                                              | Status                                      |
|---------------------------------------------|-----------------------------------------------------|---------------------------------------------|
| Disable scale-to-zero (min replicas = 1)    | Eliminates cold start delays                        | Not enabled (cost tradeoff)                 |
| Enable PostgreSQL zone-redundant HA         | Improves DB SLA to 99.99%                           | NOT IMPLEMENTED (cost)                      |
| Multi-region deployment                     | Reduces single-region failure impact                | NOT IMPLEMENTED                             |
| Retry with exponential backoff              | Handles transient failures                          | Application-level -- partially implemented  |
| Health check improvements                   | Faster detection of issues                          | Planned (F-38 remediation)                  |

---

## 9. SLO Review Cadence

**Status: NOT IMPLEMENTED** -- No SLO review process exists.

### Proposed Review Cadence

| Review Type            | Frequency    | Participants                         | Output                         |
|------------------------|--------------|--------------------------------------|--------------------------------|
| Monthly SLO Review     | Monthly      | Engineering team                     | Monthly reliability status     |
| Quarterly SLO Tuning   | Quarterly    | Engineering + Product                | Updated SLO targets if needed  |

### Planned Improvements

- Deploy Application Insights to enable SLI/SLO measurement
- Create SLO dashboard (Azure Workbook or Grafana)
- Establish monthly review cadence once measurement is in place
- Track error budget consumption over time

---

## 10. Revision History

| Date           | Author               | Changes Made                              |
|----------------|-----------------------|-------------------------------------------|
| 2026-02-14     | IntelliSec Solutions  | Initial document creation                 |
