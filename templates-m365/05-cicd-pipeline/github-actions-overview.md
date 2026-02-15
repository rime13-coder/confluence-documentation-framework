# CI/CD Strategy Overview

| **Page Title**   | CI/CD Strategy Overview                                    |
|------------------|------------------------------------------------------------|
| **Last Updated** | 2026-02-15                                                 |
| **Status**       | NOT STARTED - Pipeline implementation pending              |
| **Owner**        | IntelliSecOps DevOps Team                                  |
| **Module**       | M365-SecurityAssessment v1.0.0                             |

---

## 1. Current State Summary

> **STATUS: NOT STARTED** -- The M365-SecurityAssessment module currently has NO CI/CD pipelines. All testing, validation, and distribution are performed manually.

| Aspect                  | Current State                                                              |
|-------------------------|----------------------------------------------------------------------------|
| **Continuous Integration** | None. Developers run Pester tests locally before committing.            |
| **Continuous Delivery**    | None. Module is distributed via `git clone` + `Import-Module`.          |
| **Code Quality**           | No automated linting or static analysis.                                |
| **Release Management**     | Manual version bump in `.psd1` manifest. No git tags or GitHub Releases.|
| **Test Automation**        | Manual invocation of `Invoke-Pester` against 7 test files (71+ tests). |
| **Dependency Management**  | Dependencies listed in `.psd1` RequiredModules; installed manually.     |

### Current Manual Workflow

```
  Developer Workstation
  +--------------------------------------------------+
  |  1. Edit PowerShell scripts                      |
  |  2. Run Invoke-Pester locally                    |
  |  3. Verify module manifest (Test-ModuleManifest) |
  |  4. git add / commit / push                      |
  +--------------------------------------------------+
           |
           v
  GitHub Repository (Private)
  +--------------------------------------------------+
  |  - No workflows configured                       |
  |  - No branch protection rules                    |
  |  - No automated checks on PR                     |
  +--------------------------------------------------+
           |
           v
  Consumer Workstation
  +--------------------------------------------------+
  |  1. git clone <repo-url>                         |
  |  2. Import-Module ./M365-SecurityAssessment.psd1 |
  |  3. Run assessment commands                      |
  +--------------------------------------------------+
```

---

## 2. CI/CD Philosophy (Recommended)

The recommended CI/CD philosophy for the M365-SecurityAssessment module is built on the following principles:

- **Automate validation** -- every push and pull request should trigger Pester tests, PSScriptAnalyzer linting, and module manifest validation through GitHub Actions.
- **Shift left** -- catch code quality issues, breaking changes, and test failures before they reach the main branch.
- **Immutable release artifacts** -- module packages should be built once, versioned, and distributed without modification.
- **PowerShell-native tooling** -- leverage Pester, PSScriptAnalyzer, and Test-ModuleManifest as the core validation tools rather than introducing non-PowerShell alternatives.
- **Windows runner requirement** -- several module dependencies (Microsoft.Graph, ExchangeOnlineManagement) and behaviors are Windows-specific, requiring `windows-latest` runners.
- **Auditability** -- every release should be traceable to a specific commit, test run, and approval.

---

## 3. Branching Strategy (Recommended)

### Trunk-Based with Feature Branches

| Branch            | Purpose                                       | Lifetime     | CI Trigger           |
|-------------------|-----------------------------------------------|--------------|----------------------|
| `main`            | Production-ready module code                  | Permanent    | CI on push + release on tag |
| `feature/*`       | New feature or control development            | Short-lived  | CI on PR to `main`   |
| `fix/*`           | Bug fixes for assessment logic or reporting   | Short-lived  | CI on PR to `main`   |

**Branch flow:**
- Developers create `feature/*` or `fix/*` branches from `main` and open PRs.
- PRs to `main` trigger the CI workflow (Pester tests, PSScriptAnalyzer, manifest validation).
- Pushing a version tag (e.g., `v1.1.0`) to `main` triggers the release workflow.
- Branch protection rules enforce passing CI checks before merge is permitted.

---

## 4. Repository Structure

