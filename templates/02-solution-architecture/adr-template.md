# Architecture Decision Record (ADR) Template

| **Metadata**     | **Value**                                      |
|------------------|------------------------------------------------|
| Page Title       | CMMC Assessor Platform - Architecture Decision Records |
| Last Updated     | 2026-02-14                                     |
| Status           | `DRAFT`                                        |
| Owner            | Solution Architect                             |
| Reviewers        | Technical Lead, Security Architect, Engineering Manager |

---

## ADR Index

| ADR # | Title | Status | Date | Decision Maker |
|-------|-------|--------|------|----------------|
| ADR-001 | Use Azure Container Apps over AKS for Container Hosting | Accepted | 2026-01-15 | Solution Architect |
| ADR-002 | Use Prisma ORM over Raw SQL for Database Access | Accepted | 2026-01-18 | Solution Architect |
| ADR-003 | Use Microsoft Entra ID over Custom Authentication | Accepted | 2026-01-10 | Solution Architect |

---

---

# ADR Template

> Copy everything below this line for each new ADR.

---

## ADR-[NNN]: [TITLE]

| **Field**        | **Value**                                                |
|------------------|----------------------------------------------------------|
| ADR Number       | ADR-[NNN]                                                |
| Title            | [SHORT_DESCRIPTIVE_TITLE]                                |
| Date             | [YYYY-MM-DD]                                             |
| Status           | `Proposed` / `Accepted` / `Deprecated` / `Superseded by ADR-[NNN]` |
| Decision Maker   | [NAME_AND_ROLE]                                          |
| Consulted        | [LIST_OF_PEOPLE_CONSULTED]                               |
| Informed         | [LIST_OF_PEOPLE_INFORMED]                                |

---

### Context

[Describe the issue that motivates this decision. What is the problem or situation? What forces are at play? Include relevant technical constraints, business requirements, team capabilities, and timeline pressures. Be factual and specific -- avoid vague statements.]

---

### Decision

[State the architectural decision clearly and concisely. Use active voice. Example: "We will use Azure Kubernetes Service (AKS) for container orchestration." Include enough detail so that the decision is unambiguous.]

---

### Alternatives Considered

| # | Option | Pros | Cons |
|---|--------|------|------|
| 1 | [OPTION_A -- the chosen option] | [LIST_PROS] | [LIST_CONS] |
| 2 | [OPTION_B] | [LIST_PROS] | [LIST_CONS] |
| 3 | [OPTION_C] | [LIST_PROS] | [LIST_CONS] |

---

### Consequences

**What becomes easier or better:**
- [POSITIVE_CONSEQUENCE_1]
- [POSITIVE_CONSEQUENCE_2]
- [POSITIVE_CONSEQUENCE_3]

**What becomes harder or worse:**
- [NEGATIVE_CONSEQUENCE_1]
- [NEGATIVE_CONSEQUENCE_2]

**Risks:**
- [RISK_1]: [MITIGATION]
- [RISK_2]: [MITIGATION]

---

### Compliance and Security Implications

| Aspect | Implication | Mitigation |
|--------|------------|------------|
| [e.g., Data Residency] | [IMPLICATION] | [MITIGATION] |
| [e.g., Access Control] | [IMPLICATION] | [MITIGATION] |
| [e.g., Audit Logging] | [IMPLICATION] | [MITIGATION] |
| [e.g., Regulatory (GDPR, SOC 2)] | [IMPLICATION] | [MITIGATION] |

---

### References

- [REFERENCE_1: title and link]
- [REFERENCE_2: title and link]
- [REFERENCE_3: title and link]

---

### Approval

| Role | Name | Date | Decision |
|------|------|------|----------|
| Solution Architect | [NAME] | [YYYY-MM-DD] | [ ] Approve / [ ] Reject |
| Technical Lead | [NAME] | [YYYY-MM-DD] | [ ] Approve / [ ] Reject |
| Security Architect | [NAME] | [YYYY-MM-DD] | [ ] Approve / [ ] Reject |
| [ADDITIONAL_ROLE] | [NAME] | [YYYY-MM-DD] | [ ] Approve / [ ] Reject |

