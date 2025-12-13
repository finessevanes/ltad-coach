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

export function useCamera(initialDeviceId?: string | null): UseCameraResult {
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(initialDeviceId || null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate devices on mount
  useEffect(() => {
    async function getDevices() {
      try {
        // Get permission and enumerate devices
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });

        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices
          .filter((d) => d.kind === 'videoinput')
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
          }));

        setDevices(videoDevices);

        // Select initial device or first device by default
        if (videoDevices.length > 0 && !selectedDevice) {
          const defaultDevice = initialDeviceId || videoDevices[0].deviceId;
          setSelectedDevice(defaultDevice);
        }

        // Stop temp stream - the device selection effect will create the proper one
        tempStream.getTracks().forEach((track) => track.stop());
        setLoading(false);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access to continue.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and refresh.');
        } else {
          setError('Failed to access camera. Please check your device settings.');
        }
        setLoading(false);
      }
    }

    getDevices();
  }, [initialDeviceId]);

  // Start stream when device selected
  useEffect(() => {
    if (!selectedDevice) return;

    // Capture the device ID to help TypeScript narrow the type
    const deviceId = selectedDevice;

    async function startStream() {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        });

        streamRef.current = newStream;
        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        setError('Failed to start camera stream');
      }
    }

    startStream();

    // Cleanup on device change
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [selectedDevice]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

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
