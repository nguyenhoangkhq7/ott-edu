/**
 * ConversationInfoSidebar Component
 * 
 * A sidebar component that displays conversation information (side-by-side layout).
 * Fixed width sidebar that sits next to the chat window.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronDown, Bell, Pin, UserPlus, Settings, Image as ImageIcon, File, Link as LinkIcon, Lock, Trash2 } from 'lucide-react';
import { chatApiClient } from '@/services/api';

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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

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
        className={`text-gray-600 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
      />
    </button>
    {isOpen && <div className="bg-gray-50 px-4 py-3 text-sm">{children}</div>}
  </div>
);

// ===================== MAIN COMPONENT =====================

const ConversationInfoSidebar: React.FC<ConversationInfoSidebarProps> = ({
  conversationId,
  isOpen,
}) => {
  const [conversationInfo, setConversationInfo] = useState<ConversationInfoDTO | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [linkItems, setLinkItems] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    members: true,
    media: true,
    files: false,
    links: false,
    settings: false,
  });

  const toggleAccordion = useCallback((key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ===================== API CALLS =====================

  const fetchConversationInfo = useCallback(async () => {
    try {
      const response = await chatApiClient.get(`/chat/info/${conversationId}`);
      setConversationInfo(response.data.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('[ConversationInfoSidebar] fetchConversationInfo error:', error);
      setError(error.message || 'Failed to load conversation info');
    }
  }, [conversationId]);

  const fetchMediaItems = useCallback(async () => {
    try {
      const response = await chatApiClient.get(`/chat/info/${conversationId}/media`, {
        params: { limit: 20 },
      });
      setMediaItems(response.data.data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('[ConversationInfoSidebar] fetchMediaItems error:', error);
    }
  }, [conversationId]);

  const fetchFileItems = useCallback(async () => {
    try {
      const response = await chatApiClient.get(`/chat/info/${conversationId}/files`, {
        params: { limit: 20 },
      });
      setFileItems(response.data.data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('[ConversationInfoSidebar] fetchFileItems error:', error);
    }
  }, [conversationId]);

  const fetchLinkItems = useCallback(async () => {
    try {
      const response = await chatApiClient.get(`/chat/info/${conversationId}/links`, {
        params: { limit: 20 },
      });
      setLinkItems(response.data.data || []);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('[ConversationInfoSidebar] fetchLinkItems error:', error);
    }
  }, [conversationId]);

  // ===================== EFFECTS =====================

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
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        console.error('[ConversationInfoSidebar] loadAllData error:', error);
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
    <div className="w-80 flex flex-col border-l border-gray-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 px-4 py-4 border-b border-gray-200">
        {conversationInfo?.avatarUrl ? (
          <Image
            src={conversationInfo.avatarUrl}
            alt={conversationInfo.name || 'Conversation'}
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {conversationInfo?.name?.charAt(0)?.toUpperCase() || 'C'}
            </span>
          </div>
        )}
        <div className="text-center">
          <h2 className="font-semibold text-gray-900 text-sm line-clamp-2">
            {conversationInfo?.name || 'Loading...'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {conversationInfo?.totalMembers || 0} thành viên
          </p>
        </div>
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
            <button
              className="flex flex-col items-center gap-1 p-2 hover:bg-gray-200 rounded-lg transition"
              title="Thêm thành viên"
            >
              <UserPlus size={16} className="text-gray-600" />
              <span className="text-xs text-gray-700">Thêm thành viên</span>
            </button>
            <button
              className="flex flex-col items-center gap-1 p-2 hover:bg-gray-200 rounded-lg transition"
              title="Quản lý nhóm"
            >
              <Settings size={16} className="text-gray-600" />
              <span className="text-xs text-gray-700">Quản lý</span>
            </button>
          </div>

          {/* Members Accordion */}
          <Accordion
            title="Thành viên nhóm"
            icon={<UserPlus size={14} />}
            isOpen={openAccordions.members}
            onToggle={() => toggleAccordion('members')}
            count={conversationInfo?.totalMembers}
          >
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {conversationInfo?.participants?.map((participant) => (
                <div
                  key={participant._id}
                  className="flex items-center gap-2 p-2 hover:bg-white rounded transition"
                >
                  <Image
                    src={participant.avatarUrl}
                    alt={participant.fullName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {participant.fullName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Accordion>

          {/* Media Accordion */}
          <Accordion
            title="Ảnh & Video"
            icon={<ImageIcon size={14} />}
            isOpen={openAccordions.media}
            onToggle={() => toggleAccordion('media')}
            count={mediaItems.length}
          >
            {mediaItems.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {mediaItems.slice(0, 9).map((item) => (
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
              <p className="text-xs text-gray-500 text-center py-4">Chưa có ảnh/video</p>
            )}
          </Accordion>

          {/* Files Accordion */}
          <Accordion
            title="Tập tin"
            icon={<File size={14} />}
            isOpen={openAccordions.files}
            onToggle={() => toggleAccordion('files')}
            count={fileItems.length}
          >
            {fileItems.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {fileItems.map((item) => (
                  <a
                    key={item.messageId}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 hover:bg-white rounded transition"
                  >
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
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
              <p className="text-xs text-gray-500 text-center py-4">Chưa có tập tin</p>
            )}
          </Accordion>

          {/* Links Accordion */}
          <Accordion
            title="Liên kết"
            icon={<LinkIcon size={14} />}
            isOpen={openAccordions.links}
            onToggle={() => toggleAccordion('links')}
            count={linkItems.length}
          >
            {linkItems.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {linkItems.map((item) => (
                  <a
                    key={item.messageId}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 hover:bg-white rounded transition"
                  >
                    <LinkIcon size={12} className="text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-blue-600 truncate hover:underline">
                        {item.title || item.url}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">Chưa có liên kết</p>
            )}
          </Accordion>

          {/* Settings Accordion */}
          <Accordion
            title="Thiết lập bảo mật"
            icon={<Lock size={14} />}
            isOpen={openAccordions.settings}
            onToggle={() => toggleAccordion('settings')}
          >
            <div className="space-y-1">
              <button className="w-full flex items-center gap-2 p-2 hover:bg-white rounded transition text-left text-xs text-gray-700">
                <span className="text-gray-600 flex-shrink-0"><Lock size={12} /></span>
                <span>Tin nhắn tự xóa</span>
              </button>
              <button className="w-full flex items-center gap-2 p-2 hover:bg-white rounded transition text-left text-xs text-gray-700">
                <span className="text-gray-600 flex-shrink-0"><Eye size={12} /></span>
                <span>Ẩn trò chuyện</span>
              </button>
              <button className="w-full flex items-center gap-2 p-2 hover:bg-white rounded transition text-left text-xs text-gray-700">
                <span className="text-gray-600 flex-shrink-0"><AlertTriangle size={12} /></span>
                <span>Báo xấu</span>
              </button>
              <button className="w-full flex items-center gap-2 p-2 hover:bg-white rounded transition text-left text-xs text-gray-700">
                <span className="text-gray-600 flex-shrink-0"><Trash2 size={12} /></span>
                <span>Xóa lịch sử</span>
              </button>
              <button className="w-full flex items-center gap-2 p-2 hover:bg-red-50 rounded transition text-left text-xs text-red-600 font-medium border-t border-gray-200 mt-2 pt-2">
                <span>Rời nhóm</span>
              </button>
            </div>
          </Accordion>
        </div>
      )}
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
