"use client";

import React, { useState, useEffect } from 'react';
import { assessmentService, AssessmentDTO } from '@/services/api/assessment.service';
import { Assessment } from '../types/assessment';
import AssessmentStartModal from './AssessmentStartModal';

interface Props {
  teamId?: string | number;
}

export default function ActiveAssessmentsList({ teamId }: Props) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      setLoading(true);
      try {
        // If teamId is provided, fetch for that team. Otherwise fetch all (not currently implemented in BE but placeholder)
        const id = typeof teamId === 'string' ? parseInt(teamId) : (teamId || 1);
        const data = await assessmentService.getAssignmentsByTeam(id);
        
        // Map backend DTO to frontend UI model
        const mappedData: Assessment[] = data.map(item => ({
          id: item.id.toString(),
          title: item.title,
          subject: item.type === 'QUIZ' ? 'Interactive Quiz' : 'Essay Assignment',
          description: item.instructions || 'No description provided.',
          status: 'AVAILABLE', // Backend doesn't return status yet, default to AVAILABLE
          dueDate: new Date(item.dueDate).toLocaleDateString(),
          durationMinutes: 15, // Default or fetch if available
          maxScore: item.maxScore,
          totalQuestions: item.questions?.length || 0
        }));
        
        setAssessments(mappedData);
      } catch (error) {
        console.error("Failed to fetch assessments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [teamId]);

  const getStatusBadge = (status: Assessment['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md tracking-wider">AVAILABLE</span>;
      case 'COMPLETED':
        return <span className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md tracking-wider">COMPLETED</span>;
      case 'OVERDUE':
        return <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded-md tracking-wider">OVERDUE</span>;
      case 'CLOSED':
        return <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-md tracking-wider">CLOSED</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex gap-8">
      {/* Main Content Area */}
      <div className="flex-1 pb-10">
        <div className="mb-8">
            <div className="w-16 h-1 bg-amber-700 mb-6"></div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Active Assessments</h2>
            <p className="text-slate-500 max-w-2xl text-sm">
                Review your current course evaluations, midterms, and weekly quizzes. Stay on top of your deadlines to maintain academic excellence.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
             <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-500 font-medium">Fetching assessments from server...</p>
             </div>
          ) : assessments.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 text-center px-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-2xl mb-4">📭</div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">No assessments found</h3>
                <p className="text-slate-500 text-sm max-w-xs">There are no assessments assigned to this class yet. Check back later!</p>
            </div>
          ) : (
            assessments.map((assessment) => (
              <div key={assessment.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col transition-all hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl
                      ${assessment.status === 'AVAILABLE' ? 'bg-[#eef2ff] text-indigo-600' : ''}
                      ${assessment.status === 'COMPLETED' ? 'bg-indigo-100/50 text-indigo-500' : ''}
                      ${assessment.status === 'OVERDUE' ? 'bg-red-50 text-red-400' : ''}
                  `}>
                    {assessment.status === 'AVAILABLE' && '🧮'}
                    {assessment.status === 'COMPLETED' && '📐'}
                    {assessment.status === 'OVERDUE' && '⚠️'}
                    {assessment.status === 'CLOSED' && '📖'}
                  </div>
                  {getStatusBadge(assessment.status)}
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">{assessment.title}</h3>
                <p className="text-slate-500 text-sm mb-6 flex-1">{assessment.description}</p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                    <span className="text-slate-400">📅</span> 
                    {assessment.status === 'OVERDUE' ? <span className="text-red-500">Deadline: {assessment.dueDate}</span> : <span>Due: {assessment.dueDate}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                    {assessment.status === 'COMPLETED' ? (
                       <>
                          <span className="text-slate-400">✔️</span> Submitted: {assessment.submittedDate}
                       </>
                    ) : (
                       <>
                          <span className="text-slate-400">⏱️</span> Duration: {assessment.durationMinutes} Minutes
                       </>
                    )}
                  </div>
                  {assessment.status === 'COMPLETED' && assessment.score !== undefined && (
                     <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                        <span className="text-slate-400">⭐</span> Result: {assessment.score} / {assessment.maxScore}
                     </div>
                  )}
                </div>
                
                <div className="mt-auto">
                   {assessment.status === 'AVAILABLE' && (
                      <button 
                          onClick={() => setSelectedAssessment(assessment)}
                          className="w-full py-3 bg-[#434baf] hover:bg-[#343a8e] text-white rounded-xl font-semibold transition-colors shadow-sm"
                      >
                          Start Assessment
                      </button>
                   )}
                   {assessment.status === 'COMPLETED' && (
                      <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold transition-colors">
                          View Results
                      </button>
                   )}
                   {(assessment.status === 'OVERDUE' || assessment.status === 'CLOSED') && (
                      <button disabled className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl font-semibold cursor-not-allowed">
                          Closed
                      </button>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 shrink-0 hidden xl:flex flex-col gap-6">
         {/* Study Tips */}
         <div className="bg-[#f9fafb] rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span>💡</span> Study Tips
            </h3>
            
            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-slate-50">
                <h4 className="text-xs font-bold text-indigo-700 tracking-wider mb-2">TIME MANAGEMENT</h4>
                <p className="text-sm text-slate-600 leading-relaxed">Calculus exams usually take the full 90 minutes. Don't rush the integration steps.</p>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-50">
                <h4 className="text-xs font-bold text-amber-700 tracking-wider mb-2">RESOURCE ALERT</h4>
                <p className="text-sm text-slate-600 leading-relaxed">Check the "Advanced Pedagogy" resource folder for the study guide before starting.</p>
            </div>
         </div>
         
         {/* Class Performance */}
         <div className="bg-white rounded-2xl p-6 border-2 border-indigo-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-6">Class Performance</h3>
            
            <div className="flex items-end justify-between h-32 mb-6 gap-2">
               <div className="w-full bg-slate-100 rounded-t-sm h-[30%]"></div>
               <div className="w-full bg-indigo-200 rounded-t-sm h-[60%]"></div>
               <div className="w-full bg-indigo-600 rounded-t-sm h-[100%] shadow-lg shadow-indigo-200"></div>
               <div className="w-full bg-slate-100 rounded-t-sm h-[40%]"></div>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
                Your current average is <strong>12% higher</strong> than the class mean. Keep up the momentum!
            </p>
         </div>
      </div>

      {selectedAssessment && (
          <AssessmentStartModal 
             assessment={selectedAssessment} 
             onClose={() => setSelectedAssessment(null)} 
          />
      )}
    </div>
  );
}
