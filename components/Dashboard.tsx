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
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    // Check if admin is already logged in
    const savedAdmin = localStorage.getItem('isAdmin');
    if (savedAdmin === 'true') {
      setIsAdmin(true);
    }

    let savedSlots = getSlots();
    if (savedSlots.length === 0) {
      savedSlots = initializeDemoSlots();
    }
    setSlots(savedSlots);
    setIsLoading(false);
  }, []);

  const ADMIN_PASSWORD = 'admin@jiyaan123';

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
      setShowAdminLogin(false);
      setAdminPassword('');
      setAdminError('');
      showAlert('Admin login successful!');
    } else {
      setAdminError('Invalid password');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
    setActiveTab('book');
    showAlert('Admin logged out!');
  };

  const updateSlots = (newSlots: InterviewSlot[]) => {
    setSlots(newSlots);
    saveSlots(newSlots);
  };

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
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
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    updateSlots([...slots, newSlot]);
    showAlert('Registration submitted! We\'ll confirm your interview shortly.');
  };

  const handleRescheduleBooking = (slotId: string, newDate: string, newTime: string) => {
    const updated = slots.map(slot =>
      slot.id === slotId
        ? { ...slot, date: newDate, time: newTime, status: 'pending' as const }
        : slot
    );
    updateSlots(updated);
    showAlert('Interview rescheduled! Please wait for confirmation.');
  };

  const handleCancelBookingWithReason = (slotId: string, reason: string) => {
    const updated = slots.map(slot =>
      slot.id === slotId
        ? { ...slot, status: 'cancelled' as const, reason }
        : slot
    );
    updateSlots(updated);
    showAlert('Interview cancelled. You can book another slot anytime.');
  };

  const handleUpdateStatus = (slotId: string, newStatus: string, reason?: string) => {
    const updated = slots.map(slot =>
      slot.id === slotId
        ? { ...slot, status: newStatus as InterviewSlot['status'], reason: reason || slot.reason }
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
            status: 'completed' as const,
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
      status: 'pending' as const,
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

        {/* Admin Login/Logout Button */}
        <div className="mt-4 flex justify-end">
          {isAdmin ? (
            <button
              onClick={handleAdminLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all"
            >
              🔐 Admin Logout
            </button>
          ) : (
            <button
              onClick={() => setShowAdminLogin(true)}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-600 transition-all"
            >
              🔐 Admin Login
            </button>
          )}
        </div>

        {/* Admin Login Modal */}
        {showAdminLogin && !isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 w-full max-w-sm shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-1">Admin Login</h2>
              <p className="text-slate-400 text-sm mb-4">Enter password to access admin panel</p>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Admin Password *</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    autoFocus
                  />
                </div>

                {adminError && (
                  <div className="bg-red-900/30 border border-red-500 text-red-300 px-3 py-2 rounded-lg text-sm">
                    {adminError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminLogin(false);
                      setAdminPassword('');
                      setAdminError('');
                    }}
                    className="flex-1 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card mt-4 overflow-hidden">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />

          <div className="p-8">
            {activeTab === 'book' && (
              <BookTab onBook={handleCandidateRegistration} />
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
