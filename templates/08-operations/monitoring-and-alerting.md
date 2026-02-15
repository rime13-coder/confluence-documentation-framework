# Monitoring & Alerting

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Monitoring & Alerting              |
| Last Updated     | 2026-02-14                         |
| Status           | Draft                              |
| Owner            | IntelliSec Solutions               |

---

## 1. Document Purpose

This document defines the observability strategy, monitoring tools, key metrics, alerting rules, dashboards, and log aggregation configuration for the CMMC Assessor Platform on Azure. The current monitoring posture is minimal and this document honestly captures the gaps alongside planned improvements.

---

## 2. Observability Strategy

### 2.1 Three Pillars of Observability

| Pillar   | Purpose                                              | Primary Tool                       | Status              |
|----------|------------------------------------------------------|------------------------------------|---------------------|
| Metrics  | Quantitative measurements of system behavior         | Azure Monitor (basic platform metrics) | Minimal          |
| Logs     | Detailed event records for debugging and auditing    | Azure Log Analytics (log-cmmc-assessor-prod) | Active (basic) |
| Traces   | Request-level distributed tracing across services    | NOT IMPLEMENTED                    | NOT IMPLEMENTED     |

### 2.2 Current State Summary

- Container Apps logs flow to Log Analytics workspace (log-cmmc-assessor-prod)
- Application uses `console.log` for logging (unstructured, F-30)
- No Application Insights deployed
- No custom dashboards or alerts configured
- No synthetic monitoring or health checks
- Application has an audit trail via the AuditLog database table
- Log Analytics retention is 30 days (should be increased to 90 days, F-43)

### 2.3 Planned Improvements

- Deploy Application Insights for APM and distributed tracing
- Migrate from `console.log` to structured logging (F-30)
- Increase Log Analytics retention from 30 to 90 days (F-43)
- Configure custom alerts for critical conditions
- Implement synthetic monitoring / availability tests
- Create operational dashboards

---

## 3. Monitoring Tools

| Tool                         | Purpose                                      | URL / Access                              | Status           |
|------------------------------|----------------------------------------------|-------------------------------------------|------------------|
| Azure Monitor                | Platform-level metrics (CPU, memory, requests) | https://portal.azure.com                 | Active (basic)   |
| Log Analytics Workspace      | Centralized log aggregation and querying     | Azure Portal > log-cmmc-assessor-prod    | Active           |
| Application Insights         | APM, distributed tracing, availability tests | NOT IMPLEMENTED                          | NOT IMPLEMENTED  |
| Grafana                      | Custom dashboards and visualizations         | NOT IMPLEMENTED                          | NOT IMPLEMENTED  |
| Azure Workbooks              | Interactive reports in Azure Portal          | NOT IMPLEMENTED                          | NOT IMPLEMENTED  |
| Azure Service Health         | Azure platform health and planned maintenance| Azure Portal > Service Health            | Available (default) |

---

## 4. Key Metrics

### 4.1 Application Metrics

**Status: NOT IMPLEMENTED** -- No application-level metrics are collected. Application Insights is not deployed.

| Metric                          | Source                  | Status           |
|---------------------------------|-------------------------|------------------|
| Request rate (req/s)            | NOT AVAILABLE           | NOT IMPLEMENTED  |
| Request duration (P95)          | NOT AVAILABLE           | NOT IMPLEMENTED  |
| Failed request rate (%)         | NOT AVAILABLE           | NOT IMPLEMENTED  |
| Dependency failure rate (%)     | NOT AVAILABLE           | NOT IMPLEMENTED  |
| Exception rate                  | NOT AVAILABLE           | NOT IMPLEMENTED  |

### 4.2 Infrastructure Metrics (Available via Azure Monitor)

| Metric                          | Source                  | Resource                | Available        |
|---------------------------------|-------------------------|-------------------------|------------------|
| CPU utilization (%)             | Azure Monitor           | cmmc-api, cmmc-web      | Yes (basic)      |
| Memory utilization (%)          | Azure Monitor           | cmmc-api, cmmc-web      | Yes (basic)      |
| Replica count                   | Azure Monitor           | cmmc-api, cmmc-web      | Yes              |
| PostgreSQL CPU %                | Azure Monitor           | psql-cmmc-assessor-prod | Yes              |
| PostgreSQL storage used         | Azure Monitor           | psql-cmmc-assessor-prod | Yes              |
| PostgreSQL active connections   | Azure Monitor           | psql-cmmc-assessor-prod | Yes              |
| Storage account availability    | Azure Monitor           | stcmmcassessorprod      | Yes              |

