# Networking & Security

| **Metadata**     | **Value**                          |
|------------------|------------------------------------|
| Page Title       | Networking & Security              |
| Last Updated     | [YYYY-MM-DD]                       |
| Status           | [Draft / In Review / Approved]     |
| Owner            | [TEAM OR INDIVIDUAL NAME]          |

---

## 1. Document Purpose

This document defines the network architecture and security controls for the [PROJECT NAME] platform on Azure. It covers VNet design, network security groups, firewall and WAF configuration, private endpoints, DNS strategy, load balancing, TLS management, DDoS protection, and network monitoring.

---

## 2. Network Architecture Diagram

```
[INSERT NETWORK ARCHITECTURE DIAGRAM]

Recommended tool: draw.io, Visio, or Azure Network Diagram
Include: VNets, subnets, peering connections, firewalls, gateways,
         private endpoints, load balancers, and internet-facing resources.
Export as PNG and embed in Confluence page.
```

---

## 3. VNet Design

### 3.1 VNet Inventory

| VNet Name                 | Address Space   | Region     | Subscription       | Purpose                           |
|---------------------------|-----------------|------------|--------------------|------------------------------------|
| [vnet-hub-eus-001]        | [10.0.0.0/16]   | [East US]  | [Connectivity]     | [Hub network - shared services]    |
| [vnet-app-prod-eus-001]   | [10.1.0.0/16]   | [East US]  | [Production]       | [Production spoke - application]   |
| [vnet-app-stg-eus-001]    | [10.2.0.0/16]   | [East US]  | [Non-Production]   | [Staging spoke - application]      |
| [vnet-app-dev-eus-001]    | [10.3.0.0/16]   | [East US]  | [Non-Production]   | [Development spoke - application]  |
| [vnet-app-prod-wus-001]   | [10.4.0.0/16]   | [West US]  | [Production]       | [DR spoke - application]           |

### 3.2 Subnet Design (Production VNet Example)

| Subnet Name                | Address Range    | Purpose                            | Available IPs | NSG               | Route Table      | Service Endpoints       | Delegation                    |
|----------------------------|------------------|-------------------------------------|---------------|--------------------|------------------|-------------------------|-------------------------------|
| [snet-agw]                 | [10.1.0.0/24]    | Application Gateway                | [251]         | [nsg-agw-prod]     | [rt-agw-prod]    | [None]                  | [None]                        |
| [snet-aks-system]          | [10.1.1.0/24]    | AKS system node pool               | [251]         | [nsg-aks-prod]     | [rt-aks-prod]    | [None]                  | [None]                        |
| [snet-aks-user]            | [10.1.2.0/22]    | AKS user node pool                 | [1019]        | [nsg-aks-prod]     | [rt-aks-prod]    | [None]                  | [None]                        |
| [snet-appservice]          | [10.1.6.0/24]    | App Service VNet integration       | [251]         | [nsg-app-prod]     | [rt-app-prod]    | [None]                  | [Microsoft.Web/serverFarms]   |
| [snet-functions]           | [10.1.7.0/24]    | Azure Functions VNet integration   | [251]         | [nsg-func-prod]    | [rt-func-prod]   | [None]                  | [Microsoft.Web/serverFarms]   |
| [snet-vm]                  | [10.1.8.0/24]    | Virtual Machines                   | [251]         | [nsg-vm-prod]      | [rt-vm-prod]     | [None]                  | [None]                        |
| [snet-data]                | [10.1.9.0/24]    | Database private endpoints         | [251]         | [nsg-data-prod]    | [rt-data-prod]   | [Microsoft.Sql]         | [None]                        |
| [snet-pe]                  | [10.1.10.0/24]   | Shared private endpoints           | [251]         | [nsg-pe-prod]      | [rt-pe-prod]     | [None]                  | [None]                        |
| [snet-bastion]             | [10.1.11.0/26]   | Azure Bastion                      | [59]          | [N/A - managed]    | [N/A]            | [None]                  | [None]                        |
| [SUBNET NAME]              | [ADDRESS RANGE]  | [PURPOSE]                          | [COUNT]       | [NSG]              | [ROUTE TABLE]    | [ENDPOINTS]             | [DELEGATION]                  |

