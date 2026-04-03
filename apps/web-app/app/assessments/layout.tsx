"use client";

import AssessmentLayout from "@/modules/assessments/components/AssessmentLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AssessmentLayout>{children}</AssessmentLayout>;
}