> **Note:** While Azure Monitor provides these basic platform metrics, no alerting rules are configured on any of them.

### 4.3 Business Metrics

| Metric                          | Source                  | Status           |
|---------------------------------|-------------------------|------------------|
| Assessment completion rate      | AuditLog table (DB)     | Available via SQL query only |
| User login success rate         | AuditLog table (DB)     | Available via SQL query only |
| Active assessments              | Database query           | Available via SQL query only |

> **Note:** Business metrics are tracked in the database AuditLog table but are not surfaced in any dashboard or monitoring tool.

---

## 5. Dashboard Inventory

**Status: NOT IMPLEMENTED** -- No custom dashboards exist.

| Dashboard Name                     | Tool               | Status           |
|------------------------------------|--------------------|--------------------|
| System Health Overview             | N/A                | NOT IMPLEMENTED    |
| Application Performance            | N/A                | NOT IMPLEMENTED    |
| Database Performance               | N/A                | NOT IMPLEMENTED    |
| Business Metrics                   | N/A                | NOT IMPLEMENTED    |
| Cost Dashboard                     | Azure Cost Management | Available (default) |

### Planned Improvements

- Create an Azure Workbook for system health overview
- Create an Azure Workbook for Container Apps performance metrics
- Set up cost tracking dashboard in Azure Cost Management

---

## 6. Alert Rules

### 6.1 Alert Rules Table

**Status: NOT IMPLEMENTED** -- No custom alert rules are configured.

| Alert Name                           | Condition                                          | Status           |
|--------------------------------------|----------------------------------------------------|------------------|
| High Error Rate                      | NOT IMPLEMENTED                                    | NOT IMPLEMENTED  |
| High Response Latency                | NOT IMPLEMENTED                                    | NOT IMPLEMENTED  |
| Container App Restart Loop           | NOT IMPLEMENTED                                    | NOT IMPLEMENTED  |
| PostgreSQL High CPU                  | NOT IMPLEMENTED                                    | NOT IMPLEMENTED  |
| PostgreSQL Storage > 80%             | NOT IMPLEMENTED                                    | NOT IMPLEMENTED  |
| Health Check Failure                 | NOT IMPLEMENTED                                    | NOT IMPLEMENTED  |
| Budget Threshold                     | NOT IMPLEMENTED                                    | NOT IMPLEMENTED  |
| Azure Service Health Issue           | NOT IMPLEMENTED                                    | NOT IMPLEMENTED  |

### 6.2 Action Groups

**Status: NOT IMPLEMENTED** -- No action groups are configured.

### Planned Alert Configuration

The following alerts should be implemented as a priority:

| Alert Name                           | Condition                                          | Severity | Notification                 |
|--------------------------------------|----------------------------------------------------|----------|------------------------------|
| Container App Unhealthy              | Replica count = 0 for > 5 minutes (during expected traffic) | Sev 2 | Email to support@intellisecsolutions.com |
| PostgreSQL High CPU                  | CPU > 90% for 10 minutes                          | Sev 2    | Email                        |
| PostgreSQL Storage > 80%             | Storage used > 80% of provisioned                  | Sev 3    | Email                        |
| Health Check Failure                 | GET /api/health returns non-200 for 5 minutes      | Sev 1    | Email                        |
| Monthly Budget Exceeded             | Spend > CAD $100                                   | Sev 3    | Email                        |

---

## 7. Log Aggregation

### 7.1 Log Analytics Workspace Configuration

| Attribute                        | Value                                              |
|----------------------------------|----------------------------------------------------|
| Workspace Name                   | log-cmmc-assessor-prod                             |
| Resource Group                   | rg-cmmc-assessor-prod                              |
| Region                           | Canada Central                                     |
| Pricing Tier                     | PerGB2018 (pay-as-you-go, free tier ~5GB/month)    |
| Data Retention                   | 30 days (F-43: should increase to 90 days)         |
| Daily Ingestion Cap              | Not configured                                     |

### 7.2 Log Categories and Sources

