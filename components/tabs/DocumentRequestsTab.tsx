'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';

interface DocumentRequestsTabProps {
  slots: InterviewSlot[];
  onSubmitDocumentRequest?: (
    slotId: string,
    documents: string[],
    offerStatus: string,
    message: string,
    offerReleasedDate?: string,
    joiningDate?: string,
    packageLPA?: string
  ) => Promise<void> | void;
  candidateEmail?: string;
}

export default function DocumentRequestsTab({ slots, onSubmitDocumentRequest, candidateEmail }: DocumentRequestsTabProps) {
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, {
    documents: string[];
    offerStatus: string;
    message: string;
    offerReleasedDate?: string;
    joiningDate?: string;
    packageLPA?: string;
  }>>({});

  // Filter HR-completed interviews
  const hrCompletedInterviews = slots.filter(slot =>
    slot.round === 'HR' && slot.status === 'completed' &&
    (!candidateEmail || slot.candidateEmail === candidateEmail)
  );

  // Filter interviews with submitted requests (offer status, package, or dates)
  const submittedRequests = hrCompletedInterviews.filter(slot =>
    slot.offerStatus || slot.packageLPA || slot.offerReleasedDate || slot.joiningDate
  );

  const initializeForm = (slotId: string) => {
    if (!formData[slotId]) {
      setFormData(prev => ({
        ...prev,
        [slotId]: {
          documents: [],
          offerStatus: 'Pending',
          message: '',
          offerReleasedDate: '',
          joiningDate: '',
          packageLPA: ''
        }
      }));
    }
  };

  const handleDocumentToggle = (slotId: string, doc: string) => {
    setFormData(prev => {
      const data = prev[slotId] || { documents: [], offerStatus: 'Pending Review', message: '' };
      const docs = data.documents;
      return {
        ...prev,
        [slotId]: {
          ...data,
          documents: docs.includes(doc) ? docs.filter(d => d !== doc) : [...docs, doc]
        }
      };
    });
  };

  const handleSubmitRequest = async (slotId: string) => {
    const data = formData[slotId];
    if (!data) {
      alert('Please fill in the form');
      return;
    }

    if (onSubmitDocumentRequest) {
      await onSubmitDocumentRequest(
        slotId,
        data.documents,
        data.offerStatus,
        data.message,
        data.offerReleasedDate,
        data.joiningDate,
        data.packageLPA
      );
      setExpandedSlot(null);
      setFormData(prev => {
        const updated = { ...prev };
        delete updated[slotId];
        return updated;
      });
    }
  };

  const getOfferStatusColor = (status?: string) => {
    switch (status) {
      case 'Received':
        return 'bg-green-900/50 text-green-300 border-green-600';
      case 'Not Received':
        return 'bg-red-900/50 text-red-300 border-red-600';
      case 'Pending':
        return 'bg-yellow-900/50 text-yellow-300 border-yellow-600';
      default:
        return 'bg-blue-900/50 text-blue-300 border-blue-600';
    }
  };

  if (hrCompletedInterviews.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-4">📄</div>
        <p className="text-slate-400 text-lg mb-2">No completed HR interviews</p>
        <p className="text-slate-500">Document requests will be available after HR round completion</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* SECTION 1: Submitted Requests List */}
      {submittedRequests.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">📋 Submitted Requests</h2>
          <p className="text-slate-400 mb-6">Your submitted document requests and offer status</p>

          <div className="overflow-x-auto bg-slate-800 rounded-lg border border-slate-600">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600 bg-slate-900/50">
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Candidate</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Company</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Released Date</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Joining Date</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Package LPA</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Settlement (Monthly)</th>
                  <th className="text-left py-4 px-4 text-slate-300 font-semibold">Offer Status</th>
                </tr>
              </thead>
              <tbody>
                {submittedRequests.map((interview) => (
                  <tr key={interview.id} className="border-b border-slate-700 hover:bg-slate-700/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="text-white font-semibold">{interview.candidateName}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">{interview.company}</td>
                    <td className="py-4 px-4 text-slate-300">
                      {interview.offerReleasedDate ? new Date(interview.offerReleasedDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      {interview.joiningDate ? new Date(interview.joiningDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white font-semibold">
                        {interview.packageLPA ? `₹ ${interview.packageLPA} LPA` : 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-green-400 font-semibold">
                        {interview.packageLPA
                          ? `₹ ${(parseFloat(interview.packageLPA) / 12).toFixed(2)} L/month`
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded text-xs font-semibold border ${getOfferStatusColor(interview.offerStatus)}`}>
                        {interview.offerStatus || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: Offer Status */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">💼 Offer Status</h2>
        <p className="text-slate-400 mb-6">Update your offer status for completed HR interviews</p>

        <div className="space-y-4">
          {hrCompletedInterviews.map(interview => (
            <div key={interview.id} className="slot-card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="text-xl font-bold text-purple-400 mb-2">
                    {interview.company} - {interview.candidateName}
                  </div>
                  <div className="text-sm text-slate-400">
                    📅 {new Date(interview.date).toLocaleDateString()} @ {interview.time}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    👤 HR: {interview.hrName || 'N/A'} | 📞 {interview.hrNumber || 'N/A'}
                  </div>
                </div>
                {interview.offerStatus && (
                  <div className={`px-3 py-1 rounded text-sm font-semibold border ${getOfferStatusColor(interview.offerStatus)}`}>
                    {interview.offerStatus}
                  </div>
                )}
              </div>

              {/* Expandable Offer Status Form */}
              {expandedSlot === interview.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmitRequest(interview.id);
                  }}
                  className="mt-4 space-y-4 bg-gradient-to-r from-purple-900/50 to-slate-900/50 p-6 rounded-lg border-2 border-purple-500 shadow-xl"
                >
                  <h4 className="text-white font-semibold mb-4">💼 Update Offer Status</h4>

                  {/* Offer Status */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      💼 Offer Status *
                    </label>
                    <select
                      value={formData[interview.id]?.offerStatus || 'Pending'}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          [interview.id]: {
                            ...(prev[interview.id] || { documents: [], message: '' }),
                            offerStatus: e.target.value
                          }
                        }));
                      }}
                      className="input-field w-full"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Received">Received</option>
                      <option value="Not Received">Not Received</option>
                    </select>
                  </div>

                  {/* Package LPA */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      💰 Package LPA (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 12.5"
                      value={formData[interview.id]?.packageLPA || ''}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          [interview.id]: {
                            ...(prev[interview.id] || { documents: [], offerStatus: 'Pending', message: '' }),
                            packageLPA: e.target.value
                          }
                        }));
                      }}
                      className="input-field w-full"
                    />
                  </div>

                  {/* Offer Released Date */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      📅 Offer Released Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData[interview.id]?.offerReleasedDate || ''}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          [interview.id]: {
                            ...(prev[interview.id] || { documents: [], offerStatus: 'Pending', message: '' }),
                            offerReleasedDate: e.target.value
                          }
                        }));
                      }}
                      className="input-field w-full"
                    />
                  </div>

                  {/* Joining Date */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      🗓️ Expected Joining Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData[interview.id]?.joiningDate || ''}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          [interview.id]: {
                            ...(prev[interview.id] || { documents: [], offerStatus: 'Pending', message: '' }),
                            joiningDate: e.target.value
                          }
                        }));
                      }}
                      className="input-field w-full"
                    />
                  </div>

                  {/* Additional Message */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      💬 Additional Message (Optional)
                    </label>
                    <textarea
                      value={formData[interview.id]?.message || ''}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          [interview.id]: {
                            ...(prev[interview.id] || { documents: [], offerStatus: 'Pending Review' }),
                            message: e.target.value
                          }
                        }));
                      }}
                      placeholder="e.g., 'Negotiating terms' or 'Joining date confirmed'"
                      className="input-field w-full resize-none h-20"
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4 border-t border-slate-600">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition-all"
                    >
                      ✓ Submit
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpandedSlot(null)}
                      className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg font-semibold transition-all"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex gap-3 pt-4 border-t border-slate-600">
                  <button
                    onClick={() => {
                      initializeForm(interview.id);
                      setExpandedSlot(interview.id);
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-semibold transition-all"
                  >
                    ✏️ Update Offer Status
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
