"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image'; 
import apiClient from '@/services/api/axios';
import { useAppContext } from '@/shared/providers/AppContext';
import Cookies from 'js-cookie';
import LockTeamDialog from '@/modules/teams/LockTeamDialog'; // Thêm Dialog khóa

// ================= API INTERFACES (Fix no-explicit-any) =================
interface ApiAttachment {
  id: string;
  fileName: string;
  size: number;
  fileType?: string;
  fileUrl: string;
}

interface ApiPost {
  id: string;
  authorName?: string;
  authorId: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  attachments?: ApiAttachment[];
  reactionCount?: number;
  commentCount?: number;
}

// ================= HELPER FUNCTIONS =================
const formatTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) {
    return `Today at ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${dateStr} at ${timeStr}`;
  }
};


const getFileConfig = (fileName: string, mimeType: string) => {
  const name = fileName.toLowerCase();
  if (name.endsWith('.pdf') || mimeType.includes('pdf')) return { bg: 'bg-red-100', text: 'text-red-600' };
  if (name.match(/\.(doc|docx)$/) || mimeType.includes('word')) return { bg: 'bg-blue-100', text: 'text-blue-600' };
  if (name.match(/\.(xls|xlsx|csv)$/) || mimeType.includes('excel') || mimeType.includes('spreadsheet')) return { bg: 'bg-emerald-100', text: 'text-emerald-600' };
  if (name.match(/\.(ppt|pptx)$/) || mimeType.includes('presentation')) return { bg: 'bg-orange-100', text: 'text-orange-600' };
  if (name.match(/\.(zip|rar|7z)$/)) return { bg: 'bg-amber-100', text: 'text-amber-600' };
  return { bg: 'bg-slate-100', text: 'text-slate-500' };
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const getInitials = (name: string) => {
  if (!name) return 'U'; // U cho User nếu không có tên
  
  // Nếu chuỗi là email (chưa cập nhật tên), lấy phần trước @
  const cleanName = name.includes('@') ? name.split('@')[0] : name;
  
  // Tách chuỗi thành các từ dựa trên khoảng trắng
  const parts = cleanName.trim().split(/\s+/);
  
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase(); // Nếu chỉ có 1 từ, lấy 2 ký tự đầu
  
  // Lấy chữ cái đầu của từ ĐẦU TIÊN và từ CUỐI CÙNG
  const firstLetter = parts[0].charAt(0);
  const lastLetter = parts[parts.length - 1].charAt(0);
  
  return (firstLetter + lastLetter).toUpperCase();
};
const REACTIONS = [
  { type: 'LIKE', emoji: '👍', color: 'text-blue-600' },
  { type: 'LOVE', emoji: '❤️', color: 'text-rose-500' },
  { type: 'HAHA', emoji: '😂', color: 'text-yellow-500' },
  { type: 'WOW', emoji: '😮', color: 'text-yellow-500' },
  { type: 'SAD', emoji: '😢', color: 'text-yellow-500' },
  { type: 'ANGRY', emoji: '😡', color: 'text-red-500' }
];

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤟'
];

const downloadFile = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// ================= DATA TYPES =================
interface AttachmentInfo {
  id: string;
  name: string;
  size: string;
  type: string; 
  url: string;
}

interface Message {
  id: string;
  senderName: string;
  senderAvatar: string | null;
  senderInitials?: string;
  isMe: boolean;
  text: string;
  time: string;
  rawDate: number; 
  attachments?: AttachmentInfo[]; 
  reactionCount?: number;
  commentCount?: number;
}

interface Post extends Message {
  replies: Message[];
}

// ================= COMPONENT: ChatInputBox =================
interface ChatInputBoxProps {
  placeholder: string;
  onCancel: () => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  onSend: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  selectedFile?: File | null;
  setSelectedFile?: (file: File | null) => void;
  replyingToName?: string | null;
  hideAttachment?: boolean; 
}

