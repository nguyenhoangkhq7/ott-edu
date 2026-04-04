import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import UserAvatar from "../../../shared/components/UserAvatar";

import { getCurrentUser } from "../../auth/auth.service";
import { useAuth } from "../../auth/AuthProvider";
import { AccountHeader, AccountSection, InfoRow } from "../components";

type StatusMeta = {
  label: string;
  color: string;
};

function toRoleLabel(roles: string[] | undefined): string {
  if (!roles || roles.length === 0) {
    return "-";
  }

  const labels: string[] = [];
  if (roles.includes("ROLE_TEACHER") || roles.includes("ROLE_INSTRUCTOR")) {
    labels.push("Teacher");
  }
  if (roles.includes("ROLE_STUDENT")) {
    labels.push("Student");
  }

  return labels.length > 0 ? labels.join(", ") : "-";
}

function toStatusMeta(status: string | null | undefined): StatusMeta {
  switch (status) {
    case "BUSY":
    case "DO_NOT_DISTURB":
      return { label: "Busy", color: "#ef4444" };
    case "BE_RIGHT_BACK":
    case "APPEAR_AWAY":
      return { label: "Away", color: "#f59e0b" };
    case "APPEAR_OFFLINE":
      return { label: "Offline", color: "#94a3b8" };
    case "AVAILABLE":
    default:
      return { label: "Available", color: "#16a34a" };
  }
}

export default function AccountOverviewScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fullName = useMemo(() => {
    const value = [user?.lastName, user?.firstName].filter(Boolean).join(" ").trim();
    return value || "User";
  }, [user]);

  const roleLabel = useMemo(() => toRoleLabel(user?.roles), [user?.roles]);
  const statusMeta = useMemo(() => toStatusMeta(user?.status), [user?.status]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const latestUser = await getCurrentUser();
      setUser(latestUser);
    } catch (error) {
      Alert.alert("Loi", error instanceof Error ? error.message : "Khong the tai thong tin tai khoan.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Dang xuat", "Ban co chac muon dang xuat?", [
      { text: "Huy", style: "cancel" },
      {
        text: "Dang xuat",
        style: "destructive",
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AccountHeader
        title="Account"
        subtitle="Manage profile and security"
        avatarUrl={user?.avatarUrl}
        firstName={user?.firstName}
        lastName={user?.lastName}
        email={user?.email}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <UserAvatar
            avatarUrl={user?.avatarUrl}
            firstName={user?.firstName}
            lastName={user?.lastName}
            email={user?.email}
            size={46}
          />
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>{fullName}</Text>
            <Text style={styles.heroSubtitle}>{user?.email || "-"}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
              <Text style={styles.statusText}>{statusMeta.label}</Text>
            </View>
          </View>
        </View>

        <AccountSection title="My Profile">
          <InfoRow label="Full Name" value={fullName} />
          <InfoRow label="Email" value={user?.email || "-"} />
          <InfoRow label="Status" value={statusMeta.label} />
          <InfoRow label="Role" value={roleLabel} />
          <InfoRow label="Department" value={user?.departmentName || "Not updated"} />
          <InfoRow label="Phone Number" value={user?.phone || "Not updated"} />

          <View style={styles.rowActions}>
            <Pressable style={styles.primaryButton} onPress={() => router.push("/(dashboard)/account/profile")}> 
              <Text style={styles.primaryText}>View Profile</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => router.push("/(dashboard)/account/edit")}>
              <Text style={styles.secondaryText}>Edit Profile</Text>
            </Pressable>
          </View>
        </AccountSection>

        <AccountSection title="Security">
          <Pressable style={styles.itemButton} onPress={() => router.push("/(dashboard)/account/change-password")}> 
            <Text style={styles.itemButtonText}>Change Password</Text>
          </Pressable>
          <Pressable style={styles.itemButton} onPress={handleRefresh} disabled={isRefreshing}>
            <Text style={styles.itemButtonText}>{isRefreshing ? "Refreshing..." : "Sync Profile"}</Text>
          </Pressable>
          <Pressable style={[styles.itemButton, styles.logoutButton]} onPress={handleLogout}>
            <Text style={[styles.itemButtonText, styles.logoutText]}>Sign Out</Text>
          </Pressable>
        </AccountSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 16,
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  heroTextWrap: {
    flex: 1,
    gap: 3,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  heroSubtitle: {
    fontSize: 13,
    color: "#64748b",
  },
  statusRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  rowActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 42,
    backgroundColor: "#ffffff",
  },
  secondaryText: {
    color: "#0f172a",
    fontWeight: "600",
  },
  itemButton: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  itemButtonText: {
    color: "#0f172a",
    fontWeight: "600",
  },
  logoutButton: {
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  logoutText: {
    color: "#b91c1c",
  },
});
