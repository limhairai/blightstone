# AdHub

A comprehensive ad account management platform built with Next.js, React, and Supabase.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development servers
./start-dev-servers.sh

# Or start individually:
# Frontend: cd frontend && npm run dev
# Backend: cd backend && python -m uvicorn main:app --reload
```

## 📁 Project Structure

```
adhub/
├── frontend/          # Next.js React application
├── backend/           # FastAPI Python backend
├── supabase/          # Database migrations and config
├── docs/              # 📚 All project documentation
├── scripts/           # Utility scripts
└── tests/             # Test suites
```

## 📚 Documentation

All project documentation has been organized in the `/docs` folder:

- **[📖 Documentation Overview](./docs/README.md)** - Start here for navigation
- **[🛠️ Guides](./docs/guides/)** - Step-by-step tutorials and how-tos
- **[📊 Summaries](./docs/summaries/)** - Implementation progress and overviews
- **[🚀 Deployment](./docs/deployment/)** - Production setup and infrastructure
- **[📤 Exports](./docs/exports/)** - Component exports for design tools

### Quick Links
- [Functional Implementation Summary](./docs/summaries/FUNCTIONAL_IMPLEMENTATION_SUMMARY.md)
- [Deployment Guide](./docs/deployment/DEPLOYMENT_GUIDE.md)
- [UX Redesign Guide](./docs/guides/BUSINESS_AD_ACCOUNT_UX_REDESIGN.md)

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI with Python 3.12+
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (Frontend) + Railway/Render (Backend)

## 🔧 Development

### Prerequisites
- Node.js 18+
- Python 3.12+
- Supabase CLI (optional)

### Environment Setup
```bash
# Copy environment files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Configure your environment variables
# See deployment guide for details
```

## 🤝 Contributing

1. Check the [documentation](./docs/README.md) for project overview
2. Follow the [guides](./docs/guides/) for implementation patterns
3. Keep documentation updated when adding features
4. All new markdown files should go in the appropriate `/docs` subfolder

## 📄 License

This project is proprietary software. All rights reserved. 