# 🚀 Staging Deployment Guide

## Overview
This guide will help you deploy your current demo to staging.adhub.tech while continuing development on the main branch.

## Step 1: Create Staging Telegram Bot

### 1.1 Create New Bot with BotFather
1. Message @BotFather on Telegram
2. Use `/newbot` command
3. Name: `AdHub Staging Bot`
4. Username: `adhub_staging_bot` (or similar)
5. Save the bot token for later

### 1.2 Configure Bot
```bash
/setdescription
AdHub Staging Bot - For testing and demo purposes

/setabouttext
AdHub staging environment for partner demos and testing
```

## Step 2: Deploy to Render

### 2.1 Create New Render Services
1. Go to Render Dashboard
2. Create new service from Git repo
3. Use `render-staging.yaml` configuration
4. Deploy all three services:
   - `adhub-backend-staging`
   - `adhub-frontend-staging`
   - `adhub-telegram-bot-staging`

### 2.2 Configure Environment Variables
Set these in Render dashboard for each service:

#### Backend & Bot Services:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
DOLPHIN_CLOUD_TOKEN=your_dolphin_token
```

#### Bot Service Only:
```
TELEGRAM_BOT_TOKEN=staging_bot_token_from_step_1
ADMIN_USER_IDS=7723014090
```

#### Frontend Service:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Step 3: Configure Domain

### 3.1 Add Custom Domain
1. In Render dashboard, go to frontend service
2. Add custom domain: `staging.adhub.tech`
3. Configure DNS in your domain provider:
   ```
   CNAME staging.adhub.tech -> your-frontend-service.onrender.com
   ```

## Step 4: Test Staging Environment

### 4.1 Verify Services
- [ ] Backend: `https://adhub-backend-staging.onrender.com/health`
- [ ] Frontend: `https://staging.adhub.tech`
- [ ] Bot: Message your staging bot

### 4.2 Test Bot Commands
1. Link existing user: `/link blightstone@pm.me`
2. Test admin commands: `/admin_list_clients`
3. Verify functionality matches production

## Step 5: Update Production for Development

Now you can safely modify your main codebase for real logic development while keeping the demo alive on staging.

## Environment Separation

| Environment | Purpose | URL | Bot |
|------------|---------|-----|-----|
| **Staging** | Partner demos, testing current version | staging.adhub.tech | @adhub_staging_bot |
| **Production** | Development, real logic implementation | adhub.tech | @your_main_bot |

## Next Steps

Once staging is deployed:
1. ✅ Preserve current demo for partners
2. 🔧 Develop real backend logic on main branch
3. 🧪 Test with Telegram bot to identify missing pieces
4. 🚀 Deploy completed version to production
5. 💳 Integrate payment processors

## Rollback Plan

If anything goes wrong:
1. Staging preserves your working demo
2. Git history allows rollback to any point
3. Can quickly redeploy from any commit

---

**Ready to deploy?** Follow the steps above and your demo will be safely preserved while you build the real logic! 🎯 