# Project Glossary

| **Page Title**   | CMMC Assessor Platform - Project Glossary |
|------------------|-------------------------------------------|
| **Last Updated** | 2026-02-14                                |
| **Status**       | IN PROGRESS                               |
| **Owner**        | IntelliSec Solutions                      |

---

## How to Use This Glossary

This glossary defines terms, acronyms, and abbreviations used throughout the CMMC Assessor Platform project documentation. It is divided into two sections:

1. **Standard Enterprise / Azure / DevOps Terms** -- Pre-populated with common terminology relevant to the platform's Azure infrastructure, CI/CD pipelines, and development practices.
2. **Project-Specific Terms** -- CMMC, NIST, compliance, and platform-specific terms unique to the CMMC Assessor Platform's domain and architecture.

When referencing a term in other documentation pages, link back to this glossary for consistency.

---

## 1. Standard Enterprise / Azure / DevOps Terms

### A

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Azure Active Directory (Entra ID) | AAD | Microsoft's cloud-based identity and access management service, rebranded as Microsoft Entra ID | Primary authentication and authorization provider for the CMMC Assessor Platform; all users authenticate via Entra ID SSO using MSAL Node |
| Azure Blob Storage | ABS | Microsoft's object storage solution for unstructured data | Used for storing generated SSP documents, exported files, and platform assets |
| Azure Container Apps | ACA | Serverless container hosting service on Azure for running microservices and containerized applications | Primary compute platform for hosting the CMMC Assessor Platform frontend and backend containers |
| Azure Container Registry | ACR | Managed Docker container image registry on Azure | Stores container images (Basic tier) for deployment to Azure Container Apps |
| Azure Flexible Server | - | Azure managed database service with zone-redundant high availability and flexible scaling | Hosts PostgreSQL 17 database for the platform (Burstable B1ms tier) |
| Azure Key Vault | AKV | Managed service for storing secrets, keys, and certificates | Stores application secrets, database credentials, encryption keys (including AES-256-GCM keys for SharePoint token encryption) |
| Application Performance Monitoring | APM | Tools and practices for monitoring software application performance and availability | Azure Monitor and Application Insights for platform observability |
| Azure Resource Manager | ARM | Deployment and management layer for Azure resources | Infrastructure provisioned via Bicep templates stored in GitHub |

### B

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Bicep | - | Domain-specific language (DSL) for deploying Azure resources declaratively | Primary IaC language for provisioning all Azure infrastructure (Container Apps, PostgreSQL, Key Vault, ACR, Blob Storage) |
| Branching Strategy | - | Git workflow model defining how branches are created, merged, and protected | GitHub flow used for the CMMCAccessor repository |
| Burstable Tier | - | Azure compute tier that provides a baseline level of CPU performance with the ability to burst above baseline | PostgreSQL Flexible Server runs on B1ms burstable tier to optimize costs |

### C

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Continuous Integration | CI | Practice of automatically building and testing code on every commit or pull request | GitHub Actions workflows triggered on push/PR to the CMMCAccessor repository |
| Continuous Delivery / Continuous Deployment | CD | Practice of automatically deploying validated code to staging or production | GitHub Actions deployment workflows deploy containers to Azure Container Apps |
| CI/CD | - | Combined practice of Continuous Integration and Continuous Delivery/Deployment | End-to-end automation from code commit to Azure Container Apps deployment |
| Container Registry | ACR | Azure Container Registry; managed Docker container image registry | Storing and managing container images for Azure Container Apps (Basic tier) |
| Cookie-Parser | - | Express.js middleware for parsing HTTP cookies | Used for session management and authentication token handling in the backend API |
| Cost Management | - | Azure service for monitoring, allocating, and optimizing cloud spend | Budget monitoring for the ~$35-70 CAD/month MVP infrastructure target |

### D

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Dynamic Application Security Testing | DAST | Security testing performed against a running application to find vulnerabilities | Planned for staging environment as part of penetration testing milestone |
| Disaster Recovery | DR | Strategies and processes for recovering systems after a catastrophic failure | Currently out of scope for MVP; single-region deployment in Canada Central |
| DOCX | - | Microsoft Word Open XML document format | SSP documents are generated in DOCX format using the docx library |

