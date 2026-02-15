# Monitoring and Alerting

| **Metadata**     | **Value**                                                    |
|------------------|--------------------------------------------------------------|
| Page Title       | M365 Security Assessment Automation - Monitoring & Alerting  |
| Last Updated     | 2026-02-15                                                   |
| Status           | `CURRENT`                                                    |
| Owner            | Lead Developer / Security Operations                         |
| Reviewers        | Security Consultant Lead, Engineering Manager                |
| Version          | 1.0                                                          |

---

## 1. Document Purpose

This document describes the monitoring, logging, and alerting capabilities for the M365-SecurityAssessment PowerShell module. Because this is a locally executed tool (not a hosted service), traditional server monitoring and infrastructure alerting do not apply. Instead, this document covers assessment execution monitoring, structured log analysis, health checks, and recommendations for future observability improvements.

---

## 2. Monitoring Scope

### 2.1 What This Tool Does NOT Require

| Traditional Monitoring Area | Applicability | Rationale |
|-----------------------------|---------------|-----------|
| Server uptime monitoring | `NOT APPLICABLE` | No server infrastructure; the tool runs on consultant workstations |
| CPU / Memory / Disk alerting | `NOT APPLICABLE` | Local execution on workstation; no persistent process to monitor |
| Network throughput monitoring | `NOT APPLICABLE` | Outbound API calls only; no inbound traffic to manage |
| Load balancer health checks | `NOT APPLICABLE` | No load balancer; single-user local execution |
| Database replication monitoring | `NOT APPLICABLE` | SQLite is a local embedded database with no replication |
| Container / Pod health | `NOT APPLICABLE` | No containerized deployment |

### 2.2 What IS Monitored

| Monitoring Area | Method | Details |
|-----------------|--------|---------|
| Assessment execution progress | Console output + dashboard polling | Real-time color-coded console messages; Pode dashboard polls assessment state |
| Assessment errors and warnings | JSONL structured logs | Every error and warning is written to the engagement log file with full context |
| API connectivity health | Connection test on `Connect-AssessmentTenant` | Validates Graph API, Exchange Online, and Teams connectivity before assessment starts |
| Module dependency health | Import-time verification | Module manifest validates required dependencies on `Import-Module` |
| Checkpoint state | Checkpoint file monitoring | `checkpoint.json` records progress for resume capability |

---

## 3. Assessment Execution Monitoring

### 3.1 Console Output (Real-Time)

The assessment engine (via `engine/Logger.ps1`) writes color-coded messages to the console during execution.

| Console Color | Log Level | Meaning | Example |
|---------------|-----------|---------|---------|
| Green | INFO | Normal operation; progress updates | `[INFO] Running collector: Get-ConditionalAccessPolicies` |
| Yellow | WARNING | Non-fatal issue; assessment continues | `[WARNING] PIM data unavailable - tenant may lack P2 license` |
| Red | ERROR | Failed operation; check or collector could not complete | `[ERROR] Graph API returned 403 for /policies/conditionalAccessPolicies` |
| White/Default | DEBUG | Verbose diagnostic output (when enabled) | `[DEBUG] Retrieved 47 conditional access policies` |

### 3.2 Dashboard Progress Monitoring

When using the Pode web dashboard (`Start-Dashboard`), the assessment progress page provides:

| Dashboard Element | Update Frequency | Details |
|-------------------|------------------|---------|
| Overall progress bar | Polls every 5 seconds | Percentage of total checks completed across all selected modules |
| Module status cards | Polls every 5 seconds | Per-module status: `Pending`, `Running`, `Complete`, `Failed` |
| Finding count summary | Polls every 5 seconds | Running count of findings by severity (Critical, High, Medium, Low, Informational) |
| Live log stream | Polls every 3 seconds | Scrolling display of recent log entries from the assessment JSONL log |
| Error alert banner | On error detection | Red banner displayed when an ERROR-level event is logged |

### 3.3 Checkpoint Monitoring

The orchestrator writes checkpoint data at the completion of each check within a module.

| Checkpoint Data | Purpose |
|-----------------|---------|
| `currentModule` | Which assessment module is currently executing |
| `completedModules` | List of modules that have finished |
| `completedChecks` | List of check function names that have completed within the current module |
| `completedCollectors` | List of collector function names that have completed |
| `timestamp` | ISO 8601 timestamp of the last checkpoint write |
| `findingsCount` | Running total of findings generated so far |

