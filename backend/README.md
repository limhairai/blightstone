# AdHub Backend API

A FastAPI-based backend service for AdHub, providing authentication, organization management, and ad account integration.

## 🏗️ Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── requirements-dev.txt    # Development dependencies
├── Procfile               # Deployment configuration
│
├── api/                   # API layer
│   ├── api.py            # Main API router configuration
│   ├── deps/             # API dependencies (auth, database, etc.)
│   └── endpoints/        # API endpoint handlers
│       ├── auth.py       # Authentication endpoints
│       ├── organizations.py # Organization management
│       ├── ad_accounts.py   # Ad account management
│       ├── wallet.py     # Wallet and transactions
│       ├── users.py      # User management
│       ├── invites.py    # Team invitations
│       ├── projects.py   # Project management
│       ├── admin.py      # Admin operations
│       └── twofa.py      # Two-factor authentication
│
├── core/                 # Core application logic
│   ├── config.py        # Configuration settings
│   ├── supabase_client.py # Supabase database client
│   └── security.py      # Security utilities
│
├── models/              # Data models and schemas
├── services/            # Business logic services
├── schemas/             # Pydantic schemas for API
├── utils/               # Utility functions
├── tasks/               # Background tasks
├── db/                  # Database utilities
│
├── tests/               # Test files
└── docs/                # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Supabase account and project
- Environment variables configured

### Installation

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Run the development server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## 🔧 Configuration

The backend uses Supabase as the primary database. Configure these environment variables:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
```

## 📚 API Documentation

Once running, visit:
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🏢 Core Features

### Authentication & Authorization
- JWT-based authentication via Supabase Auth
- Role-based access control (Owner, Admin, Member)
- Two-factor authentication support

### Organization Management
- Multi-tenant organization structure
- Team member invitations and management
- Subscription and billing integration

### Ad Account Integration
- Meta (Facebook) Ads API integration
- Ad account management and monitoring
- Campaign performance tracking

### Wallet System
- Organization wallet management
- Transaction tracking and history
- Balance management

## 🧪 Testing

Run tests with:
```bash
pytest
```

## 🚀 Deployment

The backend is configured for deployment on platforms like Heroku, Railway, or similar:

```bash
# Using the Procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

## 📝 Development Notes

- **Database**: Uses Supabase PostgreSQL with Row Level Security
- **Authentication**: Supabase Auth with JWT tokens
- **API Framework**: FastAPI with automatic OpenAPI documentation
- **Code Style**: Follow PEP 8 guidelines
- **Dependencies**: Keep requirements.txt updated

## 🔗 Related

- **Frontend**: React/Next.js application in `/frontend`
- **Database**: Supabase migrations in `/supabase/migrations`
- **Documentation**: Additional docs in `/docs` 