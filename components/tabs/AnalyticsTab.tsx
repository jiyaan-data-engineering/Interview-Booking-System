'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';

interface AnalyticsTabProps {
  slots: InterviewSlot[];
}

type ReportType = 'daily' | 'weekly' | 'monthly';

export default function AnalyticsTab({ slots }: AnalyticsTabProps) {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const getWeekStart = () => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  };

  const getMonthStart = () => {
    return today.toISOString().split('T')[0].slice(0, 7);
  };

  // Daily Analytics
  const todaySlots = slots.filter(s => s.date === todayStr);
  const todayScheduled = todaySlots.length;
  const todayCompleted = todaySlots.filter(s => s.status === 'completed').length;
  const todayRate = todayScheduled > 0 ? Math.round((todayCompleted / todayScheduled) * 100) : 0;
  const todayCompanies = [...new Set(todaySlots.map(s => s.company))];

  // Weekly Analytics
  const weekStart = getWeekStart();
  const weekSlots = slots.filter(s => s.date >= weekStart && s.date <= todayStr);
  const weekTotal = weekSlots.length;
  const weekCompleted = weekSlots.filter(s => s.status === 'completed').length;
  const weekBooked = weekSlots.filter(s => s.candidateName).length;
  const weekDurations = weekSlots
    .map(s => parseInt(s.duration.split(' ')[0]) || 0)
    .filter(d => d > 0);
  const weekAvgDuration = weekDurations.length > 0
    ? Math.round(weekDurations.reduce((a, b) => a + b) / weekDurations.length)
    : 0;
  const weekCompanies = [...new Set(weekSlots.map(s => s.company))];
  const topWeekCompany = weekCompanies.reduce((top, company) => {
    const count = weekSlots.filter(s => s.company === company).length;
    const topCount = weekSlots.filter(s => s.company === top).length;
    return count > topCount ? company : top;
  }, weekCompanies[0] || 'N/A');

  // Monthly Analytics
  const monthStr = getMonthStart();
  const monthSlots = slots.filter(s => s.date.startsWith(monthStr));
  const monthTotal = monthSlots.length;
  const monthCompleted = monthSlots.filter(s => s.status === 'completed').length;
  const monthRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;
  const peakDay = monthSlots.length > 0
    ? Object.entries(monthSlots.reduce((acc: Record<string, number>, s) => {
        acc[s.date] = (acc[s.date] || 0) + 1;
        return acc;
      }, {})).sort((a, b) => b[1] - a[1])[0][0]
    : 'N/A';

  const goodCount = monthSlots.filter(s => s.feedback === 'GOOD').length;
  const avgCount = monthSlots.filter(s => s.feedback === 'AVG').length;
  const badCount = monthSlots.filter(s => s.feedback === 'BAD').length;

  const StatCard = ({ title, value, color }: { title: string; value: string | number; color: string }) => (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-4 text-white`}>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{title}</div>
    </div>
  );

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-white mb-6">📊 Analytics Dashboard</h2>

      {/* Report Selector */}
      <div className="flex gap-4 border-b border-slate-600 pb-4">
        <button
          onClick={() => setReportType('daily')}
          className={`px-6 py-2 font-semibold rounded-lg transition-all ${
            reportType === 'daily'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          📊 Daily Report
        </button>
        <button
          onClick={() => setReportType('weekly')}
          className={`px-6 py-2 font-semibold rounded-lg transition-all ${
            reportType === 'weekly'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          📅 Weekly Report
        </button>
        <button
          onClick={() => setReportType('monthly')}
          className={`px-6 py-2 font-semibold rounded-lg transition-all ${
            reportType === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          📈 Monthly Report
        </button>
      </div>

      {/* Daily Analytics */}
      {reportType === 'daily' && (
      <div>
        <h3 className="text-xl font-semibold text-blue-300 mb-4">📊 Today's Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <StatCard title="Scheduled Today" value={todayScheduled} color="from-blue-600 to-blue-400" />
          <StatCard title="Completed Today" value={todayCompleted} color="from-green-600 to-green-400" />
          <StatCard title="Completion Rate" value={`${todayRate}%`} color="from-purple-600 to-purple-400" />
          <StatCard title="Companies" value={todayCompanies.length} color="from-orange-600 to-orange-400" />
        </div>
        {todayCompanies.length > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-3 text-slate-300 text-sm mb-4">
            <span className="font-semibold">Companies today:</span> {todayCompanies.join(', ')}
          </div>
        )}

        {/* Daily HR Feedback */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">HR Feedback Breakdown</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{todaySlots.filter(s => s.feedback === 'GOOD').length}</div>
              <div className="text-sm text-slate-400">🟢 GOOD</div>
              <div className="text-xs text-slate-500">{todayCompleted > 0 ? Math.round((todaySlots.filter(s => s.feedback === 'GOOD').length / todayCompleted) * 100) : 0}%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{todaySlots.filter(s => s.feedback === 'AVG').length}</div>
              <div className="text-sm text-slate-400">🟡 AVERAGE</div>
              <div className="text-xs text-slate-500">{todayCompleted > 0 ? Math.round((todaySlots.filter(s => s.feedback === 'AVG').length / todayCompleted) * 100) : 0}%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{todaySlots.filter(s => s.feedback === 'BAD').length}</div>
              <div className="text-sm text-slate-400">🔴 BAD</div>
              <div className="text-xs text-slate-500">{todayCompleted > 0 ? Math.round((todaySlots.filter(s => s.feedback === 'BAD').length / todayCompleted) * 100) : 0}%</div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Weekly Analytics */}
      {reportType === 'weekly' && (
      <div>
        <h3 className="text-xl font-semibold text-blue-300 mb-4">📅 Weekly Analytics (This Week)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <StatCard title="Total Interviews" value={weekTotal} color="from-blue-600 to-blue-400" />
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-700 rounded-lg p-3 text-white text-center">
              <div className="text-2xl font-bold">{weekBooked}</div>
              <div className="text-xs text-slate-400">Booked</div>
            </div>
            <div className="bg-slate-700 rounded-lg p-3 text-white text-center">
              <div className="text-2xl font-bold">{weekCompleted}</div>
              <div className="text-xs text-slate-400">Completed</div>
            </div>
          </div>
          <StatCard title="Avg Duration" value={`${weekAvgDuration}m`} color="from-green-600 to-green-400" />
          <StatCard title="Top Company" value={topWeekCompany} color="from-orange-600 to-orange-400" />
        </div>

        {/* Weekly HR Feedback */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">HR Feedback Breakdown</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{weekSlots.filter(s => s.feedback === 'GOOD').length}</div>
              <div className="text-sm text-slate-400">🟢 GOOD</div>
              <div className="text-xs text-slate-500">{weekCompleted > 0 ? Math.round((weekSlots.filter(s => s.feedback === 'GOOD').length / weekCompleted) * 100) : 0}%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{weekSlots.filter(s => s.feedback === 'AVG').length}</div>
              <div className="text-sm text-slate-400">🟡 AVERAGE</div>
              <div className="text-xs text-slate-500">{weekCompleted > 0 ? Math.round((weekSlots.filter(s => s.feedback === 'AVG').length / weekCompleted) * 100) : 0}%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{weekSlots.filter(s => s.feedback === 'BAD').length}</div>
              <div className="text-sm text-slate-400">🔴 BAD</div>
              <div className="text-xs text-slate-500">{weekCompleted > 0 ? Math.round((weekSlots.filter(s => s.feedback === 'BAD').length / weekCompleted) * 100) : 0}%</div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Monthly Analytics */}
      {reportType === 'monthly' && (
      <div>
        <h3 className="text-xl font-semibold text-blue-300 mb-4">📈 Monthly Analytics (This Month)</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <StatCard title="Total Interviews" value={monthTotal} color="from-blue-600 to-blue-400" />
          <StatCard title="Completed" value={monthCompleted} color="from-green-600 to-green-400" />
          <StatCard title="Completion Rate" value={`${monthRate}%`} color="from-purple-600 to-purple-400" />
          <StatCard title="Peak Day" value={peakDay.slice(5)} color="from-orange-600 to-orange-400" />
        </div>

        {/* Feedback Breakdown */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3">HR Feedback Breakdown</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{goodCount}</div>
              <div className="text-sm text-slate-400">🟢 GOOD</div>
              <div className="text-xs text-slate-500">{monthCompleted > 0 ? Math.round((goodCount / monthCompleted) * 100) : 0}%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{avgCount}</div>
              <div className="text-sm text-slate-400">🟡 AVERAGE</div>
              <div className="text-xs text-slate-500">{monthCompleted > 0 ? Math.round((avgCount / monthCompleted) * 100) : 0}%</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{badCount}</div>
              <div className="text-sm text-slate-400">🔴 BAD</div>
              <div className="text-xs text-slate-500">{monthCompleted > 0 ? Math.round((badCount / monthCompleted) * 100) : 0}%</div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Summary */}
      {slots.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <p>No data yet. Create interview slots to see analytics.</p>
        </div>
      )}
    </div>
  );
}
