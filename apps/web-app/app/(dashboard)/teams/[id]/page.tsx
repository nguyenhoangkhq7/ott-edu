"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Import 3 file Tab mà chúng ta đã tạo
import TeamPostsTab from '@/modules/teams/TeamPostsTab';
import TeamFilesTab from '@/modules/teams/TeamFilesTab';
import TeamMembersTab from '@/modules/teams/TeamMembersTab';
import LockTeamDialog from '@/modules/teams/LockTeamDialog';
import EditTeamDialog from '@/modules/teams/EditTeamDialog';
import { teamApi, Team } from '@/services/api/teamApi';
import AssignmentsPage from '@/modules/assignments/AssignmentsPage';

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = parseInt(params.id as string) || 0;
  const [activeTab, setActiveTab] = useState('posts');
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [lockSuccessMessage, setLockSuccessMessage] = useState<string | null>(null);
  const [editSuccessMessage, setEditSuccessMessage] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);

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

        <div className="px-4 py-3 flex items-center justify-between group cursor-pointer hover:bg-slate-200/50 rounded-md mx-2 transition-colors mb-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">AM</div>
            <span className="font-semibold text-sm truncate">Advanced Math...</span>
          </div>
          <button className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
          </button>
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
            {/* Giao bài tập */}
            <li>
              <button 
                onClick={() => setActiveTab('quizzes')} 
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
                onClick={() => setActiveTab('quizzes')}
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
                <p className="text-sm text-slate-500 mt-0.5">{team?.description || 'Mã lớp: ' + team?.joinCode}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditDialogOpen(true)}
                className="px-4 py-2 flex items-center gap-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Sửa
              </button>
              <button
                onClick={() => setIsLockDialogOpen(true)}
                className="px-4 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Khóa lớp
              </button>
            </div>
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
                onClick={() => setActiveTab(tab.toLowerCase())}
                className={`pb-3 border-b-2 transition-colors ${
                  activeTab === tab.toLowerCase() 
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
            {activeTab === 'files' && <TeamFilesTab />}
            {activeTab === 'members' && <TeamMembersTab teamId={teamId} />}
            {activeTab === 'quizzes' && <div className="w-full"><AssignmentsPage teamId={teamId} /></div>}

          </div>
        </div>
      </div>

      <LockTeamDialog
        isOpen={isLockDialogOpen}
        teamId={teamId}
        teamName={team?.name || 'Lớp học'}
        onClose={() => setIsLockDialogOpen(false)}
        onSuccess={() => {
          setLockSuccessMessage('Lớp học đã khóa thành công!');
          setTimeout(() => setLockSuccessMessage(null), 3000);
          if (team) {
            setTeam({ ...team, isActive: false });
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