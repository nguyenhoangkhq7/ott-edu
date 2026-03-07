export default function CalendarPage() {
  return (
    <div className="flex h-96 flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full bg-orange-100 p-6">
        <svg viewBox="0 0 24 24" className="h-12 w-12 text-orange-600" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">Calendar</h2>
      <p className="text-slate-500 max-w-md">
        Keep track of important dates, class schedules, meetings, and events. Your academic calendar in one place.
      </p>
    </div>
  );
}