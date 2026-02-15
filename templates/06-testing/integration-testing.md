# Integration Testing

| **Page Title**   | Integration Testing                        |
|------------------|--------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                               |
| **Status**       | [Draft / In Review / Approved / Deprecated] |
| **Owner**        | [TEAM OR INDIVIDUAL NAME]                  |

---

## 1. Integration Test Scope and Boundaries

Integration tests verify that multiple components work correctly together. They sit between unit tests (isolated, fast) and E2E tests (full system, slow) on the testing pyramid.

### In Scope

| Category                       | Examples                                                            |
|--------------------------------|---------------------------------------------------------------------|
| API endpoint behavior          | HTTP request through controller -> service -> repository -> DB      |
| Database operations            | CRUD operations against a real (containerized) database             |
| Message broker interactions    | Publishing and consuming messages through a real (containerized) broker |
| External service contracts     | Verifying API contracts with stubbed/mocked external services       |
| Authentication and authorization | Token validation, role-based access through the middleware stack  |
| Configuration and DI wiring    | Verifying dependency injection resolves correctly at startup        |

### Out of Scope

| Category                       | Reason                                    | Covered By                  |
|--------------------------------|-------------------------------------------|-----------------------------|
| UI interactions                | Too slow and brittle for integration level | E2E tests                   |
| Third-party SaaS availability | Cannot control external uptime             | Contract tests + monitoring |
| Full multi-service orchestration | Requires full environment                | E2E tests                   |
| Performance under load         | Different tooling and environment          | Performance tests           |

---

## 2. Test Environment Requirements

| Requirement                    | Solution                                                     |
|--------------------------------|--------------------------------------------------------------|
| **Database**                   | Testcontainers: ephemeral [SQL Server / PostgreSQL / CosmosDB emulator] container per test run |
| **Message Broker**             | Testcontainers: ephemeral [RabbitMQ / Azure Service Bus emulator / Kafka] container |
| **Cache**                      | Testcontainers: ephemeral [Redis] container                  |
| **External HTTP services**     | WireMock (containerized or in-process) providing stubbed responses |
| **Blob / File storage**        | Azurite (Azure Storage emulator) via Testcontainers          |
| **CI runner requirements**     | GitHub Actions `ubuntu-latest` with Docker support           |
| **Ports**                      | Testcontainers assigns random ports; no port conflicts       |

### Docker Compose (Alternative to Testcontainers)

For projects that prefer a `docker-compose` approach over Testcontainers:

```yaml
# tests/docker-compose.integration.yml
version: '3.8'
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: '[TEST-PASSWORD]'
      ACCEPT_EULA: 'Y'
    ports:
      - '1433:1433'
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    ports:
      - '10000:10000'
      - '10001:10001'
      - '10002:10002'
  wiremock:
    image: wiremock/wiremock:3x
    ports:
      - '8080:8080'
    volumes:
      - ./wiremock:/home/wiremock
```

---

## 3. Tools and Frameworks

| Tool                        | Purpose                                        | Language / Runtime     |
|-----------------------------|------------------------------------------------|------------------------|
| **Testcontainers**          | Spin up ephemeral Docker containers for deps   | .NET, Java, Node, Python, Go |
| **WireMock**                | Stub and mock external HTTP services           | Language-agnostic (HTTP) |
| **Azurite**                 | Emulate Azure Blob, Queue, and Table storage   | Language-agnostic      |
| **WebApplicationFactory**   | In-process ASP.NET Core test server            | .NET                   |
| **Supertest**               | HTTP assertion library for Express/Koa         | Node.js                |
| **pytest + httpx**          | HTTP testing for FastAPI / Django               | Python                 |
| **Respawn**                 | Fast database reset between tests               | .NET (SQL Server, Postgres) |
| [ADD MORE AS NEEDED]        |                                                |                        |

---

## 4. API Contract Testing

API contract tests verify that service interfaces (request/response schemas, status codes, headers) conform to an agreed-upon contract. This is critical when multiple teams own different services.

### Approach

| Aspect                     | Configuration                                                |
|----------------------------|--------------------------------------------------------------|
| **Contract testing tool**  | [Pact / Spectral / Schemathesis / manual schema validation]  |
| **Provider verification**  | Provider runs contract tests in their CI pipeline            |
| **Consumer expectations**  | Consumers publish contract expectations to [Pact Broker / shared repo] |
| **Schema source of truth** | OpenAPI specification at `[PATH-TO-OPENAPI-SPEC]`           |
| **Breaking change detection** | CI step validates new API against published contracts     |

### Contract Test Inventory

| Consumer Service    | Provider Service    | Contract Location                  | Verified In CI |
|---------------------|---------------------|------------------------------------|----------------|
| [CONSUMER-1]        | [PROVIDER-1]        | [PACT-BROKER-URL / FILE-PATH]     | Yes / No       |
| [CONSUMER-2]        | [PROVIDER-1]        | [PACT-BROKER-URL / FILE-PATH]     | Yes / No       |
| [ADD MORE AS NEEDED]|                     |                                    |                |

---

## 5. Database Integration Testing

### Approach

| Aspect                      | Configuration                                              |
|-----------------------------|------------------------------------------------------------|
| **Database engine**         | [SQL Server / PostgreSQL / CosmosDB]                       |
| **Provisioning**            | Testcontainers spins up a fresh database per test class/module |
| **Schema migration**        | [EF Core Migrations / Flyway / Alembic] applied at test startup |
| **Seed data**               | Minimal seed data inserted in test setup (`Arrange` phase)  |
| **Cleanup strategy**        | [Respawn / transaction rollback / drop-and-recreate]        |
| **Connection string**       | Dynamically generated by Testcontainers; injected via configuration override |

