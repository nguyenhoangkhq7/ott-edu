"use client";

import { useState } from "react";
import Toggle from "@/shared/components/ui/Toggle";

export default function AdminSettingsPage() {
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [smtpServer, setSmtpServer] = useState("smtp.company.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [retentionDays, setRetentionDays] = useState("90");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Settings saved successfully. System parameters updated.");
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">System Settings</h2>
        <p className="text-xs text-slate-500 mt-1">Configure global server preferences, integration APIs, and security protocols.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Security & Access */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5">Security Preferences</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-700">Enforce Multi-Factor Auth (MFA)</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Require MFA verification for all administrator accounts.</p>
            </div>
            <Toggle
              ariaLabel="Enforce MFA"
              enabled={mfaEnabled}
              onChange={setMfaEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-700">Allow Self-Registration</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Allow normal users to sign up via public login portal.</p>
            </div>
            <Toggle
              ariaLabel="Allow self registration"
              enabled={signupEnabled}
              onChange={setSignupEnabled}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Session Timeout</span>
            <div className="relative">
              <select
                defaultValue="3600"
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 appearance-none cursor-pointer"
              >
                <option value="900">15 Minutes</option>
                <option value="1800">30 Minutes</option>
                <option value="3600">1 Hour (Recommended)</option>
                <option value="86400">24 Hours</option>
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Database & Retention */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5">Data Retention & Logs</h3>
          
          <label className="flex w-full flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Log Audit Retention (Days)</span>
            <input
              type="number"
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <div className="pt-2 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Manual Database Maintenance</p>
            <div className="flex gap-2.5">
              <button
                onClick={() => showToast("System backup initialized. Download package will be available in core-service/backups shortly.")}
                className="flex-1 h-9 rounded-md border border-slate-250 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Backup Now
              </button>
              <button
                onClick={() => showToast("Cache purged successfully. 4.2MB of chat/profile indexes flushed.", "success")}
                className="flex-1 h-9 rounded-md border border-red-100 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
              >
                Flush Cache
              </button>
            </div>
          </div>
        </div>

        {/* SMTP Mail Server Configuration */}
        <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5">SMTP Server Configuration</h3>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="flex w-full flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SMTP Server Host</span>
                <input
                  type="text"
                  value={smtpServer}
                  onChange={(e) => setSmtpServer(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>

            <div>
              <label className="flex w-full flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">SMTP Server Port</span>
                <input
                  type="text"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Action */}
      <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-200">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 h-9 px-5 rounded-md bg-[#005fb8] hover:bg-blue-700 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-5 z-50 flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
