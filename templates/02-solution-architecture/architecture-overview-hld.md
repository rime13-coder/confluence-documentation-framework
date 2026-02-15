# Architecture Overview - High-Level Design (HLD)

| **Metadata**     | **Value**                                      |
|------------------|------------------------------------------------|
| Page Title       | CMMC Assessor Platform - Architecture Overview (HLD) |
| Last Updated     | 2026-02-14                                     |
| Status           | `DRAFT`                                        |
| Owner            | Solution Architect                             |
| Reviewers        | Technical Lead, Security Architect, Engineering Manager |
| Version          | 0.1                                            |

---

## 1. Document Purpose

This document describes the high-level architecture for the **CMMC Assessor Platform**. It establishes the architectural vision, guiding principles, technology choices, and Azure service mappings that govern the solution design. This document serves as the authoritative reference for all stakeholders involved in design, development, and operations.

---

## 2. Architecture Vision

The CMMC Assessor Platform is a multi-tenant SaaS application designed to streamline Cybersecurity Maturity Model Certification (CMMC) assessment workflows for defense industrial base organizations. The architecture delivers a cloud-native, cost-efficient platform on Microsoft Azure that prioritizes tenant data isolation, secure handling of Controlled Unclassified Information (CUI), and seamless integration with Microsoft 365 ecosystems via Entra ID and Graph API. The system is built for operational simplicity as an MVP, using serverless-like container hosting with scale-to-zero capabilities to minimize costs while maintaining the ability to scale horizontally under load.

---

## 3. Guiding Principles

| # | Principle | Rationale |
|---|-----------|-----------|
| 1 | Cloud-Native First | Leverage Azure PaaS and serverless-adjacent services (Container Apps) to reduce operational overhead and accelerate delivery. |
| 2 | Automation Everywhere | All infrastructure, deployments, and testing are automated via GitHub Actions CI/CD with OIDC authentication and Bicep IaC. |
| 3 | Security by Design | Security controls are embedded at every layer -- Entra ID authentication, tenant isolation middleware, AES-256-GCM token encryption, JWT deny lists, and RBAC enforcement. |
| 4 | Tenant Data Isolation | Every database query is scoped to the authenticated tenant via Prisma ORM middleware, ensuring no cross-tenant data leakage. |
| 5 | Simplicity for MVP | Favor simpler architectures (monolithic API, synchronous REST, client-side caching) over premature complexity (microservices, message brokers, distributed caching). |
| 6 | Microsoft Ecosystem Alignment | Leverage Microsoft Entra ID, Graph API, and SharePoint to meet enterprise customer expectations and reduce custom authentication/storage development. |
| 7 | Cost Optimization | Use scale-to-zero Container Apps, burstable database SKUs, and consumption-based pricing to keep MVP costs low while preserving scalability options. |

---

## 4. System Context Diagram (C4 Level 1)

<!-- Insert diagram here using draw.io/Lucidchart -->
<!--
    C4 Level 1 - System Context Diagram
    Show:
    - CMMC Assessor Platform as the central system
    - User personas (Assessors, Team Members, Platform Admins)
    - External systems (Microsoft Entra ID, Microsoft Graph API / SharePoint, GoDaddy DNS)
-->

| Actor / External System | Description | Interaction |
|--------------------------|-------------|-------------|
| CMMC Assessor | Primary user who conducts CMMC assessments, scores controls, manages POA&Ms, and generates SSP documents | Accesses React SPA via HTTPS; authenticates through Microsoft Entra ID |
| Team Member (OWNER, ADMIN, MEMBER, VIEWER) | Invited collaborators within a tenant who participate in assessments with role-based permissions | Accesses React SPA via HTTPS; invited via tenant invitation flow |
| Platform Administrator (SUPER_ADMIN, SUPPORT) | System-wide administrators who manage tenants, users, and platform operations | Accesses admin features via the same SPA with elevated platform roles |
| Microsoft Entra ID | Identity provider for OAuth 2.0 / OIDC authentication and admin consent flows | HTTPS -- OAuth 2.0 authorization code flow with PKCE; admin consent for tenant onboarding |
| Microsoft Graph API (SharePoint) | Evidence document storage and retrieval via SharePoint document libraries | HTTPS REST -- upload, download, preview, and delete evidence files using delegated and application permissions |
| GoDaddy DNS | DNS provider for custom domain CNAME records | Manual configuration -- CNAME records pointing custom domains to Azure Container Apps |

