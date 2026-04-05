"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileDetailsSection from "./components/ProfileDetailsSection";
import ContactInformationSection from "./components/ContactInformationSection";
import SecurityPrivacySection from "./components/SecurityPrivacySection";
import { getCurrentUser, type AuthUser } from "@/services/auth/auth.service";

type TabId = "manage" | "subscriptions" | "plan";

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: "manage", label: "Manage account" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "plan", label: "Plan details" },
];

export default function AccountPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("manage");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const result = await getCurrentUser();
        if (mounted) {
          setUser(result);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  const fullName = useMemo(() => {
    if (!user) {
      return "Unknown User";
    }

    return [user.lastName, user.firstName].filter(Boolean).join(" ") || user.email;
  }, [user]);

  const handleEditProfile = () => {
    router.push("/account/edit");
  };

  const handleChangeEmail = () => {
    router.push("/account/edit");
  };

  const handleEditPhone = () => {
    router.push("/account/edit");
  };

  const handleUpdatePassword = () => {
    router.push("/account/change-password");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-3xl font-bold text-slate-900">Account</h1>

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading account...</div>
      ) : null}

      <div className="mb-8 border-b border-slate-200">
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

      {activeTab === "manage" && (
        <div className="space-y-6">
          <ProfileDetailsSection
            avatarUrl={user?.avatarUrl || "/assets/avatar-placeholder.png"}
            fullName={fullName}
            onEdit={handleEditProfile}
          />

          <ContactInformationSection
            email={user?.email || "-"}
            phoneNumber={user?.phone || "Chua cap nhat"}
            onChangeEmail={handleChangeEmail}
            onEditPhone={handleEditPhone}
          />

          <SecurityPrivacySection
            twoFactorEnabled={twoFactorEnabled}
            onToggleTwoFactor={setTwoFactorEnabled}
            passwordLastChanged="3 months ago"
            onUpdatePassword={handleUpdatePassword}
          />
        </div>
      )}

      {activeTab === "subscriptions" && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">No active subscriptions</p>
        </div>
      )}

      {activeTab === "plan" && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Plan details will be displayed here</p>
        </div>
      )}
    </div>
  );
}
