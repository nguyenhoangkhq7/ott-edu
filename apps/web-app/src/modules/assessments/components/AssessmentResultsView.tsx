"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { mockAssessmentResult } from '../mocks/assessmentData';

export default function AssessmentResultsView({ assessmentId }: { assessmentId: string }) {
  const searchParams = useSearchParams();
  const scoreParam = searchParams.get('score');
  
  const result = {
    ...mockAssessmentResult,
    scorePoints: scoreParam ? parseFloat(scoreParam) : mockAssessmentResult.scorePoints,
    scorePercentage: scoreParam ? (parseFloat(scoreParam) / mockAssessmentResult.maxPoints) * 100 : mockAssessmentResult.scorePercentage
  };

  return (
    <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Column */}
      <div className="lg:col-span-2 flex flex-col gap-6 pb-10">
         {/* Hero Banner */}
         <div className="bg-[#4a55a2] rounded-3xl p-10 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-8 shadow-xl shadow-indigo-100">
            <div className="flex flex-col items-center sm:items-start text-white max-w-sm">
               <p className="text-xs font-bold tracking-widest text-[#a5b4fc] mb-6 uppercase">Assessment Completed</p>
               <h2 className="text-4xl font-extrabold mb-4 font-serif">Excellent Work, Alex!</h2>
               <p className="text-indigo-100 text-sm leading-relaxed mb-8 text-center sm:text-left">
                  You've successfully mastered the core concepts of pedagogical frameworks with a Distinction-level score.
               </p>
               
               <div className="flex gap-4">
                  <button className="px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-xl text-sm transition-transform hover:scale-105 shadow-md flex items-center gap-2">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                     Download Certificate
                  </button>
                  <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl text-sm transition-colors shadow-none">
                     Review Answers
                  </button>
               </div>
            </div>
            
            {/* Score Circle */}
            <div className="w-48 h-56 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md flex flex-col items-center justify-center shrink-0">
               <div className="w-28 h-28 relative mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-indigo-400/30" />
                     <circle 
                        cx="50" cy="50" r="45" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                        strokeDasharray={`${(result.scorePercentage * 283) / 100} 283`}
                     />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-3xl font-extrabold text-white">{result.scorePercentage}%</span>
                     <span className="text-[9px] font-bold tracking-widest text-[#a5b4fc] mt-1 uppercase">Distinction</span>
                  </div>
               </div>
               <div className="text-center">
                  <p className="text-xs text-indigo-100 font-medium">Score: {result.scorePoints} / {result.maxPoints} Points</p>
                  <p className="text-xs text-indigo-100/70 mt-1">Time: {Math.floor(result.timeSpentSeconds / 60)}m {result.timeSpentSeconds % 60}s</p>
               </div>
            </div>
         </div>
         
         {/* Class Comparison */}
         <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-8 flex items-center gap-3">
               <span className="text-indigo-600">📊</span> Class Comparison
            </h3>
            
            <div className="space-y-6 mb-8">
               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                     <span>Your Score</span>
                     <span className="text-indigo-600">{result.classPerformance.userScorePercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-6 rounded-md overflow-hidden relative">
                     <div className="absolute top-0 left-0 bg-[#4a55a2] h-full" style={{ width: `${result.classPerformance.userScorePercentage}%` }}></div>
                     <span className="absolute left-3 top-1 text-[10px] text-white font-bold tracking-widest uppercase">Excellent</span>
                  </div>
               </div>
               
               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                     <span>Class Average</span>
                     <span className="text-slate-500">{result.classPerformance.averageScorePercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-6 rounded-md overflow-hidden relative">
                     <div className="absolute top-0 left-0 bg-slate-400 h-full" style={{ width: `${result.classPerformance.averageScorePercentage}%` }}></div>
                     <span className="absolute left-3 top-1 text-[10px] text-white font-bold tracking-widest uppercase">Average</span>
                  </div>
               </div>
            </div>
            
            <p className="text-xs text-slate-500 italic">
               You scored higher than {Math.round((result.classPerformance.totalStudents - result.classPerformance.userRank) / result.classPerformance.totalStudents * 100)}% of your classmates. Your rank: {result.classPerformance.userRank} / {result.classPerformance.totalStudents}.
            </p>
         </div>
         
         {/* Topic Breakdown */}
         <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-3">
               <span className="text-indigo-600">📋</span> Detailed Topic Breakdown
            </h3>
            
            <table className="w-full text-left">
               <thead>
                  <tr className="border-b border-slate-100">
                     <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Topic Area</th>
                     <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-sans opacity-0 lg:opacity-100">Performance</th>
                     <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-sans text-right">Result</th>
                  </tr>
               </thead>
               <tbody className="text-sm border-b border-slate-50">
                  {result.topicPerformances.map((topic, i) => (
                    <tr key={i} className="group">
                        <td className="py-5 font-semibold text-slate-800 pr-4">{topic.name}</td>
                        <td className="py-5 hidden lg:table-cell align-middle">
                           <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden w-24">
                              <div 
                                className={`h-full ${topic.scorePercentage >= 90 ? 'bg-emerald-500' : topic.scorePercentage >= 70 ? 'bg-green-400' : 'bg-orange-400'}`}
                                style={{ width: `${topic.scorePercentage}%` }}
                              />
                           </div>
                        </td>
                        <td className="py-5 text-right font-bold">
                           {topic.scorePercentage >= 90 ? (
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] rounded uppercase tracking-wider">Strength</span>
                           ) : topic.scorePercentage >= 70 ? (
                              <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] rounded uppercase tracking-wider">Proficient</span>
                           ) : (
                              <span className="px-2 py-1 bg-orange-50 text-orange-600 text-[10px] rounded uppercase tracking-wider">Needs Review</span>
                           )}
                        </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6">
         {/* Actions */}
         <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-6 uppercase">Actions</h3>
            
            <button className="w-full py-3.5 bg-[#646bb7] hover:bg-[#434baf] text-white rounded-xl font-bold text-sm transition-colors mb-2 flex items-center justify-center gap-2">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
               Retake Assessment
            </button>
            <p className="text-[10px] text-center text-slate-400 font-medium tracking-wider mb-8 uppercase">1 of 3 attempts remaining</p>
            
            <button className="w-full py-3.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Return to Course
            </button>
         </div>
         
         {/* Next Steps */}
         <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden flex flex-col h-full">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl"></div>
            
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-3">
               <span className="text-indigo-600">⚡</span> Next Steps
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed relative z-10">
               Personalized recommendations to improve your score in "<span className="text-slate-700 font-semibold">Frameworks</span>":
            </p>
            
            <div className="space-y-4 mb-6 flex-1">
               <div className="flex gap-4">
                  <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">📖</div>
                  <div>
                     <h4 className="font-bold text-slate-800 text-sm">Advanced Taxonomy Models</h4>
                     <p className="text-[10px] text-slate-400 mt-0.5 tracking-wider uppercase font-semibold">Lesson • 15 mins</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">▶️</div>
                  <div>
                     <h4 className="font-bold text-slate-800 text-sm">Framework Application Video</h4>
                     <p className="text-[10px] text-slate-400 mt-0.5 tracking-wider uppercase font-semibold">Video • 8 mins</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <div className="w-12 h-12 bg-fuchsia-50 text-fuchsia-500 rounded-xl flex items-center justify-center shrink-0">❓</div>
                  <div>
                     <h4 className="font-bold text-slate-800 text-sm">Practice: Framework Drill</h4>
                     <p className="text-[10px] text-slate-400 mt-0.5 tracking-wider uppercase font-semibold">Interactive • 5 questions</p>
                  </div>
               </div>
            </div>
            
            <button className="text-indigo-600 font-bold text-sm w-full py-3 hover:bg-indigo-50 rounded-xl transition-colors">
               View All Resources
            </button>
         </div>
      </div>
    </div>
  );
}
