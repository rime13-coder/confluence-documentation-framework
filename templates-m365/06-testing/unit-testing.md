# Unit Testing

| **Page Title**   | Unit Testing -- M365 Security Assessment Automation |
|------------------|------------------------------------------------------|
| **Last Updated** | 2026-02-15                                           |
| **Status**       | IN PROGRESS                                          |
| **Owner**        | IntelliSecOps Development Team                       |

---

## 1. Current State

Unit testing for the M365-SecurityAssessment module is **actively in progress** with **71+ Pester tests implemented across 7 test files**. Two test files are fully developed (ControlsDB with 34 tests and EmailProtection with 37 tests), while five additional test files exist for other assessment modules.

Tests are executed manually before each release using `Invoke-Pester`. There is no CI/CD pipeline automating test execution. Code coverage metrics are not currently collected.

---

## 2. Framework and Tooling

| Aspect                    | Configuration                                              |
|---------------------------|------------------------------------------------------------|
| **Test framework**        | Pester 3.4.0                                               |
| **PowerShell version**    | PowerShell 5.1+ (Desktop edition)                          |
| **Assertion style**       | Pester built-in: `Should Be`, `Should BeExactly`, `Should Throw`, `Should Not BeNullOrEmpty` |
| **Mocking**               | Pester `Mock` cmdlet for Graph API, Exchange Online, and Teams responses |
| **Test runner**           | `Invoke-Pester` (command-line)                             |
| **SQLite test support**   | `System.Data.SQLite.dll` bundled with module               |

### Why Pester 3.4.0

- Native PowerShell testing framework; no external runtime dependencies.
- Built-in mocking support for cmdlets and functions -- critical for isolating Graph API calls.
- `Describe`/`Context`/`It` block structure maps naturally to assessment module / check / scenario hierarchy.
- Version 3.4.0 is compatible with PowerShell 5.1 Desktop edition (required for Exchange Online and Teams modules).
- Widely adopted in the PowerShell community with extensive documentation.

---

## 3. Test Execution

### Run Full Test Suite

```powershell
# Navigate to module root directory
cd C:\Path\To\M365-SecurityAssessment

# Run all tests with verbose output
Invoke-Pester .\tests\ -Verbose
```

### Run Individual Test File

```powershell
# Run only ControlsDB tests
Invoke-Pester .\tests\ControlsDB.Tests.ps1 -Verbose

# Run only EmailProtection tests
Invoke-Pester .\tests\EmailProtection.Tests.ps1 -Verbose

# Run a specific test by name filter
Invoke-Pester .\tests\ -TestName "Should create a new finding in the database" -Verbose
```

### Expected Output (All Tests Passing)

```
Describing ControlsDB
  Context SQLite CRUD Operations
    [+] Should create a new finding in the database 42ms
    [+] Should read an existing finding by ID 18ms
    ...
Describing EmailProtection
  Context SPF Record Validation
    [+] Should flag missing SPF record as a finding 25ms
    [+] Should pass valid SPF record 12ms
    ...
Tests completed in 8.2s
Passed: 71 Failed: 0 Skipped: 0 Pending: 0
```

---

## 4. Test File Inventory

| Test File                            | Test Count | Module Under Test        | What It Tests                                           |
|--------------------------------------|------------|--------------------------|--------------------------------------------------------|
| `ControlsDB.Tests.ps1`              | 34         | ControlsDB               | SQLite CRUD operations, auto-sync to JSON, logic column migrations, database schema verification |
| `EmailProtection.Tests.ps1`         | 37         | EmailProtection          | Email auth checks (SPF/DKIM/DMARC), anti-spam policy evaluation, anti-phishing rules, Safe Links/Attachments config validation |
| `ApplicationProtection.Tests.ps1`   | TBD        | ApplicationProtection    | App protection policy checks, conditional access evaluation |
| `DataProtection.Tests.ps1`          | TBD        | DataProtection           | DLP policy validation, sensitivity label checks, retention policy evaluation |
| `FinSecOps.Tests.ps1`               | TBD        | FinSecOps                | Financial security operations, license compliance checks |
| `TeamsSharePoint.Tests.ps1`         | TBD        | TeamsSharePoint          | Teams guest access, sharing policies, SharePoint external sharing |
| `VulnerabilityManagement.Tests.ps1` | TBD        | VulnerabilityManagement  | Vulnerability management configuration checks          |
| **Total**                            | **71+**    |                          |                                                        |

---

## 5. ControlsDB.Tests.ps1 -- Detailed Breakdown (34 Tests)

