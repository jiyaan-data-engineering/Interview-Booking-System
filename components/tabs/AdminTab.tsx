'use client';

import { useState } from 'react';
import { InterviewSlot } from '@/lib/types';
import SlotCard from '@/components/SlotCard';
import { exportToJSON, exportToCSV } from '@/lib/storage';

interface AdminTabProps {
  slots: InterviewSlot[];
  onDeleteSlot: (slotId: string) => Promise<void> | void;
  onCancelBooking: (slotId: string) => Promise<void> | void;
  onUpdateStatus: (slotId: string, status: string, reason?: string, room?: string) => Promise<void> | void;
  onClearAllSlots?: () => void;
  onRegisterCandidate?: (name: string, email: string, phone: string, password: string) => Promise<void> | void;
}

export default function AdminTab({
  slots,
  onDeleteSlot,
  onCancelBooking,
  onUpdateStatus,
  onRegisterCandidate,
}: AdminTabProps) {
  const [candidateFormData, setCandidateFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    batchNo: '',
    employmentStatus: '',
    currentCompany: '',
    lastCompanyPackage: '',
    totalYearsExperience: '',
    experienceVerification: '',
  });


  const [filterDate, setFilterDate] = useState('');
  const [filterCandidate, setFilterCandidate] = useState('');
  const [filterTime, setFilterTime] = useState('');

  const getTimeSlotOptions = () => {
    const slots: { label: string; value: string }[] = [];
    for (let h = 6; h < 22; h++) {
      for (let m of [0, 30]) {
        const hours = String(h).padStart(2, '0');
        const minutes = String(m).padStart(2, '0');
        const timeValue = `${hours}:${minutes}`;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHours = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const label = `${displayHours}:${minutes} ${period}`;
        slots.push({ label, value: timeValue });
      }
    }
    return slots;
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':');
    return parseInt(hours) * 60 + parseInt(minutes);
  };

  const parseDuration = (duration: string) => {
    const lowerDur = duration.toLowerCase();
    if (lowerDur.includes('15')) return 15;
    if (lowerDur.includes('30')) return 30;
    if (lowerDur.includes('45')) return 45;
    if (lowerDur.includes('1.5')) return 90;
    if (lowerDur.includes('2 hour')) return 120;
    if (lowerDur.includes('1 hour')) return 60;
    return 30; // default
  };

  const hasTimeOverlap = (slot1: InterviewSlot, slot2: InterviewSlot) => {
    if (slot1.date !== slot2.date) return false;

    const start1 = timeToMinutes(slot1.time);
    const start2 = timeToMinutes(slot2.time);
    const end1 = start1 + parseDuration(slot1.duration || '30 min');
    const end2 = start2 + parseDuration(slot2.duration || '30 min');

    return start1 < end2 && start2 < end1;
  };

  // Detect conflicts and overlaps
  const pendingSlots = slots.filter(slot => slot.status === 'pending' || !slot.status);

  const getConflicts = () => {
    const conflicts: Record<string, string[]> = {};

    for (let i = 0; i < pendingSlots.length; i++) {
      for (let j = i + 1; j < pendingSlots.length; j++) {
        const slot1 = pendingSlots[i];
        const slot2 = pendingSlots[j];
        if (hasTimeOverlap(slot1, slot2)) {
          conflicts[slot1.id] = [...(conflicts[slot1.id] || []), slot2.id];
          conflicts[slot2.id] = [...(conflicts[slot2.id] || []), slot1.id];
        }
      }
    }
    return conflicts;
  };

  const conflicts = getConflicts();

  const handleCandidateFormChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setCandidateFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (candidateFormData.name && candidateFormData.email && candidateFormData.phone && candidateFormData.password && candidateFormData.batchNo && onRegisterCandidate) {
      onRegisterCandidate(candidateFormData.name, candidateFormData.email, candidateFormData.phone, candidateFormData.password);
      setCandidateFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        batchNo: '',
        employmentStatus: '',
        currentCompany: '',
        lastCompanyPackage: '',
        totalYearsExperience: '',
        experienceVerification: '',
      });
    }
  };

  const handleClearAllData = async () => {
    const confirmed = window.confirm('⚠️ WARNING!\n\nThis will DELETE ALL interview slots!\n\nMake sure you exported data first!\n\nContinue?');
    if (confirmed) {
      try {
        // Delete all slots
        await Promise.all(slots.map(slot => Promise.resolve(onDeleteSlot(slot.id))));
        alert('✅ All data cleared successfully!');
      } catch (error) {
        alert('❌ Error clearing data. Please try again.');
        console.error(error);
      }
    }
  };

  const generateCandidateRegistrationForm = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidate Registration Form</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px; }
    .header h1 { color: #1e293b; margin: 0; }
    .header p { color: #64748b; margin: 5px 0 0 0; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: bold; color: #667eea; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
    .form-row.full { grid-template-columns: 1fr; }
    .form-group { display: flex; flex-direction: column; }
    label { font-size: 13px; font-weight: bold; color: #334155; margin-bottom: 6px; }
    label .required { color: #ef4444; }
    input, select { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 14px; }
    input:focus, select:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
    .instructions { background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin-bottom: 25px; border-radius: 4px; }
    .instructions h3 { margin: 0 0 10px 0; color: #667eea; font-size: 14px; }
    .instructions ol { margin: 0; padding-left: 20px; color: #475569; font-size: 13px; }
    .instructions li { margin-bottom: 5px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
    .print-only { display: none; }
    @media print { .print-only { display: block; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Candidate Registration Form</h1>
      <p>Jiyaan Institute of Technology</p>
    </div>

    <div class="instructions">
      <h3>📌 Instructions:</h3>
      <ol>
        <li>Fill in all the required fields (*)</li>
        <li>Be accurate with your information</li>
        <li>Save this completed form as PDF</li>
        <li>Send the completed form to the admin</li>
        <li>You will receive login credentials via email</li>
      </ol>
    </div>

    <form id="registrationForm">
      <!-- Personal Information -->
      <div class="section">
        <div class="section-title">👤 Personal Information</div>

        <div class="form-row">
          <div class="form-group">
            <label>Full Name <span class="required">*</span></label>
            <input type="text" name="name" required placeholder="Enter your full name">
          </div>
          <div class="form-group">
            <label>Email Address <span class="required">*</span></label>
            <input type="email" name="email" required placeholder="your.email@example.com">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Phone Number <span class="required">*</span></label>
            <input type="tel" name="phone" required placeholder="+91 XXXXX XXXXX">
          </div>
          <div class="form-group">
            <label>Batch No <span class="required">*</span></label>
            <input type="text" name="batchNo" required placeholder="e.g., Batch#9">
          </div>
        </div>
      </div>

      <!-- Professional Information -->
      <div class="section">
        <div class="section-title">💼 Professional Information</div>

        <div class="form-row">
          <div class="form-group">
            <label>Employment Status</label>
            <select name="employmentStatus">
              <option value="">-- Select --</option>
              <option value="Working">Working</option>
              <option value="Not Working">Not Working</option>
            </select>
          </div>
          <div class="form-group">
            <label>Current/Last Company</label>
            <input type="text" name="currentCompany" placeholder="e.g., TCS, Infosys">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Last Company Package (LPA)</label>
            <input type="text" name="lastCompanyPackage" placeholder="e.g., 8.5">
          </div>
          <div class="form-group">
            <label>Total Years of Experience</label>
            <input type="text" name="totalYearsExperience" placeholder="e.g., 5">
          </div>
        </div>

        <div class="form-row full">
          <div class="form-group">
            <label>Experience Verification</label>
            <select name="experienceVerification">
              <option value="">-- Select --</option>
              <option value="Genuine">✅ Genuine</option>
              <option value="Semi-Genuine">⚠️ Semi-Genuine</option>
              <option value="Fake">❌ Fake</option>
            </select>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Jiyaan Institute of Technology • Interview Booking System</p>
        <p>Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </form>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Candidate_Registration_Form.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Admin Panel</h2>

      <h3 className="text-xl font-semibold text-white mb-4">⏳ Manage Pending Slots</h3>
      <p className="text-slate-400 text-sm mb-4">Showing interviews awaiting confirmation</p>

      {/* Date, Candidate & Time Filter */}
      <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">📅 Select Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">👤 Filter by Candidate</label>
            <select
              value={filterCandidate}
              onChange={(e) => setFilterCandidate(e.target.value)}
              className="input-field w-full"
            >
              <option value="">-- All Candidates --</option>
              {[...new Set(slots.filter(slot => (slot.status === 'pending' || !slot.status) && slot.candidateName).map(s => s.candidateName))].sort().map(candidate => (
                <option key={candidate} value={candidate}>{candidate}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">⏰ Select Time</label>
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="input-field w-full"
            >
              <option value="">-- All Times --</option>
              {getTimeSlotOptions().map(slot => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterDate('');
                setFilterCandidate('');
                setFilterTime('');
              }}
              className="w-full py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-2">
          Showing {slots.filter(slot => {
            const matchesStatus = slot.status === 'pending' || !slot.status;
            const matchesDate = !filterDate || slot.date === filterDate;
            const matchesCandidate = !filterCandidate || slot.candidateName === filterCandidate;
            const matchesTime = !filterTime || slot.time === filterTime;
            return matchesStatus && matchesDate && matchesCandidate && matchesTime;
          }).length} pending slots
        </p>
      </div>

      {slots.filter(slot => {
        const matchesStatus = slot.status === 'pending' || !slot.status;
        const matchesDate = !filterDate || slot.date === filterDate;
        const matchesCandidate = !filterCandidate || slot.candidateName === filterCandidate;
        const matchesTime = !filterTime || slot.time === filterTime;
        return matchesStatus && matchesDate && matchesCandidate && matchesTime;
      }).length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-400">No pending slots. All interviews are confirmed or cancelled! ✅</p>
        </div>
      ) : (
        <div className="space-y-4">
          {slots.filter(slot => {
            const matchesStatus = slot.status === 'pending' || !slot.status;
            const matchesDate = !filterDate || slot.date === filterDate;
            const matchesCandidate = !filterCandidate || slot.candidateName === filterCandidate;
            const matchesTime = !filterTime || slot.time === filterTime;
            return matchesStatus && matchesDate && matchesCandidate && matchesTime;
          }).map(slot => (
            <div key={slot.id}>
              {conflicts[slot.id] && (
                <div className="mb-2 p-3 bg-red-900/30 border-l-4 border-red-500 rounded flex items-center gap-2">
                  <span className="text-red-400 font-semibold">⚠️ Scheduling Conflict!</span>
                  <span className="text-red-300 text-sm">{conflicts[slot.id].length} candidate(s) at same time</span>
                </div>
              )}
            <SlotCard key={slot.id} slot={slot} showCandidate={true}>
              {slot.candidateName && (
                <div className="mt-4 space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-600">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Interview Status
                    </label>
                    <select
                      className="input-field mb-2"
                      value={slot.status || 'pending'}
                      onChange={e => {
                        console.log('Updating status to:', e.target.value);
                        onUpdateStatus(slot.id, e.target.value);
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="postponed">Postponed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {(slot.status === 'cancelled' || slot.status === 'postponed') && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">
                        Reason
                      </label>
                      <textarea
                        className="input-field"
                        placeholder="Add reason for cancellation/postponement"
                        rows={2}
                        value={slot.reason || ''}
                        onChange={e => {
                          console.log('Reason updated:', e.target.value);
                        }}
                      />
                    </div>
                  )}

                  {slot.status !== 'confirmed' && (
                    <div>
                      <p className="text-cyan-300 text-xs">💡 Confirm this interview to allocate a room below ↓</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => onCancelBooking(slot.id)}
                      className="btn-danger flex-1 text-sm"
                    >
                      Force Cancel
                    </button>
                    <button
                      onClick={() => onDeleteSlot(slot.id)}
                      className="btn-danger flex-1 text-sm"
                    >
                      Delete Slot
                    </button>
                  </div>
                </div>
              )}

              {!slot.candidateName && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => onDeleteSlot(slot.id)}
                    className="btn-danger w-full"
                  >
                    Delete Slot
                  </button>
                </div>
              )}
            </SlotCard>
            </div>
          ))}
        </div>
      )}

      <hr className="my-8 border-slate-700" />

      {/* Generate Registration Form Section */}
      <div className="bg-indigo-900/30 rounded-xl p-6 mb-8 border border-indigo-600">
        <h3 className="text-xl font-semibold text-indigo-300 mb-3">📄 Send Registration Form to Candidate</h3>
        <p className="text-slate-400 text-sm mb-4">Generate a registration form that candidates can download, fill, and send back to you.</p>
        <button
          onClick={generateCandidateRegistrationForm}
          className="btn-primary w-full md:w-auto"
        >
          📥 Download Registration Form
        </button>
      </div>

      <hr className="my-8 border-slate-700" />

      {/* Register Candidate Section */}
      <div className="bg-blue-900/30 rounded-xl p-6 mb-8 border border-blue-600">
        <h3 className="text-xl font-semibold text-blue-300 mb-4">👤 Register New Candidate</h3>
        <form onSubmit={handleRegisterCandidate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                className="input-field"
                placeholder="John Doe"
                value={candidateFormData.name}
                onChange={handleCandidateFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                className="input-field"
                placeholder="candidate@example.com"
                value={candidateFormData.email}
                onChange={handleCandidateFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                className="input-field"
                placeholder="+1 (555) 123-4567"
                value={candidateFormData.phone}
                onChange={handleCandidateFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                className="input-field"
                placeholder="••••••••"
                value={candidateFormData.password}
                onChange={handleCandidateFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Batch No *
              </label>
              <input
                type="text"
                name="batchNo"
                className="input-field"
                placeholder="e.g., Batch#9"
                value={candidateFormData.batchNo}
                onChange={handleCandidateFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Employment Status
              </label>
              <select
                name="employmentStatus"
                className="input-field"
                value={candidateFormData.employmentStatus}
                onChange={handleCandidateFormChange as any}
              >
                <option value="">-- Select --</option>
                <option value="Working">Working</option>
                <option value="Not Working">Not Working</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Current/Last Company
              </label>
              <input
                type="text"
                name="currentCompany"
                className="input-field"
                placeholder="e.g., TCS, Infosys"
                value={candidateFormData.currentCompany}
                onChange={handleCandidateFormChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Last Company Package (LPA)
              </label>
              <input
                type="text"
                name="lastCompanyPackage"
                className="input-field"
                placeholder="e.g., 8.5"
                value={candidateFormData.lastCompanyPackage}
                onChange={handleCandidateFormChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Total Years of Experience
              </label>
              <input
                type="text"
                name="totalYearsExperience"
                className="input-field"
                placeholder="e.g., 5, 3.5"
                value={candidateFormData.totalYearsExperience}
                onChange={handleCandidateFormChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Experience Verification
              </label>
              <select
                name="experienceVerification"
                className="input-field"
                value={candidateFormData.experienceVerification}
                onChange={handleCandidateFormChange as any}
              >
                <option value="">-- Select --</option>
                <option value="Genuine">✅ Genuine</option>
                <option value="Semi-Genuine">⚠️ Semi-Genuine</option>
                <option value="Fake">❌ Fake</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            Register Candidate
          </button>
        </form>
      </div>

      {/* Password Reset Info */}
      <div className="bg-blue-900/20 rounded-xl p-6 mb-8 border border-blue-600">
        <h3 className="text-xl font-semibold text-blue-300 mb-2">🔐 Reset Candidate Passwords</h3>
        <p className="text-slate-300 text-sm mb-3">To reset a candidate's password, go to the <strong>👥 Candidates</strong> tab and:</p>
        <ol className="text-slate-300 text-sm space-y-2 ml-4">
          <li>1️⃣ Find the candidate in the list</li>
          <li>2️⃣ Click the <strong>🔐 Reset Password</strong> button</li>
          <li>3️⃣ Copy the password reset link</li>
          <li>4️⃣ Send the link to the candidate</li>
          <li>5️⃣ Candidate can reset their password using the link</li>
        </ol>
      </div>

      <div className="flex gap-4 mb-8 flex-wrap">
        <button
          onClick={() => exportToJSON(slots)}
          className="btn-secondary"
        >
          📥 Export JSON
        </button>
        <button
          onClick={() => exportToCSV(slots)}
          className="btn-secondary"
        >
          📊 Export CSV
        </button>
        <button
          onClick={handleClearAllData}
          className="btn-danger"
        >
          🗑️ Clear All Data
        </button>
      </div>

    </div>
  );
}
