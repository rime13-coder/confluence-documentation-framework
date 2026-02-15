# Release Notes

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Release Notes -- [VERSION NUMBER]  |
| Last Updated     | [YYYY-MM-DD]                       |
| Status           | [Draft / In Review / Published]    |
| Owner            | [RELEASE MANAGER NAME]             |

---

## 1. Release Metadata

| Attribute                | Value                                              |
|--------------------------|----------------------------------------------------|
| Version                  | [e.g., v2.4.0]                                     |
| Release Date             | [YYYY-MM-DD]                                       |
| Release Time (UTC)       | [HH:MM UTC]                                        |
| Release Manager          | [NAME]                                             |
| Deployment Environment   | [Production / Staging / All]                       |
| Deployment Method        | [GitHub Actions automated / Manual]                |
| Deployment Duration      | [XX minutes]                                       |
| Deployment Ticket        | [JIRA-XXXX / ADO-XXXX]                            |
| Previous Version         | [e.g., v2.3.1]                                     |
| Git Tag                  | [e.g., v2.4.0]                                     |
| Git Commit SHA           | [FULL SHA]                                         |

---

## 2. Summary of Changes

[WRITE 2-3 SENTENCES summarizing the overall theme of this release. For example: "This release introduces the new checkout experience, improves API response times by 30%, and addresses several security vulnerabilities identified in the Q4 audit."]

---

## 3. New Features

| Feature                          | Description                                                    | Jira / Issue Link  | Documentation Link       | Feature Flag (if applicable) |
|----------------------------------|----------------------------------------------------------------|--------------------|--------------------------|------------------------------|
| [New Checkout Experience]        | [Redesigned checkout flow with Apple Pay and Google Pay support]| [JIRA-1234]        | [LINK TO USER DOCS]      | [Feature.NewCheckout]        |
| [Dark Mode Support]              | [User-selectable dark mode for the web application]            | [JIRA-1250]        | [LINK TO USER DOCS]      | [Feature.DarkMode]           |
| [Bulk Export API]                | [New API endpoint for bulk data export in CSV and JSON formats]| [JIRA-1267]        | [LINK TO API DOCS]       | [N/A]                        |
| [FEATURE NAME]                   | [DESCRIPTION]                                                  | [ISSUE LINK]       | [DOC LINK]               | [FLAG NAME / N/A]            |

---

## 4. Bug Fixes

| Bug ID       | Description                                              | Severity   | Root Cause                                    | Affected Since |
|--------------|----------------------------------------------------------|------------|-----------------------------------------------|----------------|
| [JIRA-1301]  | [Login page intermittently returns 500 error]            | [Critical] | [Race condition in session token validation]  | [v2.3.0]       |
| [JIRA-1305]  | [PDF export shows incorrect date format for EU users]    | [Major]    | [Locale not passed to date formatter]         | [v2.2.0]       |
| [JIRA-1312]  | [Search results pagination missing last page link]       | [Minor]    | [Off-by-one error in pagination calculation]  | [v2.3.1]       |
| [BUG ID]     | [DESCRIPTION]                                            | [SEVERITY] | [ROOT CAUSE]                                  | [VERSION]      |

---

## 5. Known Issues

| Issue                                        | Workaround                                      | Target Fix Version | Issue Link   |
|----------------------------------------------|-------------------------------------------------|--------------------|--------------|
| [Bulk export may time out for datasets >1M rows] | [Use date-range filters to reduce dataset size] | [v2.5.0]          | [JIRA-1320]  |
| [Dark mode does not apply to email templates]| [No workaround; emails remain in light mode]     | [v2.5.0]           | [JIRA-1322]  |
| [ISSUE DESCRIPTION]                          | [WORKAROUND]                                    | [VERSION]          | [LINK]       |

---

## 6. Breaking Changes

### Are there breaking changes in this release?

- [ ] **Yes** -- See details below
- [ ] **No** -- No breaking changes in this release

### Breaking Change Details

| Change                                  | Impact                                              | Migration Required | Migration Guide                |
|-----------------------------------------|-----------------------------------------------------|--------------------|--------------------------------|
| [Removed `/api/v1/users` endpoint]      | [Clients using v1 users API must migrate to v2]     | [Yes]              | [LINK TO MIGRATION GUIDE]      |
| [Changed auth token format from JWT HS256 to RS256] | [Clients must update token validation logic] | [Yes]            | [LINK TO MIGRATION GUIDE]      |
| [CHANGE DESCRIPTION]                    | [IMPACT]                                            | [YES/NO]           | [LINK]                         |

### Migration Steps (if applicable)

1. [STEP 1: Update client SDK to version X.X]
2. [STEP 2: Update API endpoint URLs from v1 to v2]
3. [STEP 3: Update token validation configuration]
4. [STEP 4: Test in staging before production cutover]
5. [STEP 5: Deprecated endpoints will be removed in version X.X on YYYY-MM-DD]

---

## 7. Configuration Changes Required

