import { InterviewSlot } from './types';

const SLOTS_KEY = 'interview_slots';

export const getSlots = (): InterviewSlot[] => {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(SLOTS_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveSlots = (slots: InterviewSlot[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
};

export const initializeDemoSlots = (): InterviewSlot[] => {
  // Start fresh - no demo data
  const emptySlots: InterviewSlot[] = [];
  saveSlots(emptySlots);
  return emptySlots;
};

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

export const exportToCSV = (slots: InterviewSlot[]): void => {
  const headers = ['Date', 'Time', 'Company', 'Duration', 'Candidate Name', 'Email', 'Phone', 'Status'];
  const rows = slots.map(slot => [
    slot.date,
    slot.time,
    slot.company,
    slot.duration,
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
