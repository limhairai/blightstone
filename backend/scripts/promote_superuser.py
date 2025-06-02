import argparse
from app.core.firebase import get_firestore

def promote_superuser(uid=None, email=None):
    db = get_firestore()
    user_doc = None
    if uid:
        user_doc = db.collection("users").document(uid).get()
    elif email:
        user_ref = db.collection("users").where("email", "==", email).limit(1).get()
        user_doc = user_ref[0] if user_ref else None
    if not user_doc or not user_doc.exists:
        print("User not found.")
        return
    db.collection("users").document(user_doc.id).update({"is_superuser": True})
    print(f"User {user_doc.id} promoted to superuser.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Promote a user to superuser in Firestore.")
    parser.add_argument("--uid", type=str, help="User UID")
    parser.add_argument("--email", type=str, help="User email")
    args = parser.parse_args()
    if not args.uid and not args.email:
        print("You must provide either --uid or --email.")
    else:
        promote_superuser(uid=args.uid, email=args.email) 