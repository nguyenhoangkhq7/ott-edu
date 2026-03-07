import React, { useState, useRef, useEffect } from 'react';

// Kiểu dữ liệu cho một tin nhắn
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
  replyTo?: {
    senderName: string;
    text: string;
  };
  // Thêm field để lưu trạng thái thả tim (đơn giản)
  isLiked?: boolean;
}

export default function TeamPostsTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderName: 'Dr. Aris Thorne',
      senderAvatar: 'https://i.pravatar.cc/150?img=11',
      isMe: false,
      text: 'Hello everyone! I am excited to start this semester with you all. Please download the syllabus attached below and make sure to read the first chapter before our next session.',
      time: '10:45 AM',
      fileAttachment: {
        name: 'Course_Syllabus_Fall2024.pdf',
        size: '2.4 MB',
        type: 'pdf'
      }
    },
    {
      id: '2',
      senderName: 'Elena Rodriguez',
      senderAvatar: 'https://i.pravatar.cc/150?img=32',
      isMe: false,
      text: 'Thank you, Professor! Looking forward to the first class.',
      time: '11:05 AM',
      replyTo: {
        senderName: 'Dr. Aris Thorne',
        text: 'Hello everyone! I am excited to start this semester...'
      }
    },
    {
      id: '3',
      senderName: 'You',
      senderAvatar: null,
      senderInitials: 'ME',
      isMe: true,
      text: 'I just reviewed the syllabus. Do we need to buy the physical textbook or is the e-book fine?',
      time: '11:30 AM'
    },
    {
      id: '4',
      senderName: 'Dr. Aris Thorne',
      senderAvatar: 'https://i.pravatar.cc/150?img=11',
      isMe: false,
      text: 'The e-book is perfectly fine!',
      time: '11:35 AM',
      replyTo: {
        senderName: 'You',
        text: 'I just reviewed the syllabus. Do we need to buy...'
      }
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // State để quản lý ID của tin nhắn đang mở menu 3 chấm
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống cuối
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      ...(replyingTo && {
        replyTo: {
          senderName: replyingTo.senderName,
          text: replyingTo.text
        }
      })
    };

    setMessages([...messages, newMessage]);
    setInputValue('');
    setReplyingTo(null);
    
    if (inputRef.current) {
      inputRef.current.style.height = '44px';
    }
  };

  const handleReplyClick = (msg: Message) => {
    setReplyingTo(msg);
    inputRef.current?.focus();
    setActiveMenuId(null); // Đóng menu nếu đang mở
  };

  // Hàm xử lý giả lập xóa tin nhắn
  const handleDeleteClick = (id: string) => {
    setMessages(messages.filter(msg => msg.id !== id));
    setActiveMenuId(null);
  };

  // Hàm xử lý giả lập thả tim
  const toggleLike = (id: string) => {
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, isLiked: !msg.isLiked } : msg
    ));
  };

  return (
    <>
      {/* ================= CỘT CHÍNH (KHU VỰC CHAT) ================= */}
      <div className="flex-1 min-w-0 flex flex-col h-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        
        {/* Header Chat */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-slate-800">General Discussion</h2>
            <p className="text-xs text-slate-500">25 members • 3 online</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </button>
        </div>

        {/* Khung chứa các tin nhắn */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc]">
          
          <div className="flex items-center justify-center my-4">
            <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Today
            </span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 max-w-[85%] ${msg.isMe ? 'ml-auto flex-row-reverse' : ''}`}>
              
              {/* Avatar */}
              <div className="flex-shrink-0 mt-auto">
                {msg.senderAvatar ? (
                  <img src={msg.senderAvatar} alt={msg.senderName} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {msg.senderInitials}
                  </div>
                )}
              </div>

              {/* Nội dung tin nhắn & Nút tương tác */}
              <div className={`flex flex-col group relative ${msg.isMe ? 'items-end' : 'items-start'}`}>
                
                {/* Tên & Thời gian */}
                {!msg.isMe && (
                  <div className="flex items-baseline gap-2 mb-1 pl-1">
                    <span className="text-sm font-semibold text-slate-700">{msg.senderName}</span>
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                  </div>
                )}

                {/* Container của Bong bóng chat và Toolbars khi hover */}
                <div className={`flex items-center gap-2 relative ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Bong bóng chat */}
                  <div className={`relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${msg.isMe 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                    }
                  `}>
                    
                    {/* Trích dẫn Reply */}
                    {msg.replyTo && (
                      <div className={`mb-2 pl-3 py-1.5 border-l-[3px] text-xs rounded-r-md ${msg.isMe ? 'border-blue-300 bg-blue-700/50 text-blue-100' : 'border-blue-500 bg-slate-100 text-slate-500'}`}>
                        <p className="font-semibold mb-0.5">{msg.replyTo.senderName}</p>
                        <p className="truncate opacity-80">{msg.replyTo.text}</p>
                      </div>
                    )}

                    <p>{msg.text}</p>

                    {/* File đính kèm có nút Download */}
                    {msg.fileAttachment && (
                      <div className={`mt-3 flex items-center justify-between p-2 rounded-lg border transition-colors
                        ${msg.isMe ? 'bg-blue-700/50 border-blue-500' : 'bg-slate-50 border-slate-200'}
                      `}>
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <div className="w-8 h-8 bg-red-100 text-red-600 rounded flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                          </div>
                          <div className="min-w-0 flex-1 cursor-pointer">
                            <p className="text-sm font-semibold truncate leading-tight hover:underline">{msg.fileAttachment.name}</p>
                            <p className={`text-[10px] ${msg.isMe ? 'text-blue-200' : 'text-slate-500'}`}>{msg.fileAttachment.size}</p>
                          </div>
                        </div>
                        {/* Nút Tải xuống file */}
                        <button className={`p-1.5 rounded-full transition-colors ${msg.isMe ? 'text-blue-100 hover:bg-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title="Download file">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                      </div>
                    )}
                    
                    {/* Hiển thị Emoji đã thả ngay trên bong bóng */}
                    {msg.isLiked && (
                      <div className={`absolute -bottom-2 ${msg.isMe ? '-left-2' : '-right-2'} bg-white border border-slate-200 rounded-full p-0.5 shadow-sm`}>
                        <span className="text-[10px] leading-none block p-0.5">❤️</span>
                      </div>
                    )}
                  </div>

                  {/* Thanh công cụ (Emoji + 3 chấm) hiện khi hover */}
                  <div className={`absolute top-0 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-white border border-slate-200 rounded-full shadow-sm px-1 py-0.5 z-10
                    ${msg.isMe ? 'left-0 -translate-x-full -ml-2' : 'right-0 translate-x-full ml-2'}
                  `}>
                    
                    {/* Các nút thả cảm xúc */}
                    <button onClick={() => toggleLike(msg.id)} className="p-1 hover:bg-slate-100 rounded-full text-sm leading-none transition-colors" title="Love">❤️</button>
                    <button className="p-1 hover:bg-slate-100 rounded-full text-sm leading-none transition-colors" title="Like">👍</button>
                    <button className="p-1 hover:bg-slate-100 rounded-full text-sm leading-none transition-colors" title="Haha">😂</button>
                    
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>

                    {/* Nút 3 chấm */}
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)}
                        className={`p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors
                          ${activeMenuId === msg.id ? 'bg-slate-100 text-slate-700' : ''}
                        `}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
                      </button>

                      {/* Dropdown Menu MỚI (Reply, Copy text, Update, Delete) */}
                      {activeMenuId === msg.id && (
                        <div ref={menuRef} className={`absolute top-full mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 animate-in zoom-in-95 duration-100 
                          ${msg.isMe ? 'right-0' : 'left-0'}
                        `}>
                          {/* Mục 1: Reply */}
                          <button onClick={() => handleReplyClick(msg)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                            Reply
                          </button>
                          
                          {/* Mục 2: Copy text */}
                          <button onClick={() => { navigator.clipboard.writeText(msg.text); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            Copy text
                          </button>
                          
                          {/* Chỉ hiện Edit và Delete cho tin nhắn của MÌNH gửi */}
                          {msg.isMe && (
                            <>
                              {/* Mục 3: Update (Edit) */}
                              <button onClick={() => { alert("Chức năng sửa (update) đang phát triển"); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Update
                              </button>
                              
                              <div className="h-px bg-slate-100 my-1"></div>
                              
                              {/* Mục 4: Delete */}
                              <button onClick={() => handleDeleteClick(msg.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
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

                {/* Thời gian cho tin nhắn của mình */}
                {msg.isMe && (
                  <span className="text-[10px] text-slate-400 mt-1 pr-1">{msg.time}</span>
                )}

              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>

        {/* ================= KHU VỰC NHẬP LIỆU ================= */}
        <div className="bg-white border-t border-slate-200 p-4 z-10">
          
          {/* Trích dẫn tin nhắn đang Reply */}
          {replyingTo && (
            <div className="flex items-start justify-between bg-slate-50 border-l-[3px] border-blue-500 rounded-r-lg px-3 py-2 mb-3">
              <div>
                <p className="text-xs font-semibold text-blue-600 mb-0.5">Replying to {replyingTo.senderName}</p>
                <p className="text-xs text-slate-500 truncate max-w-md">{replyingTo.text}</p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          <div className="flex items-end gap-3">
            {/* Các nút đính kèm bên trái */}
            <div className="flex items-center gap-1 mb-1">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors" title="Attach file">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </button>
            </div>

            {/* Ô nhập Text */}
            <div className="flex-1 bg-slate-100 rounded-2xl border border-transparent focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all flex items-end">
              <textarea 
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={replyingTo ? "Write a reply..." : "Message in General Discussion..."}
                className="w-full bg-transparent resize-none outline-none text-sm p-3 max-h-32 min-h-[44px]"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = '44px';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
              <button className="p-2.5 m-1 text-slate-400 hover:text-blue-600 rounded-full transition-colors" title="Emoji">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            </div>

            {/* Nút Gửi */}
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="mb-1 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-100 transition-colors shadow-sm"
              title="Send"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center">Press Enter to send, Shift + Enter for new line</p>
        </div>
      </div>

      {/* ================= CỘT WIDGETS BÊN PHẢI (Giữ nguyên) ================= */}
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