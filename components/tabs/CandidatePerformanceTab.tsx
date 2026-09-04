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

  useEffect(() => {
    const loadInactiveCandidates = async () => {
      const inactiveEmails = await getAllInactiveCandidates();
      setInactiveCandidates(new Set(inactiveEmails));
    };
    loadInactiveCandidates();
  }, []);

  // Build simple candidate list
  const candidates = useMemo(() => {
    const candidateMap = new Map<string, {
      name: string;
      email: string;
      batchNo: string;
      totalInterviews: number;
      isInactive: boolean;
    }>();

    slots.forEach(slot => {
      if (!slot.candidateName || !slot.candidateEmail) return;

      const key = slot.candidateEmail;
      if (!candidateMap.has(key)) {
        candidateMap.set(key, {
          name: slot.candidateName,
          email: slot.candidateEmail,
          batchNo: slot.batchNo || 'N/A',
          totalInterviews: 0,
          isInactive: inactiveCandidates.has(slot.candidateEmail),
        });
      }

      const data = candidateMap.get(key)!;
      data.totalInterviews++;
    });

    return Array.from(candidateMap.values());
  }, [slots, inactiveCandidates]);

  // Apply filters
  let filtered = candidates;
  if (filterName) {
    filtered = filtered.filter(c => c.name.toLowerCase().includes(filterName.toLowerCase()));
  }
  if (filterBatch) {
    filtered = filtered.filter(c => c.batchNo === filterBatch);
  }
  if (filterStatus === 'active') {
    filtered = filtered.filter(c => !c.isInactive);
  } else if (filterStatus === 'inactive') {
    filtered = filtered.filter(c => c.isInactive);
  }

  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  const batches = Array.from(new Set(candidates.map(c => c.batchNo))).sort();
  const names = Array.from(new Set(candidates.map(c => c.name))).sort();

  if (candidates.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-4">📊</div>
        <p className="text-slate-400 text-lg mb-2">No candidate data yet</p>
        <p className="text-slate-500">Book interviews to see candidates here</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">📊 Candidate List</h2>
      <p className="text-slate-400 mb-6">All candidates with interview bookings</p>

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

      {/* Simple Candidate List */}
      <div className="overflow-x-auto bg-slate-800 rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-600 bg-slate-900/50">
              <th className="text-left py-4 px-4 text-slate-300 font-semibold">Candidate Name</th>
              <th className="text-left py-4 px-4 text-slate-300 font-semibold">Email</th>
              <th className="text-left py-4 px-4 text-slate-300 font-semibold">Batch No</th>
              <th className="text-center py-4 px-4 text-slate-300 font-semibold">Total Interviews</th>
              <th className="text-center py-4 px-4 text-slate-300 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((candidate, idx) => (
              <tr key={candidate.email} className={`border-b border-slate-700 ${idx % 2 === 0 ? 'bg-slate-800/50' : ''} hover:bg-slate-700/50 transition-colors`}>
                <td className="py-3 px-4 text-white font-semibold">{candidate.name}</td>
                <td className="py-3 px-4 text-slate-300">{candidate.email}</td>
                <td className="py-3 px-4 text-slate-300">{candidate.batchNo}</td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
                    {candidate.totalInterviews}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {candidate.isInactive ? (
                    <span className="bg-red-900/50 text-red-300 px-3 py-1 rounded-full text-xs font-semibold">❌ Inactive</span>
                  ) : (
                    <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-xs font-semibold">✅ Active</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400">No candidates match your filters</p>
        </div>
      )}
    </div>
  );
}
