import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoKeyForGrovMobileTestingOnly1234',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'grov-staging.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'grov-staging',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'grov-staging.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '108246729012',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:108246729012:android:9876543210abcdef',
};

// Singleton App Instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Production / Staging Cloud Functions base URL in asia-south1 (Mumbai)
export const DEFAULT_FUNCTIONS_BASE_URL =
  process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ||
  'https://asia-south1-grov-staging.cloudfunctions.net';
