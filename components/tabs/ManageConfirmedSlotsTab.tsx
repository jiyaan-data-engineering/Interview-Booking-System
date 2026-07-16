'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';
import SlotCard from '@/components/SlotCard';

interface ManageConfirmedSlotsTabProps {
  slots: InterviewSlot[];
  onUpdateStatus: (slotId: string, status: string, reason?: string, room?: string) => Promise<void> | void;
  onDeleteSlot: (slotId: string) => Promise<void> | void;
}

export default function ManageConfirmedSlotsTab({ slots, onUpdateStatus, onDeleteSlot }: ManageConfirmedSlotsTabProps) {
  const [roomAllocation, setRoomAllocation] = useState<Record<string, string>>({});
  const [filterDate, setFilterDate] = useState('');
  const [filterCandidate, setFilterCandidate] = useState('');
  const [filterTime, setFilterTime] = useState('');

  const getTimeSlotOptions = () => {
    const slots: { label: string; value: string }[] = [];
    for (let h = 6; h < 22; h++) {
      for (let m of [0, 30]) {
        const hours = String(h).padStart(2, '0');
        const minutes = String(m).padStart(2, '0');
        const timeValue = `${hours}:${minutes}`;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHours = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const label = `${displayHours}:${minutes} ${period}`;
        slots.push({ label, value: timeValue });
      }
    }
    return slots;
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':');
    return parseInt(hours) * 60 + parseInt(minutes);
  };

  const parseDuration = (duration: string) => {
    const lowerDur = duration.toLowerCase();
    if (lowerDur.includes('15')) return 15;
    if (lowerDur.includes('30')) return 30;
    if (lowerDur.includes('45')) return 45;
    if (lowerDur.includes('1.5')) return 90;
    if (lowerDur.includes('2 hour')) return 120;
    if (lowerDur.includes('1 hour')) return 60;
    return 30; // default
  };

  const hasTimeOverlap = (slot1: InterviewSlot, slot2: InterviewSlot) => {
    if (slot1.date !== slot2.date) return false;

    const start1 = timeToMinutes(slot1.time);
    const start2 = timeToMinutes(slot2.time);
    const end1 = start1 + parseDuration(slot1.duration || '30 min');
    const end2 = start2 + parseDuration(slot2.duration || '30 min');

    // Check if they overlap
    return start1 < end2 && start2 < end1;
  };

  const getTodayAndTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    return { tomorrowStr };
  };

  const { tomorrowStr } = getTodayAndTomorrow();

  // Show all confirmed slots, default filter to tomorrow
  const confirmedSlots = slots.filter(slot => slot.status === 'confirmed' && slot.candidateName);

  const uniqueCandidates = [...new Set(confirmedSlots.map(s => s.candidateName))].sort();

  const filteredSlots = (filterDate
    ? confirmedSlots.filter(slot => slot.date === filterDate)
    : confirmedSlots.filter(slot => slot.date === tomorrowStr)
  ).filter(slot => !filterCandidate || slot.candidateName === filterCandidate)
   .filter(slot => !filterTime || slot.time === filterTime)
   .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  // Get conflicts for selected date only (or all if no date selected)
  const getAllTimeConflicts = () => {
    const timeConflicts: {
      time: string;
      candidates: string[];
      date: string;
      type: string;
      details: { name: string; startTime: string; endTime: string; duration: string }[]
    }[] = [];
    const processed = new Set<string>();

    // Filter slots by selected date
    const slotsToCheck = filterDate
      ? confirmedSlots.filter(slot => slot.date === filterDate)
      : confirmedSlots;

    const getEndTime = (startTimeStr: string, durationStr: string) => {
      const start = timeToMinutes(startTimeStr);
      const duration = parseDuration(durationStr || '30 min');
      const endMinutes = start + duration;
      const hours = Math.floor(endMinutes / 60);
      const mins = endMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    for (let i = 0; i < slotsToCheck.length; i++) {
      for (let j = i + 1; j < slotsToCheck.length; j++) {
        const slot1 = slotsToCheck[i];
        const slot2 = slotsToCheck[j];
        const key = `${slot1.id}-${slot2.id}`;

        if (!processed.has(key) && hasTimeOverlap(slot1, slot2)) {
          processed.add(key);
          const isExactConflict = slot1.time === slot2.time;
          timeConflicts.push({
            time: slot1.time,
            candidates: [slot1.candidateName, slot2.candidateName],
            date: slot1.date,
            type: isExactConflict ? 'Exact Conflict' : 'Overlap',
            details: [
              {
                name: slot1.candidateName,
                startTime: formatTime(slot1.time),
                endTime: formatTime(getEndTime(slot1.time, slot1.duration)),
                duration: slot1.duration || '30 min'
              },
              {
                name: slot2.candidateName,
                startTime: formatTime(slot2.time),
                endTime: formatTime(getEndTime(slot2.time, slot2.duration)),
                duration: slot2.duration || '30 min'
              }
            ]
          });
        }
      }
    }

    // Sort by time in ascending order
    return timeConflicts.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const m = minutes;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHours = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHours}:${m} ${period}`;
  };

  const timeConflicts = getAllTimeConflicts();

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

      {/* Date, Candidate & Time Filter */}
      {confirmedSlots.length > 0 && (
        <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">📅 Select Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">👤 Filter by Candidate</label>
              <select
                value={filterCandidate}
                onChange={(e) => setFilterCandidate(e.target.value)}
                className="input-field w-full"
              >
                <option value="">-- All Candidates --</option>
                {uniqueCandidates.map(candidate => (
                  <option key={candidate} value={candidate}>{candidate}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">⏰ Select Time</label>
              <select
                value={filterTime}
                onChange={(e) => setFilterTime(e.target.value)}
                className="input-field w-full"
              >
                <option value="">-- All Times --</option>
                {getTimeSlotOptions().map(slot => (
                  <option key={slot.value} value={slot.value}>{slot.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterDate('');
                  setFilterCandidate('');
                  setFilterTime('');
                }}
                className="w-full py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
              >
                Clear Filters
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
          {filteredSlots.map((slot) => {
            const slotConflicts = timeConflicts.filter(c =>
              c.details.some(d => d.name === slot.candidateName) &&
              c.time === slot.time
            );
            return (
            <div key={slot.id}>
            <SlotCard slot={slot} showCandidate={true}>
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
                    <button
                      onClick={() => onDeleteSlot(slot.id)}
                      className="px-4 py-2 bg-red-900/50 hover:bg-red-800/70 text-red-300 hover:text-red-100 rounded-lg font-semibold transition-all border border-red-500/50 whitespace-nowrap"
                    >
                      🗑️ Delete
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

            {slotConflicts.length > 0 && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-lg">⚠️</span>
                  <div className="w-full">
                    <div className="text-red-300 font-semibold mb-2">Time Conflict Alert!</div>
                    {slotConflicts.map((conflict, idx) => (
                      <div key={idx} className="text-red-200 text-sm mb-2 pb-2 border-b border-red-700/50 last:border-b-0">
                        <div className="flex items-center gap-2 mb-1">
                          <strong>{formatTime(conflict.time)}</strong>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            conflict.type === 'Exact Conflict'
                              ? 'bg-red-600 text-red-100'
                              : 'bg-orange-600 text-orange-100'
                          }`}>
                            {conflict.type}
                          </span>
                        </div>
                        <div className="ml-4 space-y-1">
                          {conflict.details.map((detail, dIdx) => (
                            <div key={dIdx} className="text-red-100 text-xs bg-slate-900/50 p-2 rounded">
                              <div className="font-semibold">{detail.name}</div>
                              <div className="text-red-200">
                                {detail.startTime} - {detail.endTime} ({detail.duration})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            </div>
            );
            })}
        </div>
      )}
    </div>
  );
}
