# Gate 2 - Architecture Review Board (ARB)

| **Page Title**   | Gate 2 - Architecture Review Board - M365 Security Assessment Automation |
|------------------|--------------------------------------------------------------------------|
| **Last Updated** | 2026-02-15                                                               |
| **Status**       | COMPLETE (Phases 1-3) / NOT STARTED (Phase 4)                           |
| **Owner**        | CTO, IntelliSec Solutions (CloudSecOps)                                  |
| **Gate Date**    | Phase 1: 2025-06-23 / Phase 2: 2025-09-22 / Phase 3: 2025-12-08        |

---

## 1. Gate Purpose

Gate 2 ensures the proposed module architecture follows established patterns, integrates correctly with the modular assessment framework, and is operationally sound before development progresses beyond initial implementation. For the M365-SecurityAssessment PowerShell module (v1.0.0), this review evaluates the collector caching strategy, check function deduplication, error handling patterns, Graph API pagination, checkpoint integration, and compliance with the modular framework conventions. Given the project is an internal PowerShell tool (not a deployed web application), the ARB focuses on code architecture and API integration patterns rather than cloud infrastructure.

### Timing in Project Lifecycle

```
[Gate 1: Design Review] --> [Initial Module Development] --> ** GATE 2: ARB ** --> [Testing / Security Review] --> [Gate 3] --> ...
```

---

## 2. Entry Criteria

| # | Entry Criterion | Status | Evidence / Link | Owner |
|---|----------------|--------|-----------------|-------|
| 2.1 | Gate 1 (Design Review) has been passed for the module(s) under review | COMPLETE (Phases 1-3) | Gate 1 approved: Phase 1 (2025-06-02), Phase 2 (2025-09-01), Phase 3 (2025-11-15) | CTO |
| 2.2 | Module.json is complete and follows the standardized schema | COMPLETE (Phases 1-3) | Module.json validated against JSON schema for EntraID, DeviceManagement, EmailProtection, TeamsSharePoint | CTO |
| 2.3 | Initial collector and check functions are implemented (at least 50%) | COMPLETE (Phases 1-3) | Phase 1: 39/39 checks; Phase 2: 18/18 checks; Phase 3: 30/30 checks implemented | Lead Developer |
| 2.4 | Module follows the established collector/check pattern from Phase 1 | COMPLETE (Phases 2-3) | DeviceManagement, EmailProtection, and TeamsSharePoint modules follow EntraID patterns | Lead Developer |
| 2.5 | API permissions are tested against a test tenant | COMPLETE (Phases 1-3) | All Graph API calls verified in test M365 tenant; permissions confirmed as sufficient and least-privilege | Lead Developer |
| 2.6 | Conditions from Gate 1 (if any) are resolved | COMPLETE | All Gate 1 action items completed: permission scoping documented, Module.json validator created, caching strategy documented | Lead Developer |

**Entry Criteria Met:** YES (Phases 1-3)

---

## 3. Review Areas

### 3.1 Modular Framework Compliance

| # | Review Item | Status | Findings / Notes | Reviewer |
|---|------------|--------|------------------|----------|
| 3.1.1 | Module follows standardized Module.json schema | PASS | All modules declare Name, Version, RequiredPermissions, Collectors, Checks, and FindingDefinitions consistently | CTO |
| 3.1.2 | Module can be loaded and invoked independently by the framework | PASS | Each module exports standard entry point (`Invoke-{Module}Assessment`); framework discovers and loads modules dynamically from the modules directory | Lead Developer |
| 3.1.3 | Module does not have undeclared dependencies on other modules | PASS | Cross-module dependencies (e.g., DeviceManagement reusing EntraID Conditional Access data) are declared in Module.json DependsOn field | Lead Developer |
| 3.1.4 | Finding definitions in findings.json match the checks implemented | PASS | 1:1 mapping verified between check functions and finding definitions for all 87 checks across Phases 1-3 | CTO |
| 3.1.5 | Module naming conventions follow the established standard | PASS | Module names, function names, and file names follow `{Verb}-{Module}{Noun}` PowerShell convention (e.g., `Get-EntraIDConditionalAccessPolicies`, `Test-EntraIDMFAEnforcement`) | Lead Developer |
| 3.1.6 | Module version is consistent across Module.json, manifest, and findings.json | PASS | Version 1.0.0 consistent across all metadata files | Lead Developer |

