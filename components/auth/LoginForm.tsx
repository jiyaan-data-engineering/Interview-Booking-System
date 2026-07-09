'use client';

import { useState } from 'react';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onLogin, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      await onLogin(email, password);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-1">Candidate Login</h2>
        <p className="text-slate-400 text-sm mb-6">Access your interview bookings</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500 text-red-300 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="text-center">
            <p className="text-slate-400 text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-400 hover:text-blue-300 font-semibold"
              >
                Register
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
