# Dolphin Integration Architecture

## Overview
Dolphin serves as our bridge to Facebook's API, managing real Business Managers and Ad Accounts through browser profiles. Our app provides the management layer that maps these real Facebook assets to our clients.

## Architecture Layers

### Layer 1: Facebook Reality
- **Real Business Managers**: Actual FB BMs with real spend, campaigns, data
- **Real Ad Accounts**: Actual FB ad accounts with real performance metrics  
- **Real Profiles**: Browser profiles that have access to multiple BMs
- **Real Spend**: Actual money being spent on Facebook ads

### Layer 2: Dolphin (API Bridge)
- **Profile Management**: Manages browser profiles (1 main + 2 backup per team)
- **Asset Discovery**: Scans profiles to find available BMs and ad accounts
- **API Automation**: Executes Facebook API calls through profiles
- **Health Monitoring**: Tracks profile status, BM health, account issues

### Layer 3: Our App (Management Layer)
- **Asset Registry**: Database of all discovered Facebook assets
- **Client Bindings**: Maps FB assets to our client organizations
- **Permission Control**: Enforces spend limits, access controls
- **Billing Integration**: Tracks usage for client billing

### Layer 4: Client Interface
- **Filtered Views**: Clients see only their assigned assets
- **Real-Time Data**: Performance data pulled from actual Facebook
- **Controlled Actions**: All actions go through our permission system
- **Unified Experience**: Single interface for all their FB assets

## Data Models

### Facebook Asset Registry
```typescript
interface FacebookBusinessManager {
  id: string                    // Our internal ID
  fbBmId: string               // Real Facebook BM ID
  name: string                 // BM name from Facebook
  status: 'active' | 'restricted' | 'suspended'
  
  // Dolphin Integration
  managingProfileId: string    // Which Dolphin profile manages this
  teamId: string              // Which profile team owns this
  
  // Client Assignment
  assignedClientOrgId?: string // Which client org this belongs to
  assignedClientBusinessId?: string
  
  // Metadata
  discoveredAt: string        // When we first found this BM
  lastSyncAt: string         // Last time we synced with Facebook
  adAccountIds: string[]     // Associated ad account IDs
  
  // Health & Status
  healthStatus: 'healthy' | 'warning' | 'critical'
  lastHealthCheck: string
  issues: string[]
}

interface FacebookAdAccount {
  id: string                  // Our internal ID
  fbAccountId: string        // Real Facebook account ID
  name: string               // Account name from Facebook
  businessManagerId: string  // Parent BM (our internal ID)
  
  // Real Facebook Data
  balance: number            // Actual account balance from FB
  spendToday: number        // Real spend data
  spendThisMonth: number    // Real spend data
  currency: string          // Account currency
  
  // Our Management Layer
  assignedClientOrgId?: string
  assignedClientBusinessId?: string
  spendLimit: number        // Our app's imposed limit
  
  // Status & Health
  status: 'active' | 'paused' | 'suspended' | 'restricted'
  lastSyncAt: string
  syncErrors: string[]
}
```

### Client Binding System
```typescript
interface ClientAssetBinding {
  id: string
  clientOrganizationId: string
  clientBusinessId: string
  
  // Facebook Assets
  facebookBusinessManagerIds: string[]
  facebookAdAccountIds: string[]
  
  // Permissions & Limits
  permissions: {
    canCreateCampaigns: boolean
    canEditBudgets: boolean
    canAccessInsights: boolean
    canManagePages: boolean
  }
  
  spendLimits: {
    daily: number
    monthly: number
    total: number
  }
  
  // Metadata
  assignedAt: string
  assignedBy: string        // Admin user who made the assignment
  notes: string
}
```

## Integration Workflows

### 1. Asset Discovery & Registration
```typescript
// Dolphin discovers new assets
const discoveredAssets = await dolphin.scanAllProfiles()

// Register in our system
for (const asset of discoveredAssets) {
  await registerFacebookAsset({
    fbBmId: asset.businessManagerId,
    name: asset.name,
    managingProfileId: asset.profileId,
    teamId: asset.teamId,
    adAccountIds: asset.adAccounts.map(acc => acc.id)
  })
}

// Admin sees unassigned assets
const unassignedAssets = await getUnassignedFacebookAssets()
```

