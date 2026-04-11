"use client";

import { useRouter } from 'next/navigation';
import GradingDashboard from '@/modules/assignments/components/GradingDashboard';

export default function GradingPage() {
  const router = useRouter();

  return (
    <GradingDashboard
      assignmentTitle="Bài Kiểm Tra Chương 3: Phương Trình Bậc 2"
      maxPoints={10}
      onBackClick={() => router.back()}
    />
  );
}
