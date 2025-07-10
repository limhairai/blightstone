from fastapi import APIRouter
from app.api.endpoints import auth, organizations, admin, wallet, users, health, payments, access_codes, dolphin_assets, subscriptions

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(wallet.router, prefix="/wallet", tags=["wallet"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(access_codes.router, prefix="/access-codes", tags=["access-codes"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
api_router.include_router(dolphin_assets.router, prefix="/dolphin-assets", tags=["dolphin-assets"]) 