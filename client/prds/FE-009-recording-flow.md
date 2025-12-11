---
id: FE-009
depends_on: [FE-008]
blocks: [FE-011]
---

# FE-009: Recording Flow with Countdown and Timer

## Title
Implement test recording with countdown, timer, and preview/reshoot

## Scope

### In Scope
- Test type and leg selection
- 3-2-1 countdown before recording starts
- 30-second test timer display
- Recording using MediaRecorder API
- Preview recorded video with skeleton
- Reshoot or Analyze options
- Manual early stop capability

### Out of Scope
- Video upload to server (FE-010 integration)
- Server-side analysis (BE-006, BE-007)
- Results display (FE-011)

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Recording Format | webm/vp8 | Best browser support |
| Countdown | Visual overlay | Clear, non-intrusive |
| Timer | Large central display | Easy to see from distance |
| Preview | HTML5 video element | Native playback controls |

## Acceptance Criteria

- [ ] Test setup shows leg selection (left/right) before recording
- [ ] Countdown (3-2-1) displays after clicking Start
- [ ] Recording auto-starts after countdown
- [ ] 30-second countdown timer displays during recording
- [ ] Skeleton overlay visible during recording
- [ ] Manual "Stop" button ends recording early
- [ ] Recording auto-stops at 0 seconds
- [ ] Preview screen shows recorded video
- [ ] Preview can be replayed
- [ ] "Reshoot" returns to recording screen
- [ ] "Analyze" proceeds to upload/analysis
- [ ] Video blob is stored for upload

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Assessment/
│       ├── TestSetup.tsx            # Leg selection
│       ├── Recording.tsx            # Main recording page
│       ├── Countdown.tsx            # 3-2-1 countdown overlay
│       ├── RecordingTimer.tsx       # 30-second timer
│       └── RecordingPreview.tsx     # Preview with reshoot/analyze
├── hooks/
│   └── useRecorder.ts               # MediaRecorder hook
└── types/
    └── assessment.ts                # Assessment types
```

## Implementation Details

### types/assessment.ts
```typescript
export type TestType = 'one_leg_balance';
export type LegTested = 'left' | 'right';

export interface AssessmentSetup {
  athleteId: string;
  testType: TestType;
  legTested: LegTested;
}

export interface RecordingState {
  status: 'idle' | 'countdown' | 'recording' | 'preview';
  videoBlob: Blob | null;
  videoUrl: string | null;
  duration: number;
}
```

### hooks/useRecorder.ts
```typescript
import { useState, useRef, useCallback } from 'react';

interface UseRecorderResult {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  videoBlob: Blob | null;
  videoUrl: string | null;
  clearRecording: () => void;
}

export function useRecorder(stream: MediaStream | null): UseRecorderResult {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(() => {
    if (!stream) return;

    chunksRef.current = [];

    const options = { mimeType: 'video/webm;codecs=vp8' };
    const recorder = new MediaRecorder(stream, options);

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

    mediaRecorderRef.current = recorder;
    recorder.start(100); // Collect data every 100ms
    setIsRecording(true);
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
    chunksRef.current = [];
  }, [videoUrl]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    videoBlob,
    videoUrl,
    clearRecording,
  };
}
```

### pages/Assessment/TestSetup.tsx
```typescript
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from '@mui/material';
import { LegTested } from '../../types/assessment';

export default function TestSetup() {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const [leg, setLeg] = useState<LegTested>('left');

  const handleContinue = () => {
    navigate(`/assess/${athleteId}/camera`, {
      state: { testType: 'one_leg_balance', legTested: leg },
    });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          One-Leg Balance Test
        </Typography>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Test Protocol:</strong>
            <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
              <li>Athlete stands on one leg for up to 30 seconds</li>
              <li>Hands must remain on hips</li>
              <li>Eyes open, focused on point ahead</li>
              <li>Test ends if foot touches down or hands leave hips</li>
            </ul>
          </Typography>
        </Alert>

        <Typography variant="subtitle1" gutterBottom>
          Select Standing Leg
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Which leg will the athlete stand on?
        </Typography>

        <ToggleButtonGroup
          value={leg}
          exclusive
          onChange={(_, value) => value && setLeg(value)}
          fullWidth
          sx={{ mb: 4 }}
        >
          <ToggleButton value="left">
            Left Leg
          </ToggleButton>
          <ToggleButton value="right">
            Right Leg
          </ToggleButton>
        </ToggleButtonGroup>

        <Box display="flex" gap={2}>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleContinue} sx={{ flex: 1 }}>
            Continue to Camera Setup
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
```

### pages/Assessment/Recording.tsx
```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Typography,
  Paper,
} from '@mui/material';
import { Stop as StopIcon } from '@mui/icons-material';
import { useCamera } from '../../hooks/useCamera';
import { useMediaPipe } from '../../hooks/useMediaPipe';
import { useRecorder } from '../../hooks/useRecorder';
import { Countdown } from './Countdown';
import { RecordingTimer } from './RecordingTimer';
import { RecordingPreview } from './RecordingPreview';

