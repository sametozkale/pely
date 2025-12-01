import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  User,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
} from "firebase/firestore";
import { getFunctions, Functions } from "firebase/functions";

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let authInstance: ReturnType<typeof getAuth> | undefined;
let authUser: User | null = null;
let functionsInstance: Functions | undefined;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const initFirebase = () => {
  if (!app) {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn("Firebase is not fully configured. Falling back to mock data.");
      return null;
    }
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    db = getFirestore(app);
    authInstance = getAuth(app);
    functionsInstance = getFunctions(app);

    // Listen to auth state changes
    onAuthStateChanged(authInstance, (user) => {
      authUser = user;
      // Only auto sign-in anonymously if no user is authenticated
      // This allows users to sign in with email/OAuth without interference
      if (!user && !authInstance?.currentUser) {
        signInAnonymously(authInstance).catch((err) => {
          // Only log error if it's not admin-restricted-operation (means anonymous auth is disabled)
          if (err.code !== 'auth/admin-restricted-operation') {
            console.error("Anonymous sign-in failed", err);
          }
          // If anonymous auth is disabled, that's okay - users can still sign in with email/OAuth
        });
      }
    });
  }
  return app;
};

export const getDb = () => {
  if (!db) {
    throw new Error("Firestore not initialized. Call initFirebase() first.");
  }
  return db;
};

export const getCurrentUser = () => authUser;

export const getAuthInstance = () => {
  if (!authInstance) {
    // Auto-initialize if not already initialized
    const result = initFirebase();
    if (!authInstance) {
      if (!result) {
        throw new Error("Firebase is not configured. Please set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID environment variables.");
      }
      throw new Error("Auth not initialized. Call initFirebase() first.");
    }
  }
  return authInstance;
};

export const getFirebaseFunctions = () => {
  if (!functionsInstance) {
    throw new Error("Firebase Functions not initialized. Call initFirebase() first.");
  }
  return functionsInstance;
};


