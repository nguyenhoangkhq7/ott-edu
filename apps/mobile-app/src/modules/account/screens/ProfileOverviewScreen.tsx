import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import UserAvatar from "../../../shared/components/UserAvatar";
import { useAuth } from "../../auth/AuthProvider";
import { getSchools } from "../../auth/auth.service";
import { AccountHeader, AccountSection, InfoRow } from "../components";

function toStatusMeta(status: string | null | undefined): { label: string; color: string } {
  switch (status) {
    case "BUSY":
    case "DO_NOT_DISTURB":
      return { label: "Bận", color: "#ef4444" };
    case "BE_RIGHT_BACK":
    case "APPEAR_AWAY":
      return { label: "Vắng mặt", color: "#f59e0b" };
    case "APPEAR_OFFLINE":
      return { label: "Ngoại tuyến", color: "#94a3b8" };
    case "AVAILABLE":
    default:
      return { label: "Đang hoạt động", color: "#10b981" };
  }
}

export default function ProfileOverviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [schoolName, setSchoolName] = useState<string>("Đang tải...");
  
  const statusMeta = useMemo(() => toStatusMeta(user?.status), [user?.status]);

  const fullName = useMemo(() => {
    const value = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return value || user?.email || "Người dùng";
  }, [user]);

  useEffect(() => {
    async function loadSchool() {
      if (!user?.schoolId) {
        setSchoolName("Chưa cập nhật trường");
        return;
      }
      try {
        const schools = await getSchools();
        const match = schools.find((s) => s.id === user.schoolId);
        if (match) {
          setSchoolName(match.name);
        } else {
          setSchoolName("Trường khác");
        }
      } catch {
        setSchoolName("Lỗi tải thông tin");
      }
    }
    loadSchool();
  }, [user?.schoolId]);

  return (
    <SafeAreaView style={styles.container}>
      <AccountHeader
        title="Hồ sơ cá nhân"
        subtitle="Thông tin cá nhân được liên kết trong hệ thống"
        onBack={() => router.back()}
        avatarUrl={user?.avatarUrl}
        firstName={user?.firstName}
        lastName={user?.lastName}
        email={user?.email}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card Summary */}
        <View style={styles.heroCard}>
          <View style={styles.avatarBorder}>
            <UserAvatar
              avatarUrl={user?.avatarUrl}
              firstName={user?.firstName}
              lastName={user?.lastName}
              email={user?.email}
              size={90}
            />
          </View>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.email}>{user?.email || "Chưa cập nhật email"}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
              <Text style={styles.statusLabel}>{statusMeta.label}</Text>
            </View>
            <View style={styles.dividerDot} />
            <Text style={styles.codeText}>Mã số: {user?.code || "Chưa cập nhật"}</Text>
          </View>

          <View style={styles.academicContainer}>
            <View style={styles.academicBadge}>
              <Ionicons name="school" size={15} color="#4f46e5" />
              <Text style={styles.academicText} numberOfLines={1}>{schoolName}</Text>
            </View>
            <View style={[styles.academicBadge, { backgroundColor: "#ecfdf5" }]}>
              <Ionicons name="business" size={15} color="#059669" />
              <Text style={[styles.academicText, { color: "#059669" }]} numberOfLines={1}>
                {user?.departmentName || "Chưa cập nhật khoa"}
              </Text>
            </View>
          </View>
        </View>

        <AccountSection title="Thông tin liên lạc">
          <InfoRow label="Email đăng ký" value={user?.email || "-"} />
          <InfoRow label="Số điện thoại" value={user?.phone || "Chưa cập nhật số điện thoại"} />
        </AccountSection>

        {/* Small Intro/Bio */}
        <AccountSection title="Giới thiệu bản thân">
          <View style={styles.bioCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#e2e8f0" style={styles.quoteIcon} />
            <Text style={styles.bio}>{user?.bio || "Người dùng này chưa viết lời giới thiệu nào."}</Text>
          </View>
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    padding: 22,
    gap: 10,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarBorder: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  name: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.4,
  },
  email: {
    fontSize: 13.5,
    color: "#64748b",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusLabel: {
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  dividerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#cbd5e1",
  },
  codeText: {
    fontSize: 12.5,
    color: "#64748b",
    fontWeight: "500",
  },
  academicContainer: {
    flexDirection: "column",
    gap: 8,
    width: "100%",
    marginTop: 10,
  },
  academicBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    width: "100%",
    borderWidth: 1,
    borderColor: "transparent",
  },
  academicText: {
    fontSize: 12.5,
    color: "#4f46e5",
    fontWeight: "600",
    flex: 1,
  },
  bioCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    position: "relative",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  quoteIcon: {
    position: "absolute",
    top: 10,
    left: 10,
  },
  bio: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 22,
    fontStyle: "italic",
    paddingLeft: 12,
  },
});
