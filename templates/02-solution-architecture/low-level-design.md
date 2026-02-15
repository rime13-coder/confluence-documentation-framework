# Low-Level Design (LLD)

| **Metadata**     | **Value**                                      |
|------------------|------------------------------------------------|
| Page Title       | [PROJECT_NAME] - Low-Level Design (LLD)        |
| Last Updated     | [YYYY-MM-DD]                                   |
| Status           | `DRAFT` / `IN REVIEW` / `APPROVED`             |
| Owner            | [OWNER_NAME]                                   |
| Reviewers        | [REVIEWER_1], [REVIEWER_2], [REVIEWER_3]       |
| Version          | [VERSION_NUMBER, e.g., 1.0]                    |
| Related HLD      | [LINK_TO_ARCHITECTURE_OVERVIEW_HLD]            |

---

## 1. Document Purpose

This document provides the detailed low-level design for **[PROJECT_NAME]**. It describes the internal structure of each component, API contracts, database schemas, messaging contracts, and coding conventions. This document is intended for the development team and serves as the bridge between high-level architecture decisions and implementation.

---

## 2. Component Diagram (C4 Level 3)

<!-- Insert diagram here using draw.io/Lucidchart -->
<!--
    C4 Level 3 - Component Diagram
    Create one diagram per container (from the HLD Container Diagram).
    Show:
    - Internal components/modules within each container
    - Responsibilities of each component
    - Interactions and data flow between components
    - External dependencies called by each component
    Recommended tool: draw.io, Lucidchart, or Structurizr
-->

---

## 3. Detailed Component Breakdown

### 3.1 Component Inventory

| Component | Responsibility | Technology | Hosting | Repository | Owner |
|-----------|---------------|------------|---------|------------|-------|
| [WEB_FRONTEND] | [e.g., User-facing SPA for customer portal] | [e.g., React 18, TypeScript 5.x] | [e.g., Azure App Service] | [e.g., github.com/org/project-web] | [TEAM/PERSON] |
| [API_GATEWAY] | [e.g., Request routing, rate limiting, auth validation] | [e.g., Azure API Management] | [e.g., Azure APIM] | [e.g., github.com/org/project-infra] | [TEAM/PERSON] |
| [SERVICE_A] | [e.g., User management, authentication flows] | [e.g., .NET 8 Web API] | [e.g., AKS] | [e.g., github.com/org/project-user-svc] | [TEAM/PERSON] |
| [SERVICE_B] | [e.g., Order processing and fulfillment] | [e.g., .NET 8 Web API] | [e.g., AKS] | [e.g., github.com/org/project-order-svc] | [TEAM/PERSON] |
| [SERVICE_C] | [e.g., Notification dispatch (email, SMS, push)] | [e.g., Node.js 20, TypeScript] | [e.g., Azure Functions] | [e.g., github.com/org/project-notification-svc] | [TEAM/PERSON] |
| [WORKER_D] | [e.g., Background report generation] | [e.g., .NET 8 Worker Service] | [e.g., AKS] | [e.g., github.com/org/project-report-worker] | [TEAM/PERSON] |
| [LEGACY_COMPONENT] | [e.g., Legacy billing engine] | [e.g., .NET Framework 4.8] | [e.g., Azure VM] | [e.g., github.com/org/project-billing-legacy] | [TEAM/PERSON] |
| [ADDITIONAL_COMPONENT] | [RESPONSIBILITY] | [TECHNOLOGY] | [HOSTING] | [REPOSITORY] | [OWNER] |

### 3.2 Component Interaction Matrix

| Source | Target | Protocol | Pattern | Data Exchanged |
|--------|--------|----------|---------|----------------|
| [WEB_FRONTEND] | [API_GATEWAY] | HTTPS | Sync (REST) | [e.g., User actions, queries] |
| [API_GATEWAY] | [SERVICE_A] | HTTPS | Sync (REST) | [e.g., Authenticated requests] |
| [SERVICE_A] | [SERVICE_B] | AMQP | Async (Event) | [e.g., UserCreated event] |
| [SERVICE_B] | [SERVICE_C] | AMQP | Async (Command) | [e.g., SendNotification command] |
| [SERVICE_B] | [LEGACY_COMPONENT] | HTTPS | Sync (REST) | [e.g., Billing calculation request] |
| [ADDITIONAL_SOURCE] | [ADDITIONAL_TARGET] | [PROTOCOL] | [PATTERN] | [DATA] |

