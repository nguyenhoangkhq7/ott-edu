import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { changePassword } from "../../auth/auth.service";
import { AccountHeader } from "../components";

export default function ChangePasswordFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ verifiedToken?: string }>();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!params.verifiedToken) {
      Alert.alert("Loi", "Khong tim thay phien xac thuc OTP hop le.");
      return;
    }

    try {
      setIsSubmitting(true);
      await changePassword({
        verifiedToken: params.verifiedToken,
        currentPassword,
        newPassword,
        confirmPassword,
      });
      Alert.alert("Thanh cong", "Doi mat khau thanh cong.", [
        {
          text: "OK",
          onPress: () => router.replace("/(dashboard)/account"),
        },
      ]);
    } catch (error) {
      Alert.alert("Loi", error instanceof Error ? error.message : "Doi mat khau that bai.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AccountHeader title="Set New Password" subtitle="Keep your account secure" onBack={() => router.back()} />
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Ionicons name="shield-checkmark" size={24} color="#ffffff" />
        </View>
        <Text style={styles.title}>Set New Password</Text>

        <TextInput
          style={styles.input}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current password"
        />
        <TextInput
          style={styles.input}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
        />
        <TextInput
          style={styles.input}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm new password"
        />

        <Pressable
          style={styles.primaryButton}
          onPress={handleSubmit}
          disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
        >
          <Text style={styles.primaryText}>{isSubmitting ? "Updating..." : "Confirm"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  card: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#ffffff",
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
