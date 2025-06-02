import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
} from 'firebase/firestore';

// Collection names
export const COLLECTIONS = {
  AD_ACCOUNTS: 'adAccounts',
  CAMPAIGNS: 'campaigns',
  ADS: 'ads',
  USERS: 'users',
} as const;

// Generic CRUD operations
export const getDocument = async <T>(collectionName: string, docId: string): Promise<T | null> => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as T) : null;
};

export const getDocuments = async <T>(collectionName: string): Promise<T[]> => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

export const createDocument = async <T extends DocumentData>(
  collectionName: string,
  data: T,
  docId?: string
): Promise<string> => {
  const docRef = docId ? doc(db, collectionName, docId) : doc(collection(db, collectionName));
  await setDoc(docRef, data);
  return docRef.id;
};

export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, data as DocumentData);
};

export const deleteDocument = async (collectionName: string, docId: string): Promise<void> => {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
};

// Query helpers
export const queryDocuments = async <T>(
  collectionName: string,
  conditions: { field: string; operator: any; value: any }[],
  orderByField?: string,
  limitCount?: number
): Promise<T[]> => {
  let q = collection(db, collectionName);
  
  // Add where conditions
  conditions.forEach(condition => {
    q = query(q, where(condition.field, condition.operator, condition.value));
  });
  
  // Add ordering if specified
  if (orderByField) {
    q = query(q, orderBy(orderByField));
  }
  
  // Add limit if specified
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}; 