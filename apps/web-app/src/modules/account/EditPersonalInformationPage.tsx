"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getCurrentUser,
  getDepartmentsBySchoolId,
  updateCurrentUser,
  uploadAvatar,
  type DepartmentOption,
} from "@/services/auth/auth.service";
import { useAuth } from "@/shared/providers/AuthProvider";
import { User, Camera, Sparkles } from "lucide-react";

export default function EditPersonalInformationPage() {
  const router = useRouter();
  const { user: authUser, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [formData, setFormData] = useState({
    fullName: "",
    departmentId: "",
    about: "",
    phone: "",
  });

  const [avatarUrl, setAvatarUrl] = useState("/assets/avatar-placeholder.png");

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const user = await getCurrentUser();
        const fullName = [user.lastName, user.firstName].filter(Boolean).join(" ");

        if (mounted) {
          setUser(user);
          setFormData({
            fullName,
            departmentId: user.departmentId ? String(user.departmentId) : "",
            about: user.bio || "",
            phone: user.phone || "",
          });
          setAvatarUrl(user.avatarUrl || "/assets/avatar-placeholder.png");
        }

        if (user.schoolId) {
          const departmentOptions = await getDepartmentsBySchoolId(user.schoolId);
          if (mounted) {
            setDepartments(departmentOptions);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Không thể tải dữ liệu hồ sơ.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [setUser]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUploadNew = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setAvatarUrl("/assets/avatar-placeholder.png");
    if (authUser) {
      setUser({ ...authUser, avatarUrl: null });
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const response = await uploadAvatar(selectedFile);
      setAvatarUrl(response.avatarUrl);
      if (authUser) {
        setUser({ ...authUser, avatarUrl: response.avatarUrl });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải ảnh đại diện thất bại.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleCancel = () => {
    router.push("/account");
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const updatedUser = await updateCurrentUser({
        fullName: formData.fullName,
        about: formData.about,
        phone: formData.phone,
        avatarUrl: avatarUrl === "/assets/avatar-placeholder.png" ? "" : avatarUrl,
        departmentId: formData.departmentId ? Number(formData.departmentId) : undefined,
      });

      setUser(updatedUser);
      router.replace("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cập nhật hồ sơ thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Title section */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          Chỉnh sửa thông tin cá nhân
          <Sparkles className="h-6 w-6 text-blue-600 animate-pulse" />
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Cập nhật chi tiết hồ sơ cá nhân và kiểm soát cách người khác nhìn thấy bạn trong hệ thống.
        </p>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* Profile Picture Card */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-900 flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" />
            Ảnh đại diện
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-50 ring-4 ring-slate-100 group">
              <Image
                src={avatarUrl}
                alt="Profile picture"
                fill
                className="object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs font-semibold">
                  Đang tải...
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-sm font-semibold text-slate-800">Cập nhật ảnh đại diện của bạn</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Hỗ trợ JPG, PNG hoặc WEBP. Dung lượng tối đa 2MB.</p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
              
              <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                <button
                  onClick={handleUploadNew}
                  disabled={isUploading}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-blue-500/10 transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  Tải ảnh mới
                </button>
                <button
                  onClick={handleRemove}
                  className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-bold transition-all duration-150 active:scale-95"
                >
                  Gỡ bỏ
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Details Form */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-5 w-5 text-indigo-600" />
            Chi tiết hồ sơ cá nhân
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="fullName" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Họ và Tên
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Số điện thoại
              </label>
              <input
                id="phone"
                type="text"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Nhập số điện thoại"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="department" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Đơn vị / Khoa chuyên ngành
            </label>
            <select
              id="department"
              value={formData.departmentId}
              onChange={(e) => handleInputChange("departmentId", e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10"
            >
              <option value="">Chọn đơn vị / Khoa</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="about" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Giới thiệu bản thân
            </label>
            <textarea
              id="about"
              value={formData.about}
              onChange={(e) => handleInputChange("about", e.target.value)}
              rows={4}
              placeholder="Viết một đoạn ngắn giới thiệu về bạn..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-colors focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none"
            />
          </div>
        </section>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleCancel}
            className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-6 py-3 text-sm font-semibold transition-all duration-150 active:scale-95"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-semibold shadow-md shadow-blue-500/10 transition-all duration-150 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
