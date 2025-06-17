# 🔧 AdHub Telegram Bot - Admin Commands Guide

## 🤖 **All Admin Commands Are Telegram Commands!**

You and your team can manage the entire bot system directly through Telegram using these admin commands.

---

## 🔐 **Admin Setup**

### **1. Configure Admin Users**
Add your Telegram user IDs to `.env`:
```
ADMIN_USER_IDS=your_telegram_id,teammate1_id,teammate2_id
```

### **2. Get Your Telegram User ID**
- Message the bot: `/whoami`
- Or use @userinfobot to get your ID

---

## 🏬 **Business Manager Management**

### **Discover Available Business Managers**
```
/admin_sync_bms
```
**What it does**: Shows all Business Managers from your Dolphin Cloud account
**Example output**:
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

### **Assign Business Manager to Organization**
```
/admin_add_bm <org_id> <bm_id> "Client Name - BM Description"
```
**Example**:
```
/admin_add_bm 123e4567-e89b-12d3-a456-426614174000 1760514248108495 "Heavenfelt Co - Main BM"
```

### **List Organization's Business Managers**
```
/admin_list_bms <org_id>
```
**What it shows**: All BMs assigned to a specific organization

### **Remove Business Manager from Organization**
```
/admin_remove_bm <org_id> <bm_id>
```

---

## 👥 **Telegram Group Management**

### **Assign Current Group to Organization**
```
/admin_add_group <org_id> [group_name]
```
**Usage**: Run this command IN the Telegram group you want to assign
**Example**: In "Heavenfelt Marketing Team" group:
```
/admin_add_group 123e4567-e89b-12d3-a456-426614174000 "Heavenfelt Marketing Team"
```

### **Check Which Organization Owns Current Group**
```
/admin_check_group
```
**Usage**: Run this IN any group to see if it's assigned to an organization

### **List Organization's Telegram Groups**
```
/admin_list_groups <org_id>
```
**What it shows**: All Telegram groups assigned to an organization

### **Remove Current Group from Organization**
```
/admin_remove_group <org_id>
```
**Warning**: Group will show ALL data after removal (unsafe for clients)

---

## 👥 **Client Management**

### **Register New Client**
```
/admin_register_client <email> <name> <organization_name>
```
**What it does**: Creates complete client setup (organization + user + wallet)
**Example**:
```
/admin_register_client john@heavenfelt.com "John Smith" "Heavenfelt Marketing Co"
```

### **List All Clients**
```
/admin_list_clients
```
**What it shows**: All registered clients with their Telegram link status

### **Get Client Invitation Message**
```
/admin_invite_client <email>
```
**What it does**: Generates invitation message to send to client
**Example**:
```
/admin_invite_client john@heavenfelt.com
```

---

## 📊 **System Management**

### **Bot System Statistics**
```
/admin_stats
```
**What it shows**: Bot status, database connection, API status

---

## 🎯 **Complete Admin Workflow**

### **Setting Up a New Client**

#### **Step 1: Register Client**
```
# Register new client (creates everything automatically)
/admin_register_client john@heavenfelt.com "John Smith" "Heavenfelt Marketing Co"
```

#### **Step 2: Discover and Assign Business Managers**
```
# 1. See what BMs are available
/admin_sync_bms

# 2. Assign client's BMs to their organization  
/admin_add_bm <client_org_id> <their_bm_id> "Client Name - Main BM"
/admin_add_bm <client_org_id> <their_bm_id_2> "Client Name - Secondary BM"

# 3. Verify assignments
/admin_list_bms <client_org_id>
```

#### **Step 3: Set Up Client's Telegram Groups**
```
# 1. Add bot to client's Telegram group
# 2. In that group, run:
/admin_add_group <client_org_id> "Client Name - Team Chat"

# 3. Verify group assignment
/admin_check_group

# 4. Test that group only shows client's data
/organizations
/accounts <their_business_id>
```

#### **Step 4: Send Client Invitation**
```
# Get invitation message to send to client
/admin_invite_client john@heavenfelt.com

# Send the generated message to client via email/WhatsApp/etc.
```

#### **Step 5: Client Onboarding**
```
# Client runs these commands:
/start
/link john@heavenfelt.com
/whoami
/organizations  # Should only show their organization
```

---

## 🔒 **Security & Data Isolation**

### **How It Works**
1. **Business Manager Mapping**: Each BM can only belong to one organization
2. **Group Assignment**: Each Telegram group can only belong to one organization  
3. **Automatic Filtering**: Bot automatically filters all data by user's permissions
4. **Safe Groups**: Assigned groups only show data for their organization

### **Safety Checks**
- ✅ **Assigned Groups**: Show only organization-specific data
- ❌ **Unassigned Groups**: Show ALL data (dangerous for clients)
- ✅ **Individual Chats**: Show data based on user's organization membership

---

## ⚠️ **Important Notes**

### **Group Safety**
- **ONLY add bot to groups AFTER assigning them to organizations**
- **Always run `/admin_check_group` to verify group assignment**
- **Unassigned groups will expose all client data**

### **Organization IDs**
- Get organization IDs from your Supabase dashboard
- Or create organizations via your main app when ready
- Each client needs their own organization

### **Business Manager IDs**
- Use `/admin_sync_bms` to discover available BM IDs
- BM IDs are numeric (e.g., "1760514248108495")
- Each BM can only be assigned to one organization

---

## 🧪 **Testing Commands**

### **Test Data Isolation**
```bash
# 1. Create test groups for different clients
# 2. Assign each group to different organizations
/admin_add_group <org_a_id> "Test Client A"
/admin_add_group <org_b_id> "Test Client B"

# 3. Test in each group
/organizations  # Should show different orgs
/accounts <business_id>  # Should show different accounts
```

### **Verify Security**
```bash
# In assigned group
/admin_check_group  # Should show organization
/organizations      # Should show only that org's data

# In unassigned group  
/admin_check_group  # Should warn "unassigned"
/organizations      # Shows ALL orgs (dangerous!)
```

---

## 📋 **Quick Reference**

### **Business Manager Commands**
- `/admin_sync_bms` - Discover available BMs
- `/admin_add_bm <org_id> <bm_id> "name"` - Assign BM
- `/admin_list_bms <org_id>` - List org's BMs
- `/admin_remove_bm <org_id> <bm_id>` - Remove BM

### **Group Management Commands**  
- `/admin_add_group <org_id> [name]` - Assign current group
- `/admin_check_group` - Check current group assignment
- `/admin_list_groups <org_id>` - List org's groups
- `/admin_remove_group <org_id>` - Remove current group

### **System Commands**
- `/admin_stats` - System status

---

## 🎉 **Ready to Manage!**

With these commands, you can:
- ✅ Assign Business Managers to clients
- ✅ Set up secure client Telegram groups  
- ✅ Ensure complete data isolation
- ✅ Manage everything through Telegram
- ✅ Safely deploy to production

**No need for complex admin panels - everything is manageable through Telegram!** 🚀 