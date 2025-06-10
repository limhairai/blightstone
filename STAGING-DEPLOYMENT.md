# 🚀 Staging Deployment Guide

## Quick Setup

### 1. Database Setup (Choose one option)

#### Option A: Automated Script
```bash
# Login to Supabase first (opens browser)
supabase login

# Run the setup script
./scripts/setup-staging.sh
```

#### Option B: Manual Setup
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/xewhfrwuzkfbnpwtdxuf)
2. Navigate to SQL Editor
3. Copy and paste each migration file from `supabase/migrations/` in order
4. Run the seed data from `supabase/seed.sql`

### 2. Create Demo User

You'll need your Supabase service key from the staging project settings:

```bash
cd frontend
SUPABASE_SERVICE_KEY=your_staging_service_key node /tmp/create_staging_user.js
```

### 3. Vercel Deployment

#### A. Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import your GitHub repository
3. Choose the `frontend` folder as root directory

#### B. Configure Domain
1. In project settings, add custom domain: `staging.adhub.tech`
2. In your DNS provider, add CNAME record:
   ```
   staging.adhub.tech → cname.vercel-dns.com
   ```

#### C. Environment Variables
Add these in Vercel project settings:

```env
NODE_ENV=staging
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_SUPABASE_URL=https://xewhfrwuzkfbnpwtdxuf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld2hmcnd1emtmYm5wd3RkeHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjA3NDAsImV4cCI6MjA2NDYzNjc0MH0.uiDOEgNu2sbG9ZinYDBDfew2eXw_gIItZL9CuV7k_TE
```

#### D. Deploy
1. Push your code to GitHub
2. Vercel will automatically deploy
3. Visit `https://staging.adhub.tech`

### 4. Test Login

- **URL**: https://staging.adhub.tech
- **Email**: demo@adhub.com
- **Password**: demo123

## 🔧 Troubleshooting

### Common Issues:

1. **"User not found"** → Run the demo user creation script
2. **"Database connection failed"** → Check Supabase keys
3. **"Domain not working"** → Wait for DNS propagation (up to 24 hours)
4. **Build errors** → Check environment variables are set correctly

### Useful Commands:

```bash
# Check Supabase status
supabase status

# Test local build
cd frontend && npm run build

# Check migration status
supabase migration list --linked
```

## ✅ Success Checklist

- [ ] Database migrations applied
- [ ] Demo user created
- [ ] Vercel project configured
- [ ] Domain pointing to Vercel
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Login working
- [ ] All features accessible

---

**Need help?** Check the detailed guide in `scripts/setup-staging.md` 