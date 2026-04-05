"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  type RegisterValidationInput,
  validateRegisterForm,
} from "@/modules/auth/validators";
import {
  getDepartmentsBySchoolId,
  registerAccount,
  type DepartmentOption,
} from "@/services/auth/auth.service";
import Input from "@/shared/components/ui/Input";

import {
  AuthCard,
  AuthFieldError,
  AuthHeader,
  AuthPageContainer,
  AuthStatusAlert,
  AuthSubmitButton,
} from "./components";

type RegisterFormState = RegisterValidationInput;
type ExtraFieldKey = "code" | "departmentId";

const DEFAULT_SCHOOL_ID = 1;

const INITIAL_FORM: RegisterFormState = {
  email: "",
  fullName: "",
  password: "",
  confirmPassword: "",
  birthday: "",
};

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

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterFormState>(INITIAL_FORM);
  const [code, setCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [departmentId, setDepartmentId] = useState("");

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(false);
  const [metaLoadError, setMetaLoadError] = useState<string | null>(null);

  const [touched, setTouched] = useState<Record<keyof RegisterFormState | "terms" | ExtraFieldKey, boolean>>({
    email: false,
    fullName: false,
    password: false,
    confirmPassword: false,
    birthday: false,
    terms: false,
    code: false,
    departmentId: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const errors = useMemo(() => validateRegisterForm(form, acceptedTerms), [acceptedTerms, form]);
  const extraErrors = useMemo<Partial<Record<ExtraFieldKey, string>>>(() => {
    const nextErrors: Partial<Record<ExtraFieldKey, string>> = {};

    if (!code.trim()) {
      nextErrors.code = "Vui lòng nhập mã sinh viên.";
    }

    if (!departmentId) {
      nextErrors.departmentId = "Vui lòng chọn khoa/phòng ban.";
    } else {
      const isValidDepartment = departments.some((department) => String(department.id) === departmentId);
      if (!isValidDepartment) {
        nextErrors.departmentId = "Khoa/phòng ban đã chọn không có trong danh sách.";
      }
    }

    return nextErrors;
  }, [code, departmentId, departments]);

  const isFormValid =
    Object.values(errors).every((value) => !value) &&
    Object.values(extraErrors).every((value) => !value);
  const maxBirthDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    let mounted = true;

    async function loadDepartments() {
      try {
        setIsDepartmentsLoading(true);
        setMetaLoadError(null);
        const data = await getDepartmentsBySchoolId(DEFAULT_SCHOOL_ID);

        if (!mounted) {
          return;
        }

        setDepartments(data);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setMetaLoadError(error instanceof Error ? error.message : "Không tải được danh sách khoa/phòng ban.");
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
  }, []);

  const handleChange =
    (field: keyof RegisterFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
      setSubmitError(null);
      setSubmitSuccess(null);
    };

  const handleBlur = (field: keyof RegisterFormState | "terms" | ExtraFieldKey) => () => {
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
      code: true,
      departmentId: true,
    });

    setSubmitError(null);
    setSubmitSuccess(null);

    if (!isFormValid) {
      return;
    }

    try {
      setIsSubmitting(true);

      const normalizedName = splitFullName(form.fullName);

      const responseMessage = await registerAccount({
        email: form.email.trim(),
        password: form.password,
        firstName: normalizedName.firstName,
        lastName: normalizedName.lastName,
        roleName: "ROLE_STUDENT",
        code: code.trim(),
        schoolId: DEFAULT_SCHOOL_ID,
        departmentId: Number(departmentId),
      });

      setSubmitSuccess(responseMessage || `Đăng ký thành công tài khoản sinh viên cho ${form.fullName.trim()}. Bạn có thể đăng nhập ngay.`);

      setForm(INITIAL_FORM);
      setCode("");
      setAcceptedTerms(false);
      setDepartmentId("");
      setTouched({
        email: false,
        fullName: false,
        password: false,
        confirmPassword: false,
        birthday: false,
        terms: false,
        code: false,
        departmentId: false,
      });
      setShowPassword(false);
    } catch (error) {
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Không thể đăng ký lúc này, vui lòng thử lại.");
      }
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
                label="Mã sinh viên"
                name="code"
                placeholder="VD: 20000001"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setSubmitError(null);
                  setSubmitSuccess(null);
                }}
                onBlur={handleBlur("code")}
              />
              <AuthFieldError message={touched.code ? extraErrors.code : undefined} />
            </div>

            <div className="space-y-1">
              <label className="flex w-full flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">Trường</span>
                <input
                  type="text"
                  value="Đại học Công nghiệp TP.HCM"
                  readOnly
                  disabled
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-600 shadow-sm"
                />
              </label>
            </div>

            <div className="space-y-1">
              <label className="flex w-full flex-col gap-1">
                <span className="text-xs font-medium text-slate-600">Khoa / Phòng ban</span>
                <select
                  value={departmentId}
                  onChange={(event) => {
                    setDepartmentId(event.target.value);
                    setSubmitError(null);
                    setSubmitSuccess(null);
                  }}
                  onBlur={handleBlur("departmentId")}
                  disabled={isDepartmentsLoading || isSubmitting || Boolean(metaLoadError)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100"
                >
                  <option value="">
                    {isDepartmentsLoading ? "Đang tải danh sách khoa..." : "Chọn khoa / phòng ban"}
                  </option>
                  {departments.map((department) => (
                    <option key={department.id} value={String(department.id)}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>

              <AuthFieldError message={touched.departmentId ? extraErrors.departmentId : undefined} />
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

          <AuthStatusAlert type="error" message={metaLoadError} />
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
