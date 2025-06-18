# 🚀 AdHub Telegram Bot - Production Setup Guide

## 🚨 **Critical Security & Data Isolation**

### **The Problem**
Your bot currently has access to ALL Dolphin Cloud data, but needs to be segmented by client/organization. Without proper setup, adding the bot to groups would expose all clients' data.

### **The Solution**
Implement organization-to-business-manager mapping to ensure data isolation.

---

## 📋 **Step-by-Step Production Setup**

### **Phase 1: Database Setup**

#### **1. Add Business Manager Mapping Table**
```bash
cd telegram-bot
# Apply the database schema update
psql -h your-supabase-host -U postgres -d postgres -f database_schema_update.sql
```

#### **2. Verify Database Schema**
The new table `organization_business_managers` should exist with:
- `organization_id` → Links to your existing organizations
- `business_manager_id` → Dolphin Cloud BM ID (e.g., "1760514248108495")
- `business_manager_name` → Human readable name
- Row Level Security (RLS) enabled for data isolation

### **Phase 2: Business Manager Assignment**

#### **1. Start the Bot**
```bash
python run_bot.py
```

#### **2. Discover Available Business Managers**
As admin, run:
```
/admin_sync_bms
```
This shows all BMs from your Dolphin Cloud:
```
🏬 Available Business Managers in Dolphin Cloud
📊 Total: 5

🔹 AdHub-1760514248108495
   ID: 1760514248108495
   CABs: 0
   Verified: ❌

🔹 AdHub-Heavenfelt
   ID: 1569326140598001
   CABs: 0
   Verified: ❌
```

#### **3. Assign BMs to Organizations**
For each client organization, assign their Business Managers:
```
/admin_add_bm <org_id> <bm_id> "Client Name - Main BM"
```

**Example:**
```
/admin_add_bm 123e4567-e89b-12d3-a456-426614174000 1760514248108495 "Heavenfelt Co - Main BM"
/admin_add_bm 456e7890-e89b-12d3-a456-426614174001 1714318746077670 "Client ABC - BM 1"
```

#### **4. Verify Assignments**
```
/admin_list_bms <org_id>
```

### **Phase 3: Telegram Group Setup**

#### **1. Add Bot to Client Groups**
For each client Telegram group:
1. Add the bot to the group
2. In that group, run as admin:
```
/admin_add_group <client_org_id> "Client Name - Team Chat"
```

#### **2. Verify Group Assignment**
```
/admin_check_group
```
Should show:
```
🏢 Group Organization Info

👥 Group: Heavenfelt Marketing Team
🆔 Group ID: -1001234567890
🏢 Organization: Heavenfelt Co
🆔 Org ID: 123e4567-e89b-12d3-a456-426614174000

✅ This group shows only data for this organization.
```

#### **3. Test Group Data Isolation**
In the assigned group, test:
```
/organizations  # Should show only this client's organization
/businesses <org_id>  # Should show only this client's businesses
/accounts <business_id>  # Should show only this client's accounts
```

#### **4. Manage Groups**
```bash
# List all groups for an organization
/admin_list_groups <org_id>

# Remove group assignment (makes it unsafe)
/admin_remove_group <org_id>

# Check current group status
/admin_check_group
```

### **Phase 4: Client Onboarding Workflow**

#### **For Each New Client:**

1. **Create Organization** (via your main app when ready, or manually in Supabase)
2. **Create Business Managers** in Dolphin Cloud
3. **Map BMs to Organization** using `/admin_add_bm`
4. **Add Client Users** to organization in Supabase
5. **Client Links Telegram** using `/link their@email.com`

#### **Client Can Now Safely Use:**
- `/organizations` - Shows only their organizations
- `/businesses <org_id>` - Shows only their assigned BMs
- `/accounts <business_id>` - Shows only their ad accounts
- `/balance <account_id>` - Checks only their account balances

---

## 🔒 **Security & Data Isolation**

