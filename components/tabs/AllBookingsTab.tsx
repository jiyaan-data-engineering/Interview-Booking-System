'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';

interface AllBookingsTabProps {
  slots: InterviewSlot[];
}

export default function AllBookingsTab({ slots }: AllBookingsTabProps) {
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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const m = minutes;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHours = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHours}:${m} ${period}`;
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

  const bookedSlots = slots.filter(slot => slot.candidateName);

  const uniqueCandidates = [...new Set(bookedSlots.map(s => s.candidateName))].sort();

  const filteredSlots = (filterDate
    ? bookedSlots.filter(slot => slot.date === filterDate)
    : bookedSlots
  ).filter(slot => !filterCandidate || slot.candidateName === filterCandidate)
   .filter(slot => !filterTime || slot.time === filterTime)
   .sort((a, b) => {
    const dateA = new Date(a.date + 'T00:00:00').getTime();
    const dateB = new Date(b.date + 'T00:00:00').getTime();
    if (dateA !== dateB) {
      return dateB - dateA;
    }
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });

  // Detect time conflicts and overlaps (for selected date only)
  const getAllConflicts = () => {
    const conflicts: {
      time: string;
      candidates: string[];
      date: string;
      type: string;
      details: { name: string; startTime: string; endTime: string; duration: string }[]
    }[] = [];
    const processed = new Set<string>();

    // Filter slots by selected date
    const slotsToCheck = filterDate
      ? bookedSlots.filter(slot => slot.date === filterDate)
      : bookedSlots;

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
          conflicts.push({
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
    return conflicts.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  };

  let timeConflicts = getAllConflicts();

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-900/30 border-green-500 text-green-300';
      case 'pending':
        return 'bg-yellow-900/30 border-yellow-500 text-yellow-300';
      case 'cancelled':
        return 'bg-red-900/30 border-red-500 text-red-300';
      case 'postponed':
        return 'bg-orange-900/30 border-orange-500 text-orange-300';
      case 'completed':
        return 'bg-blue-900/30 border-blue-500 text-blue-300';
      default:
        return 'bg-yellow-900/30 border-yellow-500 text-yellow-300';
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (bookedSlots.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-4">📭</div>
        <p className="text-slate-400 text-lg mb-2">No interview bookings yet</p>
        <p className="text-slate-500">Check back soon!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">📋 All Interview Bookings</h2>
      <p className="text-slate-400 mb-6">View all scheduled interviews (read-only)</p>

      {/* Date, Candidate & Time Filter */}
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
        <p className="text-xs text-slate-400 mt-2">Showing {filteredSlots.length} of {bookedSlots.length} bookings</p>
      </div>


      {filteredSlots.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No bookings found for the selected date range</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSlots.map(slot => (
          <div key={slot.id} className="slot-card">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="text-sm text-slate-400 font-semibold mb-2">👤 {slot.candidateName}</div>
                <div className="text-2xl font-bold text-purple-400 mb-2">
                  {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  @ {formatTime(slot.time)}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(slot.status)}`}>
                {getStatusLabel(slot.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-slate-400 text-sm font-semibold mb-1">Company</div>
                <div className="text-white text-lg">{slot.company}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm font-semibold mb-1">Duration</div>
                <div className="text-white text-lg">{slot.duration}</div>
              </div>
              {slot.round && (
                <div>
                  <div className="text-slate-400 text-sm font-semibold mb-1">Round</div>
                  <div className="text-white text-lg">{slot.round}</div>
                </div>
              )}
              {slot.room && (
                <div>
                  <div className="text-slate-400 text-sm font-semibold mb-1">🚪 Room</div>
                  <div className="text-white text-lg font-bold bg-green-900/50 px-3 py-1 rounded inline-block">{slot.room}</div>
                </div>
              )}
              <div>
                <div className="text-slate-400 text-sm font-semibold mb-1">📋 Interview Invite Status</div>
                <div className="text-white text-lg font-semibold bg-blue-900/50 px-3 py-1 rounded inline-block">{slot.interviewStatus || 'N/A'}</div>
              </div>
            </div>

          </div>
        ))}
        </div>
      )}
    </div>
  );
}
