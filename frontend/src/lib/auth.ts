import { NextAuthOptions, Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { FirestoreAdapter } from '@auth/firebase-adapter';
import { cert } from 'firebase-admin/app';
import { User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { Auth } from 'firebase/auth';
import { auth } from './firebase';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: FirestoreAdapter({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n'),
    }),
  }),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }: { session: Session; token: any }) {
      if (session?.user) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
};

export async function signUp(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(auth as Auth, email, password);
  const user = userCredential.user;
  // Create user profile in backend
  await fetch('/api/v1/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      uid: user.uid,
      email: user.email,
      createdAt: new Date().toISOString(),
      role: 'user',
    }),
  });
  return user;
}

export async function signIn(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth as Auth, email, password);
  return userCredential.user;
}

export async function signOutUser() {
  await signOut(auth as Auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth as Auth, email);
}

export async function updateUserProfile(user: User, data: { displayName?: string; photoURL?: string }) {
  await updateProfile(user, data);
}

export async function getUserRole(uid: string) {
  const res = await fetch(`/api/v1/users/${uid}`);
  if (!res.ok) return 'user';
  const userData = await res.json();
  return userData.role || 'user';
} 