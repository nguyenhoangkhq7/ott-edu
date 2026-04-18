/**
 * ConversationInfoSidebar Component
 * 
 * A sidebar component that displays conversation information similar to Zalo.
 * Features:
 * - Header with conversation avatar and name
 * - Quick action buttons (mute, pin, add member, settings)
 * - Members accordion
 * - Media/Files/Links accordion
 * - Security settings accordion
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, X, Bell, Pin, UserPlus, Settings, Image, File, Link as LinkIcon, Lock, Trash2 } from 'lucide-react';

interface Participant {
  _id: string;
  fullName: string;
  avatarUrl: string;
  email: string;
}

interface MediaItem {
  url: string;
  fileName: string;
  messageId: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

interface FileItem {
  url: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  messageId: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

interface LinkItem {
  url: string;
  title?: string;
  messageId: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

interface ConversationInfoDTO {
  conversationId: string;
  name: string;
  avatarUrl: string;
  type: 'private' | 'class';
  participants: Participant[];
  totalMembers: number;
}

interface ConversationInfoSidebarProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
}

// ===================== UTILITY FUNCTIONS =====================

/**
 * Format file size to human-readable format
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format date to readable string
 */
const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Hôm qua';
  } else {
    return d.toLocaleDateString('vi-VN');
  }
};

/**
 * Extract file extension from filename
 */
const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toUpperCase() || 'FILE';
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

