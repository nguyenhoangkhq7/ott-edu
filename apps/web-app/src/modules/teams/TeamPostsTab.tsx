import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

// ================= KIỂU DỮ LIỆU =================
interface Message {
  id: string;
  senderName: string;
  senderAvatar: string | null;
  senderInitials?: string;
  isMe: boolean;
  text: string;
  time: string;
  fileAttachment?: {
    name: string;
    size: string;
    type: 'pdf' | 'doc' | 'xls';
  };
  isLiked?: boolean;
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
  // Đã fix lỗi TypeScript: Thêm "| null" vào đây
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

const ChatInputBox = ({ placeholder, onCancel, inputValue, setInputValue, onSend, inputRef }: ChatInputBoxProps) => (
  <div className="bg-white rounded-md border border-[#1868f0] shadow-sm mt-3 animate-in fade-in duration-200">
    <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 bg-slate-50/50 rounded-t-md">
       <div className="flex items-center gap-1">
         <button className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors" title="Format"><span className="font-serif font-bold text-sm">A</span></button>
         <div className="w-px h-4 bg-slate-300 mx-1"></div>
         <button className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors" title="Attach file">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
         </button>
         <button className="p-1.5 text-slate-500 hover:bg-slate-200 rounded transition-colors" title="Emoji">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
         </button>
       </div>
       <button onClick={onCancel} className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
       </button>
    </div>
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
    <div className="flex justify-end p-2 border-t border-slate-100">
      <button 
        onClick={onSend}
        disabled={!inputValue.trim()}
        className="p-1.5 bg-[#1868f0] text-white rounded hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
      >
        <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
      </button>
    </div>
  </div>
);

// ================= COMPONENT: MessageItem =================
interface MessageItemProps {
  msg: Message;
  isPost: boolean;
  parentPostId?: string;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  // Đã fix lỗi TypeScript: Thêm "| null" vào đây
  menuRef: React.RefObject<HTMLDivElement | null>;
  toggleLike: (id: string, isPost: boolean, parentPostId?: string) => void;
  handleOpenReply: (postId: string) => void;
  handleDeleteClick: (idToDelete: string, isPost: boolean, parentPostId?: string) => void;
}

const MessageItem = ({ 
  msg, isPost, parentPostId, activeMenuId, setActiveMenuId, menuRef, toggleLike, handleOpenReply, handleDeleteClick 
}: MessageItemProps) => (
  <div className={`group relative flex gap-4 py-3 ${isPost ? 'px-0' : 'px-4 hover:bg-slate-50/50 rounded-lg -mx-4'}`}>
    <div className="flex-shrink-0 pt-1">
      {msg.senderAvatar ? (
        <Image src={msg.senderAvatar} alt={msg.senderName} className="w-10 h-10 rounded-full object-cover border border-slate-200" width={40} height={40} />
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

      <div className="text-slate-800 text-[15px] leading-relaxed max-w-4xl pr-8">
        {msg.text}
      </div>

      {msg.fileAttachment && (
        <div className="mt-3 flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white max-w-sm hover:shadow-sm transition-shadow cursor-pointer">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{msg.fileAttachment.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{msg.fileAttachment.size}</p>
            </div>
          </div>
        </div>
      )}

      {msg.isLiked && (
        <div className="mt-2 flex">
           <div className="bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm">
             <span className="text-xs">❤️</span><span className="text-[10px] font-medium text-slate-600">1</span>
           </div>
        </div>
      )}
    </div>

    {/* 3 Icons Hover Toolbar */}
    <div className="absolute top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white border border-slate-200 rounded-md shadow-sm z-10 px-0.5">
      <button onClick={() => toggleLike(msg.id, isPost, parentPostId)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors" title="Love">❤️</button>
      <div className="w-px h-4 bg-slate-200"></div>
      {isPost && (
        <button onClick={() => handleOpenReply(msg.id)} className="p-1.5 text-slate-400 hover:text-[#1868f0] transition-colors" title="Reply">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
        </button>
      )}
      {!isPost && <div className="w-px h-4 bg-slate-200"></div>}
      <div className="relative">
        <button 
          onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === msg.id ? null : msg.id); }}
          className={`p-1.5 text-slate-400 hover:text-slate-700 transition-colors ${activeMenuId === msg.id ? 'text-slate-700' : ''}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
        </button>
        {activeMenuId === msg.id && (
          <div ref={menuRef} className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 animate-in zoom-in-95 duration-100">
            <button onClick={() => { navigator.clipboard.writeText(msg.text); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Copy text
            </button>
            {msg.isMe && (
              <>
                <button onClick={() => { alert("Sửa tin nhắn"); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
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
  </div>
);

// ================= COMPONENT CHÍNH: TeamPostsTab =================
export default function TeamPostsTab() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 'post-1',
      senderName: 'Dr. Aris Thorne',
      senderAvatar: 'https://i.pravatar.cc/150?img=11',
      isMe: false,
      text: 'Hello everyone! I am excited to start this semester with you all. Please download the syllabus attached below and make sure to read the first chapter before our next session.',
      time: '10:45 AM',
      fileAttachment: {
        name: 'Course_Syllabus_Fall2024.pdf',
        size: '2.4 MB',
        type: 'pdf'
      },
      replies: [
        {
          id: 'reply-1',
          senderName: 'Elena Rodriguez',
          senderAvatar: 'https://i.pravatar.cc/150?img=32',
          isMe: false,
          text: 'Thank you, Professor! Looking forward to the first class.',
          time: '11:05 AM'
        },
        {
          id: 'reply-2',
          senderName: 'You',
          senderAvatar: null,
          senderInitials: 'ME',
          isMe: true,
          text: 'I just reviewed the syllabus. Do we need to buy the physical textbook or is the e-book fine?',
          time: '11:30 AM'
        },
        {
          id: 'reply-3',
          senderName: 'Dr. Aris Thorne',
          senderAvatar: 'https://i.pravatar.cc/150?img=11',
          isMe: false,
          text: 'The e-book is perfectly fine!',
          time: '11:35 AM'
        }
      ]
    },
    {
      id: 'post-2',
      senderName: 'You',
      senderAvatar: null,
      senderInitials: 'ME',
      isMe: true,
      text: 'Does anyone want to form a study group for the upcoming assignments?',
      time: '1:15 PM',
      replies: []
    }
  ]);

  const [expandedPostIds, setExpandedPostIds] = useState<string[]>([]);
  const [activeReplyPostId, setActiveReplyPostId] = useState<string | null>(null);
  const [isComposingNew, setIsComposingNew] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  const feedEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleExpandPost = (postId: string) => {
    if (expandedPostIds.includes(postId)) {
      setExpandedPostIds(expandedPostIds.filter(id => id !== postId));
    } else {
      setExpandedPostIds([...expandedPostIds, postId]);
    }
  };

  const handleOpenReply = (postId: string) => {
    setActiveReplyPostId(postId);
    setIsComposingNew(false);
    setInputValue('');
    if (!expandedPostIds.includes(postId)) {
      setExpandedPostIds([...expandedPostIds, postId]);
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleOpenNewConversation = () => {
    setIsComposingNew(true);
    setActiveReplyPostId(null);
    setInputValue('');
    setTimeout(() => {
      inputRef.current?.focus();
      scrollToBottom();
    }, 100);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderName: 'You',
      senderAvatar: null,
      senderInitials: 'ME',
      isMe: true,
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (isComposingNew) {
      setPosts([...posts, { ...newMessage, replies: [] }]);
      setIsComposingNew(false);
      scrollToBottom();
    } else if (activeReplyPostId) {
      setPosts(posts.map(post => {
        if (post.id === activeReplyPostId) {
          return { ...post, replies: [...post.replies, newMessage] };
        }
        return post;
      }));
      setActiveReplyPostId(null);
    }
    
    setInputValue('');
    if (inputRef.current) inputRef.current.style.height = '60px';
  };

  const handleDeleteClick = (idToDelete: string, isPost: boolean, parentPostId?: string) => {
    if (isPost) {
      setPosts(posts.filter(p => p.id !== idToDelete));
    } else if (parentPostId) {
      setPosts(posts.map(p => {
        if (p.id === parentPostId) {
          return { ...p, replies: p.replies.filter(r => r.id !== idToDelete) };
        }
        return p;
      }));
    }
    setActiveMenuId(null);
  };

  const toggleLike = (id: string, isPost: boolean, parentPostId?: string) => {
    if (isPost) {
      setPosts(posts.map(p => p.id === id ? { ...p, isLiked: !p.isLiked } : p));
    } else if (parentPostId) {
      setPosts(posts.map(p => {
        if (p.id === parentPostId) {
          return {
            ...p,
            replies: p.replies.map(r => r.id === id ? { ...r, isLiked: !r.isLiked } : r)
          };
        }
        return p;
      }));
    }
  };

  return (
    <>
      <div className="flex-1 min-w-0 flex flex-col h-full bg-[#f5f5f5] rounded-xl border border-slate-200 overflow-hidden relative">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">Σ</div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg leading-tight">General</h2>
              <p className="text-xs text-slate-500">Advanced Mathematics - Section B</p>
            </div>
          </div>
        </div>

        {/* Khung cuộn chứa luồng (Threads) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          <div className="flex items-center justify-center mb-6">
            <span className="bg-slate-200/50 text-slate-500 text-xs font-medium px-4 py-1 rounded-full">
              August 28, 2024
            </span>
          </div>

          {/* Duyệt qua từng Post */}
          {posts.map((post) => (
            <div key={post.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              
              {/* Nội dung bài Post chính */}
              <MessageItem 
                msg={post} 
                isPost={true} 
                activeMenuId={activeMenuId}
                setActiveMenuId={setActiveMenuId}
                menuRef={menuRef}
                toggleLike={toggleLike}
                handleOpenReply={handleOpenReply}
                handleDeleteClick={handleDeleteClick}
              />

              {/* Nút hiển thị số lượng Replies (nếu có) */}
              {post.replies.length > 0 && !expandedPostIds.includes(post.id) && (
                <button 
                  onClick={() => toggleExpandPost(post.id)}
                  className="mt-2 ml-14 text-sm font-semibold text-[#1868f0] hover:underline flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  {post.replies.length} replies
                </button>
              )}

              {/* Danh sách Replies (Khi được xổ xuống) */}
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
                      toggleLike={toggleLike}
                      handleOpenReply={handleOpenReply}
                      handleDeleteClick={handleDeleteClick}
                    />
                  ))}
                  
                  {/* Nút thu gọn Replies */}
                  <button 
                    onClick={() => toggleExpandPost(post.id)}
                    className="mt-2 text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    Collapse all
                  </button>
                </div>
              )}

              {/* Nút Reply mở form nhập liệu cho post này */}
              {activeReplyPostId !== post.id && (
                <div className="mt-3 ml-14">
                  <button 
                    onClick={() => handleOpenReply(post.id)}
                    className="text-sm font-medium text-slate-500 hover:text-[#1868f0] transition-colors"
                  >
                    Reply
                  </button>
                </div>
              )}

              {/* Form Reply hiển thị ngay dưới Post đang chọn */}
              {activeReplyPostId === post.id && (
                <div className="ml-14">
                  <ChatInputBox 
                    placeholder="Reply..." 
                    onCancel={() => setActiveReplyPostId(null)}
                    inputValue={inputValue}
                    setInputValue={setInputValue}
                    onSend={handleSendMessage}
                    inputRef={inputRef}
                  />
                </div>
              )}

            </div>
          ))}

          {/* Form Đăng bài mới (Nằm ở dưới cùng) */}
          <div className="pt-4">
            {!isComposingNew ? (
              <button 
                onClick={handleOpenNewConversation}
                className="w-full bg-white border border-slate-200 rounded-full py-3 px-6 text-left text-slate-500 shadow-sm hover:shadow transition-shadow flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-[#1868f0] text-white flex items-center justify-center text-sm font-bold">ME</div>
                Start a new conversation
              </button>
            ) : (
              <ChatInputBox 
                placeholder="Start a new conversation. Type @ to mention someone." 
                onCancel={() => setIsComposingNew(false)} 
                inputValue={inputValue}
                setInputValue={setInputValue}
                onSend={handleSendMessage}
                inputRef={inputRef}
              />
            )}
          </div>
          
          <div ref={feedEndRef} />
        </div>
      </div>

      {/* ================= CỘT WIDGETS BÊN PHẢI ================= */}
      <div className="w-80 hidden xl:block space-y-8 animate-in fade-in duration-300 ml-8">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3 flex gap-4 shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold uppercase">Aug</span>
                <span className="text-lg font-bold leading-none">28</span>
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="font-semibold text-sm text-slate-900">Introductory Quiz</h4>
                <p className="text-xs text-slate-500">10:00 AM - Online</p>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-lg p-3 flex gap-4 shadow-sm hover:border-blue-300 transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold uppercase">Sep</span>
                <span className="text-lg font-bold leading-none">02</span>
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="font-semibold text-sm text-slate-900">Lab Session #1</h4>
                <p className="text-xs text-slate-500">2:00 PM - Lab A</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Class Materials</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                <span className="font-medium text-sm text-slate-700">Lecture Slides</span>
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}