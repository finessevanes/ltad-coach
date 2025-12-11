---
id: FE-010
depends_on: [FE-002]
blocks: [FE-011]
---

# FE-010: Video Upload Component & Backup Flow

## Title
Implement video upload to Firebase Storage and backup upload flow

## Scope

### In Scope
- Upload video blob to Firebase Storage
- Upload progress indicator
- Backup flow: file picker for pre-recorded videos
- Drag-and-drop upload area
- File type validation
- Processing state UI during analysis

### Out of Scope
- Server-side analysis logic (BE-006, BE-007)
- Results display (FE-011)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Storage | Firebase Storage | PRD specifies, direct upload from client |
| Progress | XHR/resumable upload | Shows upload percentage |
| File Types | mp4, mov, avi, m4v, webm, hevc | PRD supported formats including HEVC |

## Acceptance Criteria

- [ ] Live recording video blob uploads to Firebase Storage
- [ ] Upload progress bar shows percentage
- [ ] Backup upload page accessible at `/assess/:athleteId/upload`
- [ ] Drag-and-drop zone accepts video files
- [ ] File picker allows selecting video files
- [ ] Invalid file types show error message
- [ ] Processing state shows while waiting for analysis
- [ ] Cancel upload functionality
- [ ] Network error handling with retry option

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Assessment/
│       ├── Processing.tsx           # Upload + processing state
│       └── BackupUpload.tsx         # File upload page
├── components/
│   ├── UploadProgress.tsx           # Progress bar component
│   └── DropZone.tsx                 # Drag-and-drop component
├── services/
│   └── upload.ts                    # Firebase Storage upload
└── hooks/
    └── useUpload.ts                 # Upload state hook
```

## Implementation Details

### services/upload.ts
```typescript
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

  const cancel = () => {
    uploadTask.cancel();
  };

  return { promise, cancel };
}

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/x-m4v',
  'video/webm',
  'video/hevc',
];

export const SUPPORTED_EXTENSIONS = ['.mp4', '.mov', '.avi', '.m4v', '.webm', '.hevc'];

export function isValidVideoFile(file: File): boolean {
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  return (
    SUPPORTED_VIDEO_TYPES.includes(file.type) ||
    SUPPORTED_EXTENSIONS.includes(extension)
  );
}
```

### hooks/useUpload.ts
```typescript
import { useState, useCallback, useRef } from 'react';
import { uploadVideo, UploadProgress, UploadResult } from '../services/upload';

interface UseUploadResult {
  upload: (file: Blob | File, athleteId: string) => Promise<UploadResult>;
  progress: UploadProgress | null;
  isUploading: boolean;
  error: string | null;
  cancel: () => void;
  reset: () => void;
}

export function useUpload(): UseUploadResult {
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const upload = useCallback(
    async (file: Blob | File, athleteId: string): Promise<UploadResult> => {
      setIsUploading(true);
      setError(null);
      setProgress({ bytesTransferred: 0, totalBytes: 0, percentage: 0, state: 'running' });

      try {
        const { promise, cancel } = uploadVideo(file, athleteId, setProgress);
        cancelRef.current = cancel;
        const result = await promise;
        return result;
      } catch (err: any) {
        const message = err.code === 'storage/canceled'
          ? 'Upload cancelled'
          : 'Upload failed. Please try again.';
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
        cancelRef.current = null;
      }
    },
    []
  );

  const cancel = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(null);
    setError(null);
    setIsUploading(false);
  }, []);

  return {
    upload,
    progress,
    isUploading,
    error,
    cancel,
    reset,
  };
}
```

### pages/Assessment/Processing.tsx
```typescript
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Analytics as AnalyzeIcon,
} from '@mui/icons-material';
import { useUpload } from '../../hooks/useUpload';
import { api } from '../../services/api';

type ProcessingState = 'uploading' | 'analyzing' | 'complete' | 'error';

