# Project Glossary

| **Page Title**   | [PROJECT_NAME] - Project Glossary |
|------------------|-----------------------------------|
| **Last Updated** | [YYYY-MM-DD]                      |
| **Status**       | IN PROGRESS                       |
| **Owner**        | [OWNER_NAME]                      |

---

## How to Use This Glossary

This glossary defines terms, acronyms, and abbreviations used throughout the project documentation. It is divided into two sections:

1. **Standard Enterprise / Azure / DevOps Terms** -- Pre-populated with common terminology. Remove entries that are not relevant to your project.
2. **Project-Specific Terms** -- Add terms unique to your project's domain, product, or organization.

When referencing a term in other documentation pages, link back to this glossary for consistency.

---

## 1. Standard Enterprise / Azure / DevOps Terms

### A

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Azure Active Directory (Entra ID) | AAD | Microsoft's cloud-based identity and access management service, rebranded as Microsoft Entra ID | Authentication and authorization for Azure resources and applications |
| Azure Kubernetes Service | AKS | Managed Kubernetes container orchestration service on Azure | Hosting containerized application workloads |
| Application Gateway | AG | Azure Layer 7 load balancer with WAF capabilities | Ingress routing, SSL termination, web application firewall |
| Application Performance Monitoring | APM | Tools and practices for monitoring software application performance and availability | Azure Monitor, Application Insights integration |
| Architecture Review Board | ARB | Governance body that reviews and approves solution architecture designs | Required approval gate before development begins |
| Azure DevOps | ADO | Microsoft's suite of DevOps tools (Boards, Repos, Pipelines, Artifacts, Test Plans) | May be used alongside GitHub for work item tracking or artifact management |
| Azure Resource Manager | ARM | Deployment and management layer for Azure resources | Infrastructure provisioning via ARM templates or Bicep |

### B

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Bicep | - | Domain-specific language (DSL) for deploying Azure resources declaratively | Preferred IaC language for Azure ARM deployments |
| Blue-Green Deployment | - | Deployment strategy using two identical environments to reduce downtime | Zero-downtime release strategy in Azure |
| Branching Strategy | - | Git workflow model defining how branches are created, merged, and protected | GitHub flow, GitFlow, or trunk-based development |

### C

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Change Advisory Board | CAB | Governance body that reviews and approves changes to production environments | Required approval before production deployments |
| Continuous Integration | CI | Practice of automatically building and testing code on every commit or pull request | GitHub Actions workflows triggered on push/PR |
| Continuous Delivery / Continuous Deployment | CD | Practice of automatically deploying validated code to staging or production | GitHub Actions deployment workflows to Azure |
| CI/CD | - | Combined practice of Continuous Integration and Continuous Delivery/Deployment | End-to-end automation from code commit to production |
| Container Registry | ACR | Azure Container Registry; managed Docker container image registry | Storing and managing container images for AKS or App Service |
| Cost Management | - | Azure service for monitoring, allocating, and optimizing cloud spend | Budget alerts, resource tagging, cost analysis |

### D

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Dynamic Application Security Testing | DAST | Security testing performed against a running application to find vulnerabilities | Integrated into CI/CD pipeline or run in staging |
| Deployment Slot | - | Azure App Service feature allowing staging deployments with slot swaps | Zero-downtime deployments via slot swap |
| Disaster Recovery | DR | Strategies and processes for recovering systems after a catastrophic failure | Azure Site Recovery, geo-redundant storage, multi-region |

### E

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Environment | ENV | An isolated deployment target (e.g., dev, staging, UAT, production) | GitHub Actions environment protection rules |
| Epic | - | A large body of work that can be broken into smaller user stories | Top-level work item in agile project tracking |

### F-G

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Feature Flag | - | A technique to enable or disable features at runtime without deploying new code | Controlled rollouts, A/B testing |
| GitHub Actions | GHA | GitHub's built-in CI/CD and automation platform using YAML workflow files | Primary CI/CD tool for build, test, and deploy pipelines |
| GitHub Actions Runner | - | The compute agent that executes GitHub Actions workflow jobs | GitHub-hosted or self-hosted runners for pipeline execution |
| GitHub Environment | - | A deployment target in GitHub with protection rules and secrets | Controls approvals and secrets for Azure deployments |

### H-I

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Horizontal Pod Autoscaler | HPA | Kubernetes feature that scales pod replicas based on CPU/memory or custom metrics | Auto-scaling workloads in AKS |
| Infrastructure as Code | IaC | Managing and provisioning infrastructure through machine-readable definition files | Terraform, Bicep, or ARM templates stored in GitHub |
| Integration Testing | - | Testing that verifies interactions between components or services | Automated in CI/CD pipeline after unit tests |