---

## 5. Container Diagram (C4 Level 2)

<!-- Insert diagram here using draw.io/Lucidchart -->
<!--
    C4 Level 2 - Container Diagram
    Show:
    - React SPA (frontend container)
    - Node.js/Express API (backend container)
    - PostgreSQL database
    - Azure Blob Storage
    - External services (Entra ID, Graph API)
-->

| Container | Description | Technology | Azure Service |
|-----------|-------------|------------|---------------|
| cmmc-web (Frontend SPA) | Single-page application serving the assessor UI, dashboard, assessment workflows, SPRS scoring, policy management, and SSP generation | React 18.3, TypeScript 5.6, Vite 5.4, Tailwind CSS 3.4, TanStack React Query 5.59, Recharts 2.13, React Router 6.27 | Azure Container Apps (Nginx-served static files, 0.25 CPU / 0.5Gi) |
| cmmc-api (Backend API) | RESTful API handling authentication, tenant management, assessments, controls, objectives, scoring, POA&M, policies, SSP generation, and evidence management | Node.js 20, Express 4.21, TypeScript 5.6 (ESM), Prisma 5.22, @azure/msal-node 2.15, jsonwebtoken, helmet, express-rate-limit, express-validator | Azure Container Apps (0.5 CPU / 1Gi) |
| PostgreSQL Database | Relational data store for all tenant data, user accounts, assessments, controls, policies, audit logs, and token management (22 tables) | PostgreSQL 17 via Prisma ORM | Azure Database for PostgreSQL Flexible Server (B1ms, 1 vCore, 2GB) |
| Azure Blob Storage | File storage for uploaded evidence documents and generated exports | Azure Blob Storage (Standard_LRS) | Azure Storage Account (stcmmcassessorprod) |
| Azure Key Vault | Centralized secrets management for database credentials, JWT signing keys, MSAL client secrets, and encryption keys | Azure Key Vault | Azure Key Vault (kv-cmmc-assessor-prod, Standard) |

---

## 6. Technology Stack

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Frontend Framework** | React | 18.3.1 | Component-based UI, large ecosystem, strong TypeScript support, team expertise |
| **Frontend Language** | TypeScript | 5.6 | Static type safety, improved developer experience, catch errors at compile time |
| **Frontend Build** | Vite | 5.4 | Fast HMR, modern ESM-based bundling, superior DX over Webpack |
| **Frontend Styling** | Tailwind CSS | 3.4 | Utility-first CSS, rapid UI development, consistent design system, small bundle with purging |
| **Client State / Caching** | TanStack React Query | 5.59 | Server state management, automatic cache invalidation, background refetching, reduces custom state management code |
| **Charting** | Recharts | 2.13 | React-native charting library for SPRS score visualizations, assessment dashboards |
| **Routing** | React Router | 6.27 | Standard React routing solution, nested routes, layout routes, protected route patterns |
| **Icons** | Lucide React | Latest | Lightweight, tree-shakable icon set with consistent styling |
| **HTTP Client** | Axios | Latest | Request/response interceptors for JWT token attachment and refresh, consistent error handling |
| **Backend Runtime** | Node.js | 20 LTS | Non-blocking I/O suitable for API workloads, JavaScript/TypeScript ecosystem alignment with frontend |
| **Backend Framework** | Express | 4.21 | Minimal, flexible HTTP framework with extensive middleware ecosystem |
| **Backend Language** | TypeScript (ESM) | 5.6 | Type safety across full stack, ESM module system for modern imports |
| **ORM** | Prisma | 5.22 | Type-safe database client, declarative schema, automated migrations, multi-tenant query scoping via middleware |
| **Authentication Library** | @azure/msal-node | 2.15 | Official Microsoft library for Entra ID OAuth 2.0 / OIDC integration |
| **JWT Handling** | jsonwebtoken | 9.0 | Industry-standard JWT signing and verification |
| **API Security** | helmet + express-rate-limit | 8.1 / 8.2 | HTTP security headers (helmet) and rate limiting to prevent abuse |
| **Input Validation** | express-validator | 7.2 | Request validation middleware with sanitization |
| **Document Generation** | docx | 9.5 | Programmatic DOCX generation for System Security Plan (SSP) export |
| **Spreadsheet** | xlsx | Latest | Excel import/export for assessment data and evidence tracking |
| **File Upload** | multer | 2.0 | Multipart form data handling for evidence file uploads |
| **Database** | PostgreSQL | 17 | Mature relational database, strong data integrity, JSONB support, Azure Flexible Server managed service |
| **Container Hosting** | Azure Container Apps | Consumption | Serverless containers with scale-to-zero, simpler than AKS, built-in ingress, auto-scaling |
| **Container Registry** | Azure Container Registry | Basic | Private Docker image storage, integrated with Container Apps |
| **CI/CD** | GitHub Actions | N/A | Native GitHub integration, OIDC federation to Azure (no stored credentials), Bicep IaC deployment |
| **IaC** | Bicep | Latest | Azure-native, declarative, first-class ARM template compilation, simpler than Terraform for Azure-only workloads |
| **Logging** | Azure Log Analytics | PerGB2018 | Centralized log aggregation from Container Apps, 30-day retention |