export default function Processing() {
  const { athleteId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { videoBlob, testType, legTested } = location.state || {};

  const [state, setState] = useState<ProcessingState>('uploading');
  const [errorMessage, setErrorMessage] = useState('');
  const { upload, progress, isUploading, error: uploadError, cancel } = useUpload();

  useEffect(() => {
    if (!videoBlob || !athleteId) {
      navigate(`/athletes/${athleteId}`);
      return;
    }

    startProcessing();
  }, []);

  const startProcessing = async () => {
    try {
      // Step 1: Upload video
      setState('uploading');
      const uploadResult = await upload(videoBlob, athleteId!);

      // Step 2: Trigger analysis
      setState('analyzing');
      const response = await api.post('/assessments/analyze', {
        athlete_id: athleteId,
        test_type: testType,
        leg_tested: legTested,
        video_url: uploadResult.url,
        video_path: uploadResult.path,
      });

      // Step 3: Navigate to results
      setState('complete');
      navigate(`/assessments/${response.data.id}`, { replace: true });

    } catch (err: any) {
      setState('error');
      setErrorMessage(
        uploadError || err.response?.data?.detail || 'Processing failed'
      );
    }
  };

  const handleRetry = () => {
    setErrorMessage('');
    startProcessing();
  };

  const handleCancel = () => {
    cancel();
    navigate(`/athletes/${athleteId}`);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        {state === 'uploading' && (
          <>
            <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Uploading Video
            </Typography>
            <Box sx={{ mt: 3, mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progress?.percentage || 0}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress?.percentage || 0)}% complete
            </Typography>
            <Button
              variant="text"
              color="inherit"
              onClick={handleCancel}
              sx={{ mt: 2 }}
            >
              Cancel
            </Button>
          </>
        )}

        {state === 'analyzing' && (
          <>
            <AnalyzeIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Analyzing Video
            </Typography>
            <CircularProgress sx={{ mt: 2 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              This may take up to 30 seconds...
            </Typography>
          </>
        )}

        {state === 'error' && (
          <>
            <Alert severity="error" sx={{ mb: 3 }}>
              {errorMessage}
            </Alert>
            <Box display="flex" gap={2} justifyContent="center">
              <Button variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="contained" onClick={handleRetry}>
                Retry
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}
```

### pages/Assessment/BackupUpload.tsx
```typescript
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { DropZone } from '../../components/DropZone';
import { isValidVideoFile, SUPPORTED_EXTENSIONS } from '../../services/upload';
import { LegTested } from '../../types/assessment';

export default function BackupUpload() {
  const { athleteId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [leg, setLeg] = useState<LegTested>('left');
  const [error, setError] = useState('');

  const handleFileDrop = (files: File[]) => {
    const videoFile = files[0];
    if (!videoFile) return;

    if (!isValidVideoFile(videoFile)) {
      setError(`Unsupported file type. Supported: ${SUPPORTED_EXTENSIONS.join(', ')}`);
      return;
    }

    setError('');
    setFile(videoFile);
  };

  const handleAnalyze = () => {
    if (!file) return;

    navigate(`/assess/${athleteId}/processing`, {
      state: {
        videoBlob: file,
        testType: 'one_leg_balance',
        legTested: leg,
      },
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Upload Video
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload a pre-recorded video for analysis.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Select Standing Leg
        </Typography>
        <ToggleButtonGroup
          value={leg}
          exclusive
          onChange={(_, value) => value && setLeg(value)}
          fullWidth
          sx={{ mb: 3 }}
        >
          <ToggleButton value="left">Left Leg</ToggleButton>
          <ToggleButton value="right">Right Leg</ToggleButton>
        </ToggleButtonGroup>

        <Typography variant="subtitle1" gutterBottom>
          Video File
        </Typography>
        <DropZone
          onDrop={handleFileDrop}
          accept={SUPPORTED_EXTENSIONS.join(',')}
          selectedFile={file}
          onClear={() => setFile(null)}
        />
      </Paper>

      <Box display="flex" gap={2}>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleAnalyze}
          disabled={!file}
          sx={{ flex: 1 }}
        >
          Upload & Analyze
        </Button>
      </Box>
    </Container>
  );
}
```

### components/DropZone.tsx
```typescript
import { useCallback, useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import {
  CloudUpload as UploadIcon,
  VideoFile as VideoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface DropZoneProps {
  onDrop: (files: File[]) => void;
  accept: string;
  selectedFile: File | null;
  onClear: () => void;
}

export function DropZone({ onDrop, accept, selectedFile, onClear }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      onDrop(files);
    },
    [onDrop]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      onDrop(files);
    },
    [onDrop]
  );

  if (selectedFile) {
    return (
      <Box
        sx={{
          border: '2px solid',
          borderColor: 'success.main',
          borderRadius: 2,
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <VideoIcon sx={{ fontSize: 40, color: 'success.main' }} />
        <Box flex={1}>
          <Typography fontWeight="medium">{selectedFile.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </Typography>
        </Box>
        <IconButton onClick={onClear}>
          <CloseIcon />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        border: '2px dashed',
        borderColor: isDragging ? 'primary.main' : 'grey.300',
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: isDragging ? 'action.hover' : 'transparent',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover',
        },
      }}
      component="label"
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
      <Typography variant="body1" gutterBottom>
        Drag and drop a video file here
      </Typography>
      <Typography variant="body2" color="text.secondary">
        or click to browse
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Supported: MP4, MOV, AVI, M4V, WebM, HEVC
      </Typography>
    </Box>
  );
}
```

## Error Handling & Fallbacks

### Error Scenarios

| Error Type | Detection | User Message | Recovery Action |
|------------|-----------|--------------|-----------------|
| File too large | Size > 100MB | "Video file exceeds 100MB limit. Please compress or trim the video." | Re-select file |
| Invalid file type | Extension check | "Unsupported file format. Please use MP4, MOV, AVI, M4V, WebM, or HEVC." | Re-select file |
| HEVC not playable | Video won't preview | "HEVC video detected. Preview may not work but upload will proceed." | Allow upload anyway |
| Upload network error | Firebase error | "Upload failed. Please check your connection and try again." | Retry button |
| Upload interrupted | Task cancelled/paused | "Upload was interrupted." | Resume or restart |
| Firebase Storage quota | Quota error | "Storage limit reached. Please contact support." | N/A |
| Analysis timeout | No response after 60s | "Analysis is taking longer than expected. Please wait..." | Continue polling |
| Analysis failed | Status = 'failed' | "Video analysis failed. Please try with a different video." | Reshoot/re-upload |

### File Validation

```typescript
// In services/upload.ts
const SUPPORTED_TYPES = [
  'video/mp4',
  'video/quicktime',  // .mov
  'video/x-msvideo',  // .avi
  'video/x-m4v',
  'video/webm',
  'video/hevc',
];

const SUPPORTED_EXTENSIONS = ['.mp4', '.mov', '.avi', '.m4v', '.webm', '.hevc'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  // Check size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds 100MB limit`,
    };
  }

  // Check extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported format (${ext}). Use MP4, MOV, AVI, M4V, WebM, or HEVC.`,
    };
  }

  return { valid: true };
}
```

### HEVC Browser Support Note

HEVC (H.265) videos from iPhones may not preview in all browsers but will still upload and process correctly on the server. Show warning but don't block:

```typescript
function isHEVC(file: File): boolean {
  return file.name.toLowerCase().endsWith('.hevc') ||
         file.type === 'video/hevc' ||
         // iPhone HEVC files often have .mov extension
         (file.name.toLowerCase().endsWith('.mov') && file.size > 10 * 1024 * 1024);
}
```

## Estimated Complexity
**M** (Medium) - 3-4 hours

## Testing Instructions

1. Complete a recording and click "Analyze"
2. Verify upload progress bar shows
3. Verify state transitions from uploading to analyzing
4. After analysis, verify redirect to results
5. Navigate to `/assess/:athleteId/upload`
6. Drag a video file into drop zone
7. Verify file appears selected
8. Clear selection and use file picker
9. Test with invalid file type - should show error
10. Click "Upload & Analyze" - should process

## UI Reference

### Processing State
```
┌─────────────────────────────────────────────┐
│                                             │
│              ☁️ Uploading Video             │
│                                             │
│     ████████████░░░░░░░░░░░░░░░  45%       │
│                                             │
│              [Cancel]                       │
│                                             │
└─────────────────────────────────────────────┘
```

### Backup Upload
```
┌─────────────────────────────────────────────┐
│ Upload Video                                │
│ Upload a pre-recorded video for analysis.   │
│                                             │
│ Select Standing Leg                         │
│ [Left Leg] [Right Leg]                      │
│                                             │
│ Video File                                  │
│ ┌─────────────────────────────────────────┐ │
│ │                                         │ │
│ │    ☁️  Drag and drop a video file here  │ │
│ │           or click to browse            │ │
│ │                                         │ │
│ │    Supported: MP4, MOV, AVI, M4V, WebM, HEVC │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Cancel]            [Upload & Analyze]      │
└─────────────────────────────────────────────┘
```

## Assessment Status Polling Strategy

When `POST /assessments/analyze` returns, the assessment enters `processing` status. The frontend must poll to detect completion.

### Polling Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Polling Interval | 2 seconds | Balance between responsiveness and server load |
| Timeout | 45 seconds | 30s analysis (NFR-2) + 10s AI (NFR-3) + 5s buffer |
| Max Attempts | 22 | 45s / 2s = 22.5 attempts |

### Implementation (hooks/usePolling.ts)

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { assessmentsApi } from '../services/assessments';
import { AssessmentDetail } from '../types/assessment';

interface UseAssessmentPollingOptions {
  intervalMs?: number;   // Default: 2000ms
  timeoutMs?: number;    // Default: 45000ms
  onComplete?: (assessment: AssessmentDetail) => void;
  onFailed?: (assessment: AssessmentDetail) => void;
  onTimeout?: () => void;
}

export function useAssessmentPolling(
  assessmentId: string | null,
  options: UseAssessmentPollingOptions = {}
) {
  const {
    intervalMs = 2000,
    timeoutMs = 45000,
    onComplete,
    onFailed,
    onTimeout,
  } = options;

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const poll = useCallback(async () => {
    if (!assessmentId) return;

    // Check timeout
    const elapsed = Date.now() - startTimeRef.current;
    if (elapsed >= timeoutMs) {
      stopPolling();
      setError('Analysis is taking longer than expected');
      onTimeout?.();
      return;
    }

    try {
      const data = await assessmentsApi.getById(assessmentId);
      setAssessment(data);

      if (data.status === 'completed') {
        stopPolling();
        onComplete?.(data);
      } else if (data.status === 'failed') {
        stopPolling();
        onFailed?.(data);
      }
      // Continue polling if still 'processing'
    } catch (err) {
      // Don't stop on network errors, retry
      console.warn('Polling error:', err);
    }
  }, [assessmentId, timeoutMs, stopPolling, onComplete, onFailed, onTimeout]);

  const startPolling = useCallback(() => {
    if (!assessmentId) return;

    startTimeRef.current = Date.now();
    setIsPolling(true);
    setError(null);

    // Initial fetch
    poll();

    // Start interval
    intervalRef.current = setInterval(poll, intervalMs);
  }, [assessmentId, intervalMs, poll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    assessment,
    isPolling,
    error,
    startPolling,
    stopPolling,
  };
}
```

### Processing.tsx Usage Update

```typescript
// In pages/Assessment/Processing.tsx, after triggering analysis:

const { assessment, isPolling, error: pollingError, startPolling } = useAssessmentPolling(
  assessmentId,
  {
    onComplete: (data) => {
      navigate(`/assessments/${data.id}`, { replace: true });
    },
    onFailed: (data) => {
      setErrorMessage(data.aiFeedback || 'Analysis failed');
      setState('error');
    },
    onTimeout: () => {
      setErrorMessage('Analysis is taking longer than expected. Please check back shortly.');
      setState('error');
    },
  }
);

// After upload succeeds and analyze API returns:
startPolling();
```

## Notes
- Firebase Storage requires authentication for uploads
- For MVP: Single upload (no chunking). Max file size is 100MB as defined in main PRD
- If upload fails for large files, user should reduce video quality or duration
- Video URL from Storage is passed to backend for analysis
- Firebase `uploadBytesResumable` provides progress tracking and cancellation out of the box
- Polling uses exponential backoff implicitly via fixed interval - simple for MVP
