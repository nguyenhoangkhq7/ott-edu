interface SectionTitleProps {
  title: string;
  count?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  showToggle?: boolean;
}

export default function SectionTitle({ title, count, isExpanded = true, onToggle, showToggle = true }: SectionTitleProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showToggle && onToggle && (
          <button
            onClick={onToggle}
            className="flex items-center justify-center w-6 h-6 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-4 w-4 transition-transform duration-300 ease-out ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
      </div>
      {typeof count === "number" ? (
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          {count}
        </span>
      ) : null}
    </div>
  );
}