### 2. Client Assignment Process
```typescript
// Admin assigns FB assets to client
await assignFacebookAssetsToClient({
  clientOrganizationId: 'org_VrfbN6vMc2MCvaZELhfJ',
  clientBusinessId: 'biz_123',
  facebookBusinessManagerIds: ['fbBm_456'],
  facebookAdAccountIds: ['fbAcc_789', 'fbAcc_101'],
  permissions: {
    canCreateCampaigns: true,
    canEditBudgets: false,
    canAccessInsights: true,
    canManagePages: false
  },
  spendLimits: {
    daily: 1000,
    monthly: 25000,
    total: 100000
  }
})
```

### 3. Client Data Sync
```typescript
// Regular sync of real Facebook data
setInterval(async () => {
  const clientBindings = await getAllClientBindings()
  
  for (const binding of clientBindings) {
    // Get real data from Facebook via Dolphin
    const realData = await dolphin.getAccountMetrics(
      binding.facebookAdAccountIds
    )
    
    // Update our client's view with real data
    await updateClientDashboard(binding.clientOrganizationId, realData)
  }
}, 300000) // Every 5 minutes
```

## Admin Panel Enhancements

### New Admin Pages Needed:

#### 1. **Facebook Asset Registry** (`/admin/facebook-assets`)
- List all discovered Facebook BMs and ad accounts
- Show assignment status (assigned/unassigned)
- Health status of each asset
- Sync status and last update times

#### 2. **Profile Team Management** (`/admin/profile-teams`)
- Manage Dolphin profile teams
- Monitor profile health (active/banned/maintenance)
- View which BMs each profile manages
- Profile capacity management (max 20 BMs per profile set)

#### 3. **Client Asset Assignment** (`/admin/client-bindings`)
- Assign Facebook assets to client organizations
- Set permissions and spend limits
- View current assignments
- Bulk assignment operations

#### 4. **Sync & Health Monitoring** (`/admin/sync-status`)
- Monitor data sync status
- View sync errors and issues
- Manual sync triggers
- Facebook API rate limit monitoring

## Client Dashboard Changes

### Real Data Integration:
```typescript
// Instead of mock data, pull real Facebook metrics
const useClientAssets = () => {
  const { state } = useAppData()
  
  return useMemo(() => {
    // Get client's assigned Facebook assets
    const assignedAssets = state.clientAssetBindings
    
    // Return real Facebook data for these assets
    return {
      businessManagers: assignedAssets.facebookBusinessManagers,
      adAccounts: assignedAssets.facebookAdAccounts.map(account => ({
        ...account,
        balance: account.realFacebookBalance,    // Real FB data
        spendToday: account.realSpendToday,     // Real FB data
        impressions: account.realImpressions,   // Real FB data
        // But still respect our app's limits
        spendLimit: account.ourAppSpendLimit
      }))
    }
  }, [state.clientAssetBindings])
}
```

## Implementation Priority

### Phase 1: Data Models & API Integration
1. Create Facebook asset registry models
2. Build Dolphin API integration service
3. Implement asset discovery workflow

### Phase 2: Admin Panel Extensions
1. Facebook asset registry page
2. Client assignment interface
3. Health monitoring dashboard

### Phase 3: Client Dashboard Integration
1. Replace mock data with real Facebook data
2. Implement permission enforcement
3. Add real-time sync indicators

### Phase 4: Advanced Features
1. Automated asset discovery
2. Smart assignment recommendations
3. Advanced analytics and reporting

## Technical Considerations

### Data Synchronization
- **Real-time vs Batch**: Balance between fresh data and API rate limits
- **Conflict Resolution**: Handle cases where Facebook data conflicts with our records
- **Offline Handling**: What to show when Facebook API is unavailable

### Security & Permissions
- **Profile Security**: Protect Dolphin profile credentials
- **Client Isolation**: Ensure clients can't access each other's data
- **Admin Audit Trail**: Log all assignment and permission changes

### Performance & Scaling
- **Caching Strategy**: Cache frequently accessed Facebook data
- **Background Jobs**: Handle heavy sync operations asynchronously
- **Rate Limit Management**: Respect Facebook API limits across all profiles

Does this architecture align with your vision? Should we start implementing any specific part of this integration? 