const ChatInputBox = ({ 
  placeholder, onCancel, inputValue, setInputValue, onSend, inputRef, selectedFile, setSelectedFile, replyingToName, hideAttachment = false 
}: ChatInputBoxProps) => {
  const localFileRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji: string) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart;
      const end = inputRef.current.selectionEnd;
      const newText = inputValue.substring(0, start) + emoji + inputValue.substring(end);
      setInputValue(newText);
      
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = start + emoji.length;
          inputRef.current.focus();
        }
      }, 0);
    } else {
      setInputValue(inputValue + emoji);
    }
  };

  return (
    <div className="bg-white rounded-md border border-[#1868f0] shadow-sm animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 relative">
         <div className="flex items-center gap-2 text-slate-500">
           <button className="p-1 hover:bg-slate-100 rounded transition-colors" title="Text format (Aa)">
             <span className="font-serif font-bold text-base tracking-tighter">Aa</span>
           </button>
           <div className="w-px h-4 bg-slate-300 mx-1"></div>
           
           {!hideAttachment && (
             <button onClick={() => localFileRef.current?.click()} className="p-1 hover:bg-slate-100 rounded transition-colors" title="Attach file">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
             </button>
           )}
           
           <div className="relative" ref={emojiPickerRef}>
             <button 
               onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
               className={`p-1 rounded transition-colors ${showEmojiPicker ? 'bg-slate-200 text-[#1868f0]' : 'hover:bg-slate-100'}`} 
               title="Emoji"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </button>

             {showEmojiPicker && (
               <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-slate-200 shadow-xl rounded-lg p-3 z-50 animate-in zoom-in-95 duration-150">
                 <div className="grid grid-cols-7 gap-1 h-48 overflow-y-auto pr-1">
                   {EMOJI_LIST.map((emoji, index) => (
                     <button
                       key={index}
                       onClick={() => handleEmojiSelect(emoji)}
                       className="text-xl hover:bg-slate-100 rounded p-1 flex items-center justify-center transition-colors"
                     >
                       {emoji}
                     </button>
                   ))}
                 </div>
               </div>
             )}
           </div>

           {!hideAttachment && selectedFile && setSelectedFile && (
             <div className="ml-2 flex items-center bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2 py-1 rounded-md max-w-[200px]">
               <span className="truncate mr-2">📎 {selectedFile.name}</span>
               <button onClick={() => setSelectedFile(null)} className="hover:text-red-500 hover:bg-blue-100 rounded-full w-4 h-4 flex items-center justify-center transition-colors">✕</button>
             </div>
           )}
         </div>
         
         <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1" title="Cancel">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
         </button>
      </div>

      {!hideAttachment && (
        <input 
          type="file" 
          ref={localFileRef} 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files && e.target.files[0] && setSelectedFile) {
              setSelectedFile(e.target.files[0]);
            }
          }} 
        />
      )}

      {replyingToName && (
        <div className="px-3 pt-2 text-xs text-[#1868f0] font-medium">
          Replying to @{replyingToName}
        </div>
      )}

      <textarea 
        ref={inputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder={placeholder}
        className="w-full bg-transparent resize-none outline-none text-[15px] p-3 min-h-[60px] text-slate-800"
        rows={2}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = '60px';
          target.style.height = Math.min(target.scrollHeight, 150) + 'px';
        }}
      />
      
      <div className="flex justify-end p-2 border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={onSend}
          disabled={!inputValue.trim() && !selectedFile}
          className="flex items-center gap-1.5 bg-[#1868f0] text-white px-4 py-1.5 rounded hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
        >
          <span className="text-sm font-medium">Send</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
        </button>
      </div>
    </div>
  );
};