### K-L

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Key Vault | AKV | Azure Key Vault; managed service for storing secrets, keys, and certificates | Secure secret management for applications and pipelines |
| Least Privilege | - | Security principle granting only the minimum permissions necessary | Applied to Azure RBAC roles and GitHub Actions permissions |
| Log Analytics Workspace | LAW | Azure Monitor component for collecting and querying log data | Centralized logging for Azure resources and applications |

### M-N

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Managed Identity | MI | Azure feature that provides automatic identity management for services | Eliminates credential storage; used for service-to-service auth |
| Minimum Viable Product | MVP | The smallest set of features that delivers value and enables learning | First production release scope |
| Non-Functional Requirements | NFR | Requirements specifying system qualities (performance, security, availability) | SLAs, response times, uptime targets |

### O-P

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Observability | - | The ability to understand a system's internal state from its external outputs (logs, metrics, traces) | Azure Monitor, Application Insights, Grafana |
| Pull Request | PR | A GitHub mechanism for proposing, reviewing, and merging code changes | Required code review gate before merging to main |
| Policy as Code | PaC | Defining governance and compliance policies as version-controlled code | Azure Policy, OPA/Gatekeeper for AKS |

### R

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Role-Based Access Control | RBAC | Authorization model assigning permissions based on user roles | Azure RBAC for resource access; GitHub team permissions |
| Recovery Time Objective | RTO | Maximum acceptable time to restore a service after an outage | Defined in SLA; drives DR architecture decisions |
| Recovery Point Objective | RPO | Maximum acceptable amount of data loss measured in time | Defines backup frequency and replication strategy |
| Runbook | - | Documented procedure for operating, troubleshooting, or recovering a system | Stored in Confluence or repository; referenced during incidents |

### S

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Static Application Security Testing | SAST | Security testing that analyzes source code for vulnerabilities without executing it | Integrated into GitHub Actions CI pipeline |
| Software Composition Analysis | SCA | Automated identification of open-source components and known vulnerabilities | Dependabot, Snyk, or similar in GitHub Actions |
| Service Level Agreement | SLA | Contractual commitment defining uptime, response time, and support guarantees | Azure SLAs for services; project SLAs for stakeholders |
| Service Level Objective | SLO | Internal target for service reliability, stricter than the external SLA | Operational targets the team aims to meet |
| Service Level Indicator | SLI | A quantitative measure of a specific aspect of service reliability | Latency p99, error rate, availability percentage |
| Service Principal | SP | An Azure identity used by applications or automation tools to access resources | GitHub Actions authenticates to Azure via service principal or workload identity |
| Sprint | - | A fixed time period (typically 1-4 weeks) during which a set of work is completed | Agile iteration cadence for development |

### T

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Terraform | TF | Open-source IaC tool by HashiCorp for provisioning cloud infrastructure | Alternative to Bicep for multi-cloud or complex Azure provisioning |
| Trunk-Based Development | TBD | Branching strategy where developers merge small, frequent changes to the main branch | Common strategy for CI/CD with GitHub Actions |

### U-V

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| User Acceptance Testing | UAT | Testing performed by business users to validate the system meets requirements | Final test phase before production go-live |
| Virtual Network | VNet | Azure isolated network for securely connecting Azure resources | Network segmentation, private endpoints, NSGs |

### W-Z

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| Web Application Firewall | WAF | Azure security service that protects web applications from common exploits | Deployed with Application Gateway or Azure Front Door |
| Workload Identity Federation | WIF | Azure feature enabling external identities (like GitHub Actions) to access Azure without storing secrets | Preferred authentication method for GitHub Actions to Azure |
| YAML | - | Human-readable data serialization format used for configuration files | GitHub Actions workflow definitions, Kubernetes manifests, Bicep parameter files |

---

## 2. Project-Specific Terms

Add terms, acronyms, and domain-specific language unique to this project below.

| Term | Acronym | Definition | Context / Usage |
|------|---------|------------|-----------------|
| [TERM] | [ACRONYM] | [DEFINITION] | [CONTEXT] |
| [TERM] | [ACRONYM] | [DEFINITION] | [CONTEXT] |
| [TERM] | [ACRONYM] | [DEFINITION] | [CONTEXT] |
| [TERM] | [ACRONYM] | [DEFINITION] | [CONTEXT] |
| [TERM] | [ACRONYM] | [DEFINITION] | [CONTEXT] |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | [YYYY-MM-DD] | [AUTHOR] | Initial draft with standard terms |
