export type InterviewStatus = 'pending' | 'confirmed' | 'cancelled' | 'postponed' | 'completed';

export interface InterviewSlot {
  id: string;
  date: string;
  time: string;
  company: string;
  duration: string;
  round?: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  batchNo?: string;
  status: InterviewStatus;
  reason?: string;
  room?: string;
  supportPerson?: string;
  hrName?: string;
  panelName?: string;
  hrNumber?: string;
  feedback?: string;
  comments?: string;
  interviewStatus?: string;
  createdAt?: string;
  completedAt?: string;
  requestedDocuments?: string[];
  documentRequestMessage?: string;
  offerStatus?: string;
  offerReleasedDate?: string;
  joiningDate?: string;
  packageLPA?: string;
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
