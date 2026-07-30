'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';
import { markCandidateInactive, markCandidateActive } from '@/lib/firestore';

interface CandidatesTabProps {
  slots: InterviewSlot[];
}

export default function CandidatesTab({ slots }: CandidatesTabProps) {
  const [filterCandidate, setFilterCandidate] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [inactiveCandidates, setInactiveCandidates] = useState(new Set<string>());
  const [showPasswordReset, setShowPasswordReset] = useState<string | null>(null);
  const [statusBreakdownDate, setStatusBreakdownDate] = useState('');
  const [statusBreakdownFilter, setStatusBreakdownFilter] = useState('');

  // Get unique candidates with their details
  const candidatesMap = new Map<string, {
    name: string;
    email: string;
    phone: string;
    interviews: InterviewSlot[];
  }>();

  slots.forEach(slot => {
    if (slot.candidateName && slot.candidateEmail) {
      if (!candidatesMap.has(slot.candidateEmail)) {
        candidatesMap.set(slot.candidateEmail, {
          name: slot.candidateName,
          email: slot.candidateEmail,
          phone: slot.candidatePhone || 'N/A',
          interviews: []
        });
      }
      candidatesMap.get(slot.candidateEmail)!.interviews.push(slot);
    }
  });

  let candidates = Array.from(candidatesMap.values());
  const totalCandidates = candidates.length;

  // Get unique candidate names for dropdown (deduplicated, case-insensitive, trimmed)
  const uniqueNameMap = new Map<string, string>();
  Array.from(candidatesMap.values()).forEach(c => {
    const normalizedName = c.name.trim().toLowerCase();
    if (!uniqueNameMap.has(normalizedName)) {
      uniqueNameMap.set(normalizedName, c.name.trim());
    }
  });
  const candidateNames = Array.from(uniqueNameMap.values())
    .sort((a, b) => a.localeCompare(b));

  // Filter by candidate name
  if (filterCandidate) {
    candidates = candidates.filter(c => c.name === filterCandidate);
  }

  // Filter by active/inactive status
  if (filterActive === 'active') {
    candidates = candidates.filter(c => !inactiveCandidates.has(c.email));
  } else if (filterActive === 'inactive') {
    candidates = candidates.filter(c => inactiveCandidates.has(c.email));
  }

  // Sort by name
  candidates.sort((a, b) => a.name.localeCompare(b.name));

  const activeCandidates = Array.from(candidatesMap.values())
    .filter(c => !inactiveCandidates.has(c.email)).length;
  const inactiveCount = Array.from(candidatesMap.values())
    .filter(c => inactiveCandidates.has(c.email)).length;

  // Calculate overall statistics
  const allCandidates = Array.from(candidatesMap.values());
  const overallStats = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    postponed: 0,
  };

  allCandidates.forEach(candidate => {
    candidate.interviews.forEach(interview => {
      if (interview.status === 'pending') overallStats.pending++;
      else if (interview.status === 'confirmed') overallStats.confirmed++;
      else if (interview.status === 'completed') overallStats.completed++;
      else if (interview.status === 'cancelled') overallStats.cancelled++;
      else if (interview.status === 'postponed') overallStats.postponed++;
    });
  });

  const toggleCandidateStatus = async (email: string) => {
    try {
      const newSet = new Set(inactiveCandidates);
      if (newSet.has(email)) {
        // Mark as active
        await markCandidateActive(email);
        newSet.delete(email);
      } else {
        // Mark as inactive
        await markCandidateInactive(email);
        newSet.add(email);
      }
      setInactiveCandidates(newSet);
    } catch (error) {
      console.error('Error updating candidate status:', error);
      alert('Failed to update candidate status');
    }
  };

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
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHours = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHours}:${minutes} ${period}`;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">👥 All Candidates</h2>
      <p className="text-slate-400 mb-6">View and manage candidate information and their interview history</p>

      {/* Candidate Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 border border-blue-500/50 rounded-lg p-4">
          <div className="text-blue-400 text-sm font-semibold mb-1">Total Candidates</div>
          <div className="text-3xl font-bold text-white">{totalCandidates}</div>
        </div>
        <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 border border-green-500/50 rounded-lg p-4">
          <div className="text-green-400 text-sm font-semibold mb-1">Active</div>
          <div className="text-3xl font-bold text-white">{activeCandidates}</div>
        </div>
        <div className="bg-gradient-to-br from-red-900/30 to-red-900/10 border border-red-500/50 rounded-lg p-4">
          <div className="text-red-400 text-sm font-semibold mb-1">Inactive</div>
          <div className="text-3xl font-bold text-white">{inactiveCount}</div>
        </div>
      </div>


      {/* Filter */}
      <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">👤 Filter by Candidate</label>
            <select
              value={filterCandidate}
              onChange={(e) => setFilterCandidate(e.target.value)}
              className="input-field w-full"
            >
              <option value="">-- All Candidates --</option>
              {candidateNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">🔐 Active Status</label>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="input-field w-full"
            >
              <option value="">-- All --</option>
              <option value="active">✅ Active</option>
              <option value="inactive">❌ Inactive</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterCandidate('');
                setFilterActive('');
                setShowPasswordReset(null);
              }}
              className="w-full py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
            >
              Clear Filters
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-2">Showing {candidates.length} of {totalCandidates} candidate(s)</p>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-slate-400 text-lg mb-2">No candidates found</p>
          <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-6">
          {candidates.map((candidate, idx) => (
            <div key={candidate.email} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-all">
              {/* Candidate Header */}
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-600">
                <div className="flex-1">
                  <div className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="bg-purple-600 px-3 py-1 rounded-full text-sm font-bold">{idx + 1}</span>
                    {candidate.name}
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                      inactiveCandidates.has(candidate.email)
                        ? 'bg-red-900/50 text-red-300 border border-red-500'
                        : 'bg-green-900/50 text-green-300 border border-green-500'
                    }`}>
                      {inactiveCandidates.has(candidate.email) ? '❌ Inactive' : '✅ Active'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 space-y-1">
                    <div>📧 {candidate.email}</div>
                    <div>📱 {candidate.phone}</div>
                    <div className="text-xs text-slate-500 pt-1">
                      <div>🔐 Password Protected</div>
                      {showPasswordReset === candidate.email && (
                        <div className="mt-2 p-2 bg-slate-900/50 rounded border border-blue-500/50">
                          <div className="text-xs text-blue-300 mb-2">
                            🔄 To reset password, send this link to candidate:
                          </div>
                          <div className="text-xs text-slate-300 break-all font-mono bg-slate-800 p-2 rounded">
                            https://interview-booking-system-ifph-theta.vercel.app/reset-password?email={candidate.email}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `https://interview-booking-system-ifph-theta.vercel.app/reset-password?email=${candidate.email}`
                              );
                              alert('Password reset link copied to clipboard!');
                            }}
                            className="text-xs mt-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                          >
                            📋 Copy Link
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div>
                    <div className="text-3xl font-bold text-blue-400 mb-1">{candidate.interviews.length}</div>
                    <div className="text-xs text-slate-400">Total Interviews</div>
                  </div>
                  <button
                    onClick={() => setShowPasswordReset(showPasswordReset === candidate.email ? null : candidate.email)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold transition-all w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    🔐 Reset Password
                  </button>
                  <button
                    onClick={() => toggleCandidateStatus(candidate.email)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all w-full ${
                      inactiveCandidates.has(candidate.email)
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {inactiveCandidates.has(candidate.email) ? '♻️ Make Active' : '🚫 Make Inactive'}
                  </button>
                </div>
              </div>

              {/* Status Summary - Candidate Wise Statistics */}
              <div className="mb-4 pb-4 border-b border-slate-600">
                <h4 className="text-sm font-bold text-slate-300 mb-3">📊 Interview Status Breakdown:</h4>
                <div className="grid grid-cols-5 gap-2">
                  {['pending', 'confirmed', 'completed', 'cancelled', 'postponed'].map(status => {
                    const count = candidate.interviews.filter(i => i.status === status).length;
                    const icons: Record<string, string> = {
                      pending: '⏳',
                      confirmed: '✅',
                      completed: '✓',
                      cancelled: '❌',
                      postponed: '⏸️'
                    };
                    const colors: Record<string, string> = {
                      pending: 'bg-yellow-900/30 border-yellow-600 text-yellow-300',
                      confirmed: 'bg-green-900/30 border-green-600 text-green-300',
                      completed: 'bg-blue-900/30 border-blue-600 text-blue-300',
                      cancelled: 'bg-red-900/30 border-red-600 text-red-300',
                      postponed: 'bg-orange-900/30 border-orange-600 text-orange-300'
                    };
                    return (
                      <div key={status} className={`text-center p-2 rounded border ${colors[status]}`}>
                        <div className="text-xl mb-1">{icons[status]}</div>
                        <div className="text-xs font-semibold capitalize">{status}</div>
                        <div className="font-bold text-lg">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interview Details */}
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-3">📋 Interview History:</h4>

                {/* Filters for Interview History */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Filter by Date</label>
                    <input
                      type="date"
                      value={statusBreakdownDate}
                      onChange={(e) => setStatusBreakdownDate(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Filter by Status</label>
                    <select
                      value={statusBreakdownFilter}
                      onChange={(e) => setStatusBreakdownFilter(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white"
                    >
                      <option value="">-- All Status --</option>
                      <option value="pending">⏳ Pending</option>
                      <option value="confirmed">✅ Confirmed</option>
                      <option value="completed">✓ Completed</option>
                      <option value="cancelled">❌ Cancelled</option>
                      <option value="postponed">⏸️ Postponed</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setStatusBreakdownDate('');
                        setStatusBreakdownFilter('');
                      }}
                      className="w-full px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-semibold transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {candidate.interviews
                    .filter(i => !statusBreakdownDate || i.date === statusBreakdownDate)
                    .filter(i => !statusBreakdownFilter || i.status === statusBreakdownFilter)
                    .sort((a, b) => new Date(b.date + 'T00:00:00').getTime() - new Date(a.date + 'T00:00:00').getTime())
                    .map((interview) => (
                      <div key={interview.id} className="bg-slate-700/50 rounded p-3 border border-slate-600">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-semibold text-white">
                            {new Date(interview.date + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })} @ {formatTime(interview.time)}
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(interview.status)}`}>
                            {getStatusLabel(interview.status)}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <div className="text-slate-400">Company</div>
                            <div className="text-white font-semibold">{interview.company}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">Duration</div>
                            <div className="text-white font-semibold">{interview.duration}</div>
                          </div>
                          {interview.round && (
                            <div>
                              <div className="text-slate-400">Round</div>
                              <div className="text-white font-semibold">{interview.round}</div>
                            </div>
                          )}
                          {interview.room && (
                            <div>
                              <div className="text-slate-400">🚪 Room</div>
                              <div className="text-green-400 font-semibold">{interview.room}</div>
                            </div>
                          )}
                          {interview.interviewStatus && (
                            <div>
                              <div className="text-slate-400">Status</div>
                              <div className="text-blue-400 font-semibold">{interview.interviewStatus}</div>
                            </div>
                          )}
                          {interview.feedback && (
                            <div>
                              <div className="text-slate-400">Feedback</div>
                              <div className="text-white font-semibold">{interview.feedback}</div>
                            </div>
                          )}
                          {interview.reason && (
                            <div>
                              <div className="text-slate-400">Reason</div>
                              <div className="text-orange-400 font-semibold">{interview.reason}</div>
                            </div>
                          )}
                        </div>
                        {interview.comments && (
                          <div className="mt-2 pt-2 border-t border-slate-600">
                            <div className="text-xs text-slate-400">Comments:</div>
                            <div className="text-xs text-slate-300 italic">{interview.comments}</div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
