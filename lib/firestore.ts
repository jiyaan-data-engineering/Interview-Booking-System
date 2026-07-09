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
let slotsCache: InterviewSlot[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Get all slots
export const getSlots = async (): Promise<InterviewSlot[]> => {
  try {
    // Return cached data if fresh
    if (slotsCache && Date.now() - cacheTime < CACHE_DURATION) {
      return slotsCache;
    }

    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const querySnapshot = await getDocs(collection(db, SLOTS_COLLECTION));
    const slots: InterviewSlot[] = [];
    querySnapshot.forEach((docSnap) => {
      slots.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as InterviewSlot);
    });

    slotsCache = slots;
    cacheTime = Date.now();
    return slots;
  } catch (error) {
    console.error('Error fetching slots:', error);
    return [];
  }
};

// Save/add slot
export const saveSlot = async (slot: Omit<InterviewSlot, 'id'>): Promise<string> => {
  try {
    console.log('📝 Attempting to save slot:', slot);

    if (!db) {
      throw new Error('Firestore database not initialized!');
    }

    const docRef = await addDoc(collection(db, SLOTS_COLLECTION), slot);
    console.log('✅ Slot saved successfully with ID:', docRef.id);

    // Clear cache
    slotsCache = null;
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving slot:', error);
    throw error;
  }
};

// Update slot
export const updateSlot = async (slotId: string, updates: Partial<InterviewSlot>): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const slotRef = doc(db, SLOTS_COLLECTION, slotId);
    await updateDoc(slotRef, updates);
    // Clear cache
    slotsCache = null;
  } catch (error) {
    console.error('Error updating slot:', error);
    throw error;
  }
};

// Delete slot
export const deleteSlot = async (slotId: string): Promise<void> => {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    await deleteDoc(doc(db, SLOTS_COLLECTION, slotId));
    // Clear cache
    slotsCache = null;
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
