# Gate 1 - Design Review

| **Page Title**   | Gate 1 - Design Review - CMMC Assessor Platform    |
|------------------|-----------------------------------------------------|
| **Last Updated** | 2026-02-14                                          |
| **Status**       | COMPLETE                                            |
| **Owner**        | CTO, IntelliSec Solutions                           |
| **Gate Date**    | 2026-01-06                                          |

---

## 1. Gate Purpose

Gate 1 validates that the project design is sound, stakeholders are aligned, and sufficient planning has been completed before significant development effort begins. For the CMMC Assessor Platform, this gate evaluated the viability of building a multi-tenant SaaS CMMC Level 2 compliance self-assessment tool, the technology stack selection, and the initial architecture approach. This gate occurred **after requirements gathering and initial design, before full development started**.

### Timing in Project Lifecycle

```
[Requirements] --> [Initial Design] --> ** GATE 1: Design Review ** --> [Development] --> [Gate 2] --> ...
```

---

## 2. Entry Criteria

| # | Entry Criterion | Status (COMPLETE / NOT COMPLETE) | Evidence / Link | Owner |
|---|----------------|----------------------------------|-----------------|-------|
| 2.1 | Business requirements are documented and signed off by stakeholders | COMPLETE | Product brief: multi-tenant CMMC Level 2 self-assessment platform for defense industrial base (DIB) organizations | Product Owner |
| 2.2 | Functional and non-functional requirements are defined | COMPLETE | Assessment workflow, SPRS scoring, POA&M tracking, multi-tenancy, role-based access, SharePoint integration, audit logging | Product Owner |
| 2.3 | High-Level Design (HLD) document is drafted | COMPLETE | Architecture: React 18 SPA + Node.js/Express API + PostgreSQL 17 on Azure Container Apps | CTO |
| 2.4 | Key stakeholders and reviewers are identified and confirmed | COMPLETE | CTO (architect), Dev Lead, DevOps Lead, Product Owner | CTO |
| 2.5 | Technology stack selection is documented with rationale | COMPLETE | ADR-001 (Container Apps vs AKS), ADR-002 (Prisma ORM), ADR-003 (Entra ID), ADR-004 (React 18) | CTO |
| 2.6 | Initial cost estimate for Azure resources is prepared | COMPLETE | Azure Pricing Calculator estimate: Container Apps (consumption), PostgreSQL Flexible Server (Burstable B1ms), Key Vault, ACR Basic, Blob Storage | DevOps Lead |
| 2.7 | Project timeline and milestones are drafted | COMPLETE | MVP target: 8 weeks; Phase 1 (core assessment), Phase 2 (SharePoint integration), Phase 3 (reporting) | Product Owner |
| 2.8 | Dependencies on other teams or systems are identified | COMPLETE | Microsoft Entra ID (OAuth/OIDC), Microsoft Graph API (SharePoint), NIST SP 800-171 control library | CTO |
| 2.9 | Scope boundaries (in-scope / out-of-scope) are documented | COMPLETE | In scope: CMMC L2 self-assessment, SPRS scoring, POA&M, multi-tenancy. Out of scope: actual CUI storage, C3PAO assessment workflow, GCC High deployment | Product Owner |

**Entry Criteria Met:** YES

---

## 3. Review Agenda / Focus Areas

| # | Focus Area | Duration (est.) | Presenter | Notes |
|---|-----------|-----------------|-----------|-------|
| 1 | Business context: CMMC compliance gap in DIB market | 10 min | Product Owner | Market opportunity for affordable self-assessment tooling |
| 2 | Requirements: assessment workflow, SPRS scoring, POA&M tracking | 15 min | Product Owner | 110 NIST 800-171 controls, scoring algorithm, remediation tracking |
| 3 | Architecture: Container Apps + Express + PostgreSQL + Entra ID | 20 min | CTO | Why Container Apps over AKS, Prisma for multi-tenancy, managed services |
| 4 | Technology stack: React 18, Node.js/Express, Prisma, Bicep | 10 min | CTO | Stack rationale, team familiarity, ecosystem maturity |
| 5 | Data model: tenants, teams, assessments, controls, POA&M, audit | 10 min | CTO | Multi-tenant schema design, tenant isolation via Prisma middleware |
| 6 | Security: Entra ID OAuth, RBAC, CUI metadata handling | 10 min | CTO | Two-tier RBAC, Graph API token encryption, audit logging |
| 7 | Integrations: Microsoft Entra ID, Graph API (SharePoint) | 10 min | Dev Lead | OAuth flow, delegated permissions, evidence file access |
| 8 | Risks: CUI sensitivity, multi-tenancy isolation, small team | 10 min | CTO | Key risk: platform handling security posture data must itself be secure |
| 9 | Cost estimate: Azure consumption-tier resources for MVP | 5 min | DevOps Lead | Estimated < $200/month for MVP; scales with Container Apps consumption |
| 10 | Q&A and open discussion | 20 min | All | |

**Total Estimated Duration:** 2 hours

---

## 4. Exit Criteria

