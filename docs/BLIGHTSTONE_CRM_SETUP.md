# Blightstone CRM - Setup Guide

This codebase has been repurposed as **Blightstone**, your internal CRM tool.

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Make the setup script executable and run it
chmod +x setup-environment.sh
./setup-environment.sh
```

### 2. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend (if using Python backend)
cd ../backend
pip install -r requirements/dev.txt
```

### 3. Database Setup
```bash
# Using Supabase
cd ../supabase
supabase db reset
```

### 4. Start Development Servers
```bash
# Frontend (in frontend/ directory)
npm run dev

# Backend (in backend/ directory)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🔧 Configuration

### Supabase Configuration
- **URL**: `https://vddtsunsahhccmtamdcg.supabase.co`
- **Anon Key**: Already configured in environment files
- **Service Role Key**: Already configured in environment files
- **Dashboard**: [https://supabase.com/dashboard/project/vddtsunsahhccmtamdcg](https://supabase.com/dashboard/project/vddtsunsahhccmtamdcg)

### Environment Files Created
- `frontend/.env.local` - Frontend environment variables
- `backend/.env` - Backend environment variables

## 📁 Project Structure
- `frontend/` - Next.js React frontend
- `backend/` - FastAPI Python backend
- `supabase/` - Database migrations and configuration
- `docs/` - Documentation
- `tests/` - Test suites

## 🔗 Repository
- **GitHub**: [https://github.com/limhairai/blightstone](https://github.com/limhairai/blightstone)

## 📋 Next Steps
1. Customize the CRM features for your specific needs
2. Update branding and UI components
3. Configure additional integrations as needed
4. Set up CI/CD pipelines for deployment

## 🆘 Troubleshooting
- Ensure all environment variables are set correctly
- Check that Supabase is accessible
- Verify database migrations are applied
- Check console for any configuration errors