# Gate 1 - Design Review

| **Page Title**   | Gate 1 - Design Review - [PROJECT_NAME]       |
|------------------|------------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                                   |
| **Status**       | NOT STARTED / IN PROGRESS / COMPLETE           |
| **Owner**        | [GATE_OWNER_NAME]                              |
| **Gate Date**    | [YYYY-MM-DD]                                   |

---

## 1. Gate Purpose

Gate 1 validates that the project design is sound, stakeholders are aligned, and sufficient planning has been completed before significant development effort begins. This gate occurs **after requirements gathering and initial design, before full development starts**.

### Timing in Project Lifecycle

```
[Requirements] --> [Initial Design] --> ** GATE 1: Design Review ** --> [Development] --> [Gate 2] --> ...
```

---

## 2. Entry Criteria

All entry criteria must be satisfied before the Design Review can be scheduled. Items not met should be flagged and resolved before proceeding.

| # | Entry Criterion | Status (COMPLETE / NOT COMPLETE) | Evidence / Link | Owner |
|---|----------------|----------------------------------|-----------------|-------|
| 2.1 | Business requirements are documented and signed off by stakeholders | | [LINK] | [NAME] |
| 2.2 | Functional and non-functional requirements are defined | | [LINK] | [NAME] |
| 2.3 | High-Level Design (HLD) document is drafted | | [LINK] | [NAME] |
| 2.4 | Key stakeholders and reviewers are identified and confirmed | | [LINK] | [NAME] |
| 2.5 | Technology stack selection is documented with rationale | | [LINK] | [NAME] |
| 2.6 | Initial cost estimate for Azure resources is prepared | | [LINK] | [NAME] |
| 2.7 | Project timeline and milestones are drafted | | [LINK] | [NAME] |
| 2.8 | Dependencies on other teams or systems are identified | | [LINK] | [NAME] |
| 2.9 | Scope boundaries (in-scope / out-of-scope) are documented | | [LINK] | [NAME] |

**Entry Criteria Met:** YES / NO

**If NO, reason and expected resolution date:** [DETAILS]

---

## 3. Review Agenda / Focus Areas

The Design Review should cover the following areas:

| # | Focus Area | Duration (est.) | Presenter | Notes |
|---|-----------|-----------------|-----------|-------|
| 1 | Business context and problem statement | 10 min | [PRODUCT_OWNER] | Why are we building this? |
| 2 | Requirements walkthrough (functional and non-functional) | 15 min | [BUSINESS_ANALYST] | Key user stories and acceptance criteria |
| 3 | High-Level Design and architecture overview | 20 min | [SOLUTION_ARCHITECT] | Components, interactions, Azure services |
| 4 | Technology stack and justification | 10 min | [TECH_LEAD] | Why these choices? Alternatives considered? |
| 5 | Data model and data flow overview | 10 min | [SOLUTION_ARCHITECT] | Entity relationships, data movement |
| 6 | Security considerations (initial) | 10 min | [SECURITY_LEAD] | Authentication, authorization, data classification |
| 7 | Integration points and dependencies | 10 min | [TECH_LEAD] | External systems, APIs, shared services |
| 8 | Risks, assumptions, and constraints | 10 min | [PROJECT_MANAGER] | What could go wrong? What are we assuming? |
| 9 | Cost estimate and resource requirements | 5 min | [PROJECT_MANAGER] | Azure cost projection, team staffing |
| 10 | Q&A and open discussion | 20 min | All | |

**Total Estimated Duration:** 2 hours

---

## 4. Exit Criteria

All exit criteria must be met for the gate to pass. Conditional approval may be granted with documented action items.

| # | Exit Criterion | Status (COMPLETE / NOT COMPLETE) | Evidence / Link | Owner |
|---|---------------|----------------------------------|-----------------|-------|
| 4.1 | Architecture approach is reviewed and accepted by reviewers | | [LINK] | [NAME] |
| 4.2 | Key risks are identified and documented with initial mitigation strategies | | [LINK] | [NAME] |
| 4.3 | Architecture Decision Records (ADRs) are created for significant decisions | | [LINK] | [NAME] |
| 4.4 | Non-functional requirements (performance, scalability, security) are addressed in the design | | [LINK] | [NAME] |
| 4.5 | Integration strategy for dependent systems is defined | | [LINK] | [NAME] |
| 4.6 | Data model is reviewed and accepted | | [LINK] | [NAME] |
| 4.7 | Security considerations are acknowledged and a threat model is planned | | [LINK] | [NAME] |
| 4.8 | Cost estimate is within approved budget range | | [LINK] | [NAME] |
| 4.9 | No unresolved blocking concerns from reviewers | | [LINK] | [NAME] |

---

## 5. Gate Decision

| Decision | Description |
|----------|-------------|
| **APPROVED** | All exit criteria met. Project proceeds to development. |
| **APPROVED WITH CONDITIONS** | Exit criteria substantially met. Project may proceed but must resolve conditions by specified dates. |
| **REJECTED** | Significant gaps identified. Project must rework design and re-submit for review. |

### Decision Outcome

| Field | Value |
|-------|-------|
| **Decision** | APPROVED / APPROVED WITH CONDITIONS / REJECTED |
| **Decision Date** | [YYYY-MM-DD] |
| **Decision Rationale** | [BRIEF_RATIONALE] |
| **Next Gate Target** | Gate 2 - Architecture Review Board: [YYYY-MM-DD] |

---

## 6. Conditions / Action Items

> Complete this section if the decision is **APPROVED WITH CONDITIONS**. All conditions must be resolved by the target date for the approval to remain valid.

| # | Condition / Action Item | Priority (High / Medium / Low) | Owner | Target Date | Status (NOT STARTED / IN PROGRESS / COMPLETE) |
|---|------------------------|-------------------------------|-------|-------------|----------------------------------------------|
| 1 | [ACTION_ITEM_DESCRIPTION] | [PRIORITY] | [NAME] | [YYYY-MM-DD] | NOT STARTED |
| 2 | [ACTION_ITEM_DESCRIPTION] | [PRIORITY] | [NAME] | [YYYY-MM-DD] | NOT STARTED |
| 3 | [ACTION_ITEM_DESCRIPTION] | [PRIORITY] | [NAME] | [YYYY-MM-DD] | NOT STARTED |

---

## 7. Attendees and Sign-Off

| Name | Role | Decision (Approve / Approve with Conditions / Reject) | Date |
|------|------|-------------------------------------------------------|------|
| [SOLUTION_ARCHITECT] | Solution Architect | | [YYYY-MM-DD] |
| [TECH_LEAD] | Technical Lead | | [YYYY-MM-DD] |
| [PRODUCT_OWNER] | Product Owner | | [YYYY-MM-DD] |
| [PROJECT_MANAGER] | Project Manager | | [YYYY-MM-DD] |
| [SECURITY_LEAD] | Security Lead | | [YYYY-MM-DD] |
| [ENGINEERING_MANAGER] | Engineering Manager | | [YYYY-MM-DD] |
| [STAKEHOLDER_NAME] | [STAKEHOLDER_ROLE] | | [YYYY-MM-DD] |

---

## 8. Meeting Notes

**Date:** [YYYY-MM-DD]

**Key Discussion Points:**

- [DISCUSSION_POINT_1]
- [DISCUSSION_POINT_2]
- [DISCUSSION_POINT_3]

**Concerns Raised:**

- [CONCERN_1]
- [CONCERN_2]

**Decisions Made:**

- [DECISION_1]
- [DECISION_2]