---

## 4. Structured Log Analysis

### 4.1 Log Format

All assessment logs use JSON Lines (JSONL) format. Each line is a self-contained JSON object.

**Log file location:** `output/{engagement}/logs/assessment_{timestamp}.jsonl`

**Log entry schema:**

```json
{
  "timestamp": "2026-02-15T14:30:22.456Z",
  "level": "INFO",
  "module": "EntraID",
  "function": "Check-ConditionalAccessMFA",
  "message": "Evaluated 47 Conditional Access policies for MFA enforcement",
  "context": {
    "policiesEvaluated": 47,
    "compliant": 42,
    "nonCompliant": 5,
    "duration_ms": 1234
  }
}
```

### 4.2 Log Levels

| Level | Numeric Value | Usage | Action Required |
|-------|---------------|-------|-----------------|
| DEBUG | 0 | Verbose diagnostic output; API call details, data counts, intermediate results | No action; used for development troubleshooting. Enable with `-Verbose` flag |
| INFO | 1 | Normal operational messages; progress updates, collector/check start/complete, summary statistics | No action; confirms normal execution |
| WARNING | 2 | Non-fatal issues; degraded functionality, skipped checks, license limitations, deprecated API usage | Review after assessment; may indicate incomplete coverage. Document in assessment notes |
| ERROR | 3 | Failed operations; authentication failures, API errors that could not be retried, collector/check failures | Investigate immediately. May require re-running affected module or entire assessment |

### 4.3 Log Analysis Procedures

#### Reviewing a Completed Assessment Log

```powershell
# View all errors from an assessment
Get-Content "output/ClientA_Q1/logs/assessment_20260215_143022.jsonl" |
    ConvertFrom-Json |
    Where-Object { $_.level -eq "ERROR" } |
    Format-Table timestamp, module, function, message -AutoSize

# View warnings for a specific module
Get-Content "output/ClientA_Q1/logs/assessment_20260215_143022.jsonl" |
    ConvertFrom-Json |
    Where-Object { $_.level -eq "WARNING" -and $_.module -eq "EntraID" } |
    Format-Table timestamp, function, message -AutoSize

# Count events by level
Get-Content "output/ClientA_Q1/logs/assessment_20260215_143022.jsonl" |
    ConvertFrom-Json |
    Group-Object level |
    Select-Object Name, Count
```

#### Key Patterns to Look For

| Pattern | Log Query | Indicates |
|---------|-----------|-----------|
| Repeated 429 errors | `level -eq "WARNING" -and message -like "*429*"` | Aggressive throttling from Microsoft Graph; consider spacing assessment runs |
| Authentication errors mid-assessment | `level -eq "ERROR" -and message -like "*token*"` | Token expired during long assessment; may need to reconnect |
| Collector returning null | `level -eq "WARNING" -and message -like "*returned no data*"` | API permission missing or feature not configured in tenant |
| Check duration outliers | `context.duration_ms -gt 30000` | Slow API response; potential throttling or large dataset |

---

## 5. Health Checks

### 5.1 Pre-Assessment Health Checks

These checks are performed automatically when `Connect-AssessmentTenant` is called.

| Health Check | What It Validates | Pass Criteria | Failure Behavior |
|--------------|-------------------|---------------|------------------|
| Graph API connectivity | OAuth token acquisition and test API call (`/organization`) | HTTP 200 response with valid organization data | Assessment blocked; ERROR logged with remediation guidance |
| Exchange Online connectivity | `Connect-ExchangeOnline` session establishment | Session created without error | Exchange-dependent modules skipped; WARNING logged |
| Teams connectivity | `Connect-MicrosoftTeams` session establishment | Session created without error | Teams-dependent modules skipped; WARNING logged |
| Permission validation | Test calls to key endpoints used by each module | HTTP 200 on permission-sensitive endpoints | WARNING logged per inaccessible endpoint; affected checks report `UnableToAssess` |

### 5.2 Module Import Health Checks

Performed automatically when `Import-Module M365-SecurityAssessment` is executed.

