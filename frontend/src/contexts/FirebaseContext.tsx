"use client";
import { createContext, useContext, ReactNode } from 'react';
import { app, auth, db } from '@/lib/firebase';

interface FirebaseContextType {
  app: typeof app;
  auth: typeof auth;
  db: typeof db;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  return (
    <FirebaseContext.Provider value={{ app, auth, db }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
} 