### E

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Environment | ENV | An isolated deployment target (e.g., dev, staging, production) | GitHub Actions environment protection rules for Azure deployments |
| ESM | - | ECMAScript Modules; the standard JavaScript module system using import/export syntax | Backend uses TypeScript with ESM module format |
| Express | - | Minimal and flexible Node.js web application framework | Backend API framework; handles all 68+ API endpoints across 17 route files |
| Express Rate Limit | - | Express middleware for rate limiting HTTP requests | Security control to prevent brute-force and DoS attacks on API endpoints |
| Express Validator | - | Express middleware for input validation and sanitization | Input validation across all API endpoints to prevent injection attacks |

### F-G

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| GitHub Actions | GHA | GitHub's built-in CI/CD and automation platform using YAML workflow files | Primary CI/CD tool; uses OIDC authentication (Workload Identity Federation) to deploy to Azure |
| GitHub Actions Runner | - | The compute agent that executes GitHub Actions workflow jobs | GitHub-hosted runners execute build, test, and deploy pipelines |
| GitHub Environment | - | A deployment target in GitHub with protection rules and secrets | Controls approvals and secrets for Azure Container Apps deployments |

### H-I

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Helmet | - | Express.js middleware that sets various HTTP security headers | Applied to all API responses for security hardening (X-Frame-Options, CSP, HSTS, etc.) |
| Infrastructure as Code | IaC | Managing and provisioning infrastructure through machine-readable definition files | Bicep templates in the CMMCAccessor repository define all Azure resources |

### J-K

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| JSON Web Token | JWT | Compact, URL-safe token format for securely transmitting claims between parties | Used for authentication tokens issued after Entra ID SSO; validated on each API request |
| Key Vault | AKV | Azure Key Vault; managed service for storing secrets, keys, and certificates | Stores database connection strings, Entra ID client secrets, AES-256-GCM encryption keys |

### L

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Least Privilege | - | Security principle granting only the minimum permissions necessary | Applied to Azure RBAC, platform roles (SUPER_ADMIN, SUPPORT, USER), and team roles (OWNER through VIEWER) |
| Lucide Icons | - | Open-source icon library for React applications | Icon set used across the frontend UI for consistent visual design |

### M-N

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Managed Identity | MI | Azure feature that provides automatic identity management for services | Used by Azure Container Apps to access Key Vault and other Azure services without stored credentials |
| Microsoft Graph API | - | Unified API endpoint for accessing Microsoft 365 services | Used for SharePoint evidence management; file upload, download, and listing via delegated permissions |
| MSAL Node | - | Microsoft Authentication Library for Node.js | Server-side library handling OAuth 2.0/OIDC flows with Microsoft Entra ID |
| Minimum Viable Product | MVP | The smallest set of features that delivers value and enables learning | Current phase: 110 practices, SPRS, POA&M, SSP, policies, multi-tenancy |
| Multer | - | Express.js middleware for handling multipart/form-data (file uploads) | Handles evidence file uploads before forwarding to SharePoint via Graph API |

### O-P

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| OAuth 2.0 | - | Industry-standard authorization framework for delegated access | Authorization protocol used with Microsoft Entra ID for user authentication and Graph API access |
| OIDC | - | OpenID Connect; identity layer on top of OAuth 2.0 for authentication | Used with Entra ID for SSO login and with GitHub Actions for OIDC-based Azure authentication |
| ORM | - | Object-Relational Mapping; technique for querying and manipulating databases using object-oriented code | Prisma ORM maps TypeScript types to PostgreSQL tables across 22 models |
| Prisma | - | Next-generation Node.js/TypeScript ORM with type-safe database access | Primary database access layer; schema defines all 22 models; generates typed client |
| Pull Request | PR | A GitHub mechanism for proposing, reviewing, and merging code changes | Required code review gate before merging to main branch in CMMCAccessor |