---

## 4. API Design

### 4.1 API Conventions

| Convention | Standard |
|------------|----------|
| API Style | [e.g., RESTful, resource-oriented] |
| URL Pattern | [e.g., /api/v{version}/{resource}] |
| Versioning Strategy | [e.g., URL path versioning: /api/v1/, /api/v2/] |
| Request/Response Format | [e.g., JSON (application/json)] |
| Date/Time Format | [e.g., ISO 8601 (UTC)] |
| Pagination | [e.g., Cursor-based: ?cursor=xxx&limit=50] |
| Filtering | [e.g., OData-style: ?$filter=status eq 'active'] |
| Sorting | [e.g., ?sort=createdAt:desc] |
| Error Response Format | [e.g., RFC 7807 Problem Details] |
| Naming Convention | [e.g., camelCase for JSON properties, kebab-case for URLs] |

### 4.2 [SERVICE_A] API Endpoints

| Method | Endpoint | Auth | Request Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| GET | /api/v1/users | Bearer JWT (Role: Admin, Viewer) | N/A | `200: User[]`, `401`, `403` | List all users with pagination |
| GET | /api/v1/users/{id} | Bearer JWT (Role: Admin, Viewer) | N/A | `200: User`, `404` | Get user by ID |
| POST | /api/v1/users | Bearer JWT (Role: Admin) | `CreateUserRequest` | `201: User`, `400`, `409` | Create a new user |
| PUT | /api/v1/users/{id} | Bearer JWT (Role: Admin) | `UpdateUserRequest` | `200: User`, `400`, `404` | Update an existing user |
| DELETE | /api/v1/users/{id} | Bearer JWT (Role: Admin) | N/A | `204`, `404` | Soft-delete a user |
| [METHOD] | [ENDPOINT] | [AUTH] | [REQUEST_BODY] | [RESPONSE] | [DESCRIPTION] |

### 4.3 [SERVICE_B] API Endpoints

| Method | Endpoint | Auth | Request Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| GET | /api/v1/orders | Bearer JWT | N/A | `200: Order[]` | List orders for authenticated user |
| POST | /api/v1/orders | Bearer JWT | `CreateOrderRequest` | `201: Order`, `400` | Place a new order |
| GET | /api/v1/orders/{id} | Bearer JWT | N/A | `200: Order`, `404` | Get order details |
| PATCH | /api/v1/orders/{id}/status | Bearer JWT (Role: Admin) | `UpdateStatusRequest` | `200: Order`, `400` | Update order status |
| [METHOD] | [ENDPOINT] | [AUTH] | [REQUEST_BODY] | [RESPONSE] | [DESCRIPTION] |

### 4.4 [OPTIONAL] GraphQL Schema Summary

```graphql
# [Include if using GraphQL for any service]
type Query {
  [QUERY_NAME]([ARGS]): [RETURN_TYPE]
}

type Mutation {
  [MUTATION_NAME]([ARGS]): [RETURN_TYPE]
}

type Subscription {
  [SUBSCRIPTION_NAME]([ARGS]): [RETURN_TYPE]
}
```

---

## 5. Database Schema Overview

### 5.1 Database Inventory

| Database | Engine | Azure Service | Purpose | Schema Owner |
|----------|--------|---------------|---------|--------------|
| [DB_NAME_1] | [e.g., PostgreSQL 16] | [e.g., Azure Database for PostgreSQL Flexible Server] | [e.g., User and identity data] | [SERVICE_A] |
| [DB_NAME_2] | [e.g., PostgreSQL 16] | [e.g., Azure Database for PostgreSQL Flexible Server] | [e.g., Order and transaction data] | [SERVICE_B] |
| [DB_NAME_3] | [e.g., Cosmos DB (NoSQL)] | [e.g., Azure Cosmos DB] | [e.g., Product catalog, session state] | [SERVICE_C] |
| [ADDITIONAL_DB] | [ENGINE] | [AZURE_SERVICE] | [PURPOSE] | [OWNER] |

