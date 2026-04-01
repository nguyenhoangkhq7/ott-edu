"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Import 3 file Tab mà chúng ta đã tạo
import TeamPostsTab from '@/modules/teams/TeamPostsTab';
import TeamFilesTab from '@/modules/teams/TeamFilesTab';
import TeamMembersTab from '@/modules/teams/TeamMembersTab';

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('posts');
  const [showActionMenu, setShowActionMenu] = useState(false);

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
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-sm rounded-lg transition-all group">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                </div>
                Assignments
              </button>
            </li>

            {/* Trắc nghiệm online */}
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-sm rounded-lg transition-all group">
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
          <div className="flex items-center gap-4 mb-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-sm border border-blue-100">Σ</div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Advanced Mathematics - Section B</h1>
                <p className="text-sm text-slate-500 mt-0.5">2024 Fall Semester • Room 402</p>
              </div>
            </div>
            
            {/* ACTION MENU DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
              </button>

              {/* Dropdown Menu */}
              {showActionMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      setShowActionMenu(false);
                      // Edit class functionality
                      alert('Edit class feature coming soon');
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors border-b border-slate-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit Class
                  </button>

                  <button
                    onClick={() => {
                      setShowActionMenu(false);
                      // Archive class functionality
                      alert('Archive class feature coming soon');
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-600 flex items-center gap-2 transition-colors border-b border-slate-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9-3h4" /></svg>
                    Archive Class
                  </button>

                  <button
                    onClick={() => {
                      setShowActionMenu(false);
                      router.push(`/teams/${params.id}/cancel`);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Cancel Class
                  </button>
                </div>
              )}
            </div>
          </div>

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
            
            {activeTab === 'posts' && <TeamPostsTab />}
            {activeTab === 'files' && <TeamFilesTab />}
            {activeTab === 'members' && <TeamMembersTab />}

          </div>
        </div>
      </div>
    </div>
  );
}