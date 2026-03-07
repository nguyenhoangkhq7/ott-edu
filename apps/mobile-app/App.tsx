import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  login,
  logout,
  restoreSession,
  type AuthUser,
} from "./src/modules/auth/auth.service";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const restoredUser = await restoreSession();
      if (mounted) {
        setUser(restoredUser);
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const displayName = useMemo(() => {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return fullName || user?.email || "";
  }, [user]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Thong bao", "Vui long nhap day du email va mat khau.");
      return;
    }

    try {
      setIsSubmitting(true);
      const authUser = await login({
        email: email.trim(),
        password,
      });
      setUser(authUser);
      setPassword("");
    } catch (error) {
      Alert.alert("Dang nhap that bai", error instanceof Error ? error.message : "Thu lai sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setPassword("");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>Dang khoi tao phien dang nhap...</Text>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  if (user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Ban da dang nhap</Text>
          <Text style={styles.subtitle}>Xin chao {displayName}</Text>
          <Text style={styles.userMeta}>Email: {user.email}</Text>
          <Text style={styles.userMeta}>Vai tro: {user.roles.join(", ") || "-"}</Text>

          <Pressable style={styles.primaryButton} onPress={handleLogout}>
            <Text style={styles.primaryButtonText}>Dang xuat</Text>
          </Pressable>
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Dang nhap OTT Education</Text>
        <Text style={styles.subtitle}>Su dung tai khoan truong de truy cap he thong.</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="student@iuh.edu.vn"
          placeholderTextColor="#64748b"
          style={styles.input}
          editable={!isSubmitting}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Mat khau"
          placeholderTextColor="#64748b"
          style={styles.input}
          editable={!isSubmitting}
        />

        <Pressable
          style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          <Text style={styles.primaryButtonText}>{isSubmitting ? "Dang xu ly..." : "Dang nhap"}</Text>
        </Pressable>
      </View>
      <StatusBar style="dark" />
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    color: "#334155",
    fontSize: 14,
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
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  primaryButton: {
    height: 46,
    borderRadius: 10,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
});
