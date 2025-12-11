import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import useMediaPipe from '../../hooks/useMediaPipe';

const SkeletonOverlay = ({ videoRef, enabled = true }) => {
  const canvasRef = useRef(null);
  const { isReady, error } = useMediaPipe(
    videoRef?.current,
    canvasRef.current,
    enabled
  );

  useEffect(() => {
    // Sync canvas size with video
    const syncCanvasSize = () => {
      if (videoRef?.current && canvasRef.current) {
        const video = videoRef.current;
        canvasRef.current.width = video.videoWidth || 1280;
        canvasRef.current.height = video.videoHeight || 720;
      }
    };

    if (videoRef?.current) {
      videoRef.current.addEventListener('loadedmetadata', syncCanvasSize);
      syncCanvasSize();
    }

    return () => {
      if (videoRef?.current) {
        videoRef.current.removeEventListener('loadedmetadata', syncCanvasSize);
      }
    };
  }, [videoRef]);

  if (error) {
    console.error('MediaPipe error:', error);
  }

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 800,
        margin: '0 auto',
        backgroundColor: '#000',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      />

      {/* Canvas overlay for skeleton */}
      {enabled && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      )}
    </Box>
  );
};

export default SkeletonOverlay;
