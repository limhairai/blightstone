# 🚀 AdHub Development Scripts Guide

## 📁 Available Scripts

### **Local Development** (Demo Data + Local Supabase)
```bash
./scripts/dev/start-dev-servers.sh
```
- **Environment**: LOCAL
- **Backend**: `backend/.env` (localhost:54321)
- **Frontend**: `frontend/.env.local` (demo data)
- **Supabase**: Automatically starts local Supabase
- **Use case**: Fast iteration, offline development

### **Development Environment** (Real Data + Remote Supabase)
```bash
./scripts/dev/start-development-servers.sh
```
- **Environment**: DEVELOPMENT  
- **Backend**: Switches to `backend/.env.development` (remote Supabase)
- **Frontend**: Uses development config (real data)
- **Use case**: Full testing, team collaboration, sandbox payments

### **Production Environment** (Live Data + Production Supabase)
```bash
./scripts/dev/start-production-servers.sh
```
- **Environment**: PRODUCTION
- **Backend**: Switches to `backend/.env.production` (production Supabase)
- **Frontend**: Production build (live data)
- **Use case**: Live deployment, real money transactions ⚠️

### **Environment Switcher**
```bash
./scripts/dev/switch-environment.sh [local|development|production]
```
- Switch between environments without restarting servers
- Automatically backs up configurations
- Production safety checks

## 🔍 Backend Environment Details

### **LOCAL (backend/.env)**
```bash
ENVIRONMENT=local
SUPABASE_URL=http://localhost:54321
DEBUG=true
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=local
```

### **DEVELOPMENT (backend/.env.development)**
```bash
ENVIRONMENT=development  
SUPABASE_URL=https://xewhfrwuzkfbnpwtdxuf.supabase.co
DEBUG=false
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development
```

### **PRODUCTION (backend/.env.production)**
```bash
ENVIRONMENT=production
SUPABASE_URL=CHANGE_TO_PRODUCTION_SUPABASE_URL
DEBUG=false
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
```

## 🌐 Frontend Environment Details

### **LOCAL (frontend/.env.local)**
```bash
ENVIRONMENT=local
NEXT_PUBLIC_USE_DEMO_DATA=true
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
```

### **DEVELOPMENT (frontend/.env.development)**
```bash
ENVIRONMENT=development
NEXT_PUBLIC_USE_DEMO_DATA=false
NEXT_PUBLIC_SUPABASE_URL=https://xewhfrwuzkfbnpwtdxuf.supabase.co
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
```

### **PRODUCTION (frontend/.env.production)**
```bash
ENVIRONMENT=production
NEXT_PUBLIC_USE_DEMO_DATA=false
NEXT_PUBLIC_SUPABASE_URL=CHANGE_TO_PRODUCTION_SUPABASE_URL
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
```

## 🔄 Usage Examples

### Start Local Development (NEW: Auto-starts Supabase!)
```bash
# No need to manually start Supabase anymore!
./scripts/dev/start-dev-servers.sh

# The script will:
# 1. Check if Supabase CLI is installed
# 2. Automatically start local Supabase if not running
# 3. Start backend and frontend servers
# 4. Show all relevant URLs
```

### Start Development Environment
```bash
# Start development servers (remote Supabase)
./scripts/dev/start-development-servers.sh
```

### Start Production Environment
```bash
# ⚠️ WARNING: Uses live data and real money!
./scripts/dev/start-production-servers.sh
```

### Switch Environments
```bash
# Switch to local
./scripts/dev/switch-environment.sh local

# Switch to development
./scripts/dev/switch-environment.sh development

# Switch to production (with safety checks)
./scripts/dev/switch-environment.sh production
```

## 🎯 When to Use Each Environment

| Environment | Use Case | Data | Performance | Supabase | Safety |
|-------------|----------|------|-------------|----------|--------|
| **Local** | Quick iteration, UI work, offline | Demo/Mock | ⚡ Fast | 🏠 Local | ✅ Safe |
| **Development** | Feature testing, API testing, demos | Real Supabase | 🔄 Realistic | ☁️ Remote | ✅ Test Mode |
| **Production** | Live deployment | Live data | 🚀 Optimized | ☁️ Production | ⚠️ **LIVE MONEY** |

## 🗄️ Supabase Integration

### **Local Development Features**
- ✅ **Auto-start**: Automatically starts `supabase start`
- ✅ **Health Check**: Verifies Supabase is running
- ✅ **Graceful Cleanup**: Asks if you want to stop Supabase on exit
- ✅ **Fallback**: Uses demo data if Supabase fails to start
- ✅ **Studio Access**: Provides Supabase Studio URL

### **Supabase Requirements**
```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Initialize Supabase (if not already done)
supabase init

# The script handles the rest automatically!
```

### **Manual Supabase Commands** (if needed)
```bash
# Start Supabase manually
supabase start

# Stop Supabase manually  
supabase stop

# Check status
supabase status

# Reset database
supabase db reset
```

## 🚨 Production Safety Features

### **Built-in Safety Checks:**
- ✅ Confirmation prompt before starting production
- ✅ Credential validation (no placeholder values)
- ✅ Automatic backup of current config
- ✅ Clear warnings about live money
- ✅ Production build process

### **Production Checklist:**
- [ ] Update all `CHANGE_THIS` values in `.env.production`
- [ ] Use strong secret keys (32+ characters)
- [ ] Verify Stripe live keys
- [ ] Confirm production Supabase URL
- [ ] Test in development first
- [ ] Enable monitoring and logging

## 💡 Tips

- **Local**: Great for UI development and quick iterations
- **Development**: Use for testing real data flows and payment integration
- **Production**: Only use when ready for live deployment
- **Backup**: Scripts automatically backup configurations
- **Switching**: Can switch environments without losing work
- **Security**: Never commit production credentials to git
- **Supabase**: Local development now fully automated!

## 🔧 Current Environment Files

```bash
backend/.env              # Current active config (local)
backend/.env.development  # Development config
backend/.env.production   # Production config
backend/.env.example      # Template file

frontend/.env.local       # Local development config
frontend/.env.development # Development config (optional)
frontend/.env.production  # Production config (optional)
```

## 🎉 New Local Development Flow

### **Before (Manual)**
```bash
# Old way - manual steps
supabase start
./scripts/dev/start-dev-servers.sh
# Remember to stop Supabase later
```

### **After (Automated)**
```bash
# New way - fully automated!
./scripts/dev/start-dev-servers.sh
# Everything is handled automatically!
```

Your development workflow is now fully streamlined with automatic Supabase management! 🎉

⚠️ **Remember**: Production environment uses real money and live data!
