from typing import Any, Callable, Optional
from functools import wraps
import time
from backend.app.core.config import settings

class Cache:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._ttl: Dict[str, float] = {}

    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache."""
        if key in self._cache and key in self._ttl:
            if time.time() < self._ttl[key]:
                return self._cache[key]
            else:
                # Cache expired
                del self._cache[key]
                del self._ttl[key]
        return None

    def set(self, key: str, value: Any, ttl: int = 300) -> None:
        """Set a value in the cache with a TTL in seconds."""
        self._cache[key] = value
        self._ttl[key] = time.time() + ttl

    def delete(self, key: str) -> None:
        """Delete a value from the cache."""
        if key in self._cache:
            del self._cache[key]
        if key in self._ttl:
            del self._ttl[key]

    def clear(self) -> None:
        """Clear the entire cache."""
        self._cache.clear()
        self._ttl.clear()

cache = Cache()

def cached(ttl: int = 300):
    """Decorator for caching function results."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Call the function and cache the result
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            return result
        return wrapper
    return decorator 