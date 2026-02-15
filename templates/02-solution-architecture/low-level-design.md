# Low-Level Design (LLD)

| **Metadata**     | **Value**                                      |
|------------------|------------------------------------------------|
| Page Title       | CMMC Assessor Platform - Low-Level Design (LLD) |
| Last Updated     | 2026-02-15                                     |
| Status           | `DRAFT`                                        |
| Owner            | Solution Architect                             |
| Reviewers        | Technical Lead, Security Architect, Engineering Manager |
| Version          | 0.1                                            |
| Related HLD      | CMMC Assessor Platform - Architecture Overview (HLD) |

---

## 1. Document Purpose

This document provides the detailed low-level design for the **CMMC Assessor Platform**. It describes the internal structure of each component, API contracts, database schemas, error handling strategies, caching approach, and coding conventions. This document is intended for the development team and serves as the bridge between high-level architecture decisions and implementation.

---

## 2. Component Diagram (C4 Level 3)

<!-- Diagram: 03-backend-components.png — embedded on Confluence page as attachment -->
<!--
    C4 Level 3 - Component Diagram
    Backend (cmmc-api) internals:
    - Routes layer (Express Router)
    - Middleware layer (auth, tenant isolation, validation, error handling)
    - Controller layer (request/response handling)
    - Service layer (business logic)
    - Prisma ORM layer (data access, tenant scoping)
    - Integration layer (MSAL, Graph API, document generation)

    Frontend (cmmc-web) internals:
    - Pages/Views (React Router routes)
    - Components (shared UI components)
    - Hooks (TanStack React Query hooks)
    - Services (Axios API client)
    - Context (auth, tenant context providers)
-->

---

## 3. Detailed Component Breakdown

### 3.1 Component Inventory

| Component | Responsibility | Technology | Hosting | Repository | Owner |
|-----------|---------------|------------|---------|------------|-------|
| cmmc-web (Frontend SPA) | Assessor-facing UI: dashboards, assessment workflows, SPRS scoring, policy management, SSP generation, evidence upload, team management | React 18.3, TypeScript 5.6, Vite 5.4, Tailwind CSS 3.4, TanStack React Query 5.59, Recharts 2.13, React Router 6.27 | Azure Container Apps (cmmc-web, Nginx) | Monorepo /frontend | Development Team |
| cmmc-api (Backend API) | RESTful API: authentication flows, tenant management, CRUD for assessments/controls/objectives, SPRS scoring calculations, POA&M management, policy management, SSP DOCX generation, evidence management via Graph API | Node.js 20, Express 4.21, TypeScript 5.6 (ESM), Prisma 5.22, @azure/msal-node 2.15, jsonwebtoken 9.0, helmet 8.1, express-rate-limit 8.2, express-validator 7.2, docx 9.5, multer 2.0 | Azure Container Apps (cmmc-api) | Monorepo /backend | Development Team |
| PostgreSQL Database | Persistent data store for all application data: tenants, users, assessments, controls, objectives, responses, POA&Ms, policies, audit logs, tokens (22 tables) | PostgreSQL 17 via Prisma ORM 5.22 | Azure Database for PostgreSQL Flexible Server (psql-cmmc-assessor-prod) | Prisma migrations in /backend/prisma | Development Team |
| Bicep IaC | Infrastructure provisioning and management for all Azure resources | Bicep | GitHub Actions | Monorepo /infra | Development Team |

### 3.2 Component Interaction Matrix

| Source | Target | Protocol | Pattern | Data Exchanged |
|--------|--------|----------|---------|----------------|
| cmmc-web (Browser) | cmmc-api | HTTPS (REST) | Synchronous | All user actions: auth, assessments, controls, objectives, scoring, POA&M, policies, SSP, evidence, team management |
| cmmc-web (Browser) | Microsoft Entra ID | HTTPS (OAuth 2.0) | Synchronous (Redirect) | OAuth authorization code flow -- redirects for login, consent, and callback |
| cmmc-api | PostgreSQL | TCP (PostgreSQL wire protocol) | Synchronous | All CRUD operations via Prisma ORM with tenant-scoped queries |
| cmmc-api | Microsoft Entra ID | HTTPS (REST) | Synchronous | Token exchange (authorization code for access/ID tokens), token refresh, user info |
| cmmc-api | Microsoft Graph API | HTTPS (REST) | Synchronous | SharePoint evidence operations: list files, upload, download, preview, delete |
| cmmc-api | Azure Blob Storage | HTTPS (REST) | Synchronous | Evidence file temporary storage, export file storage |
| cmmc-api | Azure Key Vault | HTTPS (REST) | Synchronous (startup) | Secret retrieval for database credentials, JWT signing keys, MSAL client secrets |
| GitHub Actions | Azure Container Registry | HTTPS | Synchronous | Docker image push during CI/CD |
| GitHub Actions | Azure Container Apps | HTTPS (ARM API) | Synchronous | Container revision deployment via Bicep |

