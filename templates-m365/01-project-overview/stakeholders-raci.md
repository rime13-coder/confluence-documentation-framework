# Stakeholders & RACI Matrix

| **Page Title**   | M365 Security Assessment Automation - Stakeholders & RACI Matrix |
|------------------|------------------------------------------------------------------|
| **Last Updated** | 2026-02-15                                                       |
| **Status**       | IN PROGRESS                                                      |
| **Owner**        | IntelliSec Solutions                                             |

---

## 1. Stakeholder Registry

Identify all stakeholders with influence over or interest in the project. Update this table as the team evolves.

**Interest Level:** Low / Medium / High
**Influence Level:** Low / Medium / High

| Name | Role | Organization / Team | Email | Interest Level | Influence Level | Notes |
|------|------|---------------------|-------|----------------|-----------------|-------|
| IntelliSec Solutions Founder | Platform Owner / Executive Sponsor | IntelliSec Solutions (CloudSecOps) | support@intellisecsolutions.com | High | High | Final authority on budget, scope, product direction, and strategic decisions; defines assessment service offerings |
| Lead Developer / Architect | Lead Developer / Project Manager | IntelliSec Solutions | -- | High | High | Architecture decisions, PowerShell module development, check logic implementation, tool maintenance, and day-to-day project management |
| Security Consultants (Assessment Team) | Primary Tool Users / Assessment Practitioners | IntelliSec Solutions - Security Services | -- | High | Medium | Execute M365 tenant assessments using the tool; deliver reports to clients; provide feedback on check accuracy, usability, and coverage gaps |
| Security Services Lead | Consultant Team Lead / Quality Assurance | IntelliSec Solutions - Security Services | -- | High | Medium | Oversees assessment quality; validates tool output against manual baselines; signs off on tool readiness for client-facing engagements |
| Client Organization IT Admins | M365 Tenant Administrators | Client Organizations (DIB) | Varies | Medium | Medium | Provide M365 tenant access credentials and permissions for automated assessment; receive and act on assessment reports |
| Client Organization CISOs / Security Leads | Security Decision Makers | Client Organizations (DIB) | Varies | High | Low | Consume assessment reports; make remediation decisions; rely on finding accuracy and severity ratings for prioritization |
| IntelliSec Solutions Management | Business Leadership | IntelliSec Solutions | -- | Medium | High | Approves project investment (development time); evaluates ROI based on assessment throughput improvement and service scalability |
| Microsoft (Graph API / M365 Platform) | Technology Platform Provider | Microsoft | -- | Low | Medium | Provider of Microsoft Graph API, Exchange Online PowerShell, Teams PowerShell; API changes directly impact tool functionality |

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
| Manage Closely | Platform Owner / Founder, Lead Developer / Architect, IntelliSec Solutions Management | Direct involvement in all key decisions; continuous collaboration on scope, priorities, and release readiness; weekly development syncs |
| Keep Satisfied | Microsoft (Graph API / M365 Platform) | Monitor API changelog, deprecation notices, and module updates; no direct engagement unless breaking changes impact tool functionality |
| Keep Informed | Security Consultants (Assessment Team), Security Services Lead, Client Organization IT Admins, Client CISOs / Security Leads | Tool updates, new module releases, assessment workflow changes; feedback collection after each engagement; training sessions for new features |
| Monitor | -- | No current stakeholders in this quadrant; reassess as project matures |

---

## 3. Communication Plan

Define how, when, and through which channels each stakeholder group receives project information.

| Stakeholder Group | Communication Type | Frequency | Channel | Owner | Notes |
|--------------------|--------------------|-----------|---------|-------|-------|
| Platform Owner / Founder | Strategic Review & Development Planning | Weekly | Direct / Teams | Lead Developer | Project status, module completion progress, blockers, scope decisions, assessment service strategy |
| Lead Developer / Architect | Development Log & Architecture Decisions | Continuous | GitHub commits / Internal docs | Lead Developer | Module development progress, check logic decisions, dependency updates, technical debt tracking |
| Security Consultants (Assessment Team) | Tool Training & Feature Updates | Per release + bi-weekly syncs | Teams meeting / Email | Lead Developer | New module walkthroughs, updated assessment workflows, known limitations, workarounds for edge cases |
| Security Services Lead | Quality Validation & Readiness Review | Per module release | Teams meeting / Report samples | Lead Developer | Review tool output against manual baseline; validate finding accuracy; sign off before client-facing use |
| IntelliSec Solutions Management | Business Impact & ROI Reporting | Monthly | Email / Slide deck | Platform Owner | Assessment throughput metrics (manual vs. automated), consultant time savings, client engagement capacity projections |
| Client Organization IT Admins | Pre-Engagement Permissions & Access Setup | Per engagement | Email / Teams | Security Consultant | Minimum permissions checklist, service account setup guide, assessment scope confirmation, data handling assurances |
| Client Organization CISOs / Security Leads | Assessment Deliverables & Findings Review | Per engagement (post-assessment) | Email / Meeting | Security Consultant | HTML/PDF/DOCX assessment report, findings walkthrough, severity-prioritized remediation guidance |
| Microsoft (Graph API / M365 Platform) | API Change Monitoring | Continuous | Microsoft Graph changelog / GitHub advisories | Lead Developer | Track Graph API versioning, Exchange Online module updates, Teams PowerShell module updates; no outbound communication |
| All Internal Stakeholders | Release Notes & Changelog | Per release | Email / Internal wiki | Lead Developer | New checks added, bugs fixed, module updates, dependency changes, known issues |

