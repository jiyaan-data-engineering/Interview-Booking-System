'use client';

import { useState, useMemo } from 'react';
import { InterviewSlot } from '@/lib/types';

interface CandidatePerformanceTabProps {
  slots: InterviewSlot[];
}

export default function CandidatePerformanceTab({ slots }: CandidatePerformanceTabProps) {
  const [filterBatch, setFilterBatch] = useState('');
  const [filterName, setFilterName] = useState('');

  // Build candidate performance data
  const candidatePerformance = useMemo(() => {
    const performanceMap = new Map<string, {
      name: string;
      email: string;
      batchNo: string;
      totalInterviews: number;
      completed: number;
      pending: number;
      confirmed: number;
      cancelled: number;
      postponed: number;
      rounds: Map<string, number>;
      completionRate: number;
      lastInterviewDate: string;
      feedback: number[];
    }>();

    slots.forEach(slot => {
      if (!slot.candidateName || !slot.candidateEmail) return;

      const key = slot.candidateEmail;
      if (!performanceMap.has(key)) {
        performanceMap.set(key, {
          name: slot.candidateName,
          email: slot.candidateEmail,
          batchNo: slot.batchNo || 'Null',
          totalInterviews: 0,
          completed: 0,
          pending: 0,
          confirmed: 0,
          cancelled: 0,
          postponed: 0,
          rounds: new Map(),
          completionRate: 0,
          lastInterviewDate: '',
          feedback: [],
        });
      }

      const data = performanceMap.get(key)!;
      data.totalInterviews++;

      // Count status
      if (slot.status === 'completed') data.completed++;
      else if (slot.status === 'pending') data.pending++;
      else if (slot.status === 'confirmed') data.confirmed++;
      else if (slot.status === 'cancelled') data.cancelled++;
      else if (slot.status === 'postponed') data.postponed++;

      // Track rounds
      if (slot.round) {
        data.rounds.set(slot.round, (data.rounds.get(slot.round) || 0) + 1);
      }

      // Track feedback scores
      if (slot.feedback) {
        const feedbackScore = ['Excellent', 'Good', 'Average', 'Poor'].indexOf(slot.feedback) || 0;
        data.feedback.push(feedbackScore);
      }

      // Track last interview date
      if (new Date(slot.date) > new Date(data.lastInterviewDate)) {
        data.lastInterviewDate = slot.date;
      }
    });

    // Calculate completion rate
    performanceMap.forEach(data => {
      if (data.totalInterviews > 0) {
        data.completionRate = Math.round((data.completed / data.totalInterviews) * 100);
      }
    });

    return Array.from(performanceMap.values());
  }, [slots]);

  // Filter and sort
  let filtered = candidatePerformance;
  if (filterName) {
    filtered = filtered.filter(c => c.name === filterName);
  }
  if (filterBatch) {
    filtered = filtered.filter(c => c.batchNo === filterBatch);
  }

  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  // Get unique batches and names
  const batches = Array.from(new Set(candidatePerformance.map(c => c.batchNo))).sort();
  const names = Array.from(new Set(candidatePerformance.map(c => c.name))).sort();

  const getPerformanceColor = (rate: number) => {
    if (rate === 100) return 'text-green-400 bg-green-900/30';
    if (rate >= 75) return 'text-blue-400 bg-blue-900/30';
    if (rate >= 50) return 'text-yellow-400 bg-yellow-900/30';
    return 'text-red-400 bg-red-900/30';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'confirmed': return '🟢';
      case 'pending': return '🟡';
      case 'postponed': return '🟠';
      case 'cancelled': return '❌';
      default: return '⚪';
    }
  };

  if (candidatePerformance.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-4">📊</div>
        <p className="text-slate-400 text-lg mb-2">No candidate performance data yet</p>
        <p className="text-slate-500 text-sm">Interviews will appear here once scheduled</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">📊 Candidate Performance Analysis</h2>
      <p className="text-slate-400 mb-6">Track interview progress and improvements for each candidate</p>

      {/* Filters */}
      <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">👤 Filter by Name</label>
            <select
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="input-field w-full"
            >
              <option value="">-- All Candidates --</option>
              {names.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">📦 Filter by Batch</label>
            <select
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
              className="input-field w-full"
            >
              <option value="">-- All Batches --</option>
              {batches.map(batch => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterName('');
                setFilterBatch('');
              }}
              className="w-full py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="space-y-4">
        {sorted.map(candidate => (
          <div key={candidate.email} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-all">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-600">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white">{candidate.name}</h3>
                  {candidate.completionRate === 100 && (
                    <span className="bg-green-900/50 border border-green-500 text-green-300 text-xs px-2 py-1 rounded-full font-semibold">⭐ High Performer</span>
                  )}
                  {candidate.completionRate >= 75 && candidate.completionRate < 100 && (
                    <span className="bg-blue-900/50 border border-blue-500 text-blue-300 text-xs px-2 py-1 rounded-full font-semibold">✅ On Track</span>
                  )}
                  {candidate.completionRate >= 50 && candidate.completionRate < 75 && (
                    <span className="bg-yellow-900/50 border border-yellow-500 text-yellow-300 text-xs px-2 py-1 rounded-full font-semibold">⚠️ In Progress</span>
                  )}
                  {candidate.completionRate < 50 && (
                    <span className="bg-red-900/50 border border-red-500 text-red-300 text-xs px-2 py-1 rounded-full font-semibold">📍 Needs Support</span>
                  )}
                </div>
                <div className="text-sm text-slate-400">
                  <div>📧 {candidate.email}</div>
                  <div>📦 {candidate.batchNo}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getPerformanceColor(candidate.completionRate)}`}>
                  {candidate.completionRate}%
                </div>
                <div className="text-xs text-slate-400 mt-1">Completion Rate</div>
              </div>
            </div>

            {/* Completion Rate Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-300">Completion Progress</span>
                <span className="text-sm font-bold text-white">{candidate.completionRate}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    candidate.completionRate === 100
                      ? 'bg-green-500'
                      : candidate.completionRate >= 75
                      ? 'bg-blue-500'
                      : candidate.completionRate >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${candidate.completionRate}%` }}
                ></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div className="bg-blue-900/30 border border-blue-500/50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-blue-400">{candidate.totalInterviews}</div>
                <div className="text-xs text-slate-400 mt-1">Total</div>
                <div className="text-xs text-blue-300 mt-1 font-semibold">100%</div>
              </div>
              <div className="bg-green-900/30 border border-green-500/50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{candidate.completed}</div>
                <div className="text-xs text-slate-400 mt-1">Completed ✅</div>
                <div className="text-xs text-green-300 mt-1 font-semibold">
                  {Math.round((candidate.completed / candidate.totalInterviews) * 100)}%
                </div>
              </div>
              <div className="bg-purple-900/30 border border-purple-500/50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-purple-400">{candidate.confirmed}</div>
                <div className="text-xs text-slate-400 mt-1">Confirmed 🟢</div>
                <div className="text-xs text-purple-300 mt-1 font-semibold">
                  {Math.round((candidate.confirmed / candidate.totalInterviews) * 100)}%
                </div>
              </div>
              <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-yellow-400">{candidate.pending}</div>
                <div className="text-xs text-slate-400 mt-1">Pending 🟡</div>
                <div className="text-xs text-yellow-300 mt-1 font-semibold">
                  {Math.round((candidate.pending / candidate.totalInterviews) * 100)}%
                </div>
              </div>
              <div className="bg-red-900/30 border border-red-500/50 rounded p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{candidate.cancelled}</div>
                <div className="text-xs text-slate-400 mt-1">Cancelled ❌</div>
                <div className="text-xs text-red-300 mt-1 font-semibold">
                  {Math.round((candidate.cancelled / candidate.totalInterviews) * 100)}%
                </div>
              </div>
            </div>

            {/* Rounds Progress */}
            {candidate.rounds.size > 0 && (
              <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
                <div className="text-sm font-semibold text-slate-300 mb-3">📊 Interview Round Breakdown</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Array.from(candidate.rounds.entries()).map(([round, count]) => (
                    <div key={round} className="bg-purple-900/50 border border-purple-500/50 rounded-lg p-3 text-center">
                      <div className="text-xs text-slate-400 mb-1">{round}</div>
                      <div className="text-xl font-bold text-purple-300">{count}</div>
                      <div className="text-xs text-purple-300 mt-1">interview(s)</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Interview */}
            {candidate.lastInterviewDate && (
              <div className="text-xs text-slate-500">
                📅 Last Interview: {new Date(candidate.lastInterviewDate).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
