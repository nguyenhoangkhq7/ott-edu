"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { validateLoginForm } from "@/modules/auth/validators";
import Input from "@/shared/components/ui/Input";
import { useAuth } from "@/shared/providers/AuthProvider";
import Cookies from "js-cookie";
import { getCurrentUser } from "@/services/auth/auth.service";
import { Mail, LockKeyhole, Eye, EyeOff, Lock, QrCode } from "lucide-react";

import {
  AuthCard,
  AuthFieldError,
  AuthHeader,
  AuthPageContainer,
  AuthStatusAlert,
  AuthSubmitButton,
  QrLoginComponent,
} from "./components";



type LoginFormState = {
  email: string;
  password: string;
};

const INITIAL_FORM: LoginFormState = {
  email: "",
  password: "",
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginMethod, setLoginMethod] = useState<"password" | "qr">("password");
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

  const handleChange =
    (field: keyof LoginFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
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

      // 1. Chỉ gọi login để nó xử lý Token, không cần hứng kết quả (result) nữa
      await login({
        email: form.email.trim(),
        password: form.password
      });

      // 2. Chắc cú 100%: Tự gọi API lấy thông tin user mới nhất
      const latestUser = await getCurrentUser();
      const typedUser = latestUser as unknown as {
        email?: string;
        teams?: Array<{ id: string | number }>
      };
      // 3. Lấy danh sách Lớp từ latestUser
      const userTeams = typedUser?.teams || [];
      const userClassId = userTeams.length > 0 ? userTeams[0].id.toString() : "60d5ecb8b3112a445c742301";
      const userEmail = typedUser?.email || form.email.trim();

      // 4. CỰC KỲ QUAN TRỌNG: Xóa sạch cookie cũ đang bị kẹt
      Cookies.remove("classId");

      // 5. Lưu classId (Team ID) thật vào Cookie nếu user có tham gia lớp
      if (userClassId) {
        Cookies.set("classId", userClassId, { expires: 7 });
      }
      Cookies.set("userEmail", userEmail, { expires: 7 });

      setSubmitSuccess("Đăng nhập thành công, đang chuyển hướng...");
      setForm(INITIAL_FORM);
      setTouched({ email: false, password: false });

      // 6. Chuyển hướng theo vai trò
      const isAdmin = latestUser.roles?.some(
        (role) =>
          role === "ROLE_ADMIN" ||
          role === "ROLE_SUPER_ADMIN" ||
          role.includes("ADMIN")
      );

      if (isAdmin) {
        router.replace("/admin");
      } else {
        router.replace("/calendar");
      }

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

        {/* Sleek Ultra-Premium Capsule Tabs for switching login method */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl mb-8 border border-slate-200/50 backdrop-blur-sm shadow-inner gap-1">
          <button
            type="button"
            onClick={() => setLoginMethod("password")}
            className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${loginMethod === "password"
              ? "bg-white text-indigo-600 shadow-md border border-slate-100/50 scale-[1.01]"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
          >
            <Lock className="w-4 h-4 mr-2" />
            Mật khẩu
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod("qr")}
            className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${loginMethod === "qr"
              ? "bg-white text-indigo-600 shadow-md border border-slate-100/50 scale-[1.01]"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Mã QR
          </button>
        </div>

        {loginMethod === "password" ? (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-5">

              {/* Ultra-Premium Email Input */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Địa chỉ Email</span>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="student@iuh.edu.vn"
                    value={form.email}
                    onChange={handleChange("email")}
                    onBlur={handleBlur("email")}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all duration-200"
                  />
                </div>
                <AuthFieldError message={touched.email ? errors.email : undefined} />
              </div>

              {/* Ultra-Premium Password Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mật khẩu</span>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <LockKeyhole className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu của bạn"
                    value={form.password}
                    onChange={handleChange("password")}
                    onBlur={handleBlur("password")}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <AuthFieldError message={touched.password ? errors.password : undefined} />
              </div>

            </div>

            <AuthStatusAlert type="error" message={submitError} />
            <AuthStatusAlert type="success" message={submitSuccess} />

            <AuthSubmitButton isSubmitting={isSubmitting} disabled={!isFormValid} submitLabel="Đăng nhập" />
          </form>
        ) : (
          <QrLoginComponent />
        )}

        <div className="mt-8 text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
          >
            Tạo tài khoản mới
          </Link>
        </div>
      </AuthCard>
    </AuthPageContainer>
  );
}
