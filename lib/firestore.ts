import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { InterviewSlot } from './types';

const SLOTS_COLLECTION = 'interview_slots';
const STORAGE_KEY = 'interview_slots_local';
let slotsCache: InterviewSlot[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds
let useFirestore = true;

// Get all slots with fallback to localStorage
export const getSlots = async (): Promise<InterviewSlot[]> => {
  try {
    // Return cached data if fresh
    if (slotsCache && Date.now() - cacheTime < CACHE_DURATION) {
      return slotsCache;
    }

    if (!useFirestore) {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }

    // Try Firestore with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firebase timeout')), 5000)
    );

    const queryPromise = getDocs(collection(db, SLOTS_COLLECTION));
    const querySnapshot = await Promise.race([queryPromise, timeoutPromise]);

    const slots: InterviewSlot[] = [];
    (querySnapshot as any).forEach((docSnap: any) => {
      slots.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as InterviewSlot);
    });

    slotsCache = slots;
    cacheTime = Date.now();

    // Also save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));

    return slots;
  } catch (error) {
    console.error('Firestore error, using localStorage:', error);
    useFirestore = false;

    // Fallback to localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : (slotsCache || []);
  }
};

// Save slot to both Firestore and localStorage
export const saveSlot = async (slot: Omit<InterviewSlot, 'id'>): Promise<string> => {
  const slotWithId: InterviewSlot = {
    id: Date.now().toString(),
    ...slot,
  };

  try {
    if (useFirestore) {
      const docRef = await addDoc(collection(db, SLOTS_COLLECTION), slot);
      return docRef.id;
    }
  } catch (error) {
    console.error('Firestore save error, using localStorage:', error);
    useFirestore = false;
  }

  // Fallback to localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  const slots = stored ? JSON.parse(stored) : [];
  slots.push(slotWithId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  return slotWithId.id;
};

// Update slot in both Firestore and localStorage
export const updateSlot = async (slotId: string, updates: Partial<InterviewSlot>): Promise<void> => {
  try {
    if (useFirestore) {
      const slotRef = doc(db, SLOTS_COLLECTION, slotId);
      await updateDoc(slotRef, updates);
    }
  } catch (error) {
    console.error('Firestore update error, using localStorage:', error);
    useFirestore = false;
  }

  // Also update in localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const slots = JSON.parse(stored);
    const index = slots.findIndex((s: InterviewSlot) => s.id === slotId);
    if (index !== -1) {
      slots[index] = { ...slots[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
    }
  }
};

// Delete slot from both Firestore and localStorage
export const deleteSlot = async (slotId: string): Promise<void> => {
  try {
    if (useFirestore) {
      await deleteDoc(doc(db, SLOTS_COLLECTION, slotId));
    }
  } catch (error) {
    console.error('Firestore delete error, using localStorage:', error);
    useFirestore = false;
  }

  // Also delete from localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const slots = JSON.parse(stored);
    const filtered = slots.filter((s: InterviewSlot) => s.id !== slotId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};

// Save/update slot
export const saveSlot = async (slot: Omit<InterviewSlot, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, SLOTS_COLLECTION), slot);
    return docRef.id;
  } catch (error) {
    console.error('Error saving slot:', error);
    throw error;
  }
};

// Update slot
export const updateSlot = async (slotId: string, updates: Partial<InterviewSlot>): Promise<void> => {
  try {
    const slotRef = doc(db, SLOTS_COLLECTION, slotId);
    await updateDoc(slotRef, updates);
  } catch (error) {
    console.error('Error updating slot:', error);
    throw error;
  }
};

// Delete slot
export const deleteSlot = async (slotId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, SLOTS_COLLECTION, slotId));
  } catch (error) {
    console.error('Error deleting slot:', error);
    throw error;
  }
};

// Export to JSON
export const exportToJSON = (slots: InterviewSlot[]): void => {
  const dataStr = JSON.stringify(slots, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `interview-slots-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Export to CSV
export const exportToCSV = (slots: InterviewSlot[]): void => {
  const headers = ['Date', 'Time', 'Company', 'Duration', 'Round', 'Candidate Name', 'Email', 'Phone', 'Status'];
  const rows = slots.map(slot => [
    slot.date,
    slot.time,
    slot.company,
    slot.duration,
    slot.round || '',
    slot.candidateName,
    slot.candidateEmail,
    slot.candidatePhone,
    slot.candidateName ? 'Booked' : 'Available',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `interview-slots-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
