"use client";

import { useRouter } from 'next/navigation';
import StudentAssignmentView from '@/modules/assignments/components/StudentAssignmentView';

export default function StudentAssignmentPage() {
  const router = useRouter();

  return (
    <StudentAssignmentView
      assignmentId="assign_001"
      classId="class_001"
      className="CNM - Công nghệ Mạng"
      onBackClick={() => router.back()}
    />
  );
}
