"use client";

import { useRouter } from "next/navigation";

export default function PasswordUpdatedPage() {
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/login");
  };

  const handleSecuritySettings = () => {
    router.push("/account");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-slate-900">Microsoft Teams</span>
        </div>

        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mb-6 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
              <svg viewBox="0 0 24 24" className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <h2 className="mb-3 text-2xl font-bold text-slate-900">
            Password updated!
          </h2>
          
          <p className="mb-8 text-sm text-slate-600">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>

          <button
            onClick={handleSignIn}
            className="mb-3 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Sign In
          </button>

          <button
            onClick={handleSecuritySettings}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
          >
            Go to Security Settings
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-700">Privacy Statement</a>
            <a href="#" className="hover:text-slate-700">Terms of Use</a>
            <span>© 2024 Microsoft</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">
            <svg viewBox="0 0 24 24" className="mb-1 inline h-4 w-4" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>{" "}
            Secure password reset by Microsoft Identity Service
          </p>
        </div>
      </div>
    </div>
  );
}
