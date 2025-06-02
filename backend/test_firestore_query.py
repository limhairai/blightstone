import time
from google.cloud import firestore
import os
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/Users/hairai/Documents/Code/adhub/ad-hub-d1c0a-firebase-adminsdk-fbsvc-3a91ccbce3.json"

db = firestore.Client()

t0 = time.time()
users = db.collection('users').where('displayName', '==', 'Hai Rai Lim').get()
t1 = time.time()
print(f"Query took {t1-t0:.3f} seconds")
print(f"Found {len(users)} user(s)")
for user in users:
    print(user.id, user.to_dict()) 