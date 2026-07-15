'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';

interface MyBookingsTabProps {
  slots: InterviewSlot[];
  onReschedule: (slotId: string, date: string, time: string) => Promise<void> | void;
  onCancel: (slotId: string, reason: string) => Promise<void> | void;
  onMarkCompleted?: (slotId: string, supportPerson: string, hrName: string, panelName: string, hrNumber: string, feedback: string, comments: string) => Promise<void> | void;
  onUpdateInterviewStatus?: (slotId: string, interviewStatus: string) => Promise<void> | void;
  candidateEmail?: string;
}

export default function MyBookingsTab({ slots, onReschedule, onCancel, onMarkCompleted, onUpdateInterviewStatus, candidateEmail }: MyBookingsTabProps) {
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [rescheduleData, setRescheduleData] = useState<Record<string, { date: string; time: string }>>({});
  const [cancelReason, setCancelReason] = useState<Record<string, string>>({});
  const [completeFormData, setCompleteFormData] = useState<Record<string, { supportPerson: string; hrName: string; panelName: string; hrNumber: string; feedback: string; comments: string }>>({});
  const [interviewStatusData, setInterviewStatusData] = useState<Record<string, string>>({});
  const [filterDate, setFilterDate] = useState('');

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const m = minutes;
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHours = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${displayHours}:${m} ${period}`;
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':');
    return parseInt(hours) * 60 + parseInt(minutes);
  };

  const bookedSlots = slots.filter(slot => slot.candidateName && slot.candidateEmail === candidateEmail);

  const filteredSlots = (filterDate
    ? bookedSlots.filter(slot => slot.date === filterDate)
    : bookedSlots
  ).sort((a, b) => {
    const dateA = new Date(a.date + 'T00:00:00').getTime();
    const dateB = new Date(b.date + 'T00:00:00').getTime();
    if (dateA !== dateB) {
      return dateB - dateA;
    }
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });

  const handleRescheduleClick = (slotId: string, newDate: string, newTime: string) => {
    if (newDate && newTime) {
      onReschedule(slotId, newDate, newTime);
      setExpandedSlot(null);
      setRescheduleData(prev => {
        const updated = { ...prev };
        delete updated[slotId];
        return updated;
      });
    }
  };

  const handleCancelClick = (slotId: string) => {
    const reason = cancelReason[slotId] || 'No reason provided';
    onCancel(slotId, reason);
    setExpandedSlot(null);
    setCancelReason(prev => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
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
      default:
        return 'bg-yellow-900/30 border-yellow-500 text-yellow-300';
    }
  };

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Your Interview Bookings</h2>
      <p className="text-slate-400 mb-6">View, reschedule, or cancel your interviews</p>

      <div className="mb-6 bg-slate-700/50 rounded-lg p-4 border border-slate-600">
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          📧 Your Email
        </label>
        <div className="text-white text-lg font-semibold">{candidateEmail}</div>
        <p className="text-xs text-slate-400 mt-2">Viewing all bookings for this email</p>
      </div>

      {/* Date Filter */}
      {bookedSlots.length > 0 && (
        <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">📅 Select Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input-field w-full"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilterDate('')}
                className="w-full py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
              >
                Clear Filter
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Showing {filteredSlots.length} of {bookedSlots.length} bookings</p>
        </div>
      )}

      {bookedSlots.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-3xl mb-4">📭</div>
          <p className="text-slate-400 text-lg mb-2">No bookings found</p>
          <p className="text-slate-500">Go to "Book Interview" to schedule your first interview</p>
        </div>
      ) : null}

      {filteredSlots.length === 0 && bookedSlots.length > 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No bookings found for the selected date range</p>
        </div>
      ) : null}

      {filteredSlots.length > 0 && (

      <div className="space-y-4">
        {filteredSlots.map(slot => (
          <div key={slot.id} className="slot-card">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="text-2xl font-bold text-purple-400 mb-2">
                  {new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  @ {formatTime(slot.time)}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(slot.status)}`}>
                {getStatusLabel(slot.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-slate-400 text-sm font-semibold mb-1">Company</div>
                <div className="text-white text-lg">{slot.company}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm font-semibold mb-1">Duration</div>
                <div className="text-white text-lg">{slot.duration}</div>
              </div>
              {slot.round && (
                <div>
                  <div className="text-slate-400 text-sm font-semibold mb-1">Round</div>
                  <div className="text-white text-lg">{slot.round}</div>
                </div>
              )}
            </div>

            {slot.reason && (slot.status === 'cancelled' || slot.status === 'postponed') && (
              <div className="bg-red-900/30 border-l-4 border-red-500 p-3 mb-4 rounded">
                <div className="text-red-300 text-sm">
                  <span className="font-semibold">Reason: </span>
                  {slot.reason}
                </div>
              </div>
            )}

            {slot.status === 'confirmed' && slot.room && (
              <div className="mt-4 p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                <div className="flex items-start justify-between">
                  <h4 className="text-green-300 font-semibold">✅ Interview Confirmed</h4>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">🚪 Room Allocated:</span>
                    <span className="text-white font-bold text-lg bg-green-900/50 px-3 py-1 rounded">{slot.room}</span>
                  </div>
                </div>
              </div>
            )}

            {slot.interviewStatus && (
              <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-blue-300 font-semibold">📋 Interview Invite Status</h4>
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Update Invite Status</label>
                    <select
                      className="input-field w-full"
                      value={interviewStatusData[slot.id] || slot.interviewStatus || ''}
                      onChange={(e) => setInterviewStatusData(prev => ({ ...prev, [slot.id]: e.target.value }))}
                    >
                      <option value="Received">Received</option>
                      <option value="Waiting for Invite">Waiting for Invite</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      const newStatus = interviewStatusData[slot.id] || slot.interviewStatus;
                      if (newStatus && newStatus !== slot.interviewStatus && onUpdateInterviewStatus) {
                        onUpdateInterviewStatus(slot.id, newStatus);
                        setInterviewStatusData(prev => {
                          const updated = { ...prev };
                          delete updated[slot.id];
                          return updated;
                        });
                      }
                    }}
                    className="btn-primary whitespace-nowrap"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            )}

            {slot.status === 'completed' ? (
              <div className="mt-4 p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-green-300 font-semibold">✓ Interview Completed</h4>
                </div>
                <div className="space-y-2 text-sm">
                  {slot.supportPerson && (
                    <div>
                      <span className="text-slate-400">Support Person: </span>
                      <span className="text-white font-semibold">{slot.supportPerson}</span>
                    </div>
                  )}
                  {slot.hrName && (
                    <div>
                      <span className="text-slate-400">HR Name: </span>
                      <span className="text-white font-semibold">{slot.hrName}</span>
                    </div>
                  )}
                  {slot.panelName && (
                    <div>
                      <span className="text-slate-400">Panel Name: </span>
                      <span className="text-white font-semibold">{slot.panelName}</span>
                    </div>
                  )}
                  {slot.hrNumber && (
                    <div>
                      <span className="text-slate-400">HR Number: </span>
                      <span className="text-white font-semibold">{slot.hrNumber}</span>
                    </div>
                  )}
                  {slot.feedback && (
                    <div>
                      <span className="text-slate-400">Feedback: </span>
                      <span className={`font-semibold ${
                        slot.feedback === 'GOOD' ? 'text-green-300' :
                        slot.feedback === 'AVG' ? 'text-yellow-300' :
                        slot.feedback === 'BAD' ? 'text-red-300' :
                        'text-white'
                      }`}>
                        {slot.feedback === 'GOOD' && '🟢 GOOD'}
                        {slot.feedback === 'AVG' && '🟡 AVERAGE'}
                        {slot.feedback === 'BAD' && '🔴 BAD'}
                      </span>
                    </div>
                  )}
                  {slot.comments && (
                    <div>
                      <span className="text-slate-400">Comments: </span>
                      <span className="text-white">{slot.comments}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (slot.status === 'confirmed' || slot.status === 'pending' || !slot.status) ? (
              expandedSlot === slot.id ? (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const data = rescheduleData[slot.id];
                    handleRescheduleClick(slot.id, data.date, data.time);
                  }}
                  className="mt-4 space-y-4 bg-slate-900/50 p-4 rounded-lg border border-slate-600"
                >
                  <h4 className="text-white font-semibold mb-3">Reschedule Interview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        New Date *
                      </label>
                      <input
                        type="date"
                        className="input-field"
                        value={rescheduleData[slot.id]?.date || ''}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e =>
                          setRescheduleData(prev => ({
                            ...prev,
                            [slot.id]: { ...prev[slot.id], date: e.target.value },
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        New Time (9 AM - 11 PM) *
                      </label>
                      <select
                        className="input-field"
                        value={rescheduleData[slot.id]?.time || ''}
                        onChange={e =>
                          setRescheduleData(prev => ({
                            ...prev,
                            [slot.id]: { ...prev[slot.id], time: e.target.value },
                          }))
                        }
                        required
                      >
                        <option value="">Select Time</option>
                        <optgroup label="Morning (AM)">
                          <option value="09:00">09:00 AM</option>
                          <option value="09:30">09:30 AM</option>
                          <option value="10:00">10:00 AM</option>
                          <option value="10:30">10:30 AM</option>
                          <option value="11:00">11:00 AM</option>
                          <option value="11:30">11:30 AM</option>
                        </optgroup>
                        <optgroup label="Afternoon (PM)">
                          <option value="12:00">12:00 PM</option>
                          <option value="12:30">12:30 PM</option>
                          <option value="13:00">01:00 PM</option>
                          <option value="13:30">01:30 PM</option>
                          <option value="14:00">02:00 PM</option>
                          <option value="14:30">02:30 PM</option>
                          <option value="15:00">03:00 PM</option>
                          <option value="15:30">03:30 PM</option>
                          <option value="16:00">04:00 PM</option>
                          <option value="16:30">04:30 PM</option>
                          <option value="17:00">05:00 PM</option>
                          <option value="17:30">05:30 PM</option>
                        </optgroup>
                        <optgroup label="Evening (PM)">
                          <option value="18:00">06:00 PM</option>
                          <option value="18:30">06:30 PM</option>
                          <option value="19:00">07:00 PM</option>
                          <option value="19:30">07:30 PM</option>
                          <option value="20:00">08:00 PM</option>
                          <option value="20:30">08:30 PM</option>
                          <option value="21:00">09:00 PM</option>
                          <option value="21:30">09:30 PM</option>
                          <option value="22:00">10:00 PM</option>
                          <option value="22:30">10:30 PM</option>
                          <option value="23:00">11:00 PM</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <textarea
                    className="input-field"
                    placeholder="Reason for rescheduling (optional)"
                    rows={2}
                    value={cancelReason[slot.id] || ''}
                    onChange={e =>
                      setCancelReason(prev => ({ ...prev, [slot.id]: e.target.value }))
                    }
                  />

                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1">
                      Confirm Reschedule
                    </button>
                    <button
                      type="button"
                      className="btn-danger flex-1"
                      onClick={() => handleCancelClick(slot.id)}
                    >
                      Cancel Interview
                    </button>
                    <button
                      type="button"
                      className="btn-secondary flex-1"
                      onClick={() => setExpandedSlot(null)}
                    >
                      Close
                    </button>
                  </div>
                </form>
              ) : expandedSlot === `complete-${slot.id}` ? (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const data = completeFormData[slot.id];
                    if (data && data.supportPerson && data.hrName && data.panelName && data.hrNumber && onMarkCompleted) {
                      onMarkCompleted(slot.id, data.supportPerson, data.hrName, data.panelName, data.hrNumber, data.feedback, data.comments);
                      setExpandedSlot(null);
                      setCompleteFormData(prev => {
                        const updated = { ...prev };
                        delete updated[slot.id];
                        return updated;
                      });
                    }
                  }}
                  className="mt-4 space-y-4 bg-green-900/30 p-4 rounded-lg border border-green-500/50"
                >
                  <h4 className="text-green-300 font-semibold mb-3">Mark Interview as Completed</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Support Person Name *
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., John Smith"
                        value={completeFormData[slot.id]?.supportPerson || ''}
                        onChange={e =>
                          setCompleteFormData(prev => ({
                            ...prev,
                            [slot.id]: { ...prev[slot.id], supportPerson: e.target.value },
                          }))
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        HR Name *
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., Sarah Johnson"
                        value={completeFormData[slot.id]?.hrName || ''}
                        onChange={e =>
                          setCompleteFormData(prev => ({
                            ...prev,
                            [slot.id]: { ...prev[slot.id], hrName: e.target.value },
                          }))
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Panel Name *
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., Technical Panel, HR Round"
                        value={completeFormData[slot.id]?.panelName || ''}
                        onChange={e =>
                          setCompleteFormData(prev => ({
                            ...prev,
                            [slot.id]: { ...prev[slot.id], panelName: e.target.value },
                          }))
                        }
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        HR Number *
                      </label>
                      <input
                        type="tel"
                        className="input-field"
                        placeholder="e.g., +1 (555) 123-4567"
                        value={completeFormData[slot.id]?.hrNumber || ''}
                        onChange={e =>
                          setCompleteFormData(prev => ({
                            ...prev,
                            [slot.id]: { ...prev[slot.id], hrNumber: e.target.value },
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Feedback/Rating (optional)
                    </label>
                    <select
                      className="input-field"
                      value={completeFormData[slot.id]?.feedback || ''}
                      onChange={e =>
                        setCompleteFormData(prev => ({
                          ...prev,
                          [slot.id]: { ...prev[slot.id], feedback: e.target.value },
                        }))
                      }
                    >
                      <option value="">Select Feedback Rating</option>
                      <option value="GOOD">🟢 GOOD - Excellent Performance</option>
                      <option value="AVG">🟡 AVERAGE - Satisfactory Performance</option>
                      <option value="BAD">🔴 BAD - Needs Improvement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Comments (optional)
                    </label>
                    <textarea
                      className="input-field"
                      placeholder="Write your detailed comments, observations, or feedback here..."
                      rows={4}
                      value={completeFormData[slot.id]?.comments || ''}
                      onChange={e =>
                        setCompleteFormData(prev => ({
                          ...prev,
                          [slot.id]: { ...prev[slot.id], comments: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" className="btn-success flex-1">
                      Mark as Completed
                    </button>
                    <button
                      type="button"
                      className="btn-secondary flex-1"
                      onClick={() => setExpandedSlot(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : expandedSlot === `cancel-${slot.id}` ? (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    const reason = cancelReason[slot.id] || 'No reason provided';
                    onCancel(slot.id, reason);
                    setExpandedSlot(null);
                    setCancelReason(prev => {
                      const updated = { ...prev };
                      delete updated[slot.id];
                      return updated;
                    });
                  }}
                  className="mt-4 space-y-4 bg-red-900/30 p-4 rounded-lg border border-red-500/50"
                >
                  <h4 className="text-red-300 font-semibold mb-3">Cancel Interview</h4>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Cancellation Reason *
                    </label>
                    <textarea
                      className="input-field w-full"
                      placeholder="Please provide a reason for cancellation..."
                      rows={3}
                      value={cancelReason[slot.id] || ''}
                      onChange={e =>
                        setCancelReason(prev => ({ ...prev, [slot.id]: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="btn-danger flex-1">
                      Confirm Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-secondary flex-1"
                      onClick={() => setExpandedSlot(null)}
                    >
                      Close
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex gap-3 mt-4 flex-wrap">
                  {slot.status === 'confirmed' && (
                    <button
                      onClick={() => setExpandedSlot(`complete-${slot.id}`)}
                      className="btn-success flex-1 min-w-fit"
                    >
                      Mark as Completed
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedSlot(slot.id)}
                    className="btn-primary flex-1 min-w-fit"
                  >
                    Reschedule
                  </button>
                  <button
                    onClick={() => setExpandedSlot(`cancel-${slot.id}`)}
                    className="btn-danger flex-1 min-w-fit"
                  >
                    Cancel
                  </button>
                </div>
              )
            ) : (
              <div className="mt-4 p-3 bg-slate-700/50 rounded text-slate-300">
                This interview has been {slot.status}. Please book a new interview.
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