### What to Test

- [ ] CRUD operations for each entity/repository
- [ ] Complex queries (joins, aggregations, pagination)
- [ ] Stored procedures and database functions (if used)
- [ ] Migration scripts apply cleanly from scratch
- [ ] Concurrent access scenarios (optimistic concurrency, deadlocks)
- [ ] Data constraints and referential integrity

---

## 6. Message Broker Integration Testing

### Approach

| Aspect                      | Configuration                                              |
|-----------------------------|------------------------------------------------------------|
| **Broker**                  | [Azure Service Bus / RabbitMQ / Kafka]                     |
| **Emulator / container**    | [Service Bus emulator / RabbitMQ container / Kafka container via Testcontainers] |
| **Test pattern**            | Publish a message, assert that the consumer processes it and produces the expected side effect |
| **Timeout for async assertions** | [SECONDS] seconds (fail if message not processed within window) |

### What to Test

- [ ] Message serialization/deserialization
- [ ] Message routing to correct handler
- [ ] Idempotency (processing the same message twice produces the same result)
- [ ] Dead-letter handling (malformed or unprocessable messages)
- [ ] Retry behavior on transient failures

---

## 7. CI Integration and Execution Schedule

### When Integration Tests Run

| Trigger                    | Runs Integration Tests? | Notes                                     |
|----------------------------|--------------------------|-------------------------------------------|
| PR to `main` / `develop`  | Yes                      | Full integration test suite                |
| Push to `main`             | Yes                      | Full suite; gate for deployment            |
| Nightly schedule           | Yes                      | Full suite + longer-running scenarios      |
| Push to `feature/*`        | [YES/NO]                 | [Optional: only if integration paths changed] |

### GitHub Actions Integration Test Step

```yaml
- name: Run integration tests
  run: |
    dotnet test tests/[PROJECT].IntegrationTests \
      --configuration Release \
      --logger "trx;LogFileName=integration-test-results.trx" \
      --timeout [TIMEOUT-MS]
  env:
    # Testcontainers will auto-detect Docker
    TESTCONTAINERS_RYUK_DISABLED: false

- name: Publish integration test results
  uses: dorny/test-reporter@v1
  if: always()
  with:
    name: Integration Test Results
    path: '**/integration-test-results.trx'
    reporter: dotnet-trx
```

### Performance Considerations

- Integration tests are slower than unit tests. Target total execution time: < [TARGET-MINUTES] minutes.
- Use parallel test execution where possible (ensure no shared state between test classes).
- Cache Docker images on the CI runner (`actions/cache` or GitHub Actions Docker layer caching).

---

## 8. Test Data Setup and Teardown Strategy

| Phase        | Strategy                                                                    |
|--------------|-----------------------------------------------------------------------------|
| **Setup**    | Each test class/module provisions its own data in the `Arrange` phase. Use builder/factory patterns to create test entities. |
| **Isolation**| Each test either: (a) runs in a database transaction that is rolled back, or (b) uses Respawn to reset the database between tests. |
| **Teardown** | Testcontainers automatically destroys containers after the test run. No manual cleanup needed for infrastructure. |
| **Shared fixtures** | For expensive setup (e.g., database migrations), use class-level fixtures (xUnit `IClassFixture`, pytest `session`-scoped fixtures). |

### Test Data Builders

Provide reusable builder classes that create valid test entities with sensible defaults:

```csharp
// Example (.NET)
var order = new OrderBuilder()
    .WithCustomerId(customerId)
    .WithLineItem("SKU-001", quantity: 2, unitPrice: 29.99m)
    .WithStatus(OrderStatus.Pending)
    .Build();
```

---

## 9. Known Limitations and Manual Testing Gaps

| Area                              | Limitation                                                     | Mitigation                                        |
|-----------------------------------|----------------------------------------------------------------|---------------------------------------------------|
| [EXTERNAL-SERVICE-NAME] integration | No emulator available; WireMock stubs may not cover all edge cases | Manual testing in Staging; contract tests          |
| Azure Managed Identity auth       | Cannot be emulated locally; OIDC flow requires real Azure AD   | Use connection-string auth in tests; test OIDC in Staging |
| [THIRD-PARTY-API]                 | Rate limits prevent high-volume testing                        | WireMock for CI; manual spot checks in Staging     |
| Multi-region failover             | Cannot simulate in integration tests                           | Tested via chaos engineering in Staging/Prod       |
| [ADD MORE AS NEEDED]              |                                                                |                                                   |

---

## 10. Appendix

### Integration Test Inventory

| Test Suite / Class                | Components Under Test                      | Dependencies (Containers)         | Avg Duration |
|-----------------------------------|--------------------------------------------|-----------------------------------|--------------|
| [TEST-SUITE-1]                    | [COMPONENT-A] + [COMPONENT-B]             | SQL Server, Redis                 | [TIME]       |
| [TEST-SUITE-2]                    | [COMPONENT-C] + [EXTERNAL-STUB]           | WireMock                          | [TIME]       |
| [TEST-SUITE-3]                    | [COMPONENT-D] + [MESSAGE-HANDLER]         | RabbitMQ, SQL Server              | [TIME]       |
| [ADD MORE AS NEEDED]              |                                            |                                   |              |

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Unit Testing](./unit-testing.md)
- [Performance Testing](./performance-testing.md)
- [Build Pipeline](../05-cicd-pipeline/build-pipeline.md)