### 3.2 Collector Caching Strategy

| # | Review Item | Status | Findings / Notes | Reviewer |
|---|------------|--------|------------------|----------|
| 3.2.1 | Collectors cache API responses to avoid redundant calls | PASS | In-memory hashtable cache keyed by collector name; cache persists for duration of module assessment run; multiple checks sharing a collector retrieve cached data | Lead Developer |
| 3.2.2 | Cache invalidation is handled correctly | PASS | Cache is scoped to a single assessment run; cleared when assessment completes or module changes; no stale data risk within a run | Lead Developer |
| 3.2.3 | Cache key strategy prevents collisions across modules | PASS | Cache keys use `{ModuleName}:{CollectorName}` format; no collisions observed in cross-module testing | Lead Developer |
| 3.2.4 | Collector failures are cached to prevent retry storms | PASS | Failed collectors are cached with error status; dependent checks receive the error status and produce `Error` findings rather than retrying the failed API call | Lead Developer |
| 3.2.5 | Shared collectors between modules are handled correctly | PASS | When DeviceManagement module depends on EntraID Conditional Access data, the framework passes cached data from the EntraID run if available, or invokes the collector independently if EntraID module was not run | Lead Developer |

### 3.3 Check Deduplication

| # | Review Item | Status | Findings / Notes | Reviewer |
|---|------------|--------|------------------|----------|
| 3.3.1 | No duplicate checks exist across modules | PASS | All 87 checks have unique FindingIDs; no overlapping assessment logic between modules | CTO |
| 3.3.2 | Checks that assess similar settings in different contexts are properly differentiated | PASS | Example: ENTRAID-CA-005 (MFA via Conditional Access) and DM-COMP-002 (MFA compliance requirement for devices) assess different aspects of MFA; no logic overlap | CTO |
| 3.3.3 | Check functions do not contain redundant API calls (use cached collector data) | PASS | All check functions receive collector data as input parameters; no direct API calls within check functions | Lead Developer |

### 3.4 Error Handling

| # | Review Item | Status | Findings / Notes | Reviewer |
|---|------------|--------|------------------|----------|
| 3.4.1 | Graph API throttling (429) is handled with exponential backoff | PASS | `Invoke-GraphRequest` wrapper implements exponential backoff with jitter; max 5 retries; respects Retry-After header | Lead Developer |
| 3.4.2 | Authentication failures produce clear error messages | PASS | Certificate not found, expired certificate, insufficient permissions, and invalid tenant ID all produce specific, actionable error messages | Lead Developer |
| 3.4.3 | Missing permissions are detected and reported gracefully | PASS | 403 Forbidden responses are caught per collector; finding result set to `Error` with message indicating which permission is missing; assessment continues with remaining checks | Lead Developer |
| 3.4.4 | Network connectivity failures are handled | PASS | Connection timeout and DNS resolution failures produce `Error` findings with retry guidance; checkpoint saves progress so assessment can be resumed | Lead Developer |
| 3.4.5 | Individual check failures do not halt the entire assessment | PASS | Try/catch around each check function; failures logged and finding set to `Error`; assessment continues with next check | Lead Developer |
| 3.4.6 | Error details are logged but sensitive data (tokens, secrets) is never logged | PASS | Error logging includes HTTP status codes, endpoint URLs, and error messages; access tokens, client secrets, and certificate thumbprints are redacted from all log output | CTO |

### 3.5 Graph API Pagination

| # | Review Item | Status | Findings / Notes | Reviewer |
|---|------------|--------|------------------|----------|
| 3.5.1 | All Graph API responses that support pagination handle `@odata.nextLink` | PASS | `Invoke-GraphRequest` wrapper automatically follows nextLink until all pages are retrieved; collector returns complete dataset | Lead Developer |
| 3.5.2 | Page size is set appropriately to balance performance and API limits | PASS | Default `$top=100` for list endpoints; adjustable per collector; stays within Graph API maximum page size limits | Lead Developer |
| 3.5.3 | Large result sets are handled without excessive memory consumption | PASS | Results accumulated in a List<PSObject>; for very large tenants (10,000+ objects), pagination processes pages sequentially and appends; no full-dataset memory duplication | Lead Developer |
| 3.5.4 | Pagination errors mid-stream are handled gracefully | PASS | If a pagination request fails, collected pages so far are returned with a warning; check functions handle partial data by producing findings with `Warning` notes | Lead Developer |

