"use client";

import { use } from 'react';
import AssessmentTakingView from "@/modules/assessments/components/AssessmentTakingView";

export default function TakeAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  return <AssessmentTakingView assessmentId={unwrappedParams.id} />;
}
