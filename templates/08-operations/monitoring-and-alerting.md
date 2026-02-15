# Monitoring & Alerting

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Monitoring & Alerting              |
| Last Updated     | [YYYY-MM-DD]                       |
| Status           | [Draft / In Review / Approved]     |
| Owner            | [TEAM OR INDIVIDUAL NAME]          |

---

## 1. Document Purpose

This document defines the observability strategy, monitoring tools, key metrics, alerting rules, dashboards, and log aggregation configuration for the [PROJECT NAME] platform on Azure. It serves as the reference for how the system is observed, when alerts fire, and how to respond to them.

---

## 2. Observability Strategy

### 2.1 Three Pillars of Observability

| Pillar   | Purpose                                              | Primary Tool                       | Secondary Tool          |
|----------|------------------------------------------------------|------------------------------------|-------------------------|
| Metrics  | Quantitative measurements of system behavior         | [Azure Monitor / Application Insights] | [Grafana / Prometheus] |
| Logs     | Detailed event records for debugging and auditing    | [Azure Log Analytics]              | [Application Insights]  |
| Traces   | Request-level distributed tracing across services    | [Application Insights (distributed tracing)] | [Jaeger / Zipkin]  |

### 2.2 Observability Principles

- All production services must emit structured logs, metrics, and traces
- Use correlation IDs across all services for end-to-end tracing
- Metrics are preferred for alerting; logs for investigation
- Dashboards should answer: "Is the system healthy right now?"
- Alerts should be actionable -- every alert has a corresponding runbook

---

## 3. Monitoring Tools

