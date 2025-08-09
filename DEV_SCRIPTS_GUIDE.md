# 🚀 Blightstone CRM - Development Scripts Guide

Quick reference for starting your development environment, just like your previous AdHub setup.

## 🎯 Quick Start Commands

### **Start Both Frontend & Backend**
```bash
# Main development script (recommended)
./start-dev.sh

# Alternative (from scripts directory)
./scripts/dev/start-dev-servers.sh
```

### **Start Individual Services**
```bash
# Frontend only (port 3000)
./start-frontend.sh

# Backend only (port 8000)
./start-backend.sh
```

## 🌐 Development URLs

Once started, your services will be available at:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:8000](http://localhost:8000)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Supabase Dashboard**: [https://supabase.com/dashboard/project/vddtsunsahhccmtamdcg](https://supabase.com/dashboard/project/vddtsunsahhccmtamdcg)

## 📋 Prerequisites

Before running the development scripts:

1. **Environment Setup**:
   ```bash
   ./setup-environment.sh
   ```

2. **Install Dependencies**:
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend (optional - auto-installed by scripts)
   cd backend && pip install -r requirements/dev.txt
   ```

## 🔧 Script Features

- **Auto-dependency installation** - Scripts check and install missing dependencies
- **Environment validation** - Ensures all required files exist
- **Graceful shutdown** - Press Ctrl+C to stop all servers cleanly
- **Auto-reload** - Both frontend and backend reload on file changes
- **Error handling** - Clear error messages with helpful suggestions

## 🛑 Stopping Servers

- Press **Ctrl+C** in the terminal running the script
- All servers will shut down gracefully
- No manual cleanup required

## 📚 Additional Scripts

Located in `scripts/dev/`:
- `start-development-servers.sh` - Alternative development startup
- `check_env.py` - Validate environment configuration
- `switch-environment.sh` - Switch between different environments

## 🔍 Troubleshooting

**Environment files missing?**
```bash
./setup-environment.sh
```

**Dependencies not installed?**
```bash
cd frontend && npm install
cd ../backend && pip install -r requirements/dev.txt
```

**Ports already in use?**
- Stop other applications using ports 3000 or 8000
- Or modify the port numbers in the scripts

## 💡 Tips

- Keep the terminal window open to see live logs
- Frontend changes reload instantly
- Backend changes reload automatically with uvicorn
- Check the API docs at http://localhost:8000/docs for backend endpoints