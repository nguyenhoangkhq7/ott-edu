'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import apiClient from '@/services/api/axios';
import { Assignment } from '@/shared/types/quiz';

interface PaginatedResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export const useAssignments = (teamId: number, role: 'STUDENT' | 'TEACHER') => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAssignments = useCallback(async () => {
    // Clear state and create new AbortController for this request
    setAssignments([]);
    setError(null);
    setLoading(true);

    // Cancel previous request if still in flight
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    try {
      if (!teamId) {
        setAssignments([]);
        setLoading(false);
        return;
      }

      let data: Assignment[] = [];

      if (role === 'STUDENT') {
        // Students: Get assignments for their team with pagination
        const response = await apiClient.get<PaginatedResponse<Assignment> | Assignment[]>(
          `/api/v1/assignments/team/${teamId}?page=0&size=50`,
          { signal }
        );
        // Handle both direct array and paginated response
        data = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.content || []);
      } else {
        // Teachers: Get their own assignments, then filter by teamId
        const response = await apiClient.get<PaginatedResponse<Assignment> | Assignment[]>(
          `/api/v1/assignments/my-assignments?page=0&size=50`,
          { signal }
        );
        const allAssignments = Array.isArray(response.data)
          ? response.data
          : (response.data?.content || []);
        
        // Filter by teamId (assignments with this teamId in their teamIds array)
        data = allAssignments.filter((a: Assignment) => 
          Array.isArray(a.teamIds) && a.teamIds.includes(teamId)
        );
      }

      // Only update state if request wasn't cancelled
      if (!signal.aborted) {
        setAssignments(Array.isArray(data) ? data : []);
      }
    } catch (err: unknown) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      let message = 'Không thể tải danh sách bài tập';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: unknown } };
        const response = axiosError.response?.data;
        if (typeof response === 'string') {
          message = response;
        } else if (typeof response === 'object' && response !== null && 'message' in response) {
          message = (response as Record<string, unknown>).message as string;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [teamId, role]);

  // Clear state when teamId or role changes (before fetching new data)
  useEffect(() => {
    return () => {
      // Cleanup: abort in-flight request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments, refetchTrigger]);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  return { assignments, loading, error, refetch };
};
