# Admin Panel Restructure Plan - Team-Centric Workflow

## Overview

Based on the operational workflow analysis, we need to restructure the admin panel around a **team-centric approach** where each team manages 20 organizations, rather than managing individual businesses or ad accounts in isolation.

## New Admin Panel Structure

### 1. **Team Management Hub** (Primary Navigation)

**Purpose**: Central command center for team-based operations
**Key Features**:
- Team overview dashboard
- Capacity management (20 orgs per team)
- Dolphin Cloud profile tracking
- Risk distribution monitoring

**Sections**:
```
├── Team Overview
├── Team Assignment
├── Dolphin Profiles Management
├── Workload Distribution
└── Team Performance Metrics
```

### 2. **Organization Management** (Team-Filtered)

**Purpose**: Manage organizations within team context
**Key Features**:
- Organizations grouped by assigned team
- Subscription tier overview
- Financial summary per organization
- Business count tracking

**Enhanced Features**:
- Team-based filtering (default view)
- Organization transfer between teams
- Capacity alerts (approaching 20-org limit)
- Team performance comparison

### 3. **Application Processing Center**

**Purpose**: Streamlined application workflow management
**Key Features**:
- Unified application queue (new business + additional accounts)
- Landing page compliance review
- BlueFocus application tracking
- LLC permit assignment

**Application Types**:
- **New Business Applications**
- **Additional Account Applications** (existing businesses)

**Workflow States**:
```
Submitted → Under Review → Approved → BlueFocus Processing → 
BM Created → Client Invited → Completed
```

### 4. **Business & Account Management**

**Purpose**: Hierarchical business and ad account oversight
**Structure**:
```
Organization Level
├── Business 1 (LLC: CHN-001)
│   ├── Account 1 (Active, $500 balance)
│   ├── Account 2 (Active, $1200 balance)
│   └── Account 3 (Pending, $0 balance)
├── Business 2 (LLC: CHN-045)
│   ├── Account 1 (Active, $800 balance)
│   └── [Can apply for 6 more accounts]
```

**Key Features**:
- LLC permit tracking and reuse
- Account lifecycle monitoring (60/120-day rules)
- Balance tracking at all levels
- Account utilization analytics

### 5. **LLC Permit Management System**

**Purpose**: Chinese LLC permit inventory and assignment
**Key Features**:
- Permit image storage and retrieval
- Business-to-LLC mapping
- Permit reuse tracking
- Drive integration for document management

**Data Structure**:
```
LLC Permit Record:
- Permit ID: CHN-001
- Company Name: [Chinese Company Name]
- Image Files: [Permit documents]
- Assigned Business: [Business ID]
- Created Date: [Date]
- Status: Available/In Use/Expired
```

### 6. **Financial Operations Center**

**Purpose**: Comprehensive financial management
**Sections**:

**Top-up Request Processing**:
- Pending top-up requests
- BlueFocus manual processing queue
- 20-minute processing timer
- Balance allocation tracking

**Revenue Analytics**:
- Top-up fee revenue (percentage-based)
- Subscription revenue by tier
- Monthly recurring revenue (MRR)
- Churn analysis

**Balance Management**:
- Organization-level main wallets
- Business-level allocations
- Account-level balances
- Spend tracking and alerts

### 7. **Compliance & Monitoring Dashboard**

**Purpose**: Policy compliance and account health monitoring
**Key Features**:
- Landing page compliance review
- Account activity monitoring (60/120-day rules)
- Policy violation alerts
- Account health scores

## Enhanced Data Architecture

### New Core Entities

**Teams**:
```sql
teams:
- id
- name
- max_organizations (default: 20)
- current_organizations
- main_dolphin_profile_id
- backup_dolphin_profiles []
- created_at
- status
```

**Dolphin Profiles**:
```sql
dolphin_profiles:
- id
- team_id
- profile_name
- profile_type (main/backup)
- bluefocus_access
- status (active/suspended)
- created_at
```

**LLC Permits**:
```sql
llc_permits:
- id
- permit_code (CHN-001, CHN-002, etc.)
- company_name_chinese
- company_name_english
- permit_images []
- drive_folder_id
- assigned_business_id
- status (available/in_use/expired)
- created_at
```

**Enhanced Applications**:
```sql
applications:
- id
- organization_id
- business_id (null for new business)
- application_type (new_business/additional_accounts)
- requested_accounts_count
- landing_page_url
- timezone
- facebook_email
- llc_permit_id
- bluefocus_application_id
- business_manager_id
- ad_account_ids []
- stage (submitted/review/approved/processing/completed)
- assigned_team_id
- compliance_notes
- created_at
- updated_at
```

## Key Workflow Improvements

### 1. Team-Centric Organization Assignment
- New organizations automatically assigned to teams with capacity
- Visual team capacity indicators
- Automatic alerts when approaching 20-org limit

### 2. LLC Permit Reuse System
- When applying for additional accounts, system suggests existing LLC permit
- Visual permit usage tracking
- Prevent permit conflicts

### 3. Application Processing Pipeline
- Unified queue for all application types
- Automated compliance checks where possible
- BlueFocus application tracking integration

### 4. Enhanced Financial Tracking
- Real-time balance updates across all levels
- Automated fee calculations
- Revenue attribution to teams/organizations

## UI/UX Design Alignment

### Design System Consistency
- Adopt client dashboard design language
- Modern, clean interface
- Consistent component library
- Mobile-responsive design

### Navigation Structure
```
Admin Panel Navigation:
├── 🏠 Dashboard (Team Overview)
├── 👥 Teams
├── 🏢 Organizations
├── 📋 Applications
├── 🏪 Businesses & Accounts
├── 📄 LLC Permits
├── 💰 Financial Operations
├── ⚖️ Compliance & Monitoring
├── 📊 Analytics & Reports
└── ⚙️ Settings
```

### Dashboard Widgets
- Team capacity utilization
- Pending applications count
- Revenue metrics (daily/monthly)
- Account health alerts
- Recent activities feed

## Implementation Priority

### Phase 1: Core Infrastructure
1. Team management system
2. Enhanced organization structure
3. Application processing pipeline
4. LLC permit management

### Phase 2: Financial Operations
1. Top-up request processing
2. Balance tracking improvements
3. Revenue analytics
4. Fee calculation automation

### Phase 3: Compliance & Automation
1. Compliance monitoring dashboard
2. Account lifecycle automation
3. Policy violation detection
4. Automated reporting

### Phase 4: Advanced Features
1. Predictive analytics
2. Team performance optimization
3. Client success metrics
4. API integrations (when available)

## Success Metrics

### Operational Efficiency
- Average application processing time
- Team utilization rates
- LLC permit reuse efficiency
- Manual task reduction percentage

### Financial Performance
- Revenue per team
- Top-up processing accuracy
- Fee collection rates
- Churn reduction

### Compliance & Risk Management
- Policy compliance rates
- Account health scores
- Risk distribution effectiveness
- Incident response times

---

This restructured admin panel will provide a more scalable, efficient, and risk-managed approach to handling the complex workflow of Meta agency ad account management while maintaining operational excellence and client satisfaction. 