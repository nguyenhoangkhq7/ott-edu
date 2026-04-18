"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  ActiveVideoCall,
  Attachment,
  Conversation,
  IncomingVideoCall,
  Message,
  Reaction,
  User,
  VideoCallStatus,
} from "../types";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { Info, Phone, PhoneOff, RefreshCw, Video, X } from "lucide-react";
import Image from "next/image";
import { Socket } from "socket.io-client";

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
  callStatus?: VideoCallStatus;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  incomingCall?: IncomingVideoCall | null;
  incomingCaller?: User | null;
  activeCall?: ActiveVideoCall | null;
  callError?: string | null;
  onClearCallError?: () => void;
  onAcceptIncomingCall?: () => void;
  onDeclineIncomingCall?: () => void;
  onEndVideoCall?: () => void;
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
  callStatus = "idle",
  localStream = null,
  remoteStream = null,
  incomingCall = null,
  incomingCaller = null,
  activeCall = null,
  callError = null,
  onClearCallError,
  onAcceptIncomingCall,
  onDeclineIncomingCall,
  onEndVideoCall,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>(messages);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Update local messages when messages prop changes
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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
    switch (callStatus) {
      case "calling":
        return "Dang ket noi cuoc goi...";
      case "receiving":
        return "Ban co cuoc goi den";
      case "connected":
        return "Da ket noi video";
      default:
        return "San sang";
    }
  }, [callStatus]);

  const incomingCallerName = incomingCaller?.name || incomingCall?.fromUserId || "Nguoi dung";
  const showVideoPanel =
    callStatus !== "idle" ||
    Boolean(localStream) ||
    Boolean(remoteStream) ||
    Boolean(incomingCall) ||
    Boolean(callError);

  const renderVideoCallPanel = () => {
    if (!showVideoPanel) {
      return null;
    }

    return (
      <div className="border-b border-slate-200 bg-slate-950/95 px-4 py-3 text-white">
        {callError && (
          <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-2 text-xs text-red-100">
            <p>{callError}</p>
            {onClearCallError && (
              <button
                type="button"
                onClick={onClearCallError}
                className="rounded p-1 text-red-100 transition hover:bg-red-400/30"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {incomingCall && callStatus === "receiving" && (
          <div className="mb-3 rounded-lg border border-emerald-300/40 bg-emerald-500/20 px-3 py-3 text-sm">
            <p className="font-semibold">{incomingCallerName} dang goi video cho ban</p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onDeclineIncomingCall}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-slate-700"
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                {callStatusLabel}
              </p>
              {(activeCall || callStatus !== "idle") && (
                <button
                  type="button"
                  onClick={onEndVideoCall}
                  className="inline-flex items-center gap-1 rounded-md bg-red-500 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-400"
                >
                  <PhoneOff size={14} />
                  Ket thuc
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-lg border border-white/20 bg-black/60">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="h-40 w-full object-cover"
                />
                {!remoteStream && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-200">
                    Dang cho video tu doi phuong...
                  </div>
                )}
              </div>
              <div className="relative overflow-hidden rounded-lg border border-white/20 bg-black/60">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-40 w-full object-cover"
                />
                {!localStream && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-200">
                    Dang khoi tao camera...
                  </div>
                )}
              </div>
            </div>

            <p className="mt-2 text-[11px] text-slate-300">
              Camera/Microphone chi duoc cap quyen khi test tren localhost hoac HTTPS.
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

  const handleRevoke = (messageId: string) => {
    if (socket && conversation) {
      socket.emit("revokeMessage", {
        messageId,
        conversationId: conversation.id,
      });
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-white">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
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
          <button type="button" className="rounded-full p-2 transition-colors hover:bg-slate-100 hover:text-blue-500">
            <Phone size={20} />
          </button>
          <button
            type="button"
            onClick={onStartVideoCall}
            disabled={!canStartVideoCall}
            className="rounded-full p-2 transition-colors hover:bg-slate-100 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            title={canStartVideoCall ? "Goi video 1-1" : "Chi ho tro goi trong doan chat private"}
          >
            <Video size={20} />
          </button>
          <button type="button" className="rounded-full p-2 transition-colors hover:bg-slate-100 hover:text-blue-500">
            <Info size={20} />
          </button>
        </div>
      </div>

      {renderVideoCallPanel()}

      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-4">
        {isLoadingMessages ? (
          <div className="flex h-full items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">Đang tải tin nhắn...</span>
          </div>
        ) : localMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Hãy là người đầu tiên gửi tin nhắn! 👋
          </div>
        ) : (
          localMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwnMessage={msg.senderId === currentUser?.id}
              sender={getSender(msg.senderId)}
              onReply={setReplyingTo}
              onReact={handleReact}
              onRevoke={handleRevoke}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        isSending={isSending}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
};
