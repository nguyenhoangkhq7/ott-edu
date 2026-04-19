import React, { useState } from "react";
import { X, Send, Search } from "lucide-react";
import Image from "next/image";
import { Conversation, Message } from "../types";
import { sendMessage } from "../chatApi";

interface ForwardMessageModalProps {
  message: Message;
  conversations: Conversation[];
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  message,
  conversations,
  currentUserId,
  onClose,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"error" | "success" | null>(null);

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const nameStr = c.name?.toLowerCase() || "";
    const otherParticipant =
      c.type === "private"
        ? c.participants.find((p) => p.id !== currentUserId)
        : null;
    const otherName = otherParticipant?.name?.toLowerCase() || "";
    const otherCode = otherParticipant?.code?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return (
      nameStr.includes(query) ||
      otherName.includes(query) ||
      otherCode.includes(query)
    );
  });

  const toggleSelection = (conversationId: string) => {
    const next = new Set(selectedIds);
    if (next.has(conversationId)) {
      next.delete(conversationId);
    } else {
      next.add(conversationId);
    }
    setSelectedIds(next);
  };

  const handleForward = async () => {
    if (selectedIds.size === 0 || isSending) return;
    setIsSending(true);
    setFeedback(null);
    setFeedbackType(null);

    try {
      // Execute sequentially or Promise.all. Promise.all is faster.
      await Promise.all(
        Array.from(selectedIds).map((convId) => {
          const conv = conversations.find((c) => c.id === convId);
          if (!conv) return Promise.resolve();

          const receiverId = undefined; // backend handles sending to conversation by conversationId
          return sendMessage(
            message.content,
            receiverId,
            conv.id,
            message.attachments,
            undefined, // replyTo
            true, // isForwarded
          );
        })
      );
      setFeedback("Đã chuyển tiếp tin nhắn thành công.");
      setFeedbackType("success");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error forwarding message:", error);
      setFeedback("Đã xảy ra lỗi khi chuyển tiếp tin nhắn. Vui lòng thử lại.");
      setFeedbackType("error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Chuyển tiếp tin nhắn</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="border-b bg-slate-50 p-4">
          {feedback && (
            <div
              className={`mb-3 rounded-xl px-3 py-2 text-sm ${
                feedbackType === "error"
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {feedback}
            </div>
          )}
          <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredConversations.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Không tìm thấy cuộc trò chuyện phù hợp.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isPrivate = conv.type === "private";
              const other = isPrivate
                ? conv.participants.find((p) => p.id !== currentUserId)
                : null;
              
              let displayName = conv.name;
              if (isPrivate && other) displayName = other.name;
              
              let displayAvatar = conv.avatarUrl;
              if (isPrivate && other) displayAvatar = other.avatarUrl;

              const isSelected = selectedIds.has(conv.id);

              return (
                <div
                  key={conv.id}
                  onClick={() => toggleSelection(conv.id)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-100"
                >
                  <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300">
                    <div
                      className={`h-3 w-3 rounded-full transition-colors ${
                        isSelected ? "bg-blue-500" : "bg-transparent"
                      }`}
                    />
                  </div>
                  <Image
                    src={displayAvatar || "https://via.placeholder.com/150"}
                    alt={displayName || "Chat"}
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {displayName}
                    </p>
                    {isPrivate && other?.code && (
                      <p className="truncate text-xs text-slate-500">
                        {other.code}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-slate-50 p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">
            {selectedIds.size > 0
              ? `Đã chọn ${selectedIds.size} hội thoại`
              : "Chọn nơi chuyển tiếp"}
          </span>
          <button
            onClick={handleForward}
            disabled={selectedIds.size === 0 || isSending}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isSending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Send size={16} />
            )}
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};
