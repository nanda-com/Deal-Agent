import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp: ReturnType<typeof initializeApp> | null = null;

export function initFirebase() {
  if (firebaseApp) return firebaseApp;

  // Support either explicit service account env vars OR a credential file path
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };

    firebaseApp = initializeApp({ credential: cert(serviceAccount) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Uses ADC (Application Default Credentials) from the file path
    firebaseApp = initializeApp();
  } else {
    throw new Error(
      'Firebase not configured. Set FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, ' +
      'or GOOGLE_APPLICATION_CREDENTIALS in .env',
    );
  }

  console.log('[Firebase] Admin SDK initialized');
  return firebaseApp;
}

export function getFirebaseApp() {
  if (!firebaseApp) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return firebaseApp;
}

export function getFirestoreDb() {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function isFirebaseInitialized(): boolean {
  return firebaseApp !== null;
}
