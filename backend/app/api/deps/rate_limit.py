from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.config import settings
import time
from typing import Dict, Tuple
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self):
        self.requests: Dict[str, Dict[str, Tuple[int, float]]] = {}
        self.window_size = 60  # 1 minute window
        self.max_requests = settings.RATE_LIMIT_PER_MINUTE

    async def __call__(self, request: Request):
        client_ip = request.client.host
        current_time = time.time()
        
        if client_ip not in self.requests:
            self.requests[client_ip] = {}
        
        # Clean up old requests
        self._cleanup_old_requests(client_ip, current_time)
        
        # Check rate limit
        if len(self.requests[client_ip]) >= self.max_requests:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later."
            )
        
        # Add new request
        self.requests[client_ip][current_time] = (1, current_time)

    def _cleanup_old_requests(self, client_ip: str, current_time: float):
        """Remove requests older than the window size."""
        window_start = current_time - self.window_size
        self.requests[client_ip] = {
            timestamp: count
            for timestamp, (count, _) in self.requests[client_ip].items()
            if timestamp >= window_start
        }

rate_limiter = RateLimiter() 