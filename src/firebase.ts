import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { getAuth, Auth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

let appInstance;
if (!getApps().length) {
  appInstance = initializeApp(firebaseConfig);
} else {
  appInstance = getApp();
}

export const app = appInstance;
// Initialize Firestore using the specified custom firestoreDatabaseId
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Local development against the Firebase emulators (never set in production builds):
//   VITE_USE_FIREBASE_EMULATORS=true npx vite
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
}

// No anonymous sign-in: every Firestore read requires a real, approved account
// (see firestore.rules).

/** Emails that are always system administrators (must match firestore.rules). */
export const BOOTSTRAP_ADMIN_EMAILS = ['phengbmcy18@gmail.com', 'admin@uniqtek.la'];

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_probe'));
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('the client is offline')) {
      console.warn("Firestore probe: client is offline or network restricted. Local persistence active.");
    }
    return false;
  }
}