The ControlsDB test file validates the SQLite-backed controls database that stores assessment findings and synchronizes them to JSON format for portability.

### Test Coverage Areas

| Context / Describe Block              | # Tests | What It Validates                                           |
|---------------------------------------|---------|-------------------------------------------------------------|
| **SQLite CRUD Operations**            | ~10     | Create, read, update, and delete finding records in SQLite database |
| **Auto-Sync to JSON**                 | ~6      | After each DB write, JSON export file is regenerated with correct structure |
| **Logic Column Migrations**           | ~5      | Schema migration adds new columns (e.g., logic, remediation) without data loss |
| **Database Schema Verification**      | ~5      | Table structure matches expected schema; column types and constraints are correct |
| **Edge Cases and Error Handling**      | ~4      | Null inputs, duplicate IDs, missing database file, corrupt data handling |
| **Finding Object Structure**          | ~4      | Finding objects returned from DB match expected property names and types |

### Key Test Patterns

```powershell
Describe "ControlsDB" {
    Context "SQLite CRUD Operations" {
        It "Should create a new finding in the database" {
            # Arrange: Create temp SQLite database
            $tempDb = New-TemporaryFile
            Initialize-ControlsDB -Path $tempDb.FullName

            # Act: Insert a finding
            $finding = @{
                FindingID    = "ENTRA-001"
                Title        = "MFA Not Enforced for All Users"
                Severity     = "Critical"
                Module       = "EntraID"
                Status       = "Open"
            }
            Add-Finding -Database $tempDb.FullName -Finding $finding

            # Assert: Finding exists in database
            $result = Get-Finding -Database $tempDb.FullName -FindingID "ENTRA-001"
            $result | Should Not BeNullOrEmpty
            $result.Title | Should Be "MFA Not Enforced for All Users"
            $result.Severity | Should Be "Critical"

            # Cleanup
            Remove-Item $tempDb.FullName -Force
        }

        It "Should update an existing finding status" {
            # ...
        }
    }

    Context "Auto-Sync to JSON" {
        It "Should regenerate JSON file after database insert" {
            # Arrange: Create temp DB with JSON sync enabled
            # Act: Insert finding
            # Assert: JSON file exists and contains the new finding
        }
    }
}
```

---

## 6. EmailProtection.Tests.ps1 -- Detailed Breakdown (37 Tests)

The EmailProtection test file validates all email security assessment checks, covering the full spectrum of email authentication, anti-spam, anti-phishing, and advanced threat protection configurations.

### Test Coverage Areas

| Context / Describe Block                  | # Tests | What It Validates                                           |
|-------------------------------------------|---------|-------------------------------------------------------------|
| **SPF Record Validation**                 | ~6      | Missing SPF, invalid SPF syntax, overly permissive `+all`, valid SPF with `-all` |
| **DKIM Configuration**                    | ~5      | DKIM signing enabled/disabled per domain, key rotation status |
| **DMARC Policy Evaluation**              | ~6      | Missing DMARC, `p=none` (monitoring only), `p=quarantine`, `p=reject`, aggregate reporting URI |
| **Anti-Spam Policy Evaluation**          | ~6      | Default vs custom policies, bulk complaint level thresholds, allowed/blocked sender lists |
| **Anti-Phishing Rules**                  | ~5      | Impersonation protection, mailbox intelligence, safety tips configuration |
| **Safe Links Configuration**             | ~5      | URL scanning enabled, click-through tracking, real-time scanning, detonation |
| **Safe Attachments Configuration**       | ~4      | Dynamic Delivery mode, redirect for detected malware, policy scope (all recipients vs subset) |

### Key Test Patterns

