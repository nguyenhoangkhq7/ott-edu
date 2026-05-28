import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import UserAvatar from "../../../shared/components/UserAvatar";
import SelectModal, { type SelectOption } from "../../../shared/ui/SelectModal";
import {
  getCurrentUser,
  getDepartmentsBySchoolId,
  getSchools,
  updateCurrentUser,
  uploadAvatar,
  type DepartmentOption,
} from "../../auth/auth.service";
import { useAuth } from "../../auth/AuthProvider";
import { AccountHeader } from "../components";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [about, setAbout] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [schoolName, setSchoolName] = useState("Đang tải...");
  const [activeSelect, setActiveSelect] = useState<"department" | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const departmentOptions = useMemo<SelectOption[]>(
    () => departments.map((item) => ({ value: String(item.id), label: item.name })),
    [departments],
  );

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const nextUser = await getCurrentUser();
        if (!mounted) return;

        setUser(nextUser);
        setFullName([nextUser.firstName, nextUser.lastName].filter(Boolean).join(" "));
        setAbout(nextUser.bio || "");
        setPhone(nextUser.phone || "");
        setAvatarUrl(nextUser.avatarUrl);
        setDepartmentId(nextUser.departmentId ? String(nextUser.departmentId) : "");

        if (nextUser.schoolId) {
          // Fetch school name
          try {
            const schools = await getSchools();
            const match = schools.find((s) => s.id === nextUser.schoolId);
            if (match && mounted) {
              setSchoolName(match.name);
            } else if (mounted) {
              setSchoolName("Trường khác");
            }
          } catch {
            if (mounted) setSchoolName("Chưa liên kết trường");
          }

          // Fetch departments
          const data = await getDepartmentsBySchoolId(nextUser.schoolId);
          if (mounted) {
            setDepartments(data);
          }
        } else if (mounted) {
          setSchoolName("Chưa liên kết trường");
        }
      } catch (error) {
        if (mounted) {
          Alert.alert("Lỗi", error instanceof Error ? error.message : "Không thể tải thông tin profile.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();
    return () => {
      mounted = false;
    };
  }, [setUser]);

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Từ chối quyền", "Cần cấp quyền thư viện để chọn ảnh đại diện.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets[0]) return;
    const file = result.assets[0];

    try {
      setIsUploading(true);
      const uploaded = await uploadAvatar({
        uri: file.uri,
        name: file.fileName || `avatar-${Date.now()}.jpg`,
        type: file.mimeType || "image/jpeg",
      });
      setAvatarUrl(uploaded.avatarUrl);
      if (user) {
        setUser({ ...user, avatarUrl: uploaded.avatarUrl });
      }
    } catch (error) {
      Alert.alert("Lỗi", error instanceof Error ? error.message : "Tải ảnh thất bại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Thông báo", "Vui lòng nhập họ và tên.");
      return;
    }

    try {
      setIsSaving(true);
      const updated = await updateCurrentUser({
        fullName,
        about,
        phone,
        avatarUrl: avatarUrl || "",
        departmentId: departmentId ? Number(departmentId) : undefined,
      });
      setUser(updated);
      Alert.alert("Thành công", "Hồ sơ của bạn đã được cập nhật.");
      router.replace("/(dashboard)/account");
    } catch (error) {
      Alert.alert("Lỗi", error instanceof Error ? error.message : "Cập nhật hồ sơ thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDeptName = useMemo(() => {
    return departments.find((d) => String(d.id) === departmentId)?.name || "Chọn khoa / phòng ban";
  }, [departmentId, departments]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Đang tải thông tin cá nhân...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AccountHeader
        title="Chỉnh sửa hồ sơ"
        subtitle="Cập nhật thông tin hiển thị của bạn"
        onBack={() => router.back()}
        avatarUrl={avatarUrl}
        firstName={user?.firstName}
        lastName={user?.lastName}
        email={user?.email}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Profile Avatar Card */}
        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarOutline}>
              <UserAvatar
                avatarUrl={avatarUrl}
                firstName={user?.firstName}
                lastName={user?.lastName}
                email={user?.email}
                size={70}
              />
              {isUploading && (
                <View style={styles.avatarLoadingOverlay}>
                  <ActivityIndicator size="small" color="#ffffff" />
                </View>
              )}
            </View>
            <View style={styles.avatarMeta}>
              <Text style={styles.avatarTitle}>Ảnh đại diện</Text>
              <Text style={styles.avatarDesc}>Hỗ trợ định dạng JPG, PNG, WEBP</Text>
            </View>
          </View>
          
          <View style={styles.avatarBtnRow}>
            <Pressable style={[styles.avatarButton, { flex: 1 }]} onPress={handlePickAvatar} disabled={isUploading}>
              <Ionicons name="image-outline" size={16} color="#4f46e5" />
              <Text style={styles.avatarButtonText}>{isUploading ? "Đang tải..." : "Chọn ảnh mới"}</Text>
            </Pressable>
            {Boolean(avatarUrl) && (
              <Pressable
                style={[styles.avatarButton, styles.deleteAvatarButton]}
                onPress={() => {
                  setAvatarUrl(null);
                  if (user) setUser({ ...user, avatarUrl: null });
                }}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={[styles.avatarButtonText, { color: "#ef4444" }]}>Xoá ảnh</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Institution Info Card (Read-Only) */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Đơn vị đào tạo</Text>
          <View style={styles.lockedField}>
            <View style={styles.lockedIconCircle}>
              <Ionicons name="school" size={16} color="#94a3b8" />
            </View>
            <View style={styles.lockedFieldText}>
              <Text style={styles.lockedLabel}>Trường học (Chỉ xem)</Text>
              <Text style={styles.lockedValue}>{schoolName}</Text>
            </View>
            <Ionicons name="lock-closed" size={14} color="#cbd5e1" />
          </View>
        </View>

        {/* Edit Form Fields */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Thông tin cơ bản</Text>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="person-outline" size={14} color="#64748b" />
              <Text style={styles.label}>Họ và tên</Text>
            </View>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              placeholder="Nhập họ và tên của bạn"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Department Selection */}
          {departments.length > 0 && (
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Ionicons name="business-outline" size={14} color="#64748b" />
                <Text style={styles.label}>Khoa / Phòng ban</Text>
              </View>
              <Pressable
                style={styles.selectTrigger}
                onPress={() => setActiveSelect("department")}
              >
                <Text style={styles.selectText} numberOfLines={1}>{selectedDeptName}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </Pressable>
            </View>
          )}

          {/* Phone */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="phone-portrait-outline" size={14} color="#64748b" />
              <Text style={styles.label}>Số điện thoại</Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
              placeholder="Nhập số điện thoại liên lạc"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />
          </View>

          {/* Bio / About */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="document-text-outline" size={14} color="#64748b" />
              <Text style={styles.label}>Lời giới thiệu (Bio)</Text>
            </View>
            <TextInput
              value={about}
              onChangeText={setAbout}
              style={[styles.input, styles.textArea]}
              placeholder="Viết một đoạn ngắn giới thiệu bản thân bạn..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Primary Action Button */}
          <Pressable style={styles.primaryButton} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
            ) : (
              <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            )}
            <Text style={styles.primaryText}>{isSaving ? "Đang lưu thay đổi..." : "Lưu hồ sơ"}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Select Modal */}
      {departments.length > 0 && (
        <SelectModal
          visible={activeSelect === "department"}
          onClose={() => setActiveSelect(null)}
          title="Chọn Khoa / Phòng ban"
          options={departmentOptions}
          selectedValue={departmentId}
          onSelect={(val) => {
            setDepartmentId(val);
            setActiveSelect(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    padding: 16,
    gap: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarOutline: {
    padding: 2,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    position: "relative",
  },
  avatarLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarMeta: {
    flex: 1,
    gap: 2,
  },
  avatarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  avatarDesc: {
    fontSize: 12,
    color: "#64748b",
  },
  avatarBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  avatarButton: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  avatarButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  deleteAvatarButton: {
    borderColor: "#fecaca",
    backgroundColor: "#fff5f5",
    paddingHorizontal: 12,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4f46e5",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  lockedField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    padding: 12,
    gap: 12,
  },
  lockedIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  lockedFieldText: {
    flex: 1,
    gap: 1,
  },
  lockedLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94a3b8",
  },
  lockedValue: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#64748b",
  },
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 2,
  },
  label: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingVertical: 12,
  },
  selectTrigger: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectText: {
    fontSize: 14,
    color: "#0f172a",
    flex: 1,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryText: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "700",
  },
});
