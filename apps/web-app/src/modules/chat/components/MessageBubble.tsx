"use client";
import React, { useEffect, useState, useRef } from "react";
import { Message, User } from "../types";
import { LinkPreviewCard } from "./LinkPreviewCard";
import Image from "next/image";
import { SafeHtml } from "@/shared/utils/security";

import {
  MoreVertical,
  Reply,
  Trash2,
  EyeOff,
  Smile,
  Clock,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  ChevronRight,
} from "lucide-react";

/** Giới hạn thời gian cho phép thu hồi với tất cả - 15 phút */
const REVOKE_FOR_ALL_LIMIT_MS = 15 * 60 * 1000;

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  currentUserId?: string;
  sender?: User;
  onReply?: (message: Message) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRevokeForAll?: (messageId: string) => void;
  onRevokeForMe?: (messageId: string) => void;
  onForward?: (message: Message) => void;
  onOpenProfile?: (user: User) => void;
  /** @deprecated Dùng onRevokeForAll thay thế */
  onRevoke?: (messageId: string) => void;
  onStartAudioCall?: () => void;
  onStartVideoCall?: () => void;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

type CallMessageMeta = {
  callType?: "video" | "audio";
  status?: string;
  durationSec?: number;
  label?: string;
};

const CALL_MARKER_PATTERN = /^(\[call(?:_log)?\]|call_log:|call:|system_call:)/i;


