# Networking & Security

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Networking & Security              |
| Last Updated     | 2026-02-15                         |
| Status           | Updated -- prod-v2 with VNet isolation |
| Owner            | IntelliSec Solutions               |

---

## 1. Document Purpose

This document defines the network architecture and security controls for the CMMC Assessor Platform on Azure. The application has been migrated to prod-v2 in subscription sub-is-secops-prod (400dce0f) with VNet isolation, private endpoints, Key Vault references, managed identity, App Gateway WAF v2, and no public access on PostgreSQL. All 47 security findings have been resolved as of 2026-02-15.

---

## 2. Network Architecture Diagram

```
CURRENT STATE (Prod-v2 -- VNet Isolated, sub-is-secops-prod)

Internet
   |
   +-- cmmc.intellisecops.com
   |      |  (Custom domain via App Gateway WAF v2: appgw-ams)
   |      v
   |   Application Gateway WAF v2 (appgw-ams)
   |      |  WAF protection enabled
   |      v
   |   VNet (prod-v2)
   |      |
   |      +-- cae-cmmc-v2-prod (Container Apps Environment, VNet-integrated)
   |      |      |
   |      |      +-- cmmc-web (Container App)
   |      |      |      FQDN: cmmc-web.happybush-78cb0e6a.canadacentral.azurecontainerapps.io
   |      |      |
   |      |      +-- cmmc-api (Container App)
   |      |             FQDN: cmmc-api.happybush-78cb0e6a.canadacentral.azurecontainerapps.io
   |      |             |
   |      |             +-- psql-cmmc-v2-prod (Private Endpoint, no public access)
   |      |             |      PostgreSQL Flexible Server
   |      |             |
   |      |             +-- kv-cmmc-v2-prod (Private Endpoint, Key Vault refs)
   |      |                    Key Vault (Standard) -- managed identity access
   |      |
   |      +-- acrcmmcv2prod (Container Registry)
   |
   Managed Identity for all service-to-service auth

All 47 security findings RESOLVED. F-09, F-12, F-40 all resolved.
```

---

## 3. VNet Design

### 3.1 VNet Inventory

**Status: DEPLOYED (Security Finding F-09 -- RESOLVED)**

| VNet Name                 | Address Space   | Region           | Subscription                | Purpose                           |
|---------------------------|-----------------|------------------|-----------------------------|-------------------------------------|
| VNet (prod-v2)            | 10.0.0.0/16     | Canada Central   | sub-is-secops-prod (400dce0f) | Production workloads (VNet-integrated) |

> **Current State:** VNet is deployed in prod-v2 with Container Apps Environment integration. All PaaS services use private endpoints. PostgreSQL has no public access. Security finding F-09 is RESOLVED as of 2026-02-15.

### Subnet Design (Deployed)

| Subnet Name                  | Address Range      | Purpose                            | Delegation                           |
|------------------------------|--------------------|------------------------------------|--------------------------------------|
| snet-container-apps          | 10.0.0.0/23        | Container Apps Environment (cae-cmmc-v2-prod) | Microsoft.App/environments   |
| snet-postgresql              | 10.0.2.0/24        | PostgreSQL Flexible Server (psql-cmmc-v2-prod) | Microsoft.DBforPostgreSQL/flexibleServers |
| snet-private-endpoints       | 10.0.3.0/24        | Private endpoints (Key Vault, Storage) | None                            |

### 3.2 VNet Peering

N/A -- No VNets deployed.

---

## 4. Network Security Groups (NSGs)

### 4.1 NSG Inventory

**Status: NOT IMPLEMENTED**

No NSGs are deployed. NSGs will be created when the VNet is implemented.

---

## 5. Azure Firewall / WAF Configuration

### 5.1 Azure Firewall

**Status: NOT IMPLEMENTED**

No Azure Firewall is deployed. Not planned for the current scale of the project.

### 5.2 Web Application Firewall (WAF)

**Status: DEPLOYED**

| Attribute                     | Value                                           |
|-------------------------------|-------------------------------------------------|
| WAF Type                      | Azure Application Gateway WAF v2                |
| WAF Resource Name             | appgw-ams                                       |
| WAF Mode                      | Prevention                                      |
| Custom Domain                 | cmmc.intellisecops.com                          |
| Backend Pool                  | cmmc-web.happybush-78cb0e6a.canadacentral.azurecontainerapps.io, cmmc-api.happybush-78cb0e6a.canadacentral.azurecontainerapps.io |

> **Current State:** Application Gateway WAF v2 (appgw-ams) is deployed in prod-v2. Custom domain cmmc.intellisecops.com routes through the WAF to the Container Apps backends. WAF provides OWASP rule set protection at the network level in addition to application-level input validation.

