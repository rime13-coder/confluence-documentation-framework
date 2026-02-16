# Project Charter

| **Page Title**   | CMMC Assessor Platform - Project Charter |
|------------------|------------------------------------------|
| **Last Updated** | 2026-02-15                               |
| **Status**       | IN PROGRESS                              |
| **Owner**        | IntelliSec Solutions                     |

---

## 1. Project Identity

| Field                | Value                                                        |
|----------------------|--------------------------------------------------------------|
| **Project Name**     | CMMC Assessor Platform                                       |
| **Project Code**     | CMMC-AP                                                      |
| **Project Sponsor**  | IntelliSec Solutions (brand: CloudSecOps)                    |
| **Project Manager**  | Lead Developer / Architect, IntelliSec Solutions             |
| **Department**       | Product Engineering                                          |
| **Start Date**       | 2025-01-01                                                   |
| **Target End Date**  | 2026-06-30                                                   |
| **Azure Subscription** | IntelliSec Solutions - Canada Central                      |
| **GitHub Repository** | rime13-coder/CMMCAccessor (private)                         |

---

## 2. Project Description

The CMMC Assessor Platform is a comprehensive multi-tenant SaaS application that enables Defense Industrial Base (DIB) organizations to perform self-assessments against CMMC Level 2 requirements. Built on React 18, Node.js 20, Express, and PostgreSQL 17, the platform covers all 110 CMMC Level 2 practices across 14 security domains with 255 individual assessment objectives. It provides SPRS score calculation, POA&M generation, SSP document generation, policy management, evidence management via SharePoint integration, and full team collaboration -- all hosted on Azure Container Apps in the Canada Central region.

---

## 3. Vision Statement

To provide the most affordable, comprehensive, and intuitive CMMC Level 2 self-assessment platform for Defense Industrial Base small and medium-sized businesses, democratizing cybersecurity compliance so that every organization -- regardless of size or budget -- can confidently prepare for CMMC certification and continue competing for Department of Defense contracts.

---

## 4. Business Justification / Problem Statement

### Problem Statement

Defense Industrial Base organizations, particularly small and medium-sized businesses, face a critical challenge: they must achieve CMMC Level 2 certification to win or retain Department of Defense contracts under DFARS 252.204-7021, yet existing Governance, Risk, and Compliance (GRC) tools are prohibitively expensive (often $50,000-$200,000+ annually), overly complex, and designed for large enterprises. Without an affordable path to compliance, SMBs risk losing their ability to participate in the defense supply chain. The CMMC 2.0 framework requires organizations to demonstrate compliance with 110 practices derived from NIST SP 800-171, a process that demands structured assessment, evidence collection, remediation tracking, and formal documentation -- capabilities that manual spreadsheets and ad hoc processes cannot reliably deliver.

### Business Justification

This project addresses a clear market gap by providing an affordable, purpose-built CMMC Level 2 self-assessment tool at roughly 1/10th the cost of enterprise GRC platforms. With monthly Azure infrastructure costs of approximately $35-70 CAD for the MVP, the platform can be offered at price points accessible to DIB SMBs while maintaining healthy margins.

| Justification Category | Details                                                                                  |
|------------------------|------------------------------------------------------------------------------------------|
| Strategic Alignment    | Position IntelliSec Solutions as a leader in affordable CMMC compliance tooling for SMBs |
| Expected ROI           | SaaS recurring revenue from DIB SMBs; estimated 100+ target organizations in first year  |
| Cost of Inaction       | DIB SMBs lose DoD contracts; IntelliSec misses first-mover advantage in underserved segment |
| Regulatory Requirement | CMMC 2.0 (DFARS 252.204-7021), NIST SP 800-171 Rev 2                                    |

---

## 5. Objectives and Success Criteria

Each objective must be measurable. Define KPIs that can be tracked post-delivery.

| # | Objective | KPI | Baseline | Target | Measurement Method |
|---|-----------|-----|----------|--------|--------------------|
| 1 | Launch MVP with full CMMC Level 2 assessment capability | Feature completeness (110 practices, 255 objectives, SPRS, POA&M, SSP) | 0% | 100% | Feature audit against CMMC Level 2 practice list |
| 2 | Onboard first 10 paying client organizations | Active tenant count | 0 | 10 | Tenant table count with active subscriptions |
| 3 | Achieve 80% feature parity with enterprise GRC tools at 1/10th the cost | Feature comparison matrix score vs. top 3 competitors | 0% | 80% | Competitive feature matrix analysis |
| 4 | Remediate all critical and high-severity security findings | Open critical/high findings count | 47 total findings | 0 critical/high open | Security review tracking dashboard |
| 5 | Maintain monthly Azure infrastructure cost under $100 CAD for MVP | Monthly Azure spend | $0 | < $100 CAD/month | Azure Cost Management reporting |

