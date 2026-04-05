'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { httpService } from '@/services/api/http.service';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Member' | 'Guest';
  status: 'Active' | 'Away' | 'Pending';
  joinDate: string;
  avatar?: string;
  initials?: string;
}

interface FilterState {
  searchTerm: string;
  role: string[];
  status: string[];
  sortBy: 'name' | 'joinDate' | 'activity';
}

export default function TeamMembersTab() {
  const params = useParams();
  const teamId = params?.id;

  // State
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentTab, setCurrentTab] = useState<'Students' | 'Teachers'>('Students');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    role: [],
    status: [],
    sortBy: 'name',
  });

  // Fetch real members from API
  useEffect(() => {
    if (!teamId) return;

    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        const data = await httpService.get<Array<{
          id: number;
          fullName: string;
          email: string;
          role: 'TEACHER' | 'STUDENT';
          joinedAt?: string;
          avatarUrl?: string;
        }>>(`/teams/${teamId}/members`);
        
        // Map backend response to UI interface
        const mappedMembers: TeamMember[] = data.map(m => ({
          id: String(m.id),
          name: m.fullName || 'Unknown User',
          email: m.email,
          role: m.role === 'TEACHER' ? 'Owner' : 'Member',
          status: 'Active', // For now, we don't have real-time status
          joinDate: m.joinedAt ? new Date(m.joinedAt).toISOString().split('T')[0] : '',
          avatar: m.avatarUrl,
          initials: (m.fullName || 'U').substring(0, 2).toUpperCase()
        }));

        setMembers(mappedMembers);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch members:", err);
        setError(err instanceof Error ? err.message : "Failed to load class members.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [teamId]);

  // Filtered members based on Tab and Filters
  const filteredMembers = useMemo(() => {
    let result = members;

    // Tab filter: Students vs Teachers
    if (currentTab === 'Students') {
        result = result.filter(m => m.role === 'Member');
    } else {
        result = result.filter(m => m.role === 'Owner');
    }

    // Search filter
    if (filters.searchTerm) {
      const query = filters.searchTerm.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(query) || 
        m.email.toLowerCase().includes(query)
      );
    }

    // Role filter (within modal)
    if (filters.role.length > 0) {
      result = result.filter(m => filters.role.includes(m.role));
    }

    // Sorting
    if (filters.sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === 'joinDate') {
      result = [...result].sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
    }

    return result;
  }, [filters, members, currentTab]);

  // Stats
  const stats = {
    total: members.length,
    capacity: 50,
    onlineNow: members.filter(m => m.status === 'Active').length,
    teachers: members.filter(m => m.role === 'Owner').length,
    students: members.filter(m => m.role === 'Member').length,
    pending: members.filter(m => m.status === 'Pending').length,
  };

  const handleReset = () => {
    setFilters({
      searchTerm: '',
      role: [],
      status: [],
      sortBy: 'name',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 w-full animate-in fade-in duration-500">
        <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-500 mt-6 font-medium animate-pulse">Syncing member directory...</p>
      </div>
    );
  }

  if (error) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center w-full max-w-2xl mx-auto mt-10">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-red-900 mb-2">Access Error</h3>
            <p className="text-red-700 text-sm mb-6">{error}</p>
            <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
                Retry Connection
            </button>
        </div>
    );
  }

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

            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Bulk Invite
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
                Add Member
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={`Search ${currentTab.toLowerCase()} by name or email...`}
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
              />
              <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={() => setShowFilterModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              FILTER
            </button>
          </div>
        </div>

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
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
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
                    </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-200 flex justify-between items-center">
            <span className="text-xs text-gray-500 italic font-medium">
               Real-time member directory connected to server
            </span>
            <span className="text-xs text-slate-700 font-bold">
               {filteredMembers.length} Members Listed
            </span>
          </div>
        </div>
      </div>

      {/* ========== RIGHT: SIDEBAR ========== */}
      <div className="w-72 space-y-6">
        {/* Class Limits */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-tight">
            <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
            Class Capacity
          </h3>
          <div className="mb-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-2xl font-black text-slate-900 tracking-tighter">{stats.total}<span className="text-slate-300 text-lg font-medium mx-1">/</span>{stats.capacity}</span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  (stats.total / stats.capacity) > 0.8 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                  {Math.round((stats.total / stats.capacity) * 100)}% Used
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-100">
              <div
                className={`h-full transition-all duration-1000 ease-out ${
                    (stats.total / stats.capacity) > 0.8 ? 'bg-red-500' : 'bg-blue-600'
                }`}
                style={{ width: `${(stats.total / stats.capacity) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                Currently managing <strong>{stats.students} students</strong> and <strong>{stats.teachers} instructor(s)</strong>.
            </p>
          </div>
          <button className="w-full text-center text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors pt-2 border-t border-slate-50">
            Request More Seats →
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/30 rounded-full -mr-12 -mt-12"></div>
          <h3 className="text-xs font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-tight relative z-10">
            <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
            Directory Stats
          </h3>
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-600">Active Now</span>
              <span className="text-sm font-black text-emerald-600">{stats.onlineNow}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-600">Pending Invite</span>
              <span className="text-sm font-black text-slate-400">{stats.pending}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========== FILTER MODAL ========== */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-xs transition-all">
          <div className="bg-white w-96 h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Advanced Filter</h2>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Sort and filter member directory</p>
            </div>

            <div className="p-6 space-y-8">
              {/* Sort By */}
              <div>
                <h3 className="text-[11px] font-black text-slate-400 mb-4 tracking-widest uppercase">Sort Options</h3>
                <div className="space-y-1">
                  {[
                      { label: 'Name (A-Z)', value: 'name' },
                      { label: 'Joining Date', value: 'joinDate' }
                  ].map((option) => (
                    <label key={option.value} className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl transition-all ${
                        filters.sortBy === option.value ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'
                    }`}>
                      <input
                        type="radio"
                        name="sort"
                        checked={filters.sortBy === option.value}
                        onChange={() => setFilters(prev => ({ ...prev, sortBy: option.value as 'name' | 'joinDate' | 'activity' }))}
                        className="w-4 h-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm font-semibold ${filters.sortBy === option.value ? 'text-blue-700' : 'text-slate-700'}`}>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Info */}
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-50">
                 <div className="flex gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-blue-900 mb-1 leading-tight">Server-side Listing</p>
                        <p className="text-[10px] text-blue-700 leading-normal">This directory is currently synced with the core student information service.</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 sticky bottom-0 bg-white space-y-3">
              <button
                onClick={handleReset}
                className="w-full px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-900 rounded-xl transition-colors"
              >
                Clear all filters
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="w-full px-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
              >
                Apply Listing View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}