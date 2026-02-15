# Gate 2 - Architecture Review Board (ARB)

| **Page Title**   | Gate 2 - Architecture Review Board - CMMC Assessor Platform |
|------------------|--------------------------------------------------------------|
| **Last Updated** | 2026-02-14                                                   |
| **Status**       | COMPLETE                                                     |
| **Owner**        | CTO, IntelliSec Solutions                                    |
| **Gate Date**    | 2026-01-27                                                   |

---

## 1. Gate Purpose

Gate 2 ensures the proposed architecture aligns with Azure best practices, is scalable, cost-effective, secure, and operationally sound before the project progresses beyond core development. For the CMMC Assessor Platform, this review evaluated the multi-tenant architecture, Azure Container Apps deployment model, data isolation strategy, and operational readiness of the IaC and CI/CD pipelines. Given the small team size at IntelliSec Solutions, the ARB was conducted as an internal architecture review rather than a formal enterprise board.

### Timing in Project Lifecycle

```
[Gate 1: Design Review] --> [Core Development] --> ** GATE 2: ARB ** --> [Security Review / Testing] --> [Gate 3] --> ...
```

---

## 2. Entry Criteria

| # | Entry Criterion | Status (COMPLETE / NOT COMPLETE) | Evidence / Link | Owner |
|---|----------------|----------------------------------|-----------------|-------|
| 2.1 | Gate 1 (Design Review) has been passed | COMPLETE | Gate 1 approved 2026-01-06 | CTO |
| 2.2 | High-Level Design (HLD) is complete and finalized | COMPLETE | Architecture documented: React 18 + Express + PostgreSQL 17 on Container Apps | CTO |
| 2.3 | Architecture Decision Records (ADRs) are documented for all significant decisions | COMPLETE | ADR-001 through ADR-004 covering Container Apps, Prisma, Entra ID, React 18 | CTO |
| 2.4 | Technology choices are justified with alternatives analysis | COMPLETE | Container Apps vs AKS vs App Service; Prisma vs Knex vs TypeORM; Entra ID vs Auth0 vs Cognito | CTO |
| 2.5 | Security considerations are addressed (initial threat model or security assessment) | COMPLETE | Initial security design: Entra ID OAuth, two-tier RBAC, AES-256-GCM token encryption, tenant isolation, audit logging | CTO |
| 2.6 | Non-functional requirements (performance, scalability, availability) are defined with targets | COMPLETE | P95 latency < 500ms, support 100 concurrent organizations, 99.9% availability (Azure SLA) | CTO |
| 2.7 | Infrastructure-as-Code (IaC) approach is defined (Bicep) | COMPLETE | Bicep modules for Container Apps, ACR, PostgreSQL, Key Vault, Blob Storage, Log Analytics | DevOps Lead |
| 2.8 | CI/CD pipeline design is documented (GitHub Actions workflows) | COMPLETE | GitHub Actions with OIDC federated credentials; build, test, deploy workflows; environment protection rules | DevOps Lead |
| 2.9 | Data architecture and data flow diagrams are complete | COMPLETE | Multi-tenant PostgreSQL schema; data flows documented (Browser -> Container Apps -> PostgreSQL -> Graph API) | CTO |
| 2.10 | Azure resource cost model is prepared | COMPLETE | Azure Pricing Calculator: ~$150-200/month for MVP (Container Apps consumption + PostgreSQL B1ms + supporting services) | DevOps Lead |
| 2.11 | Conditions from Gate 1 (if any) are resolved | COMPLETE | All Gate 1 action items completed: Prisma middleware documented, naming convention finalized, GitHub repo set up with OIDC | Dev Lead |

**Entry Criteria Met:** YES

---

## 3. Review Areas

### 3.1 Enterprise Standards Compliance

