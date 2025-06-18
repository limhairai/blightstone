from fastapi import APIRouter, Depends, HTTPException, status
# from core.firebase import get_firestore  # TODO: Migrate to Supabase
from core.security import get_current_user, require_superuser
from schemas.user import UserRead as User
import logging

router = APIRouter()
logger = logging.getLogger("adhub_app")

@router.get("/stats")
async def get_admin_stats(current_user: User = Depends(require_superuser)):
    try:
        # db = get_firestore()
        pending_requests = db.collection("requests").where("status", "==", "pending").stream()
        total_clients = db.collection("users").where("role", "==", "client").stream()
        active_ad_accounts = db.collection("adAccounts").where("status", "==", "active").stream()
        total_revenue = 0.0
        txs = db.collection("transactions").stream()
        for tx in txs:
            t = tx.to_dict()
            if t.get("type") in ("topup", "distribute"):  # adjust as needed
                total_revenue += float(t.get("amount", 0))
        stats = {
            "pendingRequests": sum(1 for _ in pending_requests),
            "totalClients": sum(1 for _ in total_clients),
            "activeAdAccounts": sum(1 for _ in active_ad_accounts),
            "totalRevenue": total_revenue,
        }
        logger.info(f"Admin stats viewed by {current_user.email}")
        return stats
    except Exception as e:
        logger.error(f"Error fetching admin stats: {e}")
        raise

@router.get("/clients")
async def get_admin_clients(current_user: User = Depends(require_superuser)):
    try:
        # db = get_firestore()
        users = db.collection("users").where("role", "==", "client").stream()
        clients = []
        for user in users:
            u = user.to_dict()
            u["id"] = user.id
            clients.append(u)
        logger.info(f"Admin clients list viewed by {current_user.email}")
        return {"clients": clients}
    except Exception as e:
        logger.error(f"Error fetching admin clients: {e}")
        raise

@router.get("/requests")
async def get_admin_requests(current_user: User = Depends(require_superuser)):
    try:
        # db = get_firestore()
        reqs = db.collection("requests").stream()
        requests = []
        for req in reqs:
            r = req.to_dict()
            r["id"] = req.id
            requests.append(r)
        logger.info(f"Admin requests list viewed by {current_user.email}")
        return {"requests": requests}
    except Exception as e:
        logger.error(f"Error fetching admin requests: {e}")
        raise

@router.get("/organizations")
async def get_admin_organizations(current_user: User = Depends(require_superuser)):
    try:
        # db = get_firestore()
        orgs = db.collection("organizations").stream()
        organizations = []
        for org in orgs:
            o = org.to_dict()
            o["id"] = org.id
            organizations.append(o)
        logger.info(f"Admin organizations list viewed by {current_user.email}")
        return {"organizations": organizations}
    except Exception as e:
        logger.error(f"Error fetching admin organizations: {e}")
        raise

@router.get("/transactions")
async def get_admin_transactions(current_user: User = Depends(require_superuser)):
    try:
        # db = get_firestore()
        txs = db.collection("transactions").stream()
        transactions = []
        for tx in txs:
            t = tx.to_dict()
            t["id"] = tx.id
            transactions.append(t)
        logger.info(f"Admin transactions list viewed by {current_user.email}")
        return {"transactions": transactions}
    except Exception as e:
        logger.error(f"Error fetching admin transactions: {e}")
        raise

@router.get("/activity")
async def get_admin_activity(current_user: User = Depends(require_superuser)):
    try:
        # db = get_firestore()
        logs = db.collection("audit_logs").order_by("timestamp", direction="DESCENDING").limit(100).stream()
        activity = []
        for log in logs:
            l = log.to_dict()
            l["id"] = log.id
            activity.append(l)
        logger.info(f"Admin activity log viewed by {current_user.email}")
        return {"activity": activity}
    except Exception as e:
        logger.error(f"Error fetching admin activity: {e}")
        raise 