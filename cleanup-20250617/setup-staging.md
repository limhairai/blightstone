# Setting Up Staging Environment

## 🎯 Goal
Set up `staging.adhub.tech` with your Supabase staging database.

## 📋 Steps

### 1. Apply Database Schema to Staging

You have two options:

#### Option A: Using Supabase CLI (Recommended)
```bash
# Login to Supabase (this will open a browser)
supabase login

# Link to your staging project
supabase link --project-ref xewhfrwuzkfbnpwtdxuf

# Push all migrations to staging
supabase db push

# Run seed data
supabase db seed
```

#### Option B: Manual SQL Execution
1. Go to your Supabase staging dashboard: https://supabase.com/dashboard/project/xewhfrwuzkfbnpwtdxuf
2. Navigate to SQL Editor
3. Run each migration file in order:
   - `supabase/migrations/20250604205006_initial_schema.sql`
   - `supabase/migrations/20250604211948_enhance_projects_add_ad_accounts.sql`
   - `supabase/migrations/20250604212918_add_plans_and_subscription_details.sql`
   - `supabase/migrations/20250605145704_add_profile_org_fields.sql`
   - `supabase/migrations/20250605150000_optimize_rls_policies.sql`
   - `supabase/migrations/20250606000000_migrate_projects_to_businesses.sql`
   - `supabase/migrations/20250607000000_fix_rls_policy_conflicts.sql`
   - `supabase/migrations/20250607083421_add_business_columns.sql`
   - `supabase/migrations/20250608000000_add_production_features.sql`
4. Run the seed data: `supabase/seed.sql`

### 2. Create Demo User for Staging

Run this in Supabase SQL Editor or via API:

```sql
-- Create demo user (you'll need to do this via Supabase Auth API or dashboard)
-- Email: demo@adhub.com
-- Password: demo123

-- Then run the seed script to create organization and wallet
```

### 3. Set up Vercel Staging Deployment

#### Create staging.adhub.tech subdomain:

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Add custom domain: `staging.adhub.tech`
   - Point it to your staging branch

2. **In your DNS provider (where adhub.tech is hosted):**
   - Add CNAME record: `staging.adhub.tech` → `cname.vercel-dns.com`

3. **Environment Variables for Staging:**
   ```
   NODE_ENV=staging
   NEXT_PUBLIC_ENVIRONMENT=staging
   NEXT_PUBLIC_SUPABASE_URL=https://xewhfrwuzkfbnpwtdxuf.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld2hmcnd1emtmYm5wd3RkeHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjA3NDAsImV4cCI6MjA2NDYzNjc0MH0.uiDOEgNu2sbG9ZinYDBDfew2eXw_gIItZL9CuV7k_TE
   ```

### 4. Test Staging Environment

1. Visit `https://staging.adhub.tech`
2. Login with demo credentials:
   - Email: `demo@adhub.com`
   - Password: `demo123`
3. Verify all features work

## 🔧 Quick Setup Script

If you want to use the CLI approach, run:

```bash
# From project root
./scripts/setup-staging.sh
```

## ✅ Verification Checklist

- [ ] Database schema applied to staging
- [ ] Seed data loaded
- [ ] Demo user created
- [ ] staging.adhub.tech domain configured
- [ ] Vercel deployment working
- [ ] Login functionality working
- [ ] All features accessible

## 🚨 Troubleshooting

### Common Issues:

1. **Migration errors**: Check if tables already exist
2. **Auth errors**: Verify Supabase keys are correct
3. **Domain not working**: Check DNS propagation (can take up to 24 hours)
4. **Login fails**: Ensure demo user exists in staging database

### Useful Commands:

```bash
# Check Supabase connection
supabase status

# Reset staging database (if needed)
supabase db reset --linked

# Check migration status
supabase migration list --linked
``` 