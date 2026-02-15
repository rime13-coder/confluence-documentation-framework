# Incident Response Plan

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Incident Response Plan             |
| Last Updated     | [YYYY-MM-DD]                       |
| Status           | [Draft / In Review / Approved]     |
| Owner            | [TEAM OR INDIVIDUAL NAME]          |

---

## 1. Document Purpose

This document defines the incident response process for the [PROJECT NAME] platform. It establishes severity definitions, roles, communication procedures, escalation paths, and post-mortem practices to ensure incidents are detected, triaged, resolved, and learned from in a structured and consistent manner.

---

## 2. Incident Severity Definitions

| Severity | Name       | Definition                                                        | Examples                                                                  | Response Time  | Update Frequency   | Bridge Call Required |
|----------|------------|-------------------------------------------------------------------|---------------------------------------------------------------------------|----------------|--------------------|----------------------|
| SEV 1    | Critical   | Complete service outage or data loss affecting all users          | - Production is completely down<br>- Data breach confirmed<br>- Database corruption affecting all users | 15 minutes     | Every 30 minutes   | Yes                  |
| SEV 2    | Major      | Major feature unavailable or significant performance degradation  | - Payment processing down<br>- API error rate >10%<br>- Response times >10x normal | 30 minutes     | Every 60 minutes   | Yes (optional)       |
| SEV 3    | Minor      | Minor feature issue or moderate performance degradation           | - Non-critical feature broken<br>- Response times 2-3x normal<br>- Single background job failing | 2 hours        | Every 4 hours      | No                   |
| SEV 4    | Low        | Cosmetic or informational issue with no user impact               | - Minor UI glitch<br>- Log noise increase<br>- Non-critical alert firing | Next business day | Daily             | No                   |

### Severity Determination Flowchart

```
Is there a security breach or data loss?
  YES -> SEV 1
  NO  -> Continue

Are all/most users unable to use the system?
  YES -> SEV 1
  NO  -> Continue

Is a major feature (revenue-impacting) unavailable?
  YES -> SEV 2
  NO  -> Continue

Is there measurable performance degradation or a minor feature outage?
  YES -> SEV 3
  NO  -> SEV 4
```

---

## 3. Incident Response Process Flow

### 3.1 Process Overview

```
DETECT          TRIAGE          CONTAIN         RESOLVE         POST-MORTEM
  |                |                |               |                |
  v                v                v               v                v
Alert fires    Assess severity   Stop bleeding   Fix root cause   Blameless
or report      Assign roles      Limit blast     Deploy fix       retrospective
received       Open bridge       radius          Verify fix       Action items
               Communicate       Mitigate        Communicate      Improve process
                                                 resolution
```

### 3.2 Detailed Process Steps

#### Phase 1: Detect (Target: <5 minutes)

| Step | Action                                                    | Responsible        |
|------|-----------------------------------------------------------|--------------------|
| 1.1  | Alert fires from monitoring or user reports issue         | Automated / Anyone |
| 1.2  | On-call engineer acknowledges the alert                   | On-Call Engineer   |
| 1.3  | On-call engineer performs initial assessment               | On-Call Engineer   |

#### Phase 2: Triage (Target: <15 minutes for SEV 1/2)

