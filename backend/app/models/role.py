class Role:
    def __init__(self, org_id, user_id, role, permissions=None):
        self.org_id = org_id
        self.user_id = user_id
        self.role = role
        self.permissions = permissions or []

    def to_dict(self):
        return {
            "org_id": self.org_id,
            "user_id": self.user_id,
            "role": self.role,
            "permissions": self.permissions,
        } 