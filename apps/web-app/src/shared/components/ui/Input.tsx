import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function Input({ label, className, type = "text", ...rest }: InputProps) {
  return (
    <label className="flex w-full flex-col gap-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
          className ?? ""
        }`}
        {...rest}
      />
    </label>
  );
}