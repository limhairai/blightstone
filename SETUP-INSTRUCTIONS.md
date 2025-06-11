# AdHub Database Setup Instructions

## Quick Setup (Fresh Database)

### 1. Complete Database Setup
Run the consolidated migration:
```sql
-- Copy and paste contents of: setup-complete-fresh-db.sql
-- OR use: supabase/migrations/20250101000000_complete_database_setup.sql
```

### 2. Demo Data Setup 
Run the demo data script:
```sql
-- Copy and paste contents of: setup-global-demo.sql
```

### 3. Add User to Demo Organization
```sql
SELECT add_user_to_demo_org('your-email@example.com');
```

## What This Creates

### Database Schema:
- ✅ All tables: profiles, organizations, businesses, ad_accounts, wallets, transactions, plans
- ✅ All indexes and foreign keys
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for updated_at timestamps
- ✅ Subscription plans data (free, bronze, silver, gold)

### Demo Data:
- ✅ Demo organization: "TechFlow Solutions" 
- ✅ 3 demo businesses with different statuses
- ✅ 4 demo ad accounts with realistic metrics
- ✅ Demo wallet with $1,250 balance
- ✅ Transaction history

## Migration History

**Old migrations** (9 files) have been consolidated into **1 file**:
- `migrations-old/` - Backup of original 9 migration files
- `migrations/20250101000000_complete_database_setup.sql` - Single consolidated migration

## Fast Terminal Commands

```bash
# Test connection
echo "SELECT 'Database connected successfully!' as status;" | npx supabase db remote --linked --psql

# Apply migration (if using Supabase CLI)
npx supabase db push --linked

# For copy-paste method:
# 1. Copy script content
# 2. Go to Supabase Dashboard > SQL Editor
# 3. Paste and run
```

## Troubleshooting

- **Column errors**: Tables might already exist with different schema
- **Permission errors**: Check RLS policies are correctly applied
- **Demo data not showing**: Ensure user is added to demo organization
- **Slow queries**: Check if demo organization ID exists: `10000000-0000-0000-0000-000000000001` 