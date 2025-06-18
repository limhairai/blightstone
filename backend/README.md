# ⚙️ AdHub Backend

FastAPI-based backend service for the AdHub advertising management platform.

## 📁 **Project Structure**

```
backend/
├── app/                     # Main application package
│   ├── __init__.py         # App package initialization
│   ├── main.py             # FastAPI application entry point
│   ├── api/                # API routes and endpoints
│   ├── core/               # Core functionality and utilities
│   ├── models/             # Data models and database schemas
│   ├── services/           # Business logic services
│   ├── db/                 # Database configuration and utilities
│   └── schemas/            # Pydantic schemas for API validation
├── tests/                  # Test suite
├── docs/                   # Backend-specific documentation
├── scripts/                # Backend utility scripts
├── requirements/           # Organized requirements files
│   ├── base.txt           # Base dependencies
│   ├── dev.txt            # Development dependencies
│   └── prod.txt           # Production dependencies
├── config/                 # Configuration files
├── Dockerfile             # Docker configuration
├── Procfile              # Deployment configuration
└── README.md             # This file
```

## 🚀 **Quick Start**

### **Development Setup:**

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements/dev.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Run development server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### **Production Setup:**

1. **Install production dependencies:**
   ```bash
   pip install -r requirements/prod.txt
   ```

2. **Run production server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

## 📋 **Requirements Management**

### **Base Requirements** (`requirements/base.txt`)
Core dependencies used across all environments:
- FastAPI, Uvicorn, Starlette
- Authentication & Security (JWT, bcrypt, etc.)
- Database & Supabase integration
- Data validation (Pydantic)

### **Development Requirements** (`requirements/dev.txt`)
Extends base with development tools:
- Testing framework (pytest)
- Code quality tools (black, isort, flake8, mypy)
- Development HTTP client (httpx)
- Additional integrations for testing

### **Production Requirements** (`requirements/prod.txt`)
Extends base with production-specific dependencies:
- Production integrations
- Monitoring and logging tools (when added)

## 🏗️ **Application Architecture**

### **API Layer** (`app/api/`)
- RESTful API endpoints
- Request/response handling
- Authentication middleware
- Error handling

### **Core Layer** (`app/core/`)
- Application configuration
- Security utilities
- Common utilities and helpers
- Dependency injection

### **Services Layer** (`app/services/`)
- Business logic implementation
- External service integrations
- Data processing logic
- Background tasks

### **Models Layer** (`app/models/`)
- Database models (SQLAlchemy)
- Data relationships
- Model utilities

### **Schemas Layer** (`app/schemas/`)
- Pydantic models for API validation
- Request/response schemas
- Data transfer objects

### **Database Layer** (`app/db/`)
- Database connection and session management
- Migration utilities
- Database utilities

## 🧪 **Testing**

### **Run Tests:**
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_api.py

# Run tests in parallel
pytest -n auto
```

### **Test Structure:**
```
tests/
├── conftest.py           # Test configuration
├── test_api/            # API endpoint tests
├── test_services/       # Service layer tests
├── test_models/         # Model tests
└── test_core/          # Core functionality tests
```

## 🚀 **Deployment**

### **Render.com:**
Uses `Procfile` for deployment configuration:
```
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT --forwarded-allow-ips '*'
```

### **Docker:**
```bash
# Build image
docker build -t adhub-backend .

# Run container
docker run -p 8000:8000 adhub-backend
```

### **Environment Variables:**
Required environment variables (see `env.example`):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase service key
- `JWT_SECRET_KEY` - JWT signing secret
- `ENVIRONMENT` - Environment (dev/staging/prod)

## 📊 **API Documentation**

### **Interactive Documentation:**
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### **Main Endpoints:**
- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/users/*` - User management
- `/api/v1/businesses/*` - Business management
- `/api/v1/ad-accounts/*` - Ad account management
- `/api/v1/admin/*` - Admin panel endpoints

## 🔧 **Development Tools**

### **Code Quality:**
```bash
# Format code
black app/ tests/

# Sort imports
isort app/ tests/

# Lint code
flake8 app/ tests/

# Type checking
mypy app/
```

### **Pre-commit Hooks:**
```bash
# Install pre-commit hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

## 📁 **Configuration**

### **Environment Files:**
- `env.example` - Environment variable template
- `.env` - Local environment variables (not in git)

### **Configuration Classes:**
Located in `app/core/config.py`:
- `Settings` - Main application settings
- `DatabaseSettings` - Database configuration
- `SecuritySettings` - Security configuration

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **Import errors after restructure:**
   - Update import paths to use `app.` prefix
   - Check `__init__.py` files exist

2. **Database connection issues:**
   - Verify Supabase credentials in `.env`
   - Check network connectivity

3. **Dependency conflicts:**
   - Use appropriate requirements file for your environment
   - Consider using virtual environment

### **Getting Help:**
- Check API documentation at `/docs`
- Review test files for usage examples
- Check configuration in `app/core/config.py`

---

*Backend reorganized for better maintainability and scalability.* 