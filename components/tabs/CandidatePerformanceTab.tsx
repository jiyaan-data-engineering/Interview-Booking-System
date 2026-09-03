'use client';

import { useState, useMemo, useEffect } from 'react';
import { InterviewSlot } from '@/lib/types';
import { getAllInactiveCandidates } from '@/lib/firestore';

interface CandidatePerformanceTabProps {
  slots: InterviewSlot[];
}

export default function CandidatePerformanceTab({ slots }: CandidatePerformanceTabProps) {
  const [filterBatch, setFilterBatch] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [inactiveCandidates, setInactiveCandidates] = useState(new Set<string>());
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  // Load inactive candidates on mount
  useEffect(() => {
    const loadInactiveCandidates = async () => {
      const inactiveEmails = await getAllInactiveCandidates();
      setInactiveCandidates(new Set(inactiveEmails));
    };
    loadInactiveCandidates();
  }, []);

  // Build comprehensive candidate performance data
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
      rounds: Map<string, { count: number; completed: number; cancelled: number }>;
      roundList: string[];
      completionRate: number;
      lastInterviewDate: string;
      firstInterviewDate: string;
      daysSinceLastInterview: number;
      avgDaysBetweenInterviews: number;
      feedback: string[];
      averageFeedback: number;
      interviews: InterviewSlot[];
      batchAvgCompletion?: number;
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
          roundList: [],
          completionRate: 0,
          lastInterviewDate: '',
          firstInterviewDate: '',
          daysSinceLastInterview: 0,
          avgDaysBetweenInterviews: 0,
          feedback: [],
          averageFeedback: 0,
          interviews: [],
        });
      }

      const data = performanceMap.get(key)!;
      data.totalInterviews++;
      data.interviews.push(slot);

      // Count status
      if (slot.status === 'completed') data.completed++;
      else if (slot.status === 'pending') data.pending++;
      else if (slot.status === 'confirmed') data.confirmed++;
      else if (slot.status === 'cancelled') data.cancelled++;
      else if (slot.status === 'postponed') data.postponed++;

      // Track rounds with status
      if (slot.round) {
        if (!data.rounds.has(slot.round)) {
          data.rounds.set(slot.round, { count: 0, completed: 0, cancelled: 0 });
          data.roundList.push(slot.round);
        }
        const roundData = data.rounds.get(slot.round)!;
        roundData.count++;
        if (slot.status === 'completed') roundData.completed++;
        if (slot.status === 'cancelled') roundData.cancelled++;
      }

      // Track feedback
      if (slot.feedback) {
        data.feedback.push(slot.feedback);
      }

      // Track dates
      const slotDate = new Date(slot.date);
      if (!data.lastInterviewDate || new Date(slot.date) > new Date(data.lastInterviewDate)) {
        data.lastInterviewDate = slot.date;
      }
      if (!data.firstInterviewDate || new Date(slot.date) < new Date(data.firstInterviewDate)) {
        data.firstInterviewDate = slot.date;
      }
    });

    // Calculate metrics
    const today = new Date();
    performanceMap.forEach((data) => {
      if (data.totalInterviews > 0) {
        data.completionRate = Math.round((data.completed / data.totalInterviews) * 100);
      }

      // Days since last interview
      if (data.lastInterviewDate) {
        const lastDate = new Date(data.lastInterviewDate);
        data.daysSinceLastInterview = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Average days between interviews
      if (data.interviews.length > 1) {
        const dates = data.interviews.map(i => new Date(i.date).getTime()).sort((a, b) => a - b);
        let totalDays = 0;
        for (let i = 1; i < dates.length; i++) {
          totalDays += Math.floor((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
        }
        data.avgDaysBetweenInterviews = Math.round(totalDays / (dates.length - 1));
      }

      // Average feedback score
      if (data.feedback.length > 0) {
        const scoreMap: { [key: string]: number } = { 'Excellent': 5, 'Good': 4, 'Average': 3, 'Poor': 1 };
        const totalScore = data.feedback.reduce((sum, fb) => sum + (scoreMap[fb] || 0), 0);
        data.averageFeedback = Math.round((totalScore / data.feedback.length) * 10) / 10;
      }
    });

    // Calculate batch averages for comparison
    const batchMap = new Map<string, { total: number; completion: number; count: number }>();
    performanceMap.forEach((data) => {
      const batch = data.batchNo;
      if (!batchMap.has(batch)) {
        batchMap.set(batch, { total: 0, completion: 0, count: 0 });
      }
      const batchData = batchMap.get(batch)!;
      batchData.total += data.completionRate;
      batchData.count++;
    });

    performanceMap.forEach((data) => {
      const batchData = batchMap.get(data.batchNo);
      if (batchData) {
        data.batchAvgCompletion = Math.round(batchData.total / batchData.count);
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
  if (filterStatus === 'active') {
    filtered = filtered.filter(c => !inactiveCandidates.has(c.email));
  } else if (filterStatus === 'inactive') {
    filtered = filtered.filter(c => inactiveCandidates.has(c.email));
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

  const getRoundSuccessRate = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getNextRound = (candidate: any) => {
    const rounds = Array.from(candidate.rounds.keys());
    const commonRounds = ['Screening', 'Online test', 'AI Round', 'L1', 'L2', 'Client', 'HR'];
    for (const round of commonRounds) {
      if (!rounds.includes(round)) return round;
    }
    return 'Final Round';
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
      <h2 className="text-2xl font-bold text-white mb-2">📊 Candidate Performance Analytics</h2>
      <p className="text-slate-400 mb-6">Comprehensive interview progress tracking and analysis</p>

      {/* Filters */}
      <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">🔐 Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field w-full"
            >
              <option value="">-- All Status --</option>
              <option value="active">✅ Active</option>
              <option value="inactive">❌ Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterName('');
                setFilterBatch('');
                setFilterStatus('');
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
          <div key={candidate.email} className="bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-all">
            {/* Header */}
            <div
              className="p-6 cursor-pointer hover:bg-slate-700/30 transition-colors"
              onClick={() => setExpandedEmail(expandedEmail === candidate.email ? null : candidate.email)}
            >
              <div className="flex justify-between items-start">
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
                  <div className="text-xs text-slate-400 mt-1">Completion</div>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedEmail === candidate.email && (
              <div className="border-t border-slate-600 p-6 space-y-4">
                {/* Progress Bar */}
                <div>
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

                {/* Status Breakdown */}
                <div>
                  <div className="text-sm font-semibold text-slate-300 mb-3">Interview Status Breakdown</div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-blue-900/30 border border-blue-500/50 rounded p-3 text-center">
                      <div className="text-2xl font-bold text-blue-400">{candidate.totalInterviews}</div>
                      <div className="text-xs text-slate-400">Total</div>
                      <div className="text-xs text-blue-300 mt-1 font-semibold">100%</div>
                    </div>
                    <div className="bg-green-900/30 border border-green-500/50 rounded p-3 text-center">
                      <div className="text-2xl font-bold text-green-400">{candidate.completed}</div>
                      <div className="text-xs text-slate-400">Completed</div>
                      <div className="text-xs text-green-300 mt-1 font-semibold">{Math.round((candidate.completed / candidate.totalInterviews) * 100)}%</div>
                    </div>
                    <div className="bg-purple-900/30 border border-purple-500/50 rounded p-3 text-center">
                      <div className="text-2xl font-bold text-purple-400">{candidate.confirmed}</div>
                      <div className="text-xs text-slate-400">Confirmed</div>
                      <div className="text-xs text-purple-300 mt-1 font-semibold">{Math.round((candidate.confirmed / candidate.totalInterviews) * 100)}%</div>
                    </div>
                    <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-400">{candidate.pending}</div>
                      <div className="text-xs text-slate-400">Pending</div>
                      <div className="text-xs text-yellow-300 mt-1 font-semibold">{Math.round((candidate.pending / candidate.totalInterviews) * 100)}%</div>
                    </div>
                    <div className="bg-red-900/30 border border-red-500/50 rounded p-3 text-center">
                      <div className="text-2xl font-bold text-red-400">{candidate.cancelled}</div>
                      <div className="text-xs text-slate-400">Cancelled</div>
                      <div className="text-xs text-red-300 mt-1 font-semibold">{Math.round((candidate.cancelled / candidate.totalInterviews) * 100)}%</div>
                    </div>
                  </div>
                </div>

                {/* Key Performance Indicators */}
                <div>
                  <div className="text-sm font-semibold text-slate-300 mb-3">📈 Key Performance Indicators</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Total Interviews</div>
                      <div className="text-2xl font-bold text-blue-400 mt-2">{candidate.totalInterviews}</div>
                    </div>
                    <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Completed Interviews</div>
                      <div className="text-2xl font-bold text-green-400 mt-2">{candidate.completed}</div>
                    </div>
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Days Since Start</div>
                      <div className="text-2xl font-bold text-cyan-400 mt-2">
                        {candidate.firstInterviewDate ? Math.floor((new Date().getTime() - new Date(candidate.firstInterviewDate).getTime()) / (1000 * 60 * 60 * 24)) : 0}d
                      </div>
                    </div>
                    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
                      <div className="text-xs text-slate-400">Started On</div>
                      <div className="text-sm font-bold text-purple-400 mt-2">{candidate.firstInterviewDate ? new Date(candidate.firstInterviewDate).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Round-wise Success Rates */}
                {candidate.rounds.size > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-slate-300 mb-3">🎯 Round-wise Success Rates</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Screening', 'L1', 'L2', 'Client'].map(roundName => {
                        const data = candidate.rounds.get(roundName);
                        if (!data) return null;
                        const successRate = getRoundSuccessRate(data.completed, data.count);
                        return (
                          <div key={roundName} className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
                            <div className="text-xs text-slate-400 font-semibold mb-2">{roundName} Success Rate</div>
                            <div className={`text-3xl font-bold mb-2 ${successRate >= 75 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {successRate}%
                            </div>
                            <div className="text-xs text-slate-300">
                              <div>✅ {data.completed}/{data.count} passed</div>
                              <div>❌ {data.cancelled} cancelled</div>
                            </div>
                          </div>
                        );
                      })}
                      {Array.from(candidate.rounds.entries()).map(([round, data]) => {
                        if (['Screening', 'L1', 'L2', 'Client'].includes(round)) return null;
                        const successRate = getRoundSuccessRate(data.completed, data.count);
                        return (
                          <div key={round} className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
                            <div className="text-xs text-slate-400 font-semibold mb-2">{round} Success Rate</div>
                            <div className={`text-3xl font-bold mb-2 ${successRate >= 75 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {successRate}%
                            </div>
                            <div className="text-xs text-slate-300">
                              <div>✅ {data.completed}/{data.count} passed</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
