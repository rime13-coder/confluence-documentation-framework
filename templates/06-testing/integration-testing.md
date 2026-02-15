# Integration Testing

| **Page Title**   | Integration Testing                        |
|------------------|--------------------------------------------|
| **Last Updated** | 2026-02-14                                 |
| **Status**       | Draft                                      |
| **Owner**        | IntelliSecOps Development Team             |

---

## 1. Current State

Integration testing for the CMMC Assessor Platform is **not yet implemented**. This document defines the scope, approach, and planned implementation for integration tests.

### What Needs to Be Done

1. Set up Supertest for API endpoint testing against the Express.js backend.
2. Configure Testcontainers for ephemeral PostgreSQL instances in CI.
3. Write integration tests covering API routes, Prisma database operations, and authentication flows.
4. Add integration test execution to the CI pipeline.

---

## 2. Integration Test Scope and Boundaries

Integration tests verify that multiple components work correctly together. They sit between unit tests (isolated, fast) and E2E tests (full system, slow) on the testing pyramid.

### In Scope (Planned)

| Category                       | Examples                                                            |
|--------------------------------|---------------------------------------------------------------------|
| API endpoint behavior          | HTTP request through Express router -> service -> Prisma -> PostgreSQL |
| Database operations            | CRUD operations against a real (containerized) PostgreSQL database  |
| Authentication flows           | Microsoft Entra ID token validation through the middleware stack    |
| Authorization enforcement      | Role-based access control (RBAC) for CMMC assessor roles           |
| Prisma schema and migrations   | Verifying migrations apply cleanly and schema is correct           |
| API response formats           | Correct HTTP status codes, response body structure, error formats   |

### Out of Scope

| Category                       | Reason                                    | Covered By                  |
|--------------------------------|-------------------------------------------|-----------------------------|
| UI interactions                | Too slow and brittle for integration level | E2E tests (planned)         |
| Third-party SaaS availability | Cannot control external uptime             | Monitoring                  |
| Full multi-service orchestration | Requires full environment                | E2E tests (planned)         |
| Performance under load         | Different tooling and environment          | Performance tests (planned) |
| Microsoft Entra ID live auth   | Requires real Azure AD tenant              | Manual testing in production|

---

## 3. Test Environment Requirements (Planned)

| Requirement                    | Solution                                                     |
|--------------------------------|--------------------------------------------------------------|
| **Database**                   | Testcontainers: ephemeral PostgreSQL 16 container per test run |
| **External HTTP services**     | Jest mocks or MSW (Mock Service Worker) for external API stubs |
| **CI runner requirements**     | GitHub Actions `ubuntu-latest` with Docker support           |
| **Ports**                      | Testcontainers assigns random ports; no port conflicts       |
| **Prisma client**              | Generated at test startup; migrations applied to test database |

### Docker Compose Alternative for Local Development

Developers can also run integration tests locally against the existing Docker Compose environment:

```yaml
# Existing docker-compose.yml services used for local integration tests
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: cmmc
      POSTGRES_PASSWORD: cmmc_dev_password
      POSTGRES_DB: cmmc_assessor
    ports:
      - '5432:5432'
```

---

## 4. Tools and Frameworks (Planned)

| Tool                        | Purpose                                        | Language / Runtime     |
|-----------------------------|------------------------------------------------|------------------------|
| **Supertest**               | HTTP assertion library for Express.js APIs     | Node.js / TypeScript   |
| **Testcontainers**          | Spin up ephemeral PostgreSQL Docker containers | Node.js                |
| **Jest**                    | Test runner and assertion framework            | Node.js / TypeScript   |
| **Prisma Migrate**          | Apply database migrations to test database     | Node.js (Prisma CLI)   |
| **MSW (Mock Service Worker)** | Stub external HTTP services (Entra ID, etc.) | Node.js                |

---

## 5. API Integration Testing (Planned)

### Approach

| Aspect                     | Configuration                                                |
|----------------------------|--------------------------------------------------------------|
| **Test framework**         | Jest + Supertest                                             |
| **App bootstrapping**      | Create Express app instance in test setup; inject test config |
| **Database**               | Testcontainers PostgreSQL; Prisma migrations applied at startup |
| **Authentication mocking** | Mock Entra ID middleware to bypass real auth for most tests; dedicated auth tests verify middleware separately |
| **Seed data**              | Minimal seed data inserted in test setup (`beforeEach`)      |
| **Cleanup strategy**       | Transaction rollback or truncate tables between tests        |

### Example Test Structure (Planned)

```typescript
import request from 'supertest';
import { createApp } from '../src/app';
import { setupTestDatabase, teardownTestDatabase } from './helpers/database';

describe('Assessment API', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const db = await setupTestDatabase(); // Starts Testcontainers PostgreSQL
    prisma = db.prisma;
    app = createApp({ prisma });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('GET /api/assessments', () => {
    it('should return 200 with a list of assessments for authenticated user', async () => {
      // Seed test data
      await prisma.assessment.create({ data: { /* ... */ } });

      const response = await request(app)
        .get('/api/assessments')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body).toHaveProperty('assessments');
      expect(response.body.assessments).toHaveLength(1);
    });

    it('should return 401 when no authentication token is provided', async () => {
      await request(app)
        .get('/api/assessments')
        .expect(401);
    });
  });
});
```

---

## 6. Database Integration Testing (Planned)

### Approach

