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
  Share2,
  UserCheck,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import Image from "next/image";
import { Socket } from "socket.io-client";
import ConversationInfoSidebar from "@/shared/components/ConversationInfoSidebar";
import { AddMemberModal } from "./AddMemberModal";
import { requestOrAddGroupMember, sendFriendRequestApi } from "../chatApi";

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
  isLoadingCallHistory: _isLoadingCallHistory = false,
  callHistoryPage: _callHistoryPage = 1,
  callHistoryTotalPages: _callHistoryTotalPages = 1,
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
        return "Da goi";
      case "declined":
        return "Bi tu choi";
      case "unavailable":
        return "Khong lien lac duoc";
      case "failed":
        return "Loi ket noi";
      case "ringing":
        return "Dang do chuong";
      default:
        return item.status;
    }
  };

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const handleAddMember = async (email: string) => {
    if (conversation) {
      await requestOrAddGroupMember(conversation.id, { email });
      alert("Đã gửi lời mời / Thêm thành viên thành công!");
    }
  };
  const [friendStatus, setFriendStatus] = useState<
    "none" | "pending" | "friend"
  >("none");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
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
          label: `Cuoc goi ${formatCallStatus(item).toLowerCase()}`,
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

    setFriendStatus(finalStatus);
  }, [conversation, currentUser]);

  // Update local messages when messages prop changes
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  useEffect(() => {
    const currentRefs = remoteVideoRefs.current;
    remoteStreamsList.forEach(([userId, stream]) => {
      const el = currentRefs.get(userId);
      if (!el) return;

      if (el.srcObject !== stream) {
        el.srcObject = stream;
      }

      // Mute first so browser allows autoplay (autoplay policy blocks unmuted video)
      // then unmute immediately after playback starts
      el.muted = true;
      const tryPlay = () => {
        el.play()
          .then(() => {
            el.muted = false;
          })
          .catch((err) => {
            console.warn("[ChatWindow] Remote play failed:", err);
          });
      };

      if (el.readyState >= 2) {
        tryPlay();
      } else {
        el.oncanplay = tryPlay;
      }
    });

    return () => {
      currentRefs.forEach((el) => {
        el.oncanplay = null;
      });
    };
  }, [remoteStreamsList]);

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
    const callTypeLabel = currentCallType === "audio" ? "am thanh" : "video";

    switch (callStatus) {
      case "calling":
        return `Dang goi ${callTypeLabel}... cho doi phuong chap nhan`;
      case "receiving":
        return `Ban co cuoc goi ${callTypeLabel} den`;
      case "connected":
        return `Da ket noi ${callTypeLabel}`;
      default:
        return "San sang";
    }
  }, [activeCall, callStatus, incomingCall]);

  const incomingCallerName =
    incomingCaller?.name || incomingCall?.fromUserId || "Nguoi dung";
  const incomingCallTypeLabel = incomingCall?.callType === "audio" ? "am thanh" : "video";
  const activeCallTypeLabel = activeCall?.callType === "audio" ? "am thanh" : "video";
  const showFullScreenCall =
    callStatus !== "idle" ||
    Boolean(localStream) ||
    remoteStreamsList.length > 0;
  const showInlineCallPanel = !showFullScreenCall && Boolean(callError);

  const renderFullScreenCallOverlay = () => {
    if (!showFullScreenCall) {
      return null;
    }

    const callTitle = conversation?.name || incomingCallerName || "Cuoc goi";
    const isOneOnOne = remoteStreamsList.length <= 1;

    // Responsive grid for group: 1→full, 2→2col, 3-4→2col, 5+→3col
    const gridCols =
      remoteStreamsList.length <= 1
        ? "grid-cols-1"
        : remoteStreamsList.length <= 4
          ? "grid-cols-2"
          : "grid-cols-3";

    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-hidden text-white">
        {/* Background */}
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.18),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(14,116,144,0.15),transparent_50%)]" />

        {/* Content wrapper — takes full height, never overflows */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          {/* ── Header ── */}
          <div className="flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-widest text-slate-400">
                  Cuoc goi {incomingCallTypeLabel === "am thanh" ? "am thanh" : activeCallTypeLabel}
                </p>
                <h2 className="truncate text-base font-semibold leading-tight text-white sm:text-lg">
                  {callTitle}
                </h2>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[11px] text-slate-400">{callStatusLabel}</p>
            </div>
          </div>

          {/* ── Error banner ── */}
          {callError && (
            <div className="mx-4 mb-2 shrink-0 rounded-xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-100 sm:mx-6">
              <div className="flex items-start justify-between gap-2">
                <p className="flex-1">{callError}</p>
                {onClearCallError && (
                  <button
                    type="button"
                    onClick={onClearCallError}
                    className="shrink-0 rounded-full p-1 hover:bg-white/10"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              {onRetryMediaPermission && (
                <button
                  type="button"
                  onClick={() => void onRetryMediaPermission()}
                  className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-rose-200/40 px-2.5 py-1 text-[11px] font-semibold hover:bg-rose-500/20"
                >
                  <RefreshCw size={11} /> Xin quyen lai
                </button>
              )}
            </div>
          )}

          {/* ── Main area — flex-1 with min-h-0 to stay within bounds ── */}
          {incomingCall && callStatus === ("receiving" as VideoCallStatus) ? (
            /* Incoming call screen */
            <div className="flex flex-1 items-center justify-center p-6">
              <div className="w-full max-w-sm rounded-3xl border border-emerald-400/30 bg-emerald-500/10 px-6 py-8 text-center backdrop-blur-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20 ring-4 ring-emerald-400/30">
                  <Video size={28} className="text-emerald-300" />
                </div>
                <p className="text-xs uppercase tracking-widest text-emerald-300">
                  Cuoc goi den
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {incomingCallerName} dang goi {incomingCallTypeLabel} cho ban
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onDeclineIncomingCall}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/80 transition hover:bg-rose-500"
                    title="Tu choi"
                  >
                    <PhoneOff size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={onAcceptIncomingCall}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 transition hover:bg-emerald-300"
                    title="Chap nhan"
                  >
                    <Phone size={20} className="text-emerald-950" />
                  </button>
                </div>
              </div>
            </div>
          ) : isOneOnOne ? (
            /* ── 1-1 Layout: remote fills entire area, local is PiP ── */
            <div className="relative min-h-0 flex-1">
              {/* Remote — full bleed */}
                {remoteStreamsList.length > 0 ? (
                (() => {
                  const [userId, stream] = remoteStreamsList[0]!;

                  const hasVideo = stream.getVideoTracks().length > 0;
                  const hasAudio = stream.getAudioTracks().length > 0;

                  // If stream has no video but has audio (audio-only call), render an <audio>
                  if (!hasVideo && hasAudio) {
                    return (
                      <audio
                        key={userId}
                        ref={(el) => {
                          if (!el) return;
                          if (el.srcObject !== stream) el.srcObject = stream;
                          // Start muted to satisfy autoplay policies, then unmute after play
                          el.muted = true;
                          el.play()
                            .then(() => {
                              try {
                                el.muted = false;
                              } catch (e) {
                                // ignore
                              }
                            })
                            .catch((err) => {
                              console.warn("[ChatWindow] Remote audio play failed:", err);
                            });
                        }}
                        autoPlay
                        controls={false}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    );
                  }

                  return (
                    <video
                      key={userId}
                      ref={(el) => {
                        if (!el) return;
                        remoteVideoRefs.current.set(userId, el);
                        if (el.srcObject !== stream) el.srcObject = stream;
                        el.muted = true;
                        const tryPlay = () => {
                          if (!el) return;
                          el.play()
                            .then(() => {
                              el.muted = false;
                            })
                            .catch(() => {});
                        };
                        el.play()
                          .then(() => {
                            el.muted = false;
                          })
                          .catch(() => {
                            el.oncanplay = tryPlay;
                          });
                      }}
                      autoPlay
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  );
                })()
              ) : (
                /* Waiting placeholder */
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-300">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                    <Users size={36} className="opacity-40" />
                  </div>
                  <p className="text-sm tracking-wide text-slate-400">
                    Dang ket noi...
                  </p>
                </div>
              )}

              {/* Local PiP — bottom-right corner, responsive size */}
              <div
                className="absolute bottom-4 right-4 z-20 overflow-hidden rounded-2xl border border-white/20 bg-black shadow-2xl
                              w-28 sm:w-36 md:w-44"
              >
                <video
                  ref={(el) => {
                    if (!el) return;
                    if (el.srcObject !== localStream)
                      el.srcObject = localStream;
                    if (localStream) el.play().catch(() => {});
                  }}
                  autoPlay
                  muted
                  playsInline
                  className="aspect-video w-full object-cover"
                />
                {(!localStream || !isCameraEnabled) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 text-[10px] text-slate-300">
                    {isCameraEnabled ? "Dang tai..." : "Camera tat"}
                  </div>
                )}
                <div className="absolute bottom-1 left-2 text-[10px] text-white/70">
                  Ban
                </div>
              </div>
            </div>
          ) : (
            /* ── Group Layout: grid + local tile ── */
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 sm:px-4">
              <div
                className={`grid ${gridCols} auto-rows-fr gap-2 sm:gap-3`}
                style={{ minHeight: 0 }}
              >
                {/* Remote tiles */}
                {remoteStreamsList.map(([userId, stream]) => (
                  <div
                    key={userId}
                    className="relative overflow-hidden rounded-2xl bg-slate-800 ring-1 ring-white/10"
                    style={{ aspectRatio: "16/9" }}
                  >
                    <video
                      ref={(el) => {
                        if (!el) return;
                        remoteVideoRefs.current.set(userId, el);
                        if (el.srcObject !== stream) el.srcObject = stream;
                        el.muted = true;
                        el.play()
                          .then(() => {
                            el.muted = false;
                          })
                          .catch(() => {
                            el.oncanplay = () => {
                              el.play()
                                .then(() => {
                                  el.muted = false;
                                })
                                .catch(() => {});
                            };
                          });
                      }}
                      autoPlay
                      playsInline
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                      {userId.slice(-6)}
                    </div>
                  </div>
                ))}

                {/* Local tile in grid */}
                <div
                  className="relative overflow-hidden rounded-2xl bg-slate-800 ring-1 ring-white/10"
                  style={{ aspectRatio: "16/9" }}
                >
                  <video
                    ref={(el) => {
                      if (!el) return;
                      if (el.srcObject !== localStream)
                        el.srcObject = localStream;
                      if (localStream) el.play().catch(() => {});
                    }}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  {(!localStream || !isCameraEnabled) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-xs text-slate-300">
                      {isCameraEnabled ? "Dang tai..." : "Camera tat"}
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                    Ban
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Controls bar — always at bottom, never overlaps ── */}
          <div className="shrink-0 px-4 pb-safe-bottom">
            <div className="flex items-center justify-center gap-2 py-4 sm:gap-3">
              {/* Mic */}
              <button
                type="button"
                onClick={onToggleMicrophone}
                disabled={!localStream}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isMicrophoneEnabled
                    ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
                    : "border-rose-400/60 bg-rose-500/30 text-rose-200"
                }`}
                title={isMicrophoneEnabled ? "Tat micro" : "Bat micro"}
              >
                {isMicrophoneEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              {/* Camera */}
              <button
                type="button"
                onClick={onToggleCamera}
                disabled={!localStream}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isCameraEnabled
                    ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
                    : "border-rose-400/60 bg-rose-500/30 text-rose-200"
                }`}
                title={isCameraEnabled ? "Tat camera" : "Bat camera"}
              >
                {isCameraEnabled ? (
                  <Camera size={18} />
                ) : (
                  <CameraOff size={18} />
                )}
              </button>

              {/* Screen share */}
              <button
                type="button"
                onClick={onToggleScreenShare}
                disabled={!localStream}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  isScreenSharing
                    ? "border-sky-300/60 bg-sky-500/30 text-sky-200"
                    : "border-white/25 bg-white/10 text-white hover:bg-white/20"
                }`}
                title={isScreenSharing ? "Dung chia se" : "Chia se man hinh"}
              >
                <Share2 size={18} />
              </button>

              {/* End call */}
              {(activeCall || callStatus !== "idle") && (
                <button
                  type="button"
                  onClick={() => onEndVideoCall?.()}
                  className="flex h-12 items-center gap-2 rounded-full bg-rose-600 px-5 font-semibold transition hover:bg-rose-500 active:scale-95"
                >
                  <PhoneOff size={16} />
                  <span className="text-sm">Ket thuc</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
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
              {incomingCallerName} dang goi {incomingCallTypeLabel} cho ban
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
                    if (remoteStream) el.play().catch(() => {});
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
                    if (localStream) el.play().catch(() => {});
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
                      ? "Dang khoi tao camera..."
                      : "Ban da tat camera"}
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
  let displayName = conversation.name;
  let displayAvatar = conversation.avatarUrl;
  let subStatus =
    conversation.type === "class"
      ? `${conversation.participants.length} thành viên`
      : "Đang hoạt động";

  if (conversation.type === "private" && currentUser) {
    const otherParticipant = conversation.participants.find(
      (p) => p.id !== currentUser.id,
    );
    if (otherParticipant) {
      displayName = otherParticipant.name;
      displayAvatar = otherParticipant.avatarUrl;
      subStatus = otherParticipant.isOnline ? "Đang hoạt động" : "Ngoại tuyến";
    }
  }

  const getSender = (senderId: string) =>
    conversation.participants.find((p) => p.id === senderId);

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
                // Disable nút nếu đã là bạn hoặc đã gửi lời mời
                disabled={friendStatus !== "none"}
                onClick={async () => {
                  const otherParticipant = conversation.participants.find(
                    (p) => p.id !== currentUser?.id,
                  );
                  if (!otherParticipant) return;

                  try {
                    await sendFriendRequestApi(otherParticipant.id);
                    // Gửi thành công thì chuyển sang pending
                    setFriendStatus("pending");
                    alert(
                      `Đã gửi lời mời kết bạn đến ${otherParticipant.name}! 🚀`,
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
                    ? "bg-emerald-50 text-emerald-600 cursor-default" // Bạn bè (Xanh ngọc)
                    : friendStatus === "pending"
                      ? "bg-slate-100 text-slate-500 cursor-not-allowed" // Đã gửi (Xám)
                      : "bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white" // Chưa gửi (Xanh dương)
                }`}
                title={
                  friendStatus === "friend"
                    ? "Hai bạn đã là bạn bè"
                    : friendStatus === "pending"
                      ? "Đã gửi lời mời"
                      : "Gửi lời mời kết bạn"
                }
              >
                {friendStatus === "friend" ? (
                  <>
                    <UserCheck size={18} />{" "}
                    <span className="hidden sm:inline">Bạn bè</span>
                  </>
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
              className={`rounded-full p-2 transition-colors ${
                isInfoSidebarOpen
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
          {typingUsers && typingUsers.size > 0 && (
            <div
              className="px-4 py-2 text-xs font-medium flex items-center gap-1 bg-white/80 backdrop-blur-sm border-t border-slate-100"
              style={{ color: "#072D84" }}
            >
              <span>
                {Array.from(typingUsers)
                  .map((userId) => {
                    const typingUser = conversation?.participants?.find(
                      (p) => p.id === userId,
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
          )}

          {/* ==================== MESSAGE INPUT ==================== */}
          <MessageInput
            onSendMessage={handleSendMessage}
            isSending={isSending}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            socket={socket}
            conversationId={conversation?.id}
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
            />
          </div>
        )}
      </div>

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        onAddMember={handleAddMember}
        existingMemberIds={conversation.participants.map((p) => p.id)}
      />
    </div>
  );
};