---

---

# ADR-001: Use Azure Container Apps over AKS for Container Hosting

## ADR-001: Use Azure Container Apps (ACA) over Azure Kubernetes Service (AKS)

| **Field**        | **Value**                                                |
|------------------|----------------------------------------------------------|
| ADR Number       | ADR-001                                                  |
| Title            | Use Azure Container Apps over AKS for Container Hosting  |
| Date             | 2026-01-15                                               |
| Status           | `Accepted`                                               |
| Decision Maker   | Solution Architect                                       |
| Consulted        | Technical Lead, DevOps Engineer                          |
| Informed         | Engineering Manager, Product Owner, Development Team     |

---

### Context

The CMMC Assessor Platform requires a container hosting solution on Microsoft Azure to run two containerized workloads: a Node.js/Express backend API and an Nginx-served React frontend. The platform is an MVP with the following characteristics:

- **Small team**: 1-3 developers with limited DevOps bandwidth
- **Low traffic**: Expected peak of < 50 concurrent users in Year 1
- **Cost sensitivity**: MVP budget requires minimal infrastructure spend; the platform should cost as little as possible when idle
- **Deployment simplicity**: The team needs fast, straightforward deployments without managing cluster infrastructure
- **Two containers only**: No microservices architecture; just a frontend and backend container
- **No complex networking**: No service mesh, sidecar patterns, or multi-cluster requirements
- **Scale-to-zero**: The platform will have periods of zero usage (e.g., nights, weekends) and should not incur costs during idle time

The team evaluated Azure Kubernetes Service (AKS), Azure Container Apps (ACA), and Azure App Service for Containers as hosting options.

---

### Decision

We will use **Azure Container Apps (ACA)** in Consumption mode as the container hosting platform for both the backend API (cmmc-api) and frontend SPA (cmmc-web).

Specific configuration:
- **Container Apps Environment**: cae-cmmc-assessor-prod (Consumption plan, Canada Central)
- **Backend (cmmc-api)**: 0.5 CPU, 1Gi memory, 0-3 replicas, auto-scale on HTTP concurrency (threshold: 50), Single Active Revision mode
- **Frontend (cmmc-web)**: 0.25 CPU, 0.5Gi memory, 0-3 replicas, auto-scale on HTTP concurrency (threshold: 100), Single Active Revision mode
- **Ingress**: Built-in HTTPS ingress with Azure-managed TLS certificates
- **Deployment**: Container images pushed to Azure Container Registry (acrcmmcassessorprod); deployed via GitHub Actions with Bicep IaC

---

### Alternatives Considered

| # | Option | Pros | Cons |
|---|--------|------|------|
| 1 | **Azure Container Apps (ACA)** -- chosen | Scale-to-zero eliminates idle costs; Consumption pricing (pay per request/CPU-second); built-in HTTPS ingress with auto TLS; no cluster management overhead; built-in auto-scaling; Bicep-native deployment; simple revision management; logs stream to Log Analytics automatically; fastest time-to-production | Less control over networking (no VNet integration in Consumption plan without add-on); limited to HTTP-based scaling triggers in basic mode; fewer deployment strategies (no canary/blue-green natively, though traffic splitting exists); newer service with smaller community compared to AKS |
| 2 | **Azure Kubernetes Service (AKS)** | Full Kubernetes control; mature ecosystem with extensive tooling (Helm, Flux, ArgoCD); complex deployment strategies (canary, blue-green via Flagger); service mesh support; VNet integration; granular network policies; large community; portable to other clouds | Significant operational overhead for a 2-container deployment; requires Kubernetes expertise; no scale-to-zero (minimum 1 system node always running); higher base cost (~$70-150/month for smallest cluster); cluster upgrades, node pool management, and security patching required; overkill for current requirements |
| 3 | **Azure App Service for Containers** | Simplest deployment model; built-in deployment slots for blue-green; auto-scaling; managed TLS; no orchestration knowledge needed | No scale-to-zero (always-on pricing); higher per-unit cost at scale; limited to single-container per app (no sidecar support); less flexible configuration; each container needs its own App Service Plan or shared plan |

