import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { sendChangePasswordOtp } from "../../auth/auth.service";
import { AccountHeader } from "../components";

export default function ChangePasswordMethodScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendOtp = async () => {
    try {
      setIsSubmitting(true);
      const challenge = await sendChangePasswordOtp();
      router.push({
        pathname: "/(dashboard)/account/change-password/verify",
        params: {
          challengeId: challenge.challengeId,
          maskedEmail: challenge.maskedEmail,
        },
      });
    } catch (error) {
      Alert.alert("Loi", error instanceof Error ? error.message : "Khong the gui OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AccountHeader title="Change Password" subtitle="Email verification required" onBack={() => router.back()} />
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Ionicons name="lock-closed" size={24} color="#ffffff" />
        </View>
        <Text style={styles.title}>Change Password</Text>
        <Text style={styles.subtitle}>Use email OTP verification to continue.</Text>

        <Pressable style={styles.primaryButton} onPress={handleSendOtp} disabled={isSubmitting}>
          <Text style={styles.primaryText}>{isSubmitting ? "Sending..." : "Send OTP Code"}</Text>
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
  subtitle: {
    color: "#475569",
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