---

## 4. API Design

### 4.1 API Conventions

| Convention | Standard |
|------------|----------|
| API Style | RESTful, resource-oriented |
| URL Pattern | /api/{resource} (no explicit versioning currently) |
| Versioning Strategy | Not versioned in URL currently; all endpoints under /api/ |
| Request/Response Format | JSON (application/json); multipart/form-data for file uploads |
| Date/Time Format | ISO 8601 (UTC) via Prisma DateTime fields |
| Pagination | Not yet standardized; most list endpoints return full collections (suitable for MVP scale) |
| Filtering | Query parameters where applicable (e.g., ?assessmentId=) |
| Sorting | Not yet standardized |
| Error Response Format | JSON with `message` field and appropriate HTTP status code |
| Naming Convention | camelCase for JSON properties, kebab-case for URL segments where multi-word |

### 4.2 Authentication API Endpoints (Entra ID)

| Method | Endpoint | Auth | Request Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| GET | /api/auth/login | None | N/A | `302: Redirect to Entra ID` | Initiate OAuth 2.0 login flow with Entra ID |
| GET | /api/auth/callback | None (OAuth code) | N/A | `302: Redirect to frontend with tokens` | Handle Entra ID OAuth callback, exchange code for tokens |
| GET | /api/auth/consent | None | N/A | `302: Redirect to Entra ID admin consent` | Initiate admin consent flow for tenant onboarding |
| GET | /api/auth/sharepoint-consent | Bearer JWT | N/A | `302: Redirect to Entra ID` | Initiate incremental consent for SharePoint/Graph API permissions |
| POST | /api/auth/invitations | Bearer JWT | `{ email, role, tenantId }` | `201: Invitation`, `400`, `403` | Create team invitation via Entra ID |
| GET | /api/auth/me | Bearer JWT | N/A | `200: User profile` | Get current authenticated user profile |
| POST | /api/auth/logout | Bearer JWT | N/A | `200: Success` | Logout and add token to deny list |
| POST | /api/auth/refresh | Refresh Token (cookie) | N/A | `200: New access token` | Refresh JWT using refresh token with family rotation |
| GET | /api/auth/token/status | Bearer JWT | N/A | `200: Token status` | Check current token validity and expiry |

### 4.3 Legacy Authentication API Endpoints

| Method | Endpoint | Auth | Request Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| POST | /api/auth/register | None | `{ email, password, name }` | `201: User`, `400`, `409` | Register a new user with email/password |
| POST | /api/auth/login | None | `{ email, password }` | `200: { token, user }`, `401` | Login with email/password credentials |
| POST | /api/auth/change-password | Bearer JWT | `{ currentPassword, newPassword }` | `200: Success`, `400`, `401` | Change password for authenticated user |
| POST | /api/auth/logout | Bearer JWT | N/A | `200: Success` | Logout and invalidate tokens |

### 4.4 Assessment API Endpoints

| Method | Endpoint | Auth | Request Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| GET | /api/assessments | Bearer JWT + Tenant | N/A | `200: Assessment[]` | List all assessments for current tenant |
| GET | /api/assessments/:id | Bearer JWT + Tenant | N/A | `200: Assessment`, `404` | Get assessment details by ID |
| POST | /api/assessments | Bearer JWT + Tenant (ADMIN+) | `{ name, description, organizationId }` | `201: Assessment`, `400` | Create a new CMMC assessment |
| PUT | /api/assessments/:id | Bearer JWT + Tenant (ADMIN+) | `{ name, description, status }` | `200: Assessment`, `400`, `404` | Update an existing assessment |
| DELETE | /api/assessments/:id | Bearer JWT + Tenant (OWNER) | N/A | `204`, `404` | Delete an assessment |

### 4.5 Controls and Objectives API Endpoints