---

### Consequences

**What becomes easier or better:**
- Zero idle cost: containers scale to zero during periods of no traffic, dramatically reducing MVP infrastructure costs
- No cluster management: no Kubernetes version upgrades, node pool sizing, or security patching required
- Faster deployments: push image to ACR, update Container App revision via Bicep -- no Helm charts, no kubectl, no manifests
- Simpler monitoring: logs automatically streamed to Log Analytics without configuring Container Insights or Prometheus
- Lower cognitive overhead: team can focus on application development rather than infrastructure operations

**What becomes harder or worse:**
- Limited deployment strategies: no native canary or blue-green deployments (traffic splitting between revisions is available but more basic than Kubernetes-native options)
- Less networking control: cannot easily add VNet integration, private endpoints, or network policies in basic Consumption plan (Workload profiles plan adds this at higher cost)
- Cold start latency: scale-from-zero introduces 5-15 seconds of cold start when the first request arrives after idle period
- If the platform outgrows ACA (e.g., 10+ microservices, complex networking, service mesh needs), migration to AKS would be required

**Risks:**
- Cold start latency degrading user experience: Mitigated by keeping minimum replicas at 0 (acceptable for MVP); can increase to min=1 in production if cold start becomes a problem (at the cost of eliminating scale-to-zero savings)
- ACA feature limitations blocking future requirements: Mitigated by the fact that ACA is rapidly maturing; Workload profiles plan provides VNet integration and dedicated compute if needed; migration to AKS is a well-documented path

---

### Compliance and Security Implications

| Aspect | Implication | Mitigation |
|--------|------------|------------|
| Data Residency | Container Apps Environment must be in Canada Central for data residency compliance | cae-cmmc-assessor-prod deployed to Canada Central region |
| Network Isolation | Consumption plan has limited VNet integration; containers are accessible via public ingress | Application-level security via JWT authentication, tenant isolation middleware, rate limiting, and CORS; Workload profiles plan available if VNet isolation required |
| TLS Termination | TLS is terminated at the Container Apps ingress; traffic between ingress and container is HTTP | Acceptable for current security posture; container runs in Azure-managed infrastructure; no sensitive data exposed between ingress and container within the same environment |
| Container Image Security | Container images could contain vulnerabilities | Docker images built from official Node.js and Nginx base images; GitHub Actions CI can be extended with vulnerability scanning (Trivy); images stored in private ACR |

---

### References

