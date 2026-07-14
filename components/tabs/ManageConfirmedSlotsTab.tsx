'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';

interface ManageConfirmedSlotsTabProps {
  slots: InterviewSlot[];
  onUpdateStatus: (slotId: string, status: string, reason?: string, room?: string) => Promise<void> | void;
}

export default function ManageConfirmedSlotsTab({ slots, onUpdateStatus }: ManageConfirmedSlotsTabProps) {
  const [roomAllocation, setRoomAllocation] = useState<Record<string, string>>({});
  const [filterDate, setFilterDate] = useState('');

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const m = minutes;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHours = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHours}:${m} ${period}`;
  };

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
        <div className="space-y-2">
          {filteredSlots.map((slot, index) => (
            <div
              key={slot.id}
              className="p-4 rounded-lg border-2 bg-green-900/30 border-green-500 flex justify-between items-start gap-4"
            >
              <div className="flex-1">
                <div className="text-xl font-bold text-white mb-3">
                  <span className="bg-purple-600 px-3 py-1 rounded-full mr-3 text-lg">{index + 1}</span>
                  ⏰ {formatTime(slot.time)} - ✅ {slot.candidateName}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 text-sm">
                  <div>
                    <span className="text-slate-400 font-semibold">🏢 Company:</span>
                    <div className="text-white">{slot.company}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">⏱️ Duration:</span>
                    <div className="text-white">{slot.duration}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">📋 Round:</span>
                    <div className="text-white">{slot.round || '-'}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">📅 Date:</span>
                    <div className="text-white">{slot.date}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">🚪 Room Allocation</label>
                    <div className="flex gap-2">
                      <select
                        className="input-field flex-1 text-sm"
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
                        className="btn-success flex-0 whitespace-nowrap text-sm px-3 py-1"
                      >
                        Save
                      </button>
                    </div>
                    {slot.room && (
                      <div className="mt-2 p-2 bg-green-900/50 border border-green-400 rounded text-center">
                        <p className="text-green-300 text-sm font-bold">✅ {slot.room}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">📋 Status</label>
                    <select
                      className="input-field w-full text-sm"
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
