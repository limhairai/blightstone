import os
import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings

print(f"[FIREBASE_INIT] Attempting to read FIRESTORE_EMULATOR_HOST env var. Value: {os.environ.get('FIRESTORE_EMULATOR_HOST')}")
print(f"[FIREBASE_INIT] Attempting to read FIREBASE_AUTH_EMULATOR_HOST env var. Value: {os.environ.get('FIREBASE_AUTH_EMULATOR_HOST')}")

_firebase_app_initialized = False

def initialize_firebase_admin():
    global _firebase_app_initialized
    if not firebase_admin._apps: # Check if default app exists
        try:
            # settings.FIREBASE_ADMIN_CREDENTIALS will be None if emulators are active (due to logic in config.py)
            if settings.FIREBASE_ADMIN_CREDENTIALS:
                print("[FIREBASE_INIT] Initializing Firebase Admin SDK WITH production credentials.")
                cred = credentials.Certificate(settings.FIREBASE_ADMIN_CREDENTIALS)
                firebase_admin.initialize_app(cred)
            else:
                # No credentials provided (likely using emulators, or an error in loading them for prod).
                # For emulators, initializing without credentials works if emulator env vars are set.
                print("[FIREBASE_INIT] Initializing Firebase Admin SDK WITHOUT explicit credentials (expected for emulators or if production creds are missing).")
                firebase_admin.initialize_app() # Initialize without specific creds; uses GOOGLE_APPLICATION_CREDENTIALS or emulators if env vars are set.
            
            _firebase_app_initialized = True
            current_app = firebase_admin.get_app()
            print(f"[FIREBASE_INIT] Firebase Admin SDK initialized. App name: {current_app.name}, Project ID from app: {current_app.project_id}")
        except Exception as e:
            print(f"[FIREBASE_INIT] ERROR initializing Firebase Admin SDK: {e}")
            _firebase_app_initialized = False # Ensure it's marked as not initialized on error
    else:
        _firebase_app_initialized = True # Already initialized
        current_app = firebase_admin.get_app() # Get the default app
        print(f"[FIREBASE_INIT] Firebase Admin SDK already initialized. App name: {current_app.name}, Project ID from app: {current_app.project_id}")

_db_client_store = {"client": None} # Use a dictionary to store the client

def get_firestore():
    if not _firebase_app_initialized: # Ensure initialized before getting client
        initialize_firebase_admin()
        if not _firebase_app_initialized: # If still not initialized after trying
            print("[FIREBASE_INIT] CRITICAL: Firebase app failed to initialize. Cannot get Firestore client.")
            return None

    if _db_client_store["client"] is None: 
        try:
            # Ensure we are getting client for the default app
            app = firebase_admin.get_app() # Get the default app, should be the one we initialized
            _db_client_store["client"] = firestore.client(app=app)
            print(f"[FIREBASE_INIT] Firestore client obtained successfully for App: {app.name}. Client Project ID: {_db_client_store['client'].project}. Client object: {_db_client_store['client']}")
        except Exception as e:
            print(f"[FIREBASE_INIT] ERROR obtaining Firestore client: {e}")
            return None 
    return _db_client_store["client"]

# Call initialization when this module is first imported
initialize_firebase_admin() 