'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';
import SlotCard from '@/components/SlotCard';

interface ManageConfirmedSlotsTabProps {
  slots: InterviewSlot[];
  onUpdateStatus: (slotId: string, status: string, reason?: string, room?: string) => Promise<void> | void;
}

export default function ManageConfirmedSlotsTab({ slots, onUpdateStatus }: ManageConfirmedSlotsTabProps) {
  const [roomAllocation, setRoomAllocation] = useState<Record<string, string>>({});
  const [filterDate, setFilterDate] = useState('');

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':');
    return parseInt(hours) * 60 + parseInt(minutes);
  };

  const getTodayAndTomorrow = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    return { todayStr, tomorrowStr };
  };

  const { tomorrowStr } = getTodayAndTomorrow();

  // Show all confirmed slots, default filter to tomorrow
  const confirmedSlots = slots.filter(slot => slot.status === 'confirmed' && slot.candidateName);

  const filteredSlots = (filterDate
    ? confirmedSlots.filter(slot => slot.date === filterDate)
    : confirmedSlots.filter(slot => slot.date === tomorrowStr)
  ).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  // Detect time conflicts
  const getConflicts = () => {
    const conflicts: Record<string, string[]> = {};
    filteredSlots.forEach(slot => {
      const conflictingSlots = filteredSlots.filter(
        other => other.id !== slot.id && other.date === slot.date && other.time === slot.time
      );
      if (conflictingSlots.length > 0) {
        conflicts[slot.id] = conflictingSlots.map(s => s.id);
      }
    });
    return conflicts;
  };

  const conflicts = getConflicts();

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">✅ Manage Confirmed Slots</h2>
      <p className="text-slate-400 mb-6">Allocate rooms and manage confirmed interview bookings (Default: Tomorrow)</p>

      {filteredSlots.length > 0 && (
        <div className="bg-purple-900/30 border-l-4 border-purple-500 rounded p-4 mb-6">
          <p className="text-purple-300 font-semibold">✅ {filteredSlots.length} Confirmed Interview(s)</p>
          <p className="text-purple-200 text-sm">Sorted by time (6AM - 11PM)</p>
        </div>
      )}

      {/* Date Filter */}
      {confirmedSlots.length > 0 && (
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
          <p className="text-xs text-slate-400 mt-2">Showing {filteredSlots.length} of {confirmedSlots.length} confirmed bookings</p>
        </div>
      )}

      {filteredSlots.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-slate-400 text-lg mb-2">No confirmed bookings</p>
          <p className="text-slate-500 text-sm">Confirm pending interviews to manage them here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSlots.map((slot) => (
            <div key={slot.id}>
              {conflicts[slot.id] && (
                <div className="mb-2 p-3 bg-red-900/30 border-l-4 border-red-500 rounded flex items-center gap-2">
                  <span className="text-red-400 font-semibold">⚠️ Time Conflict Alert!</span>
                  <span className="text-red-300 text-sm">{conflicts[slot.id].length} candidate(s) at same time</span>
                </div>
              )}
            <SlotCard key={slot.id} slot={slot} showCandidate={true}>
              <div className="mt-4 space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-600">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">🚪 Room Allocation</label>
                  <div className="flex gap-2">
                    <select
                      className="input-field flex-1"
                      value={roomAllocation[slot.id] || slot.room || ''}
                      onChange={e => setRoomAllocation(prev => ({ ...prev, [slot.id]: e.target.value }))}
                    >
                      <option value="">Select Room</option>
                      <option value="ROOM-1">🚪 ROOM-1</option>
                      <option value="ROOM-2">🚪 ROOM-2</option>
                      <option value="ROOM-3">🚪 ROOM-3</option>
                    </select>
                    <button
                      onClick={() => {
                        const selectedRoom = roomAllocation[slot.id];
                        if (selectedRoom) {
                          onUpdateStatus(slot.id, 'confirmed', undefined, selectedRoom);
                        }
                      }}
                      className="btn-success whitespace-nowrap"
                    >
                      Save Room
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">📋 Update Status</label>
                  <select
                    className="input-field w-full"
                    value={slot.status || 'confirmed'}
                    onChange={e => onUpdateStatus(slot.id, e.target.value)}
                  >
                    <option value="confirmed">✅ Confirmed</option>
                    <option value="completed">✓ Completed</option>
                    <option value="postponed">⏸️ Postponed</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>
              </div>
            </SlotCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
