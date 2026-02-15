# Integration Architecture

| **Metadata**     | **Value**                                      |
|------------------|------------------------------------------------|
| Page Title       | [PROJECT_NAME] - Integration Architecture      |
| Last Updated     | [YYYY-MM-DD]                                   |
| Status           | `DRAFT` / `IN REVIEW` / `APPROVED`             |
| Owner            | [OWNER_NAME]                                   |
| Reviewers        | [REVIEWER_1], [REVIEWER_2], [REVIEWER_3]       |
| Version          | [VERSION_NUMBER, e.g., 1.0]                    |
| Related HLD      | [LINK_TO_ARCHITECTURE_OVERVIEW_HLD]            |

---

## 1. Document Purpose

This document defines the integration architecture for **[PROJECT_NAME]**. It describes how internal services communicate with each other and with external systems, including protocols, patterns, authentication mechanisms, error handling, and SLAs. This document serves as the authoritative reference for all integration points within the solution.

---

## 2. Integration Landscape Diagram

<!-- Insert integration landscape / context diagram here using draw.io/Lucidchart -->
<!--
    Show:
    - All internal services and their integration boundaries
    - External systems and third-party services
    - API gateway as the single entry point for external consumers
    - Message broker / event bus connecting async services
    - Integration protocols on each arrow (REST, gRPC, AMQP, SFTP, etc.)
    - Network boundaries (public internet, VNet, private endpoints)
    Recommended tool: draw.io, Lucidchart
-->

---

## 3. Integration Inventory

### 3.1 Internal Service Integrations

