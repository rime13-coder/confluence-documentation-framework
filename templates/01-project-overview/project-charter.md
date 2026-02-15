# Project Charter

| **Page Title**   | [PROJECT_NAME] - Project Charter |
|------------------|----------------------------------|
| **Last Updated** | [YYYY-MM-DD]                     |
| **Status**       | NOT STARTED                      |
| **Owner**        | [OWNER_NAME]                     |

---

## 1. Project Identity

| Field                | Value                                      |
|----------------------|--------------------------------------------|
| **Project Name**     | [PROJECT_NAME]                             |
| **Project Code**     | [PROJECT_CODE]                             |
| **Project Sponsor**  | [SPONSOR_NAME, TITLE]                      |
| **Project Manager**  | [PM_NAME, TITLE]                           |
| **Department**       | [DEPARTMENT]                               |
| **Start Date**       | [YYYY-MM-DD]                               |
| **Target End Date**  | [YYYY-MM-DD]                               |
| **Azure Subscription** | [SUBSCRIPTION_NAME / ID]                 |
| **GitHub Repository** | [ORG/REPO_NAME]                           |

---

## 2. Project Description

[Provide a concise description of the project in 2-4 sentences. What is being built, for whom, and on what platform.]

---

## 3. Vision Statement

[One or two sentences describing the desired future state once the project is delivered. Keep it aspirational but grounded.]

---

## 4. Business Justification / Problem Statement

### Problem Statement

[Describe the business problem or opportunity this project addresses. Be specific about the pain points, inefficiencies, or gaps in current capabilities.]

### Business Justification

[Explain why this project should be funded and prioritized. Reference strategic alignment, revenue impact, cost savings, regulatory compliance, or competitive advantage as applicable.]

| Justification Category | Details                  |
|------------------------|--------------------------|
| Strategic Alignment    | [STRATEGIC_GOAL]         |
| Expected ROI           | [ROI_ESTIMATE]           |
| Cost of Inaction       | [RISK_IF_NOT_PURSUED]    |
| Regulatory Requirement | [REGULATION_IF_ANY]      |

---

## 5. Objectives and Success Criteria

Each objective must be measurable. Define KPIs that can be tracked post-delivery.

| # | Objective | KPI | Baseline | Target | Measurement Method |
|---|-----------|-----|----------|--------|--------------------|
| 1 | [OBJECTIVE_1] | [KPI_1] | [CURRENT_VALUE] | [TARGET_VALUE] | [HOW_MEASURED] |
| 2 | [OBJECTIVE_2] | [KPI_2] | [CURRENT_VALUE] | [TARGET_VALUE] | [HOW_MEASURED] |
| 3 | [OBJECTIVE_3] | [KPI_3] | [CURRENT_VALUE] | [TARGET_VALUE] | [HOW_MEASURED] |
| 4 | [OBJECTIVE_4] | [KPI_4] | [CURRENT_VALUE] | [TARGET_VALUE] | [HOW_MEASURED] |

---

## 6. Scope

### In-Scope

- [IN_SCOPE_ITEM_1]
- [IN_SCOPE_ITEM_2]
- [IN_SCOPE_ITEM_3]
- [IN_SCOPE_ITEM_4]

### Out-of-Scope

- [OUT_OF_SCOPE_ITEM_1]
- [OUT_OF_SCOPE_ITEM_2]
- [OUT_OF_SCOPE_ITEM_3]

### [OPTIONAL] Future Scope (Planned for Later Phases)

- [FUTURE_ITEM_1]
- [FUTURE_ITEM_2]

---

## 7. Key Assumptions and Constraints

### Assumptions

| # | Assumption | Impact if Invalid |
|---|------------|-------------------|
| 1 | [ASSUMPTION_1] | [IMPACT_1] |
| 2 | [ASSUMPTION_2] | [IMPACT_2] |
| 3 | [ASSUMPTION_3] | [IMPACT_3] |
| 4 | Azure resource quotas are sufficient for planned workloads | Deployment delays; quota increase requests needed |
| 5 | GitHub Actions runners (GitHub-hosted or self-hosted) are available and configured | CI/CD pipeline failures; blocked deployments |

### Constraints

| # | Constraint | Type |
|---|------------|------|
| 1 | [CONSTRAINT_1] | Budget / Time / Technical / Regulatory |
| 2 | [CONSTRAINT_2] | Budget / Time / Technical / Regulatory |
| 3 | All deployments must go through GitHub Actions CI/CD pipelines (no manual Azure deployments) | Process |
| 4 | Must comply with [SECURITY_FRAMEWORK] and pass Architecture Review Board (ARB) | Regulatory / Governance |
| 5 | [CONSTRAINT_5] | [TYPE] |

