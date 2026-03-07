"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// Import 3 file Tab mà chúng ta đã tạo
import TeamPostsTab from '@/modules/teams/TeamPostsTab';
import TeamFilesTab from '@/modules/teams/TeamFilesTab';
import TeamMembersTab from '@/modules/teams/TeamMembersTab';

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('posts');

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

        <div className="px-4 py-3 flex items-center justify-between group cursor-pointer hover:bg-slate-200/50 rounded-md mx-2 transition-colors">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">AM</div>
            <span className="font-semibold text-sm truncate">Advanced Math...</span>
          </div>
          <button className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-4 mb-2">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Channels</h3>
          </div>
          <ul className="space-y-0.5 px-2">
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
        </div>
      </div>

      {/* ================= CỘT PHẢI: Nội dung chính ================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* Header & Tabs */}
        <div className="px-8 pt-8 border-b border-slate-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-sm border border-blue-100">Σ</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Advanced Mathematics - Section B</h1>
              <p className="text-sm text-slate-500 mt-0.5">2024 Fall Semester • Room 402</p>
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
            
            {/* Đã thêm component TeamMembersTab thay cho dòng text coming soon */}
            {activeTab === 'members' && <TeamMembersTab />}

          </div>
        </div>
      </div>
    </div>
  );
}