| # | Exit Criterion | Status (COMPLETE / NOT COMPLETE) | Evidence / Link | Owner |
|---|---------------|----------------------------------|-----------------|-------|
| 4.1 | Architecture approach is reviewed and accepted by reviewers | COMPLETE | Container Apps + Express + PostgreSQL accepted; simpler than AKS for MVP team size | CTO |
| 4.2 | Key risks are identified and documented with initial mitigation strategies | COMPLETE | Multi-tenancy isolation (Prisma middleware), CUI metadata sensitivity (encryption, RBAC), small team capacity | CTO |
| 4.3 | Architecture Decision Records (ADRs) are created for significant decisions | COMPLETE | ADR-001: Container Apps vs AKS (chose Container Apps for simplicity), ADR-002: Prisma ORM (chose for type safety and multi-tenant middleware), ADR-003: Entra ID (chose for enterprise SSO), ADR-004: React 18 (team familiarity) | CTO |
| 4.4 | Non-functional requirements (performance, scalability, security) are addressed in the design | COMPLETE | Container Apps auto-scaling, PostgreSQL connection pooling, Entra ID MFA, tenant isolation, audit logging | CTO |
| 4.5 | Integration strategy for dependent systems is defined | COMPLETE | Entra ID OAuth 2.0/OIDC for auth; Graph API for SharePoint evidence files; delegated consent model | Dev Lead |
| 4.6 | Data model is reviewed and accepted | COMPLETE | Multi-tenant PostgreSQL schema with Prisma; tenant isolation at ORM level; assessment locking mechanism | CTO |
| 4.7 | Security considerations are acknowledged and a threat model is planned | COMPLETE | Initial security considerations documented; formal threat model and security review planned for Gate 3 | CTO |
| 4.8 | Cost estimate is within approved budget range | COMPLETE | MVP cost estimate < $200/month on Azure consumption tier; within startup budget | DevOps Lead |
| 4.9 | No unresolved blocking concerns from reviewers | COMPLETE | All concerns addressed; proceed to development | All |

---

## 5. Gate Decision

| Decision | Description |
|----------|-------------|
| **APPROVED** | All exit criteria met. Project proceeds to development. |

### Decision Outcome

| Field | Value |
|-------|-------|
| **Decision** | APPROVED |
| **Decision Date** | 2026-01-06 |
| **Decision Rationale** | Architecture is appropriate for MVP scope and team size. Container Apps provides sufficient compute without AKS complexity. Entra ID provides enterprise-grade authentication. Multi-tenant design with Prisma middleware provides adequate tenant isolation. Security review deferred to Gate 3 as planned. |
| **Next Gate Target** | Gate 2 - Architecture Review Board: 2026-01-27 |

---

## 6. Conditions / Action Items

> No conditions -- gate was fully APPROVED.

| # | Condition / Action Item | Priority (High / Medium / Low) | Owner | Target Date | Status |
|---|------------------------|-------------------------------|-------|-------------|--------|
| 1 | Document Prisma multi-tenant middleware approach in detail before implementation | Medium | Dev Lead | 2026-01-13 | COMPLETE |
| 2 | Finalize Azure resource naming convention before Bicep development | Low | DevOps Lead | 2026-01-13 | COMPLETE |
| 3 | Set up GitHub repository with branch protection and OIDC for Azure | High | DevOps Lead | 2026-01-10 | COMPLETE |

---

## 7. Attendees and Sign-Off

| Name | Role | Decision (Approve / Approve with Conditions / Reject) | Date |
|------|------|-------------------------------------------------------|------|
| (CTO) | Solution Architect / CTO | Approve | 2026-01-06 |
| (Dev Lead) | Technical Lead | Approve | 2026-01-06 |
| (Product Owner) | Product Owner | Approve | 2026-01-06 |
| (DevOps Lead) | DevOps / Cloud Lead | Approve | 2026-01-06 |

---

## 8. Meeting Notes

**Date:** 2026-01-06

**Key Discussion Points:**

- Container Apps vs AKS: team agreed Container Apps is the right choice for MVP. AKS adds Kubernetes operational burden that a small team cannot absorb. Can migrate later if needed.
- Prisma ORM selected for its TypeScript integration and ability to implement tenant-scoping middleware at the ORM level, preventing accidental cross-tenant queries.
- Microsoft Entra ID selected as the identity provider to leverage enterprise SSO, MFA, and Conditional Access from client organizations. Platform also supports local authentication as a fallback.
- Evidence files will be stored in the client's own SharePoint via Microsoft Graph API, keeping actual CUI out of our infrastructure.

**Concerns Raised:**

- Small team (< 5 people) managing a security-sensitive platform -- need to rely heavily on managed Azure services and avoid custom security implementations.
- CMMC compliance platform should itself demonstrate strong security practices -- could be a credibility issue if the platform has vulnerabilities. Agreed to prioritize security review (Gate 3) before production.

**Decisions Made:**

- Proceed with Container Apps + Express + PostgreSQL stack on Azure.
- Use Bicep for IaC (team familiarity over Terraform).
- GitHub Actions with OIDC federated credentials for CI/CD (no stored secrets).
- Plan formal security review before any production deployment.
