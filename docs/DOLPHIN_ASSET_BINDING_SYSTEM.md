# Dolphin Asset Binding System

## Overview

The Dolphin Asset Binding System enables you to assign your centralized Facebook assets (Business Managers and Ad Accounts) from Dolphin Cloud to specific clients, ensuring complete isolation between clients while maintaining centralized control.

## Architecture

### 🏗️ **Core Components**

1. **Asset Discovery** - Sync your Dolphin Cloud assets into the system
2. **Asset Registry** - Master database of all your FB assets
3. **Client Binding** - Assign specific assets to individual clients
4. **Spend Management** - Track client payments and calculate budgets
5. **Client Isolation** - Ensure clients only see their assigned assets

### 📊 **Database Tables**

```sql
-- Master registry of all your Dolphin Cloud assets
dolphin_assets
├── facebook_id (FB BM ID or Ad Account ID)
├── asset_type (business_manager, ad_account, profile)
├── dolphin_profile_id (which Dolphin profile manages this)
├── is_assigned (whether it's bound to a client)
└── assigned_to_organization_id (which client owns it)

-- Client binding configuration
client_asset_bindings
├── organization_id (client organization)
├── dolphin_asset_id (which asset they get)
├── permissions (what they can do)
├── spend_limits (your imposed limits)
├── client_topped_up_total (how much they've paid you)
└── your_fee_percentage (your fee rate)

-- Daily spend tracking per client per asset
client_spend_tracking
├── facebook_account_id (FB Ad Account ID)
├── amount_spent (from Dolphin Cloud)
├── client_balance (calculated remaining budget)
└── days_remaining_estimate (runway calculation)
```

## Workflow

### 🔄 **1. Asset Discovery**

**Admin Action:** Sync your Dolphin Cloud assets

```bash
POST /api/dolphin-assets/sync/discover
```

**What happens:**
- Fetches all Business Managers from your Dolphin Cloud
- Fetches all Ad Accounts from your Dolphin Cloud  
- Stores them in `dolphin_assets` table
- Marks them as `is_assigned = false` (available for binding)

**Your Dolphin Cloud Setup:**
```
Dolphin Profile 1
├── Business Manager A (3 ad accounts)
├── Business Manager B (5 ad accounts)
└── Business Manager C (2 ad accounts)

Dolphin Profile 2  
├── Business Manager D (4 ad accounts)
└── Business Manager E (6 ad accounts)
```

**After Discovery:**
```
dolphin_assets table:
├── BM A (unassigned)
├── BM B (unassigned) 
├── BM C (unassigned)
├── Ad Account A1 (unassigned)
├── Ad Account A2 (unassigned)
├── ... (all 20 ad accounts unassigned)
```

### 🔗 **2. Client Asset Binding**

**Admin Action:** Assign assets to specific clients

```bash
POST /api/dolphin-assets/bind
{
  "dolphin_asset_id": "dolphin_abc123",
  "organization_id": "org_client_techcorp", 
  "permissions": {
    "can_view_insights": true,
    "can_create_campaigns": false,
    "can_edit_budgets": false
  },
  "spend_limits": {
    "daily": 500,
    "monthly": 15000,
    "total": 50000
  },
  "client_topped_up_total": 10000,
  "fee_percentage": 0.05
}
```

**Result:**
- Asset marked as `is_assigned = true`
- `client_asset_bindings` record created
- Client can now see this asset on their dashboard
- **Other clients cannot see this asset**

### 💰 **3. Budget Calculation & Indirect Workflow**