### **How It Works**
1. **Database Level**: RLS policies ensure users only see their organization's data
2. **API Level**: Bot filters Dolphin Cloud responses by allowed BM IDs
3. **Command Level**: All commands check user permissions before showing data

### **What's Protected**
- ✅ Users can only see their organization's Business Managers
- ✅ Users can only see ad accounts from their assigned BMs
- ✅ Users can only check balances for their accounts
- ✅ Users can only top up their own accounts

### **Group Safety**
- ✅ **Assigned Groups**: Show only organization-specific data
- ❌ **Unassigned Groups**: Show ALL data (dangerous for clients)
- ✅ **Individual Chats**: Show data based on user's organization membership
- 🔒 **Admin Controls**: Full group assignment management via Telegram commands

### **Group Assignment Rules**
- Each Telegram group can only belong to one organization
- Users in assigned groups see only that organization's data
- Unassigned groups trigger security warnings
- Admin commands work in any context for management

---

## 🎯 **Deployment Options**

### **Option A: Single Bot for All Clients (Recommended)**
- One bot instance serves all clients
- Data isolation via organization mapping
- Easier to maintain and update
- Lower server costs

### **Option B: Separate Bot per Client**
- Each client gets their own bot instance
- Complete isolation but more complex
- Higher maintenance overhead
- Multiple server instances needed

**Recommendation**: Use Option A with proper organization mapping.

---

## 📱 **Client Usage Examples**

### **Individual Client Usage**
```
# Client links their account
/start
/link john@heavenfelt.com
/whoami

# Client checks their data
/organizations
/businesses <their_org_id>
/accounts <their_business_id>
/balance <their_account_id>
```

### **Group Usage (Client-Specific Groups)**
```
# Add bot to "Heavenfelt Co - Marketing Team" group
# All commands show only Heavenfelt's data
/organizations
/accounts <heavenfelt_business_id>
/balance <heavenfelt_account_id>
```

---

## ⚠️ **Important Considerations**

### **Before Main App Launch**
Since your main app isn't in production yet:

1. **Manual Organization Setup**
   - Create organizations manually in Supabase
   - Add users manually to organizations
   - Use bot for Business Manager mapping

2. **Email-Based Linking**
   - Users link via `/link their@email.com`
   - Ensure emails match your client database

3. **Admin Management**
   - Use admin commands to manage BM assignments
   - Monitor data access and permissions

### **After Main App Launch**
1. **Automated Organization Creation**
2. **Seamless User Onboarding**
3. **Integrated Payment Processing**
4. **Automated BM Assignment**

---

## 🧪 **Testing Data Isolation**

### **Test Scenario**
1. Create 2 test organizations
2. Assign different BMs to each
3. Create test users for each organization
4. Verify users can only see their own data

### **Test Commands**
```bash
# Test as User A (should see only Org A data)
/link usera@example.com
/organizations
/businesses <org_a_id>

# Test as User B (should see only Org B data)  
/link userb@example.com
/organizations
/businesses <org_b_id>
```

---

## 🚀 **Go-Live Checklist**

### **Pre-Launch**
- [ ] Database schema updated
- [ ] All Business Managers mapped to organizations
- [ ] Test users can only see their data
- [ ] Admin commands working
- [ ] Bot responds correctly in groups

### **Launch**
- [ ] Add bot to client-specific groups
- [ ] Train clients on bot commands
- [ ] Monitor for any data leakage
- [ ] Set up error monitoring

### **Post-Launch**
- [ ] Payment integration (Phase 2)
- [ ] Advanced features (alerts, reporting)
- [ ] Scale to more clients

---

## 💡 **Next Steps**

1. **Apply database schema** → Enable organization mapping
2. **Map your current BMs** → Assign to test organizations  
3. **Test data isolation** → Verify security works
4. **Onboard first client** → Real-world testing
5. **Payment integration** → Complete the workflow

**The bot is production-ready for data viewing and balance checking once Business Manager mapping is complete!** 🎉 