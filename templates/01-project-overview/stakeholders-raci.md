# Stakeholders & RACI Matrix

| **Page Title**   | CMMC Assessor Platform - Stakeholders & RACI Matrix |
|------------------|------------------------------------------------------|
| **Last Updated** | 2026-02-14                                           |
| **Status**       | IN PROGRESS                                          |
| **Owner**        | IntelliSec Solutions                                 |

---

## 1. Stakeholder Registry

Identify all stakeholders with influence over or interest in the project. Update this table as the team evolves.

**Interest Level:** Low / Medium / High
**Influence Level:** Low / Medium / High

| Name | Role | Organization / Team | Email | Interest Level | Influence Level | Notes |
|------|------|---------------------|-------|----------------|-----------------|-------|
| IntelliSec Solutions Founder | Platform Owner / Executive Sponsor | IntelliSec Solutions (CloudSecOps) | support@intellisecsolutions.com | High | High | Final authority on budget, scope, product direction, and strategic decisions |
| Lead Developer | Lead Architect / Full-Stack Developer | IntelliSec Solutions | -- | High | High | Architecture decisions, development execution, DevOps, and day-to-day project management |
| Security Reviewer | Security Lead / Auditor | IntelliSec Solutions (contract) | -- | High | High | Security review of platform; identified 47 findings; sign-off required for production launch |
| DevOps Engineer | CI/CD & Infrastructure Engineer | IntelliSec Solutions | -- | High | Medium | GitHub Actions pipelines, Azure Container Apps, Bicep IaC, container orchestration |
| Client Organization Admin | Client Tenant Owner | Client Organizations (DIB SMBs) | Varies | High | Medium | Creates and manages tenant, invites team members, configures SharePoint integration, owns assessment outcomes |
| Client Assessor | CMMC Assessment Practitioner | Client Organizations (DIB SMBs) | Varies | High | Low | Primary end user; performs control assessments, documents implementation, uploads evidence |
| Client Team Member | General Team Participant | Client Organizations (DIB SMBs) | Varies | Medium | Low | Reviews policies, acknowledges compliance requirements, views assessment status |
| C3PAO Representatives | Third-Party Assessment Organization | CMMC Ecosystem (future) | Varies | Low | Medium | Future stakeholders; formal assessors who will evaluate organizations for CMMC certification; platform may integrate with their workflows |
| CMMC Accreditation Body (The Cyber AB) | Regulatory / Accreditation Body | U.S. Government / Cyber AB | -- | Low | High | Sets CMMC assessment standards and accreditation requirements; regulatory changes directly impact platform requirements |
| DoD CIO / OUSD(A&S) | Regulatory Authority | U.S. Department of Defense | -- | Low | High | Owns CMMC 2.0 rulemaking (DFARS 252.204-7021); policy changes affect the entire CMMC ecosystem |
| CMMC Consultants / RPOs | Registered Practitioner Organizations | CMMC Ecosystem | Varies | Medium | Low | Potential referral partners; may recommend the platform to their DIB clients preparing for assessment |
| Microsoft (Entra ID / Azure) | Technology Platform Provider | Microsoft | -- | Low | Medium | Identity provider (Entra ID), cloud infrastructure (Azure), Graph API for SharePoint integration |

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
| Manage Closely | Platform Owner, Lead Developer, Security Reviewer | Direct involvement in all key decisions; continuous collaboration; weekly syncs on security remediation and feature priorities |
| Keep Satisfied | CMMC Accreditation Body (Cyber AB), DoD CIO, Microsoft (Azure/Entra ID), C3PAO Representatives | Monitor regulatory announcements and platform updates; ensure compliance alignment; no direct engagement unless changes impact platform |
| Keep Informed | DevOps Engineer, Client Organization Admins, Client Assessors, CMMC Consultants / RPOs | Product updates, release notes, feature announcements; feedback collection via support channels; beta program participation |
| Monitor | Client Team Members (Viewers/Members) | Periodic product updates; user documentation; support articles |

---

## 3. Communication Plan

Define how, when, and through which channels each stakeholder group receives project information.

