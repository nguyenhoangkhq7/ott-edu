import Toggle from "@/shared/components/ui/Toggle";

interface SecurityPrivacySectionProps {
  twoFactorEnabled: boolean;
  onToggleTwoFactor: (enabled: boolean) => void;
  passwordLastChanged: string;
  onUpdatePassword: () => void;
}

export default function SecurityPrivacySection({
  twoFactorEnabled,
  onToggleTwoFactor,
  passwordLastChanged,
  onUpdatePassword,
}: SecurityPrivacySectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Security & Privacy</h2>
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">Two-factor authentication</h3>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                Add an extra layer of security to your account by requiring more than just a password to log in.
              </p>
            </div>
          </div>
          <Toggle
            enabled={twoFactorEnabled}
            onChange={onToggleTwoFactor}
            ariaLabel="Toggle two-factor authentication"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Password</h3>
            <p className="mt-1 text-xs text-slate-500">Last changed {passwordLastChanged}</p>
          </div>
          <button
            onClick={onUpdatePassword}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Update password
          </button>
        </div>
      </div>
    </section>
  );
}
