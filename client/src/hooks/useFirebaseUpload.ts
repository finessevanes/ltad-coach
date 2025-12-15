import { useState, useRef, useEffect, useCallback } from 'react';
import { uploadVideo, UploadProgress, UploadResult } from '../services/upload';
import { UploadTask } from 'firebase/storage';

interface UseFirebaseUploadResult {
  upload: (file: Blob | File, athleteId: string) => Promise<UploadResult>;
  progress: UploadProgress | null;
  uploading: boolean;
  error: string | null;
  cancel: () => void;
}

export function useFirebaseUpload(): UseFirebaseUploadResult {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uploadTaskRef = useRef<UploadTask | null>(null);
  const isMountedRef = useRef(true);

  // Memoize upload function to prevent recreating on every render
  const upload = useCallback(async (file: Blob | File, athleteId: string): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    setProgress(null);

    const { promise, uploadTask } = uploadVideo(file, athleteId, (prog) => {
      // Only update progress if component is still mounted
      if (isMountedRef.current) {
        setProgress(prog);
      }
    });

    // Store task reference directly (not in closure)
    uploadTaskRef.current = uploadTask;

    try {
      const result = await promise;
      if (isMountedRef.current) {
        setUploading(false);
      }
      uploadTaskRef.current = null;
      return result;
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.message || 'Upload failed');
        setUploading(false);
      }
      uploadTaskRef.current = null;
      throw err;
    }
  }, []);

  // Memoize cancel function
  const cancel = useCallback(() => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
      uploadTaskRef.current = null;
      if (isMountedRef.current) {
        setUploading(false);
        setProgress(null);
      }
    }
  }, []);

  // Track mount status for preventing state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Don't cancel uploads on unmount - let them complete in background
      // This prevents cancellation during React StrictMode's test unmount/remount
      // Parent can call cancel() manually if needed
    };
  }, []);

  return {
    upload,
    progress,
    uploading,
    error,
    cancel,
  };
}
