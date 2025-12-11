import { Box } from '@mui/material';
import React from 'react';

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  mirrored?: boolean;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoRef,
  canvasRef,
  mirrored = true,
}) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: mirrored ? 'scaleX(-1)' : 'none',
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
          transform: mirrored ? 'scaleX(-1)' : 'none',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
};