### R

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| React Query (TanStack) | - | Data-fetching and state management library for React applications | Manages server state, caching, and synchronization for all API calls in the frontend |
| Recharts | - | Composable charting library for React based on D3 | Renders compliance dashboards, SPRS score visualizations, and assessment progress charts |
| Role-Based Access Control | RBAC | Authorization model assigning permissions based on user roles | Platform roles (SUPER_ADMIN, SUPPORT, USER) and team roles (OWNER, ADMIN, ASSESSOR, MEMBER, VIEWER) |
| Recovery Time Objective | RTO | Maximum acceptable time to restore a service after an outage | To be defined; currently no DR strategy for MVP |
| Recovery Point Objective | RPO | Maximum acceptable amount of data loss measured in time | To be defined; PostgreSQL backup strategy to be implemented |

### S

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Static Application Security Testing | SAST | Security testing that analyzes source code for vulnerabilities without executing it | Part of security review; integrated into development workflow |
| Service Principal | SP | An Azure identity used by applications or automation tools to access resources | GitHub Actions authenticates to Azure via OIDC Workload Identity Federation (preferred over SP secrets) |

### T

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Tailwind CSS | - | Utility-first CSS framework for rapidly building custom user interfaces | Primary styling framework for the React frontend |
| TanStack React Query | - | See React Query (TanStack) | Data fetching and caching for frontend API interactions |
| TypeScript | TS | Typed superset of JavaScript that compiles to plain JavaScript | Used for both frontend (React) and backend (Express) development |

### U-V

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| User Acceptance Testing | UAT | Testing performed by business users to validate the system meets requirements | Planned with first client organizations before GA launch |
| Vite | - | Fast frontend build tool and development server for modern web applications | Build tool for the React/TypeScript frontend; provides HMR in development |

### W-Z

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Workload Identity Federation | WIF | Azure feature enabling external identities (like GitHub Actions) to access Azure without storing secrets | Authentication method for GitHub Actions CI/CD pipelines deploying to Azure Container Apps |
| XLSX | - | Microsoft Excel Open XML spreadsheet format | Assessment data exported in XLSX format using the xlsx library |
| YAML | - | Human-readable data serialization format used for configuration files | GitHub Actions workflow definitions, Bicep parameter files |

---

## 2. Project-Specific Terms

