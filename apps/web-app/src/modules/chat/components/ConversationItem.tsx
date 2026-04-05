import React from 'react';
import { Conversation, User } from '../types';

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

  if (conversation.type === 'direct') {
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
      className={`flex items-center gap-3 p-3 mx-2 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/40'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <div className="relative flex-shrink-0">
        <img
          src={displayAvatar || 'https://via.placeholder.com/150'}
          alt={displayName || 'Conversation'}
          className="w-12 h-12 rounded-full object-cover"
        />
        {conversation.type === 'direct' && isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {displayName || 'Unknown User'}
          </h3>
          {conversation.lastMessage && (
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {formatTime(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <p className={`text-sm truncate ${
            conversation.unreadCount > 0 ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {conversation.lastMessage?.content || 'Chưa có tin nhắn...'}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 ml-2 text-xs font-bold text-white bg-blue-500 rounded-full">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
