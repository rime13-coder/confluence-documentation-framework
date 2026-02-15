# Test Strategy

| **Page Title**   | Test Strategy                              |
|------------------|--------------------------------------------|
| **Last Updated** | 2026-02-14                                 |
| **Status**       | Draft                                      |
| **Owner**        | IntelliSecOps Development Team             |

---

## 1. Testing Philosophy and Principles

Our testing philosophy is grounded in the following principles:

1. **Quality is a shared responsibility** — every team member (developer, QA, product owner) contributes to quality; testing is not a phase owned by a single team.
2. **Automate by default** — every test that can be automated should be automated and integrated into the CI/CD pipeline. Manual testing is reserved for exploratory testing and edge cases.
3. **Shift left** — find defects as early as possible. Type checking (`tsc --noEmit`) and linting catch errors at build time; security scans catch vulnerabilities on every PR.
4. **Test at the right level** — use the testing pyramid to guide investment. Prefer fast, isolated unit tests over slow, brittle E2E tests.
5. **Tests are first-class code** — test code follows the same coding standards, review processes, and maintainability expectations as production code.
6. **Deterministic and repeatable** — tests produce the same result regardless of execution environment, order, or time of day. Flaky tests are treated as bugs.
7. **Fast feedback** — optimize test suites to run within the CI build time budget (target: < 10 minutes for PR builds).

### Current State

Testing for the CMMC Assessor Platform is currently **minimal**. The CI pipeline runs `tsc --noEmit` (type checking), ESLint (linting), and `npm test` (which succeeds if no test suite is found), along with CodeQL and dependency auditing. **Dedicated test suites (unit, integration, E2E) have not yet been implemented.** This document defines the strategy and planned approach.

---

## 2. Testing Pyramid

```
          /\
         /  \        E2E / UI Tests        (~10% of tests) - NOT YET IMPLEMENTED
        /    \       Validate complete user journeys
       /------\
      /        \     Integration Tests      (~20% of tests) - NOT YET IMPLEMENTED
     /          \    Validate component interactions,
    /            \   API contracts, database operations
   /--------------\
  /                \ Unit Tests             (~70% of tests) - NOT YET IMPLEMENTED
 /                  \ Validate individual functions,
/____________________\ methods, and classes in isolation
```

| Test Level         | Proportion | Current State              | Planned Tooling              |
|--------------------|------------|----------------------------|------------------------------|
| **Unit**           | ~70%       | Not yet implemented        | Jest (backend + frontend)    |
| **Integration**    | ~20%       | Not yet implemented        | Supertest + Testcontainers   |
| **E2E / UI**       | ~10%       | Not yet implemented        | Playwright (planned)         |

### What IS Currently Running in CI

| Check                  | Tool                        | Purpose                              | Automated |
|------------------------|-----------------------------|--------------------------------------|-----------|
| Type checking          | `tsc --noEmit`              | Catch TypeScript compilation errors  | Yes       |
| Linting                | ESLint                      | Enforce code style standards         | Yes       |
| SAST                   | CodeQL (javascript-typescript) | Static security analysis          | Yes       |
| Dependency audit       | `npm audit --audit-level=high` | Known vulnerability detection     | Yes       |
| Test runner            | `npm test`                  | Runs test suite (currently no tests) | Yes (no-op) |

---

## 3. Test Types Matrix

