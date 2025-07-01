# AdHub - Meta Agency Ad Account Management Platform

## Overview

AdHub is a B2B SaaS platform that facilitates Meta (Facebook) agency ad account acquisition and management for clients. The platform serves as an intermediary between clients and our provider (BlueFocus), handling the complex process of obtaining, managing, and funding Facebook advertising accounts.

## Core Business Model

### Revenue Streams
1. **Top-up Fees**: Percentage-based fees on client deposits (e.g., 3% on $1,000 = $30 fee)
2. **Monthly Subscriptions**: Tiered pricing plans (Starter, Growth, Scale, Enterprise)
3. **Pricing Structure**: Higher-tier plans = Lower top-up fees + Higher subscription costs

### Service Offering
- **Primary Focus**: Meta (Facebook) agency ad accounts only
- **Provider**: BlueFocus (Chinese ad account provider)
- **Management Tool**: Dolphin Cloud (anti-detect browser profiles)
- **Client Interface**: Web dashboard + Telegram bot

## User Journey & Workflow

### 1. Client Onboarding
```
Client Registration → Organization Creation → Subscription Plan Selection
```

**Organization Structure:**
- Each client creates one organization
- Subscription plan determines business application limits
- Organizations are managed by teams (20 organizations per team)

### 2. Business Application Process

**Client Submission Requirements:**
- Landing page URL
- Ad account timezone
- Facebook profile email
- Business details

**Application Flow:**
```
Client Submits Business Application
↓
Admin Review (Landing Page Compliance Check)
↓
Approval/Rejection Decision
↓
BlueFocus Provider Application (Parallel Process)
↓
1-2 Working Days Processing
↓
Facebook Business Manager Creation
↓
Client Email Invitation to BM
↓
Manual Admin Panel Updates (BM ID, Ad Account IDs)
↓
Application Marked Complete
```

### 3. Ad Account Management

**Account Limitations:**
- Maximum 7 ad accounts per business
- Additional accounts require new business creation
- Clients can apply for additional accounts anytime (up to 7 per business)

**Account Lifecycle:**
- **60-day rule**: Accounts must have spend within 60 days or Facebook removes them
- **120-day rule**: Accounts need activity every 120 days to remain active

### 4. Financial Management

**Top-up Process:**
```
Client Initiates Top-up on Web App
↓
Admin Panel Request Generated
↓
Manual BlueFocus Platform Top-up by Team
↓
20-minute Processing Time
↓
Balance Available in Ad Account
```

**Wallet Structure:**
- **Main Wallet**: Organization-level balance
- **Account Allocation**: Distribute balance to specific ad accounts
- **Spend Tracking**: Real-time monitoring of account balances and spend

## Technical Infrastructure

### Team-Based Management System

**Team Structure:**
- Each team manages 20 organizations maximum
- 3 Dolphin Cloud profiles per team:
  - 1 Main profile (BlueFocus applications & account receipt)
  - 2 Backup profiles (Added to Business Managers for redundancy)

**Risk Management:**
- Prevents single point of failure
- Protects against profile takedowns
- Ensures business continuity

### Chinese LLC Permit System

**Business Registration Requirements:**
- Each business requires Chinese LLC permit for BlueFocus registration
- Permits provided as images by BlueFocus
- **Critical**: Same LLC must be reused for additional accounts within same business

**Tracking Requirements:**
- Unique ID system for each LLC permit
- Image storage and retrieval system
- Business-to-LLC mapping
- Drive integration for document management

## Platform Features

### Client Dashboard
- Organization overview
- Business management
- Ad account monitoring
- Balance and spend tracking
- Top-up functionality
- Application submission

### Admin Panel Requirements

**Organization Management:**
- View all registered organizations
- Subscription tier tracking
- Financial overview per organization

**Business Management:**
- Business application review and approval
- BlueFocus application tracking
- LLC permit assignment and tracking
- Business Manager ID management

**Ad Account Management:**
- Account status monitoring
- Balance tracking (organization/business/account level)
- Spend analytics
- Account lifecycle management (60/120-day rules)

**Team Management:**
- Team assignment (20 orgs per team)
- Dolphin Cloud profile tracking
- Workload distribution
- Risk management oversight

**Financial Management:**
- Top-up request processing
- Fee calculation and tracking
- Revenue analytics (subscription + top-up fees)
- Withdrawal management
- Churn analysis

### Telegram Bot Integration
- Account listing and status
- Balance and spend monitoring
- Top-up functionality
- Access code verification system
- Convenient mobile management

## Application Types

### Business Applications
- **New Business**: First-time business creation
- **Additional Accounts**: Existing business requesting more accounts (up to 7 total)

### Application States
- Submitted
- Under Review
- Approved (Pending BlueFocus)
- BlueFocus Processing
- BM Created (Pending Client Invitation)
- Completed

## Data Architecture Requirements

### Core Entities
1. **Organizations** (Clients)
2. **Teams** (Internal management)
3. **Businesses** (Client business entities)
4. **Ad Accounts** (Facebook advertising accounts)
5. **Applications** (Business/account requests)
6. **LLC Permits** (Chinese business registration documents)
7. **Transactions** (Financial operations)
8. **Subscriptions** (Pricing plans)

### Key Relationships
- Organizations → Businesses (1:many)
- Businesses → Ad Accounts (1:7 max)
- Teams → Organizations (1:20 max)
- LLC Permits → Businesses (1:1)
- Applications → Businesses/Ad Accounts (1:1)

## Operational Challenges

### Manual Processes
- BlueFocus account application
- Business Manager setup
- Client invitation management
- Top-up processing
- Admin panel data entry

### Compliance Requirements
- Facebook advertising policy adherence
- Landing page content review
- Account activity monitoring
- Financial transaction tracking

### Scalability Considerations
- Team capacity management (20 orgs/team)
- LLC permit inventory management
- Account lifecycle automation
- Risk distribution across teams

## Success Metrics

### Financial KPIs
- Monthly Recurring Revenue (MRR)
- Top-up fee revenue
- Client acquisition cost
- Churn rate
- Average revenue per organization

### Operational KPIs
- Application approval rate
- Average processing time
- Account utilization rate
- Team efficiency metrics
- Client satisfaction scores

## Future Enhancements

### API Integration Opportunities
- BlueFocus API integration (when available)
- Facebook Business Manager API
- Automated balance updates
- Real-time account status sync

### Automation Potential
- Application workflow automation
- Balance allocation optimization
- Account lifecycle management
- Compliance monitoring

---

This platform serves as a comprehensive solution for businesses seeking to scale their Facebook advertising operations through professional agency account management, combining manual expertise with systematic process management. 