---

## 7. Key Architectural Patterns

| Pattern | Where Applied | Description |
|---------|---------------|-------------|
| Multi-Tenant SaaS | Entire application | Shared application instances with tenant data isolation enforced at the ORM query layer via Prisma middleware; every database query is scoped to the authenticated tenant's ID |
| Layered / MVC Architecture | Backend API (cmmc-api) | Express routes delegate to controller functions, which call service layer logic, which interact with Prisma repositories; separation of concerns without microservice overhead |
| Single-Page Application (SPA) | Frontend (cmmc-web) | React SPA with client-side routing via React Router; API calls managed through Axios with TanStack React Query for caching and state management |
| Token-Based Authentication | Authentication layer | JWT access tokens issued after Entra ID OAuth flow; refresh tokens stored in DB with family-based rotation detection; JWT deny list for server-side revocation |
| Synchronous REST API | All API communication | All 68+ endpoints are synchronous HTTP REST; no message broker or event-driven patterns; appropriate for current scale and complexity |
| Role-Based Access Control (RBAC) | Authorization layer | Two-tier RBAC: platform roles (SUPER_ADMIN, SUPPORT, USER) and team roles (OWNER, ADMIN, ASSESSOR, MEMBER, VIEWER); enforced via Express middleware |
| Middleware Pipeline | Backend request processing | Express middleware chain: CORS, helmet, rate limiting, cookie parsing, JWT verification, tenant isolation, role authorization, request validation, error handling |
| Repository Pattern (via ORM) | Data access layer | Prisma ORM acts as the repository layer with typed queries, automatic tenant scoping, and migration-based schema management |

---

## 8. Cross-Cutting Concerns

### 8.1 Authentication and Authorization

| Aspect | Approach |
|--------|----------|
| Identity Provider | Microsoft Entra ID (Azure AD) -- primary; legacy username/password as fallback |
| Authentication Protocol | OAuth 2.0 Authorization Code Flow with PKCE (via OIDC) for Entra ID; JWT-based session management |
| Token Format | Custom JWTs issued by the backend after Entra ID validation; configurable expiry (currently 7 days) |
| Refresh Token Strategy | Refresh tokens stored in PostgreSQL with token family rotation detection; compromised family triggers full revocation |
| API Authorization | Two-tier RBAC enforced at middleware level: platform roles (SUPER_ADMIN, SUPPORT, USER) and team roles (OWNER, ADMIN, ASSESSOR, MEMBER, VIEWER) |
| Tenant Isolation | tenantAuth.ts middleware extracts tenant context from JWT and injects scoped Prisma client; all queries automatically filtered by tenantId |
| Service-to-Service Auth | Backend authenticates to Microsoft Graph API using MSAL confidential client with client credentials; tokens encrypted with AES-256-GCM before database storage |
| MFA Requirement | Inherited from Microsoft Entra ID tenant policies; platform does not manage MFA directly but relies on Entra ID Conditional Access |
| Server-Side Logout | JWT deny list (TokenDenyList table) enables immediate token revocation without waiting for expiry |

### 8.2 Logging

| Aspect | Approach |
|--------|----------|
| Logging Framework | Console-based structured logging from Container Apps, aggregated by Azure Log Analytics |
| Log Sink | Azure Log Analytics Workspace (log-cmmc-assessor-prod) |
| Log Format | Container Apps stdout/stderr captured as ContainerAppConsoleLogs |
| Log Levels | Error, Warning, Info, Debug |
| PII Handling | User emails and names appear in audit logs by design (required for CMMC audit trail); no payment card data in the system |
| Retention | 30 days in Log Analytics (current); to be reviewed for compliance requirements |
| Audit Logging | Dedicated AuditLog table in PostgreSQL capturing entity changes, actor identity, timestamps, and change details for compliance |

