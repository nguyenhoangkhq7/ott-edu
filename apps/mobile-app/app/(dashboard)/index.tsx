import { useMemo } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../../src/modules/auth/AuthProvider";

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  const displayName = useMemo(() => {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return fullName || user?.email || "";
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Ban da dang nhap</Text>
        <Text style={styles.subtitle}>Xin chao {displayName}</Text>
        <Text style={styles.userMeta}>Email: {user?.email ?? "-"}</Text>
        <Text style={styles.userMeta}>Vai tro: {user?.roles.join(", ") || "-"}</Text>

        <Pressable style={styles.primaryButton} onPress={() => void logout()}>
          <Text style={styles.primaryButtonText}>Dang xuat</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 20,
    gap: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 14,
    color: "#475569",
  },
  userMeta: {
    fontSize: 14,
    color: "#334155",
  },
  primaryButton: {
    height: 46,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
