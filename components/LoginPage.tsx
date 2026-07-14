'use client';

interface LoginPageProps {
  onShowCandidateLogin: () => void;
  onShowAdminLogin: () => void;
}

export default function LoginPage({ onShowCandidateLogin, onShowAdminLogin }: LoginPageProps) {
  return (
    <div className="min-h-screen py-8 px-4 flex items-center justify-center">
      <div className="max-w-5xl w-full">
        {/* Brand Header with Logo */}
        <div className="mb-12">
          <img
            src="/images/jiyaan-logo.svg"
            alt="Jiyaan Institute of Technology"
            className="w-full max-w-4xl mx-auto shadow-lg shadow-blue-500/20 rounded-2xl"
          />
          <div className="text-center mt-8">
            <p className="text-slate-300 text-sm leading-relaxed">📋 Interview Booking System – Schedule and manage your interview slots efficiently</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate Login */}
          <div className="group card p-8 border-2 border-blue-600/50 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer bg-gradient-to-br from-blue-900/10 to-transparent"
            onClick={onShowCandidateLogin}>
            <div className="text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">👤</div>
              <h2 className="text-2xl font-bold text-white mb-2">Candidate Portal</h2>
              <p className="text-slate-400 mb-6 text-sm">Login to book and manage your interview slots</p>
              <button
                onClick={onShowCandidateLogin}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                🔑 Candidate Login
              </button>
            </div>
          </div>

          {/* Admin Login */}
          <div className="group card p-8 border-2 border-red-600/50 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20 transition-all cursor-pointer bg-gradient-to-br from-red-900/10 to-transparent"
            onClick={onShowAdminLogin}>
            <div className="text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🔐</div>
              <h2 className="text-2xl font-bold text-white mb-2">Admin Panel</h2>
              <p className="text-slate-400 mb-6 text-sm">Manage candidates, slots, and interviews</p>
              <button
                onClick={onShowAdminLogin}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all"
              >
                🔐 Admin Login
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm font-medium">🔒 Secure Authentication • 📊 Real-time Tracking • 🎯 Efficient Management</p>
          <p className="text-slate-600 text-xs mt-3">© 2026 Jiyaan Institute of Technology. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