| Health Check | What It Validates | Pass Criteria | Failure Behavior |
|--------------|-------------------|---------------|------------------|
| PowerShell version | `$PSVersionTable.PSVersion` meets minimum requirement | Version >= 5.1 | Module fails to import with descriptive error |
| Required module availability | Each dependency module is available via `Get-Module -ListAvailable` | All required modules found | Warning per missing module; functions that require the missing module will fail at runtime |
| SQLite database integrity | Controls database file exists and is readable | `controls.db` opens without corruption | Module recreates the database from source definitions if missing or corrupt |
| Configuration files | `findings.json`, `assessment-defaults.json`, `logic-definitions.json` present and parseable | Valid JSON in each file | Module fails to import if critical configuration is missing |

### 5.3 Runtime Health Checks

Performed during assessment execution.

| Health Check | Trigger | Pass Criteria | Failure Behavior |
|--------------|---------|---------------|------------------|
| Token validity | Before each collector batch | Token has > 5 minutes remaining before expiry | Automatic token refresh; if refresh fails, checkpoint is saved and assessment pauses |
| API rate limit headroom | After each API call | `Retry-After` header not present or remaining quota > 10% | Automatic backoff with exponential delay; logged as WARNING |
| Disk space | Before report generation | > 100 MB free on output drive | WARNING logged; report generation may fail if disk is full |
| Checkpoint write | After each completed check | Checkpoint file writes successfully | ERROR logged; assessment continues but resume capability is degraded |

---

## 6. Alerting

### 6.1 Current Alerting Capabilities

Because M365-SecurityAssessment is a locally executed PowerShell tool, there is no automated alerting infrastructure. All alerting is manual and console-based.

| Alert Mechanism | Description | Scope |
|-----------------|-------------|-------|
| Console color-coded output | Red text for ERROR-level events; yellow for WARNING | Real-time during CLI execution |
| Dashboard error banner | Red alert banner on the web dashboard when errors occur | Real-time during dashboard-based execution |
| Assessment summary | Post-run summary includes error/warning counts and affected modules | End of assessment run |
| Log file review | Manual review of JSONL logs for patterns and anomalies | Post-assessment |

### 6.2 No Automated Alerting Infrastructure

| Capability | Status | Rationale |
|------------|--------|-----------|
| Email alerts | `NOT IMPLEMENTED` | No mail server; local tool with console-based feedback |
| PagerDuty / Opsgenie integration | `NOT APPLICABLE` | No on-call rotation for a local assessment tool |
| Slack / Teams webhook alerts | `NOT IMPLEMENTED` | Possible future enhancement for long-running assessments |
| SIEM integration | `NOT IMPLEMENTED` | JSONL logs are SIEM-compatible in format but no forwarding is configured |

---

## 7. Recommended Improvements

The following improvements are recommended for future development to enhance operational observability.

| # | Improvement | Priority | Effort | Benefit |
|---|-------------|----------|--------|---------|
| 1 | **Log aggregation for multi-engagement tracking** | Medium | Medium | Centralized view of assessment outcomes across all client engagements; trend analysis for recurring issues |
| 2 | **Assessment completion notification** | Low | Low | Optional desktop notification (Windows toast) or email when a long-running assessment completes |
| 3 | **SIEM-compatible log forwarding** | Low | Medium | Forward JSONL logs to a SIEM for centralized analysis alongside other IntelliSec operational data |
| 4 | **Assessment metrics dashboard** | Medium | High | Historical dashboard showing assessment duration trends, error rates, and finding distributions across all engagements |
| 5 | **Automated log analysis on completion** | Medium | Low | Post-assessment script that parses the JSONL log and generates a summary of errors, warnings, and performance outliers |
| 6 | **Health check pre-flight report** | High | Low | Standalone `Test-AssessmentReadiness` function that runs all health checks and produces a pass/fail report before starting an assessment |

---

## 8. Approval and Sign-Off

| Role | Name | Date | Signature / Approval |
|------|------|------|----------------------|
| Lead Developer | ___________________ | __________ | [ ] Approved |
| Security Consultant Lead | ___________________ | __________ | [ ] Approved |
| Engineering Manager | ___________________ | __________ | [ ] Approved |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | Lead Developer | Initial monitoring and alerting documentation adapted for local PowerShell tool |
