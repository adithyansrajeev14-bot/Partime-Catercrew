import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app: FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// If a custom firestoreDatabaseId is provided in config, use it; otherwise default
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again.';
  const code = (error as { code?: string })?.code || '';
  const message = (error as { message?: string })?.message || String(error);

  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please check your details.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled. Please try again.';
    case 'permission-denied':
      return 'You do not have permission to perform this action.';
    case 'unavailable':
      return 'Service temporarily busy. Please check your connection.';
    default:
      if (message.includes('auth/') || message.includes('Firebase:')) {
        return 'Authentication failed. Please check your details and try again.';
      }
      return 'Action could not be completed. Please try again.';
  }
}
