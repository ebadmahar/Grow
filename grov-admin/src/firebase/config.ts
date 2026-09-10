import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForGrovAdminTestingOnly1234',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'grov-staging.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'grov-staging',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'grov-staging.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '108246729012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:108246729012:web:a1b2c3d4e5f6',
};

// Singleton app initialization
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Base URL for Cloud Functions (region asia-south1)
export const FUNCTIONS_BASE_URL =
  import.meta.env.VITE_FUNCTIONS_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5001/grov-staging/asia-south1'
    : 'https://asia-south1-grov-staging.cloudfunctions.net');

// Support local emulator connectivity if specified
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
    console.log('[FirebaseConfig] Connected to local Firebase Emulators');
  } catch (e) {
    // Prevent duplicate connection warning in fast refresh
  }
}
