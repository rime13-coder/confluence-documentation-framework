# Unit Testing

| **Page Title**   | Unit Testing Standards and Guidelines      |
|------------------|--------------------------------------------|
| **Last Updated** | 2026-02-14                                 |
| **Status**       | Draft                                      |
| **Owner**        | IntelliSecOps Development Team             |

---

## 1. Current State

Unit testing for the CMMC Assessor Platform is **not yet implemented**. The CI pipeline runs `npm test` for both backend and frontend, but no dedicated test suites exist. This document defines the standards, conventions, and planned approach for unit testing.

### What Needs to Be Done

1. Install and configure Jest for both `backend/` and `frontend/` projects.
2. Write unit tests for existing business logic (assessment scoring, CMMC control mapping, authentication, authorization).
3. Configure code coverage collection and reporting.
4. Set up coverage gates in CI to block PRs that drop below thresholds.

---

## 2. Unit Test Standards and Conventions

### Core Principles

- **Isolated:** Each test verifies a single unit of behavior with all external dependencies mocked or stubbed.
- **Fast:** Individual unit tests should complete in milliseconds. The full unit test suite should run in under 3 minutes.
- **Deterministic:** Tests produce the same result every time, regardless of execution order, environment, or system clock.
- **Self-documenting:** Test names clearly describe the scenario and expected outcome.
- **Independent:** No test depends on the state left by another test. Each test sets up and tears down its own state.

### What Constitutes a Unit Test

| Included                                   | Excluded (integration or higher)               |
|--------------------------------------------|-------------------------------------------------|
| Business logic in services/handlers        | Database queries against real PostgreSQL         |
| CMMC assessment scoring algorithms         | HTTP calls to external services                  |
| Data transformation and mapping            | Prisma ORM calls against a real database         |
| Validation rules (input validation)        | File system I/O                                  |
| Authentication/authorization logic         | Tests requiring Docker or Testcontainers         |
| Utility/helper functions                   | Multi-service orchestration                      |
| React component rendering (shallow)        | Full browser rendering (use Playwright for E2E)  |

---

## 3. Framework and Tooling

| Language / Runtime  | Test Framework      | Assertion Library     | Mocking Library         | Test Runner              |
|---------------------|---------------------|-----------------------|-------------------------|--------------------------|
| **Backend (Node.js/TS)** | Jest            | Jest built-in (`expect`) | Jest mocks (`jest.fn()`, `jest.mock()`) | `npm test` / `jest` |
| **Frontend (React/TS)**  | Jest + React Testing Library | Jest built-in + RTL queries | Jest mocks + MSW (Mock Service Worker) | `npm test` / `jest` |

### Why Jest

- Native TypeScript support via `ts-jest` or SWC transform.
- Built-in mocking, assertion, and coverage capabilities.
- Widely adopted in the Node.js/React ecosystem.
- Parallel test execution out of the box.
- Compatible with the existing `npm test` script in CI.

---

## 4. Coverage Requirements (Planned)

| Metric                    | Minimum Threshold | Enforcement                                            |
|---------------------------|-------------------|--------------------------------------------------------|
| **Overall line coverage** | 70%               | Build fails if below threshold (planned)               |
| **New code line coverage**| 80%               | PR check fails via Codecov if below (planned)          |
| **Branch coverage**       | 60%               | Reported; advisory (planned)                           |
| **Critical path coverage**| 85%               | Higher threshold for `auth/`, `assessment/`, `api/routes/` modules (planned) |

### Enforcement Mechanism (Planned)

- Coverage will be collected during `npm test` using Jest's built-in `--coverage` flag.
- Coverage reports will be uploaded to Codecov.
- A GitHub status check will block PR merge if coverage drops below the minimum threshold.
- Coverage trends will be visible on the Codecov dashboard.

---

## 5. Mocking Strategy

### What to Mock

| Dependency Type             | Mock?  | Approach                                              |
|-----------------------------|--------|-------------------------------------------------------|
| Prisma Client (database)    | Yes    | Mock the Prisma client methods using `jest.mock()`    |
| External HTTP services      | Yes    | Mock `fetch` / `axios` or use MSW for API mocking     |
| Microsoft Entra ID (auth)   | Yes    | Mock the authentication middleware and token validation|
| File system access          | Yes    | Mock `fs` module                                      |
| System clock / `Date`       | Yes    | Use `jest.useFakeTimers()` to control time in tests   |
| Environment variables       | Depends| Use `process.env` overrides in test setup             |
| Logging                     | No     | Use real logger (or silence with `jest.spyOn`)        |
| Pure utility functions      | No     | Call the real implementation                          |
| React Router                | Yes    | Wrap components in `MemoryRouter` for testing         |

### Anti-Patterns to Avoid

- Mocking the system under test (SUT) itself.
- Over-mocking: if a test mocks everything, it tests nothing.
- Mocking value objects or DTOs -- use real instances.
- Verifying internal implementation details (e.g., exact call counts) unless behavior depends on it.
- Testing implementation details of React components instead of user-visible behavior.

---

## 6. Test Naming Conventions

> **Chosen pattern for this project:** `describe`/`it` blocks with `Should_ExpectedBehavior_When_Condition` style.

