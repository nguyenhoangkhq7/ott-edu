import { type ReactNode } from "react";

type AuthPageContainerProps = {
  children: ReactNode;
};

export default function AuthPageContainer({ children }: AuthPageContainerProps) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-8rem] h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-200/45 blur-3xl" />
        <div className="absolute -left-24 bottom-6 h-72 w-72 rounded-full bg-slate-300/35 blur-3xl" />
        <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(100,116,139,0.18)_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <div className="relative z-10 w-full max-w-[412px]">{children}</div>
    </div>
  );
}
