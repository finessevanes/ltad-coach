import { useState, useRef, useEffect } from 'react';
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

  const upload = async (file: Blob | File, athleteId: string): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    setProgress(null);

    const { promise, uploadTask } = uploadVideo(file, athleteId, (prog) => {
      setProgress(prog);
    });

    // Store task reference directly (not in closure)
    uploadTaskRef.current = uploadTask;

    try {
      const result = await promise;
      setUploading(false);
      uploadTaskRef.current = null;
      return result;
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploading(false);
      throw err;
    }
  };

  const cancel = () => {
    if (uploadTaskRef.current) {
      uploadTaskRef.current.cancel();
      uploadTaskRef.current = null;
      setUploading(false);
      setProgress(null);
    }
  };

  // Cleanup on unmount: cancel any in-progress upload
  useEffect(() => {
    return () => {
      if (uploadTaskRef.current) {
        uploadTaskRef.current.cancel();
        uploadTaskRef.current = null;
      }
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