### CMMC & Regulatory Terms

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Cybersecurity Maturity Model Certification | CMMC | U.S. Department of Defense framework requiring defense contractors to implement cybersecurity practices at specified maturity levels to protect Federal Contract Information (FCI) and Controlled Unclassified Information (CUI) | The core regulatory framework the platform addresses; specifically CMMC 2.0 Level 2 |
| CMMC 2.0 | - | The revised CMMC framework streamlined to three levels (Foundational, Advanced, Expert), replacing the original five-level CMMC 1.0 model | Platform targets Level 2 (Advanced), which requires compliance with all 110 NIST SP 800-171 practices |
| CMMC Level 2 (Advanced) | - | The CMMC tier requiring implementation of 110 security practices from NIST SP 800-171 Rev 2; required for organizations handling CUI | The specific certification level the platform assesses against; maps to 110 practices across 14 domains with 255 assessment objectives |
| CMMC Accreditation Body (The Cyber AB) | CMMC-AB | The sole authorized accreditation body for the CMMC ecosystem; accredits C3PAOs and certifies assessors | External stakeholder; their standards and guidelines influence platform assessment methodology |
| Controlled Unclassified Information | CUI | Government-created or -owned information that requires safeguarding controls per law, regulation, or policy, but is not classified | The data category CMMC Level 2 is designed to protect; DIB organizations handling CUI must achieve Level 2 |
| CMMC Third-Party Assessment Organization | C3PAO | Organizations accredited by the Cyber AB to conduct official CMMC Level 2 assessments | Future platform integration; currently out of scope; will enable formal assessment coordination |
| Defense Federal Acquisition Regulation Supplement | DFARS | Supplement to the Federal Acquisition Regulation (FAR) specific to the Department of Defense | DFARS 252.204-7012 and 252.204-7021 mandate CMMC compliance for DoD contractors |
| Defense Industrial Base | DIB | The worldwide industrial complex that enables research, development, and production of military weapons systems and components | Primary target market for the platform; includes prime contractors and subcontractors |
| Federal Contract Information | FCI | Information provided by or generated for the government under a contract that is not intended for public release | CMMC Level 1 protects FCI; Level 2 extends protection to CUI |
| National Institute of Standards and Technology | NIST | U.S. federal agency that develops cybersecurity frameworks, standards, and guidelines | Publisher of SP 800-171 and SP 800-171A, which form the basis of CMMC Level 2 |
| NIST SP 800-171 Rev 2 | - | "Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations"; defines 110 security requirements across 14 families | The source standard for all 110 CMMC Level 2 practices implemented in the platform control library |
| NIST SP 800-171A | - | "Assessing Security Requirements for Controlled Unclassified Information"; defines assessment procedures and objectives for each SP 800-171 requirement | Defines the 255 assessment objectives and examination methods used in the platform's objective-level assessment workflow |
| NIST SP 800-172 | - | "Enhanced Security Requirements for Protecting Controlled Unclassified Information"; additional requirements beyond SP 800-171 | Basis for CMMC Level 3 (Expert); out of scope for current platform but planned for future phases |
| Not Full Operational | NFO | Status indicating a CMMC practice is implemented but not yet fully operational or effective | One of the possible assessment statuses for a control or objective in the platform |
| Plan of Action and Milestones | POA&M | A document identifying tasks to be accomplished to resolve security weaknesses, including resources required, milestones, and scheduled completion dates | Core platform feature; generated with risk-based scheduling; includes evidence management via SharePoint |
| Registered Practitioner Organization | RPO | An organization authorized by the Cyber AB to provide CMMC consulting services (non-assessment) | Potential referral partners for the platform |
| Supplier Performance Risk System | SPRS | DoD system where contractors submit self-assessment scores based on NIST SP 800-171 implementation | Platform calculates SPRS scores (range: -203 to 110) based on assessment results; organizations submit scores to SPRS |
| System Security Plan | SSP | A formal document describing the security controls in place for an information system and the organization's approach to implementing NIST SP 800-171 requirements | Platform generates SSP documents in DOCX format following NIST SP 800-171 structure |

