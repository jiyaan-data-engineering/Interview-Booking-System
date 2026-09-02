export default function Header() {
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl">
      <div className="flex items-center gap-4 px-8 py-6 bg-gradient-to-r from-slate-800 to-slate-900">
        <img
          src="/assets/logos/network-logo.svg"
          alt="Network Logo"
          className="w-16 h-16"
        />
        <img
          src="/images/jiyaan-logo.svg"
          alt="JIYAAN Institute of Technology"
          className="flex-1 h-auto"
        />
      </div>
      <div className="bg-slate-900 px-8 py-4 text-center">
        <p className="text-blue-200 text-sm">📅 Interview Booking System - Schedule and manage your interview slots efficiently</p>
      </div>
    </div>
  );
}
