import { useMemo } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import UserAvatar from "../../../shared/components/UserAvatar";
import { useAuth } from "../../auth/AuthProvider";
import { AccountHeader, AccountSection, InfoRow } from "../components";

function toStatusMeta(status: string | null | undefined): { label: string; color: string } {
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

export default function ProfileOverviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const statusMeta = useMemo(() => toStatusMeta(user?.status), [user?.status]);

  const fullName = useMemo(() => {
    const value = [user?.lastName, user?.firstName].filter(Boolean).join(" ").trim();
    return value || user?.email || "User";
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <AccountHeader
        title="Profile"
        subtitle="Personal information"
        onBack={() => router.back()}
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
            size={86}
          />
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user?.email || "-"}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
            <Text style={styles.statusLabel}>{statusMeta.label}</Text>
          </View>
          <View style={styles.departmentBadge}>
            <Ionicons name="school-outline" size={14} color="#4f46e5" />
            <Text style={styles.department}>{user?.departmentName || "No department"}</Text>
          </View>
        </View>

        <AccountSection title="Contact Information">
          <InfoRow label="Email" value={user?.email || "-"} />
          <InfoRow label="Phone Number" value={user?.phone || "Not updated"} />
        </AccountSection>

        <AccountSection title="About">
          <Text style={styles.bio}>{user?.bio || "No description yet"}</Text>
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#ffffff",
    alignItems: "center",
    padding: 20,
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  email: {
    fontSize: 14,
    color: "#475569",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
  department: {
    fontSize: 13,
    color: "#4f46e5",
    fontWeight: "600",
  },
  departmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
  },
  bio: {
    color: "#0f172a",
    lineHeight: 20,
  },
});
