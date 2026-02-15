# Security Review Checklist

| **Page Title**   | Security Review Checklist - [PROJECT_NAME]  |
|------------------|---------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                                |
| **Status**       | NOT STARTED / IN PROGRESS / COMPLETE        |
| **Owner**        | [SECURITY_LEAD_NAME]                        |
| **Reviewers**    | [REVIEWER_NAMES]                            |
| **Environment**  | Azure ([AZURE_SUBSCRIPTION_NAME])           |

---

## 1. Document Purpose

This checklist provides a comprehensive security review for **[PROJECT_NAME]** across all relevant domains. Each item must be evaluated and marked with a status before the project can pass the Security Review approval gate (Gate 3). Items marked **FAIL** must have a remediation plan with a target date.

---

## 2. Review Summary

| Domain                        | Total Checks | Pass | Fail | N/A | Status                          |
|-------------------------------|-------------|------|------|-----|---------------------------------|
| Authentication & Authorization | --          | --   | --   | --  | NOT STARTED / IN PROGRESS / COMPLETE |
| Network Security               | --          | --   | --   | --  | NOT STARTED / IN PROGRESS / COMPLETE |
| Data Protection                | --          | --   | --   | --  | NOT STARTED / IN PROGRESS / COMPLETE |
| Secret Management              | --          | --   | --   | --  | NOT STARTED / IN PROGRESS / COMPLETE |
| Dependency Security            | --          | --   | --   | --  | NOT STARTED / IN PROGRESS / COMPLETE |
| Code Security                  | --          | --   | --   | --  | NOT STARTED / IN PROGRESS / COMPLETE |
| Container Security             | --          | --   | --   | --  | NOT STARTED / IN PROGRESS / COMPLETE |
| Logging & Audit                | --          | --   | --   | --  | NOT STARTED / IN PROGRESS / COMPLETE |
| Compliance                     | --          | --   | --   | --  | NOT STARTED / IN PROGRESS / COMPLETE |

**Overall Result:** PASS / FAIL / IN PROGRESS

---

## 3. Authentication & Authorization

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 3.1 | Azure AD / Entra ID is the sole identity provider for user authentication | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 3.2 | Multi-Factor Authentication (MFA) is enforced for all user accounts via Conditional Access | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 3.3 | Role-Based Access Control (RBAC) is implemented with least-privilege principle | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 3.4 | RBAC roles are documented and reviewed (no wildcard or overly broad permissions) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 3.5 | Service principals use federated credentials (no client secrets where possible) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 3.6 | Managed Identities are used for Azure service-to-service authentication | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 3.7 | Token lifetime and refresh policies are configured per enterprise standards | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 3.8 | Conditional Access policies block access from non-compliant devices and risky sign-ins | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 3.9 | Admin accounts are protected with Privileged Identity Management (PIM) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 3.10 | API authorization validates scopes/roles on every protected endpoint | | [LINK] | [NAME] | [YYYY-MM-DD] |

---

## 4. Network Security

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 4.1 | Network Security Groups (NSGs) are applied to all subnets with deny-by-default rules | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 4.2 | Private Endpoints are used for all Azure PaaS services (SQL, Storage, Key Vault, etc.) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 4.3 | Web Application Firewall (WAF) is enabled on Azure Front Door or Application Gateway | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 4.4 | WAF is configured with OWASP managed rule sets and custom rules as needed | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 4.5 | Azure DDoS Protection Standard is enabled for public-facing resources | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 4.6 | No public IP addresses are assigned to backend resources (app servers, databases) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 4.7 | DNS resolution uses Azure Private DNS Zones for internal services | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 4.8 | Network traffic flow is documented and matches the approved architecture diagram | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 4.9 | Cross-region / cross-VNET traffic is restricted and justified | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 4.10 | Service endpoints or private endpoints are used instead of public access for storage and databases | | [LINK] | [NAME] | [YYYY-MM-DD] |

---

## 5. Data Protection

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 5.1 | Encryption at rest is enabled for all data stores (Azure SQL TDE, Storage SSE) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 5.2 | Customer-managed keys (CMK) via Azure Key Vault are used where required by policy | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 5.3 | TLS 1.2 or higher is enforced for all data in transit | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 5.4 | Older TLS versions (1.0, 1.1) and insecure cipher suites are disabled | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 5.5 | Data masking or tokenization is applied to sensitive fields in non-production environments | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 5.6 | Personally Identifiable Information (PII) is identified and classified per data classification policy | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 5.7 | Data retention policies are implemented and enforced | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 5.8 | Backup encryption is enabled and backup access is restricted | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 5.9 | Data residency requirements are met (data stays in approved Azure regions) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 5.10 | Database audit logging is enabled for all sensitive data stores | | [LINK] | [NAME] | [YYYY-MM-DD] |

---

## 6. Secret Management

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 6.1 | All application secrets are stored in Azure Key Vault (not in code, config, or environment variables) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 6.2 | No secrets, API keys, or connection strings exist in source code (verified by secret scanning) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 6.3 | No secrets exist in CI/CD pipeline logs or build artifacts | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 6.4 | GitHub secret scanning is enabled on the repository | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 6.5 | Secret rotation schedule is defined and automated where possible | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 6.6 | Key Vault access is restricted to authorized identities only (RBAC, not access policies) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 6.7 | Key Vault soft delete and purge protection are enabled | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 6.8 | Key Vault diagnostic logging is enabled and forwarded to Log Analytics | | [LINK] | [NAME] | [YYYY-MM-DD] |