```powershell
Describe "EmailProtection" {
    Context "SPF Record Validation" {
        It "Should flag missing SPF record as a finding" {
            # Arrange: Mock Get-DnsTxtRecord to return no SPF record
            Mock Get-DnsTxtRecord { return @() }

            # Act: Run SPF check
            $result = Test-SPFConfiguration -Domain "contoso.com"

            # Assert: Finding generated with correct severity
            $result.FindingGenerated | Should Be $true
            $result.Severity | Should Be "High"
            $result.FindingID | Should Be "EMAIL-001"
        }

        It "Should pass valid SPF record with -all" {
            # Arrange: Mock valid SPF record
            Mock Get-DnsTxtRecord {
                return @("v=spf1 include:spf.protection.outlook.com -all")
            }

            # Act
            $result = Test-SPFConfiguration -Domain "contoso.com"

            # Assert: No finding generated
            $result.FindingGenerated | Should Be $false
        }

        It "Should flag overly permissive SPF with +all" {
            # Arrange: Mock permissive SPF
            Mock Get-DnsTxtRecord {
                return @("v=spf1 include:spf.protection.outlook.com +all")
            }

            # Act
            $result = Test-SPFConfiguration -Domain "contoso.com"

            # Assert: Critical finding
            $result.FindingGenerated | Should Be $true
            $result.Severity | Should Be "Critical"
        }
    }

    Context "Anti-Spam Policy Evaluation" {
        It "Should flag default anti-spam policy with no customization" {
            # Arrange: Mock Get-HostedContentFilterPolicy
            Mock Get-HostedContentFilterPolicy {
                return @{
                    Name                = "Default"
                    BulkThreshold       = 7
                    HighConfidenceSpamAction = "MoveToJmf"
                    SpamAction          = "MoveToJmf"
                }
            }

            # Act
            $result = Test-AntiSpamPolicy

            # Assert
            $result.FindingGenerated | Should Be $true
            $result.Severity | Should Be "Medium"
        }
    }
}
```

---

## 7. Module-Specific Test Patterns

### Mocking Graph API Responses

All assessment modules that call Microsoft Graph API use Pester `Mock` to simulate API responses. This ensures tests run without network access and produce deterministic results.

```powershell
# Mock pattern for Graph API collector functions
Mock Invoke-MgGraphRequest {
    return @{
        value = @(
            @{
                id              = "user-001"
                displayName     = "Test User"
                userPrincipalName = "testuser@contoso.com"
                accountEnabled  = $true
                assignedLicenses = @(@{ skuId = "sku-001" })
            }
        )
    }
} -ParameterFilter { $Uri -like "*/users*" }
```

### Testing Finding Generation

Each check function should generate a finding object with a consistent structure. Tests validate this structure.

```powershell
It "Should generate a finding with all required properties" {
    # Act
    $finding = Test-SomeSecurityCheck -MockedInput $testData

    # Assert: Required finding properties exist
    $finding.FindingID | Should Not BeNullOrEmpty
    $finding.Title | Should Not BeNullOrEmpty
    $finding.Severity | Should Match "^(Critical|High|Medium|Low|Informational)$"
    $finding.Module | Should Not BeNullOrEmpty
    $finding.Description | Should Not BeNullOrEmpty
    $finding.Remediation | Should Not BeNullOrEmpty
    $finding.AffectedResources | Should Not BeNullOrEmpty
}
```

### Validating Finding Object Structure

```powershell
# Standard finding object properties
$expectedProperties = @(
    "FindingID",
    "Title",
    "Severity",
    "Module",
    "Description",
    "Remediation",
    "AffectedResources",
    "Evidence",
    "Status",
    "CheckFunction"
)

It "Should return a finding object with all standard properties" {
    $finding = Test-SomeCheck -InputData $mockData
    foreach ($prop in $expectedProperties) {
        $finding.PSObject.Properties.Name | Should Contain $prop
    }
}
```

---

## 8. Naming Conventions

### Source Files

| Pattern                      | Example                           | Purpose                              |
|------------------------------|-----------------------------------|--------------------------------------|
| `Check-*.ps1`               | `Check-EntraIDSecurity.ps1`       | Check function that evaluates config and generates findings |
| `Collect-*.ps1`             | `Collect-EntraIDData.ps1`         | Collector function that retrieves data from M365 APIs |
| `Test-*.ps1` (in module)    | `Test-SPFConfiguration`           | Individual test/check function within a module |

### Test Files

| Pattern                      | Example                           | Purpose                              |
|------------------------------|-----------------------------------|--------------------------------------|
| `*.Tests.ps1`               | `EmailProtection.Tests.ps1`       | Pester test file for a module        |
| `Describe` blocks           | `Describe "EmailProtection"`      | Top-level grouping by module         |
| `Context` blocks            | `Context "SPF Record Validation"` | Grouping by check category           |
| `It` blocks                 | `It "Should flag missing SPF..."`  | Individual test case                 |

### Test Naming Rules

- `It` block names start with `Should` followed by expected behavior.
- Use descriptive names; avoid abbreviations.
- Include the condition being tested: `Should flag X when Y`, `Should pass when Z is valid`.
- Group related tests using `Context` blocks that mirror check categories.

---

## 9. Adding New Tests -- Guidelines

### Step-by-Step Process