### Platform Architecture & Domain Terms

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Assessment | - | A complete CMMC Level 2 evaluation instance for an organization, encompassing all 110 practices and 255 objectives | Top-level entity in the assessment workflow; each tenant can have multiple assessments |
| Assessment Objective | - | A specific, testable criterion derived from NIST SP 800-171A used to determine whether a practice is implemented | The platform supports 255 objectives mapped to 110 practices; each objective can be individually assessed |
| Audit Log | - | A chronological record of all significant actions performed within the platform | Captures user actions, assessment changes, policy updates, and administrative operations for compliance trail |
| Client Tenant | - | A tenant representing an organization being assessed for CMMC compliance | Created by or associated with a Publisher Tenant; the assessed organization's workspace |
| Control | - | A CMMC Level 2 practice (one of 110) derived from NIST SP 800-171 Rev 2 security requirements | Each control belongs to one of 14 security domains and has one or more assessment objectives |
| Control Implementation | - | The documented description of how an organization implements a specific CMMC practice | Stored per control per assessment; includes implementation status, description, and responsible parties |
| Control Response | - | The assessment result for a specific control, including its implementation status and any associated findings | Aggregated from individual objective responses; determines the control's overall compliance status |
| Evidence (POA&M Evidence) | - | Documentation, artifacts, or records uploaded to SharePoint that demonstrate remediation progress for POA&M items | Managed via Microsoft Graph API with AES-256-GCM encrypted SharePoint access tokens |
| Objective Response | - | The assessment result for a specific assessment objective, recording whether the objective is met, not met, or not applicable | Granular assessment data point; rolls up into the parent control response |
| Platform Role | - | A system-wide role assigned to users of the CMMC Assessor Platform: SUPER_ADMIN, SUPPORT, or USER | Controls access to platform-level administrative functions; independent of team roles |
| Policy Library | - | A collection of 14 domain-specific policy templates that organizations can customize, version, and distribute for acknowledgment | One template per CMMC security domain; supports version history and user acknowledgment tracking |
| Policy Version | - | A specific revision of a tenant policy document, maintaining full version history | Enables tracking of policy changes over time; users acknowledge specific versions |
| Publisher Tenant | - | The primary tenant type representing a consulting organization or service provider that manages Client Tenants | Operates the platform on behalf of multiple client organizations; manages assessments and reporting |
| Security Domain | - | One of the 14 CMMC Level 2 security families derived from NIST SP 800-171 (e.g., Access Control, Audit and Accountability, Configuration Management) | Organizational grouping for the 110 practices; each domain has a corresponding policy template |
| SPRS Score | - | A numeric score ranging from -203 to 110 representing an organization's self-assessed compliance with NIST SP 800-171 | Calculated by the platform based on assessment results; each unimplemented practice reduces the score by its weighted value |
| SSP Config | - | Configuration settings for System Security Plan generation, including organization details and system boundaries | Stored per tenant; used to populate the SSP DOCX template with organization-specific information |
| Team Member | - | A user associated with a specific tenant with an assigned team role (OWNER, ADMIN, ASSESSOR, MEMBER, VIEWER) | Controls what actions a user can perform within a specific tenant's assessment workspace |
| Team Role | - | A tenant-scoped role assigned to team members: OWNER, ADMIN, ASSESSOR, MEMBER, or VIEWER | OWNER: full control. ADMIN: manage team and settings. ASSESSOR: perform assessments. MEMBER: view and contribute. VIEWER: read-only |
| Tenant | - | An isolated organizational workspace in the multi-tenant platform; either a Publisher Tenant or Client Tenant | Each tenant has its own assessments, policies, team members, and SharePoint configuration |
| User Token | - | An encrypted record storing a user's SharePoint/Graph API access and refresh tokens | Encrypted with AES-256-GCM; enables delegated access to SharePoint for evidence management |

### CMMC Level 2 Security Domains (14 Domains)

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Access Control | AC | Security domain governing who can access CUI and under what conditions | 22 practices (AC.L2-3.1.1 through AC.L2-3.1.22); largest CMMC Level 2 domain |
| Audit and Accountability | AU | Security domain for creating, protecting, and reviewing audit records | 9 practices covering audit logging, review, and protection |
| Awareness and Training | AT | Security domain ensuring personnel are trained on security responsibilities | 3 practices covering security awareness and role-based training |
| Configuration Management | CM | Security domain for establishing and maintaining baseline configurations | 9 practices for system configuration, change control, and least functionality |
| Identification and Authentication | IA | Security domain for verifying the identity of users, processes, and devices | 11 practices covering authentication mechanisms and identity management |
| Incident Response | IR | Security domain for detecting, reporting, and responding to security incidents | 3 practices covering incident handling, reporting, and testing |
| Maintenance | MA | Security domain for performing timely system maintenance | 6 practices covering system maintenance controls |
| Media Protection | MP | Security domain for protecting system media containing CUI | 4 practices covering media access, marking, storage, and sanitization |
| Personnel Security | PS | Security domain for screening individuals before granting CUI access | 2 practices covering personnel screening and access termination |
| Physical Protection | PE | Security domain for limiting physical access to systems and facilities | 6 practices covering physical access controls and monitoring |
| Risk Assessment | RA | Security domain for assessing and managing organizational risk | 3 practices covering risk assessment and vulnerability scanning |
| Security Assessment | CA | Security domain for assessing and monitoring security controls | 4 practices covering security assessment, monitoring, and system connections |
| System and Communications Protection | SC | Security domain for protecting communications and system boundaries | 16 practices covering network security, encryption, and boundary protection |
| System and Information Integrity | SI | Security domain for identifying, reporting, and correcting system flaws | 7 practices covering flaw remediation, malicious code protection, and monitoring |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-14 | IntelliSec Solutions | Initial draft with standard terms, CMMC/NIST regulatory terms, platform-specific terms, and 14 security domain definitions |
