# Integration Testing

| **Page Title**   | Integration Testing -- M365 Security Assessment Automation |
|------------------|-------------------------------------------------------------|
| **Last Updated** | 2026-02-15                                                  |
| **Status**       | IN PROGRESS                                                 |
| **Owner**        | IntelliSecOps Development Team                              |

---

## 1. Current State

Integration testing for the M365-SecurityAssessment module is currently **manual**. There are no automated integration tests that exercise the full pipeline (collector -> check -> finding -> report) against live or recorded API responses. Integration validation is performed by developers running the tool against a test M365 tenant and verifying results visually.

### What Needs to Be Done

1. Document the manual integration test procedures (this document).
2. Establish repeatable manual test scripts for each assessment module.
3. **Future:** Record Graph API, Exchange Online, and Teams responses for automated Pester-based integration tests.
4. **Future:** Integrate automated integration tests into a CI/CD pipeline.

---

## 2. Integration Test Scope and Boundaries

Integration tests verify that multiple components of the M365-SecurityAssessment module work correctly together in sequence. They validate the end-to-end data flow from API collection through finding generation to report output.

### In Scope

| Category                                | Examples                                                              |
|-----------------------------------------|-----------------------------------------------------------------------|
| **Module import and loading**           | `Import-Module M365-SecurityAssessment.psd1` resolves all dependencies in correct order |
| **Credential save/load cycle**          | DPAPI encryption round-trip: save credentials, reload in new session, verify decryption |
| **Tenant connection**                   | Successful authentication to Graph API, Exchange Online, and Teams using stored credentials |
| **Collector execution**                 | Each `Collect-*` function retrieves data from the test tenant without errors |
| **Check execution**                     | Each `Check-*` function processes collected data and generates expected findings |
| **Full assessment pipeline**            | Collector -> Check -> Finding -> Evidence CSV -> Report (HTML/PDF/DOCX) |
| **Checkpoint/resume functionality**     | Assessment interrupted mid-run can be resumed from last completed module |
| **Dashboard start/stop**                | Pode-based dashboard starts on localhost, displays findings, stops cleanly |

### Out of Scope

| Category                                | Reason                                              | Covered By                   |
|-----------------------------------------|-----------------------------------------------------|------------------------------|
| Individual check logic correctness      | Validated by Pester unit tests                      | Unit tests (71+ tests)       |
| Performance under large tenant load     | Requires dedicated performance testing              | Performance testing          |
| Security of credential storage          | Validated by security testing procedures            | Security testing             |
| Cross-tenant or multi-tenant scenarios  | Single-tenant tool; not applicable                  | N/A                          |

---

## 3. Integration Test Scenarios

### 3.1 Module Import and Loading

| Aspect                       | Details                                                               |
|------------------------------|-----------------------------------------------------------------------|
| **Purpose**                  | Verify the module and all sub-modules import without errors           |
| **Dependency order**         | SQLite assembly -> ControlsDB -> Collectors -> Checks -> Report -> Dashboard |
| **Expected behavior**        | `Import-Module` completes with no errors; all exported functions are available |
| **Failure indicators**       | Missing assembly errors, function not found, circular dependency warnings |

#### Manual Test Procedure

```powershell
# Step 1: Start a clean PowerShell session
powershell.exe -NoProfile

# Step 2: Import the module
Import-Module "C:\Path\To\M365-SecurityAssessment.psd1" -Verbose

# Step 3: Verify exported functions
Get-Command -Module M365-SecurityAssessment | Format-Table Name, CommandType

# Step 4: Verify specific key functions exist
@(
    "Start-M365Assessment",
    "Connect-M365Tenant",
    "Save-M365Credentials",
    "Get-M365Credentials",
    "Collect-EntraIDData",
    "Check-EntraIDSecurity",
    "New-AssessmentReport",
    "Start-AssessmentDashboard"
) | ForEach-Object {
    $cmd = Get-Command $_ -ErrorAction SilentlyContinue
    if ($cmd) { Write-Host "[PASS] $_ found" -ForegroundColor Green }
    else { Write-Host "[FAIL] $_ NOT found" -ForegroundColor Red }
}

# Expected: All functions listed as [PASS]
```