// ================= COMPONENT: MessageItem =================
interface MessageItemProps {
  msg: Message;
  isPost: boolean;
  parentPostId?: string;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  handleReaction: (id: string, isPost: boolean, parentPostId?: string, type?: string) => void;
  handleOpenComment: (postId: string) => void;
  handleOpenReply: (commentId: string, senderName: string, postId: string) => void;
  handleDeleteClick: (idToDelete: string, isPost: boolean, parentPostId?: string) => void;
  onZoomImage: (url: string) => void;
  
  editingItemId: string | null;
  editInputValue: string;
  setEditInputValue: (val: string) => void;
  onEditStart: (id: string, text: string) => void;
  onEditCancel: () => void;
  onEditSubmit: (id: string, isPost: boolean, parentPostId?: string) => void;
}

const MessageItem = ({ 
  msg, isPost, parentPostId, activeMenuId, setActiveMenuId, menuRef, handleReaction, handleOpenComment, handleOpenReply, handleDeleteClick, onZoomImage,
  editingItemId, editInputValue, setEditInputValue, onEditStart, onEditCancel, onEditSubmit
}: MessageItemProps) => (
  <div className={`group relative flex gap-4 py-3 ${isPost ? 'px-0' : 'px-4 hover:bg-slate-50/50 rounded-lg -mx-4 transition-colors'}`}>
    <div className="flex-shrink-0 pt-1">
      {msg.senderAvatar ? (
        <Image src={msg.senderAvatar} alt={msg.senderName} width={40} height={40} className="w-10 h-10 rounded-full object-cover border border-slate-200" unoptimized />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#1868f0] text-white flex items-center justify-center text-sm font-bold shadow-sm">
          {msg.senderInitials}
        </div>
      )}
    </div>

    <div className="flex flex-col flex-1 min-w-0 relative">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-semibold text-slate-900">{msg.senderName}</span>
        <span className="text-xs text-slate-500">{msg.time}</span>
      </div>

      {editingItemId === msg.id ? (
        <div className="mt-1 bg-white border border-[#1868f0] rounded-md shadow-sm overflow-hidden animate-in fade-in duration-200">
          <textarea
            className="w-full text-[15px] p-3 text-slate-800 outline-none resize-none min-h-[60px]"
            value={editInputValue}
            onChange={(e) => setEditInputValue(e.target.value)}
            rows={2}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = '60px';
              target.style.height = Math.min(target.scrollHeight, 150) + 'px';
            }}
          />
          <div className="flex justify-end gap-2 p-2 border-t border-slate-100 bg-slate-50">
            <button onClick={onEditCancel} className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-200 rounded transition-colors">Cancel</button>
            <button onClick={() => onEditSubmit(msg.id, isPost, parentPostId)} className="px-4 py-1.5 text-sm font-medium bg-[#1868f0] text-white rounded hover:bg-blue-700 transition-colors">Save changes</button>
          </div>
        </div>
      ) : (
        <div className="text-slate-800 text-[15px] leading-relaxed max-w-4xl pr-8 whitespace-pre-wrap">
          {msg.text}
        </div>
      )}

      {msg.attachments && msg.attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {msg.attachments.map((att) => {
            const isImage = att.type.startsWith('image/');
            const isVideo = att.type.startsWith('video/');

            if (isImage) {
              return (
                <div key={att.id} className="relative rounded-lg overflow-hidden border border-slate-200 max-w-sm group/att">
                  <Image 
                    src={att.url} 
                    alt={att.name} 
                    width={500}
                    height={300}
                    className="w-full h-auto max-h-64 object-contain bg-slate-50 cursor-zoom-in hover:opacity-90 transition-opacity" 
                    onClick={() => onZoomImage(att.url)} 
                    unoptimized
                  />
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadFile(att.url, att.name); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded opacity-0 group-hover/att:opacity-100 hover:bg-black/80 transition-all backdrop-blur-sm z-20 cursor-pointer"
                    title="Download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                </div>
              );
            }

            if (isVideo) {
              return (
                <div key={att.id} className="relative rounded-lg overflow-hidden border border-slate-200 max-w-sm bg-black group/att">
                  <video src={att.url} controls className="w-full h-auto max-h-64 outline-none" />
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadFile(att.url, att.name); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded opacity-0 group-hover/att:opacity-100 hover:bg-black/80 transition-all backdrop-blur-sm z-20 cursor-pointer"
                    title="Download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                </div>
              );
            }

            const fileConfig = getFileConfig(att.name, att.type);

            return (
              <div 
                key={att.id} 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadFile(att.url, att.name); }}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white min-w-[250px] max-w-sm hover:shadow-sm hover:border-blue-300 transition-all cursor-pointer group/att"
                title="Click to download"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${fileConfig.bg} ${fileConfig.text}`}>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover/att:text-blue-600 transition-colors">{att.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{att.size}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full group-hover/att:bg-blue-50 group-hover/att:text-blue-600 flex items-center justify-center text-slate-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(msg.reactionCount || 0) > 0 && (
        <div className="mt-2 flex">
           <div className="bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm cursor-pointer hover:bg-slate-200 transition-colors">
             <span className="text-xs">👍❤️</span><span className="text-[10px] font-medium text-slate-600 ml-1">{msg.reactionCount}</span>
           </div>
        </div>
      )}
    </div>

    {editingItemId !== msg.id && (
      <div className="absolute top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white border border-slate-200 rounded-md shadow-sm z-10 px-0.5">
        <div className="relative group/react">
          <button onClick={() => handleReaction(msg.id, isPost, parentPostId, 'LIKE')} className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors" title="Like">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 pb-2 hidden group-hover/react:block z-50 cursor-default">
            <div className="flex items-center bg-white border border-slate-200 shadow-xl rounded-full px-2 py-1 gap-2 animate-in zoom-in-95 duration-150">
              {REACTIONS.map((reaction) => (
                <button key={reaction.type} onClick={(e) => { e.stopPropagation(); handleReaction(msg.id, isPost, parentPostId, reaction.type); }} className="text-xl hover:scale-125 hover:-translate-y-1 transition-all duration-200 cursor-pointer" title={reaction.type}>{reaction.emoji}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-px h-4 bg-slate-200"></div>
        
        {isPost && (
          <button onClick={() => handleOpenComment(msg.id)} className="p-1.5 text-slate-400 hover:text-[#1868f0] transition-colors" title="Comment">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </button>
        )}

        {!isPost && parentPostId && (
          <button onClick={() => handleOpenReply(msg.id, msg.senderName, parentPostId)} className="p-1.5 text-slate-400 hover:text-[#1868f0] transition-colors" title="Reply">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
          </button>
        )}

        <div className="w-px h-4 bg-slate-200"></div>
        <div className="relative">
          <button 
            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === msg.id ? null : msg.id); }}
            className={`p-1.5 text-slate-400 hover:text-slate-700 transition-colors ${activeMenuId === msg.id ? 'text-slate-700' : ''}`}
            title="Options"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
          </button>
          {activeMenuId === msg.id && (
            <div ref={menuRef} className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg z-20 py-1 animate-in zoom-in-95 duration-100 border border-slate-200">
              <button onClick={() => { navigator.clipboard.writeText(msg.text); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Copy text
              </button>
              {msg.isMe && (
                <>
                  <button 
                    onClick={() => { onEditStart(msg.id, msg.text); setActiveMenuId(null); }} 
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Edit
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button onClick={() => handleDeleteClick(msg.id, isPost, parentPostId)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

// ================= COMPONENT CHÍNH =================
interface TeamPostsTabProps {
  teamId?: number;
}

export default function TeamPostsTab({ teamId: routeTeamId }: TeamPostsTabProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [expandedPostIds, setExpandedPostIds] = useState<string[]>([]);
  const [activeInputPostId, setActiveInputPostId] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ id: string, name: string } | null>(null);
  const [isComposingNew, setIsComposingNew] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editInputValue, setEditInputValue] = useState('');

  // Lock team dialog state
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);

  // --- Search & Filter State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 
  const [sortOrder, setSortOrder] = useState('NEWEST'); 

  const feedStartRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { userEmail, isLoaded, classId: contextClassId } = useAppContext();
  const classId = routeTeamId?.toString() ?? contextClassId ?? null;

  const fetchPosts = useCallback(async () => {
    if (!isLoaded || !classId) return;

    try {
      const response = await apiClient.get<ApiPost[]>(`/posts/class/${classId}`);
      const data = response.data;
      
      // 👉 Lấy email từ context hoặc cookie để đảm bảo luôn có data so sánh
      const currentUser = userEmail || Cookies.get('userEmail') || "";

      const mappedPosts: Post[] = data.map((p: ApiPost) => {
        const mappedAttachments = p.attachments?.map((att: ApiAttachment) => ({
          id: att.id,
          name: att.fileName,
          size: formatBytes(att.size),
          type: att.fileType || 'application/octet-stream',
          url: att.fileUrl
        })) || [];

        // 👉 Kiểm tra xem bài viết này có phải của account đang đăng nhập không
        const isMyPost = 
            String(p.authorId).toLowerCase() === currentUser.toLowerCase() || 
            String(p.authorName).toLowerCase() === currentUser.toLowerCase();

        return {
          id: p.id,
          senderName: p.authorName || p.authorId, 
          senderAvatar: p.authorAvatar || null,
         senderInitials: getInitials(p.authorName || p.authorId || ""),
          isMe: isMyPost, // <--- Đã sửa logic ở đây
          text: p.content,
          time: formatTime(p.createdAt),
          rawDate: new Date(p.createdAt || Date.now()).getTime(),
          attachments: mappedAttachments,
          reactionCount: p.reactionCount || 0,
          commentCount: p.commentCount || 0,
          replies: []
        };
      });
      setPosts(mappedPosts);
    } catch (error) { console.error("Error loading posts:", error); }
  }, [classId, userEmail, isLoaded]);

  // Fix: react-hooks/set-state-in-effect
  useEffect(() => { 
    const load = async () => { await fetchPosts(); };
    load();
  }, [fetchPosts]);

  const scrollToTop = () => feedStartRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadCommentsForPost = async (postId: string) => {
    try {
      const response = await apiClient.get<ApiPost[]>(`/interact/comments/post/${postId}`);
      const comments = response.data;
      
      // 👉 Lấy email từ context hoặc cookie
      const currentUser = userEmail || Cookies.get('userEmail') || "";

      const mappedComments = comments.map((c: ApiPost) => {
        
        // 👉 Kiểm tra xem bình luận này có phải của account đang đăng nhập không
        const isMyComment = 
            String(c.authorId).toLowerCase() === currentUser.toLowerCase() || 
            String(c.authorName).toLowerCase() === currentUser.toLowerCase();

        return {
          id: c.id,
          senderName: c.authorName || c.authorId, 
          senderAvatar: c.authorAvatar || null,
          senderInitials: getInitials(c.authorName || c.authorId || ""),
          isMe: isMyComment, // <--- Đã sửa logic ở đây
          text: c.content,
          time: formatTime(c.createdAt),
          rawDate: new Date(c.createdAt || Date.now()).getTime(),
          attachments: c.attachments?.map((att: ApiAttachment) => ({
            id: att.id,
            name: att.fileName,
            size: formatBytes(att.size),
            type: att.fileType || 'application/octet-stream',
            url: att.fileUrl
          })) || [],
          reactionCount: c.reactionCount || 0
        };
      });
      
      setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, replies: mappedComments, commentCount: mappedComments.length } : p));
    } catch (error) { console.error("Error loading comments:", error); }
  };

  const toggleExpandPost = async (postId: string) => {
    if (expandedPostIds.includes(postId)) {
      setExpandedPostIds(expandedPostIds.filter(id => id !== postId));
    } else {
      setExpandedPostIds([...expandedPostIds, postId]);
      await loadCommentsForPost(postId);
    }
  };

  const handleOpenComment = (postId: string) => {
    setActiveInputPostId(postId);
    setReplyTarget(null);
    setIsComposingNew(false);
    setInputValue('');
    setSelectedFile(null); 
    if (!expandedPostIds.includes(postId)) toggleExpandPost(postId).catch(console.error);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleOpenReply = (commentId: string, senderName: string, postId: string) => {
    setActiveInputPostId(postId);
    setReplyTarget({ id: commentId, name: senderName });
    setIsComposingNew(false);
    setInputValue('');
    setSelectedFile(null); 
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleOpenNewConversation = () => {
    setIsComposingNew(true);
    setActiveInputPostId(null);
    setReplyTarget(null);
    setInputValue('');
    setSelectedFile(null); 
    setTimeout(() => { inputRef.current?.focus(); }, 100);
  };

const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return;

    if (isComposingNew) {
      const formData = new FormData();
      const postData = { classId: classId, content: inputValue, type: 'DISCUSSION' };
      formData.append('post', new Blob([JSON.stringify(postData)], { type: 'application/json' })); 
      if (selectedFile) formData.append('files', selectedFile);

      try {
        await apiClient.post('/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        await fetchPosts(); 
        setIsComposingNew(false);
        scrollToTop(); 
      } catch (error) { console.error("Error posting:", error); }

    } else if (activeInputPostId) {
      const formData = new FormData();
      const payload = {
        postId: activeInputPostId,
        content: inputValue,
        replyToCommentId: replyTarget ? replyTarget.id : null
      };
      
      formData.append('comment', new Blob([JSON.stringify(payload)], { type: 'application/json' })); 
      if (selectedFile) formData.append('files', selectedFile);

      try {
        await apiClient.post('/interact/comments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        await loadCommentsForPost(activeInputPostId);
        if (!expandedPostIds.includes(activeInputPostId)) {
          setExpandedPostIds(prev => [...prev, activeInputPostId]);
        }
        setActiveInputPostId(null);
        setReplyTarget(null);
      } catch (error) { console.error("Error commenting:", error); }
    }
    
    setInputValue('');
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.style.height = '60px';
  };

  const handleDeleteClick = async (idToDelete: string, isPost: boolean, parentPostId?: string) => {
    const url = isPost ? `/posts/${idToDelete}` : `/interact/comments/${idToDelete}`;
    try {
      await apiClient.delete(url);
      
      if (isPost) {
        setPosts(posts.filter(p => p.id !== idToDelete));
      } else if (parentPostId) {
        setPosts(posts.map(p => {
          if (p.id === parentPostId) {
            return { ...p, replies: p.replies.filter(r => r.id !== idToDelete), commentCount: Math.max(0, (p.commentCount || 1) - 1) };
          }
          return p;
        }));
      }
    } catch (error) { console.error("Error deleting:", error); }
    setActiveMenuId(null);
  };

  const handleReaction = async (id: string, isPost: boolean, parentPostId?: string, reactionType: string = 'LIKE') => {
    const targetType = isPost ? 'POST' : 'COMMENT';
    try {
      await apiClient.post(`/interact/reactions?targetId=${id}&targetType=${targetType}&reactionType=${reactionType}`);
      
      if (isPost) {
        setPosts(posts.map(p => p.id === id ? { ...p, reactionCount: (p.reactionCount || 0) + 1 } : p));
      } else if (parentPostId) {
        setPosts(posts.map(p => p.id === parentPostId ? {
          ...p,
          replies: p.replies.map(r => r.id === id ? { ...r, reactionCount: (r.reactionCount || 0) + 1 } : r)
        } : p));
      }
    } catch (error) { console.error("Error reacting:", error); }
  };

  const handleEditStart = (id: string, currentText: string) => {
    setEditingItemId(id);
    setEditInputValue(currentText);
  };

  const handleEditCancel = () => {
    setEditingItemId(null);
    setEditInputValue('');
  };

  const handleEditSubmit = async (id: string, isPost: boolean, parentPostId?: string) => {
    if (!editInputValue.trim()) return;

    const url = isPost ? `/posts/${id}` : `/interact/comments/${id}`;

    try {
      await apiClient.put(url, { content: editInputValue });

      if (isPost) {
        setPosts(posts.map(p => p.id === id ? { ...p, text: editInputValue } : p));
      } else if (parentPostId) {
        setPosts(posts.map(p => {
          if (p.id === parentPostId) {
            return {
              ...p,
              replies: p.replies.map(r => r.id === id ? { ...r, text: editInputValue } : r)
            };
          }
          return p;
        }));
      }
      setEditingItemId(null);
      setEditInputValue('');
    } catch (error) {
      console.error("Error editing:", error);
    }
  };

  // ================= SEARCH & FILTER LOGIC =================
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.text.toLowerCase().includes(query) || 
        p.senderName.toLowerCase().includes(query)
      );
    }

    // 2. Filter Type
    if (filterType === 'MY_POSTS') {
      result = result.filter(p => p.isMe);
    } else if (filterType === 'HAS_MEDIA') {
      result = result.filter(p => p.attachments && p.attachments.length > 0);
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortOrder === 'NEWEST') return b.rawDate - a.rawDate;
      return a.rawDate - b.rawDate;
    });

    return result;
  }, [posts, searchQuery, filterType, sortOrder]);


  return (
    <>
      <div className="flex-1 min-w-0 flex flex-col h-full bg-[#f5f5f5] rounded-xl border border-slate-200 overflow-hidden relative">
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">Σ</div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg leading-tight">General Discussion</h2>
              <p className="text-xs text-slate-500">Class ID: {classId}</p>
            </div>
          </div>

          {/* Nút Khóa lớp mới thêm vào */}
          <button 
            onClick={() => setIsLockDialogOpen(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Khóa lớp học
          </button>
        </div>

        
          {/* SEARCH & FILTER BAR */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 mb-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
            <div className="relative flex-1 w-full">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-[#1868f0] transition-colors"
              />
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="flex-1 sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-[#1868f0]">
                <option value="ALL">All Posts</option>
                <option value="MY_POSTS">My Posts</option>
                <option value="HAS_MEDIA">Has Attachments</option>
              </select>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="flex-1 sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-[#1868f0]">
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
              </select>
            </div>
          </div>

          {filteredPosts.length === 0 && (
             <div className="text-center py-10 text-slate-500">
               <p>No posts found matching your criteria.</p>
             </div>
          )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div ref={feedStartRef} />

          <div className="mb-6">
            {!isComposingNew ? (
              <div 
                onClick={handleOpenNewConversation}
                className="w-full bg-white border border-slate-200 rounded-lg p-4 text-left text-slate-500 shadow-sm hover:shadow transition-all flex items-center gap-3 cursor-text group"
              >
                <div className="w-10 h-10 rounded-full bg-[#1868f0] text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
                  {userEmail ? userEmail.substring(0, 2).toUpperCase() : 'ME'}
                </div>
                <div className="flex-1 bg-slate-100 group-hover:bg-slate-200 transition-colors rounded-full py-2.5 px-4 text-sm text-slate-500">
                  Start a new discussion...
                </div>
                <div className="flex gap-1 shrink-0">
                   <button className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors" title="Add Image">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                <ChatInputBox 
                  placeholder="Write a post..." 
                  onCancel={() => setIsComposingNew(false)} 
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  onSend={handleSendMessage}
                  inputRef={inputRef}
                  selectedFile={selectedFile}
                  setSelectedFile={setSelectedFile}
                  hideAttachment={false}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center mb-6">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="bg-white border border-slate-200 text-slate-500 text-xs font-medium px-4 py-1 rounded-full mx-4 shadow-sm">
              Recent Posts
            </span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>


          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <MessageItem 
                msg={post} 
                isPost={true} 
                activeMenuId={activeMenuId}
                setActiveMenuId={setActiveMenuId}
                menuRef={menuRef}
                handleReaction={handleReaction}
                handleOpenComment={handleOpenComment}
                handleOpenReply={handleOpenReply}
                handleDeleteClick={handleDeleteClick}
                onZoomImage={setZoomedImage}
                editingItemId={editingItemId}
                editInputValue={editInputValue}
                setEditInputValue={setEditInputValue}
                onEditStart={handleEditStart}
                onEditCancel={handleEditCancel}
                onEditSubmit={handleEditSubmit}
              />

              {(post.commentCount || 0) > 0 && !expandedPostIds.includes(post.id) && (
                <button 
                  onClick={() => toggleExpandPost(post.id)}
                  className="mt-2 ml-14 text-sm font-semibold text-[#1868f0] hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
                </button>
              )}

              {expandedPostIds.includes(post.id) && (
                <div className="mt-2 ml-4 pl-4 border-l-2 border-slate-100 space-y-1 animate-in fade-in duration-300">
                  {post.replies.map(reply => (
                    <MessageItem 
                      key={reply.id} 
                      msg={reply} 
                      isPost={false} 
                      parentPostId={post.id}
                      activeMenuId={activeMenuId}
                      setActiveMenuId={setActiveMenuId}
                      menuRef={menuRef}
                      handleReaction={handleReaction}
                      handleOpenComment={handleOpenComment}
                      handleOpenReply={handleOpenReply}
                      handleDeleteClick={handleDeleteClick}
                      onZoomImage={setZoomedImage}
                      editingItemId={editingItemId}
                      editInputValue={editInputValue}
                      setEditInputValue={setEditInputValue}
                      onEditStart={handleEditStart}
                      onEditCancel={handleEditCancel}
                      onEditSubmit={handleEditSubmit}
                    />
                  ))}
                  
                  <button 
                    onClick={() => toggleExpandPost(post.id)}
                    className="mt-2 text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    Collapse
                  </button>
                </div>
              )}

              {activeInputPostId !== post.id && (
                <div className="mt-3 ml-14">
                  <button 
                    onClick={() => handleOpenComment(post.id)}
                    className="text-sm font-medium text-slate-500 hover:text-[#1868f0] transition-colors"
                  >
                    Write a comment...
                  </button>
                </div>
              )}

              {activeInputPostId === post.id && (
                <div className="ml-14">
                  <ChatInputBox 
                    placeholder={replyTarget ? "Write a reply..." : "Write a comment..."} 
                    onCancel={() => { setActiveInputPostId(null); setReplyTarget(null); }}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    onSend={handleSendMessage}
                    inputRef={inputRef}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    replyingToName={replyTarget?.name}
                    hideAttachment={false}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="w-80 hidden xl:block space-y-8 animate-in fade-in duration-300 ml-8">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Upcoming Events</h3>
          <div className="space-y-3">
             <p className="text-sm text-slate-500 italic">No upcoming events...</p>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Class Materials</h3>
          <div className="space-y-2">
             <p className="text-sm text-slate-500 italic">No materials attached...</p>
          </div>
        </div>
      </div>

      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <Image src={zoomedImage} alt="Zoomed view" width={1200} height={800} className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-md" unoptimized />
          <button 
            className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors"
            onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
      {classId && (
        <LockTeamDialog
          isOpen={isLockDialogOpen}
          teamId={Number(classId)}
          teamName="Lớp học này"
          onClose={() => setIsLockDialogOpen(false)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
