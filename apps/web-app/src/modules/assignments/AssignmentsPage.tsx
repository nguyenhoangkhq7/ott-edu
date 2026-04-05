"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { assessmentService, AssessmentDTO } from '@/services/api/assessment.service';
import { useAuth } from '@/shared/providers/AuthProvider';

export default function AssignmentsPage() {
  const { user: _user } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      setLoading(true);
      try {
        // For now, we fetch assignments for team 1 (default class)
        // In a real app, this would come from the current route or user context
        const data = await assessmentService.getAssignmentsByTeam(1);
        setAssessments(data);
      } catch (error) {
        console.error("Failed to fetch assessments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const getStatusInfo = (assessment: AssessmentDTO) => {
    const now = new Date();
    const dueDate = new Date(assessment.dueDate);
    
    // Mocking submission status since we don't have it in the basic DTO yet
    const isCompleted = false; 

    if (isCompleted) return { label: 'COMPLETED', color: 'bg-slate-100 text-slate-500' };
    if (now > dueDate) return { label: 'OVERDUE', color: 'bg-red-100 text-red-600' };
    return { label: 'AVAILABLE', color: 'bg-indigo-100 text-indigo-700' };
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Active Assessments</h1>
        <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
          Review your current course evaluations, midterms, and weekly quizzes. Stay on top of your deadlines to maintain academic excellence.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content: Assessment Cards */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assessments.map((item) => {
              const status = getStatusInfo(item);
              return (
                <div key={item.id} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">
                    {item.instructions || "No specific instructions provided for this assessment."}
                  </p>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>Due: {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>Duration: {item.durationMinutes} Minutes</span>
                    </div>
                  </div>

                  <Link 
                    href={`/assignments/${item.id}`}
                    className="block w-full text-center py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100"
                  >
                    Start Assessment
                  </Link>
                </div>
              );
            })}

            {assessments.length === 0 && (
              <div className="col-span-full py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center">
                <p className="text-slate-400 font-bold">No active assessments found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Space (Study Tips, Performance) */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <span className="text-xl">💡</span>
                <h3 className="font-bold text-slate-900">Study Tips</h3>
             </div>
             <div className="space-y-6">
                <div className="p-5 bg-indigo-50 rounded-2xl">
                   <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-2">Time Management</h4>
                   <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      Calculus exams usually take the full 90 minutes. Don&apos;t rush the integration steps.
                   </p>
                </div>
                <div className="p-5 bg-orange-50 rounded-2xl">
                   <h4 className="text-[10px] font-black text-orange-700 uppercase tracking-widest mb-2">Resource Alert</h4>
                   <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      Check the &quot;Advanced Pedagogy&quot; resource folder for the study guide before starting.
                   </p>
                </div>
             </div>
          </div>

          <div className="bg-indigo-900 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100">
             <h3 className="font-bold mb-4">Class Performance</h3>
             <div className="flex items-end gap-2 h-32 mb-6">
                <div className="flex-1 bg-white/20 rounded-lg h-[40%]"></div>
                <div className="flex-1 bg-white/40 rounded-lg h-[70%]"></div>
                <div className="flex-1 bg-white rounded-lg h-[100%]"></div>
                <div className="flex-1 bg-white/20 rounded-lg h-[50%]"></div>
             </div>
             <p className="text-xs font-medium text-white/70 leading-relaxed">
                Your current average is <span className="text-white font-bold text-sm">12% higher</span> than the class mean. Keep up the momentum!
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}