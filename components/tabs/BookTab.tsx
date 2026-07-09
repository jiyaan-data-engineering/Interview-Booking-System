'use client';

import { useState } from 'react';

interface BookTabProps {
  onBook: (name: string, email: string, phone: string, date: string, time: string, company: string, duration: string, round?: string) => void;
}

export default function BookTab({ onBook }: BookTabProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    company: '',
    duration: '',
    round: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.name && formData.email && formData.phone && formData.date &&
        formData.time && formData.company && formData.duration && formData.round) {

      onBook(
        formData.name,
        formData.email,
        formData.phone,
        formData.date,
        formData.time,
        formData.company,
        formData.duration,
        formData.round
      );

      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: '',
        company: '',
        duration: '',
        round: '',
      });

      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">Registration Submitted!</h2>
        <p className="text-green-300 text-lg mb-4">Your interview request has been received.</p>
        <p className="text-slate-400 mb-4">We will confirm your interview slot shortly.</p>
        <p className="text-slate-500">A confirmation email will be sent to:</p>
        <p className="text-white font-semibold text-lg mt-2">{formData.email || 'your email address'}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Request an Interview</h2>
        <p className="text-slate-400 mb-8">Fill in your details and preferred interview time below</p>

        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-700/50 rounded-xl p-8 border border-slate-600">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
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
                  value={formData.name}
                  onChange={handleChange}
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
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                className="input-field"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Interview Information */}
          <div className="border-t border-slate-600 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Interview Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Scheduled Date *
                </label>
                <input
                  type="date"
                  name="date"
                  className="input-field"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Scheduled Time (9 AM - 12 PM) *
                </label>
                <select
                  name="time"
                  className="input-field"
                  value={formData.time}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Time Slot</option>
                  <optgroup label="Morning (AM)">
                    <option value="09:00">09:00 AM</option>
                    <option value="09:30">09:30 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                  </optgroup>
                  <optgroup label="Noon (PM)">
                    <option value="12:00">12:00 PM</option>
                  </optgroup>
                </select>
                {formData.time && (
                  <div className="mt-2 text-sm text-blue-300">
                    Selected: <span className="font-semibold text-white">{formData.time}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company"
                  className="input-field"
                  placeholder="e.g., TechCorp, InnovateLabs"
                  value={formData.company}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Duration *
                </label>
                <select
                  name="duration"
                  className="input-field"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Duration</option>
                  <option value="15 min">15 minutes</option>
                  <option value="30 min">30 minutes</option>
                  <option value="45 min">45 minutes</option>
                  <option value="1 hour">1 hour</option>
                  <option value="1.5 hours">1.5 hours</option>
                  <option value="2 hours">2 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Interview Round *
                </label>
                <select
                  name="round"
                  className="input-field"
                  value={formData.round}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Round</option>
                  <option value="Screening">Screening</option>
                  <option value="L1">L1</option>
                  <option value="L2">L2</option>
                  <option value="Client">Client</option>
                  <option value="HR">HR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t border-slate-600 pt-6">
            <button
              type="submit"
              className="btn-primary w-full text-lg py-4 font-semibold"
            >
              Submit Interview Request
            </button>
            <p className="text-center text-slate-400 text-sm mt-4">
              We'll review your request and send a confirmation email shortly.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