---

## 6. Scope

### In-Scope

- Complete CMMC Level 2 control library (110 practices, 255 objectives across 14 security domains)
- Objective-level assessment workflow based on NIST SP 800-171A examination methods
- SPRS Score Calculator (scoring range: -203 to 110)
- POA&M Generator with risk-based scheduling and evidence management
- SSP Generation in DOCX format following NIST SP 800-171 structure
- Policy library with 14 domain-specific templates, version history, and user acknowledgments
- Evidence management via SharePoint integration (Microsoft Graph API with AES-256-GCM token encryption)
- Multi-tenant architecture with Microsoft Entra ID SSO (OAuth 2.0 / OIDC)
- Publisher/Client tenant model with platform roles (SUPER_ADMIN, SUPPORT, USER) and team roles (OWNER, ADMIN, ASSESSOR, MEMBER, VIEWER)
- Comprehensive audit trail for all assessment and administrative actions
- Excel export for assessment data
- Dashboard with compliance metrics and visualizations (Recharts)
- CI/CD pipeline via GitHub Actions with OIDC authentication to Azure
- Infrastructure as Code using Bicep for Azure Container Apps, Container Registry, Key Vault, Blob Storage, and PostgreSQL

### Out-of-Scope

- CMMC Level 3 (NIST SP 800-172 requirements) -- future phase
- C3PAO assessment mode (third-party assessor workflows) -- future phase
- Continuous monitoring and automated evidence collection -- future phase
- FedRAMP or StateRAMP compliance modules
- Mobile-native applications (iOS/Android)
- Multi-region deployment or active-active disaster recovery (MVP is single-region, Canada Central)

### Future Scope (Planned for Later Phases)

- CMMC Level 3 assessment support
- C3PAO integration for formal assessment coordination
- Continuous monitoring with automated control validation
- Advanced analytics and benchmarking across anonymized tenant data
- API marketplace for third-party security tool integrations
- Multi-region deployment with Azure Traffic Manager for high availability

---

## 7. Key Assumptions and Constraints

### Assumptions

| # | Assumption | Impact if Invalid |
|---|------------|-------------------|
| 1 | CMMC 2.0 rulemaking will proceed as planned and Level 2 requirements will remain based on NIST SP 800-171 Rev 2 | Significant rework of control library, assessment logic, and all generated documents (SSP, POA&M) |
| 2 | DIB SMBs are willing to adopt a SaaS-based compliance tool rather than on-premises or spreadsheet-based approaches | Reduced market adoption; may need to offer hybrid deployment options |
| 3 | Microsoft Entra ID is the primary identity provider for target customers (DIB organizations using Microsoft 365) | Need to support additional identity providers (Okta, Google Workspace), increasing development scope |
| 4 | Azure Burstable B1ms tier for PostgreSQL is sufficient for initial workload (up to ~50 concurrent users) | Database performance degradation; need to scale to higher compute tier, increasing costs |
| 5 | Azure Container Apps provides sufficient compute and scaling for the MVP workload | Migration to AKS or alternative compute; increased operational complexity and cost |

### Constraints

| # | Constraint | Type |
|---|------------|------|
| 1 | Small development team (founder-led); limited parallelism in feature development | Resource |
| 2 | Monthly Azure infrastructure budget capped at approximately $35-70 CAD for MVP | Budget |
| 3 | All deployments must go through GitHub Actions CI/CD pipelines (no manual Azure deployments) | Process |
| 4 | Must align with CMMC 2.0 / NIST SP 800-171 Rev 2 requirements and pass security review | Regulatory / Governance |
| 5 | Platform handles CUI-adjacent data; must implement appropriate security controls even though the platform itself is not a CUI repository | Security |
| 6 | CMMC ecosystem and rulemaking are still evolving; platform must be adaptable to regulatory changes | Regulatory |
| 7 | Single-region deployment (Canada Central) for MVP; no disaster recovery infrastructure initially | Technical |

---

## 8. Budget Summary