### 3.3 VNet Peering

| Peering Name                          | Source VNet                | Target VNet              | Allow Gateway Transit | Use Remote Gateways | Traffic Forwarding |
|---------------------------------------|----------------------------|--------------------------|-----------------------|---------------------|--------------------|
| [peer-prod-to-hub]                    | [vnet-app-prod-eus-001]    | [vnet-hub-eus-001]       | [No]                  | [Yes]               | [Yes]              |
| [peer-hub-to-prod]                    | [vnet-hub-eus-001]         | [vnet-app-prod-eus-001]  | [Yes]                 | [No]                | [Yes]              |
| [peer-stg-to-hub]                     | [vnet-app-stg-eus-001]     | [vnet-hub-eus-001]       | [No]                  | [Yes]               | [Yes]              |
| [PEERING NAME]                        | [SOURCE]                   | [TARGET]                 | [VALUE]               | [VALUE]             | [VALUE]            |

---

## 4. Network Security Groups (NSGs)

### 4.1 NSG Inventory

| NSG Name             | Associated Subnet         | Environment  | Rule Count | Last Reviewed   |
|----------------------|---------------------------|--------------|------------|-----------------|
| [nsg-agw-prod]       | [snet-agw]                | Production   | [X]        | [YYYY-MM-DD]    |
| [nsg-aks-prod]       | [snet-aks-system, user]   | Production   | [X]        | [YYYY-MM-DD]    |
| [nsg-app-prod]       | [snet-appservice]         | Production   | [X]        | [YYYY-MM-DD]    |
| [nsg-data-prod]      | [snet-data]               | Production   | [X]        | [YYYY-MM-DD]    |
| [nsg-vm-prod]        | [snet-vm]                 | Production   | [X]        | [YYYY-MM-DD]    |

### 4.2 NSG Rules Summary (Production Example)

| NSG Name         | Priority | Direction | Name                    | Source              | Destination         | Port        | Protocol | Action |
|------------------|----------|-----------|-------------------------|---------------------|---------------------|-------------|----------|--------|
| [nsg-agw-prod]   | [100]    | Inbound   | [Allow-HTTPS-Internet]  | [Internet]          | [snet-agw]          | [443]       | [TCP]    | [Allow]|
| [nsg-agw-prod]   | [110]    | Inbound   | [Allow-GWM]             | [GatewayManager]    | [snet-agw]          | [65200-65535]| [TCP]   | [Allow]|
| [nsg-aks-prod]   | [100]    | Inbound   | [Allow-AGW-to-AKS]     | [snet-agw]          | [snet-aks-user]     | [80,443]    | [TCP]    | [Allow]|
| [nsg-data-prod]  | [100]    | Inbound   | [Allow-AKS-to-SQL]     | [snet-aks-user]     | [snet-data]         | [1433]      | [TCP]    | [Allow]|
| [nsg-data-prod]  | [110]    | Inbound   | [Allow-App-to-SQL]     | [snet-appservice]   | [snet-data]         | [1433]      | [TCP]    | [Allow]|
| [nsg-vm-prod]    | [100]    | Inbound   | [Allow-Bastion-SSH]    | [snet-bastion]      | [snet-vm]           | [22]        | [TCP]    | [Allow]|
| [nsg-vm-prod]    | [200]    | Inbound   | [Deny-All-Inbound]    | [*]                 | [*]                 | [*]         | [*]      | [Deny] |
| [NSG NAME]       | [PRI]    | [DIR]     | [RULE NAME]            | [SOURCE]            | [DESTINATION]       | [PORT]      | [PROTO]  | [ACT]  |

---

## 5. Azure Firewall / WAF Configuration

### 5.1 Azure Firewall (if deployed)

