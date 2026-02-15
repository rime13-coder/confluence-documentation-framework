# Unit Testing

| **Page Title**   | Unit Testing Standards and Guidelines      |
|------------------|--------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                               |
| **Status**       | [Draft / In Review / Approved / Deprecated] |
| **Owner**        | [TEAM OR INDIVIDUAL NAME]                  |

---

## 1. Unit Test Standards and Conventions

### Core Principles

- **Isolated:** Each test verifies a single unit of behavior with all external dependencies mocked or stubbed.
- **Fast:** Individual unit tests should complete in milliseconds. The full unit test suite should run in under [TARGET-MINUTES] minutes.
- **Deterministic:** Tests produce the same result every time, regardless of execution order, environment, or system clock.
- **Self-documenting:** Test names clearly describe the scenario and expected outcome.
- **Independent:** No test depends on the state left by another test. Each test sets up and tears down its own state.

### What Constitutes a Unit Test

| Included                                   | Excluded (integration or higher)               |
|--------------------------------------------|-------------------------------------------------|
| Business logic in services/handlers        | Database queries against a real database        |
| Data transformation and mapping            | HTTP calls to external services                  |
| Validation rules                           | File system I/O                                  |
| State machine transitions                  | Message broker publish/subscribe                 |
| Utility/helper functions                   | Tests requiring Docker or Testcontainers         |
| In-memory repository implementations       | Multi-service orchestration                      |

---

## 2. Framework and Tooling by Language

