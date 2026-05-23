"use client";

import type { TopActiveUser } from "@/shared/types/admin";
import { getInitialsFromDisplayName } from "@/shared/utils/user-display";

interface TopActiveUsersTableProps {
  users: TopActiveUser[];
}

export default function TopActiveUsersTable({ users }: TopActiveUsersTableProps) {
  const getEngagementColor = (val: number) => {
    if (val >= 80) return "bg-emerald-500";
    if (val >= 60) return "bg-blue-500";
    return "bg-amber-500";
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col h-full">
      <div className="pb-3 border-b border-slate-100 mb-3">
        <h3 className="text-sm font-bold text-slate-800">Top Active Users</h3>
        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Users with the highest platform activity and engagement rates</p>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-2.5">User</th>
              <th className="px-4 py-2.5">Last Active</th>
              <th className="px-4 py-2.5 text-right">Messages</th>
              <th className="px-4 py-2.5">Engagement Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {users.map((user) => {
              const initials = getInitialsFromDisplayName(user.name);

              return (
                <tr key={user.accountId} className="hover:bg-slate-50/40 transition-colors">
                  {/* Profile */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-[#d1d2eb] text-[10px] font-bold text-[#4b53bc] shrink-0">
                        {user.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-700 truncate">{user.name}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Last Active */}
                  <td className="px-4 py-3 text-slate-500 font-medium">
                    {user.lastActivity}
                  </td>

                  {/* Message Count */}
                  <td className="px-4 py-3 text-right font-bold text-slate-600">
                    {user.messages.toLocaleString()}
                  </td>

                  {/* Engagement Meter */}
                  <td className="px-4 py-3 min-w-[120px]">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                        <span>{user.engagement}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getEngagementColor(
                            user.engagement
                          )}`}
                          style={{ width: `${user.engagement}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