- [Azure Container Apps documentation](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Azure Container Apps pricing](https://azure.microsoft.com/en-us/pricing/details/container-apps/)
- [Azure Container Apps vs AKS comparison](https://learn.microsoft.com/en-us/azure/container-apps/compare-options)
- [Container Apps scaling rules](https://learn.microsoft.com/en-us/azure/container-apps/scale-app)

---

### Approval

| Role | Name | Date | Decision |
|------|------|------|----------|
| Solution Architect | ___________________ | 2026-01-15 | [x] Approve |
| Technical Lead | ___________________ | 2026-01-16 | [x] Approve |
| Engineering Manager | ___________________ | 2026-01-16 | [x] Approve |

---

---

# ADR-002: Use Prisma ORM over Raw SQL for Database Access

## ADR-002: Use Prisma ORM over Raw SQL for Database Access

| **Field**        | **Value**                                                |
|------------------|----------------------------------------------------------|
| ADR Number       | ADR-002                                                  |
| Title            | Use Prisma ORM over Raw SQL for Database Access          |
| Date             | 2026-01-18                                               |
| Status           | `Accepted`                                               |
| Decision Maker   | Solution Architect                                       |
| Consulted        | Technical Lead, Backend Developer                        |
| Informed         | Development Team, Engineering Manager                    |

---

### Context

The CMMC Assessor Platform uses PostgreSQL 17 as its relational database with 22 tables covering tenants, users, assessments, controls, objectives, responses, POA&Ms, policies, audit logs, and token management. The application requires:

- **Type-safe database queries**: The backend is written in TypeScript; database interactions should benefit from TypeScript's type system to catch errors at compile time rather than runtime
- **Multi-tenant query scoping**: Every database query must be scoped to the authenticated tenant's ID to enforce tenant data isolation -- this is a critical security requirement for a CMMC assessment platform handling potentially sensitive CUI data
- **Schema migrations**: The database schema evolves frequently during MVP development; migrations must be version-controlled, repeatable, and deployable via CI/CD
- **Developer productivity**: A small team (1-3 developers) needs to move fast; boilerplate SQL and manual type mapping reduce velocity
- **22-table schema**: The data model is moderately complex with multiple relationships (one-to-many, many-to-many via join tables); an ORM can express these relationships declaratively

The team evaluated Prisma ORM, TypeORM, Knex.js (query builder), and raw SQL with pg (node-postgres) as data access options.

---

### Decision

We will use **Prisma ORM 5.22** as the data access layer for all PostgreSQL interactions.

Specific implementation:
- **Prisma Schema**: Single `schema.prisma` file defining all 22 models as the authoritative schema source of truth
- **Prisma Client**: Auto-generated, fully typed TypeScript client for all database queries
- **Prisma Migrate**: Declarative migration system; `prisma migrate dev` for development, `prisma migrate deploy` for CI/CD production deployments
- **Multi-tenant scoping**: Prisma middleware (or client extensions) automatically inject `tenantId` filter on every query based on the authenticated tenant context from the JWT
- **Seeding**: `prisma db seed` for populating CMMC control reference data and test data

---

### Alternatives Considered

| # | Option | Pros | Cons |
|---|--------|------|------|
| 1 | **Prisma ORM 5.22** -- chosen | Fully typed client auto-generated from schema; declarative schema file as single source of truth; built-in migration system with version control; middleware/extensions enable transparent multi-tenant scoping; excellent TypeScript integration; intuitive query API; strong documentation and community; schema introspection for existing databases; Prisma Studio for data browsing during development | N+1 query risk requires attention; some advanced SQL operations need raw queries (`prisma.$queryRaw`); generated client adds build step; less flexible than raw SQL for complex aggregations; Prisma-specific migration format (not standard SQL migrations, though SQL is generated) |
| 2 | **TypeORM** | Mature ORM with decorator-based entity definitions; supports Active Record and Data Mapper patterns; built-in migration support; good TypeScript support; widely used in Node.js ecosystem | Entity definitions via decorators are verbose; TypeScript types are less precise than Prisma (runtime type mismatches possible); migration generation can be unreliable; less intuitive API than Prisma; multi-tenant scoping requires custom implementation with no built-in middleware pattern; slower development pace compared to Prisma |
| 3 | **Knex.js (Query Builder)** | Lightweight query builder; close to raw SQL with JavaScript fluent API; flexible for complex queries; built-in migration and seeding support; minimal abstraction overhead | No auto-generated types (manual type maintenance); no declarative schema (schema defined in migrations only); multi-tenant scoping requires manual implementation on every query; more boilerplate code; no relationship handling (manual joins) |
| 4 | **Raw SQL with pg (node-postgres)** | Maximum control and flexibility; no abstraction overhead; direct access to all PostgreSQL features; no dependency on ORM | No type safety (manual type assertions everywhere); no schema management (separate migration tool needed); multi-tenant scoping must be manually implemented on every single query (high risk of missing tenantId filter); maximum boilerplate; no relationship mapping; slow development velocity; high risk of SQL injection if not careful |

---

### Consequences

**What becomes easier or better:**
- Multi-tenant isolation becomes systematic: Prisma middleware automatically injects `WHERE tenantId = ?` on every query, eliminating the risk of developers forgetting tenant scoping on individual queries
- Type safety across the stack: TypeScript compiler catches field name typos, missing required fields, and type mismatches at build time
- Schema evolution is declarative and version-controlled: changing the Prisma schema and running `prisma migrate dev` generates the migration SQL automatically
- Onboarding new developers is faster: the Prisma schema file is self-documenting; relationship cardinality is declared explicitly
- Prisma Studio provides a visual database browser for development debugging

**What becomes harder or worse:**
- Complex aggregation queries (e.g., SPRS score calculations across multiple tables) may need raw SQL via `prisma.$queryRaw` or `prisma.$queryRawUnsafe`
- Prisma generates a client library that adds to the build step; regeneration is needed after schema changes (`prisma generate`)
- Some PostgreSQL-specific features (e.g., CTEs, window functions, advanced JSONB operators) require raw queries
- Prisma Migrate does not support automatic down migrations; rollbacks require manual forward migrations

**Risks:**
- N+1 query performance issues: Mitigated by using Prisma's `include` and `select` for eager loading relationships; monitoring query performance in development; acceptable for MVP scale (< 50 concurrent users)
- Prisma middleware affecting query performance: Mitigated by the fact that middleware adds a single `WHERE` clause (tenantId filter); negligible performance impact; benchmarked during development
- Vendor lock-in to Prisma ORM: Mitigated by the fact that Prisma generates standard SQL migrations; the underlying PostgreSQL schema is portable; migration to another ORM or raw SQL is feasible (moderate effort to rewrite query layer)

---

### Compliance and Security Implications

| Aspect | Implication | Mitigation |
|--------|------------|------------|
| Tenant Data Isolation | Prisma middleware is the primary enforcement mechanism for tenant-scoped queries; if middleware fails or is bypassed, cross-tenant data leakage could occur | tenantAuth.ts middleware runs before route handlers; integration tests verify tenant scoping; code review process ensures no raw queries bypass tenant filtering; audit log captures all data access with tenant context |
| SQL Injection | Prisma client uses parameterized queries by default, preventing SQL injection; however, `$queryRaw` and `$queryRawUnsafe` bypass this protection | Code review policy: all uses of `$queryRaw` must use tagged template literals for parameterization; `$queryRawUnsafe` is banned except with explicit security review approval |
| Audit Trail | All entity mutations must be logged in the AuditLog table | Prisma middleware or service-layer wrapper ensures AuditLog entries are created within the same transaction as the entity mutation |
| Data at Rest | Prisma connects to PostgreSQL via SSL; database uses Azure-managed TDE | Connection string includes `sslmode=require`; connection string stored in Azure Key Vault |

---

### References

- [Prisma documentation](https://www.prisma.io/docs)
- [Prisma Client API reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma middleware](https://www.prisma.io/docs/concepts/components/prisma-client/middleware)
- [Multi-tenancy with Prisma](https://www.prisma.io/docs/guides/other/multi-tenancy)

---

### Approval

| Role | Name | Date | Decision |
|------|------|------|----------|
| Solution Architect | ___________________ | 2026-01-18 | [x] Approve |
| Technical Lead | ___________________ | 2026-01-19 | [x] Approve |
| Security Architect | ___________________ | 2026-01-20 | [x] Approve |

---

---

# ADR-003: Use Microsoft Entra ID over Custom Authentication

## ADR-003: Use Microsoft Entra ID over Custom Authentication

| **Field**        | **Value**                                                |
|------------------|----------------------------------------------------------|
| ADR Number       | ADR-003                                                  |
| Title            | Use Microsoft Entra ID over Custom Authentication        |
| Date             | 2026-01-10                                               |
| Status           | `Accepted`                                               |
| Decision Maker   | Solution Architect                                       |
| Consulted        | Technical Lead, Security Architect, Product Owner        |
| Informed         | Development Team, Engineering Manager                    |

---

### Context

The CMMC Assessor Platform is a multi-tenant SaaS application serving defense industrial base (DIB) organizations that are pursuing CMMC certification. The authentication system must meet the following requirements:

- **Enterprise SSO**: Target customers are enterprises with existing identity infrastructure; they expect Single Sign-On (SSO) with their corporate identity provider rather than creating separate credentials
- **Multi-tenant onboarding**: Each customer organization (tenant) needs a streamlined onboarding process that establishes their organization in the platform and allows all their users to authenticate
- **MFA enforcement**: CMMC compliance implies strong authentication; the platform should support or inherit Multi-Factor Authentication (MFA) without implementing it from scratch
- **Microsoft 365 integration**: The platform integrates with Microsoft Graph API for SharePoint evidence management; using Microsoft identity simplifies token acquisition for Graph API calls
- **Admin consent**: Tenant administrators need to grant organizational consent for the application's permissions (Graph API scopes) during onboarding
- **Security posture**: As a CMMC assessment platform, the application itself must demonstrate strong security practices; rolling custom authentication increases the attack surface and maintenance burden

The team evaluated Microsoft Entra ID (OAuth 2.0 / OIDC), Auth0 / Okta (third-party IdP), and custom username/password authentication as options.

---

### Decision

We will use **Microsoft Entra ID** as the primary authentication provider via OAuth 2.0 / OpenID Connect, implemented using the `@azure/msal-node` library.

Specific implementation:
- **Protocol**: OAuth 2.0 Authorization Code Flow with PKCE
- **Client library**: @azure/msal-node 2.15 (confidential client)
- **Tenant onboarding**: Admin consent flow via Entra ID's `/adminconsent` endpoint; creates Tenant record with Entra ID tenant ID
- **User provisioning**: Just-in-time (JIT) user creation on first login; user claims (oid, email, name, tid) extracted from ID token
- **Token strategy**: Backend issues custom JWTs after Entra ID validation; JWT expiry configurable (currently 7 days); refresh tokens with family-based rotation stored in PostgreSQL
- **Graph API tokens**: Acquired via incremental consent; encrypted with AES-256-GCM before storage in PostgreSQL UserToken table
- **Legacy fallback**: Username/password authentication (bcryptjs) retained as a fallback for users who cannot use Entra ID; planned for eventual deprecation
- **MFA**: Inherited from tenant's Entra ID Conditional Access policies; platform does not manage MFA directly

---

### Alternatives Considered

| # | Option | Pros | Cons |
|---|--------|------|------|
| 1 | **Microsoft Entra ID (OAuth 2.0 / OIDC)** -- chosen | Native SSO for enterprise Microsoft customers (the primary target market); admin consent flow enables organizational onboarding; MFA inherited from tenant Conditional Access policies without custom implementation; seamless Graph API token acquisition for SharePoint integration; Microsoft manages identity infrastructure security, patches, and compliance certifications; Entra ID is already trusted by DIB organizations; MSAL library handles token lifecycle (caching, refresh) | Dependency on Microsoft identity platform; complexity of OAuth 2.0 flows (redirects, token exchange, consent); requires Entra ID app registration configuration; multi-tenant app registration requires careful scope and permission management; users without Microsoft accounts need fallback auth |
| 2 | **Auth0 / Okta (Third-party IdP)** | Managed identity platform with extensive SSO integrations; social login support; pre-built UI components; enterprise SSO via SAML/OIDC federation; MFA built-in; compliance certifications (SOC 2, ISO 27001) | Additional SaaS cost (per-user pricing adds up for B2B); adds another third-party dependency; does not natively integrate with Microsoft Graph API (separate token acquisition needed); less seamless experience for Microsoft-centric enterprise customers; tenant onboarding flow requires custom organization management |
| 3 | **Custom Username/Password Authentication** | Full control over authentication flow; no external dependencies; simpler initial implementation; no third-party costs | Must implement MFA from scratch (significant effort); no enterprise SSO; poor UX for enterprise users (yet another set of credentials); security maintenance burden (password policies, brute-force protection, credential stuffing defense, breach monitoring); CMMC-sensitive platform rolling custom auth increases risk perception; Graph API integration requires separate OAuth flow anyway; does not scale to enterprise requirements |

---

### Consequences

**What becomes easier or better:**
- Enterprise customers get SSO with their existing Microsoft identities -- zero friction onboarding for end users
- MFA is inherited for free from tenant Conditional Access policies -- the platform benefits from MFA without implementing it
- Admin consent flow provides a clean, one-click organizational onboarding experience
- Graph API integration (SharePoint evidence management) is seamless because the same identity context is used for both authentication and Graph API token acquisition
- Security posture is strengthened by offloading identity management to Microsoft, which has dedicated security teams, compliance certifications, and automatic security patching
- Tenant isolation is simplified: Entra ID tenant ID (tid claim) naturally maps to platform tenant, providing a reliable trust anchor

**What becomes harder or worse:**
- OAuth 2.0 flow complexity: multiple redirect-based flows (login, admin consent, incremental consent) require careful state management
- Users without Microsoft accounts (e.g., consultants, auditors from non-Microsoft organizations) need the legacy fallback, adding code paths to maintain
- App registration configuration in Entra ID requires understanding of delegated vs. application permissions, consent types, and multi-tenant app settings
- Token management is complex: Entra ID tokens (short-lived), custom JWTs (7-day), refresh tokens (30-day), Graph API tokens (encrypted, stored) -- multiple token types with different lifecycles

**Risks:**
- Entra ID outage preventing all logins: Mitigated by legacy username/password fallback; Entra ID SLA is 99.99% (< 5 minutes downtime/month); legacy auth allows emergency access
- App registration misconfiguration exposing data: Mitigated by following Microsoft's security best practices for multi-tenant app registrations; security review of requested permissions; admin consent limits scope to explicitly approved permissions
- Entra ID client secret expiry breaking authentication: Mitigated by monitoring secret expiry dates; secret rotation documented in operational runbook; planned: automated rotation via Key Vault
- Graph API consent not granted by tenant admin: Mitigated by incremental consent flow; evidence management features gracefully degrade when Graph API permissions are not available

---

### Compliance and Security Implications

| Aspect | Implication | Mitigation |
|--------|------------|------------|
| Authentication Strength | Entra ID enables MFA, Conditional Access, risk-based sign-in policies -- all critical for CMMC-aligned security posture | MFA enforcement is delegated to each tenant's Entra ID Conditional Access policies; platform documentation recommends MFA enforcement for all users |
| Identity Data Residency | User identity data (name, email, object ID) is processed by Microsoft Entra ID global infrastructure, which may involve cross-border data processing | User identity data is limited to name, email, and Entra ID object ID (not CUI); governed by Microsoft's Data Protection Agreement; no CMMC assessment data is sent to Entra ID |
| Admin Consent | Tenant administrators grant application permissions on behalf of their organization; this is a sensitive operation | Requested permissions are minimized (openid, profile, email, User.Read for auth; Sites.ReadWrite.All only via incremental consent for evidence); admin consent prompt clearly lists all requested permissions |
| Token Security | JWTs and Graph API tokens must be protected from theft; compromised tokens could grant unauthorized access | Custom JWTs verified on every request; TokenDenyList enables server-side revocation; refresh tokens use family-based rotation to detect theft; Graph API tokens encrypted at application layer (AES-256-GCM) before database storage; JWT signing key stored in Key Vault |
| Legacy Auth Security | Username/password fallback has inherent risks (credential stuffing, weak passwords) | bcryptjs for password hashing; express-rate-limit for brute-force protection; legacy auth planned for eventual deprecation as Entra ID adoption reaches critical mass; password complexity enforcement via express-validator |

---

### References

- [Microsoft identity platform documentation](https://learn.microsoft.com/en-us/entra/identity-platform/)
- [MSAL Node.js documentation](https://learn.microsoft.com/en-us/entra/msal/node/)
- [Multi-tenant app registration best practices](https://learn.microsoft.com/en-us/entra/identity-platform/howto-convert-app-to-be-multi-tenant)
- [Admin consent flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-admin-consent)
- [Microsoft Graph API permissions reference](https://learn.microsoft.com/en-us/graph/permissions-reference)

---

### Approval

| Role | Name | Date | Decision |
|------|------|------|----------|
| Solution Architect | ___________________ | 2026-01-10 | [x] Approve |
| Technical Lead | ___________________ | 2026-01-11 | [x] Approve |
| Security Architect | ___________________ | 2026-01-12 | [x] Approve |
| Product Owner | ___________________ | 2026-01-12 | [x] Approve |
