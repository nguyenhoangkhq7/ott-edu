"use client";

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AssessmentResultsView({ _assessmentId }: { _assessmentId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const score = parseFloat(searchParams.get('score') || '0');
  const maxScore = 10; // Default or fetch from assignment

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-6">
      <div className="max-w-2xl w-full bg-white rounded-[3rem] p-16 shadow-2xl shadow-indigo-100 border border-slate-100 text-center relative overflow-hidden">
        {/* Abstract Background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-60"></div>
        
        <div className="relative z-10">
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-10 text-4xl shadow-inner">
             ✨
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Assignment Submitted!</h1>
          <p className="text-slate-500 font-medium mb-12 max-w-sm mx-auto leading-relaxed">
            Congratulations! Your responses have been recorded and graded automatically.
          </p>
          
          <div className="inline-block p-1 bg-slate-100 rounded-[2.5rem] mb-12">
            <div className="bg-white rounded-[2.2rem] px-12 py-8 flex flex-col items-center shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Final Score</span>
                <div className="flex items-baseline gap-1">
                   <span className="text-7xl font-black text-indigo-600 tracking-tighter">{score}</span>
                   <span className="text-2xl font-bold text-slate-300">/ {maxScore}</span>
                </div>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
             <button 
                onClick={() => router.push('/teams/my')}
                className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
             >
                Return to Dashboard
             </button>
             <button 
                className="px-8 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all"
             >
                Review Answers
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
