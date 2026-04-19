import React from 'react';
import { Conversation, User } from '../types';
import Image from 'next/image';

interface ConversationItemProps {
  conversation: Conversation;
  currentUser: User;
  isActive: boolean;
  onClick: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUser,
  isActive,
  onClick,
}) => {
  // Determine display properties based on conversation type
  let displayName = conversation.name;
  let displayAvatar = conversation.avatarUrl;
  let isOnline = false;

  if (conversation.type === 'private') {
    const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
    if (otherParticipant) {
      displayName = otherParticipant.name;
      displayAvatar = otherParticipant.avatarUrl;
      isOnline = otherParticipant.isOnline;
    }
  }

  // Formatting the time of the last message
  const formatTime = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      onClick={onClick}
      className={`mx-2 flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-all ${
        isActive
          ? 'border-blue-200 bg-blue-50 shadow-sm'
          : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
      }`}
    >
      <div className="relative flex-shrink-0">
        <Image
          src={displayAvatar?.trim() || 'https://via.placeholder.com/150'}
          alt={displayName || 'Conversation'}
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover ring-1 ring-slate-200"
        />
        {conversation.type === 'private' && isOnline && (
          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {displayName || 'Unknown User'}
          </h3>
          {conversation.lastMessage && (
            <span className="whitespace-nowrap text-xs text-slate-500">
              {formatTime(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <p className={`truncate text-sm ${
            conversation.unreadCount > 0 ? 'font-semibold text-slate-900' : 'text-slate-500'
          }`}>
            {!conversation.lastMessage
              ? 'Chưa có tin nhắn...'
              : conversation.lastMessage.isRevoked
                ? '🚫 Tin nhắn đã thu hồi'
                : conversation.lastMessage.revokedFor?.includes('__self__')
                  ? (conversation.lastMessage.senderId === currentUser.id ? 'Bạn: ' : '') + 'Tin nhắn đã ẩn'
                  : conversation.lastMessage.attachments?.length
                    ? '📎 Tệp đính kèm'
                    : (conversation.lastMessage.senderId === currentUser.id ? 'Bạn: ' : '') + conversation.lastMessage.content}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
