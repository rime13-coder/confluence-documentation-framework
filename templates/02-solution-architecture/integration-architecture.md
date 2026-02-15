# Integration Architecture

| **Metadata**     | **Value**                                      |
|------------------|------------------------------------------------|
| Page Title       | CMMC Assessor Platform - Integration Architecture |
| Last Updated     | 2026-02-15                                     |
| Status           | `DRAFT`                                        |
| Owner            | Solution Architect                             |
| Reviewers        | Technical Lead, Security Architect, Engineering Manager |
| Version          | 0.1                                            |
| Related HLD      | CMMC Assessor Platform - Architecture Overview (HLD) |

---

## 1. Document Purpose

This document defines the integration architecture for the **CMMC Assessor Platform**. It describes how the frontend and backend communicate, how the backend integrates with external Microsoft services (Entra ID, Graph API), and how DNS is managed. This platform uses a synchronous REST API architecture with no message broker or event bus. All integrations are HTTP-based and request-response oriented.

---

## 2. Integration Landscape Diagram

<!-- Diagrams embedded on Confluence page: 07-integration-landscape.png, 04-auth-login-sequence.png, 13-graph-api-token-refresh.png -->
<!--
    Shows:
    - cmmc-web (Browser SPA) -> cmmc-api (HTTPS REST, JWT auth)
    - cmmc-web (Browser) -> Microsoft Entra ID (OAuth redirect)
    - cmmc-api -> Microsoft Entra ID (HTTPS, MSAL token exchange)
    - cmmc-api -> Microsoft Graph API (HTTPS REST, Bearer token, SharePoint operations)
    - cmmc-api -> PostgreSQL (TCP, Prisma ORM)
    - cmmc-api -> Azure Blob Storage (HTTPS REST)
    - cmmc-api -> Azure Key Vault (HTTPS, startup secrets)
    - GoDaddy DNS -> Azure Container Apps (CNAME records)
    - All in Canada Central except Entra ID (global) and Graph API (tenant's M365 geography)
-->

---

## 3. Integration Inventory

### 3.1 Internal Service Integrations

| # | Source | Target | Protocol | Pattern | Auth Method | Data Format | SLA (Availability) | SLA (Latency P95) |
|---|--------|--------|----------|---------|-------------|-------------|--------------------|--------------------|
| 1 | cmmc-web (Browser) | cmmc-api | HTTPS (REST) | Synchronous | Bearer JWT (custom JWT issued by cmmc-api after Entra ID or legacy auth) | JSON | 99.5% (Container Apps SLA) | < 500ms |
| 2 | cmmc-api | PostgreSQL (psql-cmmc-assessor-prod) | TCP (PostgreSQL wire protocol, SSL) | Synchronous | Connection string with username/password (from Key Vault) | SQL (via Prisma ORM) | 99.9% (Azure PostgreSQL Flexible Server SLA) | < 50ms |
| 3 | cmmc-api | Azure Blob Storage (stcmmcassessorprod) | HTTPS (REST) | Synchronous | Storage account key or SAS token (from Key Vault) | Binary (file content) | 99.9% (Azure Storage SLA) | < 200ms |
| 4 | cmmc-api | Azure Key Vault (kv-cmmc-assessor-prod) | HTTPS (REST) | Synchronous (startup + on-demand) | Managed Identity or secret reference from Container Apps | JSON | 99.99% (Key Vault SLA) | < 100ms |
| 5 | Container Apps | Log Analytics (log-cmmc-assessor-prod) | Platform-managed | Asynchronous (log streaming) | Platform-managed (no application auth) | Structured logs | 99.9% (Log Analytics SLA) | N/A (async) |

### 3.2 External System Integrations

| # | Direction | Source | Target | Protocol | Pattern | Auth Method | Data Format | SLA (Availability) | SLA (Latency P95) |
|---|-----------|--------|--------|----------|---------|-------------|-------------|--------------------|--------------------|
| 1 | Outbound (redirect) | cmmc-web (Browser) | Microsoft Entra ID | HTTPS (OAuth 2.0 redirect) | Synchronous (browser redirect) | N/A (public OAuth endpoint) | HTTP redirect with authorization code | 99.99% (Entra ID SLA) | < 2s (including user login UI) |
| 2 | Outbound | cmmc-api | Microsoft Entra ID (Token endpoint) | HTTPS (REST) | Synchronous | MSAL confidential client (client_id + client_secret) | JSON (OAuth token response) | 99.99% (Entra ID SLA) | < 500ms |
| 3 | Outbound | cmmc-api | Microsoft Graph API (SharePoint) | HTTPS (REST) | Synchronous | Bearer token (delegated or application Graph API token) | JSON (metadata) + Binary (file content) | 99.9% (Graph API SLA) | < 2s (varies by file size) |
| 4 | Configuration | GoDaddy DNS | Azure Container Apps | DNS (CNAME) | Static configuration | N/A | DNS records | N/A | N/A |

---

## 4. API Gateway Configuration

The CMMC Assessor Platform does **not** use Azure API Management or a dedicated API gateway. The cmmc-api Container App serves as both the API and its own ingress handler.

### 4.1 Ingress Configuration

| Aspect | Configuration |
|--------|--------------|
| Ingress Type | Azure Container Apps built-in ingress (HTTP) |
| Custom Domain | Configured via Container Apps custom domain binding with CNAME from GoDaddy |
| TLS | Azure-managed TLS certificate (free, auto-renewed) |
| Target Port | 3000 (Express server) |
| Transport | HTTP (TLS terminated at Container Apps ingress) |
| Traffic Splitting | Single Active Revision mode (100% to latest revision) |

### 4.2 Rate Limiting

| Aspect | Configuration |
|--------|--------------|
| Rate Limiter | express-rate-limit middleware (application-level, not infrastructure-level) |
| Window | 15 minutes (configurable via RATE_LIMIT_WINDOW_MS) |
| Max Requests | 100 per window per IP (configurable via RATE_LIMIT_MAX_REQUESTS) |
| Response on Limit | HTTP 429 with JSON `{ "message": "Too many requests" }` |
| Scope | Per-IP address |
| Exclusions | None currently; health check endpoints may be excluded in future |

### 4.3 CORS Configuration

| Aspect | Configuration |
|--------|--------------|
| Allowed Origins | FRONTEND_URL environment variable (e.g., https://app.cmmc-assessor.com) |
| Allowed Methods | GET, POST, PUT, PATCH, DELETE, OPTIONS |
| Allowed Headers | Content-Type, Authorization, Cookie |
| Credentials | true (for cookie-based refresh tokens) |
| Max Age | 86400 seconds (24 hours preflight cache) |

### 4.4 API Versioning Strategy

| Aspect | Approach |
|--------|----------|
| Versioning Method | Not currently versioned; all endpoints under /api/ prefix |
| Deprecation Policy | Not yet established; will be defined when API versioning is introduced |
| Rationale | MVP phase with single consumer (cmmc-web SPA); versioning complexity deferred until external API consumers exist |

---

## 5. Message Broker and Event Bus Design

This application does **not** use a message broker or event bus. All communication is synchronous HTTP REST.

### 5.1 Rationale for No Message Broker

| Factor | Assessment |
|--------|-----------|
| Traffic Volume | < 50 concurrent users; all operations are user-initiated HTTP requests |
| Complexity Budget | Small team (1-3 developers); message broker adds operational complexity with limited benefit at MVP scale |
| Async Requirements | No current requirements for background processing, event-driven workflows, or inter-service communication |
| Future Consideration | If background processing is needed (e.g., scheduled report generation, email notifications, large evidence file processing), Azure Service Bus or Azure Functions can be added incrementally without architectural overhaul |

### 5.2 Synchronous Patterns Used Instead

| Pattern | Where Applied | Description |
|---------|---------------|-------------|
| Request-Response REST | All 68+ API endpoints | Client sends HTTP request, waits for response; Express middleware pipeline handles auth, validation, business logic, and response |
| Database Transactions | Assessment mutations + Audit Log writes | Prisma transactions ensure atomicity: entity mutation and AuditLog entry are written in the same transaction |
| Inline Document Generation | SSP DOCX, Excel, PDF export | Documents generated synchronously on request; response streamed back to client; acceptable for current document sizes |
| Inline Graph API Calls | Evidence upload/download | Evidence operations call Graph API synchronously and return result to client; file sizes typically < 50MB |

---

## 6. Third-Party Integrations

### 6.1 Microsoft Entra ID (Authentication)

| Aspect | Detail |
|--------|--------|
| Service | Microsoft Entra ID (formerly Azure Active Directory) |
| Purpose | Primary authentication via OAuth 2.0 / OpenID Connect; tenant onboarding via admin consent flow |
| API Version | Microsoft identity platform v2.0 |
| Protocol | HTTPS (OAuth 2.0 / OIDC) |
| Auth Method | MSAL confidential client (@azure/msal-node 2.15); client_id + client_secret |
| Client Library | @azure/msal-node 2.15.0 |
| Rate Limits | Subject to Microsoft identity platform throttling (not typically hit at MVP scale) |
| SLA | 99.99% (Microsoft Entra ID SLA) |
| Data Exchanged | Authorization codes, access tokens, ID tokens, refresh tokens, user profile claims (name, email, oid, tid) |
| Fallback Strategy | Legacy username/password authentication available as fallback if Entra ID is unavailable or tenant cannot use Entra ID |

#### 6.1.1 Entra ID Authentication Flows

**Standard Login Flow:**
```
1. User clicks "Sign in with Microsoft" in cmmc-web
2. Browser redirects to: GET /api/auth/login
3. cmmc-api generates PKCE code verifier/challenge
4. cmmc-api redirects browser to Entra ID authorization endpoint:
   https://login.microsoftonline.com/common/oauth2/v2.0/authorize
   ?client_id={AZURE_CLIENT_ID}
   &response_type=code
   &redirect_uri={AZURE_REDIRECT_URI}
   &scope=openid profile email User.Read
   &code_challenge={challenge}
   &code_challenge_method=S256
   &state={csrf_token}
5. User authenticates with Entra ID (MFA if tenant policy requires)
6. Entra ID redirects to: GET /api/auth/callback?code={auth_code}&state={csrf_token}
7. cmmc-api exchanges authorization code for tokens via MSAL:
   POST https://login.microsoftonline.com/common/oauth2/v2.0/token
8. cmmc-api validates ID token, extracts user claims (oid, email, name, tid)
9. cmmc-api creates/updates User record; resolves tenant from Entra ID tid
10. cmmc-api issues custom JWT (access token) and RefreshToken (stored in DB)
11. Browser receives JWT in response; stores in memory/cookie
```

**Admin Consent Flow (Tenant Onboarding):**
```
1. Tenant admin clicks "Set up organization" in cmmc-web
2. Browser redirects to: GET /api/auth/consent
3. cmmc-api redirects to Entra ID admin consent endpoint:
   https://login.microsoftonline.com/common/adminconsent
   ?client_id={AZURE_CLIENT_ID}
   &redirect_uri={AZURE_REDIRECT_URI}
   &state={tenant_setup_state}
4. Entra ID shows admin consent prompt listing all requested permissions
5. Tenant admin grants consent for their Entra ID tenant
6. Entra ID redirects back to callback with admin_consent=true
7. cmmc-api creates Tenant record with entraIdTenantId from the consent response
8. All users from that Entra ID tenant can now authenticate
```

**Incremental Consent (SharePoint / Graph API):**
```
1. User attempts to use evidence management features
2. cmmc-api detects missing Graph API permissions for SharePoint
3. Browser redirects to: GET /api/auth/sharepoint-consent
4. cmmc-api redirects to Entra ID with additional scopes:
   &scope=openid profile email Sites.ReadWrite.All Files.ReadWrite.All
5. User consents to SharePoint permissions
6. cmmc-api receives Graph API tokens with SharePoint scope
7. Graph API tokens encrypted (AES-256-GCM) and stored in UserToken table
```

#### 6.1.2 Token Management

| Token Type | Storage | Expiry | Rotation | Security |
|-----------|---------|--------|----------|----------|
| Entra ID Access Token | Used transiently in backend (not stored raw) | ~1 hour (Entra ID default) | Automatic via MSAL token cache | Used only for initial user validation; not stored after JWT issuance |
| Entra ID ID Token | Used transiently for claims extraction | ~1 hour | N/A (one-time use for claims) | Claims extracted and discarded |
| Custom JWT (Platform Access Token) | Client-side (memory or httpOnly cookie) | 7 days (configurable via JWT_EXPIRY) | Refresh token rotation | Verified on every API request; deny list checked for revocation |
| Refresh Token | PostgreSQL (RefreshToken table) | 30 days | Family-based rotation: each use issues new refresh token; reuse of old token revokes entire family | Family tracking detects token theft |
| Graph API Access Token | PostgreSQL (UserToken table, AES-256-GCM encrypted) | ~1 hour | Automatic refresh via MSAL when expired | Application-layer encryption before storage; decrypted only for Graph API calls |
| Graph API Refresh Token | PostgreSQL (UserToken table, AES-256-GCM encrypted) | 90 days (Microsoft default) | Used to obtain new Graph API access tokens | Same encryption as access token |

### 6.2 Microsoft Graph API (SharePoint Evidence Management)

| Aspect | Detail |
|--------|--------|
| Service | Microsoft Graph API v1.0 |
| Purpose | Evidence file management: list, upload, download, preview, delete files in tenant's SharePoint document library |
| Base URL | https://graph.microsoft.com/v1.0 |
| Protocol | HTTPS (REST) |
| Auth Method | Bearer token (delegated Graph API token stored encrypted in UserToken table) |
| Client Library | Direct Axios HTTP calls to Graph API endpoints (no SDK) |
| Rate Limits | Graph API throttling: 10,000 requests per 10 minutes per app per tenant (Microsoft-imposed) |
| SLA | 99.9% (Microsoft Graph API SLA) |
| Data Exchanged | SharePoint file metadata (JSON), file content (binary upload/download), folder listings |
| Fallback Strategy | Return error to client with guidance to retry; evidence management is not on the critical path for assessment scoring |

#### 6.2.1 Graph API Endpoints Used

| Operation | Graph API Endpoint | HTTP Method | Purpose |
|-----------|-------------------|-------------|---------|
| Check auth status | N/A (checks UserToken table) | N/A | Verify user has valid Graph API tokens with SharePoint scope |
| List files | /sites/{siteId}/drive/root/children | GET | List evidence files in tenant's SharePoint document library root |
| List files in folder | /sites/{siteId}/drive/items/{folderId}/children | GET | List evidence files in a specific folder |
| Upload file (< 4MB) | /sites/{siteId}/drive/root:/{fileName}:/content | PUT | Upload small evidence file directly |
| Upload file (> 4MB) | /sites/{siteId}/drive/root:/{fileName}:/createUploadSession | POST + PUT chunks | Resumable upload for larger evidence files |
| Download file | /sites/{siteId}/drive/items/{itemId}/content | GET | Download evidence file content |
| Preview file | /sites/{siteId}/drive/items/{itemId}/preview | POST | Generate preview URL for viewing evidence file in browser |
| Delete file | /sites/{siteId}/drive/items/{itemId} | DELETE | Delete evidence file from SharePoint |
| Get site | /sites/{hostname}:/{sitePath} | GET | Resolve SharePoint site by URL for tenant configuration validation |

#### 6.2.2 Graph API Token Refresh Flow

```
1. cmmc-api receives evidence operation request from client
2. cmmc-api retrieves UserToken from database
3. cmmc-api decrypts access token using AES-256-GCM (TOKEN_ENCRYPTION_KEY)
4. If token expiry < now:
   a. Decrypt refresh token
   b. Call MSAL acquireTokenByRefreshToken() to get new access token
   c. Encrypt new access token (and new refresh token if provided) with AES-256-GCM
   d. Update UserToken record in database
5. Make Graph API call with valid access token
6. If Graph API returns 401:
   a. Attempt refresh (step 4)
   b. If refresh fails (e.g., refresh token expired or revoked):
      - Delete UserToken record
      - Return 401 to client with message: "SharePoint authorization expired. Please re-authorize."
      - Client redirects user to incremental consent flow
```

#### 6.2.3 Graph API Error Handling

| Error Code | Meaning | Handling Strategy | Client Response |
|-----------|---------|-------------------|-----------------|
| 400 | Bad request (malformed query) | Log error; do not retry | HTTP 400 with descriptive message |
| 401 | Token expired or invalid | Attempt token refresh via MSAL; if refresh fails, prompt re-consent | HTTP 401 with re-authorization guidance |
| 403 | Insufficient permissions | Cannot auto-fix; user must re-consent with correct scopes | HTTP 403 with message to contact admin or re-consent |
| 404 | Site or file not found | Return 404 | HTTP 404 with message to verify SharePoint site URL |
| 409 | Conflict (e.g., file name collision) | Return conflict to client | HTTP 409 with message about duplicate file name |
| 429 | Throttled (too many requests) | Read Retry-After header; wait and retry once; if still throttled, return error | HTTP 503 with Retry-After header |
| 500 | Graph API internal error | Log error; retry once after 2s delay; if still failing, return error | HTTP 502 with message "SharePoint service temporarily unavailable" |
| 502/503/504 | Gateway/service unavailable | Retry once after 2s delay | HTTP 502 with retry guidance |
| Network timeout | Connection or read timeout | Retry once after 2s delay | HTTP 504 with timeout message |

### 6.3 GoDaddy DNS

| Aspect | Detail |
|--------|--------|
| Service | GoDaddy DNS Management |
| Purpose | DNS configuration for custom domains pointing to Azure Container Apps |
| Protocol | DNS (CNAME records) |
| Auth Method | N/A (manual DNS configuration via GoDaddy admin console) |
| Integration Type | Static configuration (not API-integrated) |
| Data Exchanged | CNAME records mapping custom domains to Container Apps FQDN |

#### 6.3.1 DNS Records

| Record Type | Host | Value | TTL | Purpose |
|------------|------|-------|-----|---------|
| CNAME | api.cmmc-assessor.com (example) | cmmc-api.{region}.azurecontainerapps.io | 3600 | Route API traffic to backend Container App |
| CNAME | app.cmmc-assessor.com (example) | cmmc-web.{region}.azurecontainerapps.io | 3600 | Route web traffic to frontend Container App |
| TXT | asuid.api.cmmc-assessor.com (example) | {Container Apps custom domain verification ID} | 3600 | Domain ownership verification for Azure Container Apps |
| TXT | asuid.app.cmmc-assessor.com (example) | {Container Apps custom domain verification ID} | 3600 | Domain ownership verification for Azure Container Apps |

### 6.4 Third-Party Dependency Risk Assessment

| Service | Criticality | Single Point of Failure? | Alternative Provider | Migration Effort | Contract |
|---------|------------|-------------------------|---------------------|-----------------|----------|
| Microsoft Entra ID | Critical (primary auth) | Yes for Entra ID auth; legacy auth is fallback | No practical alternative for enterprise SSO | N/A (deeply integrated) | Microsoft Azure subscription |
| Microsoft Graph API (SharePoint) | High (evidence management) | No (evidence management is optional/supplementary to core assessment functionality) | Azure Blob Storage as alternative evidence store | Medium (2-4 weeks) | Microsoft Azure subscription |
| GoDaddy DNS | Low (static config) | No (DNS can be migrated to any provider) | Azure DNS, Cloudflare, Route 53 | Low (< 1 day) | Annual domain registration |
| Azure Container Apps | Critical (hosting) | Yes (application hosting) | Azure App Service, AKS | Medium (2-4 weeks) | Microsoft Azure subscription |
| Azure PostgreSQL | Critical (data store) | Yes (all application data) | Self-managed PostgreSQL, Azure SQL, CockroachDB | High (4-8 weeks) | Microsoft Azure subscription |

---

## 7. Integration Error Handling and Retry Policies

### 7.1 Synchronous Integration Retry Policy

| Integration | Retry Strategy | Max Retries | Initial Delay | Max Delay | Backoff Type | Retryable Errors |
|-------------|---------------|-------------|---------------|-----------|-------------|------------------|
| cmmc-api -> Microsoft Entra ID (token exchange) | No retry (redirect-based flow) | 0 | N/A | N/A | N/A | N/A (user re-initiates login on failure) |
| cmmc-api -> Microsoft Entra ID (token refresh via MSAL) | MSAL built-in retry | 1 (MSAL default) | Immediate | N/A | N/A | 5xx, network errors |
| cmmc-api -> Microsoft Graph API | Application-level retry | 1 | 2s (or Retry-After header value for 429) | 30s | Fixed | 429, 500, 502, 503, 504, network timeout |
| cmmc-api -> PostgreSQL (Prisma) | Prisma connection pool retry | Prisma default (connection pool) | Prisma default | N/A | N/A | Connection pool exhaustion, transient network errors |
| cmmc-api -> Azure Key Vault | No explicit retry (startup) | 0 | N/A | N/A | N/A | Application fails to start if Key Vault unreachable |
| cmmc-api -> Azure Blob Storage | No explicit retry currently | 0 | N/A | N/A | N/A | Error returned to client |

### 7.2 Timeout Configuration

| Integration | Connection Timeout | Request Timeout | Justification |
|-------------|-------------------|-----------------|---------------|
| cmmc-api -> Microsoft Entra ID (MSAL) | MSAL default (varies) | MSAL default (~30s) | Token exchange should be fast; longer timeout indicates infrastructure issue |
| cmmc-api -> Microsoft Graph API (Axios) | 10s | 60s (file operations may be large) | File uploads/downloads can take time for larger evidence files |
| cmmc-api -> Microsoft Graph API (metadata) | 10s | 15s | Metadata operations (list, delete, preview) should be fast |
| cmmc-api -> PostgreSQL (Prisma) | Prisma default (5s connection, 10s pool timeout) | 30s (query timeout via Prisma) | Most queries return in < 100ms; 30s timeout catches runaway queries |
| cmmc-api -> Azure Blob Storage | 10s | 60s | File operations may involve larger files |
| cmmc-api -> Azure Key Vault | 10s | 10s | Secret retrieval is fast; timeout indicates Key Vault issues |

---

## 8. Circuit Breaker Patterns

The application does **not** currently implement circuit breaker patterns. This is identified as a gap and is planned for future implementation as part of the resilience improvement roadmap.

### 8.1 Current State

| Integration | Circuit Breaker | Justification |
|-------------|----------------|---------------|
| cmmc-api -> Microsoft Graph API | Not implemented | Graph API failures are isolated to evidence management features; they do not cascade to core assessment functionality; client receives error and can retry manually |
| cmmc-api -> Microsoft Entra ID | Not applicable | Auth failures naturally circuit-break at the user level (user sees login error); MSAL handles transient failures internally |
| cmmc-api -> PostgreSQL | Not applicable | Database failures are catastrophic (application cannot function); circuit breaker would not improve the situation |

### 8.2 Planned Improvements

| Integration | Planned Implementation | Trigger |
|-------------|----------------------|---------|
| cmmc-api -> Microsoft Graph API | Application-level circuit breaker: track consecutive failures per tenant; after 5 consecutive failures in 60s, return "SharePoint temporarily unavailable" for 30s without making Graph API calls | Included in Phase 3 of security remediation (months 4-5) |

---

## 9. Integration Testing Approach

### 9.1 Testing Strategy

| Test Level | Scope | Tools | Environment | Frequency |
|-----------|-------|-------|-------------|-----------|
| Manual API Testing | Individual endpoint testing | Postman, curl | Local development | During development |
| Integration Tests (planned) | Backend + PostgreSQL | Jest + Prisma test utilities + Docker Compose | Local / CI (planned) | Per PR (planned) |
| Entra ID Integration Testing | OAuth flow end-to-end | Manual browser testing | Development Entra ID app registration | Before deployment to production |
| Graph API Integration Testing | SharePoint evidence operations | Manual testing with test SharePoint site | Development M365 tenant | Before deployment to production |
| Smoke Tests (planned) | Critical path verification post-deploy | Custom health check script | Production | Per deployment (planned) |

**Note:** Comprehensive automated integration testing is not yet implemented. This is identified as a gap and is planned for the security remediation phase. Current testing relies on manual testing with Postman and browser-based OAuth flow verification.

### 9.2 Test Environment Configuration

| Dependency | Test Strategy | Tool / Approach |
|-----------|--------------|-----------------|
| PostgreSQL | Local PostgreSQL via Docker Compose; Prisma migrate for schema setup | Docker Compose + Prisma |
| Microsoft Entra ID | Separate development app registration in Entra ID; test tenant | Development Entra ID tenant with test users |
| Microsoft Graph API / SharePoint | Separate test SharePoint site in development M365 tenant | Manual testing with development SharePoint site |
| Azure Blob Storage | Local filesystem or Azurite emulator (planned) | Azurite (planned) |
| Azure Key Vault | Local .env file with same variable names | .env file (gitignored) |

---

## 10. Integration Monitoring and Observability

### 10.1 Integration Health Monitoring

| Metric | Source | Threshold (Warning) | Threshold (Critical) | Alert Channel |
|--------|--------|--------------------|-----------------------|---------------|
| API error rate (5xx responses) | Container Apps system logs / Log Analytics | > 1% of requests | > 5% of requests | Azure Monitor Alerts (planned) |
| API response latency (P95) | Container Apps metrics | > 1s | > 3s | Azure Monitor Alerts (planned) |
| Graph API error rate | Application logs (structured log of Graph API call failures) | > 10% of Graph API calls | > 25% of Graph API calls | Application logging (manual review currently) |
| Entra ID auth failure rate | Application logs (structured log of auth failures) | > 5% of auth attempts | > 15% of auth attempts | Application logging (manual review currently) |
| Database connection pool exhaustion | Prisma connection pool metrics (if exposed) | Pool utilization > 80% | Pool utilization > 95% or connection timeouts | Not yet monitored |
| Container Apps replica count | Container Apps metrics | Sustained at max (3 replicas) | N/A | Indicates potential scaling need |

**Note:** Alerting is not yet configured. Integration monitoring currently relies on manual review of Log Analytics queries. Azure Monitor Alerts configuration is planned as part of the operational maturity roadmap.

### 10.2 Key Log Analytics Queries (KQL)

```kql
// Graph API error summary (last 24 hours)
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(24h)
| where Log_s contains "Graph API" and Log_s contains "error"
| summarize ErrorCount=count() by bin(TimeGenerated, 1h)
| order by TimeGenerated desc

// Authentication failure summary (last 24 hours)
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(24h)
| where Log_s contains "auth" and (Log_s contains "failed" or Log_s contains "401")
| summarize FailureCount=count() by bin(TimeGenerated, 1h)
| order by TimeGenerated desc

// API response time distribution (last 1 hour)
ContainerAppConsoleLogs_CL
| where TimeGenerated > ago(1h)
| where Log_s contains "response_time"
| extend ResponseTime = extract("response_time=([0-9]+)", 1, Log_s)
| summarize P50=percentile(toint(ResponseTime), 50),
            P95=percentile(toint(ResponseTime), 95),
            P99=percentile(toint(ResponseTime), 99)
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-14 | Solution Architect | Initial draft |
