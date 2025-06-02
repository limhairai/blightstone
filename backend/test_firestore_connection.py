import firebase_admin
from firebase_admin import credentials, firestore
import sys
import time

try:
    cred = credentials.Certificate("/Users/hairai/Documents/Code/adhub/ad-hub-d1c0a-firebase-adminsdk-fbsvc-3a91ccbce3.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    # Write test
    start = time.time()
    test_ref = db.collection("test_write").document("check")
    test_ref.set({"status": "ok", "timestamp": firestore.SERVER_TIMESTAMP})
    doc = test_ref.get()
    elapsed = time.time() - start
    print("Firestore write successful:", doc.to_dict(), f"(elapsed: {elapsed:.2f}s)")
except Exception as e:
    print("Firestore write failed:", e)
    sys.exit(1) 