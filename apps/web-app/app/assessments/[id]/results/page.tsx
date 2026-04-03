"use client";

import { use } from 'react';
import AssessmentResultsView from "@/modules/assessments/components/AssessmentResultsView";

export default function AssessmentResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  return <AssessmentResultsView assessmentId={unwrappedParams.id} />;
}
