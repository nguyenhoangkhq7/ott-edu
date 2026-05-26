import { useRouter } from "expo-router";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  type DepartmentOption,
  type RegisterPayload,
  type SchoolOption,
  getDepartmentsBySchoolId,
  getSchools,
  registerAccount,
  sendRegisterOtp,
  verifyOtp,
} from "../auth.service";
import { type RegisterValidationInput, validateRegisterForm } from "../validators";
import SelectModal, { type SelectOption } from "../../../shared/ui/SelectModal";

type ExtraFieldKey = "code" | "schoolId" | "departmentId" | "customSchool" | "customDepartment";

type RegisterFormState = RegisterValidationInput;

const INITIAL_FORM: RegisterFormState = {
  email: "",
  fullName: "",
  password: "",
  confirmPassword: "",
  birthday: "",
};

function formatDateToIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(value: string): string {
  if (!value) {
    return "Chọn ngày sinh";
  }

  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function parseIsoDate(value: string): Date {
  if (!value) {
    return new Date(2000, 0, 1);
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? new Date(2000, 0, 1) : parsedDate;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length <= 1) {
    return {
      firstName: parts[0] ?? "",
      lastName: "",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterFormState>(INITIAL_FORM);
  const [code, setCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP Verification Flow states
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpChallenge, setOtpChallenge] = useState<{ challengeId: string; maskedEmail: string } | null>(null);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(48);
  const [isVerifying, setIsVerifying] = useState(false);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  const [schoolId, setSchoolId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [customSchool, setCustomSchool] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [useCustomSchool, setUseCustomSchool] = useState(false);
  const [useCustomDepartment, setUseCustomDepartment] = useState(false);

  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isSchoolsLoading, setIsSchoolsLoading] = useState(false);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);

  const [touched, setTouched] = useState<Record<keyof RegisterFormState | "terms" | ExtraFieldKey, boolean>>({
    email: false,
    fullName: false,
    password: false,
    confirmPassword: false,
    birthday: false,
    terms: false,
    code: false,
    schoolId: false,
    departmentId: false,
    customSchool: false,
    customDepartment: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeSelect, setActiveSelect] = useState<"school" | "department" | null>(null);

  const errors = useMemo(() => validateRegisterForm(form, acceptedTerms), [acceptedTerms, form]);

  const extraErrors = useMemo<Partial<Record<ExtraFieldKey, string>>>(() => {
    const nextErrors: Partial<Record<ExtraFieldKey, string>> = {};

    if (!code.trim()) {
      nextErrors.code = "Vui lòng nhập mã sinh viên.";
    }

    if (useCustomSchool) {
      if (!customSchool.trim()) {
        nextErrors.customSchool = "Vui lòng nhập tên trường.";
      }
    } else if (!schoolId) {
      nextErrors.schoolId = "Vui lòng chọn trường.";
    }

    if (useCustomDepartment) {
      if (!customDepartment.trim()) {
        nextErrors.customDepartment = "Vui lòng nhập tên khoa/phòng ban.";
      }
    } else if (!departmentId) {
      nextErrors.departmentId = "Vui lòng chọn khoa/phòng ban.";
    }

    return nextErrors;
  }, [code, customDepartment, customSchool, departmentId, schoolId, useCustomDepartment, useCustomSchool]);

  const isFormValid =
    Object.values(errors).every((value) => !value) &&
    Object.values(extraErrors).every((value) => !value);

  const schoolOptions = useMemo<SelectOption[]>(
    () => schools.map((school) => ({ value: String(school.id), label: school.name })),
    [schools],
  );

  const departmentOptions = useMemo<SelectOption[]>(
    () => departments.map((department) => ({ value: String(department.id), label: department.name })),
    [departments],
  );

  const selectedSchoolLabel = useMemo(() => {
    if (!schoolId) {
      return "Chọn trường";
    }

    return schools.find((school) => String(school.id) === schoolId)?.name ?? "Chọn trường";
  }, [schoolId, schools]);

  const selectedDepartmentLabel = useMemo(() => {
    if (!departmentId) {
      return "Chọn khoa/phòng ban";
    }

    return departments.find((department) => String(department.id) === departmentId)?.name ?? "Chọn khoa/phòng ban";
  }, [departmentId, departments]);

  useEffect(() => {
    let mounted = true;

    async function loadSchools() {
      try {
        setIsSchoolsLoading(true);
        const data = await getSchools();
        if (mounted) {
          setSchools(data);
        }
      } catch (error) {
        if (mounted) {
          setSubmitError(error instanceof Error ? error.message : "Không tải được danh sách trường.");
        }
      } finally {
        if (mounted) {
          setIsSchoolsLoading(false);
        }
      }
    }

    void loadSchools();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadDepartments() {
      if (useCustomSchool || !schoolId) {
        setDepartments([]);
        setDepartmentId("");
        return;
      }

      try {
        setIsDepartmentsLoading(true);
        const data = await getDepartmentsBySchoolId(Number(schoolId));
        if (mounted) {
          setDepartments(data);
        }
      } catch (error) {
        if (mounted) {
          setSubmitError(error instanceof Error ? error.message : "Không tải được danh sách khoa/phòng ban.");
        }
      } finally {
        if (mounted) {
          setIsDepartmentsLoading(false);
        }
      }
    }

    void loadDepartments();

    return () => {
      mounted = false;
    };
  }, [schoolId, useCustomSchool]);

  // Resend timer countdown effect
  useEffect(() => {
    if (showOtpScreen && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showOtpScreen, timeLeft]);

  const handleChange = (field: keyof RegisterFormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleBlur = (field: keyof RegisterFormState | "terms" | ExtraFieldKey) => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  // Submit main form: sends register OTP and redirects to full screen OTP view
  const handleRegisterSubmit = async () => {
    setTouched({
      email: true,
      fullName: true,
      password: true,
      confirmPassword: true,
      birthday: true,
      terms: true,
      code: true,
      schoolId: true,
      departmentId: true,
      customSchool: true,
      customDepartment: true,
    });

    setSubmitError(null);
    setSubmitSuccess(null);

    if (!isFormValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      const challenge = await sendRegisterOtp({ email: form.email.trim() });
      setOtpChallenge(challenge);
      setTimeLeft(48);
      setOtpDigits(["", "", "", "", "", ""]);
      setShowOtpScreen(true);
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Không thể gửi mã xác minh lúc này, vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend registration OTP in verification screen
  const handleResendOtp = async () => {
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const challenge = await sendRegisterOtp({ email: form.email.trim() });
      setOtpChallenge(challenge);
      setTimeLeft(48);
      setOtpDigits(["", "", "", "", "", ""]);
      setSubmitSuccess("Gửi lại mã OTP thành công!");
      setTimeout(() => setSubmitSuccess(null), 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Gửi lại OTP thất bại.");
    }
  };

  // Handle single digit OTP typing
  const handleOtpDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = cleanValue.slice(-1);
    setOtpDigits(newDigits);

    if (cleanValue && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key press to focus previous digit
  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Verify registration OTP and finalize account creation immediately
  const handleVerifyAndRegister = async () => {
    if (!otpDigits.every((digit) => digit !== "")) {
      return;
    }

    setSubmitError(null);
    setSubmitSuccess(null);
    setIsVerifying(true);

    try {
      // 1. Verify code
      const result = await verifyOtp({
        challengeId: otpChallenge!.challengeId,
        otpCode: otpDigits.join(""),
        purpose: "REGISTER",
      });

      // 2. Register account immediately
      const normalizedName = splitFullName(form.fullName);
      const payload: RegisterPayload = {
        email: form.email.trim(),
        password: form.password,
        firstName: normalizedName.firstName,
        lastName: normalizedName.lastName,
        roleName: "ROLE_STUDENT",
        code: code.trim(),
        schoolId: useCustomSchool ? null : Number(schoolId),
        departmentId: useCustomDepartment ? null : Number(departmentId),
        customSchool: useCustomSchool ? customSchool.trim() : null,
        customDepartment: useCustomDepartment ? customDepartment.trim() : null,
        verifiedToken: result.verifiedToken,
      };

      const message = await registerAccount(payload);
      setSubmitSuccess(message || "Đăng ký thành công! Đang chuyển hướng...");
      
      setTimeout(() => {
        setShowOtpScreen(false);
        router.replace("/(auth)/login");
      }, 1500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Xác thực OTP thất bại.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== "ios") {
      setShowDatePicker(false);
    }

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    handleChange("birthday", formatDateToIso(selectedDate));
    handleBlur("birthday");
  };

  // -------------------------------------------------------------
  // Full screen OTP Verification View
  // -------------------------------------------------------------
  if (showOtpScreen) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Pressable 
              onPress={() => {
                setShowOtpScreen(false);
                setSubmitError(null);
                setSubmitSuccess(null);
              }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Quay lại chỉnh sửa</Text>
            </Pressable>

            <Text style={styles.title}>Xác thực tài khoản</Text>
            <Text style={styles.subtitle}>
              Để bảo mật, chúng tôi đã gửi một mã xác thực 6 số đến{" "}
              <Text style={{ fontWeight: "700", color: "#4f46e5" }}>
                {otpChallenge?.maskedEmail || form.email}
              </Text>
              . Vui lòng nhập mã để hoàn tất đăng ký.
            </Text>

            {submitError ? <Text style={styles.errorAlert}>{submitError}</Text> : null}
            {submitSuccess ? <Text style={styles.successAlert}>{submitSuccess}</Text> : null}

            <View style={styles.otpGrid}>
              {otpDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => { otpInputRefs.current[index] = el; }}
                  style={styles.otpInput}
                  keyboardType="numeric"
                  maxLength={1}
                  value={digit}
                  onChangeText={(value) => handleOtpDigitChange(index, value)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                />
              ))}
            </View>

            <Pressable
              onPress={handleVerifyAndRegister}
              disabled={isVerifying || !otpDigits.every((digit) => digit !== "")}
              style={[
                styles.submitButton, 
                (isVerifying || !otpDigits.every((digit) => digit !== "")) && styles.submitButtonDisabled
              ]}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Xác thực và hoàn tất</Text>
              )}
            </Pressable>

            <View style={styles.timerContainer}>
              <Text style={styles.timerTitle}>GỬI LẠI MÃ SAU</Text>
              <View style={styles.timerRow}>
                <View style={styles.timerCol}>
                  <Text style={styles.timerDigits}>
                    {Math.floor(timeLeft / 60).toString().padStart(2, "0")}
                  </Text>
                  <Text style={styles.timerLabel}>PHÚT</Text>
                </View>
                <Text style={styles.timerDivider}>:</Text>
                <View style={styles.timerCol}>
                  <Text style={styles.timerDigits}>
                    {(timeLeft % 60).toString().padStart(2, "0")}
                  </Text>
                  <Text style={styles.timerLabel}>GIÂY</Text>
                </View>
              </View>

              {timeLeft === 0 && (
                <Pressable onPress={handleResendOtp}>
                  <Text style={styles.resendLink}>Tôi chưa nhận được mã OTP</Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // Main Registration Form View
  // -------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.brand}>OTT Edu</Text>
          <Text style={styles.title}>Đăng ký tài khoản</Text>
          <Text style={styles.subtitle}>Tạo tài khoản mới để bắt đầu học tập trên hệ thống.</Text>

          <Field
            label="Họ và tên"
            value={form.fullName}
            onChangeText={(value) => handleChange("fullName", value)}
            onBlur={() => handleBlur("fullName")}
            error={touched.fullName ? errors.fullName : undefined}
            editable={!isSubmitting}
          />

          <Field
            label="Email"
            value={form.email}
            onChangeText={(value) => handleChange("email", value)}
            onBlur={() => handleBlur("email")}
            error={touched.email ? errors.email : undefined}
            editable={!isSubmitting}
            keyboardType="email-address"
          />

          <Field
            label="Mã sinh viên"
            value={code}
            onChangeText={(value) => {
              setCode(value);
              setSubmitError(null);
              setSubmitSuccess(null);
            }}
            onBlur={() => handleBlur("code")}
            error={touched.code ? extraErrors.code : undefined}
            editable={!isSubmitting}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Trường</Text>
            <Pressable
              onPress={() => {
                setUseCustomSchool((current) => !current);
                setSchoolId("");
                setDepartmentId("");
                setDepartments([]);
                handleBlur("schoolId");
              }}
            >
              <Text style={styles.inlineAction}>
                {useCustomSchool ? "Đang dùng tên trường tự nhập" : "Trường của tôi chưa có trong danh sách"}
              </Text>
            </Pressable>

            {useCustomSchool ? (
              <Field
                label="Tên trường"
                value={customSchool}
                onChangeText={(value) => setCustomSchool(value)}
                onBlur={() => handleBlur("customSchool")}
                error={touched.customSchool ? extraErrors.customSchool : undefined}
                editable={!isSubmitting}
              />
            ) : (
              <View style={styles.selectGroup}>
                <Pressable
                  disabled={isSubmitting || isSchoolsLoading}
                  style={[styles.selectTrigger, (isSubmitting || isSchoolsLoading) && styles.selectTriggerDisabled]}
                  onPress={() => {
                    handleBlur("schoolId");
                    setActiveSelect("school");
                  }}
                >
                  <Text style={[styles.selectTriggerText, !schoolId && styles.selectPlaceholder]}>{selectedSchoolLabel}</Text>
                  <Text style={styles.selectChevron}>▼</Text>
                </Pressable>

                {isSchoolsLoading ? <Text style={styles.selectHint}>Đang tải danh sách trường...</Text> : null}
                {touched.schoolId && extraErrors.schoolId ? <Text style={styles.errorText}>{extraErrors.schoolId}</Text> : null}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Khoa / Phòng ban</Text>
            <Pressable
              onPress={() => {
                setUseCustomDepartment((current) => !current);
                setDepartmentId("");
                handleBlur("departmentId");
              }}
            >
              <Text style={styles.inlineAction}>
                {useCustomDepartment ? "Đang dùng tên khoa tự nhập" : "Khoa/phòng ban của tôi chưa có trong danh sách"}
              </Text>
            </Pressable>

            {useCustomDepartment ? (
              <Field
                label="Tên khoa / phòng ban"
                value={customDepartment}
                onChangeText={(value) => setCustomDepartment(value)}
                onBlur={() => handleBlur("customDepartment")}
                error={touched.customDepartment ? extraErrors.customDepartment : undefined}
                editable={!isSubmitting}
              />
            ) : (
              <View style={styles.selectGroup}>
                <Pressable
                  disabled={isSubmitting || isDepartmentsLoading || !schoolId}
                  style={[
                    styles.selectTrigger,
                    (isSubmitting || isDepartmentsLoading || !schoolId) && styles.selectTriggerDisabled,
                  ]}
                  onPress={() => {
                    handleBlur("departmentId");
                    setActiveSelect("department");
                  }}
                >
                  <Text style={[styles.selectTriggerText, !departmentId && styles.selectPlaceholder]}>
                    {selectedDepartmentLabel}
                  </Text>
                  <Text style={styles.selectChevron}>▼</Text>
                </Pressable>

                {!schoolId ? <Text style={styles.selectHint}>Vui lòng chọn trường trước.</Text> : null}
                {isDepartmentsLoading ? <Text style={styles.selectHint}>Đang tải danh sách khoa/phòng ban...</Text> : null}
                {touched.departmentId && extraErrors.departmentId ? (
                  <Text style={styles.errorText}>{extraErrors.departmentId}</Text>
                ) : null}
              </View>
            )}
          </View>

          <SelectModal
            visible={activeSelect === "school"}
            title="Chọn trường"
            options={schoolOptions}
            selectedValue={schoolId}
            loading={isSchoolsLoading}
            emptyText="Không có dữ liệu trường."
            onClose={() => setActiveSelect(null)}
            onSelect={(value) => {
              setSchoolId(value);
              setDepartmentId("");
              setUseCustomDepartment(false);
              setCustomDepartment("");
              handleBlur("schoolId");
            }}
          />

          <SelectModal
            visible={activeSelect === "department"}
            title="Chọn khoa/phòng ban"
            options={departmentOptions}
            selectedValue={departmentId}
            loading={isDepartmentsLoading}
            emptyText="Không có dữ liệu khoa/phòng ban."
            onClose={() => setActiveSelect(null)}
            onSelect={(value) => {
              setDepartmentId(value);
              handleBlur("departmentId");
            }}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Ngày sinh</Text>
            <Pressable
              disabled={isSubmitting}
              onPress={() => {
                setShowDatePicker(true);
                handleBlur("birthday");
              }}
              style={styles.dateButton}
            >
              <Text style={[styles.dateButtonText, !form.birthday && styles.dateButtonPlaceholder]}>
                {formatDateForDisplay(form.birthday)}
              </Text>
            </Pressable>
            {touched.birthday && errors.birthday ? <Text style={styles.errorText}>{errors.birthday}</Text> : null}
          </View>

          {showDatePicker ? (
            <DateTimePicker
              mode="date"
              value={parseIsoDate(form.birthday)}
              maximumDate={new Date()}
              onChange={handleDateChange}
            />
          ) : null}

          <Field
            label="Mật khẩu"
            value={form.password}
            onChangeText={(value) => handleChange("password", value)}
            onBlur={() => handleBlur("password")}
            error={touched.password ? errors.password : undefined}
            editable={!isSubmitting}
            secureTextEntry={!showPassword}
          />

          <Field
            label="Xác nhận mật khẩu"
            value={form.confirmPassword}
            onChangeText={(value) => handleChange("confirmPassword", value)}
            onBlur={() => handleBlur("confirmPassword")}
            error={touched.confirmPassword ? errors.confirmPassword : undefined}
            editable={!isSubmitting}
            secureTextEntry={!showPassword}
          />

          <Pressable onPress={() => setShowPassword((current) => !current)}>
            <Text style={styles.inlineAction}>{showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</Text>
          </Pressable>

          <Pressable
            style={styles.termsRow}
            onPress={() => {
              setAcceptedTerms((current) => !current);
              handleBlur("terms");
            }}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]} />
            <Text style={styles.termsText}>Tôi đồng ý điều khoản sử dụng và chính sách bảo mật của OTT Edu.</Text>
          </Pressable>
          {touched.terms && errors.terms ? <Text style={styles.errorText}>{errors.terms}</Text> : null}

          {submitError ? <Text style={styles.errorAlert}>{submitError}</Text> : null}
          {submitSuccess ? <Text style={styles.successAlert}>{submitSuccess}</Text> : null}

          <Pressable
            onPress={handleRegisterSubmit}
            disabled={isSubmitting || !isFormValid}
            style={[styles.submitButton, (isSubmitting || !isFormValid) && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>{isSubmitting ? "Đang gửi OTP..." : "Tạo tài khoản"}</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Đã có tài khoản?</Text>
            <Pressable onPress={() => router.replace("/(auth)/login")}>
              <Text style={styles.footerLink}>Đăng nhập ngay</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  error?: string;
  editable?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
};

function Field({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  editable,
  secureTextEntry,
  keyboardType = "default",
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        style={styles.input}
        editable={editable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  card: {
    borderRadius: 16,
    backgroundColor: "#ffffff",
    padding: 16,
    gap: 12,
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
    lineHeight: 20,
  },
  backButton: {
    marginBottom: 8,
    paddingVertical: 6,
  },
  backButtonText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "600",
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
  selectGroup: {
    gap: 6,
  },
  selectTrigger: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectTriggerDisabled: {
    backgroundColor: "#f8fafc",
  },
  selectTriggerText: {
    flex: 1,
    color: "#0f172a",
    fontSize: 14,
    paddingRight: 10,
  },
  selectPlaceholder: {
    color: "#94a3b8",
  },
  selectChevron: {
    color: "#64748b",
    fontSize: 12,
  },
  selectHint: {
    color: "#64748b",
    fontSize: 12,
  },
  dateButton: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  dateButtonText: {
    color: "#0f172a",
    fontSize: 14,
  },
  dateButtonPlaceholder: {
    color: "#94a3b8",
  },
  inlineAction: {
    color: "#4f46e5",
    fontSize: 13,
    fontWeight: "600",
  },
  termsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#94a3b8",
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: "#4f46e5",
    backgroundColor: "#4f46e5",
  },
  termsText: {
    flex: 1,
    color: "#475569",
    fontSize: 13,
    lineHeight: 18,
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
    marginTop: 2,
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
  // OTP Verification Styles
  otpGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginVertical: 18,
  },
  otpInput: {
    width: 44,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  timerContainer: {
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  timerTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timerCol: {
    alignItems: "center",
  },
  timerDigits: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4f46e5",
  },
  timerLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#94a3b8",
  },
  timerDivider: {
    fontSize: 22,
    fontWeight: "700",
    color: "#cbd5e1",
  },
  resendLink: {
    color: "#4f46e5",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
});
