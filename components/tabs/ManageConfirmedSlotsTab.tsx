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

  const confirmedSlots = slots.filter(slot => slot.status === 'confirmed' && slot.candidateName);

  const filteredSlots = filterDate
    ? confirmedSlots.filter(slot => slot.date === filterDate)
    : confirmedSlots;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">✅ Manage Confirmed Slots</h2>
      <p className="text-slate-400 mb-6">Allocate rooms and manage confirmed interview bookings</p>

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
          {filteredSlots.map(slot => (
            <div key={slot.id}>
              <SlotCard slot={slot} showCandidate={true}>
                {slot.candidateName && (
                  <div className="mt-4 space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-600">
                    {/* Room Allocation */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        🚪 Room Allocation
                      </label>
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
                          className="btn-success flex-0 whitespace-nowrap"
                        >
                          Save Room
                        </button>
                      </div>
                      {slot.room && (
                        <div className="mt-2 p-2 bg-green-900/30 border border-green-500 rounded">
                          <p className="text-green-300 text-sm font-semibold">✅ Allocated: {slot.room}</p>
                        </div>
                      )}
                    </div>

                    {/* Status Management */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        📋 Manage Status
                      </label>
                      <select
                        className="input-field mb-2"
                        value={slot.status || 'confirmed'}
                        onChange={e => onUpdateStatus(slot.id, e.target.value)}
                      >
                        <option value="confirmed">✅ Confirmed</option>
                        <option value="completed">✓ Mark as Completed</option>
                        <option value="postponed">⏸️ Postpone</option>
                        <option value="cancelled">❌ Cancel</option>
                      </select>
                    </div>
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
