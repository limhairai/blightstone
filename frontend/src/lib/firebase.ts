import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
let auth;
let db;

// Fallback for missing env vars during development if not using emulators
const isDevelopment = process.env.NODE_ENV === 'development';
const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

if (!firebaseConfig.apiKey && isDevelopment && !useEmulator) {
  console.warn(
    'Firebase API key is missing. Firebase will not be initialized. Ensure NEXT_PUBLIC_FIREBASE_API_KEY is set in your .env.development file or use emulators.'
  );
}

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);

  if (useEmulator) {
    // AUTH EMULATOR
    let authHost = 'localhost';
    let authPort = 9098; // Default desired port

    if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST) {
        const parts = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST.split(':');
        authHost = parts[0];
        if (parts[1] && !isNaN(parseInt(parts[1], 10))) {
            authPort = parseInt(parts[1], 10);
        }
    }
    const finalAuthEmulatorUrl = `http://${authHost}:${authPort}`;

    // FIRESTORE EMULATOR
    let firestoreHost = 'localhost';
    let firestorePort = 8081; // Default desired port

    if (process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST) {
        const parts = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST.split(':');
        firestoreHost = parts[0];
        if (parts[1] && !isNaN(parseInt(parts[1], 10))) {
            firestorePort = parseInt(parts[1], 10);
        }
    }

    console.log(`Attempting to connect to Firebase emulators: Firestore (${firestoreHost}:${firestorePort}), Auth (${finalAuthEmulatorUrl})`);
    
    if (isNaN(firestorePort)) {
        console.error("Invalid Firestore emulator port. Not connecting Firestore emulator.");
    } else {
        console.log(`Connecting to Firestore emulator at ${firestoreHost}:${firestorePort}`);
        connectFirestoreEmulator(db, firestoreHost, firestorePort);
    }

    if (isNaN(authPort)) {
        console.error("Invalid Auth emulator port. Not connecting Auth emulator.");
    } else {
        try {
            console.log(`Connecting to Auth emulator at ${finalAuthEmulatorUrl}`);
            connectAuthEmulator(auth, finalAuthEmulatorUrl, { disableWarnings: true });
        } catch (e) {
            console.error(`Error connecting to Auth emulator at ${finalAuthEmulatorUrl}:`, e);
        }
    }
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  // Decide on more robust error handling for production if needed
  // For now, re-throw or set to null to make issues visible
  app = null as any; // Or handle as per your app's error strategy
  auth = null as any;
  db = null as any;
}

export { app, auth, db }; 