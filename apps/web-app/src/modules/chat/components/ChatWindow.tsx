"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  ActiveVideoCall,
  Attachment,
  CallHistoryItem,
  Conversation,
  IncomingVideoCall,
  MediaCallKind,
  Message,
  Reaction,
  User,
  VideoCallStatus,
} from "../types";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import {
  Camera,
  CameraOff,
  Check,
  Info,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  RefreshCw,
  UserCheck,
  UserPlus,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import { Socket } from "socket.io-client";
import ConversationInfoSidebar from "@/shared/components/ConversationInfoSidebar";
import { AddMemberModal } from "./AddMemberModal";

import { requestOrAddGroupMember, sendFriendRequestApi, searchUsersApi, unfriendApi } from "../chatApi";
import { VideoCallOverlay } from "./VideoCallOverlay";

interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUser: User | null;
  onSendMessage: (
    text: string,
    attachments?: Attachment[],
    replyToId?: string,
  ) => Promise<void>;
  isLoadingMessages?: boolean;
  isSending?: boolean;
  socket?: Socket | null;
  canStartVideoCall?: boolean;
  onStartVideoCall?: () => void;
  canStartAudioCall?: boolean;
  onStartAudioCall?: () => void;
  callStatus?: VideoCallStatus;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  remoteStreams?: Map<string, MediaStream>;
  incomingCall?: IncomingVideoCall | null;
  incomingCaller?: User | null;
  activeCall?: ActiveVideoCall | null;
  callHistory?: CallHistoryItem[];
  isLoadingCallHistory?: boolean;
  callHistoryPage?: number;
  callHistoryTotalPages?: number;
  isMicrophoneEnabled?: boolean;
  isCameraEnabled?: boolean;
  isScreenSharing?: boolean;
  callError?: string | null;
  onClearCallError?: () => void;
  onRetryMediaPermission?: () => Promise<void> | void;
  onAcceptIncomingCall?: () => void;
  onDeclineIncomingCall?: () => void;
  onEndVideoCall?: () => void;
  onToggleMicrophone?: () => void;
  onToggleCamera?: () => void;
  onToggleScreenShare?: () => void;
  onForwardMessage?: (message: Message | null) => void;
  onOpenProfile?: (user: User | null) => void;
  onOpenGroupManage?: () => void;
  typingUsers?: Set<string>;
  onConversationInfoRefreshTick?: number;
}





