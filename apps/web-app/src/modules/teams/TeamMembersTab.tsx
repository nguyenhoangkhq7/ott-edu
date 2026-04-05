import React, { useState, useRef, useEffect } from 'react';

export default function TeamMembersTab() {
  // Trạng thái đóng/mở của các danh sách
  const [isOwnersOpen, setIsOwnersOpen] = useState(true);
  const [isMembersOpen, setIsMembersOpen] = useState(true);

  // States để quản lý Dropdown Menus
  const [activeRoleMenuId, setActiveRoleMenuId] = useState<string | null>(null);
  const [activeOptionsMenuId, setActiveOptionsMenuId] = useState<string | null>(null);

  // Dùng chung 1 ref cho tất cả các menu để tiện xử lý click outside
  const menusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menusRef.current && !menusRef.current.contains(event.target as Node)) {
        setActiveRoleMenuId(null);
        setActiveOptionsMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Cột chính chứa danh sách Thành viên */}
      <div className="flex-1 min-w-0 animate-in fade-in duration-300">
        
        {/* Thanh tìm kiếm và nút Add member */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder="Find a member" 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <button className="bg-[#1868f0] hover:bg-blue-700 text-white px-5 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
            Add member
          </button>
        </div>

        <div ref={menusRef}>
          {/* ================= SECTION: OWNERS ================= */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6">
            <button 
              onClick={() => setIsOwnersOpen(!isOwnersOpen)}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors rounded-t-xl"
            >
              <div className="flex items-center gap-3">
                <svg className={`w-4 h-4 text-slate-500 transition-transform ${isOwnersOpen ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                <h3 className="font-bold text-slate-900">Owners</h3>
                <span className="text-sm text-slate-400 font-medium">1</span>
              </div>
            </button>

            {isOwnersOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {/* Owner Item */}
                <div className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors group rounded-b-xl">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://i.pravatar.cc/150?img=11" alt="Dr. Aris Thorne" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm hover:underline cursor-pointer">Dr. Aris Thorne</h4>
                      <p className="text-xs text-slate-500">Instructor</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-sm text-slate-500 font-medium hidden sm:block">Owner</span>
                    
                    {/* Nút 3 chấm của Owner */}
                    <div className="relative">
                      <button 
                        onClick={() => {
                          setActiveOptionsMenuId(activeOptionsMenuId === 'owner-1' ? null : 'owner-1');
                          setActiveRoleMenuId(null);
                        }}
                        className={`p-1.5 rounded-md transition-colors
                          ${activeOptionsMenuId === 'owner-1' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-0 group-hover:opacity-100'}
                        `}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
                      </button>

                      {/* Menu tùy chọn của Owner */}
                      {activeOptionsMenuId === 'owner-1' && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 animate-in zoom-in-95 duration-100">
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            View profile
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            Message
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ================= SECTION: MEMBERS AND GUESTS ================= */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-10">
            <button 
              onClick={() => setIsMembersOpen(!isMembersOpen)}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors rounded-t-xl"
            >
              <div className="flex items-center gap-3">
                <svg className={`w-4 h-4 text-slate-500 transition-transform ${isMembersOpen ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                <h3 className="font-bold text-slate-900">Members and guests</h3>
                <span className="text-sm text-slate-400 font-medium">24</span>
              </div>
            </button>

            {isMembersOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-50 pb-2">
                
                {/* Member Item 1 */}
                <div className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://i.pravatar.cc/150?img=32" alt="Elena Rodriguez" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm hover:underline cursor-pointer">Elena Rodriguez</h4>
                      <p className="text-xs text-slate-500">Student • Mathematics Major</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-4">
                    {/* Nút đổi Role (Vai trò) */}
                    <div className="relative">
                      <button 
                        onClick={() => {
                          setActiveRoleMenuId(activeRoleMenuId === 'member-1' ? null : 'member-1');
                          setActiveOptionsMenuId(null);
                        }}
                        className={`flex items-center gap-1 text-sm font-medium transition-colors px-2 py-1 rounded
                          ${activeRoleMenuId === 'member-1' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                        `}
                      >
                        Member <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      
                      {/* Dropdown đổi Role */}
                      {activeRoleMenuId === 'member-1' && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 animate-in zoom-in-95 duration-100">
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Owner</button>
                          <button className="w-full text-left px-4 py-2 text-sm text-blue-600 font-medium bg-blue-50/50 flex justify-between items-center">
                            Member
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Guest</button>
                        </div>
                      )}
                    </div>

                    {/* Nút 3 chấm của Member */}
                    <div className="relative">
                      <button 
                        onClick={() => {
                          setActiveOptionsMenuId(activeOptionsMenuId === 'member-1' ? null : 'member-1');
                          setActiveRoleMenuId(null);
                        }}
                        className={`p-1.5 rounded-md transition-colors
                          ${activeOptionsMenuId === 'member-1' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-0 group-hover:opacity-100'}
                        `}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
                      </button>

                      {/* Menu tùy chọn của Member */}
                      {activeOptionsMenuId === 'member-1' && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 animate-in zoom-in-95 duration-100">
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            View profile
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            Message
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                            Mute student
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 group/delete">
                            <svg className="w-4 h-4 text-red-400 group-hover/delete:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                            Remove from class
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Member Item 2 */}
                <div className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://i.pravatar.cc/150?img=12" alt="Marcus Chen" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-slate-400 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm hover:underline cursor-pointer">Marcus Chen</h4>
                      <p className="text-xs text-slate-500">Student • Physics Major</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-4">
                    <div className="relative">
                      <button 
                        onClick={() => {
                          setActiveRoleMenuId(activeRoleMenuId === 'member-2' ? null : 'member-2');
                          setActiveOptionsMenuId(null);
                        }}
                        className={`flex items-center gap-1 text-sm font-medium transition-colors px-2 py-1 rounded
                          ${activeRoleMenuId === 'member-2' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}
                        `}
                      >
                        Member <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      
                      {activeRoleMenuId === 'member-2' && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 animate-in zoom-in-95 duration-100">
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Owner</button>
                          <button className="w-full text-left px-4 py-2 text-sm text-blue-600 font-medium bg-blue-50/50 flex justify-between items-center">
                            Member
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Guest</button>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <button 
                        onClick={() => {
                          setActiveOptionsMenuId(activeOptionsMenuId === 'member-2' ? null : 'member-2');
                          setActiveRoleMenuId(null);
                        }}
                        className={`p-1.5 rounded-md transition-colors
                          ${activeOptionsMenuId === 'member-2' ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-0 group-hover:opacity-100'}
                        `}
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
                      </button>

                      {activeOptionsMenuId === 'member-2' && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 animate-in zoom-in-95 duration-100">
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            View profile
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            Message
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                            Mute student
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 group/delete">
                            <svg className="w-4 h-4 text-red-400 group-hover/delete:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                            Remove from class
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>

      {/* Widgets bên phải của tab Members (Giữ nguyên) */}
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
            <button className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="font-medium text-sm text-slate-700">Recordings</span>
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}