---

## 8. Budget Summary

[OPTIONAL] Include this section if budget tracking is managed at the project level.

| Category | Estimated Cost | Approved Budget | Notes |
|----------|---------------|-----------------|-------|
| Azure Infrastructure (monthly) | [AMOUNT] | [AMOUNT] | [RESOURCE_TYPES] |
| Azure Infrastructure (total project) | [AMOUNT] | [AMOUNT] | |
| Licensing / Third-Party Services | [AMOUNT] | [AMOUNT] | [TOOLS_OR_SERVICES] |
| Personnel (internal FTEs) | [AMOUNT] | [AMOUNT] | [HEADCOUNT] |
| Personnel (contractors / vendors) | [AMOUNT] | [AMOUNT] | [VENDOR_NAME] |
| Contingency ([PERCENT]%) | [AMOUNT] | [AMOUNT] | |
| **Total** | **[TOTAL]** | **[TOTAL]** | |

---

## 9. Timeline / Milestones

| # | Milestone | Description | Target Date | Status | Dependencies |
|---|-----------|-------------|-------------|--------|--------------|
| 1 | Project Kickoff | Team onboarded, charter approved | [YYYY-MM-DD] | NOT STARTED | Charter sign-off |
| 2 | Architecture Design Complete | ARB review passed, Azure resources defined | [YYYY-MM-DD] | NOT STARTED | Requirements finalized |
| 3 | CI/CD Pipeline Established | GitHub Actions workflows operational for all environments | [YYYY-MM-DD] | NOT STARTED | Repo and Azure service connections configured |
| 4 | Development Complete (MVP) | Core features implemented, unit tests passing | [YYYY-MM-DD] | NOT STARTED | Architecture approved |
| 5 | Security Review Passed | SAST/DAST scans clean, penetration test complete | [YYYY-MM-DD] | NOT STARTED | Development complete |
| 6 | UAT Sign-Off | Business stakeholders approve user acceptance testing | [YYYY-MM-DD] | NOT STARTED | QA complete |
| 7 | Production Go-Live | Deployment to Azure production environment | [YYYY-MM-DD] | NOT STARTED | All approvals obtained |
| 8 | Hypercare Complete | Post-go-live support period ends, handoff to operations | [YYYY-MM-DD] | NOT STARTED | Go-live stable |

---

## 10. Key Risks

Identify the top 5 risks. Use the scoring guide below.

**Likelihood:** Low (1) / Medium (2) / High (3)
**Impact:** Low (1) / Medium (2) / High (3)
**Risk Score:** Likelihood x Impact (1-9)

| # | Risk Description | Likelihood | Impact | Score | Mitigation Strategy | Owner |
|---|------------------|------------|--------|-------|---------------------|-------|
| 1 | [RISK_1] | [L/M/H] | [L/M/H] | [1-9] | [MITIGATION_1] | [OWNER] |
| 2 | [RISK_2] | [L/M/H] | [L/M/H] | [1-9] | [MITIGATION_2] | [OWNER] |
| 3 | Azure service outage impacts production availability | Medium | High | 6 | Multi-region deployment strategy; define RTO/RPO; configure Azure availability zones | [OWNER] |
| 4 | CI/CD pipeline failures block releases | Medium | Medium | 4 | Implement pipeline monitoring/alerting; maintain rollback workflows in GitHub Actions | [OWNER] |
| 5 | Key personnel unavailable (single points of failure) | Medium | High | 6 | Cross-train team members; document all processes; maintain runbooks | [OWNER] |

---

## 11. Approval Sign-Off

This charter is approved by the following stakeholders. Approval indicates agreement with the project scope, objectives, timeline, and budget as described above.

| Name | Role | Date | Signature |
|------|------|------|-----------|
| [SPONSOR_NAME] | Executive Sponsor | [YYYY-MM-DD] | |
| [PM_NAME] | Project Manager | [YYYY-MM-DD] | |
| [ARCH_NAME] | Lead Architect | [YYYY-MM-DD] | |
| [SECURITY_NAME] | Security Lead | [YYYY-MM-DD] | |
| [BIZ_NAME] | Business Owner | [YYYY-MM-DD] | |
| [DEVOPS_NAME] | DevOps / Platform Lead | [YYYY-MM-DD] | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | [YYYY-MM-DD] | [AUTHOR] | Initial draft |
