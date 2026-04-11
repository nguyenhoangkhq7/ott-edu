"use client";

import { useRouter } from 'next/navigation';
import StudentGradeView from '@/modules/assignments/components/StudentGradeView';

export default function StudentGradeViewPage() {
  const router = useRouter();

  return (
    <StudentGradeView
      submissionId="sub_001"
      classId="class_001"
      className="CNM - Công nghệ Mạng"
      onBackClick={() => router.back()}
      allowChat={true}
    />
  );
}
