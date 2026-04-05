"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { assessmentService, AssessmentDTO, QuestionDTO } from '@/services/api/assessment.service';
import { useAuth } from '@/shared/providers/AuthProvider';
import AssessmentSubmitModal from './AssessmentSubmitModal';

export default function AssessmentTakingView({ assessmentId, teamMemberId }: { assessmentId: string, teamMemberId: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<AssessmentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const data = await assessmentService.getAssignmentDetail(parseInt(assessmentId));
        setAssessment(data);
        
        // Use duration from backend, default to 15 mins if not set
        setTimeRemaining((data.durationMinutes || 15) * 60);

        if (data.questions && data.questions.length > 0) {
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

    if (assessmentId) {
      fetchDetail();
    }
  }, [assessmentId]);

  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  const currentQuestion = assessment?.questions[currentQuestionIdx];
  const totalQuestions = assessment?.questions.length || 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (optionId: number) => {
    if (!currentQuestion) return;
    
    setSelectedAnswers(prev => {
      const currentSelections = prev[currentQuestion.id] || [];
      
      if (currentQuestion.questionType === 'SINGLE_CHOICE') {
        return { ...prev, [currentQuestion.id]: [optionId] };
      } else {
        const next = currentSelections.includes(optionId)
          ? currentSelections.filter(id => id !== optionId)
          : [...currentSelections, optionId];
        return { ...prev, [currentQuestion.id]: next };
      }
    });
  };

  const toggleFlag = () => {
    if (!currentQuestion) return;
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
      else next.add(currentQuestion.id);
      return next;
    });
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
    if (!assessment || !user) return;
    
    try {
      const payload = {
        assignmentId: assessment.id,
        accountId: user.accountId,
        teamMemberId: teamMemberId,
        answers: Object.entries(selectedAnswers).map(([qId, optIds]) => ({
          questionId: parseInt(qId),
          selectedOptionIds: optIds
        }))
      };

      const result = await assessmentService.submitQuiz(payload);
      router.push(`/assignments/${assessment.id}/results?submissionId=${result.id}`);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Failed to submit. Please try again.");
    }
  };

  const unansweredCount = Object.values(selectedAnswers).filter(ans => ans.length === 0).length;

  if (loading) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-white">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Establishing Secure Connection...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar: Navigation & Utils */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col p-8 space-y-8 overflow-y-auto">
         <div className="bg-white border rounded-[2rem] p-8 shadow-sm text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-3">
               <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span> Time Remaining
            </div>
            <div className="text-5xl font-black text-indigo-900 tracking-tighter">
               {formatTime(timeRemaining)}
            </div>
         </div>

         <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Question Map</h3>
            <div className="grid grid-cols-5 gap-3">
               {assessment?.questions.map((q, idx) => {
                  const isAnswered = selectedAnswers[q.id]?.length > 0;
                  const isCurrent = idx === currentQuestionIdx;
                  const isFlagged = flaggedQuestions.has(q.id);
                  
                  let bgColor = 'bg-slate-100 text-slate-300';
                  if (isAnswered) bgColor = 'bg-indigo-600 text-white';
                  if (isFlagged) bgColor = 'bg-yellow-700 text-white relative';

                  return (
                    <button 
                      key={q.id}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`
                        h-11 rounded-xl text-xs font-black transition-all hover:scale-105
                        ${bgColor}
                        ${isCurrent ? 'ring-4 ring-indigo-100 ring-offset-2 border-2 border-indigo-600 scale-110 z-10' : ''}
                      `}
                    >
                       {idx + 1}
                       {isFlagged && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border-2 border-yellow-700 rounded-full"></span>}
                    </button>
                  );
               })}
            </div>
            
            <div className="flex justify-between items-center px-2 py-4 border-t border-slate-50 mt-4">
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                  <span className="text-[10px] font-bold text-slate-500">Answered</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-700 rounded-full"></span>
                  <span className="text-[10px] font-bold text-slate-500">Flagged</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-slate-200 rounded-full"></span>
                  <span className="text-[10px] font-bold text-slate-500">Not Read</span>
               </div>
            </div>
         </div>

         <div className="space-y-3 pt-4">
            <button 
              onClick={toggleFlag}
              className="w-full py-4 px-6 border-2 border-slate-100 hover:border-yellow-600 hover:bg-yellow-50 rounded-2xl flex items-center justify-center gap-3 text-slate-600 hover:text-yellow-700 font-bold transition-all"
            >
               <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12z" />
               </svg>
               Flag for Review
            </button>
            <button className="w-full py-4 px-6 border-2 border-slate-100 hover:border-slate-300 rounded-2xl flex items-center justify-center gap-3 text-slate-600 font-bold transition-all">
               <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
               </svg>
               Add Private Note
            </button>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-10 py-6 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black tracking-widest uppercase rounded-full">
                   Question {currentQuestionIdx + 1} of {totalQuestions}
                </span>
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">• {currentQuestion?.points} Points</span>
             </div>
             <button 
               onClick={() => router.back()} 
               className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-2"
             >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3">
                   <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Return to Class
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-10">
             <div className="max-w-4xl mx-auto space-y-12">
                <h2 className="text-3xl font-black text-slate-950 leading-tight">
                   {currentQuestion?.content}
                </h2>

                <div className="grid grid-cols-1 gap-4">
                   {currentQuestion?.options.map((opt, index) => {
                     const isSelected = selectedAnswers[currentQuestion.id]?.includes(opt.id);
                     const label = String.fromCharCode(65 + index);
                     return (
                       <button 
                         key={opt.id}
                         onClick={() => handleOptionSelect(opt.id)}
                         className={`
                          w-full text-left border-4 rounded-3xl p-6 flex items-center gap-6 transition-all duration-200 group
                          ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-white bg-white hover:border-slate-100 hover:shadow-md'}
                         `}
                       >
                         <div className={`
                          w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 transition-all
                          ${isSelected ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}
                        `}>
                           {label}
                         </div>
                         <div className={`text-lg font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-600'}`}>
                           {opt.content}
                         </div>
                       </button>
                     );
                   })}
                </div>

                {/* Decoration/Context Image */}
                <div className="rounded-[3rem] bg-indigo-950 p-1 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl overflow-hidden aspect-video relative flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    <div className="z-10 text-center text-white p-10">
                         <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">📝</span>
                         </div>
                         <p className="max-w-md mx-auto italic font-medium opacity-80">
                            &quot;Education is the most powerful weapon which you can use to change the world.&quot;
                         </p>
                    </div>
                </div>
             </div>
          </div>

          {/* Footer Controls */}
          <div className="bg-white border-t border-slate-200 px-10 py-8">
             <div className="max-w-4xl mx-auto flex items-center justify-between">
                <button 
                  onClick={handlePrev}
                  disabled={currentQuestionIdx === 0}
                  className="px-10 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-[10px] disabled:opacity-30 transition-all flex items-center gap-3"
                >
                   <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M15 18l-6-6 6-6" />
                   </svg>
                   Previous
                </button>

                <div className="flex gap-4">
                  <button 
                    onClick={handleNext}
                    disabled={currentQuestionIdx === totalQuestions - 1}
                    className="px-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 transition-all flex items-center gap-3"
                  >
                    Next Question
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3">
                       <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setShowSubmitModal(true)}
                    className="px-10 py-5 border-2 border-red-500 text-red-600 hover:bg-red-50 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all"
                  >
                    Submit Quiz
                  </button>
                </div>
             </div>
          </div>
      </div>

      {showSubmitModal && (
         <AssessmentSubmitModal 
            unansweredCount={unansweredCount} 
            onClose={() => setShowSubmitModal(false)}
            onSubmit={handleSubmit}
         />
      )}
    </div>
  );
}