---

### 3.2 Credential Save/Load Cycle

| Aspect                       | Details                                                               |
|------------------------------|-----------------------------------------------------------------------|
| **Purpose**                  | Verify DPAPI-encrypted credentials survive save and reload across sessions |
| **Encryption method**        | Windows DPAPI (Data Protection API) -- user-scoped encryption         |
| **Expected behavior**        | Credentials saved in one session are correctly decrypted in a new session on the same machine/user |
| **Failure indicators**       | Decryption errors, empty credential values, permission denied          |

#### Manual Test Procedure

```powershell
# Step 1: Save credentials
Save-M365Credentials -TenantId "test-tenant-id" `
                     -ClientId "test-client-id" `
                     -ClientSecret "test-client-secret" `
                     -Path "C:\Temp\TestCreds"

# Step 2: Verify credential file exists
Test-Path "C:\Temp\TestCreds\credentials.xml"  # Should return True

# Step 3: Close and reopen PowerShell session
# (Start new PowerShell window)

# Step 4: Load credentials
Import-Module "C:\Path\To\M365-SecurityAssessment.psd1"
$creds = Get-M365Credentials -Path "C:\Temp\TestCreds"

# Step 5: Verify decrypted values
$creds.TenantId | Should -Not -BeNullOrEmpty  # Manual check
$creds.ClientId | Should -Not -BeNullOrEmpty

# Step 6: Cleanup
Remove-Item "C:\Temp\TestCreds" -Recurse -Force
```

---

### 3.3 Tenant Connection

| Aspect                       | Details                                                               |
|------------------------------|-----------------------------------------------------------------------|
| **Purpose**                  | Verify successful authentication to all three M365 service endpoints  |
| **Services tested**          | Microsoft Graph API, Exchange Online, Microsoft Teams                  |
| **Prerequisites**            | Valid App Registration in test tenant with required permissions        |
| **Expected behavior**        | Connection established; no authentication errors; token acquired       |

#### Manual Test Procedure

```powershell
# Step 1: Connect to test tenant
Connect-M365Tenant -TenantId $testTenantId `
                   -ClientId $testClientId `
                   -ClientSecret $testClientSecret

# Step 2: Verify Graph API connection
$graphTest = Invoke-MgGraphRequest -Uri "https://graph.microsoft.com/v1.0/organization"
Write-Host "Graph API: Connected to $($graphTest.value[0].displayName)"

# Step 3: Verify Exchange Online connection
$exoTest = Get-OrganizationConfig
Write-Host "Exchange Online: Connected to $($exoTest.Name)"

# Step 4: Verify Teams connection
$teamsTest = Get-CsTeamsClientConfiguration
Write-Host "Teams: Configuration retrieved successfully"

# Expected: All three connections succeed without errors
```

#### Required App Registration Permissions

| Service              | Permission                                      | Type          |
|----------------------|-------------------------------------------------|---------------|
| **Graph API**        | `User.Read.All`                                 | Application   |
| **Graph API**        | `Directory.Read.All`                            | Application   |
| **Graph API**        | `DeviceManagementConfiguration.Read.All`        | Application   |
| **Graph API**        | `Policy.Read.All`                               | Application   |
| **Graph API**        | `SecurityEvents.Read.All`                       | Application   |
| **Exchange Online**  | Exchange Administrator role                      | Admin role    |
| **Teams**            | Teams Administrator role                         | Admin role    |

---

### 3.4 Full Assessment Run

| Aspect                       | Details                                                               |
|------------------------------|-----------------------------------------------------------------------|
| **Purpose**                  | Verify the complete assessment pipeline produces correct output        |
| **Pipeline flow**            | Connect -> Collect -> Check -> Generate Findings -> Export Evidence -> Generate Report |
| **Expected behavior**        | Assessment completes for all modules; findings match known tenant state; reports render correctly |
| **Duration**                 | Approximately 10-30 minutes depending on tenant size                  |

#### Manual Test Procedure

```powershell
# Step 1: Run full assessment against test tenant
$assessmentResult = Start-M365Assessment -TenantId $testTenantId `
                                          -ClientId $testClientId `
                                          -ClientSecret $testClientSecret `
                                          -OutputPath "C:\Temp\TestAssessment" `
                                          -Verbose

