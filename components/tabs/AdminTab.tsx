'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';
import SlotCard from '@/components/SlotCard';
import { exportToJSON, exportToCSV } from '@/lib/storage';

interface AdminTabProps {
  slots: InterviewSlot[];
  onAddSlot: (date: string, time: string, company: string, duration: string, round?: string) => Promise<void> | void;
  onDeleteSlot: (slotId: string) => Promise<void> | void;
  onCancelBooking: (slotId: string) => Promise<void> | void;
  onUpdateStatus: (slotId: string, status: string, reason?: string) => Promise<void> | void;
  onClearAllSlots?: () => void;
  onRegisterCandidate?: (name: string, email: string, phone: string, password: string) => Promise<void> | void;
}

export default function AdminTab({
  slots,
  onAddSlot,
  onDeleteSlot,
  onCancelBooking,
  onUpdateStatus,
  onRegisterCandidate,
}: AdminTabProps) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    company: '',
    duration: '',
    round: '',
  });

  const [candidateFormData, setCandidateFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [filterDate, setFilterDate] = useState('');

  // Detect conflicts
  const getConflicts = () => {
    const conflicts: Record<string, string[]> = {};
    const pendingSlots = slots.filter(slot => slot.status === 'pending' || !slot.status);

    pendingSlots.forEach(slot => {
      const conflictingSlots = pendingSlots.filter(
        other => other.id !== slot.id && other.date === slot.date && other.time === slot.time
      );
      if (conflictingSlots.length > 0) {
        conflicts[slot.id] = conflictingSlots.map(s => s.id);
      }
    });
    return conflicts;
  };

  const conflicts = getConflicts();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.date && formData.time && formData.company && formData.duration && formData.round) {
      onAddSlot(formData.date, formData.time, formData.company, formData.duration, formData.round);
      setFormData({ date: '', time: '', company: '', duration: '', round: '' });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCandidateFormChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setCandidateFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (candidateFormData.name && candidateFormData.email && candidateFormData.phone && candidateFormData.password && onRegisterCandidate) {
      onRegisterCandidate(candidateFormData.name, candidateFormData.email, candidateFormData.phone, candidateFormData.password);
      setCandidateFormData({ name: '', email: '', phone: '', password: '' });
    }
  };

  const handleClearAllData = async () => {
    const confirmed = window.confirm('⚠️ WARNING!\n\nThis will DELETE ALL interview slots!\n\nMake sure you exported data first!\n\nContinue?');
    if (confirmed) {
      try {
        // Delete all slots
        await Promise.all(slots.map(slot => Promise.resolve(onDeleteSlot(slot.id))));
        alert('✅ All data cleared successfully!');
      } catch (error) {
        alert('❌ Error clearing data. Please try again.');
        console.error(error);
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Admin Panel</h2>

      {/* Register Candidate Section */}
      <div className="bg-blue-900/30 rounded-xl p-6 mb-8 border border-blue-600">
        <h3 className="text-xl font-semibold text-blue-300 mb-4">👤 Register New Candidate</h3>
        <form onSubmit={handleRegisterCandidate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                className="input-field"
                placeholder="John Doe"
                value={candidateFormData.name}
                onChange={handleCandidateFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                className="input-field"
                placeholder="candidate@example.com"
                value={candidateFormData.email}
                onChange={handleCandidateFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                className="input-field"
                placeholder="+1 (555) 123-4567"
                value={candidateFormData.phone}
                onChange={handleCandidateFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                className="input-field"
                placeholder="••••••••"
                value={candidateFormData.password}
                onChange={handleCandidateFormChange}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            Register Candidate
          </button>
        </form>
      </div>


      <div className="flex gap-4 mb-8 flex-wrap">
        <button
          onClick={() => exportToJSON(slots)}
          className="btn-secondary"
        >
          📥 Export JSON
        </button>
        <button
          onClick={() => exportToCSV(slots)}
          className="btn-secondary"
        >
          📊 Export CSV
        </button>
        <button
          onClick={handleClearAllData}
          className="btn-danger"
        >
          🗑️ Clear All Data
        </button>
      </div>

      <h3 className="text-xl font-semibold text-white mb-4">⏳ Manage Pending Slots</h3>
      <p className="text-slate-400 text-sm mb-4">Showing interviews awaiting confirmation</p>

      {/* Date Filter */}
      <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">📅 Select Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input-field w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilterDate('')}
              className="w-full py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
            >
              Clear Filter
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Showing {slots.filter(slot => (slot.status === 'pending' || !slot.status) && (!filterDate || slot.date === filterDate)).length} pending slots
        </p>
      </div>

      {slots.filter(slot => (slot.status === 'pending' || !slot.status) && (!filterDate || slot.date === filterDate)).length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No pending slots. All interviews are confirmed or cancelled! ✅</p>
        </div>
      ) : (
        <div className="space-y-4">
          {slots.filter(slot => (slot.status === 'pending' || !slot.status) && (!filterDate || slot.date === filterDate)).map(slot => (
            <div key={slot.id}>
              {conflicts[slot.id] && (
                <div className="mb-2 p-3 bg-red-900/30 border-l-4 border-red-500 rounded flex items-center gap-2">
                  <span className="text-red-400 font-semibold">⚠️ Scheduling Conflict!</span>
                  <span className="text-red-300 text-sm">{conflicts[slot.id].length} candidate(s) at same time</span>
                </div>
              )}
            <SlotCard key={slot.id} slot={slot} showCandidate={true}>
              {slot.candidateName && (
                <div className="mt-4 space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-600">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Interview Status
                    </label>
                    <select
                      className="input-field mb-2"
                      value={slot.status || 'pending'}
                      onChange={e => {
                        console.log('Updating status to:', e.target.value);
                        onUpdateStatus(slot.id, e.target.value);
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="postponed">Postponed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {(slot.status === 'cancelled' || slot.status === 'postponed') && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Reason
                      </label>
                      <textarea
                        className="input-field"
                        placeholder="Add reason for cancellation/postponement"
                        rows={2}
                        value={slot.reason || ''}
                        onChange={e => {
                          // This would need a separate handler in Dashboard
                          console.log('Reason updated:', e.target.value);
                        }}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => onCancelBooking(slot.id)}
                      className="btn-danger flex-1 text-sm"
                    >
                      Force Cancel
                    </button>
                    <button
                      onClick={() => onDeleteSlot(slot.id)}
                      className="btn-danger flex-1 text-sm"
                    >
                      Delete Slot
                    </button>
                  </div>
                </div>
              )}

              {!slot.candidateName && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => onDeleteSlot(slot.id)}
                    className="btn-danger w-full"
                  >
                    Delete Slot
                  </button>
                </div>
              )}
            </SlotCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
