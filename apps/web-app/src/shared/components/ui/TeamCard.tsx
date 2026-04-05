import type { TeamItem } from "@/shared/types/teams";

interface TeamCardProps {
  item: TeamItem;
}

export default function TeamCard({ item }: TeamCardProps) {
  return (
    <article className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-4 flex items-start justify-between">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: item.accentColor }}
        >
          {item.initials}
        </div>
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
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
      {item.subtitle ? (
        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.subtitle}</p>
      ) : null}
      {item.meta ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          <span>{item.meta}</span>
        </div>
      ) : null}
    </article>
  );
}
