'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';

interface AllBookingsTabProps {
  slots: InterviewSlot[];
}

export default function AllBookingsTab({ slots }: AllBookingsTabProps) {
  const [filterDate, setFilterDate] = useState('');

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

  const bookedSlots = slots.filter(slot => slot.candidateName);

  const filteredSlots = (filterDate
    ? bookedSlots.filter(slot => slot.date === filterDate)
    : bookedSlots
  ).sort((a, b) => {
    const dateA = new Date(a.date + 'T00:00:00').getTime();
    const dateB = new Date(b.date + 'T00:00:00').getTime();
    if (dateA !== dateB) {
      return dateB - dateA;
    }
    return timeToMinutes(a.time) - timeToMinutes(b.time);
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
            </div>

          </div>
        ))}
        </div>
      )}
    </div>
  );
}