**The Actual Workflow:**
```javascript
// 1. Client pays you $10,000
client_topped_up_total = 10000

// 2. You take 5% fee
your_fee = 10000 * 0.05 = 500

// 3. Available for Facebook spending
available_for_spend = 10000 - 500 = 9500

// 4. YOUR TEAM manually tops up provider on their app ($9,500)
// 5. PROVIDER automatically tops up Facebook (spend limit = $9,500)
// 6. DOLPHIN CLOUD detects the new spend limit
// 7. YOUR SYSTEM detects the change from Dolphin Cloud

// 8. Client spends $3,000 on Facebook
amount_spent = 3000 // from Dolphin Cloud API

// 9. Remaining budget
remaining_budget = 9500 - 3000 = 6500

// 10. Days remaining (if spending $200/day)
days_remaining = 6500 / 200 = 32.5 days
```

**Indirect Detection Workflow:**
1. **Client pays you** → Record payment in your system
2. **Your team tops up provider** → Manual action on provider's app
3. **Provider tops up Facebook** → Automatic on their end
4. **Dolphin Cloud detects change** → Sees new spend limit
5. **Your system detects change** → Polls Dolphin Cloud for updates
6. **Client sees updated budget** → Reflected on their dashboard

### 👥 **4. Client Dashboard View**

**Client A sees:**
```
GET /api/dolphin-assets/client/org_client_techcorp
Response:
{
  "assets": [
    {
      "name": "Business Manager A",
      "facebook_id": "123456789",
      "asset_type": "business_manager",
      "permissions": {...},
      "spend_limit_detected": 9500, // Detected from Dolphin Cloud
      "remaining_budget": 6500,
      "days_remaining": 32.5
    }
  ]
}
```

**Complete Isolation:** Client A cannot see Client B's assets and vice versa.

## API Endpoints

### 🔧 **Admin Endpoints**

```bash
# Discover assets from Dolphin Cloud
POST /api/dolphin-assets/sync/discover

# Get unassigned assets available for binding
GET /api/dolphin-assets/unassigned?asset_type=ad_account

# Bind asset to client
POST /api/dolphin-assets/bind

# Unbind asset from client  
POST /api/dolphin-assets/unbind/{binding_id}

# Detect spend limit changes from Dolphin Cloud
POST /api/dolphin-assets/spend/detect-changes

# Manually update detected spend limit
POST /api/dolphin-assets/spend/manual-limit-update

# Get spend limit change history
GET /api/dolphin-assets/spend/limit-history/{binding_id}

# Record client payment/top-up
POST /api/dolphin-assets/spend/client-topup
```

### 👤 **Client Endpoints**

```bash
# Get client's assigned assets
GET /api/dolphin-assets/client/{organization_id}

# Get specific business assets
GET /api/dolphin-assets/client/{org_id}?business_id={business_id}

# Get only ad accounts
GET /api/dolphin-assets/client/{org_id}?asset_type=ad_account
```

## Integration Examples

### 🎯 **Admin Panel Integration**

```typescript
// Record client payment (no provider communication)
const recordClientPayment = async (bindingId: string, amount: number) => {
  const response = await fetch('/api/dolphin-assets/spend/client-topup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      binding_id: bindingId,
      amount: amount,
      payment_method: 'stripe'
    })
  });
  
  const data = await response.json();
  
  // Show manual next steps to admin
  showManualStepsDialog({
    message: "Client payment recorded. Next steps:",
    steps: data.next_steps,
    availableForSpend: data.available_for_spend
  });
};

// Detect spend limit changes from Dolphin Cloud
const detectSpendLimitChanges = async () => {
  const response = await fetch('/api/dolphin-assets/spend/detect-changes', {
    method: 'POST'
  });
  
  const data = await response.json();
  
  if (data.total_changes_detected > 0) {
    toast.success(`Detected ${data.total_changes_detected} spend limit changes`);
    refreshClientAssets();
  } else {
    toast.info('No spend limit changes detected');
  }
};

// Manual limit update (when auto-detection misses something)
const manualLimitUpdate = async (bindingId: string, detectedLimit: number) => {
  await fetch('/api/dolphin-assets/spend/manual-limit-update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      binding_id: bindingId,
      detected_limit: detectedLimit,
      notes: "Manually verified from Dolphin Cloud dashboard"
    })
  });
  
  toast.success('Spend limit manually updated');
};
```

