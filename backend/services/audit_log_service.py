from models import AuditLog
# from core.firebase import get_firestore  # TODO: Migrate to Supabase

def log_audit_event(user_id, org_id, action, before_state=None, after_state=None, ip=None, details=None):
    db = get_firestore()
    log = AuditLog(
        user_id=user_id,
        org_id=org_id,
        action=action,
        before_state=before_state,
        after_state=after_state,
        ip=ip,
        details=details,
    )
    db.collection("audit_logs").add(log.to_dict()) 