---

## 4. RACI Matrix

Assign responsibility for each major project activity. Each row must have exactly **one A** (Accountable).

**Legend:**
- **R** = Responsible (does the work)
- **A** = Accountable (owns the outcome; one per activity)
- **C** = Consulted (provides input before the work)
- **I** = Informed (notified after the work)

| Activity | Platform Owner | Lead Developer | Security Consultants | Security Services Lead | Client IT Admin | IntelliSec Mgmt |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|
| **Module Architecture & Design** | I | A | C | C | - | I |
| **Check Logic Development (EntraID)** | I | A | C | I | - | - |
| **Check Logic Development (Device Mgmt)** | I | A | C | I | - | - |
| **Check Logic Development (Email Protection)** | I | A | C | I | - | - |
| **Check Logic Development (Teams/SharePoint)** | I | A | C | I | - | - |
| **Definition-Only Module Creation (Phase 4)** | C | A | C | I | - | I |
| **Evidence Export (CSV) Implementation** | I | A | C | C | - | - |
| **Report Generation (HTML/PDF/DOCX)** | C | A | C | C | - | I |
| **Web Dashboard (Pode) Development** | I | A | C | I | - | - |
| **Credential Management (DPAPI)** | I | A | - | C | - | - |
| **SQLite Data Persistence** | I | A | - | I | - | - |
| **Pester Unit Test Development** | I | A | C | I | - | - |
| **Pre-Engagement Permissions Setup** | - | C | R | I | A | - |
| **Assessment Execution (Client Tenant)** | - | C | A | I | C | - |
| **Finding Review & Quality Assurance** | - | C | R | A | - | - |
| **Report Generation (Per Engagement)** | - | I | A | I | - | - |
| **Client Report Delivery & Walkthrough** | - | - | A | C | I | I |
| **Remediation Guidance (Client Advisory)** | - | C | A | C | I | - |
| **Tool Maintenance & Bug Fixes** | I | A | C | I | - | - |
| **Dependency Updates (PowerShell Modules)** | I | A | - | I | - | - |
| **Graph API Compatibility Monitoring** | I | A | - | I | - | - |
| **Security Review (Tool Internals)** | I | A | - | C | - | I |
| **Release Management & Versioning** | I | A | C | C | - | I |
| **Internal Pilot Validation** | C | R | R | A | - | I |
| **Consultant Training & Onboarding** | I | R | R | A | - | I |
| **Service Offering Strategy & Pricing** | A | C | C | C | - | R |
| **Go / No-Go Decision (Production Use)** | A | R | C | C | - | C |
| **Incident Response (Tool Failure During Engagement)** | I | A | R | C | I | I |
| **Client Feedback Collection & Analysis** | I | C | R | A | C | I |

---

## 5. Escalation Path

Define the chain for unresolved issues or decisions.

| Level | Role | Escalation Trigger | Expected Response Time |
|-------|------|--------------------|------------------------|
| 1 | Security Consultant | Assessment execution error, unexpected finding, client permissions issue, non-critical tool bug | 4 hours (during engagement) |
| 2 | Lead Developer | Tool crash or failure during client engagement, false positive/negative in check logic, PowerShell module compatibility issue, data corruption | 2 hours (during engagement); 1 business day (non-urgent) |
| 3 | Security Services Lead | Finding accuracy dispute, assessment quality concern, consultant unable to complete engagement with tool, client escalation about report content | 1 business day |
| 4 | Platform Owner / Founder | Scope change request, budget decision, strategic direction (new module priority, new domain), client relationship escalation, security incident involving credential exposure | 1 business day |

---

## 6. Responsibility Summary by Phase

| Phase | Primary Responsible | Accountable | Key Consulted | Informed |
|-------|---------------------|-------------|---------------|----------|
| Phase 1: EntraID (39 checks) | Lead Developer | Lead Developer | Security Consultants | Platform Owner, Management |
| Phase 2: Device Management (18 checks) | Lead Developer | Lead Developer | Security Consultants | Platform Owner, Management |
| Phase 3: Email Protection (13) + Teams/SharePoint (17) | Lead Developer | Lead Developer | Security Consultants, Security Services Lead | Platform Owner |
| Phase 4: Definition-Only Modules | Lead Developer | Lead Developer | Security Consultants | Platform Owner, Management |
| Evidence Export & Reporting | Lead Developer | Lead Developer | Security Consultants, Security Services Lead | Platform Owner |
| Web Dashboard (Pode) | Lead Developer | Lead Developer | Security Consultants | Platform Owner |
| Internal Pilot | Security Consultants, Lead Developer | Security Services Lead | Platform Owner | Management |
| Production Release (v1.0) | Lead Developer | Platform Owner | Security Services Lead, Security Consultants | Management, Client IT Admins |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-15 | IntelliSec Solutions | Initial draft with stakeholder registry, RACI matrix, communication plan, and escalation path for M365 Security Assessment Automation |
