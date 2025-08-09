# Blightstone CRM

An internal project management and CRM tool for tracking tasks, creative campaigns, customer personas, and competitor analysis.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Supabase account
- Vercel account (for deployment)

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/limhairai/blightstone.git
   cd blightstone
   cd frontend && npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Run the setup script
   ./dev-scripts/setup-environment.sh
   
   # Or manually create frontend/.env.local with:
   # NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  
   # SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   # SUPABASE_JWT_SECRET=your_jwt_secret
   ```

3. **Set up database:**
   - Run the SQL in `docs/database-setup.sql` in your Supabase SQL Editor
   - This creates all necessary tables (projects, tasks, personas, competitors, creatives)

4. **Start development server:**
   ```bash
   ./dev-scripts/start-dev.sh
   # or
   cd frontend && npm run dev
   ```

Visit `http://localhost:3000` to access the application.

## 🏗️ Architecture

- **Frontend:** Next.js 14 with TypeScript, Tailwind CSS, and Radix UI
- **Backend:** Next.js API Routes (serverless functions)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Deployment:** Vercel
- **Testing:** Playwright for E2E tests

## 📁 Project Structure

```
├── frontend/           # Next.js application
│   ├── src/
│   │   ├── app/        # App router pages and API routes
│   │   ├── components/ # Reusable UI components
│   │   └── lib/        # Utilities and stores
├── supabase/           # Database migrations and config
├── docs/               # Documentation and database setup
├── dev-scripts/        # Development and setup scripts
├── archive/            # Archived files and old assets
├── playwright/         # E2E test files
└── .github/            # GitHub workflows
```

## 🧪 Testing

```bash
# Run E2E tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Test against production
npm run test:e2e:production
```

## 🚀 Deployment

The application is automatically deployed to Vercel on push to `main` branch.

**Production URL:** https://blightstone.vercel.app

## 📚 Features

- **Project Management:** Create and manage multiple projects
- **Task Tracking:** Assign tasks with priorities, due dates, and status
- **Creative Tracker:** Track ad campaigns and creative performance
- **Personas:** Manage customer avatars and target audience profiles  
- **Competitor Analysis:** Track competitor strategies and positioning
- **Team Collaboration:** Multi-user support with attribution

## 🛠️ Development Scripts

See `dev-scripts/README.md` for available development scripts.

## 📄 License

Internal use only.