export default function AssignmentsPage() {
  return (
    <div className="flex h-96 flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full bg-purple-100 p-6">
        <svg viewBox="0 0 24 24" className="h-12 w-12 text-purple-600" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 4h10v16H7z" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">Assignments</h2>
      <p className="text-slate-500 max-w-md">
        View and manage your class assignments, homework, and project tasks. Track due dates and submissions.
      </p>
    </div>
  );
}