| Aspect                      | Configuration                                              |
|-----------------------------|------------------------------------------------------------|
| **Database engine**         | PostgreSQL 16 (matching production)                        |
| **Provisioning**            | Testcontainers spins up a fresh PostgreSQL per test run    |
| **Schema migration**        | Prisma Migrate applied at test startup (`prisma migrate deploy`) |
| **Seed data**               | Minimal seed data inserted in test setup (factory patterns) |
| **Cleanup strategy**        | Truncate all tables between test suites                    |
| **Connection string**       | Dynamically generated by Testcontainers; injected via `DATABASE_URL` env var |

### What to Test

- [ ] CRUD operations for each Prisma model (Assessment, User, Control, Finding)
- [ ] Complex queries (filtering assessments by status, aggregating scores)
- [ ] Prisma migration scripts apply cleanly from scratch
- [ ] Data constraints and referential integrity (foreign keys, unique constraints)
- [ ] Concurrent access scenarios (optimistic locking if implemented)

---

## 7. Message Broker Integration Testing

Not applicable to the CMMC Assessor Platform. The application does not currently use a message broker. If event-driven architecture is introduced in the future, this section should be updated.

---

## 8. CI Integration and Execution Schedule (Planned)

### When Integration Tests Will Run

| Trigger                    | Runs Integration Tests? | Notes                                     |
|----------------------------|--------------------------|-------------------------------------------|
| PR to `main` / `develop`  | Yes (planned)            | Full integration test suite                |
| Push to `develop`          | Yes (planned)            | Full suite; gate for integration branch    |
| Push to `main`             | Yes (planned)            | Full suite; gate for production deployment |
| Nightly schedule           | Planned                  | Full suite + longer-running scenarios      |

### Planned GitHub Actions Integration Test Step

```yaml
# New job in ci.yml (planned):
integration-test:
  name: Integration Tests
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:16-alpine
      env:
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
        POSTGRES_DB: cmmc_test
      ports:
        - 5432:5432
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
  defaults:
    run:
      working-directory: ./backend
  steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Generate Prisma client
      run: npx prisma generate

    - name: Run database migrations
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/cmmc_test

    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/cmmc_test
        NODE_ENV: test
```

### Performance Considerations

- Integration tests are slower than unit tests. Target total execution time: < 5 minutes.
- Use parallel test execution where possible (ensure no shared state between test suites).
- PostgreSQL container startup adds ~5-10 seconds overhead.

---

## 9. Test Data Setup and Teardown Strategy (Planned)

| Phase        | Strategy                                                                    |
|--------------|-----------------------------------------------------------------------------|
| **Setup**    | Each test suite provisions its own data using factory functions. Prisma client creates test entities in the `beforeEach` or `beforeAll` block. |
| **Isolation**| Each test suite truncates relevant tables in `afterEach` to prevent cross-test data leakage. |
| **Teardown** | Testcontainers (if used) automatically destroys the PostgreSQL container after the test run. If using GitHub Actions service containers, the database is ephemeral to the job. |
| **Shared fixtures** | For expensive setup (e.g., database migrations), use suite-level setup (`beforeAll`) to apply migrations once per test file. |

### Test Data Factories (Planned)

```typescript
// tests/factories/assessmentFactory.ts
import { PrismaClient, Assessment } from '@prisma/client';

export async function createTestAssessment(
  prisma: PrismaClient,
  overrides: Partial<Assessment> = {}
): Promise<Assessment> {
  return prisma.assessment.create({
    data: {
      name: 'Test CMMC Assessment',
      level: 2,
      status: 'IN_PROGRESS',
      organizationId: 'test-org-id',
      ...overrides,
    },
  });
}
```

---

## 10. Known Limitations and Manual Testing Gaps

| Area                              | Limitation                                                     | Mitigation                                        |
|-----------------------------------|----------------------------------------------------------------|---------------------------------------------------|
| Microsoft Entra ID authentication | Cannot be emulated locally; OIDC flow requires real Azure AD   | Mock auth middleware in integration tests; test real OIDC in production |
| CMMC compliance data accuracy     | Test data may not cover all edge cases in CMMC control mappings | Supplement with manual verification of assessment logic |
| Azure Key Vault access            | Cannot access real Key Vault from CI                           | Use environment variables with test values in CI   |
| Custom domain / TLS               | Cannot test TLS termination in integration tests               | Tested manually in production environment          |

---

## 11. Appendix

### Integration Test Inventory (Planned)

| Test Suite / Class                | Components Under Test                          | Dependencies              | Est. Duration |
|-----------------------------------|------------------------------------------------|---------------------------|---------------|
| Assessment API tests              | Express routes + Prisma + PostgreSQL           | PostgreSQL (Testcontainers) | ~30 sec      |
| Authentication middleware tests   | Auth middleware + token validation              | None (mocked)             | ~10 sec       |
| User management API tests         | User routes + Prisma + PostgreSQL              | PostgreSQL (Testcontainers) | ~20 sec      |
| CMMC control mapping tests        | Control service + Prisma + PostgreSQL          | PostgreSQL (Testcontainers) | ~20 sec      |
| Database migration tests          | Prisma migrate from scratch                    | PostgreSQL (Testcontainers) | ~15 sec      |

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Unit Testing](./unit-testing.md)
- [Performance Testing](./performance-testing.md)
- [Build Pipeline](../05-cicd-pipeline/build-pipeline.md)
