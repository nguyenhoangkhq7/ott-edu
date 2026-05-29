import React from "react";
import { Conversation, ChatMode, User } from "../types";
import { SidebarTabs } from "./SidebarTabs";
import { ConversationItem } from "./ConversationItem";
import { RefreshCw, Users, UserPlus, UserCheck, Check } from "lucide-react";
import Image from "next/image";
import { CreateGroupModal } from "./CreateGroupModal";
import { FriendRequestsModal } from "./FriendRequestsModal";
import {
  createGroupConversation,
  fetchFriendRequests,
  searchUsersApi,
  sendFriendRequestApi,
} from "../chatApi";
import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

interface SidebarProps {
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  conversations: Conversation[];
  suggestedUsers: User[];
  currentUser: User | null;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onStartPrivateChat: (user: User) => void;
  isLoading?: boolean;
  error?: string | null;
  onRefreshConversations?: () => Promise<void> | void;
  socket?: Socket | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onModeChange,
  searchQuery,
  onSearchQueryChange,
  conversations,
  suggestedUsers,
  currentUser,
  activeConversationId,
  onSelectConversation,
  onStartPrivateChat,
  isLoading = false,
  error = null,
  onRefreshConversations,
  socket = null,
}) => {
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isFriendRequestOpen, setIsFriendRequestOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // 🚀 THÊM 2 STATE MỚI CHO TÌM KIẾM TOÀN HỆ THỐNG
  const [globalUsers, setGlobalUsers] = useState<User[]>([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);

  // Fetch so luong loi moi ket ban
  const fetchPendingCount = async () => {
    try {
      const requests = await fetchFriendRequests();
      setPendingCount(requests.length);
    } catch (error) {
      console.error("Loi tai loi moi ket ban:", error);
    }
  };

  // Fetch pending count khi component mount
  useEffect(() => {
    const initLoad = async () => {
      try {
        await fetchPendingCount();
      } catch (error) {
        console.error("Lỗi lấy số lượng:", error);
      }
    };

    initLoad();
  }, []);

  // Lang nghe su kien socket de update realtime
  useEffect(() => {
    if (!socket) return;

    const handleNewFriendRequest = () => {
      console.log("🔥 [FRONTEND] Đã nhận event new_friend_request -> Cập nhật chấm đỏ");
      fetchPendingCount();
      setSearchTrigger((prev) => prev + 1);
    };

    const handleFriendStatusUpdated = () => {
      fetchPendingCount();
      setSearchTrigger((prev) => prev + 1);
    };
    const handleFriendRequestAccepted = () => {
      fetchPendingCount();
      setSearchTrigger((prev) => prev + 1);
    };
    const handleFriendRequestRejected = () => {
      fetchPendingCount();
      setSearchTrigger((prev) => prev + 1);
    };

    // ĐĂNG KÝ CÁC EVENT
    socket.on("new_friend_request", handleNewFriendRequest); // 🚀 THIẾU DÒNG NÀY
    socket.on("friend_status_updated", handleFriendStatusUpdated);
    socket.on("friend_request_accepted", handleFriendRequestAccepted);
    socket.on("friend_request_rejected", handleFriendRequestRejected);
    socket.on("unfriended", handleFriendStatusUpdated);

    return () => {
      // GỠ CÁC EVENT
      socket.off("new_friend_request", handleNewFriendRequest);
      socket.off("friend_status_updated", handleFriendStatusUpdated);
      socket.off("friend_request_accepted", handleFriendRequestAccepted);
      socket.off("friend_request_rejected", handleFriendRequestRejected);
      socket.off("unfriended", handleFriendStatusUpdated);
    };
  }, [socket]);

  // 🚀 LOGIC TÌM KIẾM GLOBAL CÓ DEBOUNCE (ĐÃ FIX: GỌI CẢ KHI RỖNG ĐỂ LẤY GỢI Ý)
  useEffect(() => {
    if (currentMode !== "private") return;

    const normalized = searchQuery.trim();
    setIsSearchingGlobal(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchUsersApi(normalized);
        // Lấy đúng mảng data từ API trả về
        setGlobalUsers(results.data || []);
      } catch (e) {
        console.error("Lỗi tìm kiếm global:", e);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 500); // Trễ 0.5s để chống spam API khi đang gõ liên tục

    return () => clearTimeout(timer);
  }, [searchQuery, currentMode, searchTrigger]);

  const handleCreateGroup = async (name: string, selectedIds: string[]) => {
    try {
      // 1. Gọi API tạo nhóm (không gán biến để tránh lỗi unused-vars và as any)
      await createGroupConversation({
        name,
        participants: selectedIds,
        joinPolicy: "open",
      });

      // 2. Gọi hàm làm mới danh sách từ server (Đảm bảo đồng bộ)
      if (onRefreshConversations) {
        await onRefreshConversations();
      }

      alert("Tạo nhóm thành công! 🚀");
    } catch (error) {
      console.error("Lỗi tạo nhóm:", error);

      // Ép kiểu an toàn (không dùng any) để lấy được cấu trúc lỗi của Axios
      const err = error as {
        response?: { data?: { error?: string } };
        message: string;
      };
      alert(`Không thể tạo nhóm: ${err.response?.data?.error || err.message}`);
    }
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredConversations = conversations.filter((c) => {
    if (c.type !== currentMode) return false;
    if (!normalizedQuery) return true;

    const otherParticipant =
      c.type === "private"
        ? c.participants.find((p) => p.id !== currentUser?.id)
        : null;
    const searchable = [
      c.name,
      c.lastMessage?.content,
      otherParticipant?.name,
      otherParticipant?.email,
      otherParticipant?.code,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(normalizedQuery);
  });

  // Helper to resolve the latest friendship status for a given user from global/local state
  const getFriendStatus = (u: User) => {
    const uId = (u as User & { _id?: string })._id || u.id;
    // 1. Cross reference with existing private conversations (highly reliable and real-time updated)
    const privateConv = conversations.find(
      (c) =>
        c.type === "private" &&
        c.participants.some((p) => p.id === uId)
    );
    if (privateConv) {
      const other = privateConv.participants.find((p) => p.id === uId);
      if (other && other.friendStatus) {
        return other.friendStatus;
      }
    }
    return u.friendStatus || "none";
  };

  // 🚀 QUYẾT ĐỊNH XEM ĐANG HIỂN THỊ SUGGEST HAY KẾT QUẢ GLOBAL
  const isSearchingText = normalizedQuery.length > 0;
  // Ưu tiên dùng globalUsers (vì nó tự động lấy từ API), nếu rỗng thì mới xài suggestedUsers của cha truyền vào
  const usersToDisplay = globalUsers.length > 0 ? globalUsers : suggestedUsers;

  return (
    <div className="flex h-full w-80 flex-shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Tin nhắn</h1>
          {currentUser && (
            <p className="mt-1 truncate text-xs text-slate-500">
              {currentUser.name}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-500 rounded-xl transition"
            title="Tạo nhóm"
          >
            <Users size={20} />
          </button>
          <button
            onClick={() => setIsFriendRequestOpen(true)}
            className="p-2 text-slate-500 hover:bg-slate-100 hover:text-blue-500 rounded-xl transition relative"
            title="Lời mời kết bạn"
          >
            <UserPlus size={20} />
            {pendingCount > 0 && (
              <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-white text-xs font-semibold">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <SidebarTabs currentMode={currentMode} onModeChange={onModeChange} />

      {currentMode === "private" && (
        <div className="px-4 pb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Tìm theo tên, MSSV, email..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
          />
        </div>
      )}

      <div className="mt-2 flex-1 overflow-y-auto pb-3">
        {isLoading && (
          <div className="mt-10 flex items-center justify-center gap-2 text-slate-400">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm">Đang tải...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="mx-3 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !error && filteredConversations.length === 0 && (
          <div className="mt-10 px-4 text-center text-sm text-slate-500">
            Chưa có đoạn chat nào.
          </div>
        )}

        {!isLoading &&
          !error &&
          filteredConversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              currentUser={
                currentUser || {
                  id: "",
                  name: "",
                  avatarUrl: "",
                  isOnline: false,
                }
              }
              isActive={conv.id === activeConversationId}
              onClick={() => onSelectConversation(conv.id)}
            />
          ))}

        {/* 🚀 KHU VỰC HIỂN THỊ GỢI Ý / GLOBAL SEARCH */}
        {!isLoading && !error && currentMode === "private" && (
          <div className="mt-4 px-3">
            {isSearchingGlobal ? (
              <div className="py-4 flex justify-center items-center text-slate-400 gap-2">
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-xs">Đang tìm kiếm...</span>
              </div>
            ) : usersToDisplay.length > 0 ? (
              <>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {isSearchingText
                    ? "KẾT QUẢ TÌM KIẾM TOÀN HỆ THỐNG"
                    : "Gợi ý từ lớp/nhóm của bạn"}
                </p>
                <div className="space-y-1">
                  {usersToDisplay.map((user) => {
                    // Type-safe id fallback (ko dung `any`)
                    const uniqueId =
                      (user as User & { _id?: string })._id || user.id;

                    const extUser = user as User & {
                      fullName?: string;
                      name?: string;
                      email?: string;
                      code?: string;
                    };
                    const displayName =
                      extUser.fullName ||
                      extUser.name ||
                      (extUser.email
                        ? extUser.email.split("@")[0]
                        : "Người dùng");
                    const displayCode = extUser.code;

                    return (
                      <div
                        key={uniqueId}
                        className="group flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-100"
                      >
                        {/* Bấm vào tên/avatar thì mở khung chat */}
                        <button
                          type="button"
                          onClick={() => onStartPrivateChat(user)}
                          className="flex flex-1 items-center gap-3 min-w-0"
                        >
                          <Image
                            src={
                              user.avatarUrl ||
                              `https://i.pravatar.cc/150?u=${user.email}`
                            }
                            alt={user.name}
                            width={36}
                            height={36}
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                          />
                          <div className="min-w-0 text-left">
                            {/* HIỂN THỊ TÊN CHUẨN */}
                            <p className="truncate text-sm font-medium text-slate-800">
                              {displayName}
                            </p>
                            {/* HIỂN THỊ EMAIL/CODE */}
                            <p className="truncate text-xs text-slate-500">
                              {displayCode || user.email}
                            </p>
                          </div>
                        </button>

                        {/* NÚT KẾT BẠN */}
                        {(() => {
                          const status = getFriendStatus(user);
                          if (status === "friend") {
                            return (
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
                                title="Bạn bè"
                              >
                                <UserCheck size={16} />
                              </div>
                            );
                          }
                          if (status === "pending") {
                            return (
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                                title="Đã gửi lời mời"
                              >
                                <Check size={16} />
                              </div>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation(); // Ngăn click nhầm qua khung chat
                                try {
                                  if (sendFriendRequestApi) {
                                    await sendFriendRequestApi(uniqueId);
                                    // Update local state immediately for instant feedback
                                    setGlobalUsers((prev) =>
                                      prev.map((u) => {
                                        const uId = (u as User & { _id?: string })._id || u.id;
                                        if (uId === uniqueId) {
                                          return { ...u, friendStatus: "pending" };
                                        }
                                        return u;
                                      })
                                    );
                                    alert(
                                      `Đã gửi lời mời kết bạn đến ${displayName}! Hãy chờ họ chấp nhận nhé!`,
                                    );
                                    setSearchTrigger((prev) => prev + 1);
                                  } else {
                                    alert(
                                      `Chưa cấu hình API gửi lời mời cho ${displayName}`,
                                    );
                                  }
                                } catch (err: unknown) {
                                  const errorMessage =
                                    err instanceof Error
                                      ? err.message
                                      : "Lỗi gửi lời mời kết bạn";
                                  alert(errorMessage);
                                }
                              }}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 opacity-0 transition-all hover:bg-blue-500 hover:text-white group-hover:opacity-100"
                              title="Gửi kết bạn"
                            >
                              <UserPlus size={16} />
                            </button>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : isSearchingText ? (
              <div className="px-4 py-2 text-center text-xs text-slate-400">
                Không tìm thấy người dùng nào trong hệ thống.
              </div>
            ) : suggestedUsers.length === 0 ? (
              <div className="px-4 py-2 text-xs text-slate-400">
                Không tìm thấy thành viên lớp/nhóm phù hợp.
              </div>
            ) : null}
          </div>
        )}
      </div>
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
        suggestedUsers={suggestedUsers}
      />
      <FriendRequestsModal
        isOpen={isFriendRequestOpen}
        onClose={() => setIsFriendRequestOpen(false)}
      />
    </div>
  );
};