### 3.6 Checkpoint Integration

| # | Review Item | Status | Findings / Notes | Reviewer |
|---|------------|--------|------------------|----------|
| 3.6.1 | Checkpoint file is written after each completed check | PASS | `.checkpoint` JSON file updated after each check; records completed checks, their results, and timestamp | Lead Developer |
| 3.6.2 | Assessment can resume from checkpoint after interruption | PASS | On resume, framework reads checkpoint file and skips completed checks; collector cache is rebuilt for remaining checks | Lead Developer |
| 3.6.3 | Checkpoint file format is documented and versioned | PASS | Checkpoint schema version 1.0; includes AssessmentID, ModuleName, CompletedChecks[], Timestamp, FrameworkVersion | Lead Developer |
| 3.6.4 | Stale checkpoints are detected and handled | PASS | Checkpoint older than 24 hours triggers a warning; user prompted to resume or restart; module version mismatch between checkpoint and current module forces restart | Lead Developer |
| 3.6.5 | Checkpoint data does not contain sensitive information | PASS | Checkpoint stores check IDs and pass/fail results only; no API responses, tokens, or tenant configuration data in checkpoint files | CTO |

---

## 4. Exit Criteria

| # | Exit Criterion | Status | Evidence / Link | Owner |
|---|---------------|--------|-----------------|-------|
| 4.1 | All review areas assessed with no unresolved FAIL items | COMPLETE (Phases 1-3) | All review items PASS across 6 review areas | CTO |
| 4.2 | Module architecture follows established patterns from Phase 1 | COMPLETE (Phases 2-3) | DeviceManagement, EmailProtection, and TeamsSharePoint modules follow EntraID architecture patterns | CTO |
| 4.3 | Collector caching strategy is validated and performs correctly | COMPLETE | Cache hit ratios > 80% in multi-check scenarios; no redundant API calls observed in testing | Lead Developer |
| 4.4 | Error handling is comprehensive and does not leak sensitive data | COMPLETE | All error paths tested; no token/secret leakage in logs or output files | CTO |
| 4.5 | Graph API pagination handles all tested scenarios correctly | COMPLETE | Tested with tenants ranging from 0 to 5,000+ objects per endpoint; pagination completes correctly | Lead Developer |
| 4.6 | Checkpoint system is reliable and resumable | COMPLETE | Tested interruption at various points; resume produces identical results to full run | Lead Developer |
| 4.7 | No blocking concerns from reviewers | COMPLETE | All concerns addressed; no blockers | All |

---

## 5. Gate Decision

### Phase 1 (EntraID)

| Field | Value |
|-------|-------|
| **Decision** | APPROVED |
| **Decision Date** | 2025-06-23 |
| **Decision Rationale** | EntraID module architecture is sound and establishes strong patterns for subsequent modules. Collector caching, check isolation, error handling, pagination, and checkpoint integration all pass review. The collector/check separation of concerns enables testability and maintainability. Architecture is approved as the reference implementation for all future modules. |
| **Next Gate Target** | Gate 3 - Security Review: 2025-07-14 |

### Phase 2 (DeviceManagement)

| Field | Value |
|-------|-------|
| **Decision** | APPROVED |
| **Decision Date** | 2025-09-22 |
| **Decision Rationale** | DeviceManagement module correctly follows EntraID architecture patterns. Shared collector reuse is properly implemented via the DependsOn mechanism. 18 checks cover device compliance and configuration assessment comprehensively. |
| **Next Gate Target** | Gate 3 - Security Review: 2025-10-13 |

### Phase 3 (EmailProtection + TeamsSharePoint)

| Field | Value |
|-------|-------|
| **Decision** | APPROVED |
| **Decision Date** | 2025-12-08 |
| **Decision Rationale** | Both modules follow established patterns. EmailProtection correctly handles Exchange Online connectivity alongside Graph API. TeamsSharePoint properly scopes permissions to read-only access. All 30 checks (13 + 17) pass architecture review. No new architectural concerns introduced. |
| **Next Gate Target** | Gate 3 - Security Review: 2026-01-06 |

