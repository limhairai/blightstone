# AdHub Proxy Configuration Guide

## Overview

Your AdHub project uses a Next.js API proxy to route frontend requests to the FastAPI backend. This setup allows the frontend to communicate with the backend while handling CORS issues and providing a unified API endpoint.

## Architecture

```
Frontend (Next.js) → Proxy (/api/proxy/*) → Backend (FastAPI)
http://localhost:3000   →   /api/proxy/v1/*   →   http://localhost:8000/api/v1/*
```

## Configuration Status ✅

### Frontend Configuration
- **Proxy Handler**: `frontend/src/pages/api/proxy/[...path].ts`
- **Test Endpoint**: `frontend/src/pages/api/proxy/test.ts`
- **Environment Variables**:
  - `BACKEND_API_URL=http://localhost:8000` (development)
  - `NEXT_PUBLIC_API_URL=http://localhost:3000/api/proxy`

### Backend Configuration
- **CORS Setup**: Configured in `backend/app/main.py`
- **Environment Variables**:
  - `CORS_ORIGINS_STRING=http://localhost:3000,http://127.0.0.1:3000`
  - `API_URL=http://localhost:8000`

## How It Works

1. **Frontend Request**: Your React components make requests to `/api/proxy/v1/endpoint`
2. **Proxy Routing**: Next.js proxy rewrites the URL from `/api/proxy/*` to `/api/*`
3. **Backend Forward**: Request is forwarded to `http://localhost:8000/api/*`
4. **Response**: Backend response is returned through the proxy to the frontend

## Environment Configuration

### Development
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Proxy Target: `http://localhost:8000`

### Staging
- Frontend: `https://your-staging-frontend.com`
- Backend: `https://your-staging-backend.com`
- Proxy Target: `https://your-staging-backend.com`

### Production
- Frontend: `https://your-production-frontend.com`
- Backend: `https://your-production-backend.com`
- Proxy Target: `https://your-production-backend.com`

## Testing Your Proxy Setup

### Quick Test
```bash
./test-proxy.sh
```

### Comprehensive Test
```bash
cd backend
source venv/bin/activate
python check_proxy.py
```

### Start Both Servers
```bash
./start-dev-servers.sh
```

## Manual Testing

### 1. Start Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test Endpoints

**Direct Backend Access:**
```bash
curl http://localhost:8000/docs
curl http://localhost:8000/api/v1/health
```

**Through Proxy:**
```bash
curl http://localhost:3000/api/proxy/test
curl http://localhost:3000/api/proxy/v1/health
```

## Common Issues & Solutions

### 1. CORS Errors
**Problem**: Frontend can't access backend due to CORS
**Solution**: Ensure `CORS_ORIGINS_STRING` includes your frontend URL

### 2. Proxy 502 Errors
**Problem**: Proxy returns "Bad Gateway"
**Solution**: Check if backend server is running on correct port

### 3. Environment Variables Not Loading
**Problem**: Proxy uses wrong backend URL
**Solution**: Restart Next.js dev server after changing `.env.local`

### 4. Authorization Headers Not Forwarded
**Problem**: Backend doesn't receive auth tokens
**Solution**: Proxy automatically forwards `Authorization` headers

## Code Examples

### Frontend API Call
```typescript
// In your React components
const response = await fetch('/api/proxy/v1/profile', {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json'
  }
});
```

### Backend Endpoint
```python
# In your FastAPI backend
@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user
```

## Files Modified

### Frontend
- `frontend/.env.local` - Added `BACKEND_API_URL`
- `frontend/.env.development` - Added proxy configuration
- `frontend/.env.staging` - Added staging URLs
- `frontend/.env.production` - Added production URLs

### Backend
- `backend/.env` - Added `CORS_ORIGINS_STRING` and `API_URL`
- `backend/.env.development` - Added development configuration
- `backend/.env.staging` - Added staging configuration
- `backend/.env.production` - Added production configuration

### Scripts Created
- `check_proxy.py` - Comprehensive proxy testing
- `start-dev-servers.sh` - Start both servers
- `test-proxy.sh` - Quick proxy test

## Next Steps

1. **Start Development**: Use `./start-dev-servers.sh` to begin development
2. **Update URLs**: Replace placeholder URLs in staging/production env files
3. **Test Thoroughly**: Run proxy tests before deploying
4. **Monitor Logs**: Check both frontend and backend logs for proxy issues

## Troubleshooting

If you encounter issues:

1. Check if both servers are running
2. Verify environment variables are loaded
3. Check browser network tab for failed requests
4. Review server logs for error messages
5. Run the comprehensive proxy checker

Your proxy setup is now properly configured and ready for development! 🚀 