import { InterviewSlot } from '@/lib/types';

interface SlotCardProps {
  slot: InterviewSlot;
  children?: React.ReactNode;
  showCandidate?: boolean;
}

export default function SlotCard({ slot, children, showCandidate = true }: SlotCardProps) {
  const isBooked = !!slot.candidateName;
  const dateObj = new Date(slot.date + 'T00:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formatTimeWithAMPM = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-900/50 text-green-300 border border-green-500';
      case 'completed':
        return 'bg-blue-900/50 text-blue-300 border border-blue-500';
      case 'pending':
        return 'bg-yellow-900/50 text-yellow-300 border border-yellow-500';
      case 'cancelled':
        return 'bg-red-900/50 text-red-300 border border-red-500';
      case 'postponed':
        return 'bg-orange-900/50 text-orange-300 border border-orange-500';
      default:
        return 'bg-slate-700/50 text-slate-300 border border-slate-500';
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return isBooked ? 'Booked' : 'Available';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className={`slot-card ${isBooked ? 'booked' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="text-2xl font-bold text-purple-400">
          {formattedDate} @ {formatTimeWithAMPM(slot.time)}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(slot.status || 'pending')}`}>
          {getStatusLabel(slot.status)}
        </span>
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
      </div>

      {showCandidate && isBooked && (
        <div className="bg-blue-900/30 border-l-4 border-blue-500 p-3 mb-4 rounded space-y-2">
          <div>
            <div className="font-semibold text-white mb-1">{slot.candidateName}</div>
            <div className="text-blue-300 text-sm">{slot.candidateEmail}</div>
            <div className="text-blue-300 text-sm">{slot.candidatePhone}</div>
          </div>
          {(slot.supportPerson || slot.hrName || slot.panelName || slot.hrNumber) && (
            <div className="border-t border-blue-500/30 pt-2 space-y-1">
              {slot.supportPerson && (
                <div>
                  <div className="text-slate-400 text-xs font-semibold">Support Person</div>
                  <div className="text-green-300 font-semibold text-sm">{slot.supportPerson}</div>
                </div>
              )}
              {slot.hrName && (
                <div>
                  <div className="text-slate-400 text-xs font-semibold">HR Name</div>
                  <div className="text-green-300 font-semibold text-sm">{slot.hrName}</div>
                </div>
              )}
              {slot.panelName && (
                <div>
                  <div className="text-slate-400 text-xs font-semibold">Panel Name</div>
                  <div className="text-green-300 font-semibold text-sm">{slot.panelName}</div>
                </div>
              )}
              {slot.hrNumber && (
                <div>
                  <div className="text-slate-400 text-xs font-semibold">HR Number</div>
                  <div className="text-green-300 font-semibold text-sm">{slot.hrNumber}</div>
                </div>
              )}
              {slot.feedback && (
                <div>
                  <div className="text-slate-400 text-xs font-semibold">Feedback</div>
                  <div className={`font-semibold text-sm ${
                    slot.feedback === 'GOOD' ? 'text-green-300' :
                    slot.feedback === 'AVG' ? 'text-yellow-300' :
                    slot.feedback === 'BAD' ? 'text-red-300' :
                    'text-white'
                  }`}>
                    {slot.feedback === 'GOOD' && '🟢 GOOD'}
                    {slot.feedback === 'AVG' && '🟡 AVERAGE'}
                    {slot.feedback === 'BAD' && '🔴 BAD'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {children}
    </div>
  );
}