---

## 7. Dependency Security

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 7.1 | Dependabot is enabled on the GitHub repository for automated dependency updates | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 7.2 | `npm audit` (Node.js) or equivalent shows no critical or high vulnerabilities | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 7.3 | `dotnet list package --vulnerable` (NuGet) shows no critical or high vulnerabilities | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 7.4 | Third-party dependencies are from trusted sources and verified registries | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 7.5 | Software Bill of Materials (SBOM) is generated for the release | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 7.6 | License compliance check has been performed on all dependencies | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 7.7 | Dependency update cadence is defined (e.g., weekly Dependabot PRs reviewed) | | [LINK] | [NAME] | [YYYY-MM-DD] |

---

## 8. Code Security

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 8.1 | SAST (Static Application Security Testing) scan has been executed with no critical findings | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 8.2 | SAST tool used: [CODEQL / SONARQUBE / CHECKMARX / OTHER] | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 8.3 | DAST (Dynamic Application Security Testing) scan has been executed in staging | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 8.4 | Code review includes security-focused review for: input validation, output encoding, SQL injection, XSS | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 8.5 | Error handling does not expose stack traces, internal paths, or sensitive data | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 8.6 | Security-sensitive code paths have unit tests (auth, authorization, crypto) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 8.7 | GitHub Advanced Security (or equivalent) is enabled with code scanning alerts at zero critical | | [LINK] | [NAME] | [YYYY-MM-DD] |

---

## 9. Container Security

> **Applicability:** Mark all items N/A if the project does not use containers.

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 9.1 | Base images are from approved enterprise registry (e.g., MCR, internal ACR) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 9.2 | Container image scanning is integrated into CI/CD (e.g., Trivy, Microsoft Defender for Containers) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 9.3 | No critical or high CVEs exist in the container image | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 9.4 | Containers run as non-root user | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 9.5 | Read-only root filesystem is enforced where possible | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 9.6 | Resource limits (CPU, memory) are defined for all containers | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 9.7 | Network policies restrict pod-to-pod communication (if using AKS) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 9.8 | Container runtime security monitoring is enabled (Microsoft Defender for Containers) | | [LINK] | [NAME] | [YYYY-MM-DD] |

---

## 10. Logging & Audit

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 10.1 | Azure Monitor is configured for all application and infrastructure components | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 10.2 | Log Analytics Workspace is provisioned and receives logs from all services | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 10.3 | Application logging captures authentication events (login, logout, failure) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 10.4 | Application logging captures authorization failures and privilege changes | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 10.5 | Audit trail captures data access and modification events for compliance | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 10.6 | Logs do not contain secrets, tokens, passwords, or full PII | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 10.7 | Log retention period meets compliance requirements (minimum [90 / 365] days) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 10.8 | Security alerts are configured in Microsoft Defender for Cloud | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 10.9 | Alerting is configured for critical security events (e.g., repeated auth failures, privilege escalation) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 10.10 | Log access is restricted to authorized personnel only | | [LINK] | [NAME] | [YYYY-MM-DD] |

---

## 11. Compliance

> **Instructions:** Check all applicable frameworks. Mark N/A for frameworks that do not apply to this project.

| # | Check Item | Status (PASS / FAIL / N/A) | Evidence / Link | Reviewer | Date |
|---|-----------|---------------------------|-----------------|----------|------|
| 11.1 | **SOC 2 Type II** - Controls for security, availability, and confidentiality are documented | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 11.2 | **SOC 2** - Evidence collection is automated or documented for audit readiness | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 11.3 | **ISO 27001** - Information security management controls are implemented per Annex A | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 11.4 | **ISO 27001** - Risk assessment and treatment plan are documented | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 11.5 | **GDPR** - Data processing agreements are in place for personal data (if applicable) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 11.6 | **GDPR** - Right to erasure / data portability is supported (if applicable) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 11.7 | **HIPAA** - PHI is protected per HIPAA Security Rule (if applicable) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 11.8 | **PCI DSS** - Cardholder data is handled per PCI DSS requirements (if applicable) | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 11.9 | Azure Policy assignments enforce organizational compliance baselines | | [LINK] | [NAME] | [YYYY-MM-DD] |
| 11.10 | Microsoft Defender for Cloud secure score is at or above target ([TARGET_SCORE]%) | | [LINK] | [NAME] | [YYYY-MM-DD] |

---

## 12. Remediation Tracker

Items that received a **FAIL** status must be tracked here with a remediation plan.

| Item # | Domain | Finding Description | Severity (Critical / High / Medium / Low) | Remediation Plan | Owner | Target Date | Status |
|--------|--------|--------------------|--------------------------------------------|-----------------|-------|-------------|--------|
| [#]    | [DOMAIN] | [DESCRIPTION]    | [SEVERITY]                                 | [PLAN]          | [NAME] | [YYYY-MM-DD] | NOT STARTED / IN PROGRESS / COMPLETE |

---

## 13. Sign-Off

| Name               | Role                  | Result (PASS / FAIL) | Date         |
|--------------------|-----------------------|----------------------|--------------|
| [SECURITY_LEAD]    | Security Lead         |                      | [YYYY-MM-DD] |
| [REVIEWER_1]       | Security Engineer     |                      | [YYYY-MM-DD] |
| [REVIEWER_2]       | [ROLE]                |                      | [YYYY-MM-DD] |
| [PROJECT_MANAGER]  | Project Manager       |                      | [YYYY-MM-DD] |
