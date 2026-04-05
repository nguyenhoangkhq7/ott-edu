"use client";

import React from 'react';

interface AssessmentSubmitModalProps {
  unansweredCount: number;
  onClose: () => void;
  onSubmit: () => void;
}

export default function AssessmentSubmitModal({ unansweredCount, onClose, onSubmit }: AssessmentSubmitModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
           <h3 className="text-2xl font-black text-slate-900 tracking-tight">Are you sure you want to submit?</h3>
           <button 
             onClick={onClose}
             className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
           >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                 <path d="M18 6L6 18M6 6l12 12" />
              </svg>
           </button>
        </div>

        {/* Warning Card */}
        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 flex gap-5 mb-10">
           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2.5">
                 <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                 <line x1="12" y1="9" x2="12" y2="13" />
                 <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
           </div>
           <div>
              <h4 className="text-sm font-black text-orange-900 uppercase tracking-widest mb-1">Review Required</h4>
              <p className="text-sm text-orange-800/80 font-medium leading-relaxed">
                 You have <span className="font-bold underline">{unansweredCount} unanswered questions</span>. Submitting now will finalize your grade as-is.
              </p>
           </div>
        </div>

        <p className="text-sm text-slate-400 font-medium mb-10 leading-relaxed italic">
           Once you click submit, you will not be able to return to this assessment. Your progress will be saved and sent to your instructor.
        </p>
        
        {/* Actions */}
        <div className="flex gap-4">
           <button
             onClick={onClose}
             className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
           >
             Go Back
           </button>
           <button
             onClick={onSubmit}
             className="flex-1 py-5 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 transition-all"
           >
             Submit Anyway
           </button>
        </div>
      </div>
    </div>
  );
}
