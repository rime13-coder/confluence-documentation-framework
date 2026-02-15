# Build Pipeline

| **Page Title**   | Build Pipeline                             |
|------------------|--------------------------------------------|
| **Last Updated** | [YYYY-MM-DD]                               |
| **Status**       | [Draft / In Review / Approved / Deprecated] |
| **Owner**        | [TEAM OR INDIVIDUAL NAME]                  |

---

## 1. Build Workflow Diagram

> **[INSERT BUILD WORKFLOW DIAGRAM HERE]**
>
> Recommended tools: Mermaid (renders natively in GitHub), draw.io, or Lucidchart.
> Export as PNG and attach to this Confluence page.
>
> The diagram should illustrate the flow from code push through to artifact storage, including parallel jobs and conditional steps.

---

## 2. Build Triggers

| Trigger Type    | Event                        | Branch/Path Filter                       | Condition / Notes                                 |
|-----------------|------------------------------|------------------------------------------|---------------------------------------------------|
| **Push**        | `push`                       | Branches: `main`, `develop`              | Runs full build + tests                           |
| **Pull Request**| `pull_request`               | Branches: `main`, `develop`              | Runs build + tests; blocks merge on failure       |
| **Schedule**    | `schedule` (cron)            | `cron: '[CRON-EXPRESSION]'`              | Nightly build to catch dependency drift           |
| **Manual**      | `workflow_dispatch`          | Any branch                               | On-demand builds for debugging or hotfixes        |
| **Path Filter** | (combined with push/PR)      | `paths: ['src/**', 'package.json', ...]` | Skip build when only docs or non-code files change |

---

## 3. Build Steps Breakdown

| #  | Step                         | Action / Tool                          | Purpose                                                   | Timeout  |
|----|------------------------------|----------------------------------------|-----------------------------------------------------------|----------|
| 1  | Checkout code                | `actions/checkout@v4`                  | Clone repository with full history for versioning          | 2 min    |
| 2  | Setup runtime                | `actions/setup-dotnet@v4` / `actions/setup-node@v4` / `actions/setup-python@v5` | Install required SDK/runtime version | 2 min    |
| 3  | Restore dependency cache     | `actions/cache@v4`                     | Restore NuGet/npm/pip cache to speed up install            | 1 min    |
| 4  | Install dependencies         | `dotnet restore` / `npm ci` / `pip install -r requirements.txt` | Install project dependencies              | 5 min    |
| 5  | Lint / format check          | [LINTER-TOOL: e.g., `dotnet format --verify-no-changes`, `eslint`, `ruff`] | Enforce code style and catch syntax issues | 3 min    |
| 6  | Build / compile              | `dotnet build` / `npm run build` / `python -m build` | Compile application artifacts              | 10 min   |
| 7  | Run unit tests               | `dotnet test` / `npm test` / `pytest`  | Execute unit test suite and generate results               | 10 min   |
| 8  | SAST scan                    | [SAST-TOOL: e.g., `github/codeql-action/analyze@v3`, `SonarSource/sonarcloud-github-action@v3`] | Static application security testing | 10 min   |
| 9  | Generate code coverage       | [COVERAGE-TOOL: e.g., Coverlet, Istanbul/nyc, coverage.py] | Produce coverage report                    | 2 min    |
| 10 | Publish test results         | `dorny/test-reporter@v1` or `actions/upload-artifact@v4` | Surface test results in PR checks          | 1 min    |
| 11 | Build container image        | `docker/build-push-action@v6`          | Build Docker image (if containerized service)              | 10 min   |
| 12 | Scan container image         | [SCANNER: e.g., `aquasecurity/trivy-action@0.28.0`] | Scan image for CVEs before publishing      | 5 min    |
| 13 | Publish artifact             | `actions/upload-artifact@v4` / push to ACR | Upload build artifact or push image to Azure Container Registry | 3 min |

---

## 4. Build Artifact Management

| Artifact              | Format                  | Storage Location                    | Retention Policy     | Consumed By              |
|-----------------------|-------------------------|-------------------------------------|----------------------|--------------------------|
| Application package   | `.zip` / `.nupkg` / `.tar.gz` | GitHub Actions Artifacts       | [NUMBER] days        | Release pipeline         |
| Container image       | OCI image               | Azure Container Registry (`[ACR-NAME].azurecr.io`) | [NUMBER] tags kept | AKS / App Service deploy |
| Test results          | `.trx` / `.xml` / `.json` | GitHub Actions Artifacts          | [NUMBER] days        | PR checks, dashboards    |
| Coverage report       | Cobertura XML / lcov    | GitHub Actions Artifacts            | [NUMBER] days        | Coverage gate, SonarCloud|
| SBOM                  | SPDX / CycloneDX JSON  | GitHub Actions Artifacts / ACR      | [NUMBER] days        | Security team            |

### Artifact Naming Convention

```
[SERVICE-NAME]-[VERSION]-[SHORT-SHA].[EXTENSION]
```

Example: `order-api-1.4.2-a3f8c1d.zip`

---

## 5. Build Matrix

Use a build matrix when the project must be validated across multiple runtimes, operating systems, or framework versions.

