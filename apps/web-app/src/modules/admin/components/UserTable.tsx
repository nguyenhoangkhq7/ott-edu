"use client";

import type { AdminUser } from "@/shared/types/admin";
import Toggle from "@/shared/components/ui/Toggle";
import { getInitialsFromDisplayName } from "@/shared/utils/user-display";

interface UserTableProps {
  users: AdminUser[];
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newSize: number) => void;
  onResetPassword: (user: AdminUser) => void;
  onToggleLock: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  isLoading?: boolean;
}

export default function UserTable({
  users,
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
  onRowsPerPageChange,
  onResetPassword,
  onToggleLock,
  onDelete,
  isLoading = false,
}: UserTableProps) {
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "Super Admin":
        return "bg-red-50 text-red-700 border-red-150";
      case "Editor":
        return "bg-amber-50 text-amber-700 border-amber-150";
      case "Teacher":
        return "bg-blue-50 text-blue-700 border-blue-150";
      case "Student":
        return "bg-violet-50 text-violet-700 border-violet-150";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const startIdx = totalElements === 0 ? 0 : page * size + 1;
  const endIdx = Math.min(startIdx + size - 1, totalElements);

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Table Area */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Account / User</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3">Created Date</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400 font-medium">
                  <div className="flex justify-center items-center gap-2">
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 animate-spin text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2v4M12 18v4" />
                    </svg>
                    <span>Loading accounts...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400 font-medium">
                  No accounts found matching current filter criteria.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const fullName = `${user.firstName} ${user.lastName}`;
                const initials = getInitialsFromDisplayName(fullName);
                const isLocked = user.status === "Locked";

                return (
                  <tr
                    key={user.accountId}
                    className="hover:bg-slate-50/40 transition-colors group"
                  >
                    {/* User profile */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-[#d1d2eb] text-[10px] font-bold text-[#4b53bc] shrink-0">
                          {user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.avatarUrl}
                              alt={fullName}
                              className="h-full w-full rounded-lg object-cover"
                            />
                          ) : (
                            initials
                          )}
                          <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white ${isLocked ? "bg-red-500" : "bg-green-500"}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700 truncate">{fullName}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">@{user.username}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {user.email}
                    </td>

                    {/* Role */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(user.role)}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Status with Toggle */}
                    <td className="px-5 py-3.5">
                      <div className="flex justify-center items-center gap-2.5">
                        <span className={`text-[10px] font-bold ${isLocked ? "text-red-500" : "text-emerald-600"}`}>
                          {user.status}
                        </span>
                        <Toggle
                          ariaLabel={`Toggle Lock for ${fullName}`}
                          enabled={!isLocked}
                          onChange={() => onToggleLock(user)}
                        />
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-3.5 text-slate-500">
                      {user.createdDate}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        {/* Reset Password */}
                        <button
                          onClick={() => onResetPassword(user)}
                          className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          title="Reset Password"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 12a9 9 0 0 0 15 6.7L21 16M21 22v-6h-6" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDelete(user)}
                          className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-red-100 bg-red-50/20 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                          title="Delete Account"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 px-5 py-3 gap-3 text-[11px] text-slate-500 font-medium bg-slate-50/20">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-700">{startIdx}</strong> to{" "}
              <strong className="text-slate-700">{endIdx}</strong> of{" "}
              <strong className="text-slate-700">{totalElements}</strong> accounts
            </span>

            {/* Rows per page selector */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <span>Rows per page:</span>
              <select
                value={size}
                onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded px-1 py-0.5 text-slate-600 focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* First Page */}
            <button
              onClick={() => onPageChange(0)}
              disabled={page === 0}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
            </button>

            {/* Previous Page */}
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 font-bold">
              {page + 1} / {totalPages}
            </span>

            {/* Next Page */}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages - 1}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Last Page */}
            <button
              onClick={() => onPageChange(totalPages - 1)}
              disabled={page === totalPages - 1}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="13 17 18 12 13 7" />
                <polyline points="6 17 11 12 6 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