export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  currentUser,
  onSendMessage,
  isLoadingMessages = false,
  isSending = false,
  socket,
  canStartVideoCall = false,
  onStartVideoCall,
  canStartAudioCall = false,
  onStartAudioCall,
  callStatus = "idle" as VideoCallStatus,
  localStream = null,
  remoteStream = null,
  remoteStreams = new Map(),
  incomingCall = null,
  incomingCaller = null,
  activeCall = null,
  callHistory = [],
  isMicrophoneEnabled = true,
  isCameraEnabled = true,
  isScreenSharing = false,
  callError = null,
  onClearCallError,
  onRetryMediaPermission,
  onAcceptIncomingCall,
  onDeclineIncomingCall,
  onEndVideoCall,
  onToggleMicrophone,
  onToggleCamera,
  onToggleScreenShare,
  onForwardMessage,
  onOpenProfile,
  onOpenGroupManage,
  typingUsers = new Set(),
  onConversationInfoRefreshTick = 0,
}) => {
  const formatCallStatus = (item: CallHistoryItem): string => {
    switch (item.status) {
      case "connected":
      case "ended":
        return "Đã gọi";
      case "declined":
        return "Bị từ chối";
      case "unavailable":
        return "Không liên lạc được";
      case "failed":
        return "Lỗi kết nối";
      case "ringing":
        return "Đang đổ chuông";
      default:
        return item.status;
    }
  };

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  
  // 🚀 THÊM STATE ĐỂ LƯU GỢI Ý NGƯỜI DÙNG
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);

  // 🚀 GỌI API LẤY GỢI Ý MỖI KHI MỞ MODAL THÊM THÀNH VIÊN
  useEffect(() => {
    if (isAddMemberOpen) {
      const fetchSuggestions = async () => {
        try {
          const res = await searchUsersApi("") as { data: User[] };
          setSuggestedUsers(res.data || []);
        } catch (error) {
          console.error("Lỗi tải danh sách gợi ý:", error);
        }
      };
      fetchSuggestions();
    } else {
      // Dọn dẹp data khi đóng modal cho nhẹ bộ nhớ
      setSuggestedUsers([]);
    }
  }, [isAddMemberOpen]);

  const handleAddMember = async (email: string) => {
    if (conversation) {
      await requestOrAddGroupMember(conversation.id, { email });
      alert("Đã gửi lời mời / Thêm thành viên thành công!");
    }
  };
  
  const [friendStatus, setFriendStatus] = useState<
    "none" | "pending" | "friend"
  >("none");
  const [isFriendBtnHovered, setIsFriendBtnHovered] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false);
  const remoteStreamsList = React.useMemo(
    () => Array.from(remoteStreams.entries()),
    [remoteStreams],
  );
  const callHistoryMessages = React.useMemo(
    () =>
      callHistory.map((item) => ({
        id: item._id,
        conversationId: item.conversationId,
        senderId: item.callerId,
        content: `[call_log] ${JSON.stringify({
          callType: item.callType || "video",
          status: item.status,
          durationSec: item.durationSec,
          label: `Cuộc gọi ${formatCallStatus(item).toLowerCase()}`,
        })}`,
        createdAt: item.startedAt,
        status: "sent" as const,
        attachments: [],
        linkPreview: undefined,
        replyTo: null,
        isRevoked: false,
        revokedFor: [],
        isForwarded: false,
        reactions: [],
      })),
    [callHistory],
  );
  const timelineMessages = React.useMemo(() => {
    const combined = [...localMessages, ...callHistoryMessages];
    return combined.sort(
      (left, right) =>
        new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime(),
    );
  }, [callHistoryMessages, localMessages]);

  useEffect(() => {
    if (conversation?.type !== "private" || !currentUser) return;

    let finalStatus: "none" | "pending" | "friend" = "none";

    const pList = conversation.participants || [];

    console.log("📦 Mở hộp soi Participants:", pList);
    for (const p of pList) {
      const participantObj = p as unknown as {
        friendStatus?: "none" | "pending" | "friend";
      };
      const status = participantObj.friendStatus;

      if (status === "friend") {
        finalStatus = "friend";
        break;
      } else if (status === "pending") {
        finalStatus = "pending";
      }
    }

    const convObj = conversation as unknown as {
      otherParticipant?: { friendStatus?: "none" | "pending" | "friend" };
    };
    if (finalStatus === "none" && convObj?.otherParticipant?.friendStatus) {
      finalStatus = convObj.otherParticipant.friendStatus;
    }

    console.log("🎯 Trạng thái chốt hạ đưa lên nút:", finalStatus);

    queueMicrotask(() => {
      setFriendStatus(finalStatus);
    });
  }, [conversation, currentUser]);

  // Update local messages when messages prop changes
  useEffect(() => {
    queueMicrotask(() => {
      setLocalMessages(messages);
    });
  }, [messages]);



  // Setup socket listeners
  useEffect(() => {
    if (!socket || !conversation) return;

    // Listen for message reactions
    const handleMessageReacted = (data: {
      messageId: string;
      reactions: Reaction[];
    }) => {
      setLocalMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg,
        ),
      );
    };

    // Listen for message revocation
    const handleMessageRevoked = (data: {
      messageId: string;
      isRevoked: boolean;
    }) => {
      setLocalMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, isRevoked: data.isRevoked }
            : msg,
        ),
      );
    };

    socket.on("messageReacted", handleMessageReacted);
    socket.on("messageRevoked", handleMessageRevoked);

    return () => {
      socket.off("messageReacted", handleMessageReacted);
      socket.off("messageRevoked", handleMessageRevoked);
    };
  }, [socket, conversation]);

  const callStatusLabel = React.useMemo(() => {
    const currentCallType: MediaCallKind = activeCall?.callType || incomingCall?.callType || "video";
    const callTypeLabel = currentCallType === "audio" ? "audio" : "video";

    switch (callStatus) {
      case "calling":
        return `Đang gọi ${callTypeLabel}... chờ đối phương chấp nhận`;
      case "receiving":
        return `Bạn có cuộc gọi ${callTypeLabel} đến`;
      case "connected":
        return `Đã kết nối ${callTypeLabel}`;
      default:
        return "Sẵn sàng";
    }
  }, [activeCall, callStatus, incomingCall]);

  const incomingCallerName =
    incomingCaller?.name || incomingCall?.fromUserId || "Người dùng";
  const incomingCallTypeLabel = incomingCall?.callType === "audio" ? "audio" : "video";
  const activeCallTypeLabel = activeCall?.callType === "audio" ? "audio" : "video";
  const currentCallType: MediaCallKind = activeCall?.callType || incomingCall?.callType || "video";
  const isAudioCall = currentCallType === "audio";
  const showFullScreenCall =
    callStatus !== "idle" ||
    Boolean(localStream) ||
    remoteStreamsList.length > 0;
  const showInlineCallPanel = !showFullScreenCall && Boolean(callError);

  const renderFullScreenCallOverlay = () => {
    return (
      <VideoCallOverlay
        showFullScreenCall={showFullScreenCall}
        conversation={conversation}
        incomingCall={incomingCall}
        incomingCallerName={incomingCallerName}
        incomingCallTypeLabel={incomingCallTypeLabel}
        activeCallTypeLabel={activeCallTypeLabel}
        callStatusLabel={callStatusLabel}
        isAudioCall={isAudioCall}
        localStream={localStream}
        isCameraEnabled={isCameraEnabled}
        isMicrophoneEnabled={isMicrophoneEnabled}
        isScreenSharing={isScreenSharing}
        callStatus={callStatus}
        activeCall={activeCall}
        remoteStreamsList={remoteStreamsList}
        callError={callError}
        onClearCallError={onClearCallError}
        onRetryMediaPermission={onRetryMediaPermission}
        onDeclineIncomingCall={onDeclineIncomingCall}
        onAcceptIncomingCall={onAcceptIncomingCall}
        onToggleMicrophone={onToggleMicrophone}
        onToggleCamera={onToggleCamera}
        onToggleScreenShare={onToggleScreenShare}
        onEndVideoCall={onEndVideoCall}
      />
    );
  };

  const renderVideoCallPanel = () => {
    if (!showInlineCallPanel) {
      return null;
    }

    return (
      <div className="border-b border-slate-200 bg-linear-to-br from-sky-50 via-white to-cyan-50 px-4 py-3 text-slate-900">
        {callError && (
          <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <div className="min-w-0 flex-1">
              <p>{callError}</p>
              {onRetryMediaPermission && (
                <button
                  type="button"
                  onClick={() => {
                    void onRetryMediaPermission();
                  }}
                  className="mt-2 inline-flex items-center gap-1 rounded-md border border-rose-300 px-2 py-1 text-[11px] font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  <RefreshCw size={12} />
                  Xin quyen lai
                </button>
              )}
            </div>
            {onClearCallError && (
              <button
                type="button"
                onClick={onClearCallError}
                className="rounded p-1 text-rose-700 transition hover:bg-rose-100"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {incomingCall && callStatus === ("receiving" as VideoCallStatus) && (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
            <p className="font-semibold">
              {incomingCallerName} đang gọi {incomingCallTypeLabel} cho bạn
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onDeclineIncomingCall}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Tu choi
              </button>
              <button
                type="button"
                onClick={onAcceptIncomingCall}
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-400"
              >
                Chap nhan
              </button>
            </div>
          </div>
        )}

        {(callStatus !== "idle" || localStream || remoteStream) && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {callStatusLabel}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onToggleMicrophone}
                  disabled={!localStream}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                  title={isMicrophoneEnabled ? "Tat micro" : "Bat micro"}
                >
                  {isMicrophoneEnabled ? (
                    <Mic size={14} />
                  ) : (
                    <MicOff size={14} />
                  )}
                </button>
                {!isAudioCall && (
                  <button
                    type="button"
                    onClick={onToggleCamera}
                    disabled={!localStream}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-sky-300 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
                    title={isCameraEnabled ? "Tat camera" : "Bat camera"}
                  >
                    {isCameraEnabled ? (
                      <Camera size={14} />
                    ) : (
                      <CameraOff size={14} />
                    )}
                  </button>
                )}
                {(activeCall || callStatus !== "idle") && (
                  <button
                    type="button"
                    onClick={() => onEndVideoCall?.()}
                    className="inline-flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-400"
                  >
                    <PhoneOff size={14} />
                    Ket thuc
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                <video
                  ref={(el) => {
                    if (!el) return;
                    if (el.srcObject !== remoteStream)
                      el.srcObject = remoteStream;
                    if (remoteStream) el.play().catch(() => { });
                  }}
                  autoPlay
                  playsInline
                  className="h-44 w-full object-cover"
                  onError={() => {
                    console.error(
                      "[ChatWindow] Remote video element failed to render stream.",
                    );
                  }}
                />
                {!remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-200">
                    Dang cho video tu doi phuong...
                  </div>
                )}
              </div>
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                <video
                  ref={(el) => {
                    if (!el) return;
                    if (el.srcObject !== localStream)
                      el.srcObject = localStream;
                    if (localStream) el.play().catch(() => { });
                  }}
                  autoPlay
                  muted
                  playsInline
                  className="h-44 w-full object-cover"
                  onError={() => {
                    console.error(
                      "[ChatWindow] Local video element failed to render stream.",
                    );
                  }}
                />
                {(!localStream || !isCameraEnabled) && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-200">
                    {isCameraEnabled
                      ? "Đang khởi tạo camera..."
                      : "Bạn đã tắt camera"}
                  </div>
                )}
              </div>
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
              Camera/Microphone chi duoc cap quyen khi test tren localhost hoac
              HTTPS.
            </p>
          </>
        )}
      </div>
    );
  };

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col bg-slate-50">
        {renderVideoCallPanel()}

        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-8 w-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
          <p className="text-sm text-slate-500">
            Chọn một đoạn chat để bắt đầu trò chuyện
          </p>
        </div>
      </div>
    );
  }

 // Header display logic
 let displayName = conversation.name || "Người dùng";
