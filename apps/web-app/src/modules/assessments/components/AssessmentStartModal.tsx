import React from 'react';
import { Assessment } from '../types/assessment';
import { useRouter } from 'next/navigation';

interface Props {
  assessment: Assessment;
  onClose: () => void;
}

export default function AssessmentStartModal({ assessment, onClose }: Props) {
  const router = useRouter();

  const handleStart = () => {
    // Navigate to exam taking view
    router.push(`/assessments/${assessment.id}/take`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-100/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 text-amber-700 text-xs font-bold tracking-wider mb-2">
            <span className="w-2.5 h-2.5 bg-amber-600 rotate-45"></span>
            ASSESSMENT PORTAL
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">{assessment.title}</h2>
        <p className="text-slate-500 mb-8">{assessment.subject} • Spring 2024</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-[#e0e7ff] text-indigo-600 flex items-center justify-center shrink-0">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                 <path d="M12 6v6l4 2" strokeWidth="2"/>
               </svg>
             </div>
             <div>
               <p className="text-xs font-semibold text-slate-500 tracking-wider">DURATION</p>
               <p className="text-lg font-bold text-slate-900">{assessment.durationMinutes} mins</p>
             </div>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-[#e0e7ff] text-indigo-600 flex items-center justify-center shrink-0">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               </svg>
             </div>
             <div>
               <p className="text-xs font-semibold text-slate-500 tracking-wider">TOTAL ITEMS</p>
               <p className="text-lg font-bold text-slate-900">{assessment.totalQuestions} questions</p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 tracking-wider mb-4">
           <hr className="flex-1" />
           <span>EXAM PROTOCOL</span>
           <hr className="flex-1" />
        </div>
        
        <div className="flex justify-between gap-4 mb-6">
           <div className="flex-1 border border-indigo-100 rounded-lg py-3 px-4 flex items-center gap-3 text-sm font-semibold bg-white shadow-sm border-l-4 border-l-indigo-600">
             <span className="text-indigo-600">🔒</span>
             Locked Browser
           </div>
           <div className="flex-1 border border-indigo-100 rounded-lg py-3 px-4 flex items-center gap-3 text-sm font-semibold bg-white shadow-sm border-l-4 border-l-indigo-600">
             <span className="text-indigo-600">☁️</span>
             Cloud Sync
           </div>
           <div className="flex-1 border border-indigo-100 rounded-lg py-3 px-4 flex items-center gap-3 text-sm font-semibold bg-white shadow-sm border-l-4 border-l-indigo-600">
             <span className="text-indigo-600">✨</span>
             Auto Submit
           </div>
        </div>
        
        <div className="bg-indigo-50 rounded-xl p-4 flex gap-3 text-sm text-indigo-900 mb-8 border border-indigo-100">
           <span className="text-indigo-600 font-bold shrink-0">ℹ️</span>
           <p>Ensure your internet connection is stable. Once you click <strong>Start Quiz</strong>, the timer will begin immediately and cannot be paused. Your progress is saved automatically every 30 seconds.</p>
        </div>
        
        <div className="flex flex-col items-center">
            <button 
                onClick={handleStart}
                className="w-full bg-[#434baf] hover:bg-[#343a8e] text-white py-3.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-200 flex justify-center items-center gap-2"
            >
                Start Quiz
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </button>
            <p className="text-xs text-slate-500 mt-4">
                By starting, you agree to the <a href="#" className="underline">Academic Integrity Policy</a>
            </p>
        </div>
      </div>
    </div>
  );
}
