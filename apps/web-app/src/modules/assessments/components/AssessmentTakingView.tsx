"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { assessmentService, AssessmentDTO, QuestionDTO } from '@/services/api/assessment.service';
import { useAuth } from '@/shared/providers/AuthProvider';
import AssessmentSubmitModal from './AssessmentSubmitModal';

export default function AssessmentTakingView({ assessmentId }: { assessmentId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<AssessmentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({});
  const [timeRemaining, setTimeRemaining] = useState(15 * 60); // 15 mins default
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await assessmentService.getAssignmentDetail(parseInt(assessmentId));
        setAssessment(data);
        if (data.questions && data.questions.length > 0) {
          // Initialize selected answers
          const initialAnswers: Record<number, number[]> = {};
          data.questions.forEach(q => {
            initialAnswers[q.id] = [];
          });
          setSelectedAnswers(initialAnswers);
        }
      } catch (error) {
        console.error("Failed to fetch assessment details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [assessmentId]);

  const currentQuestion = assessment?.questions[currentQuestionIdx];
  const totalQuestions = assessment?.questions.length || 0;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (optionId: number) => {
    if (!currentQuestion) return;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: [optionId] // For single choice
    }));
  };

  const handleNext = () => {
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Prepare payload
      const payload = {
        assignmentId: parseInt(assessmentId),
        accountId: user?.accountId ? user.accountId : 1, // Fix: Use accountId from AuthUser
        teamMemberId: 1, // Fallback for demo
        answers: Object.entries(selectedAnswers).map(([qId, optIds]) => ({
          questionId: parseInt(qId),
          selectedOptionIds: optIds
        }))
      };

      const result = await assessmentService.submitQuiz(payload);
      
      // Navigate to results with state
      router.push(`/assessments/${assessmentId}/results?score=${result.score}`);
    } catch (error) {
       console.error("Submission failed:", error);
       alert("Failed to submit quiz. Please check your connection.");
    }
  };

  if (loading) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-white flex-col">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-500 font-bold">Synchronizing with Exam Server...</p>
       </div>
    );
  }

  return (
    <div className="flex h-full gap-8 max-w-7xl mx-auto">
      {/* Left Area: Question Content */}
      <div className="flex-1 pb-10 flex flex-col">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase">QUESTION {currentQuestionIdx + 1} OF {totalQuestions}</span>
              <span className="text-xs text-slate-500 font-medium">• {currentQuestion?.points} Points</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 leading-snug">
              {currentQuestion?.content}
            </h2>
         </div>

         {/* Options */}
         <div className="flex flex-col gap-4 mb-8 flex-1">
            {currentQuestion?.options.map((opt, index) => {
              const isSelected = selectedAnswers[currentQuestion.id]?.includes(opt.id);
              const label = String.fromCharCode(65 + index); // A, B, C...
              return (
                <div 
                  key={opt.id}
                  onClick={() => handleOptionSelect(opt.id)}
                  className={`border rounded-xl p-5 flex items-start gap-4 cursor-pointer transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50/50 shadow-sm' : 'border-slate-200 hover:border-indigo-300 bg-white'}`}
                >
                   <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                     {label}
                   </div>
                   <p className={`text-sm mt-1 -translate-y-0.5 leading-relaxed ${isSelected ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                     {opt.content}
                   </p>
                </div>
              )
            })}
         </div>
         
         {/* Question Image (Mock) */}
         <div className="w-full h-64 bg-teal-800 rounded-2xl mb-8 overflow-hidden relative flex items-center justify-center text-teal-100 shadow-sm shadow-slate-200">
             {/* Abstract placeholder image */}
             <div className="absolute inset-0 bg-gradient-to-br from-teal-900 to-teal-700 opacity-90"></div>
             <div className="relative z-10 w-48 h-32 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl skew-y-6">
                <span className="text-4xl text-white">✏️</span>
             </div>
             <div className="absolute bottom-4 right-4 w-12 h-12 bg-amber-400 rounded-full blur-md opacity-60"></div>
         </div>

         {/* Bottom Actions */}
         <div className="flex items-center justify-between pt-6 border-t border-slate-200 mt-auto">
            <button 
               onClick={handlePrev}
               className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
            >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
               Previous
            </button>
            
            <div className="flex gap-4">
               <button 
                  onClick={handleNext}
                  className="px-8 py-3 bg-[#434baf] hover:bg-[#343a8e] text-white rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2"
               >
                  Next Question
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
               </button>
               <button 
                  onClick={() => setShowSubmitModal(true)}
                  className="px-8 py-3 bg-white hover:bg-red-50 text-red-600 border border-red-600 rounded-xl font-bold text-sm transition-colors"
               >
                  Submit Quiz
               </button>
            </div>
         </div>
      </div>

      {/* Right Sidebar: Tools */}
      <div className="w-80 shrink-0 flex flex-col gap-6">
         {/* Timer */}
         <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm border-t-4 border-t-indigo-600 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 tracking-wider mb-2">
               <span>🕒</span> TIME REMAINING
            </div>
            <div className="text-4xl font-extrabold text-indigo-700 tracking-tight">
               {formatTime(timeRemaining)}
            </div>
         </div>

         {/* Status Legend */}
         <div className="flex justify-between px-2 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
            <div className="flex flex-col items-center gap-1">
               <span className="w-3 h-3 rounded-full bg-indigo-600"></span> Answered
            </div>
            <div className="flex flex-col items-center gap-1">
               <span className="w-3 h-3 rounded-full bg-amber-700"></span> Flagged
            </div>
            <div className="flex flex-col items-center gap-1">
               <span className="w-3 h-3 rounded-full bg-slate-300"></span> Not Read
            </div>
         </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 tracking-wider mb-4">QUESTION MAP</h3>
            <div className="grid grid-cols-5 gap-2">
               {assessment?.questions.map((q, idx) => {
                  const isAnswered = selectedAnswers[q.id]?.length > 0;
                  const isCurrent = idx === currentQuestionIdx;
                  return (
                    <button 
                      key={q.id}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`
                         h-10 rounded-lg text-sm font-bold flex items-center justify-center transition-colors relative
                         ${isAnswered ? 'bg-indigo-800 text-white shadow-sm' : 'bg-slate-100 text-slate-400'}
                         ${isCurrent ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}
                      `}
                    >
                       {idx + 1}
                    </button>
                  );
               })}
            </div>
         </div>

         {/* Actions */}
         <button className="py-4 bg-white rounded-xl shadow-sm border border-slate-100 font-bold text-sm text-slate-700 hover:bg-slate-50 flex justify-center items-center gap-2">
            <span>⚑</span> Flag for Review
         </button>
         <button className="py-4 bg-white rounded-xl shadow-sm border border-slate-100 font-bold text-sm text-slate-700 hover:bg-slate-50 flex justify-center items-center gap-2">
            <span>✏️</span> Add Private Note
         </button>
      </div>

      {showSubmitModal && (
         <AssessmentSubmitModal 
            unansweredCount={2} 
            onClose={() => setShowSubmitModal(false)}
            onSubmit={handleSubmit}
         />
      )}
    </div>
  );
}
