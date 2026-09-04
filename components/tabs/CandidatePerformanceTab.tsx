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
      offerStatus: string;
      packageLPA: string;
      offerReleasedDate: string;
      joiningDate: string;
      offerCompany: string;
      offerCount: number;
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
          offerStatus: '',
          packageLPA: '',
          offerReleasedDate: '',
          joiningDate: '',
          offerCompany: '',
          offerCount: 0,
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

      // Capture offer information from HR-completed interviews
      if (slot.round === 'HR' && slot.status === 'completed') {
        if (slot.offerStatus) {
          data.offerStatus = slot.offerStatus;
          data.offerCount++;
        }
        if (slot.packageLPA) data.packageLPA = slot.packageLPA;
        if (slot.offerReleasedDate) data.offerReleasedDate = slot.offerReleasedDate;
        if (slot.joiningDate) data.joiningDate = slot.joiningDate;
        if (slot.company) data.offerCompany = slot.company;
      }

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

  const getRoundSuccessRate = (candidate: any, roundName: string) => {
    // Success = completed this round AND scheduled for next round
    const roundData = candidate.rounds.get(roundName);
    if (!roundData || roundData.count === 0) return 0;

    // Define next round for each round
    const nextRoundMap: { [key: string]: string } = {
      'Screening': 'Online test',
      'Online test': 'AI Round',
      'AI Round': 'L1',
      'L1': 'L2',
      'L2': 'Client',
      'Client': 'HR',
      'HR': 'Offer'
    };

    const nextRound = nextRoundMap[roundName];
    const nextRoundData = nextRound ? candidate.rounds.get(nextRound) : null;

    // Success count: candidates who completed this round AND have interviews in next round
    const successCount = nextRoundData ? nextRoundData.count : 0;

    return Math.round((successCount / roundData.count) * 100);
  };

  const exportToCSV = (candidate: any) => {
    const headers = ['Date', 'Round', 'Company', 'HR Name', 'HR Number', 'Status'];
    const rows = candidate.interviews
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((interview: any) => [
        new Date(interview.date).toLocaleDateString(),
        interview.round || 'N/A',
        interview.company || 'N/A',
        interview.hrName || 'N/A',
        interview.hrNumber || 'N/A',
        interview.status || 'N/A',
      ]);

    const csvContent = [
      [`Interview History for ${candidate.name}`],
      [`Email: ${candidate.email}`],
      [`Batch: ${candidate.batchNo}`],
      [],
      [headers.join(',')],
      ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${candidate.name.replace(/\s+/g, '_')}_interviews.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = (candidate: any) => {
    const completionRate = candidate.completionRate;
    const daysToOffer = candidate.offerStatus === 'Received' && candidate.offerReleasedDate && candidate.firstInterviewDate
      ? Math.ceil((new Date(candidate.offerReleasedDate).getTime() - new Date(candidate.firstInterviewDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${candidate.name} - Performance Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
          .page { background: #ffffff; min-height: 100vh; padding: 30px; max-width: 900px; margin: auto; }
          .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 25px; text-align: center; border: 2px solid #667eea; }
          .header img { max-width: 250px; margin-bottom: 15px; }
          .candidate-name { font-size: 28px; font-weight: bold; margin: 10px 0; color: #f1f5f9; }
          .candidate-info { font-size: 13px; color: #cbd5e1; line-height: 1.6; margin-top: 10px; }
          .metrics-section { background: #f8fafc; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e2e8f0; }
          .metrics-section h3 { font-size: 14px; color: #64748b; text-transform: uppercase; margin-bottom: 12px; font-weight: 600; letter-spacing: 0.5px; }
          .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
          .metric-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; text-align: center; }
          .metric-value { font-size: 28px; font-weight: bold; color: #667eea; }
          .metric-label { font-size: 11px; color: #64748b; margin-top: 5px; text-transform: uppercase; font-weight: 600; }
          .section { margin: 25px 0; }
          .section-title { font-size: 16px; font-weight: bold; color: #1e293b; margin-bottom: 12px; border-bottom: 2px solid #667eea; padding-bottom: 8px; }
          .offer-info { background: linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%); padding: 20px; border-radius: 10px; border-left: 4px solid #a78bfa; }
          .offer-company { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #667eea; }
          .offer-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .offer-detail { background: white; padding: 12px; border-radius: 6px; border-left: 3px solid #a78bfa; }
          .offer-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600; }
          .offer-value { font-size: 15px; font-weight: bold; margin-top: 6px; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #1e293b; color: #f1f5f9; padding: 12px; text-align: left; font-size: 11px; font-weight: 600; border: 1px solid #cbd5e1; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #1e293b; }
          tr:nth-child(even) { background: #f8fafc; }
          .status-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; }
          .status-completed { background: #d1fae5; color: #065f46; }
          .status-confirmed { background: #dbeafe; color: #0c4a6e; }
          .status-pending { background: #fef3c7; color: #78350f; }
          .status-cancelled { background: #fee2e2; color: #7f1d1d; }
          .round-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; background: #e0e7ff; color: #4c1d95; font-size: 10px; font-weight: 600; }
          .footer { text-align: center; margin-top: 30px; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          .completion-bar { width: 100%; background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden; margin-top: 8px; }
          .completion-fill { height: 100%; background: linear-gradient(90deg, #667eea 0%, #7c3aed 100%); width: ${completionRate}%; }
          .success-table { font-size: 12px; }
          .success-table td { padding: 10px 12px; }
          .success-rate-high { color: #059669; font-weight: bold; }
          .success-rate-medium { color: #d97706; font-weight: bold; }
          .success-rate-low { color: #dc2626; font-weight: bold; }
          @media print { body { background: white; } .page { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div class="header">
            <img src="${window.location.origin}/images/jiyaan_gap_h.jpg?v=2" alt="Jiyaan Institute of Technology" style="border-radius: 8px;">
            <div class="candidate-name">${candidate.name}</div>
            <div class="candidate-info">
              <div>📧 ${candidate.email}</div>
              <div>📦 Batch: ${candidate.batchNo}</div>
            </div>
          </div>

          <!-- Metrics Section -->
          <div class="metrics-section">
            <h3>📊 Interview Metrics</h3>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">${candidate.totalInterviews}</div>
                <div class="metric-label">Total Interviews</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${candidate.completed}</div>
                <div class="metric-label">Completed</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${candidate.confirmed}</div>
                <div class="metric-label">Confirmed</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${completionRate}%</div>
                <div class="metric-label">Completion</div>
              </div>
            </div>
          </div>

          ${candidate.offerStatus ? `
          <!-- Offer Information -->
          <div class="section">
            <div class="section-title">🎁 Offer Information</div>
            <div class="offer-info">
              <div class="offer-company">${candidate.offerCompany || 'Offer Details'}</div>
              <div class="offer-details">
                <div class="offer-detail">
                  <div class="offer-label">Offer Status</div>
                  <div class="offer-value">✓ ${candidate.offerStatus}</div>
                </div>
                <div class="offer-detail">
                  <div class="offer-label">Package</div>
                  <div class="offer-value">₹ ${candidate.packageLPA || 'N/A'} LPA</div>
                </div>
                ${candidate.packageLPA ? `
                <div class="offer-detail">
                  <div class="offer-label">Monthly Settlement</div>
                  <div class="offer-value">₹ ${(parseFloat(candidate.packageLPA) / 12).toFixed(2)} L</div>
                </div>
                ` : ''}
                ${daysToOffer ? `
                <div class="offer-detail">
                  <div class="offer-label">Days to Offer</div>
                  <div class="offer-value">⏱️ ${daysToOffer} days</div>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Interview History -->
          <div class="section">
            <div class="section-title">📋 Interview History</div>
            <table class="success-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Round</th>
                  <th>Company</th>
                  <th>HR Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${candidate.interviews
                  .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((interview: any) => {
                    const statusClass = interview.status === 'completed' ? 'status-completed' :
                                       interview.status === 'confirmed' ? 'status-confirmed' :
                                       interview.status === 'pending' ? 'status-pending' :
                                       interview.status === 'cancelled' ? 'status-cancelled' : '';
                    return `
                      <tr>
                        <td>${new Date(interview.date).toLocaleDateString()}</td>
                        <td><span class="round-badge">${interview.round || 'N/A'}</span></td>
                        <td>${interview.company || 'N/A'}</td>
                        <td>${interview.hrName || 'N/A'}</td>
                        <td><span class="status-badge ${statusClass}">${interview.status || 'N/A'}</span></td>
                      </tr>
                    `;
                  }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Jiyaan Institute of Technology - Candidate Performance Report</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      setTimeout(() => {
        printWindow.print();
      }, 250);
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
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{candidate.name}</h3>
                    {candidate.offerStatus === 'Received' && (
                      <span className="bg-green-900/50 border border-green-500 text-green-300 text-xs px-2 py-1 rounded-full font-semibold">🎯 Placed</span>
                    )}
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
                    <div className="mt-1">📱 Interviews: {candidate.totalInterviews}</div>
                    {candidate.offerCount > 0 && (
                      <div className="mt-1 text-green-400 font-semibold">💌 Offers: {candidate.offerCount}</div>
                    )}
                    {candidate.offerStatus && (
                      <div className="mt-2 flex gap-2 items-center flex-wrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          candidate.offerStatus === 'Received' ? 'bg-green-900/50 text-green-300' :
                          candidate.offerStatus === 'Not Received' ? 'bg-red-900/50 text-red-300' :
                          'bg-yellow-900/50 text-yellow-300'
                        }`}>
                          💼 {candidate.offerStatus}
                        </span>
                        {candidate.packageLPA && (
                          <span className="text-white font-semibold">💰 {candidate.packageLPA} LPA</span>
                        )}
                        {candidate.offerStatus === 'Received' && candidate.offerReleasedDate && candidate.firstInterviewDate && (
                          <span className="text-blue-300 font-semibold">
                            ⏱️ {Math.ceil((new Date(candidate.offerReleasedDate).getTime() - new Date(candidate.firstInterviewDate).getTime()) / (1000 * 60 * 60 * 24))} days
                          </span>
                        )}
                      </div>
                    )}
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

                {/* Offer Information */}
                {candidate.offerStatus && (
                  <div className="bg-gradient-to-r from-purple-900/30 to-slate-900/30 border border-purple-500/50 rounded p-4">
                    <div className="text-sm font-semibold text-slate-300 mb-3">💼 Offer Information</div>
                    {candidate.offerCompany && (
                      <div className="mb-3 pb-3 border-b border-purple-500/30">
                        <div className="text-white font-bold text-lg">{candidate.offerCompany}</div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="text-center">
                        <div className="text-xs text-slate-400 mb-1">Offer Status</div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          candidate.offerStatus === 'Received' ? 'bg-green-900/50 text-green-300' :
                          candidate.offerStatus === 'Not Received' ? 'bg-red-900/50 text-red-300' :
                          'bg-yellow-900/50 text-yellow-300'
                        }`}>
                          {candidate.offerStatus}
                        </span>
                      </div>
                      {candidate.packageLPA && (
                        <>
                          <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">Package</div>
                            <div className="text-white font-semibold">₹ {candidate.packageLPA} LPA</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-slate-400 mb-1">Settlement</div>
                            <div className="text-green-400 font-semibold">₹ {(parseFloat(candidate.packageLPA) / 12).toFixed(2)} L/month</div>
                          </div>
                        </>
                      )}
                      {candidate.offerReleasedDate && (
                        <div className="text-center">
                          <div className="text-xs text-slate-400 mb-1">Released</div>
                          <div className="text-white font-semibold">{new Date(candidate.offerReleasedDate).toLocaleDateString()}</div>
                        </div>
                      )}
                      {candidate.joiningDate && (
                        <div className="text-center">
                          <div className="text-xs text-slate-400 mb-1">Joining</div>
                          <div className="text-white font-semibold">{new Date(candidate.joiningDate).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                      {['Screening', 'L1', 'L2', 'Client', 'HR'].map(roundName => {
                        const data = candidate.rounds.get(roundName);
                        if (!data) return null;
                        const successRate = getRoundSuccessRate(candidate, roundName);
                        return (
                          <div key={roundName} className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
                            <div className="text-xs text-slate-400 font-semibold mb-2">{roundName} Success Rate</div>
                            <div className={`text-3xl font-bold mb-2 ${successRate >= 75 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {successRate}%
                            </div>
                            <div className="text-xs text-slate-300">
                              <div>📊 {data.count} appeared</div>
                              <div>✅ {successRate}% progressed to next round</div>
                            </div>
                          </div>
                        );
                      })}
                      {Array.from(candidate.rounds.entries()).map(([round, data]) => {
                        if (['Screening', 'Online test', 'AI Round', 'L1', 'L2', 'Client', 'HR'].includes(round)) return null;
                        const successRate = getRoundSuccessRate(candidate, round);
                        return (
                          <div key={round} className="bg-slate-700/50 border border-slate-600 rounded-lg p-3">
                            <div className="text-xs text-slate-400 font-semibold mb-2">{round} Success Rate</div>
                            <div className={`text-3xl font-bold mb-2 ${successRate >= 75 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {successRate}%
                            </div>
                            <div className="text-xs text-slate-300">
                              <div>📊 {data.count} appeared</div>
                              <div>✅ {successRate}% progressed to next round</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* KPI: Round Progress by Company */}
                {candidate.interviews.length > 0 && (
                  <div className="bg-gradient-to-r from-indigo-900/30 to-slate-900/30 border border-indigo-500/50 rounded-lg p-4">
                    <div className="text-sm font-semibold text-slate-300 mb-4">🎯 KPI: Round Progress by Company</div>
                    <div className="space-y-4">
                      {(() => {
                        const rounds = ['Screening', 'Online test', 'AI Round', 'L1', 'L2', 'Client', 'HR', 'Offer'];
                        const companyMap = new Map<string, { maxRound: string; maxRoundIndex: number; interviews: any[] }>();

                        candidate.interviews.forEach(interview => {
                          if (!interview.company) return;
                          if (!companyMap.has(interview.company)) {
                            companyMap.set(interview.company, { maxRound: '', maxRoundIndex: -1, interviews: [] });
                          }
                          const data = companyMap.get(interview.company)!;
                          data.interviews.push(interview);
                          const roundIndex = rounds.indexOf(interview.round || '');
                          if (roundIndex > data.maxRoundIndex) {
                            data.maxRound = interview.round || '';
                            data.maxRoundIndex = roundIndex;
                          }
                        });

                        return Array.from(companyMap.entries()).map(([company, data]) => {
                          const positiveCount = data.interviews.filter(i => i.feedback === 'Positive').length;
                          const negativeCount = data.interviews.filter(i => i.feedback === 'Negative').length;
                          const waitingCount = data.interviews.filter(i => i.feedback === 'Waiting' || !i.feedback).length;

                          return (
                            <div key={company} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                              <div className="mb-3">
                                <div className="text-white font-bold text-lg mb-2">{company}</div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {rounds.map((round, idx) => (
                                    <div
                                      key={round}
                                      className={`px-2 py-1 rounded text-xs font-semibold ${
                                        idx <= data.maxRoundIndex
                                          ? 'bg-green-600/70 text-green-100 border border-green-500'
                                          : 'bg-slate-700 text-slate-400 border border-slate-600'
                                      }`}
                                    >
                                      {round}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                <div className="bg-slate-900/50 rounded p-2 text-center">
                                  <div className="text-xs text-slate-400">Current</div>
                                  <div className="text-sm font-bold text-blue-400 mt-1">{data.maxRound || 'N/A'}</div>
                                </div>
                                <div className="bg-slate-900/50 rounded p-2 text-center">
                                  <div className="text-xs text-slate-400">Total</div>
                                  <div className="text-sm font-bold text-white mt-1">{data.interviews.length}</div>
                                </div>
                                <div className="bg-green-900/50 rounded p-2 text-center border border-green-600">
                                  <div className="text-xs text-slate-400">🟢 Positive</div>
                                  <div className="text-sm font-bold text-green-400 mt-1">{positiveCount}</div>
                                </div>
                                <div className="bg-red-900/50 rounded p-2 text-center border border-red-600">
                                  <div className="text-xs text-slate-400">🔴 Negative</div>
                                  <div className="text-sm font-bold text-red-400 mt-1">{negativeCount}</div>
                                </div>
                                <div className="bg-yellow-900/50 rounded p-2 text-center border border-yellow-600">
                                  <div className="text-xs text-slate-400">⏳ Waiting</div>
                                  <div className="text-sm font-bold text-yellow-400 mt-1">{waitingCount}</div>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}

                {/* Interview History */}
                {candidate.interviews.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-sm font-semibold text-slate-300">📋 Interview History</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => exportToPDF(candidate)}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-semibold transition-all"
                        >
                          📄 Export PDF
                        </button>
                        <button
                          onClick={() => exportToCSV(candidate)}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded font-semibold transition-all"
                        >
                          📥 Export CSV
                        </button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-600">
                            <th className="text-left py-2 px-3 text-slate-300">Date</th>
                            <th className="text-left py-2 px-3 text-slate-300">Round</th>
                            <th className="text-left py-2 px-3 text-slate-300">Company</th>
                            <th className="text-left py-2 px-3 text-slate-300">HR Name</th>
                            <th className="text-left py-2 px-3 text-slate-300">HR Number</th>
                            <th className="text-left py-2 px-3 text-slate-300">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {candidate.interviews
                            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((interview: any, idx: number) => (
                              <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                                <td className="py-2 px-3 text-slate-300">{new Date(interview.date).toLocaleDateString()}</td>
                                <td className="py-2 px-3">
                                  <span className="bg-purple-900/50 text-purple-300 px-2 py-1 rounded text-xs font-semibold">
                                    {interview.round || 'N/A'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-300">{interview.company || 'N/A'}</td>
                                <td className="py-2 px-3 text-slate-300">{interview.hrName || 'N/A'}</td>
                                <td className="py-2 px-3 text-slate-300">{interview.hrNumber || 'N/A'}</td>
                                <td className="py-2 px-3">
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
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
