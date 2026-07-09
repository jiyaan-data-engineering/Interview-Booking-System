'use client';

import { useState, useEffect } from 'react';
import { InterviewSlot } from '@/lib/types';
import { getSlots, saveSlot, updateSlot, deleteSlot } from '@/lib/firestore';
import Header from './Header';
import TabNavigation from './TabNavigation';
import BookTab from './tabs/BookTab';
import MyBookingsTab from './tabs/MyBookingsTab';
import AnalyticsTab from './tabs/AnalyticsTab';
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
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      // Check if admin is already logged in
      const savedAdmin = localStorage.getItem('isAdmin');
      if (savedAdmin === 'true') {
        setIsAdmin(true);
      }

      // Load slots from Firestore with timeout
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Firebase connection timeout')), 10000)
        );
        const slotsPromise = getSlots();
        const savedSlots = await Promise.race([slotsPromise, timeoutPromise]);
        setSlots(savedSlots as InterviewSlot[]);
      } catch (error) {
        console.error('Error loading slots:', error);
        setSlots([]);
      }
      setIsLoading(false);
    };

    loadData();
  }, []);

  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'admin@123';

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUsername || !adminPassword) {
      setAdminError('Please enter username and password');
      return;
    }
    if (adminUsername === ADMIN_USERNAME && adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem('isAdmin', 'true');
      setShowAdminLogin(false);
      setAdminUsername('');
      setAdminPassword('');
      setAdminError('');
      showAlert('Admin login successful!');
    } else {
      setAdminError('Invalid username or password');
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
    // Slots are automatically saved to Firestore via individual update functions
  };

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleCandidateRegistration = async (candidateName: string, email: string, phone: string, date: string, time: string, company: string, duration: string, round?: string) => {
    try {
      const newSlot: Omit<InterviewSlot, 'id'> = {
        date,
        time,
        company,
        duration,
        round,
        candidateName,
        candidateEmail: email,
        candidatePhone: phone,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };
      const slotId = await saveSlot(newSlot);
      updateSlots([...slots, { id: slotId, ...newSlot }]);
      showAlert('Registration submitted! We\'ll confirm your interview shortly.');
    } catch (error) {
      showAlert('Failed to submit registration. Please try again.', 'error');
      console.error(error);
    }
  };

  const handleRescheduleBooking = async (slotId: string, newDate: string, newTime: string) => {
    try {
      await updateSlot(slotId, { date: newDate, time: newTime, status: 'pending' as const });
      const updated = slots.map(slot =>
        slot.id === slotId
          ? { ...slot, date: newDate, time: newTime, status: 'pending' as const }
          : slot
      );
      updateSlots(updated);
      showAlert('Interview rescheduled! Please wait for confirmation.');
    } catch (error) {
      showAlert('Failed to reschedule. Please try again.', 'error');
      console.error(error);
    }
  };

  const handleCancelBookingWithReason = async (slotId: string, reason: string) => {
    try {
      await updateSlot(slotId, { status: 'cancelled' as const, reason });
      const updated = slots.map(slot =>
        slot.id === slotId
          ? { ...slot, status: 'cancelled' as const, reason }
          : slot
      );
      updateSlots(updated);
      showAlert('Interview cancelled. You can book another slot anytime.');
    } catch (error) {
      showAlert('Failed to cancel. Please try again.', 'error');
      console.error(error);
    }
  };

  const handleUpdateStatus = async (slotId: string, newStatus: string, reason?: string) => {
    try {
      await updateSlot(slotId, { status: newStatus as InterviewSlot['status'], reason: reason || undefined });
      const updated = slots.map(slot =>
        slot.id === slotId
          ? { ...slot, status: newStatus as InterviewSlot['status'], reason: reason || slot.reason }
          : slot
      );
      updateSlots(updated);
      const statusMsg = newStatus === 'confirmed' ? 'Interview confirmed!' : `Interview status updated to ${newStatus}`;
      showAlert(statusMsg);
    } catch (error) {
      showAlert('Failed to update status. Please try again.', 'error');
      console.error(error);
    }
  };

  const handleMarkCompleted = async (slotId: string, supportPerson: string, hrName: string, panelName: string, hrNumber: string, feedback: string) => {
    try {
      await updateSlot(slotId, {
        status: 'completed' as const,
        supportPerson,
        hrName,
        panelName,
        hrNumber,
        feedback,
        completedAt: new Date().toISOString()
      });
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
    } catch (error) {
      showAlert('Failed to mark completed. Please try again.', 'error');
      console.error(error);
    }
  };

  const handleCancelBooking = async (slotId: string) => {
    if (confirm('Cancel this booking?')) {
      try {
        await updateSlot(slotId, { candidateName: '', candidateEmail: '', candidatePhone: '' });
        const updated = slots.map(slot =>
          slot.id === slotId
            ? { ...slot, candidateName: '', candidateEmail: '', candidatePhone: '' }
            : slot
        );
        updateSlots(updated);
        showAlert('Booking cancelled.');
      } catch (error) {
        showAlert('Failed to cancel booking. Please try again.', 'error');
        console.error(error);
      }
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (confirm('Are you sure you want to delete this slot?')) {
      try {
        await deleteSlot(slotId);
        updateSlots(slots.filter(slot => slot.id !== slotId));
        showAlert('Slot deleted successfully!');
      } catch (error) {
        showAlert('Failed to delete slot. Please try again.', 'error');
        console.error(error);
      }
    }
  };

  const handleAddSlot = async (date: string, time: string, company: string, duration: string, round?: string) => {
    try {
      const newSlot: Omit<InterviewSlot, 'id'> = {
        date,
        time,
        company,
        duration,
        round,
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        status: 'pending' as const,
      };
      const slotId = await saveSlot(newSlot);
      updateSlots([...slots, { id: slotId, ...newSlot }]);
      showAlert('Interview slot added successfully!');
    } catch (error) {
      showAlert('Failed to add slot. Please try again.', 'error');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-white text-lg font-semibold">Loading Interview System...</p>
          <p className="text-slate-400 text-sm mt-2">Connecting to Firebase...</p>
          <div className="mt-6 flex gap-1 justify-center">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
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
              <p className="text-slate-400 text-sm mb-4">Access admin panel</p>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Username *</label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={e => setAdminUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    autoFocus
                  />
                  <p className="text-xs text-slate-500 mt-1">Default: admin</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Password *</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Default: admin@123</p>
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
                      setAdminUsername('');
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

            {activeTab === 'view' && isAdmin ? (
              <AnalyticsTab slots={slots} />
            ) : activeTab === 'view' ? (
              <ViewTab
                slots={slots}
                available={availableSlots.length}
                booked={bookedSlots.length}
              />
            ) : null}

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
