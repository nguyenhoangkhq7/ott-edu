"use client";

import { useRouter } from 'next/navigation';
import EditClassForm from '@/modules/teams/EditClassForm';

export default function EditClassPage({ params }: { params: { classId: string } }) {
  const router = useRouter();

  const classData = {
    id: params.classId,
    name: 'Advanced Mathematics - Section B',
    code: 'MATH101-B',
    description: 'Advanced Mathematics course covering calculus, linear algebra, and differential equations for second-year students.',
    initials: 'AM',
    accentColor: '#3498db',
    maxStudents: 50,
    currentStudents: 28,
    department: 'Mathematics',
    school: 'Faculty of Science',
    createdAt: '2024-01-15',
  };

  return <EditClassForm onBack={() => router.back()} classData={classData} />;
}
