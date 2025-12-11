import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  state: 'running' | 'paused' | 'success' | 'error';
}

export interface UploadResult {
  url: string;
  path: string;
}

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-m4v',
  'video/webm',
  'video/hevc',
];

export const SUPPORTED_EXTENSIONS = ['.mp4', '.mov', '.avi', '.m4v', '.webm', '.hevc'];
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Upload video to Firebase Storage with progress tracking
 */
export function uploadVideo(
  file: Blob | File,
  athleteId: string,
  onProgress: (progress: UploadProgress) => void
): { promise: Promise<UploadResult>; cancel: () => void } {
  const timestamp = Date.now();
  const extension = file instanceof File ? file.name.split('.').pop() : 'webm';
  const path = `assessments/${athleteId}/${timestamp}.${extension}`;
  const storageRef = ref(storage, path);

  const uploadTask = uploadBytesResumable(storageRef, file);

  const promise = new Promise<UploadResult>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress({
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          percentage,
          state: snapshot.state as 'running' | 'paused',
        });
      },
      (error) => {
        onProgress({
          bytesTransferred: 0,
          totalBytes: 0,
          percentage: 0,
          state: 'error',
        });
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);

        onProgress({
          bytesTransferred: uploadTask.snapshot.totalBytes,
          totalBytes: uploadTask.snapshot.totalBytes,
          percentage: 100,
          state: 'success',
        });
        resolve({ url, path });
      }
    );
  });

  return { promise, cancel: () => uploadTask.cancel() };
}

/**
 * Validate if file is a supported video format
 */
export function isValidVideoFile(file: File): boolean {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return (
    SUPPORTED_VIDEO_TYPES.includes(file.type) ||
    SUPPORTED_EXTENSIONS.includes(extension)
  );
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