### 📱 **Client Dashboard Integration**

```typescript
// Client dashboard - show only their assets
const ClientAccountsPage = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  
  useEffect(() => {
    const fetchClientAssets = async () => {
      const response = await fetch(
        `/api/dolphin-assets/client/${user.organization_id}?asset_type=ad_account&include_spend_data=true`
      );
      const data = await response.json();
      setAssets(data.assets);
    };
    
    fetchClientAssets();
  }, [user.organization_id]);
  
  return (
    <div>
      <h1>Your Ad Accounts</h1>
      {assets.map(asset => (
        <AccountCard 
          key={asset.asset_id}
          name={asset.name}
          facebookId={asset.facebook_id}
          remainingBudget={asset.remaining_budget}
          daysRemaining={asset.days_remaining}
          permissions={asset.permissions}
        />
      ))}
    </div>
  );
};
```

## Financial Flow

### 💳 **Client Payment Process**

1. **Client pays you** (Stripe, bank transfer, etc.)
2. **You record the payment:**
   ```bash
   POST /api/dolphin-assets/spend/client-topup
   {
     "binding_id": "binding_xyz789",
     "amount": 5000,
     "payment_method": "stripe"
   }
   ```
3. **System calculates:**
   - Your fee: `$5000 × 5% = $250`
   - Available for spend: `$5000 - $250 = $4750`
4. **Your team manually tops up provider** with `$4750` on provider's app
5. **Provider automatically tops up Facebook** spend limit to `$4750`
6. **Dolphin Cloud detects the change** within minutes/hours
7. **You sync the changes:**
   ```bash
   POST /api/dolphin-assets/spend/detect-changes
   ```
8. **Client sees updated budget** on their dashboard

### 🔄 **Spend Limit Detection**

```bash
# Detect all spend limit changes
POST /api/dolphin-assets/spend/detect-changes

Response:
{
  "status": "detection_complete",
  "total_changes_detected": 2,
  "updated_bindings": [
    {
      "binding_id": "binding_xyz789",
      "asset_name": "Client TechCorp Account",
      "facebook_account_id": "act_123456789",
      "previous_limit": 5000,
      "new_limit": 9750,
      "change_amount": 4750
    }
  ],
  "current_limits": {
    "act_123456789": 9750,
    "act_987654321": 3200
  },
  "sync_timestamp": "2024-01-20T10:30:00Z"
}
```

### 🎯 **Admin Panel Integration**

```typescript
// Record client payment (no provider communication)
const recordClientPayment = async (bindingId: string, amount: number) => {
  const response = await fetch('/api/dolphin-assets/spend/client-topup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      binding_id: bindingId,
      amount: amount,
      payment_method: 'stripe'
    })
  });
  
  const data = await response.json();
  
  // Show manual next steps to admin
  showManualStepsDialog({
    message: "Client payment recorded. Next steps:",
    steps: data.next_steps,
    availableForSpend: data.available_for_spend
  });
};

// Detect spend limit changes from Dolphin Cloud
const detectSpendLimitChanges = async () => {
  const response = await fetch('/api/dolphin-assets/spend/detect-changes', {
    method: 'POST'
  });
  
  const data = await response.json();
  
  if (data.total_changes_detected > 0) {
    toast.success(`Detected ${data.total_changes_detected} spend limit changes`);
    refreshClientAssets();
  } else {
    toast.info('No spend limit changes detected');
  }
};

// Manual limit update (when auto-detection misses something)
const manualLimitUpdate = async (bindingId: string, detectedLimit: number) => {
  await fetch('/api/dolphin-assets/spend/manual-limit-update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      binding_id: bindingId,
      detected_limit: detectedLimit,
      notes: "Manually verified from Dolphin Cloud dashboard"
    })
  });
  
  toast.success('Spend limit manually updated');
};
```

