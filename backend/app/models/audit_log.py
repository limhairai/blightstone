from datetime import datetime

class AuditLog:
    def __init__(self, user_id, org_id, action, before_state=None, after_state=None, ip=None, details=None):
        self.user_id = user_id
        self.org_id = org_id
        self.action = action
        self.timestamp = datetime.utcnow()
        self.before_state = before_state
        self.after_state = after_state
        self.ip = ip
        self.details = details

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "org_id": self.org_id,
            "action": self.action,
            "timestamp": self.timestamp.isoformat(),
            "before_state": self.before_state,
            "after_state": self.after_state,
            "ip": self.ip,
            "details": self.details,
        } 