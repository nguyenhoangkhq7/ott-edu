import { type ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
};

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <section className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-black/20 sm:p-10">
      {children}
    </section>
  );
}