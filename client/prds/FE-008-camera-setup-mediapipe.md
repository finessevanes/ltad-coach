---
id: FE-008
depends_on: [FE-002, FE-007]
blocks: [FE-009]
status: completed
---

# FE-008: Camera Setup with MediaPipe Preview

## Title
Implement camera selection and real-time MediaPipe pose overlay

## Scope

### In Scope
- Camera source selection (webcam, iPhone Continuity Camera)
- Camera permission handling
- Live video preview with MediaPipe skeleton overlay
- Athlete positioning guide overlay
- Frame rate monitoring
- Camera ready state detection

### Out of Scope
- Recording functionality (FE-009)
- Video upload (FE-010)
- Server-side analysis

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| MediaPipe | @mediapipe/tasks-vision>=0.10.9 | Latest official package, matches backend version |
| Canvas | Overlay on video | Skeleton drawn on separate canvas layer |
| Skeleton Color | Bright green (#00FF00) | High visibility on most backgrounds |

> **Version Alignment**: The frontend MediaPipe version MUST match the backend version (BE-007)
> to ensure consistent 33-landmark indices. See BE-007 for full pros/cons analysis.

## Acceptance Criteria

- [ ] Camera source dropdown shows available cameras
- [ ] iPhone Continuity Camera appears in list when available
- [ ] Camera permission prompt handled gracefully
- [ ] Permission denied shows helpful error message
- [ ] Live video displays in preview area
- [ ] MediaPipe skeleton overlay renders on live video
- [ ] Skeleton renders at minimum 15 FPS
- [ ] Positioning guide shows optimal athlete placement
- [ ] "Ready" indicator when pose detected and stable
- [ ] Loading state while MediaPipe model loads

## Files to Create/Modify

```
client/src/
├── pages/
│   └── Assessment/
│       ├── CameraSetup.tsx          # Camera selection + preview
│       └── MediaPipeProvider.tsx    # MediaPipe initialization
├── components/
│   ├── VideoPreview/
│   │   ├── index.tsx                # Video element + canvas overlay
│   │   ├── SkeletonOverlay.tsx      # Skeleton drawing logic
│   │   └── PositioningGuide.tsx     # Silhouette guide
│   └── CameraSelector.tsx           # Camera dropdown
├── hooks/
│   ├── useCamera.ts                 # Camera access hook
│   └── useMediaPipe.ts              # MediaPipe processing hook
└── utils/
    └── mediapipe.ts                 # MediaPipe helpers
```

## Implementation Details

### hooks/useCamera.ts
```typescript
import { useState, useEffect, useRef } from 'react';

interface CameraDevice {
  deviceId: string;
  label: string;
}

interface UseCameraResult {
  devices: CameraDevice[];
  selectedDevice: string | null;
  setSelectedDevice: (id: string) => void;
  stream: MediaStream | null;
  error: string | null;
  loading: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function useCamera(): UseCameraResult {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Enumerate devices on mount
  useEffect(() => {
    async function getDevices() {
      try {
        // Request permission first (needed to get device labels)
        await navigator.mediaDevices.getUserMedia({ video: true });

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices
          .filter((d) => d.kind === 'videoinput')
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
          }));

        setDevices(videoDevices);

        // Select first device by default
        if (videoDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access to continue.');
        } else {
          setError('Failed to access camera. Please check your device settings.');
        }
      } finally {
        setLoading(false);
      }
    }

    getDevices();
  }, []);

  // Start stream when device selected
  useEffect(() => {
    if (!selectedDevice) return;

    async function startStream() {
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDevice },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        });

        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        setError('Failed to start camera stream');
      }
    }

    startStream();

    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDevice]);

  return {
    devices,
    selectedDevice,
    setSelectedDevice,
    stream,
    error,
    loading,
    videoRef,
  };
}
```

### hooks/useMediaPipe.ts
```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

interface PoseResult {
  landmarks: any[];
  worldLandmarks: any[];
}

interface UseMediaPipeResult {
  loading: boolean;
  error: string | null;
  poseResult: PoseResult | null;
  fps: number;
  isPersonDetected: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export function useMediaPipe(
  videoRef: React.RefObject<HTMLVideoElement>,
  enabled: boolean = true
): UseMediaPipeResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poseResult, setPoseResult] = useState<PoseResult | null>(null);
  const [fps, setFps] = useState(0);
  const [isPersonDetected, setIsPersonDetected] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const fpsCountRef = useRef<number>(0);

  // Initialize MediaPipe
  useEffect(() => {
    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm'
        );

        landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        setLoading(false);
      } catch (err) {
        setError('Failed to load pose detection model');
        setLoading(false);
      }
    }

    init();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Detection loop
  const detectPose = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !canvas || !landmarker || !enabled) {
      animationRef.current = requestAnimationFrame(detectPose);
      return;
    }

    if (video.readyState < 2) {
      animationRef.current = requestAnimationFrame(detectPose);
      return;
    }

    const now = performance.now();

    // FPS calculation
    fpsCountRef.current++;
    if (now - lastTimeRef.current >= 1000) {
      setFps(fpsCountRef.current);
      fpsCountRef.current = 0;
      lastTimeRef.current = now;
    }

    // Detect pose
    const result = landmarker.detectForVideo(video, now);

    // Update canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (result.landmarks && result.landmarks.length > 0) {
        setIsPersonDetected(true);
        setPoseResult({
          landmarks: result.landmarks[0],
          worldLandmarks: result.worldLandmarks?.[0] || [],
        });

        // Draw skeleton
        const drawingUtils = new DrawingUtils(ctx);
        drawingUtils.drawLandmarks(result.landmarks[0], {
          radius: 3,
          color: '#00FF00',
        });
        drawingUtils.drawConnectors(
          result.landmarks[0],
          PoseLandmarker.POSE_CONNECTIONS,
          { color: '#00FF00', lineWidth: 2 }
        );
      } else {
        setIsPersonDetected(false);
        setPoseResult(null);
      }
    }

    animationRef.current = requestAnimationFrame(detectPose);
  }, [enabled, videoRef]);

  useEffect(() => {
    if (!loading && enabled) {
      animationRef.current = requestAnimationFrame(detectPose);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loading, enabled, detectPose]);

  return {
    loading,
    error,
    poseResult,
    fps,
    isPersonDetected,
    canvasRef,
  };
}
```

### pages/Assessment/CameraSetup.tsx
```typescript
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Videocam as CameraIcon,
  CheckCircle as ReadyIcon,
} from '@mui/icons-material';
import { useCamera } from '../../hooks/useCamera';
import { useMediaPipe } from '../../hooks/useMediaPipe';

export default function CameraSetup() {
  const { athleteId } = useParams();
  const navigate = useNavigate();
  const {
    devices,
    selectedDevice,
    setSelectedDevice,
    error: cameraError,
    loading: cameraLoading,
    videoRef,
  } = useCamera();

  const {
    loading: mpLoading,
    error: mpError,
    fps,
    isPersonDetected,
    canvasRef,
  } = useMediaPipe(videoRef);

  const error = cameraError || mpError;
  const loading = cameraLoading || mpLoading;

  const handleContinue = () => {
    navigate(`/assess/${athleteId}/record`, {
      state: { deviceId: selectedDevice },
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Camera Setup
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Position the athlete in frame. The skeleton overlay helps confirm
        proper positioning.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Camera selector */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Camera Source</InputLabel>
        <Select
          value={selectedDevice || ''}
          label="Camera Source"
          onChange={(e) => setSelectedDevice(e.target.value)}
          disabled={loading}
        >
          {devices.map((device) => (
            <MenuItem key={device.deviceId} value={device.deviceId}>
              {device.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Video preview with skeleton overlay */}
      <Paper
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          overflow: 'hidden',
          bgcolor: 'black',
          mb: 2,
        }}
      >
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.7)',
              zIndex: 10,
            }}
          >
            <Box textAlign="center">
              <CircularProgress sx={{ mb: 2 }} />
              <Typography color="white">
                {cameraLoading ? 'Accessing camera...' : 'Loading pose detection...'}
              </Typography>
            </Box>
          </Box>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // Mirror for natural feel
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: 'scaleX(-1)', // Match video mirror
            pointerEvents: 'none',
          }}
        />

        {/* Positioning guide silhouette */}
        {!isPersonDetected && !loading && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Box
              sx={{
                width: '30%',
                height: '80%',
                border: '2px dashed rgba(255,255,255,0.5)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography color="white" sx={{ opacity: 0.7 }}>
                Position athlete here
              </Typography>
            </Box>
          </Box>
        )}

        {/* Status indicators */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 1,
          }}
        >
          <Chip
            size="small"
            label={`${fps} FPS`}
            color={fps >= 15 ? 'success' : 'warning'}
          />
          <Chip
            size="small"
            icon={isPersonDetected ? <ReadyIcon /> : <CameraIcon />}
            label={isPersonDetected ? 'Person Detected' : 'No Person'}
            color={isPersonDetected ? 'success' : 'default'}
          />
        </Box>
      </Paper>

      {/* Instructions */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Positioning tips:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
            <li>Full body should be visible in frame</li>
            <li>Ensure good lighting on the athlete</li>
            <li>Avoid busy backgrounds if possible</li>
            <li>Camera should be at athlete's chest height</li>
          </ul>
        </Typography>
      </Alert>

      {/* Action buttons */}
      <Box display="flex" gap={2}>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!isPersonDetected || loading}
          sx={{ flex: 1 }}
        >
          Continue to Recording
        </Button>
      </Box>
    </Container>
  );
}
```

## Dependencies to Add

```json
{
  "dependencies": {
    "@mediapipe/tasks-vision": "0.10.9"
  }
}
```

## Error Handling & Fallbacks

### Error Scenarios

| Error Type | Detection | User Message | Recovery Action |
|------------|-----------|--------------|-----------------|
| Camera permission denied | `NotAllowedError` | "Camera permission denied. Please allow camera access to continue." | Show settings link |
| No cameras available | Empty device list | "No cameras found. Please connect a camera and refresh." | Retry button |
| Camera in use | `NotReadableError` | "Camera is in use by another application. Please close other apps using the camera." | Retry button |
| WebGL unavailable | MediaPipe init fails | "Your browser doesn't support WebGL, which is required for pose detection." | Link to backup upload |
| Model load failure | Network/CORS error | "Failed to load pose detection. Check your internet connection." | Retry button |
| Low frame rate | FPS < 10 for 5s | "Performance is too slow for live analysis." | Suggest backup upload |
| HTTPS required | `SecurityError` | "Camera access requires a secure connection (HTTPS)." | N/A |

### WebGL/GPU Fallback

**Note for Implementation**: If MediaPipe fails to initialize due to WebGL unavailability:
1. Show clear error message explaining the limitation
2. Offer direct link to backup upload flow: `/assess/:athleteId/upload`
3. Do NOT attempt software-based pose estimation (too slow)

```typescript
// In useMediaPipe.ts - detect WebGL support
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl') ||
      canvas.getContext('webgl2') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}
```

### Browser Compatibility Note

Add to acceptance criteria:
- [ ] Displays "Use backup upload" option when WebGL unavailable
- [ ] Gracefully handles browsers without getUserMedia support

## Estimated Complexity
**M** (Medium) - 4 hours

## Testing Instructions

1. Navigate to assessment camera setup
2. Verify camera permission prompt appears
3. Select different cameras if available
4. Verify video preview displays
5. Step into frame - skeleton should appear
6. Verify FPS counter shows ≥15 FPS
7. Verify "Person Detected" indicator updates
8. Step out of frame - positioning guide should show
9. Verify "Continue" button enables when person detected

## UI Reference

```
┌──────────────────────────────────────────────────────────┐
│ Camera Setup                                             │
│ Position the athlete in frame.                           │
├──────────────────────────────────────────────────────────┤
│ Camera Source                                            │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ FaceTime HD Camera (Built-in)                    ▼   │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                    [30 FPS] [Person Detected ✓]      │ │
│ │                                                      │ │
│ │            ┌───────┐                                 │ │
│ │            │  👤   │  ← Green skeleton overlay      │ │
│ │            │  ┼┼   │                                 │ │
│ │            │ /  \  │                                 │ │
│ │            └───────┘                                 │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ℹ️ Positioning tips:                                     │
│ • Full body should be visible in frame                   │
│ • Ensure good lighting on the athlete                    │
│                                                          │
│ [Back]                    [Continue to Recording]        │
└──────────────────────────────────────────────────────────┘
```

## Notes
- MediaPipe model is loaded from CDN for simplicity
- Video is mirrored for natural selfie-style preview
- Consider adding camera resolution selector in future
- iPhone Continuity Camera should appear automatically on macOS
