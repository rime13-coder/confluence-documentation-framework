# Architecture Decision Record (ADR) Template

| **Metadata**     | **Value**                                      |
|------------------|------------------------------------------------|
| Page Title       | M365-SecurityAssessment - Architecture Decision Records |
| Last Updated     | 2026-02-15                                     |
| Status           | `CURRENT`                                      |
| Owner            | Module Author                                  |
| Reviewers        | Security Consultant Lead, Engineering Manager  |

---

## ADR Index

| ADR # | Title | Status | Date | Decision Maker |
|-------|-------|--------|------|----------------|
| ADR-001 | Use PowerShell as Primary Implementation Language | `Accepted` | 2025-10-15 | Module Author |
| ADR-002 | Use Modular Architecture with Independent Assessment Modules | `Accepted` | 2025-10-20 | Module Author |
| ADR-003 | Use DPAPI for Credential Encryption | `Accepted` | 2025-10-22 | Module Author |
| ADR-004 | Use Pode for Web Dashboard | `Accepted` | 2025-11-05 | Module Author |

---

---

# ADR-001: Use PowerShell as Primary Implementation Language

## ADR-001: Use PowerShell as Primary Implementation Language

| **Field**        | **Value**                                                |
|------------------|----------------------------------------------------------|
| ADR Number       | ADR-001                                                  |
| Title            | Use PowerShell as Primary Implementation Language        |
| Date             | 2025-10-15                                               |
| Status           | `Accepted`                                               |
| Decision Maker   | Module Author                                            |
| Consulted        | Security Consultant Lead, Senior PowerShell Developer    |
| Informed         | Engineering Manager, Security Consulting Team            |

---

### Context

The M365-SecurityAssessment tool needs a primary implementation language. The tool automates Microsoft 365 tenant security assessments by connecting to Graph API, Exchange Online, Microsoft Teams, and SharePoint to collect configuration data, evaluate it against security best practices, and generate reports. The following factors influence the language choice:

- **Target users**: Security consultants who routinely use PowerShell for M365 administration and assessment tasks. They are comfortable reading and extending PowerShell scripts but may not be proficient in compiled languages like C# or Python.
- **M365 ecosystem**: Microsoft provides official PowerShell modules for M365 management (Microsoft.Graph, ExchangeOnlineManagement, MicrosoftTeams). These modules are first-class citizens in the M365 administration ecosystem, with comprehensive cmdlet coverage and regular updates.
- **Credential security**: The tool must securely store credentials for target M365 tenants. Windows provides DPAPI (Data Protection API) for user-scoped encryption, which is natively accessible from PowerShell and .NET but not directly available from Python or Node.js without additional dependencies.
- **Distribution**: The tool should be distributable via PowerShell Gallery (Install-Module) for easy adoption by security consultants who already manage PowerShell modules.
- **Extensibility**: Security consultants should be able to add new checks and collectors without learning a new language or setting up a development environment beyond what they already have (PowerShell ISE or VS Code with PowerShell extension).
- **No server infrastructure**: The tool must run locally on a consultant's Windows workstation with no cloud deployment or compilation step required.

---

### Decision

We will use **PowerShell** (supporting both Windows PowerShell 5.1 and PowerShell 7+) as the primary implementation language for the M365-SecurityAssessment module.

Specific implementation details:
- **Module packaging**: Standard PowerShell module with PSD1 manifest and PSM1 loader
- **Distribution**: PowerShell Gallery via Publish-Module
- **Minimum version**: PowerShell 5.1 (ships with Windows 10/11); PowerShell 7+ fully supported
- **Coding standard**: Advanced functions with CmdletBinding, proper parameter validation, pipeline support where applicable, approved verb-noun naming (Verb-M365Noun)
- **Dependencies**: Declared in PSD1 RequiredModules (Microsoft.Graph, ExchangeOnlineManagement, MicrosoftTeams, PSSQLite, Pode, PSWriteWord, ImportExcel)

---

### Alternatives Considered

