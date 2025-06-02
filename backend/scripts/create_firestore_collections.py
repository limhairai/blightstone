import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred)
db = firestore.client()

# Create organization_users collection with a sample doc
org_users_ref = db.collection('organization_users').document('sample_org_user')
if not org_users_ref.get().exists:
    org_users_ref.set({
        'orgId': 'sample_org',
        'userId': 'sample_user',
        'role': 'owner',
        'joinedAt': firestore.SERVER_TIMESTAMP,
    })
    print('Created sample document in organization_users')
else:
    print('organization_users sample doc already exists')

# Create users collection with a sample doc (for 2FA)
users_ref = db.collection('users').document('sample_user')
if not users_ref.get().exists:
    users_ref.set({
        'email': 'sample@example.com',
        'twofa': {'enabled': False, 'secret': None},
    })
    print('Created sample document in users')
else:
    print('users sample doc already exists')

# Create invites collection with a sample doc
invites_ref = db.collection('invites').document('sample_invite_token')
if not invites_ref.get().exists:
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    invite_data = {
        'token': 'sample_invite_token',
        'email': 'invitee@example.com',
        'role': 'member',
        'orgId': 'sample_org',
        'status': 'pending',
        'createdAt': now,
        'expiresAt': now + timedelta(days=7),
    }
    invites_ref.set(invite_data)
    print('Created sample document in invites')
else:
    print('invites sample doc already exists') 