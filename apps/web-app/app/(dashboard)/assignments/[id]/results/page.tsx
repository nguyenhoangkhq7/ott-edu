"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import AssessmentResultsView from '@/modules/assignments/components/AssessmentResultsView';

export default function AssignmentResultsPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="h-full">
      <AssessmentResultsView assessmentId={id} />
    </div>
  );
}
