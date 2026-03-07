"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordFormPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 6) return { strength: 20, label: "WEAK", color: "bg-red-500" };
    
    let strength = 0;
    const checks = {
      hasMinLength: password.length >= 6,
      hasSymbolOrNumber: /[\d!@#$%^&*(),.?":{}|<>]/.test(password),
      hasMixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    };

    if (checks.hasMinLength) strength += 33;
    if (checks.hasSymbolOrNumber) strength += 33;
    if (checks.hasMixedCase) strength += 34;

    if (strength <= 33) return { strength, label: "WEAK", color: "bg-red-500", checks };
    if (strength <= 66) return { strength, label: "MEDIUM", color: "bg-yellow-500", checks };
    return { strength: 100, label: "STRONG", color: "bg-green-500", checks };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const isValid = 
    currentPassword.length > 0 &&
    newPassword.length >= 6 &&
    /[\d!@#$%^&*(),.?":{}|<>]/.test(newPassword) &&
    newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      // TODO: Call API to change password
      router.push("/account");
    }
  };

  const handleCancel = () => {
    router.push("/account");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <span className="text-base font-semibold text-slate-900">Microsoft Teams</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-full p-1 hover:bg-slate-100">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
              </svg>
            </button>
            <button className="rounded-full p-1 hover:bg-slate-100">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="currentColor">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-200">
              <span className="text-sm font-medium text-indigo-800">JD</span>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-xl bg-white p-8 shadow-sm">
          <h2 className="mb-2 text-2xl font-bold text-slate-900">
            Create new password
          </h2>
          
          <p className="mb-6 text-sm text-slate-600">
            Choose a strong password to protect your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                Current password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {showCurrentPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                New password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pr-16 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">Password strength</span>
                  <span className={`text-xs font-bold ${
                    passwordStrength.label === "STRONG" ? "text-green-600" :
                    passwordStrength.label === "MEDIUM" ? "text-yellow-600" :
                    "text-red-600"
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.strength}%` }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                      passwordStrength.checks?.hasMinLength ? "bg-green-500" : "bg-slate-300"
                    }`}>
                      {passwordStrength.checks?.hasMinLength ? (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-500" />
                      )}
                    </div>
                    <span className={`text-xs ${passwordStrength.checks?.hasMinLength ? "text-slate-900" : "text-slate-500"}`}>
                      At least 6 characters
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                      passwordStrength.checks?.hasSymbolOrNumber ? "bg-green-500" : "bg-slate-300"
                    }`}>
                      {passwordStrength.checks?.hasSymbolOrNumber ? (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-500" />
                      )}
                    </div>
                    <span className={`text-xs ${passwordStrength.checks?.hasSymbolOrNumber ? "text-slate-900" : "text-slate-500"}`}>
                      Include a symbol or number
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                      passwordStrength.checks?.hasMixedCase ? "bg-green-500" : "bg-slate-300"
                    }`}>
                      {passwordStrength.checks?.hasMixedCase ? (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-slate-500" />
                      )}
                    </div>
                    <span className={`text-xs ${passwordStrength.checks?.hasMixedCase ? "text-slate-900" : "text-slate-500"}`}>
                      Mix of uppercase and lowercase
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!isValid}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Change Password
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleCancel}
              className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
            Need help? <a href="#" className="font-medium text-blue-600 hover:text-blue-700">Contact your IT administrator</a>
          </div>
        </div>
      </div>
    </div>
  );
}
