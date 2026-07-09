import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

interface CandidateProfile {
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export const registerCandidate = async (
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<User> => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store candidate profile in Firestore
    if (db) {
      await setDoc(doc(db, 'candidates', user.uid), {
        name,
        email,
        phone,
        createdAt: new Date().toISOString(),
      } as CandidateProfile);
    }

    return user;
  } catch (error: any) {
    throw new Error(error.message || 'Registration failed');
  }
};

export const loginCandidate = async (email: string, password: string): Promise<User> => {
  try {
    // Enable persistence
    await setPersistence(auth, browserLocalPersistence);

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
};

export const logoutCandidate = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Logout failed');
  }
};

export const getCandidateProfile = async (userId: string): Promise<CandidateProfile | null> => {
  try {
    if (!db) return null;
    const docSnap = await getDoc(doc(db, 'candidates', userId));
    return docSnap.exists() ? (docSnap.data() as CandidateProfile) : null;
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    return null;
  }
};
