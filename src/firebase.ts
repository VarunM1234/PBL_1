import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test initial connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Global Auth State
export let currentUser: User | null = null;
const authListeners = new Set<(user: User | null) => void>();

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    // Upsert user profile in Firestore
    try {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Passenger',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
    }
  }
  authListeners.forEach(fn => fn(user));
  // Update UI if available
  if ((window as any).renderApp) {
    (window as any).renderApp();
  }
});

export function onAuthChange(fn: (user: User | null) => void) {
  authListeners.add(fn);
  fn(currentUser);
  return () => authListeners.delete(fn);
}

export async function loginWithGoogle() {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    return res.user;
  } catch (e: any) {
    console.error("Google sign in error:", e);
    throw e;
  }
}

export async function logoutUser() {
  await signOut(auth);
}

// Sync bookings to Firestore
export async function persistBookingToFirestore(booking: any) {
  if (!auth.currentUser) return;
  const path = `bookings/${booking.reference}`;
  try {
    await setDoc(doc(db, 'bookings', booking.reference), {
      ...booking,
      userId: auth.currentUser.uid,
      syncedAt: new Date().toISOString()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Fetch user's bookings from Firestore
export async function fetchUserBookingsFromFirestore(): Promise<any[]> {
  if (!auth.currentUser) return [];
  const path = 'bookings';
  try {
    const q = query(collection(db, path), where('userId', '==', auth.currentUser.uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// Expose on window for vanilla modular access
(window as any).firebaseAuth = {
  get currentUser() { return auth.currentUser; },
  loginWithGoogle,
  logoutUser,
  persistBookingToFirestore,
  fetchUserBookingsFromFirestore,
  onAuthChange
};
