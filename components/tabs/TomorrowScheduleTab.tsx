'use client';

import { InterviewSlot } from '@/lib/types';

interface TomorrowScheduleTabProps {
  slots: InterviewSlot[];
}

export default function TomorrowScheduleTab({ slots }: TomorrowScheduleTabProps) {
  // Get tomorrow's date (local timezone, not UTC)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowDateStr = `${year}-${month}-${day}`;

  // Filter for ALL tomorrow's slots (both booked and available), sorted by time
  const tomorrowSlots = slots
    .filter(slot => slot.date === tomorrowDateStr)
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
          <div className="text-3xl mb-4">📭</div>
          <p className="text-slate-400 text-lg mb-2">No time slots available for tomorrow</p>
          <p className="text-slate-500">Please create slots first</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tomorrowSlots.map((slot, index) => {
            const isBooked = slot.candidateName && slot.candidateEmail;
            return (
              <div
                key={slot.id}
                className={`p-4 rounded-lg border-2 flex justify-between items-center transition-all ${
                  isBooked
                    ? 'bg-green-900/30 border-green-500'
                    : 'bg-slate-800/50 border-slate-600'
                }`}
              >
                <div className="flex-1">
                  <div className="text-xl font-bold text-white mb-2">
                    <span className="bg-purple-600 px-3 py-1 rounded-full mr-3 text-lg">{index + 1}</span>
                    ⏰ {formatTime(slot.time)} - {isBooked ? '✅ Booked' : '🔓 Available'}
                  </div>
                  {isBooked && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-slate-400 font-semibold">👤 Candidate:</span>
                        <div className="text-white">{slot.candidateName}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">🏢 Company:</span>
                        <div className="text-white">{slot.company}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">⏱️ Duration:</span>
                        <div className="text-white">{slot.duration}</div>
                      </div>
                      {slot.round && (
                        <div>
                          <span className="text-slate-400 font-semibold">📋 Round:</span>
                          <div className="text-white">{slot.round}</div>
                        </div>
                      )}
                      {slot.room && (
                        <div>
                          <span className="text-slate-400 font-semibold">🚪 Room:</span>
                          <div className="text-green-300 font-bold">{slot.room}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold border ml-4 whitespace-nowrap ${getStatusColor(slot.status)}`}>
                  {isBooked ? getStatusLabel(slot.status) : '🔓 Open'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
