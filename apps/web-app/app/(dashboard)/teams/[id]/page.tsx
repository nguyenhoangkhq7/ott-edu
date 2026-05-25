"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Import 3 file Tab mà chúng ta đã tạo
import TeamPostsTab from '@/modules/teams/TeamPostsTab';
import TeamFilesTab from '@/modules/teams/TeamFilesTab';
import TeamMembersTab from '@/modules/teams/TeamMembersTab';
import LockTeamDialog from '@/modules/teams/LockTeamDialog';
import EditTeamDialog from '@/modules/teams/EditTeamDialog';
import AssignmentsTab from '@/modules/assignments/AssignmentsTab';
import { teamApi, Team } from '@/services/api/teamApi';
import { useAuth } from '@/shared/providers/AuthProvider';

export default function TeamDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const teamId = parseInt(params.id as string) || 0;
  const [activeTab, setActiveTab] = useState('posts');
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [lockSuccessMessage, setLockSuccessMessage] = useState<string | null>(null);
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyShareLink = () => {
    if (!team?.joinCode) return;
    const shareLink = `${window.location.origin}/teams/join?code=${team.joinCode}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Lỗi khi sao chép liên kết:', err);
    });
  };

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await teamApi.getById(teamId);
        setTeam(response);
      } catch (err) {
        console.error('Error fetching team:', err);
      }
    };

    if (teamId > 0) {
      fetchTeam();
    }
  }, [teamId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 1. Kiểm tra vai trò giáo viên (ROLE_TEACHER)
  const isTeacher = user?.roles?.includes('ROLE_TEACHER') ?? false;

  // 2. Kiểm tra vai trò Leader trong danh sách thành viên lớp học
  const isClassLeader = team?.members?.some(
    (m) => m.accountId == user?.accountId && m.role === "LEADER"
  ) ?? false;

  // Quyền chỉnh sửa/khóa = Giáo viên HOẶC Leader của lớp
  const hasEditPermission = isTeacher || isClassLeader;

  return (
    <div className="flex h-[calc(100vh-60px)] w-full bg-white text-slate-800">

      {/* ================= CỘT TRÁI: Sidebar của Nhóm ================= */}
      <div className="w-[260px] border-r border-slate-200 bg-[#f8f9fa] flex flex-col flex-shrink-0">
        <div className="p-3">
          <Link href="/teams" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium w-fit transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All teams
          </Link>
        </div>



        <div className="flex-1 overflow-y-auto py-2">
          {/* SECTION 1: KÊNH CHÍNH (MAIN CHANNELS) */}
          <div className="px-4 mb-2 mt-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Channels</h3>
          </div>
          <ul className="space-y-0.5 px-2 mb-6">
            <li>
              <button className="w-full flex items-center text-left px-3 py-2 text-sm font-medium bg-white text-slate-900 rounded border-l-[3px] border-blue-600 shadow-sm">
                General
              </button>
            </li>
            <li>
              <button className="w-full flex items-center text-left px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 rounded border-l-[3px] border-transparent transition-colors">
                Homework & Assignments
              </button>
            </li>
          </ul>

          {/* SECTION 2: CÔNG CỤ LỚP HỌC (CLASS TOOLS) */}
          <div className="px-4 mb-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              Class Tools
              <div className="flex-1 h-px bg-slate-200"></div>
            </h3>
          </div>
          <ul className="space-y-1 px-3">
            {/* Bài tập Essay */}
            <li>
              <button
                onClick={() => setActiveTab('assignments')}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-sm rounded-lg transition-all group"
              >
                <div className="w-6 h-6 rounded flex items-center justify-center bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                </div>
                Assignments
              </button>
            </li>

            {/* Trắc nghiệm online */}
            <li>
              <button
                onClick={() => setActiveTab('online-quizzes')}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-sm rounded-lg transition-all group"
              >
                <div className="w-6 h-6 rounded flex items-center justify-center bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                Online Quizzes
              </button>
            </li>

            {/* Quản lý điểm */}
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-sm rounded-lg transition-all group">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                Gradebook
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* ================= CỘT PHẢI: Nội dung chính ================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">

        {/* Header & Tabs */}
        <div className="px-8 pt-8 border-b border-slate-200">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-sm border border-blue-100">
                {team?.name?.charAt(0).toUpperCase() || 'T'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{team?.name || 'Đang tải...'}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 mt-0.5">
                  {team?.description && <span className="max-w-md truncate">{team.description}</span>}
                  {team?.description && <span className="text-slate-300">•</span>}
                  <span>Mã lớp: <strong className="text-slate-700 font-semibold select-all">{team?.joinCode}</strong></span>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={handleCopyShareLink}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline font-medium transition-all"
                    title="Sao chép liên kết tham gia lớp học"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    {copied ? "Đã sao chép liên kết!" : "Sao chép liên kết"}
                  </button>
                </div>
              </div>
            </div>
            {hasEditPermission && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-label="Open options"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsEditDialogOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Chỉnh sửa lớp
                    </button>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsLockDialogOpen(true);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${(team?.isActive === false || team?.active === false)
                        ? "text-emerald-700 hover:bg-emerald-50/50"
                        : "text-rose-700 hover:bg-rose-50/50"
                        }`}
                    >
                      {(team?.isActive === false || team?.active === false) ? (
                        <>
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                          </svg>
                          Mở khóa lớp
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          Khóa lớp
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {lockSuccessMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              {lockSuccessMessage}
            </div>
          )}

          {editSuccessMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              {editSuccessMessage}
            </div>
          )}

          <div className="flex gap-8 text-sm font-medium text-slate-500">
            {['Posts', 'Files', 'Members'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
                className={`pb-3 border-b-2 transition-colors ${activeTab === tab.toLowerCase().replace(' ', '-')
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* ================= GỌI COMPONENT TỪNG TAB Ở ĐÂY ================= */}
        <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-8">
          <div className="max-w-6xl mx-auto flex gap-8">

            {activeTab === 'posts' && <TeamPostsTab teamId={teamId} />}
            {activeTab === 'files' && <TeamFilesTab teamId={teamId} />}
            {activeTab === 'members' && <TeamMembersTab teamId={teamId} teamName={team?.name} />}
            {activeTab === 'assignments' && <div className="w-full"><AssignmentsTab teamId={teamId} filterType="ESSAY" /></div>}
            {activeTab === 'online-quizzes' && <div className="w-full"><AssignmentsTab teamId={teamId} filterType="QUIZ" /></div>}

          </div>
        </div>
      </div>

      <LockTeamDialog
        isOpen={isLockDialogOpen}
        teamId={teamId}
        teamName={team?.name || 'Lớp học'}
        isLocked={team?.isActive === false || team?.active === false}
        onClose={() => setIsLockDialogOpen(false)}
        onSuccess={() => {
          const isCurrentlyLocked = team?.isActive === false || team?.active === false;
          setLockSuccessMessage(
            isCurrentlyLocked ? 'Lớp học đã mở khóa thành công!' : 'Lớp học đã khóa thành công!'
          );
          setTimeout(() => setLockSuccessMessage(null), 3000);
          if (team) {
            setTeam({
              ...team,
              isActive: isCurrentlyLocked,
              active: isCurrentlyLocked
            });
          }
        }}
      />

      <EditTeamDialog
        isOpen={isEditDialogOpen}
        team={team}
        onClose={() => setIsEditDialogOpen(false)}
        onSuccess={() => {
          setEditSuccessMessage('Thông tin lớp học đã cập nhật thành công!');
          setTimeout(() => setEditSuccessMessage(null), 3000);
          // Re-fetch team data
          const fetchTeam = async () => {
            try {
              const response = await teamApi.getById(teamId);
              setTeam(response);
            } catch (err) {
              console.error('Error fetching team:', err);
            }
          };
          if (teamId > 0) {
            fetchTeam();
          }
        }}
      />
    </div>
  );
}