| # | Review Item | Status (PASS / FAIL / N/A) | Findings / Notes | Reviewer |
|---|-----------|---------------------------|------------------|----------|
| 3.1.1 | Architecture follows Azure reference architecture patterns | PASS | Follows Azure Container Apps microservices pattern; aligns with Azure Well-Architected Framework principles for serverless containers | CTO |
| 3.1.2 | Naming conventions align with organizational standards | PASS | Consistent naming: `intellisec-cmmc-{env}-{resource}` pattern across all Azure resources | DevOps Lead |
| 3.1.3 | Azure resource tagging strategy follows policy | PASS | Tags defined: environment, project, cost-center, managed-by (Bicep) | DevOps Lead |
| 3.1.4 | Azure subscription topology is appropriate | PASS | Single subscription for MVP; production and staging environments in same subscription with resource group separation | DevOps Lead |
| 3.1.5 | CI/CD follows GitHub Actions best practices | PASS | OIDC federated credentials (no stored secrets), environment protection rules, branch protection on main, reusable workflows | DevOps Lead |
| 3.1.6 | IaC modules use appropriate patterns | PASS | Bicep modules with parameter files per environment; idempotent deployments; outputs for cross-resource references | DevOps Lead |

### 3.2 Scalability

| # | Review Item | Status (PASS / FAIL / N/A) | Findings / Notes | Reviewer |
|---|-----------|---------------------------|------------------|----------|
| 3.2.1 | Horizontal scaling strategy is defined for compute tier | PASS | Container Apps auto-scaling based on HTTP concurrent requests; min replicas = 0 (dev), 1 (prod); max replicas configurable | CTO |
| 3.2.2 | Database scaling strategy is defined | PASS | PostgreSQL Flexible Server Burstable B1ms for MVP; vertical scaling to General Purpose tier when needed; read replicas available on GP tier | CTO |
| 3.2.3 | Caching strategy is appropriate for read-heavy workloads | N/A | MVP does not include caching layer; CMMC control library is static and could benefit from caching in future. Redis or in-memory caching to be evaluated post-MVP. | CTO |
| 3.2.4 | Async processing / message queuing is used for long-running operations | N/A | No long-running operations in MVP; PDF report generation (future) may require async processing | CTO |
| 3.2.5 | Performance targets are defined and architecture supports them at projected load | PASS | P95 < 500ms for API responses at 100 concurrent organizations; Container Apps scaling and PostgreSQL connection pooling via Prisma support this target | CTO |

### 3.3 Cost Optimization

| # | Review Item | Status (PASS / FAIL / N/A) | Findings / Notes | Reviewer |
|---|-----------|---------------------------|------------------|----------|
| 3.3.1 | Azure resource SKUs are right-sized for expected workload | PASS | Container Apps consumption plan (pay per request); PostgreSQL Burstable B1ms (appropriate for MVP load); ACR Basic | DevOps Lead |
| 3.3.2 | Reserved Instances or Savings Plans are considered for steady-state workloads | N/A | MVP stage; consumption pricing is more appropriate than reserved capacity. Re-evaluate after 3 months of production data. | DevOps Lead |
| 3.3.3 | Auto-scaling is configured to scale down during low-traffic periods | PASS | Container Apps scales to zero in non-production; minimum 1 replica in production for availability | DevOps Lead |
| 3.3.4 | Non-production environments use lower-cost SKUs or are scheduled for shutdown | PASS | Dev environment uses Container Apps scale-to-zero and PostgreSQL Burstable B1ms; no always-on resources in dev | DevOps Lead |
| 3.3.5 | Monthly cost estimate is documented and within budget | PASS | Estimated $150-200/month for MVP production (Container Apps + PostgreSQL + ACR + Key Vault + Blob Storage + Log Analytics) | DevOps Lead |
| 3.3.6 | Cost alerting and budgets are configured in Azure Cost Management | FAIL | Azure budget alerts not yet configured; should be set up before production deployment | DevOps Lead |

### 3.4 Security Posture

| # | Review Item | Status (PASS / FAIL / N/A) | Findings / Notes | Reviewer |
|---|-----------|---------------------------|------------------|----------|
| 3.4.1 | Identity and access management uses Entra ID with least privilege | PASS | Entra ID OAuth 2.0/OIDC; two-tier RBAC (platform + team roles); principle of least privilege applied to role definitions | CTO |
| 3.4.2 | Network segmentation and private endpoints are properly designed | FAIL | No VNet integration or private endpoints in current design; all services communicate over public endpoints with TLS. Flagged for security review (Gate 3). | CTO |
| 3.4.3 | Encryption strategy covers data at rest and in transit | PASS | Azure-managed TDE for PostgreSQL; AES-256-GCM for Graph API tokens; TLS 1.2+ for all transit; bcrypt for passwords | CTO |
| 3.4.4 | Secret management uses Azure Key Vault with Managed Identities | FAIL | Key Vault provisioned via Bicep but not yet integrated into Container Apps configuration; secrets currently in environment variables. Flagged for remediation. | DevOps Lead |
| 3.4.5 | Security monitoring and alerting is planned | FAIL | Azure Monitor / Log Analytics provisioned but not configured for security alerting; Microsoft Defender for Cloud not enabled. To be addressed in Gate 3. | DevOps Lead |