| Attribute                     | Value                                           |
|-------------------------------|-------------------------------------------------|
| Firewall Name                 | [fw-hub-eus-001]                                |
| SKU                           | [Standard / Premium]                            |
| Location                      | [Hub VNet - snet-firewall]                      |
| Threat Intelligence Mode      | [Alert / Deny]                                  |
| IDPS Mode (Premium)           | [Alert / Alert and Deny]                        |
| DNS Proxy                     | [Enabled]                                       |
| Firewall Policy               | [fwpol-hub-eus-001]                             |

### 5.2 Web Application Firewall (WAF)

| Attribute                     | Value                                           |
|-------------------------------|-------------------------------------------------|
| WAF Type                      | [Application Gateway WAF v2 / Front Door WAF]   |
| WAF Mode                      | [Detection / Prevention]                         |
| Rule Set                      | [OWASP 3.2 / Microsoft Default Rule Set 2.1]    |
| Custom Rules                  | [LIST CUSTOM WAF RULES]                         |
| Exclusions                    | [LIST ANY EXCLUSIONS WITH JUSTIFICATION]        |
| Bot Protection                | [Enabled / Disabled]                            |
| Rate Limiting                 | [RATE LIMIT RULES]                              |

### 5.3 Firewall Network Rules (Summary)

| Rule Collection          | Priority | Action | Source                | Destination             | Port       | Protocol |
|--------------------------|----------|--------|-----------------------|-------------------------|------------|----------|
| [Allow-Azure-Services]   | [100]    | [Allow]| [Spoke VNets]         | [AzureCloud]            | [443]      | [TCP]    |
| [Allow-DNS]              | [200]    | [Allow]| [All VNets]           | [DNS Servers]           | [53]       | [UDP/TCP]|
| [Allow-NTP]              | [300]    | [Allow]| [All VNets]           | [NTP Servers]           | [123]      | [UDP]    |
| [Deny-All]               | [65000]  | [Deny] | [*]                   | [*]                     | [*]        | [*]      |

---

## 6. Private Endpoints Inventory

| Service                    | Private Endpoint Name            | Subnet         | Private IP     | Private DNS Zone                           | Resource Name             |
|----------------------------|----------------------------------|----------------|----------------|--------------------------------------------|---------------------------|
| Azure SQL Database         | [pe-sql-prod-eus-001]            | [snet-data]    | [10.1.9.4]     | [privatelink.database.windows.net]         | [sql-db-prod-eus-001]     |
| Azure Storage (Blob)       | [pe-st-blob-prod-eus-001]        | [snet-pe]      | [10.1.10.4]    | [privatelink.blob.core.windows.net]        | [stapprodeus001]          |
| Azure Key Vault            | [pe-kv-prod-eus-001]             | [snet-pe]      | [10.1.10.5]    | [privatelink.vaultcore.azure.net]          | [kv-app-prod-eus-001]     |
| Azure Container Registry   | [pe-acr-prod-eus-001]            | [snet-pe]      | [10.1.10.6]    | [privatelink.azurecr.io]                   | [acrprodeus001]           |
| Azure Service Bus          | [pe-sb-prod-eus-001]             | [snet-pe]      | [10.1.10.7]    | [privatelink.servicebus.windows.net]       | [sb-app-prod-eus-001]     |
| [SERVICE]                  | [PE NAME]                        | [SUBNET]       | [IP]           | [DNS ZONE]                                 | [RESOURCE]                |

---

## 7. DNS Strategy

### 7.1 DNS Overview

| Attribute                    | Value                                              |
|------------------------------|----------------------------------------------------|
| Public DNS Provider          | [Azure DNS / External provider]                    |
| Public DNS Zone              | [company.com]                                      |
| Internal DNS                 | [Azure Private DNS Zones]                          |
| DNS Forwarding               | [Azure Firewall DNS Proxy / Custom DNS servers]    |
| Split-brain DNS              | [Yes / No]                                         |

### 7.2 Private DNS Zones

