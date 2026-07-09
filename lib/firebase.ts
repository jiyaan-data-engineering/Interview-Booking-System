import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('🔍 Firebase Config Check:', {
  apiKey: firebaseConfig.apiKey ? '✅ SET' : '❌ MISSING',
  authDomain: firebaseConfig.authDomain ? '✅ SET' : '❌ MISSING',
  projectId: firebaseConfig.projectId ? '✅ SET' : '❌ MISSING',
  storageBucket: firebaseConfig.storageBucket ? '✅ SET' : '❌ MISSING',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✅ SET' : '❌ MISSING',
  appId: firebaseConfig.appId ? '✅ SET' : '❌ MISSING',
});

let app;
let db: Firestore | null = null;
let auth: Auth | null = null;

try {
  console.log('🔥 Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  console.log('✅ Firebase initialized successfully!');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

export { db, auth };
export default app;
