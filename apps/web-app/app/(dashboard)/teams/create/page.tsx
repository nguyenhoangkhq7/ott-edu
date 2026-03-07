"use client";

import React, { useState } from 'react';
import Link from 'next/link';
// Import 2 component trực tiếp từ thư mục modules/teams
import SelectTeamType from '@/modules/teams/SelectTeamType';
import CreateClassForm from '@/modules/teams/CreateClassForm';

export default function TeamTypePage() {
  const [selectedType, setSelectedType] = useState<string>('class');
  const [activeMenu, setActiveMenu] = useState<string>('template');
  const [currentStep, setCurrentStep] = useState<number>(1);

  return (
    <div className="flex h-[calc(100vh-60px)] w-full bg-white text-gray-800">
      
      {/* ================= CỘT TRÁI: Menu điều hướng ================= */}
      <div className="w-[280px] border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <Link href="/teams" className="flex items-center gap-2 text-gray-700 hover:text-black w-fit">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span className="font-bold text-lg">Create team</span>
          </Link>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            <li>
              <button onClick={() => { setActiveMenu('template'); setCurrentStep(1); }} className={`w-full text-left px-6 py-2.5 text-sm transition-colors ${activeMenu === 'template' ? 'font-semibold border-l-[3px] border-black bg-gray-50' : 'text-gray-600 hover:bg-gray-50 border-l-[3px] border-transparent'}`}>
                From template
              </button>
            </li>
            <li>
              <button onClick={() => { setActiveMenu('other_group'); setCurrentStep(1); }} className={`w-full text-left px-6 py-2.5 text-sm transition-colors ${activeMenu === 'other_group' ? 'font-semibold border-l-[3px] border-black bg-gray-50' : 'text-gray-600 hover:bg-gray-50 border-l-[3px] border-transparent'}`}>
                From another group
              </button>
            </li>
            <li>
              <button onClick={() => { setActiveMenu('from_team'); setCurrentStep(1); }} className={`w-full text-left px-6 py-2.5 text-sm transition-colors ${activeMenu === 'from_team' ? 'font-semibold border-l-[3px] border-black bg-gray-50' : 'text-gray-600 hover:bg-gray-50 border-l-[3px] border-transparent'}`}>
                From a team
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* ================= CỘT PHẢI: Nội dung chính ================= */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto bg-[#f0f4f8] p-6 relative">
        
        {activeMenu === 'template' && currentStep === 1 && (
          <SelectTeamType 
            selectedType={selectedType} 
            setSelectedType={setSelectedType} 
            onNextStep={() => setCurrentStep(2)} 
          />
        )}

        {activeMenu === 'template' && currentStep === 2 && (
          <CreateClassForm 
            onBack={() => setCurrentStep(1)} 
          />
        )}

        {activeMenu !== 'template' && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Feature under development...</p>
          </div>
        )}

      </div>
    </div>
  );
}