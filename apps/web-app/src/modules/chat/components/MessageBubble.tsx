import React from 'react';
import { Message, User } from '../types';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  sender?: User;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage, sender }) => {
  const formatTime = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex w-full mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      {!isOwnMessage && sender && (
        <Image
          src={sender.avatarUrl}
          alt={sender.name}
          width={32}
          height={32}
          className="w-8 h-8 rounded-full mt-auto mr-2"
        />
      )}
      
      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {!isOwnMessage && sender && (
          <span className="text-xs text-gray-500 mb-1 ml-1">{sender.name}</span>
        )}
        
        <div
          className={`px-4 py-2 rounded-2xl ${
            isOwnMessage
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        
        <span className="text-[10px] text-gray-400 mt-1 mx-1">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
};
