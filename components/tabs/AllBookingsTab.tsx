'use client';

import { InterviewSlot } from '@/lib/types';
import SlotCard from '@/components/SlotCard';

interface AllBookingsTabProps {
  slots: InterviewSlot[];
}

export default function AllBookingsTab({ slots }: AllBookingsTabProps) {
  const bookedSlots = slots.filter(slot => slot.candidateName);

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

      <div className="space-y-4">
        {bookedSlots.map(slot => (
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
                  @ {slot.time}
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
            </div>

            {slot.candidateName && (
              <div className="bg-blue-900/30 border-l-4 border-blue-500 p-3 rounded">
                <div className="font-semibold text-white mb-1">{slot.candidateName}</div>
                <div className="text-blue-300 text-sm">{slot.candidateEmail}</div>
                <div className="text-blue-300 text-sm">{slot.candidatePhone}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