# Step 2: Verify each module completed
$assessmentResult.ModulesCompleted | ForEach-Object {
    Write-Host "[PASS] Module completed: $_" -ForegroundColor Green
}

# Step 3: Verify findings were generated
$findings = $assessmentResult.Findings
Write-Host "Total findings: $($findings.Count)"
$findings | Group-Object Module | Format-Table Name, Count

# Step 4: Spot-check known findings
# (Against test tenant with known insecure configurations)
$mfaFinding = $findings | Where-Object { $_.FindingID -eq "ENTRA-001" }
if ($mfaFinding) { Write-Host "[PASS] MFA finding detected" -ForegroundColor Green }
else { Write-Host "[FAIL] MFA finding NOT detected (expected)" -ForegroundColor Red }

# Step 5: Verify evidence CSVs
Get-ChildItem "C:\Temp\TestAssessment\Evidence\*.csv" | ForEach-Object {
    $rows = Import-Csv $_.FullName
    Write-Host "[INFO] $($_.Name): $($rows.Count) rows"
}

# Step 6: Verify report files
@("Report.html", "Report.pdf", "Report.docx") | ForEach-Object {
    $reportPath = "C:\Temp\TestAssessment\$_"
    if (Test-Path $reportPath) {
        Write-Host "[PASS] $_ generated ($(((Get-Item $reportPath).Length / 1KB).ToString('N0')) KB)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $_ NOT generated" -ForegroundColor Red
    }
}
```

---

### 3.5 Checkpoint/Resume Functionality

| Aspect                       | Details                                                               |
|------------------------------|-----------------------------------------------------------------------|
| **Purpose**                  | Verify an interrupted assessment can be resumed from the last checkpoint |
| **Checkpoint mechanism**     | Assessment state saved after each module completes                     |
| **Expected behavior**        | Resume skips completed modules; continues from the next module; final output is identical to uninterrupted run |

#### Manual Test Procedure

```powershell
# Step 1: Start assessment and interrupt after 2 modules
$assessment = Start-M365Assessment -TenantId $testTenantId `
                                    -ClientId $testClientId `
                                    -ClientSecret $testClientSecret `
                                    -OutputPath "C:\Temp\CheckpointTest" `
                                    -Verbose
# Press Ctrl+C after EntraID and DeviceManagement modules complete

# Step 2: Verify checkpoint file exists
Test-Path "C:\Temp\CheckpointTest\checkpoint.json"  # Should return True

# Step 3: Resume assessment
$resumed = Start-M365Assessment -Resume `
                                 -OutputPath "C:\Temp\CheckpointTest" `
                                 -Verbose

# Step 4: Verify resumed assessment skipped completed modules
# Console output should show "Skipping EntraID (already completed)"
# Console output should show "Skipping DeviceManagement (already completed)"
# Console output should show "Starting EmailProtection..."

# Step 5: Verify final output is complete
$resumed.ModulesCompleted.Count  # Should equal total module count
```

---

### 3.6 Dashboard Start/Stop

| Aspect                       | Details                                                               |
|------------------------------|-----------------------------------------------------------------------|
| **Purpose**                  | Verify the Pode-based assessment dashboard starts, serves content, and stops cleanly |
| **Dashboard framework**      | Pode (PowerShell web server)                                          |
| **Binding**                  | `localhost` only (not externally accessible)                          |
| **Expected behavior**        | Dashboard starts on configured port; pages render findings; dashboard stops without orphaned processes |

#### Manual Test Procedure

```powershell
# Step 1: Start dashboard with test assessment data
Start-AssessmentDashboard -AssessmentPath "C:\Temp\TestAssessment" -Port 8080

# Step 2: Verify dashboard is running
$response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing
$response.StatusCode  # Should be 200

