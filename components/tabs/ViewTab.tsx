import { InterviewSlot } from '@/lib/types';
import SlotCard from '@/components/SlotCard';

interface ViewTabProps {
  slots: InterviewSlot[];
  available: number;
  booked: number;
}

export default function ViewTab({ slots, available, booked }: ViewTabProps) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Slots" value={slots.length} color="from-blue-600 to-blue-400" />
        <StatCard title="Available" value={available} color="from-green-600 to-green-400" />
        <StatCard title="Booked" value={booked} color="from-orange-600 to-orange-400" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">All Interview Slots</h2>
      {slots.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400">No slots yet. Create one from the Admin Panel.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {slots.map(slot => (
            <SlotCard key={slot.id} slot={slot} showCandidate={true} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-6 text-white shadow-lg`}>
      <div className="text-4xl font-bold mb-2">{value}</div>
      <div className="text-sm opacity-90">{title}</div>
    </div>
  );
}