1. **Identify the check function** to be tested (e.g., `Test-ConditionalAccessPolicies` in the EntraID module).

2. **Create or update the test file**. If a `*.Tests.ps1` file exists for the module, add tests there. Otherwise, create a new file following the naming convention.

3. **Define mock data** that simulates the Graph API / Exchange Online / Teams response the check function would receive.

4. **Write tests for each scenario:**
   - **Positive case:** Configuration is secure; no finding should be generated.
   - **Negative case:** Configuration is insecure; finding should be generated with correct severity.
   - **Edge cases:** Empty data, null values, partial configurations.

5. **Validate finding structure:** Ensure generated findings have all required properties.

6. **Run the test** to confirm it passes:
   ```powershell
   Invoke-Pester .\tests\YourModule.Tests.ps1 -Verbose
   ```

7. **Run the full suite** to confirm no regressions:
   ```powershell
   Invoke-Pester .\tests\ -Verbose
   ```

### Test Template

```powershell
# ModuleName.Tests.ps1

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$sut = (Split-Path -Leaf $MyInvocation.MyCommand.Path) -replace '\.Tests\.', '.'

# Import the module under test
Import-Module "$here\..\M365-SecurityAssessment.psd1" -Force

Describe "ModuleName" {

    Context "CheckCategory" {

        It "Should flag insecure configuration as a finding" {
            # Arrange
            Mock Get-SomeApiData {
                return @{ InsecureSetting = $true }
            }

            # Act
            $result = Test-SomeCheck

            # Assert
            $result.FindingGenerated | Should Be $true
            $result.Severity | Should Be "High"
        }

        It "Should pass secure configuration without generating a finding" {
            # Arrange
            Mock Get-SomeApiData {
                return @{ InsecureSetting = $false }
            }

            # Act
            $result = Test-SomeCheck

            # Assert
            $result.FindingGenerated | Should Be $false
        }
    }
}
```

---

## 10. Coverage Metrics

### Current State

Code coverage is **not currently collected or enforced**. Pester 3.4.0 supports basic code coverage via the `-CodeCoverage` parameter, but this has not been configured.

### Planned Approach

```powershell
# Run tests with code coverage for a specific module
Invoke-Pester .\tests\EmailProtection.Tests.ps1 -CodeCoverage .\modules\EmailProtection\*.ps1

# Run tests with code coverage for all modules
Invoke-Pester .\tests\ -CodeCoverage .\modules\**\*.ps1
```

### Coverage Targets (Planned)

| Metric                          | Minimum Threshold | Stretch Target | Notes                                     |
|---------------------------------|-------------------|----------------|-------------------------------------------|
| **Overall function coverage**   | 70%               | 85%            | Percentage of check functions with tests  |
| **Check function coverage**     | 80%               | 95%            | Critical: each check must have at least one positive and one negative test |
| **Collector coverage**          | 50%               | 70%            | Collectors are harder to test without live APIs |

---

## 11. Best Practices Checklist

- [x] Each test validates one behavior (single assertion or closely related assertions).
- [x] Tests follow the Arrange-Act-Assert (AAA) pattern.
- [x] No test relies on another test's execution or side effects.
- [x] External API dependencies are mocked via Pester `Mock` cmdlet.
- [x] Temporary test databases are created and destroyed per test run.
- [ ] Parameterized tests used for multiple input/output scenarios (future improvement).
- [ ] Code coverage collected and reported (not yet configured).
- [x] Test files are reviewed with the same rigor as production module code.
- [x] Tests are deterministic -- no dependency on network, time, or external state.

---

## 12. Appendix

### Pester 3.4.0 Quick Reference

| Command                                           | Purpose                                       |
|---------------------------------------------------|-----------------------------------------------|
| `Invoke-Pester .\tests\`                          | Run all tests                                 |
| `Invoke-Pester .\tests\ -Verbose`                 | Run all tests with detailed output            |
| `Invoke-Pester .\tests\File.Tests.ps1`            | Run a single test file                        |
| `Invoke-Pester -TestName "Should*"`               | Run tests matching a name pattern             |
| `Invoke-Pester -Tag "EmailProtection"`            | Run tests with a specific tag                 |
| `Invoke-Pester -CodeCoverage .\src\*.ps1`         | Run tests with code coverage                  |
| `Mock CommandName { return $mockData }`            | Mock a command for the current scope          |
| `Assert-MockCalled CommandName -Times 1`           | Verify a mock was called                      |

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Integration Testing](./integration-testing.md)
