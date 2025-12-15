import { useState, useCallback } from 'react';
import { useFirebaseUpload } from './useFirebaseUpload';

export interface LegTestData {
  blob: Blob;
  duration: number;
  result: any;
}

interface UploadResult {
  url: string;
  path: string;
}

type UploadPhase = 'idle' | 'uploading-left' | 'uploading-right' | 'submitting' | 'complete' | 'error';

export interface UseDualLegUploadProps {
  athleteId: string;
  leftLegData: LegTestData;
  rightLegData: LegTestData;
  onSubmitAssessment: (
    leftResult: UploadResult,
    rightResult: UploadResult
  ) => Promise<string>; // Returns assessment ID
}

export interface UseDualLegUploadResult {
  phase: UploadPhase;
  leftProgress: number;
  rightProgress: number;
  error: string | null;
  assessmentId: string | null;
  start: () => Promise<string | undefined>;
  retry: () => Promise<string | undefined>;
}

/**
 * Custom hook for managing dual-leg video uploads and assessment submission.
 * Orchestrates the upload workflow: upload left → upload right → submit to backend.
 *
 * Responsibilities:
 * - Manage upload phase state machine
 * - Track individual progress for each video
 * - Handle errors and cleanup
 * - Coordinate with submission callback
 */
export function useDualLegUpload(props: UseDualLegUploadProps): UseDualLegUploadResult {
  const { athleteId, leftLegData, rightLegData, onSubmitAssessment } = props;

  const { upload: uploadLeft } = useFirebaseUpload();
  const { upload: uploadRight } = useFirebaseUpload();

  // State
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [leftProgress, setLeftProgress] = useState(0);
  const [rightProgress, setRightProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  // Memoize the upload execution function to prevent recreating on every render
  const executeUpload = useCallback(async () => {
    console.log('[useDualLegUpload] Starting upload process for athlete:', athleteId);
    console.log('[useDualLegUpload] Left leg blob size:', leftLegData.blob.size, 'bytes');
    console.log('[useDualLegUpload] Right leg blob size:', rightLegData.blob.size, 'bytes');

    try {
      // Step 1: Upload left leg video
      console.log('[useDualLegUpload] Phase: uploading-left');
      setPhase('uploading-left');
      setLeftProgress(0);
      setError(null);

      const leftResult = await uploadLeft(leftLegData.blob, athleteId);
      console.log('[useDualLegUpload] Left video uploaded:', leftResult);
      setLeftProgress(100);

      // Step 2: Upload right leg video
      console.log('[useDualLegUpload] Phase: uploading-right');
      setPhase('uploading-right');
      setRightProgress(0);

      const rightResult = await uploadRight(rightLegData.blob, athleteId);
      console.log('[useDualLegUpload] Right video uploaded:', rightResult);
      setRightProgress(100);

      // Step 3: Submit to backend
      console.log('[useDualLegUpload] Phase: submitting');
      setPhase('submitting');

      const id = await onSubmitAssessment(leftResult, rightResult);
      console.log('[useDualLegUpload] Assessment submitted:', id);

      setAssessmentId(id);
      setPhase('complete');
      return id;
    } catch (err: any) {
      console.error('[useDualLegUpload] Upload process failed:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Upload failed';
      console.error('[useDualLegUpload] User-facing error:', errorMessage);
      setError(errorMessage);
      setPhase('error');
      throw err;
    }
  }, [athleteId, leftLegData, rightLegData, uploadLeft, uploadRight, onSubmitAssessment]);

  // Memoize start function
  const start = useCallback(async () => {
    // Reset state before starting
    setLeftProgress(0);
    setRightProgress(0);
    setError(null);
    setAssessmentId(null);
    return executeUpload();
  }, [executeUpload]);

  // Memoize retry function
  const retry = useCallback(async () => {
    // Reset state before retrying
    setLeftProgress(0);
    setRightProgress(0);
    setError(null);
    setAssessmentId(null);
    return executeUpload();
  }, [executeUpload]);

  return {
    phase,
    leftProgress,
    rightProgress,
    error,
    assessmentId,
    start,
    retry,
  };
}
