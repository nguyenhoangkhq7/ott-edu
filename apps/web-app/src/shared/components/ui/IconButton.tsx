import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ariaLabel: string;
  children: ReactNode;
}

export default function IconButton({
  ariaLabel,
  children,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:shadow-md ${
        className ?? ""
      }`}
      {...rest}
    >
      {children}
    </button>
  );
}