let displayAvatar = conversation.avatarUrl;

// Logic hiển thị subStatus (Bây giờ TypeScript sẽ không báo lỗi nữa vì đã thêm "group" vào ChatMode)
let subStatus = (conversation.type === "class" || conversation.type === "group")
  ? `${conversation.participants?.length || 0} thành viên`
  : "Đang hoạt động";

if (conversation.type === "private" && currentUser) {
  // Dùng intersection type để ép kiểu an toàn cho currentUser
  const self = currentUser as User & { _id?: string };
  const selfId = self.id || self._id;

  // Tìm đối phương bằng cách quét chéo cả id và _id
  const otherParticipant = conversation.participants.find((p) => {
    const pId = p.id || (p as User & { _id?: string })._id;
    return pId !== selfId;
  });

  if (otherParticipant) {
    // Ép kiểu cụ thể cho peer để truy cập các thuộc tính lạ
    const peer = otherParticipant as User & { fullName?: string; isOnline?: boolean };
    
    // Logic lấy tên an toàn
    displayName = peer.fullName || peer.name || (peer.email ? peer.email.split('@')[0] : "Người dùng");
    displayAvatar = peer.avatarUrl || `https://i.pravatar.cc/150?u=${peer.email}`;
    subStatus = peer.isOnline ? "● Đang hoạt động" : "Ngoại tuyến";
  }
}

  const getSender = (senderId: string) =>
    conversation.participants.find((p) => p.id === senderId);

  const isOwner = conversation.ownerId === currentUser?.id || conversation.myRole === "owner";
  const isDeputy = conversation.deputyId === currentUser?.id || conversation.myRole === "deputy";
  const isAdmin = isOwner || isDeputy;
  const isReadOnly = conversation.type === "class" && !!conversation.onlyAdminCanMessage && !isAdmin;

  const handleSendMessage = async (
    text: string,
    attachments?: Attachment[],
    replyToId?: string,
  ) => {
    try {
      await onSendMessage(text, attachments, replyToId);
      setReplyingTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (socket && conversation) {
      socket.emit("reactMessage", {
        messageId,
        conversationId: conversation.id,
        emoji,
      });
    }
  };

  /*
  const handleRevoke = (messageId: string) => {
    if (socket && conversation) {
      socket.emit("revokeMessage", {
        messageId,
        conversationId: conversation.id,
      });
    }
  };
  */

  const handleRevokeForAll = (messageId: string) => {
    if (!socket || !conversation) return;

    // Optimistic update

    setLocalMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isRevoked: true } : m)),
    );

    socket.emit("revokeForAll", { messageId, conversationId: conversation.id });

    // Rollback if error

    socket.once("revokeError", (err: { messageId: string; error: string }) => {
      if (err.messageId === messageId) {
        console.warn("[Revoke]", err.error);

        setLocalMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, isRevoked: false } : m,
          ),
        );
      }
    });
  };

  const handleRevokeForMe = (messageId: string) => {
    if (!socket || !conversation || !currentUser) return;

    // Optimistic update

    setLocalMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, revokedFor: [...(m.revokedFor || []), currentUser.id] }
          : m,
      ),
    );

    socket.emit("revokeForMe", { messageId, conversationId: conversation.id });
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-white">
      {renderFullScreenCallOverlay()}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <Image
            src={
              displayAvatar || `https://i.pravatar.cc/150?u=${conversation.id}`
            }
            alt="Avatar"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
          />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {displayName || "Unknown"}
            </h2>
            <p className="text-xs text-slate-500">{subStatus}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          {/* Action Buttons */}
          <div className="flex items-center gap-2 text-slate-400">
            {/* 👇 1. NÚT KẾT BẠN (CHỈ HIỆN Ở CHAT 1-1) 👇 */}
            {conversation.type === "private" && (
              <button
                type="button"
                // Chỉ disable nút khi đang chờ duyệt
                disabled={friendStatus === "pending"}
                onMouseEnter={() => setIsFriendBtnHovered(true)}
                onMouseLeave={() => setIsFriendBtnHovered(false)}
                onClick={async () => {
                  const otherParticipant = conversation.participants.find(
                    (p) => p.id !== currentUser?.id,
                  );
                  if (!otherParticipant) return;

                  if (friendStatus === "friend") {
                    const confirmUnfriend = window.confirm(
                      `Bạn có chắc chắn muốn hủy kết bạn với ${displayName}?`
                    );
                    if (confirmUnfriend) {
                      try {
                        await unfriendApi(otherParticipant.id);
                        setFriendStatus("none");
                        alert("Đã hủy kết bạn thành công.");
                      } catch (error) {
                        console.error("Lỗi khi hủy kết bạn:", error);
                        alert("Không thể hủy kết bạn lúc này. Vui lòng thử lại sau.");
                      }
                    }
                    return;
                  }

                  try {
                    await sendFriendRequestApi(otherParticipant.id);
                    // Gửi thành công thì chuyển sang pending
                    setFriendStatus("pending");
                    alert(
                      `Đã gửi lời mời kết bạn đến ${displayName}! Hãy chờ họ chấp nhận nhé!`,
                    );
                  } catch (error) {
                    console.error("Lỗi gửi kết bạn:", error);
                    const err = error as {
                      response?: { data?: { error?: string } };
                      message?: string;
                    };
                    const errorMsg =
                      err.response?.data?.error ||
                      "Không thể gửi lời mời lúc này!";
                    alert(`Opps: ${errorMsg}`);

                    if (errorMsg.includes("đã gửi")) {
                      setFriendStatus("pending");
                    } else if (errorMsg.includes("đã là bạn")) {
                      setFriendStatus("friend");
                    }
                  }
                }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition mr-2 ${
                  friendStatus === "friend"
                    ? isFriendBtnHovered
                      ? "bg-rose-50 text-rose-600 cursor-pointer" // Hủy kết bạn khi hover (Đỏ nhạt)
                      : "bg-emerald-50 text-emerald-600 cursor-pointer" // Bạn bè (Xanh ngọc)
                    : friendStatus === "pending"
                      ? "bg-slate-100 text-slate-500 cursor-not-allowed" // Đã gửi (Xám)
                      : "bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white cursor-pointer" // Chưa gửi (Xanh dương)
                }`}
                title={
                  friendStatus === "friend"
                    ? isFriendBtnHovered
                      ? "Hủy kết bạn"
                      : "Hai bạn đã là bạn bè"
                    : friendStatus === "pending"
                      ? "Đã gửi lời mời"
                      : "Gửi lời mời kết bạn"
                }
              >
                {friendStatus === "friend" ? (
                  isFriendBtnHovered ? (
                    <>
                      <X size={18} />{" "}
                      <span className="hidden sm:inline">Hủy kết bạn</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={18} />{" "}
                      <span className="hidden sm:inline">Bạn bè</span>
                    </>
                  )
                ) : friendStatus === "pending" ? (
                  <>
                    <Check size={18} />{" "}
                    <span className="hidden sm:inline">Đã gửi lời mời</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />{" "}
                    <span className="hidden sm:inline">Kết bạn</span>
                  </>
                )}
              </button>
            )}

            {/* 👇 2. NÚT THÊM THÀNH VIÊN (CHỈ HIỆN Ở CHAT NHÓM) 👇 */}
            {conversation.type === "class" && (
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(true)}
                className="rounded-full p-2 transition-colors hover:bg-slate-100 hover:text-blue-500"
                title="Thêm thành viên"
              >
                <UserPlus size={20} />
              </button>
            )}

            {/* 👇 CÁC NÚT GỌI ĐIỆN, INFO GIỮ NGUYÊN 👇 */}
            <button
              type="button"
              onClick={onStartAudioCall}
              disabled={!canStartAudioCall}
              className="rounded-full p-2 transition-colors hover:bg-slate-100 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              title={
                canStartAudioCall
                  ? "Gọi thoại 1-1"
                  : "Chỉ hỗ trợ gọi trong đoạn chat private"
              }
            >
              <Phone size={20} />
            </button>

            <button
              type="button"
              onClick={onStartVideoCall}
              disabled={!canStartVideoCall}
              className="rounded-full p-2 transition-colors hover:bg-slate-100 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              title={
                canStartVideoCall
                  ? "Gọi video 1-1"
                  : "Chỉ hỗ trợ gọi trong đoạn chat private"
              }
            >
              <Video size={20} />
            </button>

            {/* Info Button - Mở Sidebar */}
            <button
              type="button"
              onClick={() => setIsInfoSidebarOpen(!isInfoSidebarOpen)}
              className={`rounded-full p-2 transition-colors ${isInfoSidebarOpen
                ? "bg-blue-100 text-blue-500"
                : "hover:bg-slate-100 hover:text-blue-500"
                }`}
              title="Thông tin hội thoại"
            >
              <Info size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden flex-row">
        {/* Left column: Chat content */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          {renderVideoCallPanel()}

          <div className="flex-1 overflow-y-auto bg-linear-to-b from-slate-50 to-white p-4">
            {isLoadingMessages ? (
              <div className="flex h-full items-center justify-center gap-2 text-slate-400">
                <RefreshCw size={16} className="animate-spin" />
                <span className="text-sm">Đang tải tin nhắn...</span>
              </div>
            ) : timelineMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Hãy là người đầu tiên gửi tin nhắn! 👋
              </div>
            ) : (
              timelineMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwnMessage={msg.senderId === currentUser?.id}
                  currentUserId={currentUser?.id}
                  sender={getSender(msg.senderId)}
                  onReply={setReplyingTo}
                  onReact={handleReact}
                  onRevokeForAll={handleRevokeForAll}
                  onRevokeForMe={handleRevokeForMe}
                  onForward={onForwardMessage}
                  onOpenProfile={onOpenProfile}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ==================== TYPING INDICATOR ==================== */}
          {(() => {
            const activeTypingUsers = Array.from(typingUsers).filter(
              (userId) =>
                userId !== currentUser?.id &&
                userId !== currentUser?._id,
            );

            if (activeTypingUsers.length === 0) return null;

            return (
              <div
                className="px-4 py-2 text-xs font-medium flex items-center gap-1 bg-white/80 backdrop-blur-sm border-t border-slate-100"
                style={{ color: "#072D84" }}
              >
                <span>
                  {activeTypingUsers
                    .map((userId) => {
                      const typingUser = conversation?.participants?.find(
                        (p) => p.id === userId || p._id === userId,
                      );
                      return typingUser?.name || userId;
                    })
                    .join(", ")}
                </span>

                <span>đang soạn tin nhắn</span>

              <span className="flex items-end ml-1" style={{ gap: "3px" }}>
                {[0, 0.15, 0.3].map((delay, i) => (
                  <span
                    key={i}
                    style={{
                      width: "4px",
                      height: "4px",
                      backgroundColor: "#7C3AED",
                      borderRadius: "9999px",
                      display: "inline-block",
                      animation: `wave 1.2s ease-in-out infinite`,
                      animationDelay: `${delay}s`,
                    }}
                  />
                ))}
              </span>

              {/* Inject keyframes */}
              <style>
                {`
                @keyframes wave {
                  0%, 60%, 100% {
                    transform: translateY(0);
                    opacity: 0.6;
                  }
                  30% {
                    transform: translateY(-5px);
                    opacity: 1;
                  }
                }
              `}
              </style>
            </div>
          );
        })()}

          {/* ==================== MESSAGE INPUT ==================== */}
          <MessageInput
            onSendMessage={handleSendMessage}
            isSending={isSending}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            socket={socket}
            conversationId={conversation?.id}
            isReadOnly={isReadOnly}
          />
        </div>

        {/* Right column: Info Sidebar */}
        {isInfoSidebarOpen && (
          <div className="w-80 shrink-0 border-l border-slate-200 overflow-y-auto bg-white">
            <ConversationInfoSidebar
              conversationId={conversation.id}
              isOpen={isInfoSidebarOpen}
              onClose={() => setIsInfoSidebarOpen(false)}
              onOpenGroupManage={onOpenGroupManage}
              conversationType={conversation.type}
              refreshSignal={onConversationInfoRefreshTick}
              currentUserId={currentUser?.id}
            />
          </div>
        )}
      </div>

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onAddMember={handleAddMember}
        existingMemberIds={conversation.participants.flatMap((p) => [p.id, (p as User & { _id?: string })._id, p.email]).filter(Boolean) as string[]}
        suggestedUsers={suggestedUsers} // 🚀 Đã truyền dữ liệu gợi ý vào đây
      />
    </div>
  );
};