type RecordingStatus = 'idle' | 'countdown' | 'recording' | 'preview';

const TEST_DURATION = 30; // seconds

export default function Recording() {
  const { athleteId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { deviceId, testType, legTested } = location.state || {};

  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [timeRemaining, setTimeRemaining] = useState(TEST_DURATION);

  const { stream, videoRef } = useCamera();
  const { canvasRef, isPersonDetected } = useMediaPipe(videoRef, status !== 'preview');
  const { isRecording, startRecording, stopRecording, videoBlob, videoUrl, clearRecording } = useRecorder(stream);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle countdown completion
  const handleCountdownComplete = useCallback(() => {
    setStatus('recording');
    startRecording();

    // Start 30-second timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          stopRecording();
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startRecording, stopRecording]);

  // Handle manual stop
  const handleStop = useCallback(() => {
    stopRecording();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [stopRecording]);

  // Transition to preview when recording stops
  useEffect(() => {
    if (!isRecording && videoBlob) {
      setStatus('preview');
    }
  }, [isRecording, videoBlob]);

  // Handle reshoot
  const handleReshoot = () => {
    clearRecording();
    setTimeRemaining(TEST_DURATION);
    setStatus('idle');
  };

  // Handle analyze
  const handleAnalyze = () => {
    navigate(`/assess/${athleteId}/processing`, {
      state: {
        videoBlob,
        testType,
        legTested,
      },
    });
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (status === 'preview' && videoUrl) {
    return (
      <RecordingPreview
        videoUrl={videoUrl}
        duration={TEST_DURATION - timeRemaining}
        onReshoot={handleReshoot}
        onAnalyze={handleAnalyze}
      />
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          overflow: 'hidden',
          bgcolor: 'black',
        }}
      >
        {/* Live video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
          }}
        />

        {/* Skeleton overlay */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'scaleX(-1)',
            pointerEvents: 'none',
          }}
        />

        {/* Countdown overlay */}
        {status === 'countdown' && (
          <Countdown onComplete={handleCountdownComplete} />
        )}

        {/* Recording timer */}
        {status === 'recording' && (
          <RecordingTimer timeRemaining={timeRemaining} />
        )}

        {/* Recording indicator */}
        {status === 'recording' && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: 'error.main',
                animation: 'pulse 1s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                },
              }}
            />
            <Typography color="white" fontWeight="bold">
              REC
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Controls */}
      <Box display="flex" justifyContent="center" gap={2} mt={3}>
        {status === 'idle' && (
          <>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Back
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              disabled={!isPersonDetected}
              onClick={() => setStatus('countdown')}
            >
              Start Test
            </Button>
          </>
        )}

        {status === 'recording' && (
          <Button
            variant="contained"
            color="error"
            size="large"
            startIcon={<StopIcon />}
            onClick={handleStop}
          >
            Stop Early
          </Button>
        )}
      </Box>

      {/* Instructions */}
      {status === 'idle' && (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mt: 2 }}
        >
          Ensure athlete is in frame with skeleton visible, then click Start Test
        </Typography>
      )}
    </Container>
  );
}
```

### pages/Assessment/Countdown.tsx
```typescript
import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

interface CountdownProps {
  onComplete: () => void;
}

export function Countdown({ onComplete }: CountdownProps) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount(count - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  if (count === 0) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.5)',
      }}
    >
      <Typography
        variant="h1"
        sx={{
          color: 'white',
          fontSize: '200px',
          fontWeight: 'bold',
          textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          animation: 'scaleIn 0.3s ease-out',
          '@keyframes scaleIn': {
            '0%': { transform: 'scale(1.5)', opacity: 0 },
            '100%': { transform: 'scale(1)', opacity: 1 },
          },
        }}
      >
        {count}
      </Typography>
    </Box>
  );
}
```

### pages/Assessment/RecordingTimer.tsx
```typescript
import { Box, Typography } from '@mui/material';

interface RecordingTimerProps {
  timeRemaining: number;
}