| Stakeholder Group | Communication Type | Frequency | Channel | Owner | Notes |
|--------------------|--------------------|-----------|---------|-------|-------|
| Platform Owner / Founder | Strategic Review & Sprint Planning | Weekly | Direct / Teams | Lead Developer | Product roadmap, feature priorities, budget review, key decisions |
| Lead Developer / DevOps | Development Standup | Daily | GitHub Issues / Teams | Lead Developer | Progress on security remediation, feature development, blockers |
| Security Reviewer | Security Remediation Status | Bi-weekly | Email / Teams | Lead Developer | Progress on 47 findings; phase completion updates; re-review scheduling |
| Client Organization Admins | Platform Updates & Release Notes | Per release | Email / In-app notifications | Platform Owner | New features, breaking changes, security patches, maintenance windows |
| Client Assessors | Product Documentation Updates | Per release | Knowledge base / Help docs | Lead Developer | Assessment workflow guidance, new control library updates, feature tutorials |
| CMMC Ecosystem (Cyber AB, DoD) | Regulatory Monitoring | Monthly | Industry publications / Federal Register | Platform Owner | Track CMMC rulemaking, NIST SP 800-171 updates, assessment methodology changes |
| CMMC Consultants / RPOs | Partner Communications | Quarterly | Email / Newsletter | Platform Owner | Partnership opportunities, referral program updates, platform capabilities |
| Microsoft (Azure/Entra ID) | Service Health Monitoring | Continuous | Azure Service Health / Status page | DevOps Engineer | Track Azure service incidents, Entra ID changes, Graph API deprecations |
| All Stakeholders | Product Roadmap Update | Quarterly | Email / Blog | Platform Owner | Strategic direction, upcoming features, ecosystem developments |

---

## 4. RACI Matrix

Assign responsibility for each major project activity. Each row must have exactly **one A** (Accountable).

**Legend:**
- **R** = Responsible (does the work)
- **A** = Accountable (owns the outcome; one per activity)
- **C** = Consulted (provides input before the work)
- **I** = Informed (notified after the work)

| Activity | Platform Owner | Lead Developer | Security Reviewer | DevOps Engineer | Client Org Admin | Client Assessor |
|----------|:-:|:-:|:-:|:-:|:-:|:-:|
| **Product Requirements & Roadmap** | A | R | C | I | C | I |
| **Architecture Design** | I | A | C | C | - | - |
| **Azure Infrastructure Provisioning (Bicep IaC)** | I | C | C | A | - | - |
| **CI/CD Pipeline Design (GitHub Actions)** | I | C | I | A | - | - |
| **Security Review & Findings Triage** | I | C | A | C | - | - |
| **Security Remediation (Phase 0-3)** | I | A | C | C | - | - |
| **Backend API Development** | I | A | C | I | - | - |
| **Frontend UI Development** | C | A | I | I | - | - |
| **CMMC Control Library Maintenance** | C | A | C | - | - | I |
| **Database Schema & Prisma ORM** | I | A | C | I | - | - |
| **Microsoft Entra ID Integration** | I | A | C | C | - | - |
| **SharePoint Evidence Integration** | I | A | C | I | C | I |
| **SSP/POA&M Document Generation** | C | A | C | - | I | I |
| **Policy Library Templates** | C | A | C | - | I | I |
| **Multi-Tenant Architecture** | I | A | C | C | - | - |
| **Code Review & Merge** | - | A | C | C | - | - |
| **Penetration Testing** | I | C | A | C | - | - |
| **Production Deployment** | I | C | I | A | - | - |
| **Go-Live Decision** | A | R | C | C | - | - |
| **Client Tenant Onboarding** | I | C | - | I | A | I |
| **Assessment Execution** | - | - | - | - | C | A |
| **SPRS Score Review & Submission** | - | - | - | - | A | R |
| **Incident Management (Post-Go-Live)** | I | R | C | A | I | I |
| **CMMC Regulatory Change Monitoring** | A | R | C | I | I | I |
| **User Support (Tier 1)** | I | A | - | C | - | - |
| **Operational Handoff Documentation** | I | A | I | R | - | - |

---

## 5. Escalation Path

Define the chain for unresolved issues or decisions.

| Level | Role | Escalation Trigger | Expected Response Time |
|-------|------|--------------------|------------------------|
| 1 | Lead Developer | Technical blocker, build/deploy failure, non-critical bug | 4 hours |
| 2 | DevOps Engineer | Infrastructure issue, Azure service degradation, CI/CD pipeline failure | 4 hours |
| 3 | Security Reviewer | Security vulnerability discovered, finding severity reclassification, compliance concern | 1 business day |
| 4 | Platform Owner / Founder | Budget decision, scope change, strategic direction, regulatory impact, partner/client escalation | 1 business day |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-14 | IntelliSec Solutions | Initial draft with CMMC Assessor Platform stakeholders and RACI |