---

## 6. Private Endpoints Inventory

**Status: DEPLOYED (prod-v2)**

| Service                    | Private Endpoint Name            | Status         |
|----------------------------|----------------------------------|----------------|
| PostgreSQL Flexible Server | psql-cmmc-v2-prod (private endpoint) | DEPLOYED -- no public access (F-12 RESOLVED) |
| Key Vault                  | kv-cmmc-v2-prod (private endpoint)   | DEPLOYED -- Key Vault refs via managed identity |
| Container Registry         | acrcmmcv2prod                        | DEPLOYED -- managed identity access |

> **Current State:** Private endpoints are deployed for PostgreSQL and Key Vault in the prod-v2 environment. PostgreSQL has no public access (AllowAzureServices firewall rule removed). Container Registry uses managed identity for access. Security findings F-09 and F-12 are RESOLVED.

---

## 7. DNS Strategy

### 7.1 DNS Overview

| Attribute                    | Value                                              |
|------------------------------|----------------------------------------------------|
| Public DNS Provider          | GoDaddy                                            |
| Public DNS Zone              | intellisecops.com                                  |
| Internal DNS                 | Private DNS zones for VNet-integrated services (prod-v2) |
| DNS Forwarding               | N/A                                                |
| Split-brain DNS              | No                                                 |

### 7.2 Private DNS Zones

**Status: DEPLOYED** -- Private DNS zones created for VNet-integrated services in prod-v2 (PostgreSQL, Key Vault).

### 7.3 Key DNS Records

| Record Name                          | Type    | Value                                                           | Zone                   | TTL     |
|--------------------------------------|---------|-----------------------------------------------------------------|------------------------|---------|
| cmmc.intellisecops.com               | A       | App Gateway WAF v2 (appgw-ams) public IP                       | intellisecops.com      | Default |
| cmmc-web (backend FQDN)             | --      | cmmc-web.happybush-78cb0e6a.canadacentral.azurecontainerapps.io | (App Gateway backend)  | --      |
| cmmc-api (backend FQDN)             | --      | cmmc-api.happybush-78cb0e6a.canadacentral.azurecontainerapps.io | (App Gateway backend)  | --      |

---

## 8. Load Balancing

### 8.1 Load Balancing Architecture

| Layer              | Service                      | Resource Name                 | Purpose                                | Backend Targets            |
|--------------------|------------------------------|-------------------------------|----------------------------------------|----------------------------|
| Application (L7)  | Application Gateway WAF v2   | appgw-ams                     | WAF protection + load balancing for custom domain cmmc.intellisecops.com | Container Apps backends    |
| Application (L7)  | Container Apps built-in       | Managed by Azure              | HTTP load balancing for Container Apps | Container App replicas     |

> **Current State:** Traffic to cmmc.intellisecops.com flows through the Application Gateway WAF v2 (appgw-ams) which provides WAF protection and routes to the Container Apps backends. Container Apps also provides built-in HTTP load balancing across replicas within the VNet-integrated environment.

### 8.2 Scaling Configuration

| Container App | Min Replicas | Max Replicas | Scale Rule                | Concurrency |
|---------------|-------------|-------------|---------------------------|-------------|
| cmmc-api      | 0           | 3           | HTTP concurrent requests  | 50          |
| cmmc-web      | 0           | 3           | HTTP concurrent requests  | 100         |

> **Note:** Scale-to-zero is enabled for cost optimization. This causes cold starts when the application receives traffic after a period of inactivity.

---

## 9. TLS / SSL Certificate Management

| Attribute                     | Value                                                |
|-------------------------------|------------------------------------------------------|
| Certificate Authority         | Azure Managed Certificates (free, auto-renewed)      |
| Certificate Storage           | Managed by Container Apps platform                   |
| Auto-Renewal                  | Yes -- Azure managed                                 |
| Minimum TLS Version           | TLS 1.2 (Container Apps default)                     |
| Cipher Suites                 | Azure default                                        |

### Certificate Inventory

| Domain                          | Certificate Type           | Auto-Renew | Used By               |
|---------------------------------|----------------------------|------------|------------------------|
| cmmc.intellisecops.com          | App Gateway WAF v2 certificate | Yes    | appgw-ams (Application Gateway) |
| cmmc-web.happybush-78cb0e6a.canadacentral.azurecontainerapps.io | Azure Managed Certificate | Yes | cmmc-web Container App |
| cmmc-api.happybush-78cb0e6a.canadacentral.azurecontainerapps.io | Azure Managed Certificate | Yes | cmmc-api Container App |