### 5.2 [DB_NAME_1] - Entity Relationship Overview

<!-- Insert ERD diagram here using draw.io/Lucidchart/dbdiagram.io -->
<!-- Show tables, columns (PK, FK, key attributes), and relationships -->

#### Key Tables / Collections

| Table/Collection | Description | Key Columns | Indexes |
|-----------------|-------------|-------------|---------|
| `users` | Registered user accounts | `id (PK, UUID)`, `email (UNIQUE)`, `display_name`, `status`, `created_at`, `updated_at` | `idx_users_email`, `idx_users_status` |
| `user_roles` | Role assignments for users | `id (PK)`, `user_id (FK -> users)`, `role_name`, `assigned_at` | `idx_user_roles_user_id` |
| `audit_log` | Immutable audit trail | `id (PK)`, `entity_type`, `entity_id`, `action`, `actor_id`, `timestamp`, `changes (JSONB)` | `idx_audit_entity`, `idx_audit_timestamp` |
| [ADDITIONAL_TABLE] | [DESCRIPTION] | [KEY_COLUMNS] | [INDEXES] |

### 5.3 [DB_NAME_2] - Entity Relationship Overview

<!-- Insert ERD diagram here using draw.io/Lucidchart/dbdiagram.io -->

| Table/Collection | Description | Key Columns | Indexes |
|-----------------|-------------|-------------|---------|
| `orders` | Customer orders | `id (PK, UUID)`, `customer_id (FK)`, `status`, `total_amount`, `currency`, `created_at` | `idx_orders_customer`, `idx_orders_status` |
| `order_items` | Line items within an order | `id (PK)`, `order_id (FK -> orders)`, `product_id`, `quantity`, `unit_price` | `idx_order_items_order_id` |
| `payments` | Payment transactions | `id (PK)`, `order_id (FK -> orders)`, `provider`, `status`, `amount`, `processed_at` | `idx_payments_order_id` |
| [ADDITIONAL_TABLE] | [DESCRIPTION] | [KEY_COLUMNS] | [INDEXES] |

### 5.4 Database Migration Strategy

| Aspect | Approach |
|--------|----------|
| Migration Tool | [e.g., Entity Framework Migrations / Flyway / Liquibase] |
| Migration Execution | [e.g., Runs as init container in AKS before app startup] |
| Rollback Strategy | [e.g., Down migrations tested in CI, manual rollback with approval for production] |
| Schema Versioning | [e.g., Sequential numbering: V001__, V002__, etc.] |
| Breaking Changes | [e.g., Expand-and-contract pattern; never drop columns in the same release] |

---

## 6. Message and Event Contracts

### 6.1 Event Catalog

| Event Name | Publisher | Subscriber(s) | Broker | Topic/Queue | Schema Version |
|-----------|-----------|---------------|--------|-------------|----------------|
| `UserCreated` | [SERVICE_A] | [SERVICE_B], [SERVICE_C] | Azure Service Bus | `user-events` (Topic) | v1 |
| `OrderPlaced` | [SERVICE_B] | [SERVICE_C], [WORKER_D] | Azure Service Bus | `order-events` (Topic) | v1 |
| `PaymentProcessed` | [SERVICE_B] | [SERVICE_B] (saga), [SERVICE_C] | Azure Service Bus | `payment-events` (Topic) | v1 |
| `NotificationSent` | [SERVICE_C] | [WORKER_D] (logging) | Azure Service Bus | `notification-events` (Topic) | v1 |
| [ADDITIONAL_EVENT] | [PUBLISHER] | [SUBSCRIBER(S)] | [BROKER] | [TOPIC/QUEUE] | [VERSION] |

