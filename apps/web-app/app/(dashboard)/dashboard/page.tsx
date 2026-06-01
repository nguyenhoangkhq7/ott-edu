"use client";

import { useRouter } from "next/navigation";

import { useAuth } from "@/shared/providers/AuthProvider";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-slate-600">Xin chao {displayName}. Ban da dang nhap thanh cong.</p>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Thong tin tai khoan</h2>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>Email: {user?.email}</li>
          <li>Vai tro: {user?.roles?.join(", ") || "-"}</li>
          <li>Ma so: {user?.code || "-"}</li>
        </ul>
      </section>

      <div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Dang xuat
        </button>
      </div>
    </main>
  );
}
