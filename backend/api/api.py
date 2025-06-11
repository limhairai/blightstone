from fastapi import APIRouter
from api.endpoints import auth, ad_accounts, organizations, invites, admin, twofa, wallet, users, health, businesses

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(ad_accounts.router, prefix="/ad-accounts", tags=["ad-accounts"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(businesses.router, prefix="/businesses", tags=["businesses"])
api_router.include_router(invites.router, prefix="/invites", tags=["invites"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(twofa.router, prefix="/twofa", tags=["twofa"])
api_router.include_router(wallet.router, prefix="/wallet", tags=["wallet"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(health.router, prefix="/health", tags=["health"]) 