### 6.2 Event Schema Examples

```json
// UserCreated Event (v1)
{
  "eventId": "uuid",
  "eventType": "UserCreated",
  "eventVersion": "1.0",
  "timestamp": "2026-01-15T10:30:00Z",
  "correlationId": "uuid",
  "source": "[SERVICE_A]",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "roles": ["Viewer"]
  }
}
```

```json
// OrderPlaced Event (v1)
{
  "eventId": "uuid",
  "eventType": "OrderPlaced",
  "eventVersion": "1.0",
  "timestamp": "2026-01-15T11:00:00Z",
  "correlationId": "uuid",
  "source": "[SERVICE_B]",
  "data": {
    "orderId": "uuid",
    "customerId": "uuid",
    "totalAmount": 149.99,
    "currency": "EUR",
    "itemCount": 3
  }
}
```

### 6.3 Event Versioning Strategy

| Aspect | Approach |
|--------|----------|
| Schema Registry | [e.g., Azure Schema Registry in Event Hubs / custom in blob storage] |
| Versioning | [e.g., Semantic versioning of event schemas; backward-compatible additions only within a major version] |
| Breaking Changes | [e.g., New event type + migration period; old event deprecated but published in parallel] |
| Serialization | [e.g., JSON with schema validation on publish; CloudEvents envelope format] |

---

## 7. Error Handling Strategy

### 7.1 Error Classification

| Category | HTTP Status Range | Retry | Example |
|----------|------------------|-------|---------|
| Client Error (Validation) | 400-499 | No | Invalid request payload, missing required field |
| Authentication Error | 401 | No (re-auth) | Expired token, invalid credentials |
| Authorization Error | 403 | No | Insufficient permissions |
| Not Found | 404 | No | Resource does not exist |
| Conflict | 409 | Conditional | Duplicate resource, optimistic concurrency violation |
| Server Error (Transient) | 500, 502, 503, 504 | Yes (with backoff) | Database timeout, downstream service unavailable |
| Server Error (Permanent) | 500 | No | Unhandled exception, data corruption |

### 7.2 Error Response Format (RFC 7807)

```json
{
  "type": "https://[PROJECT_DOMAIN]/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "One or more validation errors occurred.",
  "instance": "/api/v1/orders/12345",
  "traceId": "00-abc123-def456-01",
  "errors": {
    "email": ["Email address is not valid."],
    "quantity": ["Quantity must be greater than 0."]
  }
}
```

### 7.3 Retry Policies

| Scenario | Strategy | Max Retries | Initial Delay | Max Delay | Backoff |
|----------|----------|-------------|---------------|-----------|---------|
| HTTP calls to downstream services | Exponential backoff + jitter | [e.g., 3] | [e.g., 500ms] | [e.g., 30s] | [e.g., Exponential] |
| Database transient failures | Exponential backoff | [e.g., 3] | [e.g., 1s] | [e.g., 15s] | [e.g., Exponential] |
| Message processing failures | Fixed delay with dead-letter | [e.g., 5] | [e.g., 5s] | [e.g., 5s] | [e.g., Fixed] |
| [ADDITIONAL_SCENARIO] | [STRATEGY] | [MAX_RETRIES] | [INITIAL_DELAY] | [MAX_DELAY] | [BACKOFF] |

### 7.4 Dead-Letter Handling

| Aspect | Approach |
|--------|----------|
| Dead-Letter Queue | [e.g., Azure Service Bus DLQ per subscription] |
| Monitoring | [e.g., Alert when DLQ depth > 0; dashboard for DLQ messages] |
| Remediation | [e.g., Manual review via custom admin tool; replay after fix] |
| Retention | [e.g., 14 days in DLQ before auto-expiry] |

---

## 8. Caching Strategy

### 8.1 Cache Inventory

