"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Trash2, ShieldCheck, Crown, UserMinus, Mail, CheckCircle2, XCircle, LockKeyhole, Users } from "lucide-react";
import { Conversation, User } from "../types";

const isSafeAvatarUrl = (value: string | null | undefined): value is string => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return ["http:", "https:"].includes(parsed.protocol) && parsed.hostname !== "via.placeholder.com";
  } catch {
    return false;
  }
};

interface ChatGroupManageModalProps {
  conversation: Conversation;
  currentUser: User;
  onClose: () => void;
  onOpenProfile?: (user: User) => void;
  ownerUser?: User | null;
  deputyUser?: User | null;
  joinPolicy: "open" | "approval";
  pendingMemberRequests: Array<{
    _id: string;
    targetUserId: string;
    targetEmail: string;
    targetName: string;
    requestedById: string;
    requestedByName: string;
    createdAt?: string;
  }>;
  onRemoveMember: (memberId: string) => Promise<void>;
  onSetDeputy: (deputyId: string | null) => Promise<void>;
  onUpdateJoinPolicy: (joinPolicy: "open" | "approval") => Promise<void>;
  onInviteMember: (email: string) => Promise<"added" | "requested" | void>;
  onApproveMemberRequest: (requestId: string) => Promise<void>;
  onRejectMemberRequest: (requestId: string) => Promise<void>;
  onDissolveGroup: () => Promise<void>;
  onLeaveGroup: (newOwnerId?: string) => Promise<void>;
}