### 3.5 Vendor Lock-In Risk

| # | Review Item | Status (PASS / FAIL / N/A) | Findings / Notes | Reviewer |
|---|-----------|---------------------------|------------------|----------|
| 3.5.1 | Proprietary service dependencies are identified and justified | PASS | Azure Container Apps (could migrate to any container platform), PostgreSQL (standard), Entra ID (replaceable with any OIDC provider), Graph API (unique to Microsoft ecosystem but core to product value) | CTO |
| 3.5.2 | Data portability strategy is documented | PASS | PostgreSQL is fully portable; Prisma ORM abstracts database; tenant data can be exported via API; evidence files remain in client's SharePoint | CTO |
| 3.5.3 | Application code uses abstractions over cloud-specific SDKs where practical | PASS | Prisma abstracts database; standard Node.js HTTP for Graph API; Azure SDK used only for Key Vault and Blob Storage (replaceable) | CTO |
| 3.5.4 | Risk of vendor lock-in is acknowledged and accepted | PASS | Primary lock-in: Microsoft Graph API for SharePoint integration (core product feature, not mitigatable). Azure infrastructure is portable. Accepted. | CTO |

### 3.6 Operational Readiness

| # | Review Item | Status (PASS / FAIL / N/A) | Findings / Notes | Reviewer |
|---|-----------|---------------------------|------------------|----------|
| 3.6.1 | Monitoring and observability strategy is defined | PASS | Azure Monitor for infrastructure; application-level audit logging; Container Apps system logs; Log Analytics for aggregation | DevOps Lead |
| 3.6.2 | Alerting strategy is defined with appropriate severity levels | FAIL | Alerting strategy not yet implemented; needs to be configured before production | DevOps Lead |
| 3.6.3 | High availability and disaster recovery strategy meets RPO/RTO targets | PASS | RPO: 24 hours (PostgreSQL daily backups); RTO: 2 hours (Bicep redeployment + backup restore); single-region deployment acceptable for MVP | DevOps Lead |
| 3.6.4 | Backup and restore strategy is defined and testable | PASS | PostgreSQL automated backups with 7-day retention; Bicep for infrastructure recreation; Container images in ACR for app recovery | DevOps Lead |
| 3.6.5 | Deployment strategy supports zero-downtime deployments | PASS | Container Apps revision-based deployments with traffic splitting; multiple revisions support blue/green pattern; Prisma migrations run before traffic shift | DevOps Lead |
| 3.6.6 | Runbook / operational playbook scope is defined | FAIL | Runbooks not yet created; scope defined (deployment, rollback, incident response, database maintenance) but not documented | DevOps Lead |

---

## 4. Exit Criteria

| # | Exit Criterion | Status (COMPLETE / NOT COMPLETE) | Evidence / Link | Owner |
|---|---------------|----------------------------------|-----------------|-------|
| 4.1 | All review areas assessed with no unresolved FAIL items (or accepted with conditions) | COMPLETE | 5 FAIL items identified and accepted as conditions; all relate to security and operational hardening planned for Gate 3 | CTO |
| 4.2 | Architecture aligns with Azure reference patterns or deviations are approved | COMPLETE | Follows Container Apps reference architecture; no VNet deviation accepted for MVP with condition to remediate | CTO |
| 4.3 | Cost model is approved and within budget | COMPLETE | $150-200/month approved; cost alerts to be configured as condition | DevOps Lead |
| 4.4 | Security posture is acceptable for this stage (detailed review in Gate 3) | COMPLETE | Security gaps identified (no VNet, no Key Vault integration, no monitoring); accepted as conditions with Gate 3 as enforcement point | CTO |
| 4.5 | Operational readiness plan is accepted | COMPLETE | Monitoring provisioned; alerting and runbooks deferred as conditions | DevOps Lead |
| 4.6 | All ADRs are reviewed and endorsed | COMPLETE | ADR-001 through ADR-004 reviewed and endorsed | CTO |
| 4.7 | No blocking concerns from reviewers | COMPLETE | All concerns documented as conditions; no blockers | All |