| Category | Estimated Cost | Approved Budget | Notes |
|----------|---------------|-----------------|-------|
| Azure Infrastructure (monthly) | $35-70 CAD | $100 CAD | Container Apps, PostgreSQL Flexible Server (B1ms), Container Registry (Basic), Key Vault, Blob Storage |
| Azure Infrastructure (annual, first year) | $420-840 CAD | $1,200 CAD | Canada Central region |
| Licensing / Third-Party Services | $0 | $0 | Open-source stack (React, Node.js, Express, Prisma, PostgreSQL); GitHub free tier for private repo |
| Domain & DNS | ~$30 CAD/year | $50 CAD | cmmc.intellisecops.com, api.cmmc.intellisecops.com |
| Personnel (internal) | Founder time | N/A | Founder-led development; no external FTEs in MVP phase |
| Personnel (contractors / vendors) | TBD | TBD | Security review, penetration testing |
| Contingency (20%) | ~$250 CAD | $250 CAD | Infrastructure scaling, unexpected service costs |
| **Total (Year 1)** | **~$700-1,120 CAD** | **~$1,500 CAD** | |

---

## 9. Timeline / Milestones

| # | Milestone | Description | Target Date | Status | Dependencies |
|---|-----------|-------------|-------------|--------|--------------|
| 1 | Project Kickoff | Repository created, initial architecture defined, Azure resources provisioned | 2025-01-15 | COMPLETE | Founder commitment |
| 2 | MVP Development Complete | All 110 practices, 255 objectives, SPRS calculator, POA&M, SSP generation, policy management, multi-tenancy, Entra ID auth | 2025-09-30 | COMPLETE | Architecture decisions finalized |
| 3 | CI/CD Pipeline Established | GitHub Actions workflows for build, test, and deploy to Azure Container Apps via OIDC | 2025-10-15 | COMPLETE | Azure service connections, Bicep IaC |
| 4 | Security Review (Phase 0) | Initial security assessment; identify and triage all findings | 2025-12-15 | COMPLETE | MVP feature-complete |
| 5 | Security Remediation (Phase 1-3) | Address 47 identified security findings across critical, high, medium, and low severity | 2026-03-31 | COMPLETE — All 47 findings resolved (2026-02-15) | Security review findings documented |
| 6 | Staging Environment | Dedicated staging environment for pre-production validation | 2026-04-15 | NOT STARTED | Phase 1-2 security remediation complete |
| 7 | Penetration Testing | External penetration test against staging environment | 2026-05-15 | NOT STARTED | Staging environment operational, critical findings remediated |
| 8 | First Client Onboarding | First paying tenant organization onboarded and actively using the platform | 2026-06-01 | NOT STARTED | Penetration test passed, production hardened |
| 9 | Production Go-Live (GA) | General availability; marketing launch | 2026-06-30 | NOT STARTED | Client onboarding validated, all critical/high findings resolved |

---

## 10. Key Risks

**Likelihood:** Low (1) / Medium (2) / High (3)
**Impact:** Low (1) / Medium (2) / High (3)
**Risk Score:** Likelihood x Impact (1-9)

| # | Risk Description | Likelihood | Impact | Score | Mitigation Strategy | Owner |
|---|------------------|------------|--------|-------|---------------------|-------|
| 1 | 47 security findings identified in review; all 47 resolved as of 2026-02-15; overall risk reduced to Low | Low | Low | 2 | All 47 findings remediated across Phases 1-3; production environment hardened (prod-v2 with VNet, WAF, private endpoints, Key Vault managed identity); ongoing Dependabot and npm audit enforcement | Lead Developer |
| 2 | Single-region deployment (Canada Central) with no disaster recovery; Azure outage causes total platform unavailability | Medium | High | 6 | Implement database backups; document RTO/RPO; plan multi-region expansion for post-MVP phase | Lead Developer |
| 3 | CMMC 2.0 rulemaking changes or NIST SP 800-171 Rev 3 adoption invalidates current control library and assessment logic | Medium | High | 6 | Design flexible control/objective data model; monitor CMMC-AB announcements; plan for quarterly control library updates | Platform Owner |
| 4 | Key personnel dependency (single founder/developer); unavailability halts all progress | High | High | 9 | Document all architecture decisions, runbooks, and deployment procedures; maintain comprehensive IaC; consider bringing on a second developer | Platform Owner |
| 5 | Market adoption slower than expected; DIB SMBs may prefer established GRC vendors or manual processes | Medium | Medium | 4 | Competitive pricing strategy; free trial period; build partnerships with CMMC consultants and C3PAOs for referrals | Platform Owner |

---

## 11. Approval Sign-Off

This charter is approved by the following stakeholders. Approval indicates agreement with the project scope, objectives, timeline, and budget as described above.

| Name | Role | Date | Signature |
|------|------|------|-----------|
| IntelliSec Solutions Founder | Platform Owner / Executive Sponsor | 2026-02-14 | |
| Lead Developer | Lead Architect / Project Manager | 2026-02-14 | |
| Security Reviewer | Security Lead | | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-14 | IntelliSec Solutions | Initial draft |