| Directory / File                        | Contents                                           | Type          |
|-----------------------------------------|----------------------------------------------------|---------------|
| `M365-SecurityAssessment.psd1`          | Module manifest (version, dependencies, exports)   | PowerShell    |
| `M365-SecurityAssessment.psm1`          | Root module file                                   | PowerShell    |
| `Public/`                               | Exported functions (assessment commands)            | PowerShell    |
| `Private/`                              | Internal helper functions                          | PowerShell    |
| `Tests/`                                | Pester test files (7 files, 71+ tests)             | PowerShell    |
| `FindingDefinitions/`                   | JSON files defining CMMC control findings          | JSON          |
| `Templates/`                            | Report templates (Word, Excel)                     | Office/XML    |
| `.github/workflows/` *(recommended)*    | CI/CD workflow definitions                         | YAML          |

---

## 5. Recommended Workflow Inventory

| Workflow Name         | Trigger                                      | Purpose                                                    | File Path                              | Status               |
|-----------------------|----------------------------------------------|------------------------------------------------------------|----------------------------------------|----------------------|
| **CI**                | PR to `main`, push to `main`                 | Run Pester tests, PSScriptAnalyzer, validate manifest      | `.github/workflows/ci.yml`             | NOT STARTED          |
| **Release**           | Push tag `v*.*.*`                            | Package module, create GitHub Release, generate changelog   | `.github/workflows/release.yml`        | NOT STARTED          |
| **Dependency Audit**  | Weekly schedule (cron)                       | Check for updated module dependencies                      | `.github/workflows/dependency-audit.yml` | NOT STARTED        |

---

## 6. PowerShell-Specific CI Considerations

### Runner Requirements

| Consideration                    | Detail                                                                    |
|----------------------------------|---------------------------------------------------------------------------|
| **Runner OS**                    | `windows-latest` required (Microsoft.Graph, Exchange, Teams modules)      |
| **PowerShell version**           | Windows PowerShell 5.1 (primary target) + PowerShell 7.x (future)        |
| **Pester version**               | 3.4.0 (current test suite depends on v3 syntax)                          |
| **Module installation**          | `Install-Module` for each dependency during CI setup                     |
| **NuGet provider**               | Must be bootstrapped: `Install-PackageProvider -Name NuGet -Force`       |
| **Execution policy**             | Runner default is `Unrestricted`; no change needed                        |

### Dependency Installation Order

Dependencies must be installed in the correct order to avoid import failures:

| Order | Module                     | Version (Minimum) | Notes                                      |
|-------|----------------------------|--------------------|--------------------------------------------|
| 1     | NuGet PackageProvider      | Latest             | Required before any `Install-Module`       |
| 2     | Pester                     | 3.4.0              | Test framework; v3 syntax required         |
| 3     | PSScriptAnalyzer           | Latest             | Code quality / linting                     |
| 4     | Microsoft.Graph            | Latest             | Microsoft 365 Graph API access             |
| 5     | ExchangeOnlineManagement   | Latest             | Exchange Online assessment                 |
| 6     | MicrosoftTeams             | Latest             | Teams configuration assessment             |
| 7     | Pode                       | Latest             | Web server for dashboard                   |
| 8     | PSSQLite                   | Latest             | SQLite database for controls tracking      |
| 9     | PSWriteWord                | Latest             | Word document report generation            |
| 10    | ImportExcel                | Latest             | Excel report generation                    |

---

## 7. Pipeline Architecture (Recommended)

### CI Pipeline Flow

```
  Push / PR to main
  +--------------------------------------------------+
  |                CI Workflow                         |
  |  (windows-latest runner)                          |
  |                                                   |
  |  1. Checkout repository                           |
  |  2. Bootstrap NuGet provider                      |
  |  3. Install-Module dependencies                   |
  |  4. Run PSScriptAnalyzer                          |
  |     - Analyze all .ps1 and .psm1 files            |
  |     - Fail on Error-level findings                |
  |  5. Test-ModuleManifest                           |
  |     - Validate M365-SecurityAssessment.psd1       |
  |  6. Invoke-Pester                                 |
  |     - Run all 7 test files                        |
  |     - Fail on any test failure                    |
  |  7. Validate FindingDefinitions JSON              |
  |     - Parse all JSON files for valid schema       |
  +--------------------------------------------------+
           |
           v
  PR Status Check: Pass / Fail
```

### Release Pipeline Flow

