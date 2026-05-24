/**
 * ConversationInfoSidebar Component
 *
 * A sidebar component that displays conversation information (side-by-side layout).
 * Fixed width sidebar that sits next to the chat window.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Bell,
  Pin,
  UserPlus,
  Settings,
  Image as ImageIcon,
  File,
  Link as LinkIcon,
  Lock,
  Trash2,
} from "lucide-react";
import AddTeamMemberModal from "@/modules/teams/AddTeamMemberModal";
import {
  extractMediaItems,
  extractFileItems,
  extractLinkItems,
  populateSenderNames,
} from "@/modules/chat/utils/chatSidebarMapping";
import {
  fetchConversationInfo as fetchConversationInfoApi,
  fetchMediaItems as fetchMediaItemsApi,
  fetchFileItems as fetchFileItemsApi,
  fetchLinkItems as fetchLinkItemsApi,
} from "@/modules/chat/chatApi";
import type {
  MediaItemUI,
  FileItemUI,
  LinkItemUI,
} from "@/modules/chat/utils/chatSidebarMapping";

const isSafeAvatarUrl = (value: string | null | undefined): value is string => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      parsed.hostname !== "via.placeholder.com"
    );
  } catch {
    return false;
  }
};

interface Participant {
  _id: string;
  fullName: string;
  avatarUrl: string;
  email: string;
}

interface ConversationInfoDTO {
  conversationId: string;
  name: string;
  avatarUrl: string;
  type: "private" | "class";
  ownerId: string | null;
  deputyId: string | null;
  joinPolicy: "open" | "approval";
  participants: Participant[];
  totalMembers: number;
}

interface ConversationInfoSidebarProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenGroupManage?: () => void;
  conversationType?: "private" | "class";
  refreshSignal?: number;
}

// ===================== UTILITY FUNCTIONS =====================

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const getFileExtension = (fileName: string): string => {
  return fileName.split(".").pop()?.toUpperCase() || "FILE";
};

const getParticipantRoleLabel = (
  ownerId: string | null | undefined,
  deputyId: string | null | undefined,
  participantId: string,
): string => {
  if (ownerId && ownerId === participantId) return "Trưởng nhóm";
  if (deputyId && deputyId === participantId) return "Phó nhóm";
  return "Thành viên";
};

// ===================== ACCORDION COMPONENT =====================

interface AccordionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  count?: number;
  children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  count,
  children,
}) => (
  <div className="border-b border-gray-200">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition text-sm"
    >
      <div className="flex items-center gap-3">
        <span className="text-gray-600">{icon}</span>
        <span className="font-medium text-gray-800">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <ChevronDown
        size={16}
        className={`text-gray-600 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
      />
    </button>
    {isOpen && <div className="bg-gray-50 px-4 py-3 text-sm">{children}</div>}
  </div>
);

// ===================== MAIN COMPONENT =====================

const ConversationInfoSidebar: React.FC<ConversationInfoSidebarProps> = ({
  conversationId,
  isOpen,
  onClose,
  onOpenGroupManage,
  conversationType,
  refreshSignal,
}) => {
  const [conversationInfo, setConversationInfo] =
    useState<ConversationInfoDTO | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItemUI[]>([]);
  const [fileItems, setFileItems] = useState<FileItemUI[]>([]);
  const [linkItems, setLinkItems] = useState<LinkItemUI[]>([]);
  const [commonGroups] = useState<
    Array<{ _id: string; name: string; participantCount: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Determine if this is a private or class conversation
  const isPrivateChat =
    conversationInfo?.type === "private" || conversationType === "private";
  const ownerParticipant = conversationInfo?.participants?.find(
    (participant) => participant._id === conversationInfo?.ownerId,
  );
  const memberParticipants = conversationInfo?.participants?.filter(
    (participant) => participant._id !== conversationInfo?.ownerId,
  );
  const deputyParticipant = conversationInfo?.participants?.find(
    (participant) => participant._id === conversationInfo?.deputyId,
  );

  // For 1-1 chat, get the OTHER participant (not the owner/self)
  const otherParticipantIn1v1 = () => {
    if (!isPrivateChat || !conversationInfo?.participants || conversationInfo.participants.length < 2) {
      return null;
    }
    
    // In 1-1 chat, return the participant that is not the owner
    if (conversationInfo.ownerId) {
      return conversationInfo.participants.find(p => p._id !== conversationInfo.ownerId);
    }
    
    // If no owner set, return the second participant
    return conversationInfo.participants[1];
  };

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {
      members: true,
      groups: false,
      media: true,
      files: false,
      links: false,
      settings: false,
    },
  );

  // Update accordion state when conversation type is determined
  useEffect(() => {
    if (conversationInfo?.type) {
      const isPrivate = conversationInfo.type === "private";
      queueMicrotask(() => {
        setOpenAccordions((prev) => ({
          ...prev,
          members: !isPrivate,
          groups: isPrivate,
        }));
      });
    }
  }, [conversationInfo?.type]);

  const toggleAccordion = useCallback((key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ===================== API CALLS =====================

  const fetchConversationInfo = useCallback(async () => {
    try {
      const info = await fetchConversationInfoApi(conversationId);
      setConversationInfo(info);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      console.error(
        "[ConversationInfoSidebar] fetchConversationInfo error:",
        error,
      );
      setError(error.message || "Failed to load conversation info");
    }
  }, [conversationId]);

  const fetchMediaItems = useCallback(async () => {
    try {
      console.log("[fetchMediaItems] Starting...");
      const apiData = await fetchMediaItemsApi(conversationId, 20);
      console.log("[fetchMediaItems] API returned:", apiData);
      
      // Check if API already returns UI items or raw messages
      let items: MediaItemUI[] = [];
      if (apiData && apiData.length > 0) {
        const first = apiData[0] as unknown as Record<string, unknown>;
        if (!first.attachments && !first.content && first.url) {
          // API already returns UI items (has url, fileName, messageId directly)
          console.log("[fetchMediaItems] API returns UI items directly, skipping extraction");
          items = apiData as unknown as MediaItemUI[];
        } else {
          // API returns raw messages, need to extract
          console.log("[fetchMediaItems] API returns messages, extracting...");
          items = extractMediaItems(apiData);
        }
      }
      
      console.log("[fetchMediaItems] Extracted items:", items);
      setMediaItems(items);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      console.debug("[ConversationInfoSidebar] fetchMediaItems skipped (API unavailable):", error.message);
      setMediaItems([]);
    }
  }, [conversationId]);

  const fetchFileItems = useCallback(async () => {
    try {
      console.log("[fetchFileItems] Starting...");
      const apiData = await fetchFileItemsApi(conversationId, 20);
      console.log("[fetchFileItems] API returned:", apiData);
      
      // Check if API already returns UI items or raw messages
      let items: FileItemUI[] = [];
      if (apiData && apiData.length > 0) {
        const first = apiData[0] as unknown as Record<string, unknown>;
        if (!first.attachments && !first.content && first.url) {
          // API already returns UI items (has url, fileName, messageId directly)
          console.log("[fetchFileItems] API returns UI items directly, skipping extraction");
          items = apiData as unknown as FileItemUI[];
        } else {
          // API returns raw messages, need to extract
          console.log("[fetchFileItems] API returns messages, extracting...");
          items = extractFileItems(apiData);
        }
      }
      
      console.log("[fetchFileItems] Extracted items:", items);
      setFileItems(items);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      console.debug("[ConversationInfoSidebar] fetchFileItems skipped (API unavailable):", error.message);
      setFileItems([]);
    }
  }, [conversationId]);

  const fetchLinkItems = useCallback(async () => {
    try {
      console.log("[fetchLinkItems] Starting...");
      const apiData = await fetchLinkItemsApi(conversationId, 20);
      console.log("[fetchLinkItems] API returned:", apiData);
      
      // Check if API already returns UI items or raw messages
      let items: LinkItemUI[] = [];
      if (apiData && apiData.length > 0) {
        const first = apiData[0] as unknown as Record<string, unknown>;
        if (first.url && first.messageId && !first.content) {
          // API already returns UI items (has url, title, messageId directly)
          console.log("[fetchLinkItems] API returns UI items directly, skipping extraction");
          items = apiData as unknown as LinkItemUI[];
        } else {
          // API returns raw messages, need to extract
          console.log("[fetchLinkItems] API returns messages, extracting...");
          items = extractLinkItems(apiData);
        }
      }
      
      console.log("[fetchLinkItems] Extracted items:", items);
      setLinkItems(items);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      console.debug("[ConversationInfoSidebar] fetchLinkItems skipped (API unavailable):", error.message);
      setLinkItems([]);
    }
  }, [conversationId]);

  const mappedMediaItems = React.useMemo(() => {
    return conversationInfo?.participants
      ? populateSenderNames(mediaItems, conversationInfo.participants)
      : mediaItems;
  }, [mediaItems, conversationInfo?.participants]);

  const mappedFileItems = React.useMemo(() => {
    return conversationInfo?.participants
      ? populateSenderNames(fileItems, conversationInfo.participants)
      : fileItems;
  }, [fileItems, conversationInfo?.participants]);

  const mappedLinkItems = React.useMemo(() => {
    return conversationInfo?.participants
      ? populateSenderNames(linkItems, conversationInfo.participants)
      : linkItems;
  }, [linkItems, conversationInfo?.participants]);

  // const fetchCommonGroups = useCallback(async () => {
  //   try {
  //     const response = await chatApiClient.get(
  //       `/chat/info/${conversationId}/common-groups`,
  //     );
  //     setCommonGroups(response.data.data || []);
  //   } catch (err) {
  //     const error = err instanceof Error ? err : new Error("Unknown error");
  //     console.error(
  //       "[ConversationInfoSidebar] fetchCommonGroups error:",
  //       error,
  //     );
  //   }
  // }, [conversationId]);

  // ===================== EFFECTS =====================

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const loadAllData = async () => {
      console.log("[ConversationInfoSidebar] Starting loadAllData");
      setLoading(true);
      setError(null);
      
      // Create a timeout promise to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          console.warn("[ConversationInfoSidebar] Timeout reached (15s)");
          reject(new Error("Sidebar data load timeout (15s)"));
        }, 15000)
      );

      try {
        console.log("[ConversationInfoSidebar] Fetching data...");
        
        // BULLETPROOF: Race against timeout to prevent hanging
        // Use allSettled so partial failures don't prevent full load
        const results = await Promise.race([
          Promise.allSettled([
            fetchConversationInfo(),
            fetchMediaItems(),
            fetchFileItems(),
            fetchLinkItems(),
          ]),
          timeoutPromise,
        ]);

        console.log("[ConversationInfoSidebar] Data fetch completed", results);

        // Check if any critical operations failed
        if (Array.isArray(results)) {
          const failedOperations = results
            .map((r, i) => ({ i, r }))
            .filter((item) => item.r.status === 'rejected');
          
          if (failedOperations.length > 0) {
            console.warn(
              "[ConversationInfoSidebar] Some operations failed:",
              failedOperations.map((item) => ({
                index: item.i,
                reason: (item.r as PromiseRejectedResult).reason,
              }))
            );
            // Don't set error state - partial data is OK
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        console.error("[ConversationInfoSidebar] Sidebar Fetch Error:", error);
        if (isMounted) {
          setError(error.message || "Failed to load sidebar data");
        }
      } finally {
        // CRITICAL: ALWAYS set loading to false, regardless of success/failure
        console.log("[ConversationInfoSidebar] Finally block executing - setting loading to false");
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadAllData();

    return () => {
      isMounted = false;
    };
  }, [
    isOpen,
    conversationId,
    refreshSignal,
    fetchConversationInfo,
    fetchFileItems,
    fetchLinkItems,
    fetchMediaItems,
  ]);

  // ===================== RENDER =====================

  if (!isOpen) return null;

  return (
    <div className="w-80 flex flex-col border-l border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 px-4 py-4 border-b border-gray-200">
        {/* Avatar - For private chat use the OTHER participant's avatar, for class chat use conversation avatar */}
        {(() => {
          const otherParticipant = isPrivateChat ? otherParticipantIn1v1() : null;
          const avatarUrl = isPrivateChat && otherParticipant
            ? otherParticipant.avatarUrl
            : conversationInfo?.avatarUrl;
          return avatarUrl && avatarUrl.trim() !== "";
        })() ? (
          <Image
            src={
              (() => {
                const otherParticipant = isPrivateChat ? otherParticipantIn1v1() : null;
                return isPrivateChat && otherParticipant
                  ? otherParticipant.avatarUrl || ""
                  : conversationInfo?.avatarUrl || "";
              })()
            }
            alt={
              (() => {
                const otherParticipant = isPrivateChat ? otherParticipantIn1v1() : null;
                return isPrivateChat && otherParticipant
                  ? otherParticipant.fullName
                  : conversationInfo?.name || "Conversation";
              })()
            }
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {(() => {
                const otherParticipant = isPrivateChat ? otherParticipantIn1v1() : null;
                if (isPrivateChat && otherParticipant) {
                  return otherParticipant.fullName?.charAt(0)?.toUpperCase();
                }
                return conversationInfo?.name?.charAt(0)?.toUpperCase() || "C";
              })()}
            </span>
          </div>
        )}
        <div className="text-center">
          <h2 className="font-semibold text-gray-900 text-sm line-clamp-2">
            {(() => {
              const otherParticipant = isPrivateChat ? otherParticipantIn1v1() : null;
              if (isPrivateChat && otherParticipant) {
                return otherParticipant.fullName;
              }
              return conversationInfo?.name || "Loading...";
            })()}
          </h2>
          {!isPrivateChat && (
            <p className="text-xs text-gray-500 mt-1">
              {conversationInfo?.totalMembers || 0} thành viên
            </p>
          )}
          {conversationInfo?.type === "class" && (
            <div
              className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${conversationInfo.joinPolicy === "approval" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
            >
              <Lock size={14} />
              <span>
                {conversationInfo.joinPolicy === "approval"
                  ? "Riêng tư - cần duyệt"
                  : "Công khai"}
              </span>
            </div>
          )}
        </div>
        {deputyParticipant && (
          <div className="w-full rounded-xl bg-sky-50 px-3 py-2 text-left ring-1 ring-sky-100">
            <p className="text-[11px] font-medium uppercase tracking-wide text-sky-700">
              Phó nhóm
            </p>
            <p className="truncate text-xs font-medium text-slate-900">
              {deputyParticipant.fullName}
            </p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 rounded-full border-3 border-gray-300 border-t-blue-500 animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-gray-500">Đang tải...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-xs text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition"
            >
              Tải lại
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <div className="flex-1 overflow-y-auto">
          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 px-3 py-3 bg-gray-50 border-b border-gray-200">
            <button
              className="flex flex-col items-center gap-1 p-2 hover:bg-gray-200 rounded-lg transition"
              title="Tắt thông báo"
            >
              <Bell size={16} className="text-gray-600" />
              <span className="text-xs text-gray-700">Tắt thông báo</span>
            </button>
            <button
              className="flex flex-col items-center gap-1 p-2 hover:bg-gray-200 rounded-lg transition"
              title="Ghim hội thoại"
            >
              <Pin size={16} className="text-gray-600" />
              <span className="text-xs text-gray-700">Ghim</span>
            </button>
            {!isPrivateChat && (
              <button
                onClick={() => setIsAddMemberModalOpen(true)}
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-200 rounded-lg transition"
                title="Thêm thành viên"
              >
                <UserPlus size={16} className="text-gray-600" />
                <span className="text-xs text-gray-700">Thêm thành viên</span>
              </button>
            )}
            {conversationType === "class" && onOpenGroupManage && (
              <button
                type="button"
                onClick={() => {
                  onOpenGroupManage();
                  onClose?.();
                }}
                className="flex flex-col items-center gap-1 p-2 hover:bg-blue-200 rounded-lg transition text-blue-600"
                title="Quản lý nhóm"
              >
                <Settings size={16} className="text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">
                  Quản lý
                </span>
              </button>
            )}
          </div>

          {/* For Private Chat: Common Groups Accordion */}
          {isPrivateChat && (
            <Accordion
              title="Nhóm chung"
              icon={<UserPlus size={14} />}
              isOpen={openAccordions.groups}
              onToggle={() => toggleAccordion("groups")}
              count={commonGroups.length}
            >
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {commonGroups && commonGroups.length > 0 ? (
                  commonGroups.map((group) => (
                    <div
                      key={group._id}
                      className="flex items-center justify-between p-2 hover:bg-white rounded transition"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {group.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {group.participantCount} thành viên
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-2">
                    Không có nhóm chung
                  </p>
                )}
              </div>
            </Accordion>
          )}

          {/* Members Accordion */}
          {!isPrivateChat && (
            <Accordion
              title="Thành viên nhóm"
              icon={<UserPlus size={14} />}
              isOpen={openAccordions.members}
              onToggle={() => toggleAccordion("members")}
              count={conversationInfo?.totalMembers}
            >
              <div className="space-y-4 max-h-48 overflow-y-auto">
                {ownerParticipant && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Trưởng nhóm
                    </div>
                    <div className="flex items-center gap-2 rounded-lg p-2 hover:bg-white transition">
                      {isSafeAvatarUrl(ownerParticipant.avatarUrl) ? (
                        <Image
                          src={ownerParticipant.avatarUrl}
                          alt={ownerParticipant.fullName}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-purple-600 flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-semibold">
                            {ownerParticipant.fullName
                              ?.charAt(0)
                              ?.toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium text-gray-800">
                          {ownerParticipant.fullName}
                        </p>
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          Trưởng nhóm
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    Thành viên
                  </div>
                  <div className="space-y-2">
                    {memberParticipants?.map((participant) => (
                      <div
                        key={participant._id}
                        className="flex items-center gap-2 p-2 hover:bg-white rounded transition"
                      >
                        {isSafeAvatarUrl(participant.avatarUrl) ? (
                          <Image
                            src={participant.avatarUrl}
                            alt={participant.fullName}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-purple-600 flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-semibold">
                              {participant.fullName?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </span>
                          </div>
                        )}
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                          <p className="text-xs font-medium text-gray-800 truncate">
                            {participant.fullName}
                          </p>
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {getParticipantRoleLabel(
                              conversationInfo?.ownerId,
                              conversationInfo?.deputyId,
                              participant._id,
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Accordion>
          )}

          {/* Media Accordion */}
          <Accordion
            title="Ảnh & Video"
            icon={<ImageIcon size={14} />}
            isOpen={openAccordions.media}
            onToggle={() => toggleAccordion("media")}
            count={mappedMediaItems.length}
          >
            {mappedMediaItems.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {mappedMediaItems
                  .slice(0, 9)
                  .filter((item) => item.url && item.url.trim() !== "")
                  .map((item) => (
                    <a
                      key={item.messageId}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden bg-gray-200 hover:opacity-80 transition"
                      title={item.fileName}
                    >
                      <Image
                        src={item.url}
                        alt={item.fileName}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">
                Chưa có ảnh/video
              </p>
            )}
          </Accordion>

          {/* Files Accordion */}
          <Accordion
            title="Tập tin"
            icon={<File size={14} />}
            isOpen={openAccordions.files}
            onToggle={() => toggleAccordion("files")}
            count={mappedFileItems.length}
          >
            {mappedFileItems.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {mappedFileItems.map((item) => (
                  <a
                    key={item.messageId}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 hover:bg-white rounded transition"
                  >
                    <div className="w-6 h-6 rounded bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">
                        {getFileExtension(item.fileName).substring(0, 1)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">
                        {item.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(item.sizeBytes)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">
                Chưa có tập tin
              </p>
            )}
          </Accordion>

          {/* Links Accordion */}
          <Accordion
            title="Liên kết"
            icon={<LinkIcon size={14} />}
            isOpen={openAccordions.links}
            onToggle={() => toggleAccordion("links")}
            count={mappedLinkItems.length}
          >
            {mappedLinkItems.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {mappedLinkItems.map((item) => (
                  <a
                    key={item.messageId}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 hover:bg-white rounded transition group"
                    title={item.title || item.url}
                  >
                    <LinkIcon size={12} className="text-gray-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {item.title ? (
                        <>
                          <p className="text-xs font-medium text-blue-600 truncate group-hover:underline">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {item.domain}
                          </p>
                        </>
                      ) : (
                        <p className="text-xs font-medium text-blue-600 truncate group-hover:underline">
                          {item.domain}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">
                Chưa có liên kết
              </p>
            )}
          </Accordion>

          {/* Settings Accordion */}
          <Accordion
            title="Thiết lập bảo mật"
            icon={<Lock size={14} />}
            isOpen={openAccordions.settings}
            onToggle={() => toggleAccordion("settings")}
          >
            <div className="space-y-1">
              {conversationType === "class" && onOpenGroupManage && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenGroupManage();
                      onClose?.();
                    }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-blue-50 rounded transition text-left text-xs text-blue-600 font-medium border-b border-gray-200 mb-2 pb-2"
                  >
                    <span className="text-blue-600 shrink-0">
                      <Settings size={12} />
                    </span>
                    <span>Quản lý nhóm</span>
                  </button>
                </>
              )}
              <button className="w-full flex items-center gap-2 p-2 hover:bg-white rounded transition text-left text-xs text-gray-700">
                <span className="text-gray-600 shrink-0">
                  <Lock size={12} />
                </span>
                <span>Tin nhắn tự xóa</span>
              </button>
              <button className="w-full flex items-center gap-2 p-2 hover:bg-white rounded transition text-left text-xs text-gray-700">
                <span className="text-gray-600 shrink-0">
                  <Eye size={12} />
                </span>
                <span>Ẩn trò chuyện</span>
              </button>
              <button className="w-full flex items-center gap-2 p-2 hover:bg-white rounded transition text-left text-xs text-gray-700">
                <span className="text-gray-600 shrink-0">
                  <AlertTriangle size={12} />
                </span>
                <span>Báo xấu</span>
              </button>
              <button className="w-full flex items-center gap-2 p-2 hover:bg-white rounded transition text-left text-xs text-gray-700">
                <span className="text-gray-600 shrink-0">
                  <Trash2 size={12} />
                </span>
                <span>Xóa lịch sử</span>
              </button>
              <button className="w-full flex items-center gap-2 p-2 hover:bg-red-50 rounded transition text-left text-xs text-red-600 font-medium border-t border-gray-200 mt-2 pt-2">
                <span>Rời nhóm</span>
              </button>
            </div>
          </Accordion>
        </div>
      )}

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        teamId={Number(conversationId)}
        teamName={conversationInfo?.name || ""}
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSuccess={fetchConversationInfo}
      />
    </div>
  );
};

// Import missing icons
const Eye = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const AlertTriangle = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default ConversationInfoSidebar;
