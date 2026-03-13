"use client";

import { useState } from "react";
import Image from "next/image";

type TabId = "overview" | "activity" | "organization" | "files";

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "organization", label: "Organization" },
  { id: "files", label: "Files" },
];

export default function ProfileOverviewPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const handleEditProfile = () => {
    console.log("Edit profile");
  };

  const handleJoinCall = () => {
    console.log("Join call");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-start gap-6">
        <div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src="/assets/avatar-placeholder.png"
            alt="Thành Tô"
            fill
            className="object-cover"
          />
          <div className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
        </div>

        <div className="flex-1">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Thành Tô</h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-sm text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  Available
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-slate-600">Product Designer</span>
              </div>
            </div>
            <button
              onClick={handleEditProfile}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Profile
            </button>
          </div>

          <p className="mb-4 text-sm text-slate-600">thanh.to@organization.com</p>

          <div className="mb-6 border-b border-slate-200">
            <nav className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative pb-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-blue-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <section className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" fill="white" />
                </svg>
                <h2 className="text-sm font-semibold text-slate-900">Contact Information</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">EMAIL</p>
                    <a href="mailto:thanh.to@example.com" className="text-sm text-blue-600 hover:underline">
                      thanh.to@example.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 2H8L2 8v8l6 6h8l6-6V8l-6-6z" />
                    <path d="M8 2v6H2m14-6v6h6M8 22v-6H2m14 6v-6h6" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">LINKEDIN</p>
                    <a href="https://linkedin.com/in/thanhto" className="text-sm text-blue-600 hover:underline">
                      linkedin.com/in/thanhto
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">LOCATION</p>
                    <p className="text-sm text-slate-700">Ho Chi Minh City, Vietnam</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <h2 className="text-sm font-semibold text-slate-900">Recent Updates</h2>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-2 w-2 flex-shrink-0 items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">
                      Updated status to <span className="font-medium text-green-600">Available</span>
                    </p>
                    <p className="text-xs text-slate-500">Yesterday, 4:30 PM</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-2 w-2 flex-shrink-0 items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">
                      Shared a file: <span className="font-medium">Project_Overview_V2.pdf</span>
                    </p>
                    <p className="text-xs text-slate-500">Oct 24, 2023</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Current Team
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 text-blue-600" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">Design Guild</h3>
                  <p className="text-xs text-slate-500">12 members</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Mutual Contacts
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-blue-200" />
                  <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-green-200" />
                  <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-purple-200" />
                  <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-orange-200" />
                  <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-pink-200" />
                </div>
                <span className="text-sm font-medium text-slate-600">+5</span>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Next Meeting
              </h2>
              <div className="mb-4 rounded-lg bg-blue-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600">OCT</span>
                  <span className="text-2xl font-bold text-blue-600">28</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">Weekly Sync</p>
                <p className="text-xs text-slate-500">10:00 AM - 11:00 AM</p>
              </div>
              <button
                onClick={handleJoinCall}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Join Call
              </button>
            </section>
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">No recent activity</p>
        </div>
      )}

      {activeTab === "organization" && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Organization details will be displayed here</p>
        </div>
      )}

      {activeTab === "files" && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">No files shared</p>
        </div>
      )}
    </div>
  );
}
