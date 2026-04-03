import React from 'react';

interface Props {
  unansweredCount: number;
  onClose: () => void;
  onSubmit: () => void;
}

export default function AssessmentSubmitModal({ unansweredCount, onClose, onSubmit }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in-95 duration-200">
        <button 
           onClick={onClose}
           className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        
        <h2 className="text-xl font-bold text-slate-900 mb-6">Are you sure you want to submit?</h2>
        
        {unansweredCount > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3 text-sm text-amber-900 mb-6 shadow-sm">
               <span className="text-amber-600 mt-0.5">⚠️</span>
               <div>
                  <h4 className="font-bold text-amber-800 mb-1">Review Required</h4>
                  <p>You have <strong>{unansweredCount} unanswered questions</strong>. Submitting now will finalize your grade as-is.</p>
               </div>
            </div>
        )}
        
        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
           Once you click submit, you will not be able to return to this assessment. Your progress will be saved and sent to Dr. Aris.
        </p>
        
        <div className="flex gap-4">
            <button 
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
            >
                Go Back
            </button>
            <button 
                onClick={onSubmit}
                className="flex-1 py-3 bg-[#434baf] hover:bg-[#343a8e] text-white rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-200"
            >
                Submit Anyway
            </button>
        </div>
      </div>
    </div>
  );
}
