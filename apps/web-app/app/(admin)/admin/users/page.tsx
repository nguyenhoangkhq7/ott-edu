"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import UserFilterBar from "@/modules/admin/components/UserFilterBar";
import UserTable from "@/modules/admin/components/UserTable";
import AddUserModal from "@/modules/admin/components/AddUserModal";
import EditUserModal from "@/modules/admin/components/EditUserModal";
import DeleteConfirmModal from "@/modules/admin/components/DeleteConfirmModal";
import ResetPasswordModal from "@/modules/admin/components/ResetPasswordModal";
import {
  getUsers,
  createUser,
  deleteUser,
  lockUser,
  unlockUser,
  resetUserPassword,
  getUserSummary,
  getAllDepartments,
  updateUser,
} from "@/services/api/admin.service";
import type { AdminUser, PaginatedResponse, Department } from "@/shared/types/admin";
import { ROLE_OPTIONS, STATUS_OPTIONS } from "@/modules/admin/constants";

export default function AdminUserManagementPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Summary Metrics
  const [summary, setSummary] = useState<{
    totalAccounts: number;
    activeNow: number;
    lockedAccounts: number;
  } | null>(null);

  // Users Table Dataset
  const [usersResponse, setUsersResponse] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Modal Triggers
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);

  const shouldOpenAddModal = searchParams.get("add") === "true";

  // Detect ?add=true on initial load
  useEffect(() => {
    if (!shouldOpenAddModal) return;

    queueMicrotask(() => {
      setShowAddModal(true);
      router.replace("/admin/users");
    });
  }, [shouldOpenAddModal, router]);

  // Load summary metrics once
  useEffect(() => {
    async function loadSummary() {
      try {
        const sumData = await getUserSummary();
        setSummary(sumData);
      } catch (err) {
        console.error("Failed to load user summary stats:", err);
      }
    }
    loadSummary();
  }, []);

  // Load departments once
  useEffect(() => {
    async function loadDepartments() {
      try {
        const depts = await getAllDepartments();
        setDepartments(depts);
      } catch (err) {
        console.error("Failed to load departments:", err);
      }
    }
    loadDepartments();
  }, []);

  // Fetch paginated user table data
  const fetchUserData = useCallback(async () => {
    try {
      const data = await getUsers({
        search,
        role,
        status,
        page,
        size,
      });
      setUsersResponse(data);
    } catch (err) {
      console.error("Failed to load user list:", err);
    } finally {
      setLoading(false);
    }
  }, [search, role, status, page, size]);

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true);
      void fetchUserData();
    });
  }, [fetchUserData]);

  // Handle Create Account
  const handleCreateUser = async (payload: Parameters<typeof createUser>[0]) => {
    await createUser(payload);
    fetchUserData();
    const sumData = await getUserSummary();
    setSummary(sumData);
  };

  // Handle Delete Account
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    await deleteUser(selectedUser.accountId);
    fetchUserData();
    const sumData = await getUserSummary();
    setSummary(sumData);
  };

  // Handle Lock/Unlock Account toggle
  const handleToggleLock = async (user: AdminUser) => {
    const isCurrentlyLocked = user.status === "Locked";
    try {
      if (isCurrentlyLocked) {
        await unlockUser(user.accountId);
        showToast(`Account for ${user.firstName} ${user.lastName} unlocked successfully.`);
      } else {
        await lockUser(user.accountId);
        showToast(`Account for ${user.firstName} ${user.lastName} locked successfully.`);
      }
      fetchUserData();
    } catch (err) {
      console.error("Toggle lock failed:", err);
      showToast("Failed to update status. Please try again.", "error");
    }
  };

  // Handle Reset password API
  const handleResetPassword = async (): Promise<string> => {
    if (!selectedUser) throw new Error("No user selected");
    return await resetUserPassword(selectedUser.accountId);
  };

  // Trigger password reset dialog
  const triggerResetModal = (user: AdminUser) => {
    setSelectedUser(user);
    setShowResetModal(true);
  };

  // Trigger edit user dialog
  const triggerEditModal = (user: AdminUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  // Handle Edit Account
  const handleUpdateUser = async (payload: Parameters<typeof updateUser>[1]) => {
    if (!selectedUser) return;
    await updateUser(selectedUser.accountId, payload);
    fetchUserData();
    showToast(`Cập nhật thông tin cho ${selectedUser.firstName} ${selectedUser.lastName} thành công.`);
  };

  // Trigger delete dialog
  const triggerDeleteModal = (user: AdminUser) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Account Registry</h2>
          <p className="text-xs text-slate-500 mt-1">Manage accounts, toggle security status, lock access, and reset passwords.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-md bg-[#005fb8] hover:bg-blue-700 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.8">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add New Account
        </button>
      </div>

      {/* Summary Metrics Cards */}
      {summary && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
          {/* Total Accounts */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Accounts</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{summary.totalAccounts}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
          </div>

          {/* Active Now */}
          <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Sessions</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{summary.activeNow}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
          </div>

          {/* Locked Accounts */}
          <div className="col-span-2 md:col-span-1 bg-white p-4.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locked Accounts</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{summary.lockedAccounts}</h3>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* User Search and Filters */}
      <UserFilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(0);
        }}
        role={role}
        onRoleChange={(val) => {
          setRole(val);
          setPage(0);
        }}
        roleOptions={ROLE_OPTIONS}
        status={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(0);
        }}
        statusOptions={STATUS_OPTIONS}
      />

      {/* User Table Grid */}
      <UserTable
        users={usersResponse?.content ?? []}
        page={page}
        totalPages={usersResponse?.totalPages ?? 0}
        totalElements={usersResponse?.totalElements ?? 0}
        size={size}
        onPageChange={setPage}
        onRowsPerPageChange={(val) => {
          setSize(val);
          setPage(0);
        }}
        onResetPassword={triggerResetModal}
        onToggleLock={handleToggleLock}
        onDelete={triggerDeleteModal}
        onEdit={triggerEditModal}
        isLoading={loading}
      />

      {/* Modals Container */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateUser}
        roleOptions={ROLE_OPTIONS}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        user={selectedUser}
      />

      <ResetPasswordModal
        isOpen={showResetModal}
        onClose={() => {
          setShowResetModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleResetPassword}
        user={selectedUser}
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(null);
        }}
        onSubmit={handleUpdateUser}
        user={selectedUser}
        roleOptions={ROLE_OPTIONS}
        departments={departments}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-in slide-in-from-bottom-5 z-50 flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
