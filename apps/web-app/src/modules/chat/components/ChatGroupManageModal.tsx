"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Trash2, ShieldCheck, Crown, UserMinus } from "lucide-react";
import { Conversation, User } from "../types";

interface ChatGroupManageModalProps {
  conversation: Conversation;
  currentUser: User;
  onClose: () => void;
  onRemoveMember: (memberId: string) => Promise<void>;
  onDissolveGroup: () => Promise<void>;
}

export function ChatGroupManageModal({
  conversation,
  currentUser,
  onClose,
  onRemoveMember,
  onDissolveGroup,
}: ChatGroupManageModalProps) {
  const canManage = conversation.canManageGroup || conversation.myRole === "owner";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (isSubmitting) return;
    const confirmed = window.confirm(`Xóa ${memberName} khỏi nhóm?`);
    if (!confirmed) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onRemoveMember(memberId);
      setFeedback(`Đã xóa ${memberName} khỏi nhóm.`);
    } catch (error) {
      console.error("[ChatGroupManageModal] remove member error:", error);
      setFeedback("Không thể xóa thành viên. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDissolveGroup = async () => {
    if (isSubmitting) return;
    const confirmed = window.confirm("Giải tán nhóm này? Hành động này không thể hoàn tác.");
    if (!confirmed) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onDissolveGroup();
      setFeedback("Đã giải tán nhóm.");
    } catch (error) {
      console.error("[ChatGroupManageModal] dissolve group error:", error);
      setFeedback("Không thể giải tán nhóm. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Quyền nhóm</h3>
            <p className="text-xs text-slate-500">Owner / Member</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5">
          {feedback && (
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {feedback}
            </div>
          )}
          <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <ShieldCheck size={16} />
              <span>Vai trò của bạn:</span>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs text-sky-700">
                {conversation.myRole === "owner" ? "Owner" : "Member"}
              </span>
            </div>
            {conversation.myRole === "owner" && (
              <p className="mt-1 text-xs text-slate-500">
                Bạn có thể xóa thành viên hoặc giải tán nhóm.
              </p>
            )}
          </div>

          <div className="space-y-2">
            {conversation.participants.map((participant) => {
              const isCurrentUser = participant.id === currentUser.id;
              const isOwner = conversation.ownerId === participant.id;
              return (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Image
                      src={participant.avatarUrl}
                      alt={participant.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {participant.name}
                        </p>
                        {isOwner && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            <Crown size={11} />
                            Owner
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                            Bạn
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500">
                        {participant.email || participant.code || participant.id}
                      </p>
                    </div>
                  </div>

                  {canManage && !isCurrentUser && !isOwner && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void handleRemoveMember(participant.id, participant.name)}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <UserMinus size={14} />
                      Xóa
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Chỉ owner mới có quyền quản lý nhóm.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
              {canManage && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleDissolveGroup()}
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <Trash2 size={14} />
                  Giải tán nhóm
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}