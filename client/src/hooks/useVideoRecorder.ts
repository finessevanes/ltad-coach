import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVideoRecorderResult {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  videoBlob: Blob | null;
  videoUrl: string | null;
  clearRecording: () => void;
  error: string | null;
}

function getSupportedMimeType(): string | null {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  return types.find(type => MediaRecorder.isTypeSupported(type)) || null;
}

export function useVideoRecorder(stream: MediaStream | null): UseVideoRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    if (!stream) {
      setError('No camera stream available');
      return;
    }

    if (!window.MediaRecorder) {
      setError('MediaRecorder not supported in this browser');
      return;
    }

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      setError('No supported video codec found');
      return;
    }

    chunksRef.current = [];
    setError(null);

    try {
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        setIsRecording(false);
      };

      recorder.onerror = () => {
        setError('Recording failed');
        setIsRecording(false);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording');
    }
  }, [stream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const clearRecording = useCallback(() => {
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoBlob(null);
    setVideoUrl(null);
    setError(null);
    chunksRef.current = [];
  }, [videoUrl]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Cleanup MediaRecorder on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    videoBlob,
    videoUrl,
    clearRecording,
    error,
  };
}