| Private DNS Zone                            | Linked VNets                               | Purpose                          |
|---------------------------------------------|--------------------------------------------|----------------------------------|
| [privatelink.database.windows.net]          | [Hub, Prod, Staging, Dev]                  | SQL Database private endpoints   |
| [privatelink.blob.core.windows.net]         | [Hub, Prod, Staging, Dev]                  | Storage Blob private endpoints   |
| [privatelink.vaultcore.azure.net]           | [Hub, Prod, Staging, Dev]                  | Key Vault private endpoints      |
| [privatelink.azurecr.io]                    | [Hub, Prod, Staging, Dev]                  | Container Registry endpoints     |
| [privatelink.servicebus.windows.net]        | [Hub, Prod, Staging, Dev]                  | Service Bus private endpoints    |
| [PROJECT.internal]                          | [Hub, Prod, Staging, Dev]                  | Custom internal DNS              |
| [DNS ZONE]                                  | [LINKED VNETS]                             | [PURPOSE]                        |

### 7.3 Key DNS Records

| Record Name                  | Type  | Value                          | Zone                   | TTL     |
|------------------------------|-------|--------------------------------|------------------------|---------|
| [app.company.com]            | [A]   | [Application Gateway public IP]| [company.com]          | [300]   |
| [api.company.com]            | [CNAME]| [Front Door endpoint]         | [company.com]          | [300]   |
| [RECORD]                     | [TYPE]| [VALUE]                        | [ZONE]                 | [TTL]   |

---

## 8. Load Balancing

### 8.1 Load Balancing Architecture

| Layer              | Service                      | Resource Name                 | Purpose                                | Backend Targets            |
|--------------------|------------------------------|-------------------------------|----------------------------------------|----------------------------|
| Global (L7)       | [Azure Front Door]            | [afd-app-prod-001]            | [Global load balancing, CDN, WAF]      | [Application Gateway]      |
| Regional (L7)     | [Application Gateway v2]      | [agw-app-prod-eus-001]        | [Regional L7 load balancing, WAF]      | [AKS Ingress, App Service] |
| Internal (L4)     | [Azure Load Balancer]         | [ilb-app-prod-eus-001]        | [Internal service load balancing]      | [VMs, internal services]   |
| Kubernetes        | [NGINX Ingress / AGIC]        | [Deployed in AKS]             | [Kubernetes ingress routing]           | [Kubernetes services]      |

### 8.2 Application Gateway Configuration

| Attribute                     | Value                                         |
|-------------------------------|-----------------------------------------------|
| SKU                           | [WAF_v2]                                      |
| Capacity (min/max)            | [2 / 10 (autoscale)]                          |
| Frontend IP                   | [Public + Private]                            |
| Listeners                     | [HTTPS on 443]                                |
| Backend Pools                 | [AKS, App Service]                            |
| Health Probes                 | [/health, interval 30s, threshold 3]          |
| SSL Policy                    | [AppGwSslPolicy20220101 or custom]            |
| Cookie Affinity               | [Disabled / Enabled per backend]              |

---

## 9. TLS / SSL Certificate Management

