# Networking & Security

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Networking & Security              |
| Last Updated     | 2026-02-14                         |
| Status           | Draft                              |
| Owner            | IntelliSec Solutions               |

---

## 1. Document Purpose

This document defines the network architecture and security controls for the CMMC Assessor Platform on Azure. It covers the current state of networking (which is minimal), DNS strategy, TLS management, and identifies the significant security gaps that are tracked as security findings for remediation.

---

## 2. Network Architecture Diagram

```
CURRENT STATE (Minimal -- No VNet)

Internet
   |
   +-- cmmc.intellisecops.com
   |      |  (CNAME -> cmmc-web.*.canadacentral.azurecontainerapps.io)
   |      v
   |   cmmc-web (Container App - external ingress)
   |      Azure Managed TLS Certificate
   |
   +-- api.cmmc.intellisecops.com
          |  (CNAME -> cmmc-api.*.canadacentral.azurecontainerapps.io)
          v
       cmmc-api (Container App - external ingress)
          Azure Managed TLS Certificate
             |
             +-- psql-cmmc-assessor-prod
             |      PostgreSQL Flexible Server
             |      Firewall: AllowAzureServices (0.0.0.0) [F-12]
             |
             +-- stcmmcassessorprod
             |      Storage Account (Standard_LRS)
             |      Public access
             |
             +-- kv-cmmc-assessor-prod
                    Key Vault (Standard)

WARNING: No VNet, no private endpoints, no WAF, no firewall.
See security findings F-09, F-12.
```

---

## 3. VNet Design

### 3.1 VNet Inventory

**Status: NOT IMPLEMENTED (Security Finding F-09)**

| VNet Name                 | Address Space   | Region           | Subscription       | Purpose                           |
|---------------------------|-----------------|------------------|--------------------|------------------------------------|
| N/A                       | N/A             | N/A              | N/A                | No VNet deployed                   |

> **Current State:** There is no Virtual Network deployed. All services communicate over public endpoints. This is tracked as security finding F-09 and is planned for Phase 1 remediation.

### Planned VNet Design (Target State)

| VNet Name                 | Address Space    | Region           | Purpose                           |
|---------------------------|------------------|------------------|------------------------------------|
| vnet-cmmc-assessor-prod   | 10.0.0.0/16      | Canada Central   | Production workloads               |

### Planned Subnet Design

| Subnet Name                  | Address Range      | Purpose                            | Delegation                           |
|------------------------------|--------------------|------------------------------------|--------------------------------------|
| snet-container-apps          | 10.0.0.0/23        | Container Apps Environment         | Microsoft.App/environments           |
| snet-postgresql              | 10.0.2.0/24        | PostgreSQL Flexible Server         | Microsoft.DBforPostgreSQL/flexibleServers |
| snet-private-endpoints       | 10.0.3.0/24        | Private endpoints (KV, Storage)    | None                                 |

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

**Status: NOT IMPLEMENTED**

| Attribute                     | Value                                           |
|-------------------------------|-------------------------------------------------|
| WAF Type                      | NOT IMPLEMENTED                                 |
| WAF Mode                      | N/A                                             |

> **Current State:** No WAF is deployed. Container Apps have external ingress without any WAF protection. Application-level input validation exists but no network-level web application firewall.

### Planned Improvements

- Evaluate Azure Front Door with WAF for the production endpoints
- Consider Azure Application Gateway with WAF v2 if VNet is implemented

---

## 6. Private Endpoints Inventory

**Status: NOT IMPLEMENTED**

| Service                    | Private Endpoint Name            | Status         |
|----------------------------|----------------------------------|----------------|
| PostgreSQL Flexible Server | N/A                              | NOT IMPLEMENTED |
| Storage Account            | N/A                              | NOT IMPLEMENTED |
| Key Vault                  | N/A                              | NOT IMPLEMENTED |
| Container Registry         | N/A                              | NOT IMPLEMENTED |

> **Current State:** No private endpoints are deployed. All Azure services are accessed over public endpoints. PostgreSQL has an AllowAzureServices firewall rule (0.0.0.0) which is a security finding (F-12).

### Planned Improvements

- Deploy private endpoints for PostgreSQL, Key Vault, and Storage Account as part of VNet implementation
- Remove the AllowAzureServices firewall rule from PostgreSQL (F-12)
- Restrict Container Registry access via private endpoint or IP rules

---

## 7. DNS Strategy

### 7.1 DNS Overview

| Attribute                    | Value                                              |
|------------------------------|----------------------------------------------------|
| Public DNS Provider          | GoDaddy                                            |
| Public DNS Zone              | intellisecops.com                                  |
| Internal DNS                 | N/A (no VNet, no private DNS zones)                |
| DNS Forwarding               | N/A                                                |
| Split-brain DNS              | No                                                 |

### 7.2 Private DNS Zones

**Status: NOT IMPLEMENTED** -- No private DNS zones exist. These will be created when private endpoints are deployed.

### 7.3 Key DNS Records

| Record Name                          | Type    | Value                                                           | Zone                   | TTL     |
|--------------------------------------|---------|-----------------------------------------------------------------|------------------------|---------|
| cmmc.intellisecops.com               | CNAME   | cmmc-web.{unique}.canadacentral.azurecontainerapps.io           | intellisecops.com      | Default |
| api.cmmc.intellisecops.com           | CNAME   | cmmc-api.{unique}.canadacentral.azurecontainerapps.io           | intellisecops.com      | Default |

---

## 8. Load Balancing

### 8.1 Load Balancing Architecture

| Layer              | Service                      | Resource Name                 | Purpose                                | Backend Targets            |
|--------------------|------------------------------|-------------------------------|----------------------------------------|----------------------------|
| Application (L7)  | Container Apps built-in       | Managed by Azure              | HTTP load balancing for Container Apps | Container App replicas     |

> **Current State:** Load balancing is handled entirely by the Azure Container Apps platform. There is no Application Gateway, no Azure Front Door, and no external load balancer. Container Apps provides built-in HTTP load balancing across replicas.

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
| cmmc.intellisecops.com          | Azure Managed Certificate  | Yes        | cmmc-web Container App |
| api.cmmc.intellisecops.com      | Azure Managed Certificate  | Yes        | cmmc-api Container App |

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

- [ ] All production databases accessible only via private endpoints -- **FAIL (F-12: AllowAzureServices rule)**
- [x] No public IP addresses on VMs -- **N/A (no VMs)**
- [ ] NSG rules follow least-privilege principle -- **FAIL (no NSGs deployed, F-09)**
- [ ] Outbound internet access restricted via Azure Firewall -- **FAIL (no firewall)**
- [ ] WAF enabled in Prevention mode for production -- **FAIL (no WAF)**
- [x] TLS 1.2 minimum enforced on all endpoints
- [ ] Network segmentation verified between environments -- **FAIL (no VNet, no segmentation)**
- [ ] Service endpoints or private endpoints used for all PaaS services -- **FAIL (no private endpoints)**
- [ ] DDoS Protection Standard enabled for public-facing resources -- **N/A (Basic only, acceptable at current scale)**
- [ ] CORS configured correctly -- **Partial (F-40: allows localhost in prod)**

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
| F-09       | No VNet deployed for network isolation                   | High     | Planned |
| F-12       | PostgreSQL AllowAzureServices firewall rule (0.0.0.0)    | High     | Planned |
| F-40       | CORS allows localhost in production                      | Medium   | Planned |

---

## 13. Revision History

| Date           | Author               | Changes Made                              |
|----------------|-----------------------|-------------------------------------------|
| 2026-02-14     | IntelliSec Solutions  | Initial document creation                 |