| Language / Runtime  | Test Framework      | Assertion Library     | Mocking Library         | Test Runner              |
|---------------------|---------------------|-----------------------|-------------------------|--------------------------|
| **.NET (C#)**       | xUnit               | FluentAssertions      | Moq / NSubstitute       | `dotnet test`            |
| **Node.js / TS**    | Jest                 | Jest built-in         | Jest mocks / ts-mockito | `npm test` / `jest`      |
| **Python**          | pytest               | pytest built-in / assertpy | unittest.mock / pytest-mock | `pytest`          |
| **Go**              | testing (stdlib)     | testify               | gomock / testify mock    | `go test`                |
| [ADD MORE AS NEEDED]|                     |                       |                         |                          |

---

## 3. Coverage Requirements

| Metric                    | Minimum Threshold | Enforcement                                            |
|---------------------------|-------------------|--------------------------------------------------------|
| **Overall line coverage** | [MIN]%            | Build fails if below threshold                         |
| **New code line coverage**| [MIN]%            | PR check fails (via [Codecov/SonarCloud]) if below     |
| **Branch coverage**       | [MIN]%            | Reported; advisory (or enforced if team agrees)        |
| **Critical path coverage**| [MIN]%            | Higher threshold for modules in `[CRITICAL-PATHS]`     |

### Enforcement Mechanism

- Coverage is collected during the `dotnet test` / `npm test` / `pytest` step in GitHub Actions.
- Coverage reports are uploaded to [Codecov / SonarCloud / Coveralls].
- A GitHub status check blocks PR merge if coverage drops below the minimum threshold.
- Coverage trends are visible on the [Codecov / SonarCloud] dashboard: [DASHBOARD-URL].

---

## 4. Mocking Strategy

### What to Mock

| Dependency Type             | Mock?  | Approach                                              |
|-----------------------------|--------|-------------------------------------------------------|
| External HTTP services      | Yes    | Mock the HTTP client or use a fake implementation     |
| Database repositories       | Yes    | Mock the repository interface; use in-memory fakes    |
| File system access          | Yes    | Abstract behind an interface; mock the interface      |
| System clock / `DateTime`   | Yes    | Inject a clock abstraction; control time in tests     |
| Message broker (publish)    | Yes    | Mock the publisher interface                          |
| Configuration / settings    | Depends| Use in-memory configuration with test values          |
| Logging                     | No     | Use a real logger (null logger or test logger sink)   |
| Pure utility functions      | No     | Call the real implementation                          |

### Preferred Mocking Libraries

| Language    | Library                  | Notes                                              |
|-------------|--------------------------|----------------------------------------------------|
| .NET        | Moq / NSubstitute        | Use `NSubstitute` for cleaner syntax; `Moq` for wider adoption |
| Node.js/TS  | Jest mocks (`jest.fn()`) | Prefer manual mocks in `__mocks__/` for complex dependencies |
| Python      | `unittest.mock` / `pytest-mock` | Use `patch` decorators for clean setup/teardown |

### Anti-Patterns to Avoid

- Mocking the system under test (SUT) itself.
- Over-mocking: if a test mocks everything, it tests nothing.
- Mocking value objects or DTOs — use real instances.
- Verifying internal implementation details (e.g., exact call counts) unless behavior depends on it.

---

## 5. Test Naming Conventions

Use a consistent naming pattern that communicates **what** is being tested, **under what conditions**, and **what the expected outcome** is.

### Recommended Patterns

**Pattern 1 — Method_Scenario_ExpectedResult:**
```
CalculateDiscount_WhenOrderExceeds100_Returns10PercentDiscount
```

**Pattern 2 — Should_ExpectedBehavior_When_Condition:**
```
Should_ReturnNotFound_When_UserDoesNotExist
```

**Pattern 3 — Given_When_Then (BDD-style):**
```
GivenExpiredToken_WhenAuthenticating_ThenThrowsUnauthorizedException
```

**Choose one pattern per project and apply it consistently.** Document the chosen pattern here:

> **Chosen pattern for this project:** [PATTERN-NAME]

### General Naming Rules

- Use descriptive names; avoid abbreviations.
- Do not prefix test names with `Test_` (the framework already identifies them).
- Group related tests using nested classes or describe blocks.

---

## 6. Test Organization / Folder Structure

### .NET Example

```
src/
  OrderService/
    Services/
      OrderCalculator.cs
    Models/
      Order.cs
tests/
  OrderService.UnitTests/
    Services/
      OrderCalculatorTests.cs
    Models/
      OrderTests.cs
    Fakes/
      FakeOrderRepository.cs
    Builders/
      OrderBuilder.cs
```

### Node.js / TypeScript Example

```
src/
  services/
    orderCalculator.ts
  models/
    order.ts
tests/
  unit/
    services/
      orderCalculator.test.ts
    models/
      order.test.ts
  __mocks__/
    orderRepository.ts
  factories/
    orderFactory.ts
```

### Python Example

```
src/
  order_service/
    services/
      order_calculator.py
    models/
      order.py
tests/
  unit/
    services/
      test_order_calculator.py
    models/
      test_order.py
  conftest.py
  factories/
    order_factory.py
```

### Conventions

- Mirror the source folder structure in the test project.
- Place shared test utilities (builders, factories, fakes) in a clearly named subfolder.
- One test file per source file.

---

## 7. CI Integration (GitHub Actions)

Unit tests run as part of every build workflow. See [Build Pipeline](../05-cicd-pipeline/build-pipeline.md) for the full workflow.

### Unit Test Step in GitHub Actions

```yaml
- name: Run unit tests
  run: |
    dotnet test tests/[PROJECT].UnitTests \
      --configuration Release \
      --no-build \
      --logger "trx;LogFileName=unit-test-results.trx" \
      --collect:"XPlat Code Coverage" \
      -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=cobertura

- name: Publish test results
  uses: dorny/test-reporter@v1
  if: always()
  with:
    name: Unit Test Results
    path: '**/unit-test-results.trx'
    reporter: dotnet-trx

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: '**/coverage.cobertura.xml'
    flags: unittests
    fail_ci_if_error: true
    token: ${{ secrets.CODECOV_TOKEN }}
```

### PR Integration

- Test results appear as a check on the pull request.
- Coverage diff is posted as a PR comment by [Codecov / SonarCloud].
- PR cannot be merged if unit tests fail or coverage drops below the minimum threshold.

---

## 8. Coverage Reporting

| Aspect                  | Configuration                                   |
|-------------------------|-------------------------------------------------|
| **Collection tool**     | [Coverlet (.NET) / Istanbul-nyc (Node) / coverage.py (Python)] |
| **Report format**       | Cobertura XML                                   |
| **Reporting platform**  | [Codecov / SonarCloud / Coveralls]              |
| **Dashboard URL**       | [DASHBOARD-URL]                                 |
| **PR decoration**       | Automatic comment with coverage diff            |
| **Historical trends**   | Available on [PLATFORM] dashboard               |

---

## 9. Current Coverage Metrics

> Update this table periodically (at least once per sprint) or link to a live dashboard.

| Component / Service         | Current Coverage % | Target % | Trend (vs last sprint)  | Notes                         |
|-----------------------------|--------------------|----------|-------------------------|-------------------------------|
| [SERVICE-1]                 | [CURRENT]%         | [TARGET]%| [UP/DOWN/STABLE]        |                               |
| [SERVICE-2]                 | [CURRENT]%         | [TARGET]%| [UP/DOWN/STABLE]        |                               |
| [SERVICE-3]                 | [CURRENT]%         | [TARGET]%| [UP/DOWN/STABLE]        |                               |
| [SHARED-LIBRARY]            | [CURRENT]%         | [TARGET]%| [UP/DOWN/STABLE]        |                               |
| **Overall**                 | **[CURRENT]%**     | **[TARGET]%** | **[TREND]**        |                               |

---

## 10. Best Practices Checklist

- [ ] Each test tests one behavior (single assertion or closely related assertions).
- [ ] Tests follow the Arrange-Act-Assert (AAA) pattern.
- [ ] No test relies on another test's execution or side effects.
- [ ] External dependencies are mocked via interfaces.
- [ ] Test data is created using builders or factories, not hard-coded literals.
- [ ] Flaky tests are immediately flagged, investigated, and fixed or quarantined.
- [ ] Parameterized tests are used for multiple input/output scenarios.
- [ ] Tests run in parallel where the framework supports it.
- [ ] Test files are code-reviewed with the same rigor as production code.

---

## 11. Appendix

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Integration Testing](./integration-testing.md)
- [Build Pipeline](../05-cicd-pipeline/build-pipeline.md)
