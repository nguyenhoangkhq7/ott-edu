"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getCurrentUser, type AuthUser } from "@/services/auth/auth.service";
import { Mail, Phone, User, Building, Shield, Info, Edit, Sparkles } from "lucide-react";
import { getInitialsFromDisplayName } from "@/shared/utils/user-display";

export default function ProfileOverviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const result = await getCurrentUser();
        if (mounted) {
          setUser(result);
        }
      } catch (err) {
        console.error("Lỗi khi tải thông tin người dùng:", err);
      } finally {
        if (mounted) {
          setLoading(false);
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
    return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  }, [user]);

  const initials = useMemo(() => {
    return getInitialsFromDisplayName(fullName);
  }, [fullName]);

  const roleLabel = useMemo(() => {
    const roles = user?.roles;
    if (!roles || roles.length === 0) return "Thành viên";
    if (roles.includes("ROLE_STUDENT") || roles.includes("student")) return "Học viên";
    if (roles.includes("ROLE_TEACHER") || roles.includes("teacher")) return "Giảng viên";
    const raw = roles[0] ?? "Thành viên";
    return raw.replace(/^ROLE_/, "").replace(/_/g, " ");
  }, [user?.roles]);

  const handleEditProfile = () => {
    router.push("/account/edit");
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Đang tải thông tin cá nhân...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Banner & Avatar Section */}
      <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-100">
        {/* Banner with a modern gradient and subtle glow */}
        <div className="relative h-48 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700">
          <div className="absolute inset-0 bg-grid-white/10 opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Profile Info Overlay Row */}
        <div className="relative px-6 pb-8 pt-0 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6 -mt-20 sm:-mt-16">
            {/* Avatar container */}
            <div className="relative h-32 w-32 shrink-0 rounded-2xl bg-white p-1.5 shadow-xl ring-4 ring-white/85">
              <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-100">
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={fullName}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#d1d2eb] text-4xl font-extrabold text-[#4b53bc]">
                    {initials}
                  </div>
                )}
              </div>
              {/* Online indicator badge */}
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-green-500">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
              </span>
            </div>

            {/* Name and main titles */}
            <div className="mt-4 flex-1 sm:mt-0">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between md:gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                    {fullName}
                    <Sparkles className="h-5 w-5 text-amber-500 animate-bounce" />
                  </h1>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping" />
                      Đang hoạt động
                    </span>
                    {user?.departmentName && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-xs">
                          {user.departmentName}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Edit profile action button */}
                <button
                  onClick={handleEditProfile}
                  className="mt-4 sm:mt-0 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/10 transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg active:scale-95 duration-150"
                >
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa hồ sơ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Profile Details Cards */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Left Side: Contact Information */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Mail className="h-5 w-5 text-blue-600" />
            Thông tin liên hệ
          </h2>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Địa chỉ Email</p>
                <a href={`mailto:${user?.email || ""}`} className="text-sm font-medium text-blue-600 hover:underline break-all">
                  {user?.email || "-"}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Phone className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Số điện thoại</p>
                <p className="text-sm font-semibold text-slate-800">
                  {user?.phone || <span className="font-normal text-slate-400 italic">Chưa cập nhật</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Account Details */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-5 w-5 text-indigo-600" />
            Thông tin tài khoản
          </h2>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Building className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Đơn vị / Khoa</p>
                <p className="text-sm font-semibold text-slate-800">
                  {user?.departmentName || <span className="font-normal text-slate-400 italic">Chưa cập nhật</span>}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Vai trò thành viên</p>
                <p className="text-sm font-semibold text-slate-800">
                  {roleLabel}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bio / About Section */}
      <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Info className="h-5 w-5 text-violet-600" />
          Giới thiệu bản thân
        </h2>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
            {user?.bio || "Không có tiểu sử nào được cung cấp. Hãy cập nhật tiểu sử để mọi người hiểu bạn hơn!"}
          </p>
        </div>
      </div>
    </div>
  );
}
