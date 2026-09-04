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

  // Build candidate list with details
  const candidates = useMemo(() => {
    const candidateMap = new Map<string, {
      name: string;
      email: string;
      batchNo: string;
      currentCompany: string;
      currentExperience: string;
      currentPackage: string;
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
          currentCompany: slot.currentCompany || 'N/A',
          currentExperience: slot.totalYearsExperience || 'N/A',
          currentPackage: slot.lastCompanyPackage ? `₹${slot.lastCompanyPackage} LPA` : 'N/A',
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
      <h2 className="text-2xl font-bold text-white mb-2">📊 Candidate Performance Analytics</h2>
      <p className="text-slate-400 mb-6">Candidate details and interview information</p>

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

      {/* Candidate Cards */}
      <div className="space-y-4">
        {sorted.map(candidate => (
          <div key={candidate.email} className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-all">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Candidate Name */}
              <div>
                <div className="text-xs text-slate-400 font-semibold mb-2">👤 CANDIDATE NAME</div>
                <div className="text-lg font-bold text-white">{candidate.name}</div>
                <div className="text-xs text-slate-500 mt-1">{candidate.email}</div>
              </div>

              {/* Current Company */}
              <div>
                <div className="text-xs text-slate-400 font-semibold mb-2">🏢 CURRENT COMPANY</div>
                <div className="text-lg font-bold text-blue-400">{candidate.currentCompany}</div>
              </div>

              {/* Current Experience */}
              <div>
                <div className="text-xs text-slate-400 font-semibold mb-2">⏱️ EXPERIENCE</div>
                <div className="text-lg font-bold text-cyan-400">{candidate.currentExperience} years</div>
              </div>

              {/* Current Package */}
              <div>
                <div className="text-xs text-slate-400 font-semibold mb-2">💰 CURRENT PACKAGE</div>
                <div className="text-lg font-bold text-green-400">{candidate.currentPackage}</div>
              </div>

              {/* Batch No */}
              <div>
                <div className="text-xs text-slate-400 font-semibold mb-2">📚 BATCH NO</div>
                <div className="text-lg font-bold text-purple-400">{candidate.batchNo}</div>
                <div className="text-xs text-slate-500 mt-1 font-semibold">{candidate.totalInterviews} Interviews</div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                {candidate.totalInterviews} total interview{candidate.totalInterviews !== 1 ? 's' : ''}
              </span>
              {candidate.isInactive ? (
                <span className="bg-red-900/50 text-red-300 px-3 py-1 rounded-full text-xs font-semibold">❌ Inactive</span>
              ) : (
                <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-xs font-semibold">✅ Active</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-8">
          <p className="text-slate-400">No candidates match your filters</p>
        </div>
      )}
    </div>
  );
}
