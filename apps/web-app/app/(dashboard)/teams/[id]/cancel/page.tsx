"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CancelClassForm from '@/modules/teams/CancelClassForm';
import { httpService } from '@/services/api/http.service';

interface CancelTeamData {
  id: string;
  name: string;
  memberCount?: number;
  initials: string;
  accentColor: string;
}

export default function CancelClassPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [teamData, setTeamData] = useState<CancelTeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await httpService.get<{ id: number; name: string; memberCount?: number }>(`/teams/${id}`);
        setTeamData({
          id: String(data.id),
          name: data.name,
          initials: data.name.substring(0, 2).toUpperCase(),
          accentColor: '#1868f0', // Standard color for now
          memberCount: data.memberCount || 0,
        });
      } catch (error) {
        console.error("Failed to fetch team details for cancellation:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTeam();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full shadow-sm"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading class details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30">
      <CancelClassForm
        onBack={() => router.back()}
        classData={teamData || undefined}
      />
    </div>
  );
}