| Step | Action                                                    | Responsible          |
|------|-----------------------------------------------------------|----------------------|
| 2.1  | Determine severity level using definitions above          | On-Call Engineer     |
| 2.2  | Create incident ticket in [TICKETING SYSTEM]              | On-Call Engineer     |
| 2.3  | Post in [#incident-channel] with initial details          | On-Call Engineer     |
| 2.4  | For SEV 1/2: Page Incident Commander                      | On-Call Engineer     |
| 2.5  | For SEV 1/2: Open bridge call / war room                  | Incident Commander   |
| 2.6  | Assign incident roles (see Section 4)                     | Incident Commander   |
| 2.7  | Send initial notification to stakeholders                  | Communications Lead  |

#### Phase 3: Contain (Target: <30 minutes for SEV 1)

| Step | Action                                                    | Responsible        |
|------|-----------------------------------------------------------|--------------------|
| 3.1  | Identify blast radius (what is affected and what is not)  | Technical Lead     |
| 3.2  | Implement immediate mitigation (scale, restart, rollback) | Technical Lead     |
| 3.3  | Verify containment is effective                           | Technical Lead     |
| 3.4  | Update stakeholders on containment status                 | Communications Lead|

#### Phase 4: Resolve (Target: within RTO)

| Step | Action                                                    | Responsible        |
|------|-----------------------------------------------------------|--------------------|
| 4.1  | Identify root cause (or sufficient cause for resolution)  | Technical Lead     |
| 4.2  | Develop and test fix                                       | Engineering Team   |
| 4.3  | Deploy fix to production                                   | Engineering Team   |
| 4.4  | Verify fix resolves the issue                              | QA / SRE           |
| 4.5  | Monitor for recurrence (minimum 30 minutes)                | On-Call Engineer   |
| 4.6  | Declare incident resolved                                  | Incident Commander |
| 4.7  | Send resolution notification to stakeholders               | Communications Lead|
| 4.8  | Close incident ticket                                      | Incident Commander |

#### Phase 5: Post-Mortem (Target: within 48 hours)

| Step | Action                                                    | Responsible          |
|------|-----------------------------------------------------------|----------------------|
| 5.1  | Schedule blameless post-mortem within 48 hours            | Incident Commander   |
| 5.2  | Prepare incident timeline                                  | Technical Lead       |
| 5.3  | Conduct post-mortem meeting                                | Incident Commander   |
| 5.4  | Document findings and action items                         | All participants     |
| 5.5  | Publish post-mortem document                               | Incident Commander   |
| 5.6  | Track action items to completion                           | Team leads           |

---

## 4. Roles During Incidents

### 4.1 Role Definitions

| Role                  | Responsibilities                                                                      | Assigned To                     |
|-----------------------|---------------------------------------------------------------------------------------|---------------------------------|
| **Incident Commander (IC)** | Owns the incident end-to-end. Makes decisions on severity, escalation, and resolution strategy. Keeps the process moving. Does NOT debug. | [SRE Lead / Engineering Manager rotation] |
| **Technical Lead**    | Leads the technical investigation and resolution. Coordinates the engineering response. Communicates technical details to the IC. | [Senior engineer most familiar with affected system] |
| **Communications Lead** | Manages all internal and external communications. Posts updates on schedule. Updates status page. | [Product Manager / Designated rotation] |
| **Scribe**            | Documents the incident timeline in real-time. Records decisions, actions, and findings. | [Any available team member]     |
| **Subject Matter Expert (SME)** | Provides specialized knowledge (DBA, networking, security, specific service owner). Assists the Technical Lead. | [As needed -- paged by IC]     |

### 4.2 Incident Commander Rotation

| Week Of          | Primary IC             | Backup IC              |
|------------------|------------------------|------------------------|
| [YYYY-MM-DD]     | [NAME]                 | [NAME]                 |
| [YYYY-MM-DD]     | [NAME]                 | [NAME]                 |
| [YYYY-MM-DD]     | [NAME]                 | [NAME]                 |
| [YYYY-MM-DD]     | [NAME]                 | [NAME]                 |

---

## 5. Communication During Incidents

### 5.1 Communication Channels

| Channel                    | Purpose                                          | Audience                  |
|----------------------------|--------------------------------------------------|---------------------------|
| [Slack #incident-active]   | Real-time incident coordination                  | Incident team             |
| [Bridge call / Teams meeting] | Voice coordination for SEV 1/2                | Incident team             |
| [Slack #incidents-announce] | Broadcast updates to wider engineering team      | All engineering           |
| [Status page]              | External customer-facing updates                 | Customers                 |
| [Email DL: incident-updates@company.com] | Formal updates to stakeholders      | Executives, support       |

### 5.2 Communication Templates

#### SEV 1 -- Initial Notification (Internal)

```
INCIDENT DECLARED: SEV 1 -- [BRIEF DESCRIPTION]

Detected: [TIME UTC]
Impact: [WHAT IS BROKEN AND WHO IS AFFECTED]
Current Status: Investigating
Incident Commander: [NAME]
Technical Lead: [NAME]
Bridge: [MEETING LINK / PHONE NUMBER]

Next update in 30 minutes.
```

#### SEV 1 -- Initial Notification (External / Status Page)

```
[SERVICE NAME] -- Investigating Service Disruption

We are currently investigating reports of [BRIEF DESCRIPTION OF IMPACT].
Our team has been mobilized and is actively working on resolution.

Impact: [CUSTOMER-FACING IMPACT DESCRIPTION]
Status: Investigating
Started: [TIME UTC]

Next update: [TIME UTC]
```

#### SEV 2 -- Initial Notification (Internal)

```
INCIDENT: SEV 2 -- [BRIEF DESCRIPTION]

Detected: [TIME UTC]
Impact: [WHAT IS DEGRADED AND WHO IS AFFECTED]
Current Status: Investigating
Lead: [NAME]
Channel: #incident-active

Next update in 60 minutes.
```

#### Update Template (All Severities)

```
INCIDENT UPDATE #[N] -- SEV [X] -- [BRIEF DESCRIPTION]

Time: [TIME UTC]
Status: [Investigating / Identified / Mitigating / Resolved]
Actions Taken: [WHAT HAS BEEN DONE SINCE LAST UPDATE]
Current Impact: [REMAINING IMPACT]
Next Steps: [WHAT THE TEAM IS DOING NEXT]
ETA: [ESTIMATED TIME TO RESOLUTION, or "Unknown"]

Next update at [TIME UTC].
```

#### Resolution Template

```
INCIDENT RESOLVED -- SEV [X] -- [BRIEF DESCRIPTION]

Resolved: [TIME UTC]
Duration: [TOTAL DURATION]
Impact Summary: [WHAT WAS IMPACTED]
Resolution: [WHAT FIXED THE ISSUE]
Data Loss: [None / DESCRIPTION]

A post-mortem will be conducted within 48 hours.
Post-mortem document: [LINK]
```

---

## 6. War Room / Bridge Call Procedures

### 6.1 Bridge Call Setup

| Attribute                 | Value                                                 |
|---------------------------|-------------------------------------------------------|
| Bridge Call Tool          | [Microsoft Teams / Zoom / Google Meet]                |
| Standing Bridge Link      | [PERMANENT MEETING LINK FOR INCIDENTS]                |
| Dial-in Number            | [+1-XXX-XXX-XXXX, PIN: XXXXXX]                       |
| Recording                 | [Enabled by default for SEV 1]                        |

### 6.2 Bridge Call Etiquette

- Incident Commander opens and runs the bridge
- Mute when not speaking
- Identify yourself before speaking
- Keep discussion focused on resolution, not blame
- All decisions are made by the Incident Commander
- If you are not actively contributing, leave the bridge and follow updates in Slack
- The IC may ask people to leave if the bridge becomes too crowded

---

## 7. Incident Tracking

| Attribute                    | Value                                               |
|------------------------------|-----------------------------------------------------|
| Incident Tracking Tool       | [Azure DevOps / PagerDuty / ServiceNow / Jira]      |
| Incident Ticket Prefix       | [INC-]                                              |
| Ticket Required For          | [All SEV 1, SEV 2, and SEV 3 incidents]             |
| Fields Required              | [Severity, Timeline, Root Cause, Resolution, Action Items] |
| Ticket Lifecycle             | [Open -> Investigating -> Mitigating -> Resolved -> Post-Mortem Complete -> Closed] |
| Archive Location             | [Confluence space / Wiki page for all post-mortems]  |

---

## 8. Post-Mortem / Blameless Retrospective Template

### Incident Post-Mortem: [INC-XXXX] -- [INCIDENT TITLE]

| Attribute          | Value                                     |
|--------------------|-------------------------------------------|
| Incident ID        | [INC-XXXX]                                |
| Severity           | [SEV X]                                   |
| Date               | [YYYY-MM-DD]                              |
| Duration           | [X hours Y minutes]                       |
| Incident Commander | [NAME]                                    |
| Technical Lead     | [NAME]                                    |
| Post-Mortem Author | [NAME]                                    |
| Post-Mortem Date   | [YYYY-MM-DD]                              |
| Status             | [Draft / Reviewed / Final]                |

#### Impact Summary

| Impact Area                | Details                                    |
|----------------------------|--------------------------------------------|
| Users affected             | [NUMBER or percentage]                     |
| Revenue impact             | [Estimated $X,XXX or N/A]                 |
| Data loss                  | [None / DESCRIPTION]                       |
| SLA impact                 | [SLA breached: Yes/No, error budget consumed: X%] |
| Customer tickets generated | [NUMBER]                                   |

#### Timeline

| Time (UTC)    | Event                                                         | Actor              |
|---------------|---------------------------------------------------------------|-------------------|
| [HH:MM]       | [First sign of issue in monitoring]                           | [Automated]       |
| [HH:MM]       | [Alert fired]                                                 | [Azure Monitor]   |
| [HH:MM]       | [On-call acknowledged alert]                                  | [NAME]            |
| [HH:MM]       | [Incident declared as SEV X]                                  | [NAME]            |
| [HH:MM]       | [Bridge call opened]                                          | [NAME]            |
| [HH:MM]       | [Root cause identified: DESCRIPTION]                          | [NAME]            |
| [HH:MM]       | [Mitigation applied: DESCRIPTION]                             | [NAME]            |
| [HH:MM]       | [Fix deployed to production]                                  | [NAME]            |
| [HH:MM]       | [Incident resolved, services restored]                        | [NAME]            |

#### Root Cause

[DETAILED TECHNICAL EXPLANATION of what caused the incident. Be specific -- code changes, configuration errors, infrastructure failures, capacity issues, etc.]

#### Contributing Factors

- [FACTOR 1: e.g., Missing alert for the specific failure mode]
- [FACTOR 2: e.g., Test coverage did not cover this edge case]
- [FACTOR 3: e.g., Runbook was outdated for this scenario]
- [FACTOR 4: e.g., No circuit breaker on the failing dependency]

#### What Went Well

- [POSITIVE 1: e.g., Alert fired within 2 minutes of the issue starting]
- [POSITIVE 2: e.g., Team assembled quickly and communicated well]
- [POSITIVE 3: e.g., Rollback procedure worked as documented]

#### What Could Be Improved

- [IMPROVEMENT 1: e.g., Detection time could be faster with additional metrics]
- [IMPROVEMENT 2: e.g., Communication to customers was delayed]
- [IMPROVEMENT 3: e.g., Runbook did not cover this specific scenario]

#### Action Items

| # | Action Item                                    | Owner            | Priority   | Due Date       | Status          | Ticket Link     |
|---|------------------------------------------------|------------------|------------|----------------|-----------------|-----------------|
| 1 | [Add monitoring for SPECIFIC_CONDITION]        | [NAME]           | [P1]       | [YYYY-MM-DD]   | [Open]          | [JIRA-XXX]      |
| 2 | [Add circuit breaker to DEPENDENCY]            | [NAME]           | [P1]       | [YYYY-MM-DD]   | [Open]          | [JIRA-XXX]      |
| 3 | [Update runbook with new procedure]            | [NAME]           | [P2]       | [YYYY-MM-DD]   | [Open]          | [JIRA-XXX]      |
| 4 | [Add integration test for edge case]           | [NAME]           | [P2]       | [YYYY-MM-DD]   | [Open]          | [JIRA-XXX]      |
| 5 | [ACTION]                                       | [NAME]           | [PRIORITY] | [DATE]         | [STATUS]        | [LINK]          |

#### Lessons Learned

- [LESSON 1: Key takeaway that should be shared broadly]
- [LESSON 2: Process improvement identified]
- [LESSON 3: Technical lesson applicable to other services]

---

## 9. Incident Metrics

### 9.1 Metrics Tracked

| Metric                                  | Definition                                                  | Target                | Current        |
|-----------------------------------------|-------------------------------------------------------------|-----------------------|----------------|
| MTTD (Mean Time to Detect)              | Time from incident start to first alert                     | [<5 minutes]          | [XX minutes]   |
| MTTA (Mean Time to Acknowledge)         | Time from alert to human acknowledgment                     | [<5 minutes (SEV1)]   | [XX minutes]   |
| MTTR (Mean Time to Resolve)             | Time from incident start to resolution                      | [<1 hour (SEV1)]      | [XX minutes]   |
| MTBF (Mean Time Between Failures)       | Average time between SEV 1/2 incidents                      | [>30 days]            | [XX days]      |
| Incidents per month (by severity)       | Count of incidents in each severity category                | [SEV1: 0, SEV2: <2]   | [X, Y]        |
| Post-mortem completion rate             | Percentage of SEV 1/2 incidents with completed post-mortems | [100%]                | [XX%]          |
| Action item completion rate             | Percentage of post-mortem action items completed on time    | [>90%]                | [XX%]          |

### 9.2 Incident Reporting

| Report                    | Frequency  | Audience                     | Owner              |
|---------------------------|------------|------------------------------|--------------------|
| Weekly Incident Summary   | Weekly     | Engineering team              | SRE Lead           |
| Monthly Incident Report   | Monthly    | Engineering + Product         | SRE Lead           |
| Quarterly Incident Review | Quarterly  | Engineering + Executives      | VP Engineering     |

---

## 10. Revision History

| Date           | Author            | Changes Made                              |
|----------------|-------------------|-------------------------------------------|
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [Initial document creation]               |
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [DESCRIPTION OF CHANGES]                  |