| Test Type             | Scope                              | Tools                                         | Current State       | Run Frequency              | Responsibility       |
|-----------------------|------------------------------------|-----------------------------------------------|---------------------|----------------------------|----------------------|
| **Type Checking**     | TypeScript compilation             | `tsc --noEmit`                                | Implemented         | Every PR and push          | Developers           |
| **Linting**           | Code style and patterns            | ESLint                                        | Implemented         | Every PR and push          | Developers           |
| **Unit**              | Individual functions/classes        | Jest (planned)                                | Not implemented     | Every PR and push (planned)| Developers           |
| **Integration**       | Component interactions, APIs, DB   | Supertest + Testcontainers (planned)          | Not implemented     | Every PR (planned)         | Developers           |
| **API Contract**      | API request/response schemas       | Not selected yet                              | Not implemented     | Every PR (planned)         | Developers           |
| **E2E / UI**          | Full user workflows                | Playwright (planned)                          | Not implemented     | Nightly + pre-release (planned) | QA              |
| **Performance**       | Throughput, latency, scalability   | k6 (planned)                                  | Not implemented     | Pre-release (planned)      | QA + Operations      |
| **Security (SAST)**   | Static code vulnerabilities        | CodeQL                                        | Implemented         | Every PR                   | Developers + Security|
| **Security (DAST)**   | Runtime vulnerabilities            | Not selected yet                              | Not implemented     | Weekly + pre-release (planned) | Security         |
| **Dependency Scan**   | Known package vulnerabilities      | `npm audit`                                   | Implemented         | Every PR                   | Developers + DevOps  |
| **Smoke**             | Basic health and critical paths    | Not implemented yet                           | Not implemented     | After every deployment (planned) | CI/CD pipeline |
| **UAT**               | Business acceptance                | Manual (with scripted scenarios)              | Not implemented     | Pre-release (planned)      | Business stakeholders|

---

## 4. Code Coverage Targets and Enforcement

### Current State

Code coverage is **not currently collected or enforced**. No coverage tooling has been configured.

### Planned Targets

| Metric                      | Minimum Threshold    | Stretch Target       | Enforcement Mechanism                                |
|-----------------------------|----------------------|----------------------|------------------------------------------------------|
| **Overall line coverage**   | 70%                  | 85%                  | GitHub Actions check fails if below minimum (planned)|
| **New code coverage**       | 80%                  | 90%                  | PR diff coverage gate via Codecov (planned)          |
| **Branch coverage**         | 60%                  | 75%                  | Reported alongside line coverage (planned)           |
| **Critical modules**        | 85%                  | 95%                  | Higher threshold for auth, assessment scoring, API routes (planned) |

### Coverage Exceptions (Planned)

| Component / Path                    | Reason for Exclusion                                |
|-------------------------------------|-----------------------------------------------------|
| `backend/prisma/generated/`         | Auto-generated Prisma client code                   |
| `frontend/src/vite-env.d.ts`        | Type declaration file only                          |
| `infra/`                            | Infrastructure as Code (not application logic)       |

---

## 5. Test Data Management Strategy

| Aspect                      | Approach                                                        |
|-----------------------------|-----------------------------------------------------------------|
| **Unit tests (planned)**    | In-memory data, fixtures, and factory patterns using jest mocks |
| **Integration tests (planned)** | Testcontainers with PostgreSQL; seed scripts run before each suite |
| **E2E tests (planned)**     | Pre-provisioned test accounts in staging environment            |
| **Sensitive data**          | Never use real PII in non-production environments; synthesize test data |
| **Test data repository**    | Planned: `tests/fixtures/` in the mono-repo                    |

---

## 6. Test Environment Requirements

| Test Type             | Environment Needed                    | Provisioned By                                   |
|-----------------------|---------------------------------------|--------------------------------------------------|
| **Type Checking**     | CI runner                             | GitHub Actions (`ubuntu-latest`)                 |
| **Linting**           | CI runner                             | GitHub Actions (`ubuntu-latest`)                 |
| **Unit (planned)**    | CI runner                             | GitHub Actions (`ubuntu-latest`)                 |
| **Integration (planned)** | CI runner with Docker (Testcontainers) | GitHub Actions (`ubuntu-latest`)            |
| **E2E (planned)**     | Staging environment                   | Azure Container Apps (planned)                   |
| **Performance (planned)** | Staging or dedicated perf environment | Azure Container Apps (planned)              |
| **Security (SAST)**   | CI runner                             | GitHub Actions (`ubuntu-latest`)                 |
| **Security (DAST) (planned)** | Staging environment           | Azure Container Apps (planned)                   |

---

## 7. Defect Management Process

### Defect Lifecycle

```
New -> Triaged -> In Progress -> Fixed -> Verified -> Closed
                                    \-> Won't Fix -> Closed
                                    \-> Deferred -> Backlog
```

### Severity Definitions

| Severity     | Definition                                                      | Fix SLA             |
|--------------|-----------------------------------------------------------------|---------------------|
| **Critical** | System down, data loss, or security breach; no workaround       | 4 hours             |
| **High**     | Major feature broken; workaround exists but is painful          | 2 business days     |
| **Medium**   | Feature partially broken; reasonable workaround available       | 5 business days     |
| **Low**      | Cosmetic issue or minor inconvenience                           | Next sprint         |