const parseCallMessage = (content: string, sender?: User): CallMessageMeta | null => {
  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  const hasExplicitMarker = CALL_MARKER_PATTERN.test(trimmed);
  const shouldHeuristicParse = hasExplicitMarker || !sender;
  if (!shouldHeuristicParse) {
    return null;
  }

  const stripped = trimmed.replace(CALL_MARKER_PATTERN, "").trim();

  if (stripped.startsWith("{")) {
    try {
      const parsed = JSON.parse(stripped) as {
        type?: string;
        callType?: string;
        status?: string;
        durationSec?: number;
        label?: string;
      };

      if (parsed?.type?.includes("call") || parsed?.callType || parsed?.status) {
        return {
          callType:
            parsed.callType === "audio" || parsed.callType === "video"
              ? parsed.callType
              : "video",
          status: parsed.status,
          durationSec: parsed.durationSec,
          label: parsed.label,
        };
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  const durationMatch = stripped.match(/duration(?:sec)?\s*=?\s*(\d+)/i);
  const statusMatch = stripped.match(
    /\b(ringing|connected|ended|declined|unavailable|failed|missed)\b/i,
  );
  const callTypeMatch = stripped.match(/\b(audio|video)\b/i);

  if (durationMatch || statusMatch || callTypeMatch || /cuoc goi|call/i.test(stripped)) {
    return {
      callType: callTypeMatch?.[1]?.toLowerCase() === "audio" ? "audio" : "video",
      status: statusMatch?.[1]?.toLowerCase(),
      durationSec: durationMatch ? Number(durationMatch[1]) : undefined,
      label: /cuoc goi|call/i.test(stripped) ? stripped : undefined,
    };
  }

  return null;
};



const getCallLogDetails = (
  callMeta: CallMessageMeta,
  isOwnMessage: boolean
) => {
  const isVideo = callMeta.callType === 'video';
  const isMissed = ['declined', 'unavailable', 'failed', 'ringing', 'missed'].includes(callMeta.status || '') || 
                   (!isOwnMessage && callMeta.status === 'ended' && !callMeta.durationSec);
  
  // Duration formatting
  let durationStr = '';
  if (callMeta.durationSec && callMeta.durationSec > 0) {
    const mins = Math.floor(callMeta.durationSec / 60);
    const secs = callMeta.durationSec % 60;
    durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  let statusLabel = '';
  let title = '';

  if (isOwnMessage) {
    title = isVideo ? 'Cuộc gọi video đi' : 'Cuộc gọi thoại đi';
    if (callMeta.status === 'connected' || callMeta.status === 'ended') {
      statusLabel = durationStr ? `Đã kết nối (${durationStr})` : 'Đã kết nối';
    } else if (callMeta.status === 'declined') {
      statusLabel = 'Bị từ chối';
    } else if (callMeta.status === 'unavailable' || callMeta.status === 'no_answer') {
      statusLabel = 'Không nhấc máy';
    } else {
      statusLabel = 'Cuộc gọi thất bại';
    }
  } else {
    if (isMissed) {
      title = isVideo ? 'Cuộc gọi video nhỡ' : 'Cuộc gọi nhỡ';
      statusLabel = 'Nhấn để gọi lại';
    } else {
      title = isVideo ? 'Cuộc gọi video đến' : 'Cuộc gọi thoại đến';
      statusLabel = durationStr ? `Đã nhận (${durationStr})` : 'Đã kết nối';
    }
  }

  return {
    title,
    statusLabel,
    isMissed,
    isVideo,
  };
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  currentUserId,
  sender,
  onReply,
  onReact,
  onRevokeForAll,
  onRevokeForMe,
  onForward,
  onOpenProfile,
  onRevoke,
  onStartAudioCall,
  onStartVideoCall,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [now, setNow] = useState(0);

  const isMentionedMe = React.useMemo(() => {
    if (isOwnMessage || !currentUserId || !message.mentions) return false;
    return message.mentions.some(
      (m) => m.id === currentUserId || (m as unknown as { _id?: string })._id === currentUserId
    );
  }, [message.mentions, isOwnMessage, currentUserId]);

  const highlightedContent = React.useMemo(() => {
    let content = message.content;
    if (!content) return "";

    if (message.mentions && message.mentions.length > 0) {
      message.mentions.forEach((mentionUser) => {
        const mentionName = mentionUser.name || (mentionUser as unknown as { fullName?: string }).fullName;
        if (mentionName) {
          const escapedName = mentionName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          const regex = new RegExp(`@${escapedName}\\b`, 'g');
          
          const highlightClass = isOwnMessage
            ? "text-blue-100 font-bold bg-blue-800/40 px-1.5 py-0.5 rounded-md inline-block"
            : "text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded-md inline-block";

          content = content.replace(
            regex,
            `<span class="${highlightClass}">@${mentionName}</span>`
          );
        }
      });
    }
    return content;
  }, [message.content, message.mentions, isOwnMessage]);

  const menuRef = useRef<HTMLDivElement>(null);
  const isLong = (message.content?.length ?? 0) > 30 || 
                 (message.attachments && message.attachments.length > 0) || 
                 !!message.linkPreview || 
                 !!message.replyTo;
  const [menuAlign, setMenuAlign] = useState<"left" | "right">(
    isOwnMessage || isLong ? "right" : "left"
  );

  useEffect(() => {
    if (showMenu) {
      const defaultAlign = isOwnMessage || isLong ? "right" : "left";
      setMenuAlign(defaultAlign);
      
      const timer = setTimeout(() => {
        if (menuRef.current) {
          const rect = menuRef.current.getBoundingClientRect();
          if (rect.left < 8) {
            setMenuAlign("left");
          } else if (rect.right > window.innerWidth - 8) {
            setMenuAlign("right");
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [showMenu, isOwnMessage, isLong]);

  // Cập nhật thời gian hiện tại mỗi phút
  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    const initialTimerId = window.setTimeout(updateNow, 0);
    const timerId = window.setInterval(updateNow, 60_000);

    return () => {
      window.clearTimeout(initialTimerId);
      window.clearInterval(timerId);
    };
  }, []);

  const formatTime = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isImage = (fileType: string) => fileType.startsWith("image/");
  const isVideo = (fileType: string) => fileType.startsWith("video/");

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".pdf")) return "📄";
    if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) return "📃";
    if (fileName.endsWith(".xls") || fileName.endsWith(".xlsx")) return "📊";
    if (fileName.endsWith(".zip")) return "🗜️";
    return "📎";
  };

  const handleEmojiSelect = (emoji: string) => {
    onReact?.(message.id, emoji);
    setShowEmojiPicker(false);
  };

  // Kiểm tra thời gian thu hồi
  const ageMs = now - new Date(message.createdAt).getTime();
  const canRevokeForAll = isOwnMessage && ageMs <= REVOKE_FOR_ALL_LIMIT_MS;
  const remainingMinutes = Math.max(
    0,
    Math.ceil((REVOKE_FOR_ALL_LIMIT_MS - ageMs) / 60000),
  );

  // Kiểm tra tin nhắn đã bị ẩn với mình chưa
  const isSelfRevoked =
    message.revokedFor?.includes("__self__") ||
    (currentUserId != null && message.revokedFor?.includes(currentUserId));

  // Nếu người dùng chọn "Ẩn với chỉ mình tôi" → không hiển thị tin nhắn
  if (isSelfRevoked) {
    return null;
  }

  // Render system messages
  if (message.type === "system") {
    return (
      <div className="flex w-full justify-center my-3 select-none">
        <div className="rounded-full bg-slate-100/70 border border-slate-200/50 px-4 py-1 text-center text-xs text-slate-500 font-medium max-w-[80%] shadow-2xs">
          {message.content}
        </div>
      </div>
    );
  }

  // Render avatar người gửi (không own message)
  const renderSenderAvatar = () => {
    if (!sender?.avatarUrl) return null;
    return (
      <button
        type="button"
        onClick={() => onOpenProfile?.(sender)}
        className="mr-2 mt-auto shrink-0 cursor-pointer"
      >
        <Image
          src={sender.avatarUrl}
          alt={sender.name}
          width={32}
          height={32}
          className="h-8 w-8 rounded-full ring-1 ring-slate-200"
        />
      </button>
    );
  };

  const renderSenderName = () => {
    if (!sender) return null;
    return (
      <span className="mb-1 ml-1 text-xs text-slate-500">{sender.name}</span>
    );
  };

  // ==================== THU HỒI CHO MỌI NGƯỜI ====================
  if (message.isRevoked) {
    return (
      <div
        className={`mb-4 flex w-full ${
          isOwnMessage ? "justify-end" : "justify-start"
        }`}
      >
        {!isOwnMessage && renderSenderAvatar()}

        <div
          className={`flex max-w-[70%] flex-col ${
            isOwnMessage ? "items-end" : "items-start"
          }`}
        >
          {!isOwnMessage && renderSenderName()}

          <div
            className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 italic text-slate-400 ${
              isOwnMessage
                ? "rounded-br-sm bg-slate-200"
                : "rounded-bl-sm bg-slate-100"
            }`}
          >
            <Trash2 size={12} />
            <p className="text-sm">Tin nhắn đã bị thu hồi</p>
          </div>
        </div>
      </div>
    );
  }

  const callMeta = parseCallMessage(message.content, sender);

  // ==================== TIN NHẮN BÌNH THƯỜNG / CUỘC GỌI ====================
  return (
    <div
      className={`group mb-4 flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}
    >
      {/* Avatar người gửi */}
      {!isOwnMessage && renderSenderAvatar()}

      <div
        className={`flex max-w-[70%] flex-col ${isOwnMessage ? "items-end" : "items-start"}`}
      >
        {!isOwnMessage && renderSenderName()}

        {/* Reply preview */}
        {message.replyTo && (
          <div className="mb-2 max-w-full rounded-xl border-l-2 border-blue-500 bg-slate-100 px-3 py-2 text-xs">
            <p className="mb-1 text-slate-500">Trả lời</p>
            <p className="truncate text-slate-700">
              {message.replyTo.isRevoked
                ? "Tin nhắn đã bị thu hồi"
                : (message.replyTo.content || "(Tin nhắn trống)").substring(
                    0,
                    100,
                  )}
            </p>
          </div>
        )}

        {/* Forward indicator */}
        {message.isForwarded && (
          <div className="mb-1 flex items-center gap-1 text-[11px] text-slate-500 italic">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 17 20 12 15 7"></polyline>
              <path d="M4 18v-2a4 4 0 0 1 4-4h12"></path>
            </svg>
            Tin nhắn chuyển tiếp
          </div>
        )}

        {/* Nội dung tin nhắn chính hoặc thẻ cuộc gọi */}
        {callMeta ? (
          (() => {
            const details = getCallLogDetails(callMeta, isOwnMessage);
            return (
              <div
                onClick={() => {
                  if (callMeta.callType === "video" && onStartVideoCall) {
                    onStartVideoCall();
                  } else if (onStartAudioCall) {
                    onStartAudioCall();
                  }
                }}
                className={`w-60 rounded-2xl p-3 border transition-all cursor-pointer select-none shadow-xs ${
                  isOwnMessage
                    ? "rounded-br-sm bg-blue-50/70 border-blue-200 hover:bg-blue-50"
                    : "rounded-bl-sm bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      details.isMissed
                        ? "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
                        : details.isVideo
                          ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100"
                          : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                    }`}
                  >
                    {details.isMissed ? (
                      details.isVideo ? <VideoOff size={16} /> : <PhoneOff size={16} />
                    ) : (
                      details.isVideo ? <Video size={16} /> : <Phone size={16} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[13px] font-bold leading-tight ${
                        details.isMissed ? "text-rose-600" : "text-slate-800"
                      }`}
                    >
                      {details.title}
                    </p>
                    <p className="truncate text-[11px] text-slate-500 mt-1">
                      {details.statusLabel}
                    </p>
                  </div>
                </div>
                
                <div className={`my-2 h-[1px] ${isOwnMessage ? "bg-blue-100" : "bg-slate-100"}`} />
                
                <div className="flex items-center justify-center gap-0.5 pt-0.5 text-blue-600 hover:text-blue-700 transition-colors">
                  <span className="text-xs font-semibold">
                    {details.isMissed ? "Gọi lại ngay" : "Gọi lại"}
                  </span>
                  <ChevronRight size={13} strokeWidth={2.5} />
                </div>
              </div>
            );
          })()
        ) : (
          <div
            className={`w-full max-w-full rounded-2xl px-4 py-2 transition-all duration-150 ${
              isOwnMessage
                ? "rounded-br-sm bg-blue-600 text-white"
                : isMentionedMe
                  ? "rounded-bl-sm bg-amber-50/70 text-slate-900 shadow-xs ring-1 ring-amber-200 border-l-4 border-amber-500"
                  : "rounded-bl-sm bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
            }`}
          >
            <SafeHtml html={highlightedContent} className="text-sm whitespace-pre-wrap" />

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {message.attachments.map((attachment, idx) => (
                  <div key={idx}>
                    {isImage(attachment.fileType) ? (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Image
                          src={attachment.url}
                          alt={attachment.fileName}
                          width={280}
                          height={280}
                          className="max-h-75 max-w-70 rounded-lg object-cover"
                        />
                      </a>
                    ) : isVideo(attachment.fileType) ? (
                      <video
                        controls
                        className="max-h-75 max-w-75 rounded-lg bg-black"
                      >
                        <source src={attachment.url} type={attachment.fileType} />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-slate-50 px-2 py-1 text-sm text-slate-700 hover:underline"
                      >
                        <span>{getFileIcon(attachment.fileName)}</span>
                        <span className="truncate">{attachment.fileName}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Link Preview */}
            {message.linkPreview && (
              <LinkPreviewCard
                linkPreview={message.linkPreview}
                isOwnMessage={isOwnMessage}
              />
            )}
          </div>
        )}

        {/* Thời gian + Reactions */}
        <div className="mt-1 flex items-center gap-2">
          <span className="mx-1 text-[10px] text-slate-400">
            {formatTime(message.createdAt)}
          </span>

          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Array.from(
                new Map(message.reactions.map((r) => [r.emoji, r])).values(),
              ).map((reaction) => {
                const count = message.reactions!.filter(
                  (r) => r.emoji === reaction.emoji,
                ).length;
                return (
                  <div
                    key={reaction.emoji}
                    className="flex cursor-pointer items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs transition-colors hover:bg-slate-300"
                  >
                    <span>{reaction.emoji}</span>
                    {count > 1 && <span className="text-slate-600">{count}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Menu Button */}
      <div className="relative ml-2 self-start">
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className="rounded-full p-1 opacity-0 transition-all hover:bg-slate-200 group-hover:opacity-100"
        >
          <MoreVertical size={16} className="text-slate-400" />
        </button>

        {/* Context Menu */}
        {showMenu && (
          <div
            ref={menuRef}
            className={`absolute ${menuAlign === "right" ? "right-0" : "left-0"} top-full z-20 mt-1 min-w-55 rounded-xl border border-slate-200 bg-white py-1 shadow-lg`}
          >
            {/* Phản ứng */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-slate-100"
            >
              <Smile size={18} />
              Phản ứng
            </button>

            {showEmojiPicker && (
              <div className="flex gap-1 border-t border-slate-200 px-4 py-2">
                {EMOJI_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="rounded-lg p-2 text-2xl hover:bg-slate-100 active:scale-90 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Trả lời */}
            <button
              type="button"
              onClick={() => {
                onReply?.(message);
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-2 text-left text-sm hover:bg-slate-100"
            >
              <Reply size={18} />
              Trả lời
            </button>

            {/* Chuyển tiếp */}
            {onForward && (
              <button
                type="button"
                onClick={() => {
                  onForward(message);
                  setShowMenu(false);
                }}
                className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-2 text-left text-sm hover:bg-slate-100"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 17 20 12 15 7" />
                  <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
                </svg>
                Chuyển tiếp
              </button>
            )}

            {/* Thu hồi với mọi người (chỉ tin nhắn của mình) */}
            {isOwnMessage && (
              <button
                type="button"
                disabled={!canRevokeForAll}
                onClick={() => {
                  if (!canRevokeForAll) return;
                  (onRevokeForAll || onRevoke)?.(message.id);
                  setShowMenu(false);
                }}
                className={`flex w-full items-center gap-3 border-t border-slate-100 px-4 py-2 text-left text-sm ${
                  canRevokeForAll
                    ? "text-red-600 hover:bg-red-50"
                    : "cursor-not-allowed text-slate-400"
                }`}
              >
                <Trash2 size={18} />
                <div className="flex flex-col">
                  <span>Thu hồi với mọi người</span>
                  {canRevokeForAll ? (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} /> Còn {remainingMinutes} phút
                    </span>
                  ) : (
                    <span className="text-xs">Đã quá 15 phút</span>
                  )}
                </div>
              </button>
            )}

            {/* Ẩn với chỉ mình tôi */}
            <button
              type="button"
              onClick={() => {
                onRevokeForMe?.(message.id);
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
            >
              <EyeOff size={18} />
              Ẩn với chỉ mình tôi
            </button>
          </div>
        )}
      </div>
    </div>
  );
};