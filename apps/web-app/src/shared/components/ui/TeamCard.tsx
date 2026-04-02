"use client";

import { useRouter } from "next/navigation";
import type { TeamItem } from "@/shared/types/teams";

interface TeamCardProps {
  item: TeamItem;
}

export default function TeamCard({ item }: TeamCardProps) {
  const router = useRouter();

  return (
    <article className={`group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
      item.isActive === false ? 'opacity-70 grayscale-[0.3]' : ''
    }`}>
      <div className="mb-4 flex items-start justify-between">
        <div className="relative">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-semibold text-white shadow-xs"
            style={{ backgroundColor: item.isActive === false ? '#64748b' : item.accentColor }}
          >
            {item.initials}
          </div>
          {item.isActive === false && (
            <div className="absolute -top-2.5 -right-2.5 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-md border-2 border-white uppercase tracking-wider z-20">
              Cancelled
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/teams/${item.id}/edit`);
          }}
          aria-label={`Open ${item.name} options`}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 relative z-10"
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