# Step 3: Verify findings page
$findingsPage = Invoke-WebRequest -Uri "http://localhost:8080/findings" -UseBasicParsing
$findingsPage.Content -match "ENTRA-001"  # Should be True

# Step 4: Stop dashboard
Stop-AssessmentDashboard

# Step 5: Verify no orphaned processes
Get-Process -Name "powershell" | Where-Object {
    $_.MainWindowTitle -match "Pode"
}  # Should return nothing
```

---

## 4. Test M365 Tenant Requirements

### Tenant Configuration for Integration Testing

| Component                       | Required Configuration                                              |
|---------------------------------|---------------------------------------------------------------------|
| **Azure AD / Entra ID**         | Mix of secure and insecure configurations: some users without MFA, legacy auth enabled on some apps, guest users present |
| **Email Protection**            | Domains with known SPF/DKIM/DMARC states (one valid, one missing/weak); default and custom anti-spam policies |
| **Device Management**           | Intune enrolled devices with compliance policies; some non-compliant devices |
| **Teams & SharePoint**          | Guest access enabled; external sharing configured; known policy gaps |
| **App Registrations**           | Test app with required API permissions (see section 3.3)            |
| **Test Data Seeded**            | Known-state configurations documented so expected findings can be validated |

### Test Tenant Security State Documentation

Maintain a document mapping each known configuration state to its expected finding:

| Configuration State                      | Expected Finding ID | Expected Severity | Module          |
|------------------------------------------|--------------------|--------------------|-----------------|
| Users without MFA enforced               | ENTRA-001          | Critical           | EntraID         |
| Legacy authentication not blocked        | ENTRA-005          | High               | EntraID         |
| Missing SPF record on secondary domain   | EMAIL-001          | High               | EmailProtection |
| DMARC policy set to `p=none`             | EMAIL-003          | Medium             | EmailProtection |
| Guest access enabled in Teams            | TEAMS-002          | Medium             | TeamsSharePoint |
| Non-compliant devices in Intune          | DEVICE-004         | High               | DeviceManagement|

---

## 5. Manual Integration Test Procedure by Module

### Test Execution Checklist

| # | Module                | Test Steps                                                     | Expected Findings | Pass/Fail | Date     | Tester   |
|---|----------------------|----------------------------------------------------------------|-------------------|-----------|----------|----------|
| 1 | **Module Import**    | `Import-Module` with `-Verbose`; verify all functions exported | N/A               |           |          |          |
| 2 | **Credentials**      | Save, close session, reload, verify decryption                 | N/A               |           |          |          |
| 3 | **Tenant Connect**   | Connect to Graph API, Exchange Online, Teams                   | N/A               |           |          |          |
| 4 | **EntraID**          | Run collector and checks; verify 39 finding definitions evaluated | Per test tenant |           |          |          |
| 5 | **DeviceManagement** | Run collector and checks; verify 18 finding definitions evaluated | Per test tenant |           |          |          |
| 6 | **EmailProtection**  | Run collector and checks; verify 13 finding definitions evaluated | Per test tenant |           |          |          |
| 7 | **TeamsSharePoint**  | Run collector and checks; verify 17 finding definitions evaluated | Per test tenant |           |          |          |
| 8 | **Report Generation**| Generate HTML, PDF, DOCX; verify content and formatting        | N/A               |           |          |          |
| 9 | **Evidence CSVs**    | Open each CSV; verify affected resources are listed            | N/A               |           |          |          |
| 10| **Checkpoint/Resume**| Interrupt and resume; verify completion                        | N/A               |           |          |          |
| 11| **Dashboard**        | Start, verify pages, stop; verify clean shutdown               | N/A               |           |          |          |

---

## 6. Future: Automated Integration Tests with Recorded API Responses

### Approach

The long-term plan is to capture real API responses from the test tenant and replay them in Pester tests using the `Mock` cmdlet. This enables automated integration testing without requiring a live tenant connection.

| Phase                         | Description                                                          | Status         |
|-------------------------------|----------------------------------------------------------------------|----------------|
| **Phase 1: Record**          | Run each collector against the test tenant and save raw JSON responses to `tests/fixtures/` | Not started |
| **Phase 2: Replay**          | Create Pester tests that mock API calls with recorded responses and validate the full collector -> check -> finding pipeline | Not started |
| **Phase 3: Automate**        | Add replay-based integration tests to CI/CD pipeline                 | Not started    |

### Recorded Response File Structure (Planned)

```
tests/
  fixtures/
    EntraID/
      users.json              # Recorded response from /users endpoint
      conditionalAccess.json  # Recorded response from /identity/conditionalAccess/policies
      groups.json             # Recorded response from /groups
    EmailProtection/
      transportRules.json     # Recorded Exchange transport rules
      antiSpamPolicies.json   # Recorded anti-spam policy configuration
      dkimConfig.json         # Recorded DKIM signing configuration
    DeviceManagement/
      managedDevices.json     # Recorded response from /deviceManagement/managedDevices
      compliancePolicies.json # Recorded compliance policy configuration
    TeamsSharePoint/
      teamsSettings.json      # Recorded Teams client configuration
      sharingPolicies.json    # Recorded SharePoint sharing policies
