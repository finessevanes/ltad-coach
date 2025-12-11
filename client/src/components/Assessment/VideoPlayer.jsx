import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const VideoPlayer = ({ videoBlob, controls = true }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && videoBlob) {
      const videoUrl = URL.createObjectURL(videoBlob);
      videoRef.current.src = videoUrl;

      return () => {
        URL.revokeObjectURL(videoUrl);
      };
    }
  }, [videoBlob]);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 800,
        margin: '0 auto',
        backgroundColor: '#000',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        controls={controls}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      />
    </Box>
  );
};

export default VideoPlayer;
