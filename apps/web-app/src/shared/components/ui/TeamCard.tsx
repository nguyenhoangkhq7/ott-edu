import type { TeamItem } from "@/shared/types/teams";

interface TeamCardProps {
  item: TeamItem;
}

export default function TeamCard({ item }: TeamCardProps) {
  const isLocked = item.isActive === false;

  return (
    <article className={`group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition ${!isLocked ? 'hover:-translate-y-0.5 hover:shadow-lg' : ''}`}>
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl text-sm font-semibold text-white ${isLocked ? 'filter grayscale opacity-80' : ''}`}
          style={{ backgroundColor: isLocked ? '#94a3b8' : item.accentColor }}
        >
          {isLocked ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          ) : (
            item.initials
          )}
        </div>
        {!isLocked && (
          <button
            type="button"
            aria-label={`Open ${item.name} options`}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        )}
      </div>
      <h3 className={`text-sm font-semibold ${isLocked ? 'text-slate-500' : 'text-slate-900'}`}>{item.name}</h3>
      {item.subtitle ? (
        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.subtitle}</p>
      ) : null}
      {item.meta ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <span className={`inline-flex h-2 w-2 rounded-full ${isLocked ? 'bg-slate-300' : 'bg-emerald-400'}`} />
          <span>{item.meta}</span>
        </div>
      ) : null}
    </article>
  );
}
