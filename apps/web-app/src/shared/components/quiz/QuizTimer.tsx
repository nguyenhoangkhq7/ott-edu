'use client';

import React from 'react';

interface QuizTimerProps {
  timeRemainingSeconds: number;
  onExpired?: () => void;
}

export const QuizTimer: React.FC<QuizTimerProps> = ({ timeRemainingSeconds }) => {
  const minutes = Math.floor(timeRemainingSeconds / 60);
  const seconds = timeRemainingSeconds % 60;

  const isWarning = timeRemainingSeconds <= 300; // 5 minutes
  const isCritical = timeRemainingSeconds <= 60; // 1 minute

  const formatPad = (n: number) => String(n).padStart(2, '0');

  return (
    <div
      className={`
        rounded-2xl p-4 border-2 transition-all duration-500
        ${isCritical
          ? 'bg-red-50 border-red-400'
          : isWarning
          ? 'bg-amber-50 border-amber-400'
          : 'bg-white border-slate-200'
        }
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <svg
          className={`w-4 h-4 ${isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-slate-500'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`text-xs font-semibold tracking-widest uppercase ${
          isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-500'
        }`}>
          Time Remaining
        </span>
      </div>

      <div
        className={`text-4xl font-bold tabular-nums tracking-wide ${
          isCritical ? 'text-red-600 animate-pulse' : isWarning ? 'text-amber-600' : 'text-slate-800'
        }`}
      >
        {formatPad(minutes)}:{formatPad(seconds)}
      </div>
    </div>
  );
};

export default QuizTimer;
