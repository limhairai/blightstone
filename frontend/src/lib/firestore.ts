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
  Query,
  CollectionReference
} from 'firebase/firestore';

// Collection names
export const COLLECTIONS = {
  AD_ACCOUNTS: 'adAccounts',
  CAMPAIGNS: 'campaigns',
  ADS: 'ads',
  USERS: 'users',
} as const;

const checkDb = () => {
  if (!db) {
    const errorMsg = "Firestore (db) is not initialized. Check Firebase configuration and initialization logs.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
};

// Generic CRUD operations
export const getDocument = async <T>(collectionName: string, docId: string): Promise<T | null> => {
  checkDb();
  const docRef = doc(db!, collectionName, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as T) : null;
};

export const getDocuments = async <T>(collectionName: string): Promise<T[]> => {
  checkDb();
  const querySnapshot = await getDocs(collection(db!, collectionName));
  return querySnapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as T));
};

export const createDocument = async <T extends DocumentData>(
  collectionName: string,
  data: T,
  docId?: string
): Promise<string> => {
  checkDb();
  const collRef = collection(db!, collectionName);
  const docRef = docId ? doc(collRef, docId) : doc(collRef);
  await setDoc(docRef, data);
  return docRef.id;
};

export const updateDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> => {
  checkDb();
  const docRef = doc(db!, collectionName, docId);
  await updateDoc(docRef, data as DocumentData);
};

export const deleteDocument = async (collectionName: string, docId: string): Promise<void> => {
  checkDb();
  const docRef = doc(db!, collectionName, docId);
  await deleteDoc(docRef);
};

// Query helpers
export const queryDocuments = async <T>(
  collectionName: string,
  conditions: { field: string; operator: any; value: any }[],
  orderByField?: string,
  limitCount?: number
): Promise<T[]> => {
  checkDb();
  let q: Query<DocumentData> = collection(db!, collectionName) as Query<DocumentData>;
  
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
  return querySnapshot.docs.map(docData => ({ id: docData.id, ...docData.data() } as T));
}; 