| Log Source                    | Log Category                      | Destination              | Retention    | Purpose                           |
|-------------------------------|-----------------------------------|--------------------------|--------------|-----------------------------------|
| Container Apps (cmmc-api)     | ContainerAppConsoleLogs_CL        | Log Analytics            | 30 days      | API application logs (console.log)|
| Container Apps (cmmc-web)     | ContainerAppConsoleLogs_CL        | Log Analytics            | 30 days      | Frontend application logs         |
| Container Apps (system)       | ContainerAppSystemLogs_CL         | Log Analytics            | 30 days      | Container Apps platform logs      |
| Application (database)        | AuditLog table                    | PostgreSQL database      | Indefinite   | Business audit trail              |

> **Note:** The following log sources are NOT configured:
> - Application Insights (not deployed)
> - PostgreSQL diagnostic logs (not enabled)
> - Key Vault audit logs (not enabled)
> - Activity Log export to Log Analytics (not configured)

### 7.3 Key Log Queries (KQL)

**Recent application errors (backend API):**
```kql
ContainerAppConsoleLogs_CL
| where ContainerAppName_s == "cmmc-api"
| where Log_s contains "error" or Log_s contains "Error" or Log_s contains "ERROR"
| where TimeGenerated > ago(1h)
| order by TimeGenerated desc
| take 50
```

**Recent application logs (all containers):**
```kql
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(1h)
| project TimeGenerated, ContainerAppName_s, Log_s
| order by TimeGenerated desc
| take 100
```

**Container App system events:**
```kql
ContainerAppSystemLogs_CL
| where TimeGenerated > ago(24h)
| where Type_s == "Warning" or Type_s == "Error"
| order by TimeGenerated desc
```

**Container restarts:**
```kql
ContainerAppSystemLogs_CL
| where TimeGenerated > ago(24h)
| where Reason_s contains "Restart" or Reason_s contains "BackOff"
| order by TimeGenerated desc
```

---

## 8. Distributed Tracing

**Status: NOT IMPLEMENTED**

| Attribute                        | Value                                           |
|----------------------------------|-------------------------------------------------|
| Tracing Provider                 | NOT IMPLEMENTED                                 |
| Correlation Header               | NOT IMPLEMENTED                                 |
| Instrumentation                  | NOT IMPLEMENTED                                 |

### Planned Improvements

- Deploy Application Insights and connect to Container Apps
- Implement OpenTelemetry SDK for distributed tracing
- Configure correlation IDs across frontend and backend services

---

## 9. Synthetic Monitoring / Health Checks

### 9.1 Availability Tests

**Status: NOT IMPLEMENTED** -- No synthetic monitoring or availability tests are configured.

### 9.2 Custom Health Check Endpoints

| Endpoint                         | Checks Performed                                              | Expected Response         | Known Issues                   |
|----------------------------------|---------------------------------------------------------------|---------------------------|--------------------------------|
| GET /api/health                  | Basic application health                                       | 200 OK with status JSON   | Leaks configuration info (F-38) |

> **Note:** Only a single health endpoint exists. There is no readiness probe or liveness probe differentiation. The health endpoint currently returns configuration details that should not be exposed (F-38).

### Planned Improvements

- Create separate `/api/health/ready` and `/api/health/live` endpoints
- Remove configuration information from health endpoint response (F-38)
- Configure Application Insights availability tests for production URL
- Set up URL ping tests from multiple global locations

---

## 10. Alert Noise Reduction Strategy

N/A -- No alerts are currently configured, so alert noise is not a concern at this time. This section will be populated when alerting is implemented.

---

## 11. SLA Monitoring and Reporting

**Status: NOT IMPLEMENTED** -- No SLA monitoring is in place. See the SLA/SLO Definitions document for planned targets.

### Planned SLA Monitoring Query (for future use)

```kql
// Monthly availability calculation (requires Application Insights)
// NOT YET FUNCTIONAL -- Application Insights not deployed
let timeRange = 30d;
requests
| where timestamp > ago(timeRange)
| summarize
    total = count(),
    successful = countif(resultCode < 500),
    availability = round(100.0 * countif(resultCode < 500) / count(), 4)
```

---

## 12. Revision History

| Date           | Author               | Changes Made                              |
|----------------|-----------------------|-------------------------------------------|
| 2026-02-14     | IntelliSec Solutions  | Initial document creation                 |
