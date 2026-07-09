'use client';

interface LoginPageProps {
  onShowCandidateLogin: () => void;
  onShowAdminLogin: () => void;
}

export default function LoginPage({ onShowCandidateLogin, onShowAdminLogin }: LoginPageProps) {
  return (
    <div className="min-h-screen py-8 px-4 flex items-center justify-center">
      <div className="max-w-5xl w-full">
        {/* Brand Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 mb-12">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-slate-700/50 rounded-xl flex items-center justify-center border border-slate-600">
                <div className="relative w-24 h-24">
                  {/* Center dot */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full"></div>

                  {/* Top dot */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full"></div>

                  {/* Top-right dots */}
                  <div className="absolute top-4 right-4 w-3 h-3 bg-orange-400 rounded-full"></div>
                  <div className="absolute top-6 right-8 w-2.5 h-2.5 bg-orange-500 rounded-full"></div>

                  {/* Right dots */}
                  <div className="absolute top-1/2 right-3 transform -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full"></div>

                  {/* Bottom-right dots */}
                  <div className="absolute bottom-4 right-4 w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="absolute bottom-6 right-8 w-2.5 h-2.5 bg-red-500 rounded-full"></div>

                  {/* Bottom dot */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-green-500 rounded-full"></div>

                  {/* Left dots */}
                  <div className="absolute top-1/2 left-3 transform -translate-y-1/2 w-3 h-3 bg-green-400 rounded-full"></div>

                  {/* Top-left dots */}
                  <div className="absolute top-4 left-4 w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="absolute top-6 left-8 w-2.5 h-2.5 bg-cyan-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-white mb-1 tracking-tight">JIYAAN</h1>
              <h2 className="text-2xl font-bold text-slate-300 mb-3 tracking-wider">INSTITUTE OF TECHNOLOGY</h2>
              <p className="text-sm font-semibold text-cyan-400 tracking-widest mb-4">GCP DATA ENGINEERING EXCELLENCE</p>
              <div className="h-px bg-gradient-to-r from-blue-500 via-purple-500 to-transparent mb-4"></div>
              <p className="text-slate-300">📋 Interview Booking System – Schedule and manage your interview slots efficiently</p>
            </div>
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
