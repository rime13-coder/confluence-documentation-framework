# Stakeholders & RACI Matrix

| **Page Title**   | [PROJECT_NAME] - Stakeholders & RACI Matrix |
|------------------|----------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                                 |
| **Status**       | NOT STARTED                                  |
| **Owner**        | [OWNER_NAME]                                 |

---

## 1. Stakeholder Registry

Identify all stakeholders with influence over or interest in the project. Update this table as the team evolves.

**Interest Level:** Low / Medium / High
**Influence Level:** Low / Medium / High

| Name | Role | Organization / Team | Email | Phone | Interest Level | Influence Level | Notes |
|------|------|---------------------|-------|-------|----------------|-----------------|-------|
| [NAME] | Executive Sponsor | [ORG] | [EMAIL] | [PHONE] | High | High | Final budget and scope authority |
| [NAME] | Project Manager | [ORG] | [EMAIL] | [PHONE] | High | High | Day-to-day project decisions |
| [NAME] | Product Owner | [ORG] | [EMAIL] | [PHONE] | High | High | Requirements prioritization |
| [NAME] | Lead Architect | [ORG] | [EMAIL] | [PHONE] | High | High | Azure architecture decisions |
| [NAME] | Tech Lead / Dev Lead | [ORG] | [EMAIL] | [PHONE] | High | Medium | Development execution |
| [NAME] | DevOps / Platform Engineer | [ORG] | [EMAIL] | [PHONE] | High | Medium | GitHub Actions CI/CD, Azure infrastructure |
| [NAME] | Security Lead / CISO Rep | [ORG] | [EMAIL] | [PHONE] | Medium | High | Security review and compliance sign-off |
| [NAME] | QA Lead | [ORG] | [EMAIL] | [PHONE] | High | Medium | Test strategy and sign-off |
| [NAME] | Business Analyst | [ORG] | [EMAIL] | [PHONE] | High | Medium | Requirements documentation |
| [NAME] | Operations / SRE Lead | [ORG] | [EMAIL] | [PHONE] | Medium | Medium | Production support readiness |
| [NAME] | Change Advisory Board (CAB) Rep | [ORG] | [EMAIL] | [PHONE] | Low | High | Production change approvals |
| [NAME] | End User Representative | [ORG] | [EMAIL] | [PHONE] | Medium | Low | UAT participation, feedback |
| [NAME] | [ADDITIONAL_ROLE] | [ORG] | [EMAIL] | [PHONE] | [LEVEL] | [LEVEL] | [NOTES] |

---

## 2. Stakeholder Influence / Interest Map

Use this quadrant to classify stakeholders and determine engagement strategy.

```
                        HIGH INFLUENCE
                              |
         Manage Closely       |       Keep Satisfied
         (High Interest,      |       (Low Interest,
          High Influence)     |        High Influence)
                              |
   HIGH INTEREST ------------|------------ LOW INTEREST
                              |
         Keep Informed        |       Monitor
         (High Interest,      |       (Low Interest,
          Low Influence)      |        Low Influence)
                              |
                        LOW INFLUENCE
```

| Quadrant | Stakeholders | Engagement Strategy |
|----------|-------------|---------------------|
| Manage Closely | [NAMES] | Regular 1:1 updates, involve in key decisions |
| Keep Satisfied | [NAMES] | Executive summaries, escalation path available |
| Keep Informed | [NAMES] | Status reports, sprint demos, newsletters |
| Monitor | [NAMES] | Periodic updates, available on request |

---

## 3. Communication Plan

Define how, when, and through which channels each stakeholder group receives project information.

