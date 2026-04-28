'use client';

import { useState, useCallback, useEffect } from 'react';
import axiosClient from '@/services/api/axiosClient';
import { Assignment } from '@/shared/types/quiz';

export const useAssignments = (teamId: number, role: 'STUDENT' | 'TEACHER') => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchAssignments = useCallback(async () => {
    if (!teamId) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let data: Assignment[] = [];

      if (role === 'STUDENT') {
        // Students: Get assignments for their team with pagination
        const response = await axiosClient.get<any>(
          `/api/v1/assignments/team/${teamId}?page=0&size=50`
        );
        // Handle both direct array and paginated response
        data = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.content || []);
      } else {
        // Teachers: Get their own assignments, then filter by teamId
        const response = await axiosClient.get<any>(
          `/api/v1/assignments/my-assignments?page=0&size=50`
        );
        const allAssignments = Array.isArray(response.data)
          ? response.data
          : (response.data?.content || []);
        
        // Filter by teamId (assignments with this teamId in their teamIds array)
        data = allAssignments.filter((a: Assignment) => 
          Array.isArray(a.teamIds) && a.teamIds.includes(teamId)
        );
      }

      setAssignments(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      let message = 'Không thể tải danh sách bài tập';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as any).response?.data;
        if (typeof response === 'string') {
          message = response;
        } else if (response?.message) {
          message = response.message;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [teamId, role]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments, refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  return { assignments, loading, error, refetch };
};
