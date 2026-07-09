export type InterviewStatus = 'pending' | 'confirmed' | 'cancelled' | 'postponed' | 'completed';

export interface InterviewSlot {
  id: string;
  date: string;
  time: string;
  company: string;
  duration: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  status: InterviewStatus;
  reason?: string;
  supportPerson?: string;
  hrName?: string;
  panelName?: string;
  hrNumber?: string;
  feedback?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface SlotFormData {
  date: string;
  time: string;
  company: string;
  duration: string;
}

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
}