| Method | Endpoint | Auth | Request Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| GET | /api/controls | Bearer JWT + Tenant | N/A | `200: Control[]` | List all CMMC controls |
| GET | /api/controls/:id | Bearer JWT + Tenant | N/A | `200: Control`, `404` | Get control details |
| GET | /api/controls/grouped | Bearer JWT + Tenant | N/A | `200: GroupedControls` | Get controls grouped by domain/family |
| GET | /api/controls/summary | Bearer JWT + Tenant | N/A | `200: ControlSummary` | Get control status summary with counts |
| GET | /api/objectives | Bearer JWT + Tenant | N/A | `200: AssessmentObjective[]` | List all assessment objectives |
| GET | /api/objectives/by-control/:controlId | Bearer JWT + Tenant | N/A | `200: AssessmentObjective[]` | Get objectives for a specific control |
| POST | /api/objectives/responses | Bearer JWT + Tenant (ASSESSOR+) | `{ objectiveId, response, notes }` | `200: ObjectiveResponse`, `400` | Submit or update an objective response |
| GET | /api/objectives/summary | Bearer JWT + Tenant | N/A | `200: ObjectiveSummary` | Get objective completion summary |
| POST | /api/objectives/initialize | Bearer JWT + Tenant (ADMIN+) | `{ assessmentId }` | `201: AssessmentObjective[]` | Initialize objectives for an assessment |
| GET | /api/implementations | Bearer JWT + Tenant | N/A | `200: ControlImplementation[]` | List all control implementations |
| GET | /api/implementations/summary | Bearer JWT + Tenant | N/A | `200: ImplementationSummary` | Get implementation status summary |
| PUT | /api/implementations/:id | Bearer JWT + Tenant (ASSESSOR+) | `{ status, description, evidence }` | `200: ControlImplementation`, `400` | Update a control implementation |
| POST | /api/implementations/bulk | Bearer JWT + Tenant (ADMIN+) | `{ implementations: [...] }` | `200: ControlImplementation[]` | Bulk update control implementations |
| POST | /api/implementations/initialize | Bearer JWT + Tenant (ADMIN+) | `{ assessmentId }` | `201: ControlImplementation[]` | Initialize implementations for an assessment |

### 4.6 SPRS Scoring API Endpoints

| Method | Endpoint | Auth | Request Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| GET | /api/sprs/implementation-score | Bearer JWT + Tenant | N/A | `200: { score, maxScore, details }` | Calculate SPRS score based on implementations |
| GET | /api/sprs/assessment-score | Bearer JWT + Tenant | N/A | `200: { score, breakdown }` | Calculate SPRS score based on assessment responses |
| GET | /api/sprs/path-to-110 | Bearer JWT + Tenant | N/A | `200: { currentScore, gaps, recommendations }` | Generate path-to-110 improvement plan |
| POST | /api/sprs/what-if | Bearer JWT + Tenant | `{ changes: [...] }` | `200: { projectedScore }` | What-if analysis for score changes |

### 4.7 POA&M API Endpoints

| Method | Endpoint | Auth | Request Body | Response | Description |
|--------|----------|------|-------------|----------|-------------|
| GET | /api/poam | Bearer JWT + Tenant | N/A | `200: POAMItem[]` | List all POA&M items for current tenant |
| GET | /api/poam/:id | Bearer JWT + Tenant | N/A | `200: POAMItem`, `404` | Get POA&M item details |
| POST | /api/poam | Bearer JWT + Tenant (ASSESSOR+) | `{ controlId, weakness, milestone, ... }` | `201: POAMItem`, `400` | Create a new POA&M item |
| PUT | /api/poam/:id | Bearer JWT + Tenant (ASSESSOR+) | `{ status, milestone, completion }` | `200: POAMItem`, `400`, `404` | Update a POA&M item |
| DELETE | /api/poam/:id | Bearer JWT + Tenant (ADMIN+) | N/A | `204`, `404` | Delete a POA&M item |
| POST | /api/poam/auto-generate | Bearer JWT + Tenant (ADMIN+) | `{ assessmentId }` | `201: POAMItem[]` | Auto-generate POA&M items from non-compliant controls |

### 4.8 Additional API Endpoint Groups