| Data | Cache Layer | Cache Service | TTL | Invalidation Strategy | Justification |
|------|-------------|--------------|-----|----------------------|---------------|
| [e.g., User profile data] | Distributed | Azure Cache for Redis | [e.g., 15 min] | [e.g., Write-through on user update] | [e.g., Reduce DB load for frequently read data] |
| [e.g., Product catalog] | Distributed | Azure Cache for Redis | [e.g., 1 hour] | [e.g., Event-driven invalidation on CatalogUpdated] | [e.g., Catalog reads are 100x more frequent than writes] |
| [e.g., API responses] | CDN | Azure Front Door | [e.g., 5 min] | [e.g., Cache-Control headers, purge API] | [e.g., Reduce backend load for public content] |
| [e.g., Session tokens] | Distributed | Azure Cache for Redis | [e.g., 30 min sliding] | [e.g., Explicit removal on logout] | [e.g., Stateless backend services] |
| [e.g., Reference data lookups] | In-Memory | IMemoryCache (.NET) | [e.g., 24 hours] | [e.g., Restart or background refresh] | [e.g., Small, rarely changing dataset] |
| [ADDITIONAL_DATA] | [CACHE_LAYER] | [SERVICE] | [TTL] | [INVALIDATION] | [JUSTIFICATION] |

### 8.2 Cache Patterns

| Pattern | Where Applied | Description |
|---------|---------------|-------------|
| Cache-Aside | [e.g., User profiles, product data] | Application checks cache first; on miss, loads from DB and populates cache. |
| Write-Through | [e.g., Session data] | Writes go to cache and DB simultaneously. |
| Write-Behind | [COMPONENT] | [DESCRIPTION, if applicable] |
| Cache Stampede Prevention | [e.g., All distributed cache reads] | [e.g., Lock-based cache repopulation to prevent thundering herd] |

---

## 9. Configuration Management

### 9.1 Application Settings

| Setting | Source | Scope | Example Value | Sensitive |
|---------|--------|-------|---------------|-----------|
| `Database__ConnectionString` | Azure Key Vault | Per environment | `Host=...;Database=...` | Yes |
| `ServiceBus__ConnectionString` | Azure Key Vault | Per environment | `Endpoint=sb://...` | Yes |
| `Redis__ConnectionString` | Azure Key Vault | Per environment | `*.redis.cache.windows.net:6380` | Yes |
| `Api__RateLimit__RequestsPerMinute` | Azure App Configuration | Per environment | `100` | No |
| `Logging__MinimumLevel` | Azure App Configuration | Per environment | `Information` | No |
| `Features__[FEATURE_NAME]` | Azure App Configuration | Per environment | `true` / `false` | No |
| [ADDITIONAL_SETTING] | [SOURCE] | [SCOPE] | [EXAMPLE_VALUE] | [SENSITIVE] |

### 9.2 Feature Flags

| Flag Name | Description | Default (Dev) | Default (Prod) | Rollout Strategy |
|-----------|-------------|---------------|----------------|------------------|
| `Features__NewCheckoutFlow` | [e.g., Enable redesigned checkout experience] | `true` | `false` | [e.g., Percentage rollout: 10% -> 50% -> 100%] |
| `Features__V2Api` | [e.g., Enable v2 API endpoints] | `true` | `false` | [e.g., Canary deployment with ring-based rollout] |
| `Features__DarkMode` | [e.g., Enable dark mode UI toggle] | `true` | `true` | [e.g., User opt-in] |
| [ADDITIONAL_FLAG] | [DESCRIPTION] | [DEV_DEFAULT] | [PROD_DEFAULT] | [ROLLOUT_STRATEGY] |

### 9.3 Environment Configuration Matrix

| Setting Category | Development | Staging | Production |
|-----------------|-------------|---------|------------|
| AKS Node Count | [e.g., 2] | [e.g., 3] | [e.g., 5-20 (autoscale)] |
| App Service Plan | [e.g., B1] | [e.g., P1v3] | [e.g., P2v3] |
| Database SKU | [e.g., Burstable B1ms] | [e.g., GP D2s_v3] | [e.g., GP D4s_v3] |
| Redis SKU | [e.g., Basic C0] | [e.g., Standard C1] | [e.g., Premium P1] |
| Log Level | [e.g., Debug] | [e.g., Information] | [e.g., Warning] |
| Replicas per Service | [e.g., 1] | [e.g., 2] | [e.g., 3+] |
| [ADDITIONAL_SETTING] | [DEV_VALUE] | [STAGING_VALUE] | [PROD_VALUE] |