| Configuration Item                   | Change                                       | Environment    | Action Required By     |
|--------------------------------------|----------------------------------------------|----------------|------------------------|
| [App Setting: NEW_CHECKOUT_ENABLED]  | [Add new setting, value: true]               | [All]          | [DevOps]               |
| [Key Vault: api-signing-key]         | [New RS256 signing key added]                | [All]          | [Security / DevOps]    |
| [App Config: BulkExport.MaxRows]     | [New setting, value: 1000000]                | [All]          | [DevOps]               |
| [CONFIGURATION ITEM]                 | [CHANGE]                                     | [ENVIRONMENT]  | [RESPONSIBLE]          |

---

## 8. Database Migration Notes

| Migration ID          | Description                                         | Reversible | Estimated Duration | Downtime Required |
|-----------------------|-----------------------------------------------------|------------|--------------------|--------------------|
| [20240215_001]        | [Add `payment_method` column to `orders` table]     | [Yes]      | [<1 minute]        | [No]               |
| [20240215_002]        | [Create `bulk_exports` table]                       | [Yes]      | [<1 minute]        | [No]               |
| [20240215_003]        | [Backfill `payment_method` for existing orders]     | [Yes]      | [~5 minutes]       | [No]               |
| [MIGRATION ID]        | [DESCRIPTION]                                       | [YES/NO]   | [DURATION]         | [YES/NO]           |

### Migration Execution

| Step | Action                                                  | Verified By |
|------|---------------------------------------------------------|-------------|
| 1    | Migrations tested in staging environment                | [NAME]      |
| 2    | Database backup taken before production migration       | [NAME]      |
| 3    | Migrations applied as part of deployment pipeline       | [Automated] |
| 4    | Post-migration data integrity check completed           | [NAME]      |

---

## 9. Dependencies Updated

| Dependency                      | Previous Version | New Version | Reason for Update                        | Security-Related |
|---------------------------------|------------------|-------------|------------------------------------------|------------------|
| [Microsoft.AspNetCore]          | [8.0.1]          | [8.0.3]     | [Security patch CVE-YYYY-XXXXX]          | [Yes]            |
| [Newtonsoft.Json]               | [13.0.2]         | [13.0.3]    | [Bug fix for deserialization edge case]  | [No]             |
| [Azure.Identity]                | [1.10.3]         | [1.10.4]    | [Managed identity improvements]          | [No]             |
| [Helm chart: nginx-ingress]     | [4.8.3]          | [4.9.0]     | [Security patch, new features]           | [Yes]            |
| [DEPENDENCY]                    | [OLD VERSION]    | [NEW VERSION]| [REASON]                                | [YES/NO]         |

---

## 10. Performance Impact Notes

| Area                      | Expected Impact                                      | Measurement                          | Baseline        | Post-Release Target |
|---------------------------|------------------------------------------------------|--------------------------------------|-----------------|---------------------|
| [API Response Time (P95)]  | [Improved by ~30% due to query optimization]        | [Application Insights: requests P95] | [450ms]         | [<320ms]            |
| [Memory Usage (AKS pods)] | [Increased by ~15% due to new caching layer]         | [Azure Monitor: container memory]    | [512MB avg]     | [~590MB avg]        |
| [Database DTU Usage]       | [No significant change expected]                    | [Azure Monitor: SQL DTU %]           | [45% avg]       | [~45% avg]          |
| [Page Load Time]           | [Improved for checkout flow, no change elsewhere]    | [Application Insights: page views]   | [2.1s avg]      | [<1.5s checkout]    |
| [AREA]                     | [EXPECTED IMPACT]                                   | [MEASUREMENT]                        | [BASELINE]      | [TARGET]            |

---

## 11. Rollback Plan

| Attribute                | Value                                                |
|--------------------------|------------------------------------------------------|
| Rollback Possible        | [Yes / Partial -- see notes]                         |
| Rollback Method          | [Slot swap / Helm rollback / Redeploy v2.3.1]        |
| Rollback Time Estimate   | [XX minutes]                                         |
| Rollback Decision Deadline | [Within 2 hours post-deployment]                   |
| Rollback Owner           | [RELEASE MANAGER / ON-CALL SRE]                     |
| Database Rollback Notes  | [All migrations are reversible. Run down migrations before app rollback.] |

See [Rollback Procedures](../09-release-management/rollback-procedures.md) for detailed instructions.

---

## 12. Approval and Sign-Off

| Role                    | Name            | Approval Status   | Date           | Notes                |
|-------------------------|-----------------|-------------------|----------------|----------------------|
| Release Manager         | [NAME]          | [Approved]        | [YYYY-MM-DD]   |                      |
| Engineering Lead        | [NAME]          | [Approved]        | [YYYY-MM-DD]   |                      |
| QA Lead                 | [NAME]          | [Approved]        | [YYYY-MM-DD]   |                      |
| Product Owner           | [NAME]          | [Approved]        | [YYYY-MM-DD]   |                      |
| Security (if required)  | [NAME]          | [Approved / N/A]  | [YYYY-MM-DD]   |                      |

---

## 13. Revision History

| Date           | Author            | Changes Made                              |
|----------------|-------------------|-------------------------------------------|
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [Initial release notes created]           |
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [DESCRIPTION OF CHANGES]                  |