| # | Option | Pros | Cons |
|---|--------|------|------|
| 1 | **PowerShell** -- chosen | Native M365 module integration (Microsoft.Graph, ExchangeOnlineManagement, MicrosoftTeams are PowerShell modules); target users (security consultants) are proficient in PowerShell; DPAPI natively accessible via .NET interop; distribution via PowerShell Gallery; no compilation step; extensible by consultants who can write new checks in the same language; runs on any Windows system without additional runtime installation (PS 5.1 is built-in) | Single-threaded execution model limits parallelism; less performant than compiled languages for large data processing; limited testing frameworks compared to Python/C#; dynamic typing can lead to runtime errors; IDE support is adequate but not as rich as C#/Python |
| 2 | **Python** | Excellent data processing libraries (pandas, requests); strong typing available (type hints + mypy); rich testing ecosystem (pytest); cross-platform; large developer community | No native M365 PowerShell module integration -- would need to call Graph API directly or shell out to PowerShell; security consultants less familiar with Python; no DPAPI without ctypes/win32crypt wrappers; additional runtime installation required (Python not built into Windows); distribution via pip is unfamiliar to target audience |
| 3 | **C# (.NET Console Application)** | Strong typing; excellent performance; native DPAPI access via System.Security.Cryptography; can reference M365 SDK NuGet packages; rich IDE support (Visual Studio/Rider) | Requires compilation and distribution of binaries; security consultants cannot easily read or extend C# code; not distributable via PowerShell Gallery; higher barrier to entry for the target audience; development velocity slower for a tool that is primarily calling APIs and applying rule-based logic |
| 4 | **Hybrid (Python + PowerShell)** | Best of both worlds: Python for data processing and reporting, PowerShell for M365 API calls | Two languages to maintain; complex build and distribution process; dependency management across two ecosystems; harder to onboard contributors; debugging across language boundaries is difficult |

---

### Consequences

**What becomes easier or better:**
- Security consultants can read, understand, and extend the codebase using skills they already have
- Native integration with Microsoft.Graph, ExchangeOnlineManagement, and MicrosoftTeams modules eliminates the need for custom API client code
- DPAPI credential encryption is a one-liner via .NET interop (`[System.Security.Cryptography.ProtectedData]::Protect()`)
- Distribution via PowerShell Gallery allows `Install-Module M365-SecurityAssessment` for immediate adoption
- No compilation step; changes to checks or collectors take effect immediately
- Module can be run from any PowerShell prompt on any Windows machine without additional setup

**What becomes harder or worse:**
- Performance: PowerShell's single-threaded model means collectors run sequentially; a large tenant assessment may take 30-60 minutes where a multi-threaded approach could be faster
- Testing: Pester (PowerShell testing framework) is capable but less ergonomic than pytest or xUnit; mocking M365 API responses requires more boilerplate
- Type safety: PowerShell's dynamic typing means some errors are only caught at runtime; mitigated by strict mode (`Set-StrictMode -Version Latest`) and parameter validation
- Code organization: Large PowerShell modules can become unwieldy; mitigated by the modular architecture (each assessment domain is a separate module with its own files)

**Risks:**
- PowerShell version compatibility issues between 5.1 and 7+: Mitigated by testing on both versions; avoiding 7+-only features in core engine; documenting version-specific behaviors
- Microsoft deprecating PowerShell modules in favor of Graph SDK only: Low risk; PowerShell is Microsoft's primary admin scripting language; ExchangeOnlineManagement and MicrosoftTeams modules are actively maintained
- Performance bottleneck on very large tenants (50,000+ users): Mitigated by collector caching (collect once, check many); pagination; future consideration for parallel runspaces

---

### Compliance and Security Implications