| # | Source | Target | Protocol | Pattern | Auth Method | Data Format | SLA (Availability) | SLA (Latency P95) |
|---|--------|--------|----------|---------|-------------|-------------|--------------------|--------------------|
| 1 | [WEB_FRONTEND] | [API_GATEWAY] | HTTPS (REST) | Synchronous | [e.g., Bearer JWT (Entra ID)] | JSON | [e.g., 99.95%] | [e.g., < 200ms] |
| 2 | [API_GATEWAY] | [SERVICE_A] | HTTPS (REST) | Synchronous | [e.g., Managed Identity (pass-through JWT)] | JSON | [e.g., 99.95%] | [e.g., < 150ms] |
| 3 | [API_GATEWAY] | [SERVICE_B] | HTTPS (REST) | Synchronous | [e.g., Managed Identity (pass-through JWT)] | JSON | [e.g., 99.95%] | [e.g., < 200ms] |
| 4 | [SERVICE_A] | [SERVICE_B] | AMQP (Azure Service Bus) | Asynchronous (Event) | [e.g., Managed Identity (RBAC)] | JSON (CloudEvents) | [e.g., 99.99%] | [e.g., < 2s delivery] |
| 5 | [SERVICE_B] | [SERVICE_C] | AMQP (Azure Service Bus) | Asynchronous (Command) | [e.g., Managed Identity (RBAC)] | JSON (CloudEvents) | [e.g., 99.99%] | [e.g., < 5s delivery] |
| 6 | [SERVICE_A] | [DB_NAME_1] | TCP (PostgreSQL wire protocol) | Synchronous | [e.g., Managed Identity (Entra auth)] | SQL | [e.g., 99.95%] | [e.g., < 50ms] |
| 7 | [SERVICE_B] | [REDIS_CACHE] | TCP (Redis protocol) | Synchronous | [e.g., Access key (Key Vault)] | Binary/String | [e.g., 99.9%] | [e.g., < 5ms] |
| [#] | [SOURCE] | [TARGET] | [PROTOCOL] | [PATTERN] | [AUTH] | [FORMAT] | [SLA_AVAIL] | [SLA_LATENCY] |

### 3.2 External System Integrations

| # | Direction | Source | Target | Protocol | Pattern | Auth Method | Data Format | SLA (Availability) | SLA (Latency P95) |
|---|-----------|--------|--------|----------|---------|-------------|-------------|--------------------|--------------------|
| 1 | Inbound | [EXTERNAL_CLIENT_A] | [API_GATEWAY] | HTTPS (REST) | Synchronous | [e.g., OAuth 2.0 Client Credentials] | JSON | [e.g., 99.95%] | [e.g., < 500ms] |
| 2 | Outbound | [SERVICE_B] | [PAYMENT_PROVIDER] | HTTPS (REST) | Synchronous | [e.g., API Key + HMAC signature] | JSON | [e.g., 99.9% (provider SLA)] | [e.g., < 3s] |
| 3 | Inbound | [WEBHOOK_SOURCE] | [SERVICE_C] (Azure Functions) | HTTPS (Webhook) | Asynchronous | [e.g., HMAC signature validation] | JSON | [e.g., 99.9%] | [e.g., < 30s processing] |
| 4 | Outbound | [SERVICE_C] | [EMAIL_PROVIDER] | HTTPS (REST) | Asynchronous | [e.g., API Key] | JSON | [e.g., 99.9%] | [e.g., < 5s] |
| 5 | Bidirectional | [LEGACY_SYSTEM] | [SERVICE_A] | SFTP / HTTPS | Batch (Daily) | [e.g., SSH key + IP whitelist] | CSV / XML | [e.g., Best effort] | [e.g., N/A (batch)] |
| [#] | [DIRECTION] | [SOURCE] | [TARGET] | [PROTOCOL] | [PATTERN] | [AUTH] | [FORMAT] | [SLA_AVAIL] | [SLA_LATENCY] |

---

## 4. API Gateway Configuration

### 4.1 Azure API Management Overview

| Aspect | Configuration |
|--------|--------------|
| APIM Instance | [e.g., [PROJECT_NAME]-apim] |
| SKU / Tier | [e.g., Standard v2 / Premium] |
| Region | [e.g., West Europe] |
| Custom Domain | [e.g., api.[PROJECT_DOMAIN].com] |
| Developer Portal | [e.g., Enabled at developer.[PROJECT_DOMAIN].com] |
| VNet Integration | [e.g., External mode, connected to [VNET_NAME]/[SUBNET_NAME]] |

### 4.2 API Products and Subscriptions

| Product | APIs Included | Access | Rate Limit | Quota | Target Audience |
|---------|--------------|--------|------------|-------|-----------------|
| [e.g., Public API] | [e.g., User API v1, Product API v1] | [e.g., Requires subscription key + OAuth] | [e.g., 100 req/min] | [e.g., 10,000 req/day] | [e.g., External partners] |
| [e.g., Internal API] | [e.g., All internal service APIs] | [e.g., Managed Identity, VNet-restricted] | [e.g., 1,000 req/min] | [e.g., Unlimited] | [e.g., Internal services] |
| [e.g., Admin API] | [e.g., Admin operations API] | [e.g., Requires Admin role JWT] | [e.g., 50 req/min] | [e.g., 5,000 req/day] | [e.g., Internal admin tools] |
| [ADDITIONAL_PRODUCT] | [APIS] | [ACCESS] | [RATE_LIMIT] | [QUOTA] | [AUDIENCE] |

### 4.3 APIM Policies

| Policy | Scope | Description |
|--------|-------|-------------|
| JWT Validation | All APIs (inbound) | [e.g., Validate Entra ID JWT tokens, check audience and issuer claims] |
| Rate Limiting | Per product (inbound) | [e.g., Enforce rate limits per subscription key using rate-limit-by-key] |
| CORS | Public APIs (inbound) | [e.g., Allow origins: https://[PROJECT_DOMAIN].com, methods: GET/POST/PUT/DELETE] |
| IP Filtering | Admin API (inbound) | [e.g., Restrict to corporate IP ranges and VPN] |
| Request/Response Transformation | [SPECIFIC_API] (inbound/outbound) | [e.g., Add correlation headers, strip internal headers] |
| Caching | [SPECIFIC_API] (outbound) | [e.g., Cache GET responses for 5 minutes for read-heavy endpoints] |
| Backend Circuit Breaker | All APIs (backend) | [e.g., Trip after 5 consecutive 5xx errors, 30s recovery window] |
| Logging | All APIs | [e.g., Log to Application Insights with request/response bodies (sanitized)] |
| [ADDITIONAL_POLICY] | [SCOPE] | [DESCRIPTION] |

### 4.4 API Versioning Strategy

| Aspect | Approach |
|--------|----------|
| Versioning Method | [e.g., URL path versioning: /api/v1/resource, /api/v2/resource] |
| Deprecation Policy | [e.g., Minimum 6 months notice before retiring a version; communicated via developer portal and API response headers] |
| Header Indicator | [e.g., `Sunset: Sat, 01 Jan 2027 00:00:00 GMT` and `Deprecation: true` headers on deprecated versions] |
| Concurrent Versions | [e.g., Maximum 2 major versions supported simultaneously] |

---

## 5. Message Broker and Event Bus Design

### 5.1 Messaging Platform Overview

| Aspect | Configuration |
|--------|--------------|
| Service | [e.g., Azure Service Bus] |
| SKU / Tier | [e.g., Premium (1 Messaging Unit)] |
| Namespace | [e.g., [PROJECT_NAME]-sb.servicebus.windows.net] |
| Region | [e.g., West Europe] |
| Authentication | [e.g., Managed Identity with Azure RBAC (Service Bus Data Sender/Receiver)] |
| VNet Integration | [e.g., Private endpoint in [VNET_NAME]/[SUBNET_NAME]] |

### 5.2 Topics and Subscriptions

| Topic | Description | Publisher(s) | Message TTL | Max Delivery Count |
|-------|-------------|-------------|-------------|-------------------|
| `user-events` | User lifecycle events | [SERVICE_A] | [e.g., 14 days] | [e.g., 10] |
| `order-events` | Order lifecycle events | [SERVICE_B] | [e.g., 14 days] | [e.g., 10] |
| `payment-events` | Payment processing events | [SERVICE_B] | [e.g., 14 days] | [e.g., 10] |
| `notification-commands` | Notification dispatch commands | Multiple services | [e.g., 7 days] | [e.g., 5] |
| [ADDITIONAL_TOPIC] | [DESCRIPTION] | [PUBLISHER(S)] | [TTL] | [MAX_DELIVERY] |

| Topic | Subscription | Subscriber | Filter Rule | Description |
|-------|-------------|-----------|-------------|-------------|
| `user-events` | `order-svc` | [SERVICE_B] | [e.g., `eventType = 'UserCreated'`] | [e.g., Provision default order preferences for new users] |
| `user-events` | `notification-svc` | [SERVICE_C] | [e.g., `eventType IN ('UserCreated', 'UserDeactivated')`] | [e.g., Send welcome/goodbye email] |
| `order-events` | `notification-svc` | [SERVICE_C] | [e.g., `eventType = 'OrderPlaced'`] | [e.g., Send order confirmation notification] |
| `order-events` | `report-worker` | [WORKER_D] | [e.g., No filter (all events)] | [e.g., Update reporting materialized views] |
| `payment-events` | `order-svc` | [SERVICE_B] | [e.g., `eventType = 'PaymentProcessed'`] | [e.g., Update order status to confirmed/failed] |
| [ADDITIONAL_SUBSCRIPTION] | [SUBSCRIPTION] | [SUBSCRIBER] | [FILTER] | [DESCRIPTION] |

### 5.3 Queues (Point-to-Point)

| Queue | Description | Producer | Consumer | Message TTL | Max Delivery Count | Sessions |
|-------|------------|----------|----------|-------------|-------------------|----------|
| `report-generation` | Report generation requests | [SERVICE_B], Admin UI | [WORKER_D] | [e.g., 24 hours] | [e.g., 3] | [e.g., Yes (by report type)] |
| `data-export` | Data export requests (GDPR) | [SERVICE_A] | [WORKER_D] | [e.g., 48 hours] | [e.g., 3] | [e.g., Yes (by user ID)] |
| [ADDITIONAL_QUEUE] | [DESCRIPTION] | [PRODUCER] | [CONSUMER] | [TTL] | [MAX_DELIVERY] | [SESSIONS] |

### 5.4 [OPTIONAL] Azure Event Grid Configuration

| Aspect | Configuration |
|--------|--------------|
| Use Case | [e.g., React to Azure resource events (blob created, Key Vault secret rotated)] |
| Topic Type | [e.g., System topics for Azure Storage, Key Vault] |
| Subscriber | [e.g., Azure Functions triggered on BlobCreated events] |
| Dead-Letter | [e.g., Blob storage container for failed deliveries] |

| Event Source | Event Type | Subscriber | Handler |
|-------------|-----------|-----------|---------|
| [e.g., Azure Storage Account] | `Microsoft.Storage.BlobCreated` | [e.g., Azure Function: ProcessUpload] | [e.g., Virus scan, thumbnail generation] |
| [e.g., Azure Key Vault] | `Microsoft.KeyVault.SecretNearExpiry` | [e.g., Azure Function: RotateSecret] | [e.g., Auto-rotate and update dependent services] |
| [ADDITIONAL_SOURCE] | [EVENT_TYPE] | [SUBSCRIBER] | [HANDLER] |

### 5.5 [OPTIONAL] Azure Event Hubs Configuration

| Aspect | Configuration |
|--------|--------------|
| Use Case | [e.g., High-throughput telemetry/event ingestion, streaming analytics] |
| Namespace | [e.g., [PROJECT_NAME]-eh.servicebus.windows.net] |
| SKU / Tier | [e.g., Standard, 2 TUs] |
| Partitions | [e.g., 8] |
| Consumer Groups | [e.g., `analytics-cg`, `archival-cg`] |
| Capture | [e.g., Enabled, Avro format to Azure Blob Storage, 5-minute windows] |

---

## 6. Third-Party Integrations

| # | Service | Purpose | API Version | Protocol | Auth Method | Rate Limits | SLA | Data Exchanged | Fallback Strategy |
|---|---------|---------|-------------|----------|-------------|-------------|-----|----------------|-------------------|
| 1 | [e.g., Stripe] | Payment processing | [e.g., v2023-10-16] | HTTPS (REST) | [e.g., API Key (Bearer)] | [e.g., 100 req/s] | [e.g., 99.99%] | [e.g., Payment intents, refunds, webhooks] | [e.g., Queue payments for retry, show "payment pending" to user] |
| 2 | [e.g., SendGrid] | Transactional email | [e.g., v3] | HTTPS (REST) | [e.g., API Key] | [e.g., 600 req/min] | [e.g., 99.95%] | [e.g., Email templates, recipient data] | [e.g., Queue emails in Service Bus, retry with exponential backoff] |
| 3 | [e.g., Twilio] | SMS notifications | [e.g., 2010-04-01] | HTTPS (REST) | [e.g., Account SID + Auth Token] | [e.g., 100 msg/s] | [e.g., 99.95%] | [e.g., Phone numbers, message body] | [e.g., Failover to secondary SMS provider] |
| 4 | [e.g., Azure Maps] | Geocoding and mapping | [e.g., 2024-04-01-preview] | HTTPS (REST) | [e.g., Subscription Key / Managed Identity] | [e.g., 50 QPS] | [e.g., 99.9%] | [e.g., Addresses, coordinates] | [e.g., Return cached results, degrade gracefully] |
| 5 | [e.g., [LEGACY_ERP]] | Master data sync | [e.g., SOAP 1.2 / Custom REST] | HTTPS / SFTP | [e.g., Client certificate + IP whitelist] | [e.g., 10 req/s] | [e.g., 99.5% (business hours)] | [e.g., Product master, customer master] | [e.g., Use last-known-good cached data, alert ops team] |
| [#] | [SERVICE] | [PURPOSE] | [API_VERSION] | [PROTOCOL] | [AUTH] | [RATE_LIMITS] | [SLA] | [DATA] | [FALLBACK] |

### 6.1 Third-Party Dependency Risk Assessment

| Service | Criticality | Single Point of Failure? | Alternative Provider | Migration Effort | Contract Expiry |
|---------|------------|-------------------------|---------------------|-----------------|-----------------|
| [e.g., Stripe] | Critical | [e.g., Yes for payments] | [e.g., Adyen, Braintree] | [e.g., High (3-6 months)] | [e.g., Annual, auto-renew] |
| [e.g., SendGrid] | High | [e.g., No (queued, retryable)] | [e.g., Mailgun, AWS SES] | [e.g., Low (1-2 weeks)] | [e.g., Monthly] |
| [ADDITIONAL_SERVICE] | [CRITICALITY] | [SPOF] | [ALTERNATIVE] | [MIGRATION_EFFORT] | [CONTRACT] |

---

## 7. Integration Error Handling and Retry Policies

### 7.1 Synchronous Integration Retry Policy

| Integration | Retry Strategy | Max Retries | Initial Delay | Max Delay | Backoff Type | Retryable Errors |
|-------------|---------------|-------------|---------------|-----------|-------------|------------------|
| [API_GATEWAY] -> [SERVICE_A] | Exponential backoff + jitter | 3 | 500ms | 10s | Exponential | 408, 429, 500, 502, 503, 504 |
| [SERVICE_B] -> [PAYMENT_PROVIDER] | Exponential backoff + jitter | 3 | 1s | 30s | Exponential | 408, 429, 500, 502, 503, 504 |
| [SERVICE_C] -> [EMAIL_PROVIDER] | Fixed interval | 5 | 2s | 2s | None (fixed) | 429, 500, 502, 503 |
| [SERVICE_A] -> [LEGACY_SYSTEM] | Exponential backoff | 2 | 2s | 15s | Exponential | 408, 500, 502, 503, 504 |
| [ADDITIONAL_INTEGRATION] | [STRATEGY] | [MAX] | [INITIAL] | [MAX_DELAY] | [BACKOFF] | [RETRYABLE] |

### 7.2 Asynchronous Integration Retry Policy

| Queue / Topic | Max Delivery Count | Delay Between Retries | Dead-Letter On | DLQ Monitoring | Remediation |
|--------------|-------------------|----------------------|----------------|----------------|-------------|
| `user-events` | 10 | [e.g., Service Bus native retry (exponential)] | Max delivery exceeded, TTL expired | [e.g., Alert on DLQ depth > 0] | [e.g., Manual review + replay tool] |
| `order-events` | 10 | [e.g., Service Bus native retry] | Max delivery exceeded, TTL expired | [e.g., Alert on DLQ depth > 0] | [e.g., Manual review + replay tool] |
| `report-generation` | 3 | [e.g., Scheduled retry at 1min, 5min, 15min] | Max delivery exceeded | [e.g., Alert + admin dashboard] | [e.g., Manual re-trigger via admin UI] |
| [ADDITIONAL_QUEUE] | [MAX_DELIVERY] | [DELAY] | [DLQ_CONDITION] | [MONITORING] | [REMEDIATION] |

### 7.3 Timeout Configuration

| Integration | Connection Timeout | Request Timeout | Justification |
|-------------|-------------------|-----------------|---------------|
| [API_GATEWAY] -> Backend services | [e.g., 5s] | [e.g., 30s] | [e.g., Standard API call duration] |
| [SERVICE_B] -> [PAYMENT_PROVIDER] | [e.g., 5s] | [e.g., 60s] | [e.g., Payment processing may take longer] |
| [SERVICE_C] -> [EMAIL_PROVIDER] | [e.g., 5s] | [e.g., 15s] | [e.g., Email send is quick, fire and confirm] |
| Database connections | [e.g., 15s] | [e.g., 30s] | [e.g., Accounts for connection pool exhaustion scenarios] |
| Redis cache | [e.g., 3s] | [e.g., 5s] | [e.g., Cache should be fast; timeout and fallback to DB on failure] |
| [ADDITIONAL_INTEGRATION] | [CONN_TIMEOUT] | [REQ_TIMEOUT] | [JUSTIFICATION] |

---

## 8. Circuit Breaker Patterns

### 8.1 Circuit Breaker Configuration

| Integration | Library / Mechanism | Failure Threshold | Success Threshold | Break Duration | Fallback Behavior |
|-------------|--------------------|--------------------|-------------------|----------------|-------------------|
| [SERVICE_B] -> [PAYMENT_PROVIDER] | [e.g., Polly (.NET) / resilience4j] | [e.g., 5 failures in 30s window] | [e.g., 3 consecutive successes] | [e.g., 60s] | [e.g., Return "payment_pending" status, queue for retry] |
| [SERVICE_C] -> [EMAIL_PROVIDER] | [e.g., Polly (.NET)] | [e.g., 10 failures in 60s window] | [e.g., 2 consecutive successes] | [e.g., 30s] | [e.g., Queue message to DLQ, alert ops] |
| [SERVICE_A] -> [LEGACY_SYSTEM] | [e.g., Polly (.NET)] | [e.g., 3 failures in 60s window] | [e.g., 2 consecutive successes] | [e.g., 120s] | [e.g., Return cached/stale data, log degradation] |
| [API_GATEWAY] -> Backend | [e.g., APIM backend circuit breaker policy] | [e.g., 5 consecutive 5xx] | [e.g., Automatic after break duration] | [e.g., 30s] | [e.g., Return 503 with Retry-After header] |
| [ADDITIONAL_INTEGRATION] | [LIBRARY] | [FAILURE_THRESHOLD] | [SUCCESS_THRESHOLD] | [BREAK_DURATION] | [FALLBACK] |

### 8.2 Circuit Breaker States

```
[Closed] --(failure threshold exceeded)--> [Open] --(break duration elapsed)--> [Half-Open]
   ^                                                                                 |
   |---- (success threshold met in half-open) <------ [test request succeeds] -------|
   |                                                                                 |
   |                                          [Open] <-- (test request fails) -------|
```

### 8.3 Bulkhead Pattern

| Resource Pool | Max Concurrent | Queue Depth | Purpose |
|--------------|---------------|-------------|---------|
| [e.g., Payment API calls] | [e.g., 20 concurrent] | [e.g., 50 queued] | [e.g., Prevent payment service issues from exhausting thread pool] |
| [e.g., Legacy system calls] | [e.g., 5 concurrent] | [e.g., 10 queued] | [e.g., Legacy system cannot handle high concurrency] |
| [e.g., Database connections] | [e.g., 100 per service instance] | N/A (connection pool) | [e.g., Prevent connection exhaustion] |
| [ADDITIONAL_POOL] | [MAX_CONCURRENT] | [QUEUE_DEPTH] | [PURPOSE] |

---

## 9. Integration Testing Approach

### 9.1 Testing Strategy

| Test Level | Scope | Tools | Environment | Frequency |
|-----------|-------|-------|-------------|-----------|
| Unit Tests (Mocked) | Individual service integration logic | [e.g., xUnit + Moq (.NET), Jest + nock (Node.js)] | Local / CI | Every PR |
| Contract Tests | API contract verification between producer/consumer | [e.g., Pact / Specmatic] | CI | Every PR |
| Integration Tests | Service + real dependencies (DB, cache, message broker) | [e.g., Testcontainers, Docker Compose] | CI (GitHub Actions) | Every PR |
| Component Tests | Single service end-to-end with stubbed external deps | [e.g., WireMock for HTTP, Testcontainers for infra] | CI | Every PR |
| End-to-End Tests | Full integration across services | [e.g., Playwright + custom test harness] | Staging environment | Nightly / pre-release |
| Smoke Tests | Critical path verification post-deploy | [e.g., Custom health check + smoke test suite] | All environments | Every deployment |

### 9.2 Test Environment Configuration

| Dependency | Test Strategy | Tool / Approach |
|-----------|--------------|-----------------|
| Azure Service Bus | [e.g., Real Service Bus namespace (dedicated test namespace)] | [e.g., Separate namespace: [PROJECT]-sb-test] |
| Azure PostgreSQL | [e.g., Testcontainers (PostgreSQL container in CI)] | [e.g., Testcontainers library] |
| Redis | [e.g., Testcontainers (Redis container in CI)] | [e.g., Testcontainers library] |
| External APIs (Payment, Email) | [e.g., WireMock stubs in CI, sandbox environments in staging] | [e.g., WireMock / provider sandbox] |
| [LEGACY_SYSTEM] | [e.g., Mock server with recorded responses] | [e.g., WireMock + recorded fixtures] |
| [ADDITIONAL_DEPENDENCY] | [STRATEGY] | [TOOL] |

### 9.3 Contract Testing Details

| Consumer | Provider | Contract Location | Verification Trigger |
|---------|---------|-------------------|---------------------|
| [WEB_FRONTEND] | [SERVICE_A] | [e.g., Pact Broker at [URL] / GitHub repo] | [e.g., Provider CI pipeline runs contract verification on every PR] |
| [SERVICE_B] | [SERVICE_A] | [e.g., Pact Broker at [URL]] | [e.g., Provider CI pipeline runs contract verification] |
| [SERVICE_B] | [PAYMENT_PROVIDER] | [e.g., Specmatic spec in repo] | [e.g., Stub server verified against latest OpenAPI spec] |
| [ADDITIONAL_CONSUMER] | [PROVIDER] | [CONTRACT_LOCATION] | [TRIGGER] |

---

## 10. Integration Monitoring and Observability

### 10.1 Integration Health Dashboard

| Metric | Source | Threshold (Warning) | Threshold (Critical) | Alert Channel |
|--------|--------|--------------------|-----------------------|---------------|
| API Gateway error rate (5xx) | Azure APIM Analytics | [e.g., > 1%] | [e.g., > 5%] | [e.g., PagerDuty + Teams] |
| API Gateway latency (P95) | Azure APIM Analytics | [e.g., > 1s] | [e.g., > 3s] | [e.g., PagerDuty + Teams] |
| Service Bus DLQ depth | Azure Service Bus Metrics | [e.g., > 0] | [e.g., > 100] | [e.g., Teams + Email] |
| Service Bus active messages | Azure Service Bus Metrics | [e.g., > 10,000] | [e.g., > 50,000] | [e.g., PagerDuty + Teams] |
| Circuit breaker state = Open | Application Insights custom metric | N/A | Open state | [e.g., PagerDuty + Teams] |
| Third-party API error rate | Application Insights dependency tracking | [e.g., > 5%] | [e.g., > 15%] | [e.g., Teams + Email] |
| Integration test failures | GitHub Actions | Any failure | N/A | [e.g., Teams + PR comment] |
| [ADDITIONAL_METRIC] | [SOURCE] | [WARNING] | [CRITICAL] | [ALERT] |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | [YYYY-MM-DD] | [AUTHOR] | Initial draft |
| [VERSION] | [YYYY-MM-DD] | [AUTHOR] | [CHANGES] |
