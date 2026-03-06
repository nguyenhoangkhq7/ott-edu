"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  type RegisterValidationInput,
  validateRegisterForm,
} from "@/modules/auth/validators";
import Input from "@/shared/components/ui/Input";
import {
  AuthCard,
  AuthFieldError,
  AuthHeader,
  AuthPageContainer,
  AuthStatusAlert,
  AuthSubmitButton,
} from "../component";

type RegisterFormState = RegisterValidationInput;

const INITIAL_FORM: RegisterFormState = {
  email: "",
  fullName: "",
  password: "",
  confirmPassword: "",
  birthday: "",
};

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterFormState>(INITIAL_FORM);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"student" | "teacher">("student");

  const [touched, setTouched] = useState<Record<keyof RegisterFormState | "terms", boolean>>({
    email: false,
    fullName: false,
    password: false,
    confirmPassword: false,
    birthday: false,
    terms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const errors = useMemo(() => validateRegisterForm(form, acceptedTerms), [form, acceptedTerms]);
  const isFormValid = Object.values(errors).every((value) => !value);
  const maxBirthDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const handleChange =
    (field: keyof RegisterFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
      setSubmitError(null);
      setSubmitSuccess(null);
    };

  const handleBlur = (field: keyof RegisterFormState | "terms") => () => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({
      email: true,
      fullName: true,
      password: true,
      confirmPassword: true,
      birthday: true,
      terms: true,
    });

    setSubmitError(null);
    setSubmitSuccess(null);

    if (!isFormValid) {
      return;
    }

    const submitPayload = {
      ...form,
      role: role,
    };

    try {
      setIsSubmitting(true);

      await new Promise((resolve) => {
        setTimeout(resolve, 900);
      });

      const roleText = role === "student" ? "Sinh viên" : "Giảng viên";
      setSubmitSuccess(`Đăng ký thành công tài khoản ${roleText} cho ${form.fullName.trim()}. Bạn có thể đăng nhập ngay.`);
      
      setForm(INITIAL_FORM);
      setAcceptedTerms(false);
      setRole("student");
      setTouched({
        email: false,
        fullName: false,
        password: false,
        confirmPassword: false,
        birthday: false,
        terms: false,
      });
      setShowPassword(false);
    } catch {
      setSubmitError("Không thể đăng ký lúc này, vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageContainer>
      <AuthCard>
        <AuthHeader
          title="Đăng ký tài khoản"
          description="Tạo tài khoản mới để bắt đầu học tập trên hệ thống."
        />

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 pb-2">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-all ${
                  role === "student"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <svg className="mb-2 h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
                <span className="text-sm font-semibold">Sinh viên</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-all ${
                  role === "teacher"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <svg className="mb-2 h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span className="text-sm font-semibold">Giáo viên</span>
              </button>
            </div>

            <div className="space-y-1">
              <Input
                label="Họ và tên"
                name="fullName"
                autoComplete="name"
                placeholder="VD: Nguyễn Văn A"
                value={form.fullName}
                onChange={handleChange("fullName")}
                onBlur={handleBlur("fullName")}
              />
              <AuthFieldError message={touched.fullName ? errors.fullName : undefined} />
            </div>

            <div className="space-y-1">
              <Input
                label="Email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="student@iuh.edu.vn"
                value={form.email}
                onChange={handleChange("email")}
                onBlur={handleBlur("email")}
              />
              <AuthFieldError message={touched.email ? errors.email : undefined} />
            </div>

            <div className="space-y-1">
              <Input
                label="Ngày sinh"
                type="date"
                name="birthday"
                max={maxBirthDate}
                value={form.birthday}
                onChange={handleChange("birthday")}
                onBlur={handleBlur("birthday")}
              />
              <AuthFieldError message={touched.birthday ? errors.birthday : undefined} />
            </div>

            <div className="space-y-1">
              <Input
                label="Mật khẩu"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={handleChange("password")}
                onBlur={handleBlur("password")}
              />
              <AuthFieldError message={touched.password ? errors.password : undefined} />
            </div>

            <div className="space-y-1">
              <Input
                label="Xác nhận mật khẩu"
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                onBlur={handleBlur("confirmPassword")}
              />
              
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showPassword"
                    checked={showPassword}
                    onChange={(event) => setShowPassword(event.target.checked)}
                    disabled={isSubmitting}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <label 
                    htmlFor="showPassword"
                    className="select-none cursor-pointer text-sm font-medium text-slate-600 transition hover:text-indigo-600"
                  >
                    Hiển thị mật khẩu
                  </label>
                </div>
              </div>

              <AuthFieldError message={touched.confirmPassword ? errors.confirmPassword : undefined} />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => {
                    setAcceptedTerms(event.target.checked);
                    setSubmitError(null);
                    setSubmitSuccess(null);
                  }}
                  onBlur={handleBlur("terms")}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-indigo-600 transition focus:ring-2 focus:ring-indigo-500"
                />
                <span className="leading-snug">
                  Tôi đồng ý với{" "}
                  <Link href="/terms" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                    điều khoản sử dụng
                  </Link>{" "}
                  và chính sách bảo mật của OTT Edu.
                </span>
              </label>
              <AuthFieldError message={touched.terms ? errors.terms : undefined} />
            </div>
          </div>

          <AuthStatusAlert type="error" message={submitError} />
          <AuthStatusAlert type="success" message={submitSuccess} />

          <AuthSubmitButton isSubmitting={isSubmitting} disabled={!isFormValid} submitLabel="Tạo tài khoản" />
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </AuthCard>
    </AuthPageContainer>
  );
}