export function ChatGroupManageModal({
  conversation,
  currentUser,
  onClose,
  onOpenProfile,
  ownerUser,
  deputyUser,
  joinPolicy,
  pendingMemberRequests,
  onRemoveMember,
  onSetDeputy,
  onUpdateJoinPolicy,
  onInviteMember,
  onApproveMemberRequest,
  onRejectMemberRequest,
  onDissolveGroup,
  onLeaveGroup,
}: ChatGroupManageModalProps) {
  const canManage =
    conversation.canManageGroup ||
    conversation.myRole === "owner" ||
    conversation.myRole === "deputy";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pendingRemoveMember, setPendingRemoveMember] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<string>("");
  const [selectedDeputyId, setSelectedDeputyId] = useState<string>(conversation.deputyId || "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedJoinPolicy, setSelectedJoinPolicy] = useState<"open" | "approval">(joinPolicy);

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (isSubmitting) return;

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
      setPendingRemoveMember(null);
    }
  };

  const handleDissolveGroup = async () => {
    if (isSubmitting) return;

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

  const handleSetDeputy = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onSetDeputy(selectedDeputyId || null);
      setFeedback(
        selectedDeputyId ? "Đã cập nhật phó nhóm." : "Đã gỡ phó nhóm.",
      );
    } catch (error) {
      console.error("[ChatGroupManageModal] set deputy error:", error);
      setFeedback("Không thể cập nhật phó nhóm. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateJoinPolicy = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onUpdateJoinPolicy(selectedJoinPolicy);
      setFeedback(
        selectedJoinPolicy === "approval"
          ? "Đã chuyển nhóm sang chế độ riêng tư cần duyệt."
          : "Đã chuyển nhóm sang chế độ công khai.",
      );
    } catch (error) {
      console.error("[ChatGroupManageModal] update join policy error:", error);
      setFeedback("Không thể cập nhật chế độ nhóm. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInviteMember = async () => {
    if (isSubmitting) return;

    const email = inviteEmail.trim();
    if (!email) {
      setFeedback("Vui lòng nhập email thành viên cần mời.");
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const mode = await onInviteMember(email);
      setInviteEmail("");
      setFeedback(
        mode === "requested"
          ? `Đã gửi yêu cầu duyệt cho ${email}.`
          : `Đã thêm ${email} vào nhóm.`,
      );
    } catch (error) {
      console.error("[ChatGroupManageModal] invite member error:", error);
      setFeedback("Không thể mời thành viên. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (isSubmitting) return;

    if (conversation.myRole === "owner" && !selectedNewOwnerId) {
      setFeedback("Hãy chọn một trưởng nhóm mới trước khi rời nhóm.");
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onLeaveGroup(
        conversation.myRole === "owner" ? selectedNewOwnerId : undefined,
      );
      setFeedback("Đã rời nhóm thành công.");
    } catch (error) {
      console.error("[ChatGroupManageModal] leave group error:", error);
      setFeedback("Không thể rời nhóm. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
      setShowLeaveConfirm(false);
      setSelectedNewOwnerId("");
    }
  };

  const leaveCandidates = conversation.participants.filter(
    (participant) => participant.id !== currentUser.id,
  );

  const isOwner = (participantId: string) => conversation.ownerId === participantId;
  const managerCandidates = conversation.participants.filter(
    (participant) => participant.id !== conversation.ownerId,
  );

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Quản lý nhóm</h3>
            <p className="text-xs text-slate-500">Trưởng nhóm / Thành viên</p>
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
          {pendingRemoveMember && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="mb-3">
                Xác nhận xóa {pendingRemoveMember.name} khỏi nhóm?
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleRemoveMember(pendingRemoveMember.id, pendingRemoveMember.name)}
                  className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Xác nhận xóa
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setPendingRemoveMember(null)}
                  className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
          {showDissolveConfirm && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="mb-3">
                Giải tán nhóm này? Hành động này không thể hoàn tác.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleDissolveGroup()}
                  className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Xác nhận giải tán
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowDissolveConfirm(false)}
                  className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
          {showLeaveConfirm && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="mb-3 font-medium">
                {conversation.myRole === "owner"
                  ? "Chọn trưởng nhóm mới trước khi rời nhóm"
                  : "Xác nhận rời nhóm?"}
              </div>

              {conversation.myRole === "owner" && (
                <div className="mb-3 space-y-2">
                  {leaveCandidates.length > 0 ? (
                    leaveCandidates.map((participant) => (
                      <button
                        key={participant.id}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setSelectedNewOwnerId(participant.id)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                          selectedNewOwnerId === participant.id
                            ? "border-amber-400 bg-white"
                            : "border-amber-200 bg-white/70 hover:bg-white"
                        }`}
                      >
                        <span className="min-w-0 truncate">{participant.name}</span>
                        <span className="text-xs text-amber-700">
                          {selectedNewOwnerId === participant.id ? "Đã chọn" : "Chọn"}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs">
                      Không có thành viên nào khác để chuyển quyền.
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting || (conversation.myRole === "owner" && !selectedNewOwnerId)}
                  onClick={() => void handleLeaveGroup()}
                  className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  Xác nhận rời nhóm
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setShowLeaveConfirm(false);
                    setFeedback(null);
                    setSelectedNewOwnerId("");
                  }}
                  className="rounded-full border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
          <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <LockKeyhole size={16} />
              <span>Chế độ nhóm:</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs ${joinPolicy === "approval" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                {joinPolicy === "approval" ? "Riêng tư - cần duyệt" : "Công khai"}
              </span>
            </div>
            {conversation.myRole === "owner" ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSelectedJoinPolicy("open")}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${selectedJoinPolicy === "open" ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                >
                  Công khai
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSelectedJoinPolicy("approval")}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${selectedJoinPolicy === "approval" ? "border-amber-400 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
                >
                  Riêng tư
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || selectedJoinPolicy === joinPolicy}
                  onClick={() => void handleUpdateJoinPolicy()}
                  className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Lưu chế độ
                </button>
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Chủ nhóm quản lý chế độ công khai / riêng tư.
              </p>
            )}
          </div>
          <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <Mail size={16} />
              <span>Mời thành viên</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Nếu nhóm ở chế độ riêng tư, lời mời sẽ vào danh sách chờ duyệt.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="Nhập email thành viên"
                disabled={isSubmitting}
                className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-400"
              />
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleInviteMember()}
                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                Mời
              </button>
            </div>
          </div>
          {(conversation.myRole === "owner" || conversation.myRole === "deputy") && (
            <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <Users size={16} />
                <span>Yêu cầu chờ duyệt</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700">
                  {pendingMemberRequests.length}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {pendingMemberRequests.length > 0 ? (
                  pendingMemberRequests.map((request) => (
                    <div key={request._id} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {request.targetName}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {request.targetEmail}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            Yêu cầu bởi {request.requestedByName}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => void onApproveMemberRequest(request._id)}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            Duyệt
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => void onRejectMemberRequest(request._id)}
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Từ chối
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                    Chưa có yêu cầu nào đang chờ duyệt.
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <ShieldCheck size={16} />
              <span>Vai trò của bạn:</span>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs text-sky-700">
                {conversation.myRole === "owner"
                  ? "Trưởng nhóm"
                  : conversation.myRole === "deputy"
                    ? "Phó nhóm"
                    : "Thành viên"}
              </span>
            </div>
            {conversation.myRole === "owner" && (
              <p className="mt-1 text-xs text-slate-500">
                Bạn có thể xóa thành viên hoặc giải tán nhóm.
              </p>
            )}
            {conversation.myRole === "deputy" && (
              <p className="mt-1 text-xs text-slate-500">
                Bạn có thể xóa thành viên nhưng không thể kick trưởng nhóm hoặc giải tán nhóm.
              </p>
            )}
            {ownerUser && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Trưởng nhóm
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenProfile?.(ownerUser)}
                    className="truncate text-left font-medium text-slate-900 hover:text-sky-600"
                  >
                    {ownerUser.name}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenProfile?.(ownerUser)}
                  className="shrink-0 rounded-full ring-2 ring-transparent transition hover:ring-sky-200"
                  aria-label={`Xem thông tin trưởng nhóm ${ownerUser.name}`}
                >
                  <Image
                    src={ownerUser.avatarUrl}
                    alt={ownerUser.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                  />
                </button>
              </div>
            )}
            {deputyUser && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-slate-200">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Phó nhóm
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenProfile?.(deputyUser)}
                    className="truncate text-left font-medium text-slate-900 hover:text-sky-600"
                  >
                    {deputyUser.name}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenProfile?.(deputyUser)}
                  className="shrink-0 rounded-full ring-2 ring-transparent transition hover:ring-sky-200"
                  aria-label={`Xem thông tin phó nhóm ${deputyUser.name}`}
                >
                  <Image
                    src={deputyUser.avatarUrl}
                    alt={deputyUser.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                  />
                </button>
              </div>
            )}

            {conversation.myRole === "owner" && deputyUser && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-700">
                    Quyền phó nhóm
                  </p>
                  <p className="text-xs text-slate-600">
                    Trưởng nhóm có thể gỡ quyền phó nhóm bất cứ lúc nào.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setSelectedDeputyId("");
                    await onSetDeputy(null);
                  }}
                  className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  Gỡ quyền phó nhóm
                </button>
              </div>
            )}

            {conversation.myRole === "owner" && (
              <div className="mt-3 rounded-xl bg-white px-3 py-3 shadow-sm ring-1 ring-slate-200">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Cấp phó nhóm
                    </p>
                    <p className="text-xs text-slate-500">
                      Phó nhóm có quyền quản lý, nhưng không thể giải tán nhóm hay kick trưởng nhóm.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setSelectedDeputyId("")}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Bỏ lựa chọn
                  </button>
                </div>
                <div className="max-h-44 space-y-2 overflow-y-auto">
                  {managerCandidates.map((participant) => {
                    const isSelected = selectedDeputyId === participant.id;
                    return (
                      <button
                        key={participant.id}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => setSelectedDeputyId(participant.id)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                          isSelected
                            ? "border-sky-400 bg-sky-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <span className="min-w-0 truncate text-sm text-slate-900">
                          {participant.name}
                        </span>
                        <span className="text-xs text-slate-600">
                          {isSelected ? "Đang chọn" : "Chọn"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleSetDeputy()}
                    className="rounded-full bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    Lưu phó nhóm
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {conversation.participants.map((participant) => {
              const isCurrentUser = participant.id === currentUser.id;
              const participantIsOwner = isOwner(participant.id);
              return (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenProfile?.(participant)}
                      className="shrink-0 rounded-full ring-2 ring-transparent transition hover:ring-sky-200 focus:outline-none focus:ring-sky-300"
                      aria-label={`Xem thông tin ${participant.name}`}
                    >
                      {isSafeAvatarUrl(participant.avatarUrl) ? (
                        <Image
                          src={participant.avatarUrl}
                          alt={participant.name}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-purple-600 text-sm font-semibold text-white ring-1 ring-slate-200">
                          {(participant.name || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {participant.name}
                        </p>
                        {participantIsOwner && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            <Crown size={11} />
                            Trưởng nhóm
                          </span>
                        )}
                        {!participantIsOwner && conversation.deputyId === participant.id && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                            Phó nhóm
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

                  {canManage && !isCurrentUser && !participantIsOwner && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setPendingRemoveMember({ id: participant.id, name: participant.name })}
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
              Trưởng nhóm và phó nhóm có quyền quản lý thành viên.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(true)}
                disabled={isSubmitting}
                className="rounded-full border border-amber-200 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
              >
                Rời nhóm
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
              {conversation.myRole === "owner" && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowDissolveConfirm(true)}
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