### 8.3 Monitoring and Observability

| Aspect | Approach |
|--------|----------|
| APM Tool | Azure Log Analytics with Container Apps built-in metrics |
| Metrics | Container Apps system metrics (CPU, memory, request count, response time); custom application metrics via structured logging |
| Distributed Tracing | Not yet implemented; planned for future phases |
| Dashboards | Azure Portal Container Apps overview dashboard; Log Analytics queries for custom views |
| Alerting | To be configured via Azure Monitor Alerts (planned) |
| Health Checks | Container Apps built-in health probes |
| SLI/SLO Tracking | Not yet formalized; target availability > 99.5% for production |

### 8.4 Configuration Management

| Aspect | Approach |
|--------|----------|
| Application Configuration | Environment variables injected into Container Apps at deployment time |
| Feature Flags | Not currently implemented; feature toggling managed via deployment branches |
| Environment-Specific Config | Managed via Bicep IaC parameters per environment; secrets referenced from Key Vault |
| Configuration Refresh | Requires container restart for env var changes; Key Vault secret references refreshed on container restart |

### 8.5 Secret Management

| Aspect | Approach |
|--------|----------|
| Secret Store | Azure Key Vault (kv-cmmc-assessor-prod) |
| Access Method | Container Apps secret references to Key Vault; OIDC federation for GitHub Actions CI/CD |
| Secret Rotation | Manual rotation currently; automated rotation planned as part of security remediation |
| CI/CD Secrets | GitHub Actions OIDC federation to Azure -- no stored credentials for deployment; GitHub repository secrets for build-time values |
| Local Development | .env files (gitignored) for local configuration |
| Graph API Tokens | Microsoft Graph API access/refresh tokens encrypted with AES-256-GCM before storage in PostgreSQL UserToken table |

---

## 9. Azure Services Mapping

| Component | Azure Service | SKU / Tier | Region | Justification |
|-----------|--------------|------------|--------|---------------|
| Backend API | Azure Container Apps (cmmc-api) | Consumption (0.5 CPU, 1Gi memory) | Canada Central | Serverless containers with scale-to-zero; auto-scaling 0-3 replicas based on HTTP concurrency (50); Single Active Revision mode; simpler and cheaper than AKS for MVP |
| Frontend SPA | Azure Container Apps (cmmc-web) | Consumption (0.25 CPU, 0.5Gi memory) | Canada Central | Nginx-served static React build; auto-scaling 0-3 replicas based on HTTP concurrency (100); co-located with backend in same Container Apps Environment |
| Container Hosting Environment | Azure Container Apps Environment (cae-cmmc-assessor-prod) | Consumption | Canada Central | Shared hosting environment for frontend and backend containers; managed networking and observability |
| Container Registry | Azure Container Registry (acrcmmcassessorprod) | Basic | Canada Central | Private Docker image storage for frontend and backend images; integrated with Container Apps for deployment |
| Relational Database | Azure Database for PostgreSQL Flexible Server (psql-cmmc-assessor-prod) | B1ms (1 vCore, 2GB RAM) | Canada Central | Managed PostgreSQL 17; burstable SKU appropriate for MVP traffic; automated backups; Prisma ORM compatibility |
| Secret Management | Azure Key Vault (kv-cmmc-assessor-prod) | Standard | Canada Central | Centralized secret storage for database connection strings, JWT signing keys, MSAL client secrets, encryption keys |
| File Storage | Azure Storage Account (stcmmcassessorprod) | Standard_LRS | Canada Central | Evidence file storage; locally redundant storage sufficient for MVP (upgrade to GRS planned) |
| Logging and Monitoring | Azure Log Analytics (log-cmmc-assessor-prod) | PerGB2018 | Canada Central | Centralized log aggregation from Container Apps; 30-day retention; KQL query support for troubleshooting |

---

## 10. Quality Attribute Requirements

