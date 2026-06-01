export default function ActivityPage() {
  return (
    <div className="flex h-96 flex-col items-center justify-center text-center">
      <div className="mb-4 rounded-full bg-blue-100 p-6">
        <svg viewBox="0 0 24 24" className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 12h4l2-6 4 12 2-6h4" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">Activity</h2>
      <p className="text-slate-500 max-w-md">
        Stay up-to-date with your team&apos;s latest activities and notifications. This page will show your activity feed.
      </p>
    </div>
  );
}