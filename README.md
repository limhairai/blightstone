# 🎯 Blightstone CRM

A clean, modern internal CRM system for project management, customer personas, competitor analysis, and creative tracking.

## ✨ Features

- **📋 Project Management** - Organize work by projects with dedicated dashboards
- **✅ Task Management** - Full task tracking with notes, attachments, and links
- **👥 Customer Personas** - Track customer avatars with awareness stages
- **🔍 Competitor Analysis** - Monitor competitors with ads library integration
- **🎨 Creative Tracking** - Manage creative campaigns with Google Drive links
- **🔐 Secure & Isolated** - Each user sees only their own data

## 🚀 Quick Start

1. **Clone & Install:**
   ```bash
   git clone https://github.com/limhairai/blightstone.git
   cd blightstone/frontend
   npm install
   ```

2. **Database Setup:**
   - Run the SQL in `database-setup.sql` in your Supabase dashboard
   - Update `frontend/.env.local` with your Supabase credentials

3. **Start Development:**
   ```bash
   npm run dev
   ```

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **State Management:** Zustand
- **UI Components:** shadcn/ui

## 📁 Project Structure

```
frontend/src/
├── app/dashboard/
│   ├── tasks/           # Task management
│   ├── creative-tracker/ # Creative campaigns
│   ├── personas/        # Customer avatars
│   └── competitors/     # Competitor analysis
├── components/          # Reusable UI components
├── lib/stores/         # Zustand state management
└── lib/api.ts          # API client functions
```

## 🔗 Links

- **Production:** [Deployed on Vercel](https://github.com/limhairai/blightstone)
- **Database:** Supabase PostgreSQL
- **Repository:** [GitHub](https://github.com/limhairai/blightstone)

---

**Built for internal team use** • Clean codebase with no legacy business logic