export function RecordingTimer({ timeRemaining }: RecordingTimerProps) {
  const isLow = timeRemaining <= 5;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <Typography
        sx={{
          fontSize: '120px',
          fontWeight: 'bold',
          color: isLow ? '#ff4444' : 'white',
          textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {timeRemaining}
      </Typography>
    </Box>
  );
}
```

### pages/Assessment/RecordingPreview.tsx
```typescript
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
} from '@mui/material';
import {
  Replay as ReplayIcon,
  Analytics as AnalyzeIcon,
} from '@mui/icons-material';

interface RecordingPreviewProps {
  videoUrl: string;
  duration: number;
  onReshoot: () => void;
  onAnalyze: () => void;
}

export function RecordingPreview({
  videoUrl,
  duration,
  onReshoot,
  onAnalyze,
}: RecordingPreviewProps) {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Recording Complete
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review the recording below. Duration: {duration} seconds
      </Typography>

      <Paper
        sx={{
          width: '100%',
          aspectRatio: '16/9',
          overflow: 'hidden',
          bgcolor: 'black',
          mb: 3,
        }}
      >
        <video
          src={videoUrl}
          controls
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </Paper>

      <Box display="flex" gap={2}>
        <Button
          variant="outlined"
          startIcon={<ReplayIcon />}
          onClick={onReshoot}
          sx={{ flex: 1 }}
        >
          Reshoot
        </Button>
        <Button
          variant="contained"
          startIcon={<AnalyzeIcon />}
          onClick={onAnalyze}
          sx={{ flex: 1 }}
        >
          Analyze
        </Button>
      </Box>
    </Container>
  );
}
```

## Error Handling & Fallbacks

### Error Scenarios

| Error Type | Detection | User Message | Recovery Action |
|------------|-----------|--------------|-----------------|
| MediaRecorder not supported | `!window.MediaRecorder` | "Your browser doesn't support video recording." | Link to backup upload |
| Recording start fails | `mediaRecorder.start()` throws | "Failed to start recording. Please try again or use backup upload." | Retry + backup link |
| Recording stopped unexpectedly | `onerror` event | "Recording was interrupted. Please try again." | Reshoot button |
| No video data captured | Empty blob | "No video was captured. Please check camera and try again." | Reshoot button |
| Storage quota exceeded | Blob creation fails | "Not enough storage space for recording." | Suggest clearing browser data |
| Camera stream lost | `onended` event during recording | "Camera connection lost during recording." | Reshoot button |

### MediaRecorder Compatibility Check

```typescript
// In useRecording.ts - check codec support
function getSupportedMimeType(): string | null {
  const types = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  return types.find(type => MediaRecorder.isTypeSupported(type)) || null;
}

function checkRecordingSupport(): { supported: boolean; message?: string } {
  if (!window.MediaRecorder) {
    return { supported: false, message: 'MediaRecorder API not available' };
  }
  if (!getSupportedMimeType()) {
    return { supported: false, message: 'No supported video codecs found' };
  }
  return { supported: true };
}
```

### Browser Compatibility Note

Add to acceptance criteria:
- [ ] Displays "Use backup upload" when MediaRecorder unavailable
- [ ] Gracefully handles recording failures with retry option
- [ ] Shows clear error when camera stream is lost mid-recording

## Estimated Complexity
**M** (Medium) - 4 hours

## Testing Instructions

1. Navigate to assessment flow with active-consent athlete
2. Select leg (left/right) and continue
3. Click "Start Test" when person detected
4. Verify 3-2-1 countdown displays
5. Verify recording starts after countdown
6. Verify 30-second timer counts down
7. Verify timer turns red at 5 seconds
8. Let timer reach 0 - verify auto-stop
9. Verify preview shows recorded video
10. Click "Reshoot" - should return to recording
11. Record again and click "Analyze"
12. Test "Stop Early" button during recording

## UI Reference

### Recording State
```
┌─────────────────────────────────────────────────────┐
│ ● REC                                               │
│                                                     │
│                                                     │
│                        15                           │
│                                                     │
│              [Skeleton overlay on athlete]          │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
                  [Stop Early]
```

### Preview State
```
┌─────────────────────────────────────────────────────┐
│ Recording Complete                                  │
│ Review the recording below. Duration: 18 seconds   │
├─────────────────────────────────────────────────────┤
│                                                     │
│            [Video player with controls]             │
│                 ▶ ═══════════════ 0:18             │
│                                                     │
└─────────────────────────────────────────────────────┘
        [Reshoot]              [Analyze]
```

## Notes
- MediaRecorder outputs webm format for best browser support
- Video is not mirrored in preview (shows actual recorded perspective)
- Consider adding audio cues for countdown (post-MVP)