---

## 6. Conditions / Action Items

| # | Condition / Action Item | Priority | Owner | Target Date | Status |
|---|------------------------|----------|-------|-------------|--------|
| 1 | Document the collector/check pattern as a developer guide for future module authors | Medium | Lead Developer | 2025-07-07 | COMPLETE |
| 2 | Create a module scaffolding script that generates boilerplate Module.json, collector, and check function files | Low | Lead Developer | 2025-08-01 | COMPLETE |
| 3 | Add integration tests for collector caching across module boundaries | Medium | Lead Developer | 2025-10-06 | COMPLETE |
| 4 | Verify EmailProtection Exchange Online session management does not leave orphaned sessions | High | Lead Developer | 2025-12-15 | COMPLETE |
| 5 | Prepare Phase 4 definition-only modules for architecture review | Medium | CTO | 2026-03-16 | NOT STARTED |

---

## 7. Attendees and Sign-Off

### Phase 1 Sign-Off (2025-06-23)

| Name | Role | Decision | Date |
|------|------|----------|------|
| (CTO) | Chief Architect / CTO | Approve | 2025-06-23 |
| (Lead Developer) | Technical Lead | Approve | 2025-06-23 |
| (Security Assessor) | Domain Expert | Approve | 2025-06-23 |

### Phase 2 Sign-Off (2025-09-22)

| Name | Role | Decision | Date |
|------|------|----------|------|
| (CTO) | Chief Architect / CTO | Approve | 2025-09-22 |
| (Lead Developer) | Technical Lead | Approve | 2025-09-22 |
| (Security Assessor) | Domain Expert | Approve | 2025-09-22 |

### Phase 3 Sign-Off (2025-12-08)

| Name | Role | Decision | Date |
|------|------|----------|------|
| (CTO) | Chief Architect / CTO | Approve | 2025-12-08 |
| (Lead Developer) | Technical Lead | Approve | 2025-12-08 |
| (Security Assessor) | Domain Expert | Approve | 2025-12-08 |

---

## 8. Meeting Notes

### Phase 1 Architecture Review (2025-06-23)

**Key Discussion Points:**

- The collector/check separation of concerns is the strongest architectural decision; it enables independent testing, caching, and reuse across modules.
- Collector caching using in-memory hashtable is appropriate for a single-run PowerShell tool; no need for persistent caching between sessions.
- Graph API pagination wrapper (`Invoke-GraphRequest`) is well-implemented with automatic nextLink following; this should be the only way modules make Graph API calls.
- Checkpoint system enables long-running assessments against large tenants to survive interruptions; particularly important for Phase 3 modules that may require Exchange Online connectivity.
- Error handling pattern (try/catch per check, Error finding on failure, continue assessment) is correct for an assessment tool -- assessors need partial results even when some checks fail.

**Concerns Raised:**

- Memory consumption for very large tenants (50,000+ users) could be significant when caching all collector data in memory. Accepted as low risk for the target market (SMB tenants typically < 5,000 users). Mitigation: add memory monitoring and warn if cache exceeds 500MB.
- Exchange Online session management in Phase 3 needs careful handling to avoid orphaned sessions consuming Exchange service quotas.

**Decisions Made:**

- EntraID module architecture is approved as the reference implementation for all future modules.
- All Graph API calls must go through the `Invoke-GraphRequest` wrapper; direct `Invoke-RestMethod` calls are prohibited in module code.
- Checkpoint system is mandatory for all modules; no module may skip checkpoint integration.

### Phase 3 Architecture Review (2025-12-08)

**Key Discussion Points:**

- EmailProtection module successfully handles both Graph API and Exchange Online PowerShell connectivity.
- Exchange Online sessions are properly initialized in the collector phase and disposed of in a finally block.
- TeamsSharePoint module's permission scoping correctly limits to read-only access across both Teams and SharePoint endpoints.

---

## 9. References

| Document | Link |
|----------|------|
| Gate 1 - Design Review | gate-1-design-review.md |
| Module Developer Guide | ../02-solution-architecture/module-developer-guide.md |
| API Permissions Matrix | ../03-security/api-permissions-matrix.md |
| Graph API Pagination Reference | https://learn.microsoft.com/en-us/graph/paging |
| Gate 3 - Security Review | gate-3-security-review.md |