### Certificate Renewal Process

- [x] Auto-renewal managed by Azure Container Apps platform
- [ ] Certificate renewal alerts configured -- **N/A (Azure managed)**
- [ ] Certificate binding updated automatically -- **Yes (Azure managed)**
- [x] No certificate pinning in use

---

## 10. DDoS Protection

| Attribute                     | Value                                           |
|-------------------------------|-------------------------------------------------|
| DDoS Protection Plan          | Azure DDoS Protection Basic (default, free)     |
| Protected Resources           | Container Apps public endpoints                  |
| DDoS Policy                   | Default Azure Basic protection                  |
| Alerting                      | NOT IMPLEMENTED                                 |
| Diagnostic Logs               | NOT IMPLEMENTED                                 |

> **Current State:** Only Azure DDoS Protection Basic (free, default) is in effect. DDoS Protection Standard is not enabled and is not considered necessary at the current scale and traffic levels.

---

## 11. Network Monitoring

### 11.1 Azure Network Watcher

| Feature                        | Status              | Configuration                                   |
|--------------------------------|---------------------|-------------------------------------------------|
| Network Watcher                | Default (auto)      | Enabled in Canada Central by default            |
| NSG Flow Logs                  | NOT IMPLEMENTED     | No NSGs deployed                                |
| Traffic Analytics              | NOT IMPLEMENTED     | No NSGs or flow logs                            |
| Connection Monitor             | NOT IMPLEMENTED     | No connection monitoring configured             |

### 11.2 Network Alerts

**Status: NOT IMPLEMENTED** -- No network-specific alerts are configured.

### Planned Improvements

- Enable NSG Flow Logs when VNet and NSGs are deployed
- Configure Traffic Analytics for network visibility
- Add alerts for network anomalies

---

## 12. Security Checklist

### Network Security

- [x] All production databases accessible only via private endpoints -- **PASS (F-12 RESOLVED: psql-cmmc-v2-prod has private endpoint, no public access)**
- [x] No public IP addresses on VMs -- **N/A (no VMs)**
- [x] VNet isolation deployed -- **PASS (F-09 RESOLVED: VNet with Container Apps Environment integration in prod-v2)**
- [ ] Outbound internet access restricted via Azure Firewall -- **N/A (App Gateway WAF v2 provides inbound protection)**
- [x] WAF enabled in Prevention mode for production -- **PASS (appgw-ams Application Gateway WAF v2 deployed)**
- [x] TLS 1.2 minimum enforced on all endpoints
- [x] Network segmentation verified -- **PASS (VNet-integrated Container Apps Environment with subnet isolation)**
- [x] Private endpoints used for PaaS services -- **PASS (PostgreSQL, Key Vault via private endpoints)**
- [ ] DDoS Protection Standard enabled for public-facing resources -- **N/A (Basic only, acceptable at current scale)**
- [x] CORS configured correctly -- **PASS (F-40 RESOLVED: strict allowlist for cmmc.intellisecops.com only)**

### Monitoring and Compliance

- [ ] NSG Flow Logs enabled for all NSGs -- **FAIL (no NSGs)**
- [ ] Traffic Analytics enabled -- **FAIL**
- [x] Network Watcher enabled in deployed region (default)
- [ ] Azure Policy auditing network compliance -- **NOT IMPLEMENTED**
- [ ] Regular NSG rule review scheduled -- **NOT IMPLEMENTED**
- [ ] Penetration testing scheduled -- **NOT IMPLEMENTED**

### Key Security Findings Related to Networking

| Finding ID | Description                                              | Severity | Status  |
|------------|----------------------------------------------------------|----------|---------|
| F-09       | No VNet deployed for network isolation                   | High     | **RESOLVED** (2026-02-15) -- VNet deployed in prod-v2 with Container Apps Environment integration |
| F-12       | PostgreSQL AllowAzureServices firewall rule (0.0.0.0)    | High     | **RESOLVED** (2026-02-15) -- psql-cmmc-v2-prod uses private endpoint; no public access |
| F-40       | CORS allows localhost in production                      | Medium   | **RESOLVED** (2026-02-15) -- Strict CORS allowlist for cmmc.intellisecops.com only |

---

## 13. Revision History

| Date           | Author               | Changes Made                              |
|----------------|-----------------------|-------------------------------------------|
| 2026-02-14     | IntelliSec Solutions  | Initial document creation                 |
| 2026-02-15     | IntelliSec Solutions  | Updated for prod-v2 migration; VNet deployed (F-09 resolved); private endpoints deployed (F-12 resolved); CORS fixed (F-40 resolved); App Gateway WAF v2 added; all 47 findings resolved |
