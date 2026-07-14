'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';
import SlotCard from '@/components/SlotCard';

interface CancelledInterviewsTabProps {
  slots: InterviewSlot[];
  onDeleteSlot: (slotId: string) => Promise<void> | void;
}

export default function CancelledInterviewsTab({ slots, onDeleteSlot }: CancelledInterviewsTabProps) {
  const [filterDate, setFilterDate] = useState('');

  const cancelledSlots = slots.filter(slot => slot.status === 'cancelled' && slot.candidateName);

  const filteredSlots = (filterDate
    ? cancelledSlots.filter(slot => slot.date === filterDate)
    : cancelledSlots
  );

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const m = minutes;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHours = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHours}:${m} ${period}`;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">❌ Cancelled Interviews</h2>
      <p className="text-slate-400 mb-6">View and manage cancelled interview bookings</p>

      {cancelledSlots.length > 0 && (
        <div className="bg-red-900/30 border-l-4 border-red-500 rounded p-4 mb-6">
          <p className="text-red-300 font-semibold">❌ {cancelledSlots.length} Cancelled Interview(s)</p>
          <p className="text-red-200 text-sm">Total cancelled bookings</p>
        </div>
      )}

      {/* Date Filter */}
      {cancelledSlots.length > 0 && (
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
          <p className="text-xs text-slate-400 mt-2">Showing {filteredSlots.length} of {cancelledSlots.length} cancelled bookings</p>
        </div>
      )}

      {cancelledSlots.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-slate-400 text-lg mb-2">No cancelled interviews</p>
          <p className="text-slate-500 text-sm">All bookings are active or completed</p>
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No cancelled bookings found for the selected date</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSlots.map(slot => (
            <SlotCard key={slot.id} slot={slot} showCandidate={true}>
              <div className="mt-4 space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-600">
                {slot.reason && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-1">📝 Cancellation Reason</label>
                    <p className="text-slate-300 text-sm bg-slate-700/50 p-2 rounded">{slot.reason}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="flex-1 text-xs text-slate-400">
                    📅 {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })} @ {formatTime(slot.time)}
                  </div>
                  <button
                    onClick={() => onDeleteSlot(slot.id)}
                    className="px-4 py-2 bg-red-900/50 hover:bg-red-800/70 text-red-300 hover:text-red-100 rounded-lg font-semibold transition-all border border-red-500/50 whitespace-nowrap"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </SlotCard>
          ))}
        </div>
      )}
    </div>
  );
}