### Defect Tracking

- **Tool:** GitHub Issues
- **Labels/Tags:** `bug`, `severity/critical`, `severity/high`, `severity/medium`, `severity/low`, `found-in/production`, `found-in/development`
- **Regression tests:** Every fixed defect should have a corresponding automated test to prevent recurrence (once test suites are implemented).

---

## 8. Testing Definition of Done (DoD)

A code change is considered tested and ready for release when **all** of the following are true:

- [x] TypeScript type checking passes (`tsc --noEmit`)
- [x] ESLint passes with no errors
- [x] No new CodeQL findings of severity High or above
- [x] No new dependency vulnerabilities of severity High or above (`npm audit`)
- [ ] All existing unit tests pass (once unit tests are implemented)
- [ ] New/modified code has unit tests meeting coverage thresholds (once coverage gates are configured)
- [ ] Integration tests pass (once integration tests are implemented)
- [ ] Smoke tests pass after deployment (once smoke tests are implemented)
- [ ] E2E regression suite passes for release candidates (once E2E tests are implemented)
- [ ] UAT sign-off obtained for release candidates going to Production (once UAT process is established)

---

## 9. Testing Tools Inventory

| Tool                       | Purpose                                  | License Type        | Integration Point                     | Status          |
|----------------------------|------------------------------------------|---------------------|---------------------------------------|-----------------|
| TypeScript Compiler        | Type checking (`tsc --noEmit`)           | OSS (Apache 2.0)   | GitHub Actions (CI)                   | Implemented     |
| ESLint                     | Code linting and style enforcement       | OSS (MIT)           | GitHub Actions (CI)                   | Implemented     |
| CodeQL                     | SAST (static application security testing)| Free for public repos | GitHub Actions (CI) native         | Implemented     |
| npm audit                  | Dependency vulnerability scanning        | Built into npm      | GitHub Actions (CI)                   | Implemented     |
| Jest                       | Unit testing (backend + frontend)        | OSS (MIT)           | GitHub Actions (CI) via `npm test`    | Planned         |
| Supertest                  | HTTP integration testing for Express.js  | OSS (MIT)           | GitHub Actions (CI)                   | Planned         |
| Testcontainers             | Ephemeral Docker containers for integration tests | OSS (MIT)  | GitHub Actions (CI)                   | Planned         |
| Playwright                 | E2E browser testing                      | OSS (Apache 2.0)   | GitHub Actions + Staging environment  | Planned         |
| k6                         | Performance / load testing               | OSS (AGPLv3)       | GitHub Actions + Perf environment     | Planned         |
| Codecov                    | Code coverage reporting and gating       | Free tier           | GitHub Actions PR checks              | Planned         |

---

## 10. Appendix

### Key Contacts

| Role                     | Name                    | Contact               |
|--------------------------|-------------------------|-----------------------|
| Development Lead         | IntelliSecOps Dev Team  | GitHub Issues         |
| Security Champion        | IntelliSecOps Security  | GitHub Issues         |

### Planned Testing Milestones

| Milestone                                  | Target Date  | Priority |
|--------------------------------------------|--------------|----------|
| Implement Jest unit tests for backend      | TBD          | High     |
| Implement Jest unit tests for frontend     | TBD          | High     |
| Set up Codecov integration                 | TBD          | Medium   |
| Implement API integration tests            | TBD          | Medium   |
| Set up staging environment for E2E         | TBD          | Medium   |
| Implement Playwright E2E tests             | TBD          | Medium   |
| Set up performance testing with k6         | TBD          | Low      |
| Implement DAST scanning                    | TBD          | Medium   |

### Related Pages

- [Unit Testing](./unit-testing.md)
- [Integration Testing](./integration-testing.md)
- [Performance Testing](./performance-testing.md)
- [Security Testing](./security-testing.md)
- [UAT Sign-Off](./uat-signoff.md)
- [Build Pipeline](../05-cicd-pipeline/build-pipeline.md)
- [Release Pipeline](../05-cicd-pipeline/release-pipeline.md)
