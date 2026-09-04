'use client';

import { useState, useEffect } from 'react';
import { InterviewSlot } from '@/lib/types';
import { markCandidateInactive, markCandidateActive, getAllInactiveCandidates, updateCandidateProfileByEmail, updateSlot, getCandidateProfileByEmail, markCandidatePlaced, markCandidateDropped, markCandidateNotDropped, getAllDroppedCandidates } from '@/lib/firestore';

interface CandidatesTabProps {
  slots: InterviewSlot[];
  isAdmin?: boolean;
}

export default function CandidatesTab({ slots, isAdmin = false }: CandidatesTabProps) {
  const [filterCandidate, setFilterCandidate] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [inactiveCandidates, setInactiveCandidates] = useState(new Set<string>());
  const [droppedCandidates, setDroppedCandidates] = useState(new Set<string>());
  const [showPasswordReset, setShowPasswordReset] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', phone: '', batchNo: '' });

  // Load inactive and dropped candidates from Firestore on mount
  useEffect(() => {
    const loadCandidateStatuses = async () => {
      const inactiveEmails = await getAllInactiveCandidates();
      setInactiveCandidates(new Set(inactiveEmails));
      const droppedEmails = await getAllDroppedCandidates();
      setDroppedCandidates(new Set(droppedEmails));
    };
    loadCandidateStatuses();
    // Reset filters on mount to show all candidates
    setFilterCandidate('');
    setFilterActive('');
  }, []);

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

  // Filter by candidate name (case-insensitive, trimmed)
  if (filterCandidate) {
    candidates = candidates.filter(c => c.name.trim().toLowerCase() === filterCandidate.trim().toLowerCase());
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
    .filter(c => !inactiveCandidates.has(c.email) && !droppedCandidates.has(c.email)).length;
  const inactiveCount = Array.from(candidatesMap.values())
    .filter(c => inactiveCandidates.has(c.email)).length;

  // Count placed candidates (those with at least one offer received)
  const placedCount = Array.from(candidatesMap.values())
    .filter(c => c.interviews.some(i => i.offerStatus === 'Received')).length;

  // Count dropped candidates
  const droppedCount = droppedCandidates.size;

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

  const handleMarkAsPlaced = async (email: string, candidateName: string) => {
    if (confirm(`Mark ${candidateName} as Placed? This will update their placement status.`)) {
      try {
        await markCandidatePlaced(email);
        alert('✅ Candidate marked as placed successfully!');
        window.location.reload();
      } catch (error) {
        console.error('Error marking candidate as placed:', error);
        alert('❌ Failed to mark candidate as placed');
      }
    }
  };

  const handleMarkAsDrop = async (email: string, candidateName: string) => {
    if (confirm(`⚠️ Mark ${candidateName} as Drop?\n\nThey will NOT be able to login to the system.\n\nThis action cannot be easily undone.`)) {
      try {
        const newSet = new Set(droppedCandidates);
        await markCandidateDropped(email);
        newSet.add(email);
        setDroppedCandidates(newSet);
        alert('✅ Candidate marked as dropped successfully!');
      } catch (error) {
        console.error('Error marking candidate as dropped:', error);
        alert('❌ Failed to mark candidate as dropped');
      }
    }
  };

  const handleMarkAsNotDrop = async (email: string, candidateName: string) => {
    if (confirm(`Remove drop status for ${candidateName}? They will be able to login again.`)) {
      try {
        const newSet = new Set(droppedCandidates);
        await markCandidateNotDropped(email);
        newSet.delete(email);
        setDroppedCandidates(newSet);
        alert('✅ Drop status removed successfully!');
      } catch (error) {
        console.error('Error removing drop status:', error);
        alert('❌ Failed to remove drop status');
      }
    }
  };

  const startEdit = async (candidate: { name: string; email: string; phone: string; interviews: InterviewSlot[] }) => {
    // Fetch candidate profile from Firestore to get the latest batchNo
    const profile = await getCandidateProfileByEmail(candidate.email);
    const batchNo = profile?.batchNo || '';
    setEditingEmail(candidate.email);
    setEditFormData({ name: candidate.name, email: candidate.email, phone: candidate.phone, batchNo });
  };

  const saveEdit = async () => {
    if (!editingEmail || !editFormData.name || !editFormData.email || !editFormData.phone || !editFormData.batchNo) {
      alert('All fields are required');
      return;
    }

    if (window.confirm('⚠️ Save changes?\n\nName: ' + editFormData.name + '\nEmail: ' + editFormData.email + '\nPhone: ' + editFormData.phone + '\nBatch: ' + editFormData.batchNo)) {
      try {
        console.log('Saving candidate profile for:', editingEmail);

        // Update candidate profile in Firestore
        await updateCandidateProfileByEmail(editingEmail, {
          name: editFormData.name,
          phone: editFormData.phone,
          batchNo: editFormData.batchNo,
        });
        console.log('✅ Candidate profile updated');

        // Update all slots with old email to new candidate info
        const slotsToUpdate = slots.filter(slot => slot.candidateEmail === editingEmail);
        console.log(`Updating ${slotsToUpdate.length} interview slots`);

        for (const slot of slotsToUpdate) {
          await updateSlot(slot.id, {
            candidateName: editFormData.name,
            candidateEmail: editFormData.email,
            candidatePhone: editFormData.phone,
            batchNo: editFormData.batchNo,
          });
        }
        console.log('✅ All slots updated');

        alert('✅ Changes saved successfully!');
        setEditingEmail(null);
      } catch (error) {
        console.error('Error saving changes:', error);
        alert('❌ Failed to save changes: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
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
      <div className="flex gap-3 mb-8 justify-start">
        <div className="border-2 border-blue-500 rounded-lg px-6 py-3 bg-slate-800 flex-1">
          <div className="text-blue-400 text-base font-semibold">Total</div>
          <div className="text-white text-3xl font-bold">{totalCandidates}</div>
        </div>
        <div className="border-2 border-green-500 rounded-lg px-6 py-3 bg-slate-800 flex-1">
          <div className="text-green-400 text-base font-semibold">Active</div>
          <div className="text-white text-3xl font-bold">{activeCandidates}</div>
        </div>
        <div className="border-2 border-red-500 rounded-lg px-6 py-3 bg-slate-800 flex-1">
          <div className="text-red-400 text-base font-semibold">Inactive</div>
          <div className="text-white text-3xl font-bold">{inactiveCount}</div>
        </div>
        <div className="border-2 border-purple-500 rounded-lg px-6 py-3 bg-slate-800 flex-1">
          <div className="text-purple-400 text-base font-semibold">Placed</div>
          <div className="text-white text-3xl font-bold">{placedCount}</div>
        </div>
        <div className="border-2 border-gray-500 rounded-lg px-6 py-3 bg-slate-800 flex-1">
          <div className="text-gray-400 text-base font-semibold">Dropped</div>
          <div className="text-white text-3xl font-bold">{droppedCount}</div>
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
                    {droppedCandidates.has(candidate.email) ? (
                      <span className="text-xs px-2 py-1 rounded-full font-semibold bg-black/50 text-gray-300 border border-gray-600">
                        ⛔ Dropped
                      </span>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        inactiveCandidates.has(candidate.email)
                          ? 'bg-red-900/50 text-red-300 border border-red-500'
                          : 'bg-green-900/50 text-green-300 border border-green-500'
                      }`}>
                        {inactiveCandidates.has(candidate.email) ? '❌ Inactive' : '✅ Active'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400 space-y-1">
                    <div>📧 {candidate.email}</div>
                    <div>📱 {candidate.phone}</div>
                    <div className="text-sm text-slate-300 font-semibold pt-2">
                      📦 Batch No: <span className="text-white bg-slate-700 px-2 py-1 rounded">{candidate.interviews[0]?.batchNo || 'Not Set'}</span>
                    </div>
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
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleMarkAsPlaced(candidate.email, candidate.name)}
                        className="px-3 py-2 rounded-lg text-xs font-semibold transition-all w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        🎯 Mark as Placed
                      </button>
                      <button
                        onClick={() => droppedCandidates.has(candidate.email)
                          ? handleMarkAsNotDrop(candidate.email, candidate.name)
                          : handleMarkAsDrop(candidate.email, candidate.name)
                        }
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all w-full ${
                          droppedCandidates.has(candidate.email)
                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                            : 'bg-orange-600 hover:bg-orange-700 text-white'
                        }`}
                      >
                        {droppedCandidates.has(candidate.email) ? '↩️ Restore Drop' : '⛔ Mark as Drop'}
                      </button>
                    </>
                  )}
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
                  <button
                    onClick={() => startEdit({ name: candidate.name, email: candidate.email, phone: candidate.phone, interviews: candidate.interviews })}
                    className="px-3 py-2 rounded-lg text-xs font-semibold transition-all w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    ✏️ Edit Info
                  </button>
                </div>
              </div>

              {/* Edit Form */}
              {editingEmail === candidate.email && (
                <div className="mt-4 p-4 bg-purple-900/30 border border-purple-600 rounded-lg">
                  <h4 className="text-purple-300 font-semibold mb-3">Edit Candidate Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Full Name *</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Email Address *</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        placeholder="Email"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Phone Number *</label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        placeholder="Phone"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Batch No *</label>
                      <input
                        type="text"
                        value={editFormData.batchNo}
                        onChange={(e) => setEditFormData({ ...editFormData, batchNo: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                        placeholder="e.g., Batch#9"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={saveEdit}
                        className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold"
                      >
                        ✅ Save
                      </button>
                      <button
                        onClick={() => setEditingEmail(null)}
                        className="flex-1 px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-semibold"
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}


            </div>
          ))}
        </div>
      )}
    </div>
  );
}
