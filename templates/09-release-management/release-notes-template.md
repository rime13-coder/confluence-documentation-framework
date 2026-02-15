# Release Notes

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Release Notes -- [VERSION NUMBER]  |
| Last Updated     | 2026-02-14                         |
| Status           | Template                           |
| Owner            | IntelliSec Solutions               |

---

## 1. Release Metadata

| Attribute                | Value                                              |
|--------------------------|----------------------------------------------------|
| Version                  | [e.g., v1.2.0]                                     |
| Release Date             | [YYYY-MM-DD]                                       |
| Release Time (UTC)       | [HH:MM UTC]                                        |
| Release Manager          | [NAME]                                             |
| Deployment Environment   | Production (only environment)                      |
| Deployment Method        | GitHub Actions CD -- auto-deploy on push to main   |
| Deployment Duration      | ~5-10 minutes (container build + deploy)           |
| Previous Version         | [e.g., v1.1.0]                                     |
| Git Tag                  | [e.g., v1.2.0] (if tagged)                         |
| Git Commit SHA           | [FULL SHA from main branch]                        |

> **Note:** Releases are triggered automatically by pushing to the main branch. There is no formal release versioning or tagging process. Versions are tracked by container image tags in ACR (acrcmmcassessorprod).

---

## 2. Summary of Changes

[WRITE 2-3 SENTENCES summarizing the overall theme of this release. For example: "This release adds assessment export functionality, fixes a bug in the scoring calculation, and updates several dependencies for security patches."]

---

## 3. New Features

| Feature                          | Description                                                    | Issue Link         | Feature Flag (if applicable) |
|----------------------------------|----------------------------------------------------------------|--------------------|------------------------------|
| [Feature Name]                   | [Description of the feature]                                   | [GitHub Issue #]   | N/A (no feature flags)       |

> **Note:** Feature flags are NOT IMPLEMENTED. All features are deployed directly to production when merged to main.

---

## 4. Bug Fixes

| Bug ID       | Description                                              | Severity   | Root Cause                                    | Affected Since |
|--------------|----------------------------------------------------------|------------|-----------------------------------------------|----------------|
| [Issue #]    | [Description of the bug fix]                             | [Severity] | [Root cause description]                      | [Version]      |

---

## 5. Known Issues

| Issue                                        | Workaround                                      | Target Fix Version | Issue Link   |
|----------------------------------------------|-------------------------------------------------|--------------------|--------------|
| Health endpoint leaks config info (F-38)     | No user impact; internal endpoint only           | TBD                | F-38         |
| CORS allows localhost in production (F-40)   | No user impact; security hardening planned       | TBD                | F-40         |
| Cold starts due to scale-to-zero             | Wait 30-60s; set min-replicas=1 if needed       | N/A (by design)    | N/A          |
| [Issue Description]                          | [Workaround]                                    | [Version]          | [Link]       |

---

## 6. Breaking Changes

### Are there breaking changes in this release?

- [ ] **Yes** -- See details below
- [ ] **No** -- No breaking changes in this release

### Breaking Change Details

| Change                                  | Impact                                              | Migration Required | Migration Guide                |
|-----------------------------------------|-----------------------------------------------------|--------------------|--------------------------------|
| [Change Description]                    | [Impact Description]                                | [Yes/No]           | [Link or instructions]         |

---

## 7. Configuration Changes Required

| Configuration Item                   | Change                                       | Environment    | Action Required By     |
|--------------------------------------|----------------------------------------------|----------------|------------------------|
| [Key Vault secret / env variable]    | [Description of change]                      | Production     | [DevOps / Engineer]    |

> **Note:** Configuration is managed through Key Vault secrets (kv-cmmc-assessor-prod) and Container App environment variables defined in Bicep. Changes to secrets require manual Key Vault updates. Changes to environment variables require Bicep parameter updates and redeployment.

---

## 8. Database Migration Notes

| Migration ID          | Description                                         | Reversible | Estimated Duration | Downtime Required |
|-----------------------|-----------------------------------------------------|------------|--------------------|--------------------|
| [Prisma migration ID] | [Description of schema change]                      | [Yes/No]   | [Duration]         | No (online migration) |

### Migration Execution

| Step | Action                                                  | Verified By |
|------|---------------------------------------------------------|-------------|
| 1    | Prisma migration runs automatically on container startup (`prisma migrate deploy`) | Automated |
| 2    | Migration status verified via application health check  | Automated   |

> **Note:** Database migrations are executed via Prisma migrate deploy, which runs during container startup. There is no separate migration step or pre-deployment migration validation. Migrations are tested locally before merging to main.

---

## 9. Dependencies Updated

| Dependency                      | Previous Version | New Version | Reason for Update                        | Security-Related |
|---------------------------------|------------------|-------------|------------------------------------------|------------------|
| [Package name]                  | [Old version]    | [New version] | [Reason]                               | [Yes/No]         |

---

## 10. Performance Impact Notes

| Area                      | Expected Impact                                      | Measurement                          |
|---------------------------|------------------------------------------------------|--------------------------------------|
| [Area]                    | [Expected impact description]                        | Check Container App metrics in Azure Monitor |

> **Note:** No Application Insights or APM is deployed. Performance impact assessment is limited to Azure Monitor platform metrics (CPU, memory) and manual testing.

---

## 11. Rollback Plan

| Attribute                | Value                                                |
|--------------------------|------------------------------------------------------|
| Rollback Possible        | Yes                                                  |
| Rollback Method          | Redeploy previous container image tag via `az containerapp update` or GitHub Actions workflow dispatch |
| Rollback Time Estimate   | 5-10 minutes                                         |
| Rollback Decision Deadline | Within 1 hour post-deployment                      |
| Rollback Owner           | Deploying engineer                                   |
| Database Rollback Notes  | Prisma migrations may not be easily reversible. If migration is non-reversible, must roll forward. |

See [Rollback Procedures](../09-release-management/rollback-procedures.md) for detailed instructions.

---

## 12. Approval and Sign-Off

| Role                    | Name            | Approval Status   | Date           | Notes                |
|-------------------------|-----------------|-------------------|----------------|----------------------|
| Deploying Engineer      | [NAME]          | [Approved]        | [YYYY-MM-DD]   |                      |

> **Note:** No formal multi-person approval process exists. Deployments are triggered automatically on push to main after PR review. There is no separate QA sign-off, security review, or release manager approval gate.

### Planned Improvements

- Implement approval gates for production deployments
- Add QA sign-off requirement for releases with new features
- Define a release manager role

---

## 13. Revision History

| Date           | Author               | Changes Made                              |
|----------------|-----------------------|-------------------------------------------|
| 2026-02-14     | IntelliSec Solutions  | Initial release notes template created    |
