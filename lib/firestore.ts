import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  limit,
  orderBy,
  query as firestoreQuery,
} from 'firebase/firestore';
import { db } from './firebase';
import { InterviewSlot } from './types';

const SLOTS_COLLECTION = 'interview_slots';
let slotsCache: InterviewSlot[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Get all slots with caching
export const getSlots = async (): Promise<InterviewSlot[]> => {
  try {
    // Return cached data if fresh
    if (slotsCache && Date.now() - cacheTime < CACHE_DURATION) {
      return slotsCache;
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
    return slotsCache || [];
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
