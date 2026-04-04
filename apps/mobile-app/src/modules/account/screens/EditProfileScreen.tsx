import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import UserAvatar from "../../../shared/components/UserAvatar";
import SelectModal, { type SelectOption } from "../../../shared/ui/SelectModal";
import {
  getCurrentUser,
  getDepartmentsBySchoolId,
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
        if (!mounted) {
          return;
        }

        setUser(nextUser);
        setFullName([nextUser.lastName, nextUser.firstName].filter(Boolean).join(" "));
        setAbout(nextUser.bio || "");
        setPhone(nextUser.phone || "");
        setAvatarUrl(nextUser.avatarUrl);
        setDepartmentId(nextUser.departmentId ? String(nextUser.departmentId) : "");

        if (nextUser.schoolId) {
          const data = await getDepartmentsBySchoolId(nextUser.schoolId);
          if (mounted) {
            setDepartments(data);
          }
        }
      } catch (error) {
        if (mounted) {
          Alert.alert("Loi", error instanceof Error ? error.message : "Khong the tai thong tin profile.");
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
      Alert.alert("Tu choi quyen", "Can cap quyen thu vien de chon anh dai dien.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

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
      Alert.alert("Loi", error instanceof Error ? error.message : "Tai anh that bai.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
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
      Alert.alert("Thanh cong", "Da cap nhat ho so.");
      router.replace("/(dashboard)/account");
    } catch (error) {
      Alert.alert("Loi", error instanceof Error ? error.message : "Cap nhat that bai.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AccountHeader
        title="Edit Profile"
        subtitle="Update your public information"
        onBack={() => router.back()}
        avatarUrl={avatarUrl}
        firstName={user?.firstName}
        lastName={user?.lastName}
        email={user?.email}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <View style={styles.avatarRow}>
            <UserAvatar
              avatarUrl={avatarUrl}
              firstName={user?.firstName}
              lastName={user?.lastName}
              email={user?.email}
              size={58}
            />
            <View style={styles.avatarMeta}>
              <Text style={styles.label}>Profile picture</Text>
              <Text style={styles.mutedText}>JPG, PNG, WEBP, GIF</Text>
            </View>
          </View>
          <Pressable style={styles.secondaryButton} onPress={handlePickAvatar} disabled={isUploading}>
            <Ionicons name="cloud-upload-outline" size={16} color="#334155" />
            <Text style={styles.secondaryText}>{isUploading ? "Dang tai..." : "Upload avatar"}</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput value={fullName} onChangeText={setFullName} style={styles.input} editable={!isLoading} />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput value={phone} onChangeText={setPhone} style={styles.input} editable={!isLoading} />

          <Text style={styles.label}>Department</Text>
          <Pressable style={styles.selectTrigger} onPress={() => setActiveSelect("department")}>
            <Text style={styles.selectText}>
              {departments.find((item) => String(item.id) === departmentId)?.name || "Select department"}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </Pressable>

          <Text style={styles.label}>About</Text>
          <TextInput
            value={about}
            onChangeText={setAbout}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={4}
            editable={!isLoading}
          />

          <Pressable style={styles.primaryButton} onPress={handleSave} disabled={isSaving || isLoading}>
            <Text style={styles.primaryText}>{isSaving ? "Saving..." : "Save Changes"}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <SelectModal
        visible={activeSelect === "department"}
        title="Select department"
        options={departmentOptions}
        selectedValue={departmentId}
        loading={false}
        emptyText="No departments found"
        onClose={() => setActiveSelect(null)}
        onSelect={(value) => setDepartmentId(value)}
      />
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
    gap: 14,
  },
  section: {
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#ffffff",
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarMeta: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600",
  },
  mutedText: {
    fontSize: 12,
    color: "#64748b",
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
    paddingVertical: 10,
  },
  selectTrigger: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectText: {
    color: "#0f172a",
    flex: 1,
  },
  chevron: {
    color: "#64748b",
    fontSize: 12,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    flexDirection: "row",
    gap: 8,
  },
  secondaryText: {
    color: "#0f172a",
    fontWeight: "600",
  },
});