| Axis              | Values                                     | Notes                                    |
|-------------------|--------------------------------------------|------------------------------------------|
| Runtime version   | [e.g., `dotnet: [8.0, 9.0]`, `node: [20, 22]`] | Ensure compatibility across supported versions |
| Operating system  | [e.g., `ubuntu-latest`, `windows-latest`]  | Only if multi-OS deployment is required  |
| Configuration     | [e.g., `Debug`, `Release`]                 | CI typically runs `Release` only         |

> **Note:** Use `fail-fast: false` if you want all matrix combinations to complete even when one fails.

---

## 6. Build Performance Metrics

| Metric                        | Current Value      | Target              | Notes                              |
|-------------------------------|--------------------|---------------------|------------------------------------|
| Total build time (CI)         | [CURRENT] min      | < [TARGET] min      | Measured on `ubuntu-latest` runner |
| Dependency cache hit rate     | [CURRENT] %        | > 90%               | Track via cache action logs        |
| Docker layer cache hit rate   | [CURRENT] %        | > 80%               | Use `cache-from` with ACR or GHCR  |
| Unit test execution time      | [CURRENT] min      | < [TARGET] min      | Parallelise test assemblies if slow|
| Artifact upload time          | [CURRENT] min      | < 1 min             |                                    |
| Average queue wait time       | [CURRENT] min      | < 2 min             | May need larger runner pool        |

### Performance Optimization Checklist

- [ ] Dependency caching enabled (`actions/cache`)
- [ ] Docker layer caching enabled (BuildKit cache or registry cache)
- [ ] Tests run in parallel where possible
- [ ] Path filters skip unnecessary builds
- [ ] Larger GitHub-hosted runners used for heavy builds (`ubuntu-latest-xl`)
- [ ] Unnecessary steps removed or moved to nightly builds

---

## 7. Failure Notification Strategy

| Failure Type                  | Notification Channel          | Recipients                     | Escalation                          |
|-------------------------------|-------------------------------|--------------------------------|-------------------------------------|
| PR build failure              | GitHub PR status check        | PR author                      | None (author must fix)              |
| `main` branch build failure   | [SLACK-CHANNEL / TEAMS-CHANNEL] | [TEAM-NAME]                 | Page on-call if not fixed in [X] hr |
| Nightly build failure         | [SLACK-CHANNEL / TEAMS-CHANNEL] | [TEAM-NAME]                 | Triage in next standup              |
| Security scan findings        | GitHub Security tab + [CHANNEL] | Security champion + [TEAM]  | Per severity SLA                    |

---

## 8. Example GitHub Actions Build Workflow

```yaml
# .github/workflows/build.yml
name: Build & Test

on:
  push:
    branches: [main, develop]
    paths-ignore:
      - 'docs/**'
      - '*.md'
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '[CRON-EXPRESSION]'   # e.g., '0 3 * * *' for nightly at 03:00 UTC
  workflow_dispatch:

permissions:
  contents: read
  checks: write
  pull-requests: write
  security-events: write

env:
  DOTNET_VERSION: '[DOTNET-VERSION]'       # e.g., '8.0.x'
  NODE_VERSION: '[NODE-VERSION]'           # e.g., '20'
  ARTIFACT_NAME: '[SERVICE-NAME]'
  ACR_NAME: '[ACR-NAME]'

jobs:
  build:
    name: Build & Unit Test
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0   # Full history for versioning tools

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Cache NuGet packages
        uses: actions/cache@v4
        with:
          path: ~/.nuget/packages
          key: nuget-${{ runner.os }}-${{ hashFiles('**/*.csproj') }}
          restore-keys: nuget-${{ runner.os }}-

      - name: Restore dependencies
        run: dotnet restore

      - name: Check formatting
        run: dotnet format --verify-no-changes --no-restore

      - name: Build
        run: dotnet build --configuration Release --no-restore

      - name: Run unit tests
        run: |
          dotnet test --configuration Release --no-build \
            --logger "trx;LogFileName=test-results.trx" \
            --collect:"XPlat Code Coverage"

      - name: Publish test results
        uses: dorny/test-reporter@v1
        if: always()
        with:
          name: Unit Tests
          path: '**/test-results.trx'
          reporter: dotnet-trx

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: '**/coverage.cobertura.xml'
          retention-days: [RETENTION-DAYS]

      - name: Publish application artifact
        run: dotnet publish src/[PROJECT-NAME] -c Release -o ./publish

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ env.ARTIFACT_NAME }}-${{ github.sha }}
          path: ./publish
          retention-days: [RETENTION-DAYS]

  security-scan:
    name: SAST Scan
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: '[LANGUAGE]'   # e.g., csharp, javascript, python

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
```

> **Note:** Replace all `[PLACEHOLDER]` values with project-specific settings before use.

---

## 9. Appendix

### Related Pages

- [GitHub Actions Overview](./github-actions-overview.md)
- [Release Pipeline](./release-pipeline.md)
- [Test Strategy](../06-testing/test-strategy.md)
- [Unit Testing](../06-testing/unit-testing.md)