---

## 5. Gate Decision

| Decision | Description |
|----------|-------------|
| **APPROVED WITH CONDITIONS** | Architecture is acceptable with documented conditions that must be resolved by specified dates. |

### Decision Outcome

| Field | Value |
|-------|-------|
| **Decision** | APPROVED WITH CONDITIONS |
| **Decision Date** | 2026-01-27 |
| **Decision Rationale** | Architecture is sound for MVP scope. Container Apps, PostgreSQL, Entra ID, and Prisma choices are well-justified. Multi-tenancy design is appropriate. Five conditions identified in security posture and operational readiness -- all are planned for resolution before or during Gate 3 (Security Review). No architectural changes required. |
| **Next Gate Target** | Gate 3 - Security Review: 2026-02-11 |

---

## 6. Conditions / Action Items

| # | Condition / Action Item | Priority (High / Medium / Low) | Owner | Target Date | Status |
|---|------------------------|-------------------------------|-------|-------------|--------|
| 1 | Evaluate and plan VNet integration with private endpoints for PostgreSQL, Key Vault, ACR (security posture 3.4.2) | High | DevOps Lead | 2026-02-11 (Gate 3) | IN PROGRESS |
| 2 | Integrate Key Vault references into Container Apps configuration; remove secrets from environment variables (security posture 3.4.4) | High | DevOps Lead | 2026-02-25 | IN PROGRESS |
| 3 | Configure Azure Monitor alerting rules for critical application and infrastructure events (operational readiness 3.6.2) | Medium | DevOps Lead | 2026-02-25 | NOT STARTED |
| 4 | Create operational runbooks for deployment, rollback, and incident response (operational readiness 3.6.6) | Medium | DevOps Lead | 2026-02-25 | NOT STARTED |
| 5 | Configure Azure budget alerts in Cost Management (cost optimization 3.3.6) | Low | DevOps Lead | 2026-02-25 | NOT STARTED |

---

## 7. Attendees and Sign-Off

| Name | Role | Decision (Approve / Approve with Conditions / Reject) | Date |
|------|------|-------------------------------------------------------|------|
| (CTO) | Chief Architect / CTO | Approve with Conditions | 2026-01-27 |
| (Dev Lead) | Technical Lead | Approve with Conditions | 2026-01-27 |
| (DevOps Lead) | Platform / Cloud Lead | Approve with Conditions | 2026-01-27 |
| (Product Owner) | Product Owner | Approve with Conditions | 2026-01-27 |

---

## 8. Meeting Notes

**Date:** 2026-01-27

**Key Discussion Points:**

- Core architecture (Container Apps + Express + PostgreSQL + Entra ID) is well-implemented and follows Azure best practices for serverless container workloads.
- Multi-tenant data isolation via Prisma middleware is effective and prevents accidental cross-tenant queries at the ORM level; this is a strong architectural choice.
- OIDC federated credentials for CI/CD are a security best practice; team should be commended for avoiding stored secrets.
- Bicep IaC is well-structured with per-environment parameter files and modular design.
- Identified that network security (VNet, private endpoints) was intentionally deferred for MVP speed but must be addressed before production. Team agreed this is the highest priority condition.

**Concerns Raised:**

- No VNet isolation means all Azure services are accessible over public internet endpoints. While TLS encrypts all traffic, this is not acceptable for a platform handling CUI metadata in production. Must be remediated.
- Key Vault was provisioned but never connected to the application; secrets are in environment variables. This undermines the purpose of having Key Vault.
- No alerting means the team would not know about outages or security incidents until users report them.

**Decisions Made:**

- Architecture is approved with 5 conditions.
- VNet integration and private endpoints are the highest priority condition; should be designed before Gate 3 security review.
- Key Vault integration to be completed during Phase 2 of the security remediation plan.
- Proceed to Gate 3 (Security Review) with a formal security assessment planned.
