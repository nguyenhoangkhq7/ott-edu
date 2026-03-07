import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../AuthProvider";
import { validateLoginForm } from "../validators";

type LoginFormState = {
  email: string;
  password: string;
};

const INITIAL_FORM: LoginFormState = {
  email: "",
  password: "",
};

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState<LoginFormState>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<keyof LoginFormState, boolean>>({
    email: false,
    password: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const errors = useMemo(() => validateLoginForm(form), [form]);
  const isFormValid = Object.values(errors).every((value) => !value);

  const handleChange = (field: keyof LoginFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleBlur = (field: keyof LoginFormState) => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const handleSubmit = async () => {
    setTouched({ email: true, password: true });
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!isFormValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email: form.email.trim(), password: form.password });
      setSubmitSuccess("Đăng nhập thành công, đang chuyển hướng...");
      router.replace("/(dashboard)");
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Không thể đăng nhập lúc này, vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.brand}>OTT Edu</Text>
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>Sử dụng tài khoản trường để truy cập hệ thống.</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={form.email}
            onChangeText={(value) => handleChange("email", value)}
            onBlur={() => handleBlur("email")}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="student@iuh.edu.vn"
            style={styles.input}
            editable={!isSubmitting}
          />
          {touched.email && errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            value={form.password}
            onChangeText={(value) => handleChange("password", value)}
            onBlur={() => handleBlur("password")}
            autoCapitalize="none"
            autoComplete="password"
            placeholder="Nhập mật khẩu"
            style={styles.input}
            secureTextEntry={!showPassword}
            editable={!isSubmitting}
          />
          <Pressable onPress={() => setShowPassword((current) => !current)}>
            <Text style={styles.secondaryAction}>{showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</Text>
          </Pressable>
          {touched.password && errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        {submitError ? <Text style={styles.errorAlert}>{submitError}</Text> : null}
        {submitSuccess ? <Text style={styles.successAlert}>{submitSuccess}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting || !isFormValid}
          style={[styles.submitButton, (isSubmitting || !isFormValid) && styles.submitButtonDisabled]}
        >
          <Text style={styles.submitButtonText}>{isSubmitting ? "Đang xử lý..." : "Đăng nhập"}</Text>
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Chưa có tài khoản?</Text>
          <Pressable onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.footerLink}>Tạo tài khoản mới</Text>
          </Pressable>
        </View>
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
    gap: 14,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 4,
  },
  brand: {
    textAlign: "center",
    color: "#6366f1",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    textAlign: "center",
    color: "#475569",
    fontSize: 14,
    marginTop: -4,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600",
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
  secondaryAction: {
    color: "#4f46e5",
    fontSize: 13,
    fontWeight: "600",
  },
  errorText: {
    color: "#e11d48",
    fontSize: 12,
  },
  errorAlert: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  successAlert: {
    color: "#166534",
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  submitButton: {
    height: 46,
    borderRadius: 10,
    backgroundColor: "#4f46e5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    marginTop: 4,
  },
  footerText: {
    color: "#64748b",
    fontSize: 13,
  },
  footerLink: {
    color: "#4f46e5",
    fontSize: 13,
    fontWeight: "700",
  },
});