```
  Push tag v*.*.*
  +--------------------------------------------------+
  |              Release Workflow                      |
  |  (windows-latest runner)                          |
  |                                                   |
  |  1. Checkout repository                           |
  |  2. Run full CI validation (same as above)        |
  |  3. Verify tag version matches .psd1 version      |
  |  4. Package module as .zip archive                |
  |  5. Generate changelog from git history           |
  |  6. Create GitHub Release with:                   |
  |     - Release notes (changelog)                   |
  |     - Module .zip as release artifact             |
  |  7. (Optional) Publish to private PS Gallery      |
  +--------------------------------------------------+
```

---

## 8. Secrets Management (Recommended)

### GitHub Repository Secrets

No secrets are required for CI validation (Pester tests run against mock data, not live tenants). However, the following secrets are recommended for optional integration testing and release publishing:

| Secret Name                    | Scope        | Description                                     | Required For        |
|--------------------------------|--------------|-------------------------------------------------|---------------------|
| `TEST_TENANT_CLIENT_ID`       | Repository   | App registration client ID for test M365 tenant | Integration tests   |
| `TEST_TENANT_CLIENT_SECRET`   | Repository   | App registration client secret                  | Integration tests   |
| `TEST_TENANT_ID`              | Repository   | Azure AD tenant ID for test tenant              | Integration tests   |
| `NUGET_API_KEY`               | Repository   | API key for private PowerShell Gallery           | Release publishing  |

### Secret Rotation Schedule

| Secret                        | Rotation Frequency | Responsible Party          |
|-------------------------------|--------------------|----------------------------|
| `TEST_TENANT_CLIENT_SECRET`   | Quarterly          | IntelliSecOps DevOps Team  |
| `NUGET_API_KEY`               | Annually           | IntelliSecOps DevOps Team  |

---

## 9. Branch Protection Rules (Recommended)

| Branch   | Required Reviews | Required Status Checks                                        | Dismiss Stale Reviews | Allow Force Push |
|----------|------------------|---------------------------------------------------------------|-----------------------|------------------|
| `main`   | 1                | `pester-tests`, `psscriptanalyzer`, `manifest-validation`     | Yes                   | No               |

---

## 10. Implementation Roadmap

| Phase   | Milestone                                | Priority  | Estimated Effort | Status       |
|---------|------------------------------------------|-----------|------------------|--------------|
| Phase 1 | Create CI workflow (Pester + Analyzer)  | High      | 4-8 hours        | NOT STARTED  |
| Phase 2 | Add branch protection rules             | High      | 1 hour           | NOT STARTED  |
| Phase 3 | Create release workflow (tag-based)      | Medium    | 4-6 hours        | NOT STARTED  |
| Phase 4 | Add dependency audit workflow            | Low       | 2-3 hours        | NOT STARTED  |
| Phase 5 | Optional: Publish to private PS Gallery  | Low       | 4-6 hours        | NOT STARTED  |

---

## 11. Workflow Status Badges (Future)

Add these badges to the repository README once workflows are created:

| Workflow          | Badge Markdown                                                                                              |
|-------------------|-------------------------------------------------------------------------------------------------------------|
| CI                | `![CI](https://github.com/IntelliSecOps/M365-SecurityAssessment/actions/workflows/ci.yml/badge.svg)`       |
| Release           | `![Release](https://github.com/IntelliSecOps/M365-SecurityAssessment/actions/workflows/release.yml/badge.svg)` |
| Dependency Audit  | `![Deps](https://github.com/IntelliSecOps/M365-SecurityAssessment/actions/workflows/dependency-audit.yml/badge.svg)` |

---

## 12. Appendix

### Key Contacts

| Role                     | Name                    | GitHub Handle      |
|--------------------------|-------------------------|--------------------|
| CI/CD Pipeline Owner     | IntelliSecOps DevOps    | @intellisecops     |
| Module Lead              | IntelliSecOps DevOps    | @intellisecops     |
| Security Champion        | IntelliSecOps Security  | @intellisecops     |

### Related Pages

- [Build & Validation Pipeline](./build-pipeline.md)
- [Release & Distribution Pipeline](./release-pipeline.md)
- [Environment Strategy](./environment-strategy.md)
- [Test Strategy](../06-testing/test-strategy.md)
