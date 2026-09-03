'use client';

import { InterviewSlot } from '@/lib/types';

interface MyPerformanceTabProps {
  slots: InterviewSlot[];
  candidateEmail: string;
}

export default function MyPerformanceTab({ slots, candidateEmail }: MyPerformanceTabProps) {
  const myInterviews = slots.filter(slot => slot.candidateEmail === candidateEmail);

  if (myInterviews.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-4">📊</div>
        <p className="text-slate-400 text-lg mb-2">No interviews scheduled yet</p>
        <p className="text-slate-500 text-sm">Go to "Book Interview" tab to schedule your first interview</p>
      </div>
    );
  }

  const totalInterviews = myInterviews.length;
  const completed = myInterviews.filter(s => s.status === 'completed').length;
  const confirmed = myInterviews.filter(s => s.status === 'confirmed').length;
  const pending = myInterviews.filter(s => s.status === 'pending').length;
  const cancelled = myInterviews.filter(s => s.status === 'cancelled').length;
  const completionRate = Math.round((completed / totalInterviews) * 100);

  const candidateName = myInterviews[0]?.candidateName || 'Candidate';

  // Offer info
  const offerInterviews = myInterviews.filter(i => i.offerStatus === 'Received');
  const offerInfo = offerInterviews.length > 0 ? offerInterviews[0] : null;
  const isPlaced = !!offerInfo;

  // Calculate days to offer
  let daysToOffer: number | null = null;
  if (offerInfo?.offerReleasedDate) {
    const first = new Date(myInterviews[myInterviews.length - 1]?.date || new Date());
    const released = new Date(offerInfo.offerReleasedDate);
    daysToOffer = Math.floor((released.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Round success rates
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

  const exportToPDF = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${candidateName} - Performance Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; }
          .page { background: #ffffff; min-height: 100vh; padding: 40px; max-width: 900px; margin: auto; }
          .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; text-align: center; border: 2px solid #667eea; }
          .logo { font-size: 28px; font-weight: bold; margin-bottom: 15px; color: #a78bfa; }
          .candidate-name { font-size: 36px; font-weight: bold; margin: 15px 0; color: #f1f5f9; }
          .candidate-email { font-size: 14px; color: #cbd5e1; }
          .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
          .metric-card { background: #f8fafc; padding: 25px; border-radius: 10px; border-left: 6px solid #667eea; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .metric-value { font-size: 36px; font-weight: bold; color: #667eea; }
          .metric-label { font-size: 12px; color: #64748b; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
          .section { margin: 35px 0; }
          .section-title { font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 15px; border-bottom: 3px solid #667eea; padding-bottom: 12px; }
          .offer-info { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 25px; border-radius: 10px; border: 2px solid #a78bfa; }
          .offer-company { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #c4b5fd; }
          .offer-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .offer-detail { padding: 15px; background: rgba(167, 139, 250, 0.1); border-radius: 8px; border-left: 3px solid #a78bfa; }
          .offer-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
          .offer-value { font-size: 18px; font-weight: bold; margin-top: 8px; color: #f1f5f9; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #334155; color: #f1f5f9; padding: 14px; text-align: left; font-size: 12px; font-weight: 600; border: 1px solid #475569; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #1e293b; }
          tr:nth-child(even) { background: #f8fafc; }
          .status-badge { display: inline-block; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; }
          .status-completed { background: #d1fae5; color: #065f46; }
          .status-confirmed { background: #dbeafe; color: #0c4a6e; }
          .status-pending { background: #fef3c7; color: #78350f; }
          .status-cancelled { background: #fee2e2; color: #7f1d1d; }
          .round-badge { display: inline-block; padding: 6px 12px; border-radius: 6px; background: #e0e7ff; color: #4c1d95; font-size: 11px; font-weight: 600; }
          .footer { text-align: center; margin-top: 40px; color: #94a3b8; font-size: 12px; border-top: 2px solid #e2e8f0; padding-top: 20px; }
          .completion-bar { width: 100%; background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden; margin-top: 12px; }
          .completion-fill { height: 100%; background: linear-gradient(90deg, #667eea 0%, #7c3aed 100%); width: ${completionRate}%; }
          .success-table { font-size: 12px; }
          .success-table td { padding: 12px; }
          .success-rate-high { color: #059669; font-weight: bold; }
          .success-rate-medium { color: #d97706; font-weight: bold; }
          .success-rate-low { color: #dc2626; font-weight: bold; }
          @media print { body { background: white; } .page { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div class="header">
            <div class="logo">🎓 Jiyaan Institute of Technology</div>
            <div class="candidate-name">${candidateName}</div>
            <div class="candidate-email">${candidateEmail}</div>
          </div>

          <!-- Completion Rate -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${completionRate}%</div>
              <div class="metric-label">Completion Rate</div>
              <div class="completion-bar"><div class="completion-fill"></div></div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${totalInterviews}</div>
              <div class="metric-label">Total Interviews</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${completed}</div>
              <div class="metric-label">Completed</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${confirmed}</div>
              <div class="metric-label">Confirmed</div>
            </div>
          </div>

          ${offerInfo ? `
          <!-- Offer Information -->
          <div class="section">
            <div class="offer-info">
              <div class="offer-company">${offerInfo.company}</div>
              <div class="offer-details">
                <div class="offer-detail">
                  <div class="offer-label">Offer Status</div>
                  <div class="offer-value">✓ ${offerInfo.offerStatus}</div>
                </div>
                <div class="offer-detail">
                  <div class="offer-label">Package</div>
                  <div class="offer-value">₹ ${offerInfo.packageLPA} LPA</div>
                </div>
                <div class="offer-detail">
                  <div class="offer-label">Monthly Settlement</div>
                  <div class="offer-value">₹ ${(parseFloat(offerInfo.packageLPA || '0') / 12).toFixed(2)} L</div>
                </div>
                <div class="offer-detail">
                  <div class="offer-label">Days to Offer</div>
                  <div class="offer-value">⏱️ ${daysToOffer} days</div>
                </div>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Round-wise Success Rates -->
          ${roundMap.size > 0 ? `
          <div class="section">
            <div class="section-title">🎯 Round-wise Success Rates</div>
            <table class="success-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Success Rate</th>
                  <th>Appeared</th>
                  <th>Progressed</th>
                </tr>
              </thead>
              <tbody>
                ${['Screening', 'Online test', 'AI Round', 'L1', 'L2', 'Client', 'HR'].map(roundName => {
                  const data = roundMap.get(roundName);
                  if (!data) return '';
                  const successRate = getRoundSuccessRate(roundName);
                  const rateClass = successRate >= 75 ? 'success-rate-high' : successRate >= 50 ? 'success-rate-medium' : 'success-rate-low';
                  return `
                    <tr>
                      <td>${roundName}</td>
                      <td class="${rateClass}">${successRate}%</td>
                      <td>${data.count}</td>
                      <td>${data.progressed}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <!-- Interview History -->
          <div class="section">
            <div class="section-title">📋 Interview History</div>
            <table>
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
                ${myInterviews
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(interview => {
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
            <p>Jiyaan Institute of Technology - Interview Performance Report</p>
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

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-lg border border-slate-700 shadow-xl">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{candidateName}</h1>
              {isPlaced && (
                <span className="bg-green-900/50 text-green-400 px-3 py-1 rounded-full text-sm font-semibold border border-green-500">
                  🎯 Placed
                </span>
              )}
            </div>
            <div className="text-slate-400 mb-3">{candidateEmail}</div>
            <div className="flex gap-6 text-sm">
              <div className="text-slate-400">📱 Interviews: <span className="text-white font-semibold">{totalInterviews}</span></div>
              {offerInfo && (
                <div className="text-slate-400">💌 Offers: <span className="text-white font-semibold">1</span></div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold ${completionRate === 100 ? 'text-green-400' : completionRate >= 75 ? 'text-blue-400' : completionRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {completionRate}%
            </div>
            <div className="text-slate-400 text-sm">Completion</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            📄 Export PDF
          </button>
          <button
            onClick={exportToCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Completion Progress */}
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-white">Completion Progress</h3>
          <span className="text-2xl font-bold text-blue-400">{completionRate}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${completionRate === 100 ? 'bg-green-500' : completionRate >= 75 ? 'bg-blue-500' : completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      {/* Offer Information */}
      {offerInfo && (
        <div className="bg-gradient-to-r from-purple-900/30 to-slate-800 p-6 rounded-lg border border-purple-500 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">🎁 Offer Information</h3>
          <div className="space-y-3">
            <div className="text-2xl font-bold text-purple-400">{offerInfo.company}</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-slate-400">Offer Status</div>
                <div className="text-green-400 font-semibold text-lg">✓ {offerInfo.offerStatus}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Package</div>
                <div className="text-white font-semibold text-lg">₹ {offerInfo.packageLPA} LPA</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Settlement (Monthly)</div>
                <div className="text-green-400 font-semibold text-lg">₹ {(parseFloat(offerInfo.packageLPA || '0') / 12).toFixed(2)} L/month</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Released Date</div>
                <div className="text-white font-semibold">{offerInfo.offerReleasedDate ? new Date(offerInfo.offerReleasedDate).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Expected Joining</div>
                <div className="text-white font-semibold">{offerInfo.joiningDate ? new Date(offerInfo.joiningDate).toLocaleDateString() : 'N/A'}</div>
              </div>
              {daysToOffer !== null && (
                <div>
                  <div className="text-sm text-slate-400">Days to Offer</div>
                  <div className="text-white font-semibold">⏱️ {daysToOffer} days</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interview Status Breakdown */}
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4">Interview Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{totalInterviews}</div>
            <div className="text-xs text-slate-400 mt-1">Total</div>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{completed}</div>
            <div className="text-xs text-slate-400 mt-1">Completed</div>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{confirmed}</div>
            <div className="text-xs text-slate-400 mt-1">Confirmed</div>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-400">{pending}</div>
            <div className="text-xs text-slate-400 mt-1">Pending</div>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">{cancelled}</div>
            <div className="text-xs text-slate-400 mt-1">Cancelled</div>
          </div>
        </div>
      </div>

      {/* Round-wise Success Rates */}
      {roundMap.size > 0 && (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-4">🎯 Round-wise Success Rates</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Round</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Success Rate</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Appeared</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-semibold">Progressed</th>
                </tr>
              </thead>
              <tbody>
                {['Screening', 'Online test', 'AI Round', 'L1', 'L2', 'Client', 'HR'].map(roundName => {
                  const data = roundMap.get(roundName);
                  if (!data) return null;
                  const successRate = getRoundSuccessRate(roundName);
                  return (
                    <tr key={roundName} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="py-3 px-4 text-white font-semibold">{roundName}</td>
                      <td className="py-3 px-4">
                        <span className={`font-bold ${successRate >= 75 ? 'text-green-400' : successRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {successRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{data.count}</td>
                      <td className="py-3 px-4 text-slate-300">{data.progressed}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Interview History */}
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
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
          <table className="w-full text-sm">
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
