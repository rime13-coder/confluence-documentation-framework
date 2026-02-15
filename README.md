# Confluence Documentation Framework

## Purpose

This repository contains a complete set of Confluence page templates for documenting software development projects following **standard enterprise best practices**. Each template is designed to be imported directly into a Confluence space.

## Target Stack

- **Source Control & CI/CD**: GitHub + GitHub Actions
- **Cloud Platform**: Microsoft Azure (mixed services: AKS, App Service, Functions, VMs, etc.)
- **Project Type**: Multiple independent applications
- **Governance Level**: Standard enterprise (multi-gate approval process)

---

## Confluence Space Structure

For **each project**, create a Confluence space (or top-level page) with the following hierarchy:

```
[Project Name] Home
│
├── 01 - Project Overview
│   ├── Project Charter
│   ├── Stakeholders & RACI Matrix
│   └── Project Glossary
│
├── 02 - Solution Architecture
│   ├── Architecture Overview (HLD)
│   ├── Low-Level Design (LLD)
│   ├── Data Architecture
│   ├── Integration Architecture
│   └── Architecture Decision Records (ADRs)
│       └── ADR-001: [Template]
│
├── 03 - Security
│   ├── Threat Model
│   ├── Security Review Checklist
│   └── Data Classification
│
├── 04 - Approval Gates
│   ├── Gate 1 - Design Review
│   ├── Gate 2 - Architecture Review Board (ARB)
│   ├── Gate 3 - Security Review
│   ├── Gate 4 - Change Advisory Board (CAB)
│   └── Gate 5 - Go / No-Go Checklist
│
├── 05 - CI/CD Pipeline
│   ├── GitHub Actions Overview
│   ├── Build Pipeline
│   ├── Release Pipeline
│   └── Environment Strategy
│
├── 06 - Testing
│   ├── Test Strategy
│   ├── Unit Testing
│   ├── Integration Testing
│   ├── Performance Testing
│   ├── Security Testing (SAST / DAST)
│   └── UAT Sign-Off
│
├── 07 - Deployment Architecture
│   ├── Azure Infrastructure Overview
│   ├── Environment Architecture (Dev / Staging / Prod)
│   ├── Infrastructure as Code (IaC)
│   ├── Networking & Security
│   └── Disaster Recovery & Business Continuity
│
├── 08 - Operations
│   ├── Runbook
│   ├── Monitoring & Alerting
│   ├── Incident Response Plan
│   └── SLA / SLO Definitions
│
└── 09 - Release Management
    ├── Release Notes Template
    ├── Rollback Procedures
    └── Post-Deployment Verification
```

---

## How to Use These Templates

### Option 1: Manual Copy-Paste
1. Open the relevant `.md` template file
2. Create a new Confluence page
3. Paste the content (Confluence handles markdown reasonably well)
4. Replace all `[PLACEHOLDER]` values with project-specific information

### Option 2: Confluence REST API Import
Use the Confluence REST API to bulk-create pages. A helper script is provided:
```bash
# See scripts/import-to-confluence.sh for automated import
```

### Option 3: Confluence Cloud Markdown Macro
If using Confluence Cloud, install the "Markdown" macro and embed the templates directly.

---

## Template Conventions

| Convention | Meaning |
|---|---|
| `[PLACEHOLDER]` | Must be replaced with project-specific info |
| `[OPTIONAL]` | Include only if relevant to your project |
| `<!-- COMMENT -->` | Guidance for the author, remove before publishing |
| Status macros: `NOT STARTED` / `IN PROGRESS` / `COMPLETE` | Track section completion |
| `TBD` | To be determined - flag for follow-up |

---

## Folder Structure in This Repository

```
templates/
├── 01-project-overview/
│   ├── project-charter.md
│   ├── stakeholders-raci.md
│   └── project-glossary.md
├── 02-solution-architecture/
│   ├── architecture-overview-hld.md
│   ├── low-level-design.md
│   ├── data-architecture.md
│   ├── integration-architecture.md
│   └── adr-template.md
├── 03-security/
│   ├── threat-model.md
│   ├── security-review-checklist.md
│   └── data-classification.md
├── 04-approval-gates/
│   ├── gate-1-design-review.md
│   ├── gate-2-architecture-review-board.md
│   ├── gate-3-security-review.md
│   ├── gate-4-change-advisory-board.md
│   └── gate-5-go-no-go-checklist.md
├── 05-cicd-pipeline/
│   ├── github-actions-overview.md
│   ├── build-pipeline.md
│   ├── release-pipeline.md
│   └── environment-strategy.md
├── 06-testing/
│   ├── test-strategy.md
│   ├── unit-testing.md
│   ├── integration-testing.md
│   ├── performance-testing.md
│   ├── security-testing.md
│   └── uat-signoff.md
├── 07-deployment-architecture/
│   ├── azure-infrastructure-overview.md
│   ├── environment-architecture.md
│   ├── infrastructure-as-code.md
│   ├── networking-and-security.md
│   └── disaster-recovery.md
├── 08-operations/
│   ├── runbook.md
│   ├── monitoring-and-alerting.md
│   ├── incident-response-plan.md
│   └── sla-slo-definitions.md
└── 09-release-management/
    ├── release-notes-template.md
    ├── rollback-procedures.md
    └── post-deployment-verification.md
```

---

## Best Practices Embedded in These Templates

1. **Traceability**: Every decision links back to requirements, every deployment links to a change ticket
2. **Approval Gates**: Clear entry/exit criteria at each gate with sign-off records
3. **Security by Design**: Threat modeling and security review baked into the lifecycle, not bolted on
4. **Infrastructure as Code**: All Azure resources defined in code (Terraform/Bicep), never manual
5. **Environment Parity**: Dev/Staging/Prod environments mirror each other as closely as possible
6. **Automated Testing Pyramid**: Unit > Integration > E2E, with security scanning at every level
7. **GitOps Workflow**: GitHub Actions triggers are branch/tag-based with environment protections
8. **Observability**: Logging, metrics, tracing, and alerting defined before go-live
9. **Rollback-First Thinking**: Every deployment plan includes a rollback procedure
10. **Living Documentation**: Templates include "Last Reviewed" dates to prevent staleness
