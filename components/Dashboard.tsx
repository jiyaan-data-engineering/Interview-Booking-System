'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { InterviewSlot } from '@/lib/types';
import { getSlots, saveSlot, updateSlot, deleteSlot } from '@/lib/firestore';
import { registerCandidate, loginCandidate, logoutCandidate, getCandidateProfile } from '@/lib/auth';
import Header from './Header';
import TabNavigation from './TabNavigation';
import BookTab from './tabs/BookTab';
import MyBookingsTab from './tabs/MyBookingsTab';
import TomorrowScheduleTab from './tabs/TomorrowScheduleTab';
import AllBookingsTab from './tabs/AllBookingsTab';
import FeedbackAnalyticsTab from './tabs/FeedbackAnalyticsTab';
import ManageConfirmedSlotsTab from './tabs/ManageConfirmedSlotsTab';
import CancelledInterviewsTab from './tabs/CancelledInterviewsTab';
import AdminTab from './tabs/AdminTab';
import Alert from './Alert';
import LoginForm from './auth/LoginForm';
import LoginPage from './LoginPage';

type TabType = 'book' | 'mybookings' | 'tomorrow' | 'allbookings' | 'feedbackanalytics' | 'confirmedslots' | 'cancelled' | 'admin';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('allbookings');
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Candidate auth
  const [candidateUser, setCandidateUser] = useState<User | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<{ name: string; phone: string } | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Check Firebase Auth state
      let unsubscribe: (() => void) | null = null;

      if (auth) {
        unsubscribe = onAuthStateChanged(auth, async (user) => {
          setCandidateUser(user);
          if (user) {
            setShowLoginForm(false);
            // Fetch candidate profile from Firestore
            const profile = await getCandidateProfile(user.uid);
            if (profile) {
              setCandidateProfile({
                name: profile.name,
                phone: profile.phone
              });
            }
            // If candidate is logged in, default to 'book' tab
            setActiveTab('book');
          } else {
            // If not logged in, default to 'allbookings' tab
            setCandidateProfile(null);
            setActiveTab('allbookings');
          }
        });
      }

      // Check if admin is already logged in
      const savedAdmin = localStorage.getItem('isAdmin');
      if (savedAdmin === 'true') {
        setIsAdmin(true);
        setActiveTab('book');
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

      return () => {
        if (unsubscribe) unsubscribe();
      };
    };

    loadData();
  }, []);

  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'admin@123';

  const handleAdminRegisterCandidate = async (name: string, email: string, phone: string, password: string) => {
    try {
      await registerCandidate(name, email, phone, password);
      showAlert(`Candidate "${name}" registered successfully!`, 'success');
    } catch (error: any) {
      showAlert(error.message || 'Registration failed', 'error');
    }
  };

  const handleCandidateLogin = async (email: string, password: string) => {
    try {
      await loginCandidate(email, password);
      showAlert('Login successful! Welcome back!', 'success');
    } catch (error: any) {
      showAlert(error.message || 'Login failed', 'error');
    }
  };

  const handleCandidateLogout = async () => {
    try {
      await logoutCandidate();
      showAlert('Logged out successfully', 'success');
    } catch (error: any) {
      showAlert(error.message || 'Logout failed', 'error');
    }
  };

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
    setActiveTab('allbookings');
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

  const handleCandidateRegistration = async (candidateName: string, email: string, phone: string, date: string, time: string, company: string, duration: string, round?: string, interviewStatus?: string) => {
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
        interviewStatus,
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

  const handleUpdateStatus = async (slotId: string, newStatus: string, reason?: string, room?: string) => {
    try {
      const updates: any = { status: newStatus as InterviewSlot['status'] };
      if (reason) updates.reason = reason;
      if (room) updates.room = room;

      await updateSlot(slotId, updates);
      const updated = slots.map(slot =>
        slot.id === slotId
          ? { ...slot, status: newStatus as InterviewSlot['status'], ...(reason && { reason }), ...(room && { room }) }
          : slot
      );
      updateSlots(updated);
      const statusMsg = newStatus === 'confirmed' ? 'Interview confirmed! Room allocated.' : `Interview status updated to ${newStatus}`;
      showAlert(statusMsg);
    } catch (error) {
      showAlert('Failed to update status. Please try again.', 'error');
      console.error(error);
    }
  };

  const handleMarkCompleted = async (slotId: string, supportPerson: string, hrName: string, panelName: string, hrNumber: string, feedback: string, comments: string) => {
    try {
      const updates: any = {
        status: 'completed' as const,
        supportPerson,
        hrName,
        panelName,
        hrNumber,
        feedback,
        completedAt: new Date().toISOString()
      };
      if (comments) updates.comments = comments;

      await updateSlot(slotId, updates);
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
              ...(comments && { comments }),
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

  const handleUpdateInterviewStatus = async (slotId: string, interviewStatus: string) => {
    try {
      await updateSlot(slotId, { interviewStatus });
      const updated = slots.map(slot =>
        slot.id === slotId
          ? { ...slot, interviewStatus }
          : slot
      );
      updateSlots(updated);
      showAlert('Interview status updated successfully!');
    } catch (error) {
      showAlert('Failed to update interview status. Please try again.', 'error');
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

  // Show login page if neither admin nor candidate is logged in
  if (!isAdmin && !candidateUser) {
    return (
      <div className="min-h-screen py-8 px-4">
        <LoginPage
          onShowCandidateLogin={() => setShowLoginForm(true)}
          onShowAdminLogin={() => setShowAdminLogin(true)}
        />
        {showLoginForm && (
          <LoginForm
            onLogin={handleCandidateLogin}
            onBack={() => setShowLoginForm(false)}
          />
        )}
        {showAdminLogin && !isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 w-full max-w-sm shadow-2xl">
              <button
                type="button"
                onClick={() => setShowAdminLogin(false)}
                className="mb-4 text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                ← Back
              </button>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Header />

        {alert && <Alert message={alert.message} type={alert.type} />}

        {/* Logout Button */}
        <div className="mt-4 flex justify-end gap-2">
          {candidateUser && (
            <button
              onClick={handleCandidateLogout}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all"
            >
              👤 Candidate Logout
            </button>
          )}
          {isAdmin && (
            <button
              onClick={handleAdminLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all"
            >
              🔐 Admin Logout
            </button>
          )}
        </div>

        {/* Candidate Login Form */}
        {showLoginForm && (
          <LoginForm onLogin={handleCandidateLogin} />
        )}

        {/* Admin Login Modal */}
        {showAdminLogin && !isAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 w-full max-w-sm shadow-2xl">
              <button
                type="button"
                onClick={() => setShowAdminLogin(false)}
                className="mb-4 text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                ← Back
              </button>
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
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} isCandidateLoggedIn={!!candidateUser} />

          <div className="p-8">
            {activeTab === 'book' && (candidateUser || isAdmin) && (
              <BookTab
                onBook={handleCandidateRegistration}
                candidateEmail={candidateUser?.email || ''}
                candidateName={candidateProfile?.name || candidateUser?.displayName || ''}
                candidatePhone={candidateProfile?.phone || ''}
              />
            )}

            {activeTab === 'mybookings' && (candidateUser || isAdmin) && (
              <MyBookingsTab
                slots={slots}
                onReschedule={handleRescheduleBooking}
                onCancel={handleCancelBookingWithReason}
                onMarkCompleted={handleMarkCompleted}
                onUpdateInterviewStatus={handleUpdateInterviewStatus}
                candidateEmail={candidateUser?.email || (isAdmin ? 'admin@system' : '') || ''}
              />
            )}

            {activeTab === 'tomorrow' && (candidateUser || isAdmin) && (
              <TomorrowScheduleTab slots={slots} />
            )}

            {activeTab === 'allbookings' && (
              <AllBookingsTab slots={slots} />
            )}

            {activeTab === 'feedbackanalytics' && isAdmin && (
              <FeedbackAnalyticsTab slots={slots} />
            )}

            {activeTab === 'confirmedslots' && isAdmin && (
              <ManageConfirmedSlotsTab slots={slots} onUpdateStatus={handleUpdateStatus} onDeleteSlot={handleDeleteSlot} />
            )}

            {activeTab === 'cancelled' && isAdmin && (
              <CancelledInterviewsTab slots={slots} onDeleteSlot={handleDeleteSlot} />
            )}

            {activeTab === 'admin' && (
              <AdminTab
                slots={slots}
                onDeleteSlot={handleDeleteSlot}
                onCancelBooking={handleCancelBooking}
                onUpdateStatus={handleUpdateStatus}
                onRegisterCandidate={handleAdminRegisterCandidate}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