### 📊 **Spend Tracking**

- **Daily sync** with Dolphin Cloud API (read-only spend data)
- **Automatic change detection** via polling or webhooks
- **Manual verification** when auto-detection fails
- **Historical tracking** of limit changes over time

## Integration Workflow

### 🔄 **Typical Daily Operations**

1. **Morning Sync:** Run spend limit detection to catch overnight changes
2. **Client Payments:** Record payments as they come in
3. **Team Coordination:** Your team tops up provider based on recorded payments
4. **Afternoon Sync:** Run detection again to catch limit updates
5. **Client Support:** Clients see updated budgets automatically

### 📈 **Automated Detection**

```bash
# Set up a cron job to detect changes every hour
0 * * * * curl -X POST https://your-api.com/api/dolphin-assets/spend/detect-changes

# Or use a background job in your application
async function detectChangesBackground() {
  try {
    const response = await fetch('/api/dolphin-assets/spend/detect-changes', {
      method: 'POST'
    });
    const data = await response.json();
    
    if (data.total_changes_detected > 0) {
      // Notify admin team
      await notifyTeam(`Detected ${data.total_changes_detected} spend limit changes`);
      
      // Update client notifications
      await updateClientNotifications(data.updated_bindings);
    }
  } catch (error) {
    console.error('Detection failed:', error);
  }
}

// Run every 30 minutes
setInterval(detectChangesBackground, 30 * 60 * 1000);
```

### 🚨 **Manual Verification**

When auto-detection fails or you want to double-check:

1. **Check Dolphin Cloud dashboard** manually
2. **Compare with your system's recorded limits**
3. **Use manual update endpoint** if discrepancies found
4. **Verify client sees correct budget**

This corrected system reflects the reality that everything happens indirectly through Dolphin Cloud detection, with no direct API access to your provider. Your team coordinates manually while the system tracks and detects changes automatically.

## Security & Isolation

### 🔒 **Client Isolation**

- **Database level:** `organization_id` filtering on all queries
- **API level:** JWT token validation ensures users only see their org's data
- **Asset level:** `client_asset_bindings` table enforces ownership
- **Permission level:** Fine-grained controls per asset

### 🛡️ **Admin Controls**

- **Asset assignment** - Only admins can bind/unbind assets
- **Spend limits** - You control all spending limits
- **Permissions** - You decide what clients can do
- **Fee collection** - Automatic fee calculation and tracking

## Monitoring & Alerts

### 📈 **Admin Dashboard**

- **Asset utilization** - How many assets are assigned vs available
- **Revenue tracking** - Total fees collected per client
- **Spend monitoring** - Real-time spending across all clients
- **Health checks** - Asset sync status and errors

### 🚨 **Automated Alerts**

- **Low budget warnings** - When client has < 7 days remaining
- **Sync failures** - When Dolphin Cloud sync fails
- **Overspending alerts** - When clients approach limits
- **Asset health issues** - When FB assets get restricted

## Best Practices

### ✅ **Asset Management**

1. **Regular discovery** - Sync with Dolphin Cloud daily
2. **Health monitoring** - Check asset status regularly  
3. **Capacity planning** - Monitor asset utilization
4. **Backup assets** - Keep unassigned assets for scaling

### 💡 **Client Onboarding**

1. **Asset preparation** - Ensure assets are healthy before binding
2. **Spend limit setup** - Set conservative initial limits
3. **Permission configuration** - Start with minimal permissions
4. **Documentation** - Provide clear client guidelines

### 🔄 **Ongoing Operations**

1. **Daily spend sync** - Automated background jobs
2. **Budget monitoring** - Proactive client communication
3. **Performance tracking** - Monitor asset performance
4. **Client support** - Quick response to binding issues

This system gives you complete control over your Facebook assets while providing seamless, isolated experiences for each of your clients. 