| Quality Attribute | Requirement | How Achieved |
|-------------------|-------------|--------------|
| **Performance** | API response time P95 < 1s for standard CRUD operations; dashboard aggregations < 3s | Prisma query optimization, TanStack React Query client-side caching, efficient PostgreSQL indexes |
| **Scalability** | Support up to 50 concurrent assessors in MVP phase; scale to 200+ with SKU upgrades | Container Apps auto-scaling 0-3 replicas based on HTTP concurrency thresholds; PostgreSQL SKU upgrade path (B1ms to GP-tier) |
| **Availability** | 99.5% uptime target for production | Azure Container Apps managed infrastructure with automatic health checks and restart; PostgreSQL Flexible Server with automated failover capability |
| **Security** | Tenant data isolation, CUI-appropriate handling, CMMC-aligned security controls | Prisma middleware tenant scoping, Entra ID authentication with inherited MFA, AES-256-GCM token encryption, JWT deny list, helmet security headers, express-rate-limit, input validation via express-validator |
| **Maintainability** | Single codebase deployable by small team; new developers productive within 1 week | Monorepo structure, TypeScript full stack, Prisma schema as single source of truth for data model, Bicep IaC, automated CI/CD |
| **Reliability** | No data loss for assessment data; graceful error handling for Graph API failures | PostgreSQL automated backups (7-day PITR, upgrading to 35-day), Express error middleware with consistent error responses, Axios interceptors for token refresh |
| **Compliance** | CMMC assessment platform must demonstrate security practices consistent with CMMC Level 2 | Audit logging (AuditLog table), RBAC enforcement, data encryption at rest and in transit, tenant isolation, evidence management via SharePoint integration |
| **Data Residency** | All data must reside within Canada | All Azure services deployed to Canada Central region; no cross-border data transfer except to Microsoft Entra ID and Graph API (governed by Microsoft DPA) |

---

## 11. Constraints

| # | Constraint | Impact |
|---|-----------|--------|
| 1 | All Azure resources must be deployed to Canada Central region for data residency compliance | Limits service availability to Canada Central offerings; some Azure preview features may not be available |
| 2 | Must integrate with Microsoft Entra ID for enterprise SSO; no custom identity store for primary auth | Architecture depends on Microsoft identity platform; requires admin consent flow for tenant onboarding |
| 3 | MVP budget constrains infrastructure to burstable/consumption SKUs | Database limited to B1ms (1 vCore, 2GB); Container Apps on consumption plan; no Redis cache or CDN |
| 4 | Small development team (1-3 developers) | Favors monolithic architecture over microservices; limits operational complexity tolerance; single repository for backend and frontend |
| 5 | SharePoint is the mandated evidence storage platform (client requirement) | Requires Microsoft Graph API integration with incremental consent; evidence management depends on SharePoint availability and permissions |
| 6 | 47 security findings identified (4 Critical, 10 High) requiring remediation over 6 months | Architecture decisions must account for security hardening roadmap; some features deferred pending security fixes |

---

## 12. Assumptions

| # | Assumption | If Invalid |
|---|-----------|------------|
| 1 | Microsoft Entra ID is the primary identity provider for all production users | Legacy username/password auth exists as fallback; if Entra ID is not available, assess migration strategy for legacy accounts |
| 2 | Peak concurrent usage will not exceed 50 users in Year 1 | PostgreSQL B1ms SKU and Container Apps 0-3 replica scaling may be insufficient; upgrade to GP-tier database and increase max replicas |
| 3 | SharePoint document libraries are pre-provisioned by tenant administrators before evidence upload | If not, the application must guide users through SharePoint site creation or provide alternative evidence storage |
| 4 | The team has production experience with Node.js, TypeScript, React, and PostgreSQL | If not, additional training and ramp-up time required; architecture choices may need revisiting |
| 5 | Tenants will onboard via Microsoft Entra ID admin consent flow | If tenants cannot grant admin consent (restrictive IT policies), alternative onboarding flows needed |
| 6 | Single-region deployment (Canada Central) is sufficient; no DR failover to secondary region required for MVP | If regional failover is required, architecture must add geo-redundant database, multi-region Container Apps, and traffic manager |

---

## 13. Approval and Sign-Off

| Role | Name | Date | Signature / Approval |
|------|------|------|----------------------|
| Solution Architect | ___________________ | __________ | [ ] Approved |
| Technical Lead | ___________________ | __________ | [ ] Approved |
| Security Architect | ___________________ | __________ | [ ] Approved |
| Engineering Manager | ___________________ | __________ | [ ] Approved |
| Product Owner | ___________________ | __________ | [ ] Approved |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-14 | Solution Architect | Initial draft |