const Accordion: React.FC<AccordionProps> = ({ title, icon, isOpen, onToggle, count, children }) => (
  <div className="border-b border-gray-200">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
    >
      <div className="flex items-center gap-3">
        <span className="text-gray-600">{icon}</span>
        <span className="text-sm font-medium text-gray-800">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full ml-2">
            {count}
          </span>
        )}
      </div>
      <ChevronDown
        size={18}
        className={`text-gray-600 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
      />
    </button>
    {isOpen && <div className="bg-gray-50 px-4 py-3">{children}</div>}
  </div>
);

// ===================== MAIN COMPONENT =====================

const ConversationInfoSidebar: React.FC<ConversationInfoSidebarProps> = ({
  conversationId,
  isOpen,
  onClose,
}) => {
  // State
  const [conversationInfo, setConversationInfo] = useState<ConversationInfoDTO | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [linkItems, setLinkItems] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Accordion states
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    members: true,
    media: false,
    files: false,
    links: false,
    settings: false,
  });

  // Toggle accordion
  const toggleAccordion = useCallback((key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ===================== API CALLS =====================

  /**
   * Fetch conversation basic info
   */
  const fetchConversationInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/info/${conversationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch conversation info');
      }
      const result = await response.json();
      setConversationInfo(result.data);
    } catch (err: any) {
      console.error('[ConversationInfoSidebar] fetchConversationInfo error:', err);
      setError(err.message || 'Failed to load conversation info');
    }
  }, [conversationId]);

  /**
   * Fetch media items
   */
  const fetchMediaItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/info/${conversationId}/media?limit=20`);
      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }
      const result = await response.json();
      setMediaItems(result.data || []);
    } catch (err: any) {
      console.error('[ConversationInfoSidebar] fetchMediaItems error:', err);
    }
  }, [conversationId]);

  /**
   * Fetch file items
   */
  const fetchFileItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/info/${conversationId}/files?limit=20`);
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const result = await response.json();
      setFileItems(result.data || []);
    } catch (err: any) {
      console.error('[ConversationInfoSidebar] fetchFileItems error:', err);
    }
  }, [conversationId]);

  /**
   * Fetch link items
   */
  const fetchLinkItems = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/info/${conversationId}/links?limit=20`);
      if (!response.ok) {
        throw new Error('Failed to fetch links');
      }
      const result = await response.json();
      setLinkItems(result.data || []);
    } catch (err: any) {
      console.error('[ConversationInfoSidebar] fetchLinkItems error:', err);
    }
  }, [conversationId]);

  // ===================== EFFECTS =====================

  /**
   * Load all data when sidebar opens
   */
  useEffect(() => {
    if (!isOpen) return;

    const loadAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchConversationInfo(),
          fetchMediaItems(),
          fetchFileItems(),
          fetchLinkItems(),
        ]);
      } catch (err: any) {
        console.error('[ConversationInfoSidebar] loadAllData error:', err);
        setError('Failed to load sidebar data');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [isOpen, conversationId, fetchConversationInfo, fetchMediaItems, fetchFileItems, fetchLinkItems]);

  // ===================== RENDER =====================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-lg flex flex-col overflow-hidden">
        {/* =================== HEADER =================== */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 flex-1">
            {conversationInfo?.avatarUrl ? (
              <img
                src={conversationInfo.avatarUrl}
                alt={conversationInfo.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {conversationInfo?.name?.charAt(0)?.toUpperCase() || 'C'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">
                {conversationInfo?.name || 'Loading...'}
              </h2>
              <p className="text-xs text-gray-500">
                {conversationInfo?.totalMembers || 0} thành viên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
            title="Đóng"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* =================== LOADING STATE =================== */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 rounded-full border-3 border-gray-300 border-t-blue-500 animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Đang tải...</p>
            </div>
          </div>
        )}

        {/* =================== ERROR STATE =================== */}
        {error && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition"
              >
                Tải lại
              </button>
            </div>
          </div>
        )}

        {/* =================== CONTENT =================== */}
        {!loading && !error && (
          <div className="flex-1 overflow-y-auto">
            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
              <button
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-200 rounded-lg transition"
                title="Tắt thông báo"
              >
                <Bell size={20} className="text-gray-600" />
                <span className="text-xs text-gray-700">Tắt thông báo</span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-200 rounded-lg transition"
                title="Ghim hội thoại"
              >
                <Pin size={20} className="text-gray-600" />
                <span className="text-xs text-gray-700">Ghim</span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-200 rounded-lg transition"
                title="Thêm thành viên"
              >
                <UserPlus size={20} className="text-gray-600" />
                <span className="text-xs text-gray-700">Thêm thành viên</span>
              </button>
              <button
                className="flex flex-col items-center gap-1 p-2 hover:bg-gray-200 rounded-lg transition"
                title="Quản lý nhóm"
              >
                <Settings size={20} className="text-gray-600" />
                <span className="text-xs text-gray-700">Quản lý</span>
              </button>
            </div>

            {/* Members Accordion */}
            <Accordion
              title="Thành viên"
              icon={<UserPlus size={18} />}
              isOpen={openAccordions.members}
              onToggle={() => toggleAccordion('members')}
              count={conversationInfo?.totalMembers}
            >
              <div className="space-y-2">
                {conversationInfo?.participants?.map((participant) => (
                  <div
                    key={participant._id}
                    className="flex items-center gap-2 p-2 hover:bg-white rounded transition"
                  >
                    <img
                      src={participant.avatarUrl}
                      alt={participant.fullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {participant.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{participant.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Accordion>

            {/* Media Accordion */}
            <Accordion
              title="Ảnh & Video"
              icon={<Image size={18} />}
              isOpen={openAccordions.media}
              onToggle={() => toggleAccordion('media')}
              count={mediaItems.length}
            >
              {mediaItems.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {mediaItems.map((item) => (
                    <a
                      key={item.messageId}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg overflow-hidden bg-gray-200 hover:opacity-80 transition group relative"
                      title={item.fileName}
                    >
                      <img
                        src={item.url}
                        alt={item.fileName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                        <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Chưa có ảnh/video</p>
              )}
            </Accordion>

            {/* Files Accordion */}
            <Accordion
              title="Tập tin"
              icon={<File size={18} />}
              isOpen={openAccordions.files}
              onToggle={() => toggleAccordion('files')}
              count={fileItems.length}
            >
              {fileItems.length > 0 ? (
                <div className="space-y-2">
                  {fileItems.map((item) => (
                    <a
                      key={item.messageId}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 hover:bg-white rounded transition group"
                    >
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {getFileExtension(item.fileName).substring(0, 1)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600 transition">
                          {item.fileName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(item.sizeBytes)} • {item.senderName}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatDate(item.timestamp)}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Chưa có tập tin</p>
              )}
            </Accordion>

            {/* Links Accordion */}
            <Accordion
              title="Liên kết"
              icon={<LinkIcon size={18} />}
              isOpen={openAccordions.links}
              onToggle={() => toggleAccordion('links')}
              count={linkItems.length}
            >
              {linkItems.length > 0 ? (
                <div className="space-y-2">
                  {linkItems.map((item) => (
                    <a
                      key={item.messageId}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 hover:bg-white rounded transition"
                    >
                      <LinkIcon size={16} className="text-gray-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-600 truncate hover:underline">
                          {item.title || item.url}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.senderName} • {formatDate(item.timestamp)}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Chưa có liên kết</p>
              )}
            </Accordion>

            {/* Settings Accordion */}
            <Accordion
              title="Thiết lập bảo mật"
              icon={<Lock size={18} />}
              isOpen={openAccordions.settings}
              onToggle={() => toggleAccordion('settings')}
            >
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 p-2 hover:bg-white rounded transition text-left text-sm text-gray-700">
                  <Lock size={16} className="text-gray-600" />
                  <span>Tin nhắn tự xóa</span>
                </button>
                <button className="w-full flex items-center gap-2 p-2 hover:bg-white rounded transition text-left text-sm text-gray-700">
                  <Eye size={16} className="text-gray-600" />
                  <span>Ẩn trò chuyện</span>
                </button>
                <button className="w-full flex items-center gap-2 p-2 hover:bg-white rounded transition text-left text-sm text-gray-700">
                  <AlertTriangle size={16} className="text-gray-600" />
                  <span>Báo xấu</span>
                </button>
                <button className="w-full flex items-center gap-2 p-2 hover:bg-white rounded transition text-left text-sm text-gray-700">
                  <Trash2 size={16} className="text-gray-600" />
                  <span>Xóa lịch sử</span>
                </button>
                <button className="w-full flex items-center gap-2 p-2 hover:bg-red-50 rounded transition text-left text-sm text-red-600 font-medium border-t border-gray-200 mt-2 pt-3">
                  <X size={16} className="text-red-600" />
                  <span>Rời nhóm</span>
                </button>
              </div>
            </Accordion>
          </div>
        )}
      </div>
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
