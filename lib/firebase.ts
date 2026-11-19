import { getApp, getApps, initializeApp } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase wiring for BudgetBuddy — web.
 *
 * No Firebase project exists yet (2026-11-18) — the values below are
 * TODO placeholders for the publish step: create a clearly-named
 * "BudgetBuddy" project under aryanch99999@gmail.com, enable
 * Email/Password + Google sign-in (email-link OFF), add the app's
 * Vercel domain to authorized domains, then paste the real web config
 * here and in firebase.native.ts and flip `firebaseConfigured` to true
 * in lib/config.ts. Until then the app runs in full local/guest mode.
 *
 * The config values are Firebase's public app identifiers — they are
 * designed to ship in client code. Access is controlled by Firebase
 * Authentication plus the Firestore security rules (each user can only
 * read and write their own /users/<uid> tree). No admin keys or secrets
 * live here; the Gemini key stays server-side in the /api/coach (Java backend)
 * function.
 *
 * Platform note: this file serves web (and tooling). Native builds use
 * firebase.native.ts instead, which imports the scoped @firebase/*
 * packages — the umbrella 'firebase/auth' entry has no React Native
 * build, so on Android/iOS it silently resolves to the browser build
 * whose sessions live in memory only and are lost when the app closes.
 * Every module imports its Auth/Firestore helpers from './firebase' so
 * each platform always gets one consistent set of Firebase modules.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyDkg0DgsN5PN8uBX8se8gXg0MZXINoA5MY',
  authDomain: 'budgetbuddy-49e55.firebaseapp.com',
  projectId: 'budgetbuddy-49e55',
  storageBucket: 'budgetbuddy-49e55.firebasestorage.app',
  messagingSenderId: '267637390223',
  appId: '1:267637390223:web:8e3f34767c2f28e848a9fa',
};

/** OAuth web client ID for the native Google Sign-In flow (not a secret). */
export const GOOGLE_WEB_CLIENT_ID = '267637390223-5qsp403ss3bq2rb6mhv3341qdvm9v13a.apps.googleusercontent.com';

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = firebaseAuth.getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  type User,
} from 'firebase/auth';

export {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
