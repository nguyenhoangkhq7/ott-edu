import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { verifyOtp } from "../../auth/auth.service";
import { AccountHeader } from "../components";

export default function ChangePasswordVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ challengeId?: string; maskedEmail?: string }>();
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = async () => {
    if (!params.challengeId) {
      Alert.alert("Loi", "Khong tim thay challenge OTP.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await verifyOtp({
        challengeId: params.challengeId,
        otpCode,
        purpose: "CHANGE_PASSWORD",
      });

      router.push({
        pathname: "/(dashboard)/account/change-password/form",
        params: {
          verifiedToken: response.verifiedToken,
        },
      });
    } catch (error) {
      Alert.alert("Loi", error instanceof Error ? error.message : "Xac thuc OTP that bai.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AccountHeader title="Verify OTP" subtitle="Secure verification step" onBack={() => router.back()} />
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Ionicons name="key" size={24} color="#ffffff" />
        </View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the OTP sent to {params.maskedEmail || "your email"}.</Text>

        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          maxLength={6}
          value={otpCode}
          onChangeText={setOtpCode}
          placeholder="Enter 6 digits"
        />

        <Pressable style={styles.primaryButton} onPress={handleVerify} disabled={isSubmitting || otpCode.length < 6}>
          <Text style={styles.primaryText}>{isSubmitting ? "Verifying..." : "Verify"}</Text>
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
  input: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    letterSpacing: 4,
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
