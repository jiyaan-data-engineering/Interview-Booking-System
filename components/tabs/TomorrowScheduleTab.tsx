'use client';

import { InterviewSlot } from '@/lib/types';

interface TomorrowScheduleTabProps {
  slots: InterviewSlot[];
  candidateEmail?: string;
}

export default function TomorrowScheduleTab({ slots, candidateEmail }: TomorrowScheduleTabProps) {
  // Get tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

  // Filter for CONFIRMED tomorrow's bookings, sorted by time
  const tomorrowSlots = slots
    .filter(slot => {
      // Must have candidate info
      if (!slot.candidateName || !slot.candidateEmail) return false;
      // Must be tomorrow's date
      if (slot.date !== tomorrowDateStr) return false;
      // Only show confirmed interviews
      if (slot.status !== 'confirmed') return false;
      return true;
    })
    .sort((a, b) => a.time.localeCompare(b.time));

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
      <h2 className="text-2xl font-bold text-white mb-2">📆 Tomorrow's Schedule</h2>
      <p className="text-slate-400 mb-6">
        All interviews scheduled for {tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </p>

      {tomorrowSlots.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-3xl mb-4">🎉</div>
          <p className="text-slate-400 text-lg mb-2">No interviews scheduled for tomorrow</p>
          <p className="text-slate-500">You're all clear!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tomorrowSlots.map((slot, index) => (
            <div key={slot.id} className="slot-card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {index + 1}. {formatTime(slot.time)}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(slot.status)}`}>
                  {getStatusLabel(slot.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-slate-400 text-sm font-semibold mb-1">👤 Candidate Name</div>
                  <div className="text-white text-lg">{slot.candidateName}</div>
                </div>
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

              <div className="bg-blue-900/30 border-l-4 border-blue-500 p-3 rounded">
                <div className="text-blue-300 text-sm">
                  <span className="font-semibold">⏰ Interview at {formatTime(slot.time)}</span>
                  <br/>
                  <span className="text-xs mt-1 block">Status: {getStatusLabel(slot.status)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
