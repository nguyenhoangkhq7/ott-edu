"use client";

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import EditClassForm from '@/modules/teams/EditClassForm';
import { httpService } from '@/services/api/http.service';

interface ClassData {
  id: string;
  name: string;
  description: string;
  initials: string;
  accentColor: string;
  isActive?: boolean;
  active?: boolean;
  createdAt?: string;
}

export default function EditClassPage() {
  const router = useRouter();
  const params = useParams() as { id: string };
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!params?.id) {
      setErrorMessage('Invalid team ID');
      setIsLoading(false);
      return;
    }

    const fetchClass = async () => {
      try {
        // Try to fetch team directly with access check
        const team = await httpService.get<ClassData>(`/teams/${params.id}`);
        if (team) {
          setClassData({
            id: String(team.id),
            name: team.name,
            description: team.description || '',
            initials: team.name.substring(0, 2).toUpperCase(),
            accentColor: '#3498db',
            isActive: team.isActive,
            active: team.active,
            createdAt: team.createdAt ? new Date(team.createdAt).toLocaleDateString() : '',
          });
        }
      } catch (error: unknown) {
        const err = error as { message?: string };
        const errorMsg = String(err?.message || 'Failed to fetch class information');
        console.error("Failed to fetch class info:", error);
        
        if (errorMsg.includes('not found') || errorMsg.includes('not a member')) {
          setErrorMessage('Class not found or you don\'t have access.');
        } else if (errorMsg.includes('Token') || errorMsg.includes('invalid')) {
          setErrorMessage('Your session has expired. Please log in again.');
        } else {
          setErrorMessage(errorMsg);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchClass();
  }, [params?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-60px)]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-60px)]">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 max-w-md text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {errorMessage || 'Class not found or you don\'t have access.'}
          </h3>
          {errorMessage && errorMessage !== 'Class not found or you don\'t have access.' && (
            <p className="text-sm text-gray-600 mb-4">
              Please check your permissions or try again later.
            </p>
          )}
        </div>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">Turn Back</button>
      </div>
    );
  }

  return <EditClassForm onBack={() => router.back()} classData={classData} />;
}