| Tool                         | Purpose                                      | URL / Access                              | Owner            |
|------------------------------|----------------------------------------------|-------------------------------------------|------------------|
| Azure Monitor                | Platform-level metrics and alerts            | [https://portal.azure.com]                | [SRE / DevOps]   |
| Application Insights         | APM, distributed tracing, availability tests | [DIRECT LINK TO APP INSIGHTS RESOURCE]    | [SRE / DevOps]   |
| Log Analytics Workspace      | Centralized log aggregation and querying     | [DIRECT LINK TO LOG ANALYTICS]            | [SRE / DevOps]   |
| Grafana                      | Custom dashboards and visualizations         | [https://grafana.company.com]             | [SRE / DevOps]   |
| Azure Workbooks              | Interactive reports in Azure Portal          | [DIRECT LINK TO WORKBOOKS]               | [SRE / DevOps]   |
| Azure Service Health         | Azure platform health and planned maintenance| [Azure Portal > Service Health]           | [SRE / DevOps]   |
| Azure Resource Health        | Individual resource health status            | [Azure Portal > Resource Health]          | [SRE / DevOps]   |
| [ADDITIONAL TOOL]            | [PURPOSE]                                    | [URL]                                     | [OWNER]          |

---

## 4. Key Metrics

### 4.1 Application Metrics

| Metric                          | Source                  | Normal Range            | Warning Threshold       | Critical Threshold      | Alert Severity | Notification Channel  |
|---------------------------------|-------------------------|-------------------------|-------------------------|-------------------------|----------------|-----------------------|
| Request rate (req/s)            | Application Insights    | [100-500 req/s]         | [>800 req/s]            | [>1200 req/s]           | [Sev 3]        | [Slack]               |
| Request duration (P95)          | Application Insights    | [<500ms]                | [>1000ms for 5 min]     | [>3000ms for 5 min]     | [Sev 2]        | [PagerDuty + Slack]   |
| Failed request rate (%)         | Application Insights    | [<1%]                   | [>2% for 5 min]         | [>5% for 5 min]         | [Sev 1]        | [PagerDuty + Slack]   |
| Dependency failure rate (%)     | Application Insights    | [<0.5%]                 | [>1% for 5 min]         | [>3% for 5 min]         | [Sev 2]        | [PagerDuty + Slack]   |
| Exception rate                  | Application Insights    | [<10/min]               | [>50/min for 5 min]     | [>200/min for 5 min]    | [Sev 2]        | [PagerDuty + Slack]   |
| Active connections              | Application Insights    | [<5000]                 | [>8000]                 | [>9500]                 | [Sev 3]        | [Slack]               |

### 4.2 Infrastructure Metrics

| Metric                          | Source                  | Resource                | Warning Threshold       | Critical Threshold      | Alert Severity | Notification Channel  |
|---------------------------------|-------------------------|-------------------------|-------------------------|-------------------------|----------------|-----------------------|
| CPU utilization (%)             | Azure Monitor           | [AKS / App Service / VM]| [>70% for 15 min]       | [>90% for 5 min]        | [Sev 2]        | [PagerDuty + Slack]   |
| Memory utilization (%)          | Azure Monitor           | [AKS / App Service / VM]| [>75% for 15 min]       | [>90% for 5 min]        | [Sev 2]        | [PagerDuty + Slack]   |
| Disk I/O queue length           | Azure Monitor           | [VM / SQL]              | [>5 for 10 min]         | [>20 for 5 min]         | [Sev 3]        | [Slack]               |
| AKS node count vs max           | Azure Monitor           | [AKS]                   | [>80% of max nodes]     | [=100% of max nodes]    | [Sev 2]        | [PagerDuty + Slack]   |
| AKS pod restart count           | Azure Monitor           | [AKS]                   | [>3 restarts in 15 min] | [>10 restarts in 15 min]| [Sev 2]        | [PagerDuty + Slack]   |
| SQL DTU/vCore utilization (%)   | Azure Monitor           | [SQL Database]          | [>70% for 15 min]       | [>90% for 5 min]        | [Sev 2]        | [PagerDuty + Slack]   |
| SQL storage utilization (%)     | Azure Monitor           | [SQL Database]          | [>75%]                  | [>90%]                  | [Sev 3]        | [Slack + Email]       |
| Storage account availability    | Azure Monitor           | [Storage Account]       | [<99.9%]                | [<99%]                  | [Sev 2]        | [PagerDuty + Slack]   |
| Service Bus dead-letter count   | Azure Monitor           | [Service Bus]           | [>10 messages]          | [>100 messages]         | [Sev 3]        | [Slack]               |
| Redis cache memory usage (%)    | Azure Monitor           | [Redis Cache]           | [>70%]                  | [>90%]                  | [Sev 2]        | [Slack]               |
| Redis cache hit ratio (%)       | Azure Monitor           | [Redis Cache]           | [<80%]                  | [<50%]                  | [Sev 3]        | [Slack]               |

### 4.3 Business Metrics

| Metric                          | Source                  | Normal Range            | Warning Threshold       | Critical Threshold      | Alert Severity | Notification Channel  |
|---------------------------------|-------------------------|-------------------------|-------------------------|-------------------------|----------------|-----------------------|
| User sign-in success rate       | Application Insights    | [>99%]                  | [<98%]                  | [<95%]                  | [Sev 1]        | [PagerDuty + Slack]   |
| Order completion rate           | Application Insights    | [>95%]                  | [<90%]                  | [<80%]                  | [Sev 1]        | [PagerDuty + Slack]   |
| [BUSINESS METRIC]               | [SOURCE]                | [NORMAL]                | [WARNING]               | [CRITICAL]              | [SEV]          | [CHANNEL]             |

---

## 5. Dashboard Inventory

| Dashboard Name                     | Tool               | URL                                        | Purpose                                | Audience              | Refresh Rate |
|------------------------------------|--------------------|--------------------------------------------|----------------------------------------|-----------------------|--------------|
| [System Health Overview]           | [Grafana]          | [https://grafana.company.com/d/health]     | [High-level system health]             | [SRE, Management]     | [30 seconds] |
| [Application Performance]         | [Application Insights] | [DIRECT LINK]                          | [APM: request rates, durations, errors]| [Developers, SRE]     | [Auto]       |
| [Infrastructure Metrics]          | [Grafana]          | [https://grafana.company.com/d/infra]      | [CPU, memory, disk, network for all resources] | [SRE]          | [30 seconds] |
| [AKS Cluster Health]              | [Grafana]          | [https://grafana.company.com/d/aks]        | [AKS node/pod health, resource usage]  | [SRE, DevOps]         | [30 seconds] |
| [Database Performance]            | [Azure Workbooks]  | [DIRECT LINK]                              | [SQL performance, DTU, query stats]    | [DBA, SRE]            | [5 minutes]  |
| [Business Metrics]                | [Grafana]          | [https://grafana.company.com/d/business]   | [Key business KPIs]                    | [Product, Management] | [1 minute]   |
| [Cost Dashboard]                  | [Azure Cost Management] | [Azure Portal > Cost Management]      | [Daily/monthly cost tracking]          | [Management, Finance] | [Daily]      |
| [SLO Dashboard]                   | [Grafana]          | [https://grafana.company.com/d/slo]        | [SLO burn rate, error budget]          | [SRE, Management]     | [1 minute]   |
| [DASHBOARD NAME]                  | [TOOL]             | [URL]                                      | [PURPOSE]                              | [AUDIENCE]            | [RATE]       |

---

## 6. Alert Rules

### 6.1 Alert Rules Table

| Alert Name                           | Condition                                          | Evaluation Window | Severity | Action Group            | Notification                 | Runbook Link                |
|--------------------------------------|----------------------------------------------------|-------------------|----------|-------------------------|-----------------------------|-----------------------------|
| [High Error Rate]                    | [Failed requests > 5% of total for 5 minutes]     | [5 min]           | [Sev 1]  | [ag-critical-alerts]    | [PagerDuty + Slack + Email] | [LINK TO RUNBOOK SECTION]   |
| [High Response Latency]             | [P95 response time > 3s for 5 minutes]            | [5 min]           | [Sev 2]  | [ag-warning-alerts]     | [PagerDuty + Slack]         | [LINK TO RUNBOOK SECTION]   |
| [AKS Pod CrashLoopBackOff]          | [Pod restart count > 5 in 15 minutes]             | [15 min]          | [Sev 2]  | [ag-warning-alerts]     | [PagerDuty + Slack]         | [LINK TO RUNBOOK SECTION]   |
| [SQL Database High DTU]             | [DTU > 90% for 10 minutes]                        | [10 min]          | [Sev 2]  | [ag-warning-alerts]     | [PagerDuty + Slack]         | [LINK TO RUNBOOK SECTION]   |
| [Health Check Failure]              | [Availability test fails 2 consecutive times]     | [5 min]           | [Sev 1]  | [ag-critical-alerts]    | [PagerDuty + Slack + Email] | [LINK TO RUNBOOK SECTION]   |
| [VM Unresponsive]                   | [Heartbeat missing for 5 minutes]                 | [5 min]           | [Sev 1]  | [ag-critical-alerts]    | [PagerDuty + Slack]         | [LINK TO RUNBOOK SECTION]   |
| [Service Bus Dead-Letter Growth]    | [Dead-letter count > 100]                          | [15 min]          | [Sev 3]  | [ag-info-alerts]        | [Slack]                     | [LINK TO RUNBOOK SECTION]   |
| [SSL Certificate Expiry]           | [Certificate expires within 14 days]              | [Daily]           | [Sev 3]  | [ag-info-alerts]        | [Slack + Email]             | [LINK TO RUNBOOK SECTION]   |
| [Budget 90% Threshold]             | [Spend > 90% of monthly budget]                   | [Daily]           | [Sev 3]  | [ag-cost-alerts]        | [Email]                     | [N/A]                       |
| [Azure Service Health Issue]        | [Impacting issue in used services/regions]        | [Real-time]       | [Sev 2]  | [ag-warning-alerts]     | [PagerDuty + Slack]         | [LINK TO DR RUNBOOK]        |
| [ALERT NAME]                        | [CONDITION]                                        | [WINDOW]          | [SEV]    | [ACTION GROUP]          | [NOTIFICATION]              | [LINK]                      |

### 6.2 Action Groups

| Action Group Name        | Notifications                                    | Actions                            |
|--------------------------|--------------------------------------------------|------------------------------------|
| [ag-critical-alerts]     | PagerDuty webhook, Slack #incidents, Email DL    | [Auto-scale trigger (if applicable)] |
| [ag-warning-alerts]      | PagerDuty webhook, Slack #alerts                 | [None]                              |
| [ag-info-alerts]         | Slack #alerts-info                               | [None]                              |
| [ag-cost-alerts]         | Email to finance + engineering leads             | [None]                              |
| [ag-security-alerts]     | PagerDuty webhook, Slack #security, Email SecOps | [None]                              |

---

## 7. Log Aggregation

### 7.1 Log Analytics Workspace Configuration

| Attribute                        | Value                                              |
|----------------------------------|----------------------------------------------------|
| Workspace Name                   | [log-app-prod-eus-001]                             |
| Workspace ID                     | [xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx]             |
| Resource Group                   | [rg-infra-prod-eus-001]                            |
| Region                           | [East US]                                          |
| Pricing Tier                     | [Pay-as-you-go / Commitment Tier 100GB/day]        |
| Data Retention                   | [90 days (hot) + Archive Tier for compliance]       |
| Daily Ingestion Cap              | [XX GB/day]                                        |
| Data Export (if applicable)      | [Export to Storage Account for long-term retention] |

### 7.2 Log Categories and Sources

| Log Source                    | Log Category                      | Destination              | Retention    | Purpose                           |
|-------------------------------|-----------------------------------|--------------------------|--------------|-----------------------------------|
| Application (App Insights)    | Traces, Exceptions, Requests      | Application Insights     | [90 days]    | Application debugging             |
| AKS                           | kube-apiserver, kube-controller   | Log Analytics            | [90 days]    | Kubernetes control plane logs     |
| AKS                           | Container stdout/stderr           | Log Analytics            | [30 days]    | Application container logs        |
| App Service                   | AppServiceHTTPLogs, AppServiceConsoleLogs | Log Analytics    | [90 days]    | HTTP request and application logs |
| Azure Functions               | FunctionAppLogs                   | Log Analytics            | [90 days]    | Function execution logs           |
| Azure SQL Database            | SQLSecurityAuditEvents            | Log Analytics            | [365 days]   | Security auditing                 |
| Azure SQL Database            | QueryStoreRuntimeStatistics       | Log Analytics            | [90 days]    | Query performance analysis        |
| Key Vault                     | AuditEvent                        | Log Analytics            | [365 days]   | Secret access auditing            |
| NSG Flow Logs                 | NetworkSecurityGroupFlowEvent     | Storage + Log Analytics  | [90 days]    | Network traffic analysis          |
| Activity Log                  | Administrative, Security, Alert   | Log Analytics            | [365 days]   | Azure control plane auditing      |
| [SOURCE]                      | [CATEGORY]                        | [DESTINATION]            | [RETENTION]  | [PURPOSE]                         |

### 7.3 Key Log Queries (KQL)

**Recent application errors:**
```kql
// Application errors in the last hour
exceptions
| where timestamp > ago(1h)
| summarize count() by problemId, outerMessage
| order by count_ desc
| take 20
```

**Slow requests:**
```kql
// Requests slower than 3 seconds in the last hour
requests
| where timestamp > ago(1h)
| where duration > 3000
| summarize count(), avg(duration), percentile(duration, 95) by name
| order by count_ desc
```

**Failed dependency calls:**
```kql
// Failed dependency calls in the last hour
dependencies
| where timestamp > ago(1h)
| where success == false
| summarize count() by target, type, resultCode
| order by count_ desc
```

---

## 8. Distributed Tracing

| Attribute                        | Value                                           |
|----------------------------------|-------------------------------------------------|
| Tracing Provider                 | [Application Insights SDK / OpenTelemetry]      |
| Correlation Header               | [W3C TraceContext (traceparent)]                |
| Instrumentation                  | [Auto-instrumentation + custom spans]           |
| Sampling Rate (Production)       | [100% for errors, 10% for successful requests]  |
| Cross-service Correlation        | [Application Map in Application Insights]       |

### Distributed Tracing Architecture

| Service               | Instrumentation Method              | Exports To              |
|-----------------------|-------------------------------------|-------------------------|
| [Web Frontend]        | [Application Insights JavaScript SDK] | [Application Insights]|
| [API (AKS)]           | [OpenTelemetry SDK + AI Exporter]    | [Application Insights] |
| [Background Jobs]    | [Application Insights SDK]           | [Application Insights] |
| [Legacy Service (VM)]| [Application Insights Agent]         | [Application Insights] |

---

## 9. Synthetic Monitoring / Health Checks

### 9.1 Availability Tests (Application Insights)

| Test Name                    | Type           | URL                                  | Frequency | Locations                    | Success Criteria           | Alert On Failure |
|------------------------------|----------------|--------------------------------------|-----------|------------------------------|----------------------------|------------------|
| [Prod - Homepage]            | [URL Ping]     | [https://app.company.com]            | [5 min]   | [5 global locations]         | [HTTP 200, <3s response]   | [Yes - Sev 1]    |
| [Prod - API Health]          | [URL Ping]     | [https://api.company.com/health]     | [5 min]   | [5 global locations]         | [HTTP 200, JSON body valid] | [Yes - Sev 1]   |
| [Prod - Login Flow]          | [Multi-step]   | [https://app.company.com/login]      | [15 min]  | [3 locations]                | [Full flow completes <10s] | [Yes - Sev 2]    |
| [Staging - Health]           | [URL Ping]     | [https://staging.company.com/health] | [10 min]  | [2 locations]                | [HTTP 200]                 | [Yes - Sev 3]    |
| [TEST NAME]                  | [TYPE]         | [URL]                                | [FREQ]    | [LOCATIONS]                  | [CRITERIA]                 | [ALERT]          |

### 9.2 Custom Health Check Endpoints

| Endpoint                         | Checks Performed                                              | Expected Response         |
|----------------------------------|---------------------------------------------------------------|---------------------------|
| [/health]                        | [Application process running]                                 | `{"status":"healthy"}`    |
| [/health/ready]                  | [All dependencies reachable: DB, cache, queue]                | `{"status":"ready","dependencies":{...}}` |
| [/health/live]                   | [Process alive, basic memory check]                           | `{"status":"alive"}`      |

---

## 10. Alert Noise Reduction Strategy

### 10.1 Alert Fatigue Prevention

| Strategy                              | Implementation                                              |
|---------------------------------------|-------------------------------------------------------------|
| Severity-based routing                | [Only Sev 1/2 page on-call; Sev 3/4 go to Slack only]      |
| Alert grouping                        | [Group related alerts by resource group or service]          |
| Alert suppression during maintenance  | [Suppress alerts during planned maintenance windows]        |
| Alert deduplication                   | [Deduplicate repeated alerts within 15-minute window]       |
| Dynamic thresholds                    | [Use Azure Monitor dynamic thresholds where applicable]     |
| Minimum evaluation window             | [No alerts on single data point; minimum 5-minute window]   |
| Regular alert review                  | [Monthly review of alert noise: snooze, tune, or delete]    |

### 10.2 Alert Review Metrics

| Metric                               | Target                  | Current            |
|---------------------------------------|-------------------------|--------------------|
| Alerts per on-call shift              | [<5]                    | [CURRENT VALUE]    |
| Percentage of actionable alerts       | [>90%]                  | [CURRENT VALUE]    |
| Mean time to acknowledge (MTTA)       | [<5 minutes for Sev 1]  | [CURRENT VALUE]   |
| Alert-to-incident ratio              | [>50%]                  | [CURRENT VALUE]    |

---

## 11. SLA Monitoring and Reporting

| Attribute                        | Value                                                   |
|----------------------------------|---------------------------------------------------------|
| SLA Monitoring Tool              | [Grafana SLO dashboard / Azure Monitor SLI queries]     |
| SLA Reporting Frequency          | [Monthly]                                               |
| SLA Report Audience              | [Engineering, Product, Executive]                       |
| SLA Report Location              | [Confluence page / Shared Drive]                        |
| Error Budget Tracking            | [Grafana dashboard with burn-rate alerts]               |

### SLA Monitoring Queries

```kql
// Monthly availability calculation
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

| Date           | Author            | Changes Made                              |
|----------------|-------------------|-------------------------------------------|
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [Initial document creation]               |
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [DESCRIPTION OF CHANGES]                  |
