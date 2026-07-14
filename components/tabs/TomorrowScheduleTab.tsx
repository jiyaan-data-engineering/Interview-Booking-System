'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';

interface TomorrowScheduleTabProps {
  slots: InterviewSlot[];
}

export default function TomorrowScheduleTab({ slots }: TomorrowScheduleTabProps) {
  const [filterName, setFilterName] = useState('');

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

  const filteredTomorrowSlots = tomorrowConfirmedSlots.filter(slot =>
    slot.candidateName.toLowerCase().includes(filterName.toLowerCase())
  );

  // Get unique candidates and their count
  const candidateCount = new Map<string, number>();
  tomorrowConfirmedSlots.forEach(slot => {
    if (slot.candidateName) {
      candidateCount.set(slot.candidateName, (candidateCount.get(slot.candidateName) || 0) + 1);
    }
  });

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

        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-2">Filter by Candidate:</label>
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

        {tomorrowConfirmedSlots.length === 0 ? (
          <div className="text-center py-8 bg-slate-800/50 rounded-lg">
            <div className="text-3xl mb-4">📭</div>
            <p className="text-slate-400">No confirmed interviews scheduled for tomorrow</p>
          </div>
        ) : (
          <>
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
