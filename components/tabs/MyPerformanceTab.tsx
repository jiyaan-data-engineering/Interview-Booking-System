'use client';

import { InterviewSlot } from '@/lib/types';

interface MyPerformanceTabProps {
  slots: InterviewSlot[];
  candidateEmail: string;
}

export default function MyPerformanceTab({ slots, candidateEmail }: MyPerformanceTabProps) {
  // Get all interviews for this candidate
  const myInterviews = slots.filter(slot => slot.candidateEmail === candidateEmail);

  // Calculate performance metrics
  const totalInterviews = myInterviews.length;
  const completed = myInterviews.filter(s => s.status === 'completed').length;
  const pending = myInterviews.filter(s => s.status === 'pending').length;
  const confirmed = myInterviews.filter(s => s.status === 'confirmed').length;
  const cancelled = myInterviews.filter(s => s.status === 'cancelled').length;

  const completionRate = totalInterviews > 0 ? Math.round((completed / totalInterviews) * 100) : 0;

  // Calculate round-wise success (progression to next round)
  const roundMap = new Map<string, { count: number; progressed: number }>();
  const nextRoundMap: { [key: string]: string } = {
    'Screening': 'Online test',
    'Online test': 'AI Round',
    'AI Round': 'L1',
    'L1': 'L2',
    'L2': 'Client',
    'Client': 'HR',
    'HR': 'Offer'
  };

  myInterviews.forEach(interview => {
    if (interview.round) {
      if (!roundMap.has(interview.round)) {
        roundMap.set(interview.round, { count: 0, progressed: 0 });
      }
      const data = roundMap.get(interview.round)!;
      data.count++;

      // Check if they have interview in next round
      const nextRound = nextRoundMap[interview.round];
      if (nextRound && myInterviews.some(i => i.round === nextRound)) {
        data.progressed++;
      }
    }
  });

  const getRoundSuccessRate = (roundName: string) => {
    const data = roundMap.get(roundName);
    if (!data || data.count === 0) return 0;
    return Math.round((data.progressed / data.count) * 100);
  };

  const getPerformanceColor = (rate: number) => {
    if (rate === 100) return 'text-green-400 bg-green-900/30';
    if (rate >= 75) return 'text-blue-400 bg-blue-900/30';
    if (rate >= 50) return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Round', 'Company', 'HR Name', 'HR Number', 'Status'];
    const rows = myInterviews
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(interview => [
        new Date(interview.date).toLocaleDateString(),
        interview.round || 'N/A',
        interview.company || 'N/A',
        interview.hrName || 'N/A',
        interview.hrNumber || 'N/A',
        interview.status || 'N/A',
      ]);

    const csvContent = [
      ['Interview History Export'],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [],
      [headers.join(',')],
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (myInterviews.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-4">📊</div>
        <p className="text-slate-400 text-lg mb-2">No interviews scheduled yet</p>
        <p className="text-slate-500 text-sm">Go to "Book Interview" tab to schedule your first interview</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">📊 My Performance Analytics</h2>
      <p className="text-slate-400 mb-6">Track your interview progress and performance</p>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className={`rounded-lg p-4 border ${completionRate === 100 ? 'bg-green-900/30 border-green-500' : completionRate >= 75 ? 'bg-blue-900/30 border-blue-500' : completionRate >= 50 ? 'bg-yellow-900/30 border-yellow-500' : 'bg-red-900/30 border-red-500'}`}>
          <div className={`text-3xl font-bold ${completionRate === 100 ? 'text-green-400' : completionRate >= 75 ? 'text-blue-400' : completionRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {completionRate}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Completion Rate</div>
        </div>
        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4">
          <div className="text-3xl font-bold text-blue-400">{totalInterviews}</div>
          <div className="text-xs text-slate-400 mt-1">Total Interviews</div>
        </div>
        <div className="bg-green-900/30 border border-green-500 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-400">{completed}</div>
          <div className="text-xs text-slate-400 mt-1">Completed</div>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4">
          <div className="text-3xl font-bold text-yellow-400">{confirmed}</div>
          <div className="text-xs text-slate-400 mt-1">Confirmed</div>
        </div>
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
          <div className="text-3xl font-bold text-red-400">{cancelled}</div>
          <div className="text-xs text-slate-400 mt-1">Cancelled</div>
        </div>
      </div>

      {/* Round-wise Success Rates */}
      {roundMap.size > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-4">🎯 Round-wise Success Rates</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Screening', 'Online test', 'AI Round', 'L1', 'L2', 'Client', 'HR'].map(roundName => {
              const data = roundMap.get(roundName);
              if (!data) return null;
              const successRate = getRoundSuccessRate(roundName);
              return (
                <div key={roundName} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                  <div className="text-xs text-slate-400 font-semibold mb-2">{roundName}</div>
                  <div className={`text-3xl font-bold mb-2 ${successRate >= 75 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {successRate}%
                  </div>
                  <div className="text-xs text-slate-300">
                    <div>📊 {data.count} appeared</div>
                    <div>✅ {data.progressed} progressed</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interview History Table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">📋 Interview History</h3>
          <button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-semibold transition-all"
          >
            📥 Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-slate-800 rounded-lg border border-slate-600">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left py-3 px-4 text-slate-300">Date</th>
                <th className="text-left py-3 px-4 text-slate-300">Round</th>
                <th className="text-left py-3 px-4 text-slate-300">Company</th>
                <th className="text-left py-3 px-4 text-slate-300">HR Name</th>
                <th className="text-left py-3 px-4 text-slate-300">HR Number</th>
                <th className="text-left py-3 px-4 text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {myInterviews
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((interview, idx) => (
                  <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                    <td className="py-3 px-4 text-slate-300">{new Date(interview.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className="bg-purple-900/50 text-purple-300 px-2 py-1 rounded text-xs font-semibold">
                        {interview.round || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{interview.company || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-300">{interview.hrName || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-300">{interview.hrNumber || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        interview.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                        interview.status === 'confirmed' ? 'bg-blue-900/50 text-blue-300' :
                        interview.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                        interview.status === 'cancelled' ? 'bg-red-900/50 text-red-300' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {interview.status || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
