# Production Database Setup Instructions

## Problem
Your production database is missing the required schema (tables like `organizations`, `businesses`, `profiles`, etc.) that your app expects. This is why the dashboard loads forever - the app can't fetch organizations because the table doesn't exist.

## Solution
Run the `setup-production-db.sql` script on your production database to create all required tables and seed data.

## Steps

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard: https://supabase.com/dashboard/projects
2. Navigate to **SQL Editor**
3. Copy the entire contents of `setup-production-db.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the script

### Option 2: Using psql command line
If you have the database connection string:
```bash
psql "your-production-database-url" -f setup-production-db.sql
```

### Option 3: Using Supabase CLI
If you have the correct project reference:
```bash
npx supabase db push --project-ref YOUR_PROJECT_REF
```

## What the script does
1. **Creates all required tables**: profiles, organizations, organization_members, businesses, ad_accounts, wallets, transactions, plans
2. **Sets up Row Level Security (RLS)** policies for data access control
3. **Inserts seed data** for subscription plans (free, bronze, silver, gold)
4. **Creates a helper function** `create_demo_user_data(email)` to set up demo data for any user

## After running the script
1. Your dashboard should load properly
2. You can create demo data for any user by running:
   ```sql
   SELECT create_demo_user_data('your-email@example.com');
   ```

## Verification
After running the script, you can verify it worked by checking:
1. Dashboard loads at https://www.adhub.tech/dashboard
2. Organizations are visible
3. No more infinite loading

## Next Steps
Once the database is set up, your app should work normally. The debug component will show that organizations are loading successfully. 