| Attribute                     | Value                                                |
|-------------------------------|------------------------------------------------------|
| Certificate Authority         | [DigiCert / Let's Encrypt / Internal CA]             |
| Certificate Storage           | [Azure Key Vault]                                    |
| Auto-Renewal                  | [Yes -- via Key Vault integration / ACME / manual]   |
| Minimum TLS Version           | [TLS 1.2]                                            |
| Cipher Suites                 | [Azure default / Custom policy]                      |

### Certificate Inventory

| Domain                    | Certificate Name             | Key Vault              | Expiry Date    | Auto-Renew | Used By                        |
|---------------------------|------------------------------|------------------------|----------------|------------|--------------------------------|
| [*.company.com]           | [wildcard-company-com]       | [kv-app-prod-eus-001]  | [YYYY-MM-DD]   | [Yes]      | [Application Gateway, AKS]     |
| [api.company.com]         | [api-company-com]            | [kv-app-prod-eus-001]  | [YYYY-MM-DD]   | [Yes]      | [Front Door]                   |
| [DOMAIN]                  | [CERT NAME]                  | [KEY VAULT]            | [DATE]         | [Y/N]      | [SERVICES]                     |

### Certificate Renewal Process

- [ ] Certificate renewal alerts configured (30, 14, 7 days before expiry)
- [ ] Auto-renewal tested and verified
- [ ] Certificate binding updated in Application Gateway / AKS after renewal
- [ ] Certificate pinning considerations documented (avoid if possible)

---

## 10. DDoS Protection

| Attribute                     | Value                                           |
|-------------------------------|-------------------------------------------------|
| DDoS Protection Plan          | [Azure DDoS Protection Standard / Basic]        |
| Protected Resources           | [Public IPs: Application Gateway, Front Door]   |
| DDoS Policy                   | [Default / Custom thresholds]                   |
| Alerting                      | [Azure Monitor alerts on DDoS metrics]          |
| Diagnostic Logs               | [Enabled, sent to Log Analytics]                |
| Mitigation Reports            | [Enabled]                                       |

---

## 11. Network Monitoring

### 11.1 Azure Network Watcher

| Feature                        | Status         | Configuration                                   |
|--------------------------------|----------------|-------------------------------------------------|
| Network Watcher                | [Enabled]      | [Enabled in all deployed regions]               |
| NSG Flow Logs                  | [Enabled]      | [Version 2, 90-day retention]                   |
| Traffic Analytics              | [Enabled]      | [10-minute processing interval]                 |
| Connection Monitor             | [Configured]   | [Monitoring key endpoints]                      |
| Packet Capture                 | [On demand]    | [Available for troubleshooting]                 |
| IP Flow Verify                 | [On demand]    | [Available for troubleshooting]                 |
| Next Hop                       | [On demand]    | [Available for troubleshooting]                 |

### 11.2 NSG Flow Logs Configuration

| Attribute                      | Value                                          |
|--------------------------------|------------------------------------------------|
| Flow Log Version               | [2]                                            |
| Storage Account                | [stflowlogprodeus001]                          |
| Log Analytics Workspace        | [log-app-prod-eus-001]                         |
| Retention (Storage)            | [90 days]                                      |
| Retention (Log Analytics)      | [30 days]                                      |
| Traffic Analytics Enabled      | [Yes]                                          |
| Traffic Analytics Interval     | [10 minutes]                                   |

### 11.3 Network Alerts

| Alert Name                              | Condition                            | Severity | Action Group           |
|-----------------------------------------|--------------------------------------|----------|------------------------|
| [DDoS attack detected]                  | [DDoS Mitigation triggered]         | [Sev 1]  | [ag-security-alerts]   |
| [Application Gateway unhealthy hosts]   | [Unhealthy backend count > 0]       | [Sev 2]  | [ag-infra-alerts]      |
| [VPN Gateway disconnected]              | [Tunnel status = Disconnected]      | [Sev 2]  | [ag-infra-alerts]      |
| [NSG rule modified]                     | [Activity log: NSG write]           | [Sev 3]  | [ag-security-alerts]   |
| [ALERT NAME]                            | [CONDITION]                          | [SEV]    | [ACTION GROUP]         |

---

## 12. Security Checklist

### Network Security

- [ ] All production databases accessible only via private endpoints
- [ ] No public IP addresses on VMs (Bastion used for access)
- [ ] NSG rules follow least-privilege principle
- [ ] Outbound internet access restricted via Azure Firewall
- [ ] WAF enabled in Prevention mode for production
- [ ] TLS 1.2 minimum enforced on all endpoints
- [ ] Network segmentation verified between environments
- [ ] VNet peering limited to required spoke-to-hub connections
- [ ] Service endpoints or private endpoints used for all PaaS services
- [ ] DDoS Protection Standard enabled for public-facing resources

### Monitoring and Compliance

- [ ] NSG Flow Logs enabled for all NSGs
- [ ] Traffic Analytics enabled
- [ ] Network Watcher enabled in all regions
- [ ] Azure Policy auditing network compliance
- [ ] Regular NSG rule review scheduled ([FREQUENCY])
- [ ] Penetration testing scheduled ([FREQUENCY])

---

## 13. Revision History

| Date           | Author            | Changes Made                              |
|----------------|-------------------|-------------------------------------------|
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [Initial document creation]               |
| [YYYY-MM-DD]   | [AUTHOR NAME]     | [DESCRIPTION OF CHANGES]                  |
