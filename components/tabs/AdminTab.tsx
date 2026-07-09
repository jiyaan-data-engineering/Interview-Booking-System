'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';
import SlotCard from '@/components/SlotCard';
import { exportToJSON, exportToCSV } from '@/lib/storage';

interface AdminTabProps {
  slots: InterviewSlot[];
  onAddSlot: (date: string, time: string, company: string, duration: string) => void;
  onDeleteSlot: (slotId: string) => void;
  onCancelBooking: (slotId: string) => void;
  onUpdateStatus: (slotId: string, status: string, reason?: string) => void;
  onClearAllSlots?: () => void;
}

export default function AdminTab({
  slots,
  onAddSlot,
  onDeleteSlot,
  onCancelBooking,
  onUpdateStatus,
}: AdminTabProps) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    company: '',
    duration: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.date && formData.time && formData.company && formData.duration) {
      onAddSlot(formData.date, formData.time, formData.company, formData.duration);
      setFormData({ date: '', time: '', company: '', duration: '' });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Admin Panel - Manage Slots</h2>

      <div className="bg-slate-700/50 rounded-xl p-6 mb-8 border border-slate-600">
        <h3 className="text-xl font-semibold text-white mb-4">Add New Interview Slot</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                className="input-field"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Time *
              </label>
              <input
                type="time"
                name="time"
                className="input-field"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="company"
                className="input-field"
                placeholder="e.g., TechCorp"
                value={formData.company}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Duration *
              </label>
              <select
                name="duration"
                className="input-field"
                value={formData.duration}
                onChange={handleChange}
                required
              >
                <option value="">Select Duration</option>
                <option value="15 min">15 minutes</option>
                <option value="30 min">30 minutes</option>
                <option value="45 min">45 minutes</option>
                <option value="1 hour">1 hour</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            Add Slot
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
          onClick={() => {
            const confirmed = window.confirm('⚠️ WARNING!\n\nThis will DELETE ALL interview slots!\n\nMake sure you exported data first!\n\nContinue?');
            if (confirmed) {
              slots.forEach(slot => {
                onDeleteSlot(slot.id);
              });
              alert('✅ All data cleared!');
            }
          }}
          className="btn-danger"
        >
          🗑️ Clear All Data
        </button>
      </div>

      <h3 className="text-xl font-semibold text-white mb-4">Manage Existing Slots</h3>
      {slots.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No slots yet. Add your first slot above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {slots.map(slot => (
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
                      onChange={e => onUpdateStatus(slot.id, e.target.value)}
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
          ))}
        </div>
      )}
    </div>
  );
}
