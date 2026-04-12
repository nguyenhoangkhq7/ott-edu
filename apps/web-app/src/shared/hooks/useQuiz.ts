import { useState, useCallback, useEffect } from 'react';
import { quizService } from '@/services/api/quiz.service';
import {
  Assignment,
  Submission,
  StudentAnswer,
  SubmissionStatus,
} from '@/shared/types/quiz';

export const useAssignments = (teamId: number | null) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await quizService.getAssignments(teamId);
      setAssignments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (teamId) {
      fetchAssignments();
    }
  }, [teamId, fetchAssignments]);

  return { assignments, loading, error, refetch: fetchAssignments };
};

export const useAssignmentDetail = (assignmentId: number | null) => {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignment = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await quizService.getAssignmentDetail(assignmentId);
      setAssignment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignment');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignment();
    }
  }, [fetchAssignment, assignmentId]);

  return { assignment, loading, error, refetch: fetchAssignment };
};

export const useSubmission = () => {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAssignment = useCallback(async (assignmentId: number, accountId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await quizService.startAssignment(assignmentId, accountId);
      setSubmission(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start assignment';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSubmission = useCallback(async (submissionId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await quizService.getSubmission(submissionId);
      setSubmission(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch submission');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAnswer = useCallback(async (submissionId: number, answer: StudentAnswer) => {
    try {
      await quizService.submitAnswer(submissionId, answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save answer');
      throw err;
    }
  }, []);

  const submitAssignment = useCallback(async (submissionId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await quizService.submitAssignment(submissionId);
      setSubmission(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit assignment';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    submission,
    loading,
    error,
    startAssignment,
    getSubmission,
    submitAnswer,
    submitAssignment,
  };
};

export const useTimer = (timeLimit: number) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeRemaining]);

  const start = () => setIsActive(true);
  const pause = () => setIsActive(false);
  const reset = () => {
    setTimeRemaining(timeLimit * 60);
    setIsActive(false);
  };

  const formatTime = () => {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    timeRemaining,
    formatTime,
    start,
    pause,
    reset,
    isTimeUp: timeRemaining === 0,
  };
};
