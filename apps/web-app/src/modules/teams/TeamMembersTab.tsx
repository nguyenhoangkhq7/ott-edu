import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { teamApi, TeamMember } from '@/services/api/teamApi';
import DeleteMemberDialog from '@/modules/teams/DeleteMemberDialog';

interface TeamMembersTabProps {
  teamId: number;
}

export default function TeamMembersTab({ teamId }: TeamMembersTabProps) {
  // Dữ liệu members từ API
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái đóng/mở của các danh sách
  const [isOwnersOpen, setIsOwnersOpen] = useState(true);
  const [isMembersOpen, setIsMembersOpen] = useState(true);

  // Delete member dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string>('');

  // Dùng chung 1 ref cho tất cả các menu để tiện xử lý click outside
  const menusRef = useRef<HTMLDivElement>(null);

  // Fetch members từ API
  useEffect(() => {
    const fetchMembers = async () => {
      if (!teamId) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await teamApi.getMembers(teamId);
        setMembers(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch members');
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [teamId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menusRef.current && !menusRef.current.contains(event.target as Node)) {
        // Reset menus on click outside
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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" opacity="0.25"></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">Error: {error}</p>
          </div>
        )}

        {/* Members Content */}
        {!loading && !error && (
          <div ref={menusRef}>
            {/* Tách owners và members */}
            {(() => {
              const owners = members.filter(m => m.role === 'LEADER');
              const regularMembers = members.filter(m => m.role === 'MEMBER');

              return (
                <>
                  {/* ================= SECTION: OWNERS ================= */}
                  {owners.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6">
                      <button 
                        onClick={() => setIsOwnersOpen(!isOwnersOpen)}
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors rounded-t-xl"
                      >
                        <div className="flex items-center gap-3">
                          <svg className={`w-4 h-4 text-slate-500 transition-transform ${isOwnersOpen ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          <h3 className="font-bold text-slate-900">Owners</h3>
                          <span className="text-sm text-slate-400 font-medium">{owners.length}</span>
                        </div>
                      </button>

                      {isOwnersOpen && (
                        <div className="border-t border-slate-100 divide-y divide-slate-50">
                          {owners.map((owner) => (
                            <div key={owner.id} className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors group rounded-b-xl">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <Image 
                                    src={`https://i.pravatar.cc/150?u=${owner.email}`} 
                                    alt={owner.firstName}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                                  />
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm hover:underline cursor-pointer">
                                    {owner.firstName} {owner.lastName}
                                  </h4>
                                  <p className="text-xs text-slate-500">{owner.email}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 sm:gap-4">
                                <span className="text-sm text-slate-500 font-medium hidden sm:block">Owner</span>
                                <button 
                                  onClick={() => {
                                    setSelectedMemberId(owner.id);
                                    setSelectedMemberName(`${owner.firstName} ${owner.lastName}`);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                  title="Delete member"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ================= SECTION: MEMBERS AND GUESTS ================= */}
                  {regularMembers.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-10">
                      <button 
                        onClick={() => setIsMembersOpen(!isMembersOpen)}
                        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors rounded-t-xl"
                      >
                        <div className="flex items-center gap-3">
                          <svg className={`w-4 h-4 text-slate-500 transition-transform ${isMembersOpen ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          <h3 className="font-bold text-slate-900">Members and guests</h3>
                          <span className="text-sm text-slate-400 font-medium">{regularMembers.length}</span>
                        </div>
                      </button>

                      {isMembersOpen && (
                        <div className="border-t border-slate-100 divide-y divide-slate-50 pb-2">
                          {regularMembers.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors group">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <Image 
                                    src={`https://i.pravatar.cc/150?u=${member.email}`} 
                                    alt={member.firstName}
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 rounded-full object-cover border border-slate-200" 
                                  />
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 text-sm hover:underline cursor-pointer">
                                    {member.firstName} {member.lastName}
                                  </h4>
                                  <p className="text-xs text-slate-500">{member.email}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 sm:gap-4">
                                <span className="text-sm text-slate-500 font-medium hidden sm:block">Member</span>
                                <button 
                                  onClick={() => {
                                    setSelectedMemberId(member.id);
                                    setSelectedMemberName(`${member.firstName} ${member.lastName}`);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                  title="Delete member"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Không có members */}
                  {members.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                      <p>No members in this team yet.</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      <DeleteMemberDialog
        isOpen={isDeleteDialogOpen}
        memberId={selectedMemberId}
        memberName={selectedMemberName}
        teamId={teamId}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedMemberId(null);
          setSelectedMemberName('');
        }}
        onSuccess={() => {
          // Refetch members
          const fetchMembers = async () => {
            try {
              const response = await teamApi.getMembers(teamId);
              setMembers(response.data || []);
            } catch (err) {
              console.error('Error refetching members:', err);
            }
          };
          fetchMembers();
        }}
      />
    </>
  );
}
