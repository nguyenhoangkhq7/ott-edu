import type { InputHTMLAttributes } from "react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function SearchInput({ label, className, ...rest }: SearchInputProps) {
  return (
    <label className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
      <span className="text-slate-400" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </span>
      <span className="sr-only">{label}</span>
      <input
        type="search"
        className={`w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none ${
          className ?? ""
        }`}
        {...rest}
      />
    </label>
  );
}
