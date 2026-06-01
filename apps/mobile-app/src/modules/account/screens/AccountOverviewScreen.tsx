import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import UserAvatar from "../../../shared/components/UserAvatar";

import { getSchools } from "../../auth/auth.service";
import { useAuth } from "../../auth/AuthProvider";

type StatusMeta = {
  label: string;
  color: string;
};

function toRoleLabel(roles: string[] | undefined): string {
  if (!roles || roles.length === 0) return "Thành viên";
  const labels: string[] = [];
  if (roles.includes("ROLE_TEACHER") || roles.includes("ROLE_INSTRUCTOR")) {
    labels.push("Giáo viên");
  }
  if (roles.includes("ROLE_STUDENT")) {
    labels.push("Học sinh / Sinh viên");
  }
  return labels.length > 0 ? labels.join(", ") : "Thành viên";
}

function toStatusMeta(status: string | null | undefined): StatusMeta {
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

export default function AccountOverviewScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [schoolName, setSchoolName] = useState<string>("Đang tải...");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const fullName = useMemo(() => {
    const value = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return value || user?.email || "Người dùng";
  }, [user]);

  const roleLabel = useMemo(() => toRoleLabel(user?.roles), [user?.roles]);
  const statusMeta = useMemo(() => toStatusMeta(user?.status), [user?.status]);

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

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
        <Text style={styles.headerSubtitle}>Quản lý thông tin & cấu hình bảo mật</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardHeader}>
            <View style={styles.avatarContainer}>
              <UserAvatar
                avatarUrl={user?.avatarUrl}
                firstName={user?.firstName}
                lastName={user?.lastName}
                email={user?.email}
                size={68}
              />
              <View style={[styles.statusIndicator, { backgroundColor: statusMeta.color }]} />
            </View>
             <View style={styles.profileMeta}>
               <View style={{ position: "relative", zIndex: 10 }}>
                 <Pressable
                   onPressIn={() => setActiveTooltip("name")}
                   onPressOut={() => setActiveTooltip(null)}
                 >
                   <Text style={styles.profileName} numberOfLines={1}>{fullName}</Text>
                 </Pressable>
                 {activeTooltip === "name" && (
                   <View style={styles.tooltipContainer}>
                     <Text style={styles.tooltipText}>{fullName}</Text>
                     <View style={styles.tooltipArrow} />
                   </View>
                 )}
               </View>

               <View style={{ position: "relative", zIndex: 9 }}>
                 <Pressable
                   onPressIn={() => setActiveTooltip("email")}
                   onPressOut={() => setActiveTooltip(null)}
                 >
                   <Text style={styles.profileEmail} numberOfLines={1}>{user?.email || "Chưa thiết lập email"}</Text>
                 </Pressable>
                 {activeTooltip === "email" && (
                   <View style={styles.tooltipContainer}>
                     <Text style={styles.tooltipText}>{user?.email || ""}</Text>
                     <View style={styles.tooltipArrow} />
                   </View>
                 )}
               </View>

               <View style={styles.badgeRow}>
                 <View style={styles.roleBadge}>
                   <Text style={styles.roleBadgeText}>{roleLabel}</Text>
                 </View>
                 <View style={styles.statusBadge}>
                   <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                 </View>
               </View>
             </View>
           </View>
 
           {/* School & Department Sub-Card */}
           <View style={styles.schoolInfoCard}>
             <View style={styles.schoolRow}>
               <View style={styles.iconCircle}>
                 <Ionicons name="school" size={16} color="#4f46e5" />
               </View>
               <View style={{ flex: 1, position: "relative", zIndex: 8 }}>
                 <Pressable
                   style={styles.schoolTextWrap}
                   onPressIn={() => setActiveTooltip("school")}
                   onPressOut={() => setActiveTooltip(null)}
                 >
                   <Text style={styles.schoolLabel}>Trường</Text>
                   <Text style={styles.schoolValue} numberOfLines={1}>{schoolName}</Text>
                 </Pressable>
                 {activeTooltip === "school" && (
                   <View style={styles.tooltipContainer}>
                     <Text style={styles.tooltipText}>{schoolName}</Text>
                     <View style={styles.tooltipArrow} />
                   </View>
                 )}
               </View>
             </View>
             <View style={styles.divider} />
             <View style={styles.schoolRow}>
               <View style={styles.iconCircle}>
                 <Ionicons name="business" size={16} color="#06b6d4" />
               </View>
               <View style={{ flex: 1, position: "relative", zIndex: 7 }}>
                 <Pressable
                   style={styles.schoolTextWrap}
                   onPressIn={() => setActiveTooltip("dept")}
                   onPressOut={() => setActiveTooltip(null)}
                 >
                   <Text style={styles.schoolLabel}>Khoa / Phòng ban</Text>
                   <Text style={styles.schoolValue} numberOfLines={1}>
                     {user?.departmentName || "Chưa cập nhật khoa"}
                   </Text>
                 </Pressable>
                 {activeTooltip === "dept" && (
                   <View style={styles.tooltipContainer}>
                     <Text style={styles.tooltipText}>{user?.departmentName || "Chưa cập nhật khoa"}</Text>
                     <View style={styles.tooltipArrow} />
                   </View>
                 )}
               </View>
             </View>
          </View>
        </View>

        {/* Settings Menu List */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupTitle}>Thông tin cá nhân</Text>
          
          <Pressable style={styles.menuItem} onPress={() => router.push("/(dashboard)/account/profile")}>
            <View style={[styles.menuIconBg, { backgroundColor: "#e0e7ff" }]}>
              <Ionicons name="person" size={18} color="#4f46e5" />
            </View>
            <Text style={styles.menuItemText}>Xem hồ sơ chi tiết</Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>

          <View style={styles.menuItemDivider} />

          <Pressable style={styles.menuItem} onPress={() => router.push("/(dashboard)/account/edit")}>
            <View style={[styles.menuIconBg, { backgroundColor: "#ecfdf5" }]}>
              <Ionicons name="create" size={18} color="#10b981" />
            </View>
            <Text style={styles.menuItemText}>Chỉnh sửa hồ sơ</Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>
        </View>

        <View style={styles.menuGroup}>
          <Text style={styles.groupTitle}>Bảo mật & Hệ thống</Text>
          
          <Pressable style={styles.menuItem} onPress={() => router.push("/(dashboard)/account/change-password")}>
            <View style={[styles.menuIconBg, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="key" size={18} color="#d97706" />
            </View>
            <Text style={styles.menuItemText}>Đổi mật khẩu</Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => router.push("/(dashboard)/account/qr-scanner")}>
            <View style={[styles.menuIconBg, { backgroundColor: "#e0f2fe" }]}>
              <Ionicons name="qr-code" size={18} color="#0284c7" />
            </View>
            <Text style={styles.menuItemText}>Đăng nhập QR Web</Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>

          <View style={styles.menuItemDivider} />

          <Pressable style={[styles.menuItem]} onPress={handleLogout}>
            <View style={[styles.menuIconBg, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="log-out" size={18} color="#ef4444" />
            </View>
            <Text style={[styles.menuItemText, { color: "#ef4444", fontWeight: "600" }]}>Đăng xuất</Text>
            <Ionicons name="chevron-forward" size={18} color="#fee2e2" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 18,
  },
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
    gap: 16,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  profileCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: "#ffffff",
  },
  profileMeta: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    color: "#64748b",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    alignItems: "center",
  },
  roleBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  statusBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  schoolInfoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  schoolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  schoolTextWrap: {
    flex: 1,
    gap: 1,
  },
  schoolLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  schoolValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  menuGroup: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 6,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#334155",
    flex: 1,
  },
  menuItemDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginLeft: 62,
  },
  tooltipContainer: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    backgroundColor: "#1e293b",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 6,
    zIndex: 9999,
    minWidth: 80,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  tooltipArrow: {
    position: "absolute",
    top: "100%",
    left: 14,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: "transparent",
    borderRightWidth: 6,
    borderRightColor: "transparent",
    borderTopWidth: 6,
    borderTopColor: "#1e293b",
  },
});
