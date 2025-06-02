# AdHub Backend

Enterprise-level backend service for the AdHub application, built with FastAPI and Firestore.

## Features

- RESTful API endpoints for managing ad accounts and campaigns
- JWT-based authentication with role-based access control
- Firestore database with optimized queries and indexes
- CORS support for frontend integration
- OpenAPI documentation
- Comprehensive logging and monitoring
- Rate limiting and security measures
- Background tasks and job queues
- Caching layer
- Health checks and metrics

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── deps/                    # API dependencies and middleware
│   │   │   ├── auth.py              # Authentication dependencies
│   │   │   ├── rate_limit.py        # Rate limiting middleware
│   │   │   └── security.py          # Security middleware
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py          # Authentication endpoints
│   │       │   ├── ad_accounts.py   # Ad account management
│   │       │   ├── campaigns.py     # Campaign management
│   │       │   └── health.py        # Health check endpoints
│   │       └── api.py               # API router configuration
│   ├── core/
│   │   ├── config.py                # Application configuration
│   │   ├── security.py              # Security utilities
│   │   ├── firebase.py              # Firebase configuration
│   │   └── logging.py               # Logging configuration
│   ├── models/
│   │   ├── user.py                  # User data models
│   │   ├── ad_account.py            # Ad account data models
│   │   └── campaign.py              # Campaign data models
│   ├── schemas/
│   │   ├── auth.py                  # Authentication schemas
│   │   ├── ad_account.py            # Ad account schemas
│   │   └── campaign.py              # Campaign schemas
│   ├── services/
│   │   ├── auth.py                  # Authentication service
│   │   ├── ad_account.py            # Ad account service
│   │   ├── campaign.py              # Campaign service
│   │   └── meta_api.py              # Meta API integration
│   ├── tasks/
│   │   ├── background.py            # Background task definitions
│   │   └── scheduler.py             # Scheduled task definitions
│   ├── utils/
│   │   ├── cache.py                 # Caching utilities
│   │   ├── date.py                  # Date/time utilities
│   │   └── validation.py            # Data validation utilities
│   └── main.py                      # Application entry point
├── tests/
│   ├── api/                         # API endpoint tests
│   ├── services/                    # Service layer tests
│   ├── utils/                       # Utility tests
│   └── conftest.py                  # Test configuration
├── scripts/
│   ├── setup.py                     # Setup scripts
│   └── deploy.py                    # Deployment scripts
├── docs/
│   ├── api/                         # API documentation
│   └── architecture/                # Architecture documentation
├── .env.example                     # Example environment variables
├── .gitignore                       # Git ignore file
├── requirements.txt                 # Production dependencies
├── requirements-dev.txt             # Development dependencies
└── README.md                        # Project documentation
```

## Key Architectural Decisions

1. **Separation of Concerns**
   - API layer handles HTTP requests and responses
   - Service layer contains business logic
   - Models define data structures
   - Schemas handle data validation

2. **Dependency Injection**
   - Clear dependency management
   - Easy testing and mocking
   - Flexible configuration

3. **Error Handling**
   - Centralized error handling
   - Custom exception types
   - Proper HTTP status codes

4. **Security**
   - JWT authentication
   - Role-based access control
   - Rate limiting
   - Input validation

5. **Performance**
   - Caching layer
   - Optimized database queries
   - Background tasks for heavy operations

6. **Monitoring**
   - Comprehensive logging
   - Health checks
   - Performance metrics

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt  # For development
```

3. Configure environment variables:
Copy `.env.example` to `.env` and fill in the values:
```
FIREBASE_ADMIN_CREDENTIALS={"type": "service_account", ...}
SECRET_KEY=your-secret-key-here
```

4. Run the application:
```bash
uvicorn app.main:app --reload
```

## Development Guidelines

1. **Code Style**
   - Follow PEP 8
   - Use type hints
   - Write docstrings
   - Keep functions small and focused

2. **Testing**
   - Write unit tests for all new features
   - Maintain high test coverage
   - Use pytest fixtures
   - Mock external services

3. **Documentation**
   - Update API documentation
   - Document architectural decisions
   - Keep README up to date
   - Add inline comments for complex logic

4. **Version Control**
   - Use feature branches
   - Write meaningful commit messages
   - Review code before merging
   - Keep commits atomic

5. **Deployment**
   - Use CI/CD pipelines
   - Automated testing
   - Environment-specific configurations
   - Monitoring and alerts

## API Documentation

Once the server is running, you can access the API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py
│   │       │   ├── ad_accounts.py
│   │       │   └── campaigns.py
│   │       └── api.py
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   ├── models/
│   │   ├── user.py
│   │   ├── ad_account.py
│   │   └── campaign.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── ad_account.py
│   │   └── campaign.py
│   └── main.py
├── requirements.txt
└── README.md
```

## Development

- Use `alembic` for database migrations
- Follow PEP 8 style guide
- Write tests for new features
- Update API documentation when adding new endpoints 