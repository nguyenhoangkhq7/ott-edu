export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-slate-200 rounded" />
        <div className="h-10 w-48 bg-slate-200 rounded" />
      </div>

      {/* Search skeleton */}
      <div className="max-w-md">
        <div className="h-11 w-full bg-slate-200 rounded-xl" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-8">
        {/* Section 1 */}
        <div>
          <div className="h-6 w-24 bg-slate-200 rounded mb-4" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Section 2 */}
        <div>
          <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
