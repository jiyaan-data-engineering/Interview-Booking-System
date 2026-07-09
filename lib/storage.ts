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
  const demoSlots: InterviewSlot[] = [
    {
      id: '1',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      company: 'TechCorp',
      duration: '30 min',
      candidateName: '',
      candidateEmail: '',
      candidatePhone: '',
      status: 'pending',
    },
    {
      id: '2',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '11:00',
      company: 'TechCorp',
      duration: '30 min',
      candidateName: '',
      candidateEmail: '',
      candidatePhone: '',
      status: 'pending',
    },
    {
      id: '3',
      date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '10:00',
      company: 'InnovateLabs',
      duration: '45 min',
      candidateName: 'John Doe',
      candidateEmail: 'john@example.com',
      candidatePhone: '555-0123',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      time: '11:00',
      company: 'InnovateLabs',
      duration: '45 min',
      candidateName: '',
      candidateEmail: '',
      candidatePhone: '',
      status: 'pending',
    },
  ];

  saveSlots(demoSlots);
  return demoSlots;
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
