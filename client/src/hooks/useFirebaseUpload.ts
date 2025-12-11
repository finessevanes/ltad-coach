import { useState } from 'react';
import { uploadVideo, UploadProgress, UploadResult } from '../services/upload';

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
  const [cancelFn, setCancelFn] = useState<(() => void) | null>(null);

  const upload = async (file: Blob | File, athleteId: string): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    setProgress(null);

    const { promise, cancel } = uploadVideo(file, athleteId, (prog) => {
      setProgress(prog);
    });

    setCancelFn(() => cancel);

    try {
      const result = await promise;
      setUploading(false);
      return result;
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploading(false);
      throw err;
    }
  };

  const cancel = () => {
    if (cancelFn) {
      cancelFn();
      setUploading(false);
      setProgress(null);
    }
  };

  return {
    upload,
    progress,
    uploading,
    error,
    cancel,
  };
}
