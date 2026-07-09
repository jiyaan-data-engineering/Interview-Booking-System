export default function Header() {
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl">
      <img
        src="/images/jiyaan-logo.svg"
        alt="JIYAAN Institute of Technology"
        className="w-full h-auto"
      />
      <div className="bg-slate-900 px-8 py-4 text-center">
        <p className="text-blue-200 text-sm">📅 Interview Booking System - Schedule and manage your interview slots efficiently</p>
      </div>
    </div>
  );
}
