'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';

interface TomorrowScheduleTabProps {
  slots: InterviewSlot[];
}

export default function TomorrowScheduleTab({ slots }: TomorrowScheduleTabProps) {
  const [filterName, setFilterName] = useState('');
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

    return start1 < end2 && start2 < end1;
  };

  const getEndTime = (startTimeStr: string, durationStr: string) => {
    const start = timeToMinutes(startTimeStr);
    const duration = parseDuration(durationStr || '30 min');
    const endMinutes = start + duration;
    const hours = Math.floor(endMinutes / 60);
    const mins = endMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const tomorrowDate = getTomorrowDate();

  // Tomorrow's confirmed interviews
  const tomorrowConfirmedSlots = slots.filter(
    slot => slot.date === tomorrowDate && slot.candidateName && slot.status === 'confirmed'
  ).sort((a, b) => {
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });

  const filteredTomorrowSlots = tomorrowConfirmedSlots.filter(slot => {
    const matchesName = slot.candidateName.toLowerCase().includes(filterName.toLowerCase());
    const matchesTime = !filterTime || slot.time === filterTime;
    return matchesName && matchesTime;
  });

  // Get unique candidates and their count
  const candidateCount = new Map<string, number>();
  tomorrowConfirmedSlots.forEach(slot => {
    if (slot.candidateName) {
      candidateCount.set(slot.candidateName, (candidateCount.get(slot.candidateName) || 0) + 1);
    }
  });

  // Detect time conflicts and overlaps
  const getAllConflicts = () => {
    const conflicts: {
      time: string;
      candidates: string[];
      type: string;
      details: { name: string; startTime: string; endTime: string; duration: string }[]
    }[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < tomorrowConfirmedSlots.length; i++) {
      for (let j = i + 1; j < tomorrowConfirmedSlots.length; j++) {
        const slot1 = tomorrowConfirmedSlots[i];
        const slot2 = tomorrowConfirmedSlots[j];
        const key = `${slot1.id}-${slot2.id}`;

        if (!processed.has(key) && hasTimeOverlap(slot1, slot2)) {
          processed.add(key);
          const isExactConflict = slot1.time === slot2.time;
          conflicts.push({
            time: slot1.time,
            candidates: [slot1.candidateName, slot2.candidateName],
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

    return conflicts.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  };

  const timeConflicts = getAllConflicts();

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

  return (
    <div>
      {/* Tomorrow's Schedule Section */}
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📅</span>
          Tomorrow's Schedule - Confirmed ({tomorrowDate})
        </h3>

        <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">👤 Filter by Candidate</label>
              <select
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="">-- All Candidates --</option>
                {Array.from(candidateCount.entries()).map(([name]) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">⏰ Select Time</label>
              <select
                value={filterTime}
                onChange={(e) => setFilterTime(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
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
                  setFilterName('');
                  setFilterTime('');
                }}
                className="w-full py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {tomorrowConfirmedSlots.length === 0 ? (
          <div className="text-center py-8 bg-slate-800/50 rounded-lg">
            <div className="text-3xl mb-4">📭</div>
            <p className="text-slate-400">No confirmed interviews scheduled for tomorrow</p>
          </div>
        ) : (
          <>
            {timeConflicts.length > 0 && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="w-full">
                    <div className="text-red-300 font-semibold mb-3">Time Conflict Alert!</div>
                    {timeConflicts.map((conflict, idx) => (
                      <div key={idx} className="text-red-200 text-sm mb-3 pb-3 border-b border-red-700/50 last:border-b-0">
                        <div className="flex items-center gap-2 mb-2">
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

            <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="text-slate-300 font-semibold mb-3">👥 Candidate Breakdown:</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from(candidateCount.entries()).map(([name, count]) => (
                  <div key={name} className="bg-slate-700 rounded-lg p-3 text-center border border-slate-600">
                    <div className="text-white font-semibold text-sm truncate">{name}</div>
                    <div className="text-blue-400 text-lg font-bold">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-slate-400 mb-6 font-semibold">Confirmed interviews sorted by time (6AM - 11PM) | Total: {filteredTomorrowSlots.length}</p>
            {filteredTomorrowSlots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">No candidates match your search</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTomorrowSlots.map((slot, index) => (
                <div key={slot.id} className="slot-card">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="text-xl font-bold text-white mb-2">
                  <span className="bg-purple-600 px-3 py-1 rounded-full mr-3 text-lg font-bold">{index + 1}</span>
                  {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  @ {formatTime(slot.time)}
                </div>
                <div className="text-sm text-slate-400 font-semibold">👤 {slot.candidateName}</div>
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
              {slot.interviewStatus && (
                <div>
                  <div className="text-slate-400 text-sm font-semibold mb-1">📋 Interview Invite Status</div>
                  <div className="text-white text-lg font-semibold bg-blue-900/50 px-3 py-1 rounded inline-block">{slot.interviewStatus}</div>
                </div>
              )}
            </div>
          </div>
                ))}
              </div>
            )}
          </>
        )}
    </div>
  );
}
