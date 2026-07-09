'use client';

interface LoginPageProps {
  onShowCandidateLogin: () => void;
  onShowAdminLogin: () => void;
}

export default function LoginPage({ onShowCandidateLogin, onShowAdminLogin }: LoginPageProps) {
  return (
    <div className="min-h-screen py-8 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-3">📅 Interview Booking System</h1>
          <p className="text-xl text-slate-400">Schedule and manage your interviews efficiently</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate Login */}
          <div className="card p-8 border-2 border-blue-500 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer"
            onClick={onShowCandidateLogin}>
            <div className="text-center">
              <div className="text-6xl mb-4">👤</div>
              <h2 className="text-2xl font-bold text-white mb-2">Candidate</h2>
              <p className="text-slate-400 mb-6">Login to book and manage your interview slots</p>
              <button
                onClick={onShowCandidateLogin}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
              >
                🔑 Candidate Login
              </button>
            </div>
          </div>

          {/* Admin Login */}
          <div className="card p-8 border-2 border-red-500 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20 transition-all cursor-pointer"
            onClick={onShowAdminLogin}>
            <div className="text-center">
              <div className="text-6xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-white mb-2">Admin</h2>
              <p className="text-slate-400 mb-6">Manage candidates, slots, and interviews</p>
              <button
                onClick={onShowAdminLogin}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
              >
                🔐 Admin Login
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>Secure login system • Protected data • Real-time updates</p>
        </div>
      </div>
    </div>
  );
}
