"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import AssessmentTakingView from '@/modules/assignments/components/AssessmentTakingView';

export default function AssignmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // In a real app, teamMemberId would be fetched based on the user's membership in the team
  // For the demo/assignment system, we'll use a placeholder or let the view handle it.
  const teamMemberId = 1; 

  return (
    <div className="h-full bg-slate-50 min-h-screen">
      <AssessmentTakingView 
        assessmentId={id} 
        teamMemberId={teamMemberId}
      />
    </div>
  );
}