| Stakeholder Group | Communication Type | Frequency | Channel | Owner | Notes |
|--------------------|--------------------|-----------|---------|-------|-------|
| Executive Sponsor | Executive Status Report | Bi-weekly | Email / Teams | Project Manager | RAG status, budget, risks, decisions needed |
| Steering Committee | Steering Committee Meeting | Monthly | Teams Meeting | Project Manager | Milestone review, escalations, decisions |
| Project Team (Core) | Daily Standup | Daily | Teams Meeting | Scrum Master / Tech Lead | Blockers, progress, plan for day |
| Project Team (Core) | Sprint Planning / Retro | Per sprint | Teams Meeting | Scrum Master | Backlog grooming, velocity review |
| Product Owner | Backlog Review | Weekly | Teams Meeting | Business Analyst | Priority alignment, requirement clarification |
| Architecture / ARB | Architecture Review | As needed | Teams Meeting + Confluence | Lead Architect | Design decisions, Azure resource changes |
| Security Team | Security Review Checkpoint | Per phase gate | Teams Meeting + Email | Security Lead | Vulnerability findings, compliance status |
| DevOps / Platform | Pipeline & Infrastructure Sync | Weekly | Teams Meeting | DevOps Lead | GitHub Actions status, Azure infra changes |
| QA Team | Test Status Report | Weekly | Confluence + Email | QA Lead | Test execution, defect metrics |
| CAB | Change Request Submission | Per release | ServiceNow / Email | Release Manager | Production deployment approvals |
| Operations / SRE | Operational Readiness Review | Pre-go-live | Teams Meeting | Operations Lead | Runbooks, monitoring, alerting |
| End Users | UAT Coordination | Per UAT cycle | Email + Teams | Business Analyst | Test scenarios, feedback collection |
| All Stakeholders | Project Newsletter | Monthly | Email | Project Manager | Highlights, upcoming milestones, kudos |
| [STAKEHOLDER_GROUP] | [COMM_TYPE] | [FREQUENCY] | [CHANNEL] | [OWNER] | [NOTES] |

---

## 4. RACI Matrix

Assign responsibility for each major project activity. Each row must have exactly **one A** (Accountable).

**Legend:**
- **R** = Responsible (does the work)
- **A** = Accountable (owns the outcome; one per activity)
- **C** = Consulted (provides input before the work)
- **I** = Informed (notified after the work)

| Activity | Executive Sponsor | Project Manager | Product Owner | Lead Architect | Tech Lead | DevOps / Platform | Security Lead | QA Lead | Operations / SRE | CAB |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Requirements Definition** | I | A | R | C | C | I | C | C | I | - |
| **Architecture Design** | I | I | C | A | R | C | C | - | C | - |
| **Azure Resource Provisioning** | I | I | - | C | C | A | C | - | C | - |
| **CI/CD Pipeline Design (GitHub Actions)** | - | I | - | C | C | A | C | C | I | - |
| **Security Review** | I | I | - | C | C | C | A | - | I | - |
| **Development** | - | I | C | C | A | C | I | I | - | - |
| **Code Review & Merge** | - | I | - | C | A | C | I | - | - | - |
| **Testing (QA)** | - | I | C | - | C | C | - | A | - | - |
| **Performance / Load Testing** | - | I | I | C | C | C | - | A | C | - |
| **Deployment Approval** | I | A | I | C | C | R | C | C | C | R |
| **Production Deployment** | I | I | - | I | C | A | I | I | C | I |
| **Go-Live Decision** | A | R | C | C | C | C | C | C | C | C |
| **Incident Management (Post-Go-Live)** | I | I | I | C | C | R | C | - | A | I |
| **Post-Go-Live Support (Hypercare)** | I | A | C | C | R | R | I | C | R | - |
| **Operational Handoff** | I | A | I | C | R | R | I | - | R | - |
| [ADDITIONAL_ACTIVITY] | [R/A/C/I] | [R/A/C/I] | [R/A/C/I] | [R/A/C/I] | [R/A/C/I] | [R/A/C/I] | [R/A/C/I] | [R/A/C/I] | [R/A/C/I] | [R/A/C/I] |

---

## 5. Escalation Path

Define the chain for unresolved issues or decisions.

| Level | Role | Escalation Trigger | Expected Response Time |
|-------|------|--------------------|------------------------|
| 1 | Tech Lead / Scrum Master | Blocker unresolved for > 1 business day | 4 hours |
| 2 | Project Manager | Cross-team dependency or resource conflict | 1 business day |
| 3 | Product Owner / Lead Architect | Scope change or architecture decision required | 2 business days |
| 4 | Executive Sponsor | Budget, timeline, or strategic direction issue | 3 business days |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | [YYYY-MM-DD] | [AUTHOR] | Initial draft |
