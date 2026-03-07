"use client";

import { useState } from "react";
import Toggle from "@/shared/components/ui/Toggle";

type PrivacyLevel = "public" | "internal" | "private";

export default function PrivacySettingsPage() {
  const [contactRequests, setContactRequests] = useState(true);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>("internal");
  const [blockedCount] = useState(14);

  const handleManagePriorityAccess = () => {
    console.log("Manage priority access");
  };

  const handleEditBlockedContacts = () => {
    console.log("Edit blocked contacts");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Privacy</h1>
      <p className="mb-8 text-sm text-slate-500">
        Manage how people can find and contact you, and control your data visibility.
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Who can contact you</h2>
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">Priority access</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose who can reach you when Do Not Disturb is on.
                  </p>
                </div>
                <button
                  onClick={handleManagePriorityAccess}
                  className="ml-4 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  Manage priority access
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">Contact requests</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Show people your contact requests from people outside your organization.
                  </p>
                </div>
                <Toggle
                  enabled={contactRequests}
                  onChange={setContactRequests}
                  ariaLabel="Toggle contact requests"
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Blocked contacts</h2>
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="mb-2 text-sm font-semibold text-slate-900">Manage blocked contacts</h3>
                <p className="mb-4 text-sm text-slate-500">
                  View and edit the list of people you have blocked. Blocked people won&apos;t be able to call you or see your presence.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-slate-200">
                      <svg viewBox="0 0 24 24" className="h-full w-full text-slate-400" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-slate-300">
                      <svg viewBox="0 0 24 24" className="h-full w-full text-slate-500" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-400">
                      <span className="text-xs font-medium text-white">+{blockedCount - 2}</span>
                    </div>
                  </div>
                  <span className="text-sm text-slate-600">{blockedCount} blocked contacts</span>
                </div>
              </div>
              <button
                onClick={handleEditBlockedContacts}
                className="ml-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Edit blocked contacts
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Privacy levels</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <button
              onClick={() => setPrivacyLevel("public")}
              className={`rounded-lg border-2 p-6 text-left transition-all ${
                privacyLevel === "public"
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                {privacyLevel === "public" && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Public</h3>
              <p className="text-xs text-slate-500">
                Presence visible to everyone in your organization.
              </p>
            </button>

            <button
              onClick={() => setPrivacyLevel("internal")}
              className={`rounded-lg border-2 p-6 text-left transition-all ${
                privacyLevel === "internal"
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                </div>
                {privacyLevel === "internal" && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Internal Only</h3>
              <p className="text-xs text-slate-500">
                Presence only visible to people you have interacted with.
              </p>
            </button>

            <button
              onClick={() => setPrivacyLevel("private")}
              className={`rounded-lg border-2 p-6 text-left transition-all ${
                privacyLevel === "private"
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M4.93 4.93l14.14 14.14" />
                  </svg>
                </div>
                {privacyLevel === "private" && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Private</h3>
              <p className="text-xs text-slate-500">
                Appear offline to everyone by default.
              </p>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
