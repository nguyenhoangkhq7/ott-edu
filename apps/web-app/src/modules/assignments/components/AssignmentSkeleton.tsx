'use client';

import React from 'react';

export default function AssignmentSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-slate-200 animate-pulse" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
          </div>
        </div>
        <div className="h-6 bg-slate-200 rounded-full animate-pulse w-16 shrink-0" />
      </div>

      {/* Description */}
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-slate-200 rounded animate-pulse w-full" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-4/5" />
      </div>

      {/* Meta */}
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
      </div>

      {/* Button */}
      <div className="h-10 bg-slate-200 rounded-lg animate-pulse" />
    </div>
  );
}

export function AssignmentSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <AssignmentSkeleton key={i} />
      ))}
    </div>
  );
}