---

## 10. Code Structure and Project Layout

### 10.1 Repository Strategy

| Aspect | Approach |
|--------|----------|
| Repository Model | [e.g., Polyrepo (one repo per service) / Monorepo] |
| Branching Strategy | [e.g., GitHub Flow: main + feature branches, PR-based] |
| Branch Naming | [e.g., feature/JIRA-123-short-description, bugfix/JIRA-456-fix-name] |
| PR Requirements | [e.g., 1 approval, passing CI, no merge conflicts, linked JIRA ticket] |

### 10.2 Standard Project Layout (.NET Service Example)

```
src/
  [ServiceName].Api/                  # API host / entry point
    Controllers/                      # API controllers
    Middleware/                        # Custom middleware (auth, error handling, logging)
    Program.cs                        # Host configuration and DI setup
    appsettings.json                  # Default configuration
  [ServiceName].Application/          # Application/use-case layer
    Commands/                         # CQRS command handlers
    Queries/                          # CQRS query handlers
    Validators/                       # FluentValidation validators
    Mappings/                         # AutoMapper profiles
    Interfaces/                       # Application-level abstractions
  [ServiceName].Domain/               # Domain layer (entities, value objects, domain events)
    Entities/
    ValueObjects/
    Events/
    Exceptions/
    Interfaces/                       # Domain service interfaces
  [ServiceName].Infrastructure/       # Infrastructure layer (DB, messaging, external services)
    Persistence/                      # EF Core DbContext, migrations, repositories
    Messaging/                        # Service Bus publishers/consumers
    ExternalServices/                 # HTTP clients for external APIs
    Configuration/                    # Infrastructure-specific config
tests/
  [ServiceName].UnitTests/            # Unit tests (domain + application layers)
  [ServiceName].IntegrationTests/     # Integration tests (infrastructure layer)
  [ServiceName].FunctionalTests/      # End-to-end API tests
```

### 10.3 Standard Project Layout (Node.js/TypeScript Service Example)

```
src/
  controllers/                        # Route handlers / controllers
  services/                           # Business logic services
  repositories/                       # Data access layer
  models/                             # Data models / schemas
  middleware/                         # Express/Koa middleware
  events/                             # Event publishers / subscribers
  config/                             # Configuration management
  utils/                              # Shared utilities
  types/                              # TypeScript type definitions
  index.ts                            # Application entry point
tests/
  unit/                               # Unit tests
  integration/                        # Integration tests
  e2e/                                # End-to-end tests
```

### 10.4 Coding Conventions

| Aspect | Convention |
|--------|-----------|
| Code Formatting | [e.g., Prettier (TypeScript), dotnet format (.NET), enforced via pre-commit hooks] |
| Linting | [e.g., ESLint (TypeScript), Roslyn analyzers (.NET)] |
| Naming | [e.g., PascalCase for classes/methods (.NET), camelCase for variables; camelCase throughout (TypeScript)] |
| Testing | [e.g., xUnit + FluentAssertions (.NET), Jest + Supertest (Node.js)] |
| Test Naming | [e.g., MethodName_StateUnderTest_ExpectedBehavior] |
| Code Coverage Target | [e.g., Minimum 80% line coverage, enforced in CI] |
| Dependency Injection | [e.g., Built-in .NET DI / Inversify (TypeScript)] |
| API Documentation | [e.g., OpenAPI 3.0 spec auto-generated from code annotations (Swashbuckle / tsoa)] |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | [YYYY-MM-DD] | [AUTHOR] | Initial draft |
| [VERSION] | [YYYY-MM-DD] | [AUTHOR] | [CHANGES] |
