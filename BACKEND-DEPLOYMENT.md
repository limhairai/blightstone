# Backend Deployment Guide

## 🚀 Deploy to Render

### Option 1: Automatic Deployment (Recommended)
1. **Connect Repository:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository: `limhairai/adhub`
   - Select the `backend/render.yaml` file

2. **This will create TWO services automatically:**
   - `adhub-backend-staging` (staging environment)
   - `adhub-backend-prod` (production environment)

### Option 2: Manual Deployment
1. **Create Staging Service:**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect GitHub repo: `limhairai/adhub`
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT --forwarded-allow-ips '*'`

2. **Environment Variables (Staging):**
   ```
   ENVIRONMENT=staging
   SUPABASE_URL=https://xewhfrwuzkfbnpwtdxuf.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld2hmcnd1emtmYm5wd3RkeHVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA2MDc0MCwiZXhwIjoyMDY0NjM2NzQwfQ.uiDOEgNu2sbG9ZinYDBDfew2eXw_gIItZL9CuV7k_TE
   JWT_SECRET_KEY=your-secret-key-here
   CORS_ORIGINS=https://staging.adhub.tech
   ```

3. **Repeat for Production** with production Supabase credentials

## 🔗 Expected URLs
- **Staging:** `https://adhub-backend-staging.onrender.com`
- **Production:** `https://adhub-backend-prod.onrender.com`

## 🧪 Test Deployment
Once deployed, test the health endpoint:
```bash
curl https://adhub-backend-staging.onrender.com/health
```

Should return:
```json
{"status": "healthy", "environment": "staging"}
```

## 🔄 Auto-Deploy Setup
- **Staging:** Auto-deploys from `staging` branch
- **Production:** Auto-deploys from `main` branch

## 📋 Post-Deployment
1. Update frontend API URLs to point to deployed backend
2. Test authentication flow
3. Verify database connections
4. Check CORS settings 