| Group | Endpoints | Description |
|-------|-----------|-------------|
| Team Management (8) | GET/POST/PUT/DELETE /api/team/members, /api/team/invitations, /api/team/roles, /api/team/stats | Manage team members, invitations, roles within a tenant |
| Tenant Management (11) | GET/PUT /api/tenants/current, /api/tenants/settings, POST /api/tenants/sharepoint-validation, GET /api/tenants/platform-admin/*, POST /api/tenants/invitations | Tenant settings, SharePoint validation, platform admin operations |
| Evidence (6) | GET /api/evidence/auth-status, GET /api/evidence/list, POST /api/evidence/upload, GET /api/evidence/download/:id, GET /api/evidence/preview/:id, DELETE /api/evidence/:id | SharePoint evidence management via Microsoft Graph API |
| Policies (8) | GET /api/policies/templates, CRUD /api/policies, /api/policies/:id/versions, /api/policies/:id/acknowledge | Policy templates, versioning, and user acknowledgments |
| Dashboard (2) | GET /api/dashboard/organization, GET /api/dashboard/assessment | Aggregated dashboard data for org overview and assessment progress |
| SSP (3) | GET /api/ssp/config, PUT /api/ssp/config, POST /api/ssp/generate | System Security Plan configuration and DOCX generation |
| Export (2) | POST /api/export/excel, POST /api/export/pdf | Export assessment data to Excel and PDF formats |

---

## 5. Database Schema Overview

### 5.1 Database Inventory

| Database | Engine | Azure Service | Purpose | Schema Owner |
|----------|--------|---------------|---------|--------------|
| cmmc-assessor-prod | PostgreSQL 17 | Azure Database for PostgreSQL Flexible Server (psql-cmmc-assessor-prod, B1ms) | All application data: tenants, users, assessments, controls, objectives, responses, POA&Ms, policies, audit logs, tokens | cmmc-api (Prisma ORM) |

### 5.2 Entity Relationship Overview (22 Tables)

<!-- Diagram: 05-entity-relationship.png — embedded on Confluence Data Architecture page as attachment -->
<!-- Shows all 22 Prisma models with relationships -->

#### Core Tenant and User Tables

| Table/Collection | Description | Key Columns | Indexes |
|-----------------|-------------|-------------|---------|
| `Tenant` | Multi-tenant root entity; each organization is a tenant | `id (PK, UUID)`, `name`, `domain`, `entraIdTenantId`, `sharepointSiteUrl`, `settings (JSON)`, `createdAt`, `updatedAt` | `idx_tenant_entra_id`, `idx_tenant_domain` |
| `User` | Registered user accounts (Entra ID or legacy) | `id (PK, UUID)`, `email (UNIQUE)`, `name`, `passwordHash (nullable)`, `entraIdObjectId`, `platformRole (ENUM)`, `status`, `createdAt`, `updatedAt` | `idx_user_email`, `idx_user_entra_id` |
| `TeamMember` | User membership within a tenant with team role | `id (PK, UUID)`, `userId (FK -> User)`, `tenantId (FK -> Tenant)`, `role (ENUM: OWNER/ADMIN/ASSESSOR/MEMBER/VIEWER)`, `joinedAt` | `idx_team_member_user_tenant (UNIQUE)`, `idx_team_member_tenant` |
| `Invitation` | Legacy invitation records | `id (PK, UUID)`, `email`, `role`, `tenantId (FK -> Tenant)`, `invitedBy`, `status`, `expiresAt` | `idx_invitation_email`, `idx_invitation_tenant` |
| `TenantInvitation` | Tenant-scoped invitations for team onboarding | `id (PK, UUID)`, `email`, `role`, `tenantId (FK -> Tenant)`, `invitedById (FK -> User)`, `status`, `token`, `expiresAt` | `idx_tenant_invitation_token`, `idx_tenant_invitation_email` |
| `Organization` | Legacy organization entity (being migrated to Tenant) | `id (PK, UUID)`, `name`, `description`, `createdAt` | N/A |

#### Assessment and Control Tables

| Table/Collection | Description | Key Columns | Indexes |
|-----------------|-------------|-------------|---------|
| `Assessment` | CMMC assessment instances within a tenant | `id (PK, UUID)`, `tenantId (FK -> Tenant)`, `name`, `description`, `status`, `level`, `score`, `createdAt`, `updatedAt` | `idx_assessment_tenant`, `idx_assessment_status` |
| `Control` | CMMC control definitions (reference data) | `id (PK, UUID)`, `controlId (e.g., AC.L2-3.1.1)`, `domain`, `family`, `title`, `description`, `level`, `weight` | `idx_control_domain`, `idx_control_level` |
| `AssessmentObjective` | Individual assessment objectives tied to controls | `id (PK, UUID)`, `assessmentId (FK -> Assessment)`, `controlId (FK -> Control)`, `objectiveId`, `description`, `tenantId (FK -> Tenant)` | `idx_objective_assessment`, `idx_objective_control` |
| `ObjectiveResponse` | Assessor responses to individual objectives | `id (PK, UUID)`, `objectiveId (FK -> AssessmentObjective)`, `response (ENUM: MET/NOT_MET/NA)`, `notes`, `assessorId (FK -> User)`, `tenantId (FK -> Tenant)`, `updatedAt` | `idx_objective_response_objective`, `idx_objective_response_tenant` |
| `ControlResponse` | Aggregated control-level responses | `id (PK, UUID)`, `assessmentId (FK -> Assessment)`, `controlId (FK -> Control)`, `status`, `notes`, `tenantId (FK -> Tenant)` | `idx_control_response_assessment`, `idx_control_response_tenant` |
| `ControlImplementation` | Implementation status and evidence for each control | `id (PK, UUID)`, `assessmentId (FK -> Assessment)`, `controlId (FK -> Control)`, `status (ENUM)`, `description`, `evidence`, `tenantId (FK -> Tenant)`, `updatedAt` | `idx_implementation_assessment`, `idx_implementation_tenant` |

#### POA&M Tables

| Table/Collection | Description | Key Columns | Indexes |
|-----------------|-------------|-------------|---------|
| `POAMItem` | Plan of Action and Milestones items | `id (PK, UUID)`, `tenantId (FK -> Tenant)`, `controlId (FK -> Control)`, `weakness`, `milestone`, `scheduledCompletionDate`, `status`, `responsiblePerson`, `resources`, `createdAt`, `updatedAt` | `idx_poam_tenant`, `idx_poam_control`, `idx_poam_status` |
| `POAMEvidence` | Evidence attachments for POA&M items | `id (PK, UUID)`, `poamItemId (FK -> POAMItem)`, `fileName`, `fileUrl`, `uploadedAt` | `idx_poam_evidence_item` |

#### Policy Tables

| Table/Collection | Description | Key Columns | Indexes |
|-----------------|-------------|-------------|---------|
| `TenantPolicy` | Tenant-specific security policies | `id (PK, UUID)`, `tenantId (FK -> Tenant)`, `title`, `content`, `status (ENUM)`, `category`, `createdAt`, `updatedAt` | `idx_policy_tenant`, `idx_policy_category` |
| `PolicyVersion` | Version history for policies | `id (PK, UUID)`, `policyId (FK -> TenantPolicy)`, `version`, `content`, `changedBy (FK -> User)`, `createdAt` | `idx_policy_version_policy` |
| `PolicyAcknowledgment` | User acknowledgments of policy versions | `id (PK, UUID)`, `policyVersionId (FK -> PolicyVersion)`, `userId (FK -> User)`, `acknowledgedAt` | `idx_acknowledgment_policy_version`, `idx_acknowledgment_user` |

#### Audit and Compliance Tables

| Table/Collection | Description | Key Columns | Indexes |
|-----------------|-------------|-------------|---------|
| `AuditLog` | Immutable audit trail for all entity changes | `id (PK, UUID)`, `tenantId (FK -> Tenant)`, `entityType`, `entityId`, `action`, `actorId (FK -> User)`, `changes (JSON)`, `ipAddress`, `timestamp` | `idx_audit_tenant`, `idx_audit_entity`, `idx_audit_timestamp`, `idx_audit_actor` |
| `SSPConfig` | System Security Plan configuration per tenant | `id (PK, UUID)`, `tenantId (FK -> Tenant)`, `organizationName`, `systemName`, `config (JSON)`, `updatedAt` | `idx_ssp_config_tenant (UNIQUE)` |

#### Token and Session Tables

| Table/Collection | Description | Key Columns | Indexes |
|-----------------|-------------|-------------|---------|
| `UserToken` | Encrypted Microsoft Graph API tokens | `id (PK, UUID)`, `userId (FK -> User)`, `accessToken (AES-256-GCM encrypted)`, `refreshToken (AES-256-GCM encrypted)`, `expiresAt`, `scope`, `createdAt` | `idx_user_token_user` |
| `RefreshToken` | JWT refresh tokens with family tracking | `id (PK, UUID)`, `userId (FK -> User)`, `token (UNIQUE)`, `family`, `expiresAt`, `isRevoked`, `createdAt` | `idx_refresh_token_user`, `idx_refresh_token_family`, `idx_refresh_token_token (UNIQUE)` |
| `TokenDenyList` | Revoked JWT tokens for server-side logout | `id (PK, UUID)`, `token`, `expiresAt`, `revokedAt` | `idx_deny_list_token`, `idx_deny_list_expires` |

### 5.3 Database Migration Strategy

| Aspect | Approach |
|--------|----------|
| Migration Tool | Prisma Migrate (prisma migrate deploy for production, prisma migrate dev for development) |
| Migration Execution | Run as part of CI/CD pipeline before container deployment; `prisma migrate deploy` applies pending migrations |
| Rollback Strategy | Prisma does not support automatic down migrations; rollback requires creating a new forward migration that reverses changes; tested in staging before production |
| Schema Versioning | Sequential timestamped migrations in /backend/prisma/migrations/ directory; each migration is a folder with migration.sql |
| Breaking Changes | Expand-and-contract pattern; add new columns as nullable first, migrate data, then remove old columns in a subsequent release |
| Schema Source of Truth | Prisma schema file (schema.prisma) is the single source of truth; all 22 models defined declaratively |

---

## 6. Message and Event Contracts

This application uses a **synchronous REST API architecture** with no message broker or event bus. All communication between the frontend and backend is via HTTP REST calls. There are no asynchronous messaging patterns, domain events, or pub/sub topics.

**Rationale:** The application is an MVP with a small team and moderate traffic expectations (< 50 concurrent users). The complexity of a message broker is not justified at this stage. If asynchronous processing is needed in the future (e.g., background report generation, email notifications), Azure Service Bus or Azure Functions can be introduced incrementally.

**Audit Trail:** The AuditLog table serves as a synchronous append-only record of entity changes, written within the same database transaction as the entity mutation. This is not an event stream but provides a compliance-oriented audit trail.

---

## 7. Error Handling Strategy

### 7.1 Error Classification

| Category | HTTP Status Range | Retry | Example |
|----------|------------------|-------|---------|
| Client Error (Validation) | 400 | No | Invalid request payload, missing required field, express-validator failure |
| Authentication Error | 401 | No (re-auth via Entra ID) | Expired JWT, invalid token, token on deny list |
| Authorization Error | 403 | No | Insufficient team role (e.g., VIEWER attempting write), wrong tenant |
| Not Found | 404 | No | Assessment, control, or POA&M item does not exist or is not in tenant scope |
| Conflict | 409 | No | Duplicate email registration, duplicate team membership |
| Rate Limited | 429 | Yes (with backoff) | Express-rate-limit threshold exceeded |
| Server Error (Transient) | 500, 502, 503 | Yes (with backoff) | Database connection timeout, Graph API temporary failure |
| Server Error (Permanent) | 500 | No | Unhandled exception, data integrity violation |

### 7.2 Error Response Format

```json
{
  "message": "Validation error: email is required",
  "errors": [
    {
      "field": "email",
      "message": "Email address is required"
    }
  ]
}
```

For unhandled errors (production):
```json
{
  "message": "Internal server error"
}
```

### 7.3 Express Error Middleware Pipeline

The backend uses a layered error handling approach:

1. **express-validator middleware**: Validates request bodies, params, and query strings; returns 400 with field-level error details
2. **Route-level try/catch**: Controllers wrap async operations in try/catch blocks; caught errors are passed to `next(error)`
3. **Tenant isolation middleware (tenantAuth.ts)**: Returns 403 if tenant context is missing or mismatched
4. **Authentication middleware**: Returns 401 for invalid/expired JWTs, checks TokenDenyList
5. **Global error handler (final middleware)**: Catches all unhandled errors; logs stack trace; returns sanitized error response to client (no stack traces in production)

### 7.4 Graph API Error Handling

| Scenario | Strategy | Fallback |
|----------|----------|----------|
| Graph API 401 (token expired) | Automatically refresh token using MSAL refresh token flow; retry request with new token | If refresh fails, return 401 to client with instructions to re-consent |
| Graph API 403 (insufficient permissions) | Return 403 to client with message indicating missing SharePoint permissions | Prompt user to complete incremental consent flow |
| Graph API 404 (file/site not found) | Return 404 to client | User must verify SharePoint site URL in tenant settings |
| Graph API 429 (throttled) | Respect Retry-After header from Graph API; queue retry | Return 503 to client with retry guidance |
| Graph API 5xx (service error) | Log error; return 502 to client | User can retry; evidence upload is not critical path for assessment |

---

## 8. Caching Strategy

### 8.1 Cache Inventory

| Data | Cache Layer | Cache Service | TTL | Invalidation Strategy | Justification |
|------|-------------|--------------|-----|----------------------|---------------|
| Assessment list and details | Client-side | TanStack React Query (browser memory) | 5 minutes (staleTime) | Automatic refetch on window focus; manual invalidation on mutation via queryClient.invalidateQueries() | Reduces redundant API calls during assessment workflow navigation |
| Control definitions (reference data) | Client-side | TanStack React Query (browser memory) | 30 minutes (staleTime) | Rarely changes; refetch on page reload | CMMC controls are static reference data; high read frequency, zero write frequency |
| SPRS score calculations | Client-side | TanStack React Query (browser memory) | 1 minute (staleTime) | Invalidated when objective responses or implementation statuses change | Scores change frequently during active assessment sessions |
| Dashboard aggregations | Client-side | TanStack React Query (browser memory) | 5 minutes (staleTime) | Automatic refetch on navigation to dashboard | Dashboard data is aggregated from multiple sources; acceptable staleness |
| User profile and tenant context | Client-side | React Context + TanStack React Query | Session duration | Invalidated on logout or tenant switch | Loaded once on login; stable throughout session |
| Prisma query results | None (no server-side cache) | N/A | N/A | N/A | Server-side caching not implemented for MVP; PostgreSQL query performance is adequate for current scale |

### 8.2 Cache Patterns

| Pattern | Where Applied | Description |
|---------|---------------|-------------|
| Stale-While-Revalidate | All TanStack React Query hooks | Serve cached data immediately while fetching fresh data in background; user sees instant response with eventual consistency |
| Cache Invalidation on Mutation | Assessment, objective, implementation mutations | After any POST/PUT/DELETE mutation, relevant query caches are invalidated via queryClient.invalidateQueries() to trigger refetch |
| No Server-Side Cache | Backend API | No Redis or in-memory server-side cache; all requests hit PostgreSQL directly; acceptable for MVP scale; Redis can be added as a scaling optimization |

---

## 9. Configuration Management

### 9.1 Application Settings

| Setting | Source | Scope | Example Value | Sensitive |
|---------|--------|-------|---------------|-----------|
| `DATABASE_URL` | Azure Key Vault -> Container Apps secret | Per environment | `postgresql://user:pass@host:5432/db?sslmode=require` | Yes |
| `JWT_SECRET` | Azure Key Vault -> Container Apps secret | Per environment | `(256-bit random string)` | Yes |
| `JWT_EXPIRY` | Environment variable | Per environment | `7d` | No |
| `AZURE_CLIENT_ID` | Azure Key Vault -> Container Apps secret | Per environment | `(Entra ID app registration client ID)` | Yes |
| `AZURE_CLIENT_SECRET` | Azure Key Vault -> Container Apps secret | Per environment | `(Entra ID app registration client secret)` | Yes |
| `AZURE_TENANT_ID` | Environment variable | Per environment | `(Entra ID tenant ID)` | No |
| `AZURE_REDIRECT_URI` | Environment variable | Per environment | `https://api.cmmc-assessor.com/api/auth/callback` | No |
| `GRAPH_API_SCOPES` | Environment variable | Global | `https://graph.microsoft.com/.default` | No |
| `TOKEN_ENCRYPTION_KEY` | Azure Key Vault -> Container Apps secret | Per environment | `(AES-256 key for Graph API token encryption)` | Yes |
| `FRONTEND_URL` | Environment variable | Per environment | `https://app.cmmc-assessor.com` | No |
| `PORT` | Environment variable | Per environment | `3000` | No |
| `NODE_ENV` | Environment variable | Per environment | `production` | No |
| `RATE_LIMIT_WINDOW_MS` | Environment variable | Per environment | `900000` (15 minutes) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Environment variable | Per environment | `100` | No |
| `VITE_API_URL` | Build-time environment variable (frontend) | Per environment | `https://api.cmmc-assessor.com` | No |

### 9.2 Feature Flags

Feature flags are not currently implemented. Feature gating is managed through:
- Branch-based deployments (feature branches deployed to staging)
- Role-based visibility (platform roles control access to admin features)
- Conditional rendering in React components based on user role and tenant settings

### 9.3 Environment Configuration Matrix

| Setting Category | Development (Local) | Production |
|-----------------|---------------------|------------|
| Database | Local PostgreSQL (Docker) | Azure PostgreSQL Flexible Server (B1ms) |
| Database SKU | N/A (local) | B1ms (1 vCore, 2GB) |
| Container Apps CPU | N/A (local node process) | Backend: 0.5 CPU, Frontend: 0.25 CPU |
| Container Apps Memory | N/A | Backend: 1Gi, Frontend: 0.5Gi |
| Container Apps Replicas | N/A | 0-3 (auto-scale) |
| Backend Concurrency Threshold | N/A | 50 concurrent requests |
| Frontend Concurrency Threshold | N/A | 100 concurrent requests |
| Log Level | Debug | Info |
| JWT Expiry | 7d | 7d (to be reduced per security remediation) |
| Rate Limit | Disabled | 100 requests per 15 minutes |
| Secrets Source | .env file (gitignored) | Azure Key Vault |
| Entra ID | Development app registration | Production app registration |
| Storage | Local filesystem | Azure Blob Storage (Standard_LRS) |

---

## 10. Code Structure and Project Layout

### 10.1 Repository Strategy

| Aspect | Approach |
|--------|----------|
| Repository Model | Monorepo (frontend and backend in a single repository) |
| Branching Strategy | GitHub Flow: main + feature branches, PR-based merges |
| Branch Naming | feature/description, bugfix/description, hotfix/description |
| PR Requirements | Passing CI (build + lint), no merge conflicts; code review recommended |

### 10.2 Backend Project Layout (Node.js/TypeScript)

```
backend/
  src/
    routes/                           # Express router definitions
      auth.ts                         # Entra ID OAuth and legacy auth routes
      assessments.ts                  # Assessment CRUD routes
      controls.ts                     # Control listing and grouping routes
      objectives.ts                   # Objective response routes
      implementations.ts             # Control implementation routes
      sprs.ts                         # SPRS scoring routes
      poam.ts                         # POA&M management routes
      policies.ts                     # Policy management routes
      team.ts                         # Team member management routes
      tenants.ts                      # Tenant settings routes
      evidence.ts                     # Evidence management (Graph API) routes
      dashboard.ts                    # Dashboard aggregation routes
      ssp.ts                          # SSP configuration and generation routes
      export.ts                       # Excel/PDF export routes
    middleware/
      auth.ts                         # JWT verification middleware
      tenantAuth.ts                   # Tenant isolation middleware
      roleAuth.ts                     # Role-based authorization middleware
      errorHandler.ts                 # Global error handling middleware
      rateLimiter.ts                  # Express rate limiter configuration
      validators/                     # express-validator rule sets per route
    services/
      authService.ts                  # Authentication and token management
      assessmentService.ts            # Assessment business logic
      controlService.ts              # Control and objective logic
      sprsService.ts                  # SPRS score calculation engine
      poamService.ts                  # POA&M management logic
      policyService.ts               # Policy versioning and acknowledgment
      graphService.ts                 # Microsoft Graph API integration
      sspService.ts                   # SSP DOCX generation logic
      auditService.ts                # Audit log creation
      encryptionService.ts           # AES-256-GCM token encryption/decryption
    config/
      database.ts                     # Prisma client initialization
      msal.ts                         # MSAL confidential client configuration
      env.ts                          # Environment variable validation
    types/
      index.ts                        # TypeScript type definitions
      express.d.ts                    # Express request augmentation (user, tenant)
    utils/
      tokenUtils.ts                   # JWT creation, verification, deny list checks
      helpers.ts                      # Shared utility functions
    index.ts                          # Application entry point (Express server setup)
  prisma/
    schema.prisma                     # Prisma schema (22 models)
    migrations/                       # Timestamped SQL migrations
    seed.ts                           # Database seeding (CMMC controls, test data)
  Dockerfile                          # Multi-stage Docker build
  package.json                        # Dependencies and scripts
  tsconfig.json                       # TypeScript configuration (ESM)
```

### 10.3 Frontend Project Layout (React/TypeScript)

```
frontend/
  src/
    pages/                            # Page-level components (route targets)
      Dashboard.tsx                   # Organization and assessment dashboards
      Assessments.tsx                 # Assessment list and creation
      AssessmentDetail.tsx            # Single assessment view with controls
      Controls.tsx                    # Control listing and grouping
      Objectives.tsx                  # Objective response forms
      SPRS.tsx                        # SPRS score dashboard and what-if
      POAM.tsx                        # POA&M management
      Policies.tsx                    # Policy management and acknowledgment
      Evidence.tsx                    # Evidence upload and management
      Team.tsx                        # Team member management
      Settings.tsx                    # Tenant settings
      SSP.tsx                         # SSP configuration and generation
      Login.tsx                       # Login page (Entra ID + legacy)
    components/                       # Reusable UI components
      layout/                         # Navigation, sidebar, header, footer
      forms/                          # Form components with validation
      charts/                         # Recharts-based scoring visualizations
      tables/                         # Data tables with sorting/filtering
      modals/                         # Dialog components
      common/                         # Buttons, badges, cards, alerts
    hooks/                            # Custom React hooks
      useAssessments.ts               # TanStack React Query hooks for assessments
      useControls.ts                  # Query hooks for controls and objectives
      useSPRS.ts                      # Query hooks for SPRS scoring
      useAuth.ts                      # Authentication state hooks
      useTenant.ts                    # Tenant context hooks
    services/                         # API client layer
      api.ts                          # Axios instance with interceptors
      authApi.ts                      # Authentication API calls
      assessmentApi.ts                # Assessment API calls
      controlApi.ts                   # Control and objective API calls
      evidenceApi.ts                  # Evidence management API calls
    context/                          # React context providers
      AuthContext.tsx                  # Authentication state provider
      TenantContext.tsx               # Tenant context provider
    types/                            # TypeScript interfaces and enums
    utils/                            # Utility functions
    App.tsx                           # Root component with Router
    main.tsx                          # Entry point (Vite)
  public/                             # Static assets
  index.html                          # HTML template
  vite.config.ts                      # Vite configuration
  tailwind.config.js                  # Tailwind CSS configuration
  tsconfig.json                       # TypeScript configuration
  package.json                        # Dependencies and scripts
  Dockerfile                          # Multi-stage Docker build (build + Nginx)
```

### 10.4 Coding Conventions

| Aspect | Convention |
|--------|-----------|
| Code Formatting | Prettier (2-space indent, single quotes, trailing commas) |
| Linting | ESLint with TypeScript parser and React plugin |
| Naming (TypeScript) | camelCase for variables/functions, PascalCase for classes/components/types/interfaces, UPPER_SNAKE_CASE for constants |
| Naming (Database) | PascalCase for Prisma model names (maps to snake_case table names), camelCase for fields |
| Naming (API URLs) | kebab-case for multi-word URL segments |
| Testing | Not yet comprehensive; planned for security remediation phase |
| Dependency Injection | No DI container; services are imported directly as ES modules |
| API Documentation | No OpenAPI spec currently; API contracts documented in this LLD |
| Module System | ESM (ECMAScript Modules) for backend; Vite ESM for frontend |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-14 | Solution Architect | Initial draft |