| Aspect | Implication | Mitigation |
|--------|------------|------------|
| Script Execution Policy | PowerShell execution policy may block module loading on locked-down workstations | Document requirement: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`; module is signed (planned) |
| Code Transparency | PowerShell source is human-readable; consultants and customers can audit the module code | Positive: builds trust; no obfuscated binaries; all assessment logic is inspectable |
| Credential Handling | Credentials pass through PowerShell memory before DPAPI encryption/decryption | Use SecureString where possible; clear variables after use; DPAPI encryption happens immediately; credentials are never written to disk in plaintext |
| Module Tampering | A compromised PowerShell Gallery package could inject malicious code | Plan to sign module with Authenticode certificate; hash verification documented in release notes; pin to specific versions |

---

### References

- [PowerShell Gallery documentation](https://learn.microsoft.com/en-us/powershell/gallery/overview)
- [Microsoft.Graph PowerShell SDK](https://learn.microsoft.com/en-us/powershell/microsoftgraph/overview)
- [ExchangeOnlineManagement module](https://learn.microsoft.com/en-us/powershell/exchange/exchange-online-powershell-v2)
- [MicrosoftTeams module](https://learn.microsoft.com/en-us/microsoftteams/teams-powershell-overview)
- [Windows DPAPI documentation](https://learn.microsoft.com/en-us/dotnet/standard/security/how-to-use-data-protection)

---

### Approval

| Role | Name | Date | Decision |
|------|------|------|----------|
| Module Author | ___________________ | 2025-10-15 | [x] Approve |
| Security Consultant Lead | ___________________ | 2025-10-16 | [x] Approve |
| Engineering Manager | ___________________ | 2025-10-16 | [x] Approve |

---

---

# ADR-002: Use Modular Architecture with Independent Assessment Modules

## ADR-002: Use Modular Architecture with Independent Assessment Modules

| **Field**        | **Value**                                                |
|------------------|----------------------------------------------------------|
| ADR Number       | ADR-002                                                  |
| Title            | Use Modular Architecture with Independent Assessment Modules |
| Date             | 2025-10-20                                               |
| Status           | `Accepted`                                               |
| Decision Maker   | Module Author                                            |
| Consulted        | Security Consultant Lead, Senior PowerShell Developer    |
| Informed         | Engineering Manager, Security Consulting Team            |

---

### Context

The M365-SecurityAssessment module needs to assess multiple security domains within a Microsoft 365 tenant: Entra ID (identity and access), Device Management (Intune), Email Protection (Exchange Online), and Teams/SharePoint (collaboration). Each domain uses different APIs (Graph API, Exchange Online PowerShell, Teams PowerShell), evaluates different controls, and may need to be run independently (e.g., a consultant may only need an email security assessment). The architecture must support:

- **Selective execution**: Run only specific assessment domains based on engagement scope
- **Independent development**: New assessment domains can be added by team members without modifying existing code
- **Different API dependencies**: Each domain connects to different M365 services with different authentication and permissions
- **Reusable data**: Some collected data (e.g., user accounts) is needed by multiple domains (e.g., Entra ID and Device Management both need user lists)
- **Consistent output**: All domains must produce findings in the same standardized format regardless of their internal implementation
- **Future extensibility**: Additional domains (e.g., Power Platform, Azure AD B2C, Defender for Cloud Apps) should be addable without engine changes

---

### Decision

We will use a **modular plugin architecture** where each security assessment domain is an independent module with a standard structure (module.json manifest, .psm1 entry point, collectors/ directory, checks/ directory). The engine discovers, loads, and orchestrates modules without hardcoding knowledge of specific modules.

Specific implementation:
- **Module directory**: Each module resides in `Modules/{ModuleName}/` with a standard layout
- **Module manifest**: `module.json` declares the module's collectors, checks, required services, required permissions, and metadata
- **Module loader**: `ModuleLoader.ps1` scans the Modules/ directory for module.json files, resolves dependency order, and loads modules
- **Collector-check separation**: Collectors gather data (pure I/O); checks evaluate data (pure logic). This separation enables the shared `$CollectedData` cache pattern.
- **Scope parameter**: `Start-M365Assessment -Scope "EntraID,EmailProtection"` limits execution to specified modules
- **Standardized interface**: All collectors return data to `$CollectedData[collectorName]`; all checks return arrays of `New-M365Finding` objects

---

### Alternatives Considered

| # | Option | Pros | Cons |
|---|--------|------|------|
| 1 | **Modular plugin architecture** -- chosen | Independent module development; selective execution via -Scope parameter; standard module.json manifest enables discoverability; collector-check separation enables data reuse; new modules added by creating a directory with standard files; engine remains unchanged when modules are added/removed; clear ownership boundaries | More initial development effort for the module loader infrastructure; module.json schema must be carefully designed; inter-module data sharing requires careful cache key naming conventions; debugging across module boundaries can be harder |
| 2 | **Monolithic script** (single large .ps1 file) | Simplest implementation; no module loading overhead; easy to understand flow from top to bottom; no manifest schema to design | Does not scale: a single file for all assessment domains becomes unmaintainable; cannot run selective domains without commenting out code; adding new domains requires modifying the main script; risk of name collisions; no clear ownership; difficult for multiple developers to work on simultaneously |
| 3 | **Function-based organization** (single module, functions organized by naming convention) | Simpler than plugin architecture; standard PowerShell module pattern; no module.json manifests needed | No formal contract between engine and assessment functions; selective execution requires maintaining a mapping of function-name-to-domain; new domains require modifying the orchestrator to know about new functions; collector-check separation is a convention, not enforced; harder to add third-party modules |
| 4 | **Separate PowerShell modules per domain** (multiple .psd1/.psm1 modules) | Maximum isolation; each module installable independently via PowerShell Gallery; standard PowerShell dependency management | Complex distribution (user installs 5+ modules); version compatibility management across modules; shared engine code must be duplicated or published as a separate dependency module; harder to share collected data between modules |

---

### Consequences

**What becomes easier or better:**
- Adding a new assessment domain (e.g., Power Platform) requires only creating a new directory with module.json, .psm1, collectors/, and checks/ -- no engine changes
- Security consultants can run `Start-M365Assessment -Scope "EmailProtection"` for a focused email-only assessment, reducing assessment time and required permissions
- Collector caching via `$CollectedData` ensures that data collected by one module (e.g., user accounts) is available to other modules without redundant API calls
- Each module has clear ownership: one team member can own EntraID while another owns EmailProtection
- Module manifests provide a machine-readable inventory of all checks, collectors, and required permissions, enabling automated documentation and permission auditing

**What becomes harder or worse:**
- Initial setup requires building the ModuleLoader, module.json schema, and orchestrator integration -- more upfront engineering than a monolithic approach
- Module developers must understand the module.json contract and the collector/check patterns -- a learning curve for new contributors
- Inter-module dependencies (e.g., "EntraID collectors must run before DeviceManagement checks can evaluate user-device relationships") require dependency declaration and ordering in the orchestrator
- Debugging a finding that involves data from multiple collectors across modules requires understanding the data flow through the cache

**Risks:**
- Module.json schema becoming too rigid or too flexible: Mitigated by starting with a minimal schema (name, collectors, checks, requiredServices) and extending as needed; schema version field allows future evolution
- Collector cache key collisions between modules: Mitigated by naming convention: collector names must be globally unique; module.json validation warns on duplicates
- Module loading order bugs causing missing data: Mitigated by explicit dependency declaration in module.json (`requiredServices` and check-level `dependsOnCollectors`)

---

### Compliance and Security Implications

| Aspect | Implication | Mitigation |
|--------|------------|------------|
| Minimum Permission Principle | Modular architecture enables per-module permission scoping; running only EmailProtection requires only Exchange Online permissions, not Graph API or Teams | Module manifests declare `requiredPermissions`; the module provides documentation for minimal App Registration setup per scope |
| Third-Party Module Loading | Plugin architecture could load malicious modules if an attacker places a crafted module.json in the Modules/ directory | Modules are loaded only from the module's installation directory (not arbitrary paths); planned: module signature validation; documented: review all module code before deployment |
| Data Isolation Between Engagements | Module architecture does not enforce data isolation between assessments of different tenants | Each assessment writes to a separate output directory; `$CollectedData` is cleared between assessments; credential profiles are tenant-specific |

---

### References

- [PowerShell Module Authoring Best Practices](https://learn.microsoft.com/en-us/powershell/scripting/developer/module/writing-a-windows-powershell-module)
- [Plugin Architecture Patterns](https://en.wikipedia.org/wiki/Plug-in_(computing))

---

### Approval

| Role | Name | Date | Decision |
|------|------|------|----------|
| Module Author | ___________________ | 2025-10-20 | [x] Approve |
| Security Consultant Lead | ___________________ | 2025-10-21 | [x] Approve |
| Engineering Manager | ___________________ | 2025-10-22 | [x] Approve |

---

---

# ADR-003: Use DPAPI for Credential Encryption

## ADR-003: Use DPAPI for Credential Encryption

| **Field**        | **Value**                                                |
|------------------|----------------------------------------------------------|
| ADR Number       | ADR-003                                                  |
| Title            | Use DPAPI for Credential Encryption                      |
| Date             | 2025-10-22                                               |
| Status           | `Accepted`                                               |
| Decision Maker   | Module Author                                            |
| Consulted        | Security Consultant Lead, Security Architect             |
| Informed         | Engineering Manager, Security Consulting Team            |

---

### Context

The M365-SecurityAssessment module must securely store credentials for connecting to target M365 tenants. Security consultants may assess multiple tenants and need to save credential profiles for reuse across assessment sessions. The credential data includes Azure AD App Registration client secrets and/or references to certificate thumbprints. The storage mechanism must:

- **Encrypt at rest**: Client secrets must never be stored in plaintext on the consultant's workstation
- **User-scoped**: Credentials stored by one Windows user must not be accessible to another user on the same machine
- **Zero key management**: Security consultants should not need to manage encryption keys, passphrases, or vault configurations
- **Offline capable**: Credential decryption must work without internet connectivity (assessments may start from air-gapped staging areas)
- **PowerShell native**: The encryption mechanism must be callable from PowerShell without compiled dependencies

---

### Decision

We will use **Windows Data Protection API (DPAPI)** with `DataProtectionScope.CurrentUser` to encrypt credential profiles stored on the consultant's workstation.

Specific implementation:
- **Encryption**: `[System.Security.Cryptography.ProtectedData]::Protect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)`
- **Decryption**: `[System.Security.Cryptography.ProtectedData]::Unprotect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)`
- **Storage location**: `%APPDATA%\M365-SecurityAssessment\credentials\{ProfileName}.cred` (encrypted blob) + `{ProfileName}.meta.json` (non-sensitive metadata)
- **Scope**: CurrentUser -- only the Windows user who created the credential can decrypt it, even on shared machines
- **No additional entropy**: DPAPI uses the user's Windows credentials as the master key; no additional passphrase is required

---

### Alternatives Considered

| # | Option | Pros | Cons |
|---|--------|------|------|
| 1 | **Windows DPAPI (CurrentUser scope)** -- chosen | Zero key management (Windows handles master key derivation from user credentials); user-scoped by design; offline capable (no network call); native .NET API accessible from PowerShell; industry-standard Windows credential protection mechanism; no additional software to install | Windows-only (not available on macOS/Linux); credentials tied to the Windows user profile (not portable between machines); if Windows user password is reset via admin without knowledge, DPAPI-protected data may be lost; attacker with access to user's Windows session can decrypt |
| 2 | **Azure Key Vault** | Cloud-managed key storage; centralized credential management; audit logging; RBAC; hardware-backed HSMs available | Requires Azure subscription and internet connectivity; adds cloud dependency to a local tool; latency for every credential load; overkill for local workstation credential storage; requires its own authentication (chicken-and-egg problem: how to authenticate to Key Vault to get the credential to authenticate to M365?) |
| 3 | **Plaintext JSON files** | Simplest implementation; no encryption overhead; easy debugging | Unacceptable security risk: client secrets stored in plaintext; any user or malware with file read access can steal credentials; violates security best practices; would undermine trust in a security assessment tool |
| 4 | **PowerShell SecureString with Export-Clixml** | Built-in PowerShell mechanism; uses DPAPI under the hood (on Windows); familiar to PowerShell users | SecureString is considered deprecated by Microsoft for new development; limited to string data (not structured credential objects); no separation of encrypted and metadata files; essentially DPAPI with extra steps and less control |
| 5 | **AES-256 encryption with user-provided passphrase** | Cross-platform capable; strong encryption; user controls the key | Requires user to remember and enter passphrase on every use; passphrase management burden; risk of weak passphrases; key derivation (PBKDF2/Argon2) adds implementation complexity; not a better user experience than DPAPI for Windows-only tool |

---

### Consequences

**What becomes easier or better:**
- Zero-effort credential protection: `Save-M365Credential` encrypts automatically; `Get-M365Credential` decrypts automatically; no passphrases or key files to manage
- User-scoped isolation: on shared workstations, each user's credentials are protected by their Windows login credentials
- No external dependencies: DPAPI is built into Windows and accessible via .NET without additional modules
- Offline operation: credential decryption works without internet connectivity

**What becomes harder or worse:**
- Windows-only: the module cannot support macOS or Linux for credential storage (the assessment execution would need alternative credential input methods)
- Non-portable: credentials created on one machine cannot be moved to another machine or user profile; consultants must re-create profiles on new workstations
- Windows password reset risk: if an administrator resets a user's Windows password without the user's knowledge (domain admin password reset), DPAPI-protected data may become inaccessible

**Risks:**
- Windows user session compromise allows credential decryption: Mitigated by the fact that if an attacker has the user's Windows session, they already have access to everything the user can access; DPAPI prevents offline/other-user attacks, which is the primary threat model
- DPAPI data loss on Windows profile corruption: Mitigated by documenting that credential profiles should be re-created if Windows profile issues occur; profiles are quick to recreate (Save-M365Credential takes < 30 seconds)
- Cross-platform demand in the future: Mitigated by abstracting credential storage behind the Save/Get/Remove-M365Credential interface; a future cross-platform implementation could use AES-256 with keyring integration (macOS Keychain, Linux Secret Service) without changing the public API

---

### Compliance and Security Implications

| Aspect | Implication | Mitigation |
|--------|------------|------------|
| Credential Encryption at Rest | DPAPI provides AES-256 encryption using a key derived from Windows user credentials; meets encryption-at-rest requirements | No additional mitigation needed; DPAPI is accepted by security frameworks as appropriate for workstation credential storage |
| Key Management | No explicit key management by users or the module; master key is derived from Windows user credentials by the operating system | Document that credential security depends on Windows user account security; recommend strong Windows passwords and MFA for Windows logon |
| Credential Rotation | Stored credentials may become stale (expired client secret, rotated certificate) | Save-M365Credential overwrites existing profiles; document credential rotation procedure; authentication failures during assessment trigger clear error messages about credential validity |
| Multi-User Machines | DPAPI CurrentUser scope prevents other users from decrypting credentials | Files are stored in user-specific %APPDATA%; even if file permissions are misconfigured, encrypted blob is useless without the user's Windows credentials |
| Audit Trail | No built-in audit of credential access | `Get-M365Credential` updates LastUsed timestamp in meta.json; assessment logs record which profile was used for each assessment |

---

### References

- [Windows Data Protection API (DPAPI)](https://learn.microsoft.com/en-us/dotnet/standard/security/how-to-use-data-protection)
- [DPAPI Security Analysis](https://learn.microsoft.com/en-us/windows/win32/seccng/cng-dpapi)
- [PowerShell SecureString and DPAPI](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/convertto-securestring)

---

### Approval

| Role | Name | Date | Decision |
|------|------|------|----------|
| Module Author | ___________________ | 2025-10-22 | [x] Approve |
| Security Consultant Lead | ___________________ | 2025-10-23 | [x] Approve |
| Security Architect | ___________________ | 2025-10-24 | [x] Approve |

---

---

# ADR-004: Use Pode for Web Dashboard

## ADR-004: Use Pode for Web Dashboard

| **Field**        | **Value**                                                |
|------------------|----------------------------------------------------------|
| ADR Number       | ADR-004                                                  |
| Title            | Use Pode for Web Dashboard                               |
| Date             | 2025-11-05                                               |
| Status           | `Accepted`                                               |
| Decision Maker   | Module Author                                            |
| Consulted        | Security Consultant Lead, Senior PowerShell Developer    |
| Informed         | Engineering Manager, Security Consulting Team            |

---

### Context

The M365-SecurityAssessment module produces detailed assessment results (findings, evidence, reports) that are currently consumed via command-line output and generated report files. Several stakeholders requested a visual interface for:

- **Real-time assessment monitoring**: View assessment progress (which module is running, how many findings so far) without waiting for the full report
- **Finding exploration**: Browse, filter, and search findings interactively rather than scrolling through a large HTML or PDF report
- **Evidence drill-down**: Click on a finding to see its evidence, affected resources, and recommendations
- **Report download**: Download generated reports from a central location without navigating the filesystem

The dashboard must:
- Run locally on the consultant's workstation (no cloud hosting)
- Not require additional runtime installation (no Node.js, no Python, no Docker)
- Integrate naturally with the PowerShell module
- Be optional (the module must function fully without the dashboard)

---

### Decision

We will use **Pode**, a PowerShell-native web server framework, to provide a local web dashboard at `localhost:8080`.

Specific implementation:
- **Framework**: Pode (PowerShell module, installable via PowerShell Gallery)
- **Binding**: `localhost:8080` (configurable via `dashboard.port` in assessment-defaults.json)
- **Views**: HTML pages with embedded CSS/JS served by Pode's view engine
- **API endpoints**: REST endpoints (`/api/status`, `/api/findings`, `/api/summary`, `/api/reports`) returning JSON
- **State sharing**: Dashboard reads from a synchronized hashtable (`$Global:M365AssessmentState`) written by the Orchestrator
- **Lifecycle**: `Start-M365Dashboard` launches Pode in a background runspace; `Stop-M365Dashboard` stops it; dashboard is optional and does not affect assessment execution

---

### Alternatives Considered

| # | Option | Pros | Cons |
|---|--------|------|------|
| 1 | **Pode (PowerShell web server)** -- chosen | Pure PowerShell: no additional runtime (Node.js, Python) required; installable via PowerShell Gallery; natural integration with the PowerShell module (shared state via variables); lightweight (runs in a background runspace); localhost-only by default (secure); active community and maintenance; supports REST API, static file serving, and view templates | Less mature than established web frameworks (Express, Flask); smaller community; limited middleware ecosystem; not suitable for production web applications (but appropriate for local tooling dashboard); consultants unfamiliar with Pode may find it unusual |
| 2 | **Electron application** | Rich desktop UI; cross-platform; full web technology stack (HTML/CSS/JS/React); polished user experience | Massive additional dependency (~150MB Electron runtime); requires Node.js for development; complex build and distribution; consultant must install a separate desktop application; overkill for a progress dashboard; difficult to integrate with PowerShell module state |
| 3 | **No UI (CLI only)** | Zero additional dependencies; simplest implementation; PowerShell console output is familiar to target audience | No real-time visual monitoring; finding exploration limited to scrolling report files; no filtering or search; stakeholders requested visual interface; less impressive for client-facing assessment delivery |
| 4 | **Python Flask/FastAPI + HTML** | Mature web frameworks; extensive template and extension ecosystem; good REST API support | Requires Python runtime installation; unfamiliar to PowerShell-centric consultants; state sharing between PowerShell and Python process is complex (IPC, file-based, or HTTP); adds Python as a dependency to a PowerShell project |
| 5 | **PowerShell Out-GridView / WPF GUI** | Native PowerShell UI options; no additional modules | Out-GridView is modal and blocks the pipeline; WPF requires XAML knowledge and complex data binding; not web-based (no browser access); poor UX for finding exploration; cannot serve reports for download |

---

### Consequences

**What becomes easier or better:**
- Consultants get a visual dashboard at `localhost:8080` to monitor assessment progress in real time
- Finding exploration with filtering by severity, module, and status is available immediately after assessment completion
- Report files can be downloaded from the dashboard without navigating the filesystem
- The dashboard runs in a background runspace, allowing the PowerShell console to remain available for other commands during assessment
- No additional runtime installation: `Install-Module Pode` is sufficient

**What becomes harder or worse:**
- Pode adds a PowerShell module dependency to the project
- Dashboard HTML/CSS/JS development requires front-end skills that some PowerShell developers may not have
- The synchronized hashtable for state sharing between the assessment runspace and the Pode runspace requires careful concurrent access handling
- The dashboard is localhost-only by default; making it accessible to other machines on the network would require explicit configuration and security considerations

**Risks:**
- Pode module becoming unmaintained: Mitigated by the dashboard being optional; assessment functions fully without it; Pode is actively maintained as of 2026; the dashboard code is isolated and could be ported to another framework if needed
- Port 8080 conflict with other local services: Mitigated by making the port configurable via `dashboard.port` setting; `Start-M365Dashboard` checks port availability before binding
- Accidental exposure to network: Mitigated by binding to `localhost` only; Pode configuration explicitly sets `Address` to `localhost`; firewall rules not modified

---

### Compliance and Security Implications

| Aspect | Implication | Mitigation |
|--------|------------|------------|
| Network Exposure | Web server running on consultant's workstation could be accessed from the network if misconfigured | Bind to `localhost` only (127.0.0.1); do not modify firewall rules; document that the dashboard is local-only |
| Data Exposure | Dashboard serves assessment findings via HTTP (not HTTPS) on localhost | Acceptable for localhost traffic (no network transit); HTTPS not required for loopback interface; data never leaves the machine |
| Authentication | Dashboard has no authentication mechanism | Acceptable for localhost-only service; only the local user can access it; if network binding is ever needed, authentication must be added first |
| Assessment Data in Browser | Finding details (tenant configuration, security weaknesses) are displayed in the browser | Browser history and cache may retain assessment data; document that consultants should clear browser data after assessment on shared workstations; use no-cache headers |

---

### References

- [Pode documentation](https://badgerati.github.io/Pode/)
- [Pode PowerShell Gallery](https://www.powershellgallery.com/packages/Pode)
- [Pode GitHub repository](https://github.com/Badgerati/Pode)

---

### Approval

| Role | Name | Date | Decision |
|------|------|------|----------|
| Module Author | ___________________ | 2025-11-05 | [x] Approve |
| Security Consultant Lead | ___________________ | 2025-11-06 | [x] Approve |
| Engineering Manager | ___________________ | 2025-11-06 | [x] Approve |

---

---

# ADR Template

> Copy everything below this line for each new ADR.

---

## ADR-[NNN]: [TITLE]

| **Field**        | **Value**                                                |
|------------------|----------------------------------------------------------|
| ADR Number       | ADR-[NNN]                                                |
| Title            | [SHORT_DESCRIPTIVE_TITLE]                                |
| Date             | [YYYY-MM-DD]                                             |
| Status           | `Proposed` / `Accepted` / `Deprecated` / `Superseded by ADR-[NNN]` |
| Decision Maker   | [NAME_AND_ROLE]                                          |
| Consulted        | [LIST_OF_PEOPLE_CONSULTED]                               |
| Informed         | [LIST_OF_PEOPLE_INFORMED]                                |

---

### Context

[Describe the issue that motivates this decision. What is the problem or situation? What forces are at play? Include relevant technical constraints, business requirements, team capabilities, and timeline pressures. Be factual and specific -- avoid vague statements.]

---

### Decision

[State the architectural decision clearly and concisely. Use active voice. Example: "We will use SQLite via PSSQLite for local controls management." Include enough detail so that the decision is unambiguous.]

---

### Alternatives Considered

| # | Option | Pros | Cons |
|---|--------|------|------|
| 1 | [OPTION_A -- the chosen option] | [LIST_PROS] | [LIST_CONS] |
| 2 | [OPTION_B] | [LIST_PROS] | [LIST_CONS] |
| 3 | [OPTION_C] | [LIST_PROS] | [LIST_CONS] |

---

### Consequences

**What becomes easier or better:**
- [POSITIVE_CONSEQUENCE_1]
- [POSITIVE_CONSEQUENCE_2]
- [POSITIVE_CONSEQUENCE_3]

**What becomes harder or worse:**
- [NEGATIVE_CONSEQUENCE_1]
- [NEGATIVE_CONSEQUENCE_2]

**Risks:**
- [RISK_1]: [MITIGATION]
- [RISK_2]: [MITIGATION]

---

### Compliance and Security Implications

| Aspect | Implication | Mitigation |
|--------|------------|------------|
| [e.g., Data at Rest] | [IMPLICATION] | [MITIGATION] |
| [e.g., Access Control] | [IMPLICATION] | [MITIGATION] |
| [e.g., Audit Logging] | [IMPLICATION] | [MITIGATION] |

---

### References

- [REFERENCE_1: title and link]
- [REFERENCE_2: title and link]

---

### Approval

| Role | Name | Date | Decision |
|------|------|------|----------|
| Module Author | [NAME] | [YYYY-MM-DD] | [ ] Approve / [ ] Reject |
| Security Consultant Lead | [NAME] | [YYYY-MM-DD] | [ ] Approve / [ ] Reject |
| Engineering Manager | [NAME] | [YYYY-MM-DD] | [ ] Approve / [ ] Reject |
| [ADDITIONAL_ROLE] | [NAME] | [YYYY-MM-DD] | [ ] Approve / [ ] Reject |
