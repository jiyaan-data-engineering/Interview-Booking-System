'use client';

import { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, isAdmin: boolean) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [userType, setUserType] = useState<'candidate' | 'admin' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const ADMIN_PASSWORD = 'admin@jiyaan123'; // Change this to your password

  const handleCandidateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setError('');
    onLogin(email, false);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter password');
      return;
    }
    if (password !== ADMIN_PASSWORD) {
      setError('Invalid password');
      return;
    }
    setError('');
    onLogin('admin@jiyaan.com', true);
  };

  if (!userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-2xl">
            <h1 className="text-4xl font-bold text-white text-center mb-2">JIYAAN</h1>
            <p className="text-blue-300 text-center mb-8">Interview Booking System</p>

            <p className="text-slate-300 text-center mb-8 font-semibold">Who are you?</p>

            <div className="space-y-4">
              <button
                onClick={() => setUserType('candidate')}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                👤 Candidate
              </button>

              <button
                onClick={() => setUserType('admin')}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-bold text-lg hover:shadow-lg hover:shadow-red-500/50 transition-all"
              >
                🔐 Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (userType === 'candidate') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-2xl">
            <h1 className="text-3xl font-bold text-white text-center mb-2">Candidate Login</h1>
            <p className="text-slate-400 text-center mb-8 text-sm">Book your interview slot</p>

            <form onSubmit={handleCandidateLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {error && <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-2 rounded-lg text-sm">{error}</div>}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Login
              </button>
            </form>

            <button
              onClick={() => {
                setUserType(null);
                setEmail('');
                setError('');
              }}
              className="w-full mt-4 py-2 text-slate-400 hover:text-slate-300 text-sm font-semibold"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-2xl">
          <h1 className="text-3xl font-bold text-white text-center mb-2">Admin Login</h1>
          <p className="text-slate-400 text-center mb-8 text-sm">Manage interview slots</p>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Admin Password *</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              <p className="text-xs text-slate-500 mt-2">Default: admin@jiyaan123</p>
            </div>

            {error && <div className="bg-red-900/30 border border-red-500 text-red-300 px-4 py-2 rounded-lg text-sm">{error}</div>}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-red-500/50 transition-all"
            >
              Login
            </button>
          </form>

          <button
            onClick={() => {
              setUserType(null);
              setPassword('');
              setError('');
            }}
            className="w-full mt-4 py-2 text-slate-400 hover:text-slate-300 text-sm font-semibold"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
