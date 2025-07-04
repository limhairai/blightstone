"""Supabase client initialization."""
import os
import jwt
import logging
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

supabase_client: Client | None = None
supabase_anon_client: Client | None = None

def get_supabase_client() -> Client:
    """
    Initializes and returns the Supabase client with service role key.
    Uses the SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from settings.
    """
    global supabase_client
    if supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.")
        supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return supabase_client

def get_supabase_anon_client() -> Client:
    """
    Initializes and returns the Supabase client with anon key for JWT verification.
    """
    global supabase_anon_client
    if supabase_anon_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment variables.")
        supabase_anon_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    return supabase_anon_client

def get_current_user_data_from_token(token: str) -> dict | None:
    """
    Validates a Supabase JWT and returns user data using multiple verification approaches.
    """
    try:
        logger.debug(f"[TOKEN_VALIDATION] Received token (first 20 chars): {token[:20]}...")
        # Remove "Bearer " prefix if present
        if token.lower().startswith("bearer "):
            token = token.split(" ", 1)[1]
        logger.debug(f"[TOKEN_VALIDATION] Token after bearer removal (first 20 chars): {token[:20]}...")
        
        # Method 1: Try with JWT secret if available (most reliable)
        if settings.SUPABASE_JWT_SECRET:
            try:
                decoded = jwt.decode(
                    token, 
                    settings.SUPABASE_JWT_SECRET, 
                    algorithms=['HS256'],
                    audience='authenticated'
                )
                logger.debug(f"JWT secret verification successful for user: {decoded.get('sub')}")
                return decoded
            except jwt.InvalidTokenError as e:
                logger.warning(f"JWT secret verification failed: {e}")
        
        # Method 2: Try with anon client (for client-side tokens)
        if settings.SUPABASE_ANON_KEY:
            try:
                anon_client = get_supabase_anon_client()
                user_response = anon_client.auth.get_user(token)
                if user_response and user_response.user:
                                    logger.debug(f"Anon client verification successful for user: {user_response.user.id}")
                return user_response.user.model_dump()
            except Exception as e:
                logger.warning(f"Anon client verification failed: {e}")
        
        # Method 3: Fallback to service role verification
        try:
            client = get_supabase_client()
            user_response = client.auth.get_user(token)
            if user_response and user_response.user:
                            logger.debug(f"Service role verification successful for user: {user_response.user.id}")
            return user_response.user.model_dump() 
        except Exception as e:
            logger.warning(f"Service role verification failed: {e}")
        
        logger.warning("[TOKEN_VALIDATION] All token validation methods failed")
        return None
        
    except Exception as e:
        logger.error(f"Error validating token: {e}")
        return None

__all__ = ["get_supabase_client", "get_supabase_anon_client", "get_current_user_data_from_token"] 