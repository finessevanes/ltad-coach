import { useState, useEffect, useRef, useCallback } from 'react';
import assessmentsService from '../services/assessments';
import { Assessment } from '../types/assessment';

interface UseAssessmentPollingOptions {
  assessmentId: string | null;
  enabled: boolean;
  onComplete?: (assessment: Assessment) => void;
  onFailed?: (assessment: Assessment) => void;
  onTimeout?: () => void;
  interval?: number; // milliseconds
  timeout?: number; // milliseconds
}

interface UseAssessmentPollingResult {
  assessment: Assessment | null;
  loading: boolean;
  error: string | null;
}

export function useAssessmentPolling({
  assessmentId,
  enabled,
  onComplete,
  onFailed,
  onTimeout,
  interval = 2000, // 2 seconds
  timeout = 45000, // 45 seconds
}: UseAssessmentPollingOptions): UseAssessmentPollingResult {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const poll = useCallback(async () => {
    if (!assessmentId) return;

    try {
      const result = await assessmentsService.getById(assessmentId);
      setAssessment(result);

      if (result.status === 'completed') {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        onComplete?.(result);
      } else if (result.status === 'failed') {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        onFailed?.(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assessment');
    }
  }, [assessmentId, onComplete, onFailed]);

  useEffect(() => {
    if (!enabled || !assessmentId) {
      return;
    }

    setLoading(true);
    setError(null);
    startTimeRef.current = Date.now();

    // Start polling
    poll(); // Initial poll
    intervalRef.current = setInterval(poll, interval);

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLoading(false);
      onTimeout?.();
    }, timeout);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, assessmentId, interval, timeout, poll, onTimeout]);

  return {
    assessment,
    loading,
    error,
  };
}
