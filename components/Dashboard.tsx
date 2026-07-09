'use client';

import { useState, useEffect } from 'react';
import { InterviewSlot } from '@/lib/types';
import { getSlots, saveSlots, initializeDemoSlots } from '@/lib/storage';
import Header from './Header';
import TabNavigation from './TabNavigation';
import BookTab from './tabs/BookTab';
import MyBookingsTab from './tabs/MyBookingsTab';
import ViewTab from './tabs/ViewTab';
import AdminTab from './tabs/AdminTab';
import Alert from './Alert';

type TabType = 'book' | 'mybookings' | 'view' | 'admin';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('book');
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let savedSlots = getSlots();
    if (savedSlots.length === 0) {
      savedSlots = initializeDemoSlots();
    }
    setSlots(savedSlots);
    setIsLoading(false);
  }, []);

  const updateSlots = (newSlots: InterviewSlot[]) => {
    setSlots(newSlots);
    saveSlots(newSlots);
  };

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleBookSlot = (slotId: string, candidateName: string, email: string, phone: string) => {
    const updated = slots.map(slot =>
      slot.id === slotId
        ? { ...slot, candidateName, candidateEmail: email, candidatePhone: phone }
        : slot
    );
    updateSlots(updated);
    showAlert('Booking confirmed! Check your email for details.');
    setTimeout(() => setActiveTab('view'), 2000);
  };

  const handleCandidateRegistration = (candidateName: string, email: string, phone: string, date: string, time: string, company: string, duration: string) => {
    const newSlot: InterviewSlot = {
      id: Date.now().toString(),
      date,
      time,
      company,
      duration,
      candidateName,
      candidateEmail: email,
      candidatePhone: phone,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    updateSlots([...slots, newSlot]);
    showAlert('Registration submitted! We\'ll confirm your interview shortly.');
  };

  const handleRescheduleBooking = (slotId: string, newDate: string, newTime: string) => {
    const updated = slots.map(slot =>
      slot.id === slotId
        ? { ...slot, date: newDate, time: newTime, status: 'pending' }
        : slot
    );
    updateSlots(updated);
    showAlert('Interview rescheduled! Please wait for confirmation.');
  };

  const handleCancelBookingWithReason = (slotId: string, reason: string) => {
    const updated = slots.map(slot =>
      slot.id === slotId
        ? { ...slot, status: 'cancelled', reason }
        : slot
    );
    updateSlots(updated);
    showAlert('Interview cancelled. You can book another slot anytime.');
  };

  const handleUpdateStatus = (slotId: string, newStatus: string, reason?: string) => {
    const updated = slots.map(slot =>
      slot.id === slotId
        ? { ...slot, status: newStatus as any, reason: reason || slot.reason }
        : slot
    );
    updateSlots(updated);
    const statusMsg = newStatus === 'confirmed' ? 'Interview confirmed!' : `Interview status updated to ${newStatus}`;
    showAlert(statusMsg);
  };

  const handleMarkCompleted = (slotId: string, supportPerson: string, hrName: string, panelName: string, hrNumber: string, feedback: string) => {
    const updated = slots.map(slot =>
      slot.id === slotId
        ? {
            ...slot,
            status: 'completed',
            supportPerson,
            hrName,
            panelName,
            hrNumber,
            feedback,
            completedAt: new Date().toISOString()
          }
        : slot
    );
    updateSlots(updated);
    showAlert('Interview marked as completed! Thank you for the details.');
  };

  const handleCancelBooking = (slotId: string) => {
    if (confirm('Cancel this booking?')) {
      const updated = slots.map(slot =>
        slot.id === slotId
          ? { ...slot, candidateName: '', candidateEmail: '', candidatePhone: '' }
          : slot
      );
      updateSlots(updated);
      showAlert('Booking cancelled.');
    }
  };

  const handleDeleteSlot = (slotId: string) => {
    if (confirm('Are you sure you want to delete this slot?')) {
      updateSlots(slots.filter(slot => slot.id !== slotId));
      showAlert('Slot deleted successfully!');
    }
  };

  const handleAddSlot = (date: string, time: string, company: string, duration: string) => {
    const newSlot: InterviewSlot = {
      id: Date.now().toString(),
      date,
      time,
      company,
      duration,
      candidateName: '',
      candidateEmail: '',
      candidatePhone: '',
    };
    updateSlots([...slots, newSlot]);
    showAlert('Interview slot added successfully!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const availableSlots = slots.filter(slot => !slot.candidateName);
  const bookedSlots = slots.filter(slot => slot.candidateName);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Header />

        {alert && <Alert message={alert.message} type={alert.type} />}

        <div className="card mt-6 overflow-hidden">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="p-8">
            {activeTab === 'book' && (
              <BookTab slots={slots} onBook={handleCandidateRegistration} />
            )}

            {activeTab === 'mybookings' && (
              <MyBookingsTab
                slots={slots}
                onReschedule={handleRescheduleBooking}
                onCancel={handleCancelBookingWithReason}
                onMarkCompleted={handleMarkCompleted}
              />
            )}

            {activeTab === 'view' && (
              <ViewTab
                slots={slots}
                available={availableSlots.length}
                booked={bookedSlots.length}
              />
            )}

            {activeTab === 'admin' && (
              <AdminTab
                slots={slots}
                onAddSlot={handleAddSlot}
                onDeleteSlot={handleDeleteSlot}
                onCancelBooking={handleCancelBooking}
                onUpdateStatus={handleUpdateStatus}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