### Example (Backend)

```typescript
describe('AssessmentScoringService', () => {
  describe('calculateScore', () => {
    it('should return 100% when all controls are fully implemented', () => {
      // Arrange, Act, Assert
    });

    it('should return 0% when no controls are implemented', () => {
      // Arrange, Act, Assert
    });

    it('should throw ValidationError when assessment ID is invalid', () => {
      // Arrange, Act, Assert
    });
  });
});
```

### Example (Frontend)

```typescript
describe('AssessmentDashboard', () => {
  it('should display the overall CMMC score when data is loaded', () => {
    // Arrange, Act, Assert using React Testing Library
  });

  it('should show a loading spinner while fetching assessment data', () => {
    // Arrange, Act, Assert
  });

  it('should display an error message when the API call fails', () => {
    // Arrange, Act, Assert
  });
});
```

### General Naming Rules

- Use descriptive names; avoid abbreviations.
- Do not prefix test names with `Test_` (Jest identifies them via `it`/`test` blocks).
- Group related tests using `describe` blocks that mirror the module structure.

---

## 7. Test Organization / Folder Structure

### Backend (Planned)

```
backend/
  src/
    services/
      assessmentService.ts
      authService.ts
    routes/
      assessmentRoutes.ts
    utils/
      scoring.ts
  tests/
    unit/
      services/
        assessmentService.test.ts
        authService.test.ts
      routes/
        assessmentRoutes.test.ts
      utils/
        scoring.test.ts
    __mocks__/
      prismaClient.ts
    factories/
      assessmentFactory.ts
      userFactory.ts
  jest.config.ts
```

### Frontend (Planned)

```
frontend/
  src/
    components/
      AssessmentDashboard.tsx
      ControlChecklist.tsx
    hooks/
      useAssessment.ts
    services/
      api.ts
  tests/
    unit/
      components/
        AssessmentDashboard.test.tsx
        ControlChecklist.test.tsx
      hooks/
        useAssessment.test.ts
      services/
        api.test.ts
    __mocks__/
      api.ts
    factories/
      assessmentFactory.ts
  jest.config.ts
```

### Conventions

- Mirror the source folder structure in the test directory.
- Place shared test utilities (factories, mocks) in clearly named subfolders.
- One test file per source file.
- Test files use the `.test.ts` or `.test.tsx` extension.

---

## 8. CI Integration (GitHub Actions)

Unit tests will run as part of the existing CI workflow. The `npm test` command in both `backend-ci` and `frontend-ci` jobs already executes; once Jest is configured, tests will run automatically.

### Planned Unit Test Step in GitHub Actions

```yaml
# In backend-ci job:
- name: Run unit tests with coverage
  run: npm test -- --coverage --ci --reporters=default --reporters=jest-junit
  env:
    JEST_JUNIT_OUTPUT_DIR: ./reports
    JEST_JUNIT_OUTPUT_NAME: junit.xml

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
    flags: backend-unit
    fail_ci_if_error: true
    token: ${{ secrets.CODECOV_TOKEN }}
```

### PR Integration (Planned)

- Test results will appear as a check on the pull request.
- Coverage diff will be posted as a PR comment by Codecov.
- PR cannot be merged if unit tests fail or coverage drops below the minimum threshold.

---

## 9. Coverage Reporting (Planned)

| Aspect                  | Configuration                                   |
|-------------------------|-------------------------------------------------|
| **Collection tool**     | Jest built-in coverage (`--coverage`)            |
| **Report format**       | lcov + JSON summary                             |
| **Reporting platform**  | Codecov (planned)                               |
| **Dashboard URL**       | TBD (once Codecov is configured)                |
| **PR decoration**       | Automatic comment with coverage diff (planned)  |
| **Historical trends**   | Available on Codecov dashboard (planned)        |

---

## 10. Current Coverage Metrics

> No coverage data is available yet. This table will be populated once unit tests are implemented.

| Component / Service         | Current Coverage % | Target % | Trend (vs last sprint)  | Notes                         |
|-----------------------------|--------------------|----------|-------------------------|-------------------------------|
| Backend                     | 0% (no tests)     | 70%      | N/A                     | Tests not yet implemented     |
| Frontend                    | 0% (no tests)     | 70%      | N/A                     | Tests not yet implemented     |
| **Overall**                 | **0%**             | **70%**  | **N/A**                 |                               |

---

## 11. Best Practices Checklist

- [ ] Each test tests one behavior (single assertion or closely related assertions).
- [ ] Tests follow the Arrange-Act-Assert (AAA) pattern.
- [ ] No test relies on another test's execution or side effects.
- [ ] External dependencies are mocked via Jest mocks.
- [ ] Test data is created using factories, not hard-coded literals.
- [ ] Flaky tests are immediately flagged, investigated, and fixed or quarantined.
- [ ] Parameterized tests (`test.each`) are used for multiple input/output scenarios.
- [ ] Tests run in parallel where Jest supports it (default behavior).
- [ ] Test files are code-reviewed with the same rigor as production code.

---

## 12. Appendix

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Integration Testing](./integration-testing.md)
- [Build Pipeline](../05-cicd-pipeline/build-pipeline.md)
