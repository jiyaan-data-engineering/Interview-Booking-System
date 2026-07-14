'use client';

import { useState, useMemo } from 'react';
import { InterviewSlot } from '@/lib/types';

interface FeedbackAnalyticsTabProps {
  slots: InterviewSlot[];
}

export default function FeedbackAnalyticsTab({ slots }: FeedbackAnalyticsTabProps) {
  const [filterDate, setFilterDate] = useState('');
  const [filterCandidate, setFilterCandidate] = useState('');
  const [filterRound, setFilterRound] = useState('');
  const [filterFeedback, setFilterFeedback] = useState('');

  const completedSlots = slots.filter(slot => slot.status === 'completed' && slot.feedback);

  const filteredFeedback = useMemo(() => {
    return completedSlots.filter(slot => {
      if (filterDate && slot.date !== filterDate) return false;
      if (filterCandidate && slot.candidateName !== filterCandidate) return false;
      if (filterRound && slot.round !== filterRound) return false;
      if (filterFeedback && slot.feedback !== filterFeedback) return false;
      return true;
    });
  }, [completedSlots, filterDate, filterCandidate, filterRound, filterFeedback]);

  const feedbackStats = useMemo(() => {
    const good = filteredFeedback.filter(s => s.feedback === 'GOOD').length;
    const avg = filteredFeedback.filter(s => s.feedback === 'AVG').length;
    const bad = filteredFeedback.filter(s => s.feedback === 'BAD').length;
    const total = filteredFeedback.length;

    return {
      good,
      avg,
      bad,
      total,
      goodPercent: total > 0 ? ((good / total) * 100).toFixed(1) : 0,
      avgPercent: total > 0 ? ((avg / total) * 100).toFixed(1) : 0,
      badPercent: total > 0 ? ((bad / total) * 100).toFixed(1) : 0,
    };
  }, [filteredFeedback]);

  const feedbackByCandidate = useMemo(() => {
    const candidateMap: Record<string, { good: number; avg: number; bad: number }> = {};
    filteredFeedback.forEach(slot => {
      const candidateName = slot.candidateName || 'Unknown';
      if (!candidateMap[candidateName]) {
        candidateMap[candidateName] = { good: 0, avg: 0, bad: 0 };
      }
      if (slot.feedback === 'GOOD') candidateMap[candidateName].good++;
      else if (slot.feedback === 'AVG') candidateMap[candidateName].avg++;
      else if (slot.feedback === 'BAD') candidateMap[candidateName].bad++;
    });
    return candidateMap;
  }, [filteredFeedback]);

  const feedbackByRound = useMemo(() => {
    const roundMap: Record<string, { good: number; avg: number; bad: number }> = {};
    filteredFeedback.forEach(slot => {
      const round = slot.round || 'Unknown';
      if (!roundMap[round]) {
        roundMap[round] = { good: 0, avg: 0, bad: 0 };
      }
      if (slot.feedback === 'GOOD') roundMap[round].good++;
      else if (slot.feedback === 'AVG') roundMap[round].avg++;
      else if (slot.feedback === 'BAD') roundMap[round].bad++;
    });
    return roundMap;
  }, [filteredFeedback]);

  const uniqueCandidates = [...new Set(completedSlots.map(s => s.candidateName))];
  const uniqueRounds = [...new Set(completedSlots.map(s => s.round || 'Unknown'))];

  const exportToCSV = () => {
    const headers = ['Date', 'Candidate Name', 'Company', 'Round', 'Feedback', 'Comments', 'HR Name', 'Support Person'];
    const rows = filteredFeedback.map(slot => [
      slot.date,
      slot.candidateName,
      slot.company,
      slot.round || 'N/A',
      slot.feedback || 'N/A',
      `"${(slot.comments || '').replace(/"/g, '""')}"`,
      slot.hrName || 'N/A',
      slot.supportPerson || 'N/A',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">📊 Feedback Analytics</h2>
      <p className="text-slate-400 mb-6">Track and analyze interview feedback from candidates</p>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-900/40 to-green-900/20 border border-green-500/50 rounded-lg p-4">
          <div className="text-green-300 text-sm font-semibold mb-1">🟢 GOOD</div>
          <div className="text-3xl font-bold text-green-400">{feedbackStats.good}</div>
          <div className="text-xs text-green-300 mt-1">{feedbackStats.goodPercent}% of feedback</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
          <div className="text-yellow-300 text-sm font-semibold mb-1">🟡 AVERAGE</div>
          <div className="text-3xl font-bold text-yellow-400">{feedbackStats.avg}</div>
          <div className="text-xs text-yellow-300 mt-1">{feedbackStats.avgPercent}% of feedback</div>
        </div>

        <div className="bg-gradient-to-br from-red-900/40 to-red-900/20 border border-red-500/50 rounded-lg p-4">
          <div className="text-red-300 text-sm font-semibold mb-1">🔴 BAD</div>
          <div className="text-3xl font-bold text-red-400">{feedbackStats.bad}</div>
          <div className="text-xs text-red-300 mt-1">{feedbackStats.badPercent}% of feedback</div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/20 border border-blue-500/50 rounded-lg p-4">
          <div className="text-blue-300 text-sm font-semibold mb-1">📈 TOTAL</div>
          <div className="text-3xl font-bold text-blue-400">{feedbackStats.total}</div>
          <div className="text-xs text-blue-300 mt-1">Feedback collected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-700/50 rounded-lg p-6 mb-8 border border-slate-600">
        <h3 className="text-lg font-semibold text-white mb-4">🔍 Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">📅 Select Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Candidate</label>
            <select
              value={filterCandidate}
              onChange={(e) => setFilterCandidate(e.target.value)}
              className="input-field"
            >
              <option value="">All Candidates</option>
              {uniqueCandidates.map(candidate => (
                <option key={candidate} value={candidate}>{candidate}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Round</label>
            <select
              value={filterRound}
              onChange={(e) => setFilterRound(e.target.value)}
              className="input-field"
            >
              <option value="">All Rounds</option>
              {uniqueRounds.map(round => (
                <option key={round} value={round}>{round}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Feedback</label>
            <select
              value={filterFeedback}
              onChange={(e) => setFilterFeedback(e.target.value)}
              className="input-field"
            >
              <option value="">All Feedback</option>
              <option value="GOOD">GOOD</option>
              <option value="AVG">AVERAGE</option>
              <option value="BAD">BAD</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterDate('');
                setFilterCandidate('');
                setFilterRound('');
                setFilterFeedback('');
              }}
              className="w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Feedback by Candidate */}
      {Object.keys(feedbackByCandidate).length > 0 && (
        <div className="bg-slate-700/50 rounded-lg p-6 mb-8 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4">👤 Feedback by Candidate</h3>
          <div className="space-y-4">
            {Object.entries(feedbackByCandidate).map(([candidate, stats]) => {
              const total = stats.good + stats.avg + stats.bad;
              return (
                <div key={candidate}>
                  <div className="flex justify-between mb-2">
                    <span className="text-white font-semibold">{candidate}</span>
                    <span className="text-slate-400 text-sm">{total} interviews</span>
                  </div>
                  <div className="flex gap-2 h-6 rounded-lg overflow-hidden">
                    {stats.good > 0 && (
                      <div
                        className="bg-green-500"
                        style={{ width: `${(stats.good / total) * 100}%` }}
                        title={`GOOD: ${stats.good}`}
                      />
                    )}
                    {stats.avg > 0 && (
                      <div
                        className="bg-yellow-500"
                        style={{ width: `${(stats.avg / total) * 100}%` }}
                        title={`AVERAGE: ${stats.avg}`}
                      />
                    )}
                    {stats.bad > 0 && (
                      <div
                        className="bg-red-500"
                        style={{ width: `${(stats.bad / total) * 100}%` }}
                        title={`BAD: ${stats.bad}`}
                      />
                    )}
                  </div>
                  <div className="flex gap-4 text-xs mt-1">
                    <span className="text-green-300">🟢 {stats.good}</span>
                    <span className="text-yellow-300">🟡 {stats.avg}</span>
                    <span className="text-red-300">🔴 {stats.bad}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feedback by Round */}
      {Object.keys(feedbackByRound).length > 0 && (
        <div className="bg-slate-700/50 rounded-lg p-6 mb-8 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4">📋 Feedback by Round</h3>
          <div className="space-y-4">
            {Object.entries(feedbackByRound).map(([round, stats]) => {
              const total = stats.good + stats.avg + stats.bad;
              return (
                <div key={round}>
                  <div className="flex justify-between mb-2">
                    <span className="text-white font-semibold">{round}</span>
                    <span className="text-slate-400 text-sm">{total} interviews</span>
                  </div>
                  <div className="flex gap-2 h-6 rounded-lg overflow-hidden">
                    {stats.good > 0 && (
                      <div
                        className="bg-green-500"
                        style={{ width: `${(stats.good / total) * 100}%` }}
                        title={`GOOD: ${stats.good}`}
                      />
                    )}
                    {stats.avg > 0 && (
                      <div
                        className="bg-yellow-500"
                        style={{ width: `${(stats.avg / total) * 100}%` }}
                        title={`AVERAGE: ${stats.avg}`}
                      />
                    )}
                    {stats.bad > 0 && (
                      <div
                        className="bg-red-500"
                        style={{ width: `${(stats.bad / total) * 100}%` }}
                        title={`BAD: ${stats.bad}`}
                      />
                    )}
                  </div>
                  <div className="flex gap-4 text-xs mt-1">
                    <span className="text-green-300">🟢 {stats.good}</span>
                    <span className="text-yellow-300">🟡 {stats.avg}</span>
                    <span className="text-red-300">🔴 {stats.bad}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Feedback List */}
      <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">📝 Detailed Feedback List</h3>
          <button
            onClick={exportToCSV}
            className="btn-secondary"
          >
            📥 Export CSV
          </button>
        </div>

        {filteredFeedback.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">No feedback found matching the selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-600">
                <tr className="text-left">
                  <th className="text-slate-300 font-semibold py-3 px-2">Date</th>
                  <th className="text-slate-300 font-semibold py-3 px-2">Candidate</th>
                  <th className="text-slate-300 font-semibold py-3 px-2">Company</th>
                  <th className="text-slate-300 font-semibold py-3 px-2">Round</th>
                  <th className="text-slate-300 font-semibold py-3 px-2">Feedback</th>
                  <th className="text-slate-300 font-semibold py-3 px-2">Comments</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.map((slot) => (
                  <tr key={slot.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-all">
                    <td className="py-3 px-2 text-slate-300">{slot.date}</td>
                    <td className="py-3 px-2 text-white font-semibold">{slot.candidateName}</td>
                    <td className="py-3 px-2 text-slate-300">{slot.company}</td>
                    <td className="py-3 px-2 text-slate-300">{slot.round || 'N/A'}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        slot.feedback === 'GOOD' ? 'bg-green-900/50 text-green-300' :
                        slot.feedback === 'AVG' ? 'bg-yellow-900/50 text-yellow-300' :
                        slot.feedback === 'BAD' ? 'bg-red-900/50 text-red-300' :
                        'bg-slate-700 text-slate-300'
                      }`}>
                        {slot.feedback === 'GOOD' && '🟢 GOOD'}
                        {slot.feedback === 'AVG' && '🟡 AVG'}
                        {slot.feedback === 'BAD' && '🔴 BAD'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-300 max-w-xs truncate" title={slot.comments}>
                      {slot.comments || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
