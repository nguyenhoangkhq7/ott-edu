"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { validateLoginForm } from "@/modules/auth/validators";
import { mockLogin } from "@/services/auth.service";
import Input from "@/shared/components/ui/Input";
import {
  AuthCard,
  AuthFieldError,
  AuthHeader,
  AuthPageContainer,
  AuthStatusAlert,
  AuthSubmitButton,
} from "../component";

type LoginFormState = {
  email: string;
  password: string;
};

const INITIAL_FORM: LoginFormState = {
  email: "",
  password: "",
};

export default function LoginPage() {
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

  const handleChange = (field: keyof LoginFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleBlur = (field: keyof LoginFormState) => () => {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({ email: true, password: true });
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!isFormValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await mockLogin(form);
      setSubmitSuccess(`Xin chào ${response.user.name}, đăng nhập thành công.`);
      setForm(INITIAL_FORM);
      setTouched({ email: false, password: false });
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
    <AuthPageContainer>
      <AuthCard>
        <AuthHeader title="Đăng nhập" description="Sử dụng tài khoản trường để truy cập hệ thống." />

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-4">
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
                label="Mật khẩu"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={handleChange("password")}
                onBlur={handleBlur("password")}
              />

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showPassword"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    disabled={isSubmitting}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                  />
                  <label
                    htmlFor="showPassword"
                    className="select-none cursor-pointer text-sm font-medium text-slate-600 transition hover:text-indigo-600"
                  >
                    Hiện mật khẩu
                  </label>
                </div>

                <button
                  type="button"
                  className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700 hover:underline"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <AuthFieldError message={touched.password ? errors.password : undefined} />
            </div>
          </div>

          <AuthStatusAlert type="error" message={submitError} />
          <AuthStatusAlert type="success" message={submitSuccess} />

          <AuthSubmitButton isSubmitting={isSubmitting} disabled={!isFormValid} submitLabel="Đăng nhập" />
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
          >
            Tạo tài khoản mới
          </Link>
        </div>

        <p className="mt-8 text-center text-xs font-medium text-slate-400">
          Demo: admin@ott.edu.vn / 12345678
        </p>
      </AuthCard>
    </AuthPageContainer>
  );
}