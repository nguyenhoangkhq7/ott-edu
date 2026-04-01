"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CancelClassForm from '@/modules/teams/CancelClassForm';

export default function CancelClassPage({ params }: { params: { classId: string } }) {
  const router = useRouter();

  const classData = {
    id: params.classId,
    name: 'Advanced Mathematics - Section B',
    initials: 'AM',
    accentColor: '#3498db',
    memberCount: 28,
  };

  return <CancelClassForm onBack={() => router.back()} classData={classData} />;
}
