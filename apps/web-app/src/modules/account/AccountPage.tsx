"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getCurrentUser, type AuthUser } from "@/services/auth/auth.service";
import { User, Mail, Phone, Lock, Sparkles, Edit3 } from "lucide-react";
import Toggle from "@/shared/components/ui/Toggle";

export default function AccountPage() {
  const router = useRouter();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const result = await getCurrentUser();
        if (mounted) {
          setUser(result);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  const fullName = useMemo(() => {
    if (!user) {
      return "Đang tải...";
    }
    return [user.lastName, user.firstName].filter(Boolean).join(" ") || user.email;
  }, [user]);

  const handleEditProfile = () => {
    router.push("/account/edit");
  };

  const handleUpdatePassword = () => {
    router.push("/account/change-password");
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Đang tải thiết lập tài khoản...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Title block */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          Quản lý tài khoản
          <Sparkles className="h-6 w-6 text-indigo-600 animate-pulse" />
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Cấu hình thông tin đăng nhập, bảo mật và thông tin liên lạc của bạn.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card Section */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-4 ring-slate-50">
              <Image
                src={user?.avatarUrl || "/assets/avatar-placeholder.png"}
                alt={fullName}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Họ và Tên</p>
              <h2 className="text-xl font-bold text-slate-950 mt-0.5">{fullName}</h2>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                {user?.role === "student" ? "Học viên" : user?.role === "teacher" ? "Giảng viên" : user?.role || "Thành viên"}
              </p>
            </div>
          </div>

          <button
            onClick={handleEditProfile}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-95"
          >
            <Edit3 className="h-4 w-4 text-slate-500" />
            Sửa thông tin
          </button>
        </div>

        {/* Details Grid (Contact and Security) */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Contact details */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Mail className="h-5 w-5 text-blue-600" />
              Thông tin liên lạc
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Địa chỉ Email</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5 truncate pr-2">{user?.email || "-"}</p>
                </div>
                <button
                  onClick={handleEditProfile}
                  className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Thay đổi
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Số điện thoại</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">
                    {user?.phone || <span className="font-normal text-slate-400 italic">Chưa cập nhật</span>}
                  </p>
                </div>
                <button
                  onClick={handleEditProfile}
                  className="shrink-0 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>

          {/* Security & Privacy details */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-slate-950 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock className="h-5 w-5 text-indigo-600" />
              Bảo mật & Quyền riêng tư
            </h2>

            <div className="space-y-4">
              {/* 2FA Section */}
              <div className="flex items-start justify-between py-2 border-b border-slate-50">
                <div className="pr-4">
                  <h3 className="text-sm font-semibold text-slate-800">Xác thực 2 yếu tố (2FA)</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tăng cường bảo mật bằng mã xác minh khi đăng nhập.
                  </p>
                </div>
                <Toggle
                  enabled={twoFactorEnabled}
                  onChange={setTwoFactorEnabled}
                  ariaLabel="Bật/Tắt xác thực 2 yếu tố"
                />
              </div>

              {/* Password Section */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Mật khẩu tài khoản</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Thay đổi định kỳ để tăng cường bảo vệ.
                  </p>
                </div>
                <button
                  onClick={handleUpdatePassword}
                  className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 px-4 py-2 text-xs font-semibold transition-all duration-150 active:scale-95"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