```

### Example Replay-Based Integration Test (Planned)

```powershell
Describe "EntraID Integration (Recorded Responses)" {
    BeforeAll {
        # Load recorded API responses
        $usersResponse = Get-Content ".\tests\fixtures\EntraID\users.json" | ConvertFrom-Json
        $capResponse = Get-Content ".\tests\fixtures\EntraID\conditionalAccess.json" | ConvertFrom-Json

        # Mock all Graph API calls with recorded data
        Mock Invoke-MgGraphRequest {
            return $usersResponse
        } -ParameterFilter { $Uri -like "*/users*" }

        Mock Invoke-MgGraphRequest {
            return $capResponse
        } -ParameterFilter { $Uri -like "*/conditionalAccess*" }
    }

    It "Should produce the expected findings for the recorded tenant state" {
        # Run the full EntraID assessment pipeline
        $collected = Collect-EntraIDData
        $findings = Check-EntraIDSecurity -CollectedData $collected

        # Validate against known expected findings
        $findings.Count | Should BeGreaterThan 0
        $findings | Where-Object { $_.FindingID -eq "ENTRA-001" } | Should Not BeNullOrEmpty
    }
}
```

---

## 7. Known Limitations

| Area                                    | Limitation                                                      | Mitigation                                       |
|-----------------------------------------|-----------------------------------------------------------------|--------------------------------------------------|
| **Live API dependency**                 | Integration tests require a real M365 test tenant               | Record responses for offline replay (future)     |
| **Exchange Online connection time**     | EXO module connection takes 15-30 seconds                       | Reuse session across multiple test scenarios     |
| **DPAPI credential portability**        | Encrypted credentials are machine+user specific                 | Document constraint; re-save on new machine      |
| **Test tenant configuration drift**     | Manual changes to test tenant can invalidate expected findings   | Document expected state; reset script (future)   |
| **No CI/CD integration**               | All integration tests are manual                                | Implement CI/CD pipeline (planned)               |
| **PDF rendering dependency**            | PDF generation requires Edge browser for HTML-to-PDF conversion | Document Edge dependency; test on target OS      |

---

## 8. Appendix

### Integration Test Schedule

| Test Type                    | Frequency                           | Duration      | Triggered By                  |
|------------------------------|-------------------------------------|---------------|-------------------------------|
| Module import/credential     | Every development session           | 2 minutes     | Developer                     |
| Single module assessment     | During module development           | 5-10 minutes  | Developer                     |
| Full assessment pipeline     | Before each release                 | 20-30 minutes | Development lead              |
| Checkpoint/resume            | Before each release                 | 15 minutes    | Development lead              |
| Dashboard validation         | Before each release                 | 5 minutes     | Developer                     |

### Related Pages

- [Test Strategy](./test-strategy.md)
- [Unit Testing](./unit-testing.md)
- [Performance Testing](./performance-testing.md)
