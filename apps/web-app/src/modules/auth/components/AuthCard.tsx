import { type ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
};

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <section className="w-full rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-900/10 sm:p-